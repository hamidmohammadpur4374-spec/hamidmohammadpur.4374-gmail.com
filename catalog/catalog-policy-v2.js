(()=>{
const DEFAULT_SHIPPING='ارسال رایگان به سراسر کشور';
const DEFAULT_WHOLESALE='فقط فروش عمده';
const FREE_SHIPPING=/^ارسال\s*رایگان(?:\s*به\s*سراسر\s*کشور)?$/i;
const ORDER_WORDS=/ثبت\s*سفارش|سفارش\s*محصول|خرید|کلیک\s*سفارش|نرخ\s*تبدیل|موجودی|^موجود$/i;

function storeValue(key,fallback){try{return String(data?.store?.[key]||fallback).trim()||fallback}catch{return fallback}}
function shippingText(){return storeValue('footer_note',DEFAULT_SHIPPING)}
function wholesaleText(){return storeValue('wholesale_note',DEFAULT_WHOLESALE)}
function setText(el,text){if(!el)return;if(el.textContent!==text)el.textContent=text;if(el.hidden)el.hidden=false}
function isOrderText(value){const text=String(value||'').trim();return !!text&&!FREE_SHIPPING.test(text)&&ORDER_WORDS.test(text)}

function ensureCatalogHighlights(){
  const shipping=document.getElementById('shippingPill');
  if(shipping)setText(shipping,shippingText());
  const hero=document.querySelector('.hero-stats');
  if(hero){
    let wholesale=document.getElementById('wholesalePill');
    if(!wholesale){wholesale=document.createElement('span');wholesale.id='wholesalePill';wholesale.className='pill';if(shipping?.parentElement===hero)shipping.after(wholesale);else hero.appendChild(wholesale)}
    setText(wholesale,wholesaleText());
  }
  const footer=document.querySelector('.footer');
  if(footer){
    const footerShipping=document.getElementById('footerNote');
    if(footerShipping)setText(footerShipping,shippingText());
    let wholesale=document.getElementById('wholesaleNote');
    if(!wholesale){wholesale=document.createElement('div');wholesale.id='wholesaleNote';if(footerShipping?.parentElement===footer)footerShipping.after(wholesale);else footer.prepend(wholesale)}
    setText(wholesale,wholesaleText());
  }
}

function ensureProductHighlights(){
  const info=document.querySelector('.panel .title')?.closest('.panel');
  const meta=info?.querySelector('.meta');
  if(!meta)return;
  meta.querySelectorAll('.tag').forEach(tag=>{if(isOrderText(tag.textContent))tag.remove()});
  info.querySelectorAll('.txt').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  let shipping=meta.querySelector('[data-free-shipping]');
  if(!shipping){shipping=document.createElement('span');shipping.className='tag';shipping.dataset.freeShipping='true';meta.appendChild(shipping)}
  setText(shipping,shippingText());
  let wholesale=meta.querySelector('[data-wholesale-only]');
  if(!wholesale){wholesale=document.createElement('span');wholesale.className='tag';wholesale.dataset.wholesaleOnly='true';meta.appendChild(wholesale)}
  setText(wholesale,wholesaleText());
}

function makeSizesStatic(){
  document.querySelectorAll('button[data-size]').forEach(button=>{
    const span=document.createElement('span');span.className='chip';span.textContent=button.textContent||'';span.setAttribute('aria-label','سایز '+(button.textContent||''));button.replaceWith(span)
  })
}

function removeOrderingUI(){
  ['#order','#copyOrder','#sticky','[data-order-ui]'].forEach(selector=>document.querySelectorAll(selector).forEach(x=>x.remove()));
  document.querySelectorAll('.features li').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  document.querySelectorAll('#root a,#root button').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  makeSizesStatic();
}

function suppressExpectedSwNoise(){
  try{
    if(typeof reportError!=='function'||reportError.__policyWrapped)return;
    const base=reportError;
    const wrapped=function(message,context={}){const text=String(message||'');if(context?.stage==='sw'&&/^(Rejected|NotAllowedError|SecurityError)$/i.test(text.trim()))return;return base(message,context)};
    wrapped.__policyWrapped=true;reportError=wrapped
  }catch{}
}

let queued=false;
function apply(){queued=false;ensureCatalogHighlights();ensureProductHighlights();removeOrderingUI();suppressExpectedSwNoise()}
function schedule(){if(queued)return;queued=true;queueMicrotask(apply)}
function boot(){
  apply();
  const target=document.querySelector('.shell')||document.body;
  if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('online',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();