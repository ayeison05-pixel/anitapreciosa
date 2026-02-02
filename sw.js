// sw.js - Service Worker para Preciosa PWA
// IMPORTANTE: Cambia CACHE_NAME cada vez que actualices la app

const CACHE_NAME = 'preciosa-v2'; // CAMBIA ESTE NÚMERO (v2, v3, v4...)

// Archivos que se cachearán (opcional, ajusta según necesites)
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './audio1.m4a'
  // Agrega aquí tus fotos si quieres que funcionen offline
  // './foto1.jpg',
  // './foto2.jpg',
  // './foto3.jpg',
];

// =====================
// INSTALACIÓN
// =====================
self.addEventListener('install', event => {
  console.log('🔄 Service Worker instalando versión:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto:', CACHE_NAME);
        // Cachear archivos importantes (opcional)
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos los recursos cacheados');
        // Saltar la espera para activar inmediatamente
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error durante instalación:', error);
      })
  );
});

// =====================
// ACTIVACIÓN
// =====================
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('🔍 Caches encontrados:', cacheNames);
      
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches viejos (que no sean el actual)
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Notificar a todas las pestañas/pestañas abiertas
      return self.clients.matchAll().then(clients => {
        console.log('📢 Notificando a', clients.length, 'clientes');
        clients.forEach(client => {
          client.postMessage('update');
        });
      });
    })
    .then(() => {
      // Tomar control de todas las pestañas inmediatamente
      return self.clients.claim();
    })
    .then(() => {
      console.log('🚀 Service Worker listo y activo');
    })
  );
});

// =====================
// INTERCEPTAR PETICIONES (FETCH)
// =====================
self.addEventListener('fetch', event => {
  // Para la app Preciosa, siempre intentamos ir a la red primero
  // y solo usamos cache si falla (estrategia "Network First")
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, la devolvemos
        if (response && response.status === 200) {
          // Opcional: cachear la respuesta para uso futuro
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos servir del cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('📂 Sirviendo desde cache:', event.request.url);
              return cachedResponse;
            }
            
            // Si no hay en cache, mostrar página offline personalizada
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Preciosa - Offline</title>
                  <style>
                    body {
                      font-family: 'Inter', sans-serif;
                      background: linear-gradient(180deg, #00A6FF 0%, #6fd3ff 100%);
                      color: white;
                      height: 100vh;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      text-align: center;
                      padding: 20px;
                      margin: 0;
                    }
                    .container {
                      max-width: 400px;
                    }
                    h1 {
                      font-family: 'Playfair Display', serif;
                      font-size: 3rem;
                      text-shadow: 2px 1px 2.5px black;
                      margin-bottom: 20px;
                    }
                    p {
                      font-size: 1.2rem;
                      line-height: 1.6;
                      margin-bottom: 30px;
                    }
                    .corazon {
                      font-size: 3rem;
                      animation: latido 1.5s infinite;
                    }
                    @keyframes latido {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.2); }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="corazon">💙</div>
                    <h1>Preciosa</h1>
                    <p>Estás offline, pero nuestro amor sigue conectado ❤️</p>
                    <p>Cuando recuperes la conexión, podrás ver nuestras fotos juntos.</p>
                    <p><em>Te amo Anita preciosa</em></p>
                  </div>
                </body>
                </html>
              `, {
                headers: { 
                  'Content-Type': 'text/html',
                  'Cache-Control': 'no-cache'
                }
              });
            }
            
            // Para otros tipos de recursos, devolver error
            return new Response('Recurso no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// =====================
// MANEJO DE MENSAJES
// =====================
self.addEventListener('message', event => {
  console.log('📨 Mensaje recibido en SW:', event.data);
  
  // Si recibimos el mensaje para saltar la espera (SKIP_WAITING)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Saltando espera por solicitud del cliente');
    self.skipWaiting();
  }
  
  // Puedes agregar más tipos de mensajes aquí si necesitas
});

// =====================
// MANEJO DE PUSH NOTIFICATIONS (FUTURO)
// =====================
self.addEventListener('push', event => {
  console.log('🔔 Notificación push recibida:', event);
  
  // Aquí puedes agregar manejo de notificaciones push si las implementas
  const options = {
    body: 'Te extraño mi Anita preciosa 💕',
    icon: './icon.png',
    badge: './icon.png',
    tag: 'preciosa-notification',
    renotify: true,
    actions: [
      {
        action: 'abrir',
        title: 'Abrir App'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Preciosa', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('👆 Notificación clickeada:', event.notification.tag);
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Si ya hay una ventana abierta, enfócala
      for (let client of windowClients) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventanas, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

console.log('👷 Service Worker cargado y listo');