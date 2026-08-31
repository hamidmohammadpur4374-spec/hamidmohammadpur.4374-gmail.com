(()=>{
const FREE_SHIPPING=/^ارسال\s*رایگان(?:\s*به\s*سراسر\s*کشور)?$/i;
const ORDER_WORDS=/ثبت\s*سفارش|سفارش|خرید|ارسال|موجودی|^موجود$/i;
function isOrderText(value){const text=(value||'').trim();return !!text&&!FREE_SHIPPING.test(text)&&ORDER_WORDS.test(text)}
function staticSizes(){
  document.querySelectorAll('button[data-size]').forEach(button=>{
    const span=document.createElement('span');
    span.className='chip';
    span.textContent=button.textContent||'';
    span.setAttribute('aria-label','سایز '+(button.textContent||''));
    button.replaceWith(span);
  });
}
function removeOrderUi(){
  ['#order','#copyOrder','#sticky','[data-order-ui]'].forEach(selector=>document.querySelectorAll(selector).forEach(x=>x.remove()));
  const infoPanel=document.querySelector('.panel .title')?.closest('.panel');
  if(infoPanel){
    infoPanel.querySelectorAll('.meta .tag').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
    infoPanel.querySelectorAll('.txt').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  }
  document.querySelectorAll('.features li').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  document.querySelectorAll('#root a,#root button').forEach(x=>{if(isOrderText(x.textContent))x.remove()});
  staticSizes();
}
let queued=false;
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;removeOrderUi()})}
const root=document.getElementById('root');
if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeOrderUi,{once:true});else removeOrderUi();
})();