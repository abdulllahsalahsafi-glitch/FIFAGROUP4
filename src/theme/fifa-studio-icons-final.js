const FIFA_STUDIO_ICON_FIX_STYLE = `
.fifaStudioPage .studioTemplates button > span{
  position:relative!important;
  width:30px!important;
  height:30px!important;
  min-width:30px!important;
  display:grid!important;
  place-items:center!important;
  font-size:0!important;
  line-height:0!important;
  color:currentColor!important;
  -webkit-text-fill-color:currentColor!important;
  font-family:Arial,sans-serif!important;
  overflow:hidden!important;
}
.fifaStudioPage .studioTemplates button > span::before,
.fifaStudioPage .studioTemplates button > span::after{
  content:""!important;
  position:absolute!important;
  box-sizing:border-box!important;
  pointer-events:none!important;
}
.fifaStudioPage .studioTemplates button:nth-child(1) > span::before{
  width:18px!important;
  height:14px!important;
  top:5px!important;
  border:2px solid currentColor!important;
  border-top-width:5px!important;
  border-radius:4px 4px 8px 8px!important;
}
.fifaStudioPage .studioTemplates button:nth-child(1) > span::after{
  width:18px!important;
  height:2px!important;
  bottom:5px!important;
  background:currentColor!important;
  border-radius:999px!important;
  box-shadow:0 -4px 0 -1px currentColor!important;
}
.fifaStudioPage .studioTemplates button:nth-child(2) > span::before,
.fifaStudioPage .studioTemplates button:nth-child(2) > span::after{
  width:3px!important;
  height:25px!important;
  top:2px!important;
  left:13px!important;
  border-radius:999px!important;
  background:currentColor!important;
  transform:rotate(45deg)!important;
}
.fifaStudioPage .studioTemplates button:nth-child(2) > span::after{
  transform:rotate(-45deg)!important;
}
.fifaStudioPage .studioTemplates button:nth-child(3) > span::before{
  width:22px!important;
  height:14px!important;
  top:8px!important;
  border-top:3px solid currentColor!important;
  border-bottom:3px solid currentColor!important;
}
.fifaStudioPage .studioTemplates button:nth-child(3) > span::after{
  width:8px!important;
  height:8px!important;
  top:5px!important;
  right:3px!important;
  border-top:3px solid currentColor!important;
  border-right:3px solid currentColor!important;
  transform:rotate(45deg)!important;
  box-shadow:-16px 11px 0 -2px currentColor!important;
}
.fifaStudioPage .studioTemplates button:nth-child(4) > span::before{
  width:24px!important;
  height:18px!important;
  top:6px!important;
  border:2px solid currentColor!important;
  border-radius:5px!important;
}
.fifaStudioPage .studioTemplates button:nth-child(4) > span::after{
  width:11px!important;
  height:2px!important;
  right:5px!important;
  top:13px!important;
  background:currentColor!important;
  border-radius:999px!important;
  box-shadow:0 5px 0 currentColor!important;
}
`;

function injectFifaStudioIconFix(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('fifa-studio-icons-final-style');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'fifa-studio-icons-final-style';
  style.textContent = FIFA_STUDIO_ICON_FIX_STYLE;
  document.body.appendChild(style);
}

if (typeof window !== 'undefined') {
  injectFifaStudioIconFix();
  window.addEventListener('load', injectFifaStudioIconFix, { once: true });
  window.setTimeout(injectFifaStudioIconFix, 250);
}

export {};
