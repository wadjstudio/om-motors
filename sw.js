const CACHE = 'om-motors-v6';
const base = new URL('./', self.location.href);
const files = ['index.html','style.css','app.js','pwa.js','model-loader.js','manifest.webmanifest','favicon.ico','assets/hero.jpeg','assets/details.jpeg','assets/interior-camel.jpg','assets/interior-crimson.jpg','assets/interior-cognac.jpg','assets/interior-ivory.jpg','assets/interior-black.jpg','assets/interior-navy.jpg','assets/sedan-stage.jpg','assets/sedan-rear.jpg','assets/sedan-side.jpg','assets/sedan-detail.jpg','assets/sedan-paint-grey.jpg','assets/sedan-paint-white.jpg','assets/sedan-paint-black.jpg','assets/sedan-paint-gold.jpg','assets/sedan-leather-cognac.jpg','assets/sedan-leather-crimson.jpg','assets/sedan-leather-ivory.jpg','assets/sedan-leather-black.jpg','assets/reveal-poster.jpg','assets/three.module.js','assets/GLTFLoader.js','assets/BufferGeometryUtils.js','assets/om-generated.glb','assets/icons/favicon.svg','assets/icons/icon-180.png','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-512.png'];
const urls = files.map(file => new URL(file, base).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('om-motors-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Media range requests stay with the server so video seeking keeps working.
  if (request.method !== 'GET' || url.origin !== base.origin || request.headers.has('Range') || url.pathname.endsWith('.mp4')) return;
  const navigation = request.mode === 'navigate' && url.pathname.startsWith(base.pathname);
  if (!navigation && !urls.includes(url.href)) return;
  const key = navigation ? new URL('index.html', base).href : request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return cached;
      throw error;
    }
  })());
});
