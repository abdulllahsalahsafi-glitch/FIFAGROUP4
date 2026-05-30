// ═══════════════════════════════════════════════════════════
// src/utils/data.js
// دوال البيانات والمنطق التجاري المستخرجة من App.jsx
// ═══════════════════════════════════════════════════════════

import { cleanId, same, toNumber, clean, normalizeKey, firstValue, splitIds } from './helpers';
import { normalizeImageUrl } from './ui';
import { getMemberName } from './admin.js';

// ─── Local helper: dateValue ─────────────────────────────
export function dateValue(date) {
  const match = String(date || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return 0;
  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

// ─── Local helper used by sortRecordsDesc ────────────────
function sortByDateDesc(a, b) {
  return (
    dateValue(b.date || b.createdAt || b.createdat) - dateValue(a.date || a.createdAt || a.createdat) ||
    toNumber(b.edition) - toNumber(a.edition)
  );
}

export function sortRecordsDesc(rows) {
  return (rows || []).slice().sort(sortByDateDesc);
}

export function trophySort(a, b) {
  if (toNumber(a.order) !== toNumber(b.order))
    return toNumber(a.order) - toNumber(b.order);
  return String(a.name || "").localeCompare(String(b.name || ""), "ar");
}

export function unique(items) {
  return Array.from(new Set(items));
}

export function normalizeDate(date) {
  const match = String(date || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return String(date || "");
  return `${Number(match[1])}/${Number(match[2])}/${Number(match[3])}`;
}

export function seasonNumber(seasonId) {
  const n = String(seasonId || "").match(/\d+/);
  return n ? Number(n[0]) : 999;
}

export function buildTrophyMap(rows) {
  const map = {};
  rows.forEach((row) => {
    const trophyId = cleanId(
      row.trophyid || row.id || row.trophy || row.trophy_id
    );
    if (!trophyId) return;
    map[trophyId] = {
      trophyId,
      name: row.name || row.trophyname || row.title || trophyId,
      image: normalizeImageUrl(
        row.image || row.logo || row.icon || row.trophyimage
      ),
      points: toNumber(row.points || row.point || row.score),
      order: toNumber(row.order || row.sort || row.rank),
    };
  });
  return map;
}

export function groupMemberTrophies(allTournaments, memberId, trophyMap) {
  const map = {};
  allTournaments
    .filter((item) => same(item.winnerId, memberId))
    .forEach((item) => {
      const key = cleanId(item.trophyId);
      if (!map[key]) {
        const info = trophyMap[key] || {};
        map[key] = {
          trophyId: key,
          name: info.name || item.name || key,
          image: info.image || item.image || "",
          count: 0,
          rows: [],
        };
      }
      map[key].count += 1;
      map[key].rows.push(item);
    });
  return Object.values(map)
    .map((group) => ({ ...group, rows: sortRecordsDesc(group.rows) }))
    .sort((a, b) => b.count - a.count || trophySort(a, b));
}

export function groupByTrophy(rows, trophyMap) {
  const map = {};
  rows.forEach((item) => {
    const key = cleanId(item.trophyId);
    if (!key) return;
    if (!map[key]) {
      const info = trophyMap[key] || {};
      map[key] = {
        trophyId: key,
        name: info.name || item.name || key,
        image: info.image || item.image || "",
        points: info.points || item.points || 0,
        order: info.order || item.order || 999,
        count: 0,
        rows: [],
      };
    }
    map[key].count += 1;
    map[key].rows.push(item);
  });
  return Object.values(map)
    .sort(trophySort)
    .map((group) => ({ ...group, rows: sortRecordsDesc(group.rows) }));
}

export function buildArchiveSeasons(seasons, allTournaments, trophyMap) {
  const fallback = unique(
    allTournaments.map((item) => item.seasonId).filter(Boolean)
  ).map((seasonId) => ({ seasonid: seasonId, seasonname: seasonId }));
  const list = seasons.length ? seasons : fallback;
  return list
    .map((season) => {
      const seasonId = cleanId(season.seasonid || season.id);
      const rows = allTournaments.filter((item) =>
        same(item.seasonId, seasonId)
      );
      const groups = groupByTrophy(rows, trophyMap);
      return {
        seasonId,
        seasonName: season.seasonname || season.name || seasonId,
        startDate: season.startdate || season.start || "",
        endDate: season.enddate || season.end || "",
        membersCount: season.memberscount || season.members || "",
        count: rows.length || toNumber(season.count),
        rows: sortRecordsDesc(rows),
        groups,
      };
    })
    .filter((season) => season.seasonId)
    .sort((a, b) => seasonNumber(b.seasonId) - seasonNumber(a.seasonId));
}

export function computeSeasonRanking(members, rows, trophyMap) {
  const map = {};
  members.forEach((member) => {
    const memberId = cleanId(member.id);
    if (memberId)
      map[memberId] = {
        memberId,
        name: member.name || memberId,
        team: member.team || "",
        avatar: member.avatar || "",
        teamLogo: member.teamlogo || "",
        nationalLogo: member.nationallogo || "",
        titles: 0,
        points: 0,
        rows: [],
      };
  });
  rows.forEach((row) => {
    const memberId = cleanId(row.winnerId);
    if (!memberId) return;
    if (!map[memberId])
      map[memberId] = {
        memberId,
        name: memberId,
        team: "",
        avatar: "",
        teamLogo: "",
        nationalLogo: "",
        titles: 0,
        points: 0,
        rows: [],
      };
    const trophy = trophyMap[cleanId(row.trophyId)] || {};
    map[memberId].titles += 1;
    map[memberId].points += toNumber(trophy.points || row.points || 1);
    map[memberId].rows.push(row);
  });
  return Object.values(map)
    .map((row) => ({ ...row, rows: sortRecordsDesc(row.rows) }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.titles - a.titles ||
        String(a.name).localeCompare(String(b.name), "ar")
    );
}

export function isFifaSystemMember(member) {
  return same(member?.id, "FIFA") || clean(member?.name) === "fifa";
}

export function isActiveSeasonMember(member) {
  if (!member || !cleanId(member.id) || isFifaSystemMember(member)) return false;
  const status = clean(
    member.status ??
      member.memberstatus ??
      member.active ??
      member.isactive ??
      ""
  );
  return ["active", "true", "yes", "1", "نشط", "فعال"].includes(status);
}

export function getActiveMembers(members) {
  const source = Array.isArray(members) ? members : [];
  const active = source.filter(isActiveSeasonMember);
  return active.length
    ? active
    : source.filter((member) => cleanId(member.id) && !isFifaSystemMember(member));
}

export function getPlayerStableId(player) {
  return cleanId(player?.playerid || player?.playerId || player?.id || player?.name);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

export function localDateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function transferWindowStatusLabel(row = {}) {
  const status = clean(row.status || "open");
  if (status === "open") return "مفتوحة";
  if (status === "closed") return "مغلقة";
  if (status === "cancelled") return "ملغاة";
  if (status === "ended" || status === "expired") return "منتهية";
  return row.status || "-";
}

export function rowBelongsToTransferWindow(row = {}, windowRow = {}) {
  if (!row || !windowRow) return false;
  const windowId = cleanId(windowRow.id || windowRow.windowId || "");
  const windowName = clean(windowRow.title || windowRow.name || "");
  if (windowId && (same(row.periodId, windowId) || same(row.marketExecutionWindowId, windowId) || same(row.transferWindowId, windowId) || same(row.relatedTransferWindowId, windowId))) return true;
  if (windowName && clean(row.periodName || row.marketExecutionWindowName || row.period || "") === windowName) return true;
  const rowDate = String(row.date || row.completedDate || row.releaseDate || row.releasedDate || "").slice(0, 10);
  const start = String(windowRow.startDate || "").slice(0, 10);
  const end = String(windowRow.endDate || "").slice(0, 10);
  if (rowDate && start && end) return rowDate >= start && rowDate <= end;
  return false;
}

export function hasRecord(row) {
  return cleanId(row.id) || cleanId(row.trophyid) || cleanId(row.edition);
}

export function getFinanceMemberId(row) {
  return cleanId(
    row?.memberid ||
      row?.memberId ||
      row?.member ||
      row?.member_id ||
      row?.membercode ||
      row?.playerid ||
      row?.userid ||
      row?.["رقمالعضو"] ||
      row?.["العضو"]
  );
}

export function getFinanceFromMemberId(row) {
  return cleanId(
    row?.frommemberid ||
      row?.fromMemberId ||
      row?.from_member_id ||
      row?.fromid ||
      row?.fromId ||
      row?.senderid ||
      row?.senderId ||
      row?.["من"] ||
      row?.["منالعضو"]
  );
}

export function getFinanceToMemberId(row) {
  return cleanId(
    row?.tomemberid ||
      row?.toMemberId ||
      row?.to_member_id ||
      row?.toid ||
      row?.toId ||
      row?.receiverid ||
      row?.receiverId ||
      row?.["إلى"] ||
      row?.["الى"] ||
      row?.["الىالعضو"] ||
      row?.["إلىالعضو"]
  );
}

// ─── Moved from App.jsx ──────────────────────────────────

export function archiveLookupKey(value) {
  return normalizeKey(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\/\|_\-.،,؛:()\[\]{}]+/g, "");
}

export function archiveKeyHasFinalContext(key) {
  const value = archiveLookupKey(key);
  return value.includes("final") || value.includes("نهائي") || value.includes("النهائي") || value.includes("الاخيره");
}

export function archiveKeyHasSide(key, side) {
  const value = archiveLookupKey(key);
  const markers = side === 1
    ? ["1", "اول", "الاول", "اولا", "p1", "player1", "member1", "team1", "side1", "طرفاول", "الطرفالاول", "فريقاول", "الفريقالاول", "لاعباول", "اللاعبالاول", "عضواول", "العضوالاول", "نهائي1", "final1", "الفائز", "winner", "champion"]
    : ["2", "ثاني", "الثاني", "ثانيا", "p2", "player2", "member2", "team2", "side2", "طرفثاني", "الطرفالثاني", "فريقثاني", "الفريقالثاني", "لاعبثاني", "اللاعبالثاني", "عضوثاني", "العضوالثاني", "نهائي2", "final2", "وصيف", "الوصيف", "الخاسر", "runner", "runnerup", "second"];
  return markers.some((marker) => value.includes(archiveLookupKey(marker)));
}

export function archiveKeyLooksLikeScore(key) {
  const value = archiveLookupKey(key);
  return value.includes("goal") || value.includes("score") || value.includes("اهداف") || value.includes("هدف") || value.includes("نتيجه") || value.includes("result");
}

export function getArchiveFinalSideValue(row = {}, side = 1) {
  const exact = side === 1
    ? firstValue(row,
        "finalplayer1id", "finalp1id", "finalist1id", "finalmember1id", "final1id",
        "finalplayer1", "finalp1", "finalist1", "finalmember1", "final1",
        "player1id", "player1", "member1id", "member1", "team1", "side1",
        "الطرفالأول", "الطرفالاول", "طرفأول", "طرفاول", "الفريقالأول", "الفريقالاول", "فريقأول", "فريقاول", "اللاعبالأول", "اللاعبالاول", "لاعبأول", "لاعباول", "العضوالأول", "العضوالاول", "عضوأول", "عضواول", "نهائي1", "النهائيالأول", "النهائيالاول"
      )
    : firstValue(row,
        "finalplayer2id", "finalp2id", "finalist2id", "finalmember2id", "final2id",
        "finalplayer2", "finalp2", "finalist2", "finalmember2", "final2",
        "player2id", "player2", "member2id", "member2", "team2", "side2",
        "الطرفالثاني", "طرفثاني", "الفريقالثاني", "فريقثاني", "اللاعبالثاني", "لاعبثاني", "العضوالثاني", "عضوثاني", "نهائي2", "النهائيالثاني",
        "runnerupid", "runnerup", "runner", "secondplaceid", "secondplace", "finalrunnerupid", "finalrunnerup", "وصيف", "الوصيف", "الخاسر", "خاسرالنهائي", "المركزالثاني"
      );
  if (exact) return exact;
  for (const [key, value] of Object.entries(row || {})) {
    if (value === undefined || value === null || String(value).trim() === "") continue;
    if (!archiveKeyHasFinalContext(key) || !archiveKeyHasSide(key, side) || archiveKeyLooksLikeScore(key)) continue;
    return value;
  }
  return "";
}

export function getArchiveFinalSideGoals(row = {}, side = 1) {
  const exact = side === 1
    ? firstValue(row, "finalplayer1goals", "finalp1goals", "final1goals", "player1goals", "member1goals", "team1goals", "goals1", "score1", "اهدافالأول", "اهدافالاول", "أهدافالأول", "أهدافالاول", "اهدافالطرفالأول", "اهدافالطرفالاول", "أهدافالطرفالأول", "أهدافالطرفالاول")
    : firstValue(row, "finalplayer2goals", "finalp2goals", "final2goals", "player2goals", "member2goals", "team2goals", "goals2", "score2", "اهدافالثاني", "أهدافالثاني", "اهدافالطرفالثاني", "أهدافالطرفالثاني");
  if (exact !== "") return exact;
  for (const [key, value] of Object.entries(row || {})) {
    if (value === undefined || value === null || String(value).trim() === "") continue;
    if (!archiveKeyHasFinalContext(key) || !archiveKeyHasSide(key, side) || !archiveKeyLooksLikeScore(key)) continue;
    return value;
  }
  return "";
}

export function getArchiveFinalResultValue(row = {}) {
  const exact = firstValue(row,
    "finalresult", "finalscore", "final", "finalmatchresult", "finalmatchscore", "resultfinal", "scorefinal",
    "النهائي", "نتيجةالنهائي", "نتيجهالنهائي", "نتيجةالمباراةالنهائية", "نتيجهالمباراهالنهائيه", "نتيجةالمباراةالنهائيه", "نتيجةنهائي", "نتيجهنهائي"
  );
  if (exact) return exact;
  for (const [key, value] of Object.entries(row || {})) {
    if (value === undefined || value === null || String(value).trim() === "") continue;
    const lookup = archiveLookupKey(key);
    if (archiveKeyHasFinalContext(key) && (lookup.includes("نتيجه") || lookup.includes("result") || lookup.includes("score"))) return value;
  }
  return "";
}

export function extractScorePairFromText(text = "") {
  const match = String(text || "").match(/(\d+)\s*(?:-|–|—|:|\/|\\)\s*(\d+)/);
  if (!match) return null;
  return { g1: toNumber(match[1]), g2: toNumber(match[2]) };
}

export function resolveArchiveMemberId(value, members = []) {
  const raw = cleanId(value);
  if (!raw || raw === "-") return "";
  const byId = (members || []).find((member) => same(member.id || member.memberId || member.memberid, raw));
  if (byId) return cleanId(byId.id || byId.memberId || byId.memberid);
  const byName = (members || []).find((member) => clean(member.name || member.memberName || member.membername) === clean(raw));
  if (byName) return cleanId(byName.id || byName.memberId || byName.memberid);
  return raw;
}

export function inferArchiveFinalFromText(tournament, members = []) {
  const text = String([tournament.finalResult, tournament.notes].filter(Boolean).join(" ") || "").trim();
  if (!text) return null;
  const scoreMatch = extractScorePairFromText(text);
  const orderedMembers = (members || [])
    .filter((member) => cleanId(member.id) && clean(member.name || ""))
    .map((member) => ({ id: cleanId(member.id), name: member.name || "", index: clean(text).indexOf(clean(member.name || "")) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index || String(b.name).length - String(a.name).length);
  const unique = [];
  orderedMembers.forEach((item) => {
    if (!unique.some((row) => same(row.id, item.id))) unique.push(item);
  });
  if (unique.length < 2 && tournament.winnerId) {
    const winnerId = resolveArchiveMemberId(tournament.winnerId, members);
    const winner = (members || []).find((member) => same(member.id, winnerId));
    if (winner && !unique.some((row) => same(row.id, winnerId))) unique.unshift({ id: winnerId, name: winner.name || winnerId, index: -1 });
  }
  if (unique.length < 2) return null;
  return {
    p1: unique[0].id,
    p2: unique[1].id,
    g1: scoreMatch ? scoreMatch.g1 : toNumber(tournament.finalPlayer1Goals),
    g2: scoreMatch ? scoreMatch.g2 : toNumber(tournament.finalPlayer2Goals),
  };
}

export function archiveLeagueSystemHasFinal(item = {}) {
  const systemText = clean([
    item.system,
    item.leagueSystem,
    item.leaguesystem,
    item.systemType,
    item.systemtype,
    item.format,
  ].filter(Boolean).join(" "));
  if (!systemText) return false;
  const normalized = systemText
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, "");
  return (
    normalized.includes("مجموعتين") ||
    normalized.includes("مجموعتان") ||
    normalized.includes("2مجموع") ||
    normalized.includes("twogroups") ||
    normalized.includes("groupsknockout") ||
    normalized.includes("league_two_groups")
  );
}

export function archiveTournamentCountsAsFinalStats(item = {}) {
  const trophyId = cleanId(item.trophyId || item.trophyid || item.trophy || "");
  const source = cleanId(item.source || "");
  const isLeagueArchive = source === "league" || trophyId === "league";
  if (!isLeagueArchive) return true;
  return archiveLeagueSystemHasFinal(item);
}

export function emptyMemberStats(memberId) {
  return {
    memberId: cleanId(memberId),
    finalsPlayed: 0,
    finalsWon: 0,
    finalsLost: 0,
    finalGoalsFor: 0,
    finalGoalsAgainst: 0,
    relegations: 0,
    finals: [],
    goalsForAgainst: {},
    goalsAgainstFrom: {},
    winsAgainst: {},
  };
}

export function addFinalForMember(
  stats,
  tournament,
  memberId,
  opponentId,
  goalsFor,
  goalsAgainst
) {
  const result = same(tournament.winnerId, memberId) ? "win" : "loss";
  stats.finals.push({ tournament, opponentId, goalsFor, goalsAgainst, result });
  stats.finalGoalsFor += goalsFor;
  stats.finalGoalsAgainst += goalsAgainst;
  stats.goalsForAgainst[opponentId] =
    (stats.goalsForAgainst[opponentId] || 0) + goalsFor;
  stats.goalsAgainstFrom[opponentId] =
    (stats.goalsAgainstFrom[opponentId] || 0) + goalsAgainst;
  if (result === "win")
    stats.winsAgainst[opponentId] = (stats.winsAgainst[opponentId] || 0) + 1;
}

export function computeMemberStats(members, tournaments) {
  const map = {};
  members.forEach((member) => {
    const id = cleanId(member.id);
    if (id) map[id] = emptyMemberStats(id);
  });
  tournaments.forEach((item) => {
    if (archiveTournamentCountsAsFinalStats(item)) {
      const inferredFinal = inferArchiveFinalFromText(item, members);
      const p1 = resolveArchiveMemberId(item.finalPlayer1Id || item.finalPlayer1Name || inferredFinal?.p1, members);
      const p2 = resolveArchiveMemberId(item.finalPlayer2Id || item.finalPlayer2Name || inferredFinal?.p2, members);
      const scorePair = extractScorePairFromText(item.finalResult || item.notes || "");
      const p1Goals = inferredFinal ? inferredFinal.g1 : (toNumber(item.finalPlayer1Goals) || (scorePair ? scorePair.g1 : 0));
      const p2Goals = inferredFinal ? inferredFinal.g2 : (toNumber(item.finalPlayer2Goals) || (scorePair ? scorePair.g2 : 0));
      if (p1 && p2 && p1 !== "-" && p2 !== "-") {
        if (!map[p1]) map[p1] = emptyMemberStats(p1);
        if (!map[p2]) map[p2] = emptyMemberStats(p2);
        addFinalForMember(
          map[p1],
          item,
          p1,
          p2,
          p1Goals,
          p2Goals
        );
        addFinalForMember(
          map[p2],
          item,
          p2,
          p1,
          p2Goals,
          p1Goals
        );
      }
    }
    if (item.source === "league") {
      splitIds(item.relegatedIds).forEach((memberId) => {
        if (!map[memberId]) map[memberId] = emptyMemberStats(memberId);
        map[memberId].relegations += 1;
      });
    }
  });
  Object.values(map).forEach((stats) => {
    stats.finalsPlayed = stats.finals.length;
    stats.finalsWon = stats.finals.filter(
      (item) => item.result === "win"
    ).length;
    stats.finalsLost = stats.finals.filter(
      (item) => item.result === "loss"
    ).length;
  });
  return map;
}

export function topMap(map, members) {
  const rows = Object.entries(map || {})
    .map(([id, value]) => ({ id, name: getMemberName(members, id), value }))
    .sort((a, b) => b.value - a.value);
  return rows[0] || null;
}

export function buildGoalsForMessage(stats, members, memberName) {
  const topGoals = topMap(stats.goalsForAgainst, members);
  const topWins = topMap(stats.winsAgainst, members);
  return {
    title: `أهداف ${memberName} في النهائيات`,
    body: "هذه الأرقام لا تحتسب ركلات الترجيح، وتعتمد فقط على أهداف الوقت/المباراة في النهائي.",
    rows: [
      {
        name: "أكثر عضو تلقى أهدافًا منه",
        value: topGoals ? `${topGoals.name} — ${topGoals.value}` : "لا يوجد",
      },
      {
        name: "أكثر عضو خسر منه في النهائيات",
        value: topWins ? `${topWins.name} — ${topWins.value}` : "لا يوجد",
      },
    ],
  };
}

export function buildGoalsAgainstMessage(stats, members, memberName) {
  const top = topMap(stats.goalsAgainstFrom, members);
  return {
    title: `أهداف تلقاها ${memberName}`,
    body: "هذه الأرقام لا تحتسب ركلات الترجيح.",
    rows: [
      {
        name: "أكثر عضو سجل عليه في النهائيات",
        value: top ? `${top.name} — ${top.value}` : "لا يوجد",
      },
    ],
  };
}

export function getActiveSeasonId(seasons, config) {
  const configId = cleanId(config.activeSeasonId);
  if (configId) return configId;
  const open = seasons.find((season) => !clean(season.enddate || season.end));
  return cleanId(open?.seasonid || open?.id || "S6");
}

export function findSeason(seasons, seasonId) {
  const row = seasons.find((season) =>
    same(season.seasonid || season.id, seasonId)
  );
  if (!row) return { seasonId, seasonName: seasonId };
  return {
    seasonId,
    seasonName: row.seasonname || row.name || seasonId,
    startDate: row.startdate || "",
    endDate: row.enddate || "",
    membersCount: row.memberscount || "",
  };
}

export function normalizeTournamentRow(row, source, trophyMap) {
  const trophyId = cleanId(
    row.trophyid || row.trophy || (source === "league" ? "league" : "")
  );
  const info = trophyMap[trophyId] || {};
  const id =
    row.id || `${trophyId}_${String(row.edition || "").padStart(3, "0")}`;
  const winnerRaw = firstValue(row, "winnerid", "memberid", "winner", "championid", "champion", "البطل", "الفائز", "الفائزبالنهائي", "بطل", "بطلالبطولة");
  const runnerUpRaw = firstValue(row, "runnerupid", "runnerup", "runner", "secondplaceid", "secondplace", "finalrunnerupid", "finalrunnerup", "وصيف", "الوصيف", "الخاسر", "خاسرالنهائي", "المركزالثاني");
  const finalPlayer1Raw = getArchiveFinalSideValue(row, 1) || winnerRaw;
  const finalPlayer2Raw = getArchiveFinalSideValue(row, 2) || runnerUpRaw;
  const finalResultRaw = getArchiveFinalResultValue(row);
  const finalScorePair = extractScorePairFromText(finalResultRaw || "");
  const finalPlayer1GoalsRaw = getArchiveFinalSideGoals(row, 1);
  const finalPlayer2GoalsRaw = getArchiveFinalSideGoals(row, 2);
  return {
    ...row,
    id,
    source,
    trophyId,
    name:
      info.name ||
      row.trophyname ||
      (trophyId === "league" ? "الدوري" : trophyId),
    image: info.image || row.image || "",
    points: info.points || toNumber(row.points),
    order: info.order || 999,
    edition: row.edition || row.version || "",
    winnerId: cleanId(winnerRaw),
    date: normalizeDate(row.date || row.tournamentdate || ""),
    seasonId: cleanId(row.seasonid || row.season),
    system: row.system || "",
    finalResult: finalResultRaw,
    finalPlayer1Id: cleanId(finalPlayer1Raw),
    finalPlayer1Name: cleanId(finalPlayer1Raw),
    finalPlayer1Goals: finalPlayer1GoalsRaw !== "" ? toNumber(finalPlayer1GoalsRaw) : (finalScorePair ? finalScorePair.g1 : 0),
    finalPlayer2Id: cleanId(finalPlayer2Raw),
    finalPlayer2Name: cleanId(finalPlayer2Raw),
    finalPlayer2Goals: finalPlayer2GoalsRaw !== "" ? toNumber(finalPlayer2GoalsRaw) : (finalScorePair ? finalScorePair.g2 : 0),
    relegatedIds: row.relegatedids || row.relegated || "",
    notes: row.notes || row.note || "",
  };
}

export function getTrophyDisplayName(trophyId) {
  const value = cleanId(trophyId);
  const names = {
    league: "الدوري",
    cup: "الكأس",
    ucl: "دوري الأبطال",
    super_local: "السوبر المحلي",
    super_continental: "السوبر القاري",
    confederation_cup: "كأس الكونفدرالية",
    world_cup: "كأس العالم",
    club_world_cup: "كأس العالم للأندية",
    confederations_cup: "كأس القارات",
    afc_cl: "أبطال آسيا",
    caf_cl: "أبطال أفريقيا",
    libertadores: "ليبرتادوريس",
    euro: "أمم أوروبا",
    copa_america: "كوبا أمريكا",
    asia_cup: "أمم آسيا",
    africa_cup: "أمم أفريقيا",
    arab_cup: "كأس العرب",
    concacaf_cl: "أبطال كونكاكاف",
  };
  return names[value] || "";
}

export function formatArchiveFinalText(record = {}, members = []) {
  const direct = String(record.finalResult || "").trim();
  if (direct && direct !== "-") return direct;

  const p1Raw = record.finalPlayer1Id || record.finalPlayer1Name || "";
  const p2Raw = record.finalPlayer2Id || record.finalPlayer2Name || "";
  const p1 = cleanId(p1Raw);
  const p2 = cleanId(p2Raw);
  if (p1 && p2 && p1 !== "-" && p2 !== "-") {
    const p1Name = getMemberName(members, p1);
    const p2Name = getMemberName(members, p2);
    const hasGoals =
      String(record.finalPlayer1Goals ?? "").trim() !== "" ||
      String(record.finalPlayer2Goals ?? "").trim() !== "";
    const score = hasGoals
      ? ` ${toNumber(record.finalPlayer1Goals)}-${toNumber(record.finalPlayer2Goals)} `
      : " ضد ";
    return `${p1Name}${score}${p2Name}`;
  }

  const notes = String(record.notes || "").trim();
  if (notes && notes !== "-" && notes.includes("النهائي")) return notes.replace(/^النهائي\s*\/\s*/, "");
  return "";
}
