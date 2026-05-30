import React, { useState, useRef, useEffect } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean, isEnabled } from '../utils/helpers'
import { sortRecordsDesc, emptyMemberStats } from '../utils/data'
import { getSeasonCenterCompetitionMatches, isSeasonCenterOpenMatch, isSeasonCenterActiveOffer, getSeasonCenterRadarItems } from '../utils/seasonCenter'
import { isTransferMarketOpen, getInitialPushStatus, getPlayerRosterKindLabel, transferRestrictionShortText } from '../utils/admin'

import { buildLinkedLeagueCupDisplayCompetition } from '../utils/competition'
import FinanceSection from '../components/finance/FinanceSection'
import MemberTrophiesSection from '../components/members/MemberTrophiesSection'
import MemberStatsSection from '../components/members/MemberStatsSection'
import MySeasonRankingSection from '../components/members/MySeasonRankingSection'
import NotificationsPanel from '../components/notifications/NotificationsPanel'
import FinalsSubPage from './FinalsSubPage'
import PlayerOfferModal from '../components/modals/PlayerOfferModal'
import MemberDealsSection from '../components/members/MemberDealsSection'
import MemberOffersSection from '../components/members/MemberOffersSection'
import PlayersSection from '../components/players/PlayersSection'
import PlayerDetailSubPage from './PlayerDetailSubPage'
import { downloadMyProfileSummaryImage, exportBrandLogoUrl, downloadMemberFinanceImage } from '../utils/canvas'
import { ProfileMatchesSection } from '../components/competition/CompetitionViewerSection'
import TabButton from '../components/ui/TabButton'

export const myProfileCss = `
.myProfilePage{direction:rtl;text-align:right}
.myProfileHero{border-radius:28px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;overflow:hidden;background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(8,18,36,.66));border:1px solid rgba(0,230,118,.14)}
.myProfileHeroMain{display:flex;align-items:center;gap:16px;min-width:0}.myProfileHeroMain img{width:96px;height:96px;border-radius:28px;object-fit:cover;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);flex:0 0 auto}.myProfileHeroMain small{display:block;color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;font-size:11px;letter-spacing:1px}.myProfileHeroMain h1{margin:4px 0 8px;font-size:clamp(28px,7vw,44px);line-height:1.05;font-weight:1000;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.myProfileChips{display:flex;flex-wrap:wrap;gap:7px}.myProfileChips span{height:30px;border-radius:999px;padding:0 10px;display:inline-flex;align-items:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#BFFFE0;-webkit-text-fill-color:#BFFFE0;font-size:11px;font-weight:900;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.myProfileLogos{display:flex;align-items:center;gap:6px;margin-top:8px}.myProfileLogos img{width:24px;height:24px;border-radius:8px;object-fit:contain;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:2px}.myProfileHeroBadge{width:92px;height:92px;border-radius:26px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(0,230,118,.16),rgba(0,212,255,.08));border:1px solid rgba(0,230,118,.26);flex:0 0 auto}.myProfileHeroBadge b{font-size:30px;font-weight:1000;color:#00E676;-webkit-text-fill-color:#00E676;line-height:1}.myProfileHeroBadge span{font-size:11px;font-weight:900;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;margin-top:-22px}
.myProfileSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.myProfileStat{min-height:86px;border-radius:22px;padding:12px;background:linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.82));border:1px solid rgba(0,230,118,.14);display:grid;place-items:center;text-align:center;min-width:0;cursor:pointer;font-family:'Tajawal',sans-serif}.myProfileStat b{font-size:clamp(17px,4.4vw,28px);line-height:1.05;color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr}.myProfileStat span{font-size:11px;font-weight:900;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0}.myProfileStat.blue b{color:#00D4FF;-webkit-text-fill-color:#00D4FF}.myProfileStat.violet b{color:#A855F7;-webkit-text-fill-color:#A855F7}.myProfileStat.gold b{color:#FACC15;-webkit-text-fill-color:#FACC15}.myProfileStat.season b{color:#38BDF8;-webkit-text-fill-color:#38BDF8}.myProfileStat.muted b{color:#9BA0C0;-webkit-text-fill-color:#9BA0C0}.myProfileStat svg{width:21px;height:21px;stroke:rgba(237,240,255,.88);stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round;margin-bottom:4px}.myProfileStat.gold svg{stroke:#FACC15}.myProfileStat.season svg{stroke:#38BDF8}.myProfileStat.violet svg{stroke:#A855F7}.myProfileStat.green svg{stroke:#00E676}.myProfileRadarTab{display:grid;gap:14px}.myProfileRadarTab .fgCompetitionSmartCue{width:18px;height:18px;min-width:18px;background:rgba(0,230,118,.08);border-color:rgba(0,230,118,.16)}.myProfileRadarTab .fgCompetitionSmartCue svg{width:10px;height:10px;stroke-width:2}.myProfileRadarTab .myProfileTasks{margin:0}.myProfileRadarBox{border-radius:24px;padding:15px;border:1px solid rgba(0,230,118,.12);background:rgba(2,6,23,.30)}.myProfileTabs{margin:0 0 14px}.myProfilePrimaryContent{margin-bottom:14px}.myProfilePrimaryContent .sectionBox{margin:0}
.myProfileGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.myProfileWide{grid-column:1/-1}.myProfileBox{border-radius:26px;padding:16px;min-width:0;overflow:hidden}.myProfileBoxHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.myProfileBoxHead h3{margin:0;font-size:22px;font-weight:1000;line-height:1.2;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF}.myProfileBoxHead span{min-width:44px;height:34px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.22);color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;font-size:12px;white-space:nowrap}.myProfileRows,.myProfileList{display:grid;gap:8px}.myProfileRows div,.myProfileOffer,.myProfileNotice,.myProfileMatch,.myProfileEmpty{width:100%;border-radius:18px;border:1px solid rgba(0,230,118,.12);background:rgba(2,6,23,.36);color:#EDF0FF;text-align:right;padding:12px;min-width:0}.myProfileRows div{display:flex;align-items:center;justify-content:space-between;gap:10px}.myProfileRows b,.myProfileOffer b,.myProfileNotice b,.myProfileMatch b{display:block;font-size:14px;line-height:1.35;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.myProfileRows span{color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;white-space:nowrap}.myProfileOffer small,.myProfileNotice small,.myProfileMatch small{display:block;margin-top:4px;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-size:11px;font-weight:700;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.myProfileMatch{cursor:pointer}.myProfileMatch em{font-style:normal;color:#00E676;-webkit-text-fill-color:#00E676;margin:0 6px}.myProfileSquadMix{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.myProfileSquadMix span{border-radius:14px;background:rgba(0,230,118,.08);border:1px solid rgba(0,230,118,.14);color:#BFFFE0;-webkit-text-fill-color:#BFFFE0;font-size:11px;font-weight:900;text-align:center;padding:8px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.myProfileQuickLinks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.myProfileQuickLinks button{min-height:44px;border-radius:16px;border:1px solid rgba(0,230,118,.16);background:rgba(2,6,23,.42);color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;font-weight:1000;cursor:pointer}.myProfileEmpty{color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-weight:800;text-align:center}
.profileMatchesSection{overflow:hidden}.profileMatchesCount{min-width:42px;height:34px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.22);color:#00E676;font-weight:1000;direction:ltr}.profileMatchesGrid{display:grid;gap:10px}.profileMatchCard{width:100%;border:1px solid rgba(0,230,118,.16);background:linear-gradient(135deg,rgba(2,6,23,.62),rgba(8,24,48,.42));border-radius:20px;padding:12px 14px;color:#EDF0FF;text-align:right;display:grid;gap:8px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);cursor:pointer;overflow:hidden}.profileMatchCard:active{transform:scale(.985)}.profileMatchTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.profileMatchTop b{color:#ECFEFF;font-size:15px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profileMatchTop span{height:26px;border-radius:999px;padding:0 9px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#A7F3D0;font-size:11px;font-weight:1000;white-space:nowrap}.profileMatchTeams{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:8px;align-items:center}.profileMatchTeams strong{font-size:14px;color:#F8FAFC;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profileMatchTeams strong:first-child{text-align:right}.profileMatchTeams strong:last-child{text-align:left}.profileMatchTeams em{font-style:normal;min-width:34px;height:26px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);color:#00E676;font-size:11px;font-weight:1000}.profileMatchCard small{color:#94A3B8;font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.clearNotificationsBtn{height:32px;border:1px solid rgba(248,113,113,.24);background:rgba(248,113,113,.10);color:#fecaca;border-radius:999px;padding:0 11px;font-size:11px;font-weight:1000;cursor:pointer}.clearNotificationsBtn:disabled{opacity:.5;cursor:not-allowed}@media(max-width:720px){.profileMatchTeams{grid-template-columns:1fr;gap:5px}.profileMatchTeams strong,.profileMatchTeams strong:first-child,.profileMatchTeams strong:last-child{text-align:right}.profileMatchTeams em{justify-self:start}}
.myProfileHeroActions{display:flex;flex-direction:column;align-items:center;gap:10px;flex:0 0 auto}.myProfileExportBtn{width:42px;height:42px;border:1px solid rgba(0,230,118,.28);background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(0,212,255,.08));color:#00E676;-webkit-text-fill-color:#00E676;border-radius:15px;padding:0;font-size:22px;line-height:1;font-weight:1000;font-family:'Tajawal',sans-serif;box-shadow:0 8px 22px rgba(0,230,118,.12);display:grid;place-items:center;cursor:pointer}.myProfileTasks{border-radius:24px;padding:15px;margin:0 0 14px;border:1px solid rgba(0,230,118,.12);background:rgba(2,6,23,.30)}.myProfileTaskGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.myProfileTask{border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);padding:12px;min-height:102px;display:flex;flex-direction:column;justify-content:center;text-align:right}.myProfileTask b{font-size:20px;font-weight:1000;color:#00E676;-webkit-text-fill-color:#00E676;line-height:1.15}.myProfileTask span{font-size:12px;font-weight:900;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;margin-top:6px}.myProfileTask small{font-size:10px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;line-height:1.35;margin-top:4px}
@media(max-width:720px){.myProfileHero{border-radius:22px;padding:14px;align-items:flex-start}.myProfileHeroActions{align-items:center}.myProfileExportBtn{width:42px}.myProfileTaskGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.myProfileHeroMain{gap:12px}.myProfileHeroMain img{width:76px;height:76px;border-radius:22px}.myProfileLogos img{width:22px;height:22px;border-radius:7px;padding:2px}.myProfileHeroBadge{width:70px;height:70px;border-radius:20px}.myProfileHeroBadge b{font-size:23px}.myProfileHeroBadge span{font-size:10px;margin-top:-16px}.myProfileSummary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.myProfileStat{min-height:80px;border-radius:18px}.myProfileGrid{grid-template-columns:1fr;gap:10px}.myProfileBox{border-radius:20px;padding:13px}.myProfileBoxHead h3{font-size:19px}.myProfileQuickLinks{grid-template-columns:repeat(2,minmax(0,1fr))}.myProfileSquadMix{grid-template-columns:repeat(2,minmax(0,1fr))}.myProfileTabs{padding-bottom:2px}}
`;


function SummaryIcon({ type = "" }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (type === "balance") {
    return (
      <svg {...common}>
        <path d="M7 8.5c0-1.4 2.2-2.5 5-2.5s5 1.1 5 2.5-2.2 2.5-5 2.5-5-1.1-5-2.5Z" />
        <path d="M7 8.5v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3" />
        <path d="M7 11.5v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3" />
      </svg>
    );
  }
  if (type === "rank") {
    return (
      <svg {...common}>
        <path d="M12 4 15 7l4 .6-2.9 2.8.7 4-3.8-2-3.8 2 .7-4L6 7.6 10 7l2-3Z" />
        <path d="M8 20h8" />
        <path d="M10 16h4v4h-4z" />
      </svg>
    );
  }
  if (type === "points") {
    return (
      <svg {...common}>
        <path d="M5 18h14" />
        <path d="M7 15l3-4 3 2 4-6" />
        <path d="M17 7h-4" />
        <path d="M17 7v4" />
      </svg>
    );
  }
  if (type === "seasonTitles") {
    return (
      <svg {...common}>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
        <path d="M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10" />
        <path d="M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10" />
        <path d="M12 12v4" />
        <path d="M8.5 20h7" />
        <path d="M10 16h4" />
      </svg>
    );
  }
  if (type === "totalTitles") {
    return (
      <svg {...common}>
        <path d="M6 5h12v14H6z" />
        <path d="M9 8h6" />
        <path d="M9 11h6" />
        <path d="M9 14h4" />
      </svg>
    );
  }
  if (type === "players") {
    return (
      <svg {...common}>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M17 12a2.5 2.5 0 1 0 0-5" />
        <path d="M14.5 19a3.8 3.8 0 0 1 6 0" />
      </svg>
    );
  }
  return null;
}

export default function MyProfilePage({
  config,
  member,
  currentMemberId = "",
  members = [],
  competitions = [],
  transferWindows = [],
  playerOffers = [],
  notifications = [],
  restrictions = [],
  players = [],
  financeRows = [],
  trophyGroups = [],
  trophyMap = {},
  stats = null,
  seasonRanking = [],
  transferHistory = [],
  allPlayerOffers = [],
  allPlayers = [],
  playerContracts = [],
  freeAgentRegistrations = [],
  freePlayerStatus = [],
  freeAgentQueue = [],
  memberRestrictions = [],
  currentMemberRestrictions = [],
  pushStatus = getInitialPushStatus(),
  pushBusy = false,
  balance = 0,
  availableBalance = 0,
  trophiesCount = 0,
  proCount = 0,
  maxProfessionalPlayersLimit = 5,
  maxProfessionalPlayersLabel = "5",
  isFifaAdmin = false,
  onEnablePushNotifications,
  onDisablePushNotifications,
  onOpenNotification,
  onClearNotifications,
  onCreatePlayerOffer,
  onUpdatePlayerOffer,
  onCancelPlayerOffer,
  onAcceptOffer,
  onRejectOffer,
  onReleasePlayer,
  onTerminateLoan,
  onRegisterFreeAgentFee,
  onBreakFreeAgentContract,
  getReleaseClauseInfoForPlayer,
  isMarketOpen = false,
  onOpenCompetition,
  onGoPage,
  onOpenView,
  onInfo,
}) {
  const memberId = cleanId(currentMemberId);
  member = member || (members || []).find((item) =>
    same(item.id || item.memberId || item.memberid, memberId)
  ) || null;
  const memberName = member?.name || member?.memberName || "عضو FIFA GROUP";
  const memberImage = member?.avatar || member?.image || member?.photo || avatar(memberName);
  const teamLabel = member?.team || member?.club || member?.teamName || "";
  const nationalLabel = member?.nationalteam || member?.nationalTeam || member?.national || "";
  const teamLogo = member?.teamlogo || member?.teamLogo || member?.clubLogo || "";
  const nationalLogo = member?.nationallogo || member?.nationalLogo || member?.flag || "";
  const [profileTab, setProfileTab] = useState("players");
  const [profileSearch, setProfileSearch] = useState("");
  const [offerModal, setOfferModal] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const playerDetailReturnScrollRef = useRef(0);

  const seasonRankingRows = Array.isArray(seasonRanking) ? seasonRanking : [];
  const mySeasonRankingIndex = seasonRankingRows.findIndex((row) => same(row.memberId || row.id, memberId));
  const mySeasonRankingRow = mySeasonRankingIndex >= 0 ? seasonRankingRows[mySeasonRankingIndex] : null;
  const mySeasonRankValue = mySeasonRankingIndex >= 0 ? `#${formatLatinNumber(mySeasonRankingIndex + 1)}` : "-";
  const mySeasonPointsValue = formatLatinNumber(toNumber(mySeasonRankingRow?.points || 0));
  const mySeasonTitlesValue = formatLatinNumber(toNumber(mySeasonRankingRow?.titles || 0));

  const activeCompetitions = (competitions || [])
    .filter((competition) => {
      const status = clean(competition.status || "active");
      return !["completed", "cancelled", "deleted", "archived"].includes(status);
    })
    .map((competition) => buildLinkedLeagueCupDisplayCompetition(competition, competitions || []));
  const allOpenMatches = activeCompetitions
    .flatMap((competition) => getSeasonCenterCompetitionMatches(competition))
    .filter(({ match }) => isSeasonCenterOpenMatch(match));
  const myMatches = memberId
    ? allOpenMatches.filter(({ match }) => same(match.homeMemberId, memberId) || same(match.awayMemberId, memberId)).slice(0, 5)
    : [];
  const activeOffers = (playerOffers || []).filter((offer) =>
    isSeasonCenterActiveOffer(offer) && memberId && (same(offer.fromMemberId, memberId) || same(offer.toMemberId, memberId))
  ).slice(0, 5);
  const latestNotifications = (notifications || []).slice(0, 4);
  const marketOpen = isTransferMarketOpen(transferWindows || []);
  const openWindow = (transferWindows || []).find((item) => clean(item.status || "") === "open") || null;
  const ratings = (players || []).map((player) => toNumber(player.rating)).filter((value) => value > 0);
  const avgRating = ratings.length ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length) : 0;
  const topPlayer = (players || []).slice().sort((a, b) => toNumber(b.rating) - toNumber(a.rating))[0] || null;
  const visibleFinanceRows = Array.isArray(financeRows) ? financeRows : [];
  const visibleTrophyGroups = Array.isArray(trophyGroups) ? trophyGroups : [];
  const memberStats = stats || emptyMemberStats(memberId);
  const q = clean(profileSearch);
  const filteredPlayers = (players || []).filter((player) => {
    if (!q) return true;
    const kindLabel = getPlayerRosterKindLabel(player, playerContracts, memberId);
    return clean([
      player.name,
      player.position,
      player.team,
      player.club,
      player.rating,
      kindLabel,
      kindLabel.replace("لاعب ", ""),
    ].join(" ")).includes(q);
  });

  useEffect(() => {
    if (!playerDetail) return undefined;
    function handlePlayerDetailBack(event) {
      event.stopImmediatePropagation?.();
      closePlayerDetail();
      try { window.history.replaceState({ fifaGroupRoot: true }, ""); } catch {}
    }
    window.addEventListener("popstate", handlePlayerDetailBack, true);
    return () => window.removeEventListener("popstate", handlePlayerDetailBack, true);
  }, [playerDetail]);

  function openPlayerDetail(player) {
    const appNode = document.querySelector(".app");
    playerDetailReturnScrollRef.current = appNode ? appNode.scrollTop : window.scrollY || 0;
    try { window.history.pushState({ fifaGroupPlayerDetail: true }, ""); } catch {}
    setPlayerDetail(player);
    requestAnimationFrame(() => {
      const nextAppNode = document.querySelector(".app");
      if (nextAppNode) nextAppNode.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function closePlayerDetail() {
    const returnTop = Math.max(0, Number(playerDetailReturnScrollRef.current) || 0);
    setPlayerDetail(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const appNode = document.querySelector(".app");
        if (appNode) {
          appNode.style.scrollBehavior = "auto";
          appNode.scrollTop = returnTop;
          requestAnimationFrame(() => {
            appNode.scrollTop = returnTop;
            appNode.style.scrollBehavior = "";
          });
        } else {
          window.scrollTo(0, returnTop);
        }
      });
    });
  }

  function openPlayerOffer(player, existingOffer = null, targetMember = null) {
    setOfferModal({ player, existingOffer, targetMember: targetMember || member });
  }

  async function handleCancelPlayerOffer(existingOffer) {
    if (!existingOffer?.id || !onCancelPlayerOffer) return;
    await onCancelPlayerOffer(existingOffer.id);
  }

  const positionCounts = (players || []).reduce((acc, player) => {
    const key = clean(player.position || "");
    const bucket = key.includes("GK") || key.includes("حارس") ? "gk" : key.includes("CB") || key.includes("LB") || key.includes("RB") || key.includes("DEF") || key.includes("دفاع") ? "def" : key.includes("CM") || key.includes("CDM") || key.includes("CAM") || key.includes("MID") || key.includes("وسط") ? "mid" : "att";
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, { gk: 0, def: 0, mid: 0, att: 0 });

  const summaryCards = [
    { label: "الرصيد", value: formatMoney(balance), tone: "green", tab: "finance", icon: "balance" },
    { label: "المركز", value: mySeasonRankValue, tone: "gold", tab: "myRanking", icon: "rank" },
    { label: "نقاط الموسم", value: mySeasonPointsValue, tone: "season", tab: "myRanking", icon: "points" },
    { label: "بطولات الموسم", value: mySeasonTitlesValue, tone: "violet", tab: "myRanking", icon: "seasonTitles" },
    { label: "إجمالي البطولات", value: formatLatinNumber(trophiesCount || 0), tone: "violet", tab: "trophies", icon: "totalTitles" },
    { label: "اللاعبون", value: formatLatinNumber((players || []).length), tone: "green", tab: "players", icon: "players" },
  ];
  const profileTasks = [
    { label: "مباريات قادمة", value: myMatches.length, hint: myMatches.length ? "افتح البطولة من القائمة أدناه" : "لا توجد مباريات مطلوبة الآن" },
    { label: "عروض نشطة", value: activeOffers.length, hint: activeOffers.length ? "تابع عروضك من تبويب العروض" : "لا توجد عروض نشطة تخصك" },
    { label: "إشعارات حديثة", value: latestNotifications.length, hint: latestNotifications.length ? "آخر التنبيهات الخاصة بك" : "لا توجد إشعارات جديدة" },
    { label: "حالة السوق", value: marketOpen ? "مفتوح" : "مغلق", hint: marketOpen ? "يمكن متابعة السوق والعروض" : "السوق مغلق حاليًا" },
  ];
  const profileRadarItems = getSeasonCenterRadarItems({
    activeCompetitions,
    allCompetitions: competitions || [],
    openMatches: allOpenMatches,
    myMatches,
    activeOfferRows: activeOffers,
    marketOpen,
    openWindow,
    isFifaAdmin: false,
    latestNotifications,
  });
  const handleDownloadMyProfile = () => downloadMyProfileSummaryImage({
    config,
    member,
    players,
    balance,
    availableBalance,
    trophiesCount,
    proCount,
    maxProfessionalPlayersLimit,
    maxProfessionalPlayersLabel,
    avgRating,
    topPlayer,
    trophyGroups: visibleTrophyGroups,
    contracts: playerContracts,
    memberId,
    upcomingMatchesCount: myMatches.length,
    activeOffersCount: activeOffers.length,
    notificationsCount: latestNotifications.length,
    marketOpen,
  });

  if (!memberId || !member) {
    return (
      <main className="widePage glass myProfilePage">
        <style>{myProfileCss}</style>
        <header className="pageHead">
          <h2>ملفي الشخصي</h2>
          <p>لم يتم ربط هذا الحساب بعضو نشط بعد.</p>
        </header>
        <div className="myProfileEmpty">لا توجد بيانات عضو مرتبطة بحسابك الحالي.</div>
      </main>
    );
  }

  if (playerDetail) {
    return (
      <main className="widePage glass myProfilePage">
        <style>{myProfileCss}</style>
        <PlayerDetailSubPage
          player={playerDetail}
          ownerMember={member}
          currentMemberId={currentMemberId}
          currentMember={member}
          playerOffers={playerOffers}
          playerContracts={playerContracts}
          freeAgentRegistrations={freeAgentRegistrations}
          freePlayerStatus={freePlayerStatus}
          freeAgentQueue={freeAgentQueue}
          memberRestrictions={memberRestrictions}
          ownerPlayerCount={(players || []).length}
          canMakeOffer={false}
          isMarketOpen={isMarketOpen}
          members={members}
          onBack={closePlayerDetail}
          onOffer={openPlayerOffer}
          onCancelOffer={handleCancelPlayerOffer}
          onAcceptOffer={onAcceptOffer}
          onRejectOffer={onRejectOffer}
          onReleasePlayer={onReleasePlayer}
          onTerminateLoan={onTerminateLoan}
          onRegisterFreeAgentFee={onRegisterFreeAgentFee}
          onBreakFreeAgentContract={onBreakFreeAgentContract}
          releaseClauseInfo={getReleaseClauseInfoForPlayer?.(playerDetail)}
        />
        {offerModal ? (
          <PlayerOfferModal
            targetMember={offerModal.targetMember || member}
            targetPlayer={offerModal.player}
            existingOffer={offerModal.existingOffer}
            currentMemberId={currentMemberId}
            currentAvailableBalance={availableBalance}
            currentMemberPlayers={players}
            onClose={() => setOfferModal(null)}
            onSubmit={offerModal.existingOffer ? onUpdatePlayerOffer : onCreatePlayerOffer}
          />
        ) : null}
      </main>
    );
  }

  return (
    <main className="widePage glass myProfilePage">
      <style>{myProfileCss}</style>
      <header className="pageHead">
        <h2>ملفي الشخصي</h2>
        <p>صفحتك الكاملة: القائمة، العروض، السجل المالي، البطولات، الصفقات والإشعارات في مكان واحد.</p>
      </header>

      <section className="myProfileHero glassSoft">
        <div className="myProfileHeroMain">
          <img src={memberImage} alt="" />
          <div>
            <small>{config.mainTitle || "FIFA GROUP"}</small>
            <h1>{memberName}</h1>
            <div className="myProfileChips">
              {teamLabel ? <span>{teamLabel}</span> : null}
              {nationalLabel ? <span>{nationalLabel}</span> : null}
            </div>
            {(teamLogo || nationalLogo) ? (
              <div className="myProfileLogos" aria-hidden="true">
                {teamLogo ? <img src={teamLogo} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
                {nationalLogo ? <img src={nationalLogo} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="myProfileHeroActions">
          <button type="button" className="myProfileExportBtn" onClick={handleDownloadMyProfile} title="تحميل صورة ملفي" aria-label="تحميل صورة ملفي">↓</button>
        </div>
      </section>

      <section className="myProfileSummary">
        {summaryCards.map((card) => (
          <button type="button" className={`myProfileStat ${card.tone}`} key={card.label} onClick={() => setProfileTab(card.tab)}>
            <SummaryIcon type={card.icon} />
            <b>{card.value}</b>
            <span>{card.label}</span>
          </button>
        ))}
      </section>

      <nav className="tabs myProfileTabs">
        <TabButton tab={profileTab} id="players" label="قائمتي" setTab={setProfileTab} />
        <TabButton tab={profileTab} id="smartRadar" label="الرادار الذكي" setTab={setProfileTab} />
        <TabButton tab={profileTab} id="myRanking" label="تصنيفي" setTab={setProfileTab} />
        {isEnabled(config.showMemberTrophies) ? <TabButton tab={profileTab} id="trophies" label="بطولاتي" setTab={setProfileTab} /> : null}
        <TabButton tab={profileTab} id="memberStats" label="إحصائياتي" setTab={setProfileTab} />
        <TabButton tab={profileTab} id="deals" label="سجل الصفقات" setTab={setProfileTab} />
        <TabButton tab={profileTab} id="offers" label="عروض الانتقالات" setTab={setProfileTab} />
        {isEnabled(config.showFinance) ? <TabButton tab={profileTab} id="finance" label={config.financeTitle} setTab={setProfileTab} /> : null}
        <TabButton tab={profileTab} id="notifications" label={"الإشعارات" + (notifications.length ? ` (${formatLatinNumber(notifications.length)})` : "")} setTab={setProfileTab} />
      </nav>

      <section className="myProfilePrimaryContent">
        {profileTab === "players" ? (
          <PlayersSection
            config={config}
            rows={filteredPlayers}
            search={profileSearch}
            setSearch={setProfileSearch}
            playerCount={(players || []).length}
            showOfferButton={false}
            onOpenPlayerDetail={openPlayerDetail}
            playerContracts={playerContracts}
            selectedMemberId={memberId}
            maxProfessionalPlayersLimit={maxProfessionalPlayersLimit}
            maxProfessionalPlayersLabel={maxProfessionalPlayersLabel}
          />
        ) : null}
        {profileTab === "smartRadar" ? (
          <section className="myProfileRadarTab">
            <section className="myProfileTasks glassSoft">
              <div className="myProfileBoxHead"><h3>استحقاقاتي</h3><span>خاص</span></div>
              <div className="myProfileTaskGrid">
                {profileTasks.map((item) => (
                  <div className="myProfileTask" key={item.label}>
                    <b>{typeof item.value === "number" ? formatLatinNumber(item.value) : item.value}</b>
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </div>
                ))}
              </div>
            </section>

            <ProfileMatchesSection
              title="مبارياتي"
              subtitle="المباريات غير المسجلة في البطولات النشطة."
              rows={myMatches}
              members={members}
              emptyText="لا توجد مباريات غير مسجلة حالياً."
              onOpenCompetition={onOpenCompetition}
            />

            <section className="myProfileRadarBox glassSoft">
              <div className="myProfileBoxHead"><h3>الرادار الذكي</h3><span>{formatLatinNumber(profileRadarItems.length)}</span></div>
              <div className="myProfileList">
                {profileRadarItems.length ? profileRadarItems.map((item, index) => {
                  const content = (
                    <>
                      <b>{item.title}</b>
                      <small>{item.body}</small>
                    </>
                  );
                  return item.competitionId ? (
                    <button type="button" className="myProfileMatch" key={(item.competitionId || item.title) + "-" + index} onClick={() => onOpenCompetition && onOpenCompetition(item.competitionId)}>
                      {content}
                    </button>
                  ) : (
                    <div className="myProfileNotice" key={(item.title || "profile-radar") + "-" + index}>{content}</div>
                  );
                }) : <div className="myProfileEmpty">لا توجد تنبيهات مهمة حاليًا.</div>}
              </div>
            </section>
          </section>
        ) : null}
        {profileTab === "myRanking" ? (
          <MySeasonRankingSection
            member={member}
            rankingRow={mySeasonRankingRow}
            rankOrder={mySeasonRankingIndex >= 0 ? mySeasonRankingIndex + 1 : 0}
            trophyMap={trophyMap}
          />
        ) : null}
        {profileTab === "trophies" && isEnabled(config.showMemberTrophies) ? (
          <MemberTrophiesSection rows={visibleTrophyGroups} member={member} onOpenView={onOpenView} />
        ) : null}
        {profileTab === "memberStats" ? (
          <MemberStatsSection config={config} stats={memberStats} member={member} members={members} onOpenView={onOpenView} onInfo={onInfo} />
        ) : null}
        {profileTab === "deals" ? (
          <MemberDealsSection
            member={member}
            members={members}
            transferHistory={transferHistory}
            playerOffers={allPlayerOffers}
            memberRestrictions={memberRestrictions}
            logoUrl={exportBrandLogoUrl(config)}
            onOpenPlayer={(player) => player && openPlayerDetail(player)}
          />
        ) : null}
        {profileTab === "offers" ? (
          <MemberOffersSection
            member={member}
            members={members}
            allPlayers={allPlayers || []}
            playerOffers={allPlayerOffers}
            currentMemberId={currentMemberId}
            isFifaAdmin={isFifaAdmin}
            logoUrl={exportBrandLogoUrl(config)}
            onOpenPlayer={(player) => player && openPlayerDetail(player)}
            onEditOffer={(offer, player, targetMember) => player && targetMember && openPlayerOffer(player, offer, targetMember)}
            onCancelOffer={handleCancelPlayerOffer}
            onAcceptOffer={onAcceptOffer}
            onRejectOffer={onRejectOffer}
          />
        ) : null}
        {profileTab === "finance" && isEnabled(config.showFinance) ? (
          <FinanceSection
            config={config}
            rows={visibleFinanceRows}
            member={member}
            members={members}
            onDownload={() => downloadMemberFinanceImage({
              member,
              financeRows: visibleFinanceRows,
              balance,
              config,
              members,
            })}
          />
        ) : null}
        {profileTab === "notifications" ? (
          <NotificationsPanel
            rows={notifications}
            members={members}
            currentMemberId={currentMemberId}
            pushStatus={pushStatus}
            pushBusy={pushBusy}
            onEnablePushNotifications={onEnablePushNotifications}
            onDisablePushNotifications={onDisablePushNotifications}
            onOpenNotification={onOpenNotification}
            onClearNotifications={onClearNotifications}
          />
        ) : null}
      </section>

      {offerModal ? (
        <PlayerOfferModal
          targetMember={offerModal.targetMember || member}
          targetPlayer={offerModal.player}
          existingOffer={offerModal.existingOffer}
          currentMemberId={currentMemberId}
          currentAvailableBalance={availableBalance}
          currentMemberPlayers={players}
          onClose={() => setOfferModal(null)}
          onSubmit={offerModal.existingOffer ? onUpdatePlayerOffer : onCreatePlayerOffer}
        />
      ) : null}

      <section className="myProfileGrid">
        {currentMemberRestrictions.length || restrictions.length || isFifaAdmin ? (
          <div className="myProfileBox glassSoft myProfileWide">
            <div className="myProfileBoxHead"><h3>الملاحظات الإدارية الخاصة</h3><span>{formatLatinNumber((currentMemberRestrictions.length || restrictions.length) || 0)}</span></div>
            <div className="myProfileList">
              {(currentMemberRestrictions.length ? currentMemberRestrictions : restrictions).length ? (currentMemberRestrictions.length ? currentMemberRestrictions : restrictions).map((row) => (
                <div className="myProfileNotice" key={row.id || row.endDate || row.reason}>
                  <b>{transferRestrictionShortText(row)}</b>
                  <small>{row.endDate ? `حتى ${row.endDate}` : "بدون تاريخ نهاية"}{row.reason ? ` · ${row.reason}` : ""}</small>
                </div>
              )) : <div className="myProfileEmpty">لا توجد قيود إدارية نشطة على حسابك.</div>}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
