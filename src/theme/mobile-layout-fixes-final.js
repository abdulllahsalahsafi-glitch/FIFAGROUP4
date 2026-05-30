const MOBILE_LAYOUT_FIXES_STYLE = `
/* Home hero: remove useless bottom height without changing hero content */
.hp2Hero{
  min-height:168px!important;
  padding:14px 16px 12px!important;
  border-radius:24px!important;
}
.hp2HeroTop{margin-bottom:8px!important;}
.hp2HM{font-size:24px!important;margin-bottom:9px!important;line-height:1.08!important;}
.hp2HG{min-height:80px!important;}
.hp2HS{padding:7px 6px!important;}
.hp2StatIcon{width:20px!important;height:20px!important;margin-bottom:2px!important;}
.hp2HS .v{font-size:17px!important;line-height:1.05!important;}
.hp2HS .l{font-size:9px!important;line-height:1.2!important;}

/* Home ticker: keep repeated content visible and moving continuously */
.hp2Ticker{
  height:32px!important;
  margin:10px 0 12px!important;
  direction:ltr!important;
}
.hp2TT{
  display:flex!important;
  white-space:nowrap!important;
  min-width:max-content!important;
  animation:hp2TickerContinuous 24s linear infinite!important;
  will-change:transform!important;
}
@keyframes hp2TickerContinuous{
  from{transform:translateX(0);}
  to{transform:translateX(-50%);}
}
.hp2TI{
  direction:rtl!important;
  min-width:260px!important;
  justify-content:center!important;
}

/* Season page header: align with other Claude headers */
.seasonHubHero{
  min-height:150px!important;
  padding:22px 20px!important;
  border-radius:28px!important;
  display:flex!important;
  align-items:center!important;
}
.seasonHubHero .heroKicker{
  display:none!important;
}
.seasonHubHero h2{
  font-size:clamp(32px,8vw,44px)!important;
  margin:0!important;
}

/* Archive header: prevent total number from overlapping title */
.archiveHubHead{
  min-height:190px!important;
  padding-bottom:74px!important;
}
.archiveTotalBadge{
  position:absolute!important;
  left:22px!important;
  bottom:18px!important;
  top:auto!important;
  transform:none!important;
  display:inline-flex!important;
  flex-direction:row!important;
  align-items:center!important;
  justify-content:center!important;
  gap:7px!important;
  min-width:96px!important;
  height:42px!important;
  padding:0 13px!important;
  border-radius:999px!important;
  background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(0,212,255,.12))!important;
  border:1px solid rgba(0,230,118,.28)!important;
  box-shadow:0 10px 24px rgba(0,230,118,.13)!important;
  pointer-events:none!important;
}
.archiveTotalBadge b{
  font-size:26px!important;
  font-weight:1000!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  line-height:1!important;
}
.archiveTotalBadge small{
  font-size:11px!important;
  font-weight:900!important;
  color:#9BA0C0!important;
  line-height:1!important;
}

/* Archive download button: compact, not a full white bar */
.archiveHubPage .sectionHead.archiveSectionHead{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:10px!important;
}
.archiveHubPage .sectionHead.archiveSectionHead .secDlBtn{
  flex:0 0 auto!important;
  width:52px!important;
  min-width:52px!important;
  max-width:52px!important;
  height:34px!important;
  min-height:34px!important;
  padding:0!important;
  border-radius:999px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:linear-gradient(135deg,rgba(0,230,118,.20),rgba(0,212,255,.13))!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  border:1px solid rgba(0,230,118,.30)!important;
  box-shadow:0 8px 20px rgba(0,230,118,.14)!important;
}

@media(max-width:430px){
  .hp2Hero{min-height:164px!important;padding:13px 14px 12px!important;}
  .hp2HeroTop{margin-bottom:7px!important;}
  .hp2HM{font-size:23px!important;margin-bottom:8px!important;}
  .hp2HG{min-height:78px!important;}
  .hp2TI{min-width:240px!important;}
  .seasonHubHero{min-height:150px!important;padding:22px 20px!important;}
  .archiveHubHead{min-height:188px!important;padding-bottom:72px!important;}
  .archiveTotalBadge{left:20px!important;bottom:18px!important;height:40px!important;min-width:90px!important;}
}
`;

function injectMobileLayoutFixes(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('mobile-layout-fixes-final-style');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'mobile-layout-fixes-final-style';
  style.textContent = MOBILE_LAYOUT_FIXES_STYLE;
  document.body.appendChild(style);
}

if (typeof window !== 'undefined') {
  injectMobileLayoutFixes();
  window.addEventListener('load', injectMobileLayoutFixes, { once: true });
  window.setTimeout(injectMobileLayoutFixes, 250);
}

export {};
