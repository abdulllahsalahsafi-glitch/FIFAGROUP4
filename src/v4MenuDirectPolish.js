// FIFA GROUP - safe direct More menu polish
// UI-only. Targets only the actual menu: .drawerBackdrop > .sideDrawer
// No text scanning, no page-wide menu detection, no data/logic changes.

const css = `
body .drawerBackdrop{
  background:rgba(2,3,10,.34)!important;
  backdrop-filter:blur(8px)!important;
  -webkit-backdrop-filter:blur(8px)!important;
}

body .drawerBackdrop > .sideDrawer{
  width:min(76vw,340px)!important;
  max-width:340px!important;
  min-width:286px!important;
  padding:17px 12px 104px!important;
  border-radius:0 30px 30px 0!important;
  background:
    radial-gradient(circle at 88% 0%,rgba(0,230,118,.12),transparent 38%),
    radial-gradient(circle at 0% 100%,rgba(0,212,255,.055),transparent 44%),
    linear-gradient(145deg,rgba(3,7,18,.965),rgba(4,8,18,.93))!important;
  border:1px solid rgba(255,255,255,.075)!important;
  border-right:1px solid rgba(0,230,118,.16)!important;
  box-shadow:18px 0 56px rgba(0,0,0,.54),inset 0 1px 0 rgba(255,255,255,.075)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  color:#F5F7FF!important;
}

body .drawerBackdrop > .sideDrawer header{
  min-height:52px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  margin:4px 0 18px!important;
  padding:0 2px!important;
}

body .drawerBackdrop > .sideDrawer header b{
  font-size:28px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:-.03em!important;
  background:linear-gradient(135deg,#fff 38%,#00E676)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
}

body .drawerBackdrop > .sideDrawer header button{
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  min-height:42px!important;
  max-width:42px!important;
  max-height:42px!important;
  margin:0!important;
  padding:0!important;
  border-radius:16px!important;
  display:grid!important;
  place-items:center!important;
  background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.028))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#fff!important;
  font-size:18px!important;
  box-shadow:0 10px 22px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.08)!important;
  transform:none!important;
}

body .drawerBackdrop > .sideDrawer > button{
  width:100%!important;
  height:50px!important;
  min-height:50px!important;
  margin:7px 0!important;
  padding:0 13px!important;
  border-radius:17px!important;
  display:flex!important;
  flex-direction:row!important;
  direction:rtl!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:11px!important;
  text-align:right!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(0,230,118,.05),transparent 46%),
    linear-gradient(135deg,rgba(255,255,255,.044),rgba(255,255,255,.017))!important;
  border:1px solid rgba(255,255,255,.078)!important;
  color:#F5F7FF!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.052),0 7px 16px rgba(0,0,0,.13)!important;
  transform:none!important;
  overflow:hidden!important;
}

body .drawerBackdrop > .sideDrawer > button span{
  width:32px!important;
  height:32px!important;
  min-width:32px!important;
  border-radius:13px!important;
  display:grid!important;
  place-items:center!important;
  font-size:17px!important;
  line-height:1!important;
  background:linear-gradient(135deg,rgba(0,230,118,.105),rgba(0,212,255,.052))!important;
  border:1px solid rgba(0,230,118,.145)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.065)!important;
  transform:none!important;
}

body .drawerBackdrop > .sideDrawer > button b{
  flex:1 1 auto!important;
  min-width:0!important;
  text-align:right!important;
  color:#F5F7FF!important;
  font-size:14px!important;
  line-height:1.15!important;
  font-weight:900!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  transform:none!important;
}

body .drawerBackdrop > .sideDrawer > button:active{
  transform:none!important;
  background:linear-gradient(135deg,rgba(0,230,118,.12),rgba(0,212,255,.055))!important;
  border-color:rgba(0,230,118,.235)!important;
}

body .drawerBackdrop > .sideDrawer > button:last-of-type{
  height:49px!important;
  min-height:49px!important;
  margin-top:10px!important;
  background:linear-gradient(135deg,rgba(255,255,255,.038),rgba(255,255,255,.015))!important;
}

body .drawerBackdrop > .sideDrawer > hr{
  height:1px!important;
  margin:14px 0!important;
  border:0!important;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)!important;
}

@media(max-width:520px){
  body .drawerBackdrop > .sideDrawer{
    width:76vw!important;
    min-width:0!important;
    max-width:340px!important;
  }
}
`;

function inject(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-menu-direct-polish');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-menu-direct-polish';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = css;
  (document.body || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined'){
  window.addEventListener('load', inject, { once:true });
  window.requestAnimationFrame(inject);
  window.setTimeout(inject, 300);
}
