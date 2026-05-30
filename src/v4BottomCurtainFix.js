// FIFA GROUP - Bottom nav curtain fix
// UI-only: keeps the bottom-bar shadow/gradient from covering member cards/images.

const bottomCurtainFixCss = `
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
  overflow:visible!important;
}
`;

function injectBottomCurtainFix(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-bottom-curtain-fix');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-bottom-curtain-fix';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = bottomCurtainFixCss;
  (document.body || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined'){
  window.addEventListener('load', injectBottomCurtainFix, { once:true });
  window.requestAnimationFrame(injectBottomCurtainFix);
  window.setTimeout(injectBottomCurtainFix, 300);
}
