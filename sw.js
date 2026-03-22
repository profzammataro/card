// Service Worker — Scard PWA
const CACHE_NAME = 'scard-v1';

// File da mettere in cache per uso offline
const STATIC_ASSETS = [
    '/card/',
    '/card/index.html',
    '/card/privacy.html',
    '/card/manifest.json',
    '/card/icon-192.png',
    '/card/icon-512.png'
];

// ─── INSTALL ───
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── ACTIVATE ───
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ─── FETCH ───
// Strategia: Network first, poi cache come fallback
self.addEventListener('fetch', (event) => {
    // Ignora richieste non GET e richieste a Firebase/Cloudinary (sempre online)
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('cloudinary') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('unpkg') ||
        url.hostname.includes('barcodeapi')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Aggiorna la cache con la risposta fresca
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // Offline: usa la cache
                return caches.match(event.request).then(cached => {
                    return cached || caches.match('/card/index.html');
                });
            })
    );
});
