const CACHE_NAME = 'jtm-v1';
const FILES_TO_CACHE = [
  '/jt-manager/',
  '/jt-manager/index.html',
  '/jt-manager/manifest.json',
  '/jt-manager/sw.js'
];

// Install — cache all app files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and Google API calls (Drive, OAuth)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('googleapis.com')) return;
  if (event.request.url.includes('accounts.google.com')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version if available
      if (response) return response;
      // Otherwise fetch from network and cache it
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, return offline page
        return caches.match('/jt-manager/index.html');
      });
    })
  );
});
