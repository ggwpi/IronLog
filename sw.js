const CACHE='ironlog-v4-10';
const CORE=['/','/index.html','/src/styles.css','/src/data.js','/src/storage.js','/src/app.js','/src/bigscreen-v2.js','/src/bigscreen-v4.js','/src/bigscreen-v5.js','/src/bigscreen-v6.js','/src/bigscreen-v7.js','/manifest.webmanifest'];

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
