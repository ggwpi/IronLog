const CACHE='ironlog-v4-5';
const CORE=['/','/index.html','/src/styles.css','/src/data.js','/src/storage.js','/src/app.js','/src/bigscreen-v2.js','/src/bigscreen-v4.js','/manifest.webmanifest'];

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

async function patchedBigscreen(request){
  const cache=await caches.open(CACHE);
  let base;
  let patch;
  try{ base=await fetch(request); if(base.ok) cache.put(request,base.clone()); }catch(_){ base=await cache.match(request); }
  try{ patch=await fetch('/src/bigscreen-v4.js',{cache:'no-store'}); if(patch.ok) cache.put('/src/bigscreen-v4.js',patch.clone()); }catch(_){ patch=await cache.match('/src/bigscreen-v4.js'); }
  if(!base) return new Response('/* IronLog Big Screen unavailable */',{status:503,headers:{'Content-Type':'application/javascript; charset=utf-8'}});
  const baseText=await base.text();
  const patchText=patch?await patch.text():'';
  return new Response(`${baseText}\n\n/* Big Screen v4 polish */\n${patchText}`,{
    status:200,
    headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store, max-age=0'}
  });
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin && url.pathname==='/src/bigscreen-v2.js'){
    event.respondWith(patchedBigscreen(event.request));
    return;
  }
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