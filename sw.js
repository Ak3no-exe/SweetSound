/* Service worker minimal : met en cache la coquille de l'appli pour qu'elle
   s'installe comme une vraie app et se lance même hors connexion.
   Les sons audio, eux, restent stockés dans IndexedDB (voir index.html)
   et ne passent pas par ce cache. */
const CACHE_NAME = 'sweetsound-cache-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // En ligne : on sert toujours la version fraîche du réseau,
        // et on met à jour le cache au passage pour le mode hors-ligne.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
      // Hors connexion (ou requête échouée) : on retombe sur le cache.
  );
});
