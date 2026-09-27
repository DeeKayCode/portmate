/**
 * PortMate PWA Service Worker
 * Precaches app shell and provides offline support.
 * Explicitly NEVER caches authentication credentials or bearer tokens.
 */

const CACHE_NAME = 'portmate-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. NEVER cache authentication endpoints
  if (url.pathname.startsWith('/api/v1/auth/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Non-auth API requests: Network first, with offline error fallback
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            title: 'Offline',
            detail: 'You are currently offline. Local cached data is active.',
            status: 503,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/problem+json' },
          }
        );
      })
    );
    return;
  }

  // 3. Static assets: Cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If navigation fails, return app shell
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
