const BASE='https://bemkwibdtjrvrstlmvca.supabase.co';
const KEY='sb_publishable_oqpsHvl6ty2aYmAkxwfwfw_pjsN8a6p';

function fail(message){throw new Error('[DB integrity] '+message)}
function arr(v,name){if(!Array.isArray(v))fail(name+' must be an array');return v}

const ctrl=new AbortController();
const timer=setTimeout(()=>ctrl.abort(),12000);
let response;
try{
  response=await fetch(BASE+'/rest/v1/rpc/get_catalog_snapshot',{
    method:'POST',
    headers:{apikey:KEY,'Content-Type':'application/json'},
    body:'{}',
    cache:'no-store',
    signal:ctrl.signal
  });
}finally{clearTimeout(timer)}
if(!response.ok)fail('snapshot RPC HTTP '+response.status+' '+(await response.text()).slice(0,300));
const s=await response.json();
if(!s||typeof s!=='object')fail('snapshot is not an object');
if(!s.store||typeof s.store!=='object')fail('store is missing');
if(!s.prefs||typeof s.prefs!=='object')fail('preferences are missing');
const categories=arr(s.categories,'categories');
const products=arr(s.products,'products');
const media=arr(s.media,'media');
if(!s.collections||typeof s.collections!=='object')fail('collections are missing');

if(Object.prototype.hasOwnProperty.call(s.store,'order_id'))fail('order_id leaked in public store snapshot');
const forbiddenProductFields=['order_button','order_message','shipping_text','stock_note','stock_status'];
const productIds=new Set();
const codes=new Set();
for(const p of products){
  if(!p?.id)fail('product without id');
  if(productIds.has(p.id))fail('duplicate product id '+p.id);
  productIds.add(p.id);
  const code=String(p.code??'').trim();
  if(!code)fail('product without code: '+p.id);
  if(codes.has(code))fail('duplicate product code '+code);
  codes.add(code);
  for(const field of forbiddenProductFields){
    if(Object.prototype.hasOwnProperty.call(p,field))fail('ordering field '+field+' leaked on product '+code);
  }
  if(/ثبت\s*سفارش|سفارش محصول|ارسال\s*رایگان|پیام بدهید/i.test(JSON.stringify(p)))fail('ordering language leaked on product '+code);
}

const categoryIds=new Set(categories.map(c=>c?.id).filter(Boolean));
for(const p of products){
  if(p.category_id&&!categoryIds.has(p.category_id))fail('orphan category reference on product '+p.code);
}

const featuredByProduct=new Map();
for(const m of media){
  if(!m?.id)fail('media without id');
  if(!productIds.has(m.product_id))fail('orphan media '+m.id+' -> '+m.product_id);
  if(Object.prototype.hasOwnProperty.call(m,'original_storage_path'))fail('private original_storage_path leaked in public snapshot');
  if(m.media_type==='image'&&m.is_visible!==false&&m.is_featured){
    featuredByProduct.set(m.product_id,(featuredByProduct.get(m.product_id)||0)+1);
  }
}
for(const [productId,count] of featuredByProduct){
  if(count>1)fail('multiple visible featured images for product '+productId);
}

for(const [name,ids] of Object.entries(s.collections)){
  if(!Array.isArray(ids))fail('collection '+name+' is not an array');
  const seen=new Set();
  for(const id of ids){
    if(!productIds.has(id))fail('collection '+name+' references missing product '+id);
    if(seen.has(id))fail('collection '+name+' contains duplicate product '+id);
    seen.add(id);
  }
}

const serialized=JSON.stringify(s);
if(serialized.includes('original_storage_path'))fail('private storage field name leaked in snapshot');

console.log(JSON.stringify({
  ok:true,
  products:products.length,
  categories:categories.length,
  media:media.length,
  collections:Object.fromEntries(Object.entries(s.collections).map(([k,v])=>[k,v.length]))
}));
