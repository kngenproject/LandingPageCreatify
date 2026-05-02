const CACHE_NAME = 'creatify-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
  // Tambahkan file penting lainnya jika ada (misal: CSS/JS lokal)
];

// Install event: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Cache addAll failed:', err))
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network first with cache fallback (for HTML & assets)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Abaikan request ke API eksternal (Firebase, Google Fonts, dll)
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            if (event.request.method === 'GET') {
              cache.put(event.request, responseToCache);
            }
          });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback ke halaman utama jika navigasi
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline - Konten tidak tersedia', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});