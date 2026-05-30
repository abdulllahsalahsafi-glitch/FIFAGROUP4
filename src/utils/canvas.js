// ═══════════════════════════════════════════════════════════
// src/utils/canvas.js
// دوال التصدير والرسم على Canvas المستخرجة من App.jsx
// (السطر 8574 – 10260 + دوال مساعدة للـ canvas)
// ═══════════════════════════════════════════════════════════

import { clean, cleanId, same, toNumber, formatMoney, formatTransferDate } from "./helpers.js";
import { toLatinDigits, formatLatinNumber, normalizeImageUrl } from "./ui.js";
import { competitionTypeArabic, competitionTypeKey, isLeagueGroupsCompetition, computeLeagueStandings, filterCompetitionParticipantsForCalculation, filterCompetitionMatchesForCalculation, worldCupGroupRows, computeWorldCupQualifiedIds, championsLeagueGroupRows, computeChampionsLeagueQualifiedIds, getKnockoutChampion, roundLabelForBracket, sortedCompetitionMatchesForSchedule, competitionLogoUrl, isKnockoutCompetitionType, scheduleStageTitleForMatch, competitionTypeLabel, competitionStatusLabel, getApprovedCompetitionChampionName } from "./competition.js";
import { groupByTrophy, isFifaSystemMember, isActiveSeasonMember, getTrophyDisplayName, getPlayerStableId } from "./data.js";
import { getMemberFinanceRows, computeMemberBalance, getFinanceDirection, getFinanceSignedAmount, getFinanceDisplayTitle, getFinanceRecordDate, getFinanceRecordNote, financeTypeClass, transferRowTimeValue, getRosterPlayerKindFromContract, getPlayerRosterKindLabel } from "./admin.js";

// ── دوال مساعدة داخلية ───────────────────────────────────

function getMemberName(membersOrParticipants, memberId) {
  const id = cleanId(memberId);
  if (!id) return "";
  const found = (membersOrParticipants || []).find(
    (item) => same(item.memberId || item.id, id)
  );
  return found?.memberName || found?.name || id;
}

// ── الدوال المُصدَّرة ─────────────────────────────────────

export function wrapCanvasText(ctx, text, maxWidth) {
  const value = String(text || "-").replace(/\s+/g, " ").trim() || "-";
  const words = value.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? current + " " + word : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
}

export function exportDateTimeLabel() {
  return new Date().toLocaleString("ar", { hour12: false });
}

// toLatinDigits and formatLatinNumber live in ui.js — imported here for canvas use only

export function isCompetitionCompleted(competition = {}) {
  return clean(competition.status || "") === "completed";
}

export function competitionKnockoutColumnsForExport(competition = {}, matches = null) {
  // دوال مساعدة داخلية مطلوبة
  const competitionTypeKey = (type = "") => clean(type || "league") || "league";
  const isLeagueGroupsCompetition = (comp = {}) => {
    if (competitionTypeKey(comp.type || "league") !== "league") return false;
    const markers = [comp.bracketMode, comp.roundsMode, comp.leagueFormat, comp.leagueGroupMode].map((item) => clean(item || ""));
    return markers.some((value) => ["league_two_groups_knockout", "two_groups", "league_groups", "groups_knockout"].includes(value));
  };
  const groupLeagueMatchesByRound = (matchList = []) => {
    const map = new Map();
    (matchList || []).forEach((match) => {
      if (["excluded", "cancelled"].includes(clean(match.resultStatus || match.status || "")) || clean(match.absenceAction || "") === "excluded") return;
      const round = toNumber(match.round || 1) || 1;
      if (!map.has(round)) map.set(round, []);
      map.get(round).push(match);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, rows]) => ({ round, matches: rows }));
  };
  const roundLabelForBracket = (round, roundsCount) => {
    if (round === roundsCount) return "النهائي";
    if (round === roundsCount - 1) return "نصف النهائي";
    if (round === roundsCount - 2) return "ربع النهائي";
    return `الدور ${round}`;
  };

  const typeKey = competitionTypeKey(competition.type || "");
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const rows = Array.isArray(matches) ? matches : (competition.matches || []);
  const knockoutMatches = rows.filter((match) => {
    const phase = clean(match.phase || "");
    if (!phase) return true;
    if (phase === "bye") return ["cup", "league_qualifier"].includes(typeKey);
    return !["group", "qualification", "qualifier", "playoff"].includes(phase);
  });
  const byPhase = (phase) => knockoutMatches.filter((match) => clean(match.phase || "") === phase);
  if (["world_cup", "champions_league"].includes(typeKey) || leagueGroupsMode) {
    return [
      { key: "semifinal", title: "نصف النهائي", matches: byPhase("semifinal") },
      { key: "third_place", title: "تحديد الثالث والرابع", matches: byPhase("third_place") },
      { key: "final", title: typeKey === "league" || leagueGroupsMode ? "نهائي الدوري" : "النهائي", matches: byPhase("final") },
    ].filter((column) => column.matches.length);
  }
  const grouped = groupLeagueMatchesByRound(knockoutMatches.length ? knockoutMatches : rows);
  const roundsCount = Math.max(1, grouped.length);
  return grouped.map((group, index) => ({ ...group, key: "round_" + group.round, title: roundLabelForBracket(index + 1, roundsCount) }));
}

export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function safeFileName(value) {
  return String(value || "fifa-group").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-").slice(0, 90);
}

export function triggerCanvasDownload(canvas, filename = "FIFA-GROUP.png", errorMessage = "تعذر حفظ الصورة بسبب قيود تحميل الصور الخارجية.") {
  try {
    if (!canvas) throw new Error("Canvas is missing");
    const cleanName = safeFileName(String(filename || "FIFA-GROUP.png").replace(/\.png$/i, "")) + ".png";
    const clickLink = (href, shouldRevoke = false) => {
      const link = document.createElement("a");
      link.download = cleanName;
      link.href = href;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        try { document.body.removeChild(link); } catch {}
        if (shouldRevoke) URL.revokeObjectURL(href);
      }, 1200);
    };
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (!blob) {
          clickLink(canvas.toDataURL("image/png"));
          return;
        }
        clickLink(URL.createObjectURL(blob), true);
      }, "image/png");
      return;
    }
    clickLink(canvas.toDataURL("image/png"));
  } catch (err) {
    console.error("Canvas download failed:", err);
    alert(errorMessage);
  }
}

export function normalizeCompetitionRewards(rewards = {}) {
  return {
    first: Math.max(0, toNumber(rewards.first)),
    second: Math.max(0, toNumber(rewards.second)),
    third: Math.max(0, toNumber(rewards.third)),
    fourth: Math.max(0, toNumber(rewards.fourth)),
  };
}

export function rewardRankLabel(rank) {
  const labels = { 1: "البطل", 2: "الوصيف", 3: "الثالث", 4: "الرابع" };
  return labels[rank] || `المركز ${rank}`;
}

export function drawStatBox(ctx, x, y, w, h, label, value) {
  roundRect(ctx, x, y, w, h, 30, "rgba(4,12,28,.90)", "rgba(0,230,118,.28)");
  ctx.fillStyle = "#9BA0C0";
  ctx.font = "800 24px Tahoma, Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 42);
  ctx.fillStyle = "#00E676";
  ctx.font = "900 34px Tahoma, Arial";
  ctx.fillText(String(value), x + w / 2, y + 92);
}

export function buildHistoricalMemberExportStats({ member = {}, members = [], allTournaments = [], statsMap = {} } = {}) {
  const memberId = cleanId(member.id || member.memberId || member.memberid || "");
  const historicalRows = (allTournaments || [])
    .filter((row) => cleanId(row.winnerId || row.winnerid || row.memberId || "") && !same(row.winnerId || row.winnerid || row.memberId, "FIFA"));
  const totals = new Map();
  historicalRows.forEach((row) => {
    const id = cleanId(row.winnerId || row.winnerid || row.memberId || "");
    if (!id) return;
    totals.set(id, (totals.get(id) || 0) + 1);
  });
  const ordered = Array.from(totals.entries()).sort((a, b) => (b[1] - a[1]) || String(getMemberName(members, a[0])).localeCompare(String(getMemberName(members, b[0])), "ar"));
  const rankIndex = ordered.findIndex(([id]) => same(id, memberId));
  const stats = statsMap[memberId] || {};
  return {
    memberId,
    rank: rankIndex >= 0 ? rankIndex + 1 : Math.max(1, ordered.length + 1),
    trophies: totals.get(memberId) || 0,
    finals: toNumber(stats.finalsPlayed || 0),
    wins: toNumber(stats.finalsWon || 0),
    losses: toNumber(stats.finalsLost || 0),
    goalsFor: toNumber(stats.finalGoalsFor || 0),
    goalsAgainst: toNumber(stats.finalGoalsAgainst || 0),
    relegations: toNumber(stats.relegations || 0),
  };
}

export function exportBrandLogoUrl(config = {}) {
  return normalizeImageUrl(config.exportLogo || config.groupLogo || config.appIcon || config.headerImage || "");
}

export function studioTimeValue(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function studioMatchScoreText(match = {}) {
  const hg = match.homeGoals ?? match.homeScore ?? match.score1 ?? "-";
  const ag = match.awayGoals ?? match.awayScore ?? match.score2 ?? "-";
  return String(hg) + " - " + String(ag);
}

export function studioEventDateLabel(...values) {
  for (const value of values) {
    if (!value) continue;
    if (typeof value?.toDate === "function") return value.toDate().toISOString().slice(0, 10);
    if (value?.seconds) return new Date(value.seconds * 1000).toISOString().slice(0, 10);
    if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
    const raw = String(value || "").trim();
    if (!raw) continue;
    const direct = raw.match(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/);
    if (direct) return toLatinDigits(direct[0].replace(/\//g, "-"));
    const parsed = new Date(raw).getTime();
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString().slice(0, 10);
    return toLatinDigits(raw);
  }
  return "التاريخ غير محدد";
}

// ─── Moved from App.jsx ──────────────────────────────────

export function escapeSvgText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function transferTypeDisplayLabel(value = "") {
  const key = clean(value);
  if (key === "loan") return "إعارة";
  if (key === "buy" || key === "owned") return "شراء نهائي";
  if (key === "release") return "إنهاء تعاقد";
  return value || "انتقال";
}

export function downloadFifaStudioCardImage({ config = {}, filename = "FIFA-STUDIO", icon = "🎬", title = "استوديو FIFA GROUP", main = "FIFA GROUP", subtitle = "", rows = [] } = {}) {
  const width = 1080;
  const height = 1080;
  const pad = 56;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#02030A");
  bg.addColorStop(.48, "#06122B");
  bg.addColorStop(1, "#020712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width - 120, 80, 0, width - 120, 80, 420);
  glow.addColorStop(0, "rgba(0,230,118,.22)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const glow2 = ctx.createRadialGradient(120, height - 80, 0, 120, height - 80, 420);
  glow2.addColorStop(0, "rgba(0,212,255,.14)");
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, pad, pad, width - pad * 2, 168, 28); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.38)"; ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, width - pad * 2, 168, 28); ctx.stroke();

  ctx.textAlign = "right";
  ctx.fillStyle = "#00E676";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText("FIFA GROUP STUDIO", width - pad - 34, pad + 48);
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 56px Tahoma, Arial";
  ctx.fillText(title, width - pad - 34, pad + 116);

  ctx.textAlign = "left";
  ctx.font = "900 72px Tahoma, Arial";
  ctx.fillText(icon, pad + 36, pad + 112);

  ctx.fillStyle = "rgba(0,230,118,.10)";
  roundRect(ctx, pad, 258, width - pad * 2, 250, 34); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.22)"; ctx.lineWidth = 2;
  roundRect(ctx, pad, 258, width - pad * 2, 250, 34); ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 68px Tahoma, Arial";
  wrapCanvasText(ctx, main, width - pad * 2 - 80).slice(0, 2).forEach((line, index) => ctx.fillText(line, width / 2, 344 + index * 74));
  ctx.fillStyle = "#9BA0C0";
  ctx.font = "800 28px Tahoma, Arial";
  wrapCanvasText(ctx, subtitle, width - pad * 2 - 120).slice(0, 2).forEach((line, index) => ctx.fillText(line, width / 2, 456 + index * 34));

  let y = 552;
  rows.slice(0, 6).forEach(([label, value]) => {
    ctx.fillStyle = "rgba(2,6,23,.72)";
    roundRect(ctx, pad, y, width - pad * 2, 74, 20); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1;
    roundRect(ctx, pad, y, width - pad * 2, 74, 20); ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 24px Tahoma, Arial";
    ctx.fillText(String(label || ""), width - pad - 28, y + 45);
    ctx.textAlign = "left";
    ctx.fillStyle = "#EDF0FF";
    ctx.font = "900 27px Tahoma, Arial";
    ctx.fillText(String(value || "-"), pad + 28, y + 45);
    y += 88;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 24px Tahoma, Arial";
  ctx.fillText(toLatinDigits(exportDateTimeLabel()), width / 2, height - 48);

  const link = document.createElement("a");
  link.download = safeFileName(filename) + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function downloadFifaStudioResultCardImage({
  config = {},
  filename = "FIFA-STUDIO-RESULT",
  competitionName = "بطولة",
  stageLabel = "مباراة",
  homeName = "الطرف الأول",
  awayName = "الطرف الثاني",
  homeGoals = 0,
  awayGoals = 0,
  score = "0 - 0",
  winnerSide = "draw",
  game = "FIFA 2025",
  eventDate = "التاريخ غير محدد",
} = {}) {
  const width = 1080;
  const height = 1080;
  const pad = 56;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#02030A");
  bg.addColorStop(.48, "#06122B");
  bg.addColorStop(1, "#020712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width - 120, 80, 0, width - 120, 80, 440);
  glow.addColorStop(0, "rgba(0,230,118,.22)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const glow2 = ctx.createRadialGradient(120, height - 80, 0, 120, height - 80, 440);
  glow2.addColorStop(0, "rgba(0,212,255,.14)");
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, pad, pad, width - pad * 2, 168, 28); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.38)"; ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, width - pad * 2, 168, 28); ctx.stroke();
  ctx.textAlign = "right";
  ctx.fillStyle = "#00E676";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText("FIFA GROUP STUDIO", width - pad - 34, pad + 48);
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 56px Tahoma, Arial";
  ctx.fillText("نتيجة مباراة", width - pad - 34, pad + 116);
  ctx.textAlign = "left";
  ctx.font = "900 68px Tahoma, Arial";
  ctx.fillText("⚔️", pad + 36, pad + 112);

  const cardY = 260;
  const cardH = 310;
  const sideW = 310;
  const centerW = width - pad * 2 - sideW * 2 - 28;
  const rightX = width - pad - sideW;
  const centerX = pad + sideW + 14;
  const leftX = pad;
  function sideCard(x, name, side) {
    const won = winnerSide === side;
    ctx.fillStyle = won ? "rgba(0,230,118,.14)" : "rgba(2,6,23,.58)";
    roundRect(ctx, x, cardY, sideW, cardH, 34); ctx.fill();
    ctx.strokeStyle = won ? "rgba(0,230,118,.52)" : "rgba(255,255,255,.10)";
    ctx.lineWidth = won ? 2.4 : 1.2;
    roundRect(ctx, x, cardY, sideW, cardH, 34); ctx.stroke();
    if (won) {
      ctx.fillStyle = "rgba(0,230,118,.18)";
      roundRect(ctx, x + sideW - 112, cardY + 22, 86, 34, 999); ctx.fill();
      ctx.fillStyle = "#00E676";
      ctx.font = "900 17px Tahoma, Arial";
      ctx.textAlign = "center";
      ctx.fillText("الفائز", x + sideW - 69, cardY + 45);
    }
    ctx.fillStyle = "#EDF0FF";
    ctx.font = "900 44px Tahoma, Arial";
    ctx.textAlign = "center";
    const nameLines = wrapCanvasText(ctx, name, sideW - 46).slice(0, 2);
    const startY = cardY + (won ? 142 : 124);
    nameLines.forEach((line, index) => ctx.fillText(line, x + sideW / 2, startY + index * 50));
    ctx.fillStyle = won ? "#00E676" : "#9BA0C0";
    ctx.font = "800 22px Tahoma, Arial";
    ctx.fillText(won ? "فاز بالمباراة" : "طرف المباراة", x + sideW / 2, cardY + 248);
  }
  sideCard(rightX, homeName, "home");
  sideCard(leftX, awayName, "away");

  ctx.fillStyle = "rgba(0,230,118,.10)";
  roundRect(ctx, centerX, cardY + 52, centerW, cardH - 104, 34); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.24)"; ctx.lineWidth = 2;
  roundRect(ctx, centerX, cardY + 52, centerW, cardH - 104, 34); ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 72px Tahoma, Arial";
  ctx.fillText(score, centerX + centerW / 2, cardY + 158);
  ctx.fillStyle = "#9BA0C0";
  ctx.font = "800 22px Tahoma, Arial";
  ctx.fillText(winnerSide === "draw" ? "تعادل" : "النتيجة النهائية", centerX + centerW / 2, cardY + 208);

  const rows = [
    ["🏟️ البطولة", competitionName],
    ["📌 المرحلة", stageLabel],
    ["🎮 اللعبة", game],
    ["📅 تاريخ النتيجة", eventDate],
  ];
  let y = 630;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = "rgba(2,6,23,.72)";
    roundRect(ctx, pad, y, width - pad * 2, 74, 20); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1;
    roundRect(ctx, pad, y, width - pad * 2, 74, 20); ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 24px Tahoma, Arial";
    ctx.fillText(String(label || ""), width - pad - 28, y + 45);
    ctx.textAlign = "left";
    ctx.fillStyle = "#EDF0FF";
    ctx.font = "900 27px Tahoma, Arial";
    ctx.fillText(String(value || "-"), pad + 28, y + 45);
    y += 88;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 24px Tahoma, Arial";
  ctx.fillText(toLatinDigits(exportDateTimeLabel()), width / 2, height - 48);

  const link = document.createElement("a");
  link.download = safeFileName(filename) + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function downloadStudioChampionImage({ item, members = [], config = {}, trophyMap = {} } = {}) {
  if (!item) return alert("لا توجد بطولة مكتملة للتصدير.");
  const competition = item.competition || {};
  const trophyName = item.title || competition.name || competition.title || "بطولة";
  const championName = item.championName || "البطل";
  const typeLabel = competitionTypeArabic(competition.type || competition.competitionType || item.row?.type || item.row?.trophyId || "بطولة");
  const eventDate = studioEventDateLabel(item.row?.date, item.row?.endDate, competition.completedDate, competition.completedAt, competition.endDate, competition.date, competition.updatedAt);
  const rows = [
    ["🏆 البطولة", trophyName],
    ["👑 البطل", championName],
    ["📌 النوع", typeLabel],
    ["📅 تاريخ التتويج", eventDate],
  ];
  return downloadFifaStudioCardImage({
    config,
    filename: "FIFA-STUDIO-CHAMPION-" + trophyName,
    icon: "🏆",
    title: "بطل البطولة",
    main: championName,
    subtitle: trophyName,
    rows,
  });
}

export function downloadStudioResultImage({ item, members = [], config = {}, trophyMap = {} } = {}) {
  if (!item?.match) return alert("لا توجد نتيجة مباراة للتصدير.");
  const { competition, match } = item;
  const homeName = match.homeName || getMemberName(members, match.homeMemberId) || "الطرف الأول";
  const awayName = match.awayName || getMemberName(members, match.awayMemberId) || "الطرف الثاني";
  const homeGoals = toNumber(match.homeGoals);
  const awayGoals = toNumber(match.awayGoals);
  const score = studioMatchScoreText(match);
  const winnerSide = homeGoals > awayGoals ? "home" : awayGoals > homeGoals ? "away" : "draw";
  return downloadFifaStudioResultCardImage({
    config,
    filename: "FIFA-STUDIO-RESULT-" + homeName + "-" + awayName,
    competitionName: competition.name || competition.title || "بطولة",
    stageLabel: match.label || match.round || "مباراة",
    homeName,
    awayName,
    homeGoals,
    awayGoals,
    score,
    winnerSide,
    game: match.gameTitle || match.game || match.platform || "FIFA 2025",
    eventDate: studioEventDateLabel(match.completedAt, match.date, match.updatedAt, competition.lastResultAt, competition.updatedAt, competition.date),
  });
}

export function downloadStudioDealImage({ item, members = [], config = {} } = {}) {
  if (!item?.row) return alert("لا توجد صفقة مكتملة للتصدير.");
  const row = item.row;
  const fromName = row.fromMemberName || getMemberName(members, row.fromMemberId) || "طرف";
  const toName = row.toMemberName || getMemberName(members, row.toMemberId) || "طرف";
  const playerName = row.playerName || row.targetPlayerName || "لاعب";
  const dealDate = studioEventDateLabel(row.completedAt, row.date, row.createdAt, row.updatedAt);
  const rows = [
    ["⭐ اللاعب", playerName],
    ["🔁 الصفقة", fromName + " ← " + toName],
    ["💰 القيمة", formatMoney(row.amount || row.loanAmount || 0)],
    ["📌 العقد", transferTypeDisplayLabel(row.type || row.contractType || row.typeLabel || "transfer")],
    ["📅 تاريخ الصفقة", dealDate],
  ];
  return downloadFifaStudioCardImage({
    config,
    filename: "FIFA-STUDIO-DEAL-" + playerName,
    icon: "🔁",
    title: "صفقة رسمية",
    main: playerName,
    subtitle: fromName + " ← " + toName,
    rows,
  });
}

export function downloadStudioMemberSummaryImage({ item, allTournaments = [], config = {} } = {}) {
  if (!item?.member) return alert("اختر عضوًا للتصدير.");
  const member = item.member;
  const trophyCount = (allTournaments || []).filter((row) => same(row.winnerId || row.winnerid, member.id)).length;
  const rows = [
    ["👤 العضو", member.name || "عضو"],
    ["🏟️ الفريق", member.team || member.club || "-"],
    ["🌍 المنتخب", member.nationalteam || member.nationalTeam || "-"],
    ["🏆 البطولات", formatLatinNumber(trophyCount)],
  ];
  return downloadFifaStudioCardImage({
    config,
    filename: "FIFA-STUDIO-MEMBER-" + (member.name || "member"),
    icon: "👤",
    title: "ملخص العضو",
    main: member.name || "عضو FIFA GROUP",
    subtitle: member.team || member.nationalteam || "FIFA GROUP",
    rows,
  });
}

// ─── Local helpers for downloadTransferContractImage ────────────────────────

const FALLBACK_PLAYER_IMAGE = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

function loanDurationLabel(months) {
  const value = toNumber(months);
  if (value === 2) return "شهرين";
  if (value === 4) return "4 شهور";
  if (value === 6) return "6 شهور";
  return value ? value + " شهور" : "-";
}

function isLoanTransferRow(row = {}) {
  const value = clean([row?.type, row?.typeLabel, row?.contractType].join(" "));
  return value.includes("loan") || value.includes("إعارة") || value.includes("اعارة");
}

function transferStatusLabel(status) {
  const value = clean(status || "");
  if (value === "completed") return "مكتملة";
  if (value === "approvedpendingwindow") return "بانتظار فتح السوق";
  if (value === "active") return "نشطة";
  if (value === "terminated") return "منتهية";
  if (value === "cancelled") return "ملغاة";
  return status || "مسجلة";
}

function effectiveTransferStatusLabel(row = {}) {
  if (clean(row?.status) === "approvedpendingwindow" && (row?.marketWasOpenAtApproval || row?.loanStartDate || row?.completedAt)) return "مكتملة";
  return transferStatusLabel(row?.status);
}

function formatContractIssuedAt(row = {}) {
  const raw = row?.approvedAt || row?.createdAt || row?.updatedAt || row?.date || null;
  let date = null;
  if (raw?.toDate) date = raw.toDate();
  else if (raw?.seconds) date = new Date(Number(raw.seconds) * 1000);
  else if (typeof raw === "string" && raw.length > 10) date = new Date(raw);
  if (!date || Number.isNaN(date.getTime())) date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTransferContractParties(row = {}) {
  const loan = isLoanTransferRow(row);
  const seller = row?.fromMemberName || row?.from || row?.previousMemberName || "-";
  const buyer = row?.toMemberName || row?.to || row?.currentMemberName || "-";
  const realOwner = row?.originalOwnerMemberName || row?.ownerMemberName || row?.realOwnerMemberName || seller || "-";
  return {
    from: loan ? realOwner : seller,
    to: buyer,
    fromLabel: loan ? "المالك الحقيقي" : "من",
    toLabel: loan ? "المستعير" : "إلى",
    signerFromLabel: loan ? "توقيع المالك الحقيقي" : "توقيع الطرف الأول",
    signerToLabel: loan ? "توقيع المستلم" : "توقيع الطرف الثاني",
  };
}

function normalizeExchangeContractType(value = "") {
  const kind = clean(value || "owned");
  return kind === "loan" ? "loan" : "owned";
}

function exchangeContractLabel(item = {}) {
  const kind = normalizeExchangeContractType(item.exchangeContractType || item.swapContractType || item.contractMode || item.contractType);
  if (kind === "loan") return "إعارة " + loanDurationLabel(item.exchangeLoanDurationMonths || item.loanDurationMonths || 2);
  return "بيع كامل";
}

export function downloadTransferContractImage(row = {}, player = {}, logoUrl = "") {
  const width = 1200;
  const loanRow = isLoanTransferRow(row);
  const offeredPlayers = Array.isArray(row?.offeredPlayers) ? row.offeredPlayers : [];
  const hasSwap = offeredPlayers.length > 0;
  const height = hasSwap ? (loanRow ? 1080 : 920) : (loanRow ? 980 : 760);
  const playerName = player?.name || row?.playerName || row?.player || "لاعب";
  const playerRating = player?.rating || row?.playerRating || "-";
  const type = row?.typeLabel || (loanRow ? "عقد إعارة" : clean(row?.type) === "buy" ? "عقد شراء" : row?.type || "صفقة");
  const period = row?.period || row?.periodName || "سوق الانتقالات";
  const parties = getTransferContractParties(row);
  const from = parties.from || "-";
  const to = parties.to || "-";
  const amount = formatMoney(row?.amount || row?.rawAmount || row?.amountNumber || 0);
  const dealDate = row?.date || formatTransferDate(row?.createdAt);
  const issuedAt = formatContractIssuedAt(row);
  const status = effectiveTransferStatusLabel(row);
  const loanDuration = loanRow ? loanDurationLabel(row?.loanDurationMonths) : "";
  const loanStartDate = row?.loanStartDate || dealDate;
  const imageUrl = player?.image || row?.playerImage || FALLBACK_PLAYER_IMAGE;
  const brandLogoUrl = logoUrl || "";
  const safeName = String(playerName).replace(/[^ء-يa-zA-Z0-9_-]+/g, "-") || "contract";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function roundRectLocal(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fillText(text, x, y, size = 32, color = "#EDF0FF", align = "center", weight = "900", maxWidth = undefined) {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.direction = "rtl";
    ctx.font = `${weight} ${size}px 'Tajawal', Arial, sans-serif`;
    ctx.fillText(String(text || "-"), x, y, maxWidth);
  }

  function drawBox(label, value, x, y, w, h, valueSize = 26) {
    ctx.fillStyle = "rgba(255,255,255,.075)";
    roundRectLocal(x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.15)"; ctx.lineWidth = 1.2; ctx.stroke();
    fillText(label, x + w - 18, y + 28, 20, "#00E676", "right", "900", w - 34);
    fillText(value, x + w / 2, y + h - 20, valueSize, "#EDF0FF", "center", "900", w - 28);
  }

  function drawBase(playerImage = null, logoImage = null, offeredImages = []) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#02030A");
    bg.addColorStop(.55, "#061225");
    bg.addColorStop(1, "#02030A");
    ctx.fillStyle = bg;
    roundRectLocal(0, 0, width, height, 48); ctx.fill();

    ctx.fillStyle = "rgba(0,230,118,.10)";
    ctx.beginPath(); ctx.arc(150, 90, 180, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,212,255,.07)";
    ctx.beginPath(); ctx.arc(980, 80, 220, 0, Math.PI * 2); ctx.fill();

    if (logoImage) {
      ctx.save();
      roundRectLocal(78, 62, 92, 92, 24); ctx.clip();
      ctx.drawImage(logoImage, 78, 62, 92, 92);
      ctx.restore();
    } else {
      fillText("FG", 124, 122, 42, "#00E676", "center", "1000");
    }

    fillText("FIFA GROUP", 600, 86, 26, "#00E676", "center", "900");
    fillText("العقد الخاص بالصفقة", 600, 150, 58, "#EDF0FF", "center", "1000");
    fillText(`${period} • ${type}`, 600, 198, 26, "#9BA0C0", "center", "800");
    fillText(`تاريخ الإصدار: ${issuedAt}`, 600, 228, 23, "#BFFFE0", "center", "900");

    ctx.fillStyle = "rgba(4,12,28,.88)";
    roundRectLocal(70, 255, 1060, 196, 38); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.24)"; ctx.lineWidth = 2; ctx.stroke();

    if (playerImage) {
      ctx.save(); roundRectLocal(875, 290, 125, 125, 24); ctx.clip(); ctx.drawImage(playerImage, 875, 290, 125, 125); ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,.08)"; roundRectLocal(875, 290, 125, 125, 24); ctx.fill();
      fillText("FG", 937, 363, 42, "#00E676", "center", "1000");
    }

    const accent = ctx.createLinearGradient(150, 295, 260, 405);
    accent.addColorStop(0, "#00E676"); accent.addColorStop(1, "#00D4FF");
    ctx.fillStyle = accent; roundRectLocal(150, 295, 110, 110, 32); ctx.fill();
    fillText(playerRating, 205, 363, 46, "#020617", "center", "1000");
    fillText(playerName, 820, 338, 46, "#ffffff", "right", "1000", 520);
    fillText(status, 820, 386, 27, "#a8b3c7", "right", "800", 500);
    fillText(`تاريخ الإبرام: ${dealDate}`, 820, 421, 23, "#bae6fd", "right", "900", 500);

    ctx.fillStyle = "rgba(0,230,118,.08)";
    roundRectLocal(70, 480, 1060, 116, 28); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.24)"; ctx.stroke();
    fillText(parties.fromLabel || "من", 970, 525, 24, "#00E676", "center", "900");
    fillText(from, 970, 570, 34, "#EDF0FF", "center", "900", 300);
    fillText("←", 600, 556, 44, "#00E676", "center", "1000");
    fillText(parties.toLabel || "إلى", 230, 525, 24, "#00E676", "center", "900");
    fillText(to, 230, 570, 34, "#EDF0FF", "center", "900", 300);

    const metaY = 625;
    const boxW = loanRow ? 250 : 310;
    drawBox("قيمة الصفقة", amount, 820, metaY, 310, 78, 28);
    drawBox("الحالة", status, 70, metaY, 310, 78, 26);
    if (loanRow) {
      drawBox("مدة الإعارة", loanDuration, 548, metaY, 250, 78, 28);
      drawBox("بداية الإعارة", loanStartDate, 390, metaY, 140, 78, 21);
    } else {
      drawBox("تاريخ الإبرام", dealDate, 445, metaY, 310, 78, 26);
    }

    if (hasSwap) {
      const swapY = metaY + 108;
      const swapBoxH = Math.min(190, Math.max(118, 70 + Math.ceil(Math.min(offeredPlayers.length, 6) / 2) * 54));
      ctx.fillStyle = "rgba(255,255,255,.055)";
      roundRectLocal(70, swapY, 1060, swapBoxH, 22); ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.12)"; ctx.lineWidth = 1.2; ctx.stroke();
      fillText("بنود التبادل ضمن الصفقة", 1060, swapY + 30, 21, "#00E676", "right", "900");
      offeredPlayers.slice(0, 6).forEach((item, index) => {
        const col = index % 2;
        const rowIndex = Math.floor(index / 2);
        const x = col === 0 ? 865 : 365;
        const y = swapY + 48 + rowIndex * 54;
        const img = offeredImages[index];
        if (img) { ctx.save(); roundRectLocal(x, y, 42, 42, 12); ctx.clip(); ctx.drawImage(img, x, y, 42, 42); ctx.restore(); }
        else { ctx.fillStyle = "rgba(255,255,255,.08)"; roundRectLocal(x, y, 42, 42, 12); ctx.fill(); }
        fillText(item.playerName || item.name || "لاعب", x - 10, y + 19, 20, "#EDF0FF", "right", "900", 360);
        fillText(exchangeContractLabel(item), x - 10, y + 43, 17, "#bae6fd", "right", "800", 360);
      });
      if (offeredPlayers.length > 6) {
        fillText(`+ ${offeredPlayers.length - 6} بنود إضافية`, 600, swapY + swapBoxH - 16, 17, "#6270A0", "center", "800");
      }
      fillText("FIFA GROUP • وثيقة صفقة رقمية", 600, height - 34, 18, "#64748b", "center", "800");
    }

    const a = document.createElement("a");
    a.download = `FIFA-GROUP-${safeName}.png`;
    try { a.href = canvas.toDataURL("image/png"); }
    catch (err) {
      if (playerImage || logoImage) { drawBase(null, null, []); return; }
      console.error("Contract PNG export failed:", err); return;
    }
    document.body.appendChild(a); a.click(); a.remove();
  }

  function loadCanvasImageLocal(url) {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  Promise.all([
    loadCanvasImageLocal(imageUrl),
    loadCanvasImageLocal(brandLogoUrl),
    ...offeredPlayers.slice(0, 4).map((item) => loadCanvasImageLocal(item.playerImage || item.image || "")),
  ]).then(([mainImage, logoImage, ...swapImages]) => drawBase(mainImage, logoImage, swapImages));
}

// ═══════════════════════════════════════════════════════════
// دوال مُنقولة من App.jsx
// ═══════════════════════════════════════════════════════════

export async function loadCanvasImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = normalizeImageUrl(src) || src;
  });
}

export async function downloadMemberProfileImage({
  member = {},
  players = [],
  balance = 0,
  trophiesCount = 0,
  logoUrl = "",
  contracts = [],
  memberId = "",
  config = {},
  trophyGroups = [],
} = {}) {
  const exportConfig = {
    ...(config || {}),
    exportLogo: config?.exportLogo || logoUrl || config?.groupLogo || config?.appIcon || "",
    mainTitle: config?.mainTitle || "FIFA GROUP",
  };
  return downloadMyProfileSummaryImage({
    config: exportConfig,
    member,
    players,
    balance,
    trophiesCount,
    trophyGroups,
    contracts,
    memberId,
    exportLabel: "بطاقة العضو النشط في الموسم",
    fileNamePrefix: "FIFA-GROUP-ACTIVE-MEMBER",
  });
}

export async function downloadActiveSeasonMemberCardImage({
  member = {},
  rankedMembers = [],
  financeRows = [],
  balance = null,
  seasonRank = null,
  seasonTitles = null,
  config = {},
} = {}) {
  const memberId = cleanId(member.id || member.memberId || member.memberid || "");
  if (!memberId) return alert("تعذر تحديد العضو لتحميل بطاقة الموسم.");

  const activeIndex = (rankedMembers || []).findIndex((row) => same(row.id || row.memberId, memberId));
  const activeRow = activeIndex >= 0 ? (rankedMembers || [])[activeIndex] : {};
  const rank = Math.max(1, toNumber(seasonRank || activeRow.rankOrder || (activeIndex >= 0 ? activeIndex + 1 : 1)) || 1);
  const trophies = Math.max(0, toNumber(seasonTitles ?? activeRow.titles ?? activeRow.total ?? member.titles ?? member.total ?? 0) || 0);
  const finance = Array.isArray(financeRows) ? getMemberFinanceRows(financeRows, memberId) : [];
  const memberBalance = balance !== null && balance !== undefined
    ? toNumber(balance)
    : computeMemberBalance(finance, member.balance, memberId);

  const memberName = activeRow.name || member.name || member.memberName || "عضو FIFA GROUP";
  const teamLabel = activeRow.team || member.team || member.club || "FIFA GROUP";
  const nationalLabel = activeRow.nationalteam || activeRow.nationalTeam || member.nationalteam || member.nationalTeam || member.national || "";
  const avatarSrc = activeRow.avatar || member.avatar || member.image || member.photo || "";
  const brandSrc = exportBrandLogoUrl(config);

  const W = 760;
  const H = 1180;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#02030A");
  bg.addColorStop(.52, "#061A25");
  bg.addColorStop(1, "#020817");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W - 120, 120, 0, W - 120, 120, 420);
  glow.addColorStop(0, "rgba(0,230,118,.24)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(110, H - 180, 0, 110, H - 180, 360);
  glow2.addColorStop(0, "rgba(0,212,255,.13)");
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  const cardX = 62;
  const cardY = 58;
  const cardW = W - cardX * 2;
  const cardH = H - 116;
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, "#05251F");
  cardGrad.addColorStop(.55, "#08152E");
  cardGrad.addColorStop(1, "#020817");
  ctx.fillStyle = cardGrad;
  roundRect(ctx, cardX, cardY, cardW, cardH, 42);
  ctx.fill();
  const border = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  border.addColorStop(0, "#00E676");
  border.addColorStop(.52, "#00D4FF");
  border.addColorStop(1, "#00E676");
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardW, cardH, 42);
  ctx.stroke();

  const brandLogo = await loadCanvasImage(brandSrc);
  if (brandLogo) {
    ctx.save();
    roundRect(ctx, cardX + 40, cardY + 36, 74, 74, 20);
    ctx.clip();
    ctx.drawImage(brandLogo, cardX + 40, cardY + 36, 74, 74);
    ctx.restore();
  } else {
    ctx.textAlign = "left";
    ctx.fillStyle = "#00E676";
    ctx.font = "900 36px Tahoma, Arial";
    ctx.fillText("FG", cardX + 42, cardY + 82);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#ECFEFF";
  ctx.font = "900 33px Tahoma, Arial";
  ctx.fillText(config.mainTitle || "FIFA GROUP", cardX + cardW - 38, cardY + 60);
  ctx.fillStyle = "#00E676";
  ctx.font = "900 21px Tahoma, Arial";
  ctx.fillText("بطاقة عضو نشط", cardX + cardW - 38, cardY + 96);

  ctx.fillStyle = "rgba(2,6,23,.52)";
  roundRect(ctx, cardX + cardW - 126, cardY + 124, 82, 44, 15);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.35)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, cardX + cardW - 126, cardY + 124, 82, 44, 15);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#00E676";
  ctx.font = "900 23px Tahoma, Arial";
  ctx.fillText("#" + formatLatinNumber(rank), cardX + cardW - 85, cardY + 154);

  const avatarSize = 222;
  const avatarX = cardX + (cardW - avatarSize) / 2;
  const avatarY = cardY + 184;
  const avatarImg = await loadCanvasImage(avatarSrc);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 9, 0, Math.PI * 2);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  else {
    ctx.fillStyle = "#0F1B35";
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.textAlign = "center";
    ctx.fillStyle = "#00E676";
    ctx.font = "900 110px Tahoma, Arial";
    ctx.fillText(String(memberName).slice(0, 1), avatarX + avatarSize / 2, avatarY + 144);
  }
  ctx.restore();

  ctx.textAlign = "center";
  const nameGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
  nameGrad.addColorStop(0, "#FFFFFF");
  nameGrad.addColorStop(.62, "#DFF7FF");
  nameGrad.addColorStop(1, "#00E676");
  ctx.fillStyle = nameGrad;
  ctx.font = "900 60px Tahoma, Arial";
  ctx.fillText(String(memberName).length > 15 ? String(memberName).slice(0, 14) + "…" : memberName, cardX + cardW / 2, avatarY + avatarSize + 74);
  ctx.fillStyle = "#AAB4CC";
  ctx.font = "900 27px Tahoma, Arial";
  ctx.fillText(teamLabel, cardX + cardW / 2, avatarY + avatarSize + 116);
  if (nationalLabel) {
    ctx.fillStyle = "#7DD3FC";
    ctx.font = "800 22px Tahoma, Arial";
    ctx.fillText(nationalLabel, cardX + cardW / 2, avatarY + avatarSize + 150);
  }

  const statY = avatarY + avatarSize + 204;
  const gap = 14;
  const boxW = (cardW - 96 - gap) / 2;
  const boxH = 118;
  function drawSeasonStat(x, y, label, value, color, w = boxW) {
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, x, y, w, boxH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1.4;
    roundRect(ctx, x, y, w, boxH, 22);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillStyle = color;
    ctx.font = "900 40px Tahoma, Arial";
    ctx.fillText(String(value), x + w / 2, y + 52);
    ctx.direction = "rtl";
    ctx.fillStyle = "#AAB4CC";
    ctx.font = "900 19px Tahoma, Arial";
    ctx.fillText(label, x + w / 2, y + 88);
  }
  drawSeasonStat(cardX + 48, statY, "بطولات الموسم", formatLatinNumber(trophies), "#FACC15");
  drawSeasonStat(cardX + 48 + boxW + gap, statY, "تصنيف الموسم", formatLatinNumber(rank), "#00E676");
  drawSeasonStat(cardX + 48, statY + boxH + gap, "الرصيد", formatMoney(memberBalance), "#00D4FF", cardW - 96);

  ctx.direction = "ltr";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 17px Tahoma, Arial";
  ctx.textAlign = "center";
  ctx.fillText(toLatinDigits(exportDateTimeLabel()), W / 2, H - 30);
  ctx.direction = "rtl";
  triggerCanvasDownload(canvas, `FIFA-GROUP-SEASON-MEMBER-${memberName}.png`, "تعذر حفظ بطاقة عضو الموسم بسبب قيود تحميل الصور الخارجية.");
}

export async function downloadHistoricalMemberCardImage({ member = {}, members = [], allTournaments = [], statsMap = {}, config = {} } = {}) {
  const memberId = cleanId(member.id || member.memberId || member.memberid || "");
  if (!memberId) return alert("تعذر تحديد العضو لتحميل بطاقته التاريخية.");

  const data = buildHistoricalMemberExportStats({ member, members, allTournaments, statsMap });
  const memberName = member.name || member.memberName || "عضو FIFA GROUP";
  const teamLabel = member.team || member.club || member.teamName || "FIFA GROUP";
  const nationalLabel = member.nationalteam || member.nationalTeam || member.national || "";
  const W = 900;
  const H = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#02030A");
  bg.addColorStop(.52, "#111336");
  bg.addColorStop(1, "#020712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const accent = "#A855F7";
  const accent2 = "#00D4FF";
  const glowOne = ctx.createRadialGradient(W - 150, 160, 0, W - 150, 160, 430);
  glowOne.addColorStop(0, "rgba(168,85,247,.28)");
  glowOne.addColorStop(1, "transparent");
  ctx.fillStyle = glowOne;
  ctx.fillRect(0, 0, W, H);
  const glowTwo = ctx.createRadialGradient(120, H - 220, 0, 120, H - 220, 360);
  glowTwo.addColorStop(0, "rgba(0,212,255,.14)");
  glowTwo.addColorStop(1, "transparent");
  ctx.fillStyle = glowTwo;
  ctx.fillRect(0, 0, W, H);

  const cardX = 78;
  const cardY = 82;
  const cardW = W - cardX * 2;
  const cardH = H - 164;
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, "#20103A");
  cardGrad.addColorStop(.48, "#08152E");
  cardGrad.addColorStop(1, "#020817");
  ctx.fillStyle = cardGrad;
  roundRect(ctx, cardX, cardY, cardW, cardH, 46);
  ctx.fill();
  const border = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  border.addColorStop(0, accent);
  border.addColorStop(.52, accent2);
  border.addColorStop(1, accent);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  roundRect(ctx, cardX, cardY, cardW, cardH, 46);
  ctx.stroke();

  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  if (brandLogo) {
    ctx.save();
    roundRect(ctx, cardX + 42, cardY + 34, 74, 74, 20);
    ctx.clip();
    ctx.drawImage(brandLogo, cardX + 42, cardY + 34, 74, 74);
    ctx.restore();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#ECFEFF";
  ctx.font = "900 34px Tahoma, Arial";
  ctx.fillText(config.mainTitle || "FIFA GROUP", cardX + cardW - 44, cardY + 64);
  ctx.fillStyle = accent;
  ctx.font = "900 22px Tahoma, Arial";
  ctx.fillText("بطاقة عضو تاريخي", cardX + cardW - 44, cardY + 100);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(2,6,23,.58)";
  roundRect(ctx, cardX + 42, cardY + 126, 124, 54, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(168,85,247,.40)";
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "900 27px Tahoma, Arial";
  ctx.fillText("#" + formatLatinNumber(data.rank), cardX + 66, cardY + 162);

  const avatarSize = 250;
  const avatarX = cardX + (cardW - avatarSize) / 2;
  const avatarY = cardY + 170;
  const avatarImg = await loadCanvasImage(member.avatar || member.image || member.photo || "");
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 9, 0, Math.PI * 2);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  else {
    ctx.fillStyle = "#0F1B35";
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = accent;
    ctx.font = "900 120px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(memberName).slice(0, 1), avatarX + avatarSize / 2, avatarY + 160);
  }
  ctx.restore();

  ctx.textAlign = "center";
  const nameGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
  nameGrad.addColorStop(0, "#FFFFFF");
  nameGrad.addColorStop(.55, "#F1E9FF");
  nameGrad.addColorStop(1, accent);
  ctx.fillStyle = nameGrad;
  ctx.font = "900 68px Tahoma, Arial";
  const displayName = String(memberName).length > 16 ? String(memberName).slice(0, 15) + "…" : memberName;
  ctx.fillText(displayName, cardX + cardW / 2, avatarY + avatarSize + 86);
  ctx.fillStyle = "#AAB4CC";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText(teamLabel, cardX + cardW / 2, avatarY + avatarSize + 130);
  if (nationalLabel) {
    ctx.font = "800 24px Tahoma, Arial";
    ctx.fillStyle = "#7DD3FC";
    ctx.fillText(nationalLabel, cardX + cardW / 2, avatarY + avatarSize + 166);
  }

  const statStartY = avatarY + avatarSize + 220;
  const statGap = 14;
  const statW = (cardW - 106 - statGap) / 2;
  const statH = 122;
  function drawHistoryStat(col, row, label, value, color = accent) {
    const x = cardX + 48 + col * (statW + statGap);
    const y = statStartY + row * (statH + statGap);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, x, y, statW, statH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillStyle = color;
    ctx.font = "900 44px Tahoma, Arial";
    ctx.fillText(formatLatinNumber(value || 0), x + statW / 2, y + 56);
    ctx.direction = "rtl";
    ctx.fillStyle = "#AAB4CC";
    ctx.font = "900 21px Tahoma, Arial";
    ctx.fillText(label, x + statW / 2, y + 92);
  }
  drawHistoryStat(1, 0, "البطولات", data.trophies, "#FACC15");
  drawHistoryStat(0, 0, "الترتيب التاريخي", data.rank, accent);
  drawHistoryStat(1, 1, "النهائيات", data.finals, accent2);
  drawHistoryStat(0, 1, "الانتصارات", data.wins, "#00E676");
  drawHistoryStat(1, 2, "الأهداف المسجلة", data.goalsFor, "#38BDF8");
  drawHistoryStat(0, 2, "الأهداف المستقبلة", data.goalsAgainst, "#F472B6");

  ctx.direction = "ltr";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 18px Tahoma, Arial";
  ctx.fillText(toLatinDigits(exportDateTimeLabel()), W / 2, H - 34);
  ctx.direction = "rtl";
  triggerCanvasDownload(canvas, `FIFA-GROUP-HISTORICAL-MEMBER-${memberName}.png`, "تعذر حفظ بطاقة العضو التاريخية بسبب قيود تحميل الصور الخارجية.");
}

export async function downloadArchiveByTrophyImage({ allTournaments = [], trophyMap = {}, members = [], config = {} } = {}) {
  const completed = allTournaments.filter(t => t.winnerId && t.winnerId !== "-" && t.winnerId !== "");
  const groups = groupByTrophy(completed, trophyMap).sort((a, b) => b.count - a.count);

  const W = 1080, PAD = 44, COLS = 2, cardW = (W - PAD * 2 - 12) / 2, cardH = 130;
  const headerH = 120;
  const H = PAD + headerH + 16 + Math.ceil(groups.length / COLS) * (cardH + 10) + PAD + 50;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#02071A"); bg.addColorStop(0.5, "#040E25"); bg.addColorStop(1, "#030918");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W - 160, 160, 0, W - 160, 160, 280);
  g1.addColorStop(0, "rgba(0,230,118,.14)"); g1.addColorStop(1, "transparent");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const hX = PAD, hY = PAD, hW = W - PAD * 2;
  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, hX, hY, hW, headerH, 22); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.28)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hX, hY, hW, headerH, 22); ctx.stroke();
  const scanG = ctx.createLinearGradient(hX, 0, hX + hW, 0);
  scanG.addColorStop(0, "transparent"); scanG.addColorStop(0.5, "#00E676"); scanG.addColorStop(1, "transparent");
  ctx.fillStyle = scanG; ctx.fillRect(hX, hY, hW, 2);

  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  if (brandLogo) {
    ctx.save(); roundRect(ctx, hX + 20, hY + 16, 68, 68, 16); ctx.clip();
    ctx.drawImage(brandLogo, hX + 20, hY + 16, 68, 68); ctx.restore();
  }
  const titleG = ctx.createLinearGradient(0, 0, hW, 0);
  titleG.addColorStop(0, "#FFFFFF"); titleG.addColorStop(1, "#00E676");
  ctx.fillStyle = titleG; ctx.font = "900 46px Tahoma, Arial"; ctx.textAlign = "right";
  ctx.fillText("السجل العام — حسب البطولة", hX + hW - 20, hY + 62);
  ctx.fillStyle = "#9BA0C0"; ctx.font = "700 22px Tahoma, Arial";
  ctx.fillText(`${groups.length} بطولة مختلفة  •  ${completed.length} نسخة إجمالاً`, hX + hW - 20, hY + 98);

  const imgs = {};
  await Promise.all(groups.map(async g => {
    if (g.image) { const i = await loadCanvasImage(g.image); if (i) imgs[g.trophyId] = i; }
  }));

  const gridY = hY + headerH + 16;
  groups.forEach((g, idx) => {
    const col = idx % COLS, row = Math.floor(idx / COLS);
    const cx = W - PAD - cardW - col * (cardW + 12), cy = gridY + row * (cardH + 10);
    const isTop = idx === 0;

    ctx.fillStyle = isTop ? "rgba(0,230,118,.13)" : "rgba(4,12,28,.88)";
    roundRect(ctx, cx, cy, cardW, cardH, 20); ctx.fill();
    ctx.strokeStyle = isTop ? "rgba(0,230,118,.36)" : "rgba(0,230,118,.13)"; ctx.lineWidth = isTop ? 1.5 : 1;
    roundRect(ctx, cx, cy, cardW, cardH, 20); ctx.stroke();

    const imgSize = 90, imgX = cx + cardW - 14 - imgSize, imgY = cy + (cardH - imgSize) / 2;
    if (imgs[g.trophyId]) {
      ctx.drawImage(imgs[g.trophyId], imgX, imgY, imgSize, imgSize);
    } else {
      ctx.fillStyle = "rgba(0,230,118,.10)";
      roundRect(ctx, imgX, imgY, imgSize, imgSize, 16); ctx.fill();
      ctx.fillStyle = "#6270A0"; ctx.font = "700 14px Tahoma, Arial"; ctx.textAlign = "center";
      ctx.fillText("🏆", imgX + imgSize / 2, imgY + imgSize / 2 + 5);
    }

    const textRight = imgX - 14;
    ctx.fillStyle = "#EDF0FF"; ctx.font = "900 22px Tahoma, Arial"; ctx.textAlign = "right";
    const name = String(g.name || "-");
    ctx.fillText(name.length > 20 ? name.slice(0, 19) + "…" : name, textRight, cy + 40);

    const countStr = `${g.count} نسخة`;
    ctx.font = "700 16px Tahoma, Arial";
    const bw = ctx.measureText(countStr).width + 28;
    ctx.fillStyle = "rgba(0,230,118,.15)";
    roundRect(ctx, textRight - bw, cy + 52, bw, 30, 15); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.28)"; ctx.lineWidth = 1;
    roundRect(ctx, textRight - bw, cy + 52, bw, 30, 15); ctx.stroke();
    ctx.fillStyle = "#00E676"; ctx.textAlign = "right";
    ctx.fillText(countStr, textRight - 14, cy + 72);

    const wMap = {};
    g.rows.forEach(r => { if (r.winnerId) wMap[r.winnerId] = (wMap[r.winnerId] || 0) + 1; });
    const topId = Object.entries(wMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    if (topId) {
      ctx.fillStyle = "#9BA0C0"; ctx.font = "700 16px Tahoma, Arial";
      ctx.fillText(`أكثر فائز: ${getMemberName(members, topId)}`, textRight, cy + 108);
    }
  });

  const dt = new Date().toLocaleString("ar", { hour12: false, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  ctx.fillStyle = "#6270A0"; ctx.font = "700 20px Tahoma, Arial"; ctx.textAlign = "center";
  ctx.fillText(dt, W / 2, H - 22);

  try {
    const link = document.createElement("a");
    link.download = `FIFA-GROUP-سجل-البطولات.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) { console.error(err); }
}

export async function downloadArchiveBySeasonImage({ seasons = [], allTournaments = [], trophyMap = {}, members = [], config = {} } = {}) {
  const archiveSeasons = (seasons || []).filter(s => s && (s.seasonName || s.name));
  const headers = ["الموسم", "السنوات", "البطولات", "أكثر فائز"];
  const rows = archiveSeasons.map(season => {
    const seasonRows = season.rows || (allTournaments || []).filter(t =>
      cleanId(t.seasonId) === cleanId(season.seasonId) || cleanId(t.seasonId) === cleanId(season.id)
    );
    const wMap = {};
    seasonRows.filter(r => r.winnerId && r.winnerId !== "-").forEach(r => { wMap[r.winnerId] = (wMap[r.winnerId] || 0) + 1; });
    const topId = Object.entries(wMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const dateRange = [season.startDate, season.endDate].filter(Boolean).join(" — ") || "-";
    return [season.seasonName || season.name || "-", dateRange, season.count || seasonRows.length, topId ? getMemberName(members, topId) : "-"];
  });
  const rowStyles = archiveSeasons.map((_, i) => i % 2 === 0 ? { fill: "rgba(4,12,28,.82)" } : { fill: "rgba(6,15,34,.62)" });
  await drawFifaGroupTableImage({ title: "السجل العام — حسب الموسم", subtitle: `${archiveSeasons.length} موسم`, headers, rows, rowStyles, logoUrl: exportBrandLogoUrl(config), competition: null, trophyMap: {}, config });
}

export async function downloadArchiveByMemberImage({ allTournaments = [], members = [], trophyMap = {}, config = {} } = {}) {
  const completed = allTournaments.filter(t => t.winnerId && t.winnerId !== "-" && t.winnerId !== "");
  const wMap = {};
  completed.forEach(r => { const id = r.winnerId; if (!id) return; wMap[id] = (wMap[id] || 0) + 1; });
  const memberRows = Object.entries(wMap).map(([id, count]) => {
    const member = members.find(m => same(m.id, id)) || {};
    return { id, name: getMemberName(members, id), count, avatar: member.avatar || "" };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, memberRows[0]?.count || 1);
  const W = 1080, PAD = 44, ROW_H = 90, headerH = 120;
  const H = PAD + headerH + 16 + memberRows.length * (ROW_H + 8) + PAD + 50;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#02071A"); bg.addColorStop(0.5, "#040E25"); bg.addColorStop(1, "#030918");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W - 160, 160, 0, W - 160, 160, 300);
  g1.addColorStop(0, "rgba(0,230,118,.14)"); g1.addColorStop(1, "transparent");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const hX = PAD, hY = PAD, hW = W - PAD * 2;
  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, hX, hY, hW, headerH, 22); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.28)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hX, hY, hW, headerH, 22); ctx.stroke();
  const scanG = ctx.createLinearGradient(hX, 0, hX + hW, 0);
  scanG.addColorStop(0, "transparent"); scanG.addColorStop(0.5, "#00E676"); scanG.addColorStop(1, "transparent");
  ctx.fillStyle = scanG; ctx.fillRect(hX, hY, hW, 2);

  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  if (brandLogo) {
    ctx.save(); roundRect(ctx, hX + 20, hY + 16, 68, 68, 16); ctx.clip();
    ctx.drawImage(brandLogo, hX + 20, hY + 16, 68, 68); ctx.restore();
  }
  const titleG = ctx.createLinearGradient(0, 0, hW, 0);
  titleG.addColorStop(0, "#FFFFFF"); titleG.addColorStop(1, "#00E676");
  ctx.fillStyle = titleG; ctx.font = "900 46px Tahoma, Arial"; ctx.textAlign = "right";
  ctx.fillText("السجل العام — حسب الفائز", hX + hW - 20, hY + 62);
  ctx.fillStyle = "#9BA0C0"; ctx.font = "700 22px Tahoma, Arial";
  ctx.fillText(`${completed.length} بطولة  •  ${memberRows.length} عضو`, hX + hW - 20, hY + 98);

  const avatars = {};
  await Promise.all(memberRows.map(async m => {
    if (m.avatar) { const i = await loadCanvasImage(m.avatar); if (i) avatars[m.id] = i; }
  }));

  const rowsY = hY + headerH + 16;
  const avSize = 66, rankW = 58, nameW = W - PAD * 2 - rankW - avSize - 24 - 180 - 20;
  const barMaxW = 260;

  memberRows.forEach((m, idx) => {
    const ry = rowsY + idx * (ROW_H + 8);
    const isFirst = idx === 0;

    ctx.fillStyle = isFirst ? "rgba(0,230,118,.12)" : "rgba(4,12,28,.85)";
    roundRect(ctx, PAD, ry, W - PAD * 2, ROW_H, 22); ctx.fill();
    ctx.strokeStyle = isFirst ? "rgba(0,230,118,.36)" : "rgba(0,230,118,.10)"; ctx.lineWidth = isFirst ? 1.5 : 1;
    roundRect(ctx, PAD, ry, W - PAD * 2, ROW_H, 22); ctx.stroke();

    const rankX = W - PAD - rankW, rankY = ry + (ROW_H - 50) / 2;
    ctx.fillStyle = isFirst ? "rgba(0,230,118,.22)" : "rgba(255,255,255,.07)";
    roundRect(ctx, rankX, rankY, rankW, 50, 16); ctx.fill();
    ctx.fillStyle = isFirst ? "#00E676" : "#9BA0C0"; ctx.font = "900 22px Tahoma, Arial"; ctx.textAlign = "center";
    ctx.fillText(`#${idx + 1}`, rankX + rankW / 2, rankY + 33);

    const avX = rankX - 12 - avSize, avY = ry + (ROW_H - avSize) / 2;
    ctx.save(); ctx.beginPath(); ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2); ctx.clip();
    if (avatars[m.id]) {
      ctx.drawImage(avatars[m.id], avX, avY, avSize, avSize);
    } else {
      const avBg = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize);
      avBg.addColorStop(0, "#07122A"); avBg.addColorStop(1, "#0D1E42");
      ctx.fillStyle = avBg; ctx.fillRect(avX, avY, avSize, avSize);
      ctx.fillStyle = "#00E676"; ctx.font = `900 ${avSize * .45}px Tahoma, Arial`;
      ctx.fillText(String(m.name || "?").slice(0, 1), avX + avSize / 2, avY + avSize / 2 + avSize * .16);
    }
    ctx.restore();
    if (isFirst) {
      ctx.strokeStyle = "rgba(0,230,118,.55)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 1.5, 0, Math.PI * 2); ctx.stroke();
    }

    const nameX = avX - 14, centerY = ry + ROW_H / 2;
    ctx.fillStyle = "#EDF0FF"; ctx.font = `${isFirst ? 900 : 800} 26px Tahoma, Arial`; ctx.textAlign = "right";
    ctx.fillText(String(m.name).length > 14 ? String(m.name).slice(0, 13) + "…" : m.name, nameX, centerY - 4);

    const countFont = isFirst ? "900 42px Tahoma, Arial" : "900 36px Tahoma, Arial";
    ctx.fillStyle = "#00E676"; ctx.font = countFont; ctx.textAlign = "left";
    ctx.fillText(String(m.count), PAD + 14, centerY - 2);

    const barX = avX - 14 - Math.round(barMaxW * 0.65), barY = centerY + 18, barH = 14;
    const barW = Math.round((m.count / maxCount) * Math.round(barMaxW * 0.65));
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, barX, barY, Math.round(barMaxW * 0.65), barH, 7); ctx.fill();
    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barGrad.addColorStop(0, "#00E676"); barGrad.addColorStop(1, "#00D4FF");
    ctx.fillStyle = barGrad;
    roundRect(ctx, barX, barY, barW, barH, 7); ctx.fill();
  });

  const dt = new Date().toLocaleString("ar", { hour12: false, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  ctx.fillStyle = "#6270A0"; ctx.font = "700 20px Tahoma, Arial"; ctx.textAlign = "center";
  ctx.fillText(dt, W / 2, H - 22);

  try {
    const link = document.createElement("a");
    link.download = `FIFA-GROUP-الفائزون.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) { console.error(err); }
}

export async function downloadGeneralStatsImage({ statsMap = {}, members = [], config = {} } = {}) {
  const rows = Object.values(statsMap).filter(r => getMemberName(members, r.memberId) !== r.memberId).sort((a, b) => b.finalsPlayed - a.finalsPlayed || b.finalsWon - a.finalsWon);
  const headers = ["#", "العضو", "نهائيات", "فوز", "خسارة", "نسبة الفوز", "هبوط"];
  const tableRows = rows.map((r, i) => {
    const rate = r.finalsPlayed ? Math.round(r.finalsWon / r.finalsPlayed * 100) : 0;
    return [i + 1, getMemberName(members, r.memberId), r.finalsPlayed, r.finalsWon, r.finalsLost, rate + "%", r.relegations || 0];
  });
  const rowStyles = rows.map((_, i) => i === 0 ? { fill: "rgba(0,230,118,.12)", stroke: "rgba(0,230,118,.26)", lineWidth: 1.5 } : {});
  await drawFifaGroupTableImage({ title: "الإحصائيات العامة", subtitle: `${rows.length} عضو • ${Math.round(rows.reduce((s, r) => s + r.finalsPlayed, 0) / 2)} نهائي مجموعاً`, headers, rows: tableRows, rowStyles, logoUrl: exportBrandLogoUrl(config), config });
}

export async function downloadMemberFinanceImage({ member = {}, financeRows = [], balance = 0, config = {}, members = [] } = {}) {
  if (typeof document === "undefined") return;
  const memberId = cleanId(member.id || member.memberId || "");
  const sorted = [...(financeRows || [])].sort((a, b) => transferRowTimeValue(b) - transferRowTimeValue(a));
  const rows = sorted.map((row) => {
    const direction = getFinanceDirection(row, memberId);
    const signedAmount = getFinanceSignedAmount(row, memberId);
    return {
      row,
      cls: financeTypeClass(row, memberId),
      title: getFinanceDisplayTitle(row, memberId, members),
      date: getFinanceRecordDate(row),
      note: getFinanceRecordNote(row),
      amount: `${direction === "income" ? "+" : direction === "expense" ? "−" : ""}${formatMoney(Math.abs(signedAmount))}`,
    };
  });

  const width = 1200;
  const pad = 48;
  const cardW = width - pad * 2;
  const headerH = 170;
  const footerH = 78;
  const cardGap = 14;
  const baseCardH = 138;
  const noteLineH = 24;
  const maxNoteW = cardW - 56;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.direction = "rtl";
  measureCtx.font = "700 20px Tahoma, Arial";
  const measuredRows = rows.map((item) => {
    const noteLines = wrapCanvasText(measureCtx, item.note || "-", maxNoteW);
    const cardH = Math.max(baseCardH, 116 + noteLines.length * noteLineH);
    return { ...item, noteLines, cardH };
  });
  const listH = measuredRows.reduce((sum, item) => sum + item.cardH, 0) + Math.max(0, measuredRows.length - 1) * cardGap;
  const height = Math.max(520, headerH + listH + footerH);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#02071A");
  gradient.addColorStop(0.5, "#040E25");
  gradient.addColorStop(1, "#030918");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,230,118,0.12)";
  ctx.beginPath(); ctx.arc(width - 150, 105, 190, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,212,255,0.07)";
  ctx.beginPath(); ctx.arc(135, height - 120, 240, 0, Math.PI * 2); ctx.fill();

  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  const hX = pad, hY = 24, hW = cardW, hH = 112;
  ctx.fillStyle = "rgba(4,12,28,.94)";
  roundRect(ctx, hX, hY, hW, hH, 24); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.28)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hX, hY, hW, hH, 24); ctx.stroke();
  const scan = ctx.createLinearGradient(hX, 0, hX + hW, 0);
  scan.addColorStop(0, "transparent"); scan.addColorStop(0.5, "#00E676"); scan.addColorStop(1, "transparent");
  ctx.fillStyle = scan; ctx.fillRect(hX, hY, hW, 2);
  if (brandLogo) {
    ctx.save(); roundRect(ctx, hX + 22, hY + 20, 72, 72, 18); ctx.clip();
    ctx.drawImage(brandLogo, hX + 22, hY + 20, 72, 72); ctx.restore();
  }
  ctx.textAlign = "right";
  ctx.fillStyle = "#EDF0FF"; ctx.font = "900 42px Tahoma, Arial";
  ctx.fillText(`السجل المالي — ${member.name || "عضو"}`, hX + hW - 26, hY + 56);
  ctx.fillStyle = "#00E676"; ctx.font = "800 24px Tahoma, Arial";
  ctx.fillText(`الرصيد الحالي: ${formatMoney(balance)}`, hX + hW - 26, hY + 92);

  let y = headerH;
  if (!measuredRows.length) {
    ctx.fillStyle = "rgba(4,12,28,.82)";
    roundRect(ctx, pad, y, cardW, 90, 22); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.14)"; ctx.lineWidth = 1;
    roundRect(ctx, pad, y, cardW, 90, 22); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#C7CCE3"; ctx.font = "800 24px Tahoma, Arial";
    ctx.fillText("لا يوجد سجل مالي لهذا العضو.", width / 2, y + 55);
  }

  measuredRows.forEach((item) => {
    const rowY = y;
    const toneColor = item.cls === "income" ? "rgba(34,197,94,.34)" : item.cls === "expense" ? "rgba(239,68,68,.30)" : "rgba(0,230,118,.16)";
    const amountColor = item.cls === "income" ? "#22c55e" : item.cls === "expense" ? "#f87171" : "#EDF0FF";

    ctx.fillStyle = "rgba(4,12,28,.88)";
    roundRect(ctx, pad, rowY, cardW, item.cardH, 22); ctx.fill();
    ctx.strokeStyle = toneColor; ctx.lineWidth = 1.4;
    roundRect(ctx, pad, rowY, cardW, item.cardH, 22); ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillStyle = amountColor;
    ctx.font = "900 34px Tahoma, Arial";
    ctx.fillText(item.amount, pad + cardW - 26, rowY + 42);

    ctx.fillStyle = "#EDF0FF";
    ctx.font = "900 22px Tahoma, Arial";
    ctx.fillText(item.title || "حركة مالية", pad + cardW - 26, rowY + 78);
    ctx.textAlign = "left";
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 18px Tahoma, Arial";
    ctx.fillText(item.date || "—", pad + 26, rowY + 78);

    const noteBoxY = rowY + 96;
    ctx.fillStyle = "rgba(255,255,255,.045)";
    roundRect(ctx, pad + 18, noteBoxY, cardW - 36, Math.max(36, item.noteLines.length * noteLineH + 12), 14); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.075)"; ctx.lineWidth = 1;
    roundRect(ctx, pad + 18, noteBoxY, cardW - 36, Math.max(36, item.noteLines.length * noteLineH + 12), 14); ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillStyle = "#C7CCE3";
    ctx.font = "700 20px Tahoma, Arial";
    item.noteLines.forEach((line, lineIndex) => {
      ctx.fillText(line, pad + cardW - 36, noteBoxY + 26 + lineIndex * noteLineH);
    });

    y += item.cardH + cardGap;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "700 20px Tahoma, Arial";
  ctx.fillText(exportDateTimeLabel(), width / 2, height - 30);

  const link = document.createElement("a");
  link.download = safeFileName(`السجل المالي-${member.name || "عضو"}`) + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function downloadCompetitionStandingsImage(competition = {}, config = {}, trophyMap = {}) {
  try {
    if (["world_cup", "champions_league"].includes(competitionTypeKey(competition.type)) || isLeagueGroupsCompetition(competition)) {
      await downloadWorldCupGroupsStandingsImage(competition, config, trophyMap);
      return;
    }
    const rows = computeLeagueStandings(filterCompetitionParticipantsForCalculation(competition), filterCompetitionMatchesForCalculation(competition));
    const title = (competition.name || "ترتيب الدوري") + " - الترتيب";
    const subtitle = isCompetitionCompleted(competition) && competition.championMemberName ? "البطل: " + competition.championMemberName : "";
    const headers = ["#", "العضو", "لعب", "ف", "ت", "خ", "له", "عليه", "فارق", "نقاط"];
    const body = rows.map((row, index) => [index + 1, row.memberName, row.played, row.wins, row.draws, row.losses, row.goalsFor, row.goalsAgainst, row.goalDifference, row.points]);
    const relegatedIds = Array.isArray(competition.relegatedMemberIds) ? competition.relegatedMemberIds : [];
    const rowStyles = rows.map((row, index) => index === 0 ? { stroke: "rgba(250,204,21,.95)", fill: "rgba(250,204,21,.10)", lineWidth: 2.6 } : relegatedIds.some((id) => same(id, row.memberId)) ? { stroke: "rgba(248,113,113,.95)", fill: "rgba(127,29,29,.20)", lineWidth: 2.4 } : null);
    await drawFifaGroupTableImage({ title, subtitle, headers, rows: body, rowStyles, filename: safeFileName(title) + ".png", footer: exportDateTimeLabel(), logoUrl: exportBrandLogoUrl(config), competition, trophyMap });
  } catch (err) {
    console.error("download standings image failed", err);
  }
}

export async function downloadWorldCupGroupsStandingsImage(competition = {}, config = {}, trophyMap = {}) {
  if (typeof document === "undefined") return;
  const typeKey = competitionTypeKey(competition.type || "");
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const groups = (typeKey === "champions_league" || leagueGroupsMode) ? championsLeagueGroupRows(competition || {}) : worldCupGroupRows(competition || {});
  const worldCupQualifiedIds = typeKey === "world_cup" ? computeWorldCupQualifiedIds(competition || {}) : [];
  const defaultName = leagueGroupsMode ? "الدوري" : typeKey === "champions_league" ? "دوري الأبطال" : "كأس العالم";
  const title = (competition.name || defaultName) + " - ترتيب دور المجموعات";
  const subtitle = (typeKey === "champions_league" || leagueGroupsMode) ? "يتأهل الأول والثاني من كل مجموعة" : "يتأهل أول كل مجموعة + أفضل ثاني";
  const threeGroupsMode = typeKey === "world_cup" && groups.length >= 3;
  const width = threeGroupsMode ? 1600 : 1300;
  const groupBoxW = threeGroupsMode ? 480 : 560;
  const groupGap = threeGroupsMode ? 28 : 50;
  const rowH = threeGroupsMode ? 46 : 48;
  const headerH = 178;
  const footerH = 74;
  const maxRows = Math.max(1, ...groups.map((group) => Math.max(1, (group.standings || []).length)));
  const groupBoxH = 92 + rowH * (maxRows + 1) + 28;
  const height = headerH + groupBoxH + footerH;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  function fitText(text, maxWidth, font) {
    let value = String(text ?? "-");
    ctx.font = font;
    if (ctx.measureText(value).width <= maxWidth) return value;
    while (value.length > 1 && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
    return value + "…";
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#02071A");
  gradient.addColorStop(0.5, "#040E25");
  gradient.addColorStop(1, "#030918");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,230,118,0.12)";
  ctx.beginPath(); ctx.arc(135, 98, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,212,255,0.07)";
  ctx.beginPath(); ctx.arc(width - 130, 86, 220, 0, Math.PI * 2); ctx.fill();

  const compLogo = await loadCanvasImage(competitionLogoUrl(competition || {}, config, trophyMap));
  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));

  const hCX = 40, hCY = 24, hCW = width - 80, hCH = subtitle ? 116 : 96;
  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, hCX, hCY, hCW, hCH, 22); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.26)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hCX, hCY, hCW, hCH, 22); ctx.stroke();
  const scanGS = ctx.createLinearGradient(hCX, 0, hCX + hCW, 0);
  scanGS.addColorStop(0, "transparent"); scanGS.addColorStop(0.5, "#00E676"); scanGS.addColorStop(1, "transparent");
  ctx.fillStyle = scanGS; ctx.fillRect(hCX, hCY, hCW, 2);

  if (brandLogo) {
    ctx.save(); roundRect(ctx, hCX + 20, hCY + 14, 68, 68, 16); ctx.clip();
    ctx.drawImage(brandLogo, hCX + 20, hCY + 14, 68, 68); ctx.restore();
  }
  if (compLogo) {
    ctx.save(); roundRect(ctx, hCX + hCW - 88, hCY + 14, 68, 68, 16); ctx.clip();
    ctx.drawImage(compLogo, hCX + hCW - 88, hCY + 14, 68, 68); ctx.restore();
  }
  const titleX2 = compLogo ? hCX + hCW - 110 : hCX + hCW - 20;
  ctx.textAlign = "right";
  ctx.fillStyle = "#EDF0FF"; ctx.font = "900 42px Tahoma, Arial";
  ctx.fillText(fitText(title, hCW - 210, "900 42px Tahoma, Arial"), titleX2, hCY + 60);
  if (subtitle) {
    ctx.fillStyle = "#00E676"; ctx.font = "800 21px Tahoma, Arial";
    ctx.fillText(subtitle, titleX2, hCY + 96);
  }

  const startY = headerH;
  const startX = width - 52 - groupBoxW;
  const headers = ["#", "العضو", "لعب", "له", "عليه", "فارق", "نقاط"];
  const colRatios = [0.08, 0.32, 0.10, 0.11, 0.11, 0.13, 0.15];
  groups.forEach((group, groupIndex) => {
    const x = startX - groupIndex * (groupBoxW + groupGap);
    roundRect(ctx, x, startY, groupBoxW, groupBoxH, 24);
    ctx.fillStyle = "rgba(4,12,28,.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.24)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#00E676";
    ctx.font = "900 25px Tahoma, Arial";
    ctx.fillText("المجموعة " + group.groupName, x + groupBoxW / 2, startY + 42);
    const expectedGroupSize = (typeKey === "champions_league" || leagueGroupsMode) ? 4 : 3;
    if (group.participants.length < expectedGroupSize) {
      ctx.fillStyle = "#fde68a";
      ctx.font = "800 15px Tahoma, Arial";
      ctx.fillText("راحة / BYE: " + Math.max(0, expectedGroupSize - group.participants.length) + " مقعد", x + groupBoxW / 2, startY + 68);
    }

    const tableX = x + 14;
    const tableW = groupBoxW - 28;
    const tableY = startY + 82;
    roundRect(ctx, tableX, tableY, tableW, rowH, 16);
    ctx.fillStyle = "rgba(0,230,118,.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    let cx = tableX + tableW;
    ctx.textAlign = "center";
    ctx.fillStyle = "#EDF0FF";
    ctx.font = threeGroupsMode ? "900 15px Tahoma, Arial" : "900 16px Tahoma, Arial";
    headers.forEach((head, i) => {
      const cw = tableW * colRatios[i];
      ctx.fillText(head, cx - cw / 2, tableY + 30);
      cx -= cw;
    });

    const rows = (group.standings || []);
    if (!rows.length) {
      ctx.fillStyle = "#6270A0";
      ctx.font = "900 18px Tahoma, Arial";
      ctx.fillText("لا يوجد مشاركون", x + groupBoxW / 2, tableY + rowH + 34);
    } else {
      rows.forEach((row, index) => {
        const y = tableY + rowH + index * rowH;
        roundRect(ctx, tableX, y + 4, tableW, rowH - 8, 14);
        const isQualifiedRow = (typeKey === "champions_league" || leagueGroupsMode) ? index < 2 : worldCupQualifiedIds.some((id) => same(id, row.memberId));
        ctx.fillStyle = isQualifiedRow ? "rgba(34,197,94,.12)" : "rgba(4,12,28,.82)";
        ctx.fill();
        ctx.strokeStyle = isQualifiedRow ? "rgba(34,197,94,.28)" : "rgba(0,230,118,.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        const values = [index + 1, row.memberName || "-", row.played ?? 0, row.goalsFor ?? 0, row.goalsAgainst ?? 0, row.goalDifference ?? 0, row.points ?? 0];
        let vx = tableX + tableW;
        values.forEach((value, i) => {
          const cw = tableW * colRatios[i];
          const font = i === 1 ? (threeGroupsMode ? "900 15px Tahoma, Arial" : "900 17px Tahoma, Arial") : (threeGroupsMode ? "900 15px Tahoma, Arial" : "900 17px Tahoma, Arial");
          ctx.fillStyle = i === 6 ? "#EDF0FF" : isQualifiedRow && i === 1 ? "#a8f0cd" : "#EDF0FF";
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.fillText(i === 1 ? fitText(value, cw - 8, font) : String(value), vx - cw / 2, y + 31);
          vx -= cw;
        });
      });
    }
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 22px Tahoma, Arial";
  ctx.fillText(exportDateTimeLabel(), width / 2, height - 30);
  const link = document.createElement("a");
  link.download = safeFileName(title) + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function downloadCompetitionResultsImage(competition = {}, config = {}, trophyMap = {}) {
  try {
    if (competitionTypeKey(competition.type) === "super_cup") {
      await drawFifaGroupSuperCupFinalImage({
        competition,
        config,
        trophyMap,
        filename: safeFileName((competition.name || "كأس السوبر") + "-final") + ".png",
      });
      return;
    }
    if (competitionTypeKey(competition.type) === "league_qualifier" || isKnockoutCompetitionType(competitionTypeKey(competition.type)) || isLeagueGroupsCompetition(competition)) {
      await drawFifaGroupBracketImage({
        competition,
        config,
        trophyMap,
        filename: safeFileName((competition.name || "الأدوار الإقصائية") + "-knockout") + ".png",
      });
      return;
    }
    const matchesLabel = isCompetitionCompleted(competition) ? "نتائج المباريات" : "جدول المباريات";
    const title = (competition.name || "الدوري") + " - " + matchesLabel;
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const rows = sortedCompetitionMatchesForSchedule(competition).map((match) => {
      const completed = clean(match.resultStatus || match.status) === "completed";
      const stageLabel = leagueGroupsMode ? scheduleStageTitleForMatch(competition, match) : (match.round || "-");
      return [
        stageLabel,
        match.homeName || "-",
        completed ? `${match.homeGoals} - ${match.awayGoals}` : "-",
        match.awayName || "-",
        match.gameTitle || "-",
      ];
    });
    await drawFifaGroupTableImage({
      title,
      subtitle: "",
      headers: [leagueGroupsMode ? "المرحلة / المجموعة" : "الجولة", "الطرف الأول", "النتيجة", "الطرف الثاني", "اللعبة"],
      rows,
      filename: safeFileName(title) + ".png",
      footer: exportDateTimeLabel(),
      logoUrl: exportBrandLogoUrl(config),
      competition,
      trophyMap,
    });
  } catch (err) {
    console.error("download results image failed", err);
  }
}

export async function downloadCompetitionScheduleTableImage(competition = {}, config = {}, trophyMap = {}) {
  try {
    const matchesLabel = isCompetitionCompleted(competition) ? "نتائج المباريات" : "جدول المباريات";
    const title = (competition.name || "البطولة") + " - " + matchesLabel;
    const rows = sortedCompetitionMatchesForSchedule(competition).map((match) => {
      const completed = clean(match.resultStatus || match.status) === "completed";
      return [
        scheduleStageTitleForMatch(competition, match),
        match.homeName || "-",
        completed ? `${match.homeGoals} - ${match.awayGoals}` : "-",
        match.awayName || "-",
        match.gameTitle || "-",
      ];
    });
    await drawFifaGroupTableImage({
      title,
      subtitle: "",
      headers: ["المرحلة / المجموعة", "الطرف الأول", "النتيجة", "الطرف الثاني", "اللعبة"],
      rows,
      filename: safeFileName(title) + ".png",
      footer: exportDateTimeLabel(),
      logoUrl: exportBrandLogoUrl(config),
      competition,
      trophyMap,
    });
  } catch (err) {
    console.error("download schedule table image failed", err);
  }
}

export async function downloadCompetitionFullDetailsImage(competition = {}, config = {}, trophyMap = {}) {
  try {
    if (typeof document === "undefined") return;
    const typeKey = competitionTypeKey(competition.type || "");
    const leagueGroupsMode = isLeagueGroupsCompetition(competition);
    const isLeague = clean(competition.type || "league") === "league";
    const groupRows = typeKey === "world_cup"
      ? worldCupGroupRows(competition || {})
      : (typeKey === "champions_league" || leagueGroupsMode)
        ? championsLeagueGroupRows(competition || {})
        : [];
    const visibleParticipants = filterCompetitionParticipantsForCalculation(competition || {});
    const standings = isLeague && !leagueGroupsMode ? computeLeagueStandings(visibleParticipants, filterCompetitionMatchesForCalculation(competition)) : [];
    const allMatches = sortedCompetitionMatchesForSchedule(competition || {});
    const hasGroupStage = groupRows.length > 0 || ["world_cup", "champions_league"].includes(typeKey) || leagueGroupsMode;
    const knockoutMatches = allMatches.filter((match) => {
      const phase = clean(match.phase || "");
      if (["world_cup", "champions_league"].includes(typeKey) || leagueGroupsMode) return phase && !["group", "qualification", "qualifier", "playoff"].includes(phase);
      return false;
    });
    const groupStageMatches = hasGroupStage
      ? allMatches.filter((match) => ["group", "qualification", "qualifier", "playoff"].includes(clean(match.phase || "")))
      : [];
    const primaryMatches = hasGroupStage ? groupStageMatches : (isKnockoutCompetitionType(typeKey) || typeKey === "league_qualifier" ? [] : allMatches);
    const primaryMatchesTitle = hasGroupStage
      ? (clean(competition.status) === "completed" ? "نتائج دور المجموعات" : "جدول ونتائج دور المجموعات")
      : (isKnockoutCompetitionType(typeKey) || typeKey === "league_qualifier")
        ? (clean(competition.status) === "completed" ? "نتائج الأدوار الإقصائية" : "جدول ونتائج الأدوار الإقصائية")
        : (clean(competition.status) === "completed" ? "نتائج المباريات" : "جدول ونتائج المباريات");
    const stats = buildCompetitionStats(competition || {});
    const competitionAdminNoteText = String(competition.adminNote || "").trim();
    const noteLineEstimate = competitionAdminNoteText ? Math.min(6, Math.max(1, Math.ceil(competitionAdminNoteText.length / 78))) : 0;
    const approvedChampion = isLeague
      ? getApprovedCompetitionChampionName(competition, standings[0]?.memberName || "")
      : ["cup", "super_cup", "world_cup", "champions_league"].includes(typeKey)
        ? getApprovedCompetitionChampionName(competition, getKnockoutChampion(competition)?.memberName || "")
        : "-";
    const width = 1400;
    const margin = 54;
    const contentW = width - margin * 2;
    const sectionGap = 24;
    const tableRowH = 42;
    const headerH = 150;
    const summaryH = 98;
    const groupsH = groupRows.length
      ? groupRows.reduce((sum, group) => sum + 62 + tableRowH * ((group.standings || []).length + 1) + 26, 36)
      : 0;
    const standingsH = standings.length ? 68 + tableRowH * (standings.length + 1) + 24 : 0;
    const matchesH = primaryMatches.length ? 76 + tableRowH * (primaryMatches.length + 1) + 28 : 0;
    const knockoutColumns = competitionKnockoutColumnsForExport(competition, knockoutMatches.length ? knockoutMatches : (isKnockoutCompetitionType(typeKey) || typeKey === "league_qualifier" ? allMatches : []));
    const knockoutMatchCount = knockoutColumns.reduce((sum, column) => sum + (column.matches || []).length, 0);
    const knockoutRoadH = knockoutColumns.length ? 96 + Math.max(...knockoutColumns.map((column) => (column.matches || []).length), 1) * 96 + 34 : 0;
    const knockoutH = knockoutColumns.length ? knockoutRoadH : (knockoutMatches.length ? 76 + tableRowH * (knockoutMatches.length + 1) + 28 : 0);
    const noteH = competitionAdminNoteText ? 88 + noteLineEstimate * 30 : 0;
    const statsH = 220;
    const footerH = 68;
    const height = headerH + summaryH + (groupsH || standingsH ? sectionGap : 0) + groupsH + standingsH + (matchesH ? sectionGap : 0) + matchesH + (knockoutH ? sectionGap : 0) + knockoutH + (noteH ? sectionGap + noteH : 0) + sectionGap + statsH + footerH;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.direction = "rtl";

    function fitText(text, maxWidth, font) {
      let value = String(text ?? "-");
      ctx.font = font;
      if (ctx.measureText(value).width <= maxWidth) return value;
      while (value.length > 1 && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
      return value + "…";
    }

    function wrapCanvasTextLocal(text, maxWidth, font, maxLines = 6) {
      const raw = String(text || "").trim();
      if (!raw) return [];
      ctx.font = font;
      const words = raw.split(/\s+/).filter(Boolean);
      const lines = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? current + " " + word : word;
        if (ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
          while (ctx.measureText(current).width > maxWidth && current.length > 1) {
            let chunk = current;
            while (chunk.length > 1 && ctx.measureText(chunk + "…").width > maxWidth) chunk = chunk.slice(0, -1);
            lines.push(chunk + "…");
            current = "";
          }
        }
        if (lines.length >= maxLines) break;
      }
      if (current && lines.length < maxLines) lines.push(current);
      if (lines.length > maxLines) return lines.slice(0, maxLines);
      return lines;
    }

    function stageLabel(match = {}) {
      return scheduleStageTitleForMatch(competition, match) || match.round || match.phase || "-";
    }

    function resultLabel(match = {}) {
      const completed = clean(match.resultStatus || match.status) === "completed";
      if (!completed) return "-";
      const base = `${match.homeGoals ?? 0} - ${match.awayGoals ?? 0}`;
      const hasPens = match.homePens !== null && match.homePens !== undefined && match.awayPens !== null && match.awayPens !== undefined;
      return hasPens ? `${base} (${match.homePens}-${match.awayPens})` : base;
    }

    function sectionTitle(title, y, icon = "") {
      ctx.textAlign = "right";
      ctx.fillStyle = "#00E676";
      ctx.font = "900 30px Tahoma, Arial";
      const label = icon ? `${icon} ${title}` : title;
      ctx.fillText(label, width - margin, y + 34);
      ctx.fillStyle = "rgba(0,230,118,.24)";
      ctx.fillRect(margin, y + 50, contentW, 1);
    }

    function detailsSectionIcon(title = "") {
      const text = clean(title || "");
      if (text.includes("المجموعات") || text.includes("ترتيب")) return "📊";
      if (text.includes("الإقصائية")) return "🏆";
      if (text.includes("المباريات") || text.includes("نتائج")) return "🎮";
      if (text.includes("ملاحظات")) return "📝";
      if (text.includes("إحصائيات")) return "📈";
      return "";
    }

    function drawTable({ y, headers, rows, ratios, title = "" }) {
      let top = y;
      if (title) {
        sectionTitle(title, top, detailsSectionIcon(title));
        top += 62;
      }
      const tableX = margin;
      const tableW = contentW;
      roundRect(ctx, tableX, top, tableW, tableRowH, 16);
      ctx.fillStyle = "rgba(0,230,118,.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.20)";
      ctx.lineWidth = 1;
      ctx.stroke();
      let hx = tableX + tableW;
      ctx.textAlign = "center";
      ctx.fillStyle = "#EDF0FF";
      ctx.font = "900 17px Tahoma, Arial";
      headers.forEach((head, index) => {
        const cw = tableW * ratios[index];
        ctx.fillText(String(head), hx - cw / 2, top + 28);
        hx -= cw;
      });
      rows.forEach((row, rowIndex) => {
        const ry = top + tableRowH + rowIndex * tableRowH;
        roundRect(ctx, tableX, ry + 4, tableW, tableRowH - 8, 14);
        ctx.fillStyle = rowIndex % 2 === 0 ? "rgba(4,12,28,.82)" : "rgba(6,15,34,.68)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,230,118,.08)";
        ctx.stroke();
        let cx = tableX + tableW;
        row.forEach((cell, index) => {
          const cw = tableW * ratios[index];
          const font = index === 1 || index === 3 ? "900 17px Tahoma, Arial" : "800 17px Tahoma, Arial";
          ctx.font = font;
          ctx.fillStyle = "#EDF0FF";
          ctx.textAlign = "center";
          ctx.fillText(fitText(cell, cw - 10, font), cx - cw / 2, ry + 30);
          cx -= cw;
        });
      });
      return top + tableRowH * (rows.length + 1) + 28;
    }

    function drawAdminNoteBox(y) {
      if (!competitionAdminNoteText) return y;
      sectionTitle("ملاحظات البطولة", y, "📝");
      const top = y + 62;
      const boxH = Math.max(74, noteH - 70);
      roundRect(ctx, margin, top, contentW, boxH, 22);
      ctx.fillStyle = "rgba(4,12,28,.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const font = "800 21px Tahoma, Arial";
      const lines = wrapCanvasTextLocal(competitionAdminNoteText, contentW - 58, font, 6);
      ctx.textAlign = "right";
      ctx.fillStyle = "#DCE4F5";
      ctx.font = font;
      lines.forEach((line, index) => ctx.fillText(line, width - margin - 28, top + 36 + index * 30));
      return top + boxH + 26;
    }

    function drawKnockoutRoad({ y, title = "طريق الأدوار الإقصائية", columns = [] }) {
      let top = y;
      sectionTitle(title, top, "🏆");
      top += 66;
      if (!columns.length) return top;
      const colGap = 16;
      const colW = (contentW - colGap * (columns.length - 1)) / columns.length;
      const maxRows = Math.max(...columns.map((column) => (column.matches || []).length), 1);
      const cardH = 78;
      const rowGap = 14;
      const panelH = 48 + maxRows * cardH + Math.max(0, maxRows - 1) * rowGap + 28;
      columns.forEach((column, colIndex) => {
        const x = width - margin - colW - colIndex * (colW + colGap);
        roundRect(ctx, x, top, colW, panelH, 22);
        const isFinal = clean(column.key || "") === "final" || colIndex === columns.length - 1;
        ctx.fillStyle = isFinal ? "rgba(250,204,21,.08)" : "rgba(4,12,28,.72)";
        ctx.fill();
        ctx.strokeStyle = isFinal ? "rgba(250,204,21,.24)" : "rgba(0,230,118,.16)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = isFinal ? "#fde68a" : "#00E676";
        ctx.font = "900 20px Tahoma, Arial";
        ctx.fillText(fitText(column.title || column.label || "الدور", colW - 24, "900 20px Tahoma, Arial"), x + colW / 2, top + 32);
        const matches = column.matches || [];
        const stackH = matches.length * cardH + Math.max(0, matches.length - 1) * rowGap;
        const startY = top + 50 + Math.max(0, (panelH - 70 - stackH) / 2);
        matches.forEach((match, matchIndex) => {
          const cy = startY + matchIndex * (cardH + rowGap);
          const completed = clean(match.resultStatus || match.status) === "completed";
          const score = completed ? resultLabel(match) : "-";
          const winnerName = clean(match.winnerName || "");
          const homeWinner = winnerName && same(winnerName, match.homeName);
          const awayWinner = winnerName && same(winnerName, match.awayName);
          roundRect(ctx, x + 12, cy, colW - 24, cardH, 18);
          ctx.fillStyle = completed ? "rgba(0,230,118,.10)" : "rgba(2,6,23,.68)";
          ctx.fill();
          ctx.strokeStyle = completed ? "rgba(0,230,118,.26)" : "rgba(0,230,118,.10)";
          ctx.stroke();
          ctx.textAlign = "right";
          ctx.font = homeWinner ? "900 17px Tahoma, Arial" : "800 16px Tahoma, Arial";
          ctx.fillStyle = homeWinner ? "#a8f0cd" : "#EDF0FF";
          ctx.fillText(fitText(match.homeName || "-", colW - 118, ctx.font), x + colW - 28, cy + 30);
          ctx.font = awayWinner ? "900 17px Tahoma, Arial" : "800 16px Tahoma, Arial";
          ctx.fillStyle = awayWinner ? "#a8f0cd" : "#EDF0FF";
          ctx.fillText(fitText(match.awayName || "-", colW - 118, ctx.font), x + colW - 28, cy + 60);
          ctx.textAlign = "center";
          ctx.fillStyle = "#00E676";
          ctx.font = "1000 20px Tahoma, Arial";
          ctx.fillText(score, x + 52, cy + 38);
          ctx.fillStyle = "#94A3B8";
          ctx.font = "800 12px Tahoma, Arial";
          ctx.fillText(match.gameTitle || "-", x + 52, cy + 58);
        });
      });
      return top + panelH + 30;
    }

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#02071A");
    bg.addColorStop(.55, "#041027");
    bg.addColorStop(1, "#020617");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,230,118,.10)";
    ctx.beginPath(); ctx.arc(170, 120, 230, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,212,255,.07)";
    ctx.beginPath(); ctx.arc(width - 170, 110, 250, 0, Math.PI * 2); ctx.fill();

    const compLogo = await loadCanvasImage(competitionLogoUrl(competition || {}, config, trophyMap));
    const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
    const hX = margin, hY = 24, hW = contentW, hH = 104;
    ctx.fillStyle = "rgba(4,12,28,.92)";
    roundRect(ctx, hX, hY, hW, hH, 24); ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.26)"; ctx.lineWidth = 1.5;
    roundRect(ctx, hX, hY, hW, hH, 24); ctx.stroke();
    const scan = ctx.createLinearGradient(hX, 0, hX + hW, 0);
    scan.addColorStop(0, "transparent"); scan.addColorStop(.5, "#00E676"); scan.addColorStop(1, "transparent");
    ctx.fillStyle = scan; ctx.fillRect(hX, hY, hW, 2);
    if (brandLogo) { ctx.save(); roundRect(ctx, hX + 18, hY + 18, 68, 68, 16); ctx.clip(); ctx.drawImage(brandLogo, hX + 18, hY + 18, 68, 68); ctx.restore(); }
    if (compLogo) { ctx.save(); roundRect(ctx, hX + hW - 86, hY + 18, 68, 68, 16); ctx.clip(); ctx.drawImage(compLogo, hX + hW - 86, hY + 18, 68, 68); ctx.restore(); }
    ctx.textAlign = "right";
    ctx.fillStyle = "#EDF0FF";
    ctx.font = "900 42px Tahoma, Arial";
    ctx.fillText(fitText((competition.name || competitionTypeLabel(typeKey)) + " - تفاصيل البطولة", hW - 190, "900 42px Tahoma, Arial"), hX + hW - 106, hY + 58);
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 20px Tahoma, Arial";
    ctx.fillText(`${competitionTypeLabel(typeKey)} • ${competitionStatusLabel(competition.status)}${competition.startDate ? " • " + competition.startDate : ""}`, hX + hW - 106, hY + 88);

    let y = headerH;
    const completedCount = allMatches.filter((m) => clean(m.resultStatus || m.status) === "completed").length;
    const summary = [
      ["👥 المشاركون", visibleParticipants.length],
      ["🎮 المباريات", allMatches.length],
      ["✅ المكتملة", completedCount],
      ["🏆 البطل", approvedChampion || "-"],
    ];
    const cardW = (contentW - 36) / 4;
    summary.forEach((item, index) => {
      const x = width - margin - cardW - index * (cardW + 12);
      roundRect(ctx, x, y, cardW, summaryH - 16, 20);
      ctx.fillStyle = "rgba(4,12,28,.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.18)";
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#94A3B8";
      ctx.font = "900 17px Tahoma, Arial";
      ctx.fillText(item[0], x + cardW / 2, y + 28);
      ctx.fillStyle = "#EDF0FF";
      ctx.font = "900 26px Tahoma, Arial";
      ctx.fillText(fitText(item[1], cardW - 22, "900 26px Tahoma, Arial"), x + cardW / 2, y + 62);
    });
    y += summaryH;

    if (groupRows.length) {
      y += sectionGap;
      sectionTitle("ترتيب المجموعات", y, "📊");
      y += 62;
      groupRows.forEach((group) => {
        const rows = (group.standings || []).map((row, index) => [index + 1, row.memberName || "-", row.played ?? 0, row.goalsFor ?? 0, row.goalsAgainst ?? 0, row.goalDifference ?? 0, row.points ?? 0]);
        y = drawTable({
          y,
          title: "المجموعة " + group.groupName,
          headers: ["#", "العضو", "لعب", "له", "عليه", "فارق", "نقاط"],
          rows,
          ratios: [0.07, 0.34, 0.10, 0.11, 0.11, 0.13, 0.14],
        });
      });
    } else if (standings.length) {
      y += sectionGap;
      y = drawTable({
        y,
        title: "ترتيب البطولة",
        headers: ["#", "العضو", "لعب", "ف", "ت", "خ", "له", "عليه", "فارق", "نقاط"],
        rows: standings.map((row, index) => [index + 1, row.memberName, row.played, row.wins, row.draws, row.losses, row.goalsFor, row.goalsAgainst, row.goalDifference, row.points]),
        ratios: [0.06, 0.28, 0.08, 0.07, 0.07, 0.07, 0.09, 0.09, 0.09, 0.10],
      });
    }

    if (primaryMatches.length) {
      y += sectionGap;
      y = drawTable({
        y,
        title: primaryMatchesTitle,
        headers: ["المرحلة", "الطرف الأول", "النتيجة", "الطرف الثاني", "اللعبة"],
        rows: primaryMatches.map((match) => [stageLabel(match), match.homeName || "-", resultLabel(match), match.awayName || "-", match.gameTitle || "-"]),
        ratios: [0.22, 0.25, 0.14, 0.25, 0.14],
      });
    }

    if (knockoutColumns.length) {
      y += sectionGap;
      y = drawKnockoutRoad({ y, title: "طريق الأدوار الإقصائية", columns: knockoutColumns });
    } else if (knockoutMatches.length) {
      y += sectionGap;
      y = drawTable({
        y,
        title: "نتائج الأدوار الإقصائية",
        headers: ["الدور", "الطرف الأول", "النتيجة", "الطرف الثاني", "الفائز"],
        rows: knockoutMatches.map((match) => [stageLabel(match), match.homeName || "-", resultLabel(match), match.awayName || "-", match.winnerName || "-"]),
        ratios: [0.22, 0.25, 0.14, 0.25, 0.14],
      });
    }

    if (competitionAdminNoteText) {
      y += sectionGap;
      y = drawAdminNoteBox(y);
    }

    y += sectionGap;
    sectionTitle("إحصائيات البطولة", y, "📈");
    y += 64;
    const statCards = [
      ["⚽ إجمالي الأهداف", stats.totalGoals],
      ["🎯 أكثر تسجيلًا", stats.topScorer ? `${stats.topScorer.memberName} (${stats.topScorer.goalsFor})` : "-"],
      ["🛡️ أفضل دفاع", stats.bestDefense ? `${stats.bestDefense.memberName} (${stats.bestDefense.goalsAgainst})` : "-"],
      ["🥅 الأكثر استقبالًا", stats.mostConceded ? `${stats.mostConceded.memberName} (${stats.mostConceded.goalsAgainst})` : "-"],
      ["🔥 الأكثر فوزًا", stats.mostWins ? `${stats.mostWins.memberName} (${stats.mostWins.wins})` : "-"],
      ["✅ المباريات المسجلة", stats.matchesPlayed || 0],
    ];
    const statW = (contentW - 24) / 3;
    statCards.forEach((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const x = width - margin - statW - col * (statW + 12);
      const sy = y + row * 76;
      roundRect(ctx, x, sy, statW, 62, 18);
      ctx.fillStyle = "rgba(4,12,28,.78)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.16)";
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#94A3B8";
      ctx.font = "900 15px Tahoma, Arial";
      ctx.fillText(item[0], x + statW / 2, sy + 22);
      ctx.fillStyle = "#EDF0FF";
      ctx.font = "900 20px Tahoma, Arial";
      ctx.fillText(fitText(item[1], statW - 20, "900 20px Tahoma, Arial"), x + statW / 2, sy + 48);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#6270A0";
    ctx.font = "800 22px Tahoma, Arial";
    ctx.fillText(exportDateTimeLabel(), width / 2, height - 30);
    const link = document.createElement("a");
    link.download = safeFileName((competition.name || "البطولة") + "-تفاصيل-كاملة") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error("download full competition details image failed", err);
  }
}

export async function drawFifaGroupSuperCupFinalImage({ competition = {}, config = {}, trophyMap = {}, filename = "fifa-group-super-cup.png" }) {
  if (typeof document === "undefined") return;
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const finalMatch = matches.find((match) => clean(match.phase || "") === "final") || matches[0] || {};
  const completed = clean(finalMatch.resultStatus || finalMatch.status) === "completed";
  const winnerName = clean(finalMatch.winnerName || "");
  const homeWinner = winnerName && same(winnerName, finalMatch.homeName);
  const awayWinner = winnerName && same(winnerName, finalMatch.awayName);
  const scoreText = completed ? `${finalMatch.homeGoals} - ${finalMatch.awayGoals}` : "-";
  const pensText = completed && finalMatch.homePens !== null && finalMatch.homePens !== undefined && finalMatch.awayPens !== null && finalMatch.awayPens !== undefined ? `ترجيح ${finalMatch.homePens} - ${finalMatch.awayPens}` : "";
  const width = 1200;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#02071A");
  gradient.addColorStop(0.5, "#040E25");
  gradient.addColorStop(1, "#030918");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,230,118,0.12)";
  ctx.beginPath(); ctx.arc(130, 100, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,212,255,0.07)";
  ctx.beginPath(); ctx.arc(1080, 85, 220, 0, Math.PI * 2); ctx.fill();

  const compLogo = await loadCanvasImage(competitionLogoUrl(competition || {}, config, trophyMap));
  if (compLogo) {
    ctx.save();
    roundRect(ctx, width - 150, 34, 88, 88, 24);
    ctx.clip();
    ctx.drawImage(compLogo, width - 150, 34, 88, 88);
    ctx.restore();
  }
  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  if (brandLogo) {
    ctx.save();
    roundRect(ctx, 58, 38, 78, 78, 22);
    ctx.clip();
    ctx.drawImage(brandLogo, 58, 38, 78, 78);
    ctx.restore();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 50px Tahoma, Arial";
  ctx.fillText((competition.name || "كأس السوبر") + " - النهائي", width - (compLogo ? 170 : 58), 78);

  roundRect(ctx, 76, 160, 1048, 430, 32);
  ctx.fillStyle = "rgba(4,12,28,.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(250,204,21,.32)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fde68a";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText("النهائي", width / 2, 210);

  const cardX = 150;
  const cardY = 258;
  const cardW = 900;
  const cardH = 170;
  roundRect(ctx, cardX, cardY, cardW, cardH, 26);
  ctx.fillStyle = "rgba(0,230,118,.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.32)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "right";
  ctx.font = homeWinner ? "900 36px Tahoma, Arial" : "900 32px Tahoma, Arial";
  ctx.fillStyle = homeWinner ? "#a8f0cd" : "#EDF0FF";
  ctx.fillText(finalMatch.homeName || "-", cardX + cardW - 44, cardY + 62);
  ctx.font = awayWinner ? "900 36px Tahoma, Arial" : "900 32px Tahoma, Arial";
  ctx.fillStyle = awayWinner ? "#a8f0cd" : "#EDF0FF";
  ctx.fillText(finalMatch.awayName || "-", cardX + cardW - 44, cardY + 126);

  ctx.textAlign = "center";
  ctx.font = "1000 46px Tahoma, Arial";
  ctx.fillStyle = "#00E676";
  ctx.fillText(scoreText, cardX + 132, cardY + 76);
  ctx.font = "900 20px Tahoma, Arial";
  ctx.fillText(finalMatch.gameTitle || "PES 2017", cardX + 132, cardY + 112);
  if (pensText) {
    ctx.fillStyle = "#a8f0cd";
    ctx.font = "900 20px Tahoma, Arial";
    ctx.fillText(pensText, cardX + 132, cardY + 142);
  }

  if (winnerName) {
    roundRect(ctx, 365, 462, 470, 64, 22);
    ctx.fillStyle = "rgba(34,197,94,.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(34,197,94,.28)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = "#a8f0cd";
    ctx.font = "900 26px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText("بطل السوبر: " + winnerName, width / 2, 503);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 22px Tahoma, Arial";
  ctx.fillText(exportDateTimeLabel(), width / 2, height - 32);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function drawFifaGroupBracketImage({ competition = {}, config = {}, trophyMap = {}, filename = "fifa-group-bracket.png" }) {
  if (typeof document === "undefined") return;
  const typeKey = competitionTypeKey(competition.type || "");
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const bracketMatches = sortedCompetitionMatchesForSchedule(competition).filter((match) => clean(match.phase || "") !== "group");
  const grouped = competitionKnockoutColumnsForExport({ ...competition, matches: bracketMatches }, bracketMatches)
    .map((column, index) => ({ ...column, round: index + 1, label: column.title || column.label }));
  const width = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  const cardHeight = 108;
  const gapCard = 16;
  const columnGap = 18;
  const panelTop = 140;
  const panelBottomPad = 76;
  const panelHeight = 560;
  const height = panelTop + panelHeight + panelBottomPad;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#02071A");
  gradient.addColorStop(0.5, "#040E25");
  gradient.addColorStop(1, "#030918");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,230,118,0.12)";
  ctx.beginPath(); ctx.arc(130, 100, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,212,255,0.07)";
  ctx.beginPath(); ctx.arc(1080, 90, 220, 0, Math.PI * 2); ctx.fill();

  const title = (competition.name || "ملحق الدوري") + " - الأدوار الإقصائية";
  const compLogo = await loadCanvasImage(competitionLogoUrl(competition || {}, config, trophyMap));
  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));

  const hCX = 40, hCY = 24, hCW = width - 80, hCH = 100;
  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, hCX, hCY, hCW, hCH, 22); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.26)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hCX, hCY, hCW, hCH, 22); ctx.stroke();
  const scanG2 = ctx.createLinearGradient(hCX, 0, hCX + hCW, 0);
  scanG2.addColorStop(0, "transparent"); scanG2.addColorStop(0.5, "#00E676"); scanG2.addColorStop(1, "transparent");
  ctx.fillStyle = scanG2; ctx.fillRect(hCX, hCY, hCW, 2);

  if (brandLogo) {
    ctx.save(); roundRect(ctx, hCX + 20, hCY + 16, 68, 68, 16); ctx.clip();
    ctx.drawImage(brandLogo, hCX + 20, hCY + 16, 68, 68); ctx.restore();
  }
  if (compLogo) {
    ctx.save(); roundRect(ctx, hCX + hCW - 88, hCY + 16, 68, 68, 16); ctx.clip();
    ctx.drawImage(compLogo, hCX + hCW - 88, hCY + 16, 68, 68); ctx.restore();
  }
  const titleX = compLogo ? hCX + hCW - 110 : hCX + hCW - 20;
  ctx.fillStyle = "#EDF0FF"; ctx.font = "900 44px Tahoma, Arial"; ctx.textAlign = "right";
  ctx.fillText(title, titleX, hCY + 68);

  const columnCount = Math.max(1, grouped.length);
  const usableWidth = width - 110;
  const columnWidth = Math.floor((usableWidth - (columnGap * (columnCount - 1))) / columnCount);
  const startX = width - 34 - columnWidth;
  grouped.forEach((group, colIndex) => {
    const x = startX - colIndex * (columnWidth + columnGap);
    const isFinalRound = ["world_cup", "champions_league"].includes(typeKey) || leagueGroupsMode ? clean(group.key) === "final" : colIndex === columnCount - 1;
    roundRect(ctx, x, panelTop, columnWidth, panelHeight, 22);
    ctx.fillStyle = isFinalRound ? "rgba(250,204,21,.10)" : "rgba(4,12,28,.85)";
    ctx.fill();
    ctx.strokeStyle = isFinalRound ? "rgba(250,204,21,.30)" : "rgba(0,230,118,.18)";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = isFinalRound ? "#fde68a" : "#EDF0FF";
    ctx.font = "900 22px Tahoma, Arial";
    ctx.fillText(group.label || roundLabelForBracket(group.round, grouped.length), x + columnWidth / 2, panelTop + 34);

    const cardsAreaTop = panelTop + 54;
    const cardsAreaHeight = panelHeight - 84;
    const stackHeight = group.matches.length * cardHeight + Math.max(0, group.matches.length - 1) * gapCard;
    const startY = cardsAreaTop + Math.max(0, (cardsAreaHeight - stackHeight) / 2);

    group.matches.forEach((match, rowIndex) => {
      const y = startY + rowIndex * (cardHeight + gapCard);
      const completed = clean(match.resultStatus || match.status) === "completed";
      const score = completed ? `${match.homeGoals} - ${match.awayGoals}` : "-";
      const pens = completed && match.homePens !== null && match.homePens !== undefined && match.awayPens !== null && match.awayPens !== undefined ? `ترجيح ${match.homePens} - ${match.awayPens}` : "";
      const winnerName = clean(match.winnerName || "");
      const homeWinner = winnerName && same(winnerName, match.homeName);
      const awayWinner = winnerName && same(winnerName, match.awayName);
      roundRect(ctx, x + 14, y, columnWidth - 28, cardHeight, 18);
      ctx.fillStyle = isFinalRound ? "rgba(4,12,28,.90)" : completed ? "rgba(0,230,118,.10)" : "rgba(4,12,28,.84)";
      ctx.fill();
      ctx.strokeStyle = isFinalRound ? "rgba(250,204,21,.34)" : completed ? "rgba(0,230,118,.28)" : "rgba(0,230,118,.12)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.font = homeWinner ? "900 24px Tahoma, Arial" : "900 22px Tahoma, Arial";
      ctx.fillStyle = homeWinner ? "#a8f0cd" : "#EDF0FF";
      ctx.fillText(match.homeName || "-", x + columnWidth - 34, y + 36);
      ctx.font = awayWinner ? "900 24px Tahoma, Arial" : "900 22px Tahoma, Arial";
      ctx.fillStyle = awayWinner ? "#a8f0cd" : "#EDF0FF";
      ctx.fillText(match.awayName || "-", x + columnWidth - 34, y + 78);

      ctx.textAlign = "center";
      ctx.font = "1000 28px Tahoma, Arial";
      ctx.fillStyle = "#00E676";
      ctx.fillText(score, x + 76, y + 52);
      ctx.font = "800 15px Tahoma, Arial";
      ctx.fillStyle = "#00E676";
      ctx.fillText(match.gameTitle || "PES 2017", x + 76, y + 76);
      ctx.font = "800 14px Tahoma, Arial";
      ctx.fillStyle = pens ? "#a8f0cd" : "#6270A0";
      ctx.fillText(pens || (winnerName ? `الفائز: ${winnerName}` : (completed ? "مكتملة" : "بانتظار النتيجة")), x + 76, y + 96);
    });
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 22px Tahoma, Arial";
  ctx.fillText(exportDateTimeLabel(), width / 2, height - 28);
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function drawFifaGroupTableImage({ title, subtitle = "", headers = [], rows = [], rowStyles = [], filename = "fifa-group.png", footer = "", logoUrl = "", competition = null, trophyMap = {} }) {
  if (typeof document === "undefined") return;
  const width = 1200;
  const rowHeight = 54;
  const headerHeight = 190;
  const footerHeight = 70;
  const height = Math.max(420, headerHeight + rowHeight * (rows.length + 1) + footerHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#02071A"); gradient.addColorStop(0.5, "#040E25"); gradient.addColorStop(1, "#030918");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0,230,118,0.12)";
  ctx.beginPath(); ctx.arc(170, 90, 180, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(139,92,246,0.10)";
  ctx.beginPath(); ctx.arc(1050, 80, 210, 0, Math.PI * 2); ctx.fill();

  const compLogo = competition ? await loadCanvasImage(competitionLogoUrl(competition, {}, trophyMap)) : null;
  const brandLogo = await loadCanvasImage(logoUrl);

  const hCX3 = 40, hCY3 = 24, hCW3 = width - 80, hCH3 = subtitle ? 116 : 96;
  ctx.fillStyle = "rgba(4,12,28,.92)";
  roundRect(ctx, hCX3, hCY3, hCW3, hCH3, 22); ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.26)"; ctx.lineWidth = 1.5;
  roundRect(ctx, hCX3, hCY3, hCW3, hCH3, 22); ctx.stroke();
  const scanGT = ctx.createLinearGradient(hCX3, 0, hCX3 + hCW3, 0);
  scanGT.addColorStop(0, "transparent"); scanGT.addColorStop(0.5, "#00E676"); scanGT.addColorStop(1, "transparent");
  ctx.fillStyle = scanGT; ctx.fillRect(hCX3, hCY3, hCW3, 2);

  if (brandLogo) {
    ctx.save(); roundRect(ctx, hCX3 + 20, hCY3 + 14, 68, 68, 16); ctx.clip();
    ctx.drawImage(brandLogo, hCX3 + 20, hCY3 + 14, 68, 68); ctx.restore();
  }
  if (compLogo) {
    ctx.save(); roundRect(ctx, hCX3 + hCW3 - 88, hCY3 + 14, 68, 68, 16); ctx.clip();
    ctx.drawImage(compLogo, hCX3 + hCW3 - 88, hCY3 + 14, 68, 68); ctx.restore();
  }
  const titleX3 = compLogo ? hCX3 + hCW3 - 110 : hCX3 + hCW3 - 20;
  ctx.textAlign = "right";
  ctx.fillStyle = "#EDF0FF"; ctx.font = "900 44px Tahoma, Arial";
  ctx.fillText(title, titleX3, hCY3 + 60);
  if (subtitle) {
    ctx.fillStyle = "#00E676"; ctx.font = "800 22px Tahoma, Arial";
    ctx.fillText(subtitle, titleX3, hCY3 + 96);
  }

  const margin = 48;
  const tableWidth = width - margin * 2;
  const y0 = headerHeight;
  const colCount = Math.max(1, headers.length);
  const colWidth = tableWidth / colCount;
  const headerY = y0;
  ctx.fillStyle = "rgba(0,230,118,0.18)";
  roundRect(ctx, margin, headerY, tableWidth, rowHeight, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,0.30)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "800 22px Tahoma, Arial";
  headers.forEach((head, i) => {
    ctx.textAlign = "center";
    ctx.fillText(String(head), margin + tableWidth - colWidth * i - colWidth / 2, headerY + 35);
  });

  rows.forEach((row, rIndex) => {
    const y = headerY + rowHeight * (rIndex + 1) + 8;
    const rowStyle = rowStyles[rIndex] || {};
    ctx.fillStyle = rowStyle.fill || (rIndex % 2 === 0 ? "rgba(4,12,28,0.80)" : "rgba(6,15,34,0.60)");
    roundRect(ctx, margin, y, tableWidth, rowHeight - 4, 16);
    ctx.fill();
    if (rowStyle.stroke) {
      ctx.strokeStyle = rowStyle.stroke;
      ctx.lineWidth = rowStyle.lineWidth || 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(0,230,118,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = "#EDF0FF";
    ctx.font = "700 21px Tahoma, Arial";
    row.forEach((cell, i) => {
      ctx.textAlign = "center";
      ctx.fillText(String(cell ?? "-"), margin + tableWidth - colWidth * i - colWidth / 2, y + 34);
    });
  });

  if (footer) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#6270A0";
    ctx.font = "700 20px Tahoma, Arial";
    ctx.fillText(footer, width / 2, height - 30);
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function downloadMyProfileSummaryImage({
  config = {},
  member = {},
  players = [],
  balance = 0,
  trophiesCount = 0,
  proCount = 0,
  trophyGroups = [],
  contracts = [],
  memberId = "",
  exportLabel = "بطاقة العضو النشط في الموسم",
  fileNamePrefix = "FIFA-GROUP-MY-PROFILE",
} = {}) {
  const W = 1080;
  const PAD = 44;
  const CARD_R = 32;
  const HERO_H = 330;
  const trophyItemsForLayout = Array.isArray(trophyGroups) ? trophyGroups.filter((item) => toNumber(item.count) > 0) : [];
  const TROPHY_COLS = 6;
  const TROPHY_ROW_H = 76;
  const trophyRowsForLayout = Math.max(1, Math.ceil(trophyItemsForLayout.length / TROPHY_COLS));
  const TROPHY_H = 82 + trophyRowsForLayout * TROPHY_ROW_H;
  const COL_GAP = 14;
  const ROW_H = 46;
  const visibleCount = Math.min(34, (players || []).length);
  const playerRows = Math.ceil(visibleCount / 2);
  const LIST_TOP = PAD + HERO_H + TROPHY_H + 36;
  const LIST_H = 72 + playerRows * ROW_H + ((players || []).length > visibleCount ? 42 : 0);
  const FOOTER_H = 68;
  const H = LIST_TOP + LIST_H + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#02071A");
  bg.addColorStop(0.5, "#040E25");
  bg.addColorStop(1, "#030918");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const g1 = ctx.createRadialGradient(W - 150, 120, 0, W - 150, 120, 310);
  g1.addColorStop(0, "rgba(0,230,118,.18)");
  g1.addColorStop(1, "transparent");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(120, H * .68, 0, 120, H * .68, 260);
  g2.addColorStop(0, "rgba(0,212,255,.10)");
  g2.addColorStop(1, "transparent");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  const memberName = member?.name || member?.memberName || "عضو FIFA GROUP";
  const teamLabel = member?.team || member?.club || member?.teamName || "";
  const nationalLabel = member?.nationalteam || member?.nationalTeam || member?.national || "";
  const teamLogoUrl = member?.teamlogo || member?.teamLogo || member?.clubLogo || "";
  const nationalLogoUrl = member?.nationallogo || member?.nationalLogo || member?.flag || "";

  const heroX = PAD;
  const heroY = PAD;
  const heroW = W - PAD * 2;
  const heroH = HERO_H;
  ctx.fillStyle = "rgba(4,12,28,.94)";
  roundRect(ctx, heroX, heroY, heroW, heroH, CARD_R);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.30)";
  ctx.lineWidth = 1.6;
  roundRect(ctx, heroX, heroY, heroW, heroH, CARD_R);
  ctx.stroke();

  const scan = ctx.createLinearGradient(heroX, 0, heroX + heroW, 0);
  scan.addColorStop(0, "rgba(0,230,118,0)");
  scan.addColorStop(.5, "#00E676");
  scan.addColorStop(1, "rgba(0,230,118,0)");
  ctx.fillStyle = scan;
  ctx.fillRect(heroX + 26, heroY, heroW - 52, 3);

  const brandLogo = await loadCanvasImage(exportBrandLogoUrl(config));
  if (brandLogo) {
    ctx.save();
    roundRect(ctx, heroX + 32, heroY + 34, 72, 72, 18);
    ctx.clip();
    ctx.drawImage(brandLogo, heroX + 32, heroY + 34, 72, 72);
    ctx.restore();
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#00E676";
  ctx.font = "900 28px Tahoma, Arial";
  ctx.fillText(config.mainTitle || "FIFA GROUP", heroX + 118, heroY + 78);

  const avatarSize = 150;
  const avatarX = heroX + heroW - 48 - avatarSize;
  const avatarY = heroY + 64;
  const avatarImg = await loadCanvasImage(member?.avatar || member?.image || member?.photo || "");
  const acx = avatarX + avatarSize / 2;
  const acy = avatarY + avatarSize / 2;
  const ring = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  ring.addColorStop(0, "#00E676");
  ring.addColorStop(.5, "#00D4FF");
  ring.addColorStop(1, "#00E676");
  ctx.strokeStyle = ring;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(acx, acy, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(acx, acy, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  else {
    const av = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    av.addColorStop(0, "#07122A");
    av.addColorStop(1, "#0D1E42");
    ctx.fillStyle = av;
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = "#00E676";
    ctx.font = "900 76px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(memberName).slice(0, 1), acx, acy + 26);
  }
  ctx.restore();

  const textRight = avatarX - 34;
  const nameG = ctx.createLinearGradient(heroX + 260, 0, textRight, 0);
  nameG.addColorStop(0, "#FFFFFF");
  nameG.addColorStop(.55, "#D5FFF0");
  nameG.addColorStop(1, "#00E676");
  ctx.textAlign = "right";
  ctx.fillStyle = nameG;
  ctx.font = "900 78px Tahoma, Arial";
  ctx.fillText(memberName, textRight, heroY + 122);

  function chip(text, rightX, y) {
    if (!text) return 0;
    ctx.font = "900 20px Tahoma, Arial";
    const tw = ctx.measureText(text).width;
    const cw = Math.min(tw + 32, 220);
    ctx.fillStyle = "rgba(255,255,255,.065)";
    roundRect(ctx, rightX - cw, y, cw, 38, 19);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    roundRect(ctx, rightX - cw, y, cw, 38, 19);
    ctx.stroke();
    ctx.fillStyle = "#BDC5DE";
    ctx.textAlign = "right";
    ctx.fillText(text, rightX - 16, y + 26);
    return cw + 10;
  }
  let chipX = textRight;
  chipX -= chip(teamLabel || "بدون فريق", chipX, heroY + 142);
  chip(nationalLabel || "بدون منتخب", chipX, heroY + 142);

  let logoX = textRight;
  const smallLogo = 38;
  const tLogo = await loadCanvasImage(teamLogoUrl);
  const nLogo = await loadCanvasImage(nationalLogoUrl);
  if (tLogo) {
    ctx.drawImage(tLogo, logoX - smallLogo, heroY + 194, smallLogo, smallLogo);
    logoX -= smallLogo + 12;
  }
  if (nLogo) ctx.drawImage(nLogo, logoX - smallLogo, heroY + 194, smallLogo, smallLogo);

  const statY = heroY + 250;
  const statW = heroW / 3;
  const heroStats = [
    { label: "اللاعبون", value: formatLatinNumber((players || []).length), color: "#00E676" },
    { label: "البطولات", value: formatLatinNumber(trophiesCount || 0), color: "#A855F7" },
    { label: "الرصيد", value: formatMoney(balance), color: "#00E676" },
  ];
  ctx.fillStyle = "rgba(0,230,118,.12)";
  ctx.fillRect(heroX, statY - 16, heroW, 1);
  heroStats.forEach((item, idx) => {
    const x = heroX + idx * statW;
    if (idx > 0) {
      ctx.fillStyle = "rgba(0,230,118,.10)";
      ctx.fillRect(x, statY, 1, 58);
    }
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillStyle = item.color;
    ctx.font = "900 34px Tahoma, Arial";
    ctx.fillText(String(item.value || "-"), x + statW / 2, statY + 26);
    ctx.direction = "rtl";
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 18px Tahoma, Arial";
    ctx.fillText(item.label, x + statW / 2, statY + 56);
  });

  const trophyX = PAD;
  const trophyY = PAD + HERO_H + 16;
  const trophyW = W - PAD * 2;
  ctx.fillStyle = "rgba(4,12,28,.78)";
  roundRect(ctx, trophyX, trophyY, trophyW, TROPHY_H - 16, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,230,118,.18)";
  ctx.lineWidth = 1.2;
  roundRect(ctx, trophyX, trophyY, trophyW, TROPHY_H - 16, 28);
  ctx.stroke();

  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 28px Tahoma, Arial";
  ctx.textAlign = "right";
  ctx.fillText("سجل البطولات", trophyX + trophyW - 22, trophyY + 42);

  const trophyItems = (Array.isArray(trophyGroups) ? trophyGroups : []).filter((item) => toNumber(item.count) > 0);
  const trophyImages = await Promise.all(trophyItems.map((item) => loadCanvasImage(item.image || "")));
  const itemW = Math.floor((trophyW - 44) / TROPHY_COLS);
  const itemH = 60;
  const gridRight = trophyX + trophyW - 22;
  const gridTop = trophyY + 62;
  trophyItems.forEach((item, index) => {
    const col = index % TROPHY_COLS;
    const row = Math.floor(index / TROPHY_COLS);
    const ixRight = gridRight - col * itemW;
    const ix = ixRight - itemW + 6;
    const iy = gridTop + row * TROPHY_ROW_H;
    ctx.fillStyle = "rgba(255,255,255,.04)";
    roundRect(ctx, ix, iy, itemW - 10, itemH, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,230,118,.10)";
    roundRect(ctx, ix, iy, itemW - 10, itemH, 18);
    ctx.stroke();
    const img = trophyImages[index];
    if (img) ctx.drawImage(img, ixRight - 56, iy + 8, 42, 42);
    else {
      ctx.fillStyle = "rgba(0,230,118,.10)";
      roundRect(ctx, ixRight - 56, iy + 8, 42, 42, 12);
      ctx.fill();
      ctx.fillStyle = "#00E676";
      ctx.font = "700 18px Tahoma, Arial";
      ctx.textAlign = "center";
      ctx.fillText("🏆", ixRight - 35, iy + 35);
    }
    ctx.direction = "ltr";
    ctx.fillStyle = "#00E676";
    ctx.font = "900 18px Tahoma, Arial";
    ctx.textAlign = "left";
    ctx.fillText(formatLatinNumber(item.count || 0), ix + 12, iy + 25);
    ctx.direction = "rtl";
    ctx.fillStyle = "#9BA0C0";
    ctx.font = "800 12px Tahoma, Arial";
    ctx.textAlign = "right";
    const label = String(item.name || item.trophyName || item.label || "بطولة");
    ctx.fillText(label.length > 14 ? label.slice(0, 13) + "…" : label, ixRight - 62, iy + 44);
  });
  if (!trophyItems.length) {
    ctx.fillStyle = "#6270A0";
    ctx.font = "800 18px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText("لا توجد بطولات مسجلة", trophyX + trophyW / 2, trophyY + 84);
  }

  const listX = PAD;
  const listY = LIST_TOP;
  const listW = W - PAD * 2;
  ctx.fillStyle = "#EDF0FF";
  ctx.font = "900 42px Tahoma, Arial";
  ctx.textAlign = "right";
  ctx.fillText("قائمة اللاعبين", W - PAD, listY + 38);
  ctx.fillStyle = "#6270A0";
  ctx.font = "800 22px Tahoma, Arial";
  ctx.textAlign = "left";
  ctx.fillText(`${formatLatinNumber((players || []).length)} لاعب`, PAD, listY + 38);

  const colW = (listW - COL_GAP) / 2;
  const columns = [
    { x: listX + colW + COL_GAP, start: 0 },
    { x: listX, start: Math.ceil(visibleCount / 2) },
  ];
  const half = Math.ceil(visibleCount / 2);
  columns.forEach((col, colIndex) => {
    const count = colIndex === 0 ? half : visibleCount - half;
    for (let i = 0; i < count; i += 1) {
      const playerIndex = col.start + i;
      const player = players[playerIndex];
      if (!player) continue;
      const ry = listY + 58 + i * ROW_H;
      ctx.fillStyle = playerIndex % 2 === 0 ? "rgba(4,12,28,.84)" : "rgba(6,15,34,.64)";
      roundRect(ctx, col.x, ry, colW, ROW_H - 5, 13);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,230,118,.08)";
      ctx.lineWidth = 1;
      roundRect(ctx, col.x, ry, colW, ROW_H - 5, 13);
      ctx.stroke();

      const ratingW = 42;
      const rG = ctx.createLinearGradient(col.x + 8, ry + 5, col.x + 50, ry + ROW_H - 10);
      rG.addColorStop(0, "#00E676");
      rG.addColorStop(1, "#00D4FF");
      ctx.fillStyle = rG;
      roundRect(ctx, col.x + 8, ry + 7, ratingW, ROW_H - 19, 9);
      ctx.fill();
      ctx.fillStyle = "#02030A";
      ctx.font = "900 16px Tahoma, Arial";
      ctx.textAlign = "center";
      ctx.direction = "ltr";
      ctx.fillText(formatLatinNumber(player.rating || "-"), col.x + 8 + ratingW / 2, ry + 28);
      ctx.direction = "rtl";

      ctx.fillStyle = "#EDF0FF";
      ctx.font = "900 18px Tahoma, Arial";
      ctx.textAlign = "right";
      const name = `${formatLatinNumber(playerIndex + 1)}. ${player.name || "لاعب"}`;
      const maxName = name.length > 25 ? name.slice(0, 24) + "…" : name;
      ctx.fillText(maxName, col.x + colW - 10, ry + 24);

      const kind = getPlayerRosterKindLabel(player, contracts, memberId);
      const meta = `${player.position || "-"} • ${kind}`;
      ctx.fillStyle = "#9BA0C0";
      ctx.font = "800 14px Tahoma, Arial";
      ctx.textAlign = "left";
      ctx.fillText(meta.length > 25 ? meta.slice(0, 24) + "…" : meta, col.x + 58, ry + 24);
    }
  });

  if ((players || []).length > visibleCount) {
    ctx.fillStyle = "#00E676";
    ctx.font = "800 19px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText(`+ ${formatLatinNumber((players || []).length - visibleCount)} لاعب إضافي`, W / 2, listY + 58 + playerRows * ROW_H + 26);
  }

  const issuedAt = new Date();
  const pad2 = (value) => String(value).padStart(2, "0");
  const issueDate = `${issuedAt.getFullYear()}/${pad2(issuedAt.getMonth() + 1)}/${pad2(issuedAt.getDate())}`;
  const issueTime = `${pad2(issuedAt.getHours())}:${pad2(issuedAt.getMinutes())}`;
  const footerY = H - 28;
  ctx.fillStyle = "rgba(0,230,118,.18)";
  ctx.fillRect(PAD, footerY - 30, W - PAD * 2, 1);
  ctx.direction = "rtl";
  ctx.fillStyle = "#00E676";
  ctx.font = "900 18px Tahoma, Arial";
  ctx.textAlign = "right";
  ctx.fillText(`تاريخ الإصدار: ‎${issueDate}‎`, W - PAD, footerY);
  ctx.textAlign = "left";
  ctx.fillText(`وقت الإصدار: ‎${issueTime}‎`, PAD, footerY);
  ctx.direction = "rtl";

  triggerCanvasDownload(canvas, `${fileNamePrefix}-${memberName}.png`, "تعذر حفظ صورة العضو بسبب قيود تحميل الصور الخارجية.");
}

export async function downloadStudioMemberCardImage({ item, members = [], allTournaments = [], trophyMap = {}, config = {}, players = [], financeRows = [], contracts = [], statsMap = {}, rankedMembers = [] } = {}) {
  const member = item?.member || item || {};
  const memberId = cleanId(member.id || member.memberId || member.memberid || "");
  const variant = clean(item?.variant || item?.cardVariant || "");
  if (variant === "active") {
    const memberFinanceRows = Array.isArray(financeRows) ? getMemberFinanceRows(financeRows, memberId) : [];
    const balance = computeMemberBalance(memberFinanceRows, member.balance, memberId);
    return downloadActiveSeasonMemberCardImage({
      member,
      rankedMembers,
      financeRows,
      balance,
      seasonRank: item?.seasonRank,
      seasonTitles: item?.seasonTitles,
      config,
    });
  }
  if (variant === "historical") {
    return downloadHistoricalMemberCardImage({ member, members, allTournaments, statsMap, config });
  }
  const rows = (allTournaments || []).filter((row) => cleanId(row.winnerId || row.winnerid || "") && !same(row.winnerId || row.winnerid, "FIFA"));
  const totals = new Map();
  rows.forEach((row) => {
    const id = cleanId(row.winnerId || row.winnerid || "");
    totals.set(id, (totals.get(id) || 0) + 1);
  });
  const ordered = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const rank = Math.max(1, ordered.findIndex(([id]) => same(id, memberId)) + 1) || 1;
  const totalTitles = totals.get(memberId) || 0;
  const memberName = member.name || member.memberName || "عضو FIFA GROUP";
  const teamLabel = member.team || member.club || member.teamName || "FIFA GROUP";
  const nationalLabel = member.nationalteam || member.nationalTeam || member.national || "";
  const isActive = isActiveSeasonMember(member);
  const W = 900;
  const H = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.direction = "rtl";
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#020817");
  bg.addColorStop(.55, "#06162E");
  bg.addColorStop(1, "#030712");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const accent = isActive ? "#00E676" : "#A855F7";
  const accent2 = isActive ? "#00D4FF" : "#F472B6";
  const glow = ctx.createRadialGradient(W * .74, H * .18, 0, W * .74, H * .18, 430);
  glow.addColorStop(0, isActive ? "rgba(0,230,118,.26)" : "rgba(168,85,247,.25)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const cardX = 92;
  const cardY = 90;
  const cardW = W - 184;
  const cardH = H - 180;
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardGrad.addColorStop(0, isActive ? "#05251F" : "#20103A");
  cardGrad.addColorStop(.48, "#08152E");
  cardGrad.addColorStop(1, "#020817");
  ctx.fillStyle = cardGrad;
  roundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.fill();
  ctx.lineWidth = 3;
  const border = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  border.addColorStop(0, accent);
  border.addColorStop(.5, accent2);
  border.addColorStop(1, accent);
  ctx.strokeStyle = border;
  roundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "900 32px Tahoma, Arial";
  ctx.textAlign = "right";
  ctx.fillText(config.mainTitle || "FIFA GROUP", cardX + cardW - 46, cardY + 62);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(2,6,23,.55)";
  roundRect(ctx, cardX + 38, cardY + 32, 96, 48, 16);
  ctx.fill();
  ctx.strokeStyle = isActive ? "rgba(0,230,118,.38)" : "rgba(168,85,247,.40)";
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "900 24px Tahoma, Arial";
  ctx.fillText("#" + rank, cardX + 58, cardY + 64);
  const avatarSize = 250;
  const avatarX = cardX + (cardW - avatarSize) / 2;
  const avatarY = cardY + 145;
  const avatarImg = await loadCanvasImage(member.avatar || member.image || member.photo || "");
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 9, 0, Math.PI * 2);
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  else {
    ctx.fillStyle = "#0F1B35";
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = accent;
    ctx.font = "900 120px Tahoma, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(memberName).slice(0, 1), avatarX + avatarSize / 2, avatarY + 160);
  }
  ctx.restore();
  ctx.textAlign = "center";
  const nameGrad = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
  nameGrad.addColorStop(0, "#fff");
  nameGrad.addColorStop(.55, "#E9FFF7");
  nameGrad.addColorStop(1, accent);
  ctx.fillStyle = nameGrad;
  ctx.font = "900 68px Tahoma, Arial";
  ctx.fillText(memberName, cardX + cardW / 2, avatarY + avatarSize + 88);
  ctx.fillStyle = "#AAB4CC";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText(teamLabel, cardX + cardW / 2, avatarY + avatarSize + 132);
  if (nationalLabel) {
    ctx.font = "800 24px Tahoma, Arial";
    ctx.fillStyle = "#7DD3FC";
    ctx.fillText(nationalLabel, cardX + cardW / 2, avatarY + avatarSize + 168);
  }
  const statY = avatarY + avatarSize + 225;
  const statW = (cardW - 110) / 2;
  function drawStat(x, y, label, value, icon) {
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, x, y, statW, 132, 26);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "900 50px Tahoma, Arial";
    ctx.fillText(formatLatinNumber(value || 0), x + statW / 2, y + 62);
    ctx.fillStyle = "#AAB4CC";
    ctx.font = "900 22px Tahoma, Arial";
    ctx.fillText(icon + " " + label, x + statW / 2, y + 100);
  }
  drawStat(cardX + 40, statY, "بطولة", totalTitles, "🏆");
  drawStat(cardX + cardW - 40 - statW, statY, "الترتيب", rank, "#");
  const footerY = cardY + cardH - 190;
  ctx.fillStyle = "rgba(0,230,118,.09)";
  roundRect(ctx, cardX + 40, footerY, cardW - 80, 116, 28);
  ctx.fill();
  ctx.strokeStyle = isActive ? "rgba(0,230,118,.24)" : "rgba(168,85,247,.24)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ECFEFF";
  ctx.font = "900 30px Tahoma, Arial";
  ctx.fillText(isActive ? "عضو نشط في الموسم السادس" : "عضو تاريخي في FIFA GROUP", cardX + cardW / 2, footerY + 48);
  ctx.fillStyle = "#94A3B8";
  ctx.font = "800 20px Tahoma, Arial";
  ctx.fillText("بطاقة رسمية من استوديو FIFA GROUP", cardX + cardW / 2, footerY + 82);
  triggerCanvasDownload(canvas, `FIFA-STUDIO-MEMBER-CARD-${memberName}.png`);
}
