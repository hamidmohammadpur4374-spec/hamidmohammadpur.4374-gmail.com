const C='modland-customer-v15',IMG='modland-customer-images-v1',MAX_IMAGES=100;
const S=['./','./index.html','./product.html','./catalog-pro-v6.css?v=15','./catalog-vnext.css?v=15','./catalog-platform-v2.css?v=15','./catalog-pro-v9.js?v=15','./product-pro-v6.css?v=15','./product-pro-v8.js?v=15','./product-intro-only-v1.js?v=15','./free-shipping-v1.js?v=15','./manifest.webmanifest','../icon.svg','../apple-touch-icon.png'];
async function trim(cacheName,max){const c=await caches.open(cacheName),keys=await c.keys();if(keys.length>max)await Promise.all(keys.slice(0,keys.length-max).map(k=>c.delete(k)))}
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(S)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('modland-customer-')&&x!==C&&x!==IMG).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);if(req.method!=='GET')return;
  if(req.destination==='image'){e.respondWith(caches.open(IMG).then(async c=>{const hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(r.ok||r.type==='opaque'){await c.put(req,r.clone());trim(IMG,MAX_IMAGES)}return r}catch(err){if(hit)return hit;throw err}}));return}
  if(u.hostname==='bemkwibdtjrvrstlmvca.supabase.co')return;
  if(req.mode==='navigate'){e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const copy=r.clone();caches.open(C).then(c=>c.put(req,copy))}return r}).catch(async()=>{const direct=await caches.match(req);if(direct)return direct;return u.pathname.endsWith('/catalog/product.html')?(await caches.match('./product.html')||await caches.match('./index.html')):await caches.match('./index.html')}));return}
  if(req.destination==='video')return;
  if(req.destination==='script'||req.destination==='style'||/\.(?:js|css)$/.test(u.pathname)){e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp))}return r}).catch(()=>caches.match(req)));return}
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(C).then(c=>c.put(req,copy))}return r})));
});