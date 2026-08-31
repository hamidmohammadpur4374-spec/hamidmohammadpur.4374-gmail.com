const C='modland-admin-v14';
const A=['./admin-v2.html','./admin-pro-v1.css?v=4','./admin-platform-v2.css?v=4','./admin-pro-core.js?v=4','./admin-pro-products.js?v=4','./admin-pro-admin.js?v=4','./admin-vnext.js?v=4','./admin-pro-v2.js?v=4','./admin-ui-v3.js?v=4','./admin-catalog-only-v1.js?v=4','./manifest.webmanifest','./icon.svg','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('modland-admin-')&&x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);if(req.method!=='GET')return;if(u.pathname.includes('/catalog/'))return;if(u.hostname==='bemkwibdtjrvrstlmvca.supabase.co')return;
  if(req.mode==='navigate'){e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp))}return r}).catch(()=>caches.match('./admin-v2.html')));return}
  if(req.destination==='script'||req.destination==='style'||/\.(?:js|css)$/.test(u.pathname)){e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp))}return r}).catch(()=>caches.match(req)));return}
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp))}return res})))
});