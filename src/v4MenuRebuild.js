// FIFA GROUP - rebuild More menu item structure for a real V4 look
// UI-only. Keeps existing buttons and click handlers; only restructures their visible content.

const menuRebuildCss = `
body .fg-v4-menu-panel{
  width:min(76vw,350px)!important;
  max-width:350px!important;
  min-width:286px!important;
  padding:18px 14px 104px!important;
  border-top-left-radius:30px!important;
  border-bottom-left-radius:30px!important;
  background:
    radial-gradient(circle at 84% 0%,rgba(0,230,118,.115),transparent 38%),
    radial-gradient(circle at 0% 100%,rgba(0,212,255,.052),transparent 44%),
    linear-gradient(145deg,rgba(3,7,18,.97),rgba(4,8,18,.93))!important;
  border-left:1px solid rgba(0,230,118,.18)!important;
  border-right:1px solid rgba(255,255,255,.055)!important;
  box-shadow:16px 0 56px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.075)!important;
}

body .fg-v4-menu-panel::before,
body .fg-v4-menu-button::after,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close)::after{
  display:none!important;
  content:none!important;
}

body .fg-v4-menu-title{
  margin:18px 60px 22px 0!important;
  font-size:29px!important;
  line-height:1!important;
  font-weight:900!important;
  text-align:right!important;
}

body .fg-v4-menu-close{
  top:18px!important;
  left:16px!important;
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  min-height:42px!important;
  max-width:42px!important;
  max-height:42px!important;
  padding:0!important;
  border-radius:16px!important;
  display:grid!important;
  place-items:center!important;
  background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.028))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#fff!important;
  font-size:18px!important;
}

body .fg-v4-menu-button,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
  min-height:54px!important;
  height:54px!important;
  width:100%!important;
  margin:8px 0!important;
  padding:0 13px!important;
  border-radius:18px!important;
  display:flex!important;
  flex-direction:row!important;
  direction:rtl!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:11px!important;
  text-align:right!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(0,230,118,.052),transparent 46%),
    linear-gradient(135deg,rgba(255,255,255,.046),rgba(255,255,255,.018))!important;
  border:1px solid rgba(255,255,255,.082)!important;
  color:#F5F7FF!important;
  font-size:14px!important;
  line-height:1!important;
  font-weight:900!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 7px 16px rgba(0,0,0,.14)!important;
  overflow:hidden!important;
  transform:none!important;
}

body .fg-v4-menu-button .fg-menu-icon{
  width:34px!important;
  height:34px!important;
  min-width:34px!important;
  border-radius:13px!important;
  display:grid!important;
  place-items:center!important;
  font-size:18px!important;
  line-height:1!important;
  background:linear-gradient(135deg,rgba(0,230,118,.11),rgba(0,212,255,.055))!important;
  border:1px solid rgba(0,230,118,.16)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important;
}

body .fg-v4-menu-button .fg-menu-label{
  flex:1 1 auto!important;
  min-width:0!important;
  display:block!important;
  text-align:right!important;
  color:#F5F7FF!important;
  font-size:14px!important;
  line-height:1.12!important;
  font-weight:900!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

body .fg-v4-menu-button:active,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close):active{
  background:linear-gradient(135deg,rgba(0,230,118,.125),rgba(0,212,255,.055))!important;
  border-color:rgba(0,230,118,.24)!important;
  transform:none!important;
}

body .fg-v4-menu-button:active .fg-menu-label{
  color:#00E676!important;
}

body .fg-v4-menu-panel hr,
body .fg-v4-menu-panel [role='separator']{
  margin:14px 0!important;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)!important;
}

@media(max-width:520px){
  body .fg-v4-menu-panel{
    width:78vw!important;
    max-width:350px!important;
    padding:17px 12px 104px!important;
  }
  body .fg-v4-menu-title{
    margin:18px 58px 20px 0!important;
    font-size:28px!important;
  }
  body .fg-v4-menu-button,
  body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
    height:53px!important;
    min-height:53px!important;
    padding:0 12px!important;
  }
}
`;

const menuItems = [
  { key: 'FIFA لوحة', label: 'FIFA لوحة', icon: '🛡️' },
  { key: 'إدارة البطولات التنافسية', label: 'إدارة البطولات التنافسية', icon: '🏟️' },
  { key: 'الإحصائيات العامة', label: 'الإحصائيات العامة', icon: '📈' },
  { key: 'السجل العام', label: 'السجل العام', icon: '📚' },
  { key: 'روابط هامة', label: 'روابط هامة', icon: '🔗' },
  { key: 'تسجيل الخروج', label: 'تسجيل الخروج', icon: '↩️' },
];

function injectMenuRebuildCss(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-menu-rebuild');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-menu-rebuild';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = menuRebuildCss;
  (document.body || document.documentElement).appendChild(style);
}

function normalizeMenuButton(button){
  if (!button || button.classList.contains('fg-v4-menu-close')) return;
  const rawText = (button.textContent || '').replace(/\s+/g, ' ').trim();
  const item = menuItems.find((entry)=>rawText.includes(entry.key));
  if (!item) return;
  if (button.dataset.fgMenuRebuilt === item.key) return;

  button.dataset.fgMenuRebuilt = item.key;
  button.classList.add('fg-v4-menu-button');
  button.setAttribute('aria-label', item.label);
  button.innerHTML = `<span class="fg-menu-icon" aria-hidden="true">${item.icon}</span><span class="fg-menu-label">${item.label}</span>`;
}

function rebuildMoreMenu(){
  if (typeof document === 'undefined' || !document.body) return;
  const panels = Array.from(document.querySelectorAll('.fg-v4-menu-panel'));
  panels.forEach((panel)=>{
    panel.querySelectorAll('button').forEach((button)=>{
      const label = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (label === '×' || label === '✕' || label.length <= 2) return;
      normalizeMenuButton(button);
    });
  });
}

function bootMenuRebuild(){
  injectMenuRebuildCss();
  rebuildMoreMenu();
  window.setTimeout(rebuildMoreMenu,80);
  window.setTimeout(rebuildMoreMenu,250);
  window.setTimeout(rebuildMoreMenu,900);
  const observer = new MutationObserver(()=>rebuildMoreMenu());
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}

if (typeof window !== 'undefined'){
  window.addEventListener('load',bootMenuRebuild,{once:true});
  window.requestAnimationFrame(bootMenuRebuild);
}
