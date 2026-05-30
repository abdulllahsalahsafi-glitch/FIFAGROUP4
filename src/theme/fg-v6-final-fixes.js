// FIFA GROUP v6 final visual fixes
// Lightweight: one style injection only. No DOM scanning, no MutationObserver.

import './fg-v6-logo-fix.css';

const FG_V6_FINAL_STYLE = `
.hp2HeroLogo,.hp2HeroLogoFb{display:none!important;opacity:0!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;}
.hp2HeroTop{position:relative!important;}
.hp2HeroTop::after{content:'FG'!important;width:52px!important;height:52px!important;border-radius:17px!important;display:grid!important;place-items:center!important;background:linear-gradient(135deg,#00E676,#00D4FF)!important;color:#020617!important;font-family:Orbitron,Tajawal,sans-serif!important;font-weight:1000!important;font-size:22px!important;letter-spacing:-1px!important;box-shadow:0 0 46px rgba(0,230,118,.32),0 14px 30px rgba(0,0,0,.30)!important;border:1px solid rgba(255,255,255,.12)!important;line-height:1!important;flex:0 0 auto!important;}
.topSystemFgLogo{display:none!important;}
.topNotifyBtn svg,.topSystemBackBtn svg{stroke:#00E676!important;}
`;

function injectFgV6FinalStyle(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fg-v6-final-fixes-style');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fg-v6-final-fixes-style';
  style.textContent = FG_V6_FINAL_STYLE;
  (document.body || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined') {
  injectFgV6FinalStyle();
  window.setTimeout(injectFgV6FinalStyle, 250);
  window.setTimeout(injectFgV6FinalStyle, 1000);
  window.addEventListener('load', injectFgV6FinalStyle, { once: true });
}

export {};
