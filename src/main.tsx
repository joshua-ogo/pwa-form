import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Manual Service Worker registration (no plugin, no Workbox).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register in dev + prod.
    // In dev, the service worker bypasses Vite HMR URLs (see `public/sw.js`) to avoid websocket issues.
    // Use absolute path so routing like `/about` still registers the correct SW.
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed', err)
    })
  })
}
