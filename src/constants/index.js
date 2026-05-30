export const DEFAULT_CONFIG = {
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
  balanceIcon: "",
  totalTrophiesIcon: "",
  navMembersIcon: "",
  navSeasonIcon: "",
  navArchiveIcon: "",
  navRankingIcon: "",
  navMoreIcon: "☰",
  menuStatsIcon: "",
  menuTransfersIcon: "",
  menuLinksIcon: "",
  memberTeamIcon: "",
  memberNationalIcon: "",
  finalsPlayedIcon: "",
  finalsWonIcon: "",
  finalsLostIcon: "",
  goalsForIcon: "",
  goalsAgainstIcon: "",
  relegationsIcon: "",
  seasonCountIcon: "",
  seasonPointsIcon: "",
  rankingTitlesIcon: "",
  rankingPointsIcon: "",
  transferAmountIcon: "",
  transferTypeIcon: "",
  transferDateIcon: "",
  transferNoteIcon: "",
  linkFacebookIcon: "",
  linkTournamentsIcon: "",
  linkSeasonIcon: "",
  linkDefaultIcon: "",
  memberCardTrophyIcon: "",
  archiveTrophyTabIcon: "",
  archiveSeasonTabIcon: "",
  archiveMemberTabIcon: "",
};

export const URLS = {
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
};

export const FALLBACK_PLAYER_IMAGE = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
export const PUSH_SW_PATH_FOR_FOREGROUND = "/firebase-messaging-sw.js";

export const OFFER_FEE = 500000;
export const MAX_DAILY_PLAYER_OFFERS = 5;
export const PLAYER_OFFER_EXPIRE_DAYS = 3;
export const MAX_PRO_PLAYERS = 5;
export const MIN_SQUAD_PLAYERS = 17;
export const MAX_SQUAD_PLAYERS = 32;
export const LOAN_TERMINATION_COMPENSATION = 10000000;
export const FREE_AGENT_REPLACEMENT_FEE = 5000000;

export const stripIcon = s =>
  (s || '').replace(/[^؀-ۿݐ-ݿࢠ-ࣿa-zA-Z0-9\s\-–—،,.!?():[\]{}'"«»​-‏‪-‮]+/g, '').trim();
