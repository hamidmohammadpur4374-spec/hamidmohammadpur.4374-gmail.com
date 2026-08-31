(()=>{
const TEXT='ارسال رایگان به سراسر کشور';
function applyFreeShipping(){
  const pill=document.getElementById('shippingPill');
  if(pill){pill.textContent=TEXT;pill.hidden=false}
  const footer=document.getElementById('footerNote');
  if(footer){footer.textContent=TEXT;footer.hidden=false}
  const infoPanel=document.querySelector('.panel .title')?.closest('.panel');
  const meta=infoPanel?.querySelector('.meta');
  if(meta&&!meta.querySelector('[data-free-shipping]')){
    const badge=document.createElement('span');
    badge.className='tag';
    badge.dataset.freeShipping='true';
    badge.textContent=TEXT;
    meta.appendChild(badge);
  }
}
let queued=false;
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;applyFreeShipping()})}
const root=document.getElementById('root');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyFreeShipping,{once:true});else applyFreeShipping();
})();