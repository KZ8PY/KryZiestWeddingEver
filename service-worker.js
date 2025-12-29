// Simple service worker for offline support
self.addEventListener('install', event => {
  // Bump cache name when updating assets
  event.waitUntil(
    caches.open('kryziest-v2').then(cache => {
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
        '/public/videos/save-the-date.mp4',
        '/public/images/hero/save-the-date-thumb.jpg'
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
