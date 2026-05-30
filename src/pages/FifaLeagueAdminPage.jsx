import React, { useState, useMemo, useEffect } from 'react'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean, isEnabled } from '../utils/helpers'
import { sortRecordsDesc, getActiveMembers } from '../utils/data'
import { competitionTypeKey, competitionTimeValue, isLeagueGroupsCompetition, isChampionsLeagueSingleGroup, championsLeagueGroupRows, worldCupGroupRows, leagueStandingTieKey, tieBreakDecisionKey, championsLeagueAdminRoundTitle, leagueTwoGroupsAdminRoundTitle, groupLeagueMatchesByRound, roundLabelForBracket, computeLeagueStandings, filterCompetitionParticipantsForCalculation, filterCompetitionMatchesForCalculation, getApprovedCompetitionChampionName, getKnockoutChampion, isCompetitionExcludedMember, competitionTypeLabel, competitionStatusLabel, linkedCupGroupIsReady, knockoutBracketSizeForCount, competitionAbsenceInfoForMember, linkedCupGroupNumber, buildLinkedLeagueCupDisplayCompetition, isLinkedLeagueGroupsCup, sortedCompetitionMatchesForSchedule, generateLinkedLeagueGroupsCupPlan, computeKnockoutQualifiedIds, computeLeagueQualifierQualifiedIds, worldCupAdminRoundTitle } from '../utils/competition'
import { WorldCupGroupsSection, ChampionsLeagueGroupsSection, KnockoutBracketSection } from '../components/competition/CompetitionViewerSection'
import { downloadCompetitionFullDetailsImage, downloadCompetitionStandingsImage, downloadCompetitionScheduleTableImage, downloadCompetitionResultsImage } from '../utils/canvas'
import CompetitionIcon from '../components/competition/CompetitionIcon'
import CompetitionStatsBox from '../components/competition/CompetitionStatsBox'

const adminFoldCss = `
.leagueAdminShell .adminFoldPanel{position:relative;margin-bottom:12px;overflow:hidden}
.leagueAdminShell .adminFoldSummary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;padding:0;user-select:none;text-align:right}
.leagueAdminShell .adminFoldSummary::-webkit-details-marker{display:none}
.leagueAdminShell .adminFoldSummary h3{margin:0;font-size:16px;font-weight:1000;color:#EDF0FF;line-height:1.35}
.leagueAdminShell .adminFoldSummary p{margin:4px 0 0;font-size:11px;font-weight:800;color:#9BA0C0;line-height:1.55}
.leagueAdminShell .adminFoldToggle{flex:0 0 auto;min-width:58px;text-align:center;border-radius:999px;padding:5px 10px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.24);color:#A7F3D0;font-size:10px;font-weight:1000}
.leagueAdminShell .adminFoldPanel[open]>.adminFoldSummary{padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:12px}
.leagueAdminShell .adminFoldPanel:not([open]){padding-bottom:14px}
.leagueAdminShell .adminFoldBody{position:relative;z-index:1}
.leagueAdminShell .adminFoldBody>.sectionBox,.leagueAdminShell .adminFoldBody>form.sectionBox{margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.leagueAdminShell .adminFoldBody>.sectionBox>.sectionHead:first-child,.leagueAdminShell .adminFoldBody>form.sectionBox>.sectionHead:first-child{display:none!important}
.leagueAdminShell .adminFoldPanel.adminFoldDanger{border-color:rgba(230,57,70,.24)!important;background:linear-gradient(145deg,rgba(230,57,70,.055),rgba(6,15,34,.78))!important}
.leagueAdminShell .adminFoldPanel.adminFoldDanger .adminFoldToggle{background:rgba(230,57,70,.12);border-color:rgba(230,57,70,.32);color:#fecaca}
.leagueAdminShell .adminFoldQuickHint{font-size:10px;font-weight:900;color:#6270A0;margin-top:6px}
@media(max-width:520px){.leagueAdminShell .adminFoldSummary{align-items:flex-start}.leagueAdminShell .adminFoldToggle{min-width:52px;padding:5px 8px}.leagueAdminShell .adminFoldSummary h3{font-size:15px}}
`;


function getLinkedLeagueCupParticipantRowsForAdmin(leagueCompetition = {}) {
  const groups = championsLeagueGroupRows(leagueCompetition);
  const byId = new Map();

  groups.forEach((group, groupIndex) => {
    const groupKey = group.groupKey || (groupIndex === 0 ? "A" : "B");
    const groupNumber = linkedCupGroupNumber(groupKey, groupIndex);
    (group.participants || []).forEach((row, index) => {
      const memberId = cleanId(row.memberId || row.id || "");
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
      if (byId.has(memberId)) return;
      byId.set(memberId, {
        memberId,
        memberName: row.memberName || row.name || memberId,
        groupKey,
        groupName: `المجموعة ${groupNumber}`,
        order: byId.size + 1,
        seed: index + 1,
        status: "active",
      });
    });
  });

  if (!byId.size) {
    (leagueCompetition.participants || []).forEach((row, index) => {
      const memberId = cleanId(row.memberId || row.id || "");
      if (!memberId || String(memberId).startsWith("__") || memberId === "__bye__") return;
      byId.set(memberId, {
        memberId,
        memberName: row.memberName || row.name || memberId,
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


export default function FifaLeagueAdminPage({ members = [], seasons = [], activeSeasonId = "S6", competitions = [], trophyMap = {}, config = {}, onCreateLeague, onUpdateMatchResult, onClearMatchResult, onFinalizeLeague, onCancelCompetition, onApplyAbsenceAction, onUpdateCompetitionNote, onUpdateTieBreakDecision }) {
  const activeMembers = getActiveMembers(members);
  const competitionRows = (competitions || [])
    .filter((item) => ["league", "league_qualifier", "cup", "super_cup", "world_cup", "champions_league"].includes(competitionTypeKey(item.type || "league")))
    .sort((a, b) => competitionTimeValue(b) - competitionTimeValue(a));
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(competitionRows[0]?.id || "");
  const selectedCompetition = competitionRows.find((item) => same(item.id, selectedCompetitionId)) || competitionRows[0] || null;
  const [competitionType, setCompetitionType] = useState("league");
  const [leagueName, setLeagueName] = useState("دوري الموسم");
  const [leagueSeasonId, setLeagueSeasonId] = useState(activeSeasonId || "S6");
  const startDate = "";
  const endDate = "";
  const [roundsMode, setRoundsMode] = useState("single");
  const [leagueFormat, setLeagueFormat] = useState("single_group");
  const leagueTwoGroupsEnabled = competitionType === "league" && leagueFormat === "two_groups";
  const [onlineMemberId, setOnlineMemberId] = useState("");
  const [fifaQuotaPerMember, setFifaQuotaPerMember] = useState("2");
  const [gameDistributionMode, setGameDistributionMode] = useState("auto");
  const [fifa2025MatchCount, setFifa2025MatchCount] = useState("2");
  const [qualifiersCount, setQualifiersCount] = useState("1");
  const [leagueQualifierEnabled, setLeagueQualifierEnabled] = useState(false);
  const [leagueQualifierParticipantIds, setLeagueQualifierParticipantIds] = useState([]);
  const [leagueQualifierQualifiedCount, setLeagueQualifierQualifiedCount] = useState("1");
  const [rewardFirst, setRewardFirst] = useState("20000000");
  const [rewardSecond, setRewardSecond] = useState("10000000");
  const [rewardThird, setRewardThird] = useState("5000000");
  const [rewardFourth, setRewardFourth] = useState("");
  const [autoPayRewards, setAutoPayRewards] = useState(false);
  const [participantIds, setParticipantIds] = useState([]);
  const [manualSeedMap, setManualSeedMap] = useState({});
  const [cupManualPairingsEnabled, setCupManualPairingsEnabled] = useState(false);
  const [cupLinkedLeagueCompetitionId, setCupLinkedLeagueCompetitionId] = useState("");
  const [cupPairings, setCupPairings] = useState([]);
  const [worldCupQualifiersEnabled, setWorldCupQualifiersEnabled] = useState(false);
  const [championsLeagueQualifiersEnabled, setChampionsLeagueQualifiersEnabled] = useState(false);
  const [championsLeagueFormat, setChampionsLeagueFormat] = useState("groups_knockout");
  const [groupAssignmentMode, setGroupAssignmentMode] = useState("auto");
  const [manualGroupMap, setManualGroupMap] = useState({});
  const [tieBreakFinalMode, setTieBreakFinalMode] = useState("playoff");
  const [resultInputs, setResultInputs] = useState({});
  const [tieBreakInputs, setTieBreakInputs] = useState({});
  const [relegatedIds, setRelegatedIds] = useState([]);
  const [absentIds, setAbsentIds] = useState([]);
  const [absenceMemberId, setAbsenceMemberId] = useState("");
  const [absenceMode, setAbsenceMode] = useState("exclude");
  const [absenceWinGoals, setAbsenceWinGoals] = useState("3");
  const [absenceLoseGoals, setAbsenceLoseGoals] = useState("0");
  const [absenceNote, setAbsenceNote] = useState("");
  const [competitionAdminNote, setCompetitionAdminNote] = useState("");
  const [cancelReason, setCancelReason] = useState("حذف إداري بسبب خطأ في إنشاء البطولة");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!participantIds.length && activeMembers.length) setParticipantIds(activeMembers.map((member) => cleanId(member.id)).filter(Boolean));
  }, [activeMembers.length]);
  useEffect(() => {
    setManualSeedMap((current) => {
      const next = { ...current };
      participantIds.forEach((id, index) => {
        const safeId = cleanId(id);
        if (safeId && !next[safeId]) next[safeId] = String(index + 1);
      });
      Object.keys(next).forEach((id) => {
        if (!participantIds.some((item) => same(item, id))) delete next[id];
      });
      return next;
    });
  }, [participantIds.join("|")]);

  const manualGroupAssignmentEnabled =
    (competitionType === "league" && leagueTwoGroupsEnabled) ||
    (competitionType === "world_cup") ||
    (competitionType === "champions_league" && championsLeagueFormat !== "single_group");
  const manualGroupKeys = competitionType === "world_cup" ? ["A", "B", "C"] : ["A", "B"];
  const manualGroupsPayload = manualGroupKeys.reduce((acc, key) => {
    acc[key] = participantIds
      .filter((memberId) => String(manualGroupMap[cleanId(memberId)] || "").trim().toUpperCase() === key)
      .map(cleanId)
      .filter(Boolean);
    return acc;
  }, {});

  useEffect(() => {
    setManualGroupMap((current) => {
      const next = { ...current };
      const fallbackKey = manualGroupKeys[0] || "A";
      participantIds.forEach((id) => {
        const safeId = cleanId(id);
        if (safeId && !manualGroupKeys.includes(String(next[safeId] || "").trim().toUpperCase())) next[safeId] = fallbackKey;
      });
      Object.keys(next).forEach((id) => {
        if (!participantIds.some((item) => same(item, id))) delete next[id];
      });
      return next;
    });
  }, [participantIds.join("|"), manualGroupKeys.join("|")]);

  useEffect(() => {
    if (!manualGroupAssignmentEnabled && groupAssignmentMode !== "auto") setGroupAssignmentMode("auto");
  }, [manualGroupAssignmentEnabled, groupAssignmentMode]);

  const linkedLeagueCupOptions = competitionRows.filter((item) => isLeagueGroupsCompetition(item) && !["cancelled"].includes(clean(item.status || "active")));
  const selectedLinkedLeagueCup = linkedLeagueCupOptions.find((item) => same(item.id, cupLinkedLeagueCompetitionId)) || null;
  const linkedCupPreviewGroups = selectedLinkedLeagueCup ? championsLeagueGroupRows(selectedLinkedLeagueCup).slice(0, 2) : [];
  const linkedCupParticipantIds = selectedLinkedLeagueCup ? getLinkedLeagueCupParticipantRowsForAdmin(selectedLinkedLeagueCup).map((row) => cleanId(row.memberId)).filter(Boolean) : [];
  const cupLinkedLeagueGroupsEnabled = false;
  const cupBracketSize = competitionType === "cup" && !cupLinkedLeagueGroupsEnabled ? knockoutBracketSizeForCount(participantIds.length) : 0;
  const cupPairingCount = cupBracketSize ? cupBracketSize / 2 : 0;
  const cupPairingRows = Array.from({ length: cupPairingCount }, (_, index) => cupPairings[index] || { homeMemberId: "", awayMemberId: "" });
  const cupPairingUsedCount = new Set(cupPairingRows.flatMap((row) => [cleanId(row.homeMemberId), cleanId(row.awayMemberId)]).filter(Boolean)).size;
  const cupCreationMode = cupManualPairingsEnabled ? "manual" : "seeded";
  const activeCompetitionSeasonId = cleanId(activeSeasonId || config.activeSeasonId || "S6");
  const activeCompetitionSeasonLabel = config.seasonTitle || config.seasonName || activeCompetitionSeasonId;
  useEffect(() => {
    if (!same(leagueSeasonId, activeCompetitionSeasonId)) {
      setLeagueSeasonId(activeCompetitionSeasonId);
    }
  }, [activeCompetitionSeasonId, leagueSeasonId]);
  useEffect(() => {
    if (competitionType !== "cup") return;
    const allowedIds = new Set(participantIds.map(cleanId).filter(Boolean));
    setCupPairings((current) =>
      Array.from({ length: cupPairingCount }, (_, index) => {
        const row = current[index] || {};
        const homeMemberId = allowedIds.has(cleanId(row.homeMemberId)) ? cleanId(row.homeMemberId) : "";
        const awayMemberId = allowedIds.has(cleanId(row.awayMemberId)) ? cleanId(row.awayMemberId) : "";
        return { homeMemberId, awayMemberId };
      })
    );
  }, [competitionType, cupPairingCount, participantIds.join("|")]);
  useEffect(() => {
    if (!selectedCompetitionId && competitionRows[0]?.id) setSelectedCompetitionId(competitionRows[0].id);
  }, [competitionRows.length, selectedCompetitionId]);
  useEffect(() => {
    if (selectedCompetition) {
      setRelegatedIds(Array.isArray(selectedCompetition.relegatedMemberIds) ? selectedCompetition.relegatedMemberIds : []);
      setAbsentIds(Array.isArray(selectedCompetition.absentMemberIds) ? selectedCompetition.absentMemberIds : []);
      setAbsenceMemberId("");
      setAbsenceMode("exclude");
      setAbsenceWinGoals("3");
      setAbsenceLoseGoals("0");
      setAbsenceNote("");
      setCompetitionAdminNote(String(selectedCompetition.adminNote || ""));
    }
  }, [selectedCompetition?.id]);

  const selectedTypeKey = competitionTypeKey(selectedCompetition?.type || "league");
  const selectedLeagueGroupsMode = selectedCompetition ? isLeagueGroupsCompetition(selectedCompetition) : false;
  const selectedIsCLSingleGroup = selectedCompetition ? isChampionsLeagueSingleGroup(selectedCompetition) : false;
  const selectedIsLeague = (selectedTypeKey === "league" || selectedIsCLSingleGroup) && !selectedLeagueGroupsMode;
  const selectedIsAnyLeague = selectedTypeKey === "league" || selectedIsCLSingleGroup;
  const selectedMatches = Array.isArray(selectedCompetition?.matches) ? selectedCompetition.matches : [];
  const embeddedLeagueQualifierMatches = selectedTypeKey === "league" && !selectedLeagueGroupsMode && selectedCompetition?.leagueQualifier?.enabled ? (selectedCompetition.leagueQualifier.matches || []).map((match) => ({ ...match, scope: "league_qualifier" })) : [];
  const selectedStandings = useMemo(() => {
    if (!selectedCompetition || !selectedIsLeague) return [];
    return computeLeagueStandings(filterCompetitionParticipantsForCalculation(selectedCompetition), filterCompetitionMatchesForCalculation(selectedCompetition));
  }, [selectedCompetition, selectedIsLeague]);
  const selectedRelegationRows = selectedIsLeague ? selectedStandings : selectedIsAnyLeague ? (selectedCompetition?.participants || []) : [];
  const groupedMatches = groupLeagueMatchesByRound([...embeddedLeagueQualifierMatches, ...selectedMatches]);
  const completedCount = selectedMatches.filter((match) => clean(match.resultStatus || match.status) === "completed").length;
  const qualifiedIds = !selectedIsLeague && selectedCompetition ? (selectedTypeKey === "league_qualifier" ? computeLeagueQualifierQualifiedIds(selectedCompetition) : computeKnockoutQualifiedIds(selectedCompetition)) : [];
  const absenceInfo = selectedCompetition && absenceMemberId ? competitionAbsenceInfoForMember(selectedCompetition, absenceMemberId) : { played: 0, remaining: 0, affected: 0 };

  function buildTieBreakGroupsForAdmin(competition = {}) {
    const typeKey = competitionTypeKey(competition?.type || "league");
    const rows = [];
    const pushFromStandings = (standings = [], scope = "table", groupKey = "main", groupName = "جدول الترتيب") => {
      const map = new Map();
      (standings || []).filter((row) => row?.needsPlayoff).forEach((row) => {
        const tieKey = leagueStandingTieKey(row);
        const key = tieBreakDecisionKey(scope, groupKey, tieKey);
        if (!map.has(key)) map.set(key, { key, scope, groupKey, groupName, tieKey, members: [] });
        map.get(key).members.push(row);
      });
      map.forEach((item) => {
        const ids = item.members.map((row) => cleanId(row.memberId)).filter(Boolean);
        if (ids.length > 1) rows.push({ ...item, memberIds: ids });
      });
    };
    if (typeKey === "world_cup") {
      worldCupGroupRows(competition).forEach((group, index) => pushFromStandings(group.standings || [], "world_cup_group", group.groupKey || String(index + 1), group.groupName || `المجموعة ${index + 1}`));
    } else if ((typeKey === "champions_league" && !isChampionsLeagueSingleGroup(competition)) || isLeagueGroupsCompetition(competition)) {
      const scope = isLeagueGroupsCompetition(competition) ? "league_group" : "champions_group";
      championsLeagueGroupRows(competition).forEach((group, index) => pushFromStandings(group.standings || [], scope, group.groupKey || String(index + 1), group.groupName || `المجموعة ${index + 1}`));
    } else if ((typeKey === "league" || typeKey === "mini_league" || isChampionsLeagueSingleGroup(competition)) && !isLeagueGroupsCompetition(competition)) {
      const standings = computeLeagueStandings(filterCompetitionParticipantsForCalculation(competition), filterCompetitionMatchesForCalculation(competition));
      pushFromStandings(standings, isChampionsLeagueSingleGroup(competition) ? "champions_single_group" : "league", "main", "جدول الترتيب");
    }
    return rows;
  }

  const selectedTieBreakGroups = useMemo(() => selectedCompetition ? buildTieBreakGroupsForAdmin(selectedCompetition) : [], [selectedCompetition]);

  useEffect(() => {
    setTieBreakInputs((current) => {
      const next = { ...current };
      const decisions = Array.isArray(selectedCompetition?.tieBreakDecisions) ? selectedCompetition.tieBreakDecisions : [];
      selectedTieBreakGroups.forEach((group) => {
        if (!next[group.key]) next[group.key] = {};
        const decision = decisions.find((item) => item.key === group.key);
        if (decision?.memberOrder?.length) {
          decision.memberOrder.forEach((memberId, index) => {
            next[group.key][cleanId(memberId)] = String(index + 1);
          });
        }
      });
      return next;
    });
  }, [selectedCompetition?.id, selectedTieBreakGroups.map((group) => group.key).join("|")]);

  function toggleParticipant(id) {
    const safeId = cleanId(id);
    setParticipantIds((current) => current.some((item) => same(item, safeId)) ? current.filter((item) => !same(item, safeId)) : [...current, safeId]);
  }
  function toggleLeagueQualifierParticipant(id) {
    const safeId = cleanId(id);
    setLeagueQualifierParticipantIds((current) => current.some((item) => same(item, safeId)) ? current.filter((item) => !same(item, safeId)) : [...current, safeId]);
  }
  function updateManualSeed(memberId, seed) {
    const safeId = cleanId(memberId);
    setManualSeedMap((current) => ({ ...current, [safeId]: String(seed || "") }));
  }
  function updateManualGroup(memberId, groupKey) {
    const safeId = cleanId(memberId);
    const safeGroupKey = String(groupKey || "").trim().toUpperCase();
    if (!safeId || !manualGroupKeys.includes(safeGroupKey)) return;
    setManualGroupMap((current) => ({ ...current, [safeId]: safeGroupKey }));
  }
  function updateCupPairing(index, side, value) {
    const safeValue = cleanId(value || "");
    setCupPairings((current) => {
      const next = Array.from({ length: cupPairingCount }, (_, rowIndex) => ({ ...(current[rowIndex] || { homeMemberId: "", awayMemberId: "" }) }));
      next[index] = { ...(next[index] || { homeMemberId: "", awayMemberId: "" }), [side]: safeValue };
      return next;
    });
  }
  function toggleRelegated(id) {
    const safeId = cleanId(id);
    setRelegatedIds((current) => current.some((item) => same(item, safeId)) ? current.filter((item) => !same(item, safeId)) : [...current, safeId]);
  }
  function toggleAbsent(id) {
    const safeId = cleanId(id);
    setAbsentIds((current) => current.some((item) => same(item, safeId)) ? current.filter((item) => !same(item, safeId)) : [...current, safeId]);
  }

  async function submitCreateCompetition(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      await onCreateLeague?.({
        competitionType,
        name: leagueName,
        seasonId: activeCompetitionSeasonId,
        startDate,
        endDate,
        roundsMode,
        leagueFormat,
        championsLeagueFormat,
        onlineMemberId,
        fifaQuotaPerMember,
        maxFifaPerRound: fifaQuotaPerMember,
        gameDistributionMode,
        fifa2025MatchCount,
        qualifiersCount,
        worldCupQualifiersEnabled,
        championsLeagueQualifiersEnabled,
        leagueQualifierEnabled,
        leagueQualifierParticipantIds,
        leagueQualifierQualifiedCount,
        participantIds,
        manualSeeds: manualSeedMap,
        groupAssignmentMode: manualGroupAssignmentEnabled ? groupAssignmentMode : "auto",
        manualGroups: manualGroupAssignmentEnabled && groupAssignmentMode === "manual" ? manualGroupsPayload : {},
        tieBreakFinalMode,
        cupManualPairingsEnabled: cupManualPairingsEnabled && !cupLinkedLeagueGroupsEnabled,
        cupPairings: cupManualPairingsEnabled && !cupLinkedLeagueGroupsEnabled ? cupPairingRows : [],
        cupLinkedLeagueCompetitionId: "",
        rewards: { first: rewardFirst, second: rewardSecond, third: rewardThird, fourth: rewardFourth },
        autoPayRewards,
      });
      setMessage(competitionType === "league_qualifier" ? "تم إنشاء ملحق الدوري بنجاح." : competitionType === "cup" ? "تم إنشاء بطولة الكأس وبناء الأدوار الإقصائية." : competitionType === "super_cup" ? "تم إنشاء كأس السوبر كمباراة نهائية واحدة." : competitionType === "world_cup" ? "تم إنشاء كأس العالم بنظام 3 مجموعات ثم الأدوار الإقصائية." : competitionType === "champions_league" ? (championsLeagueFormat === "single_group" ? `تم إنشاء دوري الأبطال - مجموعة واحدة (${roundsMode === "double" ? "ذهاب وإياب" : "ذهاب فقط"}) وجدولة المباريات.` : "تم إنشاء دوري الأبطال بنظام مجموعتين ثم الأدوار الإقصائية.") : leagueTwoGroupsEnabled ? "تم إنشاء الدوري بنظام مجموعتين ثم الأدوار الإقصائية." : leagueQualifierEnabled ? "تم إنشاء الدوري مع ملحق مؤهل مرتبط بنفس النسخة." : "تم إنشاء الدوري وجدولة المباريات بنجاح.");
    } catch (err) { setMessage(err?.message || "تعذر إنشاء البطولة."); }
    finally { setBusy(false); }
  }

  async function submitMatchResult(match) {
    if (!selectedCompetition || busy) return;
    const values = resultInputs[match.id] || {};
    const homeGoals = values.homeGoals ?? (clean(match.resultStatus || match.status) === "completed" ? match.homeGoals : "");
    const awayGoals = values.awayGoals ?? (clean(match.resultStatus || match.status) === "completed" ? match.awayGoals : "");
    const homePens = values.homePens ?? (clean(match.resultStatus || match.status) === "completed" ? match.homePens : "");
    const awayPens = values.awayPens ?? (clean(match.resultStatus || match.status) === "completed" ? match.awayPens : "");
    setBusy(true); setMessage("");
    try {
      await onUpdateMatchResult?.({ competitionId: selectedCompetition.id, matchId: match.id, homeGoals, awayGoals, homePens, awayPens, gameTitle: values.gameTitle ?? match.gameTitle });
      setMessage("تم حفظ النتيجة وتحديث البيانات.");
    } catch (err) { setMessage(err?.message || "تعذر حفظ النتيجة."); }
    finally { setBusy(false); }
  }

  async function submitClearMatchResult(match) {
    if (!selectedCompetition || busy) return;
    if (typeof window !== "undefined" && !window.confirm("حذف نتيجة هذه المباراة وإعادتها إلى انتظار النتيجة؟")) return;
    setBusy(true); setMessage("");
    try {
      await onClearMatchResult?.({ competitionId: selectedCompetition.id, matchId: match.id });
      setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), homeGoals: "", awayGoals: "", homePens: "", awayPens: "" } }));
      setMessage("تم حذف النتيجة وتحديث الترتيب.");
    } catch (err) { setMessage(err?.message || "تعذر حذف النتيجة."); }
    finally { setBusy(false); }
  }

  async function submitTieBreakDecision(group) {
    if (!selectedCompetition || busy || !group?.key) return;
    const values = tieBreakInputs[group.key] || {};
    const orderRows = (group.members || [])
      .map((row) => ({ memberId: cleanId(row.memberId), rank: toNumber(values[cleanId(row.memberId)]) }))
      .filter((row) => row.memberId);
    const ranks = orderRows.map((row) => row.rank).filter(Boolean);
    if (orderRows.length < 2 || ranks.length !== orderRows.length || new Set(ranks).size !== ranks.length) {
      setMessage("رتّب جميع أعضاء الفاصلة بأرقام مختلفة قبل الحفظ.");
      return;
    }
    const memberOrder = orderRows.sort((a, b) => a.rank - b.rank).map((row) => row.memberId);
    setBusy(true); setMessage("");
    try {
      await onUpdateTieBreakDecision?.({
        competitionId: selectedCompetition.id,
        key: group.key,
        scope: group.scope,
        groupKey: group.groupKey,
        groupName: group.groupName,
        tieKey: group.tieKey,
        memberOrder,
        note: "حسم إداري بعد مباراة فاصلة خارج حسابات البطولة",
      });
      setMessage("تم حفظ حسم الفاصلة وتحديث المتأهلين.");
    } catch (err) { setMessage(err?.message || "تعذر حفظ حسم الفاصلة."); }
    finally { setBusy(false); }
  }


  async function submitAbsenceAction() {
    if (!selectedCompetition || busy) return;
    if (!absenceMemberId) { setMessage("اختر العضو الغائب أولًا."); return; }
    const modeLabel = absenceMode === "forfeit_loss" ? "تسجيل خسارة إدارية للمباريات المتبقية" : "استبعاد العضو من البطولة";
    if (typeof window !== "undefined" && !window.confirm("تأكيد إجراء الغياب: " + modeLabel + "؟")) return;
    setBusy(true); setMessage("");
    try {
      await onApplyAbsenceAction?.({
        competitionId: selectedCompetition.id,
        memberId: absenceMemberId,
        mode: absenceMode,
        forfeitWinGoals: absenceWinGoals,
        forfeitLoseGoals: absenceLoseGoals,
        note: absenceNote,
      });
      setMessage(absenceMode === "forfeit_loss" ? "تم تسجيل الخسارة الإدارية للمباريات المتبقية وتحديث البطولة." : "تم استبعاد العضو من البطولة وتحديث الجداول.");
      setAbsenceMemberId("");
      setAbsenceNote("");
    } catch (err) { setMessage(err?.message || "تعذر تطبيق إجراء الغياب."); }
    finally { setBusy(false); }
  }

  async function submitFinalizeCompetition() {
    if (!selectedCompetition || busy) return;
    setBusy(true); setMessage("");
    try {
      await onFinalizeLeague?.({ competitionId: selectedCompetition.id, relegatedMemberIds: relegatedIds, absentMemberIds: absentIds });
      setMessage(clean(selectedCompetition.status) === "completed" && ["cup", "super_cup"].includes(selectedTypeKey) ? "تم إعادة اعتماد البطولة وتصحيح المكافآت حسب النتائج الحالية." : "تم اعتماد البطولة وأرشفتها داخل البطولات التنافسية.");
    } catch (err) { setMessage(err?.message || "تعذر اعتماد البطولة."); }
    finally { setBusy(false); }
  }

  async function submitCompetitionAdminNote() {
    if (!selectedCompetition || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await onUpdateCompetitionNote?.({ competitionId: selectedCompetition.id, note: competitionAdminNote });
      setMessage("تم حفظ ملاحظة البطولة بنجاح.");
    } catch (err) {
      setMessage(err?.message || "تعذر حفظ ملاحظة البطولة.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCancelCompetition() {
    if (!selectedCompetition || busy) return;
    setBusy(true); setMessage("");
    try {
      await onCancelCompetition?.({ competitionId: selectedCompetition.id, reason: cancelReason });
      setMessage("تم حذف البطولة نهائيًا مع حفظ أثر القرار في سجل FIFA.");
    } catch (err) { setMessage(err?.message || "تعذر حذف البطولة."); }
    finally { setBusy(false); }
  }

  return (
    <main className="pageShell fifaAdminShell leagueAdminShell">
      <style>{adminFoldCss}</style>
      <section className="sectionBox glassSoft fifaAdminHero">
        <div><span className="heroKicker">FIFA ADMIN</span><h2>إدارة البطولات التنافسية</h2></div><strong>🏟️</strong>
      </section>
      {message ? <div className="adminMessage glassSoft">{message}</div> : null}

      <section className="adminGrid">
        <details className="sectionBox glassSoft adminFoldPanel adminFoldCreate">
          <summary className="adminFoldSummary"><div><h3>إنشاء بطولة جديدة</h3><p>كل خيارات إنشاء البطولة في مكان واحد، وافتح هذا القسم فقط عند الحاجة.</p></div><span className="adminFoldToggle">فتح</span></summary>
          <div className="adminFoldBody">
        <form className="sectionBox glassSoft adminForm" onSubmit={submitCreateCompetition}>
          <div className="sectionHead compact"><div><h3>إنشاء بطولة</h3></div></div>
          <label className="moneyField"><span>نوع البطولة</span><select value={competitionType} onChange={(event) => setCompetitionType(event.target.value)}><option value="league">دوري</option><option value="cup">الكأس</option><option value="super_cup">كأس السوبر</option><option value="world_cup">كأس العالم</option><option value="champions_league">دوري الأبطال</option></select></label>
          <label className="moneyField"><span>اسم البطولة</span><input value={leagueName} onChange={(event) => setLeagueName(event.target.value)} placeholder={competitionType === "league_qualifier" ? "مثال: ملحق الدوري" : competitionType === "cup" ? "مثال: الكأس" : competitionType === "super_cup" ? "مثال: كأس السوبر" : competitionType === "world_cup" ? "مثال: كأس العالم" : competitionType === "champions_league" ? "مثال: دوري الأبطال" : competitionType === "mini_league" ? "مثال: دوري المجموعة" : "مثال: دوري الموسم"} /></label>
          <div className="leagueRuleNote"><b>الموسم الحالي:</b> {activeCompetitionSeasonLabel}{!same(activeCompetitionSeasonLabel, activeCompetitionSeasonId) ? ` (${activeCompetitionSeasonId})` : ""}</div>
{competitionType !== "league" ? <><label className="moneyField"><span>نظام اللعبة للمباريات</span><select value={gameDistributionMode} onChange={(event) => setGameDistributionMode(event.target.value)}><option value="auto">توزيع تلقائي حسب عضو الأونلاين</option><option value="fifa2025_only">كل المباريات FIFA 2025</option><option value="pes2017_only">كل المباريات PES 2017</option><option value="mixed_manual">مكس يدوي بين FIFA 2025 و PES 2017</option></select></label>{gameDistributionMode === "auto" ? <><label className="moneyField"><span>عضو الأونلاين / FIFA 2025</span><select value={onlineMemberId} onChange={(event) => setOnlineMemberId(event.target.value)}><option value="">تلقائي حسب عبد الله</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name || member.id}</option>)}</select></label><label className="moneyField"><span>عدد مباريات FIFA 2025 في كل جولة</span><input inputMode="numeric" value={fifaQuotaPerMember} onChange={(event) => setFifaQuotaPerMember(event.target.value)} placeholder="2" /></label></> : null}{gameDistributionMode === "mixed_manual" ? <label className="moneyField"><span>عدد مباريات FIFA 2025 في البطولة</span><input inputMode="numeric" value={fifa2025MatchCount} onChange={(event) => setFifa2025MatchCount(event.target.value)} placeholder="مثال: 4" /></label> : null}<div className="leagueRuleNote">{gameDistributionMode === "fifa2025_only" ? "سيتم إنشاء كل المباريات على FIFA 2025." : gameDistributionMode === "pes2017_only" ? "سيتم إنشاء كل المباريات على PES 2017." : gameDistributionMode === "mixed_manual" ? "سيتم توزيع عدد مباريات FIFA 2025 الذي تحدده، والباقي PES 2017." : "توزيع اللعبة تلقائي حسب عضو الأونلاين ثم التوزيع العادل."}</div></> : null}
          <div className="leagueRuleNote">تاريخ البطولة يضاف لاحقًا عند اعتماد البطولة أو توثيقها، وليس عند الإنشاء.</div>
          {["league", "world_cup", "champions_league"].includes(competitionType) ? <label className="moneyField"><span>حسم التعادل النهائي</span><select value={tieBreakFinalMode} onChange={(event) => setTieBreakFinalMode(event.target.value)}><option value="playoff">مباراة فاصلة عند التعادل الكامل</option><option value="seed">حسب التصنيف المسبق في القرعة</option></select></label> : null}
          {["league", "world_cup", "champions_league"].includes(competitionType) ? <div className="leagueRuleNote">بعد النقاط وفارق الأهداف والأهداف المسجلة والأهداف المستقبلة: إمّا تظهر فاصلة، أو يُحسم الترتيب حسب التصنيف المسبق للبطولة.</div> : null}
          {competitionType === "league" ? <>
            <div className="leagueRuleNote">الدوري يعمل بنظامك المستقر. يمكن إضافة ملحق مؤهل داخل نفس نسخة الدوري، وليس كبطولة مستقلة.</div>
            <label className="moneyField"><span>شكل الدوري</span><select value={leagueFormat} onChange={(event) => { setLeagueFormat(event.target.value); if (event.target.value === "two_groups") { setRoundsMode("single"); setLeagueQualifierEnabled(false); } }}><option value="single_group">مجموعة واحدة</option><option value="two_groups">مجموعتان + أدوار إقصائية</option></select></label>
            {!leagueTwoGroupsEnabled ? <label className="moneyField"><span>نظام الدوري</span><select value={roundsMode} onChange={(event) => setRoundsMode(event.target.value)}><option value="single">ذهاب فقط</option><option value="double">ذهاب وإياب</option></select></label> : <div className="leagueRuleNote">في نظام المجموعتين، التصنيف يصبح مستويات ويمكن تكراره، ويتم توزيع أعضاء كل مستوى على المجموعتين بالقرعة قدر الإمكان.</div>}
            <label className="moneyField"><span>نظام اللعبة للمباريات</span><select value={gameDistributionMode} onChange={(event) => setGameDistributionMode(event.target.value)}><option value="auto">توزيع تلقائي حسب عضو الأونلاين</option><option value="fifa2025_only">كل المباريات FIFA 2025</option><option value="pes2017_only">كل المباريات PES 2017</option><option value="mixed_manual">مكس يدوي بين FIFA 2025 و PES 2017</option></select></label>
            {gameDistributionMode === "auto" ? <><label className="moneyField"><span>عضو الأونلاين / FIFA 2025</span><select value={onlineMemberId} onChange={(event) => setOnlineMemberId(event.target.value)}><option value="">تلقائي حسب عبد الله</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name || member.id}</option>)}</select></label><label className="moneyField"><span>عدد مباريات FIFA 2025 في كل جولة</span><input inputMode="numeric" value={fifaQuotaPerMember} onChange={(event) => setFifaQuotaPerMember(event.target.value)} placeholder="2" /></label></> : null}
            {gameDistributionMode === "mixed_manual" ? <label className="moneyField"><span>عدد مباريات FIFA 2025 في البطولة</span><input inputMode="numeric" value={fifa2025MatchCount} onChange={(event) => setFifa2025MatchCount(event.target.value)} placeholder="مثال: 4" /></label> : null}
            {competitionType === "league" && !leagueTwoGroupsEnabled ? <><label className="adminCheckLine"><input type="checkbox" checked={leagueQualifierEnabled} onChange={(event) => setLeagueQualifierEnabled(event.target.checked)} /><span>إضافة ملحق مؤهل مرتبط بنفس نسخة الدوري</span></label>
            {leagueQualifierEnabled ? <div className="sectionBox glassSoft"><div className="sectionHead compact"><div><h3>ملحق الدوري داخل نفس النسخة</h3><p>المشاركون المختارون في قائمة البطولة هم المشاركون المباشرون في الدوري. اختر هنا أعضاء الملحق فقط، وحدد عدد المتأهلين منهم إلى نفس نسخة الدوري.</p></div></div><label className="moneyField"><span>عدد المتأهلين من الملحق</span><select value={leagueQualifierQualifiedCount} onChange={(event) => setLeagueQualifierQualifiedCount(event.target.value)}><option value="1">متأهل واحد</option><option value="2">متأهلان</option><option value="3">3 متأهلين</option><option value="4">4 متأهلين</option></select></label><div className="leagueMembersGrid compact">{activeMembers.map((member) => <label key={`lq-${member.id}`} className={leagueQualifierParticipantIds.some((id) => same(id, member.id)) ? "leagueMemberPick active" : "leagueMemberPick"}><input type="checkbox" checked={leagueQualifierParticipantIds.some((id) => same(id, member.id))} onChange={() => toggleLeagueQualifierParticipant(member.id)} /><span>{member.name}</span></label>)}</div><div className="leagueRuleNote">لا يظهر الملحق كبطولة مستقلة، ولا يوجد بطل للملحق. الإشعار يكون للمتأهل/المتأهلين فقط.</div></div> : null}</> : null}
          </> : competitionType === "league_qualifier" ? <label className="moneyField"><span>عدد المتأهلين من الملحق</span><select value={qualifiersCount} onChange={(event) => setQualifiersCount(event.target.value)}><option value="1">متأهل واحد</option><option value="2">متأهلان</option></select></label> : competitionType === "super_cup" ? <div className="leagueRuleNote">كأس السوبر مباراة نهائية واحدة فقط. اختر عضوين يدويًا، والمكافآت للبطل والوصيف فقط.</div> : competitionType === "world_cup" ? <><div className="leagueRuleNote">كأس العالم الأساسي: حتى 9 أعضاء في 3 مجموعات. إذا زاد العدد عن 9 فعّل التصفيات داخل نفس النسخة، والتصفيات تكون إقصائية عشوائية لتأهيل 9 أعضاء لدور المجموعات.</div><label className="adminCheckLine"><input type="checkbox" checked={worldCupQualifiersEnabled} onChange={(event) => setWorldCupQualifiersEnabled(event.target.checked)} /><span>تشغيل تصفيات كأس العالم عند اختيار أكثر من 9 أعضاء</span></label></> : competitionType === "champions_league" ? <><label className="moneyField"><span>شكل دوري الأبطال</span><select value={championsLeagueFormat} onChange={(event) => { setChampionsLeagueFormat(event.target.value); }}><option value="groups_knockout">دور مجموعات + أدوار إقصائية</option><option value="single_group">مجموعة واحدة من 3 إلى 5 أعضاء</option></select></label>{championsLeagueFormat === "single_group" ? <><div className="leagueRuleNote">مجموعة واحدة من 3 إلى 5 أعضاء: يعمل بنظام الدوري (جدول ترتيب كامل) بدون أدوار إقصائية. اختر عدد المشاركين من قائمة الأعضاء ثم اختر نظام المباريات أدناه.</div><label className="moneyField"><span>نظام المباريات</span><select value={roundsMode} onChange={(event) => setRoundsMode(event.target.value)}><option value="single">ذهاب فقط</option><option value="double">ذهاب وإياب</option></select></label></> : <><div className="leagueRuleNote">دور مجموعات + أدوار إقصائية: حتى 8 أعضاء في مجموعتين، ويتأهل الأول والثاني من كل مجموعة إلى نصف النهائي.</div><label className="adminCheckLine"><input type="checkbox" checked={championsLeagueQualifiersEnabled} onChange={(event) => setChampionsLeagueQualifiersEnabled(event.target.checked)} /><span>تشغيل ملحق دوري الأبطال عند اختيار أكثر من 8 أعضاء</span></label></>}</> : <div className="leagueRuleNote">الكأس بطولة إقصائية كاملة. يمكنك استخدام التصنيف اليدوي، أو تفعيل اختيار المواجهات يدويًا لتحديد من يلعب ضد من.</div>}
          {competitionType === "cup" ? <div className="cupManualMatchupsBox glassSoft">
            <label className="moneyField"><span>طريقة تنظيم الكأس</span><select value={cupCreationMode} onChange={(event) => { const mode = event.target.value; if (mode === "manual") { setCupManualPairingsEnabled(true); } else { setCupManualPairingsEnabled(false); } setCupLinkedLeagueCompetitionId(""); }}><option value="seeded">تصنيف الكأس اليدوي</option><option value="manual">اختيار المواجهات يدويًا</option></select></label>
            {cupCreationMode === "manual" ? <><div className="leagueRuleNote">اختر طرفي كل مباراة من اليمين إلى اليسار. يجب توزيع كل مشارك مرة واحدة فقط. إذا كان عدد المشاركين أقل من حجم القوس، اترك طرفًا واحدًا فارغًا للتأهل المباشر، ولا تترك مباراة كاملة فارغة.</div><div className="cupPairingGrid">{cupPairingRows.map((row, index) => { const homeId = cleanId(row.homeMemberId); const awayId = cleanId(row.awayMemberId); const blockedIds = new Set(cupPairingRows.flatMap((item, rowIndex) => rowIndex === index ? [] : [cleanId(item.homeMemberId), cleanId(item.awayMemberId)]).filter(Boolean)); return <div className="cupPairingRow" key={`cup-pair-${index}`}><strong>مباراة {index + 1}</strong><label className="moneyField"><span>الطرف الأول</span><select value={homeId} onChange={(event) => updateCupPairing(index, "homeMemberId", event.target.value)}><option value="">تأهل مباشر / فارغ</option>{activeMembers.filter((member) => participantIds.some((id) => same(id, member.id))).map((member) => <option key={`cup-home-${index}-${member.id}`} value={member.id} disabled={blockedIds.has(cleanId(member.id)) || same(member.id, awayId)}>{member.name || member.id}</option>)}</select></label><label className="moneyField"><span>الطرف الثاني</span><select value={awayId} onChange={(event) => updateCupPairing(index, "awayMemberId", event.target.value)}><option value="">تأهل مباشر / فارغ</option>{activeMembers.filter((member) => participantIds.some((id) => same(id, member.id))).map((member) => <option key={`cup-away-${index}-${member.id}`} value={member.id} disabled={blockedIds.has(cleanId(member.id)) || same(member.id, homeId)}>{member.name || member.id}</option>)}</select></label></div>; })}</div><div className="leagueRuleNote">تم توزيع {cupPairingUsedCount} من {participantIds.length} مشاركين.</div></> : null}
          </div> : null}
          <div className="leagueRewardGrid">
            <label className="moneyField"><span>مكافأة البطل</span><input inputMode="numeric" value={rewardFirst} onChange={(event) => setRewardFirst(event.target.value)} /></label>
            <label className="moneyField"><span>مكافأة الوصيف</span><input inputMode="numeric" value={rewardSecond} onChange={(event) => setRewardSecond(event.target.value)} /></label>
            {competitionType !== "super_cup" ? <label className="moneyField"><span>مكافأة الثالث</span><input inputMode="numeric" value={rewardThird} onChange={(event) => setRewardThird(event.target.value)} /></label> : null}
            {competitionType !== "super_cup" ? <label className="moneyField"><span>مكافأة الرابع</span><input inputMode="numeric" value={rewardFourth} onChange={(event) => setRewardFourth(event.target.value)} /></label> : null}
          </div>
          {["league", "cup", "super_cup", "world_cup", "champions_league"].includes(competitionType) ? <label className="adminCheckLine"><input type="checkbox" checked={autoPayRewards} onChange={(event) => setAutoPayRewards(event.target.checked)} /><span>{competitionType === "super_cup" ? "صرف مكافآت كأس السوبر تلقائيًا للبطل والوصيف عند الاعتماد" : competitionType === "world_cup" ? "صرف مكافآت كأس العالم تلقائيًا عند اعتماد النتائج" : competitionType === "champions_league" ? "صرف مكافآت دوري الأبطال تلقائيًا عند اعتماد النتائج" : competitionType === "cup" ? "صرف مكافآت الكأس تلقائيًا عند اعتماد النتائج" : "صرف المكافآت تلقائيًا عند اعتماد الدوري"}</span></label> : null}
          {competitionType === "league" ? <div className="leagueRuleNote">{gameDistributionMode === "fifa2025_only" ? "سيتم إنشاء كل مباريات الدوري على FIFA 2025." : gameDistributionMode === "pes2017_only" ? "سيتم إنشاء كل مباريات الدوري على PES 2017." : gameDistributionMode === "mixed_manual" ? "سيتم توزيع عدد مباريات FIFA 2025 الذي تحدده، والباقي PES 2017." : "توزيع اللعبة تلقائي: مباريات عضو الأونلاين على FIFA 2025، والباقي حسب التوزيع العادل."}</div> : null}
          <div className="leagueMembersGrid">{activeMembers.map((member) => <label key={member.id} className={participantIds.some((id) => same(id, member.id)) ? "leagueMemberPick active" : "leagueMemberPick"}><input type="checkbox" checked={participantIds.some((id) => same(id, member.id))} onChange={() => toggleParticipant(member.id)} /><img src={member.avatar || avatar(member.name)} alt="" /><span>{member.name || member.id}</span></label>)}</div>
          {manualGroupAssignmentEnabled ? <div className="leagueSeedGrid"><h4 className="dealSectionTitle">طريقة توزيع المجموعات</h4><label className="moneyField"><span>اختيار التوزيع</span><select value={groupAssignmentMode} onChange={(event) => setGroupAssignmentMode(event.target.value)}><option value="auto">حسب التصنيف التلقائي</option><option value="manual">اختيار المجموعات يدويًا</option></select></label>{groupAssignmentMode === "manual" ? <><div className="leagueRuleNote">اختر المجموعة والتصنيف لكل عضو قبل إنشاء البطولة. التوزيع اليدوي يحدد المجموعة فقط، أما التصنيف فيبقى مهمًا إذا اخترت حسم التعادل حسب التصنيف المسبق.</div>{participantIds.map((memberId, index) => { const member = activeMembers.find((item) => same(item.id, memberId)); const maxSeed = Math.max(1, participantIds.length); return <div key={`manual-group-${memberId}`} className="leagueManualGroupRow"><label className="moneyField"><span>{member?.name || memberId} - المجموعة</span><select value={manualGroupMap[cleanId(memberId)] || manualGroupKeys[0]} onChange={(event) => updateManualGroup(memberId, event.target.value)}>{manualGroupKeys.map((key) => <option key={key} value={key}>المجموعة {key}</option>)}</select></label><label className="moneyField"><span>{member?.name || memberId} - التصنيف</span><select value={manualSeedMap[cleanId(memberId)] || String(index + 1)} onChange={(event) => updateManualSeed(memberId, event.target.value)}>{Array.from({ length: maxSeed }, (_, i) => i + 1).map((seed) => <option key={seed} value={seed}>تصنيف {seed}</option>)}</select></label></div>; })}</> : <div className="leagueRuleNote">سيتم توزيع الأعضاء على المجموعات حسب التصنيف اليدوي/التلقائي الحالي كما كان سابقًا.</div>}</div> : null}
          {["league", "cup", "world_cup", "champions_league"].includes(competitionType) && !(competitionType === "cup" && (cupManualPairingsEnabled || cupLinkedLeagueGroupsEnabled)) && groupAssignmentMode !== "manual" ? <div className="leagueSeedGrid"><h4 className="dealSectionTitle">{competitionType === "league" ? "تصنيف الدوري اليدوي" : competitionType === "world_cup" ? "تصنيف كأس العالم اليدوي" : competitionType === "champions_league" ? "تصنيف دوري الأبطال اليدوي" : "تصنيف الكأس اليدوي"}</h4>{participantIds.map((memberId, index) => { const member = activeMembers.find((item) => same(item.id, memberId)); const maxSeed = competitionType === "cup" ? 8 : Math.max(1, participantIds.length); return <label key={memberId} className="moneyField"><span>{member?.name || memberId}</span><select value={manualSeedMap[cleanId(memberId)] || String(index + 1)} onChange={(event) => updateManualSeed(memberId, event.target.value)}>{Array.from({ length: maxSeed }, (_, i) => i + 1).map((seed) => <option key={seed} value={seed}>تصنيف {seed}</option>)}</select></label>; })}</div> : null}
          <button className="moneySubmitBtn" type="submit" disabled={busy}>{busy ? "جارٍ التنفيذ..." : "إنشاء البطولة"}</button>
        </form>
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminRecentBox" open>
          <summary className="adminFoldSummary"><div><h3>البطولات المحفوظة</h3><p>{competitionRows.length ? `${competitionRows.length} بطولة` : "لا توجد بطولات بعد"}</p></div><span className="adminFoldToggle">إدارة</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft adminRecentBox">
          <div className="competitionInstanceList adminCompetitionInstanceList">{competitionRows.length ? competitionRows.map((competition) => <button type="button" key={competition.id} className={same(selectedCompetition?.id, competition.id) ? "competitionInstanceCard active" : "competitionInstanceCard"} onClick={() => setSelectedCompetitionId(competition.id)}><CompetitionIcon competition={competition} config={config} trophyMap={trophyMap} className="competitionInstanceIcon" /><div><b>{competition.name || competitionTypeLabel(competition.type)}</b><small>{competitionTypeLabel(competition.type)} • {competitionStatusLabel(competition.status)}</small></div></button>) : <div className="empty">أنشئ أول بطولة من النموذج.</div>}</div>
        </section>
          </div>
        </details>
      </section>

      {selectedCompetition ? <>
        <details className="sectionBox glassSoft adminFoldPanel adminFoldOverview" open>
          <summary className="adminFoldSummary"><div><h3>ملخص البطولة والتصدير</h3><p>معلومات البطولة المختارة وأزرار تحميل الصور.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft">
          <div className="sectionHead compact competitionDetailHead"><CompetitionIcon competition={selectedCompetition} config={config} trophyMap={trophyMap} className="competitionDetailIcon" /><div><h3>{selectedCompetition.name}</h3><p>{competitionTypeLabel(selectedCompetition.type)} • {competitionStatusLabel(selectedCompetition.status)} {selectedCompetition.startDate ? `• ${selectedCompetition.startDate}` : ""}{selectedCompetition.endDate ? ` → ${selectedCompetition.endDate}` : ""}</p></div></div>
          <div className="leagueSummaryStrip compactSummaryStrip">
            <div className="leagueSummaryMetric"><span>المشاركون</span><b>{(selectedCompetition.participants || []).length}</b></div>
            <div className="leagueSummaryMetric"><span>المباريات</span><b>{selectedMatches.length}</b></div>
            <div className="leagueSummaryMetric"><span>المكتملة</span><b>{completedCount}</b></div>
            <div className="leagueSummaryMetric"><span>{selectedIsLeague || ["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) ? "البطل" : "المتأهلون"}</span><b>{selectedIsLeague ? getApprovedCompetitionChampionName(selectedCompetition, selectedStandings[0]?.memberName || "") : ["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) ? getApprovedCompetitionChampionName(selectedCompetition, getKnockoutChampion(selectedCompetition)?.memberName || "") : (qualifiedIds.length || "-")}</b></div>
          </div>
          <div className="imageActionRow"><button type="button" onClick={() => downloadCompetitionFullDetailsImage(selectedCompetition, config, trophyMap)}>تحميل صورة تفاصيل البطولة</button><button type="button" onClick={() => downloadCompetitionStandingsImage(selectedCompetition, config, trophyMap)} disabled={!selectedIsLeague && !["world_cup", "champions_league"].includes(selectedTypeKey)}>{selectedTypeKey === "world_cup" || (selectedTypeKey === "champions_league" && !selectedIsCLSingleGroup) ? "تحميل ترتيب المجموعات" : "تحميل صورة الترتيب"}</button>{((selectedTypeKey === "world_cup" || (selectedTypeKey === "champions_league" && !selectedIsCLSingleGroup) || selectedLeagueGroupsMode)) ? <button type="button" onClick={() => downloadCompetitionScheduleTableImage(selectedCompetition, config, trophyMap)}>{clean(selectedCompetition.status) === "completed" ? "تحميل نتائج المباريات" : "تحميل جدول المباريات"}</button> : null}<button type="button" onClick={() => downloadCompetitionResultsImage(selectedCompetition, config, trophyMap)}>{(selectedTypeKey === "world_cup" || (selectedTypeKey === "champions_league" && !selectedIsCLSingleGroup) || selectedLeagueGroupsMode) ? "تحميل صورة الأدوار الإقصائية" : clean(selectedCompetition.status) === "completed" ? "تحميل نتائج المباريات" : "تحميل جدول المباريات"}</button></div>
        </section>
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldGroups">
          <summary className="adminFoldSummary"><div><h3>المجموعات والتأهل</h3><p>تظهر فقط للبطولات التي تحتوي على مجموعات.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        {selectedTypeKey === "world_cup" ? <WorldCupGroupsSection competition={selectedCompetition} config={config} trophyMap={trophyMap} /> : ((selectedTypeKey === "champions_league" && !selectedIsCLSingleGroup) || selectedLeagueGroupsMode) ? <ChampionsLeagueGroupsSection competition={selectedCompetition} config={config} trophyMap={trophyMap} /> : null}
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldStandings" open>
          <summary className="adminFoldSummary"><div><h3>الترتيب والأدوار</h3><p>جدول الترتيب أو الأدوار الإقصائية حسب نوع البطولة.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        {selectedIsLeague ? <section className="sectionBox glassSoft"><div className="sectionHead compact"><div><h3>{selectedIsCLSingleGroup ? "جدول الترتيب" : "ترتيب الدوري"}</h3></div></div><div className="leagueTable"><div className="leagueTableHead"><span>#</span><span>العضو</span><span>لعب</span><span>ف</span><span>ت</span><span>خ</span><span>له</span><span>عليه</span><span>فارق</span><span>نقاط</span></div>{selectedStandings.map((row, index) => <div key={row.memberId} className={index === 0 ? "leagueTableRow champion" : relegatedIds.some((id) => same(id, row.memberId)) ? "leagueTableRow relegated" : absentIds.some((id) => same(id, row.memberId)) ? "leagueTableRow absent" : "leagueTableRow"}><span>{index + 1}</span><span>{row.memberName}{row.needsPlayoff ? <em className="playoffBadge">فاصلة</em> : null}{absentIds.some((id) => same(id, row.memberId)) ? <em className="absentBadge">غائب</em> : null}</span><span>{row.played}</span><span>{row.wins}</span><span>{row.draws}</span><span>{row.losses}</span><span>{row.goalsFor}</span><span>{row.goalsAgainst}</span><span>{row.goalDifference}</span><b>{row.points}</b></div>)}</div></section> : <KnockoutBracketSection competition={selectedCompetition} title="الأدوار الإقصائية" />}
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldTieBreak">
          <summary className="adminFoldSummary"><div><h3>مركز الفواصل</h3><p>حسم التعادل الكامل خارج إحصائيات البطولة.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        {selectedTieBreakGroups.length ? <section className="sectionBox glassSoft"><div className="sectionHead compact"><div><h3>مركز الفواصل</h3><p>رتّب أعضاء الفاصلة بعد لعبها خارج إحصائيات البطولة. هذا الترتيب يستخدم فقط لتحديد المتأهل أو ترتيب الجدول عند التعادل الكامل.</p></div></div><div className="leagueRoundsList">{selectedTieBreakGroups.map((group) => <div className="leagueRoundBox" key={group.key}><h4>{group.groupName} - فاصلة مطلوبة</h4><div className="leagueRuleNote">الأعضاء متساوون في النقاط وفارق الأهداف والأهداف المسجلة والأهداف المستقبلة. اختر ترتيب الفاصلة فقط؛ لن تُضاف كمباراة ضمن الإحصائيات.</div><div className="leagueMembersGrid compact">{group.members.map((row, index) => <label key={`${group.key}-${row.memberId}`} className="moneyField"><span>{row.memberName}</span><select value={(tieBreakInputs[group.key] || {})[cleanId(row.memberId)] || ""} onChange={(event) => setTieBreakInputs((current) => ({ ...current, [group.key]: { ...(current[group.key] || {}), [cleanId(row.memberId)]: event.target.value } }))}><option value="">اختر الترتيب</option>{group.members.map((_, rankIndex) => <option key={rankIndex + 1} value={rankIndex + 1}>المركز {rankIndex + 1}</option>)}</select></label>)}</div><div className="offerCenterActions"><button type="button" onClick={() => submitTieBreakDecision(group)} disabled={busy}>حفظ حسم الفاصلة</button></div></div>)}</div></section> : null}
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldMatches" open>
          <summary className="adminFoldSummary"><div><h3>المباريات والنتائج</h3><p>إدخال وتحديث نتائج المباريات فقط.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft"><div className="sectionHead compact"><div><h3>{clean(selectedCompetition.status) === "completed" ? "نتائج المباريات" : "جدول المباريات"}</h3></div></div><div className="leagueRoundsList">{groupedMatches.map((round) => <div className="leagueRoundBox" key={round.round}><h4>{selectedIsLeague ? (round.matches?.[0]?.scope === "league_qualifier" ? `ملحق الدوري - ${round.matches?.[0]?.label || roundLabelForBracket(round.round, groupedMatches.length)}` : `الجولة ${round.round}`) : selectedTypeKey === "world_cup" ? worldCupAdminRoundTitle(round.matches?.[0] || {}, round.round) : selectedLeagueGroupsMode ? leagueTwoGroupsAdminRoundTitle(round.matches?.[0] || {}, round.round) : selectedTypeKey === "champions_league" ? championsLeagueAdminRoundTitle(round.matches?.[0] || {}, round.round) : roundLabelForBracket(round.round, groupedMatches.length)}</h4><div className="leagueMatchesList">{round.matches.map((match) => { const values = resultInputs[match.id] || {}; const completed = clean(match.resultStatus || match.status) === "completed"; const waiting = String(match.homeMemberId || "").startsWith("__") || String(match.awayMemberId || "").startsWith("__"); return <article className={completed ? "leagueMatchCard completed" : "leagueMatchCard"} key={match.id}><div className="leagueMatchTeams"><b>{match.homeName}</b><span>vs</span><b>{match.awayName}</b></div><div className="leagueMatchMeta"><span>{match.gameTitle || "PES 2017"}</span><small>{match.label || match.gameReason || ""}</small></div><div className="leagueMatchScore"><input inputMode="numeric" value={values.homeGoals ?? (completed ? match.homeGoals : "")} onChange={(event) => setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), homeGoals: event.target.value } }))} disabled={waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"} /><strong>-</strong><input inputMode="numeric" value={values.awayGoals ?? (completed ? match.awayGoals : "")} onChange={(event) => setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), awayGoals: event.target.value } }))} disabled={waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"} /></div>{(!selectedIsLeague || match.scope === "league_qualifier") ? <div className="leagueMatchScore pens"><input inputMode="numeric" placeholder="ترجيح" value={values.homePens ?? (completed && match.homePens !== null ? match.homePens : "")} onChange={(event) => setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), homePens: event.target.value } }))} disabled={waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"} /><strong>ر</strong><input inputMode="numeric" placeholder="ترجيح" value={values.awayPens ?? (completed && match.awayPens !== null ? match.awayPens : "")} onChange={(event) => setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), awayPens: event.target.value } }))} disabled={waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"} /></div> : null}<select className="leagueGameSelect" value={values.gameTitle ?? match.gameTitle ?? "PES 2017"} onChange={(event) => setResultInputs((current) => ({ ...current, [match.id]: { ...(current[match.id] || {}), gameTitle: event.target.value } }))} disabled={waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"}><option value="PES 2017">PES 2017</option><option value="FIFA 2025">FIFA 2025</option></select><div className="leagueMatchActions"><button type="button" onClick={() => submitMatchResult(match)} disabled={busy || waiting || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled" || match.phase === "bye"}>{waiting ? "بانتظار متأهل" : completed ? "تحديث" : "حفظ"}</button>{completed ? <button type="button" className="dangerMiniBtn" onClick={() => submitClearMatchResult(match)} disabled={busy || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled"}>حذف النتيجة</button> : null}</div></article>; })}</div></div>)}</div></section>
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldStats">
          <summary className="adminFoldSummary"><div><h3>إحصائيات البطولة</h3><p>أرقام البطولة كما تظهر في التفاصيل والتصدير.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody"><CompetitionStatsBox competition={selectedCompetition} /></div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldNotes">
          <summary className="adminFoldSummary"><div><h3>ملاحظات البطولة</h3><p>ملاحظات إدارية تظهر في صورة تفاصيل البطولة.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft adminForm">
          <div className="sectionHead compact"><div><h3>ملاحظات البطولة</h3><p>خانة يدوية لملاحظات FIFA Admin عن هذه البطولة. لا تغيّر النتائج ولا تؤثر على الجداول.</p></div></div>
          <label className="moneyField"><span>ملاحظات إدارية عن البطولة</span><textarea value={competitionAdminNote} onChange={(event) => setCompetitionAdminNote(event.target.value)} placeholder="مثال: تم تأجيل مباريات المجموعة الثانية بسبب غياب أحد الأعضاء." /></label>
          <button className="moneySubmitBtn" type="button" disabled={busy || !selectedCompetition} onClick={submitCompetitionAdminNote}>حفظ الملاحظة</button>
        </section>
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldFinalize">
          <summary className="adminFoldSummary"><div><h3>الاعتماد والغياب والهبوط</h3><p>إجراءات الاعتماد النهائية وإدارة الغياب.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft adminForm">
          <div className="sectionHead compact"><div><h3>الاعتماد والغياب{selectedIsAnyLeague ? " والهبوط" : ""}</h3></div></div>
          {selectedIsAnyLeague ? <><h4 className="dealSectionTitle">الهابطون</h4><div className="leagueMembersGrid compact">{selectedRelegationRows.map((row) => <label key={row.memberId} className={relegatedIds.some((id) => same(id, row.memberId)) ? "leagueMemberPick relegated active" : "leagueMemberPick"}><input type="checkbox" checked={relegatedIds.some((id) => same(id, row.memberId))} onChange={() => toggleRelegated(row.memberId)} /><span>{row.memberName}</span></label>)}</div></> : null}
          <h4 className="dealSectionTitle">إدارة الغياب</h4>
          <div className="leagueRuleNote">القرار يدوي من FIFA Admin فقط: اختر استبعاد العضو من البطولة، أو تسجيل خسارة إدارية له في المباريات المتبقية.</div>
          <label className="moneyField"><span>العضو الغائب</span><select value={absenceMemberId} onChange={(event) => setAbsenceMemberId(event.target.value)}><option value="">اختر العضو</option>{(selectedCompetition.participants || []).filter((row) => !isCompetitionExcludedMember(selectedCompetition, row.memberId || row.id)).map((row) => <option key={row.memberId || row.id} value={row.memberId || row.id}>{row.memberName || row.name || row.memberId || row.id}</option>)}</select></label>
          {absenceMemberId ? <div className="leagueRuleNote">لعب: {absenceInfo.played} • مباريات متبقية قابلة للإجراء: {absenceInfo.remaining}</div> : null}
          <label className="moneyField"><span>نوع الإجراء</span><select value={absenceMode} onChange={(event) => setAbsenceMode(event.target.value)}><option value="exclude">استبعاد من البطولة</option><option value="forfeit_loss">خسارة إدارية للمباريات المتبقية</option></select></label>
          {absenceMode === "forfeit_loss" ? <div className="leagueRewardGrid"><label className="moneyField"><span>أهداف الخصم الفائز</span><input inputMode="numeric" value={absenceWinGoals} onChange={(event) => setAbsenceWinGoals(event.target.value)} /></label><label className="moneyField"><span>أهداف العضو الغائب</span><input inputMode="numeric" value={absenceLoseGoals} onChange={(event) => setAbsenceLoseGoals(event.target.value)} /></label></div> : null}
          <label className="moneyField"><span>ملاحظة إدارية اختيارية</span><textarea value={absenceNote} onChange={(event) => setAbsenceNote(event.target.value)} placeholder="مثال: غياب عن منافسات المجموعة الثانية" /></label>
          <button className="moneySubmitBtn" type="button" disabled={busy || !absenceMemberId || clean(selectedCompetition.status) === "completed" || clean(selectedCompetition.status) === "cancelled"} onClick={submitAbsenceAction}>{absenceMode === "forfeit_loss" ? "تسجيل الخسارة الإدارية" : "استبعاد العضو من البطولة"}</button>
          <h4 className="dealSectionTitle">الغائبون عند الاعتماد</h4>
          <div className="leagueMembersGrid compact">{(selectedCompetition.participants || []).map((row) => <label key={row.memberId} className={absentIds.some((id) => same(id, row.memberId)) ? "leagueMemberPick absent active" : "leagueMemberPick"}><input type="checkbox" checked={absentIds.some((id) => same(id, row.memberId))} onChange={() => toggleAbsent(row.memberId)} /><span>{row.memberName}</span></label>)}</div>
          <button className="moneySubmitBtn" type="button" disabled={busy || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled"} onClick={submitFinalizeCompetition}>{clean(selectedCompetition.status) === "completed" && (["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) || selectedLeagueGroupsMode) ? "إعادة اعتماد النتائج وتصحيح المكافآت" : clean(selectedCompetition.status) === "completed" ? "معتمدة" : "اعتماد النتائج"}</button>
        </section>
          </div>
        </details>

        <details className="sectionBox glassSoft adminFoldPanel adminFoldDanger">
          <summary className="adminFoldSummary"><div><h3>حذف البطولة</h3><p>منطقة خطرة للحذف الإداري فقط.</p></div><span className="adminFoldToggle">فتح/إغلاق</span></summary>
          <div className="adminFoldBody">
        <section className="sectionBox glassSoft adminForm dangerZone"><div className="sectionHead compact"><div><h3>حذف البطولة</h3><p>استخدمه عند إنشاء بطولة بالخطأ. سيتم حذفها نهائيًا من البطولات المحفوظة مع حفظ أثر إداري في سجل FIFA.</p></div></div><label className="moneyField"><span>سبب الإلغاء</span><textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label><button className="moneySubmitBtn danger" type="button" disabled={busy || (clean(selectedCompetition.status) === "completed" && !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && !selectedLeagueGroupsMode) || clean(selectedCompetition.status) === "cancelled"} onClick={submitCancelCompetition}>حذف البطولة نهائيًا</button></section>
          </div>
        </details>
      </> : null}
    </main>
  );
}
