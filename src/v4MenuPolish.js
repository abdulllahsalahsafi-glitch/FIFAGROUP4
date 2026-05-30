// FIFA GROUP - focused V4 polish for the More menu only
// UI-only patch. No Firebase, Sheets, tournament, transfer, or app logic changes.

const menuPolishCss = `
body .fg-v4-menu-panel{
  width:min(76vw,350px)!important;
  max-width:350px!important;
  min-width:286px!important;
  border-top-left-radius:30px!important;
  border-bottom-left-radius:30px!important;
  padding:18px 14px 104px!important;
  background:
    radial-gradient(circle at 86% 0%,rgba(0,230,118,.13),transparent 40%),
    radial-gradient(circle at 0% 100%,rgba(0,212,255,.06),transparent 44%),
    linear-gradient(145deg,rgba(3,7,18,.965),rgba(4,8,18,.925))!important;
  border-left:1px solid rgba(0,230,118,.20)!important;
  border-right:1px solid rgba(255,255,255,.065)!important;
  box-shadow:18px 0 60px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.08)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
}

body .fg-v4-menu-panel::before{
  content:''!important;
  position:absolute!important;
  top:0!important;
  right:0!important;
  width:1px!important;
  height:100%!important;
  background:linear-gradient(to bottom,transparent,rgba(0,230,118,.32),transparent)!important;
  pointer-events:none!important;
}

/* Prevent accidental panel-inside-panel styling */
body .fg-v4-menu-panel .fg-v4-menu-panel,
body .fg-v4-menu-inner{
  width:auto!important;
  max-width:none!important;
  min-width:0!important;
  height:auto!important;
  min-height:0!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  overflow:visible!important;
}
body .fg-v4-menu-panel .fg-v4-menu-panel::before,
body .fg-v4-menu-inner::before{
  display:none!important;
  content:none!important;
}

body .fg-v4-menu-title{
  display:block!important;
  margin:18px 66px 20px 0!important;
  text-align:right!important;
  font-size:29px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:-.03em!important;
  color:#fff!important;
  background:linear-gradient(135deg,#fff 38%,#00E676 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
}

body .fg-v4-menu-close{
  position:absolute!important;
  top:18px!important;
  left:16px!important;
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
  background:rgba(255,255,255,.065)!important;
  border:1px solid rgba(255,255,255,.11)!important;
  color:#fff!important;
  font-size:20px!important;
  line-height:1!important;
  box-shadow:0 10px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.07)!important;
  overflow:hidden!important;
}

body .fg-v4-menu-button,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
  min-height:54px!important;
  height:auto!important;
  width:100%!important;
  border-radius:18px!important;
  margin:8px 0!important;
  padding:10px 14px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:10px!important;
  direction:rtl!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(0,230,118,.055),transparent 46%),
    linear-gradient(135deg,rgba(255,255,255,.048),rgba(255,255,255,.018))!important;
  border:1px solid rgba(255,255,255,.085)!important;
  color:#F2F5FF!important;
  font-size:15px!important;
  line-height:1.15!important;
  font-weight:900!important;
  letter-spacing:0!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 8px 18px rgba(0,0,0,.16)!important;
  transform:none!important;
  overflow:hidden!important;
}

body .fg-v4-menu-button span,
body .fg-v4-menu-button b,
body .fg-v4-menu-button strong,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) span,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) b,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close) strong{
  font-size:15px!important;
  font-weight:900!important;
  line-height:1.15!important;
}

body .fg-v4-menu-button:active,
body .fg-v4-menu-panel button:not(.fg-v4-menu-close):active{
  transform:none!important;
  background:linear-gradient(135deg,rgba(0,230,118,.13),rgba(0,212,255,.055))!important;
  border-color:rgba(0,230,118,.24)!important;
  color:#00E676!important;
}

body .fg-v4-menu-panel hr,
body .fg-v4-menu-panel [role='separator']{
  height:1px!important;
  margin:14px 0!important;
  border:0!important;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)!important;
}

body .fg-v4-menu-overlay{
  background:rgba(2,3,10,.22)!important;
  backdrop-filter:blur(7px)!important;
  -webkit-backdrop-filter:blur(7px)!important;
}

@media(max-width:520px){
  body .fg-v4-menu-panel{
    width:78vw!important;
    min-width:0!important;
    max-width:350px!important;
    padding:17px 12px 104px!important;
  }
  body .fg-v4-menu-title{
    font-size:28px!important;
    margin:18px 58px 18px 0!important;
  }
  body .fg-v4-menu-button,
  body .fg-v4-menu-panel button:not(.fg-v4-menu-close){
    min-height:52px!important;
    border-radius:17px!important;
    font-size:14px!important;
    padding:10px 13px!important;
  }
}
`;

function injectMenuPolish(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-v4-menu-polish');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-v4-menu-polish';
  style.setAttribute('data-fifa-ui-only','true');
  style.textContent = menuPolishCss;
  (document.body || document.documentElement).appendChild(style);
}

function findMenuPanelFromTextNode(node){
  let el = node.nodeType === 3 ? node.parentElement : node;
  const candidates = [];
  while (el && el !== document.body){
    const rect = el.getBoundingClientRect?.();
    if (rect && rect.height > window.innerHeight * 0.42 && rect.width > window.innerWidth * 0.34 && rect.width < window.innerWidth * 0.98){
      candidates.push({ el, area: rect.width * rect.height, width: rect.width, height: rect.height, left: rect.left });
    }
    el = el.parentElement;
  }
  if (!candidates.length) return null;
  candidates.sort((a,b)=> b.area - a.area);
  return candidates[0].el;
}

function tagMoreMenu(){
  if (typeof document === 'undefined' || !document.body) return;
  const needles = ['القائمة','FIFA لوحة','إدارة البطولات التنافسية','الإحصائيات العامة','السجل العام','روابط هامة','تسجيل الخروج'];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const panels = new Set();

  while (walker.nextNode()){
    const text = (walker.currentNode.textContent || '').trim();
    if (!needles.some((needle)=>text.includes(needle))) continue;
    const panel = findMenuPanelFromTextNode(walker.currentNode);
    if (panel) panels.add(panel);
  }

  if (!panels.size) return;

  const ranked = Array.from(panels).map((panel)=>{
    const rect = panel.getBoundingClientRect();
    return { panel, area: rect.width * rect.height };
  }).sort((a,b)=>b.area-a.area);

  const mainPanel = ranked[0].panel;

  document.querySelectorAll('.fg-v4-menu-panel').forEach((panel)=>{
    if (panel !== mainPanel) {
      panel.classList.remove('fg-v4-menu-panel');
      panel.classList.add('fg-v4-menu-inner');
    }
  });

  mainPanel.classList.add('fg-v4-menu-panel');
  mainPanel.classList.remove('fg-v4-menu-inner');

  mainPanel.querySelectorAll('.fg-v4-menu-panel').forEach((nested)=>{
    if (nested !== mainPanel) {
      nested.classList.remove('fg-v4-menu-panel');
      nested.classList.add('fg-v4-menu-inner');
    }
  });

  const parent = mainPanel.parentElement;
  if (parent && parent !== document.body) parent.classList.add('fg-v4-menu-overlay');

  mainPanel.querySelectorAll('button').forEach((button)=>{
    const label = (button.textContent || '').trim();
    if (label === '×' || label === '✕' || label.length <= 2) {
      button.classList.add('fg-v4-menu-close');
      button.classList.remove('fg-v4-menu-button');
    } else {
      button.classList.add('fg-v4-menu-button');
    }
  });

  mainPanel.querySelectorAll('h1,h2,h3').forEach((title)=>{
    if ((title.textContent || '').includes('القائمة')) title.classList.add('fg-v4-menu-title');
  });
}

function bootMenuPolish(){
  injectMenuPolish();
  tagMoreMenu();
  window.setTimeout(tagMoreMenu,80);
  window.setTimeout(tagMoreMenu,250);
  window.setTimeout(tagMoreMenu,900);
  const observer = new MutationObserver(()=>tagMoreMenu());
  observer.observe(document.body,{childList:true,subtree:true});
}

if (typeof window !== 'undefined'){
  window.addEventListener('load',bootMenuPolish,{once:true});
  window.requestAnimationFrame(bootMenuPolish);
}
