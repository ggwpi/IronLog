const CACHE='ironlog-v5-1';
const CORE=[
  '/',
  '/index.html',
  '/src/styles.css',
  '/src/bigscreen.css',
  '/src/data.js',
  '/src/storage.js',
  '/src/anatomy/chest.js',
  '/src/anatomy/biceps.js',
  '/src/anatomy/triceps.js',
  '/src/anatomy/shoulders.js',
  '/src/anatomy/back.js',
  '/src/anatomy/abs.js',
  '/src/anatomy/quads.js',
  '/src/anatomy/hamstrings.js',
  '/src/anatomy/glutes.js',
  '/src/anatomy/calves.js',
  '/src/app.js',
  '/src/bigscreen.js',
  '/manifest.webmanifest'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request).then(response=>response||caches.match('/index.html')))
  );
});
