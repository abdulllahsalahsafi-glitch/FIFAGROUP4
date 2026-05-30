const CLAUDE_PAGES_STYLE = `
.widePage:not(.hp2),.memberProfilePage,.membersHome,.transfersPage,.archivePage,.linksPage,.statsPage,.rankingPage,.seasonCardsPage,.seasonHubPage,.studioPage,.fifaAdminPage,.leagueAdminPage{
  display:grid!important;
  gap:14px!important;
  padding:14px!important;
  border-radius:26px!important;
  background:radial-gradient(circle at 94% -8%,rgba(0,230,118,.08),transparent 32%),radial-gradient(circle at 0% 18%,rgba(0,212,255,.055),transparent 30%),linear-gradient(145deg,rgba(2,3,10,.92),rgba(5,8,15,.86))!important;
  border:1px solid rgba(255,255,255,.055)!important;
  box-shadow:0 18px 54px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.05)!important;
  color:#EDF0FF!important;
}
.pageHead,.membersHomeHead,.sectionHead,.archiveHead,.linksHead,.transfersHead,.statsHead,.rankingHead,.memberProfilePage .profileCard{
  position:relative!important;
  overflow:hidden!important;
  border-radius:28px!important;
  padding:18px!important;
  background:radial-gradient(circle at 88% 0%,rgba(0,230,118,.16),transparent 38%),radial-gradient(circle at 0% 100%,rgba(0,212,255,.08),transparent 42%),linear-gradient(145deg,rgba(4,12,28,.94),rgba(3,7,18,.92))!important;
  border:1px solid rgba(0,230,118,.22)!important;
  box-shadow:0 20px 60px rgba(0,0,0,.44),0 0 22px rgba(0,230,118,.10),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
.pageHead h1,.pageHead h2,.pageHead h3,.membersHomeHead h2,.sectionHead h3,.archiveHead h2,.linksHead h2,.transfersHead h2,.statsHead h2,.rankingHead h2{
  margin:0 0 8px!important;
  color:#EDF0FF!important;
  font-weight:900!important;
  font-size:clamp(24px,7vw,34px)!important;
  line-height:1.08!important;
  text-shadow:0 0 24px rgba(0,230,118,.16)!important;
}
.pageHead p,.membersHomeHead p,.sectionHead p,.archiveHead p,.linksHead p,.transfersHead p,.statsHead p,.rankingHead p{
  color:#C7CCE3!important;
  font-size:12px!important;
  line-height:1.6!important;
  font-weight:800!important;
}
.tabs,.archiveModeTabs,.seasonHubTabs,.offerSegmented,.memberSubTabs,.profileTabs{
  display:flex!important;
  gap:7px!important;
  overflow-x:auto!important;
  padding:2px 0 4px!important;
  scrollbar-width:none!important;
}
.tabs::-webkit-scrollbar,.archiveModeTabs::-webkit-scrollbar,.seasonHubTabs::-webkit-scrollbar,.offerSegmented::-webkit-scrollbar,.memberSubTabs::-webkit-scrollbar,.profileTabs::-webkit-scrollbar{display:none!important;}
.tabBtn,.archiveModeTabs button,.seasonHubTabs button,.offerSegmented button,.memberSubTabs button,.profileTabs button{
  min-height:38px!important;
  flex:0 0 auto!important;
  border-radius:999px!important;
  padding:0 13px!important;
  color:#C7CCE3!important;
  background:rgba(255,255,255,.045)!important;
  border:1px solid rgba(255,255,255,.075)!important;
  font-size:12px!important;
  line-height:1!important;
  font-weight:900!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;
}
.tabBtn.active,.archiveModeTabs button.active,.seasonHubTabs button.active,.offerSegmented button.active,.memberSubTabs button.active,.profileTabs button.active{
  color:#020617!important;
  -webkit-text-fill-color:#020617!important;
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  border-color:rgba(255,255,255,.16)!important;
  box-shadow:0 8px 20px rgba(0,230,118,.18)!important;
}
.memberProfilePage .sectionBox,.playerListBox,.playersBox,.financeBox,.transfersBox,.archiveSeasonCard,.seasonSimpleRow,.transferRow,.transferCard,.financeCard,.playerCard,.rankingCard,.linkTile,.seasonTile,.gsHeroCard,.gsRecord,.gsTable,.competitionTypeShell,.competitionTypeCard,.competitionInstanceCard,.worldCupGroupCard,.championsLeagueGroupCard,.leagueRoundBox,.leagueMatchCard,.cupChampionBox,.qualifierBracketRound,.notificationItem{
  position:relative!important;
  overflow:hidden!important;
  border-radius:22px!important;
  background:radial-gradient(circle at 94% 0%,rgba(0,230,118,.08),transparent 32%),linear-gradient(135deg,rgba(6,13,27,.90),rgba(4,8,18,.84))!important;
  border:1px solid rgba(255,255,255,.078)!important;
  box-shadow:0 10px 28px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.055)!important;
  color:#EDF0FF!important;
}
.statGrid,.memberStatsGrid,.gsHeroGrid,.gsRecordsGrid,.competitionTypeGrid,.worldCupGroupsGrid,.championsLeagueGroupsGrid,.seasonSimpleList,.competitionInstanceList,.leagueRoundsList,.leagueMatchesList{
  display:grid!important;
  gap:10px!important;
}
.statCard,.memberStatsGrid .statCard,.gsHeroCard,.gsRecord{
  min-height:108px!important;
  border-radius:22px!important;
  padding:13px!important;
  background:radial-gradient(circle at 90% 0%,rgba(0,230,118,.10),transparent 36%),linear-gradient(135deg,rgba(6,13,27,.90),rgba(4,8,18,.84))!important;
  border:1px solid rgba(255,255,255,.078)!important;
  box-shadow:0 10px 28px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.055)!important;
}
.statCard span,.gsHeroL,.gsRecordLabel,.playerMeta span,.transferMeta span,.financeCard small,.archiveSeasonCard small,.seasonTile small,.linkTile small{
  color:#9BA0C0!important;
  -webkit-text-fill-color:#9BA0C0!important;
  font-weight:800!important;
}
.statCard b,.statCard strong,.gsHeroV,.gsRecordVal,.playerRating,.transferRating,.leagueMatchScore{
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  font-weight:900!important;
}
.playerRating,.transferRating,.leagueMatchScore,.gsRecordIcon,.competitionTypeIcon,.competitionInstanceIcon,.competitionDetailIcon{
  border-radius:16px!important;
  background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(0,212,255,.10))!important;
  border:1px solid rgba(0,230,118,.18)!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
}
.profileMain img,.memberAvatar,.playerImg,.playerImage,.transferPlayerImg,.seasonSimpleRow img,.gsRecordAvatar,.gsTableMember img{
  border-radius:18px!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 0 18px rgba(0,212,255,.12),0 12px 26px rgba(0,0,0,.25)!important;
  background:rgba(255,255,255,.045)!important;
  object-fit:cover!important;
}
.imageActionRow button,.miniDownloadBtn,.backToMembersBtn,.offerSubmitBtn,.moneySubmitBtn,.primaryBtn,.authForm button:not(:disabled),.adminBtn,.saveBtn{
  min-height:38px!important;
  border-radius:999px!important;
  border:1px solid rgba(0,230,118,.28)!important;
  background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(0,212,255,.12))!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  font-weight:900!important;
  box-shadow:0 8px 22px rgba(0,230,118,.14)!important;
}
`;

function injectClaudePagesStyle(){
  if (typeof document === 'undefined') return;
  const old = document.getElementById('claude-pages-runtime-style');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'claude-pages-runtime-style';
  style.textContent = CLAUDE_PAGES_STYLE;
  (document.body || document.documentElement).appendChild(style);
}

if (typeof window !== 'undefined') {
  injectClaudePagesStyle();
  window.setTimeout(injectClaudePagesStyle, 250);
  window.addEventListener('load', injectClaudePagesStyle, { once: true });
}

export {};
