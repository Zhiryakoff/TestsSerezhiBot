const CACHE='military-abbrev-v4';
const CORE=['./','./index.html','./style.css','./app.js','./data.js','./picture_data.js','./manifest.json','./telegram.js'];
const PICTURES=Array.from({length:168},(_,i)=>`./assets/pictures/${i+1}.jpg`);
const ANSWERS=Array.from({length:168},(_,i)=>`./assets/answers/${i+1}-1.jpg`);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.concat(PICTURES))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
