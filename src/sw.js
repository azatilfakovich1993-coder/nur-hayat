// ── Workbox ───────────────────────────────────────────────────────────────────
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'))
)

// Данные сур (public/quran-data/<id>.json) — неизменяемые, кэшируем навсегда:
// после первого открытия суры она грузится мгновенно даже офлайн
registerRoute(
  /\/quran-data\/\d+\.json$/i,
  new CacheFirst({
    cacheName: 'quran-data-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 })]
  }),
  'GET'
)

// Аудио чтения Корана (cdn.islamic.network) — кэшируем навсегда: один раз
// прослушанный аят больше не качаем заново
registerRoute(
  /^https:\/\/cdn\.islamic\.network\/quran\/audio(-surah)?\/.*/i,
  new CacheFirst({
    cacheName: 'quran-audio-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 })]
  }),
  'GET'
)

registerRoute(
  /^https:\/\/api\.alquran\.cloud\/.*/i,
  new CacheFirst({
    cacheName: 'quran-api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 })]
  }),
  'GET'
)

// Supabase REST через прокси (Frankfurt) — на медленном интернете
// ждём сеть максимум 6 сек, иначе отдаём кэш и обновляем в фоне.
registerRoute(
  /^https:\/\/nurhayat\.ru\/rest\/.*/i,
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 })]
  }),
  'GET'
)

// ── Web Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() } catch { return }

  const { title, body, url, tag } = payload
  event.waitUntil(
    self.registration.showNotification(title || 'Nur Hayat', {
      body:     body || '',
      icon:     '/icons/icon-192.png',
      badge:    '/icons/icon-192.png',
      data:     { url: url || '/chat' },
      tag:      tag || 'nur-hayat',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/chat'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
