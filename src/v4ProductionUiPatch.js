// FIFA GROUP - V4 production UI patch
// UI-only patch. Does not change Firebase, Google Sheets, tournaments, transfers, or data logic.
// Safe scope: splash text cleanup + bottom navigation only. No menu/page runtime scanning.

const styleText = `
:root{
  --v4-bg:#02030A;
  --v4-panel:rgba(5,10,22,.94);
  --v4-line:rgba(255,255,255,.10);
  --v4-green:#00E676;
  --v4-green2:#00B84C;
  --v4-cyan:#00D4FF;
  --v4-text:#EDF0FF;
  --v4-muted:#9BA0C0;
}

body #root,
body #root *{font-family:'Tajawal',system-ui,sans-serif!important}
body .mainNav,
body .mainNav *,
body .forceBottomNav,
body .forceBottomNav *{font-family:'Tajawal',system-ui,sans-serif!important}
body #fifa-splash .fifa-splash-title,
body #fifa-splash .fifa-splash-title *,
body #fifa-splash .fifa-splash-season{
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-variant-ligatures:none!important;
  text-rendering:geometricPrecision!important;
  -webkit-font-smoothing:antialiased!important;
}

/* Portal bottom navigation: direct body-level targeting */
body .bottomNavPortalCurtain,
body .forceBottomCurtain{
  height:calc(76px + env(safe-area-inset-bottom))!important;
  max-height:calc(76px + env(safe-area-inset-bottom))!important;
  bottom:0!important;
  top:auto!important;
  background:linear-gradient(to top,rgba(2,3,10,.88),rgba(2,3,10,.38) 56%,rgba(2,3,10,0) 100%)!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  filter:none!important;
  pointer-events:none!important;
}
body .mainNav,
body .mainNav.glassSoft,
body .mainNav.forceBottomNav,
body .forceBottomNav{
  position:fixed!important;
  width:min(94vw,520px)!important;
  max-width:520px!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  padding:8px!important;
  border-radius:26px!important;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:6px!important;
  align-items:center!important;
  justify-items:stretch!important;
  overflow:visible!important;
  box-sizing:border-box!important;
  background:radial-gradient(circle at 50% -18%,rgba(0,230,118,.14),transparent 55%),linear-gradient(135deg,rgba(4,5,14,.97),rgba(4,10,20,.92))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  box-shadow:0 22px 70px rgba(0,0,0,.55),0 0 28px rgba(0,230,118,.08),inset 0 1px 0 rgba(255,255,255,.12)!important;
  backdrop-filter:blur(28px) saturate(160%)!important;
  -webkit-backdrop-filter:blur(28px) saturate(160%)!important;
  z-index:2147483601!important;
}
body .mainNav::before,
body .forceBottomNav::before{
  content:''!important;
  position:absolute!important;
  top:0!important;
  left:20px!important;
  right:20px!important;
  height:1px!important;
  background:linear-gradient(90deg,transparent,var(--v4-green),var(--v4-cyan),transparent)!important;
  opacity:.48!important;
  pointer-events:none!important;
}
body .mainNav .navBtn,
body .forceBottomNav .navBtn,
body .navBtn{
  min-width:0!important;
  width:100%!important;
  height:56px!important;
  min-height:56px!important;
  max-height:56px!important;
  margin:0!important;
  padding:5px 3px 4px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:3px!important;
  border-radius:19px!important;
  border:1px solid transparent!important;
  color:var(--v4-muted)!important;
  background:transparent!important;
  overflow:visible!important;
  transform:none!important;
  scale:1!important;
  box-sizing:border-box!important;
  transition:background .16s ease,border-color .16s ease,color .16s ease!important;
}
body .mainNav .navBtn *,
body .forceBottomNav .navBtn *,
body .navBtn *{transform:none!important;scale:1!important;animation:none!important}
body .mainNav .navBtn:active,
body .forceBottomNav .navBtn:active,
body .navBtn:active{transform:none!important;scale:1!important}
body .mainNav .navBtn.active,
body .forceBottomNav .navBtn.active,
body .navBtn.active{
  background:linear-gradient(135deg,rgba(0,230,118,.16),rgba(0,212,255,.08))!important;
  border-color:rgba(0,230,118,.26)!important;
  color:var(--v4-green)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 18px rgba(0,230,118,.10)!important;
}
body .mainNav .navIcon,
body .forceBottomNav .navIcon,
body .navBtn .navIcon,
body .mainNav .navBtn svg,
body .forceBottomNav .navBtn svg,
body .mainNav .navBtn img,
body .forceBottomNav .navBtn img{
  flex:0 0 22px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:22px!important;
  height:22px!important;
  min-width:22px!important;
  min-height:22px!important;
  max-width:22px!important;
  max-height:22px!important;
  line-height:22px!important;
  font-size:21px!important;
  overflow:visible!important;
  transform:none!important;
  scale:1!important;
}
body .mainNav .navBtn.active .navIcon,
body .forceBottomNav .navBtn.active .navIcon,
body .navBtn.active .navIcon,
body .mainNav .navBtn.active svg,
body .forceBottomNav .navBtn.active svg,
body .mainNav .navBtn.active img,
body .forceBottomNav .navBtn.active img{
  width:22px!important;
  height:22px!important;
  min-width:22px!important;
  min-height:22px!important;
  max-width:22px!important;
  max-height:22px!important;
  font-size:21px!important;
  transform:none!important;
  scale:1!important;
  filter:drop-shadow(0 0 7px rgba(0,230,118,.35))!important;
}
body .mainNav .navLabel,
body .forceBottomNav .navLabel,
body .navBtn .navLabel{
  display:block!important;
  width:100%!important;
  max-width:100%!important;
  height:11px!important;
  min-height:11px!important;
  max-height:11px!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  white-space:nowrap!important;
  text-align:center!important;
  line-height:11px!important;
  font-size:9.5px!important;
  font-weight:900!important;
  color:inherit!important;
  transform:none!important;
  scale:1!important;
}
body #root .app,
body #root .app.iosSafeApp{padding-bottom:92px!important}

/* Loading screen copy cleanup */
body #fifa-splash p,
body #fifa-splash .fifaSplashSub,
body #fifa-splash [class*="Sub"],
body #fifa-splash [class*="subtitle"]{
  font-size:0!important;
  color:transparent!important;
  line-height:0!important;
}
body #fifa-splash p::after,
body #fifa-splash .fifaSplashSub::after,
body #fifa-splash [class*="Sub"]::after,
body #fifa-splash [class*="subtitle"]::after{
  content:'SEASON 6 · 2025'!important;
  display:block!important;
  font-family:'Orbitron','Tajawal',sans-serif!important;
  font-size:10px!important;
  line-height:1.6!important;
  letter-spacing:1.8px!important;
  color:var(--v4-muted)!important;
  -webkit-text-fill-color:var(--v4-muted)!important;
}

@media(max-width:520px){
  body .mainNav,
  body .mainNav.glassSoft,
  body .mainNav.forceBottomNav,
  body .forceBottomNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
  }
}
`;

const annoyingTexts = [
  'جاري تحميل السجلات من جوجل شيت',
  'جاري تحميل السجلات من Google Sheets',
  'جاري تحميل السجلات من Google Sheet',
  'تحميل السجلات من جوجل شيت',
  'Google Sheets',
  'جوجل شيت'
];

function injectPatch(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-production-ui-patch');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-production-ui-patch';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = styleText;
  (document.body || document.documentElement).appendChild(style);
}

function cleanLoadingText(){
  if (typeof document === 'undefined' || !document.body) return;
  const nodes = document.body.querySelectorAll('p,span,small,div,h1,h2,h3');
  nodes.forEach((node)=>{
    const text = (node.textContent || '').trim();
    if (!text) return;
    if (annoyingTexts.some((item)=>text.includes(item))){
      node.textContent = text.replace(/جاري تحميل السجلات من جوجل شيت|جاري تحميل السجلات من Google Sheets|جاري تحميل السجلات من Google Sheet|تحميل السجلات من جوجل شيت|Google Sheets|جوجل شيت/g,'').trim();
      if (!node.textContent.trim()) node.style.display = 'none';
    }
  });
}

function boot(){
  injectPatch();
  cleanLoadingText();
  window.setTimeout(cleanLoadingText,80);
  window.setTimeout(cleanLoadingText,250);
  window.setTimeout(cleanLoadingText,900);
}

if (typeof window !== 'undefined'){
  window.addEventListener('load',boot,{once:true});
  window.requestAnimationFrame(boot);
}
