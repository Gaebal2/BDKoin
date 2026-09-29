const CACHE_NAME = 'bdk-wallet-project-release-2';
const APP_SHELL = [
  './',
  './index.html',
  './framing.css?v=bdk2',
  './styles.css?v=bdk2',
  './wallets.css?v=bdk2',
  './install.css?v=bdk2',
  './history.css?v=bdk2',
  './overlays.css?v=bdk2',
  './app.js?v=bdk2',
  './i18n.js?v=bdk2',
  './backup.js?v=bdk2',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/bdkoin-app-v2.png',
  './images/bdkoin-brand.png',
  './bdk-theme.css?v=bdk2',
  './images/bdk-token-icon.svg',
  './images/sl-token-icon.png',
  './vendor/crypto-js.min.js',
  './vendor/nacl-fast.min.js',
  './vendor/axios.min.js',
  './vendor/qrcode.min.js',
  './vendor/saseul.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(APP_SHELL.map(async (url) => {
    const response = await fetch(url, { cache: 'reload' });
    if (!response.ok) throw new Error(`Failed to cache ${url}`);
    await cache.put(url, response);
  }))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('bdk-wallet-project-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Navigation unavailable');
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
