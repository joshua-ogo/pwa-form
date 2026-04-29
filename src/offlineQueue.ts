export type QueuedSubmission = {
  name: string
  email: string
  message: string
  queuedAt: number
}

export type CachedSubmission = {
  id: string
  name: string
  email: string
  message: string
  createdAtMs?: number
}

const QUEUE_KEY = 'intake_offline_queue_v1'
const CACHE_KEY = 'intake_submissions_cache_v1'
const CACHE_META_KEY = 'intake_submissions_cache_meta_v1'

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function readOfflineQueue(): QueuedSubmission[] {
  const parsed = safeParseJson<QueuedSubmission[]>(localStorage.getItem(QUEUE_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter((x) => x && typeof x.name === 'string' && typeof x.email === 'string')
}

export function writeOfflineQueue(queue: QueuedSubmission[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueOfflineSubmission(input: Omit<QueuedSubmission, 'queuedAt'>): QueuedSubmission {
  const item: QueuedSubmission = { ...input, queuedAt: Date.now() }
  const queue = readOfflineQueue()
  queue.push(item)
  writeOfflineQueue(queue)
  return item
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}

export function readCachedSubmissions(): CachedSubmission[] {
  const parsed = safeParseJson<CachedSubmission[]>(localStorage.getItem(CACHE_KEY))
  if (!Array.isArray(parsed)) return []
  return parsed.filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string')
}

export function writeCachedSubmissions(items: CachedSubmission[]): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(items))
  localStorage.setItem(CACHE_META_KEY, JSON.stringify({ cachedAt: Date.now(), count: items.length }))
}

export function readCachedSubmissionsMeta(): { cachedAt: number; count: number } | null {
  const parsed = safeParseJson<{ cachedAt: number; count: number }>(localStorage.getItem(CACHE_META_KEY))
  if (!parsed) return null
  if (typeof parsed.cachedAt !== 'number' || typeof parsed.count !== 'number') return null
  return parsed
}

