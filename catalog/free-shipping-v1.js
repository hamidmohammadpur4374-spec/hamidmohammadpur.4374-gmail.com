(()=>{
const SHIPPING='ارسال رایگان به سراسر کشور';
const WHOLESALE='فقط فروش عمده';
function setText(el,text){if(!el)return;if(el.textContent!==text)el.textContent=text;if(el.hidden)el.hidden=false}
function ensureHeroWholesale(){
  const host=document.querySelector('.hero-stats');
  if(!host)return;
  let el=document.getElementById('wholesalePill');
  if(!el){
    el=document.createElement('span');
    el.id='wholesalePill';
    el.className='pill';
    const shipping=document.getElementById('shippingPill');
    if(shipping&&shipping.parentElement===host)shipping.after(el);else host.appendChild(el);
  }
  setText(el,WHOLESALE);
}
function ensureFooterWholesale(){
  const footer=document.querySelector('.footer');
  if(!footer)return;
  let el=document.getElementById('wholesaleNote');
  if(!el){
    el=document.createElement('div');
    el.id='wholesaleNote';
    const shipping=document.getElementById('footerNote');
    if(shipping&&shipping.parentElement===footer)shipping.after(el);else footer.prepend(el);
  }
  setText(el,WHOLESALE);
}
function ensureProductHighlights(){
  const infoPanel=document.querySelector('.panel .title')?.closest('.panel');
  const meta=infoPanel?.querySelector('.meta');
  if(!meta)return;
  let shipping=meta.querySelector('[data-free-shipping]');
  if(!shipping){shipping=document.createElement('span');shipping.className='tag';shipping.dataset.freeShipping='true';meta.appendChild(shipping)}
  setText(shipping,SHIPPING);
  let wholesale=meta.querySelector('[data-wholesale-only]');
  if(!wholesale){wholesale=document.createElement('span');wholesale.className='tag';wholesale.dataset.wholesaleOnly='true';meta.appendChild(wholesale)}
  setText(wholesale,WHOLESALE);
}
function applyStoreHighlights(){
  setText(document.getElementById('shippingPill'),SHIPPING);
  setText(document.getElementById('footerNote'),SHIPPING);
  ensureHeroWholesale();
  ensureFooterWholesale();
  ensureProductHighlights();
}
let queued=false;
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyStoreHighlights()})}
function boot(){
  applyStoreHighlights();
  const target=document.querySelector('.shell')||document.body;
  if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});
  let ticks=0;
  const guard=setInterval(()=>{applyStoreHighlights();if(++ticks>=40)clearInterval(guard)},250);
  window.addEventListener('pageshow',applyStoreHighlights);
  window.addEventListener('online',applyStoreHighlights);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyStoreHighlights()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();