// Service Worker for Handlekurven
const CACHE_NAME = 'matplan-v18-auth';
const CACHE_URLS = ['./', './style.css', './app.js'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Kun cache GET-forespørsler til egne filer – ikke Firebase
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf('firebase') !== -1) return;
  if (event.request.url.indexOf('googleapis') !== -1) return;

  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
