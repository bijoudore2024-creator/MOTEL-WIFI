/* Motel Wifi Siguiri — service worker minimal */
const CACHE = 'motel-wifi-shell-v1';
const SHELL = ['./', './index.html'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Le HTML principal est servi depuis le cache si le réseau est indisponible.
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html').then(cached => cached || caches.match('./'))));
    return;
  }
  // Cache les ressources externes déjà chargées avec succès, utile mais ne garantit
  // pas que toutes les dépendances Firebase fonctionnent hors ligne.
  event.respondWith(fetch(req).then(res => {
    if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()).catch(()=>{}));
    return res;
  }).catch(() => caches.match(req).then(cached => cached || new Response('', {status: 504, statusText: 'Hors ligne'}))));
});
