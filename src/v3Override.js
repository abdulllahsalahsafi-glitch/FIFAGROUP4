// FIFA GROUP — active visual theme bridge
// Restores the visual layer the app depends on while keeping Claude v6 palette tokens.

export const v3OverrideCss = `
:root{
  --cyan:#00E676!important;
  --blue:#00D4FF!important;
  --violet:#A855F7!important;
  --g:#00E676!important;
  --g2:#00B84C!important;
  --gdim:rgba(0,230,118,.10)!important;
  --gbor:rgba(0,230,118,.25)!important;
  --glass:rgba(255,255,255,.032)!important;
  --gbdr:rgba(255,255,255,.07)!important;
  --text:#EDF0FF!important;
  --sub:#6270A0!important;
  --sub2:#9BA0C0!important;
  --bg:#02030A!important;
  --fg-red:#E63946!important;
  --fg-gold:#E5B53A!important;
}
html,body,#root,.app,button,input,select,textarea,h1,h2,h3,h4,h5,p,span,div,label,li,.mainNav,.navBtn{
  font-family:'Tajawal',system-ui,sans-serif!important;
}
body,#root,.app{
  color:#EDF0FF!important;
  background:
    radial-gradient(circle at 90% -10%,rgba(0,230,118,.12),transparent 34%),
    radial-gradient(circle at 6% 8%,rgba(0,212,255,.08),transparent 30%),
    linear-gradient(145deg,#02030A,#05080F 48%,#02030A)!important;
}
.app::before{
  background:
    radial-gradient(ellipse 320px 160px at 50% -2%,rgba(0,230,118,.08) 0%,transparent 65%),
    radial-gradient(circle at 8% 6%,rgba(0,230,118,.09) 0%,transparent 50%),
    radial-gradient(circle at 94% 10%,rgba(168,85,247,.07) 0%,transparent 50%),
    linear-gradient(rgba(0,230,118,.02) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,230,118,.02) 1px,transparent 1px)!important;
  background-size:100% 100%,100% 100%,100% 100%,44px 44px,44px 44px!important;
  background-color:#02030A!important;
}
.glass,.glassSoft,.sectionBox,.profileCard,.playerCard,.recordCard,.transferCard,.financeCard,.linkCard,.statCard,.competitionInstanceCard,.competitionTypeCard,.seasonMemberCard,.rankingCard,.trophyCard,.championRow,.finalRow,.notificationItem,.archiveSeasonCard,.seasonTile,.linkTile{
  background:linear-gradient(135deg,rgba(255,255,255,.050),rgba(255,255,255,.022))!important;
  border:1px solid rgba(255,255,255,.07)!important;
  color:#EDF0FF!important;
  box-shadow:0 14px 40px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.08)!important;
  backdrop-filter:blur(18px) saturate(140%)!important;
  -webkit-backdrop-filter:blur(18px) saturate(140%)!important;
}
.glassSoft:not(.adminForm):not(.adminRecentBox):not(.moneyTransferModal):not(.playerOfferModal){
  background:linear-gradient(145deg,rgba(4,12,28,.78),rgba(6,15,34,.68))!important;
  border:1px solid rgba(0,230,118,.12)!important;
}
.topBar,.topBar.scrolled,.topSystemPortalBar{
  background:rgba(2,3,10,.94)!important;
  backdrop-filter:blur(30px)!important;
  -webkit-backdrop-filter:blur(30px)!important;
  border-bottom:1px solid rgba(255,255,255,.07)!important;
}
.topBar::after,.topSystemPortalBar::after{
  content:''!important;
  position:absolute!important;
  bottom:0!important;
  left:0!important;
  right:0!important;
  height:1px!important;
  background:linear-gradient(90deg,transparent,#00E676,#00D4FF,#00E676,transparent)!important;
  opacity:.35!important;
}
.appTitle,.topBarTitle,.topSystemTitle,#fifa-splash h1,#fifa-splash .fifaSplashTitle{
  font-family:'Orbitron','Tajawal',system-ui,sans-serif!important;
  font-weight:900!important;
  background:linear-gradient(90deg,#fff 20%,#00E676)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
}
.mainNav,.mainNav.glassSoft,.forceBottomNav{
  background:rgba(4,5,14,.97)!important;
  border-top:1px solid rgba(255,255,255,.07)!important;
  box-shadow:0 -1px 0 rgba(0,230,118,.08),inset 0 1px 0 rgba(255,255,255,.05)!important;
  backdrop-filter:blur(30px)!important;
  -webkit-backdrop-filter:blur(30px)!important;
}
.navBtn{font-family:'Tajawal',system-ui,sans-serif!important;font-weight:800!important;border-radius:13px!important;transition:all .2s!important;}
.navBtn.active{background:linear-gradient(135deg,rgba(0,230,118,.14),rgba(0,184,92,.08))!important;border:1px solid rgba(0,230,118,.22)!important;color:#00E676!important;}
.navBtn .navLabel{font-size:9px!important;font-weight:700!important;color:#6270A0!important;}
.navBtn.active .navLabel{color:#00E676!important;}
.hp2Hero,.mainHero:not(.hasCoverImage),.pageHead,.seasonHubHero{
  position:relative!important;
  overflow:hidden!important;
  background:
    radial-gradient(ellipse 80% 60% at 90% -10%,rgba(0,230,118,.18),transparent 55%),
    radial-gradient(ellipse 60% 80% at 0% 110%,rgba(0,212,255,.10),transparent 50%),
    linear-gradient(160deg,#040C1C 0%,#081830 50%,#020A1A 100%)!important;
  border:1px solid rgba(0,230,118,.22)!important;
  box-shadow:0 20px 60px rgba(0,0,0,.44),0 0 28px rgba(0,230,118,.10),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
.hp2Hero{min-height:240px!important;border-radius:28px!important;padding:22px!important;}
.hp2Hero:after{
  content:'6'!important;
  position:absolute!important;
  top:-30px!important;
  left:-10px!important;
  font-family:'Orbitron','Tajawal',sans-serif!important;
  font-size:260px!important;
  font-weight:900!important;
  line-height:.85!important;
  letter-spacing:-12px!important;
  background:linear-gradient(180deg,rgba(0,230,118,.16),rgba(0,212,255,.04) 60%,transparent)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  color:transparent!important;
  pointer-events:none!important;
  z-index:0!important;
  direction:ltr!important;
}
.hp2HeroTop,.hp2HG{position:relative!important;z-index:2!important;}
.hp2HT,.heroKicker{color:#00E676!important;font-weight:900!important;letter-spacing:2px!important;}
.hp2HM,.mainHero h1,header.pageHead h1,header.pageHead h2,header.pageHead h3,.seasonHubHero h2{
  color:#EDF0FF!important;
  font-weight:900!important;
  background:linear-gradient(135deg,#fff 40%,#00E676)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
}
.hp2NewsRow,.financeCard,.transferCard,.playerCard,.seasonMemberCard,.rankingCard,.statsTableRow,.finalRow,.championRow,.trophyCard,.archiveSeasonCard,.seasonTile,.linkTile{
  background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(6,15,34,.80))!important;
  border:1px solid rgba(0,230,118,.14)!important;
  box-shadow:0 10px 26px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.05)!important;
}
.hp2NewsRow.final,.hp2NewsRow.memory,.hp2NewsRow.worldcup{border-right-color:#E5B53A!important;}
.hp2LD,.liveDot{background:#E63946!important;box-shadow:0 0 0 0 rgba(230,57,70,.45)!important;}
.trophy,.gold,.champion,.winner,.hp2SCardID,.hp2SCardCount{color:#E5B53A!important;-webkit-text-fill-color:#E5B53A!important;}
.danger,.error{color:#E63946!important;-webkit-text-fill-color:#E63946!important;}
.statCard b,.trophyCard b,.rankingCard>span,.seasonMemberRank,.finalRow em{color:#00E676!important;-webkit-text-fill-color:#00E676!important;}
.playerRating,.transferRating,.seasonMemberCard em,.archiveSeasonCard em,.offerSubmitBtn,.moneySubmitBtn,.authForm button:not(:disabled){
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  color:#020617!important;
  -webkit-text-fill-color:#020617!important;
  font-weight:900!important;
  box-shadow:0 8px 24px rgba(0,230,118,.22)!important;
}
input,select,textarea,.moneyField input,.moneyField select,.offerField input,.offerField select,.offerField textarea{
  font-family:'Tajawal',system-ui,sans-serif!important;
  background:rgba(2,6,23,.65)!important;
  border-color:rgba(0,230,118,.14)!important;
  color:#EDF0FF!important;
}
input:focus,select:focus,textarea:focus,.moneyField input:focus,.offerField input:focus,.offerField textarea:focus{
  border-color:rgba(0,230,118,.40)!important;
  box-shadow:0 0 0 3px rgba(0,230,118,.08)!important;
  outline:none!important;
}
#fifa-splash{background:#02030A!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:20px!important;z-index:9999!important;}
#fifa-splash img,#fifa-splash .fifaSplashLogo{width:80px!important;height:80px!important;border-radius:22px!important;box-shadow:0 0 50px rgba(0,230,118,.45),0 0 90px rgba(0,212,255,.15)!important;object-fit:contain!important;}
.imageActionRow button,.miniDownloadBtn,.backToMembersBtn{
  border:1px solid rgba(0,230,118,.28)!important;
  border-radius:999px!important;
  background:rgba(0,230,118,.08)!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  font-weight:900!important;
}
.financeCard.expense,.finalRow.loss{border-color:rgba(230,57,70,.30)!important;background:rgba(230,57,70,.04)!important;}
.financeCard.income,.finalRow.win{border-color:rgba(0,230,118,.30)!important;background:rgba(0,230,118,.04)!important;}
html,body,#root,.app,.app *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-user-drag:none!important;}
input,textarea,select,[contenteditable='true']{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important;}
`;
