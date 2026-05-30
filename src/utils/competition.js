// ═══════════════════════════════════════════════════════════
// src/utils/competition.js
// دوال البطولات المستخرجة من App.jsx (السطر 6595 – 10427)
// ═══════════════════════════════════════════════════════════

import { clean, cleanId, same, toNumber } from "./helpers.js";
import { normalizeImageUrl } from "./ui.js";

// ── دوال مساعدة داخلية (تُستخدم داخل هذا الملف) ────────────

function avatar(seed) {
  return (
    "https://api.dicebear.com/8.x/initials/svg?seed=" +
    encodeURIComponent(seed || "user")
  );
}

function getMemberName(membersOrParticipants, memberId) {
  const id = cleanId(memberId);
  if (!id) return "";
  const found = (membersOrParticipants || []).find(
    (item) => same(item.memberId || item.id, id)
  );
  return found?.memberName || found?.name || id;
}

export function isAbdullahLike(member = {}) {
  const id = cleanId(member.memberId || member.id);
  const name = String(member.memberName || member.name || "").replace(/\s+/g, "");
  return same(id, "1") || name.includes("عبدالله") || name.includes("عبداللّه") || name.includes("عبد الله".replace(/\s+/g, ""));
}

// ── الدوال العامة للبطولة ─────────────────────────────────

export function competitionTypeKey(type = "") {
  return clean(type || "league") || "league";
}

export function isLeagueGroupsCompetition(competition = {}) {
  if (competitionTypeKey(competition.type || "league") !== "league") return false;
  const markers = [competition.bracketMode, competition.roundsMode, competition.leagueFormat, competition.leagueGroupMode].map((item) => clean(item || ""));
  return markers.some((value) => ["league_two_groups_knockout", "two_groups", "league_groups", "groups_knockout"].includes(value));
}

export function isLinkedLeagueGroupsCup(competition = {}) {
  return competitionTypeKey(competition.type || "") === "cup" && (
    ["linked_league_groups", "linkedleaguegroups"].includes(clean(competition.bracketMode || "")) ||
    ["linked_league_groups", "linkedleaguegroups"].includes(clean(competition.cupMode || "")) ||
    Boolean(competition.cupLinkedLeagueGroupsEnabled || competition.linkedLeagueCompetitionId)
  );
}

export function isKnockoutCompetitionType(type) {
  return ["cup", "super_cup", "champions_league", "world_cup"].includes(competitionTypeKey(type || ""));
}

export function isChampionsLeagueSingleGroup(competition = {}) {
  if (competitionTypeKey(competition.type || "") !== "champions_league") return false;
  return clean(competition.championsLeagueFormat || "") === "single_group" ||
    clean(competition.bracketMode || "") === "champions_league_single_group";
}

export function uniqueCleanIds(values = []) {
  return Array.from(new Set((values || []).map(cleanId).filter(Boolean)));
}

export function getCompetitionExcludedMemberIds(competition = {}) {
  const set = new Set(uniqueCleanIds(competition.excludedMemberIds || []));
  (competition.participants || []).forEach((item) => {
    const memberId = cleanId(item.memberId || item.id || "");
    if (!memberId) return;
    if (clean(item.status || "") === "excluded" || item.excludedFromCompetition || clean(item.absenceAction || "") === "excluded") {
      set.add(memberId);
    }
  });
  (competition.absenceActions || []).forEach((item) => {
    const memberId = cleanId(item.memberId || "");
    if (memberId && clean(item.mode || item.actionMode || "") === "exclude") set.add(memberId);
  });
  return Array.from(set);
}

export function isCompetitionExcludedMember(competition = {}, memberId = "") {
  const safeId = cleanId(memberId);
  if (!safeId) return false;
  return getCompetitionExcludedMemberIds(competition).some((id) => same(id, safeId));
}

export function isCompetitionExcludedMatch(match = {}, excludedIds = []) {
  if (["excluded", "cancelled"].includes(clean(match.resultStatus || match.status || ""))) return true;
  if (clean(match.absenceAction || "") === "excluded") return true;
  const ids = (excludedIds || []).map(cleanId).filter(Boolean);
  if (!ids.length) return false;
  return ids.some((id) => same(match.homeMemberId, id) || same(match.awayMemberId, id));
}

export function competitionTieBreakFinalMode(competition = {}) {
  const value = clean(competition.tieBreakFinalMode || competition.groupTieBreakMode || competition.tieBreakerMode || "playoff");
  return value === "seed" ? "seed" : "playoff";
}

export function tieBreakDecisionKey(scope = "table", groupKey = "main", tieKey = "") {
  return [clean(scope || "table"), cleanId(groupKey || "main"), String(tieKey || "")].join("::");
}

export function normalizeTieBreakDecisions(competition = {}) {
  const rows = Array.isArray(competition.tieBreakDecisions)
    ? competition.tieBreakDecisions
    : Object.values(competition.tieBreakDecisions || {});
  return rows
    .filter(Boolean)
    .map((item) => {
      const scope = clean(item.scope || "table") || "table";
      const groupKey = cleanId(item.groupKey || "main") || "main";
      const tieKey = String(item.tieKey || item.standingTieKey || "");
      const key = item.key || tieBreakDecisionKey(scope, groupKey, tieKey);
      const memberOrder = Array.isArray(item.memberOrder)
        ? item.memberOrder.map(cleanId).filter(Boolean)
        : Array.isArray(item.orderedMemberIds)
          ? item.orderedMemberIds.map(cleanId).filter(Boolean)
          : [];
      return {
        ...item,
        key,
        scope,
        groupKey,
        tieKey,
        memberOrder,
      };
    })
    .filter((item) => item.key && item.tieKey && item.memberOrder.length);
}

export function findTieBreakDecisionForRows(rows = []) {
  const first = (rows || []).find((row) => row?.memberId) || {};
  const decisions = Array.isArray(first.tieBreakDecisions) ? first.tieBreakDecisions : [];
  const scope = clean(first.tieBreakDecisionScope || "table") || "table";
  const groupKey = cleanId(first.tieBreakDecisionGroupKey || "main") || "main";
  const tieKey = leagueStandingTieKey(first);
  const key = tieBreakDecisionKey(scope, groupKey, tieKey);
  return decisions.find((item) => item.key === key || (clean(item.scope) === scope && same(item.groupKey, groupKey) && String(item.tieKey || "") === tieKey)) || null;
}

export function applyTieBreakDecisionsToRows(rows = []) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const key = leagueStandingTieKey(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  const priorityByMember = new Map();
  const metaByMember = new Map();
  map.forEach((tiedRows) => {
    if ((tiedRows || []).length <= 1) return;
    const decision = findTieBreakDecisionForRows(tiedRows);
    if (!decision?.memberOrder?.length) return;
    const tiedIds = tiedRows.map((row) => cleanId(row.memberId)).filter(Boolean);
    const order = decision.memberOrder.filter((id) => tiedIds.some((tid) => same(tid, id)));
    if (order.length !== tiedIds.length || new Set(order.map(cleanId)).size !== tiedIds.length) return;
    order.forEach((id, index) => {
      priorityByMember.set(cleanId(id), index + 1);
      metaByMember.set(cleanId(id), {
        tieBreakResolvedByDecision: true,
        tieBreakDecisionKey: decision.key,
        tieBreakDecisionNote: decision.note || "",
      });
    });
  });
  return (rows || []).map((row) => {
    const id = cleanId(row.memberId);
    const priority = priorityByMember.get(id);
    return {
      ...row,
      ...(metaByMember.get(id) || {}),
      tieBreakDecisionPriority: priority || row.tieBreakDecisionPriority || 9999,
    };
  });
}

export function filterCompetitionParticipantsForCalculation(competition = {}) {
  const excludedIds = getCompetitionExcludedMemberIds(competition);
  const tieBreakFinalMode = competitionTieBreakFinalMode(competition);
  const tieBreakDecisions = normalizeTieBreakDecisions(competition);
  return (competition.participants || [])
    .filter((item) => {
      const memberId = cleanId(item.memberId || item.id || "");
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return false;
      return !excludedIds.some((id) => same(id, memberId));
    })
    .map((item, index) => ({
      ...item,
      seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
      order: Math.max(1, toNumber(item.order || item.seed || index + 1)),
      tieBreakFinalMode,
      tieBreakDecisions,
      tieBreakDecisionScope: competitionTypeKey(competition.type || "") === "champions_league" && isChampionsLeagueSingleGroup(competition) ? "champions_single_group" : "league",
      tieBreakDecisionGroupKey: "main",
    }));
}

export function filterCompetitionMatchesForCalculation(competition = {}) {
  const excludedIds = getCompetitionExcludedMemberIds(competition);
  return (competition.matches || []).filter((match) => !isCompetitionExcludedMatch(match, excludedIds));
}

export function matchInvolvesMember(match = {}, memberId = "") {
  const safeId = cleanId(memberId);
  return Boolean(safeId && (same(match.homeMemberId, safeId) || same(match.awayMemberId, safeId)));
}

export function isWaitingCompetitionMatch(match = {}) {
  return String(match.homeMemberId || "").startsWith("__") || String(match.awayMemberId || "").startsWith("__");
}

export function isGroupOrLeagueStageMatch(competition = {}, match = {}) {
  const typeKey = competitionTypeKey(competition.type || "league");
  const phase = clean(match.phase || "");
  if (phase === "group") return true;
  if (typeKey === "league" && !isLeagueGroupsCompetition(competition)) return true;
  if (typeKey === "league_qualifier" && phase !== "bye") return true;
  return false;
}

export function competitionAbsenceInfoForMember(competition = {}, memberId = "") {
  const safeId = cleanId(memberId);
  if (!safeId) return { played: 0, remaining: 0, affected: 0 };
  const matches = (competition.matches || []).filter((match) => matchInvolvesMember(match, safeId) && isGroupOrLeagueStageMatch(competition, match) && !isWaitingCompetitionMatch(match) && clean(match.phase || "") !== "bye" && !isCompetitionExcludedMatch(match, []));
  const played = matches.filter((match) => clean(match.resultStatus || match.status) === "completed").length;
  const remaining = matches.filter((match) => clean(match.resultStatus || match.status) !== "completed").length;
  return { played, remaining, affected: matches.length };
}

export function getApprovedCompetitionChampionName(competition = {}, fallbackName = "") {
  if (clean(competition?.status || "active") !== "completed") return "-";
  return competition?.championMemberName || competition?.championName || fallbackName || "-";
}

// ── دوري: إنشاء المباريات والترتيب ──────────────────────

export function generateLeagueRoundRobinMatches(participants = [], roundsMode = "single") {
  const base = (participants || []).map((item) => ({ ...item }));
  if (base.length < 2) return [];
  const hasBye = base.length % 2 === 1;
  const teams = hasBye ? [...base, { memberId: "__bye__", memberName: "راحة" }] : base.slice();
  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const generated = [];
  let rotating = teams.slice();

  for (let round = 1; round <= rounds; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const a = rotating[i];
      const b = rotating[rotating.length - 1 - i];
      if (!a || !b || a.memberId === "__bye__" || b.memberId === "__bye__") continue;
      const swap = round % 2 === 0;
      const home = swap ? b : a;
      const away = swap ? a : b;
      generated.push({
        id: `R${round}-M${i + 1}-${cleanId(home.memberId)}-${cleanId(away.memberId)}`,
        round,
        leg: 1,
        homeMemberId: cleanId(home.memberId),
        homeName: home.memberName || home.name || cleanId(home.memberId),
        awayMemberId: cleanId(away.memberId),
        awayName: away.memberName || away.name || cleanId(away.memberId),
        homeGoals: "",
        awayGoals: "",
        status: "scheduled",
        resultStatus: "scheduled",
      });
    }
    const fixed = rotating[0];
    const rest = rotating.slice(1);
    rest.unshift(rest.pop());
    rotating = [fixed, ...rest];
  }

  if (clean(roundsMode) === "double") {
    const secondLeg = generated.map((match) => ({
      ...match,
      id: match.id.replace(/^R(\d+)/, (full, n) => `R${Number(n) + rounds}`) + "-L2",
      round: match.round + rounds,
      leg: 2,
      homeMemberId: match.awayMemberId,
      homeName: match.awayName,
      awayMemberId: match.homeMemberId,
      awayName: match.homeName,
      homeGoals: "",
      awayGoals: "",
      status: "scheduled",
      resultStatus: "scheduled",
    }));
    return [...generated, ...secondLeg];
  }

  return generated;
}

export function computeLeagueStandings(participants = [], matches = []) {
  const table = new Map();
  (participants || []).forEach((item) => {
    const memberId = cleanId(item.memberId || item.id);
    if (!memberId || memberId === "__bye__") return;
    table.set(memberId, {
      memberId,
      memberName: item.memberName || item.name || memberId,
      seed: Math.max(1, toNumber(item.seed || item.order || table.size + 1)),
      order: Math.max(1, toNumber(item.order || item.seed || table.size + 1)),
      tieBreakFinalMode: clean(item.tieBreakFinalMode || "playoff") === "seed" ? "seed" : "playoff",
      tieBreakDecisions: Array.isArray(item.tieBreakDecisions) ? item.tieBreakDecisions : [],
      tieBreakDecisionScope: item.tieBreakDecisionScope || "table",
      tieBreakDecisionGroupKey: item.tieBreakDecisionGroupKey || "main",
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  });

  (matches || []).forEach((match) => {
    if (clean(match.resultStatus || match.status) !== "completed") return;
    const homeId = cleanId(match.homeMemberId);
    const awayId = cleanId(match.awayMemberId);
    const home = table.get(homeId);
    const away = table.get(awayId);
    if (!home || !away) return;
    const hg = toNumber(match.homeGoals);
    const ag = toNumber(match.awayGoals);
    home.played += 1;
    away.played += 1;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    away.goalsFor += ag;
    away.goalsAgainst += hg;
    if (hg > ag) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (ag > hg) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  const rows = applyTieBreakDecisionsToRows(Array.from(table.values()).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  })));
  return annotateLeagueStandings(rows.sort(compareLeagueStanding));
}

export function compareLeagueStanding(a, b) {
  return (
    toNumber(b.points) - toNumber(a.points) ||
    toNumber(b.goalDifference) - toNumber(a.goalDifference) ||
    toNumber(b.goalsFor) - toNumber(a.goalsFor) ||
    toNumber(a.goalsAgainst) - toNumber(b.goalsAgainst) ||
    toNumber(a.tieBreakDecisionPriority || 9999) - toNumber(b.tieBreakDecisionPriority || 9999) ||
    toNumber(a.seed || a.order || 9999) - toNumber(b.seed || b.order || 9999) ||
    clean(a.memberName).localeCompare(clean(b.memberName), "ar")
  );
}

export function leagueStandingTieKey(row) {
  return [
    toNumber(row.points),
    toNumber(row.goalDifference),
    toNumber(row.goalsFor),
    toNumber(row.goalsAgainst),
  ].join("|");
}

export function tieGroupResolvedBySeed(rows = []) {
  const safeRows = (rows || []).filter((row) => row?.memberId);
  if (safeRows.length <= 1) return true;
  const mode = clean(safeRows[0]?.tieBreakFinalMode || "playoff");
  if (mode !== "seed") return false;
  const seeds = safeRows.map((row) => toNumber(row.seed || row.order || 0)).filter((value) => value > 0);
  return seeds.length === safeRows.length && new Set(seeds).size === safeRows.length;
}

export function annotateLeagueStandings(rows = []) {
  const map = new Map();
  (rows || []).forEach((row) => {
    const key = leagueStandingTieKey(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return (rows || []).map((row) => {
    const tiedRows = map.get(leagueStandingTieKey(row)) || [];
    const resolvedBySeed = tiedRows.length > 1 && tieGroupResolvedBySeed(tiedRows);
    const resolvedByDecision = tiedRows.length > 1 && tiedRows.every((item) => Boolean(item.tieBreakResolvedByDecision));
    const scope = clean(row.tieBreakDecisionScope || "table") || "table";
    const groupKey = cleanId(row.tieBreakDecisionGroupKey || "main") || "main";
    const tieKey = leagueStandingTieKey(row);
    return {
      ...row,
      needsPlayoff: tiedRows.length > 1 && !resolvedBySeed && !resolvedByDecision,
      playoffMemberIds: tiedRows.map((item) => item.memberId).filter(Boolean),
      tieBreakResolvedBySeed: resolvedBySeed,
      tieBreakResolvedByDecision: resolvedByDecision || Boolean(row.tieBreakResolvedByDecision),
      tieBreakDecisionKey: row.tieBreakDecisionKey || tieBreakDecisionKey(scope, groupKey, tieKey),
    };
  });
}

export function isStandingPositionResolved(row = {}) {
  return Boolean(row?.memberId) && !row.needsPlayoff;
}

export function clearQualifiedStandingRow(row = {}) {
  return isStandingPositionResolved(row) ? row : null;
}

export function clearBestSecondStandingRow(rows = []) {
  const resolvedRows = (rows || []).filter(isStandingPositionResolved).sort(compareLeagueStanding);
  const first = resolvedRows[0] || null;
  if (!first) return null;
  const firstKey = leagueStandingTieKey(first);
  const tiedRows = resolvedRows.filter((row) => leagueStandingTieKey(row) === firstKey);
  return tiedRows.length > 1 && !tieGroupResolvedBySeed(tiedRows) && !tiedRows.every((row) => Boolean(row.tieBreakResolvedByDecision)) ? null : first;
}

// ── مساعدة توزيع المجموعات ──────────────────────────────

export function shuffleRows(rows = []) {
  const arr = [...(rows || [])];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function distributeSeedPotsToGroups(rows = [], groupCount = 2, groupKeys = [], groupNameForIndex = (index) => String(index + 1), maxPerGroup = null) {
  const groups = Array.from({ length: groupCount }, () => []);
  const bySeed = new Map();
  (rows || []).forEach((row) => {
    const seed = Math.max(1, toNumber(row.seed || row.order || 1));
    if (!bySeed.has(seed)) bySeed.set(seed, []);
    bySeed.get(seed).push({ ...row, seed });
  });
  Array.from(bySeed.keys()).sort((a, b) => a - b).forEach((seed) => {
    const potRows = shuffleRows(bySeed.get(seed) || []);
    const orderedGroups = shuffleRows(Array.from({ length: groupCount }, (_, index) => index))
      .sort((a, b) => groups[a].length - groups[b].length || a - b);
    potRows.forEach((row, index) => {
      const available = orderedGroups.filter((groupIndex) => !maxPerGroup || groups[groupIndex].length < maxPerGroup);
      const targetGroupIndex = available[index % Math.max(1, available.length)] ?? orderedGroups[index % orderedGroups.length] ?? 0;
      groups[targetGroupIndex].push({ ...row, groupKey: groupKeys[targetGroupIndex] || String(targetGroupIndex + 1), groupName: groupNameForIndex(targetGroupIndex) });
    });
  });
  return groups;
}

export function normalizeManualGroupAssignments(manualGroups = {}, groupKeys = []) {
  const allowedKeys = new Set((groupKeys || []).map((key) => cleanId(key || "").toUpperCase()).filter(Boolean));
  const normalized = {};
  (groupKeys || []).forEach((key) => {
    const safeKey = cleanId(key || "").toUpperCase();
    if (safeKey) normalized[safeKey] = [];
  });

  Object.entries(manualGroups || {}).forEach(([rawKey, rawIds]) => {
    const key = cleanId(rawKey || "").toUpperCase();
    if (!allowedKeys.has(key) || !Array.isArray(rawIds)) return;
    normalized[key] = rawIds.map(cleanId).filter(Boolean);
  });

  return normalized;
}

export function buildManualCompetitionGroups(rows = [], manualGroups = {}, groupCount = 2, groupKeys = [], groupNameForIndex = (index) => String(index + 1), maxPerGroup = null) {
  const keys = (groupKeys || []).slice(0, groupCount);
  const byId = new Map((rows || []).map((row) => [cleanId(row.memberId || row.id), row]).filter(([id]) => Boolean(id)));
  const used = new Set();
  const groups = keys.map(() => []);
  const normalized = normalizeManualGroupAssignments(manualGroups, keys);

  keys.forEach((key, groupIndex) => {
    const ids = normalized[cleanId(key).toUpperCase()] || [];
    ids.forEach((id) => {
      const safeId = cleanId(id);
      if (!safeId || used.has(safeId) || !byId.has(safeId)) return;
      if (maxPerGroup && groups[groupIndex].length >= maxPerGroup) return;
      used.add(safeId);
      groups[groupIndex].push({
        ...byId.get(safeId),
        groupKey: key,
        groupName: groupNameForIndex(groupIndex),
      });
    });
  });

  const missingIds = Array.from(byId.keys()).filter((id) => !used.has(id));
  if (missingIds.length) {
    throw new Error("يجب توزيع كل المشاركين المختارين داخل المجموعات اليدوية قبل إنشاء البطولة.");
  }

  return groups;
}

export function shouldUseManualGroupAssignment(options = {}) {
  return clean(options.groupAssignmentMode || "") === "manual" && options.manualGroups && typeof options.manualGroups === "object";
}

// ── كأس العالم ───────────────────────────────────────────

export function groupLetterName(index = 0) {
  return ["1", "2", "3"][index] || String(index + 1);
}

export function generateWorldCupMatches(participants = [], options = {}) {
  const cleanParticipants = (participants || [])
    .map((item, index) => ({
      ...item,
      memberId: cleanId(item.memberId || item.id),
      memberName: item.memberName || item.name || cleanId(item.memberId || item.id),
      seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
    }))
    .filter((item) => item.memberId)
    .sort((a, b) => toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"));
  const onlineMemberId = cleanId(options.onlineMemberId || cleanParticipants.find(isAbdullahLike)?.memberId || "");
  const enableQualifiers = Boolean(options.enableQualifiers);
  const groupKeys = ["A", "B", "C"];
  const gameFor = (homeId, awayId, reason = "كأس العالم") => {
    const fifa = onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId));
    return { gameTitle: fifa ? "FIFA 2025" : "PES 2017", gameCode: fifa ? "fifa25" : "pes17", gameReason: fifa ? "مباراة أونلاين" : reason };
  };
  const matches = [];
  let mainParticipants = cleanParticipants;
  let qualificationInfo = null;

  if (cleanParticipants.length > 9) {
    if (!enableQualifiers) throw new Error("فعّل تصفيات كأس العالم عند اختيار أكثر من 9 مشاركين.");
    const excess = cleanParticipants.length - 9;
    const poolSize = excess * 2;
    if (poolSize > cleanParticipants.length) throw new Error("عدد المشاركين غير مناسب لتصفيات دور واحد. قلّل العدد أو استخدم 18 مشاركًا كحد أقصى.");
    const shuffled = [...cleanParticipants].sort(() => Math.random() - 0.5);
    const qualifierPool = shuffled.slice(0, poolSize);
    const directRows = shuffled.slice(poolSize);
    const qualifierWinnerSlots = [];
    for (let i = 0; i < qualifierPool.length; i += 2) {
      const a = qualifierPool[i];
      const b = qualifierPool[i + 1];
      const qNo = i / 2 + 1;
      const matchId = `WC-Q${qNo}`;
      matches.push({
        id: matchId,
        round: 0,
        phase: "qualification",
        label: `تصفيات كأس العالم - مباراة ${qNo}`,
        homeMemberId: a.memberId,
        homeName: a.memberName,
        awayMemberId: b.memberId,
        awayName: b.memberName,
        homeGoals: "",
        awayGoals: "",
        status: "scheduled",
        resultStatus: "scheduled",
        ...gameFor(a.memberId, b.memberId, "تصفيات كأس العالم"),
      });
      qualifierWinnerSlots.push({
        memberId: `__winner__${matchId}`,
        memberName: `فائز تصفيات ${qNo}`,
        seed: 900 + qNo,
        sourceQualifierMatchId: matchId,
        isQualifierWinnerSlot: true,
      });
    }
    mainParticipants = [...directRows, ...qualifierWinnerSlots];
    qualificationInfo = {
      enabled: true,
      selectedCount: cleanParticipants.length,
      directCount: directRows.length,
      qualifierMatchesCount: qualifierWinnerSlots.length,
      note: "تصفيات عشوائية إقصائية لتأهيل 9 أعضاء إلى دور المجموعات",
    };
  }

  mainParticipants = mainParticipants
    .slice(0, 9)
    .sort((a, b) => toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"));

  const groups = shouldUseManualGroupAssignment(options)
    ? buildManualCompetitionGroups(mainParticipants, options.manualGroups, 3, groupKeys, groupLetterName, 3)
    : distributeSeedPotsToGroups(mainParticipants, 3, groupKeys, groupLetterName, 3);

  let matchNo = 1;
  groups.forEach((groupRows, groupIndex) => {
    for (let i = 0; i < groupRows.length; i += 1) {
      for (let j = i + 1; j < groupRows.length; j += 1) {
        const home = groupRows[i];
        const away = groupRows[j];
        matches.push({
          id: `WC-G${groupIndex + 1}-M${matchNo}`,
          round: groupIndex + 1,
          phase: "group",
          groupKey: groupKeys[groupIndex],
          groupName: groupLetterName(groupIndex),
          label: `مباريات المجموعة ${groupLetterName(groupIndex)}`,
          matchNumber: matchNo,
          homeMemberId: home.memberId,
          homeName: home.memberName,
          awayMemberId: away.memberId,
          awayName: away.memberName,
          homeGoals: "",
          awayGoals: "",
          status: "scheduled",
          resultStatus: "scheduled",
          ...gameFor(home.memberId, away.memberId, "مباريات دور المجموعات"),
        });
        matchNo += 1;
      }
    }
  });
  matches.push({ id: "WC-SF1", round: 4, phase: "semifinal", knockoutRound: 1, label: "مباريات نصف النهائي", homeMemberId: "__wc_group_A_first__", homeName: "أول المجموعة 1", awayMemberId: "__wc_best_second__", awayName: "أفضل ثاني", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباريات نصف النهائي") });
  matches.push({ id: "WC-SF2", round: 4, phase: "semifinal", knockoutRound: 1, label: "مباريات نصف النهائي", homeMemberId: "__wc_group_B_first__", homeName: "أول المجموعة 2", awayMemberId: "__wc_group_C_first__", awayName: "أول المجموعة 3", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباريات نصف النهائي") });
  matches.push({ id: "WC-THIRD", round: 5, phase: "third_place", knockoutRound: 2, label: "مباراة تحديد الثالث", homeMemberId: "__loser__WC-SF1", homeName: "خاسر نصف النهائي 1", awayMemberId: "__loser__WC-SF2", awayName: "خاسر نصف النهائي 2", homeWaitingForLoserOf: "WC-SF1", awayWaitingForLoserOf: "WC-SF2", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباراة تحديد الثالث") });
  matches.push({ id: "WC-FINAL", round: 6, phase: "final", knockoutRound: 3, label: "المباراة النهائية", homeMemberId: "__winner__WC-SF1", homeName: "فائز نصف النهائي 1", awayMemberId: "__winner__WC-SF2", awayName: "فائز نصف النهائي 2", homeWaitingForWinnerOf: "WC-SF1", awayWaitingForWinnerOf: "WC-SF2", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "المباراة النهائية") });
  const groupByeInfo = groups.map((rows, index) => ({
    groupKey: groupKeys[index],
    groupName: groupLetterName(index),
    participantIds: rows.map((row) => row.memberId),
    byeSlots: Math.max(0, 3 - rows.length),
  }));
  const groupParticipants = groups.flat();
  return {
    matches: resolveWorldCupDependencies({ participants: groupParticipants, matches }),
    participants: groupParticipants,
    gameQuota: {
      onlineMemberId,
      format: "world_cup_groups_knockout",
      groups: groupByeInfo,
      qualification: qualificationInfo,
      byeMode: groupByeInfo.some((group) => toNumber(group.byeSlots) > 0) ? "balanced_groups_rest" : "none",
    },
  };
}

export function worldCupGroupStageReady(competition = {}) {
  const groups = worldCupGroupRows(competition);
  if (!groups.length) return false;
  return groups.every((group) => linkedCupGroupIsReady(group));
}

export function worldCupGroupRows(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const excludedIds = getCompetitionExcludedMemberIds(competition);
  const participants = (competition.participants || []).filter((item) => {
    const memberId = cleanId(item.memberId || item.id);
    return memberId && !excludedIds.some((id) => same(id, memberId));
  });
  const qualifierWinnerMap = new Map();
  matches.forEach((match) => {
    if (clean(match.phase) === "qualification" && clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      qualifierWinnerMap.set(match.id, { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
    }
  });
  const resolveQualifierSide = (id, name) => {
    const raw = String(id || "");
    if (raw.startsWith("__winner__")) {
      const ref = cleanId(raw.replace("__winner__", ""));
      return qualifierWinnerMap.get(ref) || { memberId: raw, memberName: name || raw };
    }
    return { memberId: cleanId(id), memberName: name || cleanId(id) };
  };
  const participantTieBreakDecisions = normalizeTieBreakDecisions(competition);
  const participantSeedMap = new Map(participants.map((item, index) => [cleanId(item.memberId || item.id), {
    seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
    order: Math.max(1, toNumber(item.order || item.seed || index + 1)),
    tieBreakFinalMode: clean(item.tieBreakFinalMode || competitionTieBreakFinalMode(competition)) === "seed" ? "seed" : "playoff",
    tieBreakDecisions: participantTieBreakDecisions,
  }]).filter(([id]) => Boolean(id)));
  const rows = [];
  ["A", "B", "C"].forEach((groupKey, groupIndex) => {
    const rawGroupMatches = matches.filter((match) => clean(match.phase) === "group" && clean(match.groupKey) === clean(groupKey) && !isCompetitionExcludedMatch(match, excludedIds));
    const groupMatches = rawGroupMatches.map((match) => {
      const home = resolveQualifierSide(match.homeMemberId, match.homeName);
      const away = resolveQualifierSide(match.awayMemberId, match.awayName);
      return { ...match, homeMemberId: home.memberId, homeName: home.memberName, awayMemberId: away.memberId, awayName: away.memberName };
    });
    const fromMatches = new Map();
    groupMatches.forEach((match) => {
      [[match.homeMemberId, match.homeName], [match.awayMemberId, match.awayName]].forEach(([id, name]) => {
        const safeId = cleanId(id);
        if (!safeId || safeId === "__bye__" || excludedIds.some((excludedId) => same(excludedId, safeId))) return;
        const seedInfo = participantSeedMap.get(safeId) || {};
        fromMatches.set(safeId, { memberId: safeId, memberName: name || safeId, groupKey, groupName: groupLetterName(groupIndex), ...seedInfo, tieBreakDecisionScope: "world_cup_group", tieBreakDecisionGroupKey: groupKey });
      });
    });
    let groupParticipants = [...fromMatches.values()];
    if (!groupParticipants.length) groupParticipants = participants.filter((item) => clean(item.groupKey || "") === clean(groupKey));
    if (!groupParticipants.length) groupParticipants = participants.filter((_, index) => index % 3 === groupIndex);
    const standings = computeLeagueStandings(groupParticipants, groupMatches);
    rows.push({ groupKey, groupName: groupLetterName(groupIndex), participants: groupParticipants, matches: groupMatches, standings });
  });
  return rows;
}

export function computeWorldCupQualifiedRows(competition = {}) {
  const groups = worldCupGroupRows(competition);
  if (!worldCupGroupStageReady(competition)) {
    return { groups, firsts: [], seconds: [], bestSecond: null, qualified: [] };
  }
  const firsts = groups
    .map((group) => clearQualifiedStandingRow({ ...(group.standings[0] || {}), groupKey: group.groupKey, groupName: group.groupName, qualification: "first" }))
    .filter((row) => row?.memberId);
  const seconds = groups
    .map((group) => clearQualifiedStandingRow({ ...(group.standings[1] || {}), groupKey: group.groupKey, groupName: group.groupName, qualification: "second" }))
    .filter((row) => row?.memberId);
  const bestSecond = clearBestSecondStandingRow(seconds);
  return { groups, firsts, seconds, bestSecond, qualified: [...firsts, ...(bestSecond ? [{ ...bestSecond, qualification: "best_second" }] : [])] };
}

export function computeWorldCupQualifiedIds(competition = {}) {
  return computeWorldCupQualifiedRows(competition).qualified.map((row) => cleanId(row.memberId)).filter(Boolean);
}

export function worldCupQualifierTokenMap(competition = {}) {
  const data = computeWorldCupQualifiedRows(competition);
  const map = new Map();
  if ((data.qualified || []).length < 4) return map;
  data.firsts.forEach((row) => {
    const token = row.groupKey === "A" ? "__wc_group_A_first__" : row.groupKey === "B" ? "__wc_group_B_first__" : "__wc_group_C_first__";
    map.set(token, { memberId: cleanId(row.memberId), memberName: row.memberName });
  });
  if (data.bestSecond?.memberId) map.set("__wc_best_second__", { memberId: cleanId(data.bestSecond.memberId), memberName: data.bestSecond.memberName });
  return map;
}

export function resolveWorldCupDependencies(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const qualifierMap = worldCupQualifierTokenMap(competition);
  const winnerMap = new Map();
  const loserMap = new Map();
  matches.forEach((match) => {
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      winnerMap.set(match.id, { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
      const loser = matchLoserInfo(match);
      if (loser) loserMap.set(match.id, loser);
    }
  });
  const resolveSide = (id, winnerRef, loserRef) => {
    const raw = String(id || "");
    if (raw.startsWith("__wc_")) return qualifierMap.get(raw) || null;
    const win = cleanId(winnerRef || (raw.startsWith("__winner__") ? raw.replace("__winner__", "") : ""));
    if (win) return winnerMap.get(win) || null;
    const lose = cleanId(loserRef || (raw.startsWith("__loser__") ? raw.replace("__loser__", "") : ""));
    if (lose) return loserMap.get(lose) || null;
    return null;
  };
  return matches.map((match) => {
    const next = { ...match };
    const home = resolveSide(next.homeMemberId, next.homeWaitingForWinnerOf, next.homeWaitingForLoserOf);
    const away = resolveSide(next.awayMemberId, next.awayWaitingForWinnerOf, next.awayWaitingForLoserOf);
    if (home) { next.homeMemberId = home.memberId; next.homeName = home.memberName; }
    if (away) { next.awayMemberId = away.memberId; next.awayName = away.memberName; }
    return next;
  });
}

// ── دوري الأبطال ─────────────────────────────────────────

export function championsLeagueGroupLetterName(index = 0) {
  return [""][index] || String(index + 1);
}

export function buildBalancedGroupMatchPairs(groupRows = []) {
  const rows = (groupRows || []).filter(Boolean);
  if (rows.length < 2) return [];
  if (rows.length === 2) return [[rows[0], rows[1]]];
  if (rows.length === 3) {
    return [
      [rows[1], rows[2]],
      [rows[0], rows[2]],
      [rows[0], rows[1]],
    ];
  }
  if (rows.length === 4) {
    return [
      [rows[0], rows[3]],
      [rows[1], rows[2]],
      [rows[0], rows[2]],
      [rows[3], rows[1]],
      [rows[0], rows[1]],
      [rows[2], rows[3]],
    ];
  }
  const pairs = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) pairs.push([rows[i], rows[j]]);
  }
  return pairs;
}

export function generateChampionsLeagueMatches(participants = [], options = {}) {
  const cleanParticipants = (participants || [])
    .map((item, index) => ({
      ...item,
      memberId: cleanId(item.memberId || item.id),
      memberName: item.memberName || item.name || cleanId(item.memberId || item.id),
      seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
    }))
    .filter((item) => item.memberId)
    .sort((a, b) => toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"));
  const onlineMemberId = cleanId(options.onlineMemberId || cleanParticipants.find(isAbdullahLike)?.memberId || "");
  const enableQualifiers = Boolean(options.enableQualifiers);
  const groupKeys = ["A", "B"];
  const gameFor = (homeId, awayId, reason = "دوري الأبطال") => {
    const fifa = onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId));
    return { gameTitle: fifa ? "FIFA 2025" : "PES 2017", gameCode: fifa ? "fifa25" : "pes17", gameReason: fifa ? "مباراة أونلاين" : reason };
  };
  const matches = [];
  let mainParticipants = cleanParticipants;
  let qualificationInfo = null;

  if (cleanParticipants.length > 8) {
    if (!enableQualifiers) throw new Error("فعّل ملحق دوري الأبطال عند اختيار أكثر من 8 مشاركين.");
    const excess = cleanParticipants.length - 8;
    const poolSize = excess * 2;
    if (poolSize > cleanParticipants.length) throw new Error("عدد المشاركين غير مناسب لملحق دور واحد. قلّل العدد أو استخدم 16 مشاركًا كحد أقصى.");
    const shuffled = [...cleanParticipants].sort(() => Math.random() - 0.5);
    const qualifierPool = shuffled.slice(0, poolSize);
    const directRows = shuffled.slice(poolSize);
    const qualifierWinnerSlots = [];
    for (let i = 0; i < qualifierPool.length; i += 2) {
      const a = qualifierPool[i];
      const b = qualifierPool[i + 1];
      const qNo = i / 2 + 1;
      const matchId = `UCL-Q${qNo}`;
      matches.push({
        id: matchId,
        round: 0,
        phase: "qualification",
        label: `ملحق دوري الأبطال - مباراة ${qNo}`,
        homeMemberId: a.memberId,
        homeName: a.memberName,
        awayMemberId: b.memberId,
        awayName: b.memberName,
        homeGoals: "",
        awayGoals: "",
        status: "scheduled",
        resultStatus: "scheduled",
        ...gameFor(a.memberId, b.memberId, "ملحق دوري الأبطال"),
      });
      qualifierWinnerSlots.push({
        memberId: `__winner__${matchId}`,
        memberName: `فائز ملحق ${qNo}`,
        seed: 900 + qNo,
        sourceQualifierMatchId: matchId,
        isQualifierWinnerSlot: true,
      });
    }
    mainParticipants = [...directRows, ...qualifierWinnerSlots];
    qualificationInfo = {
      enabled: true,
      selectedCount: cleanParticipants.length,
      directCount: directRows.length,
      qualifierMatchesCount: qualifierWinnerSlots.length,
      note: "ملحق عشوائي إقصائي لتأهيل 8 أعضاء إلى مجموعات دوري الأبطال",
    };
  }

  mainParticipants = mainParticipants
    .slice(0, 8)
    .sort((a, b) => toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"));

  const groups = shouldUseManualGroupAssignment(options)
    ? buildManualCompetitionGroups(mainParticipants, options.manualGroups, 2, groupKeys, championsLeagueGroupLetterName, 4)
    : distributeSeedPotsToGroups(mainParticipants, 2, groupKeys, championsLeagueGroupLetterName, 4);

  let matchNo = 1;
  groups.forEach((groupRows, groupIndex) => {
    const balancedPairs = buildBalancedGroupMatchPairs(groupRows);
    balancedPairs.forEach(([home, away], pairIndex) => {
      matches.push({
        id: `UCL-G${groupIndex + 1}-M${pairIndex + 1}`,
        round: groupIndex + 1,
        phase: "group",
        groupKey: groupKeys[groupIndex],
        groupName: championsLeagueGroupLetterName(groupIndex),
        label: `مباريات المجموعة ${championsLeagueGroupLetterName(groupIndex)}`,
        matchNumber: matchNo,
        homeMemberId: home.memberId,
        homeName: home.memberName,
        awayMemberId: away.memberId,
        awayName: away.memberName,
        homeGoals: "",
        awayGoals: "",
        status: "scheduled",
        resultStatus: "scheduled",
        ...gameFor(home.memberId, away.memberId, "مباريات دور المجموعات"),
      });
      matchNo += 1;
    });
  });
  matches.push({ id: "UCL-SF1", round: 4, phase: "semifinal", knockoutRound: 1, label: "مباريات نصف النهائي", homeMemberId: "__ucl_group_A_first__", homeName: "أول المجموعة 1", awayMemberId: "__ucl_group_B_second__", awayName: "ثاني المجموعة 2", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباريات نصف النهائي") });
  matches.push({ id: "UCL-SF2", round: 4, phase: "semifinal", knockoutRound: 1, label: "مباريات نصف النهائي", homeMemberId: "__ucl_group_B_first__", homeName: "أول المجموعة 2", awayMemberId: "__ucl_group_A_second__", awayName: "ثاني المجموعة 1", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباريات نصف النهائي") });
  matches.push({ id: "UCL-THIRD", round: 5, phase: "third_place", knockoutRound: 2, label: "مباراة تحديد الثالث", homeMemberId: "__loser__UCL-SF1", homeName: "خاسر نصف النهائي 1", awayMemberId: "__loser__UCL-SF2", awayName: "خاسر نصف النهائي 2", homeWaitingForLoserOf: "UCL-SF1", awayWaitingForLoserOf: "UCL-SF2", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "مباراة تحديد الثالث") });
  matches.push({ id: "UCL-FINAL", round: 6, phase: "final", knockoutRound: 3, label: "المباراة النهائية", homeMemberId: "__winner__UCL-SF1", homeName: "فائز نصف النهائي 1", awayMemberId: "__winner__UCL-SF2", awayName: "فائز نصف النهائي 2", homeWaitingForWinnerOf: "UCL-SF1", awayWaitingForWinnerOf: "UCL-SF2", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", "", "المباراة النهائية") });

  const groupByeInfo = groups.map((rows, index) => ({
    groupKey: groupKeys[index],
    groupName: championsLeagueGroupLetterName(index),
    participantIds: rows.map((row) => row.memberId),
    byeSlots: Math.max(0, 4 - rows.length),
  }));
  const groupParticipants = groups.flat();
  return {
    matches: resolveChampionsLeagueDependencies({ participants: groupParticipants, matches }),
    participants: groupParticipants,
    gameQuota: {
      onlineMemberId,
      format: "champions_league_groups_knockout",
      groups: groupByeInfo,
      qualification: qualificationInfo,
      byeMode: groupByeInfo.some((group) => toNumber(group.byeSlots) > 0) ? "balanced_groups_rest" : "none",
    },
  };
}

export function championsLeagueGroupStageReady(competition = {}) {
  const groups = championsLeagueGroupRows(competition);
  if (!groups.length) return false;
  return groups.every((group) => linkedCupGroupIsReady(group));
}

export function championsLeagueGroupRows(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const excludedIds = getCompetitionExcludedMemberIds(competition);
  const participants = (competition.participants || []).filter((item) => {
    const memberId = cleanId(item.memberId || item.id);
    return memberId && !excludedIds.some((id) => same(id, memberId));
  });
  const qualifierWinnerMap = new Map();
  matches.forEach((match) => {
    if (clean(match.phase) === "qualification" && clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      qualifierWinnerMap.set(match.id, { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
    }
  });
  const resolveQualifierSide = (id, name) => {
    const raw = String(id || "");
    if (raw.startsWith("__winner__")) {
      const ref = cleanId(raw.replace("__winner__", ""));
      return qualifierWinnerMap.get(ref) || { memberId: raw, memberName: name || raw };
    }
    return { memberId: cleanId(id), memberName: name || cleanId(id) };
  };
  const participantTieBreakDecisions = normalizeTieBreakDecisions(competition);
  const groupDecisionScope = isLeagueGroupsCompetition(competition) ? "league_group" : "champions_group";
  const participantSeedMap = new Map(participants.map((item, index) => [cleanId(item.memberId || item.id), {
    seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
    order: Math.max(1, toNumber(item.order || item.seed || index + 1)),
    tieBreakFinalMode: clean(item.tieBreakFinalMode || competitionTieBreakFinalMode(competition)) === "seed" ? "seed" : "playoff",
    tieBreakDecisions: participantTieBreakDecisions,
  }]).filter(([id]) => Boolean(id)));
  const rows = [];
  ["A", "B"].forEach((groupKey, groupIndex) => {
    const rawGroupMatches = matches.filter((match) => clean(match.phase) === "group" && clean(match.groupKey) === clean(groupKey) && !isCompetitionExcludedMatch(match, excludedIds));
    const groupMatches = rawGroupMatches.map((match) => {
      const home = resolveQualifierSide(match.homeMemberId, match.homeName);
      const away = resolveQualifierSide(match.awayMemberId, match.awayName);
      return { ...match, homeMemberId: home.memberId, homeName: home.memberName, awayMemberId: away.memberId, awayName: away.memberName };
    });
    const fromMatches = new Map();
    groupMatches.forEach((match) => {
      [[match.homeMemberId, match.homeName], [match.awayMemberId, match.awayName]].forEach(([id, name]) => {
        const safeId = cleanId(id);
        if (!safeId || safeId === "__bye__" || excludedIds.some((id) => same(id, safeId))) return;
        const seedInfo = participantSeedMap.get(safeId) || {};
        fromMatches.set(safeId, { memberId: safeId, memberName: name || safeId, groupKey, groupName: championsLeagueGroupLetterName(groupIndex), ...seedInfo, tieBreakDecisionScope: groupDecisionScope, tieBreakDecisionGroupKey: groupKey });
      });
    });
    let groupParticipants = [...fromMatches.values()];
    if (!groupParticipants.length) groupParticipants = participants.filter((item) => clean(item.groupKey || "") === clean(groupKey));
    if (!groupParticipants.length) groupParticipants = participants.filter((_, index) => index % 2 === groupIndex);
    const standings = computeLeagueStandings(groupParticipants, groupMatches);
    rows.push({ groupKey, groupName: championsLeagueGroupLetterName(groupIndex), participants: groupParticipants, matches: groupMatches, standings });
  });
  return rows;
}

export function computeChampionsLeagueQualifiedRows(competition = {}) {
  const groups = championsLeagueGroupRows(competition);
  if (!championsLeagueGroupStageReady(competition)) return { groups, qualified: [] };
  const qualified = groups.flatMap((group) => [
    clearQualifiedStandingRow({ ...(group.standings[0] || {}), groupKey: group.groupKey, groupName: group.groupName, qualification: "first" }),
    clearQualifiedStandingRow({ ...(group.standings[1] || {}), groupKey: group.groupKey, groupName: group.groupName, qualification: "second" }),
  ]).filter((row) => row?.memberId);
  return { groups, qualified };
}

export function computeChampionsLeagueQualifiedIds(competition = {}) {
  return computeChampionsLeagueQualifiedRows(competition).qualified.map((row) => cleanId(row.memberId)).filter(Boolean);
}

export function championsLeagueQualifierTokenMap(competition = {}) {
  const data = computeChampionsLeagueQualifiedRows(competition);
  const map = new Map();
  if ((data.qualified || []).length < 4) return map;
  (data.qualified || []).forEach((row) => {
    const token = row.groupKey === "A"
      ? (row.qualification === "first" ? "__ucl_group_A_first__" : "__ucl_group_A_second__")
      : (row.qualification === "first" ? "__ucl_group_B_first__" : "__ucl_group_B_second__");
    map.set(token, { memberId: cleanId(row.memberId), memberName: row.memberName });
  });
  return map;
}

export function resolveChampionsLeagueDependencies(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const qualifierMap = championsLeagueQualifierTokenMap(competition);
  const winnerMap = new Map();
  const loserMap = new Map();
  matches.forEach((match) => {
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      winnerMap.set(match.id, { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
      const loser = matchLoserInfo(match);
      if (loser) loserMap.set(match.id, loser);
    }
  });
  const resolveSide = (id, winnerRef, loserRef) => {
    const raw = String(id || "");
    if (raw.startsWith("__ucl_")) return qualifierMap.get(raw) || null;
    const win = cleanId(winnerRef || (raw.startsWith("__winner__") ? raw.replace("__winner__", "") : ""));
    if (win) return winnerMap.get(win) || null;
    const lose = cleanId(loserRef || (raw.startsWith("__loser__") ? raw.replace("__loser__", "") : ""));
    if (lose) return loserMap.get(lose) || null;
    return null;
  };
  return matches.map((match) => {
    const next = { ...match };
    const home = resolveSide(next.homeMemberId, next.homeWaitingForWinnerOf, next.homeWaitingForLoserOf);
    const away = resolveSide(next.awayMemberId, next.awayWaitingForWinnerOf, next.awayWaitingForLoserOf);
    if (home) { next.homeMemberId = home.memberId; next.homeName = home.memberName; }
    if (away) { next.awayMemberId = away.memberId; next.awayName = away.memberName; }
    return next;
  });
}

// ── الكأس الإقصائي ───────────────────────────────────────

export function generateSeededKnockoutBracketMatches(participants = [], options = {}) {
  const cleanParticipants = (participants || [])
    .map((item, index) => ({
      ...item,
      memberId: cleanId(item.memberId || item.id),
      memberName: item.memberName || item.name || cleanId(item.memberId || item.id),
      seed: Math.max(1, toNumber(item.seed || item.order || index + 1)),
    }))
    .filter((item) => item.memberId)
    .sort((a, b) => toNumber(a.seed) - toNumber(b.seed) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"));
  const onlineMemberId = cleanId(options.onlineMemberId || cleanParticipants.find(isAbdullahLike)?.memberId || "");
  const gameFor = (homeId, awayId, reason = "الكأس") => {
    const fifa = onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId));
    return { gameTitle: fifa ? "FIFA 2025" : "PES 2017", gameCode: fifa ? "fifa25" : "pes17", gameReason: fifa ? "مباراة أونلاين" : reason };
  };
  const size = knockoutBracketSizeForCount(cleanParticipants.length);
  const manualPairings = normalizeCupManualPairings(options.manualPairings || []);
  const seededSlots = manualPairings.length ? buildManualKnockoutBracketSlots(cleanParticipants, manualPairings, size) : buildSeededBracketSlots(cleanParticipants, size);
  const roundsCount = Math.log2(size);
  const matches = [];
  const previousRoundSlots = [];
  for (let i = 0; i < size; i += 2) {
    const home = seededSlots[i];
    const away = seededSlots[i + 1];
    const matchNumber = Math.floor(i / 2) + 1;
    const id = `K1-M${matchNumber}`;
    if (home && !away) {
      matches.push({ id, round: 1, phase: "bye", label: "تأهل مباشر", bracketSlot: matchNumber, homeMemberId: home.memberId, homeName: home.memberName, awayMemberId: "__bye__", awayName: "تأهل مباشر", winnerMemberId: home.memberId, winnerName: home.memberName, homeGoals: "", awayGoals: "", status: "completed", resultStatus: "completed", gameTitle: "-", gameCode: "bye", gameReason: "تأهل مباشر" });
    } else if (!home && away) {
      matches.push({ id, round: 1, phase: "bye", label: "تأهل مباشر", bracketSlot: matchNumber, homeMemberId: away.memberId, homeName: away.memberName, awayMemberId: "__bye__", awayName: "تأهل مباشر", winnerMemberId: away.memberId, winnerName: away.memberName, homeGoals: "", awayGoals: "", status: "completed", resultStatus: "completed", gameTitle: "-", gameCode: "bye", gameReason: "تأهل مباشر" });
    } else if (home && away) {
      matches.push({ id, round: 1, phase: roundsCount === 1 ? "final" : "knockout", label: roundLabelForBracket(1, roundsCount), bracketSlot: matchNumber, homeMemberId: home.memberId, homeName: home.memberName, awayMemberId: away.memberId, awayName: away.memberName, homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor(home.memberId, away.memberId) });
    }
    previousRoundSlots.push(id);
  }
  let previous = previousRoundSlots;
  for (let round = 2; round <= roundsCount; round += 1) {
    const next = [];
    for (let i = 0; i < previous.length; i += 2) {
      const left = previous[i];
      const right = previous[i + 1];
      const id = `K${round}-M${Math.floor(i / 2) + 1}`;
      matches.push({
        id,
        round,
        phase: round === roundsCount ? "final" : "knockout",
        label: roundLabelForBracket(round, roundsCount),
        bracketSlot: Math.floor(i / 2) + 1,
        homeMemberId: `__winner__${left}`,
        homeName: "الفائز من " + matchShortLabel(left),
        awayMemberId: right ? `__winner__${right}` : "__bye__",
        awayName: right ? "الفائز من " + matchShortLabel(right) : "تأهل مباشر",
        homeWaitingForWinnerOf: left,
        awayWaitingForWinnerOf: right || "",
        waitingForWinnerOf: left,
        homeGoals: "",
        awayGoals: "",
        status: "scheduled",
        resultStatus: "scheduled",
        ...gameFor("", "", roundLabelForBracket(round, roundsCount)),
      });
      next.push(id);
    }
    previous = next;
  }
  return { matches: resolveKnockoutBracketDependencies(matches), gameQuota: { onlineMemberId, bracketSize: size, format: manualPairings.length ? "manual_knockout" : "seeded_knockout" } };
}

export function resolveKnockoutBracketDependencies(matches = []) {
  const winnerMap = new Map();
  (matches || []).forEach((match) => {
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      winnerMap.set(match.id, { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
    }
  });
  return (matches || []).map((match) => {
    const next = { ...match };
    const homeRef = cleanId(next.homeWaitingForWinnerOf || (String(next.homeMemberId || "").startsWith("__winner__") ? String(next.homeMemberId).replace("__winner__", "") : ""));
    const awayRef = cleanId(next.awayWaitingForWinnerOf || (String(next.awayMemberId || "").startsWith("__winner__") ? String(next.awayMemberId).replace("__winner__", "") : ""));
    const homeWinner = homeRef ? winnerMap.get(homeRef) : null;
    const awayWinner = awayRef ? winnerMap.get(awayRef) : null;
    if (homeWinner) {
      next.homeMemberId = homeWinner.memberId;
      next.homeName = homeWinner.memberName;
    }
    if (awayWinner) {
      next.awayMemberId = awayWinner.memberId;
      next.awayName = awayWinner.memberName;
    }
    return next;
  });
}

export function knockoutBracketSizeForCount(count = 0) {
  const total = Math.max(0, toNumber(count));
  if (total <= 2) return 2;
  if (total <= 4) return 4;
  return 8;
}

export function normalizeCupManualPairings(pairings = []) {
  if (!Array.isArray(pairings)) return [];
  return pairings
    .map((item, index) => ({
      order: index + 1,
      homeMemberId: cleanId(item?.homeMemberId || item?.homeId || item?.firstMemberId || ""),
      awayMemberId: cleanId(item?.awayMemberId || item?.awayId || item?.secondMemberId || ""),
    }))
    .filter((item) => item.homeMemberId || item.awayMemberId);
}

export function buildManualKnockoutBracketSlots(participants = [], pairings = [], size = 8) {
  const byId = new Map((participants || []).map((item) => [cleanId(item.memberId || item.id), item]));
  const slots = Array.from({ length: size }, () => null);
  const used = new Set();
  let cursor = 0;
  for (const row of normalizeCupManualPairings(pairings)) {
    if (cursor >= size) break;
    const homeId = cleanId(row.homeMemberId || "");
    const awayId = cleanId(row.awayMemberId || "");
    const home = homeId && byId.has(homeId) && !used.has(homeId) ? byId.get(homeId) : null;
    const away = awayId && byId.has(awayId) && !used.has(awayId) && !same(awayId, homeId) ? byId.get(awayId) : null;
    slots[cursor] = home;
    if (home) used.add(homeId);
    cursor += 1;
    if (cursor >= size) break;
    slots[cursor] = away;
    if (away) used.add(awayId);
    cursor += 1;
  }
  const remaining = (participants || []).filter((item) => !used.has(cleanId(item.memberId || item.id)));
  let remainingIndex = 0;
  for (let i = 0; i < slots.length && remainingIndex < remaining.length; i += 1) {
    if (!slots[i]) {
      slots[i] = remaining[remainingIndex];
      remainingIndex += 1;
    }
  }
  return slots;
}

export function buildSeededBracketSlots(participants = [], size = 8) {
  const seedOrder = size === 2 ? [1, 2] : size === 4 ? [1, 4, 2, 3] : [1, 8, 4, 5, 2, 7, 3, 6];
  const bySeed = new Map((participants || []).map((item) => [toNumber(item.seed), item]));
  return seedOrder.map((seed) => bySeed.get(seed) || null);
}

export function roundLabelForBracket(round, roundsCount) {
  if (round === roundsCount) return "النهائي";
  if (round === roundsCount - 1) return "نصف النهائي";
  if (round === roundsCount - 2) return "ربع النهائي";
  return `الدور ${round}`;
}

export function matchShortLabel(id = "") {
  const text = String(id || "");
  const parts = text.match(/K(\d+)-M(\d+)/);
  if (!parts) return text;
  const roundNo = toNumber(parts[1]);
  const roundName = roundNo === 1 ? "ربع النهائي" : roundNo === 2 ? "نصف النهائي" : roundNo === 3 ? "النهائي" : "الدور " + roundNo;
  return roundName + " - مباراة " + parts[2];
}

export function matchLoserInfo(match = {}) {
  if (clean(match.resultStatus || match.status) !== "completed" || !match.winnerMemberId) return null;
  const winnerId = cleanId(match.winnerMemberId);
  const homeId = cleanId(match.homeMemberId);
  const awayId = cleanId(match.awayMemberId);
  const loserId = same(winnerId, homeId) ? awayId : homeId;
  if (!loserId || loserId === "__bye__" || String(loserId).startsWith("__")) return null;
  return { memberId: loserId, memberName: same(loserId, homeId) ? match.homeName : match.awayName };
}

export function getKnockoutChampion(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const typeKey = competitionTypeKey(competition.type || "");
  const finalMatch = ["world_cup", "champions_league"].includes(typeKey)
    ? matches.find((match) => clean(match.phase || "") === "final" && clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId)
    : matches.slice().sort((a, b) => toNumber(b.round) - toNumber(a.round) || String(b.id || "").localeCompare(String(a.id || ""))).find((match) => clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId);
  if (!finalMatch) return null;
  return { memberId: cleanId(finalMatch.winnerMemberId), memberName: finalMatch.winnerName || getMemberName(competition.participants || [], finalMatch.winnerMemberId) || finalMatch.winnerMemberId };
}

export function getKnockoutRewardRows(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const sortedCompleted = matches
    .slice()
    .sort((a, b) => toNumber(b.round) - toNumber(a.round) || String(b.id || "").localeCompare(String(a.id || "")))
    .filter((match) => clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId);
  const finalMatch = sortedCompleted.find((match) => clean(match.phase || "") === "final") || (competitionTypeKey(competition.type || "") === "super_cup" ? sortedCompleted[0] : null);
  if (!finalMatch) return [];
  const winnerId = cleanId(finalMatch.winnerMemberId);
  const homeId = cleanId(finalMatch.homeMemberId);
  const awayId = cleanId(finalMatch.awayMemberId);
  const runnerId = same(winnerId, homeId) ? awayId : homeId;
  const rows = [];
  if (winnerId) rows.push({ rank: 1, memberId: winnerId, memberName: finalMatch.winnerName || getMemberName(competition.participants || [], winnerId) || winnerId });
  if (runnerId && runnerId !== "__bye__") rows.push({ rank: 2, memberId: runnerId, memberName: getMemberName(competition.participants || [], runnerId) || (same(runnerId, homeId) ? finalMatch.homeName : finalMatch.awayName) || runnerId });
  if (["world_cup", "champions_league"].includes(competitionTypeKey(competition.type || ""))) {
    const thirdMatch = sortedCompleted.find((match) => clean(match.phase || "") === "third_place");
    if (thirdMatch) {
      const thirdId = cleanId(thirdMatch.winnerMemberId);
      const thirdHomeId = cleanId(thirdMatch.homeMemberId);
      const thirdAwayId = cleanId(thirdMatch.awayMemberId);
      const fourthId = same(thirdId, thirdHomeId) ? thirdAwayId : thirdHomeId;
      if (thirdId) rows.push({ rank: 3, memberId: thirdId, memberName: thirdMatch.winnerName || getMemberName(competition.participants || [], thirdId) || thirdId });
      if (fourthId && fourthId !== "__bye__") rows.push({ rank: 4, memberId: fourthId, memberName: getMemberName(competition.participants || [], fourthId) || (same(fourthId, thirdHomeId) ? thirdMatch.homeName : thirdMatch.awayName) || fourthId });
    }
  }
  return rows;
}

export function resolveLeagueQualifierDependencies(matches = []) {
  const winnerMap = new Map();
  (matches || []).forEach((match) => {
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      winnerMap.set(match.id, { memberId: match.winnerMemberId, memberName: match.winnerName || match.winnerMemberName || match.winnerMemberId });
    }
  });
  return (matches || []).map((match) => {
    if (!match.waitingForWinnerOf) return match;
    const winner = winnerMap.get(match.waitingForWinnerOf);
    if (!winner) return match;
    const next = { ...match };
    if (String(next.homeMemberId || "").startsWith("__winner__")) {
      next.homeMemberId = winner.memberId;
      next.homeName = winner.memberName;
    }
    if (String(next.awayMemberId || "").startsWith("__winner__")) {
      next.awayMemberId = winner.memberId;
      next.awayName = winner.memberName;
    }
    return next;
  });
}

export function linkedCupGroupIsReady(group = {}) {
  const participants = (group.participants || []).filter((row) => cleanId(row.memberId || row.id || "") && !String(row.memberId || row.id || "").startsWith("__"));
  const activeIds = new Set(participants.map((row) => cleanId(row.memberId || row.id || "")).filter(Boolean));
  if (participants.length <= 1) return participants.length === 1;
  const matches = (group.matches || [])
    .filter((match) => clean(match.phase || "") === "group")
    .filter((match) => activeIds.has(cleanId(match.homeMemberId || "")) && activeIds.has(cleanId(match.awayMemberId || "")))
    .filter((match) => !["excluded", "cancelled"].includes(clean(match.resultStatus || match.status || "")) && clean(match.absenceAction || "") !== "excluded");
  if (!matches.length) return false;
  return matches.every((match) => clean(match.resultStatus || match.status) === "completed");
}

export function sortedCompetitionMatchesForSchedule(competition = {}) {
  const typeKey = competitionTypeKey(competition.type || "league");
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const excludedIds = getCompetitionExcludedMemberIds(competition);
  const rawMatches = filterCompetitionMatchesForCalculation(competition);
  const resolvedMatches = typeKey === "world_cup" ? resolveWorldCupDependencies({ ...competition, matches: rawMatches }) : (typeKey === "champions_league" || leagueGroupsMode) ? resolveChampionsLeagueDependencies({ ...competition, matches: rawMatches }) : rawMatches;
  const matches = resolvedMatches.filter((match) => !isCompetitionExcludedMatch(match, excludedIds));
  const groupOrderMap = new Map();
  const groupCounters = new Map();
  matches.forEach((match, index) => {
    if (clean(match.phase || "") !== "group") return;
    const groupKey = clean(match.groupKey || match.groupName || match.round || "A");
    const order = groupCounters.get(groupKey) || 0;
    groupCounters.set(groupKey, order + 1);
    groupOrderMap.set(String(match.id || index), order + 1);
  });
  const groupIndexFor = (match = {}) => {
    const groupKey = clean(match.groupKey || "");
    if (groupKey === "A") return 1;
    if (groupKey === "B") return 2;
    if (groupKey === "C") return 3;
    return Math.max(1, toNumber(match.round || 1));
  };
  const sortValue = (match = {}, index = 0) => {
    if (clean(match.phase || "") === "group") {
      const localOrder = groupOrderMap.get(String(match.id || index)) || toNumber(match.groupMatchNo || match.matchNumber || 1) || 1;
      return 100000 + localOrder * 100 + groupIndexFor(match);
    }
    return competitionMatchSortValue(match);
  };
  return [...matches].map((match, index) => ({ match, index })).sort((a, b) => sortValue(a.match, a.index) - sortValue(b.match, b.index) || a.index - b.index).map(({ match }) => match);
}

export function competitionMatchSortValue(match = {}) {
  const phase = clean(match.phase || "");
  const groupKey = clean(match.groupKey || "");
  const groupIndex = groupKey === "A" ? 1 : groupKey === "B" ? 2 : groupKey === "C" ? 3 : Math.max(1, toNumber(match.round || 1));
  const idMatchNo = String(match.id || "").match(/-M(\d+)/i);
  const matchNo = Math.max(1, toNumber(match.groupMatchNo || (idMatchNo ? idMatchNo[1] : match.matchNumber || match.bracketSlot || 1)));
  const phaseRank = phase === "qualification" ? 0 : phase === "group" ? 1 : phase === "semifinal" ? 2 : phase === "third_place" ? 3 : phase === "final" ? 4 : 9;
  if (phase === "group") return phaseRank * 100000 + matchNo * 100 + groupIndex;
  return phaseRank * 100000 + toNumber(match.round || 0) * 1000 + matchNo;
}

// ── Additional exported helpers ─────────────────────────────────────────────

export function competitionTypeArabic(type = "") {
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

export function competitionTimeValue(item = {}) {
  const value = item.updatedAt || item.createdAt || item.date || item.completedAt;
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

// ── Helper functions for generateLinkedLeagueGroupsCupPlan ──────────────────

export function linkedCupGroupNumber(groupKey = "", fallbackIndex = 0) {
  const key = clean(groupKey || "");
  if (key === "a" || key === "1") return "1";
  if (key === "b" || key === "2") return "2";
  return String(Math.max(1, toNumber(fallbackIndex) + 1));
}

function linkedCupRankText(rank = 1, groupNumber = "") {
  const n = Math.max(1, toNumber(rank));
  const label = n === 1 ? "أول" : n === 2 ? "ثاني" : n === 3 ? "ثالث" : n === 4 ? "رابع" : `المركز ${n}`;
  return `${label} المجموعة ${groupNumber}`;
}

export function getLinkedLeagueCupParticipantRows(leagueCompetition = {}) {
  const groups = championsLeagueGroupRows(leagueCompetition);
  const byId = new Map();
  groups.forEach((group, groupIndex) => {
    const groupKey = group.groupKey || (groupIndex === 0 ? "A" : "B");
    const groupNumber = linkedCupGroupNumber(groupKey, groupIndex);
    (group.participants || []).forEach((row, index) => {
      const memberId = cleanId(row.memberId || row.id || "");
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
      if (!byId.has(memberId)) {
        const memberName = row.memberName || row.name || getMemberName(leagueCompetition.participants || [], memberId) || memberId;
        byId.set(memberId, {
          memberId,
          memberName,
          groupKey,
          groupName: `المجموعة ${groupNumber}`,
          order: byId.size + 1,
          seed: index + 1,
          status: "active",
        });
      }
    });
  });
  if (!byId.size) {
    (leagueCompetition.participants || []).forEach((row, index) => {
      const memberId = cleanId(row.memberId || row.id || "");
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
      const memberName = row.memberName || row.name || memberId;
      byId.set(memberId, {
        memberId,
        memberName,
        groupKey: row.groupKey || (index % 2 === 0 ? "A" : "B"),
        groupName: row.groupName || `المجموعة ${index % 2 === 0 ? "1" : "2"}`,
        order: index + 1,
        seed: row.seed || index + 1,
        status: "active",
      });
    });
  }
  return [...byId.values()];
}

function linkedCupGameFor(homeId, awayId, onlineMemberId = "", reason = "الكأس") {
  const fifa = onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId));
  return { gameTitle: fifa ? "FIFA 2025" : "PES 2017", gameCode: fifa ? "fifa25" : "pes17", gameReason: fifa ? "مباراة أونلاين" : reason };
}

function linkedCupRankSlot(group = {}, groupIndex = 0, rank = 1) {
  const groupKey = group.groupKey || (groupIndex === 0 ? "A" : "B");
  const groupNumber = linkedCupGroupNumber(groupKey, groupIndex);
  const ready = linkedCupGroupIsReady(group);
  const standingRow = ready ? (group.standings || [])[Math.max(0, rank - 1)] : null;
  if (standingRow?.memberId) {
    return {
      memberId: cleanId(standingRow.memberId),
      memberName: standingRow.memberName || getMemberName(group.participants || [], standingRow.memberId) || standingRow.memberId,
      resolved: true,
    };
  }
  return {
    memberId: `__lgcup_${groupKey}_rank_${rank}`,
    memberName: linkedCupRankText(rank, groupNumber),
    resolved: false,
  };
}

function linkedCupByeMatch({ id, round, groupKey, groupNumber, slot, label }) {
  const resolved = Boolean(slot?.resolved && slot.memberId && !String(slot.memberId).startsWith("__"));
  return {
    id,
    round,
    phase: "bye",
    groupKey,
    groupPath: groupKey,
    label,
    homeMemberId: slot?.memberId || "",
    homeName: slot?.memberName || "بانتظار الترتيب",
    awayMemberId: "__bye__",
    awayName: "تأهل مباشر",
    winnerMemberId: resolved ? slot.memberId : "",
    winnerName: resolved ? slot.memberName : "",
    homeGoals: "",
    awayGoals: "",
    status: resolved ? "completed" : "scheduled",
    resultStatus: resolved ? "completed" : "scheduled",
    gameTitle: "-",
    gameCode: "bye",
    gameReason: `تأهل مباشر من المجموعة ${groupNumber}`,
  };
}

function buildLinkedCupGroupPath(group = {}, groupIndex = 0, onlineMemberId = "") {
  const groupKey = group.groupKey || (groupIndex === 0 ? "A" : "B");
  const groupNumber = linkedCupGroupNumber(groupKey, groupIndex);
  const participantCount = Math.min(4, Math.max(0, (group.participants || []).filter((row) => cleanId(row.memberId || row.id || "") && !String(row.memberId || row.id || "").startsWith("__")).length));
  const prefix = `LGC-${groupKey}`;
  const matches = [];
  const rankSlot = (rank) => linkedCupRankSlot(group, groupIndex, rank);
  const matchBase = { groupKey, groupPath: groupKey };

  if (participantCount <= 0) return { matches, winnerRef: "", finalRound: 0, groupKey, groupNumber };

  if (participantCount === 1) {
    const byeId = `${prefix}-BYE1`;
    matches.push(linkedCupByeMatch({ id: byeId, round: 1, groupKey, groupNumber, slot: rankSlot(1), label: `مسار المجموعة ${groupNumber} - تأهل مباشر` }));
    return { matches, winnerRef: byeId, finalRound: 1, groupKey, groupNumber };
  }

  if (participantCount === 2) {
    const bye1 = `${prefix}-BYE1`;
    const bye2 = `${prefix}-BYE2`;
    const finalId = `${prefix}-PATH-FINAL`;
    matches.push(linkedCupByeMatch({ id: bye1, round: 1, groupKey, groupNumber, slot: rankSlot(1), label: `مسار المجموعة ${groupNumber} - تأهل مباشر للمركز الأول` }));
    matches.push(linkedCupByeMatch({ id: bye2, round: 1, groupKey, groupNumber, slot: rankSlot(2), label: `مسار المجموعة ${groupNumber} - تأهل مباشر للمركز الثاني` }));
    matches.push({
      ...matchBase,
      id: finalId,
      round: 2,
      phase: "semifinal",
      label: `حسم مسار المجموعة ${groupNumber}`,
      homeMemberId: `__winner__${bye1}`,
      homeName: linkedCupRankText(1, groupNumber),
      awayMemberId: `__winner__${bye2}`,
      awayName: linkedCupRankText(2, groupNumber),
      homeWaitingForWinnerOf: bye1,
      awayWaitingForWinnerOf: bye2,
      homeGoals: "",
      awayGoals: "",
      status: "scheduled",
      resultStatus: "scheduled",
      ...linkedCupGameFor("", "", onlineMemberId, `حسم مسار المجموعة ${groupNumber}`),
    });
    return { matches, winnerRef: finalId, finalRound: 2, groupKey, groupNumber };
  }

  if (participantCount === 3) {
    const bye1 = `${prefix}-BYE1`;
    const playoff = `${prefix}-R1-M1`;
    const finalId = `${prefix}-PATH-FINAL`;
    const slot2 = rankSlot(2);
    const slot3 = rankSlot(3);
    matches.push(linkedCupByeMatch({ id: bye1, round: 1, groupKey, groupNumber, slot: rankSlot(1), label: `مسار المجموعة ${groupNumber} - الأول يتأهل مباشرة` }));
    matches.push({
      ...matchBase,
      id: playoff,
      round: 1,
      phase: "knockout",
      label: `مسار المجموعة ${groupNumber} - الثاني ضد الثالث`,
      homeMemberId: slot2.memberId,
      homeName: slot2.memberName,
      awayMemberId: slot3.memberId,
      awayName: slot3.memberName,
      homeGoals: "",
      awayGoals: "",
      status: "scheduled",
      resultStatus: "scheduled",
      ...linkedCupGameFor(slot2.memberId, slot3.memberId, onlineMemberId, `مسار المجموعة ${groupNumber}`),
    });
    matches.push({
      ...matchBase,
      id: finalId,
      round: 2,
      phase: "semifinal",
      label: `حسم مسار المجموعة ${groupNumber}`,
      homeMemberId: `__winner__${bye1}`,
      homeName: linkedCupRankText(1, groupNumber),
      awayMemberId: `__winner__${playoff}`,
      awayName: "فائز مباراة الثاني والثالث",
      homeWaitingForWinnerOf: bye1,
      awayWaitingForWinnerOf: playoff,
      homeGoals: "",
      awayGoals: "",
      status: "scheduled",
      resultStatus: "scheduled",
      ...linkedCupGameFor("", "", onlineMemberId, `حسم مسار المجموعة ${groupNumber}`),
    });
    return { matches, winnerRef: finalId, finalRound: 2, groupKey, groupNumber };
  }

  const qf1 = `${prefix}-R1-M1`;
  const qf2 = `${prefix}-R1-M2`;
  const finalId = `${prefix}-PATH-FINAL`;
  const r1 = rankSlot(1);
  const r4 = rankSlot(4);
  const r2 = rankSlot(2);
  const r3 = rankSlot(3);
  matches.push({
    ...matchBase,
    id: qf1,
    round: 1,
    phase: "knockout",
    label: `مسار المجموعة ${groupNumber} - الأول ضد الرابع`,
    homeMemberId: r1.memberId,
    homeName: r1.memberName,
    awayMemberId: r4.memberId,
    awayName: r4.memberName,
    homeGoals: "",
    awayGoals: "",
    status: "scheduled",
    resultStatus: "scheduled",
    ...linkedCupGameFor(r1.memberId, r4.memberId, onlineMemberId, `مسار المجموعة ${groupNumber}`),
  });
  matches.push({
    ...matchBase,
    id: qf2,
    round: 1,
    phase: "knockout",
    label: `مسار المجموعة ${groupNumber} - الثاني ضد الثالث`,
    homeMemberId: r2.memberId,
    homeName: r2.memberName,
    awayMemberId: r3.memberId,
    awayName: r3.memberName,
    homeGoals: "",
    awayGoals: "",
    status: "scheduled",
    resultStatus: "scheduled",
    ...linkedCupGameFor(r2.memberId, r3.memberId, onlineMemberId, `مسار المجموعة ${groupNumber}`),
  });
  matches.push({
    ...matchBase,
    id: finalId,
    round: 2,
    phase: "semifinal",
    label: `حسم مسار المجموعة ${groupNumber}`,
    homeMemberId: `__winner__${qf1}`,
    homeName: "فائز 1 ضد 4",
    awayMemberId: `__winner__${qf2}`,
    awayName: "فائز 2 ضد 3",
    homeWaitingForWinnerOf: qf1,
    awayWaitingForWinnerOf: qf2,
    homeGoals: "",
    awayGoals: "",
    status: "scheduled",
    resultStatus: "scheduled",
    ...linkedCupGameFor("", "", onlineMemberId, `حسم مسار المجموعة ${groupNumber}`),
  });
  return { matches, winnerRef: finalId, finalRound: 2, groupKey, groupNumber };
}

function mergeLinkedCupGeneratedMatches(existingCup = {}, generatedMatches = []) {
  const existing = new Map((existingCup.matches || []).map((match) => [String(match.id || ""), match]));
  return (generatedMatches || []).map((match) => {
    const current = existing.get(String(match.id || ""));
    if (!current) return match;
    const currentCompleted = clean(current.resultStatus || current.status) === "completed";
    const isRealPlayedMatch = clean(current.phase || "") !== "bye";
    if (currentCompleted && isRealPlayedMatch) return { ...match, ...current, linkedLockedFromCupResult: true };
    return {
      ...match,
      gameTitle: current.gameTitle && current.gameTitle !== "-" ? current.gameTitle : match.gameTitle,
      gameCode: current.gameCode && current.gameCode !== "bye" ? current.gameCode : match.gameCode,
      gameReason: current.gameReason || match.gameReason,
    };
  });
}

export function generateLinkedLeagueGroupsCupPlan({ linkedLeague = {}, existingCup = null, onlineMemberId = "" } = {}) {
  const groups = championsLeagueGroupRows(linkedLeague).slice(0, 2);
  const participants = getLinkedLeagueCupParticipantRows(linkedLeague);
  const pathPlans = groups.map((group, index) => buildLinkedCupGroupPath(group, index, onlineMemberId));
  let matches = pathPlans.flatMap((plan) => plan.matches || []);
  const validPaths = pathPlans.filter((plan) => plan.winnerRef);
  if (validPaths.length >= 2) {
    const finalRound = Math.max(...validPaths.map((plan) => toNumber(plan.finalRound || 1))) + 1;
    matches.push({
      id: "LGC-FINAL",
      round: finalRound,
      phase: "final",
      label: "نهائي الكأس",
      homeMemberId: `__winner__${validPaths[0].winnerRef}`,
      homeName: `فائز مسار المجموعة ${validPaths[0].groupNumber}`,
      awayMemberId: `__winner__${validPaths[1].winnerRef}`,
      awayName: `فائز مسار المجموعة ${validPaths[1].groupNumber}`,
      homeWaitingForWinnerOf: validPaths[0].winnerRef,
      awayWaitingForWinnerOf: validPaths[1].winnerRef,
      homeGoals: "",
      awayGoals: "",
      status: "scheduled",
      resultStatus: "scheduled",
      ...linkedCupGameFor("", "", onlineMemberId, "نهائي الكأس"),
    });
  }
  matches = resolveKnockoutBracketDependencies(matches);
  matches = existingCup ? mergeLinkedCupGeneratedMatches(existingCup, matches) : matches;
  matches = resolveKnockoutBracketDependencies(matches);
  return {
    participants,
    matches,
    gameQuota: {
      onlineMemberId,
      format: "linked_league_groups_cup",
      linkedLeagueCompetitionId: linkedLeague.id || "",
      linkedLeagueCompetitionName: linkedLeague.name || "",
      groups: groups.map((group, index) => ({
        groupKey: group.groupKey || (index === 0 ? "A" : "B"),
        groupName: `المجموعة ${linkedCupGroupNumber(group.groupKey, index)}`,
        participantCount: (group.participants || []).length,
        completed: linkedCupGroupIsReady(group),
      })),
    },
  };
}

export function buildLinkedLeagueCupDisplayCompetition(competition = {}, allCompetitions = []) {
  if (!competition || !isLinkedLeagueGroupsCup(competition)) return competition;
  try {
    const linkedLeagueId = cleanId(
      competition.linkedLeagueCompetitionId ||
        competition.linkedLeagueId ||
        competition.cupLinkedLeagueCompetitionId ||
        competition.gameRules?.gameQuota?.linkedLeagueCompetitionId ||
        ""
    );
    const linkedLeague = linkedLeagueId
      ? (allCompetitions || []).find((item) => same(item.id, linkedLeagueId))
      : null;
    if (!linkedLeague || !isLeagueGroupsCompetition(linkedLeague)) return competition;

    const plan = generateLinkedLeagueGroupsCupPlan({
      linkedLeague,
      existingCup: competition,
      onlineMemberId: competition?.gameRules?.onlineMemberId || linkedLeague?.gameRules?.onlineMemberId || "",
    });

    return {
      ...competition,
      participants: plan.participants?.length ? plan.participants : (competition.participants || []),
      matches: Array.isArray(plan.matches) ? plan.matches : (competition.matches || []),
      gameRules: {
        ...(competition.gameRules || {}),
        gameQuota: {
          ...((competition.gameRules || {}).gameQuota || {}),
          ...(plan.gameQuota || {}),
        },
      },
      linkedCupDisplaySynced: true,
      linkedCupDisplaySourceLeagueId: linkedLeague.id || linkedLeagueId,
    };
  } catch (err) {
    console.error("Linked league cup display sync failed:", err);
    return competition;
  }
}

// ── دوال مُنقولة من App.jsx ───────────────────────────────

export function buildCompetitionStats(competition = {}) {
  const typeKey = competitionTypeKey(competition.type || "league");
  const matches = filterCompetitionMatchesForCalculation(competition).filter((match) => clean(match.resultStatus || match.status) === "completed" && clean(match.phase || "") !== "bye");
  const participantMap = new Map();
  filterCompetitionParticipantsForCalculation(competition).forEach((item) => {
    const memberId = cleanId(item.memberId || item.id);
    if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
    participantMap.set(memberId, { memberId, memberName: item.memberName || item.name || memberId });
  });
  matches.forEach((match) => {
    [[match.homeMemberId, match.homeName], [match.awayMemberId, match.awayName]].forEach(([id, name]) => {
      const memberId = cleanId(id);
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
      if (!participantMap.has(memberId)) participantMap.set(memberId, { memberId, memberName: name || memberId });
    });
  });
  const standings = computeLeagueStandings(Array.from(participantMap.values()), matches);
  const championRow = (typeKey === "league" || typeKey === "mini_league" || isChampionsLeagueSingleGroup(competition)) ? standings[0] : getKnockoutChampion(competition);
  const champion = getApprovedCompetitionChampionName(competition, championRow?.memberName || "");
  const playedRows = standings.filter((row) => toNumber(row.played) > 0);
  const topScorer = playedRows.slice().sort((a, b) => toNumber(b.goalsFor) - toNumber(a.goalsFor) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"))[0];
  const bestAttack = topScorer;
  const bestDefense = playedRows.slice().sort((a, b) => toNumber(a.goalsAgainst) - toNumber(b.goalsAgainst) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"))[0];
  const mostConceded = playedRows.slice().sort((a, b) => toNumber(b.goalsAgainst) - toNumber(a.goalsAgainst) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"))[0];
  const mostWins = playedRows.slice().sort((a, b) => toNumber(b.wins) - toNumber(a.wins) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"))[0];
  const mostLosses = playedRows.slice().sort((a, b) => toNumber(b.losses) - toNumber(a.losses) || clean(a.memberName).localeCompare(clean(b.memberName), "ar"))[0];
  const totalGoals = matches.reduce((sum, match) => sum + toNumber(match.homeGoals) + toNumber(match.awayGoals), 0);
  return { champion, topScorer, bestAttack, bestDefense, mostConceded, mostWins, mostLosses, totalGoals, matchesPlayed: matches.length };
}

export function assignLeagueGamePlatforms(matches = [], participants = [], options = {}) {
  const onlineMemberId = cleanId(options.onlineMemberId || (participants.find(isAbdullahLike)?.memberId) || "");
  const maxFifaPerRound = Math.max(1, toNumber(options.maxFifaPerRound ?? 2));
  const nonOnlineIds = (participants || [])
    .map((item) => cleanId(item.memberId || item.id))
    .filter((id) => id && !same(id, onlineMemberId));
  const totalCounts = new Map(nonOnlineIds.map((id) => [id, 0]));
  const onlineCounts = new Map(nonOnlineIds.map((id) => [id, 0]));
  const extraCounts = new Map(nonOnlineIds.map((id) => [id, 0]));

  const rows = (matches || []).map((match) => ({
    ...match,
    gameTitle: "PES 2017",
    gameCode: "pes17",
    gameReason: "النظام الأساسي",
  }));

  const byRound = new Map();
  rows.forEach((match, index) => {
    const round = toNumber(match.round || 1) || 1;
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round).push(index);
  });

  Array.from(byRound.keys()).sort((a, b) => a - b).forEach((round) => {
    const indexes = byRound.get(round) || [];
    let fifaThisRound = 0;

    indexes.forEach((index) => {
      const match = rows[index];
      const homeId = cleanId(match.homeMemberId);
      const awayId = cleanId(match.awayMemberId);
      if (onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId))) {
        const otherId = same(homeId, onlineMemberId) ? awayId : homeId;
        if (onlineCounts.has(otherId)) onlineCounts.set(otherId, (onlineCounts.get(otherId) || 0) + 1);
        if (totalCounts.has(otherId)) totalCounts.set(otherId, (totalCounts.get(otherId) || 0) + 1);
        rows[index] = { ...match, gameTitle: "FIFA 2025", gameCode: "fifa25", gameReason: "مباراة أونلاين" };
        fifaThisRound += 1;
      }
    });

    const candidates = indexes
      .filter((index) => clean(rows[index].gameCode) !== "fifa25")
      .filter((index) => totalCounts.has(cleanId(rows[index].homeMemberId)) && totalCounts.has(cleanId(rows[index].awayMemberId)))
      .sort((a, b) => {
        const ah = totalCounts.get(cleanId(rows[a].homeMemberId)) || 0;
        const aa = totalCounts.get(cleanId(rows[a].awayMemberId)) || 0;
        const bh = totalCounts.get(cleanId(rows[b].homeMemberId)) || 0;
        const ba = totalCounts.get(cleanId(rows[b].awayMemberId)) || 0;
        return (ah + aa) - (bh + ba) || Math.max(ah, aa) - Math.max(bh, ba) || a - b;
      });

    for (const index of candidates) {
      if (fifaThisRound >= maxFifaPerRound) break;
      const match = rows[index];
      const homeId = cleanId(match.homeMemberId);
      const awayId = cleanId(match.awayMemberId);
      rows[index] = { ...match, gameTitle: "FIFA 2025", gameCode: "fifa25", gameReason: "توزيع عادل داخل الجولة" };
      extraCounts.set(homeId, (extraCounts.get(homeId) || 0) + 1);
      extraCounts.set(awayId, (extraCounts.get(awayId) || 0) + 1);
      totalCounts.set(homeId, (totalCounts.get(homeId) || 0) + 1);
      totalCounts.set(awayId, (totalCounts.get(awayId) || 0) + 1);
      fifaThisRound += 1;
    }
  });

  return {
    matches: rows,
    gameQuota: {
      onlineMemberId,
      maxFifaPerRound,
      onlineCounts: Object.fromEntries(onlineCounts),
      extraCounts: Object.fromEntries(extraCounts),
      totalCounts: Object.fromEntries(totalCounts),
      warnings: [],
    },
  };
}

export function applyCompetitionGameMode(matches = [], options = {}) {
  const mode = ["auto", "fifa2025_only", "pes2017_only", "mixed_manual"].includes(clean(options.gameDistributionMode || "auto")) ? clean(options.gameDistributionMode || "auto") : "auto";
  const rows = (matches || []).map((match) => ({ ...match }));
  if (mode === "auto") return rows;
  const playableIndexes = rows
    .map((match, index) => ({ match, index }))
    .filter(({ match }) => clean(match.phase || "") !== "bye" && clean(match.homeMemberId || "") !== "__bye__" && clean(match.awayMemberId || "") !== "__bye__")
    .map(({ index }) => index);
  const setGame = (index, isFifa, reason) => {
    rows[index] = {
      ...rows[index],
      gameTitle: isFifa ? "FIFA 2025" : "PES 2017",
      gameCode: isFifa ? "fifa25" : "pes17",
      gameReason: reason,
    };
  };
  if (mode === "fifa2025_only") {
    playableIndexes.forEach((index) => setGame(index, true, "اختيار إداري: كل المباريات على FIFA 2025"));
    return rows;
  }
  if (mode === "pes2017_only") {
    playableIndexes.forEach((index) => setGame(index, false, "اختيار إداري: كل المباريات على PES 2017"));
    return rows;
  }
  const fifaCount = Math.max(0, Math.min(playableIndexes.length, toNumber(options.fifa2025MatchCount || 0)));
  playableIndexes.forEach((index, order) => setGame(index, order < fifaCount, order < fifaCount ? "اختيار إداري: مكس يدوي FIFA 2025" : "اختيار إداري: مكس يدوي PES 2017"));
  return rows;
}

export function generateLeagueQualifierMatches(participants = [], qualifiersCount = 1, options = {}) {
  const rows = [];
  const cleanParticipants = (participants || []).map((item) => ({ ...item, memberId: cleanId(item.memberId || item.id), memberName: item.memberName || item.name || cleanId(item.memberId || item.id) })).filter((item) => item.memberId);
  const onlineMemberId = cleanId(options.onlineMemberId || cleanParticipants.find(isAbdullahLike)?.memberId || "");
  const gameFor = (homeId, awayId, reason = "ملحق الدوري") => {
    const fifa = onlineMemberId && (same(homeId, onlineMemberId) || same(awayId, onlineMemberId));
    return { gameTitle: fifa ? "FIFA 2025" : "PES 2017", gameCode: fifa ? "fifa25" : "pes17", gameReason: fifa ? "مباراة أونلاين" : reason };
  };
  const q = Math.max(1, Math.min(toNumber(qualifiersCount || 1), Math.max(1, cleanParticipants.length - 1)));

  if (cleanParticipants.length === 2) {
    const [a, b] = cleanParticipants;
    rows.push({ id: "Q1-M1", round: 1, phase: "final", label: q === 1 ? "نهائي الملحق" : "مباراة تأهل", homeMemberId: a.memberId, homeName: a.memberName, awayMemberId: b.memberId, awayName: b.memberName, homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor(a.memberId, b.memberId) });
  } else if (q >= 2) {
    let matchNo = 1;
    for (let i = 0; i < cleanParticipants.length; i += 2) {
      const a = cleanParticipants[i];
      const b = cleanParticipants[i + 1];
      if (!b) {
        rows.push({ id: `Q1-BYE-${a.memberId}`, round: 1, phase: "bye", label: "تأهل مباشر", homeMemberId: a.memberId, homeName: a.memberName, awayMemberId: "__bye__", awayName: "تأهل مباشر", winnerMemberId: a.memberId, winnerName: a.memberName, homeGoals: "", awayGoals: "", status: "completed", resultStatus: "completed", gameTitle: "-", gameCode: "bye", gameReason: "تأهل مباشر" });
      } else {
        rows.push({ id: `Q1-M${matchNo}`, round: 1, phase: "qualifier", label: "مباراة تأهل", homeMemberId: a.memberId, homeName: a.memberName, awayMemberId: b.memberId, awayName: b.memberName, homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor(a.memberId, b.memberId) });
        matchNo += 1;
      }
    }
  } else {
    const [a, b, ...rest] = cleanParticipants;
    rows.push({ id: "Q1-M1", round: 1, phase: "preliminary", label: "الدور التمهيدي", homeMemberId: a.memberId, homeName: a.memberName, awayMemberId: b.memberId, awayName: b.memberName, homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor(a.memberId, b.memberId) });
    if (rest[0]) {
      rows.push({ id: "Q2-M1", round: 2, phase: "final", label: "نهائي الملحق", homeMemberId: "__winner__Q1-M1", homeName: "الفائز من الدور التمهيدي", awayMemberId: rest[0].memberId, awayName: rest[0].memberName, waitingForWinnerOf: "Q1-M1", homeGoals: "", awayGoals: "", status: "scheduled", resultStatus: "scheduled", ...gameFor("", rest[0].memberId, "نهائي الملحق") });
    }
  }

  return { matches: rows, gameQuota: { onlineMemberId, qualifiersCount: q } };
}

export function getWorldCupThirdPlace(competition = {}) {
  const match = (competition.matches || []).find((item) => clean(item.phase) === "third_place" && clean(item.resultStatus || item.status) === "completed" && item.winnerMemberId);
  return match ? { memberId: cleanId(match.winnerMemberId), memberName: match.winnerName || getMemberName(competition.participants || [], match.winnerMemberId) || match.winnerMemberId } : null;
}

export function leagueTwoGroupsAdminRoundTitle(match = {}, fallbackRound = "") {
  const phase = clean(match.phase || "");
  if (phase === "qualification") return "ملحق الدوري";
  if (phase === "group") return "مباريات المجموعة " + (match.groupName || championsLeagueGroupLetterName(Math.max(0, toNumber(match.round) - 1)));
  if (phase === "semifinal") return "مباريات نصف النهائي";
  if (phase === "third_place") return "مباراة تحديد الثالث";
  if (phase === "final") return "المباراة النهائية";
  return match.label || (fallbackRound ? "المباريات" : "المباريات");
}

export function generateLeagueTwoGroupsMatches(participants = [], options = {}) {
  const plan = generateChampionsLeagueMatches(participants, options);
  const matches = (plan.matches || []).map((match) => ({
    ...match,
    label: clean(match.phase) === "qualification" ? String(match.label || "").replace("دوري الأبطال", "الدوري") : match.label,
    gameReason: String(match.gameReason || "").replace("دوري الأبطال", "الدوري"),
  }));
  return {
    ...plan,
    matches,
    gameQuota: { ...(plan.gameQuota || {}), format: "league_two_groups_knockout" },
  };
}

export function championsLeagueAdminRoundTitle(match = {}, fallbackRound = "") {
  const phase = clean(match.phase || "");
  if (phase === "qualification") return "ملحق دوري الأبطال";
  if (phase === "group") return "مباريات المجموعة " + (match.groupName || championsLeagueGroupLetterName(Math.max(0, toNumber(match.round) - 1)));
  if (phase === "semifinal") return "مباريات نصف النهائي";
  if (phase === "third_place") return "مباراة تحديد الثالث";
  if (phase === "final") return "المباراة النهائية";
  return match.label || (fallbackRound ? "الجولة " + fallbackRound : "المباريات");
}

export function validateCupManualPairings(pairings = [], participants = []) {
  const participantIds = (participants || []).map((item) => cleanId(item.memberId || item.id)).filter(Boolean);
  const participantSet = new Set(participantIds);
  const used = [];
  const bracketSize = knockoutBracketSizeForCount(participantIds.length);
  const maxRows = bracketSize / 2;
  if (!pairings.length) throw new Error("فعّلت اختيار مواجهات الكأس يدويًا، لذلك يجب توزيع المشاركين على المباريات.");
  if (pairings.length !== maxRows) throw new Error("يجب تعبئة كل مباريات الدور الأول في الكأس. اترك طرفًا واحدًا فارغًا للتأهل المباشر، ولا تترك مباراة كاملة فارغة.");
  pairings.forEach((row, index) => {
    const homeId = cleanId(row.homeMemberId || "");
    const awayId = cleanId(row.awayMemberId || "");
    if (!homeId && !awayId) return;
    if (homeId && awayId && same(homeId, awayId)) throw new Error("لا يمكن اختيار نفس العضو في طرفي مباراة الكأس رقم " + (index + 1) + ".");
    [homeId, awayId].filter(Boolean).forEach((id) => {
      if (!participantSet.has(id)) throw new Error("أحد أعضاء مواجهات الكأس غير موجود ضمن المشاركين المختارين.");
      if (used.some((item) => same(item, id))) throw new Error("كل عضو يجب أن يظهر مرة واحدة فقط في مواجهات الكأس اليدوية.");
      used.push(id);
    });
  });
  if (used.length !== participantIds.length) throw new Error("وزّع كل المشاركين في مواجهات الكأس اليدوية قبل إنشاء البطولة.");
  const singleRows = pairings.filter((row) => Boolean(cleanId(row.homeMemberId || "")) !== Boolean(cleanId(row.awayMemberId || ""))).length;
  const availableByeSlots = bracketSize - participantIds.length;
  if (singleRows > availableByeSlots) throw new Error("عدد مباريات التأهل المباشر أكبر من المتاح حسب عدد المشاركين.");
}

export function getCompetitionChampionInfo(competition = {}) {
  const champion = competition.championMemberName || competition.championName
    ? { memberId: cleanId(competition.championMemberId || ""), memberName: competition.championMemberName || competition.championName || "" }
    : getKnockoutChampion(competition);
  if (!champion?.memberName && !champion?.memberId) return null;
  const participant = (competition.participants || []).find((item) =>
    (champion.memberId && same(item.memberId || item.id, champion.memberId)) ||
    (champion.memberName && clean(item.memberName || item.name) === clean(champion.memberName))
  );
  const memberName = champion.memberName || participant?.memberName || participant?.name || "";
  return {
    memberId: cleanId(champion.memberId || participant?.memberId || participant?.id || ""),
    memberName,
    avatar: participant?.avatar || participant?.image || avatar(memberName),
  };
}

export function scheduleStageTitleForMatch(competition = {}, match = {}) {
  const typeKey = competitionTypeKey(competition.type || "league");
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const phase = clean(match.phase || "");
  if (typeKey === "world_cup") return worldCupAdminRoundTitle(match, match.round || "");
  if (typeKey === "champions_league") return championsLeagueAdminRoundTitle(match, match.round || "");
  if (leagueGroupsMode) return leagueTwoGroupsAdminRoundTitle(match, match.round || "");
  if (phase === "qualification") return match.label || "الملحق المؤهل";
  return match.round ? "الجولة " + match.round : (match.label || "المباريات");
}

export function groupLeagueMatchesByRound(matches = []) {
  const map = new Map();
  (matches || []).forEach((match) => {
    if (["excluded", "cancelled"].includes(clean(match.resultStatus || match.status || "")) || clean(match.absenceAction || "") === "excluded") return;
    const round = toNumber(match.round || 1) || 1;
    if (!map.has(round)) map.set(round, []);
    map.get(round).push(match);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, rows]) => ({ round, matches: rows }));
}

export function competitionTypeLabel(type) {
  const value = clean(type || "league");
  const labels = {
    league: "الدوري",
    league_qualifier: "ملحق الدوري",
    cup: "الكأس",
    super_cup: "السوبر",
    champions_league: "دوري الأبطال",
    world_cup: "كأس العالم",
    mini_league: "دوري المجموعة",
  };
  return labels[value] || "بطولة";
}

export function competitionDefaultIcon(type = "") {
  const value = competitionTypeKey(type);
  const icons = {
    league: "🏆",
    league_qualifier: "🎯",
    cup: "🏅",
    super_cup: "⭐",
    champions_league: "⭐",
    world_cup: "🌐",
    mini_league: "⚽",
  };
  return icons[value] || "🏟️";
}

export function competitionTrophyLookupKeys(type = "") {
  const value = competitionTypeKey(type);
  const keys = {
    league: ["league", "الدوري", "دوري", "الدورى", "درع الدوري", "بطولة الدوري"],
    league_qualifier: ["league_qualifier", "ملحق الدوري", "ملحق"],
    cup: ["cup", "الكأس", "الكاس", "كأس"],
    super_cup: ["super_cup", "super", "السوبر", "كأس السوبر"],
    champions_league: ["champions_league", "دوري الأبطال", "دوري الابطال", "دوري أبطال", "الأبطال", "ابطال", "أبطال", "Champions League", "UCL"],
    world_cup: ["world_cup", "كأس العالم", "كاس العالم"],
    mini_league: ["mini_league", "دوري المجموعة", "مجموعة", "mini_group"],
  };
  return keys[value] || [value];
}

export function competitionLogoFromTrophyMap(type = "", trophyMap = {}) {
  const values = Object.values(trophyMap || {});
  const keys = competitionTrophyLookupKeys(type);
  for (const key of keys) {
    const direct = trophyMap[cleanId(key)] || trophyMap[clean(key)] || trophyMap[key];
    const url = normalizeImageUrl(direct?.image || direct?.logo || direct?.icon || direct?.trophyImage || "");
    if (url) return url;
  }
  for (const row of values) {
    const name = clean(row?.name || row?.title || row?.trophyId || "");
    if (!name) continue;
    const matched = keys.some((key) => name === clean(key) || name.includes(clean(key)) || clean(key).includes(name));
    if (matched) {
      const url = normalizeImageUrl(row?.image || row?.logo || row?.icon || row?.trophyImage || "");
      if (url) return url;
    }
  }
  return "";
}

export function competitionLogoFromConfig(type = "", config = {}) {
  const value = competitionTypeKey(type);
  const map = {
    league: config.leagueLogo || config.leagueIcon || config.dawriLogo,
    league_qualifier: config.leagueQualifierLogo || config.leagueLogo || config.leagueIcon,
    cup: config.cupLogo || config.cupIcon,
    super_cup: config.superCupLogo || config.superCupIcon,
    champions_league: config.championsLeagueLogo || config.championsLeagueIcon,
    world_cup: config.worldCupLogo || config.worldCupIcon,
    mini_league: config.miniLeagueLogo || config.leagueLogo || config.leagueIcon,
  };
  return normalizeImageUrl(map[value] || "");
}

export function competitionLogoUrl(competition = {}, config = {}, trophyMap = {}) {
  return normalizeImageUrl(
    competition.logo ||
      competition.icon ||
      competition.image ||
      competition.trophyImage ||
      competition.trophyLogo ||
      ""
  ) || competitionLogoFromTrophyMap(competition.type, trophyMap) || competitionLogoFromConfig(competition.type, config);
}

export function competitionStatusLabel(status) {
  const value = clean(status || "active");
  const labels = {
    draft: "مسودة",
    active: "نشط",
    completed: "مغلق",
    cancelled: "ملغى",
  };
  return labels[value] || status || "نشط";
}

// ── Knockout bracket qualified IDs ─────────────────────────────────────────
export function computeKnockoutQualifiedIds(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const ids = [];
  matches.forEach((match) => {
    if (match.phase === "bye" && match.winnerMemberId) {
      const id = cleanId(match.winnerMemberId);
      if (id && !ids.includes(id)) ids.push(id);
    }
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId) {
      const id = cleanId(match.winnerMemberId);
      if (id && !ids.includes(id)) ids.push(id);
    }
  });
  return ids;
}

// ── League qualifier qualified IDs ─────────────────────────────────────────
export function computeLeagueQualifierQualifiedIds(competition = {}) {
  const matches = Array.isArray(competition.matches) ? competition.matches : [];
  const q = Math.max(1, toNumber(competition.qualifiersCount || 1));
  const ids = [];
  matches.forEach((match) => {
    if (match.phase === "bye" && match.winnerMemberId) ids.push(cleanId(match.winnerMemberId));
    if (clean(match.resultStatus || match.status) === "completed" && match.winnerMemberId && ["qualifier", "final"].includes(clean(match.phase || ""))) ids.push(cleanId(match.winnerMemberId));
  });
  return Array.from(new Set(ids.filter(Boolean))).slice(0, q);
}

// ── World Cup admin round title ─────────────────────────────────────────────
export function worldCupAdminRoundTitle(match = {}, fallbackRound = "") {
  const phase = clean(match.phase || "");
  if (phase === "group") return "مباريات المجموعة " + (match.groupName || match.groupKey || "");
  if (phase === "round_of_16") return "دور الـ16";
  if (phase === "quarterfinal") return "ربع النهائي";
  if (phase === "semifinal") return "نصف النهائي";
  if (phase === "third_place") return "مباراة تحديد الثالث";
  if (phase === "final") return "النهائي";
  return match.label || (fallbackRound ? "الجولة " + fallbackRound : "المباريات");
}
