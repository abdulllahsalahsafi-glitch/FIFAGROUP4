const CLAUDE_LOGO_STYLE = `
.hp2HeroLogo,
.hp2HeroLogoFb{
  display:none!important;
  opacity:0!important;
  visibility:hidden!important;
  width:0!important;
  height:0!important;
  margin:0!important;
  padding:0!important;
}
.hp2HeroTop::after{
  content:'FG'!important;
  width:52px!important;
  height:52px!important;
  border-radius:17px!important;
  display:grid!important;
  place-items:center!important;
  flex:0 0 auto!important;
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  color:#020617!important;
  -webkit-text-fill-color:#020617!important;
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-size:22px!important;
  font-weight:1000!important;
  letter-spacing:-1px!important;
  line-height:1!important;
  border:1px solid rgba(255,255,255,.12)!important;
  box-shadow:0 0 46px rgba(0,230,118,.32),0 14px 30px rgba(0,0,0,.30)!important;
}
.authLogo.hasImage img{display:none!important;}
.authLogo.hasImage{
  padding:0!important;
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  border:1px solid rgba(255,255,255,.12)!important;
}
.authLogo.hasImage::after{
  content:'FG'!important;
  color:#020617!important;
  -webkit-text-fill-color:#020617!important;
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-size:28px!important;
  font-weight:1000!important;
  letter-spacing:-1px!important;
}
#fifa-splash::before{content:none!important;display:none!important;}
#fifa-splash img.fifa-splash-logo{display:none!important;}
#fifa-splash .fifa-splash-logo-shell{
  position:relative!important;
  display:grid!important;
  place-items:center!important;
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  border:1px solid rgba(255,255,255,.12)!important;
  box-shadow:0 0 50px rgba(0,230,118,.45),0 0 90px rgba(0,212,255,.15),0 18px 44px rgba(0,0,0,.42)!important;
}
#fifa-splash .fifa-splash-logo-shell::after{
  content:'FG'!important;
  color:#020617!important;
  -webkit-text-fill-color:#020617!important;
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-size:32px!important;
  font-weight:1000!important;
  letter-spacing:-1px!important;
  line-height:1!important;
}
#fifa-splash .fifa-splash-title{
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-weight:900!important;
  color:#F4F8FF!important;
  -webkit-text-fill-color:#F4F8FF!important;
}
#fifa-splash .fifa-splash-title span{color:#67F5C0!important;-webkit-text-fill-color:#67F5C0!important;}
#fifa-splash .fifa-splash-season{font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;color:#9AA0BF!important;-webkit-text-fill-color:#9AA0BF!important;}
.smartIconImg[src*='flaticon.com/512/847/847969'],
.smartIconImg[src=''],
.smartIconImg:not([src]){display:none!important;}
.hp2NewsRowIcon,
.studioTemplateIcon{
  min-width:24px!important;
  min-height:24px!important;
  display:grid!important;
  place-items:center!important;
}
.archivePage select,
.seasonHubPage select,
.fifaAdminPage select,
.leagueAdminPage select,
.studioPage select,
.transfersPage select,
.widePage select{
  appearance:none!important;
  -webkit-appearance:none!important;
  background:rgba(2,6,23,.72)!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  border:1px solid rgba(0,230,118,.18)!important;
  border-radius:18px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
}
.archivePage option,
.seasonHubPage option,
.fifaAdminPage option,
.leagueAdminPage option,
.studioPage option,
.transfersPage option,
.widePage option{background:#020617!important;color:#EDF0FF!important;}
.archivePage .imageActionRow button,
.archivePage .miniDownloadBtn,
.recordsExportBtn,
.archiveDownloadBtn{
  background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(0,212,255,.12))!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  border:1px solid rgba(0,230,118,.28)!important;
  border-radius:999px!important;
  min-height:38px!important;
  box-shadow:0 8px 22px rgba(0,230,118,.14)!important;
}
.fgCleanIcon{
  display:inline-grid!important;
  place-items:center!important;
  width:20px!important;
  height:20px!important;
  min-width:20px!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  vertical-align:middle!important;
}
.fgCleanIcon svg{
  width:17px!important;
  height:17px!important;
  display:block!important;
  stroke:currentColor!important;
}
.hp2HS .l .fgCleanIcon,
.fgMemberLegacyStat span .fgCleanIcon,
.hp2Lbl .fgCleanIcon,
.hp2TI .fgCleanIcon{
  margin-inline-start:5px!important;
}
.hp2NewsRowIcon .fgCleanIcon,
.studioTemplates button span .fgCleanIcon{
  width:28px!important;
  height:28px!important;
  border-radius:12px!important;
  background:linear-gradient(135deg,rgba(0,230,118,.14),rgba(0,212,255,.07))!important;
  border:1px solid rgba(0,230,118,.22)!important;
  box-shadow:0 0 16px rgba(0,230,118,.12)!important;
}
.hp2NewsRowIcon .fgCleanIcon svg,
.studioTemplates button span .fgCleanIcon svg{
  width:16px!important;
  height:16px!important;
}
.fgMemberLegacyStat span{
  display:inline-flex!important;
  align-items:center!important;
  gap:4px!important;
}
`;

const ICONS = {
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><circle cx="12" cy="17" r="5"/><path d="M12 14v6"/><path d="M9 17h6"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4H6v16a2 2 0 0 1-2 2Z"/><path d="M2 10v10a2 2 0 1 0 4 0V10H2Z"/><path d="M10 8h8"/><path d="M10 12h8"/><path d="M10 16h5"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2a6 6 0 0 1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/><path d="M12 7v5l4 2"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 5 5"/><path d="m19 13 2-2"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h5"/><path d="M7 13h3"/><circle cx="17" cy="12" r="2"/></svg>'
};

const LEGACY_ICON_CODES = [0x1f3c6,0x1f3c5,0x1f30d,0x1f534,0x1f4e2,0x1f4c5,0x1f501,0x26bd,0x1f465,0x1f4ca,0x1f4b0,0x1f517,0x1f3ae,0x1f4da,0x1f4c8,0x2694,0x1f947,0x1f948,0x1f945,0x2b07,0x2b50,0x1f4cc,0x23f1,0x1f464,0x1f4f0,0x1f4a3,0x1f194,0x1f195];
const LEGACY_ICONS = LEGACY_ICON_CODES.map((code) => String.fromCodePoint(code));

function stripLegacyIcons(value){
  let next = String(value || '');
  LEGACY_ICONS.forEach((icon) => { next = next.split(icon).join(''); });
  return next.replace(/\s{2,}/g, ' ').trim();
}

function iconSpan(name){
  return `<span class="fgCleanIcon" aria-hidden="true">${ICONS[name] || ICONS.news}</span>`;
}

function cleanLeafText(element){
  if (!element || element.children?.length) return;
  const before = element.textContent || '';
  const after = stripLegacyIcons(before);
  if (after && after !== before) element.textContent = after;
}

function setLeadingIcon(element, name){
  if (!element) return;
  element.querySelectorAll(':scope > .fgCleanIcon').forEach((old) => old.remove());
  element.insertAdjacentHTML('afterbegin', iconSpan(name));
}

function setOnlyIcon(element, name){
  if (!element) return;
  element.innerHTML = iconSpan(name);
}

function cleanVisibleLegacyIcons(){
  if (typeof document === 'undefined') return;
  const selectors = [
    '.hp2HS .l',
    '.hp2TI',
    '.hp2Lbl',
    '.hp2NewsRowTitle',
    '.hp2NewsRowSub',
    '.fgMemberLegacyStat span',
    '.studioPage button',
    '.studioPage span',
    '.studioPage b',
    '.studioPage p',
    '.linksPage button',
    '.archivePage button',
    '.seasonHubPage button',
    '.fifaAdminPage button',
    '.leagueAdminPage button'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(cleanLeafText);
}

function restoreCleanDesignIcons(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.hp2HG .hp2HS:nth-child(1) .l').forEach((el) => setLeadingIcon(el, 'users'));
  document.querySelectorAll('.hp2HG .hp2HS:nth-child(2) .l').forEach((el) => setLeadingIcon(el, 'trophy'));
  document.querySelectorAll('.hp2HG .hp2HS:nth-child(3) .l').forEach((el) => setLeadingIcon(el, 'medal'));
  document.querySelectorAll('.fgMemberLegacyStats .fgMemberLegacyStat:nth-child(1) span').forEach((el) => setLeadingIcon(el, 'trophy'));
  document.querySelectorAll('.fgMemberLegacyStats .fgMemberLegacyStat:nth-child(2) span').forEach((el) => setLeadingIcon(el, 'coins'));
  document.querySelectorAll('.hp2Lbl').forEach((el) => {
    const text = el.textContent || '';
    if (text.includes('آخر الأخبار')) setLeadingIcon(el, 'news');
    else if (text.includes('المواسم')) setLeadingIcon(el, 'history');
    else if (text.includes('بطولات نشطة')) setLeadingIcon(el, 'radio');
  });
  document.querySelectorAll('.hp2TI').forEach((el) => setLeadingIcon(el, 'news'));
  document.querySelectorAll('.hp2NewsRowIcon').forEach((el) => {
    const row = el.closest('.hp2NewsRow');
    let type = 'news';
    if (row?.classList.contains('worldcup')) type = 'globe';
    else if (row?.classList.contains('transfer')) type = 'repeat';
    else if (row?.classList.contains('competition')) type = 'trophy';
    else if (row?.classList.contains('memory')) type = 'history';
    else if (row?.classList.contains('stat')) type = 'radio';
    setOnlyIcon(el, type);
  });
  const studioIcons = ['trophy', 'sword', 'repeat', 'card'];
  document.querySelectorAll('.studioTemplates button span').forEach((el, index) => setOnlyIcon(el, studioIcons[index] || 'card'));
}

function injectClaudeLogoStyle(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('claude-logo-runtime-style');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'claude-logo-runtime-style';
  style.textContent = CLAUDE_LOGO_STYLE;
  (document.body || document.documentElement).appendChild(style);
  cleanVisibleLegacyIcons();
  restoreCleanDesignIcons();
}

if (typeof window !== 'undefined') {
  injectClaudeLogoStyle();
  window.setTimeout(injectClaudeLogoStyle, 250);
  window.setTimeout(() => { cleanVisibleLegacyIcons(); restoreCleanDesignIcons(); }, 900);
  window.addEventListener('load', injectClaudeLogoStyle, { once: true });
}

export {};
