// FIFA GROUP — Unified Header Normalizer v6.0
// يوحّد تصميم header.pageHead لكل الصفحات عبر JS fallback.
// CSS (unified-page-headers.css) هو المصدر الأساسي — هذا الملف fallback فقط للحالات التي
// لا تلتقطها CSS selectors (مثل صفحات يتم تحميلها بشكل ديناميكي).

const FG_PH_STYLE = `
/* Patch injected by unifiedPageHeadersPatch.js — متوافق مع unified-page-headers.css */
.fg-real-page-header{
  position:relative!important;overflow:hidden!important;width:100%!important;
  min-height:var(--ph-h,180px)!important;box-sizing:border-box!important;
  padding:0 var(--ph-px,22px)!important;margin-bottom:18px!important;
  border-radius:var(--ph-radius,26px)!important;
  display:flex!important;flex-direction:column!important;
  align-items:flex-end!important;justify-content:center!important;
  gap:10px!important;text-align:right!important;
  background:
    radial-gradient(ellipse at 88% -10%,rgba(0,230,118,.20),transparent 46%),
    radial-gradient(ellipse at 5% 110%,rgba(0,212,255,.09),transparent 44%),
    radial-gradient(ellipse at 50% 60%,rgba(168,85,247,.09),transparent 54%),
    linear-gradient(150deg,rgba(3,9,22,.97),rgba(2,5,15,.95))!important;
  border:1px solid rgba(0,230,118,.24)!important;
  box-shadow:0 2px 1px rgba(255,255,255,.05) inset,0 14px 40px rgba(0,0,0,.44),0 0 28px rgba(0,230,118,.12)!important;
}
.fg-real-page-header::before{
  content:""!important;position:absolute!important;inset:0!important;
  pointer-events:none!important;border-radius:inherit!important;
  background:
    linear-gradient(108deg,transparent 30%,rgba(255,255,255,.032) 50%,transparent 70%),
    radial-gradient(ellipse at 15% 8%,rgba(168,85,247,.07),transparent 38%)!important;
}
.fg-real-page-header::after{
  content:""!important;position:absolute!important;
  bottom:22px!important;right:var(--ph-px,22px)!important;
  width:44px!important;height:3px!important;border-radius:999px!important;
  background:linear-gradient(90deg,#00E676,#00D4FF)!important;
  box-shadow:0 0 18px rgba(0,230,118,.40)!important;pointer-events:none!important;
}
.fg-real-page-title{
  position:relative!important;z-index:1!important;width:100%!important;
  margin:0!important;padding:0!important;
  font-family:var(--fg-font,'Tajawal',system-ui,sans-serif)!important;
  font-size:var(--ph-title-sz,clamp(26px,6.5vw,36px))!important;
  font-weight:900!important;line-height:1.12!important;
  color:#00E676!important;-webkit-text-fill-color:#00E676!important;
  background:none!important;text-align:right!important;
  text-shadow:0 0 32px rgba(0,230,118,.14)!important;
}
.fg-real-page-title::after{display:none!important;content:none!important}
.fg-real-page-subtitle{
  position:relative!important;z-index:1!important;width:100%!important;
  max-width:none!important;margin:0!important;padding:0!important;
  font-family:var(--fg-font,'Tajawal',system-ui,sans-serif)!important;
  font-size:var(--ph-sub-sz,13px)!important;font-weight:700!important;
  line-height:1.60!important;color:#9BA0C0!important;text-align:right!important;
}
.fg-real-page-header img{display:none!important}
`;

function fgSet(el, prop, val){
  if(el && el.style) el.style.setProperty(prop, val, 'important');
}

function fgApplyPageHead(header){
  if(!header || header.dataset.fgPatched) return;
  header.dataset.fgPatched = '1';
  header.classList.add('fg-real-page-header');

  // عنوان الصفحة
  const titleEl = header.querySelector('h1,h2,h3');
  if(titleEl){
    titleEl.classList.add('fg-real-page-title');
  }

  // النص الفرعي
  Array.from(header.querySelectorAll('p')).slice(0,2).forEach(el=>{
    el.classList.add('fg-real-page-subtitle');
  });
}

function fgPatchAllHeaders(){
  if(typeof document==='undefined') return;
  document.querySelectorAll('header.pageHead,.membersHomeHead,.seasonHubHero').forEach(fgApplyPageHead);
}

function fgInjectStyle(){
  if(typeof document==='undefined') return;
  const old = document.getElementById('fg-ph-patch-style');
  if(old) return; // لا تعيد الحقن
  const st = document.createElement('style');
  st.id = 'fg-ph-patch-style';
  st.textContent = FG_PH_STYLE;
  (document.head || document.documentElement).appendChild(st);
}

function fgBoot(){
  fgInjectStyle();
  fgPatchAllHeaders();
  requestAnimationFrame(fgPatchAllHeaders);
  [100, 400, 900, 1800].forEach(ms=>setTimeout(fgPatchAllHeaders, ms));

  if(!window.__fgPhObserver){
    window.__fgPhObserver = true;
    new MutationObserver(()=>requestAnimationFrame(fgPatchAllHeaders))
      .observe(document.documentElement, {childList:true, subtree:true});
  }
}

if(typeof window!=='undefined'){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', fgBoot, {once:true});
  } else {
    fgBoot();
  }
  window.addEventListener('load', fgPatchAllHeaders, {once:true});
}
