import { useEffect, useState } from 'react'

type CacheEntry = {
  cacheName: string
  urls: string[]
}

export default function CacheStatusPage() {
  const [supported, setSupported] = useState(true)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        if (!('caches' in window)) {
          if (!cancelled) setSupported(false)
          return
        }

        const names = await caches.keys()
        const next: CacheEntry[] = []
        for (const cacheName of names) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          next.push({
            cacheName,
            urls: requests.map((r) => r.url),
          })
        }

        if (!cancelled) setEntries(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to read caches')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card">
      <div className="listHeader">
        <h2>Cache Status</h2>
        <span className="muted">{loading ? 'Loading…' : `${entries.length} caches`}</span>
      </div>

      {!supported ? <div className="alert">Cache Storage API not available in this browser/context.</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="muted" style={{ marginBottom: 12 }}>
        This page reads the browser Cache Storage API so you can verify which requests are cached by the service worker.
      </div>

      <div className="cacheGrid">
        {entries.map((c) => (
          <div key={c.cacheName} className="cacheCard">
            <div className="cacheTitle">
              <strong>{c.cacheName}</strong>
              <span className="muted">{c.urls.length} items</span>
            </div>
            <ul className="cacheList">
              {c.urls.slice(0, 60).map((u) => (
                <li key={u} className="cacheItem">
                  {u}
                </li>
              ))}
              {c.urls.length > 60 ? <li className="muted">…and {c.urls.length - 60} more</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

