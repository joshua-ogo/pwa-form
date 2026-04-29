/* global self, caches, fetch */
/**
 * Fully manual Service Worker (no Workbox / no helper libs).
 *
 * Caching design:
 * - Versioned caches to enable safe upgrades.
 * - Separate caches for:
 *   - static assets (app shell + JS/CSS/images/fonts)
 *   - dynamic data (Firestore REST responses)
 *
 * Fetch strategies:
 * - Navigation (HTML): NetworkFirst + offline fallback to cached `/index.html`
 * - Firestore API: NetworkFirst; cache successful responses; fallback to cached; else JSON error
 * - Static assets: CacheFirst; on miss fetch+cache
 */

const STATIC_CACHE = 'static-cache-v1'
const DYNAMIC_CACHE = 'dynamic-cache-v1'

// App shell: keep small + predictable for Vite dev.
// In production Vite outputs hashed assets; those are handled by runtime caching below.
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json', '/offline.html']

self.addEventListener('install', (event) => {
  // Pre-cache the minimal app shell to make offline navigation work.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      // Be resilient: don't fail install if one URL can't be fetched.
      // `addAll()` is "all-or-nothing" and will prevent the SW from installing if any request 404s.
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          const res = await fetch(url, { cache: 'reload' })
          if (res.ok) await cache.put(url, res)
        }),
      )
      // Activate this SW immediately after install.
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  // Clean up old cache versions and take control of open tabs.
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key)
          }
          return Promise.resolve(true)
        }),
      )
      await self.clients.claim()
    })(),
  )
})

function isFirestoreRequest(request) {
  try {
    const url = new URL(request.url)
    return url.origin === 'https://firestore.googleapis.com'
  } catch {
    return false
  }
}

function isNavigationRequest(request) {
  // `mode: navigate` is the most reliable signal for document navigations.
  if (request.mode === 'navigate') return true

  // Some navigations (or SPA router reloads) may not be mode=navigate.
  const accept = request.headers.get('accept') || ''
  return accept.includes('text/html')
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    // Only cache successful responses.
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl)
      if (fallback) return fallback
    }
    throw err
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  // Cache successful responses; allow opaque for some cross-origin static assets (e.g. fonts).
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET. Let non-GET (POST/PUT/etc.) always hit the network.
  if (request.method !== 'GET') return

  // Ignore dev tooling / extensions.
  if (request.url.startsWith('chrome-extension://')) return

  // Vite dev-server / HMR endpoints should never be cached.
  // Caching these can break HMR websocket negotiation and produce errors like:
  // "Cannot read properties of undefined (reading 'send')".
  try {
    const url = new URL(request.url)
    const path = url.pathname
    if (
      path.startsWith('/@vite') ||
      path.startsWith('/@react-refresh') ||
      path.startsWith('/@fs') ||
      path.startsWith('/@id') ||
      path.startsWith('/src/') ||
      path.startsWith('/src/pages/')
    ) {
      event.respondWith(fetch(request))
      return
    }
  } catch {
    // If URL parsing fails, fall through to normal handling.
  }

  // 1) Navigation documents: NetworkFirst + cached `/index.html` fallback
  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        let pathname = '/'
        try {
          pathname = new URL(request.url).pathname
        } catch {
          // ignore
        }

        try {
          // Special case:
          // - Intake (`/`) should work offline using the cached SPA shell.
          // - Other routes should intentionally fall back to `/offline.html` when offline.
          if (pathname === '/' || pathname === '/index.html') {
            return await networkFirst(request, STATIC_CACHE, DYNAMIC_CACHE, '/index.html')
          }

          // For other pages, do not fall back to the SPA shell.
          return await networkFirst(request, STATIC_CACHE, DYNAMIC_CACHE, '/offline.html')
        } catch {
          // If the app shell isn't cached for some reason, show a clear offline page.
          const cache = await caches.open(STATIC_CACHE)
          return (
            (await cache.match('/offline.html')) ||
            new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
          )
        }
      })(),
    )
    return
  }

  // 2) Firestore REST calls: NetworkFirst with cache fallback, else JSON error
  if (isFirestoreRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(request, DYNAMIC_CACHE)
        } catch {
          // No cached response available.
          return new Response(JSON.stringify({ error: 'offline', source: 'service-worker' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })(),
    )
    return
  }

  // 3) Everything else (JS/CSS/images/fonts): CacheFirst
  event.respondWith(cacheFirst(request, STATIC_CACHE))
})

