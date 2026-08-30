(()=>{
const BUILD='admin-ui-v3';
function byId(id){return document.getElementById(id)}
function adminToast(text,type='ok'){
  let el=byId('adminActionToast');
  if(!el){el=document.createElement('div');el.id='adminActionToast';el.className='admin-action-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
  el.textContent=text;el.className='admin-action-toast show '+type;clearTimeout(adminToast.t);adminToast.t=setTimeout(()=>el.className='admin-action-toast',2200)
}
async function runBusy(btn,fn){if(btn?.dataset.busy==='1')return;const old=btn?.textContent;try{if(btn){btn.dataset.busy='1';btn.disabled=true;btn.setAttribute('aria-busy','true')}return await fn()}catch(e){adminToast(e?.message||'عملیات انجام نشد','err');try{reportAdminError?.(e?.message||String(e),{stage:'button',button:btn?.id||btn?.dataset?.edit||btn?.dataset?.feature||BUILD})}catch{}throw e}finally{if(btn){delete btn.dataset.busy;btn.disabled=false;btn.removeAttribute('aria-busy');if(old!=null&&btn.textContent==='…')btn.textContent=old}}}
function ensurePreviewModal(){let m=byId('previewModal');if(m)return m;m=document.createElement('div');m.id='previewModal';m.className='modal hide preview-modal';m.innerHTML='<div class="sheet preview-sheet"><div class="sheethead row between"><b>پیش‌نمایش محصول</b><button id="closePreviewModal" type="button" class="btn sm">بستن</button></div><iframe id="previewFrame" title="پیش‌نمایش محصول" sandbox="allow-same-origin"></iframe></div>';document.body.appendChild(m);byId('closePreviewModal').onclick=()=>m.classList.add('hide');m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hide')});return m}
previewById=function(id){const p=products.find(x=>x.id===id);if(!p){adminToast('محصول پیدا نشد','err');return}const m=ensurePreviewModal(),f=byId('previewFrame');f.srcdoc=previewHtml(p);m.classList.remove('hide')};
downloadJson=async function(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');try{a.href=url;a.download=name||'modland-backup.json';a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();adminToast('فایل بکاپ آماده شد')}finally{setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1800)}};
async function fetchBackupSnapshot(id){const rows=await api('/rest/v1/catalog_backups?select=snapshot&id=eq.'+encodeURIComponent(id)+'&limit=1');if(!rows?.[0]?.snapshot)throw Error('بکاپ پیدا نشد');return rows[0].snapshot}
async function undoActivity(id){await api('/rest/v1/rpc/undo_admin_activity',{method:'POST',body:{p_log_id:id},prefer:'return=minimal'});await loadData();byId('refreshHistory')?.click();adminToast('تغییر برگردانده شد')}
function interceptDynamicButtons(){document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;let fn=null;
  if(b.dataset.edit)fn=()=>openProduct(b.dataset.edit);
  else if(b.dataset.preview)fn=()=>previewById(b.dataset.preview);
  else if(b.dataset.dupe)fn=async()=>{await duplicateById(b.dataset.dupe);adminToast('نسخه کپی ساخته شد')};
  else if(b.dataset.toggle)fn=()=>quickToggle(b.dataset.toggle);
  else if(b.dataset.catEdit)fn=()=>openCat(b.dataset.catEdit);
  else if(b.dataset.feature)fn=()=>setFeatured(b.dataset.feature);
  else if(b.dataset.vis)fn=()=>toggleMedia(b.dataset.vis);
  else if(b.dataset.up)fn=()=>moveMedia(b.dataset.up,-1);
  else if(b.dataset.down)fn=()=>moveMedia(b.dataset.down,1);
  else if(b.dataset.delmedia)fn=()=>deleteMedia(b.dataset.delmedia);
  else if(b.dataset.dl)fn=async()=>downloadJson(await fetchBackupSnapshot(b.dataset.dl),'modland-backup-'+new Date().toISOString().slice(0,10)+'.json');
  else if(b.dataset.restore)fn=async()=>restoreSnapshot(await fetchBackupSnapshot(b.dataset.restore));
  else if(b.dataset.rmb)fn=async()=>{if(!confirm('این بکاپ حذف شود؟'))return;await api('/rest/v1/catalog_backups?id=eq.'+encodeURIComponent(b.dataset.rmb),{method:'DELETE',prefer:'return=minimal'});await renderBackups();adminToast('بکاپ حذف شد')};
  else if(b.dataset.undo)fn=()=>undoActivity(b.dataset.undo);
  if(!fn)return;e.preventDefault();e.stopImmediatePropagation();Promise.resolve(runBusy(b,fn)).catch(()=>{})
},true)}
function fixStaticButtons(){
  const typeButton=['iosInstallAdmin','logout','selectAll','newProduct','bulkUp','bulkDown','bulkPublish','bulkDraft','bulkClear','refreshAnalytics','makeBackup','downloadCurrent','newCat','closeProduct','previewProduct','copyProductLink','duplicateProduct','deleteProduct','closeCat','deleteCat'];typeButton.forEach(id=>{const b=byId(id);if(b)b.type='button'});
  const preview=byId('previewProduct');if(preview)preview.onclick=()=>{if(current?.id)previewById(current.id);else adminToast('اول محصول را ذخیره کن','err')};
  const dl=byId('downloadCurrent');if(dl)dl.onclick=()=>runBusy(dl,async()=>downloadJson(await makeSnapshot(),'modland-backup-'+new Date().toISOString().slice(0,10)+'.json')).catch(()=>{});
  const analytics=byId('refreshAnalytics');if(analytics)analytics.onclick=()=>runBusy(analytics,loadAnalytics).catch(()=>{});
  const backup=byId('makeBackup');if(backup)backup.onclick=()=>runBusy(backup,async()=>{await serverBackup('manual');await renderBackups();adminToast('بکاپ سرور ساخته شد')}).catch(()=>{});
}
function fixProductSubmit(){const form=byId('productForm');if(!form)return;form.onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,id=f.elements.id.value,saveBtn=f.querySelector('button:not([type]),button[type="submit"]');const body={code:f.elements.code.value.trim(),name:f.elements.name.value.trim(),brand:f.elements.brand.value.trim()||null,category_id:f.elements.category_id.value||null,price_toman:f.elements.price_toman.value?Number(f.elements.price_toman.value):null,old_price_toman:f.elements.old_price_toman.value?Number(f.elements.old_price_toman.value):null,sizes:f.elements.sizes.value.split(',').map(x=>x.trim()).filter(Boolean),stock_status:f.elements.stock_status.value.trim()||'موجود',stock_note:f.elements.stock_note.value.trim()||null,badge:f.elements.badge.value.trim()||null,is_featured:!!f.elements.is_featured?.checked,sort_order:Number(f.elements.sort_order.value||0),shipping_text:f.elements.shipping_text.value.trim()||null,order_button:f.elements.order_button.value.trim()||null,order_message:f.elements.order_message.value.trim()||null,description:f.elements.description.value.trim()||null,features:f.elements.features.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),size_guide:f.elements.size_guide.value.trim()||null,is_published:f.elements.is_published.checked};
    try{if(saveBtn){saveBtn.disabled=true;saveBtn.setAttribute('aria-busy','true')}msg(byId('productMsg'),'در حال ذخیره…');let d;if(id)d=await api('/rest/v1/products?id=eq.'+encodeURIComponent(id),{method:'PATCH',body,prefer:'return=representation'});else d=await api('/rest/v1/products',{method:'POST',body,prefer:'return=representation'});current=(d||[])[0]||current;formVal(f,'id',current?.id||id);await loadData();if(current?.id){current=products.find(x=>x.id===current.id)||current;currentMedia=media.filter(m=>m.product_id===current.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));renderMedia()}msg(byId('productMsg'),'ذخیره شد','ok');adminToast('محصول ذخیره شد')}
    catch(err){msg(byId('productMsg'),err.message,'err');adminToast(err.message,'err')}
    finally{if(saveBtn){saveBtn.disabled=false;saveBtn.removeAttribute('aria-busy')}}
  }}
function hardenMediaButtons(){if(typeof renderMedia!=='function')return;const old=renderMedia;renderMedia=function(){old();const items=[...document.querySelectorAll('[data-media]')];items.forEach((el,i)=>{const up=el.querySelector('[data-up]'),down=el.querySelector('[data-down]');if(up){up.type='button';up.disabled=i===0}if(down){down.type='button';down.disabled=i===items.length-1}el.querySelectorAll('button').forEach(b=>b.type='button')})}}
function refreshServiceWorker(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register('./sw.js?v=11',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{})}
function boot(){ensurePreviewModal();hardenMediaButtons();fixStaticButtons();fixProductSubmit();interceptDynamicButtons();refreshServiceWorker();try{renderProducts();renderCats();if(current)renderMedia()}catch{}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();