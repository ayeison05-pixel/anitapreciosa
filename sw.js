// sw.js - Service Worker para Preciosa PWA
const CACHE_NAME = 'preciosa-v1';
const urlsToCache = [
  '/anitapreciosa/',
  '/anitapreciosa/index.html',
  '/anitapreciosa/audio1.m4a',
  '/anitapreciosa/manifest.json',
  '/anitapreciosa/icon-192.png',
  '/anitapreciosa/icon-512.png'
];

// Instalación - Cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones - Servir desde cache si está disponible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - devolver desde cache
        if (response) {
          return response;
        }
        // No está en cache - hacer petición normal
        return fetch(event.request);
      })
  );
});

// Limpiar cache viejo al activar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});