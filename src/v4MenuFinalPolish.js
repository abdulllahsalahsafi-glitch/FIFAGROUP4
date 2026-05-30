// FIFA GROUP - final focused polish for the More menu
// UI-only: unifies the drawer list items with the V4 bottom-bar visual language.

const finalMenuCss = `
body .fg-v4-menu-panel{
  width:min(74vw,344px)!important;
  max-width:344px!important;
  min-width:286px!important;
  padding:18px 12px 104px!important;
  border-top-left-radius:30px!important;
  border-bottom-left-radius:30px!important;
  background:
    radial-gradient(circle at 80% 2%,rgba(0,230,118,.105),transparent 36%),
    radial-gradient(circle at 0% 95%,rgba(0,212,255,.045),transparent 42%),
    linear-gradient(145deg,rgba(3,7,18,.965),rgba(4,8,18,.925))!important;
  border-left:1px solid rgba(0,230,118,.16)!important;
  border-right:1px solid rgba(255,255,255,.055)!important;
  box-shadow:16px 0 54px rgba(0,0,0,.50),inset 0 1px 0 rgba(255,255,255,.075)!important;
}

body .fg-v4-menu-title{
  margin:18px 60px 20px 0!important;
  font-size:28px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:-.03em!important;
}

body .fg-v4-menu-close{
  top:18px!important;
  left:15px!important;
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  min-height:42px!important;
  max-width:42px!important;
  max-height:42px!important;
  border-radius:16px!important;
  background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.03))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  box-shadow:0 10px 22px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.08)!important;
}

body .fg-v4-menu-button,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
  min-height:52px!important;
  width:100%!important;
  margin:7px 0!important;
  padding:10px 14px!important;
  border-radius:18px!important;
  display:flex!important;
  flex-direction:row!important;
  direction:rtl!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:12px!important;
  text-align:right!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(0,230,118,.045),transparent 46%),
    linear-gradient(135deg,rgba(255,255,255,.043),rgba(255,255,255,.017))!important;
  border:1px solid rgba(255,255,255,.078)!important;
  color:#F4F7FF!important;
  font-size:14px!important;
  line-height:1.12!important;
  font-weight:900!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.052),0 7px 16px rgba(0,0,0,.13)!important;
  transform:none!important;
  overflow:hidden!important;
}

body .fg-v4-menu-button::after,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close)::after{
  content:''!important;
  position:absolute!important;
  right:0!important;
  top:12px!important;
  bottom:12px!important;
  width:2px!important;
  border-radius:999px!important;
  background:linear-gradient(to bottom,rgba(0,230,118,.72),rgba(0,212,255,.40))!important;
  opacity:.55!important;
}

body .fg-v4-menu-button > *,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) > *{
  flex:0 0 auto!important;
  transform:none!important;
}

body .fg-v4-menu-button span,
body .fg-v4-menu-button b,
body .fg-v4-menu-button strong,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) span,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) b,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) strong{
  font-size:14px!important;
  line-height:1.12!important;
  font-weight:900!important;
  text-align:right!important;
}

body .fg-v4-menu-button:active,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close):active{
  background:linear-gradient(135deg,rgba(0,230,118,.12),rgba(0,212,255,.05))!important;
  border-color:rgba(0,230,118,.23)!important;
  color:#00E676!important;
  transform:none!important;
}

body .fg-v4-menu-panel hr,
body .fg-v4-menu-panel [role='separator']{
  margin:14px 0!important;
  opacity:.72!important;
}

@media(max-width:520px){
  body .fg-v4-menu-panel{
    width:76vw!important;
    max-width:344px!important;
    padding:17px 12px 104px!important;
  }
  body .fg-v4-menu-title{
    font-size:28px!important;
    margin:18px 58px 18px 0!important;
  }
  body .fg-v4-menu-button,
  body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
    min-height:51px!important;
    font-size:14px!important;
    padding:10px 13px!important;
    gap:11px!important;
  }
}
`;

function injectFinalMenuPolish(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-menu-final-polish');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-menu-final-polish';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = finalMenuCss;
  (document.body || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined'){
  window.addEventListener('load', injectFinalMenuPolish, { once:true });
  window.requestAnimationFrame(injectFinalMenuPolish);
  window.setTimeout(injectFinalMenuPolish, 300);
  window.setTimeout(injectFinalMenuPolish, 900);
}
