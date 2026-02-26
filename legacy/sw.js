// EcoTrack Service Worker
// Versión: 1.0.0

const CACHE_NAME = 'ecotrack-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/detector.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/assets/js/ui.js',
  '/assets/js/forms.js',
  '/assets/js/historical.js',
  '/assets/js/main.js',
  '/assets/js/detector.js',
  '/Logo/EcoTrack.png',
  '/assets/data/eventos_hidro.csv'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devolver de cache si existe
        if (response) {
          return response;
        }
        
        // Sino, hacer petición de red
        return fetch(event.request).then(
          function(response) {
            // Verificar si recibimos una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Limpiar caches antiguos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});