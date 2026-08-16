// Service worker offline réel pour Motel Wifi Siguiri.
// Doit être servi comme fichier statique (même dossier que le HTML), pas en blob :
// un blob URL n'est pas retrouvable par le navigateur d'un lancement à l'autre,
// ce qui empêchait le mode hors-ligne de fonctionner après fermeture de l'app.

const CACHE_NAME = 'motel-wifi-siguiri-v2';
// Liste des ressources connues à mettre en cache dès l'installation, en plus
// de la page elle-même. Complétée dynamiquement à l'exécution (fetch en cache-first
// pour tout ce qui est déjà passé par le réseau une fois).
const APP_SHELL = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseClone).catch(() => {});
      });
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          // Retombe sur la page principale mise en cache si la navigation échoue hors-ligne.
          return caches.match('./') || caches.match('./index.html');
        }
        return new Response('', { status: 504, statusText: 'Hors ligne' });
      });
    })
  );
});
