import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addSubmission,
  getPersistenceEnabled,
  getSubmissions,
  syncOfflineQueue,
  type Submission,
  type SubmissionInput,
} from '../firebase'
import {
  clearOfflineQueue,
  enqueueOfflineSubmission,
  readCachedSubmissions,
  readCachedSubmissionsMeta,
  readOfflineQueue,
  writeCachedSubmissions,
} from '../offlineQueue'

type UiSubmission =
  | (Submission & { status?: 'synced' })
  | ({ id: string } & SubmissionInput & { status: 'pending'; queuedAt: number })

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function IntakePage() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedMeta, setCachedMeta] = useState(() => readCachedSubmissionsMeta())
  const [persistence, setPersistence] = useState<boolean | null>(() => getPersistenceEnabled())

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const [submissions, setSubmissions] = useState<UiSubmission[]>([])
  const [pendingFromQueue, setPendingFromQueue] = useState<
    Array<{ id: string } & SubmissionInput & { status: 'pending'; queuedAt: number }>
  >(() => {
    return readOfflineQueue()
      .slice()
      .reverse()
      .map((q) => ({
        id: `queued-${q.queuedAt}`,
        name: q.name,
        email: q.email,
        message: q.message,
        status: 'pending' as const,
        queuedAt: q.queuedAt,
      }))
  })

  const loadPendingFromQueue = useCallback(() => {
    const next = readOfflineQueue()
      .slice()
      .reverse()
      .map((q) => ({
        id: `queued-${q.queuedAt}`,
        name: q.name,
        email: q.email,
        message: q.message,
        status: 'pending' as const,
        queuedAt: q.queuedAt,
      }))
    setPendingFromQueue(next)
  }, [])

  const refreshFromFirestore = useCallback(async (): Promise<void> => {
    const items = await getSubmissions()
    setSubmissions(items.map((s) => ({ ...s, status: 'synced' as const })))
    writeCachedSubmissions(
      items.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        message: s.message,
        createdAtMs: s.createdAtMs,
      })),
    )
    setCachedMeta(readCachedSubmissionsMeta())
  }, [])

  const trySyncQueue = useCallback(async (): Promise<void> => {
    const queue = readOfflineQueue()
    if (queue.length === 0) return

    setSyncing(true)
    try {
      await syncOfflineQueue(queue.map((q) => ({ name: q.name, email: q.email, message: q.message })))
      clearOfflineQueue()
      loadPendingFromQueue()
    } finally {
      setSyncing(false)
    }
  }, [loadPendingFromQueue])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    // `enableIndexedDbPersistence` resolves asynchronously; poll once shortly after mount.
    const t = window.setTimeout(() => setPersistence(getPersistenceEnabled()), 250)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await refreshFromFirestore()
      } catch {
        const cached = readCachedSubmissions()
        if (!cancelled) {
          setSubmissions(
            cached.map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              message: c.message,
              createdAtMs: c.createdAtMs,
              status: 'synced' as const,
            })),
          )
          setCachedMeta(readCachedSubmissionsMeta())
          setError('Offline: showing cached submissions (if any).')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshFromFirestore])

  useEffect(() => {
    if (!isOnline) return
    ;(async () => {
      try {
        await trySyncQueue()
        await refreshFromFirestore()
      } catch {
        // If sync fails, keep queue for retry.
      }
    })()
  }, [isOnline, refreshFromFirestore, trySyncQueue])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setError('Please fill out Name, Email, and Message.')
      return
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    const input: SubmissionInput = { name: trimmedName, email: trimmedEmail, message: trimmedMessage }

    setName('')
    setEmail('')
    setMessage('')

    try {
      if (!navigator.onLine) throw new Error('offline')
      await addSubmission(input)
      await refreshFromFirestore()
    } catch {
      enqueueOfflineSubmission(input)
      loadPendingFromQueue()
      setError('Saved offline. Will sync when back online.')
    }
  }

  const combined = useMemo(() => {
    const syncedOnly = submissions.filter((s) => s.status !== 'pending')
    return [...pendingFromQueue, ...syncedOnly]
  }, [pendingFromQueue, submissions])

  return (
    <>
      <header className="header">
        <div>
          <h1>Intake Form</h1>
          <p className="muted">
            Submissions are stored in Firestore. Offline submissions queue locally and sync later.
            {cachedMeta ? (
              <>
                {' '}
                Cached: {cachedMeta.count} items @ {new Date(cachedMeta.cachedAt).toLocaleString()}.
              </>
            ) : null}
            {persistence === false ? (
              <>
                {' '}
                Persistence: disabled (often due to multiple tabs).
              </>
            ) : persistence === true ? (
              <>
                {' '}
                Persistence: enabled.
              </>
            ) : null}
          </p>
        </div>
        <div className={`badge ${isOnline ? 'ok' : 'warn'}`} role="status" aria-live="polite">
          {isOnline ? 'Online' : 'Offline'}
          {syncing ? ' (syncing…) ' : ''}
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>New submission</h2>

          {error ? (
            <div className="alert" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="form">
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
              />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
            </label>

            <button type="submit" className="button">
              Submit
            </button>
          </form>
        </section>

        <section className="card">
          <div className="listHeader">
            <h2>Submissions</h2>
            <span className="muted">{loading ? 'Loading…' : `${combined.length} total`}</span>
          </div>

          <ul className="list">
            {combined.map((s) => (
              <li key={s.id} className={`item ${s.status === 'pending' ? 'pending' : ''}`}>
                <div className="itemTop">
                  <strong>{s.name || '(no name)'}</strong>
                  {s.status === 'pending' ? <span className="pill">offline</span> : null}
                </div>
                <div className="muted">{s.email}</div>
                <div className="message">{s.message}</div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}

