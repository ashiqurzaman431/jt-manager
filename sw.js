const CACHE_NAME = 'jtm-v4';

// Install — skip waiting immediately, no pre-caching
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate — delete ALL old caches, claim all clients instantly
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — NETWORK FIRST, cache only as offline fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Never intercept Google API / OAuth / font calls
  const url = event.request.url;
  if (url.includes('googleapis.com')) return;
  if (url.includes('accounts.google.com')) return;
  if (url.includes('gsi/client')) return;
  if (url.includes('fonts.googleapis.com')) return;
  if (url.includes('fonts.gstatic.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Got a fresh response — update cache and return it
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — serve from cache (offline fallback)
        return caches.match(event.request)
          .then(cached => cached || caches.match('/jt-manager/index.html'));
      })
  );
});
