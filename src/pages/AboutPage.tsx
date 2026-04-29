export default function AboutPage() {
  return (
    <div className="card">
      <h2>About</h2>
      <p className="muted">
        This is a manual PWA using the native Service Worker API (no Workbox). The Firestore-backed intake form supports
        offline queueing and sync when back online.
      </p>
      <p className="muted" style={{ marginTop: 10 }}>
        Try going offline and navigating between pages to see the app shell fallback behavior.
      </p>
    </div>
  )
}

