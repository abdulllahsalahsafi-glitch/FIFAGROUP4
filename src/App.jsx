import "./fifaTheme.css";
import { v3OverrideCss } from "./v3Override";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { auth, db } from "./firebase";
import { enableFifaPushNotifications, syncFifaPushTokenIfAllowed, listenToForegroundPushMessages } from "./pushNotifications";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";

// ─── Extracted page components (self-contained) ──────────────────────────────
import HomePage from './pages/HomePage';
import MuseumPage from './pages/MuseumPage';
import MembersPage from './pages/MembersPage';
import FifaAdminPage from './pages/FifaAdminPage';
import FifaLeagueAdminPage from './pages/FifaLeagueAdminPage';
import ArchivePage from './pages/ArchivePage';
import RankingPage from './pages/RankingPage';
import GeneralStatsPage from './pages/GeneralStatsPage';
import FifaStudioPage from './pages/FifaStudioPage';
import LinksPage from './pages/LinksPage';
import DetailPage from './pages/DetailPage';
import InfoModal from './pages/InfoModal';
import SystemScreen from './pages/SystemScreen';
import SeasonHubPage from './pages/SeasonHubPage';
import LeagueViewerPage from './pages/LeagueViewerPage';
import TransfersPage from './pages/TransfersPage';
import MyProfilePage from './pages/MyProfilePage';
import SeasonCenterPage from './pages/SeasonCenterPage';
import RecordDetailPage from './pages/RecordDetailPage';
import FinalsSubPage from './pages/FinalsSubPage';
import SeasonPage from './pages/SeasonPage';
import MemberAllTrophiesSubPage from './pages/MemberAllTrophiesSubPage';
import RecordsSubPage from './pages/RecordsSubPage';

// ─── Extracted auth / layout components ─────────────────────────────────────
import { LoginPage, AuthMiniBadge } from './components/auth/LoginPage';
import { BottomNav } from './components/layout/BottomNav';
import { SideMenu } from './components/layout/SideMenu';
import { TopSystemBar } from './components/layout/TopSystemBar';

// ─── Extracted UI components ─────────────────────────────────────────────────
import BackButton from './components/ui/BackButton';
import StatCard from './components/ui/StatCard';
import TabButton from './components/ui/TabButton';
import ConfirmDialog from './components/ui/ConfirmDialog';
import RecordCard from './components/ui/RecordCard';
import TransferRestrictionBanner from './components/ui/TransferRestrictionBanner';
import CompetitionIcon from './components/competition/CompetitionIcon';
import CompetitionStatsBox from './components/competition/CompetitionStatsBox';
import NavButton from './components/layout/NavButton';
import PlayerOfferAction from './components/players/PlayerOfferAction';
import MemberTrophiesSection from './components/members/MemberTrophiesSection';
import MemberStatsSection from './components/members/MemberStatsSection';
import FinanceSection from './components/finance/FinanceSection';
import NotificationsPanel from './components/notifications/NotificationsPanel';
import NotificationsModal from './components/notifications/NotificationsModal';
import MoneyTransferModal from './components/modals/MoneyTransferModal';
import ActiveSeasonMembersPanel from './components/members/ActiveSeasonMembersPanel';
import PlayerOfferModal from './components/modals/PlayerOfferModal';
import MemberDealsSection from './components/members/MemberDealsSection';
import MemberOffersSection from './components/members/MemberOffersSection';
import PlayersSection from './components/players/PlayersSection';
import PlayerDetailSubPage from './pages/PlayerDetailSubPage';
import HistoricalMembersStatsShowcase from './components/members/HistoricalMembersStatsShowcase';

// ─── Utils (extracted helpers — replaces module-level duplicates) ─────────────
import { formatTransferDate, usernameKey, usernameToFirebaseEmail, firebaseAuthMessage, clean, cleanId, same, toNumber, formatMoney, isEnabled, normalizeKey, removeBom, parseCSV, isFifaAdminProfile, isNotificationVisibleToMember, pushTokenDocId, adminRewardTypeLabel, adminDecisionTypeLabel, adminDecisionStatusLabel, adminViolationCategoryLabel, isFifaAdminMoneyTransfer, isCorrectionMoneyTransfer, hasMoneyTransferCorrection, buildAdminTransferRestrictionPayload, getAdminTargetMembers, getTopBarTitle, getActiveMemberRestrictions, getBlockingTransferRestriction, transferActionArabic, transferRestrictionShortText, transferRestrictionBlockMessage, formatRestrictionNotificationBody, timestampMs, dateOnlyMs, isTransferRestrictionActive, getMemberName, notificationTimeValue, notificationDisplayDate, isOfferExpired, dateValue, getFifaAdminNoticeTemplates, getFifaAdminNoticeTemplate, adminDecisionMainLine, adminNoteCategoryLabel, adminSeverityLabel, transferWindowStatusLabel, computeTransferWindowStats, buildFifaAdminSmartAlerts, isTransferMarketOpen, wrapCanvasText, exportDateTimeLabel, isCompetitionCompleted, competitionKnockoutColumnsForExport, roundRect, safeFileName, triggerCanvasDownload, normalizeCompetitionRewards, rewardRankLabel, drawStatBox, buildHistoricalMemberExportStats, exportBrandLogoUrl, toLatinDigits, formatLatinNumber, renderSmartIcon, normalizeImageUrl, toCssSize, avatar, linkIcon, sortRecordsDesc, trophySort, unique, normalizeDate, seasonNumber, buildTrophyMap, groupMemberTrophies, groupByTrophy, buildArchiveSeasons, computeSeasonRanking, isFifaSystemMember, isActiveSeasonMember, getActiveMembers, getPlayerStableId, addDays, localDateKey, rowBelongsToTransferWindow, hasRecord, getFinanceMemberId, getFinanceFromMemberId, getFinanceToMemberId, competitionTypeKey, isLeagueGroupsCompetition, isChampionsLeagueSingleGroup, isAbdullahLike, isLinkedLeagueGroupsCup, isKnockoutCompetitionType, uniqueCleanIds, getCompetitionExcludedMemberIds, isCompetitionExcludedMember, isCompetitionExcludedMatch, filterCompetitionParticipantsForCalculation, filterCompetitionMatchesForCalculation, matchInvolvesMember, isWaitingCompetitionMatch, isGroupOrLeagueStageMatch, competitionAbsenceInfoForMember, getApprovedCompetitionChampionName, generateLeagueRoundRobinMatches, computeLeagueStandings, compareLeagueStanding, leagueStandingTieKey, annotateLeagueStandings, tieBreakDecisionKey, normalizeTieBreakDecisions, shuffleRows, distributeSeedPotsToGroups, groupLetterName, generateWorldCupMatches, worldCupGroupStageReady, worldCupGroupRows, computeWorldCupQualifiedRows, computeWorldCupQualifiedIds, worldCupQualifierTokenMap, resolveWorldCupDependencies, championsLeagueGroupLetterName, buildBalancedGroupMatchPairs, generateChampionsLeagueMatches, championsLeagueGroupStageReady, championsLeagueGroupRows, computeChampionsLeagueQualifiedRows, computeChampionsLeagueQualifiedIds, computeKnockoutQualifiedIds, championsLeagueQualifierTokenMap, resolveChampionsLeagueDependencies, generateSeededKnockoutBracketMatches, resolveKnockoutBracketDependencies, knockoutBracketSizeForCount, normalizeCupManualPairings, buildManualKnockoutBracketSlots, buildSeededBracketSlots, roundLabelForBracket, matchShortLabel, matchLoserInfo, getKnockoutChampion, getKnockoutRewardRows, resolveLeagueQualifierDependencies, linkedCupGroupIsReady, sortedCompetitionMatchesForSchedule, competitionMatchSortValue, competitionTypeArabic, competitionTimeValue, buildLinkedLeagueCupDisplayCompetition, getSeasonCenterCompetitionMatches, isSeasonCenterOpenMatch, getSeasonCenterCompetitionStats, getSeasonCenterRadarItems, getSeasonCenterEventFeed, seasonCenterEventDateLabel, isSeasonCenterActiveOffer, seasonCenterPhaseLabel, buildCompetitionStats, assignLeagueGamePlatforms, applyCompetitionGameMode, generateLeagueQualifierMatches, getWorldCupThirdPlace, leagueTwoGroupsAdminRoundTitle, generateLeagueTwoGroupsMatches, championsLeagueAdminRoundTitle, validateCupManualPairings, getCompetitionChampionInfo, scheduleStageTitleForMatch, groupLeagueMatchesByRound, competitionTypeLabel, competitionDefaultIcon, competitionTrophyLookupKeys, competitionLogoFromTrophyMap, competitionLogoFromConfig, competitionLogoUrl, competitionStatusLabel, studioTimeValue, studioMatchScoreText, studioEventDateLabel, adminMoneyTransferLabel, isPlayerReleasedByContracts, isActivePlayerOfferStatus, isBlockingOwnPlayerOfferStatus, isBlockingOwnPlayerOfferStillValid, isAcceptedOrCompletedPlayerOffer, isFinanciallyReservedPlayerOffer, isTerminalPlayerOfferStatus, playerOfferStatusMessage, getInitialPushStatus, normalizeFirebaseTransferRows, mergeTransferPeriods, getTransferWindowForDate, getTransferWindowNameForDate, getTransferWindowIdForDate, isFreeAgentPlayer, toBooleanFlag, isFreeOriginContract, isFreeAgentPoolContract, getFreeAgentSlotOwnerIdFromContract, hasEverUsedFreeAgentSlot, normalizeOfferAsTransferContractRow, getTransferContractParties, hasFreeAgentRegistrationRecord, hasAnyFreeAgentRegistrationForMember, getRosterKindCode, getRosterPlayerKindFromContract, getPlayerRosterKindLabel, getTransferPeriods, isFinanceTransfer, getMemberFinanceRows, getFinanceRawAmount, normalizeDigits, parseFinanceAmount, getFinanceDirection, getFinanceSignedAmount, computeMemberBalance, financeDirectionLabel, getFinanceDisplayTitle, getFinanceRecordDate, getFinanceRecordNote, financeTypeClass, transferTypeClass, transferRowTimeValue, loanDurationLabel, isLoanTransferRow, transferStatusLabel, effectiveTransferStatusLabel, formatContractIssuedAt, firstValue, splitIds, sortByDateDesc, sortByDateAsc, sortMixedRowsDesc, sortRecordsAsc, normalizeTournamentRow, archiveLeagueSystemHasFinal, archiveTournamentCountsAsFinalStats, computeMemberStats, addFinalForMember, emptyMemberStats, buildGoalsForMessage, buildGoalsAgainstMessage, topMap, getActiveSeasonId, findSeason, archiveLookupKey, archiveKeyHasFinalContext, archiveKeyHasSide, archiveKeyLooksLikeScore, getArchiveFinalSideValue, getArchiveFinalSideGoals, getArchiveFinalResultValue, extractScorePairFromText, resolveArchiveMemberId, inferArchiveFinalFromText, getTrophyDisplayName, downloadStudioChampionImage, downloadStudioResultImage, downloadFifaStudioResultCardImage, downloadStudioDealImage, downloadStudioMemberSummaryImage, transferTypeDisplayLabel, downloadFifaStudioCardImage, downloadTransferContractImage, escapeSvgText, normalizeExchangeContractType, normalizeExchangeLoanDuration, exchangeContractLabel, normalizeOfferExchangeClauseForSave, formatArchiveFinalText } from './utils';

const DEFAULT_CONFIG = {
  mainTitle: "FIFA GROUP",
  seasonName: "الموسم السادس",
  seasonTitle: "الموسم السادس 2025",
  membersTitle: "الأعضاء",
  seasonTournamentsTitle: "بطولات الموسم",
  transfersTitle: "انتقالات الموسم",
  rankingTitle: "تصنيف الموسم",
  linksTitle: "روابط هامة",
  playersTitle: "قائمة اللاعبين",
  trophiesTitle: "البطولات",
  financeTitle: "السجل المالي",
  archiveTitle: "السجل العام للبطولات",
  statsTitle: "الإحصائيات العامة",
  transfersSubtitle: "تظهر الفترات تلقائيًا من Google Sheets، ويمكنك إضافة فترة جديدة بدون تعديل الكود.",
  rankingSubtitle: "تصنيف الموسم النشط محسوب تلقائيًا من سجل البطولات.",
  linksSubtitle: "روابط النظام والسجلات والصفحات المهمة.",
  searchPlaceholder: "ابحث عن لاعب أو مركز أو عقد...",
  loadingTitle: "",
  loadingSubtitle: "",
  noDataTitle: "حاول مجددًا",
  errorTitle: "حدث خطأ في تحميل البيانات",
  appStatus: "active",
  maintenanceMessage: "التطبيق تحت الصيانة مؤقتًا",
  showFinance: "true",
  showRanking: "true",
  showTransfers: "true",
  showLinks: "true",
  showSeasonTournaments: "true",
  showMemberTrophies: "true",
  showSearch: "true",
  showArchive: "true",
  showStats: "true",
  defaultPage: "home",
  activeSeasonId: "S6",
  primaryColor: "#00e5ff",
  secondaryColor: "#2f8cff",
  accentColor: "#8b5cf6",
  headerImage: "",
  appIcon: "",
  groupLogo: "",
  exportLogo: "",
  announcement: "",
  coverHeight: "118px",
  coverHeightMobile: "50px",
  balanceIcon: "💰",
  totalTrophiesIcon: "🏆",
  navMembersIcon: "👥",
  navSeasonIcon: "🏆",
  navArchiveIcon: "📚",
  navRankingIcon: "📊",
  navMoreIcon: "☰",
  menuStatsIcon: "📈",
  menuTransfersIcon: "🔁",
  menuLinksIcon: "🔗",
  memberTeamIcon: "⚽",
  memberNationalIcon: "🏳️",
  finalsPlayedIcon: "⚔️",
  finalsWonIcon: "🥇",
  finalsLostIcon: "🥈",
  goalsForIcon: "⚽",
  goalsAgainstIcon: "🥅",
  relegationsIcon: "⬇️",
  seasonCountIcon: "🏆",
  seasonPointsIcon: "⭐",
  rankingTitlesIcon: "🏆",
  rankingPointsIcon: "⭐",
  transferAmountIcon: "💰",
  transferTypeIcon: "📌",
  transferDateIcon: "📅",
  transferNoteIcon: "⏱️",
  linkFacebookIcon: "👥",
  linkTournamentsIcon: "🏆",
  linkSeasonIcon: "📘",
  linkDefaultIcon: "📌",
  memberCardTrophyIcon: "🏆",
  archiveTrophyTabIcon: "🏆",
  archiveSeasonTabIcon: "📅",
  archiveMemberTabIcon: "👤",
  maxProfessionalPlayers: "5",
};

const FALLBACK_PLAYER_IMAGE =
  "https://cdn-icons-png.flaticon.com/512/847/847969.png";

const PUSH_SW_PATH_FOR_FOREGROUND = "/firebase-messaging-sw.js";

const OFFER_FEE = 500000;
const MAX_DAILY_PLAYER_OFFERS = 5;
const PLAYER_OFFER_EXPIRE_DAYS = 3;
const MAX_PRO_PLAYERS = 5;
const MIN_SQUAD_PLAYERS = 17;
const MAX_SQUAD_PLAYERS = 32;
const LOAN_TERMINATION_COMPENSATION = 10000000;
const FREE_AGENT_REPLACEMENT_FEE = 5000000;

// يحذف الإيموجي والأيقونات من النصوص — يُستخدم في هيدرات الصفحات
const stripIcon = s => (s || '').replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z0-9\s\-\u2013\u2014\u060C,.!?():[\]{}'"\u00AB\u00BB\u200B-\u200F\u202A-\u202E]+/g, '').trim();

const URLS = {
  members:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=0&single=true&output=csv",
  players:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1768795422&single=true&output=csv",
  trophiesLegacy:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1777972903&single=true&output=csv",
  trophiesMaster:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=694104264&single=true&output=csv",
  leagueArchive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1337187883&single=true&output=csv",
  tournamentsArchive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1271747498&single=true&output=csv",
  seasons:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1861704915&single=true&output=csv",
  finance:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1521741565&single=true&output=csv",
  transfers:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=157620707&single=true&output=csv",
  importantLinks:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1147950511&single=true&output=csv",
  settings:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1487747915&single=true&output=csv",
  pointsRules:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=1027277293&single=true&output=csv",
  competitionPriority:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSDrHv3359NOsLcR5FqhRLs4MyYBxWzKI1iVZNVKT1_8vIPMOyqqzJF5qSah5cmYIuj182gYQAVwccm/pub?gid=207330795&single=true&output=csv",
};


// ─── Season points system: sheet-driven rules + priority tie-breakers ─────────
const DEFAULT_SEASON_POINTS_RULES = [
  { competitionType: "world_cup", rank: 1, points: 20, active: true },
  { competitionType: "world_cup", rank: 2, points: 17, active: true },
  { competitionType: "world_cup", rank: 3, points: 15, active: true },
  { competitionType: "world_cup", rank: 4, points: 10, active: true },
  { competitionType: "league", rank: 1, points: 10, active: true },
  { competitionType: "league", rank: 2, points: 5, active: true },
  { competitionType: "league", rank: 3, points: 4, active: true },
  { competitionType: "league", rank: 4, points: 3, active: true },
  { competitionType: "league", rank: 5, points: 2, active: true },
  { competitionType: "league", rank: 6, points: 1, active: true },
  { competitionType: "cup", rank: 1, points: 5, active: true },
  { competitionType: "cup", rank: 2, points: 3, active: true },
  { competitionType: "super_cup", rank: 1, points: 3, active: true },
  { competitionType: "super_cup", rank: 2, points: 2, active: true },
  { competitionType: "champions_league", rank: 1, points: 13, active: true },
  { competitionType: "champions_league", rank: 2, points: 10, active: true },
  { competitionType: "champions_league", rank: 3, points: 7, active: true },
  { competitionType: "champions_league", rank: 4, points: 5, active: true },
];

const DEFAULT_COMPETITION_PRIORITY = [
  { competitionType: "world_cup", priority: 1 },
  { competitionType: "champions_league", priority: 2 },
  { competitionType: "league", priority: 3 },
  { competitionType: "cup", priority: 4 },
  { competitionType: "super_cup", priority: 5 },
];

function normalizeSeasonPointsType(value = "") {
  const raw = String(value || "").trim();
  const key = clean(raw);
  if (!key) return "";
  if (key.includes("worldcup") || key.includes("world_cup") || key.includes("كاسالعالم") || key.includes("كأسالعالم")) return "world_cup";
  if (key.includes("champions") || key.includes("champions_league") || key.includes("دوريالابطال") || key.includes("دوريالأبطال")) return "champions_league";
  if (key.includes("super") || key.includes("super_cup") || key.includes("السوبر")) return "super_cup";
  if (key.includes("cup") || key.includes("الكاس") || key.includes("الكأس")) return "cup";
  if (key.includes("league") || key.includes("الدوري") || key === "minileague") return "league";
  return key;
}

function sheetBoolean(value, fallback = true) {
  const key = clean(value);
  if (!key) return fallback;
  if (["false", "0", "no", "off", "inactive", "disabled", "لا", "كلا"].includes(key)) return false;
  return true;
}

function buildSeasonPointsRuleMap(rows = []) {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_SEASON_POINTS_RULES;
  const map = new Map();
  source.forEach((row) => {
    const type = normalizeSeasonPointsType(row.competitionType || row.competitiontype || row.type || row.competition || row.trophyType || "");
    const rank = toNumber(row.rank || row.position || row.place || row.order || "");
    const points = toNumber(row.points || row.point || row.value || 0);
    const active = sheetBoolean(row.active ?? row.enabled ?? row.status, true);
    if (!type || !rank || !active) return;
    map.set(`${type}::${rank}`, points);
  });
  return map;
}

function buildCompetitionPriorityList(rows = []) {
  const source = Array.isArray(rows) && rows.length ? rows : DEFAULT_COMPETITION_PRIORITY;
  return source
    .map((row, index) => ({
      competitionType: normalizeSeasonPointsType(row.competitionType || row.competitiontype || row.type || row.competition || ""),
      priority: Math.max(1, toNumber(row.priority || row.order || row.rank || index + 1) || index + 1),
      active: sheetBoolean(row.active ?? row.enabled ?? row.status, true),
    }))
    .filter((row) => row.competitionType && row.active)
    .sort((a, b) => a.priority - b.priority || a.competitionType.localeCompare(b.competitionType));
}

function memberNameFromRows(rows = [], memberId = "") {
  const id = cleanId(memberId);
  const row = (rows || []).find((item) => same(item.memberId || item.id, id));
  return row?.memberName || row?.name || id;
}

function loserFromMatch(match = {}) {
  const winnerId = cleanId(match.winnerMemberId || "");
  if (!winnerId) return null;
  const homeId = cleanId(match.homeMemberId || "");
  const awayId = cleanId(match.awayMemberId || "");
  if (same(winnerId, homeId) && awayId && !String(awayId).startsWith("__")) {
    return { memberId: awayId, memberName: match.awayName || awayId };
  }
  if (same(winnerId, awayId) && homeId && !String(homeId).startsWith("__")) {
    return { memberId: homeId, memberName: match.homeName || homeId };
  }
  return null;
}

function completedCompetitionPlacementRows(competition = {}) {
  if (clean(competition.status || "") !== "completed") return [];
  const type = normalizeSeasonPointsType(competition.type || competition.competitionType || "");
  const isGroupLeague = isLeagueGroupsCompetition(competition);
  const isSingleGroupChampions = isChampionsLeagueSingleGroup(competition);
  const participants = filterCompetitionParticipantsForCalculation(competition);
  const matches = filterCompetitionMatchesForCalculation(competition);
  const leagueStyle = (type === "league" && !isGroupLeague) || isSingleGroupChampions || type === "minileague";

  if (leagueStyle) {
    const standings = Array.isArray(competition.standings) && competition.standings.length
      ? competition.standings
      : computeLeagueStandings(participants, matches);
    return (standings || [])
      .filter((row) => cleanId(row.memberId || row.id || ""))
      .map((row, index) => ({
        rank: index + 1,
        memberId: cleanId(row.memberId || row.id || ""),
        memberName: row.memberName || row.name || memberNameFromRows(participants, row.memberId || row.id),
      }));
  }

  const rewardRows = getKnockoutRewardRows(competition) || [];
  if (rewardRows.length) {
    return rewardRows
      .filter((row) => cleanId(row.memberId || row.id || ""))
      .map((row, index) => ({
        rank: toNumber(row.rank || index + 1) || index + 1,
        memberId: cleanId(row.memberId || row.id || ""),
        memberName: row.memberName || row.name || memberNameFromRows(participants, row.memberId || row.id),
      }));
  }

  const allMatches = Array.isArray(competition.matches) ? competition.matches : [];
  const finalMatch = allMatches.find((match) => clean(match.phase || "") === "final" && clean(match.resultStatus || match.status) === "completed")
    || allMatches.slice().reverse().find((match) => clean(match.resultStatus || match.status) === "completed" && cleanId(match.winnerMemberId || ""));
  const thirdMatch = allMatches.find((match) => clean(match.phase || "") === "third_place" && clean(match.resultStatus || match.status) === "completed");
  const rows = [];
  if (finalMatch?.winnerMemberId) rows.push({ rank: 1, memberId: cleanId(finalMatch.winnerMemberId), memberName: finalMatch.winnerName || finalMatch.winnerMemberName || finalMatch.homeName || "" });
  const runner = finalMatch ? loserFromMatch(finalMatch) : null;
  if (runner?.memberId) rows.push({ rank: 2, ...runner });
  if (thirdMatch?.winnerMemberId) rows.push({ rank: 3, memberId: cleanId(thirdMatch.winnerMemberId), memberName: thirdMatch.winnerName || thirdMatch.winnerMemberName || "" });
  const fourth = thirdMatch ? loserFromMatch(thirdMatch) : null;
  if (fourth?.memberId) rows.push({ rank: 4, ...fourth });

  if (!rows.length && competition.championMemberId) {
    rows.push({ rank: 1, memberId: cleanId(competition.championMemberId), memberName: competition.championMemberName || competition.championName || "" });
  }
  return rows;
}

function seasonPointsEventLabel(type = "", rank = 0) {
  const typeLabel = {
    world_cup: "كأس العالم",
    champions_league: "دوري الأبطال",
    league: "الدوري",
    cup: "الكأس",
    super_cup: "السوبر",
  }[type] || type || "بطولة";
  const rankLabel = rank === 1 ? "البطل" : rank === 2 ? "الوصيف" : rank === 3 ? "الثالث" : rank === 4 ? "الرابع" : `المركز ${rank}`;
  return `${rankLabel} - ${typeLabel}`;
}

function firstCleanIdFromRow(row = {}, keys = []) {
  for (const key of keys) {
    const value = row?.[key];
    const id = cleanId(value || "");
    if (id) return id;
  }
  return "";
}

function firstTextFromRow(row = {}, keys = []) {
  for (const key of keys) {
    const value = String(row?.[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function sheetTournamentType(row = {}) {
  return normalizeSeasonPointsType(
    row.competitionType ||
    row.competitiontype ||
    row.type ||
    row.trophyType ||
    row.trophytype ||
    row.trophyId ||
    row.trophyid ||
    row.trophyName ||
    row.trophyname ||
    row.name ||
    row.title ||
    ""
  );
}

function sheetTournamentDate(row = {}) {
  return String(row.completedDate || row.completeddate || row.endDate || row.enddate || row.date || row.createdAt || row.createdat || "").slice(0, 10);
}

function sheetPlacementRows(row = {}) {
  const placements = [];
  const add = (rank, idKeys, nameKeys) => {
    const memberId = firstCleanIdFromRow(row, idKeys);
    if (!memberId) return;
    placements.push({
      rank,
      memberId,
      memberName: firstTextFromRow(row, nameKeys) || memberId,
    });
  };

  add(1,
    ["winnerId", "winnerid", "championId", "championid", "memberId", "memberid", "rank1Id", "rank1id", "firstId", "firstid"],
    ["winnerName", "winnername", "championName", "championname", "memberName", "membername", "rank1Name", "rank1name", "firstName", "firstname"]
  );
  add(2,
    ["runnerUpId", "runnerupid", "runnerId", "runnerid", "secondId", "secondid", "rank2Id", "rank2id", "finalist2Id", "finalist2id", "viceChampionId", "vicechampionid"],
    ["runnerUpName", "runnerupname", "runnerName", "runnername", "secondName", "secondname", "rank2Name", "rank2name", "finalist2Name", "finalist2name", "viceChampionName", "vicechampionname"]
  );
  add(3,
    ["thirdId", "thirdid", "thirdPlaceId", "thirdplaceid", "rank3Id", "rank3id"],
    ["thirdName", "thirdname", "thirdPlaceName", "thirdplacename", "rank3Name", "rank3name"]
  );
  add(4,
    ["fourthId", "fourthid", "fourthPlaceId", "fourthplaceid", "rank4Id", "rank4id"],
    ["fourthName", "fourthname", "fourthPlaceName", "fourthplacename", "rank4Name", "rank4name"]
  );
  add(5,
    ["fifthId", "fifthid", "fifthPlaceId", "fifthplaceid", "rank5Id", "rank5id"],
    ["fifthName", "fifthname", "fifthPlaceName", "fifthplacename", "rank5Name", "rank5name"]
  );
  add(6,
    ["sixthId", "sixthid", "sixthPlaceId", "sixthplaceid", "rank6Id", "rank6id"],
    ["sixthName", "sixthname", "sixthPlaceName", "sixthplacename", "rank6Name", "rank6name"]
  );

  return placements;
}

function seasonPointSourceText(value = "") {
  return clean(String(value || "").trim());
}

function hasTournamentNumber(value = "") {
  return /[0-9٠-٩]/.test(String(value || ""));
}

function genericTournamentText(value = "") {
  const key = seasonPointSourceText(value);
  return [
    "الدوري",
    "دوري",
    "الكاس",
    "الكأس",
    "كاس",
    "كأس",
    "السوبر",
    "كاسالسوبر",
    "كأسالسوبر",
    "دوريالابطال",
    "دوريالأبطال",
    "كاسالعالم",
    "كأسالعالم",
    "league",
    "cup",
    "supercup",
    "championsleague",
    "worldcup",
  ].includes(key);
}

function specificTournamentTextFromRow(row = {}, keys = []) {
  for (const key of keys) {
    const raw = String(row?.[key] ?? "").trim();
    const value = seasonPointSourceText(raw);
    if (!value || genericTournamentText(value)) continue;
    if (hasTournamentNumber(raw) || value.length >= 8) return value;
  }
  return "";
}

function sourceKeysForSeasonPointRow(type = "", row = {}, placements = []) {
  const safeType = normalizeSeasonPointsType(type);
  const keys = new Set();
  if (!safeType) return keys;

  const explicitId = firstCleanIdFromRow(row, [
    "competitionId", "competitionid", "firebaseCompetitionId", "firebasecompetitionid",
    "competitiveCompetitionId", "competitivecompetitionid", "competitionDocId", "competitiondocid",
    "id", "docId", "docid"
  ]);
  if (explicitId) keys.add(`id::${explicitId}`);

  const championPlacement = (placements || []).find((item) => toNumber(item.rank || 0) === 1);
  const championId = cleanId(championPlacement?.memberId || "") || firstCleanIdFromRow(row, [
    "winnerId", "winnerid", "championId", "championid", "championMemberId", "championmemberid",
    "winnerMemberId", "winnermemberid", "memberId", "memberid", "rank1Id", "rank1id", "firstId", "firstid"
  ]);

  const date = sheetTournamentDate(row);
  const name = specificTournamentTextFromRow(row, [
    "competitionName", "competitionname", "name", "title", "tournamentName", "tournamentname",
    "seasonTournamentName", "seasontournamentname", "editionName", "editionname"
  ]);
  const edition = specificTournamentTextFromRow(row, [
    "edition", "editionNo", "editionno", "editionNumber", "editionnumber",
    "tournamentNumber", "tournamentnumber", "competitionNumber", "competitionnumber",
    "trophyNumber", "trophynumber", "version", "number"
  ]);

  if (safeType && championId && date) keys.add(`type_champion_date::${safeType}::${championId}::${date}`);
  if (safeType && championId && name) keys.add(`type_champion_name::${safeType}::${championId}::${name}`);
  if (safeType && championId && edition) keys.add(`type_champion_edition::${safeType}::${championId}::${edition}`);
  if (safeType && name && date) keys.add(`type_name_date::${safeType}::${name}::${date}`);
  if (safeType && edition && date) keys.add(`type_edition_date::${safeType}::${edition}::${date}`);
  if (safeType && name && hasTournamentNumber(name)) keys.add(`type_name::${safeType}::${name}`);
  if (safeType && edition) keys.add(`type_edition::${safeType}::${edition}`);

  return keys;
}

function sourceKeysForFirebaseCompetition(type = "", competition = {}, placements = []) {
  const safeType = normalizeSeasonPointsType(type || competition.type || competition.competitionType || "");
  const keys = new Set();
  if (!safeType) return keys;

  const id = cleanId(competition.id || competition.competitionId || competition.competitionid || competition.docId || competition.docid || "");
  if (id) keys.add(`id::${id}`);

  const championPlacement = (placements || []).find((item) => toNumber(item.rank || 0) === 1);
  const championId = cleanId(
    championPlacement?.memberId ||
    competition.championMemberId ||
    competition.championmemberid ||
    competition.winnerMemberId ||
    competition.winnermemberid ||
    competition.winnerId ||
    competition.winnerid ||
    ""
  );

  const date = String(competition.completedDate || competition.completeddate || competition.endDate || competition.enddate || competition.date || competition.startDate || competition.startdate || "").slice(0, 10);
  const name = specificTournamentTextFromRow(competition, [
    "competitionName", "competitionname", "name", "title", "tournamentName", "tournamentname",
    "seasonTournamentName", "seasontournamentname", "editionName", "editionname"
  ]);
  const edition = specificTournamentTextFromRow(competition, [
    "edition", "editionNo", "editionno", "editionNumber", "editionnumber",
    "tournamentNumber", "tournamentnumber", "competitionNumber", "competitionnumber",
    "trophyNumber", "trophynumber", "version", "number"
  ]);

  if (safeType && championId && date) keys.add(`type_champion_date::${safeType}::${championId}::${date}`);
  if (safeType && championId && name) keys.add(`type_champion_name::${safeType}::${championId}::${name}`);
  if (safeType && championId && edition) keys.add(`type_champion_edition::${safeType}::${championId}::${edition}`);
  if (safeType && name && date) keys.add(`type_name_date::${safeType}::${name}::${date}`);
  if (safeType && edition && date) keys.add(`type_edition_date::${safeType}::${edition}::${date}`);
  if (safeType && name && hasTournamentNumber(name)) keys.add(`type_name::${safeType}::${name}`);
  if (safeType && edition) keys.add(`type_edition::${safeType}::${edition}`);

  return keys;
}

function sourceKeySetsIntersect(a = new Set(), b = new Set()) {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}


function dedupeSeasonPointSheetRows(rows = []) {
  const accepted = [];
  const seenKeySets = [];
  (rows || []).forEach((item) => {
    const keys = sourceKeysForSeasonPointRow(item.type, item.row, item.placements);
    if (!keys.size) {
      keys.add(`fallback::${item.type}::${seasonPointDisplayName(item.row, item.type, 1)}::${sheetTournamentDate(item.row)}`);
    }
    const duplicate = seenKeySets.some((existing) => sourceKeySetsIntersect(existing, keys));
    if (duplicate) return;
    accepted.push(item);
    seenKeySets.push(keys);
  });
  return accepted;
}



function seasonPointsTypeLabel(type = "") {
  return {
    world_cup: "كأس العالم",
    champions_league: "دوري الأبطال",
    league: "الدوري",
    cup: "الكأس",
    super_cup: "كأس السوبر",
  }[normalizeSeasonPointsType(type)] || String(type || "بطولة");
}

function seasonPointFirstText(row = {}, keys = []) {
  for (const key of keys) {
    const value = String(row?.[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function seasonPointEditionText(row = {}) {
  return seasonPointFirstText(row, [
    "edition", "editionNo", "editionno", "editionNumber", "editionnumber",
    "tournamentNumber", "tournamentnumber", "competitionNumber", "competitionnumber",
    "trophyNumber", "trophynumber", "version", "number", "copy", "copyNumber",
    "serial", "serialNumber", "archiveNumber", "archivenumber", "recordNumber", "recordnumber",
    "نسخة", "النسخة", "رقمالنسخة", "رقم_النسخة", "رقمالبطولة", "رقم_البطولة"
  ]);
}

function seasonPointDisplayName(sourceRow = {}, type = "", rank = 0) {
  const typeLabel = seasonPointsTypeLabel(type);
  const named = seasonPointFirstText(sourceRow, [
    "fullName", "fullname", "displayName", "displayname",
    "archiveName", "archivename", "recordName", "recordname",
    "competitionName", "competitionname", "tournamentName", "tournamentname",
    "seasonTournamentName", "seasontournamentname", "editionName", "editionname",
    "title", "name", "trophyName", "trophyname"
  ]);
  const edition = seasonPointEditionText(sourceRow);

  if (named && edition && !String(named).includes(String(edition))) return `${named} ${edition}`;
  if (named && !genericTournamentText(named)) return named;
  if (edition && !String(typeLabel).includes(String(edition))) return `${typeLabel} ${edition}`;
  if (named) return named;
  return seasonPointsEventLabel(type, rank);
}

function seasonPointFinalText(row = {}) {
  return seasonPointFirstText(row, [
    "finalResult", "finalresult", "result", "score", "finalScore", "finalscore",
    "matchResult", "matchresult", "final", "notes", "note", "details", "description"
  ]);
}

function buildSeasonPointDetails(sourceRow = {}, type = "", rank = 0, points = 0, memberName = "") {
  const normalizedType = normalizeSeasonPointsType(type);
  const edition = seasonPointEditionText(sourceRow);
  const details = {
    name: seasonPointDisplayName(sourceRow, normalizedType, rank),
    type: normalizedType,
    typeLabel: seasonPointsTypeLabel(normalizedType),
    edition,
    rank,
    rankLabel: rank === 1 ? "البطل" : rank === 2 ? "الوصيف" : rank === 3 ? "الثالث" : rank === 4 ? "الرابع" : rank === 5 ? "الخامس" : rank === 6 ? "السادس" : (rank ? `المركز ${rank}` : "-"),
    points: toNumber(points || 0),
    memberName: memberName || "",
    date: sourceRow.completedDate || sourceRow.completeddate || sourceRow.endDate || sourceRow.enddate || sourceRow.date || sourceRow.createdAt || sourceRow.createdat || "",
    championName: seasonPointFirstText(sourceRow, ["winnerName", "winnername", "championName", "championname", "rank1Name", "rank1name", "firstName", "firstname", "winnerId", "winnerid", "championId", "championid", "memberId", "memberid"]),
    runnerUpName: seasonPointFirstText(sourceRow, ["runnerUpName", "runnerupname", "runnerName", "runnername", "secondName", "secondname", "rank2Name", "rank2name", "finalist2Name", "finalist2name", "runnerUpId", "runnerupid", "runnerId", "runnerid", "secondId", "secondid"]),
    thirdName: seasonPointFirstText(sourceRow, ["thirdName", "thirdname", "thirdPlaceName", "thirdplacename", "rank3Name", "rank3name", "thirdId", "thirdid", "thirdPlaceId", "thirdplaceid"]),
    fourthName: seasonPointFirstText(sourceRow, ["fourthName", "fourthname", "fourthPlaceName", "fourthplacename", "rank4Name", "rank4name", "fourthId", "fourthid", "fourthPlaceId", "fourthplaceid"]),
    fifthName: seasonPointFirstText(sourceRow, ["fifthName", "fifthname", "fifthPlaceName", "fifthplacename", "rank5Name", "rank5name", "fifthId", "fifthid", "rank5Id", "rank5id"]),
    sixthName: seasonPointFirstText(sourceRow, ["sixthName", "sixthname", "sixthPlaceName", "sixthplacename", "rank6Name", "rank6name", "sixthId", "sixthid", "rank6Id", "rank6id"]),
    finalText: seasonPointFinalText(sourceRow),
    system: sourceRow.system || sourceRow.tournamentSystem || sourceRow.tournamentsystem || "",
    notes: sourceRow.notes || sourceRow.note || "",
    source: sourceRow.source || "",
  };
  return details;
}

function addSeasonPointEventToMember({
  membersMap,
  memberId,
  memberName = "",
  type,
  rank,
  points,
  sourceRow = {},
  source = "",
  competitionId = "",
} = {}) {
  const safeId = cleanId(memberId || "");
  if (!safeId || !type || !rank) return;
  if (!membersMap.has(safeId)) {
    membersMap.set(safeId, {
      memberId: safeId,
      id: safeId,
      name: memberName || safeId,
      team: "",
      avatar: "",
      teamLogo: "",
      nationalLogo: "",
      titles: 0,
      points: 0,
      rows: [],
      pointEvents: [],
      titleBreakdown: {},
    });
  }

  const target = membersMap.get(safeId);
  const safePoints = toNumber(points || 0);
  target.points += safePoints;
  const eventDetails = buildSeasonPointDetails(sourceRow, type, rank, safePoints, target.name || memberName || safeId);
  const eventRow = {
    id: sourceRow.id || sourceRow.recordId || sourceRow.recordid || competitionId || "",
    competitionId,
    trophyId: type,
    name: eventDetails.name,
    type,
    typeLabel: eventDetails.typeLabel,
    rank,
    rankLabel: eventDetails.rankLabel,
    points: safePoints,
    winnerId: rank === 1 ? safeId : "",
    memberId: safeId,
    memberName: target.name || memberName || safeId,
    date: eventDetails.date,
    details: eventDetails,
    source,
  };
  target.pointEvents.push(eventRow);
  if (rank === 1) {
    target.titles += 1;
    target.titleBreakdown[type] = toNumber(target.titleBreakdown[type] || 0) + 1;
    target.rows.push({ ...eventRow, winnerId: safeId });
  }
}

function computeSeasonPointsRanking({
  members = [],
  competitions = [],
  sheetSeasonRows = [],
  activeSeasonId = "",
  pointsRules = [],
  competitionPriority = [],
} = {}) {
  const ruleMap = buildSeasonPointsRuleMap(pointsRules);
  const priorityRows = buildCompetitionPriorityList(competitionPriority);
  const membersMap = new Map();
  const sheetRowsWithPlacements = dedupeSeasonPointSheetRows(
    (sheetSeasonRows || [])
      .map((row) => {
        const type = sheetTournamentType(row);
        const placements = sheetPlacementRows(row);
        return { row, type, placements };
      })
      .filter((item) => item.type && item.placements.length)
  );

  (members || []).forEach((member) => {
    const memberId = cleanId(member.id || member.memberId || "");
    if (!memberId) return;
    membersMap.set(memberId, {
      ...member,
      memberId,
      id: memberId,
      name: member.name || member.memberName || memberId,
      team: member.team || "",
      avatar: member.avatar || member.image || "",
      teamLogo: member.teamlogo || member.teamLogo || "",
      nationalLogo: member.nationallogo || member.nationalLogo || "",
      titles: 0,
      points: 0,
      rows: [],
      pointEvents: [],
      titleBreakdown: {},
    });
  });

  // Season points are intentionally calculated from Google Sheets only.
  // Firebase competitions are used to organize/play tournaments inside the app,
  // but they do not affect the official season ranking until the tournament
  // is recorded in the season/archive sheet with placement columns.

  sheetRowsWithPlacements.forEach(({ row, type, placements }) => {
    placements.forEach((placement) => {
      const rank = toNumber(placement.rank || 0);
      const ruleKey = `${type}::${rank}`;
      if (!ruleMap.has(ruleKey)) return;
      addSeasonPointEventToMember({
        membersMap,
        memberId: placement.memberId,
        memberName: placement.memberName,
        type,
        rank,
        points: ruleMap.get(ruleKey),
        sourceRow: row,
        source: "season_sheet_points",
        competitionId: row.competitionId || row.competitionid || "",
      });
    });
  });

  return Array.from(membersMap.values())
    .map((row) => ({
      ...row,
      points: Math.max(0, toNumber(row.points || 0)),
      titles: Math.max(0, toNumber(row.titles || 0)),
      rows: sortRecordsDesc(row.rows || []),
      pointEvents: sortRecordsDesc(row.pointEvents || []),
    }))
    .sort((a, b) => {
      if (toNumber(b.points) !== toNumber(a.points)) return toNumber(b.points) - toNumber(a.points);
      for (const item of priorityRows) {
        const type = item.competitionType;
        const diff = toNumber(b.titleBreakdown?.[type] || 0) - toNumber(a.titleBreakdown?.[type] || 0);
        if (diff) return diff;
      }
      if (toNumber(b.titles) !== toNumber(a.titles)) return toNumber(b.titles) - toNumber(a.titles);
      return String(a.name || "").localeCompare(String(b.name || ""), "ar");
    });
}

function parseMaxProfessionalPlayersLimit(value, fallback = MAX_PRO_PLAYERS) {
  const raw = String(value ?? "").trim();
  const key = clean(raw);
  if (["unlimited", "open", "infinite", "infinity", "مفتوح", "بلاحد", "بدونحد"].includes(key)) return Infinity;
  const parsed = toNumber(raw);
  return parsed > 0 ? parsed : fallback;
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [trophiesMaster, setTrophiesMaster] = useState([]);
  const [leagueArchive, setLeagueArchive] = useState([]);
  const [tournamentsArchive, setTournamentsArchive] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [finance, setFinance] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [importantLinks, setImportantLinks] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [pointsRules, setPointsRules] = useState([]);
  const [competitionPriority, setCompetitionPriority] = useState([]);

  const [page, setPage] = useState(DEFAULT_CONFIG.defaultPage);
  const [selectedId, setSelectedId] = useState("");
  const [memberTab, setMemberTab] = useState("players");
  const [transferPeriod, setTransferPeriod] = useState("");
  const [search, setSearch] = useState("");
  const [detailView, setDetailView] = useState(null);
  const [detailStack, setDetailStack] = useState([]);
  const baseScrollRef = useRef(0);
  const memberReturnRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const restoringScrollRef = useRef(false);
  // Stack of page-level navigation for proper back behaviour
  const pageHistoryRef = useRef([]);
  const [infoModal, setInfoModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topBarScrolled, setTopBarScrolled] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseMoneyTransfers, setFirebaseMoneyTransfers] = useState([]);
  const [firebasePlayerOffers, setFirebasePlayerOffers] = useState([]);
  const [firebaseNotifications, setFirebaseNotifications] = useState([]);
  const [firebaseTransferWindows, setFirebaseTransferWindows] = useState([]);
  const [firebasePlayerContracts, setFirebasePlayerContracts] = useState([]);
  const [firebaseTransferHistory, setFirebaseTransferHistory] = useState([]);
  const [firebasePlayerReleases, setFirebasePlayerReleases] = useState([]);
  const [firebaseFreeAgentRegistrations, setFirebaseFreeAgentRegistrations] = useState([]);
  const [firebaseFreePlayerStatus, setFirebaseFreePlayerStatus] = useState([]);
  const [firebaseFreeAgentQueue, setFirebaseFreeAgentQueue] = useState([]);
  const [firebaseMemberRestrictions, setFirebaseMemberRestrictions] = useState([]);
  const [firebaseAdminDecisions, setFirebaseAdminDecisions] = useState([]);
  const [firebaseAdminNotes, setFirebaseAdminNotes] = useState([]);
  const [firebasePushTokens, setFirebasePushTokens] = useState([]);
  const [firebaseCompetitions, setFirebaseCompetitions] = useState([]);
  const [focusedCompetitionId, setFocusedCompetitionId] = useState("");

  const maxProfessionalPlayersLimit = useMemo(
    () => parseMaxProfessionalPlayersLimit(config.maxProfessionalPlayers, MAX_PRO_PLAYERS),
    [config.maxProfessionalPlayers]
  );
  const maxProfessionalPlayersLabel = Number.isFinite(maxProfessionalPlayersLimit)
    ? String(maxProfessionalPlayersLimit)
    : "مفتوح";
  const proLimitExceeded = (value) =>
    Number.isFinite(maxProfessionalPlayersLimit) && toNumber(value) > maxProfessionalPlayersLimit;
  const [seasonHubTab, setSeasonHubTab] = useState("members");
  const [archiveDefaultMode, setArchiveDefaultMode] = useState("trophy");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navStateRef = useRef(null);
  const backLockRef = useRef(false);
  const [pushStatus, setPushStatus] = useState(getInitialPushStatus());
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport)
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
      );
    document.title = "FIFA GROUP";
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setAuthUser(null);
          setAuthProfile(null);
          setAuthLoading(false);
          return;
        }

        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);
        setAuthUser(user);
        setAuthProfile(profileSnap.exists() ? profileSnap.data() : null);
      } catch (err) {
        console.error("Auth profile failed:", err);
        setAuthUser(user || null);
        setAuthProfile(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (!authUser) {
      setFirebaseMoneyTransfers([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "moneyTransfers"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => {
          const data = item.data() || {};
          return {
            id: item.id,
            ...data,
            type: data.type || "تحويل مالي",
            direction: "transfer",
            amount: data.amount,
            fromMemberId: data.fromMemberId,
            toMemberId: data.toMemberId,
            date: data.date || formatTransferDate(data.createdAt),
            note: data.note || "تحويل تلقائي من التطبيق",
          };
        });
        setFirebaseMoneyTransfers(rows);
      },
      (err) => {
        console.error("Money transfers listener failed:", err);
        setFirebaseMoneyTransfers([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebasePlayerOffers([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "playerOffers"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebasePlayerOffers(rows);
      },
      (err) => {
        console.error("Player offers listener failed:", err);
        setFirebasePlayerOffers([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseNotifications([]);
      return undefined;
    }

    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseNotifications(rows);
      },
      (err) => {
        console.error("Notifications listener failed:", err);
        setFirebaseNotifications([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseTransferWindows([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "transferWindows"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseTransferWindows(rows);
      },
      (err) => {
        console.error("Transfer windows listener failed:", err);
        setFirebaseTransferWindows([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebasePlayerContracts([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "playerContracts"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebasePlayerContracts(rows);
      },
      (err) => {
        console.error("Player contracts listener failed:", err);
        setFirebasePlayerContracts([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseTransferHistory([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "transferHistory"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseTransferHistory(rows);
      },
      (err) => {
        console.error("Transfer history listener failed:", err);
        setFirebaseTransferHistory([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);


  useEffect(() => {
    if (!authUser) {
      setFirebasePlayerReleases([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "playerReleases"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebasePlayerReleases(rows);
      },
      (err) => {
        console.error("Player releases listener failed:", err);
        setFirebasePlayerReleases([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseFreeAgentRegistrations([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "freeAgentRegistrations"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseFreeAgentRegistrations(rows);
      },
      (err) => {
        console.error("Free agent registrations listener failed:", err);
        setFirebaseFreeAgentRegistrations([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseFreePlayerStatus([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "freePlayerStatus"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseFreePlayerStatus(rows);
      },
      (err) => {
        console.error("Free player status listener failed:", err);
        setFirebaseFreePlayerStatus([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseFreeAgentQueue([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "freeAgentQueue"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseFreeAgentQueue(rows);
      },
      (err) => {
        console.error("Free agent queue listener failed:", err);
        setFirebaseFreeAgentQueue([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);


  useEffect(() => {
    if (!authUser) {
      setFirebaseMemberRestrictions([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "memberRestrictions"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseMemberRestrictions(rows);
      },
      (err) => {
        console.error("Member restrictions listener failed:", err);
        setFirebaseMemberRestrictions([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);


  useEffect(() => {
    if (!authUser) {
      setFirebaseAdminDecisions([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "adminDecisions"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseAdminDecisions(rows);
      },
      (err) => {
        console.error("Admin decisions listener failed:", err);
        setFirebaseAdminDecisions([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setFirebaseAdminNotes([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "adminNotes"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseAdminNotes(rows);
      },
      (err) => {
        console.error("Admin notes listener failed:", err);
        setFirebaseAdminNotes([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !isFifaAdminProfile(authProfile)) {
      setFirebasePushTokens([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "pushTokens"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebasePushTokens(rows);
      },
      (err) => {
        console.error("Push tokens listener failed:", err);
        setFirebasePushTokens([]);
      }
    );

    return () => unsubscribe();
  }, [authUser, authProfile]);


  useEffect(() => {
    if (!authUser) {
      setFirebaseCompetitions([]);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "competitions"),
      (snapshot) => {
        const rows = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() || {}),
        }));
        setFirebaseCompetitions(rows);
      },
      (err) => {
        console.error("Competitions listener failed:", err);
        setFirebaseCompetitions([]);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    // Keep the professional V4 splash visible until BOTH data loading and auth check finish.
    // This prevents the internal loading card/text from flashing after the splash.
    if (loading || authLoading) return;

    const splash = document.getElementById("fifa-splash");
    if (!splash) return;

    const timer = window.setTimeout(() => {
      splash.classList.add("fifa-splash-hide");

      window.setTimeout(() => {
        splash.remove();
      }, 460);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [loading, authLoading]);

  useEffect(() => {
    if (loading) return undefined;
    const appNode = document.querySelector(".app");
    if (!appNode) return undefined;

    let ticking = false;
    function updateTopBarState() {
      ticking = false;
      setTopBarScrolled(appNode.scrollTop > 12);
    }

    function handleAppScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateTopBarState);
    }

    updateTopBarState();
    appNode.addEventListener("scroll", handleAppScroll, { passive: true });

    return () => {
      appNode.removeEventListener("scroll", handleAppScroll);
    };
  }, [loading]);

  useEffect(() => {
    navStateRef.current = {
      page,
      selectedId,
      detailView,
      detailStack,
      menuOpen,
      infoModal,
      notificationsOpen,
    };
  }, [page, selectedId, detailView, detailStack, menuOpen, infoModal, notificationsOpen]);

  useEffect(() => {
    try {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
      const currentState = window.history.state || {};
      window.history.replaceState({ ...currentState, fifaGroupRoot: true, fifaGroupBase: true }, "");
      window.history.pushState({ fifaGroupRoot: true, fifaGroupGuard: true }, "");
    } catch {}

    function handleNativeBack() {
      performStableBack({ fromNative: true });
    }

    window.addEventListener("popstate", handleNativeBack);
    return () => window.removeEventListener("popstate", handleNativeBack);
  }, []);

  async function loadData() {
    const fetchWithCache = async (url, isOptional = false) => {
      const cacheKey = `fg_cache_${url}`;
      const fetcher = isOptional ? loadOptionalCSV : loadCSV;
      
      const networkPromise = fetcher(url).then(data => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }).catch(err => {
        if (!isOptional) console.warn("تعذر الجلب من الشبكة:", url);
        return null;
      });

      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return { data: JSON.parse(cached), isCached: true, networkPromise };
        } catch(e) {}
      }
      
      const freshData = await networkPromise;
      if (!freshData && !isOptional) throw new Error("فشل الاتصال ولا يوجد كاش");
      return { data: freshData || [], isCached: false, networkPromise: null };
    };

    try {
      const results = await Promise.all([
        fetchWithCache(URLS.members), fetchWithCache(URLS.players),
        fetchWithCache(URLS.trophiesMaster), fetchWithCache(URLS.leagueArchive),
        fetchWithCache(URLS.tournamentsArchive), fetchWithCache(URLS.seasons),
        fetchWithCache(URLS.finance), fetchWithCache(URLS.transfers),
        fetchWithCache(URLS.importantLinks), fetchWithCache(URLS.settings, true),
        fetchWithCache(URLS.pointsRules, true), fetchWithCache(URLS.competitionPriority, true),
      ]);

      const applyDataToState = (dataArray) => {
        const [mRows, pRows, masterRows, leagueRows, tourRows, sRows, fRows, tRows, lRows, sRows2, pointRows, priorityRows] = dataArray;
        const nextConfig = buildConfig(sRows2);
        const periods = getTransferPeriods(tRows);

        setMembers(mRows.map(m => ({
          ...m,
          avatar: normalizeImageUrl(m.avatar || "") || m.avatar || "",
          image: normalizeImageUrl(m.image || "") || m.image || "",
          teamlogo: normalizeImageUrl(m.teamlogo || "") || m.teamlogo || "",
          nationallogo: normalizeImageUrl(m.nationallogo || "") || m.nationallogo || "",
        })));
        setPlayers(pRows);
        setTrophiesMaster(masterRows);
        setLeagueArchive(leagueRows);
        setTournamentsArchive(tourRows);
        setSeasons(sRows);
        setFinance(fRows);
        setTransfers(tRows);
        setImportantLinks(lRows);
        setPointsRules(pointRows || []);
        setCompetitionPriority(priorityRows || []);
        setConfig(nextConfig);
        setTransferPeriod(periods[0]?.id || "");
      };

      const currentData = results.map(r => r.data);
      applyDataToState(currentData);
      setPage("home");
      setLoading(false);

      if (results.some(r => r.isCached)) {
        Promise.all(results.map(r => r.networkPromise || r.data)).then(applyDataToState).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError(DEFAULT_CONFIG.errorTitle);
      setLoading(false);
    }
  }

  const trophyMap = useMemo(
    () => buildTrophyMap(trophiesMaster),
    [trophiesMaster]
  );

  const allTournaments = useMemo(() => {
    const league = leagueArchive
      .filter(hasRecord)
      .map((row) => normalizeTournamentRow(row, "league", trophyMap));
    const other = tournamentsArchive
      .filter(hasRecord)
      .map((row) => normalizeTournamentRow(row, "tournament", trophyMap));
    return [...league, ...other].sort(sortByDateAsc);
  }, [leagueArchive, tournamentsArchive, trophyMap]);

  const activeSeasonId = getActiveSeasonId(seasons, config);
  const activeSeason = findSeason(seasons, activeSeasonId);
  const activeSeasonRows = useMemo(
    () =>
      allTournaments
        .filter((item) => same(item.seasonId, activeSeasonId))
        .sort(sortByDateAsc),
    [allTournaments, activeSeasonId]
  );
  const activeMembers = useMemo(() => getActiveMembers(members), [members]);
  const finalStatsByMember = useMemo(
    () => computeMemberStats(members, allTournaments),
    [members, allTournaments]
  );

  function totalForMember(memberId) {
    return allTournaments.filter((item) => same(item.winnerId, memberId))
      .length;
  }

  const rankedMembers = useMemo(() => {
    const seasonRows = computeSeasonPointsRanking({
      members: activeMembers,
      competitions: firebaseCompetitions,
      sheetSeasonRows: activeSeasonRows,
      activeSeasonId,
      pointsRules,
      competitionPriority,
    });
    const memberMap = new Map(activeMembers.map((member) => [cleanId(member.id || member.memberId || ""), member]));
    return seasonRows.map((row, index) => {
      const memberId = cleanId(row.memberId || row.id || "");
      const base = memberMap.get(memberId) || {};
      return {
        ...base,
        ...row,
        id: memberId,
        memberId,
        name: row.name || base.name || base.memberName || memberId,
        team: row.team || base.team || "",
        avatar: row.avatar || base.avatar || base.image || "",
        teamLogo: row.teamLogo || base.teamlogo || base.teamLogo || "",
        nationalLogo: row.nationalLogo || base.nationallogo || base.nationalLogo || "",
        titles: Math.max(0, toNumber(row.titles || 0)),
        points: Math.max(0, toNumber(row.points || 0)),
        rankOrder: index + 1,
      };
    });
  }, [activeMembers, firebaseCompetitions, activeSeasonRows, activeSeasonId, pointsRules, competitionPriority]);

  const currentMemberId = cleanId(authProfile?.memberId || authProfile?.memberid || "");
  const currentMember = members.find((member) => same(member.id, currentMemberId));
  const isFifaAdmin = isFifaAdminProfile(authProfile);
  const activeCurrentMemberRestrictions = useMemo(
    () => getActiveMemberRestrictions(firebaseMemberRestrictions, currentMemberId),
    [firebaseMemberRestrictions, currentMemberId]
  );
  const combinedFinance = useMemo(
    () => [...finance, ...firebaseMoneyTransfers],
    [finance, firebaseMoneyTransfers]
  );
  const currentMemberFinance = useMemo(
    () => getMemberFinanceRows(combinedFinance, currentMemberId),
    [combinedFinance, currentMemberId]
  );
  const currentMemberBalance = useMemo(
    () => computeMemberBalance(currentMemberFinance, currentMember?.balance, currentMemberId),
    [currentMemberFinance, currentMember?.balance, currentMemberId]
  );
  const activeCurrentMemberOffers = useMemo(
    () =>
      firebasePlayerOffers.filter((offer) => {
        if (!same(offer.fromMemberId, currentMemberId)) return false;
        return isFinanciallyReservedPlayerOffer(offer);
      }),
    [firebasePlayerOffers, currentMemberId]
  );
  const activeCurrentMemberFreeAgentQueue = useMemo(
    () =>
      firebaseFreeAgentQueue.filter((item) =>
        same(item.memberId, currentMemberId) &&
        ["pending_window", "processing"].includes(clean(item.status || "pending_window"))
      ),
    [firebaseFreeAgentQueue, currentMemberId]
  );
  const reservedOfferAmount = useMemo(
    () => activeCurrentMemberOffers.reduce((sum, offer) => sum + Math.max(0, toNumber(offer.amount)), 0),
    [activeCurrentMemberOffers]
  );
  const reservedFreeAgentAmount = useMemo(
    () => activeCurrentMemberFreeAgentQueue.reduce((sum, item) => sum + Math.max(0, toNumber(item.cost || item.feeAmount)), 0),
    [activeCurrentMemberFreeAgentQueue]
  );
  const currentMemberAvailableBalance = Math.max(0, currentMemberBalance - reservedOfferAmount - reservedFreeAgentAmount);
  const transferMarketOpen = isTransferMarketOpen(firebaseTransferWindows);
  const activePlayerContracts = useMemo(
    () => firebasePlayerContracts.filter((contract) => clean(contract.status || "active") === "active"),
    [firebasePlayerContracts]
  );
  const currentMemberPlayers = useMemo(
    () => getVisiblePlayersForMember(currentMemberId).sort((a, b) => toNumber(b.rating) - toNumber(a.rating)),
    [players, currentMemberId, activePlayerContracts]
  );
  const currentMemberNotifications = useMemo(
    () => firebaseNotifications
      .filter((item) => isNotificationVisibleToMember(item, currentMemberId))
      .sort((a, b) => notificationTimeValue(b.createdAt || b.date) - notificationTimeValue(a.createdAt || a.date)),
    [firebaseNotifications, currentMemberId]
  );
  const topBarNotifications = useMemo(
    () => currentMemberNotifications.slice(0, 10),
    [currentMemberNotifications]
  );
  const unreadNotificationsCount = currentMemberNotifications.filter((item) => clean(item.status || "unread") !== "read").length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search || "");
    const targetPage = cleanId(params.get("fgPage") || params.get("page"));
    const competitionId = cleanId(params.get("fgCompetitionId") || params.get("competitionId"));
    const memberIdParam = cleanId(params.get("fgMemberId") || params.get("memberId"));
    if (competitionId) {
      setFocusedCompetitionId(competitionId);
      setPage("season");
    } else if (targetPage === "finance" && memberIdParam) {
      setSelectedId(memberIdParam);
      setMemberTab("finance");
      setPage("members");
    } else if (targetPage === "notifications") {
      setNotificationsOpen(true);
    }
    if (targetPage || competitionId || memberIdParam) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({ fifaGroupRoot: true }, "", cleanUrl);
    }
  }, []);

  useEffect(() => {
    if (!authUser || pushStatus?.state !== "enabled") return undefined;
    if (typeof window === "undefined") return undefined;

    const unsubscribe = listenToForegroundPushMessages(async (payload) => {
      try {
        if (!("Notification" in window) || window.Notification.permission !== "granted") return;
        if (!("serviceWorker" in navigator)) return;

        const title =
          payload?.notification?.title ||
          payload?.data?.title ||
          "FIFA GROUP";
        const body =
          payload?.notification?.body ||
          payload?.data?.body ||
          "لديك إشعار جديد من FIFA GROUP.";
        const icon =
          payload?.notification?.icon ||
          payload?.data?.icon ||
          "/icon-192.png";
        const tag =
          payload?.data?.notificationId ||
          payload?.data?.id ||
          payload?.data?.relatedOfferId ||
          `fifa-group-${Date.now()}`;

        const registration =
          (await navigator.serviceWorker.getRegistration(PUSH_SW_PATH_FOR_FOREGROUND)) ||
          (await navigator.serviceWorker.ready);

        await registration.showNotification(title, {
          body,
          icon,
          badge: "/icon-192.png",
          tag,
          renotify: true,
          dir: "rtl",
          data: {
            url: window.location.origin,
            ...(payload?.data || {}),
          },
        });
      } catch (err) {
        console.error("Foreground push notification failed:", err);
      }
    });

    return unsubscribe;
  }, [authUser, pushStatus?.state]);

  async function handleEnablePushNotifications() {
    if (!authUser || !currentMemberId) {
      setPushStatus({
        state: "error",
        message: "اربط الحساب بعضو قبل تفعيل إشعارات الجوال.",
      });
      return;
    }

    setPushBusy(true);
    setPushStatus((current) => ({
      ...(current || getInitialPushStatus()),
      message: "جاري طلب إذن إشعارات الجوال...",
    }));

    try {
      const result = await enableFifaPushNotifications({
        authUser,
        memberId: currentMemberId,
        memberName: currentMember?.name || authProfile?.memberName || "",
        username: authProfile?.username || "",
      });
      setPushStatus(result);
    } catch (err) {
      console.error("Enable push notifications failed:", err);
      setPushStatus({
        state: "error",
        message: err?.message || "تعذر تفعيل إشعارات الجوال حاليًا.",
      });
    } finally {
      setPushBusy(false);
    }
  }


  async function handleDisablePushNotifications() {
    const token = cleanId(pushStatus?.token || "");
    if (!token) {
      setPushStatus({
        state: "error",
        message: "لا يوجد رمز إشعارات محفوظ لهذا الجهاز. يمكنك إيقاف الإشعارات من إعدادات الجهاز.",
      });
      return;
    }

    setPushBusy(true);
    try {
      await setDoc(
        doc(db, "pushTokens", pushTokenDocId(token)),
        {
          token,
          active: false,
          disabledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          disabledByMemberId: currentMemberId || "",
          disabledByUid: authUser?.uid || "",
        },
        { merge: true }
      );
      setPushStatus({
        state: "ready",
        message: "تم إيقاف إشعارات الجوال لهذا الجهاز. يمكنك إعادة تفعيلها لاحقًا.",
      });
    } catch (err) {
      console.error("Disable push notifications failed:", err);
      setPushStatus({
        state: "error",
        message: err?.message || "تعذر إيقاف إشعارات هذا الجهاز حاليًا.",
        token,
      });
    } finally {
      setPushBusy(false);
    }
  }

  async function recordFifaAdminDecision(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    return addDoc(collection(db, "adminDecisions"), {
      status: payload.status || "active",
      source: payload.source || "fifa_admin_panel",
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      clickUrl: payload.clickUrl || "/",
      ...payload,
    });
  }

  async function createAdminNotificationDoc(payload = {}) {
    return addDoc(collection(db, "notifications"), {
      status: "unread",
      fromMemberId: "FIFA",
      fromMemberName: "FIFA",
      source: payload.source || "fifa_admin_panel",
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...payload,
    });
  }

  async function createFifaAdminDecisionLog(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const type = clean(payload.type || payload.actionType || "admin_decision") || "admin_decision";
    const title = payload.title || adminDecisionTypeLabel(type);
    return addDoc(collection(db, "adminDecisions"), {
      type,
      title,
      status: payload.status || "completed",
      reason: String(payload.reason || payload.note || "").trim(),
      amount: Math.max(0, toNumber(payload.amount || 0)),
      fromMemberId: cleanId(payload.fromMemberId || ""),
      fromMemberName: payload.fromMemberName || "",
      toMemberId: cleanId(payload.toMemberId || ""),
      toMemberName: payload.toMemberName || "",
      memberId: cleanId(payload.memberId || payload.toMemberId || payload.fromMemberId || ""),
      memberName: payload.memberName || payload.toMemberName || payload.fromMemberName || "",
      beneficiaryMemberId: cleanId(payload.beneficiaryMemberId || ""),
      beneficiaryMemberName: payload.beneficiaryMemberName || "",
      relatedMoneyTransferId: payload.relatedMoneyTransferId || "",
      relatedCorrectionTransferId: payload.relatedCorrectionTransferId || "",
      relatedRestrictionId: payload.relatedRestrictionId || "",
      relatedNotificationId: payload.relatedNotificationId || "",
      originalAmount: payload.originalAmount || null,
      correctedAmount: payload.correctedAmount || null,
      source: "fifa_admin_panel",
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function createFifaAdminNotification(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const mode = payload.targetMode === "member" ? "member" : "all";
    const targetMemberId = cleanId(payload.targetMemberId || "");
    const type = clean(payload.type || "system_news") || "system_news";
    const title = String(payload.title || "").trim();
    const body = String(payload.body || "").trim();
    if (!title) throw new Error("اكتب عنوان الإشعار.");
    if (!body) throw new Error("اكتب نص الإشعار.");
    if (mode === "member" && !targetMemberId) throw new Error("اختر العضو المستلم.");
    const targetMember = mode === "member" ? members.find((member) => same(member.id, targetMemberId)) : null;
    const notificationRef = await createAdminNotificationDoc({
      type,
      title,
      body,
      audience: mode === "all" ? "all" : "member",
      toMemberId: mode === "member" ? targetMemberId : "",
      toMemberName: targetMember?.name || "",
      source: "fifa_admin_panel",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
    });
    await recordFifaAdminDecision({
      type: "admin_notification",
      typeLabel: "إشعار إداري",
      targetMode: mode,
      targetMemberId: mode === "member" ? targetMemberId : "",
      targetMemberName: targetMember?.name || "",
      title,
      body,
      relatedNotificationId: notificationRef.id,
      reversible: false,
      source: "fifa_admin_notifications",
    });
  }

  async function createFifaAdminReward(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const toMemberId = cleanId(payload.toMemberId || "");
    const amount = parseFinanceAmount(payload.amount);
    const rewardType = clean(payload.rewardType || "admin_reward") || "admin_reward";
    const note = String(payload.note || "").trim();
    if (!toMemberId) throw new Error("اختر العضو المستفيد.");
    if (same(toMemberId, "FIFA")) throw new Error("لا يمكن صرف مكافأة لحساب FIFA.");
    if (!amount || amount <= 0) throw new Error("أدخل مبلغًا صحيحًا أكبر من صفر.");
    const receiver = members.find((member) => same(member.id, toMemberId));
    if (!receiver) throw new Error("العضو المستفيد غير موجود.");
    const typeLabel = adminRewardTypeLabel(rewardType);
    const transferDate = new Date().toISOString().slice(0, 10);
    const transferRef = await addDoc(collection(db, "moneyTransfers"), {
      fromMemberId: "FIFA",
      fromMemberName: "FIFA",
      toMemberId,
      toMemberName: receiver.name || "",
      amount,
      type: rewardType,
      typeLabel,
      direction: "admin_reward",
      status: "approved",
      approvedBy: "FIFA",
      createdBy: authUser?.uid || "",
      username: authProfile?.username || "fifa",
      note: note || typeLabel,
      date: transferDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const notificationRef = await createAdminNotificationDoc({
      type: rewardType,
      title: typeLabel,
      body: "تمت إضافة " + formatMoney(amount) + " إلى حسابك من FIFA" + (note ? " - " + note : "."),
      audience: "member",
      toMemberId,
      toMemberName: receiver.name || "",
      relatedMoneyTransferId: transferRef.id,
      amount,
      source: "fifa_admin_panel",
    });
    await recordFifaAdminDecision({
      type: rewardType,
      typeLabel,
      status: "active",
      fromMemberId: "FIFA",
      fromMemberName: "FIFA",
      toMemberId,
      toMemberName: receiver.name || "",
      amount,
      note: note || typeLabel,
      relatedMoneyTransferId: transferRef.id,
      relatedNotificationId: notificationRef.id,
      reversible: true,
      correctionMode: "money_transfer",
      source: "fifa_admin_finance",
    });
  }


  async function createFifaAdminDiscipline(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const actionType = clean(payload.actionType || "financial_penalty");
    const memberId = cleanId(payload.memberId || "");
    const beneficiaryMemberId = cleanId(payload.beneficiaryMemberId || "");
    const amount = parseFinanceAmount(payload.amount);
    const reason = String(payload.reason || "").trim();
    const startDate = String(payload.startDate || "").slice(0, 10);
    const endDate = String(payload.endDate || "").slice(0, 10);
    const member = members.find((item) => same(item.id, memberId));
    if (!memberId || !member) throw new Error("اختر العضو صاحب العقوبة.");
    if (same(memberId, "FIFA")) throw new Error("لا يمكن تطبيق عقوبة على حساب FIFA.");
    if (!reason) throw new Error("اكتب سبب القرار الإداري.");

    if (["financial_penalty", "financial_deduction"].includes(actionType)) {
      if (!amount || amount <= 0) throw new Error("أدخل مبلغ الخصم أو الغرامة.");
      const typeLabel = actionType === "financial_deduction" ? "خصم إداري" : "غرامة مالية";
      const transferRef = await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: memberId,
        fromMemberName: member.name || "",
        toMemberId: "FIFA",
        toMemberName: "FIFA",
        amount,
        type: actionType === "financial_deduction" ? "admin_deduction" : "admin_penalty",
        typeLabel,
        direction: "admin_penalty",
        status: "approved",
        approvedBy: "FIFA",
        createdBy: authUser?.uid || "",
        username: authProfile?.username || "fifa",
        note: reason,
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: actionType === "financial_deduction" ? "admin_deduction" : "admin_penalty",
        title: typeLabel,
        body: "تم تطبيق " + typeLabel + " بقيمة " + formatMoney(amount) + " بسبب: " + reason,
        status: "unread",
        audience: "member",
        toMemberId: memberId,
        toMemberName: member.name || "",
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        relatedMoneyTransferId: transferRef.id,
        amount,
        source: "fifa_admin_penalties",
        createdBy: authUser?.uid || "",
        createdByMemberId: currentMemberId || "FIFA",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordFifaAdminDecision({
        type: actionType === "financial_deduction" ? "admin_deduction" : "admin_penalty",
        typeLabel,
        status: "active",
        fromMemberId: memberId,
        fromMemberName: member.name || "",
        toMemberId: "FIFA",
        toMemberName: "FIFA",
        amount,
        note: reason,
        reason,
        category: clean(payload.category || "financial_violation") || "financial_violation",
        relatedMoneyTransferId: transferRef.id,
        reversible: true,
        correctionMode: "money_transfer",
        source: "fifa_admin_penalties",
      });
      return;
    }

    if (actionType === "member_compensation") {
      if (!beneficiaryMemberId) throw new Error("اختر العضو المستفيد من التعويض.");
      if (same(memberId, beneficiaryMemberId)) throw new Error("لا يمكن أن يكون المتضرر والمستفيد نفس العضو.");
      if (!amount || amount <= 0) throw new Error("أدخل مبلغ التعويض.");
      const beneficiary = members.find((item) => same(item.id, beneficiaryMemberId));
      if (!beneficiary) throw new Error("العضو المستفيد غير موجود.");
      const transferRef = await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: memberId,
        fromMemberName: member.name || "",
        toMemberId: beneficiaryMemberId,
        toMemberName: beneficiary.name || "",
        amount,
        type: "admin_member_compensation",
        typeLabel: "تعويض مالي لعضو",
        direction: "admin_compensation_transfer",
        status: "approved",
        approvedBy: "FIFA",
        createdBy: authUser?.uid || "",
        username: authProfile?.username || "fifa",
        note: reason,
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: "admin_compensation_out",
        title: "تعويض مالي صادر",
        body: "تم خصم " + formatMoney(amount) + " من رصيدك كتعويض إداري بسبب: " + reason,
        status: "unread",
        audience: "member",
        toMemberId: memberId,
        toMemberName: member.name || "",
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        relatedMoneyTransferId: transferRef.id,
        amount,
        source: "fifa_admin_penalties",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: "admin_compensation_in",
        title: "تعويض مالي وارد",
        body: "تمت إضافة تعويض مالي إلى حسابك بقيمة " + formatMoney(amount) + " بسبب: " + reason,
        status: "unread",
        audience: "member",
        toMemberId: beneficiaryMemberId,
        toMemberName: beneficiary.name || "",
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        relatedMoneyTransferId: transferRef.id,
        amount,
        source: "fifa_admin_penalties",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordFifaAdminDecision({
        type: "admin_member_compensation",
        typeLabel: "تعويض مالي بين عضوين",
        status: "active",
        fromMemberId: memberId,
        fromMemberName: member.name || "",
        toMemberId: beneficiaryMemberId,
        toMemberName: beneficiary.name || "",
        amount,
        note: reason,
        reason,
        category: clean(payload.category || "financial_compensation") || "financial_compensation",
        relatedMoneyTransferId: transferRef.id,
        reversible: true,
        correctionMode: "money_transfer",
        source: "fifa_admin_penalties",
      });
      return;
    }

    if (actionType === "transfer_restriction") {
      if (!endDate) throw new Error("حدد تاريخ نهاية الإيقاف.");
      const restrictionPayload = buildAdminTransferRestrictionPayload(payload);
      const restrictionRef = await addDoc(collection(db, "memberRestrictions"), {
        memberId,
        memberName: member.name || "",
        type: "transfer_restriction",
        status: "active",
        reason,
        startDate,
        endDate,
        ...restrictionPayload,
        createdBy: authUser?.uid || "",
        createdByMemberId: currentMemberId || "FIFA",
        createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: "transfer_restriction",
        title: "قرار إيقاف من نظام الانتقالات",
        body: formatRestrictionNotificationBody({ reason, startDate, endDate, restriction: restrictionPayload }),
        status: "unread",
        audience: "member",
        toMemberId: memberId,
        toMemberName: member.name || "",
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        relatedRestrictionId: restrictionRef.id,
        source: "fifa_admin_penalties",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordFifaAdminDecision({
        type: "transfer_restriction",
        typeLabel: "إيقاف من نظام الانتقالات",
        status: "active",
        memberId,
        memberName: member.name || "",
        targetMemberId: memberId,
        targetMemberName: member.name || "",
        reason,
        category: clean(payload.category || "transfer_violation") || "transfer_violation",
        startDate,
        endDate,
        ...restrictionPayload,
        relatedRestrictionId: restrictionRef.id,
        reversible: true,
        correctionMode: "restriction",
        source: "fifa_admin_penalties",
      });
      return;
    }

    if (actionType === "lift_transfer_restriction") {
      const activeRows = getActiveMemberRestrictions(firebaseMemberRestrictions, memberId);
      if (!activeRows.length) throw new Error("لا يوجد إيقاف انتقالات نشط على هذا العضو.");
      await Promise.allSettled(activeRows.map((row) => updateDoc(doc(db, "memberRestrictions", row.id), {
        status: "lifted",
        liftedAt: serverTimestamp(),
        liftedBy: authUser?.uid || "",
        liftedByMemberId: currentMemberId || "FIFA",
        liftReason: reason,
        updatedAt: serverTimestamp(),
      })));
      await addDoc(collection(db, "notifications"), {
        type: "transfer_restriction_lifted",
        title: "تم رفع إيقاف الانتقالات",
        body: "تم رفع إيقافك من نظام الانتقالات" + (reason ? " - " + reason : "."),
        status: "unread",
        audience: "member",
        toMemberId: memberId,
        toMemberName: member.name || "",
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        source: "fifa_admin_penalties",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await recordFifaAdminDecision({
        type: "transfer_restriction_lifted",
        typeLabel: "رفع إيقاف انتقالات",
        status: "completed",
        memberId,
        memberName: member.name || "",
        targetMemberId: memberId,
        targetMemberName: member.name || "",
        reason,
        relatedRestrictionIds: activeRows.map((row) => row.id),
        reversible: false,
        source: "fifa_admin_penalties",
      });
      return;
    }

    throw new Error("نوع القرار غير معروف.");
  }

  async function createFifaAdminMoneyCorrection(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const transferId = cleanId(payload.transferId || "");
    const mode = clean(payload.mode || "full_reverse") === "amount_correction" ? "amount_correction" : "full_reverse";
    const reason = String(payload.reason || "").trim();
    if (!transferId) throw new Error("اختر العملية المالية المراد تصحيحها.");
    if (!reason) throw new Error("اكتب سبب التصحيح أو التراجع.");

    const original = firebaseMoneyTransfers.find((item) => same(item.id, transferId));
    if (!original) throw new Error("العملية المالية غير موجودة أو ليست من Firebase.");
    if (clean(original.adminCorrectionStatus || original.reversalStatus || "") === "reversed") {
      throw new Error("تم عكس هذه العملية سابقًا.");
    }

    const originalAmount = Math.max(0, toNumber(original.amount));
    if (!originalAmount) throw new Error("لا يمكن تصحيح عملية بدون مبلغ صالح.");

    const fromId = cleanId(original.fromMemberId || "");
    const toId = cleanId(original.toMemberId || "");
    const fromName = original.fromMemberName || getMemberName(members, fromId) || fromId || "-";
    const toName = original.toMemberName || getMemberName(members, toId) || toId || "-";
    if (!fromId || !toId) throw new Error("العملية الأصلية لا تحتوي أطرافًا واضحة.");

    let correctionAmount = originalAmount;
    let reverseFromId = toId;
    let reverseFromName = toName;
    let reverseToId = fromId;
    let reverseToName = fromName;
    let correctionTitle = "عكس عملية مالية";
    let correctionType = "admin_money_reversal";
    let correctAmount = null;

    if (mode === "amount_correction") {
      correctAmount = parseFinanceAmount(payload.correctAmount);
      if (correctAmount < 0) throw new Error("أدخل المبلغ الصحيح.");
      const diff = originalAmount - correctAmount;
      if (!diff) throw new Error("المبلغ الصحيح يساوي المبلغ الأصلي، لا يوجد فرق للتصحيح.");
      correctionAmount = Math.abs(diff);
      correctionTitle = "تصحيح مبلغ عملية مالية";
      correctionType = "admin_money_amount_correction";
      if (diff < 0) {
        reverseFromId = fromId;
        reverseFromName = fromName;
        reverseToId = toId;
        reverseToName = toName;
      }
    }

    const correctionRef = await addDoc(collection(db, "moneyTransfers"), {
      fromMemberId: reverseFromId,
      fromMemberName: reverseFromName,
      toMemberId: reverseToId,
      toMemberName: reverseToName,
      amount: correctionAmount,
      type: correctionType,
      typeLabel: correctionTitle,
      direction: "admin_money_correction",
      status: "approved",
      approvedBy: "FIFA",
      relatedOriginalMoneyTransferId: transferId,
      originalAmount,
      correctAmount: mode === "amount_correction" ? correctAmount : 0,
      correctionMode: mode,
      createdBy: authUser?.uid || "",
      username: authProfile?.username || "fifa",
      note: reason,
      date: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "moneyTransfers", transferId), {
      adminCorrectionStatus: mode === "full_reverse" ? "reversed" : "corrected",
      adminCorrectedAt: serverTimestamp(),
      adminCorrectedBy: authUser?.uid || "",
      adminCorrectionReason: reason,
      adminCorrectionTransferId: correctionRef.id,
      adminCorrectAmount: mode === "amount_correction" ? correctAmount : 0,
      updatedAt: serverTimestamp(),
    });

    const relatedDecision = firebaseAdminDecisions.find((item) => same(item.relatedMoneyTransferId, transferId));
    if (relatedDecision?.id) {
      await updateDoc(doc(db, "adminDecisions", relatedDecision.id), {
        status: mode === "full_reverse" ? "reversed" : "corrected",
        reversedAt: mode === "full_reverse" ? serverTimestamp() : null,
        correctedAt: mode === "amount_correction" ? serverTimestamp() : null,
        correctionReason: reason,
        correctionTransferId: correctionRef.id,
        updatedAt: serverTimestamp(),
      });
    }

    const body = mode === "full_reverse"
      ? "تم عكس عملية مالية بقيمة " + formatMoney(correctionAmount) + " بقرار FIFA. السبب: " + reason
      : "تم تصحيح عملية مالية. الفرق المصحح: " + formatMoney(correctionAmount) + ". السبب: " + reason;

    const notifyTargets = [
      { id: reverseFromId, name: reverseFromName, title: correctionTitle + " - صادر" },
      { id: reverseToId, name: reverseToName, title: correctionTitle + " - وارد" },
    ].filter((item) => item.id && !same(item.id, "FIFA"));

    await Promise.allSettled(notifyTargets.map((target) => createAdminNotificationDoc({
      type: correctionType,
      title: target.title,
      body,
      audience: "member",
      toMemberId: target.id,
      toMemberName: target.name,
      relatedMoneyTransferId: correctionRef.id,
      amount: correctionAmount,
      source: "fifa_admin_corrections",
    })));

    await recordFifaAdminDecision({
      type: correctionType,
      typeLabel: correctionTitle,
      status: "completed",
      fromMemberId: reverseFromId,
      fromMemberName: reverseFromName,
      toMemberId: reverseToId,
      toMemberName: reverseToName,
      amount: correctionAmount,
      originalAmount,
      correctAmount: mode === "amount_correction" ? correctAmount : 0,
      reason,
      relatedMoneyTransferId: correctionRef.id,
      relatedOriginalMoneyTransferId: transferId,
      source: "fifa_admin_corrections",
      reversible: false,
    });
  }

  async function cancelFifaAdminRestriction(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const restrictionId = cleanId(payload.restrictionId || "");
    const reason = String(payload.reason || "").trim();
    if (!restrictionId) throw new Error("اختر إيقاف الانتقالات المراد رفعه أو إلغاؤه.");
    if (!reason) throw new Error("اكتب سبب رفع أو إلغاء الإيقاف.");
    const restriction = firebaseMemberRestrictions.find((item) => same(item.id, restrictionId));
    if (!restriction) throw new Error("قرار الإيقاف غير موجود.");
    const memberId = cleanId(restriction.memberId || "");
    const memberName = restriction.memberName || getMemberName(members, memberId) || "";
    await updateDoc(doc(db, "memberRestrictions", restrictionId), {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
      cancelledBy: authUser?.uid || "",
      cancelledByMemberId: currentMemberId || "FIFA",
      cancelReason: reason,
      updatedAt: serverTimestamp(),
    });
    const relatedDecision = firebaseAdminDecisions.find((item) => same(item.relatedRestrictionId, restrictionId));
    if (relatedDecision?.id) {
      await updateDoc(doc(db, "adminDecisions", relatedDecision.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancelReason: reason,
        updatedAt: serverTimestamp(),
      });
    }
    await createAdminNotificationDoc({
      type: "transfer_restriction_cancelled",
      title: "تم إلغاء إيقاف الانتقالات",
      body: "تم إلغاء إيقافك من نظام الانتقالات بقرار FIFA. السبب: " + reason,
      audience: "member",
      toMemberId: memberId,
      toMemberName: memberName,
      relatedRestrictionId: restrictionId,
      source: "fifa_admin_corrections",
    });
    await recordFifaAdminDecision({
      type: "transfer_restriction_cancelled",
      typeLabel: "إلغاء إيقاف انتقالات",
      status: "completed",
      memberId,
      memberName,
      targetMemberId: memberId,
      targetMemberName: memberName,
      relatedRestrictionId: restrictionId,
      reason,
      source: "fifa_admin_corrections",
      reversible: false,
    });
  }

  async function createFifaAdminNote(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const memberId = cleanId(payload.memberId || "");
    const note = String(payload.note || "").trim();
    const category = clean(payload.category || "general_note") || "general_note";
    if (!memberId) throw new Error("اختر العضو.");
    if (!note) throw new Error("اكتب الملاحظة الإدارية.");
    const member = members.find((item) => same(item.id, memberId));
    if (!member || same(memberId, "FIFA")) throw new Error("اختر عضوًا صحيحًا.");
    const noteRef = await addDoc(collection(db, "adminNotes"), {
      memberId,
      memberName: member.name || "",
      category,
      note,
      status: "active",
      private: true,
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await recordFifaAdminDecision({
      type: "admin_note",
      typeLabel: "ملاحظة إدارية",
      status: "completed",
      memberId,
      memberName: member.name || "",
      category,
      note,
      relatedAdminNoteId: noteRef.id,
      source: "fifa_admin_notes",
      reversible: false,
    });
  }

  async function sendRosterUpdateNotification({ toMemberId, fromMemberId = "system", playerId = "", title = "تحديث على قائمة فريقك", body = "", targetStatus = "roster_updated", relatedOfferId = "", relatedQueueId = "" } = {}) {
    const targetMemberId = cleanId(toMemberId);
    if (!targetMemberId || !body) return;
    await addDoc(collection(db, "notifications"), {
      type: "roster_update",
      status: "unread",
      toMemberId: targetMemberId,
      fromMemberId: cleanId(fromMemberId) || "system",
      relatedOfferId: relatedOfferId || "",
      relatedQueueId: relatedQueueId || "",
      targetPlayerId: playerId || "",
      targetMemberId,
      targetStatus,
      navigationDisabled: true,
      title,
      body,
      createdAt: serverTimestamp(),
    });
  }

  async function processPendingPlayerOfferOnMarketOpen(existing, windowInfo = {}) {
    if (!existing?.id) return { ok: false, reason: "missing_offer" };
    if (clean(existing.status || "") !== "approvedpendingwindow") return { ok: false, reason: "not_pending_window" };
    if (existing.marketExecutionCompletedAt || existing.completedAt) return { ok: false, reason: "already_completed" };

    const offerId = existing.id;
    const buyerId = cleanId(existing.fromMemberId);
    const sellerId = cleanId(existing.toMemberId);
    const numericAmount = Math.max(0, toNumber(existing.amount));
    const contractType = clean(existing.type) === "loan" ? "loan" : "buy";
    const targetPlayerId = cleanId(existing.targetPlayerId || existing.playerId);
    const targetPlayerRow = players.find((player) => same(getPlayerStableId(player), targetPlayerId));
    if (!buyerId || !sellerId || !targetPlayerId) return { ok: false, reason: "missing_data" };

    const previousActiveContract = getActivePlayerContract(targetPlayerId);
    const previousActiveContractType = clean(previousActiveContract?.contractType || "");
    if (previousActiveContractType === "released") {
      await updateDoc(doc(db, "playerOffers", offerId), {
        status: "executionFailed",
        pendingExecutionStatus: "failed",
        pendingExecutionFailureReason: "اللاعب خارج اللعبة.",
        updatedAt: serverTimestamp(),
      });
      return { ok: false, reason: "released_target" };
    }

    const baseOwnerId = cleanId(
      previousActiveContract?.baseOwnerMemberId ||
        previousActiveContract?.baseOwnerId ||
        previousActiveContract?.originalBaseOwnerMemberId ||
        previousActiveContract?.originalOwnerMemberId ||
        targetPlayerRow?.memberid ||
        sellerId
    );
    const baseOwner = members.find((member) => same(member.id, baseOwnerId));
    const baseOwnerName = previousActiveContract?.baseOwnerMemberName || previousActiveContract?.originalBaseOwnerMemberName || baseOwner?.name || previousActiveContract?.originalOwnerMemberName || existing.toMemberName || "";
    const sourceOwnerId = cleanId(previousActiveContract?.currentMemberId || sellerId);
    const sourceOwnerName = previousActiveContract?.currentMemberName || existing.toMemberName || getMemberName(members, sellerId) || "";
    const loanRealOwnerId = previousActiveContractType === "loan"
      ? cleanId(previousActiveContract?.originalOwnerMemberId || previousActiveContract?.ownerMemberId || baseOwnerId || sellerId)
      : sourceOwnerId;
    const loanRealOwnerName = previousActiveContractType === "loan"
      ? (previousActiveContract?.originalOwnerMemberName || previousActiveContract?.ownerMemberName || baseOwnerName || sourceOwnerName)
      : sourceOwnerName;
    if (sourceOwnerId && !same(sourceOwnerId, sellerId)) {
      await updateDoc(doc(db, "playerOffers", offerId), {
        status: "executionFailed",
        pendingExecutionStatus: "failed",
        pendingExecutionFailureReason: "ملكية اللاعب تغيرت قبل فتح السوق.",
        updatedAt: serverTimestamp(),
      });
      return { ok: false, reason: "ownership_changed" };
    }

    const offeredPlayersRaw = Array.isArray(existing.offeredPlayers) ? existing.offeredPlayers : [];
    const buyerVisiblePlayers = getVisiblePlayersForMember(buyerId);
    const buyerVisibleMap = new Map(buyerVisiblePlayers.map((player) => [cleanId(getPlayerStableId(player)), player]));
    const offeredPlayerIds = new Set();
    const offeredPlayers = [];

    for (const item of offeredPlayersRaw) {
      const playerId = cleanId(item.playerId || item.playerid || item.id);
      if (!playerId || same(playerId, targetPlayerId) || offeredPlayerIds.has(playerId)) {
        await updateDoc(doc(db, "playerOffers", offerId), {
          status: "executionFailed",
          pendingExecutionStatus: "failed",
          pendingExecutionFailureReason: "بيانات أحد لاعبي التبادل غير صحيحة.",
          updatedAt: serverTimestamp(),
        });
        return { ok: false, reason: "bad_exchange_player" };
      }
      offeredPlayerIds.add(playerId);
      const row = buyerVisibleMap.get(playerId) || players.find((player) => same(getPlayerStableId(player), playerId));
      if (!row || !buyerVisibleMap.has(playerId)) {
        await updateDoc(doc(db, "playerOffers", offerId), {
          status: "executionFailed",
          pendingExecutionStatus: "failed",
          pendingExecutionFailureReason: "أحد لاعبي التبادل لم يعد في قائمة مقدم العرض عند فتح السوق.",
          updatedAt: serverTimestamp(),
        });
        return { ok: false, reason: "exchange_player_unavailable" };
      }
      const activeContract = getActivePlayerContract(playerId);
      const activeType = clean(activeContract?.contractType || "");
      if (activeType === "released" || activeType === "loan" || (activeContract && !same(activeContract.currentMemberId, buyerId))) {
        await updateDoc(doc(db, "playerOffers", offerId), {
          status: "executionFailed",
          pendingExecutionStatus: "failed",
          pendingExecutionFailureReason: "تعذر تنفيذ أحد لاعبي التبادل بسبب تغير حالته.",
          updatedAt: serverTimestamp(),
        });
        return { ok: false, reason: "exchange_contract_changed" };
      }
      const exchangeContractType = normalizeExchangeContractType(item.exchangeContractType || item.swapContractType || item.contractMode);
      const exchangeLoanDurationMonths = exchangeContractType === "loan" ? normalizeExchangeLoanDuration(item.exchangeLoanDurationMonths || item.loanDurationMonths) : null;
      offeredPlayers.push({
        ...item,
        row,
        activeContract,
        playerId,
        exchangeContractType,
        exchangeLoanDurationMonths,
        exchangeTypeLabel: exchangeContractType === "loan" ? "إعارة" : "بيع كامل",
        playerName: item.playerName || row.name || "",
        playerImage: item.playerImage || item.image || row.image || "",
        playerPosition: item.playerPosition || item.position || row.position || "",
        playerRating: item.playerRating || item.rating || row.rating || "",
      });
    }

    const nowDate = new Date();
    const todayDateKey = nowDate.toISOString().slice(0, 10);
    const loanMonths = contractType === "loan" ? toNumber(existing.loanDurationMonths) : null;
    const loanEndDate = loanMonths
      ? new Date(nowDate.getFullYear(), nowDate.getMonth() + loanMonths, nowDate.getDate()).toISOString().slice(0, 10)
      : null;

    const targetFreeOrigin = isFreeOriginContract(previousActiveContract);
    const targetFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(previousActiveContract, targetFreeOrigin ? baseOwnerId || sellerId : "");

    if (previousActiveContract?.id) {
      await updateDoc(doc(db, "playerContracts", previousActiveContract.id), {
        status: "replaced",
        replacedByOfferId: offerId,
        replacedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, sellerId) && !same(targetFreeSlotOwnerId, buyerId)) {
      await setDoc(doc(db, "freePlayerStatus", sellerId), {
        memberId: toNumber(sellerId),
        hasUsedFreeSlot: true,
        currentFreePlayerId: "",
        currentFreePlayerName: "",
        lostFreePlayerId: targetPlayerId,
        lostFreePlayerName: existing.targetPlayerName || targetPlayerRow?.name || "",
        lostFreePlayerAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    await addDoc(collection(db, "playerContracts"), {
      status: "active",
      playerId: targetPlayerId,
      playerName: existing.targetPlayerName || targetPlayerRow?.name || "",
      playerImage: existing.targetPlayerImage || targetPlayerRow?.image || "",
      playerPosition: existing.targetPlayerPosition || targetPlayerRow?.position || "",
      playerRating: existing.targetPlayerRating || targetPlayerRow?.rating || "",
      ownerMemberId: contractType === "loan" ? loanRealOwnerId : buyerId,
      ownerMemberName: contractType === "loan" ? loanRealOwnerName : (existing.fromMemberName || getMemberName(members, buyerId)),
      originalOwnerMemberId: contractType === "loan" ? loanRealOwnerId : baseOwnerId,
      originalOwnerMemberName: contractType === "loan" ? loanRealOwnerName : baseOwnerName,
      baseOwnerMemberId: baseOwnerId,
      baseOwnerMemberName: baseOwnerName,
      currentMemberId: buyerId,
      currentMemberName: existing.fromMemberName || getMemberName(members, buyerId),
      previousMemberId: sourceOwnerId,
      previousMemberName: sourceOwnerName,
      contractType: contractType === "loan" ? "loan" : "owned",
      rosterType: getRosterKindCode({ contractType: contractType === "loan" ? "loan" : "owned", originalOwnerMemberId: baseOwnerId, currentMemberId: buyerId, freeAgent: targetFreeOrigin && same(targetFreeSlotOwnerId, buyerId) }),
      isFreeOrigin: targetFreeOrigin,
      freeAgentOrigin: targetFreeOrigin,
      freeAgentSlotOwnerMemberId: targetFreeSlotOwnerId || "",
      sourceOfferId: offerId,
      amount: numericAmount,
      loanAmount: contractType === "loan" ? numericAmount : 0,
      loanDurationMonths: loanMonths,
      loanStartDate: todayDateKey,
      loanEndDate,
      pendingWindow: false,
      marketWasOpenAtApproval: false,
      marketExecutedAtWindowOpen: true,
      marketExecutionWindowId: windowInfo.windowId || "",
      marketExecutionWindowName: windowInfo.windowTitle || "",
      createdBy: authUser?.uid || "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, buyerId)) {
      await setDoc(doc(db, "freePlayerStatus", buyerId), {
        memberId: toNumber(buyerId),
        hasUsedFreeSlot: false,
        currentFreePlayerId: targetPlayerId,
        currentFreePlayerName: existing.targetPlayerName || targetPlayerRow?.name || "",
        returnedFreePlayerAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    const enrichedOfferedPlayers = [];
    for (const item of offeredPlayers) {
      const swapBaseOwnerId = cleanId(item.activeContract?.baseOwnerMemberId || item.activeContract?.baseOwnerId || item.activeContract?.originalBaseOwnerMemberId || item.activeContract?.originalOwnerMemberId || item.row?.memberid || buyerId);
      const swapBaseOwner = members.find((member) => same(member.id, swapBaseOwnerId));
      const swapBaseOwnerName = item.activeContract?.baseOwnerMemberName || item.activeContract?.originalBaseOwnerMemberName || item.activeContract?.originalOwnerMemberName || swapBaseOwner?.name || getMemberName(members, swapBaseOwnerId) || existing.fromMemberName || "";
      const swapSourceOwnerId = cleanId(item.activeContract?.currentMemberId || buyerId);
      const swapSourceOwnerName = item.activeContract?.currentMemberName || existing.fromMemberName || getMemberName(members, buyerId) || "";
      const swapFreeOrigin = isFreeOriginContract(item.activeContract);
      const swapFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(item.activeContract, swapFreeOrigin ? swapBaseOwnerId || buyerId : "");
      const exchangeContractType = normalizeExchangeContractType(item.exchangeContractType);
      const exchangeLoanMonths = exchangeContractType === "loan" ? normalizeExchangeLoanDuration(item.exchangeLoanDurationMonths) : null;
      const exchangeLoanEndDate = exchangeLoanMonths
        ? new Date(nowDate.getFullYear(), nowDate.getMonth() + exchangeLoanMonths, nowDate.getDate()).toISOString().slice(0, 10)
        : null;
      const exchangeOwnerId = exchangeContractType === "loan" ? swapSourceOwnerId : sellerId;
      const exchangeOwnerName = exchangeContractType === "loan" ? swapSourceOwnerName : (existing.toMemberName || getMemberName(members, sellerId));
      const exchangeOriginalOwnerId = exchangeContractType === "loan" ? swapSourceOwnerId : swapBaseOwnerId;
      const exchangeOriginalOwnerName = exchangeContractType === "loan" ? swapSourceOwnerName : swapBaseOwnerName;

      if (item.activeContract?.id) {
        await updateDoc(doc(db, "playerContracts", item.activeContract.id), {
          status: "replaced_exchange",
          replacedByOfferId: offerId,
          replacedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, buyerId) && !same(swapFreeSlotOwnerId, sellerId)) {
        await setDoc(doc(db, "freePlayerStatus", buyerId), {
          memberId: toNumber(buyerId),
          hasUsedFreeSlot: true,
          currentFreePlayerId: "",
          currentFreePlayerName: "",
          lostFreePlayerId: item.playerId,
          lostFreePlayerName: item.playerName || "",
          lostFreePlayerAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      await addDoc(collection(db, "playerContracts"), {
        status: "active",
        contractType: exchangeContractType === "loan" ? "loan" : "owned",
        playerId: item.playerId,
        playerName: item.playerName || "",
        playerImage: item.playerImage || "",
        playerPosition: item.playerPosition || "",
        playerRating: item.playerRating || "",
        ownerMemberId: exchangeOwnerId,
        ownerMemberName: exchangeOwnerName,
        originalOwnerMemberId: exchangeOriginalOwnerId,
        originalOwnerMemberName: exchangeOriginalOwnerName,
        baseOwnerMemberId: swapBaseOwnerId,
        baseOwnerMemberName: swapBaseOwnerName,
        currentMemberId: sellerId,
        currentMemberName: existing.toMemberName || getMemberName(members, sellerId),
        previousMemberId: swapSourceOwnerId,
        previousMemberName: swapSourceOwnerName,
        contractTypeLabel: exchangeContractType === "loan" ? ("تبادل - إعارة " + loanDurationLabel(exchangeLoanMonths)) : "تبادل - بيع كامل",
        rosterType: getRosterKindCode({ contractType: exchangeContractType === "loan" ? "loan" : "owned", originalOwnerMemberId: exchangeOriginalOwnerId, currentMemberId: sellerId, freeAgent: swapFreeOrigin && same(swapFreeSlotOwnerId, sellerId) }),
        isFreeOrigin: swapFreeOrigin,
        freeAgentOrigin: swapFreeOrigin,
        freeAgentSlotOwnerMemberId: swapFreeSlotOwnerId || "",
        sourceOfferId: offerId,
        source: "exchange_player",
        exchangeContractType,
        exchangeLoanDurationMonths: exchangeLoanMonths,
        amount: 0,
        loanAmount: 0,
        loanDurationMonths: exchangeLoanMonths,
        loanStartDate: exchangeContractType === "loan" ? todayDateKey : null,
        loanEndDate: exchangeContractType === "loan" ? exchangeLoanEndDate : null,
        marketWasOpenAtApproval: false,
        marketExecutedAtWindowOpen: true,
        marketExecutionWindowId: windowInfo.windowId || "",
        marketExecutionWindowName: windowInfo.windowTitle || "",
        createdBy: authUser?.uid || "system",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, sellerId)) {
        await setDoc(doc(db, "freePlayerStatus", sellerId), {
          memberId: toNumber(sellerId),
          hasUsedFreeSlot: false,
          currentFreePlayerId: item.playerId,
          currentFreePlayerName: item.playerName || "",
          returnedFreePlayerAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      enrichedOfferedPlayers.push({
        playerId: item.playerId,
        playerName: item.playerName || "",
        playerImage: item.playerImage || "",
        playerPosition: item.playerPosition || "",
        playerRating: item.playerRating || "",
        fromMemberId: buyerId,
        fromMemberName: existing.fromMemberName || getMemberName(members, buyerId),
        toMemberId: sellerId,
        toMemberName: existing.toMemberName || getMemberName(members, sellerId),
        exchangeContractType,
        exchangeLoanDurationMonths: exchangeLoanMonths,
        exchangeTypeLabel: exchangeContractType === "loan" ? "إعارة" : "بيع كامل",
        originalOwnerMemberId: swapBaseOwnerId,
        originalOwnerMemberName: swapBaseOwnerName,
        isFreeOrigin: swapFreeOrigin,
        freeAgentSlotOwnerMemberId: swapFreeSlotOwnerId || "",
      });
    }

    const historyPayload = {
      status: "completed",
      type: contractType === "loan" ? "loan" : "buy",
      typeLabel: contractType === "loan" ? "عقد إعارة" : (enrichedOfferedPlayers.length ? "عقد شراء + تبادل" : "عقد شراء"),
      playerId: targetPlayerId,
      playerName: existing.targetPlayerName || targetPlayerRow?.name || "",
      playerImage: existing.targetPlayerImage || targetPlayerRow?.image || "",
      playerPosition: existing.targetPlayerPosition || targetPlayerRow?.position || "",
      playerRating: existing.targetPlayerRating || targetPlayerRow?.rating || "",
      fromMemberId: sourceOwnerId,
      fromMemberName: sourceOwnerName,
      toMemberId: buyerId,
      toMemberName: existing.fromMemberName || getMemberName(members, buyerId),
      originalOwnerMemberId: contractType === "loan" ? loanRealOwnerId : baseOwnerId,
      originalOwnerMemberName: contractType === "loan" ? loanRealOwnerName : baseOwnerName,
      baseOwnerMemberId: baseOwnerId,
      baseOwnerMemberName: baseOwnerName,
      ownerMemberId: contractType === "loan" ? loanRealOwnerId : buyerId,
      ownerMemberName: contractType === "loan" ? loanRealOwnerName : (existing.fromMemberName || getMemberName(members, buyerId)),
      amount: numericAmount,
      loanDurationMonths: loanMonths,
      loanStartDate: contractType === "loan" ? todayDateKey : null,
      loanEndDate: contractType === "loan" ? loanEndDate : null,
      date: todayDateKey,
      periodId: windowInfo.windowId || getTransferWindowIdForDate(firebaseTransferWindows, todayDateKey),
      periodName: windowInfo.windowTitle || getTransferWindowNameForDate(firebaseTransferWindows, todayDateKey),
      seasonId: activeSeasonId,
      relatedOfferId: offerId,
      marketWasOpenAtApproval: false,
      marketExecutedAtWindowOpen: true,
      completedAt: serverTimestamp(),
      offeredPlayers: enrichedOfferedPlayers,
      exchangePlayerCount: enrichedOfferedPlayers.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "transferHistory"), historyPayload);

    await updateDoc(doc(db, "playerOffers", offerId), {
      status: "completed",
      completedAt: serverTimestamp(),
      marketExecutionCompletedAt: serverTimestamp(),
      marketExecutionWindowId: windowInfo.windowId || "",
      marketExecutionWindowName: windowInfo.windowTitle || "",
      pendingWindow: false,
      updatedAt: serverTimestamp(),
    });

    const targetPlayerName = existing.targetPlayerName || targetPlayerRow?.name || "";
    const buyerName = existing.fromMemberName || getMemberName(members, buyerId);
    const sellerName = existing.toMemberName || getMemberName(members, sellerId);
    const incomingTargetLabel = contractType === "loan" ? "كمحترف إعارة" : (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, buyerId) ? "كلاعب حر" : "كمحترف شراء");
    const outgoingTargetLabel = contractType === "loan" ? ("على سبيل الإعارة " + loanDurationLabel(loanMonths)) : "انتقالًا نهائيًا";

    await Promise.allSettled([
      sendRosterUpdateNotification({
        toMemberId: buyerId,
        fromMemberId: "FIFA",
        playerId: targetPlayerId,
        relatedOfferId: offerId,
        targetStatus: "incoming_player_registered",
        body: "تحديث على قائمة فريقك: تم تسجيل اللاعب " + targetPlayerName + " " + incomingTargetLabel,
      }),
      sendRosterUpdateNotification({
        toMemberId: sellerId,
        fromMemberId: "FIFA",
        playerId: targetPlayerId,
        relatedOfferId: offerId,
        targetStatus: "outgoing_player_transferred",
        body: "تحديث على قائمة فريقك: تم نقل اللاعب " + targetPlayerName + " إلى " + buyerName + " " + outgoingTargetLabel,
      }),
      ...enrichedOfferedPlayers.flatMap((item) => {
        const exchangeLoan = clean(item.exchangeContractType) === "loan";
        const exchangeIncomingLabel = exchangeLoan ? "كمحترف إعارة" : (item.isFreeOrigin && item.freeAgentSlotOwnerMemberId && same(item.freeAgentSlotOwnerMemberId, sellerId) ? "كلاعب حر" : "كمحترف شراء");
        const exchangeOutgoingLabel = exchangeLoan ? ("على سبيل الإعارة " + loanDurationLabel(item.exchangeLoanDurationMonths)) : "انتقالًا نهائيًا";
        return [
          sendRosterUpdateNotification({
            toMemberId: sellerId,
            fromMemberId: "FIFA",
            playerId: item.playerId,
            relatedOfferId: offerId,
            targetStatus: "incoming_exchange_player_registered",
            body: "تحديث على قائمة فريقك: تم تسجيل اللاعب " + (item.playerName || "") + " " + exchangeIncomingLabel,
          }),
          sendRosterUpdateNotification({
            toMemberId: buyerId,
            fromMemberId: "FIFA",
            playerId: item.playerId,
            relatedOfferId: offerId,
            targetStatus: "outgoing_exchange_player_transferred",
            body: "تحديث على قائمة فريقك: تم نقل اللاعب " + (item.playerName || "") + " إلى " + sellerName + " " + exchangeOutgoingLabel,
          }),
        ];
      }),
    ]);

    return { ok: true, offerId, playerId: targetPlayerId };
  }

  async function processPendingMarketActionsOnOpen(windowInfo = {}) {
    const pendingOffers = (firebasePlayerOffers || []).filter((offer) => clean(offer.status || "") === "approvedpendingwindow");
    const pendingFreeAgents = (firebaseFreeAgentQueue || []).filter((item) => clean(item.status || "") === "pending_window");

    const offerResults = [];
    const proCountLedger = new Map();
    const ledgerProCount = (memberId) => {
      const id = cleanId(memberId);
      if (!id) return 0;
      if (!proCountLedger.has(id)) proCountLedger.set(id, countMemberProPlayers(id));
      return proCountLedger.get(id) || 0;
    };
    const applyLedgerDelta = (memberId, delta) => {
      const id = cleanId(memberId);
      if (!id || !delta) return;
      proCountLedger.set(id, Math.max(0, ledgerProCount(id) + delta));
    };

    for (const offer of pendingOffers) {
      try {
        const deltas = getOfferProjectedProDeltas(offer);
        const buyerProjectedProCount = ledgerProCount(deltas.buyerId) + deltas.buyerDelta;
        const sellerProjectedProCount = ledgerProCount(deltas.sellerId) + deltas.sellerDelta;
        if (proLimitExceeded(buyerProjectedProCount) || proLimitExceeded(sellerProjectedProCount)) {
          const failureReason = proLimitExceeded(buyerProjectedProCount)
            ? "تعذر تنفيذ الصفقة عند فتح السوق لأن قائمة المستفيد ستتجاوز حد " + maxProfessionalPlayersLabel + " محترفين."
            : "تعذر تنفيذ الصفقة عند فتح السوق لأن قائمة صاحب لاعب التبادل ستتجاوز حد " + maxProfessionalPlayersLabel + " محترفين.";
          await updateDoc(doc(db, "playerOffers", offer.id), {
            status: "executionFailed",
            pendingExecutionStatus: "failed",
            pendingExecutionFailureReason: failureReason,
            updatedAt: serverTimestamp(),
          });
          offerResults.push({ ok: false, offerId: offer.id, reason: "pro_limit_exceeded" });
          continue;
        }
        const result = await processPendingPlayerOfferOnMarketOpen(offer, windowInfo);
        offerResults.push(result);
        if (result?.ok) {
          applyLedgerDelta(deltas.buyerId, deltas.buyerDelta);
          applyLedgerDelta(deltas.sellerId, deltas.sellerDelta);
        }
      } catch (err) {
        console.error("Pending offer execution failed:", err);
        offerResults.push({ ok: false, offerId: offer.id, reason: err?.message || "unknown_error" });
      }
    }

    const freeAgentResults = [];
    for (const item of pendingFreeAgents) {
      try {
        await executeFreeAgentQueueItem(item, { marketOpenWindowInfo: windowInfo });
        freeAgentResults.push({ ok: true, queueId: item.id });
      } catch (err) {
        console.error("Pending free agent execution failed:", err);
        freeAgentResults.push({ ok: false, queueId: item.id, reason: err?.message || "unknown_error" });
      }
    }

    return {
      offers: offerResults,
      freeAgents: freeAgentResults,
      completedOffers: offerResults.filter((item) => item?.ok).length,
      completedFreeAgents: freeAgentResults.filter((item) => item?.ok).length,
    };
  }

  async function createFifaAdminMarketControl(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const action = clean(payload.action || "open_window");
    const title = String(payload.title || "").trim() || "فترة انتقالات";
    const startDate = String(payload.startDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const endDate = String(payload.endDate || "").slice(0, 10);
    const note = String(payload.note || "").trim();

    if (action === "open_window") {
      if (!endDate) throw new Error("حدد تاريخ نهاية فترة الانتقالات.");
      const windowRef = await addDoc(collection(db, "transferWindows"), {
        name: title,
        title,
        status: "open",
        startDate,
        endDate,
        note,
        source: "fifa_admin_market_control",
        createdBy: authUser?.uid || "",
        createdByMemberId: currentMemberId || "FIFA",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const notificationRef = await createAdminNotificationDoc({
        type: "transfer_window_open",
        title: "فتح سوق الانتقالات",
        body: note || ("تم فتح " + title + " حتى " + endDate + "."),
        audience: "all",
        relatedTransferWindowId: windowRef.id,
        source: "fifa_admin_market_control",
      });
      const pendingExecutionSummary = await processPendingMarketActionsOnOpen({
        windowId: windowRef.id,
        windowTitle: title,
        startDate,
        endDate,
      });
      await recordFifaAdminDecision({
        type: "transfer_window_open",
        typeLabel: "فتح سوق الانتقالات",
        status: "active",
        title,
        startDate,
        endDate,
        note,
        relatedTransferWindowId: windowRef.id,
        relatedNotificationId: notificationRef.id,
        pendingExecutionSummary,
        source: "fifa_admin_market_control",
        reversible: false,
      });
      return;
    }

    if (action === "close_windows") {
      const openRows = (firebaseTransferWindows || []).filter((item) => clean(item.status || "") === "open");
      await Promise.allSettled(openRows.map((item) => updateDoc(doc(db, "transferWindows", item.id), {
        status: "closed",
        closedAt: serverTimestamp(),
        closedBy: authUser?.uid || "",
        closeReason: note,
        updatedAt: serverTimestamp(),
      })));
      const notificationRef = await createAdminNotificationDoc({
        type: "transfer_window_closed",
        title: "إغلاق سوق الانتقالات",
        body: note || "تم إغلاق سوق الانتقالات بقرار FIFA.",
        audience: "all",
        source: "fifa_admin_market_control",
      });
      await recordFifaAdminDecision({
        type: "transfer_window_closed",
        typeLabel: "إغلاق سوق الانتقالات",
        status: "completed",
        relatedTransferWindowIds: openRows.map((item) => item.id),
        relatedNotificationId: notificationRef.id,
        note,
        source: "fifa_admin_market_control",
        reversible: false,
      });
      return;
    }


    if (action === "update_window") {
      const windowId = cleanId(payload.windowId || "");
      if (!windowId) throw new Error("اختر فترة الانتقالات المراد تعديلها.");
      const existingWindow = (firebaseTransferWindows || []).find((item) => same(item.id, windowId));
      if (!existingWindow) throw new Error("فترة الانتقالات غير موجودة.");
      const nextTitle = String(payload.title || existingWindow.title || existingWindow.name || "فترة انتقالات").trim() || "فترة انتقالات";
      const nextStartDate = String(payload.startDate || existingWindow.startDate || startDate).slice(0, 10);
      const nextEndDate = String(payload.endDate || existingWindow.endDate || "").slice(0, 10);
      if (!nextEndDate) throw new Error("حدد تاريخ نهاية فترة الانتقالات.");
      await updateDoc(doc(db, "transferWindows", windowId), {
        name: nextTitle,
        title: nextTitle,
        startDate: nextStartDate,
        endDate: nextEndDate,
        note: note || existingWindow.note || "",
        updatedAt: serverTimestamp(),
        updatedBy: authUser?.uid || "",
        updatedByMemberId: currentMemberId || "FIFA",
      });
      await recordFifaAdminDecision({
        type: "transfer_window_updated",
        typeLabel: "تعديل فترة انتقالات",
        status: "completed",
        title: nextTitle,
        startDate: nextStartDate,
        endDate: nextEndDate,
        note,
        relatedTransferWindowId: windowId,
        source: "fifa_admin_market_control",
        reversible: false,
      });
      return;
    }

    if (action === "cancel_window") {
      const windowId = cleanId(payload.windowId || "");
      if (!windowId) throw new Error("اختر فترة الانتقالات المراد إلغاؤها.");
      const existingWindow = (firebaseTransferWindows || []).find((item) => same(item.id, windowId));
      if (!existingWindow) throw new Error("فترة الانتقالات غير موجودة.");
      await updateDoc(doc(db, "transferWindows", windowId), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        cancelledBy: authUser?.uid || "",
        cancelledByMemberId: currentMemberId || "FIFA",
        cancelReason: note || "إلغاء إداري لفترة الانتقالات",
        updatedAt: serverTimestamp(),
      });
      await recordFifaAdminDecision({
        type: "transfer_window_cancelled",
        typeLabel: "إلغاء فترة انتقالات",
        status: "cancelled",
        title: existingWindow.title || existingWindow.name || "فترة انتقالات",
        startDate: existingWindow.startDate || "",
        endDate: existingWindow.endDate || "",
        note: note || "إلغاء إداري لفترة الانتقالات",
        relatedTransferWindowId: windowId,
        source: "fifa_admin_market_control",
        reversible: false,
      });
      return;
    }

    if (action === "delete_window") {
      const windowId = cleanId(payload.windowId || "");
      if (!windowId) throw new Error("اختر فترة الانتقالات المراد حذفها.");
      const existingWindow = (firebaseTransferWindows || []).find((item) => same(item.id, windowId));
      if (!existingWindow) throw new Error("فترة الانتقالات غير موجودة.");
      await deleteDoc(doc(db, "transferWindows", windowId));
      await recordFifaAdminDecision({
        type: "transfer_window_deleted",
        typeLabel: "حذف فترة انتقالات",
        status: "completed",
        title: existingWindow.title || existingWindow.name || "فترة انتقالات",
        startDate: existingWindow.startDate || "",
        endDate: existingWindow.endDate || "",
        note: note || "حذف إداري من السجلات",
        relatedTransferWindowId: windowId,
        source: "fifa_admin_market_control",
        reversible: false,
      });
      return;
    }

    throw new Error("إجراء سوق الانتقالات غير معروف.");
  }

  function assertTransferAllowed(memberId, action) {
    const restriction = getBlockingTransferRestriction(firebaseMemberRestrictions, memberId, action);
    if (!restriction) return;
    throw new Error(transferRestrictionBlockMessage(restriction, action));
  }


  async function createFifaLeagueCompetition(payload = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const requestedCompetitionType = competitionTypeKey(payload.competitionType || "league");
    const competitionType = ["league", "league_qualifier", "cup", "super_cup", "world_cup", "champions_league", "mini_league"].includes(requestedCompetitionType) ? requestedCompetitionType : "league";
    const name = String(payload.name || "").trim();
    const seasonId = cleanId(payload.seasonId || activeSeasonId || "S6");
    let participantIds = Array.isArray(payload.participantIds) ? payload.participantIds.map(cleanId).filter(Boolean) : [];
    const cupLinkedLeagueCompetitionId = competitionType === "cup" ? cleanId(payload.cupLinkedLeagueCompetitionId || payload.linkedLeagueCompetitionId || "") : "";
    const linkedLeagueCompetition = cupLinkedLeagueCompetitionId ? (firebaseCompetitions || []).find((item) => same(item.id, cupLinkedLeagueCompetitionId)) : null;
    const cupLinkedLeagueGroupsEnabled = competitionType === "cup" && Boolean(cupLinkedLeagueCompetitionId);
    if (cupLinkedLeagueGroupsEnabled) {
      if (!linkedLeagueCompetition) throw new Error("اختر نسخة دوري مجموعتين موجودة لربط الكأس بها.");
      if (!isLeagueGroupsCompetition(linkedLeagueCompetition)) throw new Error("ربط الكأس متاح فقط مع نسخة دوري بنظام مجموعتين.");
      participantIds = getLinkedLeagueCupParticipantRows(linkedLeagueCompetition).map((row) => cleanId(row.memberId)).filter(Boolean);
    }
    if (!name) {
      const nameError = competitionType === "league_qualifier" ? "اكتب اسم ملحق الدوري." : competitionType === "cup" ? "اكتب اسم بطولة الكأس." : competitionType === "super_cup" ? "اكتب اسم كأس السوبر." : competitionType === "world_cup" ? "اكتب اسم كأس العالم." : competitionType === "champions_league" ? "اكتب اسم دوري الأبطال." : competitionType === "mini_league" ? "اكتب اسم دوري المجموعة." : "اكتب اسم الدوري.";
      throw new Error(nameError);
    }
    if (participantIds.length < 2) throw new Error("اختر عضوين على الأقل لإنشاء البطولة.");
    const worldCupQualifiersEnabled = Boolean(payload.worldCupQualifiersEnabled);
    const championsLeagueQualifiersEnabled = Boolean(payload.championsLeagueQualifiersEnabled);
    const championsLeagueFormat = competitionType === "champions_league" && clean(payload.championsLeagueFormat || "") === "single_group" ? "single_group" : "groups_knockout";
    const clSingleGroup = competitionType === "champions_league" && championsLeagueFormat === "single_group";
    const leagueFormat = competitionType === "league" && ["two_groups", "league_two_groups_knockout"].includes(clean(payload.leagueFormat || payload.leagueGroupMode || "")) ? "two_groups" : "single_group";
    const leagueTwoGroupsEnabled = competitionType === "league" && leagueFormat === "two_groups";
    const groupAssignmentMode = clean(payload.groupAssignmentMode || "auto") === "manual" ? "manual" : "auto";
    const manualGroups = payload.manualGroups && typeof payload.manualGroups === "object" ? payload.manualGroups : {};
    const manualGroupKeys = competitionType === "world_cup" ? ["A", "B", "C"] : ["A", "B"];
    const manualGroupMaxSize = competitionType === "world_cup" ? 3 : 4;
    const manualGroupAssignmentSupported =
      (competitionType === "league" && leagueTwoGroupsEnabled) ||
      (competitionType === "world_cup" && participantIds.length <= 9 && !worldCupQualifiersEnabled) ||
      (competitionType === "champions_league" && !clSingleGroup && participantIds.length <= 8 && !championsLeagueQualifiersEnabled);
    const manualGroupAssignmentEnabled = groupAssignmentMode === "manual" && manualGroupAssignmentSupported;
    const tieBreakFinalMode = clean(payload.tieBreakFinalMode || payload.groupTieBreakMode || "playoff") === "seed" ? "seed" : "playoff";
    if (competitionType === "super_cup" && participantIds.length !== 2) throw new Error("كأس السوبر مباراة نهائية بين عضوين فقط. اختر عضوين بالضبط.");
    if (competitionType === "world_cup" && participantIds.length < 4) throw new Error("كأس العالم يحتاج 4 مشاركين على الأقل حتى يمكن تكوين المتأهلين الأربعة للأدوار الإقصائية.");
    if (clSingleGroup && (participantIds.length < 3 || participantIds.length > 5)) throw new Error("دوري الأبطال بنظام مجموعة واحدة يدعم من 3 إلى 5 أعضاء فقط.");
    if (competitionType === "champions_league" && !clSingleGroup && participantIds.length < 4) throw new Error("دوري الأبطال يحتاج 4 مشاركين على الأقل حتى يمكن تكوين مجموعتين ونصف النهائي.");
    if (leagueTwoGroupsEnabled && participantIds.length < 4) throw new Error("الدوري بنظام مجموعتين يحتاج 4 مشاركين على الأقل.");
    if (leagueTwoGroupsEnabled && participantIds.length > 8) throw new Error("الدوري بنظام مجموعتين يدعم حتى 8 مشاركين حاليًا.");
    const leagueQualifierEnabled = competitionType === "league" && !leagueTwoGroupsEnabled && Boolean(payload.leagueQualifierEnabled);
    const leagueQualifierParticipantIds = Array.isArray(payload.leagueQualifierParticipantIds) ? payload.leagueQualifierParticipantIds.map(cleanId).filter(Boolean) : [];
    const leagueQualifierQualifiedCount = Math.max(1, Math.min(toNumber(payload.leagueQualifierQualifiedCount || payload.qualifiersCount || 1), 5));
    if (competitionType === "world_cup" && participantIds.length > 9 && !worldCupQualifiersEnabled) throw new Error("كأس العالم الأساسي حده 9 أعضاء. عند اختيار أكثر من 9 فعّل خيار تصفيات كأس العالم داخل نفس النسخة.");
    if (competitionType === "world_cup" && participantIds.length > 18) throw new Error("تصفيات كأس العالم الحالية تدعم حتى 18 مشاركًا كحد أقصى حتى يتم تأهيل 9 أعضاء لدور المجموعات.");
    if (competitionType === "champions_league" && !clSingleGroup && participantIds.length > 8 && !championsLeagueQualifiersEnabled) throw new Error("دوري الأبطال الأساسي حده 8 أعضاء. عند اختيار أكثر من 8 فعّل ملحق دوري الأبطال داخل نفس النسخة.");
    if (competitionType === "champions_league" && !clSingleGroup && participantIds.length > 16) throw new Error("ملحق دوري الأبطال الحالي يدعم حتى 16 مشاركًا كحد أقصى حتى يتم تأهيل 8 أعضاء لدور المجموعات.");
    if (competitionType === "cup" && participantIds.length > 8) throw new Error("بطولة الكأس تدعم حتى 8 مشاركين، ومع العدد الأقل يتم تطبيق التأهل المباشر / BYE تلقائيًا.");
    if (leagueQualifierEnabled) {
      if (leagueQualifierParticipantIds.length < 2) throw new Error("اختر عضوين على الأقل لملحق الدوري داخل نفس النسخة.");
      if (leagueQualifierParticipantIds.length > 5) throw new Error("ملحق الدوري يدعم من 2 إلى 5 أعضاء كحد أقصى.");
      if (leagueQualifierQualifiedCount >= leagueQualifierParticipantIds.length) throw new Error("عدد المتأهلين من الملحق يجب أن يكون أقل من عدد أعضاء الملحق.");
      const overlap = participantIds.some((id) => leagueQualifierParticipantIds.some((qid) => same(id, qid)));
      if (overlap) throw new Error("لا يمكن أن يكون العضو مشاركًا مباشرًا في الدوري وداخل الملحق في نفس الوقت.");
      if (participantIds.length + leagueQualifierQualifiedCount > 8) throw new Error("عدد المشاركين المباشرين + المتأهلين من الملحق يجب ألا يتجاوز 8 أعضاء في الدوري.");
    }

    if (groupAssignmentMode === "manual" && !manualGroupAssignmentSupported) {
      throw new Error("التوزيع اليدوي للمجموعات متاح فقط للبطولات ذات المجموعات بدون ملحق/تصفيات حالياً.");
    }
    if (manualGroupAssignmentEnabled) {
      const normalizedManualGroups = {};
      manualGroupKeys.forEach((key) => {
        normalizedManualGroups[key] = Array.isArray(manualGroups[key]) ? manualGroups[key].map(cleanId).filter(Boolean) : [];
      });
      const groupedIds = manualGroupKeys.flatMap((key) => normalizedManualGroups[key] || []);
      const uniqueGroupedIds = Array.from(new Set(groupedIds));
      const selectedSet = new Set(participantIds.map(cleanId).filter(Boolean));
      const hasAllParticipants = participantIds.every((id) => uniqueGroupedIds.some((gid) => same(gid, id)));
      const hasOnlySelected = uniqueGroupedIds.every((id) => selectedSet.has(id));
      if (!hasAllParticipants || !hasOnlySelected || uniqueGroupedIds.length !== participantIds.length || groupedIds.length !== uniqueGroupedIds.length) {
        throw new Error("يجب توزيع كل المشاركين مرة واحدة فقط داخل المجموعات اليدوية.");
      }
      if (manualGroupKeys.some((key) => !(normalizedManualGroups[key] || []).length)) {
        throw new Error("لا يمكن ترك مجموعة فارغة في التوزيع اليدوي.");
      }
      if (manualGroupKeys.some((key) => (normalizedManualGroups[key] || []).length > manualGroupMaxSize)) {
        throw new Error("عدد أعضاء إحدى المجموعات أكبر من الحد المسموح.");
      }
    }

    const manualSeeds = payload.manualSeeds && typeof payload.manualSeeds === "object" ? payload.manualSeeds : {};
    const cupManualPairingsEnabled = competitionType === "cup" && !cupLinkedLeagueGroupsEnabled && Boolean(payload.cupManualPairingsEnabled);
    const cupManualPairings = cupManualPairingsEnabled ? normalizeCupManualPairings(payload.cupPairings) : [];
    const participantRows = participantIds
      .map((id) => members.find((member) => same(member.id, id)))
      .filter(Boolean)
      .map((member, index) => ({
        memberId: cleanId(member.id),
        memberName: member.name || cleanId(member.id),
        avatar: member.avatar || avatar(member.name || member.id),
        image: member.avatar || avatar(member.name || member.id),
        order: index + 1,
        seed: ["league", "cup", "world_cup", "champions_league", "mini_league"].includes(competitionType) ? Math.max(1, toNumber(manualSeeds[cleanId(member.id)] || index + 1)) : index + 1,
        tieBreakFinalMode,
        status: "active",
      }))
      .sort((a, b) => ["league", "cup", "world_cup", "champions_league", "mini_league"].includes(competitionType) ? (toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar")) : 0);

    if (["league", "cup", "world_cup", "champions_league", "mini_league"].includes(competitionType)) {
      const seedValues = participantRows.map((item) => toNumber(item.seed)).filter(Boolean);
      const requiresUniqueSeeds = (competitionType === "cup" && !cupManualPairingsEnabled && !cupLinkedLeagueGroupsEnabled) || (competitionType === "league" && !leagueTwoGroupsEnabled);
      if (requiresUniqueSeeds && new Set(seedValues).size !== seedValues.length) throw new Error(competitionType === "league" ? "لا يمكن تكرار نفس تصنيف الدوري في نظام المجموعة الواحدة." : "لا يمكن تكرار نفس التصنيف في بطولة الكأس.");
      if (competitionType === "cup" && seedValues.some((seed) => seed < 1 || seed > 8)) throw new Error("تصنيف الكأس يجب أن يكون من 1 إلى 8.");
      if (competitionType === "league" && seedValues.some((seed) => seed < 1)) throw new Error("تصنيف الدوري يجب أن يبدأ من 1 ولا يمكن أن يكون صفرًا أو أقل.");
      if (competitionType === "world_cup" && seedValues.some((seed) => seed < 1)) throw new Error("تصنيف كأس العالم يجب أن يبدأ من 1 ولا يمكن أن يكون صفرًا أو أقل.");
      if (competitionType === "champions_league" && seedValues.some((seed) => seed < 1)) throw new Error("تصنيف دوري الأبطال يجب أن يبدأ من 1 ولا يمكن أن يكون صفرًا أو أقل.");
    }
    if (cupManualPairingsEnabled) validateCupManualPairings(cupManualPairings, participantRows);

    const roundsMode = clean(payload.roundsMode || "single") === "double" ? "double" : "single";
    const rewards = normalizeCompetitionRewards(payload.rewards || {});
    const autoPayRewards = Boolean(payload.autoPayRewards);
    const onlineMemberId = cleanId(payload.onlineMemberId || participantRows.find(isAbdullahLike)?.memberId || "");
    const fifaQuotaPerMember = Math.max(0, toNumber(payload.fifaQuotaPerMember ?? 2));
    const maxFifaPerRound = Math.max(1, toNumber(payload.maxFifaPerRound ?? fifaQuotaPerMember ?? 2));
    const gameDistributionMode = ["auto", "fifa2025_only", "pes2017_only", "mixed_manual"].includes(clean(payload.gameDistributionMode || "auto")) ? clean(payload.gameDistributionMode || "auto") : "auto";
    const fifa2025MatchCount = Math.max(0, toNumber(payload.fifa2025MatchCount ?? payload.fifaTargetCount ?? 0));
    const startDate = String(payload.startDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const endDate = String(payload.endDate || "").slice(0, 10);
    const qualifiersCount = Math.max(1, Math.min(toNumber(payload.qualifiersCount || 1), Math.max(1, participantRows.length - 1)));
    let matches = [];
    let standings = [];
    let gameQuota = null;
    let competitionParticipants = participantRows;
    let leagueQualifierObject = null;

    if (competitionType === "league") {
      if (leagueTwoGroupsEnabled) {
        const leagueGroupsPlan = generateLeagueTwoGroupsMatches(participantRows, {
          onlineMemberId,
          groupAssignmentMode: manualGroupAssignmentEnabled ? "manual" : "auto",
          manualGroups: manualGroupAssignmentEnabled ? manualGroups : {},
        });
        matches = leagueGroupsPlan.matches;
        gameQuota = leagueGroupsPlan.gameQuota;
        competitionParticipants = leagueGroupsPlan.participants || participantRows;
        standings = [];
      } else {
        let leagueParticipantsForSchedule = participantRows;
        if (leagueQualifierEnabled) {
          const qualifierRows = leagueQualifierParticipantIds
            .map((id) => members.find((member) => same(member.id, id)))
            .filter(Boolean)
            .map((member, index) => ({
              memberId: cleanId(member.id),
              memberName: member.name || cleanId(member.id),
              avatar: member.avatar || avatar(member.name || member.id),
              image: member.avatar || avatar(member.name || member.id),
              order: index + 1,
              seed: index + 1,
              status: "qualifier",
            }));
          const qualifierPlan = generateLeagueQualifierMatches(qualifierRows, leagueQualifierQualifiedCount, { onlineMemberId });
          const qualifierSlots = Array.from({ length: leagueQualifierQualifiedCount }, (_, index) => ({
            memberId: `__league_qualifier_winner_${index + 1}`,
            memberName: `المتأهل من ملحق الدوري ${index + 1}`,
            avatar: avatar(`متأهل ${index + 1}`),
            image: avatar(`متأهل ${index + 1}`),
            order: participantRows.length + index + 1,
            seed: participantRows.length + index + 1,
            tieBreakFinalMode,
            status: "pending_qualifier",
            isLeagueQualifierWinnerSlot: true,
            qualifierWinnerIndex: index + 1,
          }));
          leagueParticipantsForSchedule = [...participantRows, ...qualifierSlots];
          leagueQualifierObject = {
            enabled: true,
            type: "league",
            name: `ملحق ${name}`,
            linkedCompetitionName: name,
            qualifiedCount: leagueQualifierQualifiedCount,
            participantIds: qualifierRows.map((row) => row.memberId),
            participants: qualifierRows,
            matches: qualifierPlan.matches.map((match) => ({ ...match, scope: "league_qualifier", parentCompetitionType: "league" })),
            qualifiedMemberIds: [],
            status: "active",
            createdAtText: new Date().toISOString(),
          };
        }
        const baseMatches = generateLeagueRoundRobinMatches(leagueParticipantsForSchedule, roundsMode);
        const platformPlan = assignLeagueGamePlatforms(baseMatches, leagueParticipantsForSchedule, { onlineMemberId, maxFifaPerRound });
        matches = platformPlan.matches;
        gameQuota = platformPlan.gameQuota;
        competitionParticipants = leagueParticipantsForSchedule;
        standings = computeLeagueStandings(leagueParticipantsForSchedule, matches);
      }
    } else if (competitionType === "league_qualifier") {
      const qualifierPlan = generateLeagueQualifierMatches(participantRows, qualifiersCount, { onlineMemberId });
      matches = qualifierPlan.matches;
      gameQuota = qualifierPlan.gameQuota;
      standings = [];
    } else if (competitionType === "cup") {
      if (cupLinkedLeagueGroupsEnabled) {
        const cupPlan = generateLinkedLeagueGroupsCupPlan({ linkedLeague: linkedLeagueCompetition, onlineMemberId });
        matches = cupPlan.matches;
        gameQuota = cupPlan.gameQuota;
        competitionParticipants = cupPlan.participants.length ? cupPlan.participants : participantRows;
      } else {
        const cupPlan = generateSeededKnockoutBracketMatches(participantRows, { onlineMemberId, prefix: "CUP", title: "الكأس", manualPairings: cupManualPairingsEnabled ? cupManualPairings : [] });
        matches = cupPlan.matches;
        gameQuota = cupPlan.gameQuota;
      }
      standings = [];
    } else if (competitionType === "super_cup") {
      const superCupPlan = generateSeededKnockoutBracketMatches(participantRows, { onlineMemberId, prefix: "SUPER", title: "كأس السوبر" });
      matches = superCupPlan.matches.map((match) => ({ ...match, label: "نهائي كأس السوبر", phase: "final", round: 1 }));
      gameQuota = { ...(superCupPlan.gameQuota || {}), format: "single_final" };
      standings = [];
    } else if (competitionType === "world_cup") {
      const worldCupPlan = generateWorldCupMatches(participantRows, {
        onlineMemberId,
        enableQualifiers: worldCupQualifiersEnabled,
        groupAssignmentMode: manualGroupAssignmentEnabled ? "manual" : "auto",
        manualGroups: manualGroupAssignmentEnabled ? manualGroups : {},
      });
      matches = worldCupPlan.matches;
      gameQuota = worldCupPlan.gameQuota;
      competitionParticipants = worldCupPlan.participants || participantRows;
      standings = [];
    } else if (competitionType === "champions_league") {
      if (clSingleGroup) {
        const baseMatches = generateLeagueRoundRobinMatches(participantRows, roundsMode);
        const platformPlan = assignLeagueGamePlatforms(baseMatches, participantRows, { onlineMemberId, maxFifaPerRound });
        matches = platformPlan.matches;
        gameQuota = platformPlan.gameQuota;
        competitionParticipants = participantRows;
        standings = computeLeagueStandings(participantRows, matches);
      } else {
        const championsPlan = generateChampionsLeagueMatches(participantRows, {
          onlineMemberId,
          enableQualifiers: championsLeagueQualifiersEnabled,
          groupAssignmentMode: manualGroupAssignmentEnabled ? "manual" : "auto",
          manualGroups: manualGroupAssignmentEnabled ? manualGroups : {},
        });
        matches = championsPlan.matches;
        gameQuota = championsPlan.gameQuota;
        competitionParticipants = championsPlan.participants || participantRows;
        standings = [];
      }
    }

    if (leagueQualifierObject?.enabled) {
      const qualifierMatchCount = Array.isArray(leagueQualifierObject.matches) ? leagueQualifierObject.matches.length : 0;
      const combinedGameMatches = applyCompetitionGameMode([...(leagueQualifierObject.matches || []), ...matches], { gameDistributionMode, fifa2025MatchCount });
      leagueQualifierObject = { ...leagueQualifierObject, matches: combinedGameMatches.slice(0, qualifierMatchCount) };
      matches = combinedGameMatches.slice(qualifierMatchCount);
    } else {
      matches = applyCompetitionGameMode(matches, { gameDistributionMode, fifa2025MatchCount });
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const typeLabel = competitionTypeLabel(competitionType);

    const competitionRef = await addDoc(collection(db, "competitions"), {
      type: competitionType,
      typeLabel,
      name,
      logo: competitionLogoUrl({ type: competitionType }, config, trophyMap),
      seasonId,
      status: "active",
      startDate,
      endDate,
      roundsMode: competitionType === "league" ? (leagueTwoGroupsEnabled ? "groups_knockout" : roundsMode) : (competitionType === "champions_league" && clSingleGroup) ? roundsMode : competitionType === "super_cup" ? "single_final" : ["world_cup", "champions_league"].includes(competitionType) ? "groups_knockout" : "knockout",
      leagueFormat: competitionType === "league" ? leagueFormat : "",
      championsLeagueFormat: competitionType === "champions_league" ? championsLeagueFormat : "",
      groupAssignmentMode: manualGroupAssignmentEnabled ? "manual" : "auto",
      manualGroups: manualGroupAssignmentEnabled ? manualGroups : {},
      tieBreakFinalMode,
      tieBreakFinalModeLabel: tieBreakFinalMode === "seed" ? "الحسم حسب التصنيف المسبق" : "الحسم بمباراة فاصلة",
      bracketMode: competitionType === "super_cup" ? "single_final" : competitionType === "cup" ? (cupLinkedLeagueGroupsEnabled ? "linked_league_groups" : cupManualPairingsEnabled ? "manual_knockout" : "seeded_knockout") : competitionType === "world_cup" ? "world_cup_groups_knockout" : (competitionType === "champions_league" && clSingleGroup) ? "champions_league_single_group" : competitionType === "champions_league" ? "champions_league_groups_knockout" : (competitionType === "league_qualifier" ? "qualifier_knockout" : leagueTwoGroupsEnabled ? "league_two_groups_knockout" : "league"),
      cupMode: competitionType === "cup" ? (cupLinkedLeagueGroupsEnabled ? "linked_league_groups" : cupManualPairingsEnabled ? "manual" : "seeded") : "",
      cupLinkedLeagueGroupsEnabled,
      linkedLeagueCompetitionId: cupLinkedLeagueCompetitionId,
      linkedLeagueCompetitionName: linkedLeagueCompetition?.name || "",
      cupManualPairingsEnabled,
      cupPairings: cupManualPairings,
      qualifiersCount: competitionType === "league_qualifier" ? qualifiersCount : ["world_cup", "champions_league"].includes(competitionType) ? 4 : null,
      rewards,
      autoPayRewards,
      gameRules: {
        mainGames: ["PES 2017", "FIFA 2025"],
        onlineMemberId,
        fifaQuotaPerMember,
        maxFifaPerRound,
        gameDistributionMode,
        fifa2025MatchCount,
        gameQuota,
        rule: gameDistributionMode === "fifa2025_only" ? "اختيار إداري: كل المباريات على FIFA 2025." : gameDistributionMode === "pes2017_only" ? "اختيار إداري: كل المباريات على PES 2017." : gameDistributionMode === "mixed_manual" ? `اختيار إداري: مكس بين اللعبتين، ${fifa2025MatchCount} مباراة على FIFA 2025 والباقي PES 2017.` : "أي مباراة تشمل عضو الأونلاين تكون FIFA 2025، وكل جولة تحاول احتواء مباريات FIFA 2025 والباقي PES 2017 مع توزيع عادل.",
      },
      participants: competitionParticipants,
      matches,
      standings,
      relegatedMemberIds: [],
      absentMemberIds: [],
      qualifiedMemberIds: [],
      leagueQualifier: leagueQualifierObject,
      championMemberId: "",
      championMemberName: "",
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: todayDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "adminDecisions"), {
      type: competitionType === "league_qualifier" ? "league_qualifier_created" : competitionType === "cup" ? "cup_created" : competitionType === "super_cup" ? "super_cup_created" : competitionType === "world_cup" ? "world_cup_created" : "league_created",
      status: "active",
      title: competitionType === "league_qualifier" ? "إنشاء ملحق دوري" : competitionType === "cup" ? "إنشاء بطولة الكأس" : competitionType === "super_cup" ? "إنشاء كأس السوبر" : competitionType === "world_cup" ? "إنشاء كأس العالم" : competitionType === "champions_league" ? "إنشاء دوري الأبطال" : competitionType === "mini_league" ? "إنشاء دوري المجموعة" : "إنشاء دوري",
      body: "تم إنشاء " + name + " بعدد " + participantRows.length + " مشاركين.",
      competitionId: competitionRef.id,
      competitionName: name,
      competitionType,
      seasonId,
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: todayDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: competitionType === "league_qualifier" ? "league_qualifier_created" : competitionType === "cup" ? "cup_created" : competitionType === "super_cup" ? "super_cup_created" : competitionType === "world_cup" ? "world_cup_created" : competitionType === "mini_league" ? "mini_league_created" : "league_created",
      title: competitionType === "league_qualifier" ? "تم إنشاء ملحق دوري" : competitionType === "cup" ? "تم إنشاء بطولة الكأس" : competitionType === "super_cup" ? "تم إنشاء كأس السوبر" : competitionType === "world_cup" ? "تم إنشاء كأس العالم" : competitionType === "champions_league" ? "تم إنشاء دوري الأبطال" : competitionType === "mini_league" ? "تم إنشاء دوري المجموعة" : "تم إنشاء دوري جديد",
      body: "تم إنشاء " + name + " في FIFA GROUP. يمكنك متابعة الجدول والنتائج من صفحة " + (config.seasonName || "الموسم") + " داخل التطبيق.",
      status: "unread",
      audience: "all",
      fromMemberId: "FIFA",
      fromMemberName: "FIFA",
      source: "fifa_admin_competitions",
      relatedCompetitionId: competitionRef.id,
      clickUrl: "/?fgPage=season&fgCompetitionId=" + encodeURIComponent(competitionRef.id),
      createdBy: authUser?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function syncLinkedCupsForLeagueCompetition(leagueCompetition = {}) {
    if (!leagueCompetition?.id || !isLeagueGroupsCompetition(leagueCompetition)) return;
    const linkedCups = (firebaseCompetitions || []).filter((item) =>
      isLinkedLeagueGroupsCup(item) &&
      same(item.linkedLeagueCompetitionId || item.linkedLeagueId, leagueCompetition.id) &&
      !["cancelled", "completed"].includes(clean(item.status || "active"))
    );
    if (!linkedCups.length) return;

    await Promise.allSettled(linkedCups.map(async (cup) => {
      const plan = generateLinkedLeagueGroupsCupPlan({
        linkedLeague: leagueCompetition,
        existingCup: cup,
        onlineMemberId: cup?.gameRules?.onlineMemberId || leagueCompetition?.gameRules?.onlineMemberId || "",
      });
      const oldMatchesJson = JSON.stringify(cup.matches || []);
      const newMatchesJson = JSON.stringify(plan.matches || []);
      const oldParticipantsJson = JSON.stringify(cup.participants || []);
      const newParticipantsJson = JSON.stringify(plan.participants || []);
      if (oldMatchesJson === newMatchesJson && oldParticipantsJson === newParticipantsJson) return;
      await updateDoc(doc(db, "competitions", cup.id), {
        matches: plan.matches,
        participants: plan.participants.length ? plan.participants : (cup.participants || []),
        gameRules: {
          ...(cup.gameRules || {}),
          gameQuota: {
            ...((cup.gameRules || {}).gameQuota || {}),
            ...(plan.gameQuota || {}),
          },
        },
        linkedCupLastSyncedAt: serverTimestamp(),
        linkedCupLastSyncedFromLeagueId: leagueCompetition.id,
        updatedAt: serverTimestamp(),
      });
    }));
  }

  function resolveEmbeddedLeagueQualifierLinks(competition = {}, nextQualifier = null, baseMatchesArg = null, baseParticipantsArg = null) {
    const qualifier = nextQualifier || competition.leagueQualifier || {};
    const qCount = Math.max(1, toNumber(qualifier.qualifiedCount || competition.leagueQualifier?.qualifiedCount || 1));
    const qualifiedIds = computeLeagueQualifierQualifiedIds({ matches: qualifier.matches || [], qualifiersCount: qCount });
    const qualifiedRows = qualifiedIds.map((id) => {
      const row = (qualifier.participants || []).find((item) => same(item.memberId || item.id, id)) || (competition.participants || []).find((item) => same(item.memberId || item.id, id)) || members.find((item) => same(item.id, id));
      return { memberId: cleanId(id), memberName: row?.memberName || row?.name || getMemberName(members, id) || id, avatar: row?.avatar || row?.image || avatar(row?.memberName || row?.name || id), image: row?.image || row?.avatar || avatar(row?.memberName || row?.name || id) };
    });
    const slotMap = new Map();
    qualifiedRows.forEach((row, index) => slotMap.set(`__league_qualifier_winner_${index + 1}`, row));
    const replaceSide = (memberId, name) => {
      const safe = String(memberId || "");
      const row = slotMap.get(safe);
      if (!row) return { memberId, name };
      return { memberId: row.memberId, name: row.memberName };
    };
    const baseMatches = Array.isArray(baseMatchesArg) ? baseMatchesArg : (Array.isArray(competition.matches) ? competition.matches : []);
    const baseParticipants = Array.isArray(baseParticipantsArg) ? baseParticipantsArg : (Array.isArray(competition.participants) ? competition.participants : []);
    const resolvedParticipants = baseParticipants.map((participant) => {
      const row = slotMap.get(String(participant.memberId || participant.id || ""));
      return row ? { ...participant, ...row, status: "active", resolvedFromLeagueQualifier: true } : participant;
    });
    const resolvedMatches = baseMatches.map((match) => {
      const home = replaceSide(match.homeMemberId, match.homeName);
      const away = replaceSide(match.awayMemberId, match.awayName);
      return { ...match, homeMemberId: home.memberId, homeName: home.name, awayMemberId: away.memberId, awayName: away.name };
    });
    return { qualifiedIds, resolvedParticipants, resolvedMatches, qualifier: { ...qualifier, qualifiedMemberIds: qualifiedIds, status: qualifiedIds.length >= qCount ? "completed" : (qualifier.status || "active") } };
  }

  async function updateFifaLeagueMatchResult({ competitionId, matchId, homeGoals, awayGoals, homePens, awayPens, gameTitle }) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const competition = firebaseCompetitions.find((item) => same(item.id, competitionId));
    if (!competition) throw new Error("البطولة غير موجودة.");
    const competitionType = competitionTypeKey(competition.type || "league");
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const clSingleGroupMode = isChampionsLeagueSingleGroup(competition);
    if (!["league", "league_qualifier", "cup", "super_cup", "world_cup", "champions_league", "mini_league"].includes(competitionType)) throw new Error("هذه العملية مخصصة للبطولات التنافسية المدعومة فقط.");
    if (["completed", "cancelled"].includes(clean(competition.status || "active")) && !["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) && !leagueGroupsMode && !clSingleGroupMode) throw new Error("لا يمكن تعديل نتائج بطولة مغلقة أو ملغاة.");
    const h = toNumber(homeGoals);
    const a = toNumber(awayGoals);
    if (h < 0 || a < 0 || String(homeGoals).trim() === "" || String(awayGoals).trim() === "") {
      throw new Error("أدخل نتيجة صحيحة للطرفين.");
    }

    const embeddedLeagueQualifier = competitionType === "league" && competition.leagueQualifier?.enabled ? competition.leagueQualifier : null;
    if (embeddedLeagueQualifier && (embeddedLeagueQualifier.matches || []).some((match) => same(match.id, matchId))) {
      const beforeQualifiedIds = computeLeagueQualifierQualifiedIds({ matches: embeddedLeagueQualifier.matches || [], qualifiersCount: embeddedLeagueQualifier.qualifiedCount || 1 });
      let nextQualifierMatches = (embeddedLeagueQualifier.matches || []).map((match) => {
        if (!same(match.id, matchId)) return match;
        if (String(match.homeMemberId || "").startsWith("__") || String(match.awayMemberId || "").startsWith("__")) throw new Error("هذه المباراة بانتظار تحديد المتأهل من مرحلة سابقة.");
        const hp = String(homePens ?? "").trim() === "" ? null : toNumber(homePens);
        const ap = String(awayPens ?? "").trim() === "" ? null : toNumber(awayPens);
        let winnerMemberId = h > a ? cleanId(match.homeMemberId) : a > h ? cleanId(match.awayMemberId) : "";
        let winnerName = h > a ? match.homeName : a > h ? match.awayName : "";
        if (!winnerMemberId) {
          if (hp === null || ap === null || hp === ap) throw new Error("في مباريات الملحق الإقصائية، أدخل ركلات الترجيح عند التعادل وحدد متأهلًا.");
          winnerMemberId = hp > ap ? cleanId(match.homeMemberId) : cleanId(match.awayMemberId);
          winnerName = hp > ap ? match.homeName : match.awayName;
        }
        return { ...match, homeGoals: h, awayGoals: a, homePens: hp, awayPens: ap, resultStatus: "completed", status: "completed", winnerMemberId, winnerName, gameTitle: String(gameTitle || match.gameTitle || "").trim() || match.gameTitle || "PES 2017", gameCode: clean(gameTitle || match.gameTitle || "").includes("fifa") || String(gameTitle || match.gameTitle || "").includes("2025") ? "fifa25" : match.gameCode || "pes17", updatedAtText: new Date().toISOString() };
      });
      nextQualifierMatches = resolveLeagueQualifierDependencies(nextQualifierMatches);
      const resolved = resolveEmbeddedLeagueQualifierLinks(competition, { ...embeddedLeagueQualifier, matches: nextQualifierMatches }, competition.matches || [], competition.participants || []);
      const standings = computeLeagueStandings(resolved.resolvedParticipants, resolved.resolvedMatches);
      await updateDoc(doc(db, "competitions", competitionId), { matches: resolved.resolvedMatches, participants: resolved.resolvedParticipants, standings, leagueQualifier: resolved.qualifier, updatedAt: serverTimestamp(), lastResultAt: serverTimestamp() });
      const qCount = Math.max(1, toNumber(embeddedLeagueQualifier.qualifiedCount || 1));
      if (beforeQualifiedIds.length < qCount && resolved.qualifiedIds.length >= qCount) {
        const names = resolved.qualifiedIds.map((id) => getMemberName(members, id) || id).join("، ");
        await addDoc(collection(db, "notifications"), { type: "league_qualifier_completed", title: "نتيجة ملحق الدوري", body: `نتيجة ${embeddedLeagueQualifier.name || ("ملحق " + (competition.name || "الدوري"))}: المتأهلون إلى الدوري هم ${names}.`, audience: "all", fromMemberId: "FIFA", fromMemberName: "FIFA", source: "fifa_admin_competitions", relatedCompetitionId: competitionId, clickUrl: "/?fgPage=season&fgCompetitionId=" + encodeURIComponent(competitionId), createdBy: authUser?.uid || "", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      return;
    }

    const matches = Array.isArray(competition.matches) ? competition.matches : [];
    let nextMatches = matches.map((match) => {
      if (!same(match.id, matchId)) return match;
      if (String(match.homeMemberId || "").startsWith("__") || String(match.awayMemberId || "").startsWith("__")) {
        throw new Error("هذه المباراة بانتظار تحديد المتأهل من مرحلة سابقة.");
      }
      const hp = String(homePens ?? "").trim() === "" ? null : toNumber(homePens);
      const ap = String(awayPens ?? "").trim() === "" ? null : toNumber(awayPens);
      let winnerMemberId = h > a ? cleanId(match.homeMemberId) : a > h ? cleanId(match.awayMemberId) : "";
      let winnerName = h > a ? match.homeName : a > h ? match.awayName : "";
      const matchPhase = clean(match.phase || "");
      const needsPenaltyWinner = !winnerMemberId && (
        competitionType === "league_qualifier" ||
        (((isKnockoutCompetitionType(competitionType) && !clSingleGroupMode) || leagueGroupsMode) && !((["world_cup", "champions_league"].includes(competitionType) || leagueGroupsMode) && matchPhase === "group"))
      );
      if (needsPenaltyWinner) {
        if (hp === null || ap === null || hp === ap) throw new Error("في المباريات الإقصائية، أدخل ركلات الترجيح عند التعادل وحدد فائزًا.");
        winnerMemberId = hp > ap ? cleanId(match.homeMemberId) : cleanId(match.awayMemberId);
        winnerName = hp > ap ? match.homeName : match.awayName;
      }
      return {
        ...match,
        homeGoals: h,
        awayGoals: a,
        homePens: hp,
        awayPens: ap,
        resultStatus: "completed",
        status: "completed",
        winnerMemberId,
        winnerName,
        gameTitle: String(gameTitle || match.gameTitle || "").trim() || match.gameTitle || "PES 2017",
        gameCode: clean(gameTitle || match.gameTitle || "").includes("fifa") || String(gameTitle || match.gameTitle || "").includes("2025") ? "fifa25" : match.gameCode || "pes17",
        updatedAtText: new Date().toISOString(),
      };
    });

    if (competitionType === "league_qualifier") {
      nextMatches = resolveLeagueQualifierDependencies(nextMatches);
    } else if (competitionType === "world_cup") {
      nextMatches = resolveWorldCupDependencies({ ...competition, matches: nextMatches });
    } else if ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) {
      nextMatches = resolveChampionsLeagueDependencies({ ...competition, matches: nextMatches });
    } else if (isKnockoutCompetitionType(competitionType)) {
      nextMatches = resolveKnockoutBracketDependencies(nextMatches);
    }

    const participants = Array.isArray(competition.participants) ? competition.participants : [];
    const isLeagueStyleComp = (competitionType === "league" || competitionType === "mini_league" || clSingleGroupMode) && !leagueGroupsMode;
    const standings = isLeagueStyleComp ? computeLeagueStandings(filterCompetitionParticipantsForCalculation({ ...competition, participants, matches: nextMatches }), filterCompetitionMatchesForCalculation({ ...competition, participants, matches: nextMatches })) : [];
    const qualifiedMemberIds = competitionType === "league_qualifier" ? computeLeagueQualifierQualifiedIds({ ...competition, matches: nextMatches }) : competitionType === "world_cup" ? computeWorldCupQualifiedIds({ ...competition, matches: nextMatches }) : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) ? computeChampionsLeagueQualifiedIds({ ...competition, matches: nextMatches }) : clSingleGroupMode ? [] : computeKnockoutQualifiedIds({ ...competition, matches: nextMatches });
    const nextChampion = (isKnockoutCompetitionType(competitionType) && !clSingleGroupMode || leagueGroupsMode) ? getKnockoutChampion({ ...competition, matches: nextMatches }) : null;
    const nextStatus = ((["cup", "super_cup", "world_cup"].includes(competitionType) || (competitionType === "champions_league" && !clSingleGroupMode)) || leagueGroupsMode) && clean(competition.status || "active") === "completed" ? "completed" : "active";
    const nextCompetitionForSync = {
      ...competition,
      matches: nextMatches,
      standings,
      qualifiedMemberIds,
      status: nextStatus,
      championMemberId: nextChampion?.memberId || (isLeagueStyleComp ? "" : competition.championMemberId || ""),
      championMemberName: nextChampion?.memberName || (isLeagueStyleComp ? "" : competition.championMemberName || ""),
    };
    await updateDoc(doc(db, "competitions", competitionId), {
      matches: nextCompetitionForSync.matches,
      standings: nextCompetitionForSync.standings,
      qualifiedMemberIds: nextCompetitionForSync.qualifiedMemberIds,
      status: nextCompetitionForSync.status,
      championMemberId: nextCompetitionForSync.championMemberId,
      championMemberName: nextCompetitionForSync.championMemberName,
      updatedAt: serverTimestamp(),
      lastResultAt: serverTimestamp(),
      rewardsNeedReview: (["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) || leagueGroupsMode) && clean(competition.status || "active") === "completed" ? true : Boolean(competition.rewardsNeedReview),
    });
    if (leagueGroupsMode) await syncLinkedCupsForLeagueCompetition(nextCompetitionForSync);
  }

  async function clearFifaLeagueMatchResult({ competitionId, matchId }) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const competition = firebaseCompetitions.find((item) => same(item.id, competitionId));
    if (!competition) throw new Error("البطولة غير موجودة.");
    if (["completed", "cancelled"].includes(clean(competition.status || "active")) && !["cup", "super_cup", "world_cup", "champions_league"].includes(competitionTypeKey(competition.type || "league"))) throw new Error("لا يمكن حذف نتيجة بطولة مغلقة أو ملغاة.");
    const competitionType = competitionTypeKey(competition.type || "league");
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const embeddedLeagueQualifier = competitionType === "league" && !leagueGroupsMode && competition.leagueQualifier?.enabled ? competition.leagueQualifier : null;
    if (embeddedLeagueQualifier && (embeddedLeagueQualifier.matches || []).some((match) => same(match.id, matchId))) {
      let nextQualifierMatches = (embeddedLeagueQualifier.matches || []).map((match) => {
        if (!same(match.id, matchId)) return match;
        return { ...match, homeGoals: "", awayGoals: "", homePens: null, awayPens: null, resultStatus: "pending", status: "scheduled", winnerMemberId: "", winnerName: "", updatedAtText: new Date().toISOString() };
      });
      nextQualifierMatches = resolveLeagueQualifierDependencies(nextQualifierMatches);
      const nextQualifier = { ...embeddedLeagueQualifier, matches: nextQualifierMatches, qualifiedMemberIds: computeLeagueQualifierQualifiedIds({ matches: nextQualifierMatches, qualifiersCount: embeddedLeagueQualifier.qualifiedCount || 1 }), status: "active" };
      await updateDoc(doc(db, "competitions", competitionId), { leagueQualifier: nextQualifier, updatedAt: serverTimestamp(), lastResultClearedAt: serverTimestamp() });
      return;
    }
    const nextMatches = (Array.isArray(competition.matches) ? competition.matches : []).map((match) => {
      if (!same(match.id, matchId)) return match;
      return {
        ...match,
        homeGoals: "",
        awayGoals: "",
        homePens: null,
        awayPens: null,
        resultStatus: "pending",
        status: "scheduled",
        winnerMemberId: "",
        winnerName: "",
        updatedAtText: new Date().toISOString(),
      };
    });
    const clSingleGroupMode = isChampionsLeagueSingleGroup(competition);
    const resolvedMatches = competitionType === "league_qualifier" ? resolveLeagueQualifierDependencies(nextMatches) : competitionType === "world_cup" ? resolveWorldCupDependencies({ ...competition, matches: nextMatches }) : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) ? resolveChampionsLeagueDependencies({ ...competition, matches: nextMatches }) : isKnockoutCompetitionType(competitionType) && !clSingleGroupMode ? resolveKnockoutBracketDependencies(nextMatches) : nextMatches;
    const clearIsLeagueStyleComp = (competitionType === "league" || competitionType === "mini_league" || clSingleGroupMode) && !leagueGroupsMode;
    const standings = clearIsLeagueStyleComp ? computeLeagueStandings(filterCompetitionParticipantsForCalculation({ ...competition, matches: resolvedMatches }), filterCompetitionMatchesForCalculation({ ...competition, matches: resolvedMatches })) : [];
    const qualifiedMemberIds = competitionType === "league_qualifier" ? computeLeagueQualifierQualifiedIds({ ...competition, matches: resolvedMatches }) : competitionType === "world_cup" ? computeWorldCupQualifiedIds({ ...competition, matches: resolvedMatches }) : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) ? computeChampionsLeagueQualifiedIds({ ...competition, matches: resolvedMatches }) : clSingleGroupMode ? [] : computeKnockoutQualifiedIds({ ...competition, matches: resolvedMatches });
    const nextChampion = ((isKnockoutCompetitionType(competitionType) && !clSingleGroupMode) || leagueGroupsMode) ? getKnockoutChampion({ ...competition, matches: resolvedMatches }) : null;
    const nextStatus = (["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) || leagueGroupsMode) && clean(competition.status || "active") === "completed" ? "completed" : "active";
    const nextCompetitionForSync = {
      ...competition,
      matches: resolvedMatches,
      standings,
      qualifiedMemberIds,
      status: nextStatus,
      championMemberId: nextChampion?.memberId || (clearIsLeagueStyleComp ? "" : competition.championMemberId || ""),
      championMemberName: nextChampion?.memberName || (clearIsLeagueStyleComp ? "" : competition.championMemberName || ""),
    };
    await updateDoc(doc(db, "competitions", competitionId), {
      matches: nextCompetitionForSync.matches,
      standings: nextCompetitionForSync.standings,
      qualifiedMemberIds: nextCompetitionForSync.qualifiedMemberIds,
      status: nextCompetitionForSync.status,
      championMemberId: nextCompetitionForSync.championMemberId,
      championMemberName: nextCompetitionForSync.championMemberName,
      updatedAt: serverTimestamp(),
      lastResultClearedAt: serverTimestamp(),
      rewardsNeedReview: (["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) || leagueGroupsMode) && clean(competition.status || "active") === "completed" ? true : Boolean(competition.rewardsNeedReview),
    });
    if (leagueGroupsMode) await syncLinkedCupsForLeagueCompetition(nextCompetitionForSync);
  }


  async function applyFifaCompetitionAbsenceAction({ competitionId, memberId, mode = "exclude", forfeitWinGoals = 3, forfeitLoseGoals = 0, note = "" } = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const competition = firebaseCompetitions.find((item) => same(item.id, competitionId));
    if (!competition) throw new Error("البطولة غير موجودة.");
    if (["completed", "cancelled"].includes(clean(competition.status || "active"))) throw new Error("لا يمكن تطبيق إدارة الغياب على بطولة معتمدة أو ملغاة.");

    const safeMemberId = cleanId(memberId || "");
    if (!safeMemberId) throw new Error("اختر العضو الغائب.");
    const competitionType = competitionTypeKey(competition.type || "league");
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const actionMode = clean(mode || "exclude") === "forfeit_loss" ? "forfeit_loss" : "exclude";
    const memberRow = (competition.participants || []).find((item) => same(item.memberId || item.id, safeMemberId));
    const memberName = memberRow?.memberName || memberRow?.name || getMemberName(members, safeMemberId) || safeMemberId;
    const todayText = new Date().toISOString();
    const existingActions = Array.isArray(competition.absenceActions) ? competition.absenceActions : [];
    const nextAbsentIds = uniqueCleanIds([...(competition.absentMemberIds || []), safeMemberId]);
    let nextExcludedIds = uniqueCleanIds([...(competition.excludedMemberIds || [])]);
    let nextParticipants = Array.isArray(competition.participants) ? competition.participants.map((item) => ({ ...item })) : [];
    let nextMatches = Array.isArray(competition.matches) ? competition.matches.map((item) => ({ ...item })) : [];
    let affectedMatchCount = 0;

    if (actionMode === "exclude") {
      nextExcludedIds = uniqueCleanIds([...nextExcludedIds, safeMemberId]);
      nextParticipants = nextParticipants.map((item) => same(item.memberId || item.id, safeMemberId) ? {
        ...item,
        status: "excluded",
        absent: true,
        excludedFromCompetition: true,
        absenceAction: "excluded",
        absenceActionAtText: todayText,
      } : item);
      nextMatches = nextMatches.map((match) => {
        if (!matchInvolvesMember(match, safeMemberId)) return match;
        if (!isGroupOrLeagueStageMatch(competition, match)) return match;
        affectedMatchCount += 1;
        return {
          ...match,
          status: "excluded",
          resultStatus: "excluded",
          absenceAction: "excluded",
          absenceMemberId: safeMemberId,
          absenceMemberName: memberName,
          winnerMemberId: "",
          winnerName: "",
          homeGoals: "",
          awayGoals: "",
          homePens: null,
          awayPens: null,
          updatedAtText: todayText,
        };
      });
      if (!affectedMatchCount && !nextParticipants.some((item) => same(item.memberId || item.id, safeMemberId))) {
        throw new Error("العضو غير موجود داخل هذه البطولة.");
      }
    } else {
      const winGoals = Math.max(0, toNumber(forfeitWinGoals || 0));
      const loseGoals = Math.max(0, toNumber(forfeitLoseGoals || 0));
      if (winGoals === loseGoals) throw new Error("نتيجة الخسارة الإدارية يجب أن تحدد فائزًا.");
      nextMatches = nextMatches.map((match) => {
        if (!matchInvolvesMember(match, safeMemberId)) return match;
        if (!isGroupOrLeagueStageMatch(competition, match)) return match;
        if (clean(match.resultStatus || match.status) === "completed") return match;
        if (isWaitingCompetitionMatch(match) || clean(match.phase || "") === "bye") return match;
        const homeIsAbsent = same(match.homeMemberId, safeMemberId);
        const opponentId = cleanId(homeIsAbsent ? match.awayMemberId : match.homeMemberId);
        const opponentName = homeIsAbsent ? match.awayName : match.homeName;
        if (!opponentId || String(opponentId).startsWith("__") || same(opponentId, "__bye__")) return match;
        affectedMatchCount += 1;
        return {
          ...match,
          homeGoals: homeIsAbsent ? loseGoals : winGoals,
          awayGoals: homeIsAbsent ? winGoals : loseGoals,
          homePens: null,
          awayPens: null,
          resultStatus: "completed",
          status: "completed",
          winnerMemberId: opponentId,
          winnerName: opponentName || getMemberName(members, opponentId) || opponentId,
          adminResult: true,
          forfeitResult: true,
          absenceAction: "forfeit_loss",
          absenceMemberId: safeMemberId,
          absenceMemberName: memberName,
          gameReason: "خسارة إدارية بسبب الغياب",
          updatedAtText: todayText,
        };
      });
      if (!affectedMatchCount) throw new Error("لا توجد مباريات متبقية قابلة لتسجيل خسارة إدارية لهذا العضو.");
    }

    const nextCompetitionBase = {
      ...competition,
      participants: nextParticipants,
      matches: nextMatches,
      absentMemberIds: nextAbsentIds,
      excludedMemberIds: nextExcludedIds,
      absenceActions: [
        ...existingActions,
        {
          id: `absence-${Date.now()}`,
          memberId: safeMemberId,
          memberName,
          mode: actionMode,
          forfeitWinGoals: actionMode === "forfeit_loss" ? Math.max(0, toNumber(forfeitWinGoals || 0)) : null,
          forfeitLoseGoals: actionMode === "forfeit_loss" ? Math.max(0, toNumber(forfeitLoseGoals || 0)) : null,
          affectedMatchCount,
          note: String(note || "").trim(),
          createdBy: authUser?.uid || "",
          createdByMemberId: currentMemberId || "FIFA",
          createdAtText: todayText,
        },
      ],
    };

    let resolvedMatches = nextCompetitionBase.matches;
    if (competitionType === "league_qualifier") {
      resolvedMatches = resolveLeagueQualifierDependencies(resolvedMatches);
    } else if (competitionType === "world_cup") {
      resolvedMatches = resolveWorldCupDependencies(nextCompetitionBase);
    } else if ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) {
      resolvedMatches = resolveChampionsLeagueDependencies(nextCompetitionBase);
    } else if (isKnockoutCompetitionType(competitionType)) {
      resolvedMatches = resolveKnockoutBracketDependencies(resolvedMatches);
    }

    const resolvedCompetition = { ...nextCompetitionBase, matches: resolvedMatches };
    const absenceIsLeagueStyleComp = (competitionType === "league" || competitionType === "mini_league" || clSingleGroupMode) && !leagueGroupsMode;
    const standings = absenceIsLeagueStyleComp
      ? computeLeagueStandings(filterCompetitionParticipantsForCalculation(resolvedCompetition), filterCompetitionMatchesForCalculation(resolvedCompetition))
      : [];
    const qualifiedMemberIds = competitionType === "league_qualifier"
      ? computeLeagueQualifierQualifiedIds(resolvedCompetition)
      : competitionType === "world_cup"
        ? computeWorldCupQualifiedIds(resolvedCompetition)
        : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode)
          ? computeChampionsLeagueQualifiedIds(resolvedCompetition)
          : clSingleGroupMode ? [] : computeKnockoutQualifiedIds(resolvedCompetition);

    const updatePayload = {
      participants: resolvedCompetition.participants,
      matches: resolvedCompetition.matches,
      standings,
      qualifiedMemberIds,
      absentMemberIds: nextAbsentIds,
      excludedMemberIds: nextExcludedIds,
      absenceActions: resolvedCompetition.absenceActions,
      updatedAt: serverTimestamp(),
      lastAbsenceActionAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "competitions", competitionId), updatePayload);
    const nextCompetitionForSync = { ...competition, ...updatePayload };
    if (leagueGroupsMode) await syncLinkedCupsForLeagueCompetition(nextCompetitionForSync);

    await addDoc(collection(db, "adminDecisions"), {
      type: actionMode === "exclude" ? "competition_absence_exclusion" : "competition_absence_forfeit_loss",
      status: "completed",
      title: actionMode === "exclude" ? "استبعاد عضو من بطولة" : "تسجيل خسارة إدارية بسبب الغياب",
      body: actionMode === "exclude"
        ? "تم استبعاد " + memberName + " من " + (competition.name || "البطولة") + "."
        : "تم تسجيل خسارة إدارية للعضو " + memberName + " في " + affectedMatchCount + " مباراة متبقية ضمن " + (competition.name || "البطولة") + ".",
      competitionId,
      competitionName: competition.name || "",
      competitionType,
      memberId: safeMemberId,
      memberName,
      actionMode,
      affectedMatchCount,
      note: String(note || "").trim(),
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateFifaCompetitionAdminNote({ competitionId, note = "" } = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const id = cleanId(competitionId || "");
    if (!id) throw new Error("اختر البطولة أولًا.");
    const existing = firebaseCompetitions.find((item) => same(item.id, id));
    if (!existing) throw new Error("البطولة غير موجودة.");
    await updateDoc(doc(db, "competitions", id), {
      adminNote: String(note || "").trim(),
      adminNoteUpdatedAt: serverTimestamp(),
      adminNoteUpdatedBy: authUser?.uid || "",
      adminNoteUpdatedByMemberId: currentMemberId || "FIFA",
      updatedAt: serverTimestamp(),
    });
  }

  async function updateFifaCompetitionTieBreakDecision({ competitionId, key = "", scope = "table", groupKey = "main", groupName = "", tieKey = "", memberOrder = [], note = "" } = {}) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const id = cleanId(competitionId || "");
    if (!id) throw new Error("اختر البطولة أولًا.");
    const competition = firebaseCompetitions.find((item) => same(item.id, id));
    if (!competition) throw new Error("البطولة غير موجودة.");
    const order = Array.isArray(memberOrder) ? memberOrder.map(cleanId).filter(Boolean) : [];
    if (order.length < 2 || new Set(order).size !== order.length) throw new Error("رتّب كل أعضاء الفاصلة بدون تكرار.");
    const safeScope = clean(scope || "table") || "table";
    const safeGroupKey = cleanId(groupKey || "main") || "main";
    const safeTieKey = String(tieKey || "");
    if (!safeTieKey) throw new Error("تعذر تحديد حالة التعادل.");
    const decisionKey = key || tieBreakDecisionKey(safeScope, safeGroupKey, safeTieKey);
    const existingDecisions = normalizeTieBreakDecisions(competition);
    const nextDecision = {
      key: decisionKey,
      scope: safeScope,
      groupKey: safeGroupKey,
      groupName: groupName || "",
      tieKey: safeTieKey,
      memberOrder: order,
      note: String(note || "").trim(),
      decidedAtText: new Date().toISOString(),
      decidedByMemberId: currentMemberId || "FIFA",
      decidedByName: authProfile?.memberName || authProfile?.username || "FIFA",
    };
    const nextDecisions = [...existingDecisions.filter((item) => item.key !== decisionKey), nextDecision];
    const nextCompetition = { ...competition, tieBreakDecisions: nextDecisions };
    const competitionType = competitionTypeKey(competition.type || "league");
    const leagueGroupsMode = isLeagueGroupsCompetition(nextCompetition);
    const clSingleGroupMode = isChampionsLeagueSingleGroup(nextCompetition);
    const resolvedMatches = competitionType === "world_cup"
      ? resolveWorldCupDependencies(nextCompetition)
      : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode)
        ? resolveChampionsLeagueDependencies(nextCompetition)
        : Array.isArray(nextCompetition.matches)
          ? nextCompetition.matches
          : [];
    const competitionForCalc = { ...nextCompetition, matches: resolvedMatches };
    const isLeagueStyleComp = (competitionType === "league" || competitionType === "mini_league" || clSingleGroupMode) && !leagueGroupsMode;
    const standings = isLeagueStyleComp
      ? computeLeagueStandings(filterCompetitionParticipantsForCalculation(competitionForCalc), filterCompetitionMatchesForCalculation(competitionForCalc))
      : [];
    const qualifiedMemberIds = competitionType === "world_cup"
      ? computeWorldCupQualifiedIds(competitionForCalc)
      : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode)
        ? computeChampionsLeagueQualifiedIds(competitionForCalc)
        : competitionType === "league_qualifier"
          ? computeLeagueQualifierQualifiedIds(competitionForCalc)
          : clSingleGroupMode
            ? []
            : computeKnockoutQualifiedIds(competitionForCalc);
    await updateDoc(doc(db, "competitions", id), {
      tieBreakDecisions: nextDecisions,
      matches: resolvedMatches,
      standings,
      qualifiedMemberIds,
      updatedAt: serverTimestamp(),
      lastTieBreakDecisionAt: serverTimestamp(),
    });
  }


  async function reverseCompetitionRewardTransfersIfNeeded(competitionId, reason = "تصحيح مكافآت بطولة") {
    const id = cleanId(competitionId);
    if (!id) return [];
    const existingRewards = (firebaseMoneyTransfers || []).filter((item) =>
      same(item.relatedCompetitionId, id) &&
      clean(item.source || "") === "competitionreward" &&
      !["reversed", "cancelled"].includes(clean(item.status || "approved")) &&
      clean(item.adminCorrectionStatus || item.reversalStatus || "") !== "reversed"
    );
    const reversalIds = [];
    for (const item of existingRewards) {
      const amount = Math.max(0, toNumber(item.amount));
      const memberId = cleanId(item.toMemberId || "");
      if (!amount || !memberId || same(memberId, "FIFA")) continue;
      const memberName = item.toMemberName || getMemberName(members, memberId) || "";
      const reversalRef = await addDoc(collection(db, "moneyTransfers"), {
        type: "competition_reward_reversal",
        typeLabel: "تصحيح مكافأة بطولة",
        status: "approved",
        fromMemberId: memberId,
        fromMemberName: memberName,
        toMemberId: "FIFA",
        toMemberName: "FIFA",
        amount,
        note: reason,
        source: "competition_reward_correction",
        relatedCompetitionId: id,
        relatedOriginalMoneyTransferId: item.id,
        approvedBy: authUser?.uid || "",
        createdBy: authUser?.uid || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      reversalIds.push(reversalRef.id);
      await updateDoc(doc(db, "moneyTransfers", item.id), {
        adminCorrectionStatus: "reversed",
        reversalStatus: "reversed",
        reversedAt: serverTimestamp(),
        reversalTransferId: reversalRef.id,
        correctionReason: reason,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: "competition_reward_correction",
        title: "تصحيح مكافأة بطولة",
        body: "تم تصحيح مكافأة بطولة سابقة بقيمة " + formatMoney(amount) + " بسبب تعديل نتائج البطولة.",
        status: "unread",
        audience: "member",
        toMemberId: memberId,
        toMemberName: memberName,
        fromMemberId: "FIFA",
        fromMemberName: "FIFA",
        source: "competition_reward_correction",
        relatedCompetitionId: id,
        relatedMoneyTransferId: reversalRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return reversalIds;
  }

  async function finalizeFifaLeagueCompetition({ competitionId, relegatedMemberIds = [], absentMemberIds = [] }) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const competition = firebaseCompetitions.find((item) => same(item.id, competitionId));
    if (!competition) throw new Error("البطولة غير موجودة.");
    const competitionType = competitionTypeKey(competition.type || "league");
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const clSingleGroupMode = isChampionsLeagueSingleGroup(competition);
    if (!["league", "league_qualifier", "cup", "super_cup", "world_cup", "champions_league", "mini_league"].includes(competitionType)) throw new Error("هذه العملية مخصصة للبطولات التنافسية المدعومة فقط.");
    if (clean(competition.status || "active") === "cancelled") throw new Error("لا يمكن اعتماد بطولة ملغاة.");
    const participants = Array.isArray(competition.participants) ? competition.participants : [];
    const matches = competitionType === "world_cup" ? resolveWorldCupDependencies(competition) : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) ? resolveChampionsLeagueDependencies(competition) : (Array.isArray(competition.matches) ? competition.matches : []);
    const isLeagueStyleComp = (competitionType === "league" || competitionType === "mini_league" || clSingleGroupMode) && !leagueGroupsMode;
    const standings = isLeagueStyleComp ? computeLeagueStandings(filterCompetitionParticipantsForCalculation({ ...competition, participants, matches }), filterCompetitionMatchesForCalculation({ ...competition, participants, matches })) : [];
    const champion = isLeagueStyleComp ? standings[0] || null : competitionType === "league_qualifier" ? null : getKnockoutChampion({ ...competition, matches });
    const relegated = (Array.isArray(relegatedMemberIds) ? relegatedMemberIds : []).map(cleanId).filter(Boolean);
    const absent = (Array.isArray(absentMemberIds) ? absentMemberIds : []).map(cleanId).filter(Boolean);
    const qualifiedMemberIds = competitionType === "league_qualifier" ? computeLeagueQualifierQualifiedIds({ ...competition, matches }) : competitionType === "world_cup" ? computeWorldCupQualifiedIds({ ...competition, matches }) : ((competitionType === "champions_league" && !clSingleGroupMode) || leagueGroupsMode) ? computeChampionsLeagueQualifiedIds({ ...competition, matches }) : [];
    const todayDate = new Date().toISOString().slice(0, 10);
    const typeLabel = competitionTypeLabel(competitionType);

    await updateDoc(doc(db, "competitions", competitionId), {
      status: "completed",
      standings,
      championMemberId: champion?.memberId || "",
      championMemberName: champion?.memberName || "",
      relegatedMemberIds: isLeagueStyleComp ? relegated : [],
      absentMemberIds: absent,
      qualifiedMemberIds,
      completedAt: serverTimestamp(),
      completedDate: todayDate,
      rewardsNeedReview: false,
      updatedAt: serverTimestamp(),
    });

    const rewards = normalizeCompetitionRewards(competition.rewards || {});
    const rewardRows = isLeagueStyleComp
      ? standings.slice(0, 4).map((row, index) => ({ ...row, rank: index + 1 }))
      : (["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) || leagueGroupsMode)
        ? getKnockoutRewardRows({ ...competition, matches })
        : [];
    const shouldPayRewards = (competition.autoPayRewards === true || clean(competition.autoPayRewards) === "true") && rewardRows.length > 0;
    const reversedRewardTransferIds = ["cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) && shouldPayRewards
      ? await reverseCompetitionRewardTransfersIfNeeded(competitionId, "تصحيح مكافآت البطولة بعد تعديل النتائج")
      : [];
    const paidRewardTransfers = [];
    if (shouldPayRewards) {
      const rewardLimit = competitionType === "super_cup" ? 2 : 4;
      for (let index = 0; index < Math.min(rewardLimit, rewardRows.length); index += 1) {
        const row = rewardRows[index];
        const rank = row.rank || index + 1;
        const amount = rewards[["first", "second", "third", "fourth"][rank - 1]] || 0;
        if (!amount || !row?.memberId) continue;
        const transferRef = await addDoc(collection(db, "moneyTransfers"), {
          type: "admin_reward",
          typeLabel: "مكافأة " + rewardRankLabel(rank),
          status: "approved",
          fromMemberId: "FIFA",
          fromMemberName: "FIFA",
          toMemberId: row.memberId,
          toMemberName: row.memberName || "",
          amount,
          note: "مكافأة " + rewardRankLabel(rank) + " في " + (competition.name || typeLabel),
          source: "competition_reward",
          relatedCompetitionId: competitionId,
          approvedBy: authUser?.uid || "",
          createdBy: authUser?.uid || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        paidRewardTransfers.push(transferRef.id);
        await addDoc(collection(db, "notifications"), {
          type: "competition_reward",
          title: "مكافأة بطولة",
          body: "تمت إضافة " + formatMoney(amount) + " إلى حسابك عن " + rewardRankLabel(rank) + " في " + (competition.name || typeLabel) + ".",
          status: "unread",
          audience: "member",
          toMemberId: row.memberId,
          toMemberName: row.memberName || "",
          fromMemberId: "FIFA",
          fromMemberName: "FIFA",
          source: "competition_reward",
          relatedCompetitionId: competitionId,
          clickUrl: "/?fgPage=season&fgCompetitionId=" + encodeURIComponent(competitionId),
          relatedMoneyTransferId: transferRef.id,
          createdBy: authUser?.uid || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    const absentText = absent.length ? " الغائبون: " + absent.map((id) => getMemberName(members, id) || id).join("، ") + "." : "";
    const relegatedText = isLeagueStyleComp && relegated.length ? " الهابطون: " + relegated.map((id) => standings.find((row) => same(row.memberId, id))?.memberName || getMemberName(members, id) || id).join("، ") + "." : "";
    const qualifiedText = competitionType === "league_qualifier" && qualifiedMemberIds.length ? " المتأهلون إلى الدوري: " + qualifiedMemberIds.map((id) => getMemberName(members, id) || id).join("، ") + "." : "";

    await addDoc(collection(db, "adminDecisions"), {
      type: competitionType === "league_qualifier" ? "league_qualifier_completed" : competitionType === "cup" ? "cup_completed" : competitionType === "super_cup" ? "super_cup_completed" : competitionType === "world_cup" ? "world_cup_completed" : competitionType === "champions_league" ? "champions_league_completed" : competitionType === "mini_league" ? "mini_league_completed" : "league_completed",
      status: "completed",
      title: competitionType === "league_qualifier" ? "اعتماد ملحق دوري" : competitionType === "cup" ? "اعتماد بطولة الكأس" : competitionType === "super_cup" ? "اعتماد كأس السوبر" : competitionType === "world_cup" ? "اعتماد كأس العالم" : competitionType === "champions_league" ? "اعتماد دوري الأبطال" : competitionType === "mini_league" ? "اعتماد دوري المجموعة" : "إغلاق دوري",
      body: "تم اعتماد " + (competition.name || typeLabel) + (champion?.memberName ? "، والبطل هو " + champion.memberName + "." : ".") + relegatedText + absentText + qualifiedText,
      competitionId,
      competitionName: competition.name || "",
      competitionType,
      championMemberId: champion?.memberId || "",
      championMemberName: champion?.memberName || "",
      relegatedMemberIds: relegated,
      absentMemberIds: absent,
      qualifiedMemberIds,
      rewards,
      autoPaidRewards: shouldPayRewards,
      paidRewardTransferIds: paidRewardTransfers,
      reversedRewardTransferIds,
      rewardsNeedReview: false,
      seasonId: competition.seasonId || activeSeasonId,
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: todayDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: competitionType === "league_qualifier" ? "league_qualifier_completed" : competitionType === "cup" ? "cup_completed" : competitionType === "super_cup" ? "super_cup_completed" : competitionType === "world_cup" ? "world_cup_completed" : competitionType === "champions_league" ? "champions_league_completed" : "league_completed",
      title: competitionType === "league_qualifier" ? "تم اعتماد ملحق الدوري" : competitionType === "cup" ? "تم اعتماد بطولة الكأس" : competitionType === "super_cup" ? "تم اعتماد كأس السوبر" : competitionType === "world_cup" ? "تم اعتماد كأس العالم" : competitionType === "champions_league" ? "تم اعتماد دوري الأبطال" : "تم اعتماد نتيجة الدوري",
      body: "تم اعتماد " + (competition.name || typeLabel) + (champion?.memberName ? "، والبطل هو " + champion.memberName + "." : ".") + relegatedText + absentText + qualifiedText,
      status: "unread",
      audience: "all",
      fromMemberId: "FIFA",
      fromMemberName: "FIFA",
      source: "fifa_admin_competitions",
      relatedCompetitionId: competitionId,
      clickUrl: "/?fgPage=season&fgCompetitionId=" + encodeURIComponent(competitionId),
      createdBy: authUser?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function cancelFifaCompetition({ competitionId, reason = "" }) {
    if (!isFifaAdmin) throw new Error("هذه الصلاحية مخصصة لحساب FIFA فقط.");
    const competition = firebaseCompetitions.find((item) => same(item.id, competitionId));
    if (!competition) throw new Error("البطولة غير موجودة.");
    if (clean(competition.status || "active") === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(competitionTypeKey(competition.type || "league"))) throw new Error("لا يمكن إلغاء بطولة معتمدة. استخدم سجل قرارات FIFA للتصحيح لاحقًا.");
    if (clean(competition.status || "active") === "cancelled") throw new Error("هذه البطولة ملغاة بالفعل.");
    const body = "تم إلغاء " + (competition.name || "البطولة") + (reason ? " - السبب: " + reason : " بقرار FIFA.");
    await deleteDoc(doc(db, "competitions", competitionId));
    await addDoc(collection(db, "adminDecisions"), {
      type: "competition_cancelled",
      status: "cancelled",
      title: "إلغاء بطولة",
      body,
      competitionId,
      competitionName: competition.name || "",
      competitionType: competition.type || "league",
      reason: reason || "إلغاء إداري من FIFA",
      createdBy: authUser?.uid || "",
      createdByMemberId: currentMemberId || "FIFA",
      createdByName: authProfile?.memberName || authProfile?.username || "FIFA",
      date: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }


  function getActivePlayerContract(playerId) {
    const id = cleanId(playerId);
    if (!id) return null;
    return activePlayerContracts.find((contract) => same(contract.playerId, id)) || null;
  }

  function getPlayerBaseOwnerId(playerOrId) {
    const playerId = typeof playerOrId === "object" ? getPlayerStableId(playerOrId) : cleanId(playerOrId);
    const playerRow = typeof playerOrId === "object" ? playerOrId : players.find((item) => same(getPlayerStableId(item), playerId));
    const activeContract = getActivePlayerContract(playerId);
    return cleanId(activeContract?.baseOwnerMemberId || activeContract?.baseOwnerId || activeContract?.originalBaseOwnerMemberId || activeContract?.originalOwnerMemberId || playerRow?.memberid || playerRow?.memberId || playerRow?.member_id || "");
  }

  function getRosterPlayerKind(player, memberId) {
    const playerId = getPlayerStableId(player);
    const activeContract = getActivePlayerContract(playerId);
    return getRosterPlayerKindFromContract(player, activeContract, memberId);
  }

  function isProRosterKind(kind) {
    return kind === "pro_owned" || kind === "pro_loan";
  }

  function countMemberProPlayers(memberId) {
    const id = cleanId(memberId);
    if (!id) return 0;
    const uniqueProPlayerIds = new Set();
    getVisiblePlayersForMember(id).forEach((player) => {
      const playerId = cleanId(getPlayerStableId(player));
      if (!playerId || uniqueProPlayerIds.has(playerId)) return;
      const kind = getRosterPlayerKind(player, id);
      if (isProRosterKind(kind)) uniqueProPlayerIds.add(playerId);
    });
    return uniqueProPlayerIds.size;
  }

  function getOfferProjectedProDeltas(offer) {
    const buyerId = cleanId(offer?.fromMemberId);
    const sellerId = cleanId(offer?.toMemberId);
    const targetPlayerId = cleanId(offer?.targetPlayerId || offer?.playerId);
    const contractType = clean(offer?.type) === "loan" ? "loan" : "buy";
    const targetPlayerRow = players.find((player) => same(getPlayerStableId(player), targetPlayerId)) || {};
    const previousActiveContract = getActivePlayerContract(targetPlayerId);
    const baseOwnerId = cleanId(
      previousActiveContract?.baseOwnerMemberId ||
        previousActiveContract?.baseOwnerId ||
        previousActiveContract?.originalBaseOwnerMemberId ||
        previousActiveContract?.originalOwnerMemberId ||
        targetPlayerRow?.memberid ||
        sellerId
    );
    const targetFreeOrigin = isFreeOriginContract(previousActiveContract);
    const targetFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(previousActiveContract, targetFreeOrigin ? baseOwnerId || sellerId : "");

    const targetRosterKindForSeller = getRosterPlayerKindFromContract(targetPlayerRow, previousActiveContract, sellerId);
    const targetProLeavingSeller = isProRosterKind(targetRosterKindForSeller) ? 1 : 0;
    const targetProEnteringBuyer = (() => {
      if (contractType === "loan") return same(baseOwnerId, buyerId) ? 0 : 1;
      if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, buyerId)) return 0;
      return baseOwnerId && !same(baseOwnerId, buyerId) ? 1 : 0;
    })();

    let offeredProLeavingBuyer = 0;
    let offeredProEnteringSeller = 0;
    const seenOfferedIds = new Set();
    (Array.isArray(offer?.offeredPlayers) ? offer.offeredPlayers : []).forEach((item) => {
      const playerId = cleanId(item.playerId || item.playerid || item.id);
      if (!playerId || seenOfferedIds.has(playerId)) return;
      seenOfferedIds.add(playerId);
      const row = players.find((player) => same(getPlayerStableId(player), playerId)) || {};
      const activeContract = getActivePlayerContract(playerId);
      const swapBaseOwnerId = cleanId(activeContract?.baseOwnerMemberId || activeContract?.baseOwnerId || activeContract?.originalBaseOwnerMemberId || activeContract?.originalOwnerMemberId || row?.memberid || buyerId);
      const swapFreeOrigin = isFreeOriginContract(activeContract);
      const swapFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(activeContract, swapFreeOrigin ? swapBaseOwnerId || buyerId : "");
      const currentKindForBuyer = getRosterPlayerKindFromContract(row, activeContract, buyerId);
      if (isProRosterKind(currentKindForBuyer)) offeredProLeavingBuyer += 1;
      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, sellerId)) return;
      if (swapBaseOwnerId && !same(swapBaseOwnerId, sellerId)) offeredProEnteringSeller += 1;
    });

    return {
      buyerId,
      sellerId,
      buyerDelta: targetProEnteringBuyer - offeredProLeavingBuyer,
      sellerDelta: offeredProEnteringSeller - targetProLeavingSeller,
      buyerEntering: targetProEnteringBuyer,
      sellerEntering: offeredProEnteringSeller,
    };
  }

  function getPendingAcceptedProDeltaForMember(memberId, excludedOfferId = "") {
    const id = cleanId(memberId);
    if (!id) return 0;
    return (firebasePlayerOffers || []).reduce((sum, offer) => {
      if (same(offer.id, excludedOfferId)) return sum;
      if (clean(offer.status || "") !== "approvedpendingwindow") return sum;
      const deltas = getOfferProjectedProDeltas(offer);
      if (same(deltas.buyerId, id)) return sum + deltas.buyerDelta;
      if (same(deltas.sellerId, id)) return sum + deltas.sellerDelta;
      return sum;
    }, 0);
  }

  function wouldOfferCreateProPlayer(targetPlayerId, buyerId) {
    const baseOwnerId = getPlayerBaseOwnerId(targetPlayerId);
    if (!baseOwnerId) return false;
    return !same(baseOwnerId, buyerId);
  }

  function isPlayerLockedByContract(playerId, requestedType = "") {
    const activeContract = getActivePlayerContract(playerId);
    if (!activeContract) return false;
    const contractType = clean(activeContract.contractType || "");
    if (contractType === "released") return true;
    if (contractType === "loan") {
      if (clean(requestedType) === "loan") return false;
      return true;
    }
    return false;
  }

  function isPlayerReleased(playerId) {
    return isPlayerReleasedByContracts(activePlayerContracts, playerId);
  }

  function hasFreeAgentRegistration(playerId, memberId) {
    const id = cleanId(playerId);
    const ownerId = cleanId(memberId);
    if (!id || !ownerId) return false;
    return firebaseFreeAgentRegistrations.some((item) =>
      same(item.playerId, id) &&
      same(item.memberId || item.toMemberId || item.currentMemberId, ownerId) &&
      !["cancelled", "reversed"].includes(clean(item.status || "completed"))
    );
  }

  function getFreePlayerStatusForMember(memberId) {
    const id = cleanId(memberId);
    if (!id) return null;
    return firebaseFreePlayerStatus.find((item) => same(item.memberId || item.id, id)) || null;
  }

  function getActiveFreeAgentContractForMember(memberId) {
    const id = cleanId(memberId);
    if (!id) return null;
    return activePlayerContracts.find((contract) =>
      same(contract.currentMemberId, id) &&
      isFreeOriginContract(contract) &&
      same(getFreeAgentSlotOwnerIdFromContract(contract, contract.originalOwnerMemberId || contract.ownerMemberId || id), id) &&
      clean(contract.contractType || "owned") === "owned"
    ) || null;
  }

  function getPendingFreeAgentQueueForMember(memberId) {
    const id = cleanId(memberId);
    if (!id) return null;
    return firebaseFreeAgentQueue.find((item) =>
      same(item.memberId, id) && ["pending_window", "processing"].includes(clean(item.status || "pending_window"))
    ) || null;
  }

  function isFreeAgentUnavailable(playerId, exceptQueueId = "") {
    const id = cleanId(playerId);
    if (!id) return true;
    const hasContract = activePlayerContracts.some((contract) =>
      same(contract.playerId, id) &&
      clean(contract.status || "active") === "active" &&
      !isFreeAgentPoolContract(contract)
    );
    if (hasContract) return true;
    return firebaseFreeAgentQueue.some((item) =>
      !same(item.id, exceptQueueId) &&
      same(item.newPlayerId, id) && ["pending_window", "processing"].includes(clean(item.status || "pending_window"))
    );
  }

  function getVisiblePlayersForMember(memberId, sourceRows = players) {
    const id = cleanId(memberId);
    if (!id) return [];
    return (sourceRows || []).filter((player) => {
      const playerId = getPlayerStableId(player);
      if (isPlayerReleased(playerId)) return false;
      const activeContract = getActivePlayerContract(playerId);
      const contractType = clean(activeContract?.contractType || "");
      if (activeContract && contractType !== "released") {
        return same(activeContract.currentMemberId, id);
      }
      return same(player.memberid, id);
    });
  }

  async function deactivateOfferNotifications(offerId, reason = "updated") {
    const id = cleanId(offerId);
    if (!id) return;
    const relatedRows = firebaseNotifications.filter((item) =>
      same(item.relatedOfferId, id) && !item.navigationDisabled
    );
    await Promise.allSettled(
      relatedRows.map((item) =>
        updateDoc(doc(db, "notifications", item.id), {
          navigationDisabled: true,
          disabledReason: reason,
          status: "read",
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      )
    );
  }


  const selectedMember = selectedId
    ? members.find((member) => same(member.id, selectedId))
    : null;
  const selectedMemberId = cleanId(selectedMember?.id);

  const memberPlayers = useMemo(() => {
    const q = clean(search);
    return getVisiblePlayersForMember(selectedMemberId)
      .filter((player) => {
        if (!q) return true;
        const kindLabel = getPlayerRosterKindLabel(player, activePlayerContracts, selectedMemberId);
        return clean([
          player.name,
          player.position,
          player.team,
          player.rating,
          kindLabel,
          kindLabel.replace("لاعب ", ""),
        ].join(" ")).includes(q);
      })
      .sort((a, b) => toNumber(b.rating) - toNumber(a.rating));
  }, [players, selectedMemberId, search, activePlayerContracts]);

  const memberFinance = useMemo(
    () => getMemberFinanceRows(combinedFinance, selectedMemberId),
    [combinedFinance, selectedMemberId]
  );
  const selectedMemberBalance = useMemo(
    () => computeMemberBalance(memberFinance, selectedMember?.balance, selectedMemberId),
    [memberFinance, selectedMember?.balance, selectedMemberId]
  );
  const memberTrophyGroups = useMemo(
    () => groupMemberTrophies(allTournaments, selectedMemberId, trophyMap),
    [allTournaments, selectedMemberId, trophyMap]
  );
  const selectedMemberStats =
    finalStatsByMember[cleanId(selectedMemberId)] ||
    emptyMemberStats(selectedMemberId);
  const seasonGroups = useMemo(
    () => groupByTrophy(activeSeasonRows, trophyMap),
    [activeSeasonRows, trophyMap]
  );
  const archiveSeasons = useMemo(
    () => buildArchiveSeasons(seasons, allTournaments, trophyMap),
    [seasons, allTournaments, trophyMap]
  );
  const seasonRanking = useMemo(
    () => computeSeasonPointsRanking({
      members: activeMembers,
      competitions: firebaseCompetitions,
      sheetSeasonRows: activeSeasonRows,
      activeSeasonId,
      pointsRules,
      competitionPriority,
    }),
    [activeMembers, firebaseCompetitions, activeSeasonRows, activeSeasonId, pointsRules, competitionPriority]
  );
  const firebaseTransferRows = useMemo(
    () => normalizeFirebaseTransferRows(firebaseTransferHistory),
    [firebaseTransferHistory]
  );
  const transferPeriods = useMemo(
    () => mergeTransferPeriods(getTransferPeriods(transfers), getTransferPeriods(firebaseTransferRows)),
    [transfers, firebaseTransferRows]
  );
  const activeTransferPeriod =
    transferPeriods.find((period) => same(period.id, transferPeriod)) ||
    transferPeriods[0];
  const currentTransfers = activeTransferPeriod?.rows || [];

  useEffect(() => {
    if (!authUser || !transferMarketOpen) return;
    const pendingItems = firebaseFreeAgentQueue.filter((item) =>
      clean(item.status || "pending_window") === "pending_window"
    );
    if (!pendingItems.length) return;
    pendingItems.forEach((item) => {
      executeFreeAgentQueueItem(item).catch((err) => {
        console.error("Free agent queue execution failed:", err);
      });
    });
  }, [authUser, transferMarketOpen, firebaseFreeAgentQueue, activePlayerContracts, players, combinedFinance]);

  const headerCoverImage = normalizeImageUrl(config.headerImage);
  const appIconImage = normalizeImageUrl(config.appIcon);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (pendingScrollRef.current !== null) {
        const nextTop = pendingScrollRef.current;
        pendingScrollRef.current = null;
        scrollAppTo(nextTop, "auto");
        return;
      }
      scrollAppToTop("auto");
    });
  }, [page, selectedMemberId]);

  function getCurrentScrollTop() {
    const appNode = document.querySelector(".app");
    return appNode ? appNode.scrollTop : window.scrollY || 0;
  }

  function restoreScrollPosition(top) {
    const safeTop = Math.max(0, Number(top) || 0);
    // Store target — useLayoutEffect will apply it before the next paint (no flicker)
    pendingScrollRef.current = safeTop;
    restoringScrollRef.current = true;
  }

  // Apply scroll restoration synchronously before browser paint — eliminates the "shake"
  useLayoutEffect(() => {
    if (pendingScrollRef.current === null) return;
    const safeTop = pendingScrollRef.current;
    pendingScrollRef.current = null;
    const appNode = document.querySelector(".app");
    if (appNode) {
      appNode.style.scrollBehavior = "auto";
      appNode.scrollTop = safeTop;
      appNode.style.scrollBehavior = "";
    } else {
      window.scrollTo(0, safeTop);
    }
    restoringScrollRef.current = false;
  });

  function openView(view) {
    const currentScrollTop = getCurrentScrollTop();
    try {
      window.history.pushState({ fifaGroupDetail: true }, "");
    } catch {}
    if (detailView) {
      setDetailStack((stack) => [
        ...stack,
        { view: detailView, scrollTop: currentScrollTop },
      ]);
    } else {
      baseScrollRef.current = currentScrollTop;
      setDetailStack([]);
    }
    setDetailView(view);
    setInfoModal(null);
    setMenuOpen(false);
    requestAnimationFrame(() => scrollAppToTop("auto"));
  }

  function closeView() {
    if (detailStack.length) {
      const previousEntry = detailStack[detailStack.length - 1];
      setDetailStack((stack) => stack.slice(0, -1));
      setDetailView(previousEntry.view);
      restoreScrollPosition(previousEntry.scrollTop);
    } else {
      setDetailView(null);
      restoreScrollPosition(baseScrollRef.current || 0);
    }
  }

  useEffect(() => {
    function setStableBounds() {
      const root = document.documentElement;
      const narrow = window.innerWidth <= 380;
      root.style.setProperty("--fg-top-bound", narrow ? "40px" : "44px");
      root.style.setProperty("--fg-bottom-bound", narrow ? "88px" : "92px");
      root.style.setProperty("--fg-nav-bottom", "10px");
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.background = "#020617";
    }

    setStableBounds();
    window.addEventListener("orientationchange", setStableBounds);
    return () =>
      window.removeEventListener("orientationchange", setStableBounds);
  }, []);

  function scrollAppTo(top = 0, behavior = "auto") {
    const safeTop = Math.max(0, Number(top) || 0);
    const appNode = document.querySelector(".app");

    if (appNode) {
      if (behavior === "smooth") {
        appNode.scrollTo({ top: safeTop, behavior });
      } else {
        appNode.style.scrollBehavior = "auto";
        appNode.scrollTop = safeTop;
        requestAnimationFrame(() => {
          appNode.style.scrollBehavior = "";
        });
      }
      return;
    }

    window.scrollTo({ top: safeTop, behavior });
  }

  function scrollAppToTop(behavior = "auto") {
    scrollAppTo(0, behavior);
  }

  function goPage(nextPage, options = {}) {
    // Save current page to history stack for proper back navigation
    if (!options.isBack && page !== nextPage) {
      const entry = {
        page,
        scrollTop: getCurrentScrollTop(),
        selectedId,
        memberTab,
        search,
        focusedCompetitionId,
        seasonHubTab,
      };
      pageHistoryRef.current = [...pageHistoryRef.current.slice(-29), entry];
      try { window.history.pushState({ fifaGroupPage: true }, ""); } catch {}
    }

    memberReturnRef.current = null;
    if (nextPage === "season" && !options.preserveSeasonTab) setSeasonHubTab(options.seasonTab || "members");
    setPage(nextPage);
    if (options.clearFocusedCompetition) setFocusedCompetitionId("");
    setSelectedId("");
    setMemberTab("players");
    setSearch("");
    setMenuOpen(false);
    setDetailView(null);
    setDetailStack([]);
    setInfoModal(null);

    if (!options.isBack) {
      requestAnimationFrame(() => { scrollAppToTop("auto"); });
    }
  }

  function openPublicMemberProfile(memberId, tabId = "players") {
    const id = cleanId(memberId || "");
    if (!id) return;
    if (currentMemberId && same(id, currentMemberId)) {
      goPage("myProfile");
      return;
    }

    memberReturnRef.current = {
      page,
      selectedId,
      memberTab,
      search,
      focusedCompetitionId,
      scrollTop: getCurrentScrollTop(),
    };

    try { window.history.pushState({ fifaGroupProfile: true }, ""); } catch {}

    setPage("members");
    setSelectedId(id);
    setMemberTab(tabId || "players");
    setSearch("");
    setMenuOpen(false);
    setDetailView(null);
    setDetailStack([]);
    setInfoModal(null);
    requestAnimationFrame(() => {
      scrollAppToTop("auto");
    });
  }

  function closePublicMemberProfile() {
    const previous = memberReturnRef.current || {};
    memberReturnRef.current = null;

    setPage(previous.page || "home");
    setSelectedId(previous.selectedId || "");
    setMemberTab(previous.memberTab || "players");
    setSearch(previous.search || "");
    setFocusedCompetitionId(previous.focusedCompetitionId || "");
    setDetailView(null);
    setDetailStack([]);
    setInfoModal(null);
    setMenuOpen(false);
    restoreScrollPosition(previous.scrollTop || 0);
  }

  async function createMoneyTransfer({ toMemberId, amount, note }) {
    const fromMemberId = cleanId(currentMemberId);
    const receiverId = cleanId(toMemberId);
    const numericAmount = parseFinanceAmount(amount);

    if (!authUser || !fromMemberId) throw new Error("لم يتم ربط الحساب بعضو بعد.");
    if (!receiverId) throw new Error("اختر العضو المستقبل.");
    if (same(fromMemberId, receiverId)) throw new Error("لا يمكن التحويل لنفس العضو.");
    if (!numericAmount || numericAmount <= 0) throw new Error("أدخل مبلغًا صحيحًا أكبر من صفر.");
    if (numericAmount > currentMemberBalance) throw new Error("الرصيد غير كافٍ لإتمام التحويل.");

    const receiver = getActiveMembers(members).find((member) => same(member.id, receiverId));
    if (!receiver) throw new Error("العضو المستقبل غير موجود ضمن أعضاء الموسم الحالي النشط.");

    const transferRef = await addDoc(collection(db, "moneyTransfers"), {
      fromMemberId,
      fromMemberName: currentMember?.name || authProfile?.memberName || "",
      toMemberId: receiverId,
      toMemberName: receiver.name || "",
      amount: numericAmount,
      type: "transfer",
      status: "approved",
      approvedBy: "system",
      createdBy: authUser.uid,
      username: authProfile?.username || "",
      note: String(note || "").trim() || "تحويل تلقائي من التطبيق",
      date: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await Promise.allSettled([
      addDoc(collection(db, "notifications"), {
        type: "money_transfer_in",
        status: "unread",
        toMemberId: receiverId,
        fromMemberId,
        relatedMoneyTransferId: transferRef.id,
        financeMemberId: receiverId,
        clickUrl: "/?fgPage=finance&fgMemberId=" + encodeURIComponent(receiverId),
        title: "تحويل مالي وارد",
        body: "وصلك تحويل بقيمة " + formatMoney(numericAmount) + " من " + (currentMember?.name || authProfile?.memberName || "عضو") + ".",
        createdAt: serverTimestamp(),
      }),
      addDoc(collection(db, "notifications"), {
        type: "money_transfer_out",
        status: "unread",
        toMemberId: fromMemberId,
        fromMemberId,
        relatedMoneyTransferId: transferRef.id,
        financeMemberId: fromMemberId,
        clickUrl: "/?fgPage=finance&fgMemberId=" + encodeURIComponent(fromMemberId),
        title: "تحويل مالي صادر",
        body: "تم تحويل " + formatMoney(numericAmount) + " إلى " + (receiver.name || "عضو") + ".",
        createdAt: serverTimestamp(),
      }),
    ]);
  }


  async function createPlayerOffer(payload) {
    const fromMemberId = cleanId(currentMemberId);
    const targetMemberId = cleanId(payload?.targetMemberId);
    const targetPlayerId = cleanId(payload?.targetPlayerId);
    const contractType = clean(payload?.contractType) === "loan" ? "loan" : "buy";
    const numericAmount = Math.max(0, parseFinanceAmount(payload?.amount));
    const offeredPlayers = (Array.isArray(payload?.offeredPlayers) ? payload.offeredPlayers : []).map(normalizeOfferExchangeClauseForSave);
    const todayKey = new Date().toISOString().slice(0, 10);
    const expiresAt = addDays(new Date(), PLAYER_OFFER_EXPIRE_DAYS).toISOString();

    if (!authUser || !fromMemberId) throw new Error("لم يتم ربط الحساب بعضو بعد.");
    if (!targetMemberId || !targetPlayerId) throw new Error("بيانات اللاعب غير مكتملة.");
    assertTransferAllowed(fromMemberId, "send_offer");
    const targetReceiveRestriction = getBlockingTransferRestriction(firebaseMemberRestrictions, targetMemberId, "receive_offer");
    if (targetReceiveRestriction) {
      throw new Error("لا يمكنك إرسال العروض لهذا العضو بسبب إيقاف إداري من نظام الانتقالات حتى " + (targetReceiveRestriction.endDate || "نهاية المدة") + (targetReceiveRestriction.reason ? " - السبب: " + targetReceiveRestriction.reason : "."));
    }
    if (offeredPlayers.length) assertTransferAllowed(fromMemberId, "squad_change");
    if (same(fromMemberId, targetMemberId)) throw new Error("لا يمكنك تقديم عرض على لاعب من قائمتك.");
    if (contractType === "loan" && ![2, 4, 6].includes(toNumber(payload?.loanDurationMonths))) {
      throw new Error("اختر مدة عقد الإعارة.");
    }

    const targetMember = members.find((member) => same(member.id, targetMemberId));
    if (!targetMember) throw new Error("العضو صاحب اللاعب غير موجود.");

    const offeredPlayersCount = offeredPlayers.length;
    const targetMemberPlayerCount = getVisiblePlayersForMember(targetMemberId).length;
    const targetMemberCountAfterOffer = targetMemberPlayerCount - 1 + offeredPlayersCount;
    if (targetMemberCountAfterOffer < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تقديم عرض يجعل قائمة صاحب اللاعب أقل من 17 لاعبًا بعد احتساب لاعبي التبادل.");
    }
    if (targetMemberCountAfterOffer > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تقديم عرض يجعل قائمة صاحب اللاعب تتجاوز الحد الأقصى 32 لاعبًا.");
    }

    const fromMemberVisiblePlayers = getVisiblePlayersForMember(fromMemberId);
    const fromMemberPlayerCount = fromMemberVisiblePlayers.length;
    if (offeredPlayersCount > 0 && fromMemberPlayerCount - offeredPlayersCount < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن إدراج لاعبين من قائمتك في الصفقة إذا كان ذلك سيجعل قائمتك أقل من 17 لاعبًا.");
    }
    if (fromMemberPlayerCount - offeredPlayersCount + 1 > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تقديم العرض لأن قائمتك ستتجاوز الحد الأقصى 32 لاعبًا.");
    }

    const fromMemberVisiblePlayerIds = new Set(fromMemberVisiblePlayers.map((player) => cleanId(getPlayerStableId(player))));
    const invalidOfferedPlayer = offeredPlayers.find((item) => !fromMemberVisiblePlayerIds.has(cleanId(item.playerId)));
    if (invalidOfferedPlayer) {
      throw new Error("لا يمكن إدراج لاعب غير موجود في قائمتك الحالية ضمن الصفقة.");
    }
    const duplicateOfferedPlayers = new Set();
    const duplicatedOfferedPlayer = offeredPlayers.find((item) => {
      const playerId = cleanId(item.playerId);
      if (!playerId) return true;
      if (duplicateOfferedPlayers.has(playerId)) return true;
      duplicateOfferedPlayers.add(playerId);
      return false;
    });
    if (duplicatedOfferedPlayer) {
      throw new Error("لا يمكن تكرار نفس اللاعب في صفقة التبادل.");
    }
    const loanedOfferedPlayer = offeredPlayers.find((item) => clean(getActivePlayerContract(item.playerId)?.contractType || "") === "loan");
    if (loanedOfferedPlayer) {
      throw new Error("لا يمكن إدراج لاعب تستعيره حاليًا ضمن بنود التبادل.");
    }

    const activeTargetContract = getActivePlayerContract(targetPlayerId);
    const activeTargetContractType = clean(activeTargetContract?.contractType || "");
    const playerLockedByAcceptedDeal = firebasePlayerOffers.some((offer) =>
      same(offer.targetPlayerId, targetPlayerId) && isAcceptedOrCompletedPlayerOffer(offer)
    );
    if (playerLockedByAcceptedDeal || isPlayerLockedByContract(targetPlayerId, contractType)) {
      throw new Error("لا يمكن تقديم عرض على هذا اللاعب لأنه مرتبط بصفقة أو عقد نشط.");
    }
    if (activeTargetContractType === "loan") {
      if (contractType !== "loan") throw new Error("اللاعب المعار يستقبل عروض إعارة فقط.");
      const requiredLoanMonths = toNumber(activeTargetContract.loanDurationMonths);
      if (requiredLoanMonths && toNumber(payload?.loanDurationMonths) !== requiredLoanMonths) {
        throw new Error("مدة إعادة الإعارة يجب أن تطابق مدة عقد الإعارة الأصلي.");
      }
    }

    const createsProPlayer = wouldOfferCreateProPlayer(targetPlayerId, fromMemberId);
    const offeredProLeavingCount = offeredPlayers.reduce((sum, item) => {
      const row = fromMemberVisiblePlayers.find((player) => same(getPlayerStableId(player), item.playerId));
      const kind = row ? getRosterPlayerKind(row, fromMemberId) : "base";
      return sum + (kind === "pro_owned" || kind === "pro_loan" ? 1 : 0);
    }, 0);
    const proCount = countMemberProPlayers(fromMemberId);
    // الحد الأقصى للمحترفين يُحسب من القائمة الفعلية الحالية فقط.
    // لا نضيف عروضًا قديمة/معلقة هنا حتى لا يبقى لاعب خرج من القائمة محسوبًا ضمن حد 5 محترفين.
    if (proLimitExceeded(proCount - offeredProLeavingCount + (createsProPlayer ? 1 : 0))) {
      throw new Error("لا يمكنك إتمام الصفقة، ستتجاوز الحد الأقصى للمحترفين (" + maxProfessionalPlayersLabel + ") حسب قائمتك الحالية.");
    }

    const alreadyBlocking = firebasePlayerOffers.some((offer) =>
      same(offer.fromMemberId, fromMemberId) &&
      same(offer.targetPlayerId, targetPlayerId) &&
      isBlockingOwnPlayerOfferStillValid(offer)
    );
    if (alreadyBlocking) throw new Error("لديك عرض نشط أو مقبول سابق على نفس اللاعب.");

    const todayOffersCount = firebasePlayerOffers.filter((offer) =>
      same(offer.fromMemberId, fromMemberId) && String(offer.dateKey || "") === todayKey
    ).length;
    if (todayOffersCount >= MAX_DAILY_PLAYER_OFFERS) {
      throw new Error("وصلت للحد اليومي للعروض (" + MAX_DAILY_PLAYER_OFFERS + ").");
    }

    const neededNow = numericAmount + OFFER_FEE;
    if (neededNow > currentMemberAvailableBalance) {
      throw new Error("الرصيد المتاح لا يكفي لقيمة العرض مع رسوم التقديم.");
    }

    const offerRef = await addDoc(collection(db, "playerOffers"), {
      type: contractType,
      typeLabel: contractType === "loan" ? "عقد إعارة" : "عقد شراء",
      status: "pending",
      version: 1,
      editCount: 0,
      maxEdits: 1,
      fromMemberId,
      fromMemberName: currentMember?.name || authProfile?.memberName || "",
      toMemberId: targetMemberId,
      toMemberName: targetMember.name || "",
      targetPlayerId,
      targetPlayerName: payload?.targetPlayerName || "",
      targetPlayerImage: payload?.targetPlayerImage || "",
      targetPlayerPosition: payload?.targetPlayerPosition || "",
      targetPlayerRating: payload?.targetPlayerRating || "",
      amount: numericAmount,
      reservedAmount: numericAmount,
      offeredPlayers,
      loanDurationMonths: contractType === "loan" ? toNumber(payload?.loanDurationMonths) : null,
      notes: String(payload?.notes || "").trim(),
      feeAmount: OFFER_FEE,
      expiresAt,
      dateKey: todayKey,
      createdBy: authUser.uid,
      username: authProfile?.username || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addOfferFee({
      fromMemberId,
      relatedOfferId: offerRef.id,
      note: "رسوم تقديم عرض على اللاعب " + (payload?.targetPlayerName || ""),
      type: "offer_fee",
      dateKey: todayKey,
    });

    await addDoc(collection(db, "notifications"), {
      type: "player_offer",
      status: "unread",
      toMemberId: targetMemberId,
      fromMemberId,
      relatedOfferId: offerRef.id,
      targetPlayerId,
      targetMemberId,
      offerVersion: 1,
      targetStatus: "pending",
      navigationDisabled: false,
      title: "عرض انتقال جديد",
      body: (currentMember?.name || "عضو") + " قدم عرض " + (contractType === "loan" ? "عقد إعارة" : "عقد شراء") + " للاعب " + (payload?.targetPlayerName || "") + ".",
      createdAt: serverTimestamp(),
    });
  }

  async function updatePlayerOffer(offerId, payload) {
    const fromMemberId = cleanId(currentMemberId);
    const existing = firebasePlayerOffers.find((offer) => same(offer.id, offerId));
    if (!existing) throw new Error("العرض غير موجود.");
    if (!same(existing.fromMemberId, fromMemberId)) throw new Error("لا يمكنك تعديل عرض لا يخصك.");
    if (!isActivePlayerOfferStatus(existing.status) || isOfferExpired(existing)) throw new Error("لا يمكن تعديل هذا العرض.");
    if (toNumber(existing.editCount) >= toNumber(existing.maxEdits || 1)) throw new Error("تم استنفاد تعديل هذا العرض.");
    const playerLockedByOtherAcceptedDeal = firebasePlayerOffers.some((offer) =>
      !same(offer.id, existing.id) && same(offer.targetPlayerId, existing.targetPlayerId) && isAcceptedOrCompletedPlayerOffer(offer)
    );
    if (playerLockedByOtherAcceptedDeal || isPlayerLockedByContract(existing.targetPlayerId, payload?.contractType)) {
      throw new Error("لا يمكن تعديل العرض لأن اللاعب أصبح مرتبطًا بعقد نشط.");
    }

    const contractType = clean(payload?.contractType) === "loan" ? "loan" : "buy";
    assertTransferAllowed(fromMemberId, "send_offer");
    const existingTargetReceiveRestriction = getBlockingTransferRestriction(firebaseMemberRestrictions, existing.toMemberId, "receive_offer");
    if (existingTargetReceiveRestriction) {
      throw new Error("لا يمكنك إرسال العروض لهذا العضو بسبب إيقاف إداري من نظام الانتقالات حتى " + (existingTargetReceiveRestriction.endDate || "نهاية المدة") + (existingTargetReceiveRestriction.reason ? " - السبب: " + existingTargetReceiveRestriction.reason : "."));
    }
    const numericAmount = Math.max(0, parseFinanceAmount(payload?.amount));
    const offeredPlayers = (Array.isArray(payload?.offeredPlayers) ? payload.offeredPlayers : []).map(normalizeOfferExchangeClauseForSave);
    if (offeredPlayers.length) assertTransferAllowed(fromMemberId, "squad_change");
    const previousReserved = Math.max(0, toNumber(existing.reservedAmount ?? existing.amount));
    const availableForEdit = currentMemberAvailableBalance + previousReserved;

    const offeredPlayersCount = offeredPlayers.length;
    const targetMemberPlayerCount = getVisiblePlayersForMember(existing.toMemberId).length;
    const targetMemberCountAfterOffer = targetMemberPlayerCount - 1 + offeredPlayersCount;
    if (targetMemberCountAfterOffer < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تعديل العرض لأنه سيجعل قائمة صاحب اللاعب أقل من 17 لاعبًا بعد احتساب التبادل.");
    }
    if (targetMemberCountAfterOffer > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تعديل العرض لأنه سيجعل قائمة صاحب اللاعب تتجاوز الحد الأقصى 32 لاعبًا.");
    }

    const fromMemberVisiblePlayers = getVisiblePlayersForMember(fromMemberId);
    const fromMemberPlayerCount = fromMemberVisiblePlayers.length;
    if (offeredPlayersCount > 0 && fromMemberPlayerCount - offeredPlayersCount < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن إدراج لاعبين من قائمتك في الصفقة إذا كان ذلك سيجعل قائمتك أقل من 17 لاعبًا.");
    }
    if (fromMemberPlayerCount - offeredPlayersCount + 1 > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تعديل العرض لأن قائمتك ستتجاوز الحد الأقصى 32 لاعبًا.");
    }

    const fromMemberVisiblePlayerIds = new Set(fromMemberVisiblePlayers.map((player) => cleanId(getPlayerStableId(player))));
    const invalidOfferedPlayer = offeredPlayers.find((item) => !fromMemberVisiblePlayerIds.has(cleanId(item.playerId)));
    if (invalidOfferedPlayer) {
      throw new Error("لا يمكن إدراج لاعب غير موجود في قائمتك الحالية ضمن الصفقة.");
    }
    const duplicateOfferedPlayers = new Set();
    const duplicatedOfferedPlayer = offeredPlayers.find((item) => {
      const playerId = cleanId(item.playerId);
      if (!playerId) return true;
      if (duplicateOfferedPlayers.has(playerId)) return true;
      duplicateOfferedPlayers.add(playerId);
      return false;
    });
    if (duplicatedOfferedPlayer) {
      throw new Error("لا يمكن تكرار نفس اللاعب في صفقة التبادل.");
    }
    const loanedOfferedPlayer = offeredPlayers.find((item) => clean(getActivePlayerContract(item.playerId)?.contractType || "") === "loan");
    if (loanedOfferedPlayer) {
      throw new Error("لا يمكن إدراج لاعب تستعيره حاليًا ضمن بنود التبادل.");
    }

    const createsProPlayer = wouldOfferCreateProPlayer(existing.targetPlayerId, fromMemberId);
    const offeredProLeavingCount = offeredPlayers.reduce((sum, item) => {
      const row = fromMemberVisiblePlayers.find((player) => same(getPlayerStableId(player), item.playerId));
      const kind = row ? getRosterPlayerKind(row, fromMemberId) : "base";
      return sum + (kind === "pro_owned" || kind === "pro_loan" ? 1 : 0);
    }, 0);
    if (proLimitExceeded(countMemberProPlayers(fromMemberId) - offeredProLeavingCount + (createsProPlayer ? 1 : 0))) {
      throw new Error("لا يمكن تعديل العرض لأنه سيتجاوز الحد الأقصى للمحترفين (" + maxProfessionalPlayersLabel + ") حسب قائمتك الحالية.");
    }

    if (contractType === "loan" && ![2, 4, 6].includes(toNumber(payload?.loanDurationMonths))) {
      throw new Error("اختر مدة عقد الإعارة.");
    }
    if (numericAmount + OFFER_FEE > availableForEdit) {
      throw new Error("الرصيد المتاح لا يكفي لتعديل العرض مع رسوم التعديل.");
    }

    const nextVersion = toNumber(existing.version || 1) + 1;
    await deactivateOfferNotifications(offerId, "offer_updated");

    await updateDoc(doc(db, "playerOffers", offerId), {
      type: contractType,
      typeLabel: contractType === "loan" ? "عقد إعارة" : "عقد شراء",
      amount: numericAmount,
      reservedAmount: numericAmount,
      offeredPlayers,
      loanDurationMonths: contractType === "loan" ? toNumber(payload?.loanDurationMonths) : null,
      notes: String(payload?.notes || "").trim(),
      editCount: toNumber(existing.editCount) + 1,
      version: nextVersion,
      updatedAt: serverTimestamp(),
      lastEditedAt: serverTimestamp(),
    });

    await addOfferFee({
      fromMemberId,
      relatedOfferId: offerId,
      note: "رسوم تعديل عرض اللاعب " + (existing.targetPlayerName || ""),
      type: "offer_edit_fee",
      dateKey: new Date().toISOString().slice(0, 10),
    });

    await addDoc(collection(db, "notifications"), {
      type: "player_offer_updated",
      status: "unread",
      toMemberId: existing.toMemberId,
      fromMemberId,
      relatedOfferId: offerId,
      targetPlayerId: existing.targetPlayerId || "",
      targetMemberId: existing.toMemberId || "",
      offerVersion: nextVersion,
      targetStatus: "pending",
      navigationDisabled: false,
      title: "تم تعديل عرض انتقال",
      body: (currentMember?.name || "عضو") + " عدّل عرضه على اللاعب " + (existing.targetPlayerName || "") + ".",
      createdAt: serverTimestamp(),
    });
  }

  async function cancelPlayerOffer(offerId) {
    const fromMemberId = cleanId(currentMemberId);
    const existing = firebasePlayerOffers.find((offer) => same(offer.id, offerId));
    if (!existing) throw new Error("العرض غير موجود.");
    if (!same(existing.fromMemberId, fromMemberId)) throw new Error("لا يمكنك إلغاء عرض لا يخصك.");
    if (!isActivePlayerOfferStatus(existing.status) || isOfferExpired(existing)) throw new Error("لا يمكن إلغاء هذا العرض.");

    await deactivateOfferNotifications(offerId, "offer_cancelled");

    await updateDoc(doc(db, "playerOffers", offerId), {
      status: "cancelledByBuyer",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: "player_offer_cancelled",
      status: "unread",
      toMemberId: existing.toMemberId,
      fromMemberId,
      relatedOfferId: offerId,
      targetPlayerId: existing.targetPlayerId || "",
      targetMemberId: existing.toMemberId || "",
      offerVersion: toNumber(existing.version || 1),
      targetStatus: "cancelledByBuyer",
      navigationDisabled: true,
      title: "تم إلغاء عرض",
      body: (currentMember?.name || "عضو") + " ألغى عرضه على اللاعب " + (existing.targetPlayerName || "") + ".",
      createdAt: serverTimestamp(),
    });
  }

  async function acceptPlayerOffer(offerId) {
    const ownerId = cleanId(currentMemberId);
    const existing = firebasePlayerOffers.find((offer) => same(offer.id, offerId));
    if (!existing) throw new Error("العرض غير موجود.");
    if (!same(existing.toMemberId, ownerId)) throw new Error("لا يمكنك قبول عرض لا يخص لاعبك.");
    if (!isActivePlayerOfferStatus(existing.status) || isOfferExpired(existing)) throw new Error("لا يمكن قبول هذا العرض.");

    const buyerId = cleanId(existing.fromMemberId);
    const sellerId = cleanId(existing.toMemberId);
    assertTransferAllowed(sellerId, "squad_change");
    assertTransferAllowed(buyerId, "squad_change");
    assertTransferAllowed(sellerId, "receive_offer");
    const numericAmount = Math.max(0, toNumber(existing.amount));
    const contractType = clean(existing.type) === "loan" ? "loan" : "buy";
    const nextStatus = transferMarketOpen ? "completed" : "approvedPendingWindow";
    const targetPlayerId = cleanId(existing.targetPlayerId || existing.playerId);
    const targetPlayerRow = players.find((player) => same(getPlayerStableId(player), targetPlayerId));
    if (!buyerId || !sellerId || !targetPlayerId) throw new Error("بيانات العرض غير مكتملة.");

    const previousActiveContract = getActivePlayerContract(targetPlayerId);
    const previousActiveContractType = clean(previousActiveContract?.contractType || "");
    if (previousActiveContractType === "released") throw new Error("لا يمكن قبول العرض لأن اللاعب خارج اللعبة.");

    const baseOwnerId = cleanId(
      previousActiveContract?.baseOwnerMemberId ||
        previousActiveContract?.baseOwnerId ||
        previousActiveContract?.originalBaseOwnerMemberId ||
        previousActiveContract?.originalOwnerMemberId ||
        targetPlayerRow?.memberid ||
        sellerId
    );
    const baseOwner = members.find((member) => same(member.id, baseOwnerId));
    const baseOwnerName = previousActiveContract?.baseOwnerMemberName || previousActiveContract?.originalBaseOwnerMemberName || baseOwner?.name || previousActiveContract?.originalOwnerMemberName || existing.toMemberName || currentMember?.name || "";
    const sourceOwnerId = cleanId(previousActiveContract?.currentMemberId || sellerId);
    const sourceOwnerName = previousActiveContract?.currentMemberName || existing.toMemberName || currentMember?.name || "";
    const loanRealOwnerId = previousActiveContractType === "loan"
      ? cleanId(previousActiveContract?.originalOwnerMemberId || previousActiveContract?.ownerMemberId || baseOwnerId || sellerId)
      : sourceOwnerId;
    const loanRealOwnerName = previousActiveContractType === "loan"
      ? (previousActiveContract?.originalOwnerMemberName || previousActiveContract?.ownerMemberName || baseOwnerName || sourceOwnerName)
      : sourceOwnerName;
    if (sourceOwnerId && !same(sourceOwnerId, sellerId)) {
      throw new Error("لا يمكن قبول العرض لأن ملكية اللاعب تغيرت بعد تقديم العرض.");
    }

    const offeredPlayersRaw = Array.isArray(existing.offeredPlayers) ? existing.offeredPlayers : [];
    const buyerVisiblePlayers = getVisiblePlayersForMember(buyerId);
    const buyerVisibleMap = new Map(
      buyerVisiblePlayers.map((player) => [cleanId(getPlayerStableId(player)), player])
    );
    const offeredPlayerIds = new Set();
    const offeredPlayers = offeredPlayersRaw.map((item) => {
      const playerId = cleanId(item.playerId || item.playerid || item.id);
      if (!playerId) throw new Error("يوجد لاعب غير مكتمل في صفقة التبادل.");
      if (same(playerId, targetPlayerId)) throw new Error("لا يمكن إدراج نفس اللاعب المستهدف ضمن لاعبي التبادل.");
      if (offeredPlayerIds.has(playerId)) throw new Error("لا يمكن تكرار نفس اللاعب في صفقة التبادل.");
      offeredPlayerIds.add(playerId);
      const row = buyerVisibleMap.get(playerId) || players.find((player) => same(getPlayerStableId(player), playerId));
      if (!row || !buyerVisibleMap.has(playerId)) {
        throw new Error("لا يمكن قبول العرض لأن أحد لاعبي التبادل لم يعد في قائمة مقدم العرض.");
      }
      const activeContract = getActivePlayerContract(playerId);
      const activeType = clean(activeContract?.contractType || "");
      if (activeType === "released") throw new Error("لا يمكن إدراج لاعب تم الاستغناء عنه ضمن التبادل.");
      if (activeType === "loan") throw new Error("لا يمكن قبول العرض لأن أحد لاعبي التبادل معار حاليًا لدى مقدم العرض.");
      if (activeContract && !same(activeContract.currentMemberId, buyerId)) {
        throw new Error("لا يمكن قبول العرض لأن ملكية أحد لاعبي التبادل تغيرت.");
      }
      const exchangeContractType = normalizeExchangeContractType(item.exchangeContractType || item.swapContractType || item.contractMode);
      const exchangeLoanDurationMonths = exchangeContractType === "loan" ? normalizeExchangeLoanDuration(item.exchangeLoanDurationMonths || item.loanDurationMonths) : null;
      return {
        ...item,
        row,
        activeContract,
        playerId,
        exchangeContractType,
        exchangeLoanDurationMonths,
        exchangeTypeLabel: exchangeContractType === "loan" ? "إعارة" : "بيع كامل",
        playerName: item.playerName || row.name || "",
        playerImage: item.playerImage || item.image || row.image || "",
        playerPosition: item.playerPosition || item.position || row.position || "",
        playerRating: item.playerRating || item.rating || row.rating || "",
      };
    });

    const sellerPlayerCount = getVisiblePlayersForMember(sellerId).length;
    const buyerPlayerCount = buyerVisiblePlayers.length;
    const sellerCountAfterDeal = sellerPlayerCount - 1 + offeredPlayers.length;
    const buyerCountAfterDeal = buyerPlayerCount - offeredPlayers.length + 1;
    if (sellerCountAfterDeal < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن قبول العرض لأن قائمة العضو لا يجوز أن تقل عن 17 لاعبًا بعد الصفقة.");
    }
    if (sellerCountAfterDeal > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن قبول العرض لأن قائمة صاحب اللاعب ستتجاوز الحد الأقصى 32 لاعبًا بعد الصفقة.");
    }
    if (buyerCountAfterDeal < MIN_SQUAD_PLAYERS) {
      throw new Error("لا يمكن قبول العرض لأن قائمة مقدم العرض ستصبح أقل من 17 لاعبًا بعد الصفقة.");
    }
    if (buyerCountAfterDeal > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن قبول العرض لأن قائمة مقدم العرض ستتجاوز الحد الأقصى 32 لاعبًا بعد الصفقة.");
    }

    const targetFreeOrigin = isFreeOriginContract(previousActiveContract);
    const targetFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(previousActiveContract, targetFreeOrigin ? baseOwnerId || sellerId : "");
    const targetRosterKindForSeller = getRosterPlayerKindFromContract(targetPlayerRow || {}, previousActiveContract, sellerId);
    const targetProLeavingSeller = isProRosterKind(targetRosterKindForSeller) ? 1 : 0;
    const targetProEnteringBuyer = (() => {
      if (contractType === "loan") return same(baseOwnerId, buyerId) ? 0 : 1;
      if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, buyerId)) return 0;
      return baseOwnerId && !same(baseOwnerId, buyerId) ? 1 : 0;
    })();

    let offeredProLeavingBuyer = 0;
    let offeredProEnteringSeller = 0;
    offeredPlayers.forEach((item) => {
      const swapBaseOwnerId = cleanId(item.activeContract?.baseOwnerMemberId || item.activeContract?.baseOwnerId || item.activeContract?.originalBaseOwnerMemberId || item.activeContract?.originalOwnerMemberId || item.row?.memberid || buyerId);
      const swapFreeOrigin = isFreeOriginContract(item.activeContract);
      const swapFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(item.activeContract, swapFreeOrigin ? swapBaseOwnerId || buyerId : "");
      const currentKindForBuyer = getRosterPlayerKindFromContract(item.row, item.activeContract, buyerId);
      if (isProRosterKind(currentKindForBuyer)) offeredProLeavingBuyer += 1;
      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, sellerId)) return;
      if (swapBaseOwnerId && !same(swapBaseOwnerId, sellerId)) offeredProEnteringSeller += 1;
    });

    const buyerPendingProDelta = getPendingAcceptedProDeltaForMember(buyerId, offerId);
    const sellerPendingProDelta = getPendingAcceptedProDeltaForMember(sellerId, offerId);
    const buyerProAfterDeal = countMemberProPlayers(buyerId) + buyerPendingProDelta - offeredProLeavingBuyer + targetProEnteringBuyer;
    const sellerProAfterDeal = countMemberProPlayers(sellerId) + sellerPendingProDelta - targetProLeavingSeller + offeredProEnteringSeller;
    if (proLimitExceeded(buyerProAfterDeal)) {
      throw new Error("لا يمكن قبول العرض لأن مقدم العرض سيتجاوز الحد الأقصى للمحترفين (" + maxProfessionalPlayersLabel + ") بعد احتساب الصفقات المعلقة.");
    }
    if (proLimitExceeded(sellerProAfterDeal)) {
      throw new Error("لا يمكن قبول العرض لأن صاحب اللاعب سيتجاوز الحد الأقصى للمحترفين (" + maxProfessionalPlayersLabel + ") بسبب لاعبي التبادل أو الصفقات المعلقة.");
    }

    await deactivateOfferNotifications(offerId, "offer_accepted");

    const acceptanceDate = new Date();
    const acceptanceDateKey = acceptanceDate.toISOString().slice(0, 10);

    await updateDoc(doc(db, "playerOffers", offerId), {
      status: nextStatus,
      approvedAt: serverTimestamp(),
      completedAt: transferMarketOpen ? serverTimestamp() : null,
      approvedByMemberId: ownerId,
      marketWasOpenAtApproval: transferMarketOpen,
      paymentDueAtApproval: numericAmount > 0,
      paymentTransferredAtApproval: numericAmount > 0,
      paymentTransferredAt: numericAmount > 0 ? serverTimestamp() : null,
      paymentTransferDate: numericAmount > 0 ? acceptanceDateKey : null,
      updatedAt: serverTimestamp(),
    });

    const competingOffers = firebasePlayerOffers.filter((offer) =>
      !same(offer.id, offerId) &&
      same(offer.targetPlayerId, existing.targetPlayerId) &&
      clean(offer.status || "pending") === "pending" &&
      !isOfferExpired(offer)
    );

    await Promise.allSettled(
      competingOffers.map(async (offer) => {
        await deactivateOfferNotifications(offer.id, "player_offer_closed");
        await updateDoc(doc(db, "playerOffers", offer.id), {
          status: "cancelledBecausePlayerUnavailable",
          cancelledAt: serverTimestamp(),
          cancelledReason: "تم قبول عرض آخر على نفس اللاعب",
          updatedAt: serverTimestamp(),
        });
        await addDoc(collection(db, "notifications"), {
          type: "player_offer_closed",
          status: "unread",
          toMemberId: offer.fromMemberId,
          fromMemberId: ownerId,
          relatedOfferId: offer.id,
          targetPlayerId: offer.targetPlayerId || "",
          targetMemberId: ownerId,
          offerVersion: toNumber(offer.version || 1),
          targetStatus: "cancelledBecausePlayerUnavailable",
          navigationDisabled: true,
          title: "تم إغلاق عرضك",
          body: "تم قبول عرض آخر على اللاعب " + (offer.targetPlayerName || "") + "، لذلك أُغلق عرضك تلقائيًا.",
          createdAt: serverTimestamp(),
        });
      })
    );

    if (!transferMarketOpen) {
      if (numericAmount > 0) {
        await addDoc(collection(db, "moneyTransfers"), {
          fromMemberId: buyerId,
          fromMemberName: existing.fromMemberName || "",
          toMemberId: sellerId,
          toMemberName: existing.toMemberName || currentMember?.name || "",
          amount: numericAmount,
          type: "player_offer_payment",
          status: "approved",
          approvedBy: ownerId,
          relatedOfferId: offerId,
          note: "قيمة عرض اللاعب " + (existing.targetPlayerName || "") + " - تم تحويلها فور قبول الصفقة بانتظار فتح السوق",
          date: acceptanceDateKey,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await Promise.allSettled([
        addDoc(collection(db, "notifications"), {
          type: "player_offer_accepted_pending_window",
          status: "unread",
          toMemberId: buyerId,
          fromMemberId: sellerId,
          relatedOfferId: offerId,
          targetPlayerId,
          targetMemberId: sellerId,
          title: "تم قبول عرضك بانتظار السوق",
          body: "تم قبول عرضك للاعب " + (existing.targetPlayerName || "") + "، ولن ينتقل اللاعب أو تتحدث القوائم إلا عند فتح سوق الانتقالات.",
          createdAt: serverTimestamp(),
        }),
        addDoc(collection(db, "notifications"), {
          type: "player_offer_accepted_pending_window",
          status: "unread",
          toMemberId: sellerId,
          fromMemberId: buyerId,
          relatedOfferId: offerId,
          targetPlayerId,
          targetMemberId: sellerId,
          title: "صفقة مقبولة بانتظار السوق",
          body: "تم اعتماد قبول عرض " + (existing.targetPlayerName || "") + "، وستنفذ الصفقة عند فتح سوق الانتقالات فقط.",
          createdAt: serverTimestamp(),
        }),
      ]);
      return;
    }

    const loanMonths = contractType === "loan" ? toNumber(existing.loanDurationMonths) : null;
    const nowDate = new Date();
    const todayDateKey = nowDate.toISOString().slice(0, 10);
    const loanEndDate = loanMonths
      ? new Date(nowDate.getFullYear(), nowDate.getMonth() + loanMonths, nowDate.getDate()).toISOString().slice(0, 10)
      : null;

    if (previousActiveContract?.id) {
      await updateDoc(doc(db, "playerContracts", previousActiveContract.id), {
        status: "replaced",
        replacedByOfferId: offerId,
        replacedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, sellerId) && !same(targetFreeSlotOwnerId, buyerId)) {
      await setDoc(doc(db, "freePlayerStatus", sellerId), {
        memberId: toNumber(sellerId),
        hasUsedFreeSlot: true,
        currentFreePlayerId: "",
        currentFreePlayerName: "",
        lostFreePlayerId: targetPlayerId,
        lostFreePlayerName: existing.targetPlayerName || targetPlayerRow?.name || "",
        lostFreePlayerAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    const newContractPayload = {
      status: "active",
      playerId: targetPlayerId,
      playerName: existing.targetPlayerName || targetPlayerRow?.name || "",
      playerImage: existing.targetPlayerImage || targetPlayerRow?.image || "",
      playerPosition: existing.targetPlayerPosition || targetPlayerRow?.position || "",
      playerRating: existing.targetPlayerRating || targetPlayerRow?.rating || "",
      ownerMemberId: contractType === "loan" ? loanRealOwnerId : buyerId,
      ownerMemberName: contractType === "loan" ? loanRealOwnerName : (existing.fromMemberName || getMemberName(members, buyerId)),
      originalOwnerMemberId: contractType === "loan" ? loanRealOwnerId : baseOwnerId,
      originalOwnerMemberName: contractType === "loan" ? loanRealOwnerName : baseOwnerName,
      baseOwnerMemberId: baseOwnerId,
      baseOwnerMemberName: baseOwnerName,
      currentMemberId: buyerId,
      currentMemberName: existing.fromMemberName || getMemberName(members, buyerId),
      previousMemberId: sourceOwnerId,
      previousMemberName: sourceOwnerName,
      contractType: contractType === "loan" ? "loan" : "owned",
      rosterType: getRosterKindCode({ contractType: contractType === "loan" ? "loan" : "owned", originalOwnerMemberId: baseOwnerId, currentMemberId: buyerId, freeAgent: targetFreeOrigin && same(targetFreeSlotOwnerId, buyerId) }),
      isFreeOrigin: targetFreeOrigin,
      freeAgentOrigin: targetFreeOrigin,
      freeAgentSlotOwnerMemberId: targetFreeSlotOwnerId || "",
      sourceOfferId: offerId,
      amount: numericAmount,
      loanAmount: contractType === "loan" ? numericAmount : 0,
      loanDurationMonths: loanMonths,
      loanStartDate: transferMarketOpen ? todayDateKey : null,
      loanEndDate: transferMarketOpen ? loanEndDate : null,
      pendingWindow: !transferMarketOpen,
      marketWasOpenAtApproval: transferMarketOpen,
      createdBy: ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "playerContracts"), newContractPayload);

    if (targetFreeOrigin && targetFreeSlotOwnerId && same(targetFreeSlotOwnerId, buyerId)) {
      await setDoc(doc(db, "freePlayerStatus", buyerId), {
        memberId: toNumber(buyerId),
        hasUsedFreeSlot: false,
        currentFreePlayerId: targetPlayerId,
        currentFreePlayerName: existing.targetPlayerName || targetPlayerRow?.name || "",
        returnedFreePlayerAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    const enrichedOfferedPlayers = [];
    for (const item of offeredPlayers) {
      const swapBaseOwnerId = cleanId(item.activeContract?.baseOwnerMemberId || item.activeContract?.baseOwnerId || item.activeContract?.originalBaseOwnerMemberId || item.activeContract?.originalOwnerMemberId || item.row?.memberid || buyerId);
      const swapBaseOwner = members.find((member) => same(member.id, swapBaseOwnerId));
      const swapBaseOwnerName = item.activeContract?.baseOwnerMemberName || item.activeContract?.originalBaseOwnerMemberName || item.activeContract?.originalOwnerMemberName || swapBaseOwner?.name || getMemberName(members, swapBaseOwnerId) || existing.fromMemberName || "";
      const swapSourceOwnerId = cleanId(item.activeContract?.currentMemberId || buyerId);
      const swapSourceOwnerName = item.activeContract?.currentMemberName || existing.fromMemberName || getMemberName(members, buyerId) || "";
      const swapFreeOrigin = isFreeOriginContract(item.activeContract);
      const swapFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(item.activeContract, swapFreeOrigin ? swapBaseOwnerId || buyerId : "");
      const exchangeContractType = normalizeExchangeContractType(item.exchangeContractType);
      const exchangeLoanMonths = exchangeContractType === "loan" ? normalizeExchangeLoanDuration(item.exchangeLoanDurationMonths) : null;
      const exchangeLoanEndDate = exchangeLoanMonths
        ? new Date(nowDate.getFullYear(), nowDate.getMonth() + exchangeLoanMonths, nowDate.getDate()).toISOString().slice(0, 10)
        : null;
      const exchangeOwnerId = exchangeContractType === "loan" ? swapSourceOwnerId : sellerId;
      const exchangeOwnerName = exchangeContractType === "loan" ? swapSourceOwnerName : (existing.toMemberName || getMemberName(members, sellerId));
      const exchangeOriginalOwnerId = exchangeContractType === "loan" ? swapSourceOwnerId : swapBaseOwnerId;
      const exchangeOriginalOwnerName = exchangeContractType === "loan" ? swapSourceOwnerName : swapBaseOwnerName;

      if (item.activeContract?.id) {
        await updateDoc(doc(db, "playerContracts", item.activeContract.id), {
          status: "replaced_exchange",
          replacedByOfferId: offerId,
          replacedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, buyerId) && !same(swapFreeSlotOwnerId, sellerId)) {
        await setDoc(doc(db, "freePlayerStatus", buyerId), {
          memberId: toNumber(buyerId),
          hasUsedFreeSlot: true,
          currentFreePlayerId: "",
          currentFreePlayerName: "",
          lostFreePlayerId: item.playerId,
          lostFreePlayerName: item.playerName || "",
          lostFreePlayerAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      await addDoc(collection(db, "playerContracts"), {
        status: "active",
        contractType: exchangeContractType === "loan" ? "loan" : "owned",
        playerId: item.playerId,
        playerName: item.playerName || "",
        playerImage: item.playerImage || "",
        playerPosition: item.playerPosition || "",
        playerRating: item.playerRating || "",
        ownerMemberId: exchangeOwnerId,
        ownerMemberName: exchangeOwnerName,
        originalOwnerMemberId: exchangeOriginalOwnerId,
        originalOwnerMemberName: exchangeOriginalOwnerName,
        baseOwnerMemberId: swapBaseOwnerId,
        baseOwnerMemberName: swapBaseOwnerName,
        currentMemberId: sellerId,
        currentMemberName: existing.toMemberName || getMemberName(members, sellerId),
        previousMemberId: swapSourceOwnerId,
        previousMemberName: swapSourceOwnerName,
        contractTypeLabel: exchangeContractType === "loan" ? ("تبادل - إعارة " + loanDurationLabel(exchangeLoanMonths)) : "تبادل - بيع كامل",
        rosterType: getRosterKindCode({ contractType: exchangeContractType === "loan" ? "loan" : "owned", originalOwnerMemberId: exchangeOriginalOwnerId, currentMemberId: sellerId, freeAgent: swapFreeOrigin && same(swapFreeSlotOwnerId, sellerId) }),
        isFreeOrigin: swapFreeOrigin,
        freeAgentOrigin: swapFreeOrigin,
        freeAgentSlotOwnerMemberId: swapFreeSlotOwnerId || "",
        sourceOfferId: offerId,
        source: "exchange_player",
        exchangeContractType,
        exchangeLoanDurationMonths: exchangeLoanMonths,
        amount: 0,
        loanAmount: 0,
        loanDurationMonths: exchangeLoanMonths,
        loanStartDate: exchangeContractType === "loan" ? todayDateKey : null,
        loanEndDate: exchangeContractType === "loan" ? exchangeLoanEndDate : null,
        marketWasOpenAtApproval: transferMarketOpen,
        createdBy: ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (swapFreeOrigin && swapFreeSlotOwnerId && same(swapFreeSlotOwnerId, sellerId)) {
        await setDoc(doc(db, "freePlayerStatus", sellerId), {
          memberId: toNumber(sellerId),
          hasUsedFreeSlot: false,
          currentFreePlayerId: item.playerId,
          currentFreePlayerName: item.playerName || "",
          returnedFreePlayerAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      enrichedOfferedPlayers.push({
        playerId: item.playerId,
        playerName: item.playerName || "",
        playerImage: item.playerImage || "",
        playerPosition: item.playerPosition || "",
        playerRating: item.playerRating || "",
        fromMemberId: buyerId,
        fromMemberName: existing.fromMemberName || getMemberName(members, buyerId),
        toMemberId: sellerId,
        toMemberName: existing.toMemberName || getMemberName(members, sellerId),
        exchangeContractType,
        exchangeLoanDurationMonths: exchangeLoanMonths,
        exchangeTypeLabel: exchangeContractType === "loan" ? "إعارة" : "بيع كامل",
        originalOwnerMemberId: swapBaseOwnerId,
        originalOwnerMemberName: swapBaseOwnerName,
        isFreeOrigin: swapFreeOrigin,
        freeAgentSlotOwnerMemberId: swapFreeSlotOwnerId || "",
      });
    }

    const transferHistoryPayload = {
      status: nextStatus,
      type: contractType === "loan" ? "loan" : "buy",
      typeLabel: contractType === "loan" ? "عقد إعارة" : (enrichedOfferedPlayers.length ? "عقد شراء + تبادل" : "عقد شراء"),
      playerId: targetPlayerId,
      playerName: existing.targetPlayerName || targetPlayerRow?.name || "",
      playerImage: existing.targetPlayerImage || targetPlayerRow?.image || "",
      playerPosition: existing.targetPlayerPosition || targetPlayerRow?.position || "",
      playerRating: existing.targetPlayerRating || targetPlayerRow?.rating || "",
      fromMemberId: sourceOwnerId,
      fromMemberName: sourceOwnerName,
      toMemberId: buyerId,
      toMemberName: existing.fromMemberName || getMemberName(members, buyerId),
      originalOwnerMemberId: contractType === "loan" ? loanRealOwnerId : baseOwnerId,
      originalOwnerMemberName: contractType === "loan" ? loanRealOwnerName : baseOwnerName,
      baseOwnerMemberId: baseOwnerId,
      baseOwnerMemberName: baseOwnerName,
      ownerMemberId: contractType === "loan" ? loanRealOwnerId : buyerId,
      ownerMemberName: contractType === "loan" ? loanRealOwnerName : (existing.fromMemberName || getMemberName(members, buyerId)),
      amount: numericAmount,
      loanDurationMonths: loanMonths,
      loanStartDate: transferMarketOpen ? todayDateKey : null,
      loanEndDate: transferMarketOpen ? loanEndDate : null,
      date: todayDateKey,
      periodId: getTransferWindowIdForDate(firebaseTransferWindows, todayDateKey),
      periodName: getTransferWindowNameForDate(firebaseTransferWindows, todayDateKey),
      seasonId: activeSeasonId,
      relatedOfferId: offerId,
      marketWasOpenAtApproval: transferMarketOpen,
      completedAt: transferMarketOpen ? serverTimestamp() : null,
      offeredPlayers: enrichedOfferedPlayers,
      exchangePlayerCount: enrichedOfferedPlayers.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, "transferHistory"), transferHistoryPayload);

    if (transferMarketOpen && numericAmount > 0 && !existing.paymentTransferredAtApproval) {
      await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: buyerId,
        fromMemberName: existing.fromMemberName || "",
        toMemberId: sellerId,
        toMemberName: existing.toMemberName || currentMember?.name || "",
        amount: numericAmount,
        type: "player_offer_payment",
        status: "approved",
        approvedBy: ownerId,
        relatedOfferId: offerId,
        note: "قيمة عرض اللاعب " + (existing.targetPlayerName || ""),
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "playerOffers", offerId), {
        paymentTransferredAtApproval: true,
        paymentTransferredAt: serverTimestamp(),
        paymentTransferDate: todayDateKey,
        updatedAt: serverTimestamp(),
      });
    }

    await addDoc(collection(db, "notifications"), {
      type: "player_offer_accepted",
      status: "unread",
      toMemberId: buyerId,
      fromMemberId: ownerId,
      relatedOfferId: offerId,
      targetPlayerId: existing.targetPlayerId || "",
      targetMemberId: sellerId,
      offerVersion: toNumber(existing.version || 1),
      targetStatus: nextStatus,
      navigationDisabled: true,
      title: "تم قبول عرضك",
      body: (currentMember?.name || "العضو") + " وافق على عرضك للاعب " + (existing.targetPlayerName || "") + (transferMarketOpen ? "." : "، والصفقة بانتظار فتح سوق الانتقالات."),
      createdAt: serverTimestamp(),
    });

    return {
      instantContract: {
        row: transferHistoryPayload,
        player: {
          name: existing.targetPlayerName || targetPlayerRow?.name || "",
          image: existing.targetPlayerImage || targetPlayerRow?.image || FALLBACK_PLAYER_IMAGE,
          rating: existing.targetPlayerRating || targetPlayerRow?.rating || "",
          position: existing.targetPlayerPosition || targetPlayerRow?.position || "",
        },
      },
    };
  }

  async function rejectPlayerOffer(offerId) {
    const ownerId = cleanId(currentMemberId);
    const existing = firebasePlayerOffers.find((offer) => same(offer.id, offerId));
    if (!existing) throw new Error("العرض غير موجود.");
    if (!same(existing.toMemberId, ownerId)) throw new Error("لا يمكنك رفض عرض لا يخص لاعبك.");
    if (!isActivePlayerOfferStatus(existing.status) || isOfferExpired(existing)) throw new Error("لا يمكن رفض هذا العرض.");

    await deactivateOfferNotifications(offerId, "offer_rejected");

    await updateDoc(doc(db, "playerOffers", offerId), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedByMemberId: ownerId,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: "player_offer_rejected",
      status: "unread",
      toMemberId: existing.fromMemberId,
      fromMemberId: ownerId,
      relatedOfferId: offerId,
      targetPlayerId: existing.targetPlayerId || "",
      targetMemberId: existing.toMemberId || "",
      offerVersion: toNumber(existing.version || 1),
      targetStatus: "rejected",
      navigationDisabled: true,
      title: "تم رفض عرضك",
      body: (currentMember?.name || "العضو") + " رفض عرضك للاعب " + (existing.targetPlayerName || "") + ".",
      createdAt: serverTimestamp(),
    });
  }

  async function releasePlayerFromSquad(player) {
    const ownerId = cleanId(currentMemberId);
    const playerId = getPlayerStableId(player);
    if (!ownerId || !playerId) throw new Error("بيانات اللاعب غير مكتملة.");
    assertTransferAllowed(ownerId, "squad_change");
    if (!transferMarketOpen) throw new Error("الاستغناء متاح فقط خلال فترة الانتقالات وقيد اللاعبين.");

    const activeContract = getActivePlayerContract(playerId);
    const contractType = clean(activeContract?.contractType || "");
    if (contractType === "released") throw new Error("تم الاستغناء عن هذا اللاعب سابقًا ولا يمكن تنفيذ الإجراء مرة أخرى.");

    const effectiveOwnerId = activeContract && contractType !== "released"
      ? cleanId(activeContract.currentMemberId)
      : cleanId(player.memberid);

    if (!same(effectiveOwnerId, ownerId)) throw new Error("لا يمكنك الاستغناء عن لاعب لا يخص قائمتك.");
    const ownerRosterKind = getRosterPlayerKindFromContract(player, activeContract, ownerId);
    if (ownerRosterKind === "free") {
      throw new Error("لا يمكن الاستغناء عن اللاعب الحر. يمكن تبديله فقط من صفحة اللاعبين الأحرار خلال سوق الانتقالات.");
    }
    if (activeContract && contractType !== "owned") throw new Error("لا يمكن الاستغناء عن لاعب معار أو مرتبط بعقد غير مملوك ملكية كاملة.");

    const activeAcceptedDeal = firebasePlayerOffers.find((offer) =>
      same(offer.targetPlayerId, playerId) && isAcceptedOrCompletedPlayerOffer(offer)
    );
    if (activeAcceptedDeal) throw new Error("لا يمكن الاستغناء عن لاعب عليه صفقة مقبولة أو مكتملة.");

    const ownerPlayersCount = getVisiblePlayersForMember(ownerId).length;
    if (ownerPlayersCount <= MIN_SQUAD_PLAYERS) throw new Error("لا يمكن الاستغناء عندما تكون قائمة العضو 17 لاعبًا حسب نظام الموسم السادس.");

    const releaseDate = new Date().toISOString().slice(0, 10);
    const releaseWindowId = getTransferWindowIdForDate(firebaseTransferWindows, releaseDate);
    const releaseWindowName = getTransferWindowNameForDate(firebaseTransferWindows, releaseDate);

    const activeOffersForPlayer = firebasePlayerOffers.filter((offer) =>
      same(offer.targetPlayerId, playerId) &&
      clean(offer.status || "pending") === "pending" &&
      !isOfferExpired(offer)
    );

    await Promise.allSettled(
      activeOffersForPlayer.map(async (offer) => {
        await deactivateOfferNotifications(offer.id, "player_released");
        await updateDoc(doc(db, "playerOffers", offer.id), {
          status: "cancelledBecausePlayerReleased",
          cancelledAt: serverTimestamp(),
          cancelledReason: "تم الاستغناء عن اللاعب وإنهاء عقده مع الفريق",
          navigationDisabled: true,
          updatedAt: serverTimestamp(),
        });
        if (!same(offer.fromMemberId, ownerId)) {
          await addDoc(collection(db, "notifications"), {
            type: "player_offer_closed",
            status: "unread",
            toMemberId: offer.fromMemberId,
            fromMemberId: ownerId,
            relatedOfferId: offer.id,
            targetPlayerId: playerId,
            targetMemberId: ownerId,
            offerVersion: toNumber(offer.version || 1),
            targetStatus: "cancelledBecausePlayerReleased",
            navigationDisabled: true,
            title: "تم إغلاق عرضك",
            body: "تم الاستغناء عن اللاعب " + (player.name || "") + "، لذلك أُغلق عرضك تلقائيًا.",
            createdAt: serverTimestamp(),
          });
        }
      })
    );

    if (activeContract?.id) {
      await updateDoc(doc(db, "playerContracts", activeContract.id), {
        status: "released_to_free_agent",
        releasedToFreeAgentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await addDoc(collection(db, "playerContracts"), {
      status: "active",
      contractType: "free_agent",
      rosterType: "free",
      isFreeOrigin: true,
      freeAgentOrigin: true,
      releasedToFreeAgent: true,
      availableFreeAgent: true,
      playerId,
      playerName: player.name || "",
      playerImage: player.image || "",
      playerPosition: player.position || "",
      playerRating: player.rating || "",
      ownerMemberId: "free_agents",
      ownerMemberName: "اللاعبون الأحرار",
      originalOwnerMemberId: ownerId,
      originalOwnerMemberName: currentMember?.name || authProfile?.memberName || "",
      baseOwnerMemberId: ownerId,
      baseOwnerMemberName: currentMember?.name || authProfile?.memberName || "",
      currentMemberId: "",
      currentMemberName: "لاعب حر متاح",
      previousMemberId: ownerId,
      previousMemberName: currentMember?.name || authProfile?.memberName || "",
      permanentlyRemoved: false,
      releasedAt: serverTimestamp(),
      releasedDate: releaseDate,
      marketWasOpenAtRelease: transferMarketOpen,
      transferWindowId: releaseWindowId,
      transferWindowName: releaseWindowName,
      periodId: releaseWindowId,
      periodName: releaseWindowName,
      createdBy: authUser?.uid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const releaseRef = await addDoc(collection(db, "playerReleases"), {
      status: "completed",
      type: "release",
      typeLabel: "إنهاء تعاقد",
      memberId: ownerId,
      memberName: currentMember?.name || authProfile?.memberName || "",
      fromMemberId: ownerId,
      fromMemberName: currentMember?.name || authProfile?.memberName || "",
      toMemberId: "free_agents",
      toMemberName: "اللاعبون الأحرار",
      playerId,
      playerName: player.name || "",
      playerImage: player.image || "",
      playerPosition: player.position || "",
      playerRating: player.rating || "",
      amount: 0,
      permanentlyRemoved: false,
      releasedToFreeAgent: true,
      marketWasOpen: transferMarketOpen,
      transferWindowId: releaseWindowId,
      transferWindowName: releaseWindowName,
      periodId: releaseWindowId,
      periodName: releaseWindowName,
      seasonId: activeSeasonId,
      createdBy: authUser?.uid || "",
      date: releaseDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "transferHistory"), {
      status: "completed",
      type: "release",
      typeLabel: "إنهاء تعاقد",
      playerId,
      playerName: player.name || "",
      playerImage: player.image || "",
      playerPosition: player.position || "",
      playerRating: player.rating || "",
      fromMemberId: ownerId,
      fromMemberName: currentMember?.name || authProfile?.memberName || "",
      toMemberId: "free_agents",
      toMemberName: "اللاعبون الأحرار",
      amount: 0,
      date: releaseDate,
      periodId: releaseWindowId,
      periodName: releaseWindowName,
      seasonId: activeSeasonId,
      relatedReleaseId: releaseRef.id,
      marketWasOpenAtRelease: transferMarketOpen,
      note: "إنهاء تعاقد ونقل اللاعب إلى قائمة اللاعبين الأحرار",
      completedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "notifications"), {
      type: "player_released",
      status: "unread",
      toMemberId: ownerId,
      fromMemberId: ownerId,
      targetPlayerId: playerId,
      targetMemberId: ownerId,
      targetStatus: "released_to_free_agent",
      navigationDisabled: true,
      title: "تم الاستغناء عن لاعب",
      body: "تم إنهاء عقد اللاعب " + (player.name || "") + " ونقله إلى قائمة اللاعبين الأحرار.",
      createdAt: serverTimestamp(),
    });
  }

  async function terminateLoanContract(contract) {
    const actorId = cleanId(currentMemberId);
    if (!actorId) throw new Error("لم يتم ربط الحساب بعضو بعد.");
    assertTransferAllowed(actorId, "squad_change");
    if (!contract?.id) throw new Error("عقد الإعارة غير موجود.");
    if (clean(contract.contractType) !== "loan") throw new Error("هذا اللاعب ليس على عقد إعارة.");
    if (!transferMarketOpen) throw new Error("فسخ الإعارة متاح فقط خلال فترة الانتقالات وقيد اللاعبين.");

    const currentHolderId = cleanId(contract.currentMemberId);
    const originalOwnerId = cleanId(contract.originalOwnerMemberId || contract.ownerMemberId);
    const isCurrentHolder = same(actorId, currentHolderId);
    const isOriginalOwner = same(actorId, originalOwnerId);
    if (!isCurrentHolder && !isOriginalOwner) throw new Error("لا يمكنك فسخ عقد إعارة لا يخصك.");

    const compensation = LOAN_TERMINATION_COMPENSATION;
    const loanAmount = Math.max(0, toNumber(contract.loanAmount || contract.amount || 0));
    const todayDateKey = new Date().toISOString().slice(0, 10);
    const actorName = currentMember?.name || authProfile?.memberName || "";
    const otherMemberId = isCurrentHolder ? originalOwnerId : currentHolderId;

    await updateDoc(doc(db, "playerContracts", contract.id), {
      status: "terminated",
      terminatedAt: serverTimestamp(),
      terminatedByMemberId: actorId,
      terminatedByMemberName: actorName,
      updatedAt: serverTimestamp(),
    });

    const returningFreeOrigin = isFreeOriginContract(contract);
    const returningFreeSlotOwnerId = getFreeAgentSlotOwnerIdFromContract(contract, returningFreeOrigin ? originalOwnerId : "");
    const returningBaseOwnerId = cleanId(
      contract.baseOwnerMemberId ||
        contract.baseOwnerId ||
        contract.originalBaseOwnerMemberId ||
        contract.sourceBaseOwnerMemberId ||
        contract.baseMemberId ||
        originalOwnerId
    );
    const returningBaseOwnerName = contract.baseOwnerMemberName || contract.originalBaseOwnerMemberName || getMemberName(members, returningBaseOwnerId) || contract.originalOwnerMemberName || contract.ownerMemberName || "";
    const returningOwnerName = contract.originalOwnerMemberName || contract.ownerMemberName || getMemberName(members, originalOwnerId) || "";
    const returningRosterType = getRosterKindCode({
      contractType: "owned",
      originalOwnerMemberId: returningBaseOwnerId,
      currentMemberId: originalOwnerId,
      freeAgent: returningFreeOrigin && same(returningFreeSlotOwnerId, originalOwnerId),
    });

    await addDoc(collection(db, "playerContracts"), {
      status: "active",
      contractType: "owned",
      rosterType: returningRosterType,
      playerId: contract.playerId || "",
      playerName: contract.playerName || "",
      playerImage: contract.playerImage || "",
      playerPosition: contract.playerPosition || "",
      playerRating: contract.playerRating || "",
      ownerMemberId: originalOwnerId,
      ownerMemberName: returningOwnerName,
      originalOwnerMemberId: returningBaseOwnerId,
      originalOwnerMemberName: returningBaseOwnerName,
      baseOwnerMemberId: returningBaseOwnerId,
      baseOwnerMemberName: returningBaseOwnerName,
      currentMemberId: originalOwnerId,
      currentMemberName: returningOwnerName,
      previousMemberId: currentHolderId,
      previousMemberName: contract.currentMemberName || "",
      sourceContractId: contract.id,
      source: "loan_terminated",
      isFreeOrigin: returningFreeOrigin,
      freeAgentOrigin: returningFreeOrigin,
      freeAgentSlotOwnerMemberId: returningFreeSlotOwnerId, 
      marketWasOpenAtTermination: transferMarketOpen,
      createdBy: actorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (isOriginalOwner) {
      if (loanAmount > 0) {
        await addDoc(collection(db, "moneyTransfers"), {
          fromMemberId: originalOwnerId,
          fromMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
          toMemberId: currentHolderId,
          toMemberName: contract.currentMemberName || "",
          amount: loanAmount,
          type: "loan_refund_by_owner_termination",
          status: "approved",
          note: "استرجاع مبلغ إعارة اللاعب " + (contract.playerName || ""),
          relatedContractId: contract.id,
          date: todayDateKey,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: originalOwnerId,
        fromMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
        toMemberId: currentHolderId,
        toMemberName: contract.currentMemberName || "",
        amount: compensation,
        type: "loan_termination_compensation",
        status: "approved",
        note: "تعويض فسخ إعارة اللاعب " + (contract.playerName || ""),
        relatedContractId: contract.id,
        date: todayDateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: currentHolderId,
        fromMemberName: contract.currentMemberName || "",
        toMemberId: originalOwnerId,
        toMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
        amount: compensation,
        type: "loan_termination_compensation",
        status: "approved",
        note: "تعويض فسخ إعارة اللاعب " + (contract.playerName || ""),
        relatedContractId: contract.id,
        date: todayDateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await addDoc(collection(db, "transferHistory"), {
      status: "completed",
      type: "loan_terminated",
      typeLabel: "فسخ إعارة",
      playerId: contract.playerId || "",
      playerName: contract.playerName || "",
      playerImage: contract.playerImage || "",
      playerPosition: contract.playerPosition || "",
      playerRating: contract.playerRating || "",
      fromMemberId: currentHolderId,
      fromMemberName: contract.currentMemberName || "",
      toMemberId: originalOwnerId,
      toMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
      originalOwnerMemberId: originalOwnerId,
      originalOwnerMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
      baseOwnerMemberId: returningBaseOwnerId,
      baseOwnerMemberName: returningBaseOwnerName,
      ownerMemberId: originalOwnerId,
      ownerMemberName: contract.originalOwnerMemberName || contract.ownerMemberName || "",
      amount: compensation,
      date: todayDateKey,
      periodId: getTransferWindowIdForDate(firebaseTransferWindows, todayDateKey),
      periodName: getTransferWindowNameForDate(firebaseTransferWindows, todayDateKey),
      seasonId: activeSeasonId,
      relatedContractId: contract.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (returningFreeOrigin && returningFreeSlotOwnerId && same(returningFreeSlotOwnerId, originalOwnerId)) {
      await setDoc(doc(db, "freePlayerStatus", originalOwnerId), {
        memberId: toNumber(originalOwnerId),
        hasUsedFreeSlot: false,
        currentFreePlayerId: contract.playerId || "",
        currentFreePlayerName: contract.playerName || "",
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    await addDoc(collection(db, "notifications"), {
      type: "loan_terminated",
      status: "unread",
      toMemberId: otherMemberId,
      fromMemberId: actorId,
      targetPlayerId: contract.playerId || "",
      targetStatus: "loan_terminated",
      navigationDisabled: true,
      title: "تم فسخ إعارة",
      body: (actorName || "عضو") + " قام بفسخ إعارة اللاعب " + (contract.playerName || "") + ".",
      createdAt: serverTimestamp(),
    });
  }

  async function registerFreeAgentFee(player) {
    const ownerId = cleanId(currentMemberId);
    const playerId = getPlayerStableId(player);
    if (!authUser || !ownerId) throw new Error("لم يتم ربط الحساب بعضو بعد.");
    assertTransferAllowed(ownerId, "squad_change");
    if (!playerId) throw new Error("بيانات اللاعب غير مكتملة.");
    const freeAgentPoolContract = getActivePlayerContract(playerId);
    const playerAvailableAsFreeAgent = isFreeAgentPlayer(player) || isFreeAgentPoolContract(freeAgentPoolContract);
    if (!playerAvailableAsFreeAgent) throw new Error("هذا اللاعب غير متاح ضمن قائمة اللاعبين الأحرار.");
    if (isFreeAgentUnavailable(playerId)) throw new Error("هذا اللاعب الحر غير متاح حاليًا لأنه مسجل أو عليه طلب قيد.");

    const memberName = currentMember?.name || authProfile?.memberName || "";
    const currentFreeContract = getActiveFreeAgentContractForMember(ownerId);
    const currentFreePlayerId = cleanId(currentFreeContract?.playerId || "");
    const memberFreeStatus = getFreePlayerStatusForMember(ownerId);
    const slotEverUsed = hasEverUsedFreeAgentSlot(firebaseFreeAgentRegistrations, memberFreeStatus, currentFreeContract, ownerId);
    const pendingQueue = getPendingFreeAgentQueueForMember(ownerId);

    if (pendingQueue) {
      throw new Error("لديك طلب لاعب حر بانتظار التنفيذ عند فتح سوق الانتقالات.");
    }

    if (currentFreePlayerId && same(currentFreePlayerId, playerId)) {
      throw new Error("هذا اللاعب الحر مسجل في قائمتك بالفعل.");
    }

    if (slotEverUsed && !currentFreeContract) {
      throw new Error("لا يمكنك تسجيل لاعب حر جديد بعد بيع أو إعارة لاعبك الحر السابق إلا إذا عاد نفس اللاعب الحر إلى قائمتك.");
    }

    const isReplacement = Boolean(currentFreeContract);
    const feeAmount = isReplacement ? FREE_AGENT_REPLACEMENT_FEE : 0;
    const currentRosterCount = getVisiblePlayersForMember(ownerId).length;
    if (!isReplacement && currentRosterCount + 1 > MAX_SQUAD_PLAYERS) {
      throw new Error("لا يمكن تسجيل لاعب حر لأن قائمتك ستتجاوز الحد الأقصى 32 لاعبًا.");
    }

    if (feeAmount > currentMemberAvailableBalance) {
      throw new Error("الرصيد المتاح لا يكفي لرسوم تبديل اللاعب الحر.");
    }

    const todayDateKey = new Date().toISOString().slice(0, 10);
    const basePayload = {
      memberId: ownerId,
      memberName,
      oldPlayerId: currentFreePlayerId || "",
      oldPlayerName: currentFreeContract?.playerName || "",
      oldPlayerImage: currentFreeContract?.playerImage || "",
      newPlayerId: playerId,
      newPlayerName: player.name || "",
      newPlayerImage: player.image || "",
      newPlayerPosition: player.position || "",
      newPlayerRating: player.rating || "",
      cost: feeAmount,
      feeAmount,
      registrationType: isReplacement ? "replacement" : "initial",
      slotEverUsed,
      status: transferMarketOpen ? "processing" : "pending_window",
      date: todayDateKey,
      marketWasOpenAtRequest: transferMarketOpen,
      createdBy: authUser.uid,
      username: authProfile?.username || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (!transferMarketOpen) {
      await addDoc(collection(db, "freeAgentQueue"), basePayload);
      await addDoc(collection(db, "notifications"), {
        type: isReplacement ? "free_agent_replacement_queued" : "free_agent_registration_queued",
        status: "unread",
        toMemberId: ownerId,
        fromMemberId: ownerId,
        targetPlayerId: playerId,
        targetStatus: "pending_window",
        navigationDisabled: true,
        title: isReplacement ? "طلب تبديل لاعب حر" : "طلب تسجيل لاعب حر",
        body: isReplacement
          ? "تم حفظ طلب تبديل اللاعب الحر إلى " + (player.name || "") + "، وسيتم تنفيذه عند فتح سوق الانتقالات إذا توفر الرصيد."
          : "تم حفظ طلب تسجيل اللاعب الحر " + (player.name || "") + "، وسيتم تنفيذه عند فتح سوق الانتقالات.",
        createdAt: serverTimestamp(),
      });
      return;
    }

    const queueRef = await addDoc(collection(db, "freeAgentQueue"), basePayload);
    await executeFreeAgentQueueItem({ id: queueRef.id, ...basePayload }, { allowProcessingStatus: true });
  }

  async function executeFreeAgentQueueItem(queueItem, options = {}) {
    const status = clean(queueItem?.status || "pending_window");
    if (!queueItem?.id) return;
    if (!["pending_window", "processing"].includes(status)) return;
    if (status === "processing" && !options.allowProcessingStatus) return;

    const ownerId = cleanId(queueItem.memberId);
    const newPlayerId = cleanId(queueItem.newPlayerId);
    const oldPlayerId = cleanId(queueItem.oldPlayerId);
    if (!ownerId || !newPlayerId) return;

    const member = members.find((item) => same(item.id, ownerId));
    const memberName = queueItem.memberName || member?.name || "";
    const memberStatus = firebaseFreePlayerStatus.find((item) => same(item.memberId || item.id, ownerId));
    const currentFreeContract = getActiveFreeAgentContractForMember(ownerId);
    const queuedReplacement = clean(queueItem.registrationType) === "replacement" || Boolean(oldPlayerId);
    const slotEverUsed = hasEverUsedFreeAgentSlot(firebaseFreeAgentRegistrations, memberStatus, currentFreeContract, ownerId);
    const isReplacement = Boolean(queuedReplacement && currentFreeContract);
    const feeAmount = isReplacement ? FREE_AGENT_REPLACEMENT_FEE : 0;
    const newPlayer = players.find((item) => same(getPlayerStableId(item), newPlayerId)) || {};
    const rosterCount = getVisiblePlayersForMember(ownerId).length;
    if (!isReplacement && rosterCount + 1 > MAX_SQUAD_PLAYERS) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "قائمة العضو ستتجاوز الحد الأقصى 32 لاعبًا.",
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (queuedReplacement && (!currentFreeContract || (oldPlayerId && !same(currentFreeContract.playerId, oldPlayerId)))) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "تعذر تنفيذ تبديل اللاعب الحر لأن اللاعب الحر القديم لم يعد نشطًا في القائمة.",
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (!queuedReplacement && currentFreeContract) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "لدى العضو لاعب حر نشط بالفعل.",
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (slotEverUsed && !currentFreeContract && !queuedReplacement) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "لا يمكن تسجيل لاعب حر جديد بعد بيع أو إعارة اللاعب الحر السابق إلا إذا عاد نفس اللاعب.",
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (isFreeAgentUnavailable(newPlayerId, queueItem.id)) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "اللاعب الحر لم يعد متاحًا.",
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const memberFinanceRows = getMemberFinanceRows(combinedFinance, ownerId);
    const memberBalance = computeMemberBalance(memberFinanceRows, member?.balance, ownerId);
    if (feeAmount > memberBalance) {
      await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
        status: "failed",
        failureReason: "الرصيد غير كافٍ عند فتح سوق الانتقالات.",
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        type: "free_agent_queue_failed",
        status: "unread",
        toMemberId: ownerId,
        fromMemberId: "system",
        targetPlayerId: newPlayerId,
        targetStatus: "failed",
        navigationDisabled: true,
        title: "فشل طلب اللاعب الحر",
        body: "تعذر تنفيذ طلب اللاعب الحر " + (queueItem.newPlayerName || newPlayer.name || "") + " لأن الرصيد غير كافٍ.",
        createdAt: serverTimestamp(),
      });
      return;
    }

    await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
      status: "processing",
      processingAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (currentFreeContract?.id) {
      await updateDoc(doc(db, "playerContracts", currentFreeContract.id), {
        status: "replaced_free_agent",
        replacedByPlayerId: newPlayerId,
        replacedByQueueId: queueItem.id,
        replacedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const todayDateKey = new Date().toISOString().slice(0, 10);

    if (feeAmount > 0) {
      await addDoc(collection(db, "moneyTransfers"), {
        fromMemberId: ownerId,
        fromMemberName: memberName,
        toMemberId: "system",
        toMemberName: "النظام",
        amount: feeAmount,
        type: "free_agent_replacement_fee",
        direction: "expense",
        status: "approved",
        approvedBy: "system",
        playerId: newPlayerId,
        playerName: queueItem.newPlayerName || newPlayer.name || "",
        relatedQueueId: queueItem.id,
        createdBy: queueItem.createdBy || authUser?.uid || "system",
        username: queueItem.username || "",
        note: "رسوم تبديل اللاعب الحر إلى " + (queueItem.newPlayerName || newPlayer.name || ""),
        date: todayDateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const availableFreeAgentPoolContract = activePlayerContracts.find((contract) =>
      same(contract.playerId, newPlayerId) && isFreeAgentPoolContract(contract)
    );

    if (availableFreeAgentPoolContract?.id) {
      await updateDoc(doc(db, "playerContracts", availableFreeAgentPoolContract.id), {
        status: "registered_from_free_agents",
        registeredByMemberId: ownerId,
        registeredByQueueId: queueItem.id,
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await addDoc(collection(db, "playerContracts"), {
      status: "active",
      contractType: "owned",
      rosterType: "free",
      isFreeOrigin: true,
      freeAgentOrigin: true,
      freeAgentSlotOwnerMemberId: ownerId,
      playerId: newPlayerId,
      playerName: queueItem.newPlayerName || newPlayer.name || "",
      playerImage: queueItem.newPlayerImage || newPlayer.image || "",
      playerPosition: queueItem.newPlayerPosition || newPlayer.position || "",
      playerRating: queueItem.newPlayerRating || newPlayer.rating || "",
      ownerMemberId: ownerId,
      ownerMemberName: memberName,
      originalOwnerMemberId: ownerId,
      originalOwnerMemberName: memberName,
      currentMemberId: ownerId,
      currentMemberName: memberName,
      previousMemberId: oldPlayerId ? ownerId : "free_agents",
      previousMemberName: oldPlayerId ? memberName : "لاعب حر",
      source: "free_agent_queue",
      sourceQueueId: queueItem.id,
      amount: feeAmount,
      createdBy: queueItem.createdBy || authUser?.uid || "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "freeAgentRegistrations"), {
      status: "completed",
      registrationType: isReplacement ? "replacement" : "initial",
      slotEverUsed,
      playerId: newPlayerId,
      playerName: queueItem.newPlayerName || newPlayer.name || "",
      playerImage: queueItem.newPlayerImage || newPlayer.image || "",
      playerPosition: queueItem.newPlayerPosition || newPlayer.position || "",
      playerRating: queueItem.newPlayerRating || newPlayer.rating || "",
      oldPlayerId: oldPlayerId || currentFreeContract?.playerId || "",
      oldPlayerName: queueItem.oldPlayerName || currentFreeContract?.playerName || "",
      memberId: ownerId,
      memberName,
      amount: feeAmount,
      feeAmount,
      relatedQueueId: queueItem.id,
      date: todayDateKey,
      createdBy: queueItem.createdBy || authUser?.uid || "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "transferHistory"), {
      status: "completed",
      type: isReplacement ? "free_agent_replacement" : "free_agent",
      typeLabel: isReplacement ? "تبديل لاعب حر" : "تسجيل لاعب حر",
      playerId: newPlayerId,
      playerName: queueItem.newPlayerName || newPlayer.name || "",
      playerImage: queueItem.newPlayerImage || newPlayer.image || "",
      playerPosition: queueItem.newPlayerPosition || newPlayer.position || "",
      playerRating: queueItem.newPlayerRating || newPlayer.rating || "",
      fromMemberId: isReplacement ? ownerId : "free_agents",
      fromMemberName: isReplacement ? (queueItem.oldPlayerName || currentFreeContract?.playerName || "لاعب حر سابق") : "لاعب حر",
      toMemberId: ownerId,
      toMemberName: memberName,
      amount: feeAmount,
      date: todayDateKey,
      periodId: options.marketOpenWindowInfo?.windowId || getTransferWindowIdForDate(firebaseTransferWindows, todayDateKey),
      periodName: options.marketOpenWindowInfo?.windowTitle || getTransferWindowNameForDate(firebaseTransferWindows, todayDateKey),
      seasonId: activeSeasonId,
      relatedQueueId: queueItem.id,
      note: isReplacement
        ? "تبديل لاعب حر برسوم إلزامية 5,000,000"
        : "تسجيل اللاعب الحر الأول بدون رسوم",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, "freePlayerStatus", ownerId), {
      memberId: toNumber(ownerId),
      hasUsedFreeSlot: false,
      currentFreePlayerId: newPlayerId,
      currentFreePlayerName: queueItem.newPlayerName || newPlayer.name || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await updateDoc(doc(db, "freeAgentQueue", queueItem.id), {
      status: "completed",
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const rosterNotifications = [
      sendRosterUpdateNotification({
        toMemberId: ownerId,
        fromMemberId: "FIFA",
        playerId: newPlayerId,
        relatedQueueId: queueItem.id,
        targetStatus: isReplacement ? "free_agent_replaced" : "free_agent_registered",
        body: "تحديث على قائمة فريقك: تم تسجيل اللاعب " + (queueItem.newPlayerName || newPlayer.name || "") + " كلاعب حر",
      }),
    ];

    if (isReplacement && (queueItem.oldPlayerName || currentFreeContract?.playerName)) {
      rosterNotifications.unshift(sendRosterUpdateNotification({
        toMemberId: ownerId,
        fromMemberId: "FIFA",
        playerId: oldPlayerId || currentFreeContract?.playerId || "",
        relatedQueueId: queueItem.id,
        targetStatus: "free_agent_removed_after_replacement",
        body: "تحديث على قائمة فريقك: تم إزالة اللاعب " + (queueItem.oldPlayerName || currentFreeContract?.playerName || "") + " من القائمة بعد تبديل اللاعب الحر",
      }));
    }

    await Promise.allSettled(rosterNotifications);
  }

  async function markNotificationRead(notificationId) {
    if (!notificationId) return;
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        status: "read",
        readAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Mark notification read failed:", err);
    }
  }

  async function clearCurrentMemberNotifications() {
    const id = cleanId(currentMemberId);
    if (!id || !currentMemberNotifications.length) return;
    try {
      await Promise.allSettled(
        currentMemberNotifications.map((item) => updateDoc(doc(db, "notifications", item.id), {
          hiddenForMemberIds: arrayUnion(id),
          status: "read",
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }))
      );
    } catch (err) {
      console.error("Clear notifications failed:", err);
      alert("تعذر تنظيف الإشعارات حالياً.");
    }
  }

  function openNotificationTarget(notification) {
    if (!notification) return;
    markNotificationRead(notification.id);
    setNotificationsOpen(false);

    const competitionId = cleanId(
      notification.relatedCompetitionId ||
        notification.competitionId ||
        notification.targetCompetitionId
    );
    if (competitionId) {
      setFocusedCompetitionId(competitionId);
      setPage("season");
      setSelectedId("");
      setMemberTab("players");
      setDetailView(null);
      setDetailStack([]);
      requestAnimationFrame(() => scrollAppToTop("auto"));
      return;
    }

    const financeMemberId = cleanId(
      notification.relatedMemberId ||
        notification.financeMemberId ||
        notification.receiverMemberId ||
        notification.toMemberId
    );
    const notificationType = clean(notification.type || "");
    if (
      financeMemberId &&
      ["money_transfer_in", "money_transfer_out", "admin_reward", "admin_compensation", "financial_alert", "competition_reward"].includes(notificationType)
    ) {
      setSelectedId(financeMemberId);
      setMemberTab("finance");
      setPage("members");
      setDetailView(null);
      setDetailStack([]);
      requestAnimationFrame(() => scrollAppToTop("auto"));
      return;
    }

    const offer = firebasePlayerOffers.find((item) => same(item.id, notification.relatedOfferId));
    const notificationVersion = toNumber(notification.offerVersion || 0);
    const offerVersion = toNumber(offer?.version || 1);
    const offerStatus = clean(offer?.status || notification.targetStatus || "");
    const staleNotification = Boolean(
      notification.navigationDisabled ||
        !offer ||
        (notificationVersion && notificationVersion !== offerVersion) ||
        isTerminalPlayerOfferStatus(offerStatus) ||
        isOfferExpired(offer)
    );

    if (staleNotification) {
      return;
    }

    const targetPlayerId = cleanId(notification.targetPlayerId || offer?.targetPlayerId);
    const targetMemberId = cleanId(notification.targetMemberId || offer?.toMemberId || notification.toMemberId || currentMemberId);
    const player = players.find((item) => same(getPlayerStableId(item), targetPlayerId));
    const ownerMember = members.find((member) => same(member.id, targetMemberId));
    if (player && ownerMember) {
      setDetailView({ type: "playerDetailOffer", player, ownerMember });
      setDetailStack([]);
      setSelectedId("");
      setMemberTab("players");
      requestAnimationFrame(() => scrollAppToTop("auto"));
      return;
    }

    setPage("members");
    setMemberTab("notifications");
    requestAnimationFrame(() => scrollAppToTop("auto"));
  }

  async function addOfferFee({ fromMemberId, relatedOfferId, note, type, dateKey }) {
    await addDoc(collection(db, "moneyTransfers"), {
      fromMemberId,
      fromMemberName: currentMember?.name || authProfile?.memberName || "",
      toMemberId: "system",
      toMemberName: "النظام",
      amount: OFFER_FEE,
      type,
      direction: "expense",
      status: "approved",
      approvedBy: "system",
      relatedOfferId,
      createdBy: authUser.uid,
      username: authProfile?.username || "",
      note,
      date: dateKey,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const rootTopPages = new Set(["home", "season", "transfers", "myProfile"]);
  const canShowTopBack = Boolean(
    infoModal || menuOpen || detailView || selectedId || !rootTopPages.has(page)
  );

  const topBarTitle = getTopBarTitle({
    page,
    config,
    selectedMember,
    detailView,
    infoModal,
    menuOpen,
  });

  function releaseBackLock(delay = 260) {
    window.setTimeout(() => {
      backLockRef.current = false;
    }, delay);
  }

  function performStableBack({ fromNative = false } = {}) {
    if (backLockRef.current) {
      return;
    }
    backLockRef.current = true;

    const state = navStateRef.current || {
      page,
      selectedId,
      detailView,
      detailStack,
      menuOpen,
      infoModal,
      notificationsOpen,
    };

    const nativeBack = Boolean(fromNative);
    const runAfterNativeSwipe = (fn) => {
      if (!nativeBack) {
        fn();
        return;
      }
      const run = () => requestAnimationFrame(fn);
      window.setTimeout(run, 90);
      window.setTimeout(run, 220);
      window.setTimeout(run, 420);
    };
    const finish = () => releaseBackLock(nativeBack ? 680 : 260);

    if (state.infoModal) {
      setInfoModal(null);
      finish();
      return;
    }

    if (state.notificationsOpen) {
      setNotificationsOpen(false);
      finish();
      return;
    }

    if (state.menuOpen) {
      setMenuOpen(false);
      finish();
      return;
    }

    if (state.detailView) {
      const stack = Array.isArray(state.detailStack) ? state.detailStack : [];
      if (stack.length) {
        const previousEntry = stack[stack.length - 1];
        setDetailStack((currentStack) => currentStack.slice(0, -1));
        setDetailView(previousEntry.view);
        runAfterNativeSwipe(() => restoreScrollPosition(previousEntry.scrollTop));
      } else {
        setDetailView(null);
        runAfterNativeSwipe(() => restoreScrollPosition(baseScrollRef.current || 0));
      }
      finish();
      return;
    }

    if (state.selectedId) {
      const previous = memberReturnRef.current || {};
      memberReturnRef.current = null;
      setPage(previous.page || "home");
      setSelectedId(previous.selectedId || "");
      setMemberTab(previous.memberTab || "players");
      setSearch(previous.search || "");
      setFocusedCompetitionId(previous.focusedCompetitionId || "");
      setDetailView(null);
      setDetailStack([]);
      setInfoModal(null);
      setNotificationsOpen(false);
      setMenuOpen(false);
      runAfterNativeSwipe(() => restoreScrollPosition(previous.scrollTop || 0));
      finish();
      return;
    }

    if (pageHistoryRef.current.length > 0) {
      const prev = pageHistoryRef.current[pageHistoryRef.current.length - 1];
      pageHistoryRef.current = pageHistoryRef.current.slice(0, -1);
      setPage(prev.page);
      setSelectedId(prev.selectedId || "");
      setMemberTab(prev.memberTab || "players");
      setSearch(prev.search || "");
      setFocusedCompetitionId(prev.focusedCompetitionId || "");
      if (prev.page === "season") setSeasonHubTab(prev.seasonHubTab || "members");
      setDetailView(null);
      setDetailStack([]);
      setInfoModal(null);
      setNotificationsOpen(false);
      setMenuOpen(false);
      runAfterNativeSwipe(() => restoreScrollPosition(prev.scrollTop || 0));
      finish();
      return;
    }

    if (state.page !== "home") {
      setPage("home");
      setSelectedId("");
      setDetailView(null);
      setDetailStack([]);
      setInfoModal(null);
      setNotificationsOpen(false);
      setMenuOpen(false);
      runAfterNativeSwipe(() => scrollAppToTop("auto"));
      finish();
      return;
    }

    if (fromNative) {
      try { window.history.pushState({ fifaGroupRoot: true, fifaGroupGuard: true }, ""); } catch {}
    }
    finish();
  }

  function handleTopBack() {
    performStableBack({ fromNative: false });
  }

  async function handleLogout() {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setInfoModal(null);
    setDetailView(null);
    setDetailStack([]);
    setSelectedId("");
    setMemberTab("players");
    setSearch("");
    setPage("home");
    memberReturnRef.current = null;
    setAuthUser(null);
    setAuthProfile(null);
    setAuthLoading(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
      setAuthLoading(false);
    }
  }

  if (loading) return null;
  if (error || !members.length)
    return (
      <SystemScreen
        title={error || config.noDataTitle}
        subtitle="تأكد من روابط Google Sheets."
      />
    );
  if (clean(config.appStatus) !== "active")
    return (
      <SystemScreen
        title={config.maintenanceMessage}
        subtitle={config.seasonTitle}
      />
    );

  if (authLoading) return null;

  if (!authUser)
    return (
      <LoginPage
        members={activeMembers}
        appTitle={config.mainTitle}
        seasonTitle={config.seasonTitle}
        logoUrl={config.groupLogo || config.exportLogo || config.appIcon}
      />
    );

  return (
    <div className="app iosSafeApp" dir="rtl">
      <style>{css}</style>
      <style>{moneyCss}</style>
      <style>{dealCss}</style>
      <style>{leagueAdminCss}</style>
      <style>{`:root{--cyan:${config.primaryColor};--blue:${config.secondaryColor};--violet:${config.accentColor};--fg-cover-height:${toCssSize(config.coverHeight, "118px")};--fg-cover-height-mobile:${toCssSize(config.coverHeightMobile, "50px")};}`}</style>
      <style>{v3OverrideCss}</style>
      <style>{finalMinorSafeCss}</style> 
      <div className="bgOrb bgOrbOne" />
      <div className="bgOrb bgOrbTwo" />

      {false && page === "members" && !selectedMember && !detailView ? (
        <header
          className={
            headerCoverImage ? "mainHero hasCoverImage" : "mainHero glass"
          }
        >
          {headerCoverImage ? (
            <img className="coverImage" src={headerCoverImage} alt="" />
          ) : null}
          {!headerCoverImage ? (
            <div className="coverContent">
              <div>
                <div className="heroKicker">
                  {config.mainTitle}
                  <span />
                </div>
                <h1>{config.mainTitle}</h1>
                <p>{config.seasonTitle}</p>
              </div>
              <div className="coverIconBox">
                {appIconImage ? <img src={appIconImage} alt="" /> : <b>FG</b>}
              </div>
            </div>
          ) : null}
        </header>
      ) : null}

      {config.announcement ? (
        <div className="announcement glassSoft">📢 {config.announcement}</div>
      ) : null}

      {detailView ? (
        <DetailPage
          config={config}
          view={detailView}
          members={members}
          players={players}
          finance={combinedFinance}
          trophyMap={trophyMap}
          playerContracts={activePlayerContracts}
          currentMemberId={currentMemberId}
          currentMember={currentMember}
          currentAvailableBalance={currentMemberAvailableBalance}
          currentMemberPlayers={currentMemberPlayers}
          playerOffers={firebasePlayerOffers}
          freeAgentRegistrations={firebaseFreeAgentRegistrations}
          freePlayerStatus={firebaseFreePlayerStatus}
          freeAgentQueue={firebaseFreeAgentQueue}
          isMarketOpen={transferMarketOpen}
          onBack={closeView}
          onOpenView={openView}
          onInfo={setInfoModal}
          onCreatePlayerOffer={createPlayerOffer}
          onUpdatePlayerOffer={updatePlayerOffer}
          onCancelPlayerOffer={cancelPlayerOffer}
          onAcceptOffer={acceptPlayerOffer}
          onRejectOffer={rejectPlayerOffer}
          onReleasePlayer={releasePlayerFromSquad}
          onTerminateLoan={terminateLoanContract}
          onRegisterFreeAgentFee={registerFreeAgentFee}
        />
      ) : (
        <>
          {page === "home" ? (
          <HomePage
            config={config}
            rankedMembers={rankedMembers}
            members={members}
            allTournaments={allTournaments}
            transferPeriods={transferPeriods}
            financeRows={combinedFinance}
            setSelectedId={setSelectedId}
            competitions={firebaseCompetitions}
            currentMember={currentMember}
            currentMemberId={currentMemberId}
            totalForMember={totalForMember}
            statsMap={finalStatsByMember}
            goPage={goPage}
            onOpenView={openView}
            setFocusedCompetitionId={setFocusedCompetitionId}
            setArchiveDefaultMode={setArchiveDefaultMode}
            onOpenMember={openPublicMemberProfile}
            />
        ) : null}
          {page === "seasonCenter" ? (
            <SeasonCenterPage
              config={config}
              members={members}
              competitions={firebaseCompetitions}
              transferWindows={firebaseTransferWindows}
              playerOffers={firebasePlayerOffers}
              notifications={currentMemberNotifications}
              currentMember={currentMember}
              currentMemberId={currentMemberId}
              isFifaAdmin={isFifaAdmin}
              onOpenCompetition={(competitionId) => {
                setFocusedCompetitionId(competitionId);
                goPage("season", { seasonTab: "competitions" });
              }}
            />
          ) : null}

          {page === "myProfile" ? (
            <MyProfilePage
              config={config}
              member={currentMember}
              currentMemberId={currentMemberId}
              members={members}
              competitions={firebaseCompetitions}
              transferWindows={firebaseTransferWindows}
              playerOffers={firebasePlayerOffers}
              notifications={currentMemberNotifications}
              restrictions={activeCurrentMemberRestrictions}
              players={currentMemberPlayers}
              financeRows={currentMemberFinance}
              trophyGroups={groupMemberTrophies(allTournaments, currentMemberId, trophyMap)}
              trophyMap={trophyMap}
              stats={finalStatsByMember[cleanId(currentMemberId)] || emptyMemberStats(currentMemberId)}
              seasonRanking={seasonRanking}
              transferHistory={firebaseTransferRows}
              allPlayerOffers={firebasePlayerOffers}
              allPlayers={players}
              playerContracts={activePlayerContracts}
              freeAgentRegistrations={firebaseFreeAgentRegistrations}
              freePlayerStatus={firebaseFreePlayerStatus}
              freeAgentQueue={firebaseFreeAgentQueue}
              memberRestrictions={firebaseMemberRestrictions}
              currentMemberRestrictions={activeCurrentMemberRestrictions}
              pushStatus={pushStatus}
              pushBusy={pushBusy}
              balance={currentMemberBalance}
              availableBalance={currentMemberAvailableBalance}
              trophiesCount={totalForMember(currentMemberId)}
              proCount={countMemberProPlayers(currentMemberId)}
              isFifaAdmin={isFifaAdmin}
              onEnablePushNotifications={handleEnablePushNotifications}
              onDisablePushNotifications={handleDisablePushNotifications}
              onOpenNotification={openNotificationTarget}
              onClearNotifications={clearCurrentMemberNotifications}
              onCreatePlayerOffer={createPlayerOffer}
              onUpdatePlayerOffer={updatePlayerOffer}
              onCancelPlayerOffer={cancelPlayerOffer}
              onAcceptOffer={acceptPlayerOffer}
              onRejectOffer={rejectPlayerOffer}
              onReleasePlayer={releasePlayerFromSquad}
              onTerminateLoan={terminateLoanContract}
              onRegisterFreeAgentFee={registerFreeAgentFee}
              isMarketOpen={transferMarketOpen}
              onOpenView={openView}
              onInfo={setInfoModal}
              onOpenCompetition={(competitionId) => {
                setFocusedCompetitionId(competitionId);
                goPage("season", { seasonTab: "competitions" });
              }}
              onOpenMemberTab={(tabId) => {
                if (!currentMemberId) return;
                setPage("members");
                setSelectedId(currentMemberId);
                setMemberTab(tabId || "players");
                setSearch("");
                setMenuOpen(false);
                setDetailView(null);
                setDetailStack([]);
                setInfoModal(null);
                requestAnimationFrame(() => {
                  scrollAppToTop("auto");
                });
              }}
              onGoPage={goPage}
            />
          ) : null}

          {page === "studio" ? (
            <FifaStudioPage
              config={config}
              members={members}
              competitions={firebaseCompetitions}
              allTournaments={allTournaments}
              transferHistory={firebaseTransferRows}
              trophyMap={trophyMap}
              currentMember={currentMember}
              currentMemberId={currentMemberId}
              players={players}
              financeRows={combinedFinance}
              playerContracts={activePlayerContracts}
              statsMap={finalStatsByMember}
              rankedMembers={rankedMembers}
              getMemberPlayersForExport={(memberId) => getVisiblePlayersForMember(memberId).sort((a, b) => toNumber(b.rating) - toNumber(a.rating))}
            />
          ) : null}

          {page === "members" ? (
            <MembersPage
              config={config}
              rankedMembers={rankedMembers}
              members={members}
              selectedMember={selectedMember}
              selectedMemberId={selectedMemberId}
              totalForMember={totalForMember}
              setSelectedId={setSelectedId}
              memberTab={memberTab}
              setMemberTab={setMemberTab}
              players={memberPlayers}
              trophies={memberTrophyGroups}
              finance={memberFinance}
              financeBalance={selectedMemberBalance}
              currentMemberId={currentMemberId}
              isFifaAdmin={isFifaAdmin}
              currentMemberBalance={currentMemberBalance}
              currentMemberAvailableBalance={currentMemberAvailableBalance}
              currentMemberPlayers={currentMemberPlayers}
              playerContracts={activePlayerContracts}
              playerOffers={firebasePlayerOffers}
              freeAgentRegistrations={firebaseFreeAgentRegistrations}
              freePlayerStatus={firebaseFreePlayerStatus}
              freeAgentQueue={firebaseFreeAgentQueue}
              memberRestrictions={firebaseMemberRestrictions}
              currentMemberRestrictions={activeCurrentMemberRestrictions}
              transferHistory={firebaseTransferRows}
              allPlayerOffers={firebasePlayerOffers}
              allPlayers={players}
              notifications={currentMemberNotifications}
              pushStatus={pushStatus}
              pushBusy={pushBusy}
              onEnablePushNotifications={handleEnablePushNotifications}
              onDisablePushNotifications={handleDisablePushNotifications}
              onOpenNotification={openNotificationTarget}
              onClearNotifications={clearCurrentMemberNotifications}
              onCreateMoneyTransfer={createMoneyTransfer}
              onCreatePlayerOffer={createPlayerOffer}
              onUpdatePlayerOffer={updatePlayerOffer}
              onCancelPlayerOffer={cancelPlayerOffer}
              onAcceptOffer={acceptPlayerOffer}
              onRejectOffer={rejectPlayerOffer}
              onReleasePlayer={releasePlayerFromSquad}
              onTerminateLoan={terminateLoanContract}
              onRegisterFreeAgentFee={registerFreeAgentFee}
              isMarketOpen={transferMarketOpen}
              stats={selectedMemberStats}
              selectedMemberProCount={selectedMemberId ? countMemberProPlayers(selectedMemberId) : 0}
              allTournaments={allTournaments}
              statsMap={finalStatsByMember}
              search={search}
              setSearch={setSearch}
              onOpenView={openView}
              onInfo={setInfoModal}
              onOpenMyProfile={() => goPage("myProfile")}
              competitions={firebaseCompetitions}
              onOpenCompetition={(competitionId) => {
                setFocusedCompetitionId(competitionId);
                goPage("season", { seasonTab: "competitions" });
              }}
            />
          ) : null}

          {page === "season" && isEnabled(config.showSeasonTournaments) ? (
            <SeasonHubPage
              config={config}
              activeSeason={activeSeason}
              groups={seasonGroups}
              total={activeSeasonRows.length}
              members={members}
              competitions={firebaseCompetitions}
              financeRows={combinedFinance}
              trophyMap={trophyMap}
              currentMemberId={currentMemberId}
              focusedCompetitionId={focusedCompetitionId}
              rankingRows={seasonRanking}
              activeTab={seasonHubTab}
              onTabChange={setSeasonHubTab}
              onOpenView={openView}
              onOpenMember={openPublicMemberProfile}
            />
          ) : null}


          {page === "league" ? (
            <LeagueViewerPage
              config={config}
              competitions={firebaseCompetitions}
              trophyMap={trophyMap}
              currentMemberId={currentMemberId}
              focusedCompetitionId={focusedCompetitionId}
            />
          ) : null}

          {page === "archive" && isEnabled(config.showArchive) ? (
            <ArchivePage
              config={config}
              seasons={archiveSeasons}
              allTournaments={allTournaments}
              members={members}
              trophyMap={trophyMap}
              onOpenView={openView}
              defaultMode={archiveDefaultMode}
            />
          ) : null}

          {page === "ranking" && isEnabled(config.showRanking) ? (
            <RankingPage
              config={config}
              rows={seasonRanking}
              onOpenView={openView}
            />
          ) : null}

          {page === "stats" && isEnabled(config.showStats) ? (
            <GeneralStatsPage
              config={config}
              statsMap={finalStatsByMember}
              members={members}
              allTournaments={allTournaments}
              trophyMap={trophyMap}
              seasons={archiveSeasons}
              onOpenView={openView}
            />
          ) : null}

          {page === "transfers" && isEnabled(config.showTransfers) ? (
            <TransfersPage
              config={config}
              periods={transferPeriods}
              activePeriodId={activeTransferPeriod?.id || ""}
              setTransferPeriod={setTransferPeriod}
              rows={currentTransfers}
              players={players}
              members={members}
              currentMember={currentMember}
              currentMemberId={currentMemberId}
              playerContracts={activePlayerContracts}
              freeAgentQueue={firebaseFreeAgentQueue}
              onOpenView={openView}
            />
          ) : null}

          {page === "links" && isEnabled(config.showLinks) ? (
            <LinksPage config={config} links={importantLinks} />
          ) : null}

          {page === "fifaAdmin" && isFifaAdmin ? (
            <FifaAdminPage
              members={members}
              notifications={firebaseNotifications}
              moneyTransfers={firebaseMoneyTransfers}
              financeRows={combinedFinance}
              memberRestrictions={firebaseMemberRestrictions}
              adminDecisions={firebaseAdminDecisions}
              adminNotes={firebaseAdminNotes}
              pushTokens={firebasePushTokens}
              transferWindows={firebaseTransferWindows}
              playerOffers={firebasePlayerOffers}
              playerContracts={activePlayerContracts}
              transferHistory={firebaseTransferHistory}
              playerReleases={firebasePlayerReleases}
              isMarketOpen={transferMarketOpen}
              onSendNotification={createFifaAdminNotification}
              onCreateReward={createFifaAdminReward}
              onCreateDiscipline={createFifaAdminDiscipline}
              onCorrectMoneyTransfer={createFifaAdminMoneyCorrection}
              onCancelRestriction={cancelFifaAdminRestriction}
              onCreateAdminNote={createFifaAdminNote}
              onMarketControl={createFifaAdminMarketControl}
            />
          ) : null}

          {page === "leagueAdmin" && isFifaAdmin ? (
            <FifaLeagueAdminPage
              members={activeMembers}
              seasons={seasons}
              activeSeasonId={activeSeasonId}
              competitions={firebaseCompetitions}
              trophyMap={trophyMap}
              config={config}
              onCreateLeague={createFifaLeagueCompetition}
              onUpdateMatchResult={updateFifaLeagueMatchResult}
              onFinalizeLeague={finalizeFifaLeagueCompetition}
              onCancelCompetition={cancelFifaCompetition}
              onClearMatchResult={clearFifaLeagueMatchResult}
              onApplyAbsenceAction={applyFifaCompetitionAbsenceAction}
              onUpdateCompetitionNote={updateFifaCompetitionAdminNote}
              onUpdateTieBreakDecision={updateFifaCompetitionTieBreakDecision}
            />
          ) : null}
        </>
      )}

      <TopSystemBar
        title={topBarTitle}
        scrolled={topBarScrolled}
        unreadCount={unreadNotificationsCount}
        onNotificationsClick={() => setNotificationsOpen(true)}
        authProfile={authProfile}
        canGoBack={canShowTopBack}
        onBack={handleTopBack}
      />
      <BottomNav
        page={page}
        goPage={goPage}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        config={config}
      />
      <SideMenu
        open={menuOpen}
        setOpen={setMenuOpen}
        goPage={goPage}
        config={config}
        isFifaAdmin={isFifaAdmin}
        onLogout={handleLogout}
      />
      {infoModal ? (
        <InfoModal data={infoModal} onClose={() => setInfoModal(null)} />
      ) : null}
      {notificationsOpen ? (
        <NotificationsModal
          rows={topBarNotifications}
          members={members}
          currentMemberId={currentMemberId}
          pushStatus={pushStatus}
          pushBusy={pushBusy}
          onEnablePushNotifications={handleEnablePushNotifications}
          onDisablePushNotifications={handleDisablePushNotifications}
          onClose={() => setNotificationsOpen(false)}
          onOpenNotification={openNotificationTarget}
          onClearNotifications={clearCurrentMemberNotifications}
        />
      ) : null}
    </div>
  );
}


const finalMinorSafeCss = `
/* FINAL SAFE MINOR FIXES — built on App(129).jsx only */
.topSystemInner,
.topSystemInner.titleOnly{
  width:min(640px,100%)!important;
  height:34px!important;
  display:grid!important;
  grid-template-columns:36px minmax(0,1fr) 36px!important;
  align-items:center!important;
  gap:8px!important;
  direction:ltr!important;
  justify-items:stretch!important;
}
.topNotifyBtn{
  position:relative!important;
  right:auto!important;
  top:auto!important;
  transform:none!important;
  grid-column:1!important;
  width:38px!important;
  height:38px!important;
  border:1px solid rgba(255,255,255,.14)!important;
  border-radius:999px!important;
  background:rgba(255,255,255,.08)!important;
  color:#fff!important;
  display:grid!important;
  place-items:center!important;
}
.topSystemTitle{
  grid-column:2!important;
  width:100%!important;
  text-align:center!important;
}
.topSystemBackBtn,
.topSystemBackSpacer{
  grid-column:3!important;
  width:30px!important;
  height:30px!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}
.topSystemBackBtn{
  border:1px solid rgba(0,230,118,.28)!important;
  background:rgba(0,230,118,.10)!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  box-shadow:0 10px 26px rgba(0,0,0,.28),0 0 18px rgba(0,230,118,.10)!important;
  cursor:pointer!important;
  padding:0!important;
}
.topSystemBackBtn span{
  display:block!important;
  font-size:18px!important;
  line-height:18px!important;
  font-weight:1000!important;
  transform:translateX(1px)!important;
}
.topSystemBackBtn:active{transform:scale(.94)!important;}
.topSystemBackSpacer{visibility:hidden!important;}
.fgMenuBackdrop{
  background:rgba(0,0,0,.62)!important;
  backdrop-filter:blur(8px)!important;
  -webkit-backdrop-filter:blur(8px)!important;
}
.fgMenuPanel{
  background:linear-gradient(145deg,rgba(4,12,28,.97),rgba(6,15,34,.92))!important;
  border:1px solid rgba(0,230,118,.16)!important;
  box-shadow:0 40px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08)!important;
  font-family:'Tajawal',Arial,sans-serif!important;
}
.fgMenuHeader h2{
  background:linear-gradient(135deg,#fff 42%,#00E676)!important;
  -webkit-background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  background-clip:text!important;
}
.fgMenuItem{
  background:linear-gradient(145deg,rgba(4,12,28,.86),rgba(6,15,34,.74))!important;
  border:1px solid rgba(0,230,118,.13)!important;
  color:#EDF0FF!important;
}
.fgMenuItem:active{border-color:rgba(0,230,118,.34)!important;background:rgba(0,230,118,.10)!important;}
.fgMenuIcon{background:rgba(0,230,118,.10)!important;border-color:rgba(0,230,118,.20)!important;}
@media(max-width:720px){
  .topSystemInner,.topSystemInner.titleOnly{grid-template-columns:34px minmax(0,1fr) 34px!important;height:32px!important;}
  .topNotifyBtn{width:34px!important;height:34px!important;}
  .topSystemBackBtn,.topSystemBackSpacer{width:28px!important;height:28px!important;}
}
`;

const moneyCss = `
.memberActionPanel{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0;padding:14px;border-radius:22px}.memberActionPanel div{min-width:0;text-align:right}.memberActionPanel b{display:block;font-size:16px;color:#ecfeff;margin-bottom:4px}.memberActionPanel small{display:block;color:#a8b3c7;font-weight:800;line-height:1.45}.memberActionPanel button{min-width:132px;height:44px;border:0;border-radius:999px;cursor:pointer;color:#020617;font-weight:1000;background:linear-gradient(135deg,var(--cyan),var(--blue));box-shadow:0 14px 34px rgba(0,229,255,.18)}.memberActionPanel button:disabled{opacity:.45;cursor:not-allowed;filter:grayscale(.4)}.moneyModalBackdrop{position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.58);display:grid;place-items:center;padding:16px}.moneyTransferModal{width:min(430px,100%);border-radius:28px;padding:18px;color:#f8fafc;direction:rtl;font-family:Tahoma,Arial,sans-serif}.moneyTransferModal header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.moneyTransferModal header small{display:block;color:var(--cyan);font-weight:1000;margin-bottom:4px}.moneyTransferModal header h3{margin:0;font-size:25px}.moneyTransferModal header button{width:38px;height:38px;border:0;border-radius:999px;color:white;background:rgba(255,255,255,.10);font-size:24px;cursor:pointer}.moneyBalanceBox{border-radius:20px;padding:12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.moneyBalanceBox span{color:#a8b3c7;font-weight:900}.moneyBalanceBox b{font-size:26px;color:#ecfeff;direction:ltr}.moneyField{display:block;text-align:right;margin-bottom:10px}.moneyField span{display:block;color:#dbeafe;font-size:13px;font-weight:1000;margin-bottom:7px}.moneyField input,.moneyField select{width:100%;height:48px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:#0b1224;color:white;outline:none;padding:0 12px;font-weight:900}.moneyRecipientPreview{min-height:62px;border-radius:18px;padding:10px;display:flex;align-items:center;gap:10px;margin-bottom:10px}.moneyRecipientPreview img{width:42px;height:42px;border-radius:14px;background:white;object-fit:cover}.moneyRecipientPreview b,.moneyRecipientPreview small{display:block;text-align:right}.moneyRecipientPreview small{color:#a8b3c7;margin-top:3px}.moneyModalMessage{margin:8px 0 10px;padding:10px;border-radius:16px;background:rgba(255,255,255,.08);color:#e0f2fe;font-weight:900;text-align:center}.moneySubmitBtn{width:100%;height:50px;border:0;border-radius:18px;cursor:pointer;color:#020617;font-weight:1000;background:linear-gradient(135deg,var(--cyan),var(--blue))}.moneySubmitBtn:disabled{opacity:.6;cursor:not-allowed}.playerCard.hasOfferAction{position:relative;grid-template-columns:62px 1fr 48px;min-height:96px;overflow:hidden;padding-bottom:10px}.playerCard.hasOfferAction .playerOfferButton{height:28px;border:0;border-radius:999px;color:#020617;font-size:10px;font-weight:1000;cursor:pointer;padding:0 8px;background:linear-gradient(135deg,var(--cyan),var(--blue));box-shadow:0 8px 18px rgba(0,229,255,.12);white-space:nowrap}.playerOfferActions{position:absolute;right:86px;left:66px;bottom:12px;display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;z-index:2}.playerOfferActions.oneAction{left:66px}.playerOfferActions .playerOfferButton{flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis}.playerOfferButton.edit{background:linear-gradient(135deg,#facc15,#fb923c)!important}.playerOfferButton.cancel{background:linear-gradient(135deg,#fecaca,#fb7185)!important}.topNotifyBtn{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.08);color:white;display:grid;place-items:center;cursor:pointer}.topNotifyBtn span{position:absolute;top:-4px;left:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ef4444;color:white;font-size:10px;font-weight:1000;display:grid;place-items:center}.notificationsPanel{margin:14px 0;padding:14px;border-radius:22px}.notificationsHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.notificationsHead b{font-size:17px;color:#ecfeff}.notificationsHeadActions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.notificationsHead small{color:var(--cyan);font-weight:1000}.enableDeviceNotifyBtn{height:30px;border:1px solid rgba(0,230,118,.24);border-radius:999px;background:rgba(0,230,118,.10);color:#a8f0cd;font-weight:1000;font-size:11px;padding:0 10px;cursor:pointer}.enableDeviceNotifyBtn.active{background:rgba(34,197,94,.16);border-color:rgba(34,197,94,.35);color:#bbf7d0}.enableDeviceNotifyBtn:disabled{opacity:.65;cursor:not-allowed}.pushNotifyBox{margin:0 0 10px;padding:10px 12px;border-radius:18px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.pushNotifyBox b,.pushNotifyBox small{display:block}.pushNotifyBox b{color:#ecfeff;font-size:13px;margin-bottom:4px}.pushNotifyBox small{color:#a8b3c7;line-height:1.45;font-weight:800}.pushNotifyBox.active{border-color:rgba(34,197,94,.32);background:rgba(34,197,94,.10)}.pushNotifyBox.error{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.10)}.pushNotifyBox.error small{color:#fecaca}.notificationsList{display:grid;gap:8px}.notificationItem{border-radius:18px;padding:11px;background:rgba(2,6,23,.28);border:1px solid rgba(0,230,118,.18)}.notificationItem.read{opacity:.68}.notificationItem b,.notificationItem p,.notificationItem small{display:block;margin:0}.notificationItem p{color:#cbd5e1;font-size:12px;line-height:1.45;margin-top:5px}.notificationItem small{color:#94a3b8;margin-top:6px}.notificationsModalBackdrop{position:fixed;inset:0;z-index:2147483643;background:rgba(0,0,0,.62);display:grid;place-items:center;padding:16px}.notificationsModal{width:min(520px,100%);max-height:min(88vh,760px);overflow:auto;border-radius:30px;padding:18px;color:#f8fafc;font-family:Tahoma,Arial,sans-serif}.notificationsModal>header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.notificationsModal>header small{display:block;color:var(--cyan);font-weight:1000}.notificationsModal>header h3{margin:0;font-size:25px}.notificationsModal>header button{width:38px;height:38px;border:0;border-radius:999px;background:rgba(255,255,255,.10);color:white;font-size:24px;cursor:pointer}.offerModalBackdrop{position:fixed;inset:0;z-index:2147483642;background:rgba(0,0,0,.62);display:grid;place-items:center;padding:16px}.playerOfferModal{width:min(560px,100%);max-height:min(92vh,820px);overflow:auto;border-radius:30px;padding:18px;color:#f8fafc;direction:rtl;font-family:Tahoma,Arial,sans-serif}.playerOfferModal header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.playerOfferModal header small{display:block;color:var(--cyan);font-weight:1000;margin-bottom:4px}.playerOfferModal header h3{margin:0;font-size:25px}.playerOfferModal header button{width:38px;height:38px;border:0;border-radius:999px;color:white;background:rgba(255,255,255,.10);font-size:24px;cursor:pointer}.offerTargetPlayer{display:grid;grid-template-columns:58px 1fr 54px;gap:12px;align-items:center;border-radius:22px;padding:12px;margin-bottom:10px}.offerTargetPlayer img{width:58px;height:58px;border-radius:18px;background:rgba(255,255,255,.08);object-fit:contain}.offerTargetPlayer b,.offerTargetPlayer small{display:block}.offerTargetPlayer small{color:#a8b3c7;margin-top:4px}.offerTargetPlayer strong{width:48px;height:48px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617}.offerBalanceRow{display:flex;align-items:center;justify-content:space-between;border-radius:18px;padding:11px 12px;margin-bottom:10px}.offerBalanceRow span{color:#a8b3c7;font-weight:900}.offerBalanceRow b{font-size:22px;direction:ltr;color:#ecfeff}.offerField{display:block;margin-bottom:10px;text-align:right}.offerField>span,.offerOwnPlayersHead span{display:block;color:#dbeafe;font-size:13px;font-weight:1000;margin-bottom:7px}.offerField input,.offerField select,.offerField textarea{width:100%;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:#0b1224;color:white;outline:none;padding:0 12px;font-weight:900}.offerField input,.offerField select{height:46px}.offerField textarea{min-height:74px;padding:12px;resize:vertical}.offerSegmented{display:grid;grid-template-columns:1fr 1fr;gap:8px}.offerSegmented button{height:44px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:white;font-weight:1000;cursor:pointer}.offerSegmented button.active{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;border-color:transparent}.offerOwnPlayers{margin:10px 0}.offerOwnPlayersHead{display:flex;align-items:center;justify-content:space-between}.offerOwnPlayersHead small{color:var(--cyan);font-weight:1000}.offerOwnPlayersGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:210px;overflow:auto;padding:2px}.offerOwnPlayer{min-width:0;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.28);color:white;padding:8px;display:flex;align-items:center;gap:8px;text-align:right;cursor:pointer}.offerOwnPlayer.active{border-color:rgba(0,230,118,.55);background:rgba(0,230,118,.14)}.offerOwnPlayer img{width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.08);object-fit:contain}.offerOwnPlayer b,.offerOwnPlayer small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.offerOwnPlayer small{color:#a8b3c7;margin-top:3px}.offerSummary{border-radius:18px;padding:11px 12px;margin:8px 0 10px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.offerSummary span{color:#a8b3c7;font-weight:900}.offerSummary b{color:#ecfeff;direction:ltr}.offerSummary b.danger{color:#fecaca}.offerSubmitBtn{width:100%;height:50px;border:0;border-radius:18px;cursor:pointer;color:#020617;font-weight:1000;background:linear-gradient(135deg,var(--cyan),var(--blue))}.offerSubmitBtn:disabled{opacity:.6;cursor:not-allowed}@media(max-width:720px){.playerCard.hasOfferAction{min-height:84px;grid-template-columns:54px minmax(0,1fr) 52px;overflow:hidden}.playerOfferActions{right:72px;left:60px;bottom:10px}.offerModalBackdrop{align-items:end;padding:10px}.playerOfferModal{border-radius:28px 28px 0 0;max-height:88vh}.offerOwnPlayersGrid{grid-template-columns:1fr}.memberActionPanel{align-items:stretch;display:grid;gap:10px}.memberActionPanel button{width:100%;min-width:0}}
.transferSummaryStrip{display:grid;grid-template-columns:1fr auto 1fr auto;gap:10px;align-items:center;margin-top:12px;padding:12px 14px;border-radius:20px}.transferSummaryStrip span{color:#a8b3c7;font-weight:900;font-size:12px}.transferSummaryStrip b{min-width:38px;height:30px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000}.transferSearchBox{display:grid;gap:7px;margin-top:10px;padding:11px 12px;border-radius:18px}.transferSearchBox span{color:#dbeafe;font-size:12px;font-weight:1000}.transferSearchBox input{width:100%;height:42px;border-radius:15px;border:1px solid rgba(255,255,255,.14);background:rgba(2,6,23,.45);color:white;outline:none;padding:0 12px;font-weight:900}.freeAgentsTransferSection{margin-top:16px;padding:14px;border-radius:24px}.freeAgentsTransferSection .sectionHead strong{min-width:42px;height:34px;display:grid;place-items:center;border-radius:14px;background:rgba(0,230,118,.12);color:#a8f0cd}.freeAgentsGrid{margin-top:10px;width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;display:grid;gap:8px}.freeAgentsGrid .tmCard{width:100%;max-width:100%;box-sizing:border-box}@media(max-width:720px){.transferSummaryStrip{grid-template-columns:1fr auto}.freeAgentsTransferSection{padding:12px}}.clickableNotification{width:100%;text-align:right;color:white;cursor:pointer}.disabledNotification{cursor:default;opacity:.55;filter:grayscale(.15)}.playerOwnerTools{margin-top:14px;padding:14px;border-radius:24px}.playerOwnerToolsHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.playerOwnerToolsHead b{display:block;color:#ecfeff;font-size:18px}.playerOwnerToolsHead small{display:block;color:#a8b3c7;margin-top:4px;font-weight:800}.freeAgentFeeBtn{background:linear-gradient(135deg,#67e8f9,#22c55e)!important}.playerReleaseBtn{height:42px;border:0;border-radius:999px;padding:0 14px;cursor:pointer;font-weight:1000;color:#020617;background:linear-gradient(135deg,#fecaca,#fb7185)}.incomingOffersBox h3{margin:10px 0 12px;font-size:20px}.incomingOffersList{display:grid;gap:10px}.incomingOfferCard{border-radius:20px;padding:12px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.incomingOfferTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.incomingOfferTop b{font-size:17px;color:#ecfeff}.incomingOfferTop span{height:28px;border-radius:999px;padding:0 10px;display:inline-flex;align-items:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#a8f0cd;font-weight:1000;font-size:12px}.incomingOfferMeta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.incomingOfferMeta span{border-radius:14px;background:rgba(255,255,255,.06);padding:9px;min-width:0}.incomingOfferMeta small,.incomingOfferMeta strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.incomingOfferMeta small{color:#94a3b8;font-size:11px}.incomingOfferMeta strong{color:#ecfeff;margin-top:4px;direction:ltr}.incomingOfferedPlayers{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.incomingOfferedPlayers span{border-radius:999px;padding:5px 9px;background:rgba(255,255,255,.08);color:#e0f2fe;font-weight:900;font-size:12px}.incomingOfferNotes{margin:9px 0 0;color:#cbd5e1;font-size:12px;line-height:1.45}.incomingOfferActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.incomingOfferActions button{height:40px;border:0;border-radius:14px;font-weight:1000;cursor:pointer;color:#020617}.incomingOfferActions .accept{background:linear-gradient(135deg,#86efac,#22c55e)}.incomingOfferActions .reject{background:linear-gradient(135deg,#fecaca,#fb7185)}.fgConfirmBackdrop{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.64);display:grid;place-items:center;padding:16px}.fgConfirmBox{width:min(390px,100%);border-radius:28px;padding:20px;color:#f8fafc;text-align:center;font-family:Tahoma,Arial,sans-serif}.fgConfirmIcon{width:52px;height:52px;margin:0 auto 10px;border-radius:18px;display:grid;place-items:center;font-weight:1000;color:#020617;background:linear-gradient(135deg,var(--cyan),var(--blue));font-size:24px}.fgConfirmIcon.danger{background:linear-gradient(135deg,#fecaca,#fb7185)}.fgConfirmIcon.success{background:linear-gradient(135deg,#86efac,#22c55e)}.fgConfirmBox h3{margin:0 0 8px;font-size:22px}.fgConfirmBox p{margin:0;color:#cbd5e1;line-height:1.6;font-size:14px}.fgConfirmActions{display:grid;grid-template-columns:1fr 1.2fr;gap:8px;margin-top:16px}.fgConfirmActions button{height:44px;border:0;border-radius:16px;font-weight:1000;cursor:pointer}.fgConfirmActions .secondary{background:rgba(255,255,255,.10);color:white;border:1px solid rgba(255,255,255,.14)}.fgConfirmActions .primary{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617}.fgConfirmActions .danger{background:linear-gradient(135deg,#fecaca,#fb7185);color:#020617}@media(max-width:720px){.playerOwnerToolsHead{display:grid}.playerReleaseBtn{width:100%}.incomingOfferMeta{grid-template-columns:1fr}.incomingOfferActions{grid-template-columns:1fr}}.profileImageExportBtn{position:absolute;left:16px;bottom:16px;width:42px;height:42px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000;font-size:22px;display:grid;place-items:center;cursor:pointer;box-shadow:0 14px 32px rgba(0,0,0,.28)}.simpleCompetitionItem{min-height:58px!important;justify-content:center!important;text-align:center!important}.simpleCompetitionItem b{font-size:18px!important;color:#ecfeff}.competitionStatsBox .statsPanelGrid.compactStats{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.competitionTypeShell{padding:16px!important}.competitionTypeGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:10px}.competitionTypeCard{min-height:148px;border:1px solid rgba(255,255,255,.13);border-radius:26px;background:linear-gradient(145deg,rgba(0,230,118,.08),rgba(4,12,28,.80));display:grid;place-items:center;gap:8px;color:#ecfeff;cursor:pointer;text-align:center;padding:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}.competitionTypeCard.active{border-color:rgba(0,230,118,.48);background:linear-gradient(145deg,rgba(0,230,118,.18),rgba(4,12,28,.90));transform:translateY(-1px)}.competitionTypeIcon{width:62px;height:62px;border-radius:20px;object-fit:cover;display:grid;place-items:center;background:rgba(255,255,255,.10);font-size:34px}.competitionTypeCard b{font-size:18px}.competitionTypeCard small{color:#a8b3c7;font-weight:900}.competitionInstanceList{display:grid;gap:10px;margin-top:14px}.competitionInstanceCard{display:flex;align-items:center;gap:12px;width:100%;min-height:74px;padding:12px 14px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.30);color:#fff;text-align:right;cursor:pointer}.competitionInstanceCard.active{border-color:rgba(0,230,118,.42);background:rgba(0,230,118,.10)}.competitionInstanceIcon{width:46px;height:46px;border-radius:16px;object-fit:cover;display:grid;place-items:center;background:rgba(255,255,255,.10);font-size:24px;flex:0 0 auto}.competitionInstanceCard div{min-width:0;display:grid;gap:4px}.competitionInstanceCard b{font-size:17px;color:#ecfeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.competitionInstanceCard small{color:#94a3b8;font-weight:900;font-size:12px}.competitionDetailHead{display:flex!important;align-items:center;gap:12px}.competitionDetailIcon{width:60px;height:60px;border-radius:20px;object-fit:cover;display:grid;place-items:center;background:rgba(255,255,255,.10);font-size:30px;flex:0 0 auto}.leagueMatchActions{display:grid;gap:6px}.dangerMiniBtn{background:linear-gradient(135deg,#fecaca,#fb7185)!important;color:#020617!important}.adminCompetitionInstanceList{max-height:520px;overflow:auto}.fallbackCompetitionIcon{line-height:1}@media(max-width:720px){.profileImageExportBtn{left:12px;bottom:12px;width:38px;height:38px}.competitionStatsBox .statsPanelGrid.compactStats{grid-template-columns:repeat(2,minmax(0,1fr))}}.offerCenterActions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.offerCenterActions button{height:34px;border:0;border-radius:12px;padding:0 12px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000}.offerCenterActions button.danger{background:linear-gradient(135deg,#fecaca,#fb7185)}.managedOfferCard{align-items:center}
.enableDeviceNotifyBtn.stop{background:linear-gradient(135deg,#fecaca,#fb7185)!important;color:#020617}.transferRestrictionBanner{margin:12px 0;padding:13px 14px;border-radius:20px;border:1px solid rgba(248,113,113,.28);background:rgba(127,29,29,.20)}.transferRestrictionBanner b{display:block;color:#fecaca;margin-bottom:7px}.transferRestrictionBanner p{margin:4px 0;color:#fee2e2;font-weight:900;font-size:12px;line-height:1.5}.restrictionChecks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.restrictionChecks label{display:flex;gap:7px;align-items:center;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:10px;color:#e0f2fe;font-weight:900;font-size:12px}.adminDisciplineBox{margin-top:0}@media(max-width:720px){.restrictionChecks{grid-template-columns:1fr}}.fifaAdminShell{display:grid;gap:14px}.fifaAdminHero{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px;border-radius:28px}.fifaAdminHero h2{margin:2px 0 6px;font-size:30px;color:#f8fafc}.fifaAdminHero p{margin:0;color:#a8b3c7;font-weight:800;line-height:1.55}.fifaAdminHero strong{width:62px;height:62px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));font-size:30px}.adminGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.adminForm{display:grid;gap:10px}.adminForm textarea{width:100%;min-height:86px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:#0b1224;color:white;outline:none;padding:12px;font-weight:900;resize:vertical}.adminMessage{padding:12px 14px;border-radius:18px;color:#e0f2fe;font-weight:1000;text-align:center;border:1px solid rgba(0,230,118,.18)}.adminRecentBox h3{margin:0 0 10px;color:#e0f2fe}.sectionHead.compact{margin-bottom:0}.sectionHead.compact h3{margin:0}.sectionHead.compact p{margin:4px 0 0}@media(max-width:720px){.adminGrid{grid-template-columns:1fr}.fifaAdminHero h2{font-size:25px}.fifaAdminHero{align-items:flex-start}.fifaAdminHero strong{width:52px;height:52px}}
`;

const dealCss = `
.transferContractBtn{grid-column:1/-1;height:38px;border:1px solid rgba(0,230,118,.24);border-radius:999px;background:rgba(0,230,118,.10);color:#a8f0cd;font-weight:1000;cursor:pointer}.transferContractBtn:hover{background:rgba(0,229,255,.20)}.transferContractModal{width:min(560px,100%);max-height:min(92vh,820px);overflow:auto;border-radius:30px;padding:18px;color:#f8fafc;font-family:Tahoma,Arial,sans-serif}.transferContractModal header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.transferContractModal header small{display:block;color:var(--cyan);font-weight:1000;margin-bottom:4px}.transferContractModal header h3{margin:0;font-size:25px}.transferContractModal header button{width:38px;height:38px;border:0;border-radius:999px;color:white;background:rgba(255,255,255,.10);font-size:24px;cursor:pointer}.transferContractCard{position:relative;overflow:hidden;border-radius:28px;padding:18px;margin-bottom:12px}.contractWatermark{position:absolute;left:16px;top:10px;font-size:92px;font-weight:1000;color:rgba(255,255,255,.035);letter-spacing:-6px}.contractTopLine{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.contractTopLine span{color:#a8b3c7;font-weight:900}.contractTopLine b{height:32px;border-radius:999px;padding:0 12px;display:inline-flex;align-items:center;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.24);color:#cffafe}.contractPlayerBlock{display:grid;grid-template-columns:78px 1fr 58px;gap:12px;align-items:center;border-radius:22px;padding:12px;background:rgba(2,6,23,.24);border:1px solid rgba(255,255,255,.10)}.contractPlayerBlock img{width:78px;height:78px;border-radius:22px;object-fit:contain;background:rgba(255,255,255,.08)}.contractPlayerBlock h2{margin:0;font-size:28px;line-height:1.15}.contractPlayerBlock p{margin:6px 0 0;color:#a8b3c7;font-weight:900}.contractPlayerBlock strong{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-size:24px;font-weight:1000}.contractRoute{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:12px 0}.contractRoute>div{border-radius:18px;padding:12px;background:rgba(255,255,255,.06);text-align:center}.contractRoute span{color:var(--cyan);font-weight:1000;font-size:24px}.contractRoute small,.contractMetaGrid small,.contractSignatures small{display:block;color:#94a3b8;font-size:12px;font-weight:900}.contractRoute b,.contractMetaGrid b{display:block;color:#f8fafc;margin-top:5px;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.contractMetaGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.contractMetaGrid div{border-radius:16px;padding:10px;background:rgba(255,255,255,.055);text-align:center}.contractSwapPlayers{margin-top:12px;border-radius:18px;padding:10px;background:rgba(255,255,255,.055)}.contractSwapPlayers>small{display:block;color:#94a3b8;font-weight:900;margin-bottom:8px}.contractSwapPlayers>div{display:flex;gap:8px;flex-wrap:wrap}.contractSwapPlayers span{display:flex;align-items:center;gap:6px;border-radius:999px;background:rgba(255,255,255,.08);padding:5px 9px}.contractSwapPlayers img{width:28px;height:28px;border-radius:999px;object-fit:contain;background:rgba(255,255,255,.08)}.contractSwapPlayers b{color:#e0f2fe;font-size:12px}.contractSignatures{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.contractSignatures div{border-radius:18px;padding:12px;background:rgba(2,6,23,.22);border:1px solid rgba(255,255,255,.10);text-align:center}.contractSignatures span{display:block;width:80%;height:1px;margin:0 auto 8px;background:rgba(255,255,255,.24)}.contractSignatures b{display:block;color:#e0f2fe;margin-bottom:4px}.playerTransferHistoryBox{margin-top:14px;padding:14px;border-radius:24px}.playerTransferHistoryList{display:grid;gap:8px}.playerTransferHistoryItem{border-radius:18px;padding:11px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);display:grid;gap:4px}.playerTransferHistoryItem span{color:#67e8f9;font-weight:1000;font-size:12px}.playerTransferHistoryItem b{color:#f8fafc}.playerTransferHistoryItem small{color:#a8b3c7;font-weight:900}@media(max-width:720px){.transferContractModal{border-radius:28px 28px 0 0;max-height:88vh}.contractPlayerBlock{grid-template-columns:64px 1fr 50px}.contractPlayerBlock img{width:64px;height:64px}.contractPlayerBlock h2{font-size:22px}.contractRoute,.contractMetaGrid,.contractSignatures{grid-template-columns:1fr}.contractRoute span{display:none}}.freeAgentUnavailable{opacity:.68;filter:saturate(.7)}.dealSummaryGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0 14px}.dealSummaryGrid div{border-radius:18px;padding:12px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);text-align:center}.dealSummaryGrid small{display:block;color:#94a3b8;font-weight:900;margin-bottom:6px}.dealSummaryGrid b{font-size:26px;color:#ecfeff}.dealSectionTitle{margin:16px 0 10px;color:#e0f2fe;font-size:17px}.memberDealList{display:grid;gap:9px}.memberDealCard{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:10px;align-items:center;border-radius:18px;padding:10px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.memberDealCard.offer{border-color:rgba(0,229,255,.18)}.memberDealCard img{width:54px;height:54px;border-radius:16px;object-fit:contain;background:rgba(255,255,255,.08)}.memberDealCard b,.memberDealCard small,.memberDealCard p{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}.memberDealCard b{color:#f8fafc;font-size:16px}.memberDealCard small{color:#67e8f9;font-weight:900;margin-top:3px}.memberDealCard p{color:#a8b3c7;font-size:12px;margin-top:4px}.memberDealCard strong{font-size:13px;color:#ecfeff;direction:ltr;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.transferSwapPreview{grid-column:1/-1;display:flex;gap:7px;flex-wrap:wrap;margin-top:2px}.transferSwapPreview span,.miniSwapPlayers span{display:inline-flex;align-items:center;gap:6px;max-width:100%;border-radius:999px;background:rgba(255,255,255,.08);padding:5px 8px;color:#e0f2fe;font-size:11px;font-weight:900}.transferSwapPreview img,.miniSwapPlayers img{width:26px;height:26px;border-radius:999px;object-fit:contain;background:rgba(255,255,255,.08)}.freeAgentFilters{margin:10px 0}.dealPeriodGroup{display:grid;gap:8px}.dealPeriodTitle{display:flex;align-items:center;justify-content:space-between;border-radius:16px;padding:9px 11px;background:rgba(0,230,118,.07);border:1px solid rgba(0,230,118,.16)}.dealPeriodTitle b{color:#e0f2fe}.dealPeriodTitle span{color:#67e8f9;font-size:12px;font-weight:1000}.miniSwapPlayers{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}@media(max-width:720px){.dealSummaryGrid{grid-template-columns:1fr 1fr}.memberDealCard{grid-template-columns:48px minmax(0,1fr);}.memberDealCard strong{grid-column:1/-1;max-width:none;text-align:center;background:rgba(255,255,255,.06);border-radius:12px;padding:7px}}
.adminTabs{display:flex;gap:8px;overflow:auto;padding:8px;border-radius:22px}.adminTabs button{height:38px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);color:#dbeafe;font-weight:1000;padding:0 13px;white-space:nowrap;cursor:pointer}.adminTabs button.active{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;border-color:transparent}.adminStatsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.adminStatBox,.adminDecisionCard{border-radius:18px;padding:12px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.adminStatBox{text-align:center}.adminStatBox small,.adminMonitorGrid small{display:block;color:#94a3b8;font-weight:900;margin-bottom:6px}.adminStatBox b,.adminMonitorGrid b{display:block;color:#ecfeff;font-size:22px}.adminHealthList{display:grid;gap:8px}.adminHealthList p{margin:0;border-radius:14px;background:rgba(255,255,255,.06);padding:10px;color:#cbd5e1}.adminHealthList b{color:#e0f2fe}.adminMonitorGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}.adminMonitorGrid div{border-radius:16px;padding:10px;background:rgba(255,255,255,.06);text-align:center}.inlineAdminBtn{margin-top:8px;height:32px;border:0;border-radius:999px;background:rgba(0,229,255,.16);color:#cffafe;font-weight:1000;padding:0 10px;cursor:pointer}.inlineAdminBtn.danger,.dangerBtn{background:linear-gradient(135deg,#fecaca,#fb7185)!important;color:#020617!important}.adminCheckLine{display:flex;align-items:center;gap:8px;color:#e0f2fe;font-weight:900;border-radius:16px;background:rgba(255,255,255,.06);padding:10px}.compactList{margin-top:10px}@media(max-width:720px){.adminStatsGrid,.adminMonitorGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.adminTabs{padding:6px}.adminTabs button{height:34px;padding:0 10px}}`;

const leagueAdminCss = `
.leagueAdminShell{display:grid;gap:14px}.leagueMembersGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:260px;overflow:auto;padding:2px}.leagueRewardGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.leagueRuleNote{border-radius:16px;border:1px solid rgba(0,230,118,.20);background:rgba(0,230,118,.07);padding:9px 10px;color:#cffafe;font-size:12px;font-weight:900;line-height:1.7}.adminCheckLine{display:flex;align-items:center;gap:8px;color:#e0f2fe;font-weight:900}.adminCheckLine input{width:18px;height:18px}.leagueMembersGrid.compact{max-height:none}.leagueMemberPick{display:flex;align-items:center;gap:8px;min-width:0;border-radius:16px;padding:9px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.28);color:#e0f2fe;font-weight:900;cursor:pointer}.leagueMemberPick.active{border-color:rgba(0,230,118,.45);background:rgba(0,230,118,.10)}.leagueMemberPick.relegated.active{border-color:rgba(248,113,113,.45);background:rgba(127,29,29,.20)}.leagueMemberPick img{width:34px;height:34px;border-radius:12px;object-fit:cover;background:rgba(255,255,255,.08)}.activeLeagueItem{border-color:rgba(0,230,118,.34)!important;background:rgba(0,230,118,.08)!important}.leagueSummaryStrip{display:grid;grid-template-columns:repeat(4,1fr auto);gap:8px;align-items:center;margin-top:10px}.leagueSummaryStrip span{color:#94a3b8;font-weight:900;font-size:12px}.leagueSummaryStrip b{min-height:32px;border-radius:13px;padding:6px 9px;display:grid;place-items:center;background:rgba(255,255,255,.07);color:#ecfeff}.leagueTable{display:grid;gap:6px;margin-top:10px;overflow:auto}.leagueTableHead,.leagueTableRow{display:grid;grid-template-columns:32px minmax(90px,1.6fr) repeat(8,minmax(42px,.55fr));gap:6px;align-items:center;min-width:620px}.leagueTableHead span{color:#67e8f9;font-weight:1000;font-size:11px;text-align:center}.leagueTableRow{border-radius:16px;padding:8px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.10)}.leagueTableRow span,.leagueTableRow b{text-align:center;color:#e2e8f0;font-weight:900}.leagueTableRow span:nth-child(2){text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.leagueTableRow.champion{border-color:rgba(250,204,21,.70);background:rgba(250,204,21,.10)}.leagueTableRow.qualified{border-color:rgba(34,197,94,.46);background:rgba(34,197,94,.11)}.leagueTableRow.relegated{border-color:rgba(248,113,113,.58);background:rgba(127,29,29,.20)}.leagueRoundsList{display:grid;gap:12px}.leagueRoundBox{border-radius:20px;padding:10px;background:rgba(2,6,23,.22);border:1px solid rgba(255,255,255,.10)}.leagueRoundBox h4{margin:0 0 8px;color:#e0f2fe}.leagueMatchesList{display:grid;gap:8px}.leagueMatchCard{display:grid;grid-template-columns:1.4fr minmax(92px,.7fr) auto minmax(92px,.6fr) auto;gap:8px;align-items:center;border-radius:16px;padding:9px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.10)}.leagueMatchCard.completed{border-color:rgba(0,230,118,.24);background:rgba(0,230,118,.07)}.leagueMatchTeams{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center}.leagueMatchTeams b{color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.leagueMatchTeams span{color:#67e8f9;font-weight:1000}.leagueMatchMeta{display:grid;gap:2px;justify-items:center}.leagueMatchMeta span{border-radius:999px;padding:5px 9px;background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.22);color:#67e8f9;font-weight:1000;font-size:11px}.leagueMatchMeta small{color:#94a3b8;font-size:10px}.leagueGameSelect{height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#0b1224;color:white;font-weight:900}.playoffBadge{display:inline-flex;margin-inline-start:6px;border-radius:999px;padding:2px 6px;background:rgba(251,191,36,.16);color:#fde68a;font-style:normal;font-size:10px}.leagueMatchScore{display:flex;align-items:center;gap:6px}.leagueMatchScore input{width:44px;height:36px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:#0b1224;color:white;text-align:center;font-weight:1000}.leagueMatchScore strong{color:#94a3b8}.leagueMatchCard button{height:36px;border:0;border-radius:13px;padding:0 12px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000;cursor:pointer}.leagueMatchCard button:disabled{opacity:.55;cursor:not-allowed} .leagueTableRow.absent{border-color:rgba(251,191,36,.42);background:rgba(113,63,18,.18)}.leagueMemberPick.absent.active{border-color:rgba(251,191,36,.48);background:rgba(113,63,18,.20)}.absentBadge{display:inline-flex;margin-inline-start:6px;border-radius:999px;padding:2px 6px;background:rgba(251,191,36,.16);color:#fde68a;font-style:normal;font-size:10px}.imageActionRow{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.imageActionRow button{height:38px;border:1px solid rgba(0,230,118,.24);border-radius:999px;background:rgba(0,230,118,.10);color:#a8f0cd;font-weight:1000;cursor:pointer;padding:0 12px}.imageActionRow button:disabled{opacity:.45;cursor:not-allowed}.seasonHubPage{display:grid;gap:14px}.seasonHubHero p{display:none}.seasonHubTabs{margin:0}.rankingList.compact{display:grid;gap:8px}.dangerZone{border-color:rgba(248,113,113,.22)!important}.moneySubmitBtn.danger{background:linear-gradient(135deg,#fecaca,#fb7185)!important}.leagueMatchScore.pens input{border-color:rgba(251,191,36,.28)}@media(max-width:720px){.leagueMembersGrid,.leagueRewardGrid{grid-template-columns:1fr}.leagueSummaryStrip{grid-template-columns:repeat(2,1fr auto)}.leagueMatchCard{grid-template-columns:1fr}.leagueMatchTeams{grid-template-columns:1fr auto 1fr}.leagueMatchCard button,.leagueGameSelect{width:100%}.imageActionRow{display:grid}.imageActionRow button{width:100%}}
`;

const authCss = `
.authShell{
  min-height:100vh;
  min-height:100dvh;
  width:100%;
  box-sizing:border-box;
  display:grid;
  place-items:center;
  padding:calc(18px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));
  color:#EDF0FF;
  font-family:'Tajawal',Arial,sans-serif;
  overflow:auto;
  background:
    radial-gradient(ellipse 320px 160px at 50% -2%,rgba(0,230,118,.11) 0%,transparent 65%),
    radial-gradient(circle at 8% 6%,rgba(0,230,118,.12) 0%,transparent 50%),
    radial-gradient(circle at 94% 10%,rgba(168,85,247,.08) 0%,transparent 50%),
    linear-gradient(135deg,#02030A 0%,#061225 48%,#02030A 100%);
}
.authCard{
  width:min(410px,calc(100vw - 28px));
  max-height:calc(100dvh - 36px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow:auto;
  box-sizing:border-box;
  border-radius:28px;
  padding:22px 18px 20px;
  text-align:center;
  background:linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.82));
  border:1px solid rgba(0,230,118,.18);
  box-shadow:0 0 60px rgba(0,230,118,.08),0 40px 80px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.09);
  backdrop-filter:blur(24px);
  -webkit-backdrop-filter:blur(24px);
}
.authLogo{
  width:68px;
  height:68px;
  margin:0 auto 12px;
  border-radius:22px;
  display:grid;
  place-items:center;
  color:#02030A;
  font-weight:1000;
  font-size:26px;
  letter-spacing:.5px;
  background:linear-gradient(135deg,#00E676,#00D4FF);
  box-shadow:0 0 46px rgba(0,230,118,.32),0 14px 30px rgba(0,0,0,.30);
  font-family:'Orbitron','Tajawal',sans-serif;
  overflow:hidden;
}
.authLogo.hasImage{
  background:rgba(2,6,23,.46);
  border:1px solid rgba(0,230,118,.22);
  padding:8px;
}
.authLogo img{
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
}
.authKicker{
  margin:0 0 5px;
  color:#00E676;
  font-weight:1000;
  letter-spacing:.8px;
  font-size:13px;
}
.authCard h1{
  margin:0;
  font-size:31px;
  line-height:1.08;
  font-weight:1000;
  font-family:'Orbitron','Tajawal',sans-serif;
  letter-spacing:.4px;
  background:linear-gradient(135deg,#fff 42%,#00E676);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.authSub{
  margin:9px auto 16px;
  color:#9BA0C0;
  line-height:1.55;
  font-weight:800;
  font-size:14px;
}
.authForm{
  display:grid;
  gap:10px;
}
.authForm label{
  display:grid;
  gap:7px;
  text-align:right;
}
.authForm span{
  color:#DDE7FF;
  font-size:13px;
  font-weight:1000;
}
.authForm input,
.authForm select{
  height:46px;
  border-radius:17px;
  border:1px solid rgba(0,230,118,.16);
  background:rgba(2,6,23,.62);
  color:#EDF0FF;
  outline:none;
  padding:0 14px;
  font-size:16px;
  font-family:'Tajawal',Arial,sans-serif;
}
.authForm input:focus,
.authForm select:focus{
  border-color:rgba(0,230,118,.42);
  box-shadow:0 0 0 3px rgba(0,230,118,.08);
}
.authForm select option{
  color:#020617;
}
.authForm button{
  height:48px;
  margin-top:4px;
  border:0;
  border-radius:18px;
  color:#02030A;
  font-size:16px;
  font-weight:1000;
  background:linear-gradient(135deg,#00E676,#00D4FF);
  cursor:pointer;
  font-family:'Tajawal',Arial,sans-serif;
  box-shadow:0 14px 30px rgba(0,230,118,.18);
}
.authForm button:disabled,
.authForgot:disabled{
  opacity:.65;
  cursor:not-allowed;
}
.authMessage{
  margin:0;
  padding:10px 12px;
  border-radius:14px;
  color:#fecaca;
  background:rgba(239,68,68,.12);
  border:1px solid rgba(239,68,68,.24);
  font-weight:900;
  line-height:1.5;
}
.authForgot,
.authSwitch{
  margin-top:13px;
  border:0;
  background:transparent;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-weight:1000;
  cursor:pointer;
  font-family:'Tajawal',Arial,sans-serif;
}
.authForgot{display:block;width:100%;color:#9AE6B4;-webkit-text-fill-color:#9AE6B4;}
.authMiniBadge{
  position:fixed;
  top:calc(48px + env(safe-area-inset-top));
  left:12px;
  z-index:2147483500;
  height:34px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:0 8px 0 12px;
  border-radius:999px;
  direction:rtl;
}
.authMiniBadge span{
  max-width:120px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  color:#e0f2fe;
  font-size:12px;
  font-weight:1000;
}
.authMiniBadge button{
  height:24px;
  border:0;
  border-radius:999px;
  padding:0 9px;
  background:rgba(255,255,255,.12);
  color:white;
  font-size:11px;
  font-weight:1000;
  cursor:pointer;
}
@media(max-width:720px){
  .authShell{align-items:center;}
  .authCard{border-radius:24px;padding:20px 16px;width:min(390px,calc(100vw - 24px));}
  .authCard h1{font-size:28px;}
  .authLogo{width:62px;height:62px;border-radius:20px;}
  .authSub{font-size:13px;margin-bottom:14px;}
  .authMiniBadge{top:calc(44px + env(safe-area-inset-top));left:8px;}
}
`;



async function loadCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CSV failed: ${url}`);
  return parseCSV(await response.text());
}

async function loadOptionalCSV(url) {
  if (!url) return [];
  try {
    return await loadCSV(url);
  } catch {
    return [];
  }
}


function buildConfig(rows) {
  const raw = { ...DEFAULT_CONFIG };
  rows.forEach((row) => {
    const key = normalizeKey(row.key || row.name || "");
    const value = row.value || row.val || "";
    if (key && value) raw[key] = value;
  });
  return {
    ...DEFAULT_CONFIG,
    mainTitle: raw.maintitle || raw.mainTitle || DEFAULT_CONFIG.mainTitle,
    seasonName: raw.seasonname || raw.seasonName || DEFAULT_CONFIG.seasonName,
    seasonTitle:
      raw.seasontitle || raw.seasonTitle || DEFAULT_CONFIG.seasonTitle,
    membersTitle:
      raw.memberstitle || raw.membersTitle || DEFAULT_CONFIG.membersTitle,
    seasonTournamentsTitle:
      raw.seasontournamentstitle ||
      raw.seasonTournamentsTitle ||
      DEFAULT_CONFIG.seasonTournamentsTitle,
    transfersTitle:
      raw.transferstitle || raw.transfersTitle || DEFAULT_CONFIG.transfersTitle,
    rankingTitle:
      raw.rankingtitle || raw.rankingTitle || DEFAULT_CONFIG.rankingTitle,
    linksTitle: raw.linkstitle || raw.linksTitle || DEFAULT_CONFIG.linksTitle,
    playersTitle:
      raw.playerstitle || raw.playersTitle || DEFAULT_CONFIG.playersTitle,
    trophiesTitle:
      raw.trophiestitle || raw.trophiesTitle || DEFAULT_CONFIG.trophiesTitle,
    financeTitle:
      raw.financetitle || raw.financeTitle || DEFAULT_CONFIG.financeTitle,
    archiveTitle:
      raw.archivetitle || raw.archiveTitle || DEFAULT_CONFIG.archiveTitle,
    statsTitle: raw.statstitle || raw.statsTitle || DEFAULT_CONFIG.statsTitle,
    maxProfessionalPlayers:
      raw.maxprofessionalplayers ||
      raw.maxProfessionalPlayers ||
      DEFAULT_CONFIG.maxProfessionalPlayers,
    transfersSubtitle:
      raw.transferssubtitle ||
      raw.transfersSubtitle ||
      DEFAULT_CONFIG.transfersSubtitle,
    rankingSubtitle:
      raw.rankingsubtitle ||
      raw.rankingSubtitle ||
      DEFAULT_CONFIG.rankingSubtitle,
    linksSubtitle:
      raw.linkssubtitle || raw.linksSubtitle || DEFAULT_CONFIG.linksSubtitle,
    searchPlaceholder:
      raw.searchplaceholder ||
      raw.searchPlaceholder ||
      DEFAULT_CONFIG.searchPlaceholder,
    loadingTitle:
      raw.loadingtitle || raw.loadingTitle || DEFAULT_CONFIG.loadingTitle,
    loadingSubtitle:
      raw.loadingsubtitle ||
      raw.loadingSubtitle ||
      DEFAULT_CONFIG.loadingSubtitle,
    noDataTitle:
      raw.nodatatitle || raw.noDataTitle || DEFAULT_CONFIG.noDataTitle,
    errorTitle: raw.errortitle || raw.errorTitle || DEFAULT_CONFIG.errorTitle,
    appStatus: raw.appstatus || raw.appStatus || DEFAULT_CONFIG.appStatus,
    maintenanceMessage:
      raw.maintenancemessage ||
      raw.maintenanceMessage ||
      DEFAULT_CONFIG.maintenanceMessage,
    showFinance:
      raw.showfinance || raw.showFinance || DEFAULT_CONFIG.showFinance,
    showRanking:
      raw.showranking || raw.showRanking || DEFAULT_CONFIG.showRanking,
    showTransfers:
      raw.showtransfers || raw.showTransfers || DEFAULT_CONFIG.showTransfers,
    showLinks: raw.showlinks || raw.showLinks || DEFAULT_CONFIG.showLinks,
    showSeasonTournaments:
      raw.showseasontournaments ||
      raw.showSeasonTournaments ||
      DEFAULT_CONFIG.showSeasonTournaments,
    showMemberTrophies:
      raw.showmembertrophies ||
      raw.showMemberTrophies ||
      DEFAULT_CONFIG.showMemberTrophies,
    showSearch: raw.showsearch || raw.showSearch || DEFAULT_CONFIG.showSearch,
    showArchive:
      raw.showarchive || raw.showArchive || DEFAULT_CONFIG.showArchive,
    showStats: raw.showstats || raw.showStats || DEFAULT_CONFIG.showStats,
    defaultPage:
      raw.defaultpage || raw.defaultPage || DEFAULT_CONFIG.defaultPage,
    activeSeasonId:
      raw.activeseasonid || raw.activeSeasonId || DEFAULT_CONFIG.activeSeasonId,
    primaryColor:
      raw.primarycolor || raw.primaryColor || DEFAULT_CONFIG.primaryColor,
    secondaryColor:
      raw.secondarycolor || raw.secondaryColor || DEFAULT_CONFIG.secondaryColor,
    accentColor:
      raw.accentcolor || raw.accentColor || DEFAULT_CONFIG.accentColor,
    headerImage:
      raw.headerimage || raw.headerImage || DEFAULT_CONFIG.headerImage,
    appIcon: raw.appicon || raw.appIcon || DEFAULT_CONFIG.appIcon,
    groupLogo: raw.grouplogo || raw.groupLogo || DEFAULT_CONFIG.groupLogo,
    exportLogo: raw.exportlogo || raw.exportLogo || DEFAULT_CONFIG.exportLogo,
    leagueLogo: raw.leaguelogo || raw.leagueLogo || raw.leagueicon || raw.leagueIcon || raw.dawrilogo || raw.dawriLogo || "",
    cupLogo: raw.cuplogo || raw.cupLogo || raw.cupicon || raw.cupIcon || "",
    superCupLogo: raw.supercuplogo || raw.superCupLogo || raw.supercupicon || raw.superCupIcon || "",
    championsLeagueLogo: raw.championsleaguelogo || raw.championsLeagueLogo || raw.championsleagueicon || raw.championsLeagueIcon || "",
    worldCupLogo: raw.worldcuplogo || raw.worldCupLogo || raw.worldcupicon || raw.worldCupIcon || "",
    leagueQualifierLogo: raw.leaguequalifierlogo || raw.leagueQualifierLogo || "",
    announcement: raw.announcement || DEFAULT_CONFIG.announcement,
    coverHeight:
      raw.coverheight || raw.coverHeight || DEFAULT_CONFIG.coverHeight,
    coverHeightMobile:
      raw.coverheightmobile || raw.coverHeightMobile || DEFAULT_CONFIG.coverHeightMobile,
    balanceIcon:
      raw.balanceicon || raw.balanceIcon || DEFAULT_CONFIG.balanceIcon,
    totalTrophiesIcon:
      raw.totaltrophiesicon ||
      raw.totalTrophiesIcon ||
      raw.trophiesicon ||
      raw.trophiesIcon ||
      DEFAULT_CONFIG.totalTrophiesIcon,
    navMembersIcon: raw.navmembersicon || raw.navMembersIcon || DEFAULT_CONFIG.navMembersIcon,
    navSeasonIcon: raw.navseasonicon || raw.navSeasonIcon || DEFAULT_CONFIG.navSeasonIcon,
    navArchiveIcon: raw.navarchiveicon || raw.navArchiveIcon || DEFAULT_CONFIG.navArchiveIcon,
    navRankingIcon: raw.navrankingicon || raw.navRankingIcon || DEFAULT_CONFIG.navRankingIcon,
    navMoreIcon: raw.navmoreicon || raw.navMoreIcon || DEFAULT_CONFIG.navMoreIcon,
    menuStatsIcon: raw.menustatsicon || raw.menuStatsIcon || DEFAULT_CONFIG.menuStatsIcon,
    menuTransfersIcon: raw.menutransfersicon || raw.menuTransfersIcon || DEFAULT_CONFIG.menuTransfersIcon,
    menuLinksIcon: raw.menulinksicon || raw.menuLinksIcon || DEFAULT_CONFIG.menuLinksIcon,
    memberTeamIcon: raw.memberteamicon || raw.memberTeamIcon || DEFAULT_CONFIG.memberTeamIcon,
    memberNationalIcon: raw.membernationalicon || raw.memberNationalIcon || DEFAULT_CONFIG.memberNationalIcon,
    finalsPlayedIcon: raw.finalsplayedicon || raw.finalsPlayedIcon || DEFAULT_CONFIG.finalsPlayedIcon,
    finalsWonIcon: raw.finalswonicon || raw.finalsWonIcon || DEFAULT_CONFIG.finalsWonIcon,
    finalsLostIcon: raw.finalslosticon || raw.finalsLostIcon || DEFAULT_CONFIG.finalsLostIcon,
    goalsForIcon: raw.goalsforicon || raw.goalsForIcon || DEFAULT_CONFIG.goalsForIcon,
    goalsAgainstIcon: raw.goalsagainsticon || raw.goalsAgainstIcon || DEFAULT_CONFIG.goalsAgainstIcon,
    relegationsIcon: raw.relegationsicon || raw.relegationsIcon || DEFAULT_CONFIG.relegationsIcon,
    seasonCountIcon: raw.seasoncounticon || raw.seasonCountIcon || DEFAULT_CONFIG.seasonCountIcon,
    seasonPointsIcon: raw.seasonpointsicon || raw.seasonPointsIcon || DEFAULT_CONFIG.seasonPointsIcon,
    rankingTitlesIcon: raw.rankingtitlesicon || raw.rankingTitlesIcon || DEFAULT_CONFIG.rankingTitlesIcon,
    rankingPointsIcon: raw.rankingpointsicon || raw.rankingPointsIcon || DEFAULT_CONFIG.rankingPointsIcon,
    transferAmountIcon: raw.transferamounticon || raw.transferAmountIcon || DEFAULT_CONFIG.transferAmountIcon,
    transferTypeIcon: raw.transfertypeicon || raw.transferTypeIcon || DEFAULT_CONFIG.transferTypeIcon,
    transferDateIcon: raw.transferdateicon || raw.transferDateIcon || DEFAULT_CONFIG.transferDateIcon,
    transferNoteIcon: raw.transfernoteicon || raw.transferNoteIcon || DEFAULT_CONFIG.transferNoteIcon,
    linkFacebookIcon: raw.linkfacebookicon || raw.linkFacebookIcon || DEFAULT_CONFIG.linkFacebookIcon,
    linkTournamentsIcon: raw.linktournamentsicon || raw.linkTournamentsIcon || DEFAULT_CONFIG.linkTournamentsIcon,
    linkSeasonIcon: raw.linkseasonicon || raw.linkSeasonIcon || DEFAULT_CONFIG.linkSeasonIcon,
    linkDefaultIcon: raw.linkdefaulticon || raw.linkDefaultIcon || DEFAULT_CONFIG.linkDefaultIcon,
    memberCardTrophyIcon: raw.membercardtrophyicon || raw.memberCardTrophyIcon || DEFAULT_CONFIG.memberCardTrophyIcon,
    archiveTrophyTabIcon: raw.archivetrophytabicon || raw.archiveTrophyTabIcon || DEFAULT_CONFIG.archiveTrophyTabIcon,
    archiveSeasonTabIcon: raw.archiveseasontabicon || raw.archiveSeasonTabIcon || DEFAULT_CONFIG.archiveSeasonTabIcon,
    archiveMemberTabIcon: raw.archivemembertabicon || raw.archiveMemberTabIcon || DEFAULT_CONFIG.archiveMemberTabIcon,
  };
}






const css = `
*{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;width:100%;background:#020617;overflow-x:hidden;touch-action:pan-y;overscroll-behavior-x:none}button,input{font-family:inherit}.app{min-height:100vh;padding:14px 14px calc(102px + env(safe-area-inset-bottom));color:#f8fafc;font-family:Tahoma,Arial,sans-serif;background:#020617;position:relative;overflow-x:hidden}.app:before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(circle at 12% 4%,rgba(0,229,255,.18),transparent 28%),radial-gradient(circle at 92% 8%,rgba(139,92,246,.16),transparent 30%),linear-gradient(135deg,#020617 0%,#07111f 48%,#030712 100%)}.app>*{position:relative;z-index:1}.bgOrb{position:fixed;border-radius:999px;filter:blur(12px);opacity:.2;z-index:0;pointer-events:none}.bgOrbOne{width:280px;height:280px;background:rgba(0,229,255,.16);top:80px;left:60px}.bgOrbTwo{width:260px;height:260px;background:rgba(139,92,246,.13);top:80px;right:40px}.glass{background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.055));border:1px solid rgba(255,255,255,.18);box-shadow:0 26px 90px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.22);backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%)}.glassSoft{background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.045));border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 55px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.15);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%)}.mainHero{max-width:1180px;height:226px;margin:0 auto 14px;border-radius:34px;display:flex;align-items:flex-end;padding:28px;text-align:right;overflow:hidden;position:relative}.mainHero.hasCoverImage{padding:0}.coverImage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.coverContent{width:100%;display:flex;align-items:center;justify-content:space-between;gap:18px}.heroKicker{display:flex;align-items:center;gap:8px;color:var(--cyan);font-weight:900;letter-spacing:3px;font-size:13px}.heroKicker span{width:10px;height:10px;border-radius:999px;background:var(--cyan);box-shadow:0 0 22px var(--cyan)}.mainHero h1{margin:8px 0 4px;font-size:56px;line-height:1.02;letter-spacing:1px;font-weight:1000}.mainHero p{margin:0;font-size:24px;font-weight:900;color:#dff7ff}.coverIconBox{width:92px;height:92px;border-radius:26px;display:grid;place-items:center;overflow:hidden;border:2px solid rgba(255,255,255,.26);background:rgba(255,255,255,.08)}.coverIconBox img{width:100%;height:100%;object-fit:cover}.coverIconBox b{font-size:30px;color:#020617;background:linear-gradient(135deg,var(--cyan),var(--blue));width:100%;height:100%;display:grid;place-items:center}.announcement{max-width:1180px;margin:0 auto 12px;padding:12px 16px;border-radius:18px;text-align:center;font-weight:900}.widePage,.membersHome,.memberProfilePage{max-width:1180px;margin:0 auto;border-radius:32px;padding:20px;overflow:hidden}.pageHead{margin-bottom:18px}.pageHead h2{margin:0;font-size:32px;line-height:1.18;font-weight:1000}.pageHead p{margin:8px 0 0;color:#a8b3c7;font-size:15px;line-height:1.45;font-weight:800}.mainNav{position:fixed!important;left:50%;right:auto;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(94vw,520px);height:72px;margin:0;padding:7px;border-radius:24px;z-index:999;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;background:linear-gradient(135deg,rgba(15,23,42,.90),rgba(2,6,23,.78));border:1px solid rgba(255,255,255,.18);box-shadow:0 22px 70px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%)}.navBtn{height:58px;min-width:0;padding:5px 2px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px solid transparent;background:transparent;color:#cbd5e1;cursor:pointer;font-weight:1000}.navBtn .navIcon{font-size:20px;line-height:1}.navBtn .navLabel{width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9.5px}.navBtn.active{background:linear-gradient(135deg,rgba(0,229,255,.22),rgba(47,140,255,.26));border-color:rgba(0,229,255,.36);color:#ecfeff}.drawerBackdrop{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.48);display:flex;justify-content:flex-start;align-items:stretch}.sideDrawer{width:min(82vw,340px);height:100%;padding:18px;border-radius:0 28px 28px 0}.sideDrawer header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.sideDrawer header b{font-size:24px}.sideDrawer header button,.modalClose{width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.10);color:white;font-size:24px;cursor:pointer}.sideDrawer>button{width:100%;height:58px;margin-bottom:10px;border-radius:18px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);color:white;display:flex;align-items:center;gap:12px;padding:0 14px;cursor:pointer;text-align:right}.sideDrawer>button span{font-size:24px}.sideDrawer>button b{font-size:16px}.seasonMembersGrid,.listGrid,.rankingList{display:grid;gap:10px}.seasonMemberCard{height:88px;border-radius:22px;padding:10px 14px;border:0;color:white;cursor:pointer;display:grid;grid-template-columns:48px 62px minmax(0,1fr) 82px;gap:12px;align-items:center;text-align:right;direction:rtl;overflow:hidden}.seasonMemberRank{width:38px;height:38px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.12);color:#b9f7ff;font-size:15px;font-weight:1000}.seasonMemberCard img{width:62px;height:62px;border-radius:18px;object-fit:cover;background:white}.seasonMemberCard b,.seasonMemberCard small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seasonMemberCard b{font-size:22px;line-height:1.16}.seasonMemberCard small{font-size:14px;color:#a8b3c7;margin-top:5px}.seasonMemberCard em{height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:1000;color:#020617;background:linear-gradient(135deg,var(--cyan),var(--blue));font-size:22px;direction:ltr}.backToMembersBtn{height:38px;margin:0 0 14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#ecfeff;border-radius:999px;padding:0 16px;font-weight:900;cursor:pointer}.profileCard{min-height:146px;border-radius:28px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.22);padding:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;overflow:visible}.profileMain{display:flex;align-items:center;gap:16px;min-width:0}.profileMain>img{width:108px;height:108px;border-radius:32px;object-fit:cover;background:white;border:2px solid rgba(255,255,255,.28)}.profileMain h2{margin:0 0 8px;font-size:42px;line-height:1.2;font-weight:1000}.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{height:34px;display:inline-flex;align-items:center;max-width:190px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:#ecfeff;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.logos{display:flex;gap:10px}.logos button{border:0;background:transparent;padding:0;cursor:pointer}.logos img{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35))}.statGrid,.statsPanelGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:14px 0}.statCard{height:142px;border-radius:26px;padding:18px;display:grid;align-content:center;gap:9px;text-align:center;color:white;border:1px solid rgba(255,255,255,.14);cursor:default}.statCard.clickable{cursor:pointer}.statCard span{font-size:28px}.statCard b{font-size:34px;color:#ecfeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr;unicode-bidi:plaintext}.statCard small{font-size:14px;color:#d7e3f5;font-weight:900}.tabs{display:flex;gap:10px;align-items:center;margin:14px 0;overflow-x:auto}.tabBtn{height:38px;padding:0 17px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:white;cursor:pointer;font-weight:1000;white-space:nowrap}.tabBtn.active{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;border-color:transparent}.sectionBox{border-radius:28px;padding:18px;overflow:hidden}.sectionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.sectionHead h3{margin:0;font-size:27px;line-height:1.18}.sectionHead p{margin:6px 0 0;color:#a8b3c7;font-size:14px}.sectionHead input{width:300px;height:44px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:rgba(2,6,23,.28);color:white;padding:0 14px;outline:none}.playersGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.playerCard{height:96px;border-radius:22px;padding:12px;display:grid;grid-template-columns:62px 1fr 48px;gap:12px;align-items:center;background:rgba(2,6,23,.30);border:1px solid rgba(255,255,255,.12);overflow:hidden}.playerPhoto{width:62px;height:62px;border-radius:18px;object-fit:contain;background:rgba(255,255,255,.08)}.playerInfo h4{margin:0 0 8px;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.playerMeta{margin:0;display:flex;gap:6px;overflow:hidden}.playerMeta span{font-size:12px;padding:5px 8px;border-radius:999px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#a8f0cd;font-weight:900;white-space:nowrap}.playerRating{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000}.trophyGrid,.seasonGrid,.linkGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}.trophyCard,.seasonTile,.linkTile{min-height:178px;border-radius:24px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);color:#cbd5e1;text-align:center;text-decoration:none;display:grid;place-items:center;overflow:hidden;cursor:pointer}.trophyCard.won,.seasonTile:hover{background:linear-gradient(180deg,rgba(0,230,118,.18),rgba(4,12,28,.85));border-color:rgba(0,230,118,.42)}.trophyCard img,.seasonTile img{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35))}.trophyCard h4,.seasonTile b{margin:0;font-size:16px;line-height:1.22}.trophyCard b{font-size:34px;color:var(--cyan)}.seasonTile span{font-size:13px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);font-weight:900}.archiveSeasonGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}.archiveSeasonCard{border-radius:28px;padding:18px;position:relative;overflow:hidden}.archiveSeasonCard em{position:absolute;top:16px;left:16px;width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-style:normal;font-weight:1000;font-size:22px}.archiveSeasonCard h3{margin:0 0 8px;font-size:26px}.archiveSeasonCard p,.archiveSeasonCard small{display:block;margin:4px 0;color:#a8b3c7;font-weight:800}.seasonTrophyChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.seasonTrophyChips button{height:42px;min-width:62px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:white;display:flex;align-items:center;gap:6px;padding:0 8px;cursor:pointer}.seasonTrophyChips img{width:26px;height:26px;object-fit:contain}.seasonTrophyChips span{font-weight:1000;color:var(--cyan)}.championRow{min-height:78px;border-radius:20px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:repeat(3,1fr);gap:10px;color:white;text-align:center;cursor:pointer}.championRow div{min-width:0;padding:8px;border-radius:12px;background:rgba(255,255,255,.045)}.championRow span{display:block;color:#a8b3c7;font-size:12px}.championRow b{display:block;margin-top:6px;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.championRow p{grid-column:1/-1;margin:4px 0 0;color:#cbd5e1;font-size:13px;text-align:right}.finalRow{min-height:88px;border-radius:20px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);color:white;display:grid;grid-template-columns:70px 1fr 70px;gap:8px;align-items:center;text-align:right;cursor:pointer}.finalRow.win{border-color:rgba(34,197,94,.45)}.finalRow.loss{border-color:rgba(239,68,68,.45)}.finalRow span{height:32px;border-radius:999px;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:900}.finalRow b{font-size:16px}.finalRow small{color:#a8b3c7}.finalRow em{font-style:normal;font-weight:1000;color:var(--cyan);direction:ltr}.financeCard{min-height:92px;border-radius:20px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}.financeCard.income{border-color:rgba(34,197,94,.42)}.financeCard.expense{border-color:rgba(239,68,68,.48)}.financeCard>b{color:#ecfeff;font-size:28px;direction:ltr}.financeCard strong,.financeCard span,.financeCard small,.financeCard p{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.transferCard{min-height:118px;border-radius:20px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:66px 1fr auto;gap:12px;align-items:center}.transferAvatar{width:64px;height:64px;border-radius:18px;object-fit:contain;background:rgba(255,255,255,.075);padding:5px}.transferMain h3{margin:0 0 7px;font-size:20px}.transferMain p{margin:0;display:flex;gap:7px;color:#cbd5e1}.transferRating{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000}.transferBadges{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.transferBadges small{height:34px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:rgba(255,255,255,.075);font-size:12px;font-weight:900;color:#ecfeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rankingCard{min-height:92px;border-radius:22px;padding:14px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:56px 58px 1fr 130px 130px;align-items:center;gap:12px;color:white;text-align:right}.rankingCard.first{border-color:rgba(0,230,118,.52);background:linear-gradient(135deg,rgba(0,230,118,.18),rgba(2,6,23,.28))}.rankingCard>span{font-size:24px;color:var(--cyan);font-weight:1000}.rankingCard img{width:58px;height:58px;border-radius:18px;object-fit:cover;background:white}.rankingCard p{margin:0}.rankingCard p strong{font-size:22px;color:#ecfeff}.rankingCard small{color:#a8b3c7}.statsTable{border-radius:24px;padding:12px;overflow:hidden}.statsTableHead,.statsTableRow{position:relative;display:grid;grid-template-columns:1.3fr repeat(6,.7fr);gap:6px;align-items:center;padding:12px;border-radius:16px;color:white}.statsTableHead{background:rgba(255,255,255,.09);font-weight:1000}.statsTableRow{border:1px solid rgba(255,255,255,.08);background:rgba(2,6,23,.28);margin-top:8px;text-align:center;cursor:pointer}.statsTableRow b{text-align:right}.statsTableRow i{position:absolute;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--cyan),var(--blue));border-radius:999px}.recordHero{border-radius:26px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:14px}.recordHero img{width:78px;height:78px;object-fit:contain}.recordHero h2{margin:0;font-size:28px}.recordHero p{margin:6px 0 0;color:#a8b3c7}.modalStatsGrid,.detailsGridPage{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.modalStatsGrid div{border-radius:18px;padding:16px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.modalStatsGrid span{display:block;color:#a8b3c7;font-size:13px;margin-bottom:8px}.modalStatsGrid b{display:block;font-size:17px;line-height:1.4}.infoModal{width:min(92vw,430px);align-self:center;margin:auto;border-radius:28px;padding:22px;position:relative}.infoModal h3{margin:0 0 10px;font-size:24px}.infoModal p{color:#cbd5e1;line-height:1.5}.infoRows{display:grid;gap:8px}.infoRows div{display:flex;justify-content:space-between;gap:12px;border-radius:14px;background:rgba(255,255,255,.07);padding:10px}.systemScreen{min-height:100vh;background:#020617;color:white;font-family:Tahoma,Arial,sans-serif;display:grid;place-items:center;text-align:center}.systemCard{padding:30px;border-radius:28px}.spinner{width:42px;height:42px;border-radius:50%;border:4px solid rgba(255,255,255,.15);border-top-color:var(--cyan);margin:0 auto 16px;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.empty{padding:18px;border-radius:18px;background:rgba(2,6,23,.25);color:#cbd5e1}.clickable{cursor:pointer}
@media(max-width:720px){.app{padding:10px 8px calc(100px + env(safe-area-inset-bottom))}.mainHero{width:100%;max-width:430px;height:188px;margin:0 auto 10px;border-radius:24px;padding:18px}.mainHero h1{font-size:34px}.mainHero p{font-size:17px}.heroKicker{font-size:10px}.coverIconBox{width:66px;height:66px;border-radius:20px}.widePage,.membersHome,.memberProfilePage{width:100%;max-width:430px;border-radius:20px;padding:14px}.pageHead h2{font-size:24px}.pageHead p{font-size:12.5px}.seasonMemberCard{height:82px;grid-template-columns:38px 52px minmax(0,1fr) 70px;gap:8px;padding:10px;border-radius:18px}.seasonMemberRank{width:32px;height:32px;font-size:13px}.seasonMemberCard img{width:52px;height:52px;border-radius:16px}.seasonMemberCard b{font-size:16.5px}.seasonMemberCard small{font-size:11px}.seasonMemberCard em{height:38px;font-size:17px}.profileCard{min-height:132px;padding:12px;border-radius:20px}.profileMain{gap:10px}.profileMain>img{width:76px;height:76px;border-radius:20px}.profileMain h2{font-size:32px}.chips span{height:28px;font-size:11px}.logos{position:absolute;left:14px;top:14px}.logos img{width:36px;height:36px}.statGrid{grid-template-columns:1.18fr .92fr}.statsPanelGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.statCard{height:118px;border-radius:20px;padding:10px}.statCard b{font-size:clamp(26px,7vw,38px)}.sectionBox{padding:14px;border-radius:20px}.sectionHead{display:grid}.sectionHead h3{font-size:22px}.sectionHead p{font-size:12px}.sectionHead input{width:100%;height:38px}.playersGrid{grid-template-columns:1fr}.playerCard{height:78px;grid-template-columns:54px minmax(0,1fr) 52px;padding:9px}.playerPhoto{width:54px;height:54px}.playerInfo h4{font-size:14.5px}.playerMeta span{font-size:9px}.trophyGrid,.seasonGrid,.linkGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.trophyCard,.seasonTile,.linkTile{min-height:132px;border-radius:18px}.trophyCard img,.seasonTile img{width:52px;height:52px}.archiveSeasonGrid{grid-template-columns:1fr}.archiveSeasonCard h3{font-size:22px}.championRow{grid-template-columns

/* ===== 2026-04 FINAL HOTFIX: no clipped numbers, compact ranking, native back, safe bottom ===== */
html,body,#root{
  min-height:100%;
  overflow-x:hidden!important;
  overscroll-behavior-y:auto!important;
}
.app{
  padding-bottom:calc(128px + env(safe-area-inset-bottom))!important;
}
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(100% - 20px,1180px)!important;
  max-width:1180px!important;
  z-index:999!important;
  margin:0!important;
}
.widePage,.membersHome,.memberProfilePage{
  margin-bottom:calc(26px + env(safe-area-inset-bottom))!important;
}

/* hide visual back button; native phone back/swipe controls subpages */
.backToMembersBtn{
  display:none!important;
}

/* universal numeric protection */
.statCard,
.statsPanelGrid .statCard,
.memberStatsGrid .statCard,
.generalTopStats .statCard,
.trophyCard,
.seasonStatCard{
  overflow:visible!important;
}
.statCard b,
.statCard strong,
.trophyCard b,
.trophyCard strong,
.seasonStatCard b,
.seasonStatCard strong{
  display:block!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  max-width:none!important;
  line-height:1.05!important;
  letter-spacing:-1.2px!important;
  transform:none!important;
  padding:0 2px!important;
}

@media(max-width:720px){
  .app{
    padding-bottom:calc(132px + env(safe-area-inset-bottom))!important;
  }
  .mainNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
    height:88px!important;
    min-height:88px!important;
    border-radius:28px!important;
    padding:8px!important;
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    gap:4px!important;
    overflow:visible!important;
  }
  .navBtn{
    height:72px!important;
    min-height:72px!important;
    padding:6px 4px!important;
    border-radius:20px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:5px!important;
    font-size:12px!important;
    line-height:1.05!important;
    min-width:0!important;
  }
  .navIcon{font-size:23px!important;line-height:1!important}
  .navLabel{font-size:12px!important;line-height:1.1!important;white-space:nowrap!important}

  .statGrid,
  .statsPanelGrid,
  .memberStatsGrid,
  .generalTopStats{
    overflow:visible!important;
  }
  .statCard{
    min-width:0!important;
    overflow:visible!important;
    padding-left:6px!important;
    padding-right:6px!important;
  }
  .statCard b,
  .statCard strong{
    font-size:clamp(22px,7.2vw,34px)!important;
    line-height:1.06!important;
    letter-spacing:-1.8px!important;
    transform:scaleX(.86)!important;
    transform-origin:center!important;
    width:116%!important;
    margin-left:-8%!important;
    margin-right:-8%!important;
    text-align:center!important;
  }
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong{
    font-size:clamp(20px,6.4vw,31px)!important;
    transform:scaleX(.84)!important;
  }
  .statCard small,
  .statCard p{
    font-size:clamp(10px,3.2vw,13px)!important;
    line-height:1.2!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  /* ranking compact card */
  .rankingList{gap:10px!important}
  .rankingCard{
    min-height:86px!important;
    height:86px!important;
    padding:10px!important;
    border-radius:18px!important;
    display:grid!important;
    grid-template-columns:54px 58px minmax(0,1fr) 96px!important;
    gap:10px!important;
    align-items:center!important;
    overflow:hidden!important;
  }
  .rankingRank{
    grid-column:1!important;
    width:44px!important;
    height:44px!important;
    border-radius:999px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    font-size:20px!important;
    color:var(--cyan)!important;
    background:rgba(255,255,255,.07)!important;
    border:1px solid rgba(255,255,255,.12)!important;
  }
  .rankingAvatar{
    grid-column:2!important;
    width:58px!important;
    height:58px!important;
    min-width:58px!important;
    min-height:58px!important;
    border-radius:17px!important;
    object-fit:cover!important;
  }
  .rankingIdentity{
    grid-column:3!important;
    min-width:0!important;
    display:grid!important;
    gap:7px!important;
    align-content:center!important;
    text-align:right!important;
  }
  .rankingIdentity b{
    font-size:19px!important;
    line-height:1.1!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  .rankingIdentity small{display:none!important}
  .rankingLogos{
    display:flex!important;
    gap:7px!important;
    align-items:center!important;
    justify-content:flex-start!important;
    height:24px!important;
  }
  .rankingLogos img{
    width:24px!important;
    height:24px!important;
    object-fit:contain!important;
    background:transparent!important;
    border-radius:0!important;
    filter:drop-shadow(0 5px 8px rgba(0,0,0,.35))!important;
  }
  .rankingInlineStats{
    grid-column:4!important;
    display:flex!important;
    flex-direction:row!important;
    align-items:center!important;
    justify-content:flex-end!important;
    gap:6px!important;
    min-width:0!important;
  }
  .rankingInlineStats span{
    height:30px!important;
    min-width:42px!important;
    padding:0 8px!important;
    border-radius:999px!important;
    background:rgba(255,255,255,.075)!important;
    border:1px solid rgba(255,255,255,.10)!important;
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    font-size:12px!important;
    font-weight:1000!important;
    direction:ltr!important;
    unicode-bidi:plaintext!important;
    white-space:nowrap!important;
  }
  .rankingCard p{display:none!important}
}

@media(max-width:380px){
  .rankingCard{
    grid-template-columns:46px 52px minmax(0,1fr) 84px!important;
    gap:7px!important;
    padding:9px!important;
  }
  .rankingRank{width:38px!important;height:38px!important;font-size:17px!important}
  .rankingAvatar{width:52px!important;height:52px!important;min-width:52px!important;min-height:52px!important}
  .rankingIdentity b{font-size:16px!important}
  .rankingInlineStats{gap:4px!important}
  .rankingInlineStats span{height:28px!important;min-width:38px!important;padding:0 6px!important;font-size:11px!important}
  .navLabel{font-size:11px!important}
}

:repeat(2,1fr);padding:10px}.championRow div:nth-child(3){grid-column:1/-1}.championRow b{font-size:14px}.finalRow{grid-template-columns:62px 1fr 54px}.transferCard{grid-template-columns:64px 1fr;align-items:start}.transferRating{position:absolute;left:14px;top:14px}.transferBadges{grid-template-columns:repeat(2,1fr)}.rankingCard{grid-template-columns:42px 52px 1fr;gap:10px}.rankingCard p{grid-column:1/-1;display:flex;justify-content:space-between;background:rgba(255,255,255,.06);border-radius:12px;padding:8px}.statsTable{overflow-x:auto}.statsTableHead,.statsTableRow{min-width:680px}.modalStatsGrid,.detailsGridPage{grid-template-columns:1fr}.recordHero h2{font-size:22px}.mainNav{width:calc(100% - 18px);max-width:430px;height:72px;bottom:calc(10px + env(safe-area-inset-bottom))}.sideDrawer{border-radius:0 24px 24px 0}}
@media(max-width:380px){.mainHero h1{font-size:29px}.seasonMemberCard{grid-template-columns:34px 48px minmax(0,1fr) 62px;gap:6px}.seasonMemberCard b{font-size:15px}.profileMain h2{font-size:30px}.trophyGrid,.seasonGrid,.linkGrid{grid-template-columns:1fr}.playerCard{grid-template-columns:50px minmax(0,1fr) 46px}}


/* ===== ARCHIVE HUB 3 MODES: trophy / season / member ===== */
.archiveHubHead p{max-width:680px}
.archiveModeTabs{
  max-width:780px;
  margin:0 auto 18px;
  padding:8px;
  border-radius:22px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:8px;
}
.archiveModeTabs button{
  height:44px;
  border:1px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.055);
  color:#f8fafc;
  border-radius:16px;
  font-weight:1000;
  cursor:pointer;
}
.archiveModeTabs button.active{
  background:linear-gradient(135deg,var(--cyan),var(--blue));
  color:#020617;
  border-color:transparent;
  box-shadow:0 16px 38px rgba(0,229,255,.16);
}
.archiveTrophyTable,
.archiveMemberList{
  display:grid;
  gap:10px;
}
.archiveTrophyRow{
  min-height:82px;
  padding:12px 16px;
  border-radius:22px;
  border:0;
  color:#f8fafc;
  cursor:pointer;
  display:grid;
  grid-template-columns:54px 58px minmax(0,1fr) 82px;
  gap:12px;
  align-items:center;
  text-align:right;
}
.archiveTrophyRow img{
  width:52px;
  height:52px;
  object-fit:contain;
  filter:drop-shadow(0 8px 10px rgba(0,0,0,.35));
}
.archiveRowRank,
.archiveMemberRank{
  width:42px;
  height:42px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(255,255,255,.075);
  border:1px solid rgba(255,255,255,.12);
  color:#b9f7ff;
  font-weight:1000;
}
.archiveTrophyRow b{
  font-size:20px;
  line-height:1.15;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.archiveTrophyRow em,
.archiveMemberCard em{
  justify-self:end;
  min-width:70px;
  height:44px;
  padding:0 14px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-style:normal;
  font-size:22px;
  font-weight:1000;
  color:#020617;
  background:linear-gradient(135deg,var(--cyan),var(--blue));
  direction:ltr;
  unicode-bidi:plaintext;
}
.archiveMemberCard{
  min-height:104px;
  padding:14px 16px;
  border-radius:24px;
  border:0;
  color:#f8fafc;
  cursor:pointer;
  display:grid;
  grid-template-columns:54px 64px minmax(0,1fr) 86px;
  gap:12px;
  align-items:center;
  text-align:right;
}
.archiveMemberAvatar{
  width:64px;
  height:64px;
  border-radius:20px;
  object-fit:cover;
  background:white;
}
.archiveMemberInfo{
  min-width:0;
  display:grid;
  gap:10px;
}
.archiveMemberInfo>b{
  font-size:22px;
  line-height:1.15;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.archiveMemberTrophies{
  display:flex;
  gap:7px;
  overflow:hidden;
  align-items:center;
}
.archiveMemberTrophies span{
  min-width:42px;
  height:34px;
  padding:0 6px;
  border-radius:999px;
  background:rgba(255,255,255,.075);
  border:1px solid rgba(255,255,255,.10);
  display:flex;
  align-items:center;
  justify-content:center;
  gap:4px;
}
.archiveMemberTrophies img{
  width:20px;
  height:20px;
  object-fit:contain;
}
.archiveMemberTrophies strong{
  font-size:12px;
  direction:ltr;
  unicode-bidi:plaintext;
}

@media(max-width:720px){
  .archiveModeTabs{
    margin-bottom:12px!important;
    padding:6px!important;
    border-radius:18px!important;
    gap:6px!important;
  }
  .archiveModeTabs button{
    height:38px!important;
    border-radius:13px!important;
    font-size:11px!important;
    padding:0 4px!important;
    white-space:nowrap!important;
  }
  .archiveTrophyRow{
    min-height:74px!important;
    padding:10px!important;
    border-radius:18px!important;
    grid-template-columns:40px 48px minmax(0,1fr) 62px!important;
    gap:8px!important;
  }
  .archiveTrophyRow img{
    width:46px!important;
    height:46px!important;
  }
  .archiveRowRank,
  .archiveMemberRank{
    width:34px!important;
    height:34px!important;
    font-size:12px!important;
  }
  .archiveTrophyRow b{
    font-size:15px!important;
  }
  .archiveTrophyRow em,
  .archiveMemberCard em{
    min-width:56px!important;
    height:36px!important;
    padding:0 9px!important;
    font-size:18px!important;
  }
  .archiveMemberCard{
    min-height:92px!important;
    padding:10px!important;
    border-radius:19px!important;
    grid-template-columns:38px 52px minmax(0,1fr) 58px!important;
    gap:8px!important;
  }
  .archiveMemberAvatar{
    width:52px!important;
    height:52px!important;
    border-radius:16px!important;
  }
  .archiveMemberInfo{
    gap:7px!important;
  }
  .archiveMemberInfo>b{
    font-size:16px!important;
  }
  .archiveMemberTrophies{
    gap:5px!important;
  }
  .archiveMemberTrophies span{
    min-width:34px!important;
    height:28px!important;
    padding:0 5px!important;
  }
  .archiveMemberTrophies img{
    width:17px!important;
    height:17px!important;
  }
  .archiveMemberTrophies strong{
    font-size:10px!important;
  }
}



/* ===== ABSOLUTE FINAL FIX 2: numbers, ranking layout, native back, bottom safe area ===== */

/* safe bottom: content never goes under bottom bar */
.app{
  padding-bottom:calc(160px + env(safe-area-inset-bottom))!important;
}
.widePage,
.membersHome,
.memberProfilePage{
  margin-bottom:calc(46px + env(safe-area-inset-bottom))!important;
}
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(1180px,calc(100% - 24px))!important;
  margin:0!important;
  z-index:9999!important;
  overflow:visible!important;
}

/* no visual back button: use iPhone swipe / Android system back */
.backToMembersBtn{
  display:none!important;
}

/* numbers must fit inside cards, not overflow and not be clipped */
.statCard,
.statGrid .statCard,
.statsPanelGrid .statCard,
.memberStatsGrid .statCard,
.generalTopStats .statCard{
  overflow:hidden!important;
  min-width:0!important;
}
.statCard b,
.statCard strong,
.statsPanelGrid .statCard b,
.statsPanelGrid .statCard strong,
.memberStatsGrid .statCard b,
.memberStatsGrid .statCard strong,
.generalTopStats .statCard b,
.generalTopStats .statCard strong{
  display:block!important;
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  line-height:1!important;
  letter-spacing:-2px!important;
  transform:scaleX(.72)!important;
  transform-origin:center!important;
  font-size:clamp(22px,5.8vw,34px)!important;
}
.statCard small,
.statCard p{
  width:100%!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

/* ranking: rebuilt compact card */
.rankingCompactList{
  display:grid!important;
  gap:10px!important;
}
.rankingCompactCard{
  width:100%!important;
  min-height:88px!important;
  height:88px!important;
  padding:12px 14px!important;
  border-radius:22px!important;
  display:grid!important;
  grid-template-columns:64px 66px minmax(0,1fr) 82px 126px!important;
  grid-template-rows:1fr!important;
  gap:12px!important;
  align-items:center!important;
  text-align:right!important;
  overflow:hidden!important;
}
.rankingCompactCard .rankingRank{
  grid-column:1!important;
  width:48px!important;
  height:48px!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:rgba(255,255,255,.075)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  color:var(--cyan)!important;
  font-size:21px!important;
  font-weight:1000!important;
}
.rankingCompactCard .rankingAvatar{
  grid-column:2!important;
  width:66px!important;
  height:66px!important;
  min-width:66px!important;
  min-height:66px!important;
  border-radius:20px!important;
  object-fit:cover!important;
  background:white!important;
}
.rankingCompactCard .rankingIdentity{
  grid-column:3!important;
  min-width:0!important;
  overflow:hidden!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
}
.rankingCompactCard .rankingIdentity b{
  display:block!important;
  width:100%!important;
  font-size:24px!important;
  line-height:1.1!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.rankingCompactCard .rankingIdentity small,
.rankingCompactCard p{
  display:none!important;
}
.rankingSeasonLogos{
  grid-column:4!important;
  display:flex!important;
  gap:8px!important;
  align-items:center!important;
  justify-content:center!important;
  min-width:0!important;
}
.rankingSeasonLogos img{
  width:34px!important;
  height:34px!important;
  object-fit:contain!important;
  background:transparent!important;
  border-radius:0!important;
  filter:drop-shadow(0 6px 8px rgba(0,0,0,.38))!important;
}
.rankingInlineStats{
  grid-column:5!important;
  display:flex!important;
  flex-direction:row!important;
  gap:8px!important;
  align-items:center!important;
  justify-content:flex-end!important;
  min-width:0!important;
}
.rankingInlineStats span{
  height:36px!important;
  min-width:54px!important;
  padding:0 10px!important;
  border-radius:999px!important;
  background:rgba(255,255,255,.08)!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#ecfeff!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:14px!important;
  font-weight:1000!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  white-space:nowrap!important;
}

@media(max-width:720px){
  .app{
    padding-bottom:calc(148px + env(safe-area-inset-bottom))!important;
  }
  .mainNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
    height:88px!important;
    min-height:88px!important;
    border-radius:30px!important;
    padding:8px!important;
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    gap:4px!important;
  }
  .navBtn{
    min-width:0!important;
    width:100%!important;
    height:72px!important;
    min-height:72px!important;
    border-radius:22px!important;
    padding:6px 2px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:5px!important;
  }
  .navIcon{font-size:25px!important;line-height:1!important}
  .navLabel{font-size:12px!important;line-height:1.05!important;white-space:nowrap!important}

  .statGrid{
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:10px!important;
  }
  .statCard{
    min-width:0!important;
    padding:10px 7px!important;
    overflow:hidden!important;
  }
  .statCard b,
  .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong{
    font-size:clamp(22px,7vw,34px)!important;
    transform:scaleX(.64)!important;
    letter-spacing:-2.8px!important;
    width:132%!important;
    max-width:132%!important;
    margin-left:-16%!important;
    margin-right:-16%!important;
    line-height:1!important;
  }
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong{
    font-size:clamp(20px,6.4vw,31px)!important;
    transform:scaleX(.68)!important;
    letter-spacing:-2px!important;
  }

  .rankingCompactCard{
    height:82px!important;
    min-height:82px!important;
    padding:10px!important;
    border-radius:19px!important;
    grid-template-columns:42px 56px minmax(0,1fr) 62px 92px!important;
    gap:8px!important;
  }
  .rankingCompactCard .rankingRank{
    width:34px!important;
    height:34px!important;
    font-size:13px!important;
  }
  .rankingCompactCard .rankingAvatar{
    width:56px!important;
    height:56px!important;
    min-width:56px!important;
    min-height:56px!important;
    border-radius:17px!important;
  }
  .rankingCompactCard .rankingIdentity b{
    font-size:18px!important;
  }
  .rankingSeasonLogos{
    gap:5px!important;
  }
  .rankingSeasonLogos img{
    width:25px!important;
    height:25px!important;
  }
  .rankingInlineStats{
    gap:5px!important;
  }
  .rankingInlineStats span{
    height:30px!important;
    min-width:40px!important;
    padding:0 7px!important;
    font-size:11px!important;
  }
}
@media(max-width:380px){
  .rankingCompactCard{
    grid-template-columns:36px 50px minmax(0,1fr) 52px 82px!important;
    gap:6px!important;
    padding:8px!important;
  }
  .rankingCompactCard .rankingAvatar{
    width:50px!important;
    height:50px!important;
    min-width:50px!important;
    min-height:50px!important;
  }
  .rankingCompactCard .rankingIdentity b{
    font-size:15px!important;
  }
  .rankingSeasonLogos img{
    width:22px!important;
    height:22px!important;
  }
  .rankingInlineStats span{
    min-width:36px!important;
    font-size:10px!important;
    padding:0 5px!important;
  }
}



/* ===== FINAL RESTORE: stable numbers, non-overlay nav, bounded mobile back, expanded member archive ===== */

/* Bottom bar is part of page flow, not overlaying content */
.app{
  padding-bottom:calc(18px + env(safe-area-inset-bottom))!important;
}
.mainNav{
  position:relative!important;
  left:auto!important;
  right:auto!important;
  bottom:auto!important;
  transform:none!important;
  width:min(1180px,100%)!important;
  max-width:1180px!important;
  margin:18px auto calc(10px + env(safe-area-inset-bottom))!important;
  z-index:10!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
}
.widePage,
.membersHome,
.memberProfilePage{
  margin-bottom:0!important;
}

/* Return numbers to readable state: no ugly horizontal compression */
.statCard,
.statGrid .statCard,
.statsPanelGrid .statCard,
.memberStatsGrid .statCard,
.generalTopStats .statCard{
  overflow:hidden!important;
  min-width:0!important;
}
.statCard b,
.statCard strong,
.statsPanelGrid .statCard b,
.statsPanelGrid .statCard strong,
.memberStatsGrid .statCard b,
.memberStatsGrid .statCard strong,
.generalTopStats .statCard b,
.generalTopStats .statCard strong,
.trophyCard b,
.trophyCard strong{
  display:block!important;
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:clip!important;
  line-height:1.06!important;
  letter-spacing:-.8px!important;
  transform:none!important;
  margin:0!important;
  padding:0 2px!important;
  font-size:clamp(22px,5.7vw,34px)!important;
}
.statCard small,
.statCard p{
  width:100%!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

/* Archive by member: larger card, all trophies visible */
.archiveMemberCard{
  min-height:144px!important;
  height:auto!important;
  align-items:start!important;
  grid-template-columns:54px 70px minmax(0,1fr) 90px!important;
  padding:16px!important;
  overflow:visible!important;
}
.archiveMemberAvatar{
  width:70px!important;
  height:70px!important;
}
.archiveMemberInfo{
  gap:12px!important;
  overflow:visible!important;
}
.archiveMemberTrophies{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:8px!important;
  overflow:visible!important;
  align-items:center!important;
}
.archiveMemberTrophies span{
  min-width:46px!important;
  height:36px!important;
}
.archiveMemberTrophies img{
  width:22px!important;
  height:22px!important;
}
.archiveMemberCard em{
  align-self:center!important;
}

@media(max-width:720px){
  .app{
    padding-bottom:calc(12px + env(safe-area-inset-bottom))!important;
  }
  .mainNav{
    position:relative!important;
    left:auto!important;
    right:auto!important;
    bottom:auto!important;
    transform:none!important;
    width:100%!important;
    max-width:430px!important;
    height:auto!important;
    min-height:76px!important;
    margin:14px auto calc(8px + env(safe-area-inset-bottom))!important;
    border-radius:24px!important;
    padding:7px!important;
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    gap:5px!important;
    overflow:visible!important;
  }
  .navBtn{
    width:100%!important;
    min-width:0!important;
    height:62px!important;
    min-height:62px!important;
    border-radius:18px!important;
    padding:5px 2px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:center!important;
    justify-content:center!important;
    gap:4px!important;
  }
  .navIcon{font-size:22px!important;line-height:1!important}
  .navLabel{font-size:11px!important;line-height:1.05!important;white-space:nowrap!important}

  .statGrid{
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:10px!important;
  }
  .statCard{
    min-width:0!important;
    height:116px!important;
    min-height:116px!important;
    max-height:116px!important;
    padding:10px 8px!important;
    overflow:hidden!important;
  }
  .statCard b,
  .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong{
    font-size:clamp(21px,5.8vw,31px)!important;
    line-height:1.08!important;
    letter-spacing:-1px!important;
    transform:none!important;
    width:100%!important;
    max-width:100%!important;
    margin:0!important;
    overflow:hidden!important;
  }
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong{
    font-size:clamp(20px,5.4vw,29px)!important;
  }

  .archiveMemberCard{
    min-height:136px!important;
    height:auto!important;
    grid-template-columns:38px 54px minmax(0,1fr) 58px!important;
    gap:8px!important;
    padding:11px!important;
    border-radius:20px!important;
    overflow:visible!important;
  }
  .archiveMemberAvatar{
    width:54px!important;
    height:54px!important;
    border-radius:17px!important;
  }
  .archiveMemberInfo>b{
    font-size:17px!important;
  }
  .archiveMemberTrophies{
    flex-wrap:wrap!important;
    gap:6px!important;
    max-height:none!important;
    overflow:visible!important;
  }
  .archiveMemberTrophies span{
    min-width:38px!important;
    height:30px!important;
    padding:0 5px!important;
  }
  .archiveMemberTrophies img{
    width:18px!important;
    height:18px!important;
  }
  .archiveMemberTrophies strong{
    font-size:10px!important;
  }
}
@media(max-width:380px){
  .statCard b,
  .statCard strong{
    font-size:clamp(19px,5.2vw,27px)!important;
    letter-spacing:-1.2px!important;
  }
  .archiveMemberCard{
    grid-template-columns:34px 48px minmax(0,1fr) 52px!important;
    gap:6px!important;
    padding:9px!important;
  }
  .archiveMemberAvatar{
    width:48px!important;
    height:48px!important;
  }
  .archiveMemberInfo>b{
    font-size:15px!important;
  }
}



/* ===== RECORD DETAIL CARD: final result is the main focus ===== */
.recordDetailCard{
  border-radius:28px;
  padding:18px;
  display:grid;
  gap:14px;
  overflow:hidden;
}
.recordDetailTop{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
}
.recordDetailTop div{
  min-height:92px;
  border-radius:22px;
  background:rgba(2,6,23,.24);
  border:1px solid rgba(255,255,255,.08);
  display:grid;
  place-items:center;
  text-align:center;
  padding:12px;
  overflow:hidden;
}
.recordDetailTop span,
.recordFinalBox span,
.recordNotesBox span{
  display:block;
  color:#a8b3c7;
  font-size:14px;
  font-weight:900;
  margin-bottom:8px;
}
.recordDetailTop b{
  display:block;
  font-size:26px;
  line-height:1.15;
  color:#f8fafc;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.recordFinalBox{
  min-height:118px;
  border-radius:26px;
  padding:18px;
  display:grid;
  place-items:center;
  text-align:center;
  background:linear-gradient(135deg,rgba(0,229,255,.18),rgba(47,140,255,.10));
  border:1px solid rgba(0,229,255,.34);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 18px 45px rgba(0,229,255,.08);
}
.recordFinalBox span{
  color:#b9f7ff;
  font-size:16px;
}
.recordFinalBox b{
  display:block;
  width:100%;
  color:#ecfeff;
  font-size:34px;
  line-height:1.25;
  font-weight:1000;
  white-space:normal;
  overflow:visible;
}
.recordNotesBox{
  border-radius:22px;
  padding:14px 16px;
  background:rgba(255,255,255,.055);
  border:1px solid rgba(255,255,255,.10);
}
.recordNotesBox p{
  margin:0;
  color:#e5eef9;
  font-size:16px;
  line-height:1.6;
}
@media(max-width:720px){
  .recordDetailCard{
    border-radius:20px!important;
    padding:12px!important;
    gap:10px!important;
  }
  .recordDetailTop{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:8px!important;
  }
  .recordDetailTop div{
    min-height:74px!important;
    border-radius:16px!important;
    padding:8px 5px!important;
  }
  .recordDetailTop span,
  .recordFinalBox span,
  .recordNotesBox span{
    font-size:11px!important;
    margin-bottom:5px!important;
  }
  .recordDetailTop b{
    font-size:clamp(14px,4.4vw,20px)!important;
    line-height:1.15!important;
  }
  .recordFinalBox{
    min-height:104px!important;
    border-radius:18px!important;
    padding:14px 10px!important;
  }
  .recordFinalBox span{
    font-size:13px!important;
  }
  .recordFinalBox b{
    font-size:clamp(20px,6.2vw,30px)!important;
    line-height:1.3!important;
  }
  .recordNotesBox{
    border-radius:16px!important;
    padding:12px!important;
  }
  .recordNotesBox p{
    font-size:12px!important;
    line-height:1.55!important;
  }
}



/* ===== RESTORE ORIGINAL GOOD CARD SIZING + READABLE NUMBERS ===== */
/* This block intentionally overrides the experimental compressed-number rules. */
.memberProfilePage .statGrid{
  display:grid!important;
  grid-template-columns:1.2fr .9fr!important;
  gap:10px!important;
  margin:10px 0!important;
}
.memberProfilePage .statCard{
  height:132px!important;
  min-height:132px!important;
  max-height:132px!important;
  padding:12px 10px!important;
  border-radius:22px!important;
  display:grid!important;
  grid-template-rows:30px 56px 24px!important;
  align-items:center!important;
  justify-items:center!important;
  text-align:center!important;
  overflow:visible!important;
}
.memberProfilePage .statCard span{
  grid-row:1!important;
  font-size:27px!important;
  line-height:1!important;
  margin:0!important;
}
.memberProfilePage .statCard b{
  grid-row:2!important;
  display:block!important;
  width:100%!important;
  max-width:100%!important;
  height:56px!important;
  line-height:56px!important;
  margin:0!important;
  padding:0!important;
  font-size:clamp(30px,7.4vw,42px)!important;
  font-weight:1000!important;
  letter-spacing:-1.2px!important;
  text-align:center!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:clip!important;
  transform:none!important;
  color:#ecfeff!important;
}
.memberProfilePage .statCard small{
  grid-row:3!important;
  width:100%!important;
  height:24px!important;
  line-height:24px!important;
  margin:0!important;
  font-size:14px!important;
  font-weight:1000!important;
  text-align:center!important;
  color:#d7e3f5!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

/* Member stats page cards: keep numbers clear, not squeezed */
.memberStatsGrid,
.statsPanelGrid{
  overflow:visible!important;
}
.memberStatsGrid .statCard,
.statsPanelGrid .statCard,
.generalTopStats .statCard{
  height:124px!important;
  min-height:124px!important;
  max-height:124px!important;
  padding:12px 9px!important;
  border-radius:20px!important;
  display:grid!important;
  grid-template-rows:30px 50px 24px!important;
  align-items:center!important;
  justify-items:center!important;
  text-align:center!important;
  overflow:visible!important;
}
.memberStatsGrid .statCard b,
.memberStatsGrid .statCard strong,
.statsPanelGrid .statCard b,
.statsPanelGrid .statCard strong,
.generalTopStats .statCard b,
.generalTopStats .statCard strong{
  display:block!important;
  width:100%!important;
  height:50px!important;
  line-height:50px!important;
  font-size:clamp(24px,6vw,36px)!important;
  font-weight:1000!important;
  letter-spacing:-1px!important;
  text-align:center!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:clip!important;
  transform:none!important;
  color:#ecfeff!important;
}
.memberStatsGrid .statCard small,
.statsPanelGrid .statCard small,
.generalTopStats .statCard small{
  font-size:13px!important;
  font-weight:900!important;
}

/* Finance cards: restore strong readable amount */
.financeCard > b,
.financeCard b:first-child{
  min-width:132px!important;
  max-width:48%!important;
  font-size:clamp(22px,5.6vw,34px)!important;
  line-height:1!important;
  font-weight:1000!important;
  letter-spacing:-1.1px!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
  transform:none!important;
  color:#f4ffff!important;
}

/* Cancel every previous ugly compression */
.statCard b,
.statCard strong,
.trophyCard b,
.trophyCard strong,
.rankingInlineStats span,
.archiveTrophyRow em,
.archiveMemberCard em{
  transform:none!important;
}

/* Record details: final is the hero, not a side note */
.recordDetailCard{
  padding:18px!important;
  border-radius:28px!important;
  display:grid!important;
  gap:16px!important;
}
.recordTopRow{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:12px!important;
}
.recordMiniBox{
  min-height:92px!important;
  border-radius:22px!important;
  background:rgba(255,255,255,.055)!important;
  border:1px solid rgba(255,255,255,.09)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:9px!important;
  text-align:center!important;
  padding:12px 8px!important;
}
.recordMiniBox span{
  color:#a8b3c7!important;
  font-size:14px!important;
  font-weight:900!important;
}
.recordMiniBox b{
  color:#f8fafc!important;
  font-size:24px!important;
  font-weight:1000!important;
  line-height:1.1!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
}
.recordFinalBox{
  min-height:122px!important;
  border-radius:26px!important;
  padding:18px!important;
  background:linear-gradient(135deg,rgba(0,229,255,.16),rgba(47,140,255,.10))!important;
  border:1px solid rgba(0,229,255,.28)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:12px!important;
  text-align:center!important;
  box-shadow:0 18px 55px rgba(0,229,255,.10)!important;
}
.recordFinalBox span{
  color:var(--cyan)!important;
  font-size:17px!important;
  font-weight:1000!important;
}
.recordFinalBox strong{
  color:#f8fafc!important;
  font-size:clamp(24px,5vw,42px)!important;
  line-height:1.25!important;
  font-weight:1000!important;
  white-space:normal!important;
  overflow:visible!important;
  text-align:center!important;
}
.recordNotes{
  margin:0!important;
  padding:14px!important;
  border-radius:18px!important;
  background:rgba(255,255,255,.055)!important;
  color:#cbd5e1!important;
  font-size:14px!important;
  line-height:1.45!important;
}

@media(max-width:720px){
  .memberProfilePage .statGrid{
    grid-template-columns:1.15fr .85fr!important;
    gap:10px!important;
  }
  .memberProfilePage .statCard{
    height:128px!important;
    min-height:128px!important;
    max-height:128px!important;
    padding:11px 8px!important;
    grid-template-rows:30px 54px 24px!important;
  }
  .memberProfilePage .statCard b{
    height:54px!important;
    line-height:54px!important;
    font-size:clamp(27px,6.9vw,38px)!important;
    letter-spacing:-1.4px!important;
  }
  .memberProfilePage .statCard small{
    font-size:13px!important;
  }
  .memberStatsGrid .statCard,
  .statsPanelGrid .statCard,
  .generalTopStats .statCard{
    height:118px!important;
    min-height:118px!important;
    max-height:118px!important;
    grid-template-rows:28px 48px 23px!important;
  }
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .generalTopStats .statCard b,
  .generalTopStats .statCard strong{
    height:48px!important;
    line-height:48px!important;
    font-size:clamp(22px,5.8vw,32px)!important;
  }
  .financeCard > b,
  .financeCard b:first-child{
    font-size:clamp(21px,5.7vw,32px)!important;
    min-width:120px!important;
  }
  .recordDetailCard{
    padding:12px!important;
    border-radius:22px!important;
    gap:12px!important;
  }
  .recordTopRow{
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:8px!important;
  }
  .recordMiniBox{
    min-height:78px!important;
    border-radius:17px!important;
    padding:9px 5px!important;
    gap:6px!important;
  }
  .recordMiniBox span{
    font-size:11px!important;
  }
  .recordMiniBox b{
    font-size:16px!important;
  }
  .recordFinalBox{
    min-height:112px!important;
    border-radius:20px!important;
    padding:14px 10px!important;
  }
  .recordFinalBox span{
    font-size:14px!important;
  }
  .recordFinalBox strong{
    font-size:clamp(21px,5.8vw,30px)!important;
    line-height:1.3!important;
  }
}
@media(max-width:380px){
  .memberProfilePage .statCard b{
    font-size:clamp(24px,6.4vw,34px)!important;
    letter-spacing:-1.6px!important;
  }
  .recordMiniBox b{
    font-size:14px!important;
  }
  .recordFinalBox strong{
    font-size:clamp(19px,5.4vw,27px)!important;
  }
}



/* ===== FINAL FIX: Tournament version cards + original-style stat cards ===== */

/* Cards inside member trophy lists / archive trophy lists */
.tournamentRecordsList{
  display:grid!important;
  gap:12px!important;
}
.tournamentRecordCard{
  width:100%!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#f8fafc!important;
  cursor:default!important;
  text-align:right!important;
  border-radius:24px!important;
  padding:14px!important;
  background:rgba(2,6,23,.28)!important;
  display:grid!important;
  gap:12px!important;
  overflow:hidden!important;
}
.tournamentRecordCard.hasFinal{
  border-color:rgba(0,229,255,.24)!important;
  background:linear-gradient(135deg,rgba(0,229,255,.10),rgba(2,6,23,.26))!important;
}
.recordCardMeta{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:9px!important;
}
.recordCardMeta span{
  min-height:64px!important;
  border-radius:16px!important;
  background:rgba(255,255,255,.052)!important;
  border:1px solid rgba(255,255,255,.07)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:5px!important;
  text-align:center!important;
  padding:8px 6px!important;
  overflow:hidden!important;
}
.recordCardMeta small{
  color:#a8b3c7!important;
  font-size:11px!important;
  line-height:1!important;
  font-weight:900!important;
  white-space:nowrap!important;
}
.recordCardMeta b{
  color:#f8fafc!important;
  font-size:15px!important;
  line-height:1.15!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
}
.recordCardFinal{
  min-height:88px!important;
  border-radius:20px!important;
  padding:13px 12px!important;
  background:linear-gradient(135deg,rgba(0,229,255,.18),rgba(47,140,255,.10))!important;
  border:1px solid rgba(0,229,255,.26)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:8px!important;
  text-align:center!important;
}
.recordCardFinal small{
  color:var(--cyan)!important;
  font-size:13px!important;
  font-weight:1000!important;
  line-height:1!important;
}
.recordCardFinal strong{
  color:#f8fafc!important;
  font-size:clamp(18px,4.6vw,28px)!important;
  line-height:1.28!important;
  font-weight:1000!important;
  white-space:normal!important;
  overflow:visible!important;
}
.recordCardFinal.muted{
  background:rgba(255,255,255,.052)!important;
  border-color:rgba(255,255,255,.08)!important;
}
.recordCardFinal.muted small{
  color:#a8b3c7!important;
}
.recordCardFinal.muted strong{
  color:#cbd5e1!important;
  font-size:15px!important;
}

/* Restore stat-card composition: icon top / number center / label bottom */
.statGrid,
.memberStatsGrid,
.statsPanelGrid,
.generalTopStats{
  align-items:stretch!important;
}
.statCard,
.memberStatsGrid .statCard,
.statsPanelGrid .statCard,
.generalTopStats .statCard{
  height:132px!important;
  min-height:132px!important;
  max-height:132px!important;
  border-radius:22px!important;
  padding:12px 10px!important;
  display:grid!important;
  grid-template-rows:34px 54px 26px!important;
  align-items:center!important;
  justify-items:center!important;
  text-align:center!important;
  overflow:hidden!important;
  align-content:center!important;
}
.statCard span,
.memberStatsGrid .statCard span,
.statsPanelGrid .statCard span,
.generalTopStats .statCard span{
  grid-row:1!important;
  display:block!important;
  width:100%!important;
  font-size:28px!important;
  line-height:34px!important;
  margin:0!important;
  text-align:center!important;
}
.statCard b,
.statCard strong,
.memberStatsGrid .statCard b,
.memberStatsGrid .statCard strong,
.statsPanelGrid .statCard b,
.statsPanelGrid .statCard strong,
.generalTopStats .statCard b,
.generalTopStats .statCard strong{
  grid-row:2!important;
  display:block!important;
  width:100%!important;
  height:54px!important;
  line-height:54px!important;
  margin:0!important;
  padding:0!important;
  font-size:clamp(28px,6.8vw,42px)!important;
  font-weight:1000!important;
  color:#ecfeff!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  font-variant-numeric:tabular-nums!important;
  letter-spacing:-1.2px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:clip!important;
  transform:none!important;
  text-align:center!important;
}
.statCard small,
.statCard p,
.memberStatsGrid .statCard small,
.memberStatsGrid .statCard p,
.statsPanelGrid .statCard small,
.statsPanelGrid .statCard p,
.generalTopStats .statCard small,
.generalTopStats .statCard p{
  grid-row:3!important;
  display:block!important;
  width:100%!important;
  height:26px!important;
  line-height:26px!important;
  margin:0!important;
  padding:0!important;
  font-size:13px!important;
  font-weight:1000!important;
  color:#d7e3f5!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  text-align:center!important;
}

/* keep main two profile cards roomy, same as the old good version */
.memberProfilePage .statGrid{
  display:grid!important;
  grid-template-columns:1.2fr .9fr!important;
  gap:10px!important;
}
.memberProfilePage .statCard{
  height:132px!important;
  min-height:132px!important;
  max-height:132px!important;
}

@media(max-width:720px){
  .tournamentRecordsList{
    gap:10px!important;
  }
  .tournamentRecordCard{
    border-radius:20px!important;
    padding:11px!important;
    gap:10px!important;
  }
  .recordCardMeta{
    gap:7px!important;
  }
  .recordCardMeta span{
    min-height:56px!important;
    border-radius:14px!important;
    padding:7px 4px!important;
  }
  .recordCardMeta small{
    font-size:9px!important;
  }
  .recordCardMeta b{
    font-size:12px!important;
  }
  .recordCardFinal{
    min-height:78px!important;
    border-radius:17px!important;
    padding:11px 8px!important;
  }
  .recordCardFinal small{
    font-size:11px!important;
  }
  .recordCardFinal strong{
    font-size:clamp(17px,5.2vw,24px)!important;
  }

  .statCard,
  .memberStatsGrid .statCard,
  .statsPanelGrid .statCard,
  .generalTopStats .statCard{
    height:124px!important;
    min-height:124px!important;
    max-height:124px!important;
    padding:11px 8px!important;
    grid-template-rows:32px 50px 24px!important;
  }
  .statCard span,
  .memberStatsGrid .statCard span,
  .statsPanelGrid .statCard span,
  .generalTopStats .statCard span{
    font-size:25px!important;
    line-height:32px!important;
  }
  .statCard b,
  .statCard strong,
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .generalTopStats .statCard b,
  .generalTopStats .statCard strong{
    height:50px!important;
    line-height:50px!important;
    font-size:clamp(24px,6.1vw,34px)!important;
    letter-spacing:-1.1px!important;
  }
  .statCard small,
  .statCard p,
  .memberStatsGrid .statCard small,
  .memberStatsGrid .statCard p,
  .statsPanelGrid .statCard small,
  .statsPanelGrid .statCard p,
  .generalTopStats .statCard small,
  .generalTopStats .statCard p{
    height:24px!important;
    line-height:24px!important;
    font-size:12px!important;
  }

  .memberProfilePage .statCard{
    height:128px!important;
    min-height:128px!important;
    max-height:128px!important;
  }
  .memberProfilePage .statCard b{
    font-size:clamp(26px,6.8vw,38px)!important;
  }
}
@media(max-width:380px){
  .recordCardFinal strong{
    font-size:clamp(15px,4.8vw,22px)!important;
  }
  .statCard b,
  .statCard strong,
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .generalTopStats .statCard b,
  .generalTopStats .statCard strong{
    font-size:clamp(21px,5.8vw,31px)!important;
    letter-spacing:-1.3px!important;
  }
}



/* ===== SEASON PAGE: clear stacked tournament cards ===== */
.seasonCardsList{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:14px!important;
}
.seasonTournamentCard{
  border-radius:28px!important;
  padding:14px!important;
  display:grid!important;
  gap:12px!important;
  overflow:hidden!important;
}
.seasonTournamentHeader{
  width:100%!important;
  min-height:88px!important;
  border:1px solid rgba(255,255,255,.10)!important;
  background:linear-gradient(135deg,rgba(0,229,255,.13),rgba(255,255,255,.045))!important;
  color:#f8fafc!important;
  border-radius:22px!important;
  padding:12px!important;
  cursor:pointer!important;
  display:grid!important;
  grid-template-columns:64px minmax(0,1fr) 72px 72px!important;
  gap:12px!important;
  align-items:center!important;
  text-align:right!important;
}
.seasonTournamentHeader img{
  width:58px!important;
  height:58px!important;
  object-fit:contain!important;
  filter:drop-shadow(0 8px 12px rgba(0,0,0,.35))!important;
}
.seasonTournamentHeader div{
  min-width:0!important;
  display:grid!important;
  gap:6px!important;
}
.seasonTournamentHeader b{
  font-size:22px!important;
  line-height:1.15!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.seasonTournamentHeader small{
  font-size:13px!important;
  color:#a8b3c7!important;
  font-weight:900!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.seasonTournamentHeader>span{
  height:42px!important;
  border-radius:999px!important;
  background:rgba(255,255,255,.08)!important;
  border:1px solid rgba(255,255,255,.10)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:16px!important;
  font-weight:1000!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
}
.seasonTournamentRows{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:9px!important;
}
.seasonMiniRecord{
  width:100%!important;
  min-height:78px!important;
  border:1px solid rgba(255,255,255,.09)!important;
  background:rgba(2,6,23,.24)!important;
  color:#f8fafc!important;
  border-radius:18px!important;
  padding:10px!important;
  cursor:pointer!important;
  display:grid!important;
  grid-template-columns:80px 1fr 1fr!important;
  gap:8px!important;
  align-items:center!important;
  text-align:center!important;
}
.seasonMiniRecord.hasFinal{
  grid-template-columns:72px 1fr 1fr!important;
  grid-template-rows:auto auto!important;
  border-color:rgba(0,229,255,.20)!important;
}
.seasonMiniRecord span{
  min-width:0!important;
  height:52px!important;
  border-radius:14px!important;
  background:rgba(255,255,255,.052)!important;
  border:1px solid rgba(255,255,255,.07)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:4px!important;
  padding:6px!important;
}
.seasonMiniRecord small{
  color:#a8b3c7!important;
  font-size:10px!important;
  font-weight:900!important;
  line-height:1!important;
}
.seasonMiniRecord b{
  color:#f8fafc!important;
  font-size:13px!important;
  font-weight:1000!important;
  line-height:1.1!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
}
.seasonMiniRecord strong{
  grid-column:1/-1!important;
  min-height:46px!important;
  border-radius:14px!important;
  padding:10px!important;
  background:linear-gradient(135deg,rgba(0,229,255,.16),rgba(47,140,255,.08))!important;
  border:1px solid rgba(0,230,118,.18)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  color:#ecfeff!important;
  font-size:15px!important;
  font-weight:1000!important;
  line-height:1.25!important;
  white-space:normal!important;
}
.seasonShowAllBtn{
  height:42px!important;
  border-radius:999px!important;
  border:1px solid rgba(0,229,255,.28)!important;
  background:rgba(0,229,255,.10)!important;
  color:#ecfeff!important;
  font-size:13px!important;
  font-weight:1000!important;
  cursor:pointer!important;
}

@media(max-width:720px){
  .seasonTournamentCard{
    border-radius:22px!important;
    padding:11px!important;
    gap:10px!important;
  }
  .seasonTournamentHeader{
    min-height:78px!important;
    border-radius:18px!important;
    padding:10px!important;
    grid-template-columns:50px minmax(0,1fr) 50px 50px!important;
    gap:8px!important;
  }
  .seasonTournamentHeader img{
    width:46px!important;
    height:46px!important;
  }
  .seasonTournamentHeader b{
    font-size:17px!important;
  }
  .seasonTournamentHeader small{
    font-size:10px!important;
  }
  .seasonTournamentHeader>span{
    height:32px!important;
    font-size:11px!important;
  }
  .seasonMiniRecord,
  .seasonMiniRecord.hasFinal{
    min-height:72px!important;
    border-radius:16px!important;
    padding:8px!important;
    grid-template-columns:58px 1fr 1fr!important;
    gap:6px!important;
  }
  .seasonMiniRecord span{
    height:48px!important;
    border-radius:12px!important;
    padding:5px!important;
  }
  .seasonMiniRecord small{
    font-size:8px!important;
  }
  .seasonMiniRecord b{
    font-size:11px!important;
  }
  .seasonMiniRecord strong{
    min-height:42px!important;
    border-radius:12px!important;
    padding:8px!important;
    font-size:12px!important;
  }
  .seasonShowAllBtn{
    height:38px!important;
    font-size:12px!important;
  }
}
@media(max-width:380px){
  .seasonTournamentHeader{
    grid-template-columns:44px minmax(0,1fr) 44px 44px!important;
    gap:6px!important;
  }
  .seasonTournamentHeader b{
    font-size:15px!important;
  }
  .seasonTournamentHeader>span{
    font-size:10px!important;
  }
  .seasonMiniRecord,
  .seasonMiniRecord.hasFinal{
    grid-template-columns:52px 1fr 1fr!important;
  }
  .seasonMiniRecord b{
    font-size:10px!important;
  }
}



/* ===== FIX: member stats cards open real finals page instead of blank screen ===== */
.finalsCardsList{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:12px!important;
}
.finalsCard{
  width:100%!important;
  border:1px solid rgba(255,255,255,.12)!important;
  color:#f8fafc!important;
  cursor:pointer!important;
  text-align:right!important;
  border-radius:24px!important;
  padding:14px!important;
  background:rgba(2,6,23,.28)!important;
  display:grid!important;
  gap:12px!important;
  overflow:hidden!important;
}
.finalsCard.win{
  border-color:rgba(34,197,94,.32)!important;
  background:linear-gradient(135deg,rgba(34,197,94,.12),rgba(2,6,23,.26))!important;
}
.finalsCard.loss{
  border-color:rgba(239,68,68,.30)!important;
  background:linear-gradient(135deg,rgba(239,68,68,.11),rgba(2,6,23,.26))!important;
}
.finalsCardTop{
  display:grid!important;
  grid-template-columns:74px minmax(0,1fr) 110px!important;
  gap:10px!important;
  align-items:center!important;
}
.finalsCardTop span{
  height:34px!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-weight:1000!important;
  background:rgba(255,255,255,.08)!important;
}
.finalsCardTop b{
  min-width:0!important;
  font-size:19px!important;
  line-height:1.15!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.finalsCardTop small{
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  color:#cbd5e1!important;
  font-size:13px!important;
  font-weight:900!important;
  text-align:left!important;
}
.finalsCardMeta{
  display:grid!important;
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:8px!important;
}
.finalsCardMeta span{
  min-height:58px!important;
  border-radius:15px!important;
  background:rgba(255,255,255,.052)!important;
  border:1px solid rgba(255,255,255,.07)!important;
  display:grid!important;
  align-content:center!important;
  justify-items:center!important;
  gap:4px!important;
  padding:7px!important;
}
.finalsCardMeta small{
  color:#a8b3c7!important;
  font-size:10px!important;
  font-weight:900!important;
}
.finalsCardMeta b{
  color:#f8fafc!important;
  font-size:14px!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
}
.finalsResultText{
  min-height:48px!important;
  border-radius:15px!important;
  padding:10px!important;
  background:rgba(0,229,255,.10)!important;
  border:1px solid rgba(0,229,255,.18)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  color:#ecfeff!important;
  font-size:15px!important;
  line-height:1.25!important;
  font-weight:1000!important;
  text-align:center!important;
}

@media(max-width:720px){
  .finalsCard{
    border-radius:20px!important;
    padding:11px!important;
    gap:10px!important;
  }
  .finalsCardTop{
    grid-template-columns:58px minmax(0,1fr) 82px!important;
    gap:7px!important;
  }
  .finalsCardTop span{
    height:30px!important;
    font-size:11px!important;
  }
  .finalsCardTop b{
    font-size:15px!important;
  }
  .finalsCardTop small{
    font-size:10px!important;
  }
  .finalsCardMeta{
    gap:6px!important;
  }
  .finalsCardMeta span{
    min-height:52px!important;
    border-radius:13px!important;
    padding:6px 4px!important;
  }
  .finalsCardMeta small{
    font-size:8px!important;
  }
  .finalsCardMeta b{
    font-size:11px!important;
  }
  .finalsResultText{
    min-height:42px!important;
    border-radius:13px!important;
    padding:8px!important;
    font-size:12px!important;
  }
}



/* ===== SEASON PAGE SIMPLE ROW CARDS ONLY ===== */
.seasonCardsList,
.seasonGrid{
  display:none!important;
}
.seasonSimpleList{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:10px!important;
}
.seasonSimpleRow{
  width:100%!important;
  min-height:88px!important;
  border:0!important;
  color:#f8fafc!important;
  cursor:pointer!important;
  border-radius:24px!important;
  padding:12px 14px!important;
  display:grid!important;
  grid-template-columns:64px minmax(0,1fr) 78px 78px!important;
  gap:12px!important;
  align-items:center!important;
  text-align:right!important;
  overflow:hidden!important;
}
.seasonSimpleRow img{
  width:58px!important;
  height:58px!important;
  object-fit:contain!important;
  filter:drop-shadow(0 8px 12px rgba(0,0,0,.35))!important;
}
.seasonSimpleRow div{
  min-width:0!important;
  display:grid!important;
  gap:6px!important;
}
.seasonSimpleRow b{
  font-size:22px!important;
  line-height:1.15!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.seasonSimpleRow small{
  font-size:13px!important;
  color:#a8b3c7!important;
  font-weight:900!important;
}
.seasonSimpleRow span{
  height:42px!important;
  border-radius:999px!important;
  background:rgba(255,255,255,.08)!important;
  border:1px solid rgba(255,255,255,.10)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:16px!important;
  font-weight:1000!important;
  direction:ltr!important;
  unicode-bidi:plaintext!important;
  white-space:nowrap!important;
}

@media(max-width:720px){
  .seasonSimpleList{
    gap:9px!important;
  }
  .seasonSimpleRow{
    min-height:78px!important;
    border-radius:18px!important;
    padding:10px!important;
    grid-template-columns:50px minmax(0,1fr) 50px 50px!important;
    gap:8px!important;
  }
  .seasonSimpleRow img{
    width:46px!important;
    height:46px!important;
  }
  .seasonSimpleRow b{
    font-size:17px!important;
  }
  .seasonSimpleRow small{
    font-size:10px!important;
  }
  .seasonSimpleRow span{
    height:32px!important;
    font-size:11px!important;
  }
}
@media(max-width:380px){
  .seasonSimpleRow{
    grid-template-columns:44px minmax(0,1fr) 44px 44px!important;
    gap:6px!important;
  }
  .seasonSimpleRow b{
    font-size:15px!important;
  }
  .seasonSimpleRow span{
    font-size:10px!important;
  }
}



/* ===== FINAL ART FIX: stats alignment, fixed nav, profile logos inside card, trophy names ===== */

/* Stats cards: icon closer to center number, bottom label raised and aligned visually */
.statCard,
.memberStatsGrid .statCard,
.statsPanelGrid .statCard,
.generalTopStats .statCard{
  display:grid!important;
  grid-template-rows:38px 46px 30px!important;
  align-content:center!important;
  justify-items:center!important;
  text-align:center!important;
  overflow:hidden!important;
}
.statCard span,
.memberStatsGrid .statCard span,
.statsPanelGrid .statCard span,
.generalTopStats .statCard span{
  grid-row:1!important;
  align-self:end!important;
  margin:0 0 -2px!important;
  line-height:1!important;
}
.statCard b,
.statCard strong,
.memberStatsGrid .statCard b,
.memberStatsGrid .statCard strong,
.statsPanelGrid .statCard b,
.statsPanelGrid .statCard strong,
.generalTopStats .statCard b,
.generalTopStats .statCard strong{
  grid-row:2!important;
  align-self:center!important;
  margin:0!important;
  height:46px!important;
  line-height:46px!important;
}
.statCard small,
.statCard p,
.memberStatsGrid .statCard small,
.memberStatsGrid .statCard p,
.statsPanelGrid .statCard small,
.statsPanelGrid .statCard p,
.generalTopStats .statCard small,
.generalTopStats .statCard p{
  grid-row:3!important;
  align-self:start!important;
  margin:-4px 0 0!important;
  height:24px!important;
  line-height:24px!important;
}

/* Bottom bar fixed and stable */
.app{
  padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;
}
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100% - 18px))!important;
  max-width:640px!important;
  margin:0!important;
  z-index:9999!important;
}

/* Keep profile logos inside the profile card */
.memberProfilePage .profileCard{
  position:relative!important;
  overflow:hidden!important;
  padding-left:88px!important;
}
.memberProfilePage .logos{
  position:absolute!important;
  left:14px!important;
  top:14px!important;
  display:flex!important;
  gap:7px!important;
  z-index:4!important;
  margin:0!important;
}
.memberProfilePage .logos .logoItem{
  width:38px!important;
  height:38px!important;
  min-width:38px!important;
  min-height:38px!important;
  padding:0!important;
  border:0!important;
  background:transparent!important;
  display:grid!important;
  place-items:center!important;
  cursor:default!important;
  pointer-events:none!important;
}
.memberProfilePage .logos img{
  width:38px!important;
  height:38px!important;
  min-width:38px!important;
  min-height:38px!important;
  max-width:38px!important;
  max-height:38px!important;
  padding:0!important;
  background:transparent!important;
  border-radius:0!important;
  object-fit:contain!important;
  filter:drop-shadow(0 8px 12px rgba(0,0,0,.35))!important;
}

@media(max-width:720px){
  .app{
    padding-bottom:calc(104px + env(safe-area-inset-bottom))!important;
  }
  .mainNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    border-radius:24px!important;
    padding:7px!important;
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    gap:5px!important;
  }
  .navBtn{
    height:58px!important;
    min-height:58px!important;
  }

  .statCard,
  .memberStatsGrid .statCard,
  .statsPanelGrid .statCard,
  .generalTopStats .statCard{
    grid-template-rows:36px 44px 28px!important;
  }
  .statCard span,
  .memberStatsGrid .statCard span,
  .statsPanelGrid .statCard span,
  .generalTopStats .statCard span{
    margin-bottom:-3px!important;
  }
  .statCard b,
  .statCard strong,
  .memberStatsGrid .statCard b,
  .memberStatsGrid .statCard strong,
  .statsPanelGrid .statCard b,
  .statsPanelGrid .statCard strong,
  .generalTopStats .statCard b,
  .generalTopStats .statCard strong{
    height:44px!important;
    line-height:44px!important;
  }
  .statCard small,
  .statCard p,
  .memberStatsGrid .statCard small,
  .memberStatsGrid .statCard p,
  .statsPanelGrid .statCard small,
  .statsPanelGrid .statCard p,
  .generalTopStats .statCard small,
  .generalTopStats .statCard p{
    margin-top:-5px!important;
  }

  .memberProfilePage .profileCard{
    padding-left:82px!important;
  }
  .memberProfilePage .logos{
    left:12px!important;
    top:12px!important;
    gap:6px!important;
  }
  .memberProfilePage .logos .logoItem,
  .memberProfilePage .logos img{
    width:34px!important;
    height:34px!important;
    min-width:34px!important;
    min-height:34px!important;
    max-width:34px!important;
    max-height:34px!important;
  }
}
@media(max-width:380px){
  .memberProfilePage .profileCard{
    padding-left:74px!important;
  }
  .memberProfilePage .logos .logoItem,
  .memberProfilePage .logos img{
    width:31px!important;
    height:31px!important;
    min-width:31px!important;
    min-height:31px!important;
  }
}



/* ===== FIX: hero only on main members list + true fixed bottom app bar ===== */
.app{
  padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;
}
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100% - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  border-radius:26px!important;
  z-index:9999!important;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  overflow:visible!important;
}
.navBtn{
  height:58px!important;
  min-height:58px!important;
}
.widePage,
.membersHome,
.memberProfilePage{
  margin-bottom:calc(18px + env(safe-area-inset-bottom))!important;
}

/* The fixed bar should overlay only the reserved safe space, never cover useful content */
.listGrid,
.rankingList,
.playersGrid,
.trophyGrid,
.seasonSimpleList,
.archiveTrophyTable,
.archiveMemberList,
.archiveSeasonGrid,
.statsTable,
.finalsCardsList{
  padding-bottom:8px!important;
}

@media(max-width:720px){
  .app{
    padding-bottom:calc(104px + env(safe-area-inset-bottom))!important;
  }
  .mainNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    border-radius:24px!important;
    padding:7px!important;
    gap:5px!important;
  }
  .navBtn{
    height:58px!important;
    min-height:58px!important;
    border-radius:18px!important;
  }
}



/* ===== iOS/SNOONU SAFE AREA + BOTTOM NAV + BACK BUTTON FIX ===== */

/* Full app respects iPhone status bar and home indicator */
html,
body,
#root{
  width:100%!important;
  min-height:100%!important;
  background:#020617!important;
  overflow-x:hidden!important;
}

body{
  margin:0!important;
  padding:0!important;
  padding-top:env(safe-area-inset-top)!important;
  background:#020617!important;
}

.iosSafeApp,
.app{
  min-height:100vh!important;
  padding-top:calc(14px + env(safe-area-inset-top))!important;
  padding-left:14px!important;
  padding-right:14px!important;
  padding-bottom:calc(118px + env(safe-area-inset-bottom))!important;
  overflow-x:hidden!important;
  background:#020617!important;
}

/* Page containers should never start under the iPhone clock/battery */
.mainHero,
.membersHome,
.memberProfilePage,
.widePage,
.announcement{
  position:relative!important;
  z-index:1!important;
}

/* Fixed app bar: real native-app style, not transparent enough to show cards below */
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100% - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  border-radius:28px!important;
  z-index:99999!important;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,rgba(9,14,29,.98),rgba(5,10,23,.98))!important;
  border:1px solid rgba(255,255,255,.12)!important;
  box-shadow:
    0 -10px 34px rgba(0,0,0,.38),
    0 22px 70px rgba(0,0,0,.62),
    inset 0 1px 0 rgba(255,255,255,.12)!important;
  backdrop-filter:blur(26px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(26px) saturate(150%)!important;
}

/* Strong bottom mask so scrolling content does not visually pass through/under the bar */
.mainNav:before{
  content:""!important;
  position:fixed!important;
  left:50%!important;
  bottom:0!important;
  transform:translateX(-50%)!important;
  width:100vw!important;
  height:calc(104px + env(safe-area-inset-bottom))!important;
  background:linear-gradient(180deg,rgba(2,6,23,0),#020617 32%,#020617 100%)!important;
  z-index:-1!important;
  pointer-events:none!important;
}

.navBtn{
  height:58px!important;
  min-height:58px!important;
  min-width:0!important;
  border-radius:22px!important;
  padding:5px 3px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
  color:#d7e3f5!important;
  background:transparent!important;
  border:1px solid transparent!important;
}

.navBtn.active{
  background:linear-gradient(135deg,rgba(0,229,255,.24),rgba(47,140,255,.28))!important;
  border-color:rgba(0,229,255,.42)!important;
  box-shadow:0 10px 28px rgba(0,229,255,.16)!important;
}

/* Snoonu-like circular back button on subpages */
.floatingBackBtn{
  position:sticky!important;
  top:calc(12px + env(safe-area-inset-top))!important;
  z-index:50!important;
  width:58px!important;
  height:58px!important;
  min-width:58px!important;
  min-height:58px!important;
  border:0!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  margin:0 0 14px auto!important;
  background:rgba(255,255,255,.13)!important;
  color:#f8fafc!important;
  font-size:36px!important;
  line-height:1!important;
  font-weight:900!important;
  box-shadow:0 16px 36px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.13)!important;
  backdrop-filter:blur(18px) saturate(140%)!important;
  -webkit-backdrop-filter:blur(18px) saturate(140%)!important;
  cursor:pointer!important;
}

/* Keep content ending above the fixed nav */
.widePage,
.membersHome,
.memberProfilePage{
  margin-bottom:calc(18px + env(safe-area-inset-bottom))!important;
}

@media(max-width:720px){
  .iosSafeApp,
  .app{
    padding-top:calc(12px + env(safe-area-inset-top))!important;
    padding-left:8px!important;
    padding-right:8px!important;
    padding-bottom:calc(112px + env(safe-area-inset-bottom))!important;
  }

  .mainNav{
    width:calc(100% - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    border-radius:26px!important;
    padding:7px!important;
    gap:5px!important;
  }

  .navBtn{
    height:58px!important;
    min-height:58px!important;
    border-radius:20px!important;
  }

  .navIcon{
    font-size:22px!important;
    line-height:1!important;
  }

  .navLabel{
    font-size:10px!important;
    line-height:1.05!important;
    white-space:nowrap!important;
  }

  .floatingBackBtn{
    width:54px!important;
    height:54px!important;
    min-width:54px!important;
    min-height:54px!important;
    font-size:34px!important;
    margin-bottom:12px!important;
  }
}

@media(max-width:380px){
  .navLabel{
    font-size:9px!important;
  }
  .floatingBackBtn{
    width:50px!important;
    height:50px!important;
    min-width:50px!important;
    min-height:50px!important;
    font-size:31px!important;
  }
}



/* ===== HARD STRUCTURAL FIX: status bar, bottom curtain, native app nav ===== */
html{
  background:#020617!important;
  overflow-x:hidden!important;
}
body,#root{
  margin:0!important;
  width:100%!important;
  min-height:100%!important;
  background:#020617!important;
  overflow-x:hidden!important;
}

/* Real top protection for iPhone screenshots/status bar.
   env() can be zero in browser, so we add a small fixed mobile offset too. */
.app.iosSafeApp,
.iosSafeApp,
.app{
  min-height:100vh!important;
  background:#020617!important;
  padding-left:14px!important;
  padding-right:14px!important;
  padding-top:calc(18px + env(safe-area-inset-top))!important;
  padding-bottom:calc(124px + env(safe-area-inset-bottom))!important;
  overflow-x:hidden!important;
}

.bottomNavCurtain{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:calc(118px + env(safe-area-inset-bottom))!important;
  background:linear-gradient(180deg,rgba(2,6,23,0),#020617 28%,#020617 100%)!important;
  z-index:9998!important;
  pointer-events:none!important;
}

/* Force bottom nav to sit above the solid curtain, like a native app */
.mainNav.glassSoft,
.mainNav{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  max-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  border-radius:28px!important;
  z-index:9999!important;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -10px 34px rgba(0,0,0,.42),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}
.mainNav:before{display:none!important;content:none!important}

.navBtn{
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
  min-width:0!important;
  border-radius:21px!important;
  padding:5px 3px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
  overflow:hidden!important;
}

/* Snoonu-like circular back, visible on subpages */
.floatingBackBtn{
  position:sticky!important;
  top:calc(14px + env(safe-area-inset-top))!important;
  z-index:100!important;
  width:62px!important;
  height:62px!important;
  min-width:62px!important;
  min-height:62px!important;
  border:0!important;
  border-radius:999px!important;
  margin:0 0 14px auto!important;
  padding:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:#303033!important;
  color:#fff!important;
  box-shadow:0 16px 36px rgba(0,0,0,.35)!important;
  cursor:pointer!important;
}
.floatingBackBtn span{
  display:block!important;
  font-size:42px!important;
  line-height:1!important;
  font-weight:900!important;
  transform:translateX(-1px)!important;
}

/* Do not let page content sit under the fixed nav */
.widePage,
.membersHome,
.memberProfilePage{
  margin-bottom:0!important;
}

@media(max-width:720px){
  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-left:8px!important;
    padding-right:8px!important;
    /* Fixed extra top offset solves iPhone/Safari status overlay even when env() is not available */
    padding-top:calc(54px + env(safe-area-inset-top))!important;
    padding-bottom:calc(118px + env(safe-area-inset-bottom))!important;
  }
  .bottomNavCurtain{
    height:calc(112px + env(safe-area-inset-bottom))!important;
  }
  .mainNav.glassSoft,
  .mainNav{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    max-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    border-radius:26px!important;
    padding:7px!important;
    gap:5px!important;
  }
  .navBtn{
    height:58px!important;
    min-height:58px!important;
    max-height:58px!important;
    border-radius:20px!important;
  }
  .floatingBackBtn{
    width:58px!important;
    height:58px!important;
    min-width:58px!important;
    min-height:58px!important;
    top:calc(8px + env(safe-area-inset-top))!important;
    margin-bottom:12px!important;
  }
  .floatingBackBtn span{
    font-size:40px!important;
  }
}
@media(max-width:380px){
  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(50px + env(safe-area-inset-top))!important;
  }
  .navLabel{
    font-size:9px!important;
  }
  .floatingBackBtn{
    width:54px!important;
    height:54px!important;
    min-width:54px!important;
    min-height:54px!important;
  }
  .floatingBackBtn span{
    font-size:37px!important;
  }
}



/* ===== TOP SAFE AREA FINAL FIX: content never goes under iPhone status bar ===== */
html,
body,
#root{
  background:#020617!important;
}

body{
  padding-top:0!important;
}

/* keep bottom fix, add stronger real top offset */
.app.iosSafeApp,
.iosSafeApp,
.app{
  padding-top:calc(72px + env(safe-area-inset-top))!important;
}

/* pages and hero start safely below iOS clock/battery */
.mainHero,
.membersHome,
.memberProfilePage,
.widePage,
.announcement{
  margin-top:0!important;
}

/* sticky back button should sit below status bar too */
.floatingBackBtn{
  top:calc(72px + env(safe-area-inset-top))!important;
}

/* On larger desktop/tablet do not overpush too much */
@media(min-width:721px){
  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(28px + env(safe-area-inset-top))!important;
  }
  .floatingBackBtn{
    top:calc(28px + env(safe-area-inset-top))!important;
  }
}

@media(max-width:720px){
  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(76px + env(safe-area-inset-top))!important;
  }
  .floatingBackBtn{
    top:calc(76px + env(safe-area-inset-top))!important;
  }
}

@media(max-width:380px){
  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(72px + env(safe-area-inset-top))!important;
  }
  .floatingBackBtn{
    top:calc(72px + env(safe-area-inset-top))!important;
  }
}



/* ===== FIX MAIN COVER HEADER: sticky/fixed top, content starts below it ===== */

/* Main cover visible only on members home, make it fixed like native top area */
.mainHero{
  position:fixed!important;
  top:calc(10px + env(safe-area-inset-top))!important;
  left:50%!important;
  transform:translateX(-50%)!important;
  width:min(1180px,calc(100% - 28px))!important;
  max-width:1180px!important;
  height:226px!important;
  margin:0!important;
  z-index:9990!important;
  border-radius:34px!important;
  overflow:hidden!important;
}

/* On the main members list only: reserve vertical space for the fixed cover */
.mainHero + .announcement,
.membersHome{
  margin-top:calc(238px + env(safe-area-inset-top))!important;
}

/* If there is no announcement, membersHome still needs room below fixed cover */
.app > .membersHome:first-of-type{
  margin-top:calc(238px + env(safe-area-inset-top))!important;
}

/* Other internal pages should not be pushed by main cover because cover is not rendered there */
.memberProfilePage,
.widePage{
  margin-top:0!important;
}

@media(max-width:720px){
  .mainHero{
    top:calc(8px + env(safe-area-inset-top))!important;
    width:calc(100% - 16px)!important;
    max-width:430px!important;
    height:188px!important;
    min-height:188px!important;
    border-radius:24px!important;
  }

  .mainHero + .announcement,
  .membersHome{
    margin-top:calc(202px + env(safe-area-inset-top))!important;
  }

  .app > .membersHome:first-of-type{
    margin-top:calc(202px + env(safe-area-inset-top))!important;
  }
}

@media(max-width:380px){
  .mainHero{
    height:174px!important;
    min-height:174px!important;
  }

  .mainHero + .announcement,
  .membersHome{
    margin-top:calc(188px + env(safe-area-inset-top))!important;
  }

  .app > .membersHome:first-of-type{
    margin-top:calc(188px + env(safe-area-inset-top))!important;
  }
}



/* ===== REAL TOP STATUS CURTAIN: prevents content showing under clock/battery while scrolling ===== */
.topStatusCurtain{
  position:fixed!important;
  top:0!important;
  left:0!important;
  right:0!important;
  height:calc(58px + env(safe-area-inset-top))!important;
  background:#020617!important;
  z-index:100000!important;
  pointer-events:none!important;
}

/* Push all app content below the visual status curtain */
.app.iosSafeApp,
.iosSafeApp,
.app{
  padding-top:calc(70px + env(safe-area-inset-top))!important;
}

/* Any fixed header must start below the curtain */
.mainHero{
  top:calc(64px + env(safe-area-inset-top))!important;
}

/* Sticky back button also starts below the curtain */
.floatingBackBtn{
  top:calc(66px + env(safe-area-inset-top))!important;
}

@media(max-width:720px){
  .topStatusCurtain{
    height:calc(62px + env(safe-area-inset-top))!important;
  }

  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(74px + env(safe-area-inset-top))!important;
  }

  .mainHero{
    top:calc(66px + env(safe-area-inset-top))!important;
  }

  .floatingBackBtn{
    top:calc(68px + env(safe-area-inset-top))!important;
  }

  .mainHero + .announcement,
  .membersHome,
  .app > .membersHome:first-of-type{
    margin-top:calc(270px + env(safe-area-inset-top))!important;
  }
}

@media(max-width:380px){
  .topStatusCurtain{
    height:calc(58px + env(safe-area-inset-top))!important;
  }

  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(70px + env(safe-area-inset-top))!important;
  }

  .mainHero{
    top:calc(62px + env(safe-area-inset-top))!important;
  }

  .mainHero + .announcement,
  .membersHome,
  .app > .membersHome:first-of-type{
    margin-top:calc(250px + env(safe-area-inset-top))!important;
  }
}



/* ===== FINAL TOP AREA TUNING: smaller status curtain + cover not fixed + Snoonu back space ===== */

/* Smaller top curtain: only protects clock/battery area, not a huge blank area */
.topStatusCurtain{
  height:calc(38px + env(safe-area-inset-top))!important;
  background:#020617!important;
}

/* App starts below small safe area only */
.app.iosSafeApp,
.iosSafeApp,
.app{
  padding-top:calc(46px + env(safe-area-inset-top))!important;
}

/* Unfix the main cover: it scrolls normally again */
.mainHero{
  position:relative!important;
  top:auto!important;
  left:auto!important;
  transform:none!important;
  width:100%!important;
  margin:0 auto 14px!important;
  z-index:1!important;
}

/* Remove the extra reserved space that was added for fixed cover */
.mainHero + .announcement,
.membersHome,
.app > .membersHome:first-of-type{
  margin-top:0!important;
}

/* Snoonu-like back button uses the top safe space nicely on subpages */
.floatingBackBtn{
  position:sticky!important;
  top:calc(46px + env(safe-area-inset-top))!important;
  z-index:100001!important;
  width:58px!important;
  height:58px!important;
  min-width:58px!important;
  min-height:58px!important;
  margin:0 0 14px auto!important;
  border-radius:999px!important;
  background:#303033!important;
  color:#fff!important;
  box-shadow:0 16px 36px rgba(0,0,0,.35)!important;
}

@media(max-width:720px){
  .topStatusCurtain{
    height:calc(40px + env(safe-area-inset-top))!important;
  }

  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(48px + env(safe-area-inset-top))!important;
  }

  .mainHero{
    position:relative!important;
    top:auto!important;
    left:auto!important;
    transform:none!important;
    width:100%!important;
    max-width:430px!important;
    margin:0 auto 10px!important;
  }

  .mainHero + .announcement,
  .membersHome,
  .app > .membersHome:first-of-type{
    margin-top:0!important;
  }

  .floatingBackBtn{
    top:calc(48px + env(safe-area-inset-top))!important;
    width:56px!important;
    height:56px!important;
    min-width:56px!important;
    min-height:56px!important;
  }
}

@media(max-width:380px){
  .topStatusCurtain{
    height:calc(38px + env(safe-area-inset-top))!important;
  }

  .app.iosSafeApp,
  .iosSafeApp,
  .app{
    padding-top:calc(44px + env(safe-area-inset-top))!important;
  }

  .floatingBackBtn{
    top:calc(44px + env(safe-area-inset-top))!important;
    width:52px!important;
    height:52px!important;
    min-width:52px!important;
    min-height:52px!important;
  }
}



/* ===== SEASON PAGE NO EXTRA SCROLL WHEN CONTENT FITS ===== */
.seasonCardsPage{
  min-height:auto!important;
  height:auto!important;
  margin-bottom:0!important;
  padding-bottom:16px!important;
}

.seasonSimpleList{
  padding-bottom:0!important;
  margin-bottom:0!important;
}

/* prevent hidden old season grids from keeping extra scroll space */
.seasonCardsList,
.seasonGrid{
  display:none!important;
  height:0!important;
  min-height:0!important;
  max-height:0!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
}

/* when season page is short, bottom reserved area stays only for nav, not extra fake scroll */
@media(max-width:720px){
  .seasonCardsPage{
    padding-bottom:10px!important;
  }

  .seasonSimpleRow:last-child{
    margin-bottom:0!important;
  }
}



/* ===== GLOBAL SCROLL FIX: no fake body scroll when content fits ===== */
/* The earlier safe-area padding made body taller than the viewport. 
   Now the app itself is the scroll container; body never creates extra scroll. */
html,
body,
#root{
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  background:#020617!important;
}

*{
  box-sizing:border-box!important;
}

.app,
.app.iosSafeApp,
.iosSafeApp{
  height:100dvh!important;
  min-height:100dvh!important;
  max-height:100dvh!important;
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
}

/* Loading / maintenance screen must never show a fake scrollbar */
.systemScreen{
  width:100%!important;
  height:100dvh!important;
  min-height:100dvh!important;
  max-height:100dvh!important;
  overflow:hidden!important;
}

/* If a page is shorter than the viewport, it should not force scroll */
.membersHome,
.memberProfilePage,
.widePage,
.seasonCardsPage{
  min-height:auto!important;
}

/* Keep bottom nav safe without adding body-height scroll */
.bottomNavCurtain,
.topStatusCurtain,
.mainNav{
  flex:0 0 auto!important;
}

@media(max-width:720px){
  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    height:100dvh!important;
    min-height:100dvh!important;
    max-height:100dvh!important;
  }
}



/* ===== TRADINGVIEW-STYLE BOUNDED SCROLL MODEL ===== */
/* Goal: scrollbar/content area starts below status bar and ends above bottom nav. */

html,
body,
#root{
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  background:#020617!important;
}

/* The app itself is the ONLY scroll container.
   Its top and bottom boundaries match native apps: below status bar, above bottom nav. */
.app,
.app.iosSafeApp,
.iosSafeApp{
  position:fixed!important;
  left:0!important;
  right:0!important;
  top:calc(42px + env(safe-area-inset-top))!important;
  bottom:calc(100px + env(safe-area-inset-bottom))!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  padding:0 14px 14px!important;
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  background:#020617!important;
}

/* no fake status curtain needed; scroll area itself starts below status bar */
.topStatusCurtain{
  display:none!important;
}

/* remove old huge safe-area padding leftovers */
.mainHero,
.membersHome,
.memberProfilePage,
.widePage,
.announcement{
  margin-top:0!important;
}

/* Bottom bar is outside the scroll area visually */
.bottomNavCurtain{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:calc(100px + env(safe-area-inset-bottom))!important;
  background:#020617!important;
  z-index:9998!important;
  pointer-events:none!important;
}

.mainNav,
.mainNav.glassSoft{
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  border-radius:28px!important;
  z-index:9999!important;
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -8px 28px rgba(0,0,0,.32),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}
.mainNav:before{
  display:none!important;
  content:none!important;
}

.navBtn{
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
}

/* Main cover is normal, not fixed */
.mainHero{
  position:relative!important;
  top:auto!important;
  left:auto!important;
  transform:none!important;
  width:100%!important;
  margin:0 auto 14px!important;
  z-index:1!important;
}

/* Subpage back button lives at the top of the bounded scroll area */
.floatingBackBtn{
  position:sticky!important;
  top:8px!important;
  z-index:100!important;
  width:58px!important;
  height:58px!important;
  min-width:58px!important;
  min-height:58px!important;
  border:0!important;
  border-radius:999px!important;
  margin:0 0 14px auto!important;
  padding:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:#303033!important;
  color:#fff!important;
  box-shadow:0 16px 36px rgba(0,0,0,.35)!important;
  cursor:pointer!important;
}
.floatingBackBtn span{
  display:block!important;
  font-size:40px!important;
  line-height:1!important;
  font-weight:900!important;
}

/* Page containers should not add fake extra scroll */
.widePage,
.membersHome,
.memberProfilePage,
.seasonCardsPage{
  min-height:auto!important;
  margin-bottom:0!important;
}

.systemScreen{
  position:fixed!important;
  inset:0!important;
  width:100%!important;
  height:100dvh!important;
  min-height:100dvh!important;
  max-height:100dvh!important;
  overflow:hidden!important;
  background:#020617!important;
}

@media(max-width:720px){
  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    top:calc(44px + env(safe-area-inset-top))!important;
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
    padding:0 8px 10px!important;
  }

  .bottomNavCurtain{
    height:calc(92px + env(safe-area-inset-bottom))!important;
  }

  .mainNav,
  .mainNav.glassSoft{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    border-radius:26px!important;
    padding:7px!important;
    gap:5px!important;
  }

  .navBtn{
    height:58px!important;
    min-height:58px!important;
    max-height:58px!important;
  }

  .floatingBackBtn{
    width:56px!important;
    height:56px!important;
    min-width:56px!important;
    min-height:56px!important;
    top:8px!important;
  }

  .floatingBackBtn span{
    font-size:38px!important;
  }
}

@media(max-width:380px){
  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    top:calc(40px + env(safe-area-inset-top))!important;
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
    padding:0 8px 10px!important;
  }

  .bottomNavCurtain{
    height:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .floatingBackBtn{
    width:52px!important;
    height:52px!important;
    min-width:52px!important;
    min-height:52px!important;
  }

  .floatingBackBtn span{
    font-size:35px!important;
  }
}



/* ===== FIX: bottom nav always visible on every page after bounded scroll ===== */
.bottomNavCurtain{
  display:block!important;
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:calc(96px + env(safe-area-inset-bottom))!important;
  background:#020617!important;
  z-index:2147483000!important;
  pointer-events:none!important;
}

.mainNav,
.mainNav.glassSoft{
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  max-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  border-radius:28px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -8px 28px rgba(0,0,0,.32),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  z-index:2147483001!important;
}

.mainNav *,
.mainNav.glassSoft *{
  visibility:visible!important;
  opacity:1!important;
}

.navBtn{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
}

/* Prevent page panels/modals from covering the nav unless it is a real modal drawer */
.app,
.app.iosSafeApp,
.iosSafeApp{
  z-index:1!important;
}

.drawerBackdrop{
  z-index:2147483002!important;
}

/* Keep the scroll area ending above the nav */
.app,
.app.iosSafeApp,
.iosSafeApp{
  bottom:calc(96px + env(safe-area-inset-bottom))!important;
}

@media(max-width:720px){
  .bottomNavCurtain{
    height:calc(92px + env(safe-area-inset-bottom))!important;
  }

  .mainNav,
  .mainNav.glassSoft{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    max-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    padding:7px!important;
    gap:5px!important;
    border-radius:26px!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
  }
}

@media(max-width:380px){
  .bottomNavCurtain{
    height:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }
}



/* ===== MOBILE NAV PORTAL FIX: bottom nav rendered on body, always visible ===== */
.bottomNavCurtain{
  display:none!important;
}

.bottomNavPortalCurtain{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:calc(96px + env(safe-area-inset-bottom))!important;
  background:#020617!important;
  z-index:2147483600!important;
  pointer-events:none!important;
  display:block!important;
}

body > .mainNav,
body > .mainNav.glassSoft,
.mainNav,
.mainNav.glassSoft{
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  max-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  border-radius:28px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -8px 28px rgba(0,0,0,.32),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  z-index:2147483601!important;
  clip:auto!important;
}

body > .mainNav *,
.mainNav *{
  visibility:visible!important;
  opacity:1!important;
}

.navBtn{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
}

.app,
.app.iosSafeApp,
.iosSafeApp{
  bottom:calc(96px + env(safe-area-inset-bottom))!important;
}

@media(max-width:720px){
  .bottomNavPortalCurtain{
    height:calc(92px + env(safe-area-inset-bottom))!important;
  }

  body > .mainNav,
  body > .mainNav.glassSoft,
  .mainNav,
  .mainNav.glassSoft{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    max-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    padding:7px!important;
    gap:5px!important;
    border-radius:26px!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
  }
}

@media(max-width:380px){
  .bottomNavPortalCurtain{
    height:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }
}



/* ===== FINAL GLOBAL APP BOUNDS: top system bar + bottom nav + drawer inside bounds ===== */
:root{
  --app-top-safe: calc(44px + env(safe-area-inset-top));
  --app-bottom-safe: calc(92px + env(safe-area-inset-bottom));
}

html,body,#root{
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  background:#020617!important;
}

/* The app scroll area is always between the upper and lower bars.
   This makes every current/future page obey the same safe area. */
.app,
.app.iosSafeApp,
.iosSafeApp{
  position:fixed!important;
  inset-inline:0!important;
  top:var(--app-top-safe)!important;
  bottom:var(--app-bottom-safe)!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  padding:0 14px 14px!important;
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  background:#020617!important;
  z-index:1!important;
}

/* Top bar rendered through portal to body, so it appears on ALL pages */
.topSystemPortalBar{
  position:fixed!important;
  top:0!important;
  left:0!important;
  right:0!important;
  height:var(--app-top-safe)!important;
  background:#020617!important;
  z-index:2147483602!important;
  pointer-events:none!important;
  display:block!important;
}

/* Bottom bar rendered through portal to body */
.bottomNavPortalCurtain{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:var(--app-bottom-safe)!important;
  background:#020617!important;
  z-index:2147483600!important;
  pointer-events:none!important;
  display:block!important;
}

.bottomNavCurtain,
.topStatusCurtain{
  display:none!important;
}

/* Bottom nav always visible */
body > .mainNav,
body > .mainNav.glassSoft,
.mainNav,
.mainNav.glassSoft{
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:74px!important;
  min-height:74px!important;
  max-height:74px!important;
  margin:0!important;
  padding:8px 10px!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:7px!important;
  border-radius:28px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -8px 28px rgba(0,0,0,.32),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  z-index:2147483601!important;
  clip:auto!important;
}

.navBtn{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
}

/* Drawer / menu is also bounded between top and bottom bars */
.drawerBackdrop{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  bottom:var(--app-bottom-safe)!important;
  left:0!important;
  right:0!important;
  height:auto!important;
  inset:auto 0 var(--app-bottom-safe) 0!important;
  z-index:2147483599!important;
  background:rgba(0,0,0,.46)!important;
  display:flex!important;
  justify-content:flex-start!important;
  align-items:stretch!important;
  overflow:hidden!important;
}

.sideDrawer{
  height:100%!important;
  max-height:100%!important;
  overflow-y:auto!important;
  border-radius:0 28px 28px 0!important;
}

/* Back button remains inside the app's bounded scroll zone */
.floatingBackBtn{
  position:sticky!important;
  top:8px!important;
  z-index:100!important;
}

/* Main cover normal, no fixed behavior */
.mainHero{
  position:relative!important;
  top:auto!important;
  left:auto!important;
  transform:none!important;
  width:100%!important;
  margin:0 auto 14px!important;
  z-index:1!important;
}

.widePage,
.membersHome,
.memberProfilePage,
.seasonCardsPage{
  min-height:auto!important;
  margin-top:0!important;
  margin-bottom:0!important;
}

.systemScreen{
  position:fixed!important;
  inset:0!important;
  width:100%!important;
  height:100dvh!important;
  min-height:100dvh!important;
  max-height:100dvh!important;
  overflow:hidden!important;
  background:#020617!important;
}

@media(max-width:720px){
  :root{
    --app-top-safe: calc(44px + env(safe-area-inset-top));
    --app-bottom-safe: calc(92px + env(safe-area-inset-bottom));
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    padding:0 8px 10px!important;
  }

  body > .mainNav,
  body > .mainNav.glassSoft,
  .mainNav,
  .mainNav.glassSoft{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    max-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
    padding:7px!important;
    gap:5px!important;
    border-radius:26px!important;
  }

  .navBtn{
    height:58px!important;
    min-height:58px!important;
    max-height:58px!important;
  }
}

@media(max-width:380px){
  :root{
    --app-top-safe: calc(40px + env(safe-area-inset-top));
    --app-bottom-safe: calc(88px + env(safe-area-inset-bottom));
  }
}



/* ===== FIX RTL NAV ORDER + RIGHT SIDE MENU ===== */

/* Bottom nav must keep RTL visual order:
   الأعضاء on the right, المزيد on the left */
body > .mainNav,
body > .mainNav.glassSoft,
.mainNav,
.mainNav.glassSoft{
  direction:rtl!important;
}

.mainNav .navBtn{
  direction:rtl!important;
}

/* Menu drawer opens from right side, inside app bounds */
.drawerBackdrop{
  justify-content:flex-end!important;
  align-items:stretch!important;
  direction:rtl!important;
}

.sideDrawer{
  width:min(86vw,360px)!important;
  height:100%!important;
  max-height:100%!important;
  min-height:100%!important;
  border-radius:28px 0 0 28px!important;
  padding:22px!important;
  direction:rtl!important;
  overflow-y:auto!important;
}

.sideDrawer header{
  min-height:64px!important;
  margin-bottom:18px!important;
}

.sideDrawer header b{
  font-size:30px!important;
  line-height:1.15!important;
}

.sideDrawer header button{
  width:52px!important;
  height:52px!important;
  min-width:52px!important;
  min-height:52px!important;
  font-size:34px!important;
}

.sideDrawer>button{
  height:72px!important;
  min-height:72px!important;
  border-radius:22px!important;
  margin-bottom:12px!important;
  padding:0 18px!important;
  justify-content:flex-start!important;
  gap:16px!important;
}

.sideDrawer>button span{
  font-size:30px!important;
}

.sideDrawer>button b{
  font-size:20px!important;
  line-height:1.1!important;
}

@media(max-width:720px){
  .sideDrawer{
    width:min(84vw,340px)!important;
    padding:20px!important;
    border-radius:26px 0 0 26px!important;
  }

  .sideDrawer header{
    min-height:60px!important;
  }

  .sideDrawer header b{
    font-size:28px!important;
  }

  .sideDrawer header button{
    width:50px!important;
    height:50px!important;
    min-width:50px!important;
    min-height:50px!important;
    font-size:32px!important;
  }

  .sideDrawer>button{
    height:70px!important;
    min-height:70px!important;
    border-radius:20px!important;
  }

  .sideDrawer>button span{
    font-size:28px!important;
  }

  .sideDrawer>button b{
    font-size:19px!important;
  }
}

@media(max-width:380px){
  .sideDrawer{
    width:min(86vw,320px)!important;
    padding:18px!important;
  }

  .sideDrawer>button{
    height:66px!important;
    min-height:66px!important;
  }

  .sideDrawer>button b{
    font-size:17px!important;
  }
}



/* ===== HARD FIX: right menu full bounded height, no black shadow/footer ===== */
:root{
  --app-top-safe: calc(44px + env(safe-area-inset-top));
  --app-bottom-safe: calc(92px + env(safe-area-inset-bottom));
}

/* Backdrop occupies exactly app viewport between top status area and bottom nav */
.drawerBackdrop{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  right:0!important;
  bottom:var(--app-bottom-safe)!important;
  left:0!important;
  width:100vw!important;
  height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
  min-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
  max-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
  inset:auto!important;
  margin:0!important;
  padding:0!important;
  display:flex!important;
  align-items:stretch!important;
  justify-content:flex-end!important;
  background:rgba(0,0,0,.28)!important;
  box-shadow:none!important;
  overflow:hidden!important;
  z-index:2147483599!important;
  direction:rtl!important;
}

/* Drawer must fill the whole bounded area, no short card, no bottom shadow */
.sideDrawer,
.drawerBackdrop .sideDrawer{
  position:relative!important;
  align-self:stretch!important;
  width:min(86vw,360px)!important;
  height:100%!important;
  min-height:100%!important;
  max-height:100%!important;
  margin:0!important;
  padding:22px!important;
  border-radius:28px 0 0 28px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  background:linear-gradient(135deg,rgba(73,83,101,.98),rgba(41,47,59,.98))!important;
  border:1px solid rgba(255,255,255,.16)!important;
  border-right:0!important;
  box-shadow:none!important;
  backdrop-filter:blur(24px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(24px) saturate(150%)!important;
  direction:rtl!important;
}

/* Remove any pseudo/shadow leftovers from glass or panels */
.sideDrawer:before,
.sideDrawer:after,
.drawerBackdrop:before,
.drawerBackdrop:after{
  display:none!important;
  content:none!important;
  box-shadow:none!important;
  background:none!important;
}

.sideDrawer header{
  min-height:64px!important;
  margin:0 0 18px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
}

.sideDrawer header b{
  font-size:30px!important;
  line-height:1.15!important;
  font-weight:1000!important;
}

.sideDrawer header button{
  width:52px!important;
  height:52px!important;
  min-width:52px!important;
  min-height:52px!important;
  border-radius:999px!important;
  font-size:34px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}

.sideDrawer>button{
  width:100%!important;
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  margin:0 0 12px!important;
  padding:0 18px!important;
  border-radius:22px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:16px!important;
  text-align:right!important;
  box-shadow:none!important;
}

.sideDrawer>button span{
  font-size:30px!important;
}

.sideDrawer>button b{
  font-size:20px!important;
  line-height:1.1!important;
}

/* Make sure bottom nav remains above the backdrop only visually if needed */
.bottomNavPortalCurtain{
  z-index:2147483600!important;
}
.mainNav,
.mainNav.glassSoft{
  z-index:2147483601!important;
}

@media(max-width:720px){
  :root{
    --app-top-safe: calc(44px + env(safe-area-inset-top));
    --app-bottom-safe: calc(92px + env(safe-area-inset-bottom));
  }

  .drawerBackdrop{
    height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
    min-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
    max-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
  }

  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:min(84vw,340px)!important;
    height:100%!important;
    min-height:100%!important;
    max-height:100%!important;
    padding:20px!important;
    border-radius:26px 0 0 26px!important;
  }
}

@media(max-width:380px){
  :root{
    --app-top-safe: calc(40px + env(safe-area-inset-top));
    --app-bottom-safe: calc(88px + env(safe-area-inset-bottom));
  }

  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:min(86vw,320px)!important;
    padding:18px!important;
  }

  .sideDrawer>button{
    height:66px!important;
    min-height:66px!important;
    max-height:66px!important;
  }
}



/* ===== MENU ONLY RESET: compact drawer like the earlier app, keep all other fixes ===== */
/* This block intentionally touches ONLY the menu/drawer. */

.drawerBackdrop{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  right:0!important;
  bottom:var(--app-bottom-safe)!important;
  left:0!important;
  width:100vw!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  inset:auto 0 var(--app-bottom-safe) 0!important;
  margin:0!important;
  padding:10px 0 0 0!important;
  display:flex!important;
  align-items:flex-start!important;
  justify-content:flex-end!important;
  background:rgba(0,0,0,.18)!important;
  box-shadow:none!important;
  overflow:hidden!important;
  z-index:2147483599!important;
  direction:rtl!important;
}

.sideDrawer,
.drawerBackdrop .sideDrawer{
  position:relative!important;
  align-self:flex-start!important;
  width:min(78vw,330px)!important;
  height:auto!important;
  min-height:0!important;
  max-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe) - 22px)!important;
  margin:0!important;
  padding:18px!important;
  border-radius:24px 0 0 24px!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  background:linear-gradient(135deg,rgba(72,82,100,.94),rgba(42,48,61,.94))!important;
  border:1px solid rgba(255,255,255,.16)!important;
  border-right:0!important;
  box-shadow:0 18px 42px rgba(0,0,0,.28)!important;
  backdrop-filter:blur(22px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(22px) saturate(150%)!important;
  direction:rtl!important;
}

.sideDrawer:before,
.sideDrawer:after,
.drawerBackdrop:before,
.drawerBackdrop:after{
  display:none!important;
  content:none!important;
}

.sideDrawer header{
  min-height:46px!important;
  height:46px!important;
  margin:0 0 14px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
}

.sideDrawer header b{
  font-size:24px!important;
  line-height:1.15!important;
  font-weight:1000!important;
}

.sideDrawer header button{
  width:42px!important;
  height:42px!important;
  min-width:42px!important;
  min-height:42px!important;
  border-radius:999px!important;
  font-size:28px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}

.sideDrawer>button{
  width:100%!important;
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
  margin:0 0 10px!important;
  padding:0 14px!important;
  border-radius:18px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:12px!important;
  text-align:right!important;
  box-shadow:none!important;
}

.sideDrawer>button span{
  font-size:24px!important;
}

.sideDrawer>button b{
  font-size:16px!important;
  line-height:1.1!important;
}

@media(max-width:720px){
  .drawerBackdrop{
    padding-top:8px!important;
  }

  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:min(78vw,320px)!important;
    padding:16px!important;
    border-radius:22px 0 0 22px!important;
    max-height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe) - 18px)!important;
  }

  .sideDrawer header{
    height:44px!important;
    min-height:44px!important;
    margin-bottom:12px!important;
  }

  .sideDrawer header b{
    font-size:23px!important;
  }

  .sideDrawer header button{
    width:40px!important;
    height:40px!important;
    min-width:40px!important;
    min-height:40px!important;
    font-size:26px!important;
  }

  .sideDrawer>button{
    height:56px!important;
    min-height:56px!important;
    max-height:56px!important;
    border-radius:17px!important;
  }

  .sideDrawer>button span{
    font-size:23px!important;
  }

  .sideDrawer>button b{
    font-size:15px!important;
  }
}

@media(max-width:380px){
  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:min(80vw,300px)!important;
    padding:15px!important;
  }

  .sideDrawer>button{
    height:54px!important;
    min-height:54px!important;
    max-height:54px!important;
  }
}



/* ===== MENU EXACT REFERENCE STYLE - FIFA DARK THEME ONLY ===== */
/* Touches menu only: tall right drawer, large rows, same app dark/glass theme. */

.drawerBackdrop{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  right:0!important;
  bottom:var(--app-bottom-safe)!important;
  left:0!important;
  width:100vw!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  inset:auto 0 var(--app-bottom-safe) 0!important;
  margin:0!important;
  padding:0!important;
  display:flex!important;
  align-items:stretch!important;
  justify-content:flex-end!important;
  background:rgba(2,6,23,.48)!important;
  box-shadow:none!important;
  overflow:hidden!important;
  z-index:2147483599!important;
  direction:rtl!important;
  backdrop-filter:blur(2px)!important;
  -webkit-backdrop-filter:blur(2px)!important;
}

.sideDrawer,
.drawerBackdrop .sideDrawer{
  position:relative!important;
  align-self:stretch!important;
  width:min(82vw,390px)!important;
  height:100%!important;
  min-height:100%!important;
  max-height:100%!important;
  margin:0!important;
  padding:34px 18px 18px!important;
  border-radius:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(8,13,28,.985))!important;
  border-left:1px solid rgba(255,255,255,.12)!important;
  border-top:0!important;
  border-bottom:0!important;
  border-right:0!important;
  box-shadow:-18px 0 40px rgba(0,0,0,.34)!important;
  backdrop-filter:blur(26px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(26px) saturate(150%)!important;
  direction:rtl!important;
}

.sideDrawer:before{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  pointer-events:none!important;
  background:
    radial-gradient(circle at 92% 8%,rgba(0,229,255,.16),transparent 30%),
    radial-gradient(circle at 0% 35%,rgba(139,92,246,.12),transparent 32%)!important;
  opacity:1!important;
}

.sideDrawer:after{
  display:none!important;
  content:none!important;
}

.sideDrawer header{
  position:relative!important;
  z-index:1!important;
  min-height:58px!important;
  height:58px!important;
  margin:0 0 24px!important;
  padding:0 8px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
}

.sideDrawer header b{
  font-size:34px!important;
  line-height:1.1!important;
  font-weight:1000!important;
  color:#f8fafc!important;
  letter-spacing:-.7px!important;
}

.sideDrawer header button{
  width:58px!important;
  height:58px!important;
  min-width:58px!important;
  min-height:58px!important;
  border-radius:999px!important;
  border:0!important;
  font-size:38px!important;
  line-height:1!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:rgba(255,255,255,.10)!important;
  color:#fff!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12)!important;
}

.sideDrawer>button{
  position:relative!important;
  z-index:1!important;
  width:100%!important;
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  margin:0 0 12px!important;
  padding:0 18px!important;
  border-radius:18px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:16px!important;
  text-align:right!important;
  direction:rtl!important;
  background:rgba(255,255,255,.075)!important;
  border:1px solid rgba(255,255,255,.10)!important;
  color:#f8fafc!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10)!important;
}

.sideDrawer>button:active{
  transform:scale(.985)!important;
  background:rgba(0,229,255,.14)!important;
  border-color:rgba(0,229,255,.28)!important;
}

.sideDrawer>button span{
  width:42px!important;
  min-width:42px!important;
  height:42px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:30px!important;
  line-height:1!important;
  filter:drop-shadow(0 8px 10px rgba(0,0,0,.30))!important;
}

.sideDrawer>button b{
  font-size:22px!important;
  line-height:1.12!important;
  font-weight:1000!important;
  color:#f8fafc!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}

@media(max-width:720px){
  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:82vw!important;
    max-width:390px!important;
    padding:30px 16px 16px!important;
  }

  .sideDrawer header{
    height:56px!important;
    min-height:56px!important;
    margin-bottom:22px!important;
  }

  .sideDrawer header b{
    font-size:32px!important;
  }

  .sideDrawer header button{
    width:56px!important;
    height:56px!important;
    min-width:56px!important;
    min-height:56px!important;
    font-size:36px!important;
  }

  .sideDrawer>button{
    height:70px!important;
    min-height:70px!important;
    max-height:70px!important;
    border-radius:17px!important;
    padding:0 16px!important;
    gap:14px!important;
  }

  .sideDrawer>button span{
    width:40px!important;
    min-width:40px!important;
    height:40px!important;
    font-size:28px!important;
  }

  .sideDrawer>button b{
    font-size:21px!important;
  }
}

@media(max-width:380px){
  .sideDrawer,
  .drawerBackdrop .sideDrawer{
    width:84vw!important;
    padding:26px 14px 14px!important;
  }

  .sideDrawer header b{
    font-size:29px!important;
  }

  .sideDrawer header button{
    width:52px!important;
    height:52px!important;
    min-width:52px!important;
    min-height:52px!important;
    font-size:34px!important;
  }

  .sideDrawer>button{
    height:66px!important;
    min-height:66px!important;
    max-height:66px!important;
    padding:0 14px!important;
  }

  .sideDrawer>button b{
    font-size:19px!important;
  }
}



/* ===== DEFINITIVE MENU FIX - native compact V4 drawer ===== */
.fgMenuBackdrop{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  right:0!important;
  bottom:var(--app-bottom-safe)!important;
  left:0!important;
  width:100vw!important;
  height:calc(100dvh - var(--app-top-safe) - var(--app-bottom-safe))!important;
  padding:0!important;
  margin:0!important;
  z-index:2147483599!important;
  display:flex!important;
  align-items:stretch!important;
  justify-content:flex-end!important;
  background:rgba(2,6,23,.38)!important;
  backdrop-filter:blur(8px)!important;
  -webkit-backdrop-filter:blur(8px)!important;
  overflow:hidden!important;
  direction:rtl!important;
}

.fgMenuPanel{
  width:min(78vw,360px)!important;
  height:100%!important;
  min-height:100%!important;
  max-height:100%!important;
  margin:0!important;
  padding:24px 15px 18px!important;
  border:0!important;
  border-left:1px solid rgba(0,230,118,.18)!important;
  border-radius:0!important;
  background:
    radial-gradient(circle at 86% 4%,rgba(0,230,118,.14),transparent 34%),
    radial-gradient(circle at 0% 46%,rgba(0,212,255,.07),transparent 34%),
    linear-gradient(180deg,rgba(3,7,18,.97),rgba(5,10,22,.985))!important;
  box-shadow:-18px 0 50px rgba(0,0,0,.40),inset 0 1px 0 rgba(255,255,255,.07)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  direction:rtl!important;
  box-sizing:border-box!important;
  display:flex!important;
  flex-direction:column!important;
}

.fgMenuHeader{
  height:50px!important;
  min-height:50px!important;
  margin:0 0 18px!important;
  padding:0 4px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:12px!important;
}

.fgMenuHeader h2{
  margin:0!important;
  padding:0!important;
  color:#f8fafc!important;
  font-size:29px!important;
  line-height:1.25!important;
  font-weight:900!important;
  letter-spacing:0!important;
  background:linear-gradient(135deg,#ffffff 38%,#67f5c0 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
}

.fgMenuHeader button{
  width:44px!important;
  height:44px!important;
  min-width:44px!important;
  min-height:44px!important;
  border:1px solid rgba(255,255,255,.10)!important;
  border-radius:16px!important;
  background:rgba(255,255,255,.065)!important;
  color:#fff!important;
  font-size:23px!important;
  line-height:1!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  cursor:pointer!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 10px 22px rgba(0,0,0,.20)!important;
}

.fgMenuItems{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:10px!important;
  width:100%!important;
}

.fgMenuItem{
  width:100%!important;
  height:60px!important;
  min-height:60px!important;
  max-height:60px!important;
  margin:0!important;
  padding:0 14px!important;
  border-radius:19px!important;
  border:1px solid rgba(255,255,255,.09)!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(0,230,118,.055),transparent 48%),
    linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.018))!important;
  color:#f8fafc!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 8px 18px rgba(0,0,0,.12)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:12px!important;
  direction:rtl!important;
  text-align:right!important;
  cursor:pointer!important;
  box-sizing:border-box!important;
  overflow:visible!important;
}

.fgMenuItem:active{
  transform:scale(.99)!important;
  background:linear-gradient(135deg,rgba(0,230,118,.12),rgba(0,212,255,.05))!important;
  border-color:rgba(0,230,118,.24)!important;
}

.fgMenuIcon{
  width:38px!important;
  min-width:38px!important;
  height:38px!important;
  min-height:38px!important;
  border-radius:14px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:18px!important;
  line-height:1!important;
  background:linear-gradient(135deg,rgba(0,230,118,.12),rgba(0,212,255,.055))!important;
  border:1px solid rgba(0,230,118,.15)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07)!important;
  filter:none!important;
  transform:none!important;
}

.fgMenuItem b{
  flex:1 1 auto!important;
  min-width:0!important;
  height:auto!important;
  min-height:0!important;
  margin:0!important;
  padding:0!important;
  color:#f8fafc!important;
  font-size:16px!important;
  line-height:1.75!important;
  font-weight:800!important;
  letter-spacing:0!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  display:block!important;
  transform:translateY(1px)!important;
  -webkit-font-smoothing:antialiased!important;
  text-rendering:geometricPrecision!important;
}

.fgMenuLogoutBox{
  margin-top:auto!important;
  padding-top:14px!important;
  border-top:1px solid rgba(255,255,255,.07)!important;
}

.fgMenuLogout{
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
  border-color:rgba(255,71,87,.24)!important;
  background:linear-gradient(135deg,rgba(255,71,87,.09),rgba(255,255,255,.018))!important;
}

.fgMenuLogout .fgMenuIcon{
  background:linear-gradient(135deg,rgba(255,71,87,.18),rgba(255,255,255,.04))!important;
  border-color:rgba(255,71,87,.22)!important;
}

.fgMenuLogout b{
  color:#ffb4bf!important;
  font-size:15.5px!important;
  line-height:1.75!important;
  font-weight:800!important;
}

@media(max-width:720px){
  .fgMenuPanel{
    width:78vw!important;
    max-width:360px!important;
    padding:23px 14px 18px!important;
  }

  .fgMenuHeader{
    height:50px!important;
    min-height:50px!important;
    margin-bottom:17px!important;
  }

  .fgMenuHeader h2{
    font-size:28px!important;
  }

  .fgMenuHeader button{
    width:42px!important;
    height:42px!important;
    min-width:42px!important;
    min-height:42px!important;
    font-size:22px!important;
  }

  .fgMenuItems{
    gap:9px!important;
  }

  .fgMenuItem{
    height:59px!important;
    min-height:59px!important;
    max-height:59px!important;
    padding:0 13px!important;
    border-radius:18px!important;
    gap:11px!important;
  }

  .fgMenuIcon{
    width:37px!important;
    min-width:37px!important;
    height:37px!important;
    min-height:37px!important;
    font-size:17px!important;
  }

  .fgMenuItem b{
    font-size:15.5px!important;
    line-height:1.8!important;
    font-weight:800!important;
  }

  .fgMenuLogout{
    height:57px!important;
    min-height:57px!important;
    max-height:57px!important;
  }
}

@media(max-width:380px){
  .fgMenuPanel{
    width:80vw!important;
    padding:22px 13px 18px!important;
  }

  .fgMenuHeader h2{
    font-size:27px!important;
  }

  .fgMenuHeader button{
    width:40px!important;
    height:40px!important;
    min-width:40px!important;
    min-height:40px!important;
    font-size:21px!important;
  }

  .fgMenuItem{
    height:58px!important;
    min-height:58px!important;
    max-height:58px!important;
    padding:0 12px!important;
    gap:10px!important;
  }

  .fgMenuIcon{
    width:35px!important;
    min-width:35px!important;
    height:35px!important;
    min-height:35px!important;
    font-size:16px!important;
  }

  .fgMenuItem b{
    font-size:14.5px!important;
    line-height:1.85!important;
  }

  .fgMenuLogout{
    height:56px!important;
    min-height:56px!important;
    max-height:56px!important;
  }
}



/* ===== PAGE CHANGE SCROLL RESET FIX ===== */
.app,
.app.iosSafeApp,
.iosSafeApp{
  overflow-anchor:none!important;
  scroll-behavior:auto!important;
}

.seasonCardsPage,
.membersHome,
.memberProfilePage,
.widePage{
  overflow-anchor:none!important;
}



/* ===== VERCEL IPHONE FINAL NAV LOCK ===== */
html,
body,
#root{
  height:100%!important;
  min-height:100%!important;
  overflow:hidden!important;
  background:#020617!important;
}

.forceBottomCurtain{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:calc(92px + env(safe-area-inset-bottom))!important;
  background:#020617!important;
  z-index:2147483600!important;
  pointer-events:none!important;
}

.forceBottomNav{
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  width:min(640px,calc(100vw - 18px))!important;
  max-width:640px!important;
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  z-index:2147483601!important;
  direction:rtl!important;
  box-sizing:border-box!important;
  isolation:isolate!important;
}

.forceBottomNav .navBtn{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
}

/* Use JS-measured viewport fallback on iPhone/Vercel */
.app,
.app.iosSafeApp,
.iosSafeApp{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  bottom:calc(92px + env(safe-area-inset-bottom))!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
}

@media(max-width:720px){
  .forceBottomCurtain{
    height:calc(92px + env(safe-area-inset-bottom))!important;
  }

  .forceBottomNav{
    width:calc(100vw - 18px)!important;
    max-width:430px!important;
    height:72px!important;
    min-height:72px!important;
    max-height:72px!important;
    bottom:calc(10px + env(safe-area-inset-bottom))!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
  }
}

@media(max-width:380px){
  .forceBottomCurtain{
    height:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .forceBottomNav{
    height:70px!important;
    min-height:70px!important;
    max-height:70px!important;
  }

  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }
}



/* ===== FINAL MENU DOES NOT DISTURB IPHONE/VERCEL VIEWPORT ===== */
/* Opening the menu must not recalculate or move app/nav bounds. */
html.fg-menu-open,
body.fg-menu-open{
  overflow:hidden!important;
  height:100%!important;
  min-height:100%!important;
  background:#020617!important;
}

/* Keep app bounds identical whether menu is open or closed */
html.fg-menu-open .app,
html.fg-menu-open .app.iosSafeApp,
html.fg-menu-open .iosSafeApp,
body.fg-menu-open .app,
body.fg-menu-open .app.iosSafeApp,
body.fg-menu-open .iosSafeApp{
  position:fixed!important;
  top:var(--app-top-safe)!important;
  bottom:calc(92px + env(safe-area-inset-bottom))!important;
  left:0!important;
  right:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
}

/* Keep bottom nav identical while menu is open */
html.fg-menu-open .forceBottomNav,
body.fg-menu-open .forceBottomNav,
html.fg-menu-open .mainNav,
body.fg-menu-open .mainNav{
  position:fixed!important;
  left:50%!important;
  bottom:calc(10px + env(safe-area-inset-bottom))!important;
  transform:translateX(-50%)!important;
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  z-index:2147483601!important;
}

/* Menu remains inside app viewport, but never changes app viewport */
.fgMenuBackdrop{
  top:var(--app-top-safe)!important;
  bottom:calc(92px + env(safe-area-inset-bottom))!important;
  height:auto!important;
  max-height:none!important;
  overflow:hidden!important;
}

/* Medium menu typography */
.fgMenuHeader h2{
  font-size:28px!important;
}

.fgMenuItem b{
  font-size:18px!important;
}

.fgMenuIcon{
  font-size:26px!important;
}

@media(max-width:720px){
  html.fg-menu-open .app,
  html.fg-menu-open .app.iosSafeApp,
  html.fg-menu-open .iosSafeApp,
  body.fg-menu-open .app,
  body.fg-menu-open .app.iosSafeApp,
  body.fg-menu-open .iosSafeApp{
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
  }

  .fgMenuBackdrop{
    bottom:calc(92px + env(safe-area-inset-bottom))!important;
  }

  .fgMenuHeader h2{
    font-size:27px!important;
  }

  .fgMenuItem b{
    font-size:17px!important;
  }

  .fgMenuIcon{
    font-size:25px!important;
  }
}

@media(max-width:380px){
  html.fg-menu-open .app,
  html.fg-menu-open .app.iosSafeApp,
  html.fg-menu-open .iosSafeApp,
  body.fg-menu-open .app,
  body.fg-menu-open .app.iosSafeApp,
  body.fg-menu-open .iosSafeApp{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .fgMenuBackdrop{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }

  .fgMenuItem b{
    font-size:16px!important;
  }

  .fgMenuIcon{
    font-size:24px!important;
  }
}



/* ===== ABSOLUTE STABLE BOUNDS: no env() layout changes when menu opens ===== */
/* These variables are set once by JS and DO NOT change when menu opens. */
:root{
  --fg-top-bound:44px;
  --fg-bottom-bound:92px;
  --fg-nav-bottom:10px;
}

html,
body,
#root{
  width:100%!important;
  height:100%!important;
  min-height:100%!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
  background:#020617!important;
}

/* The app scroll viewport is fixed between stable top and bottom bounds. */
.app,
.app.iosSafeApp,
.iosSafeApp{
  position:fixed!important;
  top:var(--fg-top-bound)!important;
  bottom:var(--fg-bottom-bound)!important;
  left:0!important;
  right:0!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  padding:0 8px 10px!important;
  overflow-x:hidden!important;
  overflow-y:auto!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-y:contain!important;
  background:#020617!important;
  z-index:1!important;
  scroll-behavior:auto!important;
}

/* Bottom bar is always outside app scroll viewport. */
.forceBottomCurtain,
.bottomNavPortalCurtain{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  height:var(--fg-bottom-bound)!important;
  background:#020617!important;
  z-index:2147483600!important;
  pointer-events:none!important;
}

.forceBottomNav,
.mainNav,
.mainNav.glassSoft{
  display:grid!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  left:50%!important;
  right:auto!important;
  bottom:var(--fg-nav-bottom)!important;
  transform:translateX(-50%)!important;
  width:calc(100vw - 18px)!important;
  max-width:430px!important;
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  margin:0!important;
  padding:7px!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:5px!important;
  border-radius:26px!important;
  overflow:hidden!important;
  background:linear-gradient(180deg,#081126,#050a17)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  box-shadow:0 -8px 28px rgba(0,0,0,.32),0 18px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14)!important;
  z-index:2147483601!important;
  direction:rtl!important;
  box-sizing:border-box!important;
  isolation:isolate!important;
}

.forceBottomNav .navBtn,
.mainNav .navBtn,
.navBtn{
  height:58px!important;
  min-height:58px!important;
  max-height:58px!important;
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
}

/* Menu also uses the SAME stable bounds and cannot affect app/nav layout. */
.fgMenuBackdrop{
  position:fixed!important;
  top:var(--fg-top-bound)!important;
  right:0!important;
  bottom:var(--fg-bottom-bound)!important;
  left:0!important;
  width:100vw!important;
  height:auto!important;
  margin:0!important;
  padding:0!important;
  display:flex!important;
  align-items:stretch!important;
  justify-content:flex-end!important;
  background:rgba(2,6,23,.42)!important;
  backdrop-filter:blur(2px)!important;
  -webkit-backdrop-filter:blur(2px)!important;
  overflow:hidden!important;
  z-index:2147483599!important;
  direction:rtl!important;
}

.fgMenuPanel{
  width:82vw!important;
  max-width:390px!important;
  height:100%!important;
  min-height:100%!important;
  max-height:100%!important;
  margin:0!important;
  padding:28px 16px 16px!important;
  border:0!important;
  border-left:1px solid rgba(255,255,255,.14)!important;
  border-radius:0!important;
  background:
    radial-gradient(circle at 88% 8%,rgba(0,229,255,.16),transparent 28%),
    radial-gradient(circle at 0% 42%,rgba(139,92,246,.12),transparent 30%),
    linear-gradient(180deg,rgba(15,23,42,.98),rgba(6,10,24,.99))!important;
  box-shadow:-18px 0 42px rgba(0,0,0,.34)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  direction:rtl!important;
  box-sizing:border-box!important;
  display:flex!important;
  flex-direction:column!important;
}

/* Medium menu text */
.fgMenuHeader h2{
  font-size:27px!important;
}
.fgMenuItem b{
  font-size:17px!important;
}
.fgMenuIcon{
  font-size:25px!important;
}

.topStatusCurtain,
.bottomNavCurtain{
  display:none!important;
}

.mainHero{
  position:relative!important;
  top:auto!important;
  left:auto!important;
  transform:none!important;
  width:100%!important;
  margin:0 auto 14px!important;
  z-index:1!important;
}

.widePage,
.membersHome,
.memberProfilePage,
.seasonCardsPage{
  min-height:auto!important;
  margin-top:0!important;
  margin-bottom:0!important;
  overflow-anchor:none!important;
}

@media(min-width:721px){
  .app,
  .app.iosSafeApp,
  .iosSafeApp{
    padding-left:14px!important;
    padding-right:14px!important;
  }

  .forceBottomNav,
  .mainNav,
  .mainNav.glassSoft{
    width:min(640px,calc(100vw - 18px))!important;
    max-width:640px!important;
  }
}

@media(max-width:380px){
  :root{
    --fg-top-bound:40px;
    --fg-bottom-bound:88px;
  }

  .forceBottomNav,
  .mainNav,
  .mainNav.glassSoft{
    height:70px!important;
    min-height:70px!important;
    max-height:70px!important;
  }

  .fgMenuPanel{
    width:84vw!important;
    padding:24px 14px 14px!important;
  }

  .fgMenuItem b{
    font-size:16px!important;
  }

  .fgMenuIcon{
    font-size:24px!important;
  }
}


/* ===== TOP SYSTEM BACK BUTTON: fixed header-level back, no in-content back ===== */
.topSystemPortalBar{
  pointer-events:auto!important;
  display:flex!important;
  align-items:flex-end!important;
  justify-content:center!important;
  padding:env(safe-area-inset-top) 12px 6px!important;
  height:var(--app-top-safe)!important;
  background:linear-gradient(180deg,#020617 0%,rgba(2,6,23,.96) 72%,rgba(2,6,23,.86) 100%)!important;
  border-bottom:1px solid rgba(255,255,255,.06)!important;
  box-shadow:0 10px 30px rgba(0,0,0,.20)!important;
}

.topSystemInner{
  width:min(640px,100%)!important;
  height:36px!important;
  display:grid!important;
  grid-template-columns:42px minmax(0,1fr) 42px!important;
  align-items:center!important;
  gap:8px!important;
  direction:rtl!important;
}

.topSystemBackBtn,
.topSystemBackSpacer{
  width:38px!important;
  height:38px!important;
  border-radius:999px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
}

.topSystemBackBtn{
  border:1px solid rgba(255,255,255,.16)!important;
  background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.06))!important;
  color:#ecfeff!important;
  box-shadow:0 12px 28px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.16)!important;
  backdrop-filter:blur(18px)!important;
  -webkit-backdrop-filter:blur(18px)!important;
  cursor:pointer!important;
  padding:0!important;
  -webkit-appearance:none!important;
  appearance:none!important;
}

.topSystemBackBtn span{
  display:block!important;
  font-size:34px!important;
  line-height:30px!important;
  font-weight:900!important;
  transform:translateY(-1px)!important;
}

.topSystemBackBtn:active{
  transform:scale(.94)!important;
}

.topSystemTitle{
  min-width:0!important;
  text-align:center!important;
  color:#f8fafc!important;
  font-size:13px!important;
  font-weight:1000!important;
  letter-spacing:1.6px!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  opacity:.92!important;
}

/* Remove old in-page detail back buttons. Back now lives in the top system bar. */
.floatingBackBtn,
.backToMembersBtn{
  display:none!important;
}

@media(max-width:720px){
  .topSystemPortalBar{
    padding-left:10px!important;
    padding-right:10px!important;
    padding-bottom:6px!important;
  }

  .topSystemInner{
    height:34px!important;
    grid-template-columns:40px minmax(0,1fr) 40px!important;
  }

  .topSystemBackBtn,
  .topSystemBackSpacer{
    width:36px!important;
    height:36px!important;
  }

  .topSystemBackBtn span{
    font-size:32px!important;
    line-height:28px!important;
  }
}


/* ===== SAFE FIX: top bar title only, no back icon ===== */
.topSystemInner.titleOnly,
.topSystemInner{
  grid-template-columns:minmax(0,1fr)!important;
  justify-items:center!important;
}
.topSystemBackBtn,
.topSystemBackSpacer{
  display:none!important;
}
.topSystemTitle{
  grid-column:1!important;
  width:100%!important;
  text-align:center!important;
}

/* ===== FINAL FIX: native system title typography ===== */
.topSystemTitle{
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif!important;
  font-size:15px!important;
  font-weight:700!important;
  letter-spacing:0!important;
  line-height:1.15!important;
}
@media(max-width:720px){
  .topSystemTitle{
    font-size:15px!important;
    font-weight:700!important;
    letter-spacing:0!important;
  }
}



/* ===== SAFE GRADIENT BARS - NO SIZE CHANGE ===== */
.topSystemPortalBar{
  background:
    linear-gradient(180deg,
      rgba(2,6,23,.96) 0%,
      rgba(5,11,25,.86) 58%,
      rgba(5,11,25,.54) 82%,
      rgba(5,11,25,0) 100%)!important;
  box-shadow:none!important;
}
.topSystemPortalBar::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 18% 0%,rgba(0,229,255,.13),transparent 34%),
    radial-gradient(circle at 82% 0%,rgba(139,92,246,.12),transparent 36%);
  opacity:.9;
}
.topSystemInner{
  background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.025))!important;
  border-color:rgba(255,255,255,.105)!important;
  box-shadow:none!important;
}
.bottomNavPortalCurtain,
.forceBottomCurtain{
  height:calc(92px + env(safe-area-inset-bottom))!important;
  background:
    radial-gradient(circle at 18% 100%,rgba(0,229,255,.12),transparent 36%),
    radial-gradient(circle at 82% 100%,rgba(139,92,246,.11),transparent 34%),
    linear-gradient(0deg,
      rgba(2,6,23,.97) 0%,
      rgba(5,11,25,.86) 52%,
      rgba(5,11,25,.48) 78%,
      rgba(5,11,25,0) 100%)!important;
  backdrop-filter:blur(14px)!important;
  -webkit-backdrop-filter:blur(14px)!important;
  box-shadow:none!important;
}
.mainNav.forceBottomNav,
.forceBottomNav{
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  background:
    radial-gradient(circle at 18% 0%,rgba(0,229,255,.12),transparent 34%),
    radial-gradient(circle at 82% 100%,rgba(139,92,246,.10),transparent 36%),
    linear-gradient(180deg,rgba(13,23,43,.88),rgba(4,9,20,.78))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.15)!important;
}
@media(max-width:720px){
  .mainNav.forceBottomNav,
  .forceBottomNav{
    height:88px!important;
    min-height:88px!important;
    max-height:88px!important;
  }
}

/* ===== FINAL TOP BAR SOLID COLOR + SCROLL EFFECT (NO GRADIENT, NO SIZE CHANGE) ===== */
.topSystemPortalBar{
  background:rgba(8,12,22,.72)!important;
  background-image:none!important;
  backdrop-filter:blur(16px) saturate(140%)!important;
  -webkit-backdrop-filter:blur(16px) saturate(140%)!important;
  border-bottom:1px solid rgba(255,255,255,.055)!important;
  box-shadow:none!important;
  transition:background-color .22s ease,border-color .22s ease,backdrop-filter .22s ease!important;
}
.topSystemPortalBar.scrolled{
  background:rgba(8,12,22,.92)!important;
  border-bottom-color:rgba(255,255,255,.10)!important;
  backdrop-filter:blur(20px) saturate(150%)!important;
  -webkit-backdrop-filter:blur(20px) saturate(150%)!important;
}
.topSystemPortalBar::before{
  display:none!important;
  content:none!important;
}
.topSystemInner{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}

/* ===== PREMIUM LIQUID GLASS BARS — FINAL SAFE OVERRIDE ===== */
/* Same sizes, same logic, only visual treatment for top and bottom bars. */

.topSystemPortalBar{
  background:
    linear-gradient(135deg, rgba(255,255,255,.145), rgba(255,255,255,.055)) !important;
  background-color:rgba(7,11,22,.42)!important;
  backdrop-filter:blur(28px) saturate(175%) brightness(1.08)!important;
  -webkit-backdrop-filter:blur(28px) saturate(175%) brightness(1.08)!important;
  border-bottom:1px solid rgba(255,255,255,.16)!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(255,255,255,.055),
    0 10px 34px rgba(0,0,0,.20) !important;
  transition:background-color .22s ease, border-color .22s ease, backdrop-filter .22s ease!important;
}
.topSystemPortalBar.scrolled{
  background:
    linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.065)) !important;
  background-color:rgba(7,11,22,.56)!important;
  border-bottom-color:rgba(255,255,255,.19)!important;
  backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
  -webkit-backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
}
.topSystemPortalBar::before{
  display:none!important;
  content:none!important;
}
.topSystemInner{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.topSystemTitle{
  color:rgba(255,255,255,.96)!important;
  text-shadow:0 1px 14px rgba(0,0,0,.28)!important;
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}

/* The curtain stays invisible-to-soft, so it does not enlarge the nav visually. */
.bottomNavPortalCurtain,
.forceBottomCurtain{
  background:
    linear-gradient(
      to top,
      rgba(2,6,23,.50) 0%,
      rgba(2,6,23,.30) 44%,
      rgba(2,6,23,.10) 72%,
      rgba(2,6,23,0) 100%
    )!important;
  backdrop-filter:blur(10px) saturate(130%)!important;
  -webkit-backdrop-filter:blur(10px) saturate(130%)!important;
  box-shadow:none!important;
}

/* Keep exact nav dimensions from the stable version; only replace material. */
.mainNav,
.forceBottomNav{
  background:
    linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.055))!important;
  background-color:rgba(7,11,22,.46)!important;
  backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
  -webkit-backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
  border:1px solid rgba(255,255,255,.20)!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.32),
    inset 0 -1px 0 rgba(255,255,255,.06),
    0 18px 46px rgba(0,0,0,.30)!important;
}

.mainNav .navBtn{
  background:rgba(255,255,255,.035)!important;
  border:1px solid rgba(255,255,255,.055)!important;
}
.mainNav .navBtn.active{
  background:
    linear-gradient(135deg, rgba(0,229,255,.34), rgba(47,140,255,.24))!important;
  border-color:rgba(255,255,255,.28)!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.28),
    0 8px 22px rgba(0,229,255,.10)!important;
}


/* ===== ABSOLUTE FINAL: NO-STROKE LIQUID GLASS BARS ===== */
/* Visual-only override. It does not touch navigation, history, data, or layout sizes. */

.topSystemPortalBar,
.topSystemPortalBar.scrolled{
  background:transparent!important;
  background-color:transparent!important;
  border:0!important;
  border-bottom:0!important;
  outline:0!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  padding:env(safe-area-inset-top) 12px 6px!important;
  height:var(--app-top-safe)!important;
  display:flex!important;
  align-items:flex-end!important;
  justify-content:center!important;
  pointer-events:auto!important;
}

.topSystemPortalBar::before,
.topSystemPortalBar::after{
  content:none!important;
  display:none!important;
}

.topSystemInner,
.topSystemInner.titleOnly{
  width:min(640px,calc(100vw - 24px))!important;
  height:36px!important;
  border-radius:999px!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr)!important;
  place-items:center!important;
  padding:0 18px!important;
  overflow:hidden!important;
  direction:rtl!important;

  background:
    radial-gradient(circle at 16% 12%,rgba(255,255,255,.28),transparent 30%),
    radial-gradient(circle at 78% 0%,rgba(0,229,255,.16),transparent 34%),
    linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.065))!important;
  background-color:rgba(8,12,24,.34)!important;
  backdrop-filter:blur(30px) saturate(180%) brightness(1.10)!important;
  -webkit-backdrop-filter:blur(30px) saturate(180%) brightness(1.10)!important;
  border:0!important;
  outline:0!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(255,255,255,.045),
    0 12px 30px rgba(0,0,0,.22)!important;
}

.topSystemTitle{
  width:100%!important;
  min-width:0!important;
  text-align:center!important;
  color:rgba(255,255,255,.96)!important;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif!important;
  font-size:15px!important;
  font-weight:700!important;
  letter-spacing:0!important;
  line-height:1.15!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  text-shadow:0 1px 12px rgba(0,0,0,.30)!important;
}

body > .mainNav.glassSoft,
.mainNav.glassSoft,
.mainNav,
.forceBottomNav{
  background:
    radial-gradient(circle at 18% 10%,rgba(255,255,255,.24),transparent 30%),
    radial-gradient(circle at 78% 0%,rgba(0,229,255,.14),transparent 34%),
    linear-gradient(135deg,rgba(255,255,255,.17),rgba(255,255,255,.055))!important;
  background-color:rgba(8,12,24,.38)!important;
  backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
  -webkit-backdrop-filter:blur(30px) saturate(185%) brightness(1.08)!important;
  border:0!important;
  outline:0!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(255,255,255,.05),
    0 16px 44px rgba(0,0,0,.30)!important;
}

.bottomNavPortalCurtain,
.forceBottomCurtain{
  background:linear-gradient(to top,rgba(2,6,23,.36),rgba(2,6,23,.16) 46%,rgba(2,6,23,0))!important;
  backdrop-filter:blur(8px) saturate(120%)!important;
  -webkit-backdrop-filter:blur(8px) saturate(120%)!important;
  box-shadow:none!important;
}

.mainNav .navBtn{
  background:rgba(255,255,255,.025)!important;
  border:0!important;
  box-shadow:none!important;
}

.mainNav .navBtn.active{
  background:linear-gradient(135deg,rgba(0,229,255,.28),rgba(47,140,255,.20))!important;
  border:0!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 8px 22px rgba(0,229,255,.10)!important;
}

@media(max-width:720px){
  .topSystemInner,
  .topSystemInner.titleOnly{
    width:calc(100vw - 22px)!important;
    height:36px!important;
    padding:0 16px!important;
  }
  .topSystemTitle{
    font-size:15px!important;
  }
}


/* ===== FINAL TOP BAR CLEAN RESET: no visual style, keep title only ===== */
.topSystemPortalBar,
.topSystemPortalBar.scrolled{
  background:transparent!important;
  background-color:transparent!important;
  border:0!important;
  border-bottom:0!important;
  outline:0!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}

.topSystemPortalBar::before,
.topSystemPortalBar::after,
.topSystemInner::before,
.topSystemInner::after{
  content:none!important;
  display:none!important;
}

.topSystemInner,
.topSystemInner.titleOnly{
  background:transparent!important;
  background-color:transparent!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
}

.topSystemTitle{
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif!important;
  color:#f8fafc!important;
  text-shadow:none!important;
}


/* ===== 2026-04 SAFE FIX: tabs scrollbar, compact stat icons, configurable stat icons ===== */
.tabs{
  scrollbar-width:none!important;
  -ms-overflow-style:none!important;
  padding-bottom:0!important;
  margin-bottom:14px!important;
}
.tabs::-webkit-scrollbar{
  display:none!important;
  width:0!important;
  height:0!important;
}
.memberProfilePage .tabs,
.widePage .tabs{
  overflow-y:hidden!important;
}
.memberMainStats .statCard{
  display:grid!important;
  grid-template-rows:auto auto auto!important;
  place-items:center!important;
  align-content:center!important;
  gap:4px!important;
  padding-top:10px!important;
  padding-bottom:10px!important;
}
.memberMainStats .statIcon,
.statCard .statIcon{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  height:28px!important;
  min-height:28px!important;
  font-size:25px!important;
  line-height:1!important;
  margin:0!important;
}
.memberMainStats .statCard b{
  margin:0!important;
  line-height:.96!important;
}
.memberMainStats .statCard small{
  margin:0!important;
  line-height:1.12!important;
}
.smartIconImg{
  width:28px!important;
  height:28px!important;
  object-fit:contain!important;
  display:block!important;
  filter:drop-shadow(0 6px 10px rgba(0,0,0,.28));
}
@media(max-width:720px){
  .memberMainStats .statCard{
    height:108px!important;
    min-height:108px!important;
    gap:3px!important;
    padding-top:8px!important;
    padding-bottom:8px!important;
  }
  .memberMainStats .statIcon,
  .statCard .statIcon{
    height:25px!important;
    min-height:25px!important;
    font-size:23px!important;
  }
  .smartIconImg{
    width:25px!important;
    height:25px!important;
  }
}



/* ===== SETTINGS-CONTROLLED ICONS: image or emoji, app-wide ===== */
.navIcon .smartIconImg,
.fgMenuIcon .smartIconImg{
  width:1.35em!important;
  height:1.35em!important;
  object-fit:contain!important;
  display:block!important;
}
.statIcon .smartIconImg{
  width:34px!important;
  height:34px!important;
  object-fit:contain!important;
  display:block!important;
  margin:0 auto!important;
}
.chips .smartIconImg,
.seasonMemberCard em .smartIconImg,
.archiveModeTabs button .smartIconImg,
.seasonSimpleRow span .smartIconImg,
.rankingInlineStats .smartIconImg,
.transferBadges .smartIconImg,
.linkTile span .smartIconImg{
  width:1.15em!important;
  height:1.15em!important;
  object-fit:contain!important;
  display:inline-block!important;
  vertical-align:-0.18em!important;
  margin-inline-end:3px!important;
}

/* ===== FINAL FIX: CONSISTENT FLAT TOP BAR BACKGROUND ===== */
/* The top bar must never inherit page/card gradients while scrolling or on subpages. */
.topSystemPortalBar,
.topSystemPortalBar.scrolled{
  background:#020617!important;
  background-color:#020617!important;
  background-image:none!important;
  border:0!important;
  border-bottom:0!important;
  outline:0!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}

.topSystemPortalBar::before,
.topSystemPortalBar::after{
  content:none!important;
  display:none!important;
}

.topSystemInner,
.topSystemInner.titleOnly{
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}

.topSystemTitle{
  color:#f8fafc!important;
  text-shadow:none!important;
}



/* ===== FINAL BACK-STABILITY FIX: prevent iOS return shake ===== */
html, body, #root {
  height: 100% !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
.app {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
  overscroll-behavior-y: contain !important;
  scroll-behavior: auto !important;
}

/* ===== PREMIUM MOTION PACK: safe UI motion only, no layout changes ===== */
:root{
  --fg-motion-fast: 140ms;
  --fg-motion-normal: 240ms;
  --fg-motion-slow: 360ms;
  --fg-ease-out: cubic-bezier(.2,.9,.2,1);
  --fg-ease-soft: cubic-bezier(.16,1,.3,1);
}

/* Page entrance: light, native-app feel */
.membersHome,
.memberProfilePage,
.widePage,
.mainHero,
.announcement{
  animation: fgPageEnter var(--fg-motion-slow) var(--fg-ease-soft) both;
  will-change: transform, opacity;
}

@keyframes fgPageEnter{
  from{
    opacity:0;
    transform:translate3d(0,10px,0) scale(.992);
    filter:saturate(.92);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0) scale(1);
    filter:saturate(1);
  }
}

/* Cards stagger illusion: subtle and safe */
.seasonMemberCard,
.playerCard,
.trophyCard,
.seasonSimpleRow,
.archiveTrophyRow,
.archiveMemberCard,
.archiveSeasonCard,
.rankingCard,
.financeCard,
.transferCard,
.tournamentRecordCard,
.finalsCard,
.linkTile,
.statCard{
  animation: fgCardRise var(--fg-motion-slow) var(--fg-ease-soft) both;
  transform-origin:center;
  transition:
    transform var(--fg-motion-fast) var(--fg-ease-out),
    box-shadow var(--fg-motion-normal) ease,
    border-color var(--fg-motion-normal) ease,
    background var(--fg-motion-normal) ease,
    opacity var(--fg-motion-normal) ease;
  will-change: transform;
}

@keyframes fgCardRise{
  from{
    opacity:.001;
    transform:translate3d(0,8px,0) scale(.985);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0) scale(1);
  }
}

/* Touch feedback: premium but restrained */
button,
a,
.navBtn,
.tabBtn,
.fgMenuItem,
.seasonMemberCard,
.trophyCard,
.seasonSimpleRow,
.archiveTrophyRow,
.archiveMemberCard,
.rankingCard,
.tournamentRecordCard,
.finalsCard,
.linkTile,
.statCard.clickable{
  -webkit-tap-highlight-color:transparent;
  touch-action:manipulation;
  transition:
    transform var(--fg-motion-fast) var(--fg-ease-out),
    opacity var(--fg-motion-fast) ease,
    background var(--fg-motion-normal) ease,
    box-shadow var(--fg-motion-normal) ease,
    border-color var(--fg-motion-normal) ease;
}

button:active,
a:active,
.navBtn:active,
.tabBtn:active,
.fgMenuItem:active,
.seasonMemberCard:active,
.trophyCard:active,
.seasonSimpleRow:active,
.archiveTrophyRow:active,
.archiveMemberCard:active,
.rankingCard:active,
.tournamentRecordCard:active,
.finalsCard:active,
.linkTile:active,
.statCard.clickable:active{
  transform:scale(.975);
  opacity:.92;
}

/* Bottom navigation active feel */
.navBtn{
  position:relative;
  overflow:hidden;
}

.navBtn::after{
  content:"";
  position:absolute;
  left:50%;
  bottom:5px;
  width:18px;
  height:3px;
  border-radius:999px;
  background:linear-gradient(90deg,var(--cyan),var(--blue));
  transform:translateX(-50%) scaleX(0);
  opacity:0;
  transition:
    transform var(--fg-motion-normal) var(--fg-ease-soft),
    opacity var(--fg-motion-normal) ease;
  pointer-events:none;
}

.navBtn.active::after{
  transform:translateX(-50%) scaleX(1);
  opacity:.95;
}

.navBtn.active .navIcon,
.navBtn.active img{
  animation: fgNavPop 360ms var(--fg-ease-soft) both;
}

@keyframes fgNavPop{
  0%{transform:translateY(1px) scale(.94)}
  58%{transform:translateY(-1px) scale(1.08)}
  100%{transform:translateY(0) scale(1)}
}

/* Tabs feel sharper */
.tabBtn.active{
  animation: fgTabSelect 260ms var(--fg-ease-soft) both;
}

@keyframes fgTabSelect{
  from{transform:scale(.96);filter:saturate(.8)}
  to{transform:scale(1);filter:saturate(1)}
}

/* Drawer / modal entrance */
.fgMenuBackdrop,
.drawerBackdrop{
  animation: fgBackdropIn 220ms ease both;
}

.fgMenuPanel{
  animation: fgDrawerIn 320ms var(--fg-ease-soft) both;
  transform-origin:right center;
}

.infoModal{
  animation: fgModalIn 280ms var(--fg-ease-soft) both;
  transform-origin:center;
}

@keyframes fgBackdropIn{
  from{opacity:0}
  to{opacity:1}
}

@keyframes fgDrawerIn{
  from{
    opacity:.001;
    transform:translate3d(18px,0,0) scale(.985);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0) scale(1);
  }
}

@keyframes fgModalIn{
  from{
    opacity:.001;
    transform:translate3d(0,14px,0) scale(.97);
  }
  to{
    opacity:1;
    transform:translate3d(0,0,0) scale(1);
  }
}

/* Inputs feel responsive without changing layout */
input{
  transition:
    border-color var(--fg-motion-normal) ease,
    box-shadow var(--fg-motion-normal) ease,
    background var(--fg-motion-normal) ease;
}

input:focus{
  border-color:rgba(0,229,255,.38)!important;
  box-shadow:0 0 0 3px rgba(0,229,255,.08)!important;
}

/* Respect accessibility and reduce battery work */
@media (prefers-reduced-motion: reduce){
  *,
  *::before,
  *::after{
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    scroll-behavior:auto!important;
    transition-duration:.01ms!important;
  }
}


/* ===== FINAL COVER SIZE FIX - source of truth from settings ===== */
.mainHero,
.mainHero.glass,
.mainHero.hasCoverImage{
  height:var(--fg-cover-height,118px)!important;
  min-height:0!important;
  max-height:var(--fg-cover-height,118px)!important;
  padding:14px 18px!important;
  margin:0 auto 10px!important;
  align-items:center!important;
}
.mainHero.hasCoverImage{
  padding:0!important;
}
.coverContent{
  height:100%!important;
  min-height:0!important;
  align-items:center!important;
}
.mainHero h1{
  font-size:clamp(24px,4vw,34px)!important;
  line-height:1!important;
  margin:3px 0 2px!important;
}
.mainHero p{
  font-size:15px!important;
  line-height:1.1!important;
}
.heroKicker{
  font-size:10px!important;
  line-height:1!important;
}
.coverIconBox{
  width:58px!important;
  height:58px!important;
  border-radius:18px!important;
  flex:0 0 auto!important;
}
@media(max-width:720px){
  .mainHero,
  .mainHero.glass,
  .mainHero.hasCoverImage{
    height:var(--fg-cover-height-mobile,50px)!important;
    min-height:0!important;
    max-height:var(--fg-cover-height-mobile,50px)!important;
    padding:6px 10px!important;
    margin:0 auto 8px!important;
    border-radius:16px!important;
  }
  .mainHero.hasCoverImage{
    padding:0!important;
  }
  .coverContent{
    gap:8px!important;
  }
  .heroKicker{
    display:none!important;
  }
  .mainHero h1{
    font-size:18px!important;
    line-height:1!important;
    margin:0!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  .mainHero p{
    display:none!important;
  }
  .coverIconBox{
    width:36px!important;
    height:36px!important;
    border-radius:11px!important;
  }
  .coverIconBox b{
    font-size:13px!important;
  }
}


/* ===== FINANCE LINKED BALANCE SYSTEM ===== */
.financeSectionHead{
  align-items:center!important;
}
.financeBalancePill{
  min-width:132px;
  min-height:54px;
  padding:8px 12px;
  border-radius:18px;
  display:grid;
  align-content:center;
  gap:3px;
  text-align:center;
  background:rgba(0,229,255,.08);
  border:1px solid rgba(0,229,255,.18);
}
.financeBalancePill small{
  color:#9fb4c8;
  font-size:11px;
  font-weight:900;
}
.financeBalancePill b{
  color:#ecfeff;
  font-size:20px;
  line-height:1;
  direction:ltr;
  unicode-bidi:plaintext;
  font-variant-numeric:tabular-nums;
}
.financeListGrid{
  gap:10px!important;
}
.financeCard{
  grid-template-columns:minmax(96px,auto) minmax(0,1fr)!important;
}
.financeCard.income .financeAmountValue{
  color:#86efac!important;
}
.financeCard.expense .financeAmountValue{
  color:#fca5a5!important;
}
.financeCard.neutral .financeAmountValue{
  color:#ecfeff!important;
}
.financeCard div{
  min-width:0;
}
@media(max-width:720px){
  .financeSectionHead{
    grid-template-columns:1fr!important;
  }
  .financeBalancePill{
    width:100%;
    min-height:48px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    text-align:right;
  }
  .financeBalancePill b{
    font-size:19px;
  }
  .financeCard{
    grid-template-columns:118px minmax(0,1fr)!important;
    padding:12px!important;
    gap:10px!important;
  }
  .financeCard>b{
    font-size:23px!important;
  }
}


/* ===== PLAYER OFFER CARD LAYOUT FIX v10: stable 4-column player card ===== */
.playerCard.hasOfferAction{
  min-height:104px!important;
  height:auto!important;
  padding:12px 14px!important;
  display:grid!important;
  grid-template-columns:64px 140px minmax(0,1fr) 72px!important;
  grid-template-areas:"rating actions info photo"!important;
  gap:12px!important;
  align-items:center!important;
  direction:ltr!important;
  position:relative!important;
  overflow:hidden!important;
}
.playerCard.hasOfferAction .playerPhoto{
  grid-area:photo!important;
  width:70px!important;
  height:70px!important;
  border-radius:20px!important;
  justify-self:end!important;
  align-self:center!important;
  object-fit:contain!important;
  background:rgba(255,255,255,.08)!important;
  padding:3px!important;
}
.playerCard.hasOfferAction .playerInfo{
  grid-area:info!important;
  direction:rtl!important;
  text-align:right!important;
  min-width:0!important;
  width:100%!important;
  padding:0!important;
  align-self:center!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  gap:8px!important;
  overflow:hidden!important;
}
.playerCard.hasOfferAction .playerInfo h4{
  display:block!important;
  width:100%!important;
  font-size:22px!important;
  line-height:1.14!important;
  margin:0!important;
  color:#f8fafc!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.playerCard.hasOfferAction .playerMeta{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  flex-wrap:nowrap!important;
  gap:7px!important;
  margin:0!important;
  min-height:28px!important;
  overflow:hidden!important;
}
.playerCard.hasOfferAction .playerMeta span{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  height:28px!important;
  max-width:96px!important;
  padding:0 10px!important;
  border-radius:999px!important;
  font-size:11px!important;
  line-height:1!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  flex:0 1 auto!important;
}
.playerCard.hasOfferAction .playerRating{
  grid-area:rating!important;
  width:62px!important;
  height:62px!important;
  border-radius:19px!important;
  font-size:26px!important;
  justify-self:start!important;
  align-self:center!important;
  display:grid!important;
  place-items:center!important;
}
.playerCard.hasOfferAction .playerOfferActions,
.playerCard.hasOfferAction .playerOfferActions.oneAction,
.playerCard.hasOfferAction .playerOfferActions.forceTwoActions{
  grid-area:actions!important;
  position:static!important;
  inset:auto!important;
  transform:none!important;
  width:100%!important;
  min-width:0!important;
  height:auto!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:stretch!important;
  justify-content:center!important;
  gap:8px!important;
  margin:0!important;
  overflow:visible!important;
  z-index:2!important;
}
.playerCard.hasOfferAction .playerOfferButton{
  width:100%!important;
  min-width:0!important;
  height:34px!important;
  border:0!important;
  border-radius:12px!important;
  padding:0 9px!important;
  font-size:11.5px!important;
  line-height:1!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  box-shadow:0 10px 22px rgba(0,0,0,.18)!important;
}
.playerCard.hasOfferAction .playerOfferButton.edit{
  background:linear-gradient(135deg,#facc15,#fb923c)!important;
  color:#020617!important;
}
.playerCard.hasOfferAction .playerOfferButton.cancel{
  background:linear-gradient(135deg,#fb7185,#e11d48)!important;
  color:white!important;
}
@media(max-width:720px){
  .playerCard.hasOfferAction{
    min-height:104px!important;
    padding:10px 12px!important;
    grid-template-columns:56px 116px minmax(0,1fr) 64px!important;
    gap:8px!important;
  }
  .playerCard.hasOfferAction .playerPhoto{
    width:62px!important;
    height:62px!important;
    border-radius:18px!important;
  }
  .playerCard.hasOfferAction .playerInfo{
    gap:7px!important;
  }
  .playerCard.hasOfferAction .playerInfo h4{
    font-size:18.5px!important;
  }
  .playerCard.hasOfferAction .playerMeta{
    gap:5px!important;
    min-height:24px!important;
  }
  .playerCard.hasOfferAction .playerMeta span{
    height:24px!important;
    max-width:74px!important;
    padding:0 7px!important;
    font-size:9.5px!important;
  }
  .playerCard.hasOfferAction .playerRating{
    width:52px!important;
    height:52px!important;
    border-radius:16px!important;
    font-size:22px!important;
  }
  .playerCard.hasOfferAction .playerOfferActions,
  .playerCard.hasOfferAction .playerOfferActions.oneAction,
  .playerCard.hasOfferAction .playerOfferActions.forceTwoActions{
    gap:7px!important;
  }
  .playerCard.hasOfferAction .playerOfferButton{
    height:31px!important;
    border-radius:11px!important;
    font-size:9.2px!important;
    padding:0 6px!important;
  }
}
@media(max-width:390px){
  .playerCard.hasOfferAction{
    min-height:100px!important;
    grid-template-columns:50px 104px minmax(0,1fr) 56px!important;
    gap:6px!important;
    padding:9px 10px!important;
  }
  .playerCard.hasOfferAction .playerPhoto{
    width:54px!important;
    height:54px!important;
    border-radius:16px!important;
  }
  .playerCard.hasOfferAction .playerInfo h4{
    font-size:16.5px!important;
  }
  .playerCard.hasOfferAction .playerMeta span{
    max-width:64px!important;
    height:22px!important;
    font-size:8.8px!important;
    padding:0 6px!important;
  }
  .playerCard.hasOfferAction .playerRating{
    width:48px!important;
    height:48px!important;
    border-radius:15px!important;
    font-size:20px!important;
  }
  .playerCard.hasOfferAction .playerOfferButton{
    height:30px!important;
    font-size:8.5px!important;
    padding:0 5px!important;
  }
}


/* ===== PLAYER OFFER CARD FINAL FIX v11: stable, no-hidden-actions ===== */
.playerCard.hasOfferAction{
  min-height:150px!important;
  height:auto!important;
  padding:14px 16px!important;
  display:grid!important;
  grid-template-columns:64px 122px minmax(0,1fr) 76px!important;
  grid-template-areas:"rating actions info photo"!important;
  gap:12px!important;
  align-items:center!important;
  direction:ltr!important;
  overflow:visible!important;
}
.playerCard.hasOfferAction .playerPhoto{grid-area:photo!important;width:74px!important;height:74px!important;border-radius:20px!important;justify-self:end!important;align-self:center!important;object-fit:contain!important;background:rgba(255,255,255,.08)!important;padding:3px!important;}
.playerCard.hasOfferAction .playerInfo{grid-area:info!important;direction:rtl!important;text-align:right!important;min-width:0!important;width:100%!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:10px!important;overflow:visible!important;}
.playerCard.hasOfferAction .playerInfo h4{font-size:22px!important;line-height:1.18!important;margin:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#f8fafc!important;}
.playerCard.hasOfferAction .playerMeta{display:flex!important;flex-wrap:wrap!important;gap:8px!important;margin:0!important;overflow:visible!important;min-height:30px!important;}
.playerCard.hasOfferAction .playerMeta span{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;max-width:112px!important;padding:0 11px!important;border-radius:999px!important;font-size:11px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
.playerCard.hasOfferAction .playerRating{grid-area:rating!important;width:62px!important;height:62px!important;border-radius:19px!important;font-size:26px!important;justify-self:start!important;align-self:center!important;display:grid!important;place-items:center!important;}
.playerCard.hasOfferAction .playerOfferActions,
.playerCard.hasOfferAction .playerOfferActions.oneAction,
.playerCard.hasOfferAction .playerOfferActions.forceTwoActions{grid-area:actions!important;position:static!important;left:auto!important;right:auto!important;bottom:auto!important;inset:auto!important;width:100%!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:center!important;gap:8px!important;margin:0!important;overflow:visible!important;z-index:2!important;}
.playerCard.hasOfferAction .playerOfferButton{width:100%!important;height:34px!important;min-width:0!important;border:0!important;border-radius:13px!important;padding:0 7px!important;font-size:10px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-shadow:0 10px 22px rgba(0,0,0,.18)!important;}
.playerCard.hasOfferAction .playerOfferButton.edit{background:linear-gradient(135deg,#facc15,#fb923c)!important;color:#020617!important;}
.playerCard.hasOfferAction .playerOfferButton.cancel{background:linear-gradient(135deg,#fb7185,#e11d48)!important;color:white!important;}
@media(max-width:720px){
  .playerCard.hasOfferAction{min-height:144px!important;padding:12px!important;grid-template-columns:54px 104px minmax(0,1fr) 64px!important;gap:8px!important;}
  .playerCard.hasOfferAction .playerPhoto{width:62px!important;height:62px!important;border-radius:18px!important;}
  .playerCard.hasOfferAction .playerInfo{gap:8px!important;}
  .playerCard.hasOfferAction .playerInfo h4{font-size:18px!important;}
  .playerCard.hasOfferAction .playerMeta{gap:5px!important;min-height:26px!important;}
  .playerCard.hasOfferAction .playerMeta span{min-height:25px!important;max-width:78px!important;padding:0 7px!important;font-size:9.2px!important;}
  .playerCard.hasOfferAction .playerRating{width:52px!important;height:52px!important;border-radius:16px!important;font-size:22px!important;}
  .playerCard.hasOfferAction .playerOfferActions,.playerCard.hasOfferAction .playerOfferActions.oneAction,.playerCard.hasOfferAction .playerOfferActions.forceTwoActions{gap:7px!important;}
  .playerCard.hasOfferAction .playerOfferButton{height:31px!important;border-radius:11px!important;font-size:8.5px!important;padding:0 4px!important;}
}
@media(max-width:390px){
  .playerCard.hasOfferAction{min-height:138px!important;grid-template-columns:48px 94px minmax(0,1fr) 56px!important;gap:6px!important;padding:10px!important;}
  .playerCard.hasOfferAction .playerPhoto{width:54px!important;height:54px!important;border-radius:16px!important;}
  .playerCard.hasOfferAction .playerInfo h4{font-size:16px!important;}
  .playerCard.hasOfferAction .playerMeta span{max-width:66px!important;min-height:23px!important;font-size:8px!important;padding:0 5px!important;}
  .playerCard.hasOfferAction .playerRating{width:46px!important;height:46px!important;border-radius:14px!important;font-size:19px!important;}
  .playerCard.hasOfferAction .playerOfferButton{height:30px!important;font-size:7.6px!important;}
}


/* ===== PLAYER OFFER CARD FINAL FIX v12: actions under details, no overlap ===== */
.playerCard.hasOfferAction{
  min-height:132px!important;
  height:auto!important;
  padding:14px!important;
  display:grid!important;
  grid-template-columns:58px minmax(0,1fr) 64px!important;
  grid-template-rows:auto auto!important;
  grid-template-areas:
    "rating info photo"
    "rating actions photo"!important;
  column-gap:12px!important;
  row-gap:9px!important;
  align-items:center!important;
  direction:ltr!important;
  overflow:visible!important;
}
.playerCard.hasOfferAction .playerPhoto{grid-area:photo!important;width:62px!important;height:62px!important;border-radius:18px!important;justify-self:end!important;align-self:center!important;object-fit:contain!important;background:rgba(255,255,255,.08)!important;padding:3px!important;}
.playerCard.hasOfferAction .playerRating{grid-area:rating!important;width:54px!important;height:54px!important;border-radius:17px!important;font-size:23px!important;justify-self:start!important;align-self:center!important;display:grid!important;place-items:center!important;}
.playerCard.hasOfferAction .playerInfo{grid-area:info!important;direction:rtl!important;text-align:right!important;min-width:0!important;width:100%!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:7px!important;overflow:visible!important;}
.playerCard.hasOfferAction .playerInfo h4{margin:0!important;font-size:18px!important;line-height:1.2!important;color:#f8fafc!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
.playerCard.hasOfferAction .playerMeta{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin:0!important;overflow:visible!important;min-height:26px!important;}
.playerCard.hasOfferAction .playerMeta span{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:25px!important;max-width:96px!important;padding:0 9px!important;border-radius:999px!important;font-size:10px!important;line-height:1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
.playerCard.hasOfferAction .playerOfferActions,.playerCard.hasOfferAction .playerOfferActions.oneAction,.playerCard.hasOfferAction .playerOfferActions.forceTwoActions{grid-area:actions!important;position:static!important;inset:auto!important;width:100%!important;min-width:0!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:stretch!important;gap:8px!important;margin:0!important;overflow:visible!important;z-index:2!important;}
.playerCard.hasOfferAction .playerOfferButton{flex:1 1 0!important;width:auto!important;height:32px!important;min-width:0!important;border:0!important;border-radius:12px!important;padding:0 7px!important;font-size:10px!important;line-height:1!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-shadow:0 10px 22px rgba(0,0,0,.18)!important;}
.playerCard.hasOfferAction .playerOfferActions.oneAction .playerOfferButton{flex:0 1 160px!important;max-width:180px!important;}
.playerCard.hasOfferAction .playerOfferButton.edit{background:linear-gradient(135deg,#facc15,#fb923c)!important;color:#020617!important;}
.playerCard.hasOfferAction .playerOfferButton.cancel{background:linear-gradient(135deg,#fb7185,#e11d48)!important;color:white!important;}
@media(max-width:720px){.playerCard.hasOfferAction{min-height:126px!important;padding:12px!important;grid-template-columns:52px minmax(0,1fr) 58px!important;column-gap:9px!important;row-gap:8px!important;}.playerCard.hasOfferAction .playerPhoto{width:56px!important;height:56px!important;border-radius:16px!important;}.playerCard.hasOfferAction .playerRating{width:48px!important;height:48px!important;border-radius:15px!important;font-size:20px!important;}.playerCard.hasOfferAction .playerInfo h4{font-size:16px!important;}.playerCard.hasOfferAction .playerMeta{gap:5px!important;min-height:24px!important;}.playerCard.hasOfferAction .playerMeta span{min-height:23px!important;max-width:72px!important;padding:0 6px!important;font-size:8.5px!important;}.playerCard.hasOfferAction .playerOfferActions,.playerCard.hasOfferAction .playerOfferActions.oneAction,.playerCard.hasOfferAction .playerOfferActions.forceTwoActions{gap:6px!important;}.playerCard.hasOfferAction .playerOfferButton{height:30px!important;border-radius:10px!important;font-size:8.2px!important;padding:0 4px!important;}.playerCard.hasOfferAction .playerOfferActions.oneAction .playerOfferButton{flex:0 1 130px!important;max-width:140px!important;}}
@media(max-width:390px){.playerCard.hasOfferAction{min-height:122px!important;padding:10px!important;grid-template-columns:48px minmax(0,1fr) 54px!important;column-gap:7px!important;row-gap:7px!important;}.playerCard.hasOfferAction .playerPhoto{width:52px!important;height:52px!important;border-radius:15px!important;}.playerCard.hasOfferAction .playerRating{width:44px!important;height:44px!important;border-radius:14px!important;font-size:18px!important;}.playerCard.hasOfferAction .playerInfo h4{font-size:15px!important;}.playerCard.hasOfferAction .playerMeta span{max-width:64px!important;min-height:22px!important;font-size:7.7px!important;padding:0 5px!important;}.playerCard.hasOfferAction .playerOfferButton{height:29px!important;font-size:7.4px!important;padding:0 3px!important;}.playerCard.hasOfferAction .playerOfferActions.oneAction .playerOfferButton{flex:0 1 118px!important;max-width:124px!important;}}

/* ===== Player detail offer flow: keep list cards clean ===== */
.playerCardClickable{cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease}.playerCardClickable:hover{transform:translateY(-1px);border-color:rgba(0,229,255,.28);background:rgba(0,229,255,.08)}.playerDetailFullPage{min-height:calc(100vh - 140px)}.playerDetailSubPage{border-radius:28px;padding:16px;margin-top:0}.playerDetailHero{display:grid;grid-template-columns:150px minmax(0,1fr) 62px;gap:16px;align-items:center;border-radius:26px;padding:16px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12)}.playerDetailImageBox{width:150px;height:150px;border-radius:32px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);overflow:hidden}.playerDetailImageBox img{width:100%;height:100%;object-fit:contain;padding:8px}.playerDetailInfo{min-width:0;text-align:right}.playerDetailInfo small{display:block;color:var(--cyan);font-weight:1000;margin-bottom:7px}.playerDetailInfo h2{margin:0;font-size:34px;line-height:1.18;font-weight:1000;color:#ecfeff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.playerDetailChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.playerDetailChips span{height:32px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);font-weight:900;color:#dbeafe}.playerDetailRating{width:62px;height:62px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-size:24px;font-weight:1000}.playerDetailStatsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.playerDetailStatsGrid div{border-radius:20px;padding:12px;background:rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.12);text-align:center}.playerDetailStatsGrid small{display:block;color:#94a3b8;font-weight:900;margin-bottom:6px}.playerDetailStatsGrid b{display:block;color:#ecfeff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.playerDetailActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.playerDetailPrimaryBtn{min-height:48px;border:0;border-radius:18px;cursor:pointer;color:#020617;font-weight:1000;background:linear-gradient(135deg,var(--cyan),var(--blue));box-shadow:0 14px 32px rgba(0,229,255,.16)}.playerDetailPrimaryBtn.edit{background:linear-gradient(135deg,#facc15,#fb923c)}.playerDetailPrimaryBtn.cancel{background:linear-gradient(135deg,#fecaca,#fb7185)}.playerDetailActions .playerDetailPrimaryBtn:only-child{grid-column:1/-1}.playerDetailNotice{margin-top:12px;border-radius:18px;padding:12px;text-align:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#cbd5e1;font-weight:900}
@media(max-width:720px){.playerDetailSubPage{padding:12px;border-radius:22px}.playerDetailHero{grid-template-columns:112px minmax(0,1fr) 52px;gap:10px;padding:12px;border-radius:22px}.playerDetailImageBox{width:112px;height:112px;border-radius:24px}.playerDetailInfo h2{font-size:24px}.playerDetailChips span{height:28px;font-size:11px;padding:0 9px}.playerDetailRating{width:52px;height:52px;border-radius:16px;font-size:20px}.playerDetailStatsGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.playerDetailActions{grid-template-columns:1fr}.playerDetailPrimaryBtn{min-height:46px}}

/* ===== PLAYER RELEASE FINAL STATE ===== */
.playerDealStatus.danger{border-color:rgba(239,68,68,.42)!important;background:linear-gradient(135deg,rgba(239,68,68,.14),rgba(255,255,255,.045))!important}

/* ===== SAFE USER BASE BATCH: compact competition matches + member roster summary ===== */
.memberDealsPanel .dealOnlyNotice{margin-top:12px;border-radius:16px;padding:10px 12px;color:#94a3b8;font-size:12px;font-weight:900;text-align:center;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}
.loanedPlayersPanel{margin-top:14px;padding:12px;border-radius:22px}.loanedPlayersHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.loanedPlayersHead b{color:#ecfeff}.loanedPlayersHead small{color:#94a3b8;font-weight:900}.loanedPlayersList{display:grid;gap:8px}.loanedPlayerRow{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px;border-radius:16px;background:rgba(2,6,23,.30);border:1px solid rgba(255,255,255,.09)}.loanedPlayerRow img{width:40px;height:40px;border-radius:13px;object-fit:cover}.loanedPlayerRow b,.loanedPlayerRow small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.loanedPlayerRow b{color:#f8fafc;font-size:13px}.loanedPlayerRow small{color:#94a3b8;font-size:11px;font-weight:900;margin-top:2px}.loanedPlayerRow span{border-radius:999px;padding:5px 8px;background:rgba(0,229,255,.10);border:1px solid rgba(0,229,255,.18);color:#cffafe;font-size:11px;font-weight:1000;white-space:nowrap}.playerRosterStats{margin-top:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px;border-radius:20px}.playerRosterStats span{border-radius:14px;background:rgba(255,255,255,.055);padding:9px 8px;text-align:center}.playerRosterStats small{display:block;color:#94a3b8;font-size:11px;font-weight:900}.playerRosterStats b{display:block;color:#ecfeff;font-size:18px;margin-top:3px}.readonlyLeagueMatch{grid-template-columns:minmax(0,1fr) auto auto!important;padding:7px 8px!important;border-radius:14px!important;gap:6px!important;min-height:0!important}.readonlyLeagueMatch .leagueMatchTeams{gap:5px!important}.readonlyLeagueMatch .leagueMatchTeams b{font-size:12px!important}.readonlyLeagueMatch .leagueMatchTeams span{font-size:10px!important}.readonlyLeagueMatch .leagueMatchMeta{justify-items:end!important}.readonlyLeagueMatch .leagueMatchMeta span{padding:3px 7px!important;font-size:10px!important}.readonlyLeagueMatch .leagueMatchMeta small{display:none!important}.readonlyLeagueMatch .leagueMatchScore.readonly{gap:4px!important}.readonlyLeagueMatch .leagueMatchScore.readonly b{font-size:14px!important}.readonlyLeagueMatch .leagueMatchScore.readonly strong{font-size:10px!important}.seasonHubPage .leagueRoundBox{padding:8px!important;border-radius:16px!important}.seasonHubPage .leagueRoundBox h4{font-size:13px!important;margin-bottom:6px!important}.seasonHubPage .leagueMatchesList{gap:6px!important}@media(max-width:720px){.readonlyLeagueMatch{grid-template-columns:1fr auto!important}.readonlyLeagueMatch .leagueMatchMeta{display:none!important}.loanedPlayerRow{grid-template-columns:36px minmax(0,1fr);}.loanedPlayerRow span{grid-column:1/-1;text-align:center}.playerRosterStats{grid-template-columns:repeat(3,minmax(0,1fr));}}

/* Safe patch: competition match compact layout + bottom nav cleanup */
.compactResultMatch{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;align-items:center!important;gap:8px!important;border-radius:16px!important;padding:9px 10px!important;background:rgba(2,6,23,.30)!important;border:1px solid rgba(0,229,255,.18)!important;min-height:auto!important}
.compactResultMatch.completed{background:rgba(0,229,255,.075)!important;border-color:rgba(0,229,255,.30)!important}
.compactTeamName{color:#f8fafc;font-size:14px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}.compactTeamName.home{text-align:right}.compactTeamName.away{text-align:left}.compactMatchCenter{display:grid;gap:3px;justify-items:center;min-width:84px}.compactMatchCenter strong{font-size:20px;color:#ecfeff;font-weight:1000;letter-spacing:.02em}.compactMatchCenter small{font-size:10px;color:#67e8f9;font-weight:1000;white-space:nowrap}.compactMatchStatus{grid-column:1/-1;justify-self:center;margin-top:2px;border-radius:999px;padding:2px 8px;background:rgba(255,255,255,.06);color:#94a3b8;font-size:10px;font-weight:900}.leagueMatchesList .compactResultMatch+.compactResultMatch{margin-top:0}.competitionTypeGrid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.competitionTypeCard small{font-size:11px}.memberDealsPanel .dealOnlyNotice{display:none!important}
@media(max-width:520px){.compactResultMatch{grid-template-columns:minmax(0,1fr) 78px minmax(0,1fr)!important;padding:8px!important}.compactTeamName{font-size:13px}.compactMatchCenter strong{font-size:18px}.compactMatchCenter small{font-size:9px}.mainNav{grid-template-columns:repeat(5,minmax(0,1fr))!important}}




/* ===== HOTFIX: cup bracket polish ===== */
.cupRoadBracket .qualifierBracketRounds{display:flex!important;gap:14px!important;align-items:stretch!important;overflow-x:auto!important;padding:8px 2px 12px!important;scroll-snap-type:x proximity!important}
.cupRoadBracket .qualifierBracketRound{min-width:240px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;scroll-snap-align:center!important;background:linear-gradient(180deg,rgba(37,99,235,.20),rgba(15,23,42,.76))!important;border-color:rgba(56,189,248,.22)!important;box-shadow:0 18px 40px rgba(2,6,23,.24)!important}
.cupRoadBracket .qualifierBracketRound h4{color:#dbeafe!important;font-size:16px!important;letter-spacing:.2px!important}
.cupRoadBracket .leagueMatchCard,.cupRoadBracket .readonlyLeagueMatch{background:rgba(15,23,42,.62)!important;border-color:rgba(147,197,253,.18)!important}
.cupChampionBox{background:linear-gradient(135deg,rgba(250,204,21,.16),rgba(14,165,233,.12))!important;border-color:rgba(250,204,21,.32)!important}
.cupChampionBox span{color:#fde68a!important}
.cupChampionBox b{color:#fff7ed!important;font-size:18px!important}.cupChampionIdentity{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}.cupChampionIdentity img{width:42px!important;height:42px!important;border-radius:50%!important;object-fit:cover!important;border:1px solid rgba(250,204,21,.45)!important;background:rgba(255,255,255,.08)!important}
@media(max-width:720px){.cupRoadBracket .qualifierBracketRounds{display:flex!important}.cupRoadBracket .qualifierBracketRound{min-width:82vw!important}}
/* ===== SAFE PATCH: bottom transfers + qualifier bracket + member export polish ===== */
.leagueQualifierInlineSection{margin-top:14px!important}
.leagueQualifierList{display:grid!important;gap:12px!important}
.leagueQualifierCard{border-radius:22px!important;padding:12px!important;background:rgba(2,6,23,.28)!important;border:1px solid rgba(0,229,255,.18)!important}
.leagueQualifierTitle{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;margin-bottom:10px!important}
.leagueQualifierTitle b{font-size:18px!important;color:#ecfeff!important;line-height:1.2!important}
.leagueQualifierTitle small{color:#94a3b8!important;font-weight:900!important;white-space:nowrap!important}
.qualifierBracketRounds{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:10px!important;align-items:start!important}
.qualifierBracketRound{border-radius:18px!important;padding:10px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.08)!important;position:relative!important}
.qualifierBracketRound h4{margin:0 0 8px!important;font-size:15px!important;color:#67e8f9!important;text-align:center!important}
.qualifierBracketRound .readonlyLeagueMatch{min-height:54px!important;margin-bottom:8px!important}
.qualifierQualifiedBox{margin-top:10px!important;border-radius:18px!important;padding:10px 12px!important;background:rgba(34,197,94,.10)!important;border:1px solid rgba(34,197,94,.22)!important;text-align:center!important}
.qualifierQualifiedBox span{display:block!important;color:#86efac!important;font-weight:1000!important;font-size:12px!important;margin-bottom:4px!important}
.qualifierQualifiedBox b{display:block!important;color:#f0fdf4!important;font-size:15px!important;line-height:1.5!important}
@media(max-width:720px){.qualifierBracketRounds{grid-template-columns:1fr!important}.leagueQualifierTitle{display:grid!important;gap:4px!important}.leagueQualifierTitle small{white-space:normal!important}}

/* ===== HOTFIX: cup knockout layout polish ===== */
.cupRoadBracket .qualifierBracketRounds{display:flex!important;flex-direction:row!important;gap:14px!important;align-items:stretch!important;overflow-x:auto!important;padding:8px 2px 12px!important;scroll-snap-type:x proximity!important}
.cupRoadBracket .qualifierBracketRound{min-width:240px!important;max-width:240px!important;min-height:360px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;scroll-snap-align:center!important;background:linear-gradient(180deg,rgba(37,99,235,.18),rgba(15,23,42,.76))!important;border:1px solid rgba(56,189,248,.22)!important;box-shadow:0 18px 40px rgba(2,6,23,.24)!important;padding:12px!important;border-radius:18px!important}
.cupRoadBracket .qualifierBracketRound.finalRound{background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(15,23,42,.82))!important;border-color:rgba(250,204,21,.28)!important}
.cupRoadBracket .qualifierBracketRound h4{margin:2px 0 10px!important;font-size:18px!important;color:#dbeafe!important;text-align:center!important}
.cupRoadBracket .qualifierBracketRound.finalRound h4{color:#fde68a!important}
.cupRoadBracket .cupRoundMatchesStack{display:flex!important;flex-direction:column!important;justify-content:center!important;gap:12px!important;flex:1!important;min-height:0!important}
.cupRoadBracket .compactResultMatch{padding:12px 12px 10px!important;border-radius:18px!important;background:rgba(15,23,42,.68)!important;border:1px solid rgba(147,197,253,.16)!important;min-height:92px!important}
.cupRoadBracket .compactResultMatch.finalRoundMatch{border-color:rgba(250,204,21,.30)!important;background:rgba(15,23,42,.82)!important}
.cupRoadBracket .compactMatchStatus{margin-top:4px!important}
.cupRoadBracket .winnerStatus{background:rgba(34,197,94,.16)!important;color:#bbf7d0!important;border:1px solid rgba(34,197,94,.20)!important}
.cupRoadBracket .winnerTeam{color:#bbf7d0!important}
.cupRoadBracket .qualifierQualifiedBox,.cupRoadBracket .cupChampionBox{display:none!important}
@media(max-width:720px){.cupRoadBracket .qualifierBracketRound{min-width:82vw!important;max-width:82vw!important;min-height:320px!important}}


/* ===== HOTFIX: Super Cup final-only display ===== */
.superCupFinalRoad .qualifierBracketRounds{display:flex!important;justify-content:center!important;overflow:visible!important;padding:6px 0!important}
.superCupFinalRoad .qualifierBracketRound{width:min(100%,720px)!important;min-height:auto!important;background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(15,23,42,.72))!important;border:1px solid rgba(250,204,21,.28)!important;border-radius:22px!important;padding:16px!important;box-shadow:0 18px 40px rgba(2,6,23,.24)!important}
.superCupFinalRoad .qualifierBracketRound h4{color:#fde68a!important;font-size:20px!important;margin:0 0 14px!important;text-align:center!important}
.superCupFinalRoad .cupRoundMatchesStack{display:block!important}
.superCupFinalRoad .compactResultMatch{min-height:112px!important;border-color:rgba(250,204,21,.28)!important;background:rgba(15,23,42,.80)!important}
.superCupFinalRoad .winnerTeam{color:#bbf7d0!important}
.superCupFinalRoad .winnerStatus{background:rgba(34,197,94,.16)!important;color:#bbf7d0!important;border:1px solid rgba(34,197,94,.22)!important}


/* ===== World Cup groups patch ===== */
.worldCupGroupsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.worldCupGroupCard{background:rgba(15,23,42,.62);border:1px solid rgba(56,189,248,.18);border-radius:18px;padding:12px;box-shadow:0 14px 28px rgba(2,6,23,.20)}
.worldCupGroupCard h4{margin:0 0 10px;color:#67e8f9;font-size:17px;text-align:center}
.worldCupByeNote{margin:0 0 10px;color:#fde68a;font-weight:900;text-align:center;font-size:12px;background:rgba(250,204,21,.10);border:1px solid rgba(250,204,21,.18);border-radius:999px;padding:6px 10px}
.miniWorldCupTable .leagueTableHead,.miniWorldCupTable .leagueTableRow{grid-template-columns:34px 1.5fr .6fr .6fr .6fr .7fr .7fr;font-size:12px}
.worldCupRoadBracket .qualifierBracketRound{min-width:260px!important;max-width:260px!important}
.worldCupKnockoutSeparatedRounds .finalRound{background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(15,23,42,.82))!important;border-color:rgba(250,204,21,.28)!important}
.worldCupKnockoutSeparatedRounds .finalRound h4{color:#fde68a!important}
.worldCupKnockoutSeparatedRounds .thirdPlaceColumn{background:linear-gradient(180deg,rgba(37,99,235,.14),rgba(15,23,42,.76))!important;border-color:rgba(56,189,248,.22)!important}
.worldCupKnockoutSeparatedRounds .thirdPlaceColumn h4{color:#dbeafe!important}
.miniDownloadBtn{height:36px;border:0;border-radius:999px;padding:0 14px;background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;font-weight:1000;cursor:pointer;white-space:nowrap;box-shadow:0 10px 24px rgba(0,229,255,.14)}
@media(max-width:900px){.worldCupGroupsGrid{grid-template-columns:1fr}.worldCupRoadBracket .qualifierBracketRound{min-width:82vw!important;max-width:82vw!important}}
@media(max-width:720px){.worldCupGroupsSection .sectionHead{align-items:stretch}.miniDownloadBtn{width:100%}}

/* ===== SAFE PATCH: compact summary + complete group tables ===== */
.compactSummaryStrip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important;margin-top:10px!important}
.leagueSummaryMetric{min-width:0!important;border-radius:16px!important;padding:10px 8px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.09)!important;display:grid!important;grid-template-columns:1fr!important;gap:6px!important;text-align:center!important;place-items:center!important}
.leagueSummaryMetric span{font-size:12px!important;color:#94a3b8!important;font-weight:1000!important;text-align:center!important;white-space:nowrap!important}
.leagueSummaryMetric b{min-width:0!important;width:100%!important;min-height:32px!important;padding:6px 8px!important;border-radius:13px!important;background:rgba(255,255,255,.07)!important;color:#ecfeff!important;font-weight:1000!important;text-align:center!important;display:flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.worldCupGroupCard{min-width:0!important;overflow:hidden!important}
.championsLeagueGroupsGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
.miniWorldCupTable{overflow:visible!important;width:100%!important;min-width:0!important}
.miniWorldCupTable .leagueTableHead,.miniWorldCupTable .leagueTableRow{min-width:0!important;width:100%!important;grid-template-columns:30px minmax(72px,1.5fr) minmax(30px,.55fr) minmax(34px,.55fr) minmax(34px,.60fr) minmax(42px,.72fr) minmax(44px,.72fr)!important;gap:4px!important;padding-inline:6px!important}
.miniWorldCupTable .leagueTableHead span,.miniWorldCupTable .leagueTableRow span,.miniWorldCupTable .leagueTableRow b{font-size:clamp(9px,1.85vw,12px)!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important}
.miniWorldCupTable .leagueTableRow span:nth-child(2){white-space:nowrap!important;text-align:right!important}
.compactMarketPlayersGrid .restrictedPlayerCard{min-height:84px!important}
@media(max-width:900px){.championsLeagueGroupsGrid{grid-template-columns:1fr!important}.compactSummaryStrip{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:520px){.miniWorldCupTable .leagueTableHead,.miniWorldCupTable .leagueTableRow{grid-template-columns:28px minmax(68px,1.7fr) 28px 32px 34px 36px 38px!important;gap:3px!important}.miniWorldCupTable .leagueTableHead span,.miniWorldCupTable .leagueTableRow span,.miniWorldCupTable .leagueTableRow b{font-size:9px!important}}


/* ===== DESIGN POLISH: back button, nav icons, header consistency ===== */

/* Back button: proper icon styling */
.floatingBackBtn{
  background:rgba(30,41,59,.82)!important;
  border:1px solid rgba(255,255,255,.14)!important;
  backdrop-filter:blur(20px) saturate(160%)!important;
  -webkit-backdrop-filter:blur(20px) saturate(160%)!important;
  box-shadow:0 8px 28px rgba(0,0,0,.40), inset 0 1px 0 rgba(255,255,255,.10)!important;
  color:#e2e8f0!important;
  transition:background .15s ease, transform .12s ease, box-shadow .15s ease!important;
}
.floatingBackBtn:active{
  transform:scale(.92)!important;
  background:rgba(0,229,255,.18)!important;
}
.floatingBackBtn svg{
  display:block!important;
  flex-shrink:0!important;
}

/* Nav icons: prevent emoji clipping with overflow:visible on nav, use overflow:hidden only on clip */
.mainNav, body > .mainNav, .mainNav.glassSoft{
  overflow:visible!important;
}
/* Clip the nav background at rounded corners without clipping children */
.mainNav::before{
  content:none!important;
}
.navBtn{
  overflow:visible!important;
}
.navIcon{
  font-size:20px!important;
  line-height:1.4!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  min-height:24px!important;
}
.navLabel{
  font-size:10px!important;
  font-weight:900!important;
  line-height:1.1!important;
  letter-spacing:.01em!important;
}

/* Page header: harmonize sizes across pages */
.pageHead h2{
  font-size:28px!important;
  line-height:1.15!important;
  font-weight:1000!important;
  letter-spacing:-.01em!important;
}
.pageHead p{
  font-size:14px!important;
  color:#94a3b8!important;
  margin-top:6px!important;
}
@media(max-width:720px){
  .pageHead h2{
    font-size:22px!important;
  }
  .pageHead p{
    font-size:13px!important;
  }
}

/* Section headers: consistent across all sections */
.sectionHead h3{
  font-size:22px!important;
  line-height:1.15!important;
  font-weight:1000!important;
}
.sectionHead p{
  font-size:13px!important;
  color:#94a3b8!important;
  margin-top:5px!important;
}
@media(max-width:720px){
  .sectionHead h3{
    font-size:19px!important;
  }
}

/* Profile name: reduce the 42px which is too large */
.profileMain h2{
  font-size:32px!important;
  line-height:1.15!important;
}
@media(max-width:720px){
  .profileMain h2{
    font-size:26px!important;
  }
}

/* Stat card numbers: slightly smaller for visual balance */
.statCard b{
  font-size:28px!important;
}
@media(max-width:720px){
  .statCard b{
    font-size:clamp(22px, 6vw, 28px)!important;
  }
}

/* Fix notification icon clipping in top bar */
.topSystemInner,
.topSystemInner.titleOnly{
  height:40px!important;
  min-height:40px!important;
  overflow:visible!important;
}
.topNotifyBtn{
  width:36px!important;
  height:36px!important;
  overflow:visible!important;
}
.topNotifyBtn span{
  top:-5px!important;
  left:-5px!important;
}

/* ===== SAFE FIX: My Profile offers tab must not widen the mobile page ===== */
.myProfilePage,
.myProfilePage .myProfilePrimaryContent,
.myProfilePage .memberDealsPanel,
.myProfilePage .memberDealList{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  overflow-x:hidden!important;
  box-sizing:border-box!important;
}
.myProfilePage .tabs,
.myProfilePage .memberDealsPanel .tabs{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  display:flex!important;
  flex-wrap:nowrap!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  overscroll-behavior-x:contain!important;
}
.myProfilePage .tabBtn{
  flex:0 0 auto!important;
  max-width:210px!important;
}
.myProfilePage .memberDealCard,
.myProfilePage .managedOfferCard{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
.myProfilePage .memberDealCard > div{
  min-width:0!important;
  max-width:100%!important;
  overflow:hidden!important;
}
.myProfilePage .memberDealCard strong{
  min-width:0!important;
}
.myProfilePage .miniSwapPlayers{
  max-width:100%!important;
  min-width:0!important;
  overflow:hidden!important;
}
.myProfilePage .miniSwapPlayers span{
  min-width:0!important;
  max-width:100%!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  white-space:nowrap!important;
}
@media(max-width:720px){
  .myProfilePage .memberDealsPanel .sectionHead{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    overflow:hidden!important;
  }
  .myProfilePage .memberDealsPanel .sectionHead input{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
  }
  .myProfilePage .memberDealCard,
  .myProfilePage .managedOfferCard{
    grid-template-columns:48px minmax(0,1fr)!important;
  }
  .myProfilePage .offerCenterActions{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    grid-column:1/-1!important;
    overflow:hidden!important;
  }
  .myProfilePage .offerCenterActions button{
    min-width:0!important;
    max-width:100%!important;
  }
}

/* COMPACT INTERNAL PAGE HEADER — My Profile first test only */
.myProfilePage > .pageHead{
  min-height:auto!important;
  margin:0 0 14px!important;
  padding:18px 20px 16px!important;
  border-radius:24px!important;
  overflow:hidden!important;
  background:
    radial-gradient(circle at 92% 10%,rgba(0,230,118,.16),transparent 42%),
    linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.74))!important;
  border:1px solid rgba(0,230,118,.16)!important;
  box-shadow:0 14px 32px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.06)!important;
  text-align:right!important;
}
.myProfilePage > .pageHead h2{
  margin:0!important;
  font-size:clamp(30px,7vw,44px)!important;
  line-height:1.05!important;
  font-weight:1000!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  letter-spacing:0!important;
}
.myProfilePage > .pageHead h2::first-letter{
  color:#6EE7B7!important;
  -webkit-text-fill-color:#6EE7B7!important;
}
.myProfilePage > .pageHead p{
  margin:10px 0 0!important;
  max-width:560px!important;
  font-size:13px!important;
  line-height:1.65!important;
  font-weight:850!important;
  color:#B8BED8!important;
  -webkit-text-fill-color:#B8BED8!important;
}
.myProfilePage > .pageHead::after{
  content:""!important;
  display:block!important;
  width:54px!important;
  height:4px!important;
  border-radius:999px!important;
  margin-top:14px!important;
  background:linear-gradient(90deg,#00E676,#00D4FF)!important;
  box-shadow:0 0 18px rgba(0,230,118,.34)!important;
}
@media(max-width:720px){
  .myProfilePage > .pageHead{
    padding:15px 16px 14px!important;
    border-radius:22px!important;
    margin-bottom:12px!important;
  }
  .myProfilePage > .pageHead h2{
    font-size:clamp(28px,8vw,36px)!important;
  }
  .myProfilePage > .pageHead p{
    font-size:12px!important;
    line-height:1.6!important;
    display:-webkit-box!important;
    -webkit-line-clamp:2!important;
    -webkit-box-orient:vertical!important;
    overflow:hidden!important;
  }
  .myProfilePage > .pageHead::after{
    width:46px!important;
    height:4px!important;
    margin-top:12px!important;
  }
}


/* HEADER + MUSEUM SAFE FIXES */
.topSystemPortalBar,
.topSystemPortalBar.scrolled{
  overflow:visible!important;
}
.topSystemInner,
.topSystemInner.titleOnly{
  height:44px!important;
  min-height:44px!important;
  align-items:center!important;
  overflow:visible!important;
}
.topSystemTitle{
  line-height:1.55!important;
  padding-top:3px!important;
  padding-bottom:2px!important;
  overflow:visible!important;
  white-space:nowrap!important;
}
.topNotifyBtn{
  overflow:visible!important;
}

.myProfilePage > .pageHead{
  min-height:auto!important;
  margin:0 0 12px!important;
  padding:14px 16px 13px!important;
  border-radius:22px!important;
  overflow:hidden!important;
  background:
    radial-gradient(circle at 84% 0%,rgba(0,230,118,.10),transparent 44%),
    linear-gradient(145deg,rgba(3,10,24,.94),rgba(6,16,34,.82))!important;
  border:1px solid rgba(0,230,118,.14)!important;
  box-shadow:0 10px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.055)!important;
}
.myProfilePage > .pageHead h2{
  margin:0!important;
  font-size:clamp(24px,6.2vw,34px)!important;
  line-height:1.38!important;
  font-weight:1000!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  background:none!important;
  -webkit-background-clip:initial!important;
  background-clip:initial!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-overflow:clip!important;
}
.myProfilePage > .pageHead h2::first-letter{
  color:inherit!important;
  -webkit-text-fill-color:inherit!important;
}
.myProfilePage > .pageHead p{
  margin:7px 0 0!important;
  max-width:100%!important;
  font-size:12px!important;
  line-height:1.55!important;
  font-weight:850!important;
  color:#AEB6D2!important;
  -webkit-text-fill-color:#AEB6D2!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2!important;
  -webkit-box-orient:vertical!important;
  overflow:hidden!important;
}
.myProfilePage > .pageHead::after{
  display:none!important;
  content:none!important;
}

.museumPage,
.museumEmbedded{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  overflow:hidden!important;
  box-sizing:border-box!important;
}
.museumEmbedded .museumHero,
.museumEmbedded .museumGrid,
.museumEmbedded .museumRecords,
.museumEmbedded .museumSectionTitle{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
}
.museumEmbedded .museumTabs{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  display:flex!important;
  flex-wrap:nowrap!important;
  gap:8px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  touch-action:pan-x!important;
  scrollbar-width:none!important;
  overscroll-behavior-x:contain!important;
  padding:0 2px 4px!important;
  margin:12px 0!important;
  justify-content:flex-start!important;
  direction:rtl!important;
}
.museumEmbedded .museumTabs::-webkit-scrollbar{
  display:none!important;
}
.museumEmbedded .museumTabs button{
  flex:0 0 auto!important;
  white-space:nowrap!important;
  min-width:max-content!important;
  max-width:none!important;
}
.museumEmbedded .museumCard,
.museumEmbedded .museumRecord{
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
}
.museumEmbedded .museumCard h3,
.museumEmbedded .museumRecord b,
.museumEmbedded .museumMiniRow b{
  min-width:0!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
@media(max-width:720px){
  .topSystemInner,
  .topSystemInner.titleOnly{
    height:46px!important;
    min-height:46px!important;
  }
  .topSystemTitle{
    line-height:1.65!important;
    padding-top:4px!important;
    font-size:17px!important;
  }
  .myProfilePage > .pageHead{
    padding:13px 14px 12px!important;
    border-radius:20px!important;
  }
  .myProfilePage > .pageHead h2{
    font-size:clamp(23px,6.6vw,31px)!important;
    line-height:1.42!important;
  }
  .myProfilePage > .pageHead p{
    font-size:11.5px!important;
    line-height:1.5!important;
  }
}


/* UNIFIED COMPACT INTERNAL PAGE HEADERS — exclude HomePage custom hero */
.app .widePage > .pageHead,
.app .widePage.glass > .pageHead{
  min-height:auto!important;
  margin:0 0 12px!important;
  padding:14px 16px 13px!important;
  border-radius:22px!important;
  overflow:hidden!important;
  background:
    radial-gradient(circle at 84% 0%,rgba(0,230,118,.10),transparent 44%),
    linear-gradient(145deg,rgba(3,10,24,.94),rgba(6,16,34,.82))!important;
  border:1px solid rgba(0,230,118,.14)!important;
  box-shadow:0 10px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.055)!important;
  text-align:right!important;
}
.app .widePage > .pageHead h2,
.app .widePage.glass > .pageHead h2{
  margin:0!important;
  font-size:clamp(24px,6.2vw,34px)!important;
  line-height:1.38!important;
  font-weight:1000!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  background:none!important;
  -webkit-background-clip:initial!important;
  background-clip:initial!important;
  white-space:normal!important;
  overflow:visible!important;
  text-overflow:clip!important;
  letter-spacing:0!important;
}
.app .widePage > .pageHead h2::first-letter,
.app .widePage.glass > .pageHead h2::first-letter{
  color:inherit!important;
  -webkit-text-fill-color:inherit!important;
}
.app .widePage > .pageHead p,
.app .widePage.glass > .pageHead p{
  margin:7px 0 0!important;
  max-width:100%!important;
  font-size:12px!important;
  line-height:1.55!important;
  font-weight:850!important;
  color:#AEB6D2!important;
  -webkit-text-fill-color:#AEB6D2!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2!important;
  -webkit-box-orient:vertical!important;
  overflow:hidden!important;
}
.app .widePage > .pageHead::after,
.app .widePage.glass > .pageHead::after{
  display:none!important;
  content:none!important;
}

/* Admin-only heroes use the same compact language without touching page logic */
.app .fifaAdminHero,
.app .leagueAdminHero{
  min-height:auto!important;
  margin:0 0 12px!important;
  padding:14px 16px 13px!important;
  border-radius:22px!important;
  overflow:hidden!important;
  background:
    radial-gradient(circle at 84% 0%,rgba(0,230,118,.10),transparent 44%),
    linear-gradient(145deg,rgba(3,10,24,.94),rgba(6,16,34,.82))!important;
  border:1px solid rgba(0,230,118,.14)!important;
  box-shadow:0 10px 24px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.055)!important;
}
.app .fifaAdminHero h1,
.app .fifaAdminHero h2,
.app .fifaAdminHero h3,
.app .leagueAdminHero h1,
.app .leagueAdminHero h2,
.app .leagueAdminHero h3{
  margin:0!important;
  font-size:clamp(24px,6.2vw,34px)!important;
  line-height:1.38!important;
  font-weight:1000!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  background:none!important;
  -webkit-background-clip:initial!important;
  background-clip:initial!important;
  letter-spacing:0!important;
}
.app .fifaAdminHero p,
.app .leagueAdminHero p{
  margin:7px 0 0!important;
  max-width:100%!important;
  font-size:12px!important;
  line-height:1.55!important;
  font-weight:850!important;
  color:#AEB6D2!important;
  -webkit-text-fill-color:#AEB6D2!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2!important;
  -webkit-box-orient:vertical!important;
  overflow:hidden!important;
}

/* Keep HomePage hero untouched */
.app .hp2Hero,
.app .hp2Hero *{
  /* intentionally left to HomePage styles */
}

@media(max-width:720px){
  .app .widePage > .pageHead,
  .app .widePage.glass > .pageHead,
  .app .fifaAdminHero,
  .app .leagueAdminHero{
    padding:13px 14px 12px!important;
    border-radius:20px!important;
    margin-bottom:12px!important;
  }
  .app .widePage > .pageHead h2,
  .app .widePage.glass > .pageHead h2,
  .app .fifaAdminHero h1,
  .app .fifaAdminHero h2,
  .app .fifaAdminHero h3,
  .app .leagueAdminHero h1,
  .app .leagueAdminHero h2,
  .app .leagueAdminHero h3{
    font-size:clamp(23px,6.6vw,31px)!important;
    line-height:1.42!important;
  }
  .app .widePage > .pageHead p,
  .app .widePage.glass > .pageHead p,
  .app .fifaAdminHero p,
  .app .leagueAdminHero p{
    font-size:11.5px!important;
    line-height:1.5!important;
  }
}


/* INTERNAL TABS + ARCHIVE HEADER FIX */
.app .archiveHubPage > .archiveHubHead.pageHead{
  display:block!important;
  position:relative!important;
  min-height:auto!important;
  padding:14px 16px 13px!important;
  border-radius:22px!important;
  margin:0 0 12px!important;
  overflow:hidden!important;
}
.app .archiveHubPage > .archiveHubHead.pageHead h2{
  font-size:clamp(24px,6.2vw,34px)!important;
  line-height:1.38!important;
  margin:0!important;
  white-space:normal!important;
  overflow:visible!important;
}
.app .archiveHubPage > .archiveHubHead.pageHead p{
  margin:7px 0 0!important;
  padding:0!important;
  max-width:100%!important;
  font-size:12px!important;
  line-height:1.55!important;
  -webkit-line-clamp:1!important;
}
.app .archiveHubPage .archiveTotalBadge{
  position:static!important;
  inset:auto!important;
  transform:none!important;
  margin-top:10px!important;
  width:auto!important;
  min-width:96px!important;
  max-width:max-content!important;
  height:40px!important;
  padding:0 16px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:6px!important;
  border-radius:999px!important;
  background:rgba(0,230,118,.10)!important;
  border:1px solid rgba(0,230,118,.22)!important;
  box-shadow:none!important;
}
.app .archiveHubPage .archiveTotalBadge b{
  font-size:24px!important;
  line-height:1!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
}
.app .archiveHubPage .archiveTotalBadge small{
  font-size:11px!important;
  font-weight:900!important;
  color:#AEB6D2!important;
  -webkit-text-fill-color:#AEB6D2!important;
  white-space:nowrap!important;
}

/* One visual language for inner page tabs */
.app .tabs,
.app .archiveModeTabs,
.app .museumTabs{
  width:100%!important;
  max-width:100%!important;
  min-width:0!important;
  box-sizing:border-box!important;
  display:flex!important;
  flex-wrap:nowrap!important;
  gap:8px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  -webkit-overflow-scrolling:touch!important;
  scrollbar-width:none!important;
  touch-action:pan-x!important;
  overscroll-behavior-x:contain!important;
  justify-content:flex-start!important;
  direction:rtl!important;
  padding:6px!important;
  margin:12px 0 14px!important;
  border-radius:22px!important;
  background:rgba(2,6,23,.34)!important;
  border:1px solid rgba(255,255,255,.06)!important;
}
.app .tabs::-webkit-scrollbar,
.app .archiveModeTabs::-webkit-scrollbar,
.app .museumTabs::-webkit-scrollbar{
  display:none!important;
}
.app .tabs button,
.app .archiveModeTabs button,
.app .museumTabs button,
.app .tabBtn{
  flex:0 0 auto!important;
  min-width:max-content!important;
  max-width:none!important;
  height:44px!important;
  min-height:44px!important;
  padding:0 16px!important;
  border-radius:18px!important;
  border:1px solid rgba(255,255,255,.10)!important;
  background:linear-gradient(145deg,rgba(15,23,42,.78),rgba(2,6,23,.60))!important;
  color:#D8DDF2!important;
  -webkit-text-fill-color:#D8DDF2!important;
  font-size:13px!important;
  font-weight:1000!important;
  white-space:nowrap!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.055)!important;
}
.app .tabs button.active,
.app .archiveModeTabs button.active,
.app .museumTabs button.active,
.app .tabBtn.active{
  color:#021018!important;
  -webkit-text-fill-color:#021018!important;
  border-color:rgba(0,230,118,.18)!important;
  background:linear-gradient(135deg,#00E676,#00D4FF)!important;
  box-shadow:0 10px 24px rgba(0,230,118,.18),inset 0 1px 0 rgba(255,255,255,.20)!important;
}
@media(max-width:720px){
  .app .tabs,
  .app .archiveModeTabs,
  .app .museumTabs{
    gap:7px!important;
    padding:5px!important;
    border-radius:20px!important;
    margin:10px 0 12px!important;
  }
  .app .tabs button,
  .app .archiveModeTabs button,
  .app .museumTabs button,
  .app .tabBtn{
    height:40px!important;
    min-height:40px!important;
    padding:0 14px!important;
    border-radius:16px!important;
    font-size:12.5px!important;
  }
}


/* REMOVE PAGE HEADER SUBTITLES — cleaner internal headers */
.app .widePage > .pageHead p,
.app .widePage.glass > .pageHead p,
.app .fifaAdminHero p,
.app .leagueAdminHero p{
  display:none!important;
  content:none!important;
  margin:0!important;
  height:0!important;
  max-height:0!important;
  overflow:hidden!important;
}
.app .widePage > .pageHead,
.app .widePage.glass > .pageHead,
.app .fifaAdminHero,
.app .leagueAdminHero{
  padding:13px 16px!important;
}
.app .archiveHubPage .archiveTotalBadge{
  margin-top:9px!important;
}
@media(max-width:720px){
  .app .widePage > .pageHead,
  .app .widePage.glass > .pageHead,
  .app .fifaAdminHero,
  .app .leagueAdminHero{
    padding:12px 14px!important;
  }
  .app .archiveHubPage .archiveTotalBadge{
    margin-top:8px!important;
  }
}


/* TOP BAR ICON CONSISTENCY + NOTIFICATION CLIP FIX */
.topSystemPortalBar,
.topSystemPortalBar.scrolled{
  overflow:visible!important;
}
.topSystemInner,
.topSystemInner.titleOnly{
  height:46px!important;
  min-height:46px!important;
  align-items:center!important;
  overflow:visible!important;
  padding-top:2px!important;
  box-sizing:border-box!important;
}

/* Make notification and back buttons share the same app-green visual language */
.topNotifyBtn,
.topSystemBackBtn{
  width:36px!important;
  min-width:36px!important;
  height:36px!important;
  min-height:36px!important;
  max-width:36px!important;
  max-height:36px!important;
  padding:0!important;
  border-radius:999px!important;
  border:1px solid rgba(0,230,118,.32)!important;
  background:rgba(0,230,118,.10)!important;
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  box-shadow:0 10px 26px rgba(0,0,0,.28),0 0 18px rgba(0,230,118,.10)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  line-height:1!important;
  overflow:visible!important;
  box-sizing:border-box!important;
}

/* Bell SVG was visually clipped on iOS; keep it centered and fully visible */
.topNotifyBtn svg,
.topNotifyBtn .lucide,
.topNotifyBtn i{
  width:20px!important;
  height:20px!important;
  min-width:20px!important;
  min-height:20px!important;
  display:block!important;
  overflow:visible!important;
  color:#00E676!important;
  stroke:currentColor!important;
  fill:none!important;
  transform:translateY(1.5px)!important;
}

/* Keep the red count badge untouched except for safe placement */
.topNotifyBtn .badge,
.topNotifyBtn .notificationBadge,
.topNotifyBtn .notifBadge,
.topNotifyBtn [class*="badge"],
.topNotifyBtn [class*="Badge"]{
  -webkit-text-fill-color:#fff!important;
  color:#fff!important;
  transform:none!important;
  z-index:3!important;
}

/* Back arrow remains centered and same color as notification icon */
.topSystemBackBtn span{
  color:#00E676!important;
  -webkit-text-fill-color:#00E676!important;
  display:block!important;
  line-height:1!important;
  transform:translateX(1px)!important;
}

/* Mobile top bar final spacing */
@media(max-width:720px){
  .topSystemInner,
  .topSystemInner.titleOnly{
    height:46px!important;
    min-height:46px!important;
    grid-template-columns:38px minmax(0,1fr) 38px!important;
    gap:8px!important;
    padding-top:2px!important;
  }
  .topNotifyBtn,
  .topSystemBackBtn,
  .topSystemBackSpacer{
    width:36px!important;
    min-width:36px!important;
    height:36px!important;
    min-height:36px!important;
  }
  .topSystemTitle{
    line-height:1.65!important;
    padding-top:3px!important;
    overflow:visible!important;
  }
}


/* INTERNAL PAGE VERTICAL RHYTHM COMPACT FIX */
.app .widePage,
.app .widePage.glass{
  row-gap:10px!important;
}

/* Make internal headers compact after removing subtitles */
.app .widePage > .pageHead,
.app .widePage.glass > .pageHead,
.app .fifaAdminHero,
.app .leagueAdminHero{
  margin-bottom:6px!important;
  padding-top:10px!important;
  padding-bottom:10px!important;
  min-height:0!important;
}

.app .widePage > .pageHead h2,
.app .widePage.glass > .pageHead h2,
.app .fifaAdminHero h1,
.app .fifaAdminHero h2,
.app .fifaAdminHero h3,
.app .leagueAdminHero h1,
.app .leagueAdminHero h2,
.app .leagueAdminHero h3{
  line-height:1.22!important;
}

/* Kill duplicated top margins immediately after the page header */
.app .widePage > .pageHead + *,
.app .widePage.glass > .pageHead + *,
.app .fifaAdminHero + *,
.app .leagueAdminHero + *{
  margin-top:0!important;
}

/* Internal tab rows should sit close to the header and consume less height */
.app .tabs,
.app .archiveModeTabs,
.app .museumTabs{
  margin-top:6px!important;
  margin-bottom:8px!important;
  padding-top:4px!important;
  padding-bottom:4px!important;
  min-height:0!important;
}

.app .tabs button,
.app .archiveModeTabs button,
.app .museumTabs button,
.app .tabBtn{
  height:38px!important;
  min-height:38px!important;
  padding-top:0!important;
  padding-bottom:0!important;
}

/* Reduce common section-card gaps on internal pages without changing HomePage */
.app .widePage > .tabs + *,
.app .widePage > .archiveModeTabs + *,
.app .widePage > .museumTabs + *,
.app .widePage.glass > .tabs + *,
.app .widePage.glass > .archiveModeTabs + *,
.app .widePage.glass > .museumTabs + *{
  margin-top:8px!important;
}

.app .widePage .sectionHead,
.app .widePage.glass .sectionHead,
.app .widePage .archiveSectionHead,
.app .widePage.glass .archiveSectionHead{
  margin-top:10px!important;
  margin-bottom:8px!important;
}

/* Profile / transfer / studio panels had old large rhythm after the header */
.app .myProfilePage > .glassSoft,
.app .myProfilePage > .profileHero,
.app .myProfilePage > .profileSummary,
.app .transferPage > .glassSoft,
.app .studioPage > .glassSoft,
.app .seasonHubPage > .glassSoft,
.app .statsPage > .glassSoft,
.app .archiveHubPage > .glassSoft{
  margin-top:8px!important;
}

/* Keep HomePage spacing untouched */
.app .homePage,
.app .homePage *,
.app .hp2Hero,
.app .hp2Hero *{
  /* no override */
}

@media(max-width:720px){
  .app .widePage,
  .app .widePage.glass{
    row-gap:8px!important;
  }
  .app .widePage > .pageHead,
  .app .widePage.glass > .pageHead,
  .app .fifaAdminHero,
  .app .leagueAdminHero{
    margin-bottom:5px!important;
    padding-top:9px!important;
    padding-bottom:9px!important;
  }
  .app .tabs,
  .app .archiveModeTabs,
  .app .museumTabs{
    margin-top:5px!important;
    margin-bottom:7px!important;
    padding-top:4px!important;
    padding-bottom:4px!important;
  }
  .app .tabs button,
  .app .archiveModeTabs button,
  .app .museumTabs button,
  .app .tabBtn{
    height:36px!important;
    min-height:36px!important;
  }
}


/* ACTIVE TITLE CLIP + COMPACT INNER SECTION HEADS + LINKS ICON SUPPORT */
.fgMemberLegacyHead,
.fgMemberLegacyHead h3{
  overflow:visible!important;
}
.fgMemberLegacyHead h3{
  line-height:1.42!important;
  padding-top:4px!important;
  padding-bottom:5px!important;
  margin-top:-2px!important;
  letter-spacing:0!important;
}

/* Home active members title can clip Arabic dots when gradient text is tight */
.hp2MembersTitle,
.hp2SectionTitle,
.hp2SectionHead h2,
.homeMembersTitle,
.homeActiveMembersTitle{
  line-height:1.42!important;
  padding-top:4px!important;
  padding-bottom:5px!important;
  overflow:visible!important;
}

/* Compact subsection headers; these are not page headers */
.app .widePage .sectionHead.compact,
.app .widePage.glass .sectionHead.compact,
.app .widePage .archiveSectionHead,
.app .widePage.glass .archiveSectionHead{
  min-height:0!important;
  height:auto!important;
  margin:8px 0 8px!important;
  padding:10px 12px!important;
  border-radius:18px!important;
  background:linear-gradient(145deg,rgba(4,12,28,.72),rgba(2,6,23,.54))!important;
  border:1px solid rgba(0,230,118,.12)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
}
.app .widePage .sectionHead.compact h3,
.app .widePage.glass .sectionHead.compact h3,
.app .widePage .archiveSectionHead h3,
.app .widePage.glass .archiveSectionHead h3{
  margin:0!important;
  font-size:clamp(18px,4.4vw,24px)!important;
  line-height:1.32!important;
  font-weight:1000!important;
  color:#EDF0FF!important;
  -webkit-text-fill-color:#EDF0FF!important;
  background:none!important;
  -webkit-background-clip:initial!important;
  background-clip:initial!important;
  padding:0!important;
  white-space:normal!important;
  overflow:visible!important;
}
.app .widePage .sectionHead.compact p,
.app .widePage.glass .sectionHead.compact p,
.app .widePage .archiveSectionHead p,
.app .widePage.glass .archiveSectionHead p{
  display:none!important;
  margin:0!important;
  height:0!important;
  overflow:hidden!important;
}

/* Studio specific: keep "اختيار القالب" as a small section label, not a hero */
.app .fifaStudioPage .studioPanel .sectionHead.compact{
  margin-bottom:8px!important;
}
.app .fifaStudioPage .studioPanel .sectionHead.compact h3{
  font-size:clamp(18px,4vw,23px)!important;
}

/* Archive: keep "السجل حسب البطولة" compact */
.app .archiveHubPage .archiveSectionHead{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:10px!important;
}
.app .archiveHubPage .archiveSectionHead .secDlBtn{
  width:38px!important;
  height:38px!important;
  min-width:38px!important;
  min-height:38px!important;
  border-radius:14px!important;
}

/* Important links icons */
.app .linkTile{
  position:relative!important;
  overflow:hidden!important;
}
.app .linkTile > span{
  width:42px!important;
  height:42px!important;
  border-radius:14px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:rgba(0,230,118,.10)!important;
  border:1px solid rgba(0,230,118,.22)!important;
  color:#00E676!important;
  margin-bottom:10px!important;
  font-size:22px!important;
  line-height:1!important;
}
.app .linkTile .linkFallbackIcon{
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  height:100%!important;
  font-size:22px!important;
  line-height:1!important;
  filter:drop-shadow(0 0 10px rgba(0,230,118,.18));
}
.app .linkTile .smartIconImg{
  width:24px!important;
  height:24px!important;
  object-fit:contain!important;
  display:block!important;
}

@media(max-width:720px){
  .fgMemberLegacyHead h3,
  .hp2MembersTitle,
  .hp2SectionTitle,
  .hp2SectionHead h2,
  .homeMembersTitle,
  .homeActiveMembersTitle{
    line-height:1.46!important;
    padding-top:5px!important;
    padding-bottom:6px!important;
  }
  .app .widePage .sectionHead.compact,
  .app .widePage.glass .sectionHead.compact,
  .app .widePage .archiveSectionHead,
  .app .widePage.glass .archiveSectionHead{
    margin:7px 0 7px!important;
    padding:9px 11px!important;
    border-radius:16px!important;
  }
  .app .widePage .sectionHead.compact h3,
  .app .widePage.glass .sectionHead.compact h3,
  .app .widePage .archiveSectionHead h3,
  .app .widePage.glass .archiveSectionHead h3{
    font-size:clamp(17px,4.8vw,22px)!important;
    line-height:1.34!important;
  }
  .app .linkTile > span{
    width:40px!important;
    height:40px!important;
    border-radius:13px!important;
    margin-bottom:8px!important;
  }
}


`;
