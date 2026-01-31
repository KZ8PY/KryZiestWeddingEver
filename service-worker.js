// Simple service worker for offline support
const CACHE_NAME = 'kryziest-v5';

self.addEventListener('install', event => {
  // Bump cache name when updating assets
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/savethedate-rsvp/',
        '/src/css/base.css',
        '/src/css/variables.css',
        '/src/css/layout.css',
        '/src/js/main.js',
        '/src/js/countdown.js',
        '/src/js/rsvp.js',
        '/src/js/pwa.js',
        '/public/images/hero/save-the-date-thumb.jpg'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k.startsWith('kryziest-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // For navigations/HTML: network-first so content updates reliably.
  const isHtmlRequest = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html')
    || url.pathname.endsWith('.html');

  // Only cache same-origin requests.
  const isSameOrigin = url.origin === self.location.origin;

  if (isHtmlRequest) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (isSameOrigin && res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          return caches.match(req)
            .then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // For same-origin static assets: cache-first for speed/offline.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
