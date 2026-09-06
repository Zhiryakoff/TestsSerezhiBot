const CACHE='obshaya-taktika-v5';
const CORE=['./','./index.html','./style.css','./app.js','./bg.js','./data.js','./picture_data.js','./manifest.json','./telegram.js'];
const PICTURES=Array.from({length:168},(_,i)=>`./assets/pictures/${i+1}.jpg`);
const ANSWERS=Array.from({length:168},(_,i)=>`./assets/answers/${i+1}-1.jpg`);

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.concat(PICTURES,ANSWERS))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// App shell files (html/css/js/json) -> network-first so updates show immediately.
// Images -> cache-first (heavy, rarely change).
const SHELL_RE=/\.(?:html|css|js|json)$|\/$/;

self.addEventListener('fetch',e=>{
  const url=e.request.url;
  const isShell = SHELL_RE.test(url) || e.request.mode==='navigate';

  if(isShell){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
          return res;
        })
        .catch(()=>caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
        return res;
      }))
    );
  }
});
