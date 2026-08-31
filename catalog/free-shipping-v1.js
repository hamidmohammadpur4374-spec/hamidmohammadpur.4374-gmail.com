(()=>{
const TEXT='ارسال رایگان به سراسر کشور';
function setText(el){if(!el)return;if(el.textContent!==TEXT)el.textContent=TEXT;if(el.hidden)el.hidden=false}
function applyFreeShipping(){
  setText(document.getElementById('shippingPill'));
  setText(document.getElementById('footerNote'));
  const infoPanel=document.querySelector('.panel .title')?.closest('.panel');
  const meta=infoPanel?.querySelector('.meta');
  if(meta){
    let badge=meta.querySelector('[data-free-shipping]');
    if(!badge){badge=document.createElement('span');badge.className='tag';badge.dataset.freeShipping='true';meta.appendChild(badge)}
    if(badge.textContent!==TEXT)badge.textContent=TEXT;
  }
}
let queued=false;
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyFreeShipping()})}
function boot(){applyFreeShipping();const target=document.querySelector('.shell')||document.body;if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();