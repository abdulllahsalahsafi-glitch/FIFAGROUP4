// ═══════════════════════════════════════════════════════════
// src/utils/seasonCenter.js
// دوال مركز الموسم المستخرجة من App.jsx (السطر 17669 – 17980)
// ═══════════════════════════════════════════════════════════

import { clean, cleanId, same } from "./helpers.js";
import {
  isLinkedLeagueGroupsCup,
  championsLeagueGroupRows,
  linkedCupGroupIsReady,
  sortedCompetitionMatchesForSchedule,
  resolveLeagueQualifierDependencies,
  competitionTypeKey,
  isLeagueGroupsCompetition,
} from "./competition.js";

// ── دوال مساعدة داخلية ───────────────────────────────────

function getMemberName(membersOrParticipants, memberId) {
  const id = cleanId(memberId);
  if (!id) return "";
  const found = (membersOrParticipants || []).find(
    (item) => same(item.memberId || item.id, id)
  );
  return found?.memberName || found?.name || id;
}

function notificationTimeValue(value) {
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === "number") return value;
  if (value?.seconds) return value.seconds * 1000;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  const raw = String(value || "0").trim();
  const number = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number)) return raw;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.max(Math.min(number, 999999999), -999999999)
  );
}

function effectiveTransferStatusLabel(offer = {}) {
  const status = clean(offer.status || "pending");
  const labels = {
    pending: "بانتظار الرد",
    accepted: "مقبول",
    rejected: "مرفوض",
    cancelled: "ملغي",
    completed: "منجز",
    expired: "منتهي",
    execution_pending: "بانتظار التنفيذ",
  };
  return labels[status] || status || "بانتظار الرد";
}

function competitionTypeArabic(type = "") {
  const key = clean(type);
  const labels = {
    league: "الدوري",
    cup: "الكأس",
    super_cup: "كأس السوبر",
    world_cup: "كأس العالم",
    champions_league: "دوري الأبطال",
    league_qualifier: "ملحق الدوري",
  };
  return labels[key] || type || "بطولة";
}

// ── الدوال المُصدَّرة ─────────────────────────────────────

export function getSeasonCenterCompetitionMatches(competition = {}) {
  const typeKey = competitionTypeKey(competition.type || competition.competitionType || "league");
  const needsResolvedSchedule = typeKey === "world_cup" || typeKey === "champions_league" || isLeagueGroupsCompetition(competition);
  const base = needsResolvedSchedule
    ? sortedCompetitionMatchesForSchedule(competition)
    : (Array.isArray(competition.matches) ? competition.matches : []);
  const qualifier = competition.leagueQualifier && Array.isArray(competition.leagueQualifier.matches)
    ? resolveLeagueQualifierDependencies(competition.leagueQualifier.matches).map((match) => ({ ...match, label: match.label || "ملحق الدوري" }))
    : [];
  return [...qualifier, ...base].map((match) => ({ competition, match }));
}

export function isSeasonCenterOpenMatch(match = {}) {
  const phase = clean(match.phase || "");
  const status = clean(match.resultStatus || match.status || "scheduled");
  const homeId = cleanId(match.homeMemberId || "");
  const awayId = cleanId(match.awayMemberId || "");
  if (phase === "bye") return false;
  if (status === "completed" || status === "cancelled") return false;
  if (!homeId || !awayId) return false;
  if (homeId === "__bye__" || awayId === "__bye__") return false;
  if (homeId.startsWith("__") || awayId.startsWith("__")) return false;
  return true;
}

export function getSeasonCenterCompetitionStats(competition = {}, allCompetitions = []) {
  if (isLinkedLeagueGroupsCup(competition)) {
    const linkedLeagueId = cleanId(competition.linkedLeagueCompetitionId || competition.linkedLeagueId || competition.cupLinkedLeagueCompetitionId || "");
    const linkedLeague = linkedLeagueId ? (allCompetitions || []).find((item) => same(item.id, linkedLeagueId)) : null;
    const linkedGroups = linkedLeague
      ? championsLeagueGroupRows(linkedLeague).slice(0, 2)
      : (((competition.gameQuota || {}).groups || []).slice(0, 2));

    if (linkedGroups.length) {
      const total = linkedGroups.length;
      const completed = linkedLeague
        ? linkedGroups.filter((group) => linkedCupGroupIsReady(group)).length
        : linkedGroups.filter((group) => Boolean(group.completed)).length;
      return {
        total,
        completed,
        unitLabel: "مسارات جاهزة",
        percent: total ? Math.round((completed / total) * 100) : 0,
      };
    }
  }

  const rows = getSeasonCenterCompetitionMatches(competition).map((item) => item.match).filter((match) => clean(match.phase || "") !== "bye");
  const playable = rows.filter((match) => {
    const h = cleanId(match.homeMemberId || "");
    const a = cleanId(match.awayMemberId || "");
    return h && a && h !== "__bye__" && a !== "__bye__" && !h.startsWith("__") && !a.startsWith("__");
  });
  return {
    total: playable.length,
    completed: playable.filter((match) => clean(match.resultStatus || match.status) === "completed").length,
    unitLabel: "مكتملة",
    percent: playable.length ? Math.round((playable.filter((match) => clean(match.resultStatus || match.status) === "completed").length / playable.length) * 100) : 0,
  };
}

export function getSeasonCenterRadarItems({
  activeCompetitions = [],
  allCompetitions = [],
  openMatches = [],
  myMatches = [],
  activeOfferRows = [],
  marketOpen = false,
  openWindow = null,
  isFifaAdmin = false,
  latestNotifications = [],
} = {}) {
  const items = [];
  const pushItem = (item = {}) => {
    const title = String(item.title || "").trim();
    const body = String(item.body || "").trim();
    if (!title || !body) return;
    if (items.some((row) => row.title === title && row.body === body && cleanId(row.competitionId || "") === cleanId(item.competitionId || ""))) return;
    items.push({ title, body, competitionId: cleanId(item.competitionId || "") });
  };

  const linkedCups = (activeCompetitions || []).filter((competition) => isLinkedLeagueGroupsCup(competition));
  linkedCups.forEach((competition) => {
    const stats = getSeasonCenterCompetitionStats(competition, allCompetitions);
    if (stats.total && stats.completed < stats.total) {
      pushItem({
        title: "كأس مرتبط ينتظر الدوري",
        body: (competition.name || competition.title || "الكأس") + " — " + stats.completed + "/" + stats.total + " مسارات جاهزة.",
        competitionId: competition.id,
      });
    }
  });

  const readyForApproval = [];
  const incompleteCompetitions = [];
  (activeCompetitions || []).forEach((competition) => {
    const stats = getSeasonCenterCompetitionStats(competition, allCompetitions);
    if (!stats.total) return;
    if (stats.completed >= stats.total) readyForApproval.push({ competition, stats });
    else incompleteCompetitions.push({ competition, stats, remaining: Math.max(0, stats.total - stats.completed) });
  });

  readyForApproval.slice(0, 2).forEach(({ competition }) => {
    pushItem({
      title: "بطولة جاهزة للاعتماد",
      body: (competition.name || competition.title || "بطولة") + " اكتملت نتائجها وتنتظر اعتماد FIFA.",
      competitionId: competition.id,
    });
  });

  incompleteCompetitions.slice(0, 3).forEach(({ competition, remaining }) => {
    pushItem({
      title: "نتائج ناقصة",
      body: (competition.name || competition.title || "بطولة") + " تحتاج " + remaining + " مباراة غير مسجلة.",
      competitionId: competition.id,
    });
  });

  if (isFifaAdmin && openMatches.length) {
    pushItem({
      title: "متابعة إدارية للمباريات",
      body: openMatches.length + " مباراة في البطولات النشطة لا تزال بدون نتيجة.",
    });
  } else if (!isFifaAdmin && myMatches.length) {
    pushItem({
      title: "مبارياتك القادمة",
      body: "لديك " + myMatches.length + " مباراة غير مسجلة في البطولات النشطة.",
    });
  }

  if (activeOfferRows.length) {
    pushItem({
      title: isFifaAdmin ? "عروض منظورة" : "عروضك النشطة",
      body: isFifaAdmin
        ? activeOfferRows.length + " عرض انتقال نشط يحتاج متابعة عند الحاجة."
        : activeOfferRows.length + " عرض يخصك فقط في صفحة الانتقالات.",
    });
  }

  if (marketOpen) {
    pushItem({
      title: "سوق الانتقالات مفتوح",
      body: openWindow?.endDate
        ? "الفترة المفتوحة مستمرة حتى " + openWindow.endDate + "."
        : "توجد فترة انتقالات مفتوحة حاليًا.",
    });
  }

  (latestNotifications || []).slice(0, 2).forEach((item) => {
    pushItem({
      title: item.title || "إشعار مهم",
      body: item.body || item.note || "تنبيه من نظام FIFA GROUP.",
    });
  });

  return items.slice(0, 8);
}

export function getSeasonCenterEventFeed({
  activeCompetitions = [],
  allMatches = [],
  activeOfferRows = [],
  marketOpen = false,
  openWindow = null,
  latestNotifications = [],
  members = [],
  isFifaAdmin = false,
} = {}) {
  const events = [];
  const addEvent = (event = {}) => {
    const title = String(event.title || "").trim();
    const body = String(event.body || "").trim();
    if (!title || !body) return;
    events.push({
      tag: event.tag || "موسم",
      title,
      body,
      dateLabel: event.dateLabel || seasonCenterEventDateLabel(event.timeSource || event.date || event.createdAt),
      timeValue: notificationTimeValue(event.timeSource || event.updatedAt || event.createdAt || event.date || 0),
      competitionId: cleanId(event.competitionId || ""),
    });
  };

  (latestNotifications || []).slice(0, 4).forEach((item) => {
    addEvent({
      tag: "إشعار",
      title: item.title || "إشعار مهم",
      body: item.body || item.note || "تنبيه من نظام FIFA GROUP.",
      timeSource: item.createdAt || item.updatedAt || item.date,
    });
  });

  (allMatches || [])
    .map(({ competition, match }) => ({ competition, match }))
    .filter(({ match }) => clean(match?.resultStatus || match?.status || "") === "completed")
    .sort((a, b) => notificationTimeValue(b.match.completedAt || b.match.updatedAt || b.match.date) - notificationTimeValue(a.match.completedAt || a.match.updatedAt || a.match.date))
    .slice(0, 4)
    .forEach(({ competition, match }) => {
      const homeName = match.homeName || getMemberName(members, match.homeMemberId) || "الطرف الأول";
      const awayName = match.awayName || getMemberName(members, match.awayMemberId) || "الطرف الثاني";
      const homeScore = match.homeScore ?? match.score1 ?? match.member1Score ?? "";
      const awayScore = match.awayScore ?? match.score2 ?? match.member2Score ?? "";
      const scoreText = homeScore !== "" && awayScore !== "" ? " — " + homeScore + " / " + awayScore : "";
      addEvent({
        tag: "نتيجة",
        title: competition.name || competition.title || "بطولة",
        body: homeName + " ضد " + awayName + scoreText,
        timeSource: match.completedAt || match.updatedAt || match.date || competition.updatedAt || competition.createdAt,
        competitionId: competition.id,
      });
    });

  (activeCompetitions || []).slice(0, 3).forEach((competition) => {
    addEvent({
      tag: "بطولة",
      title: competition.name || competition.title || "بطولة نشطة",
      body: competitionTypeArabic(competition.competitionType || competition.type) + " · " + (competition.statusLabel || competition.status || "نشطة"),
      timeSource: competition.updatedAt || competition.createdAt || competition.startDate,
      competitionId: competition.id,
    });
  });

  (activeOfferRows || []).slice(0, 3).forEach((offer) => {
    addEvent({
      tag: isFifaAdmin ? "عرض" : "عرضك",
      title: offer.targetPlayerName || offer.playerName || "عرض انتقال",
      body: formatMoney(offer.amount || 0) + " · " + effectiveTransferStatusLabel(offer),
      timeSource: offer.updatedAt || offer.createdAt || offer.date,
    });
  });

  if (marketOpen) {
    addEvent({
      tag: "السوق",
      title: openWindow?.title || openWindow?.name || "سوق الانتقالات مفتوح",
      body: openWindow?.endDate ? "مستمر حتى " + openWindow.endDate : "توجد فترة انتقالات مفتوحة حاليًا.",
      timeSource: openWindow?.updatedAt || openWindow?.createdAt || openWindow?.startDate,
    });
  }

  return events
    .sort((a, b) => (b.timeValue || 0) - (a.timeValue || 0))
    .slice(0, 10);
}

export function seasonCenterEventDateLabel(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value?.seconds) return new Date(value.seconds * 1000).toISOString().slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return "";
}

export function isSeasonCenterActiveOffer(offer = {}) {
  const status = clean(offer.status || "pending");
  return !["completed", "rejected", "cancelled", "canceled", "expired", "executionfailed", "failed"].includes(status);
}

export function seasonCenterPhaseLabel(phase = "") {
  const key = clean(phase);
  const labels = {
    group: "دور المجموعات",
    final: "النهائي",
    semifinal: "نصف النهائي",
    third_place: "تحديد الثالث",
    qualifier: "ملحق",
    preliminary: "تمهيدي",
  };
  return labels[key] || phase || "";
}
