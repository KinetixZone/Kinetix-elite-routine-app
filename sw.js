
const CACHE_NAME = 'kinetix-elite-v3.5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // CRÍTICO: No interceptar peticiones a ai.studio o dominios externos
  // Esto evita que el Service Worker intente "cachear" recursos que causan CORS
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Si es el manifest, forzamos que use la versión local sin condiciones
  if (event.request.url.includes('manifest.json')) {
      event.respondWith(
          fetch(event.request).catch(() => caches.match('./manifest.json'))
      );
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request).then(
          (response) => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });
            return response;
          }
        ).catch(() => {
          if (event.request.mode === 'navigate') {
             return caches.match('./index.html');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
