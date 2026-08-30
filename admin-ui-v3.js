(()=>{
const BUILD='admin-ui-v4';
function byId(id){return document.getElementById(id)}
function nowLabel(){try{return new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch{return new Date().toLocaleTimeString()}}
function adminToast(text,type='ok'){
  let el=byId('adminActionToast');
  if(!el){el=document.createElement('div');el.id='adminActionToast';el.className='admin-action-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
  el.textContent=text;el.className='admin-action-toast show '+type;clearTimeout(adminToast.t);adminToast.t=setTimeout(()=>el.className='admin-action-toast',2400)
}
function refreshStamp(buttonId,text){const b=byId(buttonId);if(!b)return;let s=byId(buttonId+'Stamp');if(!s){s=document.createElement('span');s.id=buttonId+'Stamp';s.className='muted small';s.style.whiteSpace='nowrap';b.insertAdjacentElement('afterend',s)}s.textContent=text}
async function runBusy(btn,fn){if(btn?.dataset.busy==='1')return;const old=btn?.textContent;try{if(btn){btn.dataset.busy='1';btn.disabled=true;btn.setAttribute('aria-busy','true');btn.textContent=btn.dataset.busyText||'در حال…'}return await fn()}catch(e){adminToast(e?.message||'عملیات انجام نشد','err');try{reportAdminError?.(e?.message||String(e),{stage:'button',button:btn?.id||btn?.dataset?.edit||btn?.dataset?.feature||BUILD})}catch{}throw e}finally{if(btn){delete btn.dataset.busy;btn.disabled=false;btn.removeAttribute('aria-busy');if(old!=null)btn.textContent=old}}}
function ensurePreviewModal(){let m=byId('previewModal');if(m)return m;m=document.createElement('div');m.id='previewModal';m.className='modal hide preview-modal';m.innerHTML='<div class="sheet preview-sheet"><div class="sheethead row between"><b>پیش‌نمایش محصول</b><button id="closePreviewModal" type="button" class="btn sm">بستن</button></div><iframe id="previewFrame" title="پیش‌نمایش محصول" sandbox="allow-same-origin"></iframe></div>';document.body.appendChild(m);byId('closePreviewModal').onclick=()=>m.classList.add('hide');m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hide')});return m}
previewById=function(id){const p=products.find(x=>x.id===id);if(!p){adminToast('محصول پیدا نشد','err');return}const m=ensurePreviewModal(),f=byId('previewFrame');f.srcdoc=previewHtml(p);m.classList.remove('hide')};
downloadJson=async function(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');try{a.href=url;a.download=name||'modland-backup.json';a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();adminToast('فایل بکاپ آماده شد')}finally{setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1800)}};
async function fetchBackupSnapshot(id){const rows=await api('/rest/v1/catalog_backups?select=snapshot&id=eq.'+encodeURIComponent(id)+'&limit=1');if(!rows?.[0]?.snapshot)throw Error('بکاپ پیدا نشد');return rows[0].snapshot}
async function undoActivity(id){await api('/rest/v1/rpc/undo_admin_activity',{method:'POST',body:{p_log_id:id},prefer:'return=minimal'});await loadData();await refreshHistoryDirect();adminToast('تغییر برگردانده شد')}
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
async function refreshAnalyticsDirect(){
  const d=await api('/rest/v1/rpc/get_admin_analytics',{method:'POST',body:{p_days:30}}),views=Number(d?.product_views||0),orders=Number(d?.order_clicks||0),conv=views?Math.round(orders/views*100):0;
  const grid=byId('statGrid');if(!grid)throw Error('بخش آمار پیدا نشد');
  grid.innerHTML=[['بازدید کاتالوگ',d?.catalog_views||0],['بازدید محصول',views],['کلیک سفارش',orders],['اشتراک‌گذاری',d?.shares||0],['نرخ تبدیل',conv+'٪']].map(x=>`<div class="stat"><b>${fa(x[1])}</b><small>${x[0]}</small></div>`).join('');
  if(typeof renderBars==='function'){
    renderBars(byId('topProducts'),(d?.top_products||[]).map(x=>[x.key,Number(x.count)]));
    renderBars(byId('topSearches'),(d?.top_searches||[]).map(x=>[x.key,Number(x.count)]));
  }
  const t=nowLabel();refreshStamp('refreshAnalytics','آخرین بروزرسانی: '+t);adminToast('آمار به‌روز شد · '+t);return d
}
const entityLabel={products:'محصول',product_media:'رسانه',categories:'دسته',store_profile:'فروشگاه',catalog_preferences:'ظاهر'},actionLabel={INSERT:'ایجاد',UPDATE:'ویرایش',DELETE:'حذف'};
function groupHistory(logs){const groups=new Map;for(const x of logs||[]){const key=x.transaction_id?`tx:${x.transaction_id}`:`id:${x.id}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}return [...groups.values()].map(g=>g.sort((a,b)=>Number(b.sequence_no||0)-Number(a.sequence_no||0))).sort((a,b)=>new Date(b[0]?.created_at||0)-new Date(a[0]?.created_at||0))}
async function refreshHistoryDirect(){
  const history=byId('historyList'),errors=byId('errorList');if(!history||!errors)throw Error('بخش تاریخچه هنوز آماده نشده');
  const [logs,errs]=await Promise.all([
    api('/rest/v1/admin_activity_log?select=id,action,entity_type,entity_id,entity_code,created_at,undone_at,transaction_id,sequence_no&order=created_at.desc&limit=120'),
    api('/rest/v1/app_errors?select=id,source,message,created_at&order=created_at.desc&limit=40')
  ]);
  const groups=groupHistory(logs);
  history.innerHTML=groups.length?groups.map(g=>{const x=g[0],undone=g.every(z=>z.undone_at),label=g.length>1?`عملیات گروهی · ${fa(g.length)} تغییر`:`${actionLabel[x.action]||x.action} ${entityLabel[x.entity_type]||x.entity_type}`,codes=[...new Set(g.map(z=>z.entity_code||z.entity_id).filter(Boolean))].slice(0,3).map(esc).join('، '),irreversible=g.length===1&&x.entity_type==='product_media'&&x.action==='DELETE';return `<div class="backup"><div><b>${label}</b><div class="meta">${codes||'—'} · ${new Date(x.created_at).toLocaleString('fa-IR')}${undone?' · Undo شده':''}${irreversible?' · فایل Storage حذف دائمی شده':''}</div></div><div class="actions">${!undone&&!irreversible?`<button type="button" class="btn sm" data-undo="${x.id}">Undo</button>`:undone?'<span class="muted small">برگردانده شد</span>':'<span class="muted small">غیرقابل Undo</span>'}</div></div>`}).join(''):'<div class="muted small" style="padding:16px">هنوز تغییری ثبت نشده است.</div>';
  errors.innerHTML=(errs||[]).length?errs.map(x=>`<div class="backup"><div><b>${esc(x.source)}</b><div class="meta">${new Date(x.created_at).toLocaleString('fa-IR')}</div><div class="small" style="margin-top:5px;direction:ltr;text-align:left;word-break:break-word">${esc(x.message)}</div></div></div>`).join(''):'<div class="muted small" style="padding:16px">خطای ثبت‌شده‌ای وجود ندارد.</div>';
  const t=nowLabel();refreshStamp('refreshHistory','آخرین بروزرسانی: '+t);adminToast(`تاریخچه به‌روز شد · ${fa((logs||[]).length)} رکورد · ${t}`);return{logs,errs}
}
function wireRefreshButtons(){
  const analytics=byId('refreshAnalytics');if(analytics&&!analytics.dataset.directRefresh){analytics.type='button';analytics.dataset.directRefresh='1';analytics.dataset.busyText='در حال بروزرسانی…';analytics.onclick=e=>{e.preventDefault();runBusy(analytics,refreshAnalyticsDirect).catch(()=>{})}}
  const history=byId('refreshHistory');if(history&&!history.dataset.directRefresh){history.type='button';history.dataset.directRefresh='1';history.dataset.busyText='در حال بروزرسانی…';history.onclick=e=>{e.preventDefault();runBusy(history,refreshHistoryDirect).catch(()=>{})}}
}
function fixStaticButtons(){
  const typeButton=['iosInstallAdmin','logout','selectAll','newProduct','bulkUp','bulkDown','bulkPublish','bulkDraft','bulkClear','refreshAnalytics','refreshHistory','clearOldErrors','makeBackup','downloadCurrent','newCat','closeProduct','previewProduct','copyProductLink','duplicateProduct','deleteProduct','closeCat','deleteCat'];typeButton.forEach(id=>{const b=byId(id);if(b)b.type='button'});
  const preview=byId('previewProduct');if(preview)preview.onclick=()=>{if(current?.id)previewById(current.id);else adminToast('اول محصول را ذخیره کن','err')};
  const dl=byId('downloadCurrent');if(dl)dl.onclick=()=>runBusy(dl,async()=>downloadJson(await makeSnapshot(),'modland-backup-'+new Date().toISOString().slice(0,10)+'.json')).catch(()=>{});
  const backup=byId('makeBackup');if(backup)backup.onclick=()=>runBusy(backup,async()=>{await serverBackup('manual');await renderBackups();adminToast('بکاپ سرور ساخته شد')}).catch(()=>{});
  wireRefreshButtons();
}
function fixProductSubmit(){const form=byId('productForm');if(!form)return;form.onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,id=f.elements.id.value,saveBtn=f.querySelector('button:not([type]),button[type="submit"]');const body={code:f.elements.code.value.trim(),name:f.elements.name.value.trim(),brand:f.elements.brand.value.trim()||null,category_id:f.elements.category_id.value||null,price_toman:f.elements.price_toman.value?Number(f.elements.price_toman.value):null,old_price_toman:f.elements.old_price_toman.value?Number(f.elements.old_price_toman.value):null,sizes:f.elements.sizes.value.split(',').map(x=>x.trim()).filter(Boolean),stock_status:f.elements.stock_status.value.trim()||'موجود',stock_note:f.elements.stock_note.value.trim()||null,badge:f.elements.badge.value.trim()||null,is_featured:!!f.elements.is_featured?.checked,sort_order:Number(f.elements.sort_order.value||0),shipping_text:f.elements.shipping_text.value.trim()||null,order_button:f.elements.order_button.value.trim()||null,order_message:f.elements.order_message.value.trim()||null,description:f.elements.description.value.trim()||null,features:f.elements.features.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),size_guide:f.elements.size_guide.value.trim()||null,is_published:f.elements.is_published.checked};
    try{if(saveBtn){saveBtn.disabled=true;saveBtn.setAttribute('aria-busy','true')}msg(byId('productMsg'),'در حال ذخیره…');let d;if(id)d=await api('/rest/v1/products?id=eq.'+encodeURIComponent(id),{method:'PATCH',body,prefer:'return=representation'});else d=await api('/rest/v1/products',{method:'POST',body,prefer:'return=representation'});current=(d||[])[0]||current;formVal(f,'id',current?.id||id);await loadData();if(current?.id){current=products.find(x=>x.id===current.id)||current;currentMedia=media.filter(m=>m.product_id===current.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));renderMedia()}msg(byId('productMsg'),'ذخیره شد','ok');adminToast('محصول ذخیره شد')}
    catch(err){msg(byId('productMsg'),err.message,'err');adminToast(err.message,'err')}
    finally{if(saveBtn){saveBtn.disabled=false;saveBtn.removeAttribute('aria-busy')}}
  }}
function hardenMediaButtons(){if(typeof renderMedia!=='function')return;const old=renderMedia;renderMedia=function(){old();const items=[...document.querySelectorAll('[data-media]')];items.forEach((el,i)=>{const up=el.querySelector('[data-up]'),down=el.querySelector('[data-down]');if(up){up.type='button';up.disabled=i===0}if(down){down.type='button';down.disabled=i===items.length-1}el.querySelectorAll('button').forEach(b=>b.type='button')})}}
function refreshServiceWorker(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register('./sw.js?v=12',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{})}
function boot(){ensurePreviewModal();hardenMediaButtons();fixStaticButtons();fixProductSubmit();interceptDynamicButtons();refreshServiceWorker();const mo=new MutationObserver(()=>wireRefreshButtons());mo.observe(document.body,{childList:true,subtree:true});try{renderProducts();renderCats();if(current)renderMedia()}catch{}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();