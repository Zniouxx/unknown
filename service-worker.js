const CACHE_NAME = 'casl-cache-v3';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './whatif.html',
  './manifest.json',
  './manifest.webmanifest',
  './service-worker.js',
  './icons/casl-icon.svg',
  './Engine/stockfish.js',
  './Engine/stockfish.wasm.js',
  './Engine/stockfish.wasm',
  './chess/wr.png', './chess/wn.png', './chess/wb.png', './chess/wq.png', './chess/wk.png', './chess/wp.png',
  './chess/br.png', './chess/bn.png', './chess/bb.png', './chess/bq.png', './chess/bk.png', './chess/bp.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response && response.status === 200 && response.type !== 'opaque') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        return (await caches.match('./index.html')) || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      throw error;
    }
  })());
});