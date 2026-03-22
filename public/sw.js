// MOM Service Worker — Network-first strategy to prevent stale module errors
const CACHE_VERSION = 'mom-static-v4'
const STATIC_ASSETS = [
  '/manifest.json',
  '/vite.svg',
]

// On install: cache truly static assets only (not JS bundles — they have hashed names)
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

// On activate: delete ALL old caches so stale bundles never block new deploys
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch strategy:
// - JS/CSS modules: always go to network (never serve stale hashed bundles)
// - Navigation (HTML): always network, fallback to cache
// - Other assets (icons, manifest): cache-first
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) return

  const isModule = /\.(js|jsx|ts|tsx|css)(\?|$)/.test(url.pathname)
  const isNavigation = event.request.mode === 'navigate'

  if (isModule || isNavigation) {
    // Network-first: always fetch fresh, serve cache only if offline
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    )
  }
})
