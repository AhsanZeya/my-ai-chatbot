// Simple Service Worker for PWA installation & caching
const CACHE_NAME = 'ai-chatbot-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only cache same-origin GET requests; bypass external API calls
  if (e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});

