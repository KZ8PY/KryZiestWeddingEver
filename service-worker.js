// Simple service worker for offline support
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('kryziest-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/css/base.css',
        '/src/css/variables.css',
        '/src/css/layout.css',
        '/src/js/main.js',
        '/src/js/countdown.js'
      ]);
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
