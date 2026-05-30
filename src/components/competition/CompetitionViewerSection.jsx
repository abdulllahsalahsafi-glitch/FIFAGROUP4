import React, { useState, useEffect, useRef } from 'react';
import {
  competitionTypeKey,
  competitionTimeValue,
  isLeagueGroupsCompetition,
  isChampionsLeagueSingleGroup,
  buildLinkedLeagueCupDisplayCompetition,
  computeLeagueStandings,
  filterCompetitionParticipantsForCalculation,
  filterCompetitionMatchesForCalculation,
  sortedCompetitionMatchesForSchedule,
  getApprovedCompetitionChampionName,
  getKnockoutChampion,
  worldCupGroupRows,
  computeWorldCupQualifiedIds,
  championsLeagueGroupRows,
  computeChampionsLeagueQualifiedIds,
  roundLabelForBracket,
} from '../../utils/competition';
import { cleanId, same, clean, toNumber } from '../../utils/helpers';
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../../utils/ui';
import { seasonCenterPhaseLabel } from '../../utils/seasonCenter';
import {
  downloadCompetitionFullDetailsImage,
  downloadCompetitionStandingsImage,
  downloadCompetitionScheduleTableImage,
  downloadCompetitionResultsImage,
} from '../../utils/canvas';

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

function groupLeagueMatchesByRound(matches = []) {
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

function competitionTypeLabel(type) {
  const value = clean(type || "league");
  const labels = {
    league: "الدوري",
    mini_league: "الدوري",
    league_qualifier: "ملحق الدوري",
    cup: "الكأس",
    super_cup: "السوبر",
    champions_league: "دوري الأبطال",
    world_cup: "كأس العالم",
  };
  return labels[value] || "بطولة";
}

function competitionStatusLabel(status) {
  const value = clean(status || "active");
  const labels = {
    draft: "مسودة",
    active: "نشط",
    inprogress: "نشط",
    ongoing: "نشط",
    completed: "مكتملة",
    finished: "مكتملة",
    done: "مكتملة",
    cancelled: "ملغاة",
  };
  return labels[value] || status || "نشط";
}

function competitionTrophyLookupKeys(type = "") {
  const value = competitionTypeKey(type);
  const keys = {
    league: ["league", "الدوري", "دوري", "الدورى", "درع الدوري", "بطولة الدوري"],
    league_qualifier: ["league_qualifier", "ملحق الدوري", "ملحق"],
    cup: ["cup", "الكأس", "الكاس", "كأس"],
    super_cup: ["super_cup", "super", "السوبر", "كأس السوبر"],
    champions_league: ["champions_league", "دوري الأبطال", "دوري الابطال", "دوري أبطال", "الأبطال", "ابطال", "أبطال", "Champions League", "UCL"],
    world_cup: ["world_cup", "كأس العالم", "كاس العالم"],
  };
  return keys[value] || [value];
}

function competitionLogoFromTrophyMap(type = "", trophyMap = {}) {
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

function competitionLogoFromConfig(type = "", config = {}) {
  const value = competitionTypeKey(type);
  const map = {
    league: config.leagueLogo || config.leagueIcon || config.dawriLogo,
    league_qualifier: config.leagueQualifierLogo || config.leagueLogo || config.leagueIcon,
    cup: config.cupLogo || config.cupIcon,
    super_cup: config.superCupLogo || config.superCupIcon,
    champions_league: config.championsLeagueLogo || config.championsLeagueIcon,
    world_cup: config.worldCupLogo || config.worldCupIcon,
  };
  return normalizeImageUrl(map[value] || "");
}

function competitionLogoUrl(competition = {}, config = {}, trophyMap = {}) {
  return normalizeImageUrl(
    competition.logo ||
      competition.icon ||
      competition.image ||
      competition.trophyImage ||
      competition.trophyLogo ||
      ""
  ) || competitionLogoFromTrophyMap(competition.type, trophyMap) || competitionLogoFromConfig(competition.type, config);
}

function CompetitionGlyph({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10" />
      <path d="M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10" />
      <path d="M12 12v4" />
      <path d="M8.5 20h7" />
      <path d="M10 16h4" />
    </svg>
  );
}

function CompetitionIcon({ competition = {}, config = {}, trophyMap = {}, className = "competitionIcon" }) {
  const logo = competitionLogoUrl(competition, config, trophyMap);
  if (logo) return <img className={className} src={logo} alt="" />;
  return (
    <span className={className + " fallbackCompetitionIcon"}>
      <CompetitionGlyph />
    </span>
  );
}

function getMemberName(membersOrParticipants, memberId) {
  const id = cleanId(memberId);
  if (!id) return "";
  const found = (membersOrParticipants || []).find((item) => same(item.memberId || item.id, id));
  return found?.memberName || found?.name || id;
}

function leagueTwoGroupsAdminRoundTitle(match = {}, fallbackRound = "") {
  const phase = clean(match.phase || "");
  if (phase === "qualification") return "ملحق الدوري";
  if (phase === "group") return "مباريات المجموعة " + (match.groupName || String(Math.max(0, toNumber(match.round) - 1) + 1));
  if (phase === "semifinal") return "مباريات نصف النهائي";
  if (phase === "third_place") return "مباراة تحديد الثالث";
  if (phase === "final") return "المباراة النهائية";
  return match.label || (fallbackRound ? "المباريات" : "المباريات");
}

function SmartChevron() {
  return (
    <span className="fgCompetitionSmartCue" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="m7 10 5 5 5-5" />
      </svg>
    </span>
  );
}

function SmartCompetitionSection({
  title,
  subtitle = "",
  countLabel = "",
  previewItems = [],
  defaultOpen = true,
  collapsible = true,
  className = "",
  children,
  headAction = null,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const canToggle = collapsible;
  const HeaderTag = canToggle ? "button" : "div";

  return (
    <section className={`sectionBox glassSoft fgCompetitionSmartBox ${open ? "open" : "collapsed"} ${className}`}>
      <HeaderTag
        type={canToggle ? "button" : undefined}
        className={`fgCompetitionSmartHead ${open ? "open" : "collapsed"}`}
        onClick={canToggle ? () => setOpen((value) => !value) : undefined}
        aria-expanded={canToggle ? open : undefined}
      >
        <div className="fgCompetitionSmartTitle">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
          {!open && previewItems.length ? (
            <div className="fgCompetitionSmartPreview">
              {previewItems.slice(0, 3).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
              {previewItems.length > 3 ? <b>+{formatLatinNumber(previewItems.length - 3)}</b> : null}
            </div>
          ) : null}
        </div>
        <div className="fgCompetitionSmartSide">
          {countLabel ? <strong>{countLabel}</strong> : null}
          {canToggle ? <SmartChevron /> : null}
        </div>
      </HeaderTag>
      {headAction ? <div className="fgCompetitionSmartAction">{headAction}</div> : null}
      {open ? <div className="fgCompetitionSmartBody">{children}</div> : null}
    </section>
  );
}

function StatCard({ icon, value, label, onClick }) {
  const content = (
    <>
      <span className="statIcon">{renderSmartIcon(icon)}</span>
      <b>{value}</b>
      <small>{label}</small>
    </>
  );
  return onClick ? (
    <button className="statCard clickable glassSoft" onClick={onClick}>
      {content}
    </button>
  ) : (
    <article className="statCard glassSoft">{content}</article>
  );
}

function buildCompetitionStats(competition = {}) {
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
  const topScorer = playedRows.slice().sort((a, b) => toNumber(b.goalsFor) - toNumber(a.goalsFor))[0];
  const bestDefense = playedRows.slice().sort((a, b) => toNumber(a.goalsAgainst) - toNumber(b.goalsAgainst))[0];
  const mostConceded = playedRows.slice().sort((a, b) => toNumber(b.goalsAgainst) - toNumber(a.goalsAgainst))[0];
  const mostWins = playedRows.slice().sort((a, b) => toNumber(b.wins) - toNumber(a.wins))[0];
  const totalGoals = matches.reduce((sum, match) => sum + toNumber(match.homeGoals) + toNumber(match.awayGoals), 0);
  return { champion, topScorer, bestDefense, mostConceded, mostWins, totalGoals, matchesPlayed: matches.length };
}

function CompetitionStatsBox({ competition }) {
  if (competitionTypeKey(competition?.type || "") === "super_cup") return null;
  const stats = buildCompetitionStats(competition || {});
  const isLeague = clean(competition?.type || "league") === "league" || clean(competition?.type || "") === "mini_league" || isChampionsLeagueSingleGroup(competition);
  return (
    <SmartCompetitionSection
      title="إحصائيات البطولة"
      countLabel={formatLatinNumber(6)}
      previewItems={[stats.champion || "-", `${formatLatinNumber(stats.totalGoals)} هدف`]}
      defaultOpen={false}
    >
      <div className="statsPanelGrid compactStats">
        <StatCard icon="🏆" value={stats.champion || "-"} label={isLeague ? "البطل الحالي" : "بطل البطولة"} />
        <StatCard icon="⚽" value={stats.totalGoals} label="إجمالي الأهداف" />
        <StatCard icon="🔥" value={stats.topScorer?.memberName || "-"} label={stats.topScorer ? `أكثر تسجيلًا (${stats.topScorer.goalsFor})` : "أكثر تسجيلًا"} />
        <StatCard icon="🛡️" value={stats.bestDefense?.memberName || "-"} label={stats.bestDefense ? `أفضل دفاع (${stats.bestDefense.goalsAgainst})` : "أفضل دفاع"} />
        <StatCard icon="🥅" value={stats.mostConceded?.memberName || "-"} label={stats.mostConceded ? `الأكثر استقبالًا (${stats.mostConceded.goalsAgainst})` : "الأكثر استقبالًا"} />
        <StatCard icon="✅" value={stats.mostWins?.memberName || "-"} label={stats.mostWins ? `الأكثر فوزًا (${stats.mostWins.wins})` : "الأكثر فوزًا"} />
      </div>
    </SmartCompetitionSection>
  );
}

function ReadonlyLeagueMatch({ match, isFinalRound = false }) {
  const completed = clean(match.resultStatus || match.status) === "completed";
  const hasPens = completed && match.homePens !== null && match.homePens !== undefined && match.awayPens !== null && match.awayPens !== undefined;
  const scoreText = completed ? `${match.homeGoals} - ${match.awayGoals}` : "-";
  const pensText = hasPens ? `ترجيح ${match.homePens} - ${match.awayPens}` : "";
  const winnerName = clean(match.winnerName || "");
  return (
    <article className={completed ? `readonlyLeagueMatch compactResultMatch completed${isFinalRound ? " finalRoundMatch" : ""}` : `readonlyLeagueMatch compactResultMatch${isFinalRound ? " finalRoundMatch" : ""}`}>
      <b className={same(winnerName, match.homeName) ? "compactTeamName home winnerTeam" : "compactTeamName home"}>{match.homeName || "-"}</b>
      <div className="compactMatchCenter">
        <strong>{scoreText}</strong>
        <small>{match.gameTitle || "PES 2017"}{pensText ? ` • ${pensText}` : ""}</small>
      </div>
      <b className={same(winnerName, match.awayName) ? "compactTeamName away winnerTeam" : "compactTeamName away"}>{match.awayName || "-"}</b>
      <span className={completed && winnerName ? "compactMatchStatus winnerStatus" : "compactMatchStatus"}>{completed && winnerName ? `الفائز: ${winnerName}` : completed ? "مكتملة" : "بانتظار النتيجة"}</span>
    </article>
  );
}

function knockoutColumns(competition = {}) {
  const typeKey = competitionTypeKey(competition.type || "");
  const matches = typeKey === "world_cup"
    ? (competition.matches || []).filter((match) => clean(match.phase) !== "group")
    : (competition.matches || []).filter((match) => !["group", "qualification"].includes(clean(match.phase)));
  const phaseOrder = ["quarterfinal", "round_of_16", "semifinal", "third_place", "final"];
  const phaseLabels = {
    round_of_16: "دور الـ16",
    quarterfinal: "ربع النهائي",
    semifinal: "نصف النهائي",
    third_place: "تحديد الثالث",
    final: "النهائي",
  };
  const phases = Array.from(new Set(matches.map((match) => clean(match.phase || "")))).sort((a, b) => {
    const ai = phaseOrder.indexOf(a);
    const bi = phaseOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  if (phases.length) {
    return phases.map((phase) => ({
      key: phase,
      title: phaseLabels[phase] || seasonCenterPhaseLabel(phase) || "دور إقصائي",
      matches: matches.filter((match) => clean(match.phase || "") === phase),
      final: phase === "final",
    })).filter((column) => column.matches.length);
  }
  const grouped = groupLeagueMatchesByRound(competition.matches || []);
  return grouped.map((round, index) => ({
    key: String(round.round),
    title: roundLabelForBracket(round.round, grouped.length),
    matches: round.matches,
    final: index === grouped.length - 1,
  }));
}

function QualifierBracket({ competition = {} }) {
  const typeKey = competitionTypeKey(competition.type || "");
  const qualifiedIds = typeKey === "league_qualifier" ? (competition.qualifiedMemberIds || computeLeagueQualifierQualifiedIds(competition)) : [];
  const columns = knockoutColumns(competition);
  return (
    <div className={typeKey === "cup" ? "qualifierBracket cupRoadBracket" : typeKey === "super_cup" ? "qualifierBracket superCupFinalRoad" : ["world_cup", "champions_league"].includes(typeKey) || isLeagueGroupsCompetition(competition) ? "qualifierBracket cupRoadBracket worldCupRoadBracket championsLeagueRoadBracket" : "qualifierBracket"}>
      <div className="qualifierBracketRounds">
        {columns.map((column) => (
          <div className={column.final ? "qualifierBracketRound finalRound" : "qualifierBracketRound"} key={column.key}>
            <h4>{column.title}</h4>
            <div className="cupRoundMatchesStack">
              {column.matches.map((match, index) => (
                <ReadonlyLeagueMatch key={match.id || index} match={match} isFinalRound={column.final} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {qualifiedIds.length ? (
        <div className="qualifierQualifiedBox">
          <span>المتأهلون</span>
          <b>{qualifiedIds.map((id) => getMemberName(competition.participants || [], id) || id).join("، ")}</b>
        </div>
      ) : null}
    </div>
  );
}

function embeddedQualifierCompetitionForDisplay(competition = {}) {
  const typeKey = competitionTypeKey(competition.type || "");
  if (typeKey === "league" && competition.leagueQualifier?.enabled) {
    const qualifier = competition.leagueQualifier || {};
    const matches = Array.isArray(qualifier.matches) ? qualifier.matches : [];
    if (!matches.length) return null;
    return {
      title: "الملحق المؤهل للدوري",
      description: "مرحلة مرتبطة بنفس نسخة الدوري، ولا تعتبر بطولة مستقلة.",
      buttonLabel: "تحميل نتائج الملحق المؤهل",
      competition: {
        ...qualifier,
        id: `${competition.id || "league"}-embedded-qualifier`,
        type: "league_qualifier",
        name: qualifier.name || `ملحق ${competition.name || "الدوري"}`,
        seasonId: competition.seasonId || qualifier.seasonId || "",
        startDate: qualifier.startDate || competition.startDate || "",
        endDate: qualifier.endDate || competition.endDate || "",
        participants: Array.isArray(qualifier.participants) ? qualifier.participants : [],
        matches,
        qualifiedMemberIds: Array.isArray(qualifier.qualifiedMemberIds) ? qualifier.qualifiedMemberIds : computeLeagueQualifierQualifiedIds({ matches, qualifiersCount: qualifier.qualifiedCount || 1 }),
        qualifiersCount: qualifier.qualifiedCount || 1,
        status: qualifier.status || competition.status || "active",
      },
    };
  }
  if (typeKey === "world_cup") {
    const matches = (competition.matches || []).filter((match) => clean(match.phase || "") === "qualification");
    if (!matches.length) return null;
    const normalizedMatches = matches.map((match, index) => ({
      ...match,
      round: toNumber(match.round) > 0 ? toNumber(match.round) : 1,
      label: match.label || `تصفيات كأس العالم - مباراة ${index + 1}`,
    }));
    return {
      title: "تصفيات كأس العالم",
      description: "مرحلة إقصائية مرتبطة بنفس نسخة كأس العالم، والمتأهلون يدخلون دور المجموعات.",
      buttonLabel: "تحميل نتائج التصفيات",
      competition: {
        ...competition,
        id: `${competition.id || "world-cup"}-qualification`,
        type: "league_qualifier",
        name: `تصفيات ${competition.name || "كأس العالم"}`,
        participants: Array.isArray(competition.participants) ? competition.participants : [],
        matches: normalizedMatches,
        qualifiersCount: normalizedMatches.length,
        qualifiedMemberIds: computeLeagueQualifierQualifiedIds({ matches: normalizedMatches, qualifiersCount: normalizedMatches.length }),
        status: competition.status || "active",
      },
    };
  }
  if (typeKey === "champions_league") {
    const qualifier = competition.qualifier || competition.championsLeagueQualifier || {};
    const embeddedMatches = Array.isArray(qualifier.matches) ? qualifier.matches : [];
    const phaseMatches = (competition.matches || []).filter((match) => ["qualification", "qualifier", "playoff"].includes(clean(match.phase || "")));
    const matches = embeddedMatches.length ? embeddedMatches : phaseMatches;
    if (!matches.length) return null;
    const normalizedMatches = matches.map((match, index) => ({
      ...match,
      round: toNumber(match.round) > 0 ? toNumber(match.round) : 1,
      label: match.label || `ملحق دوري الأبطال - مباراة ${index + 1}`,
    }));
    return {
      title: "الملحق المؤهل لدوري الأبطال",
      description: "مرحلة إقصائية مرتبطة بنفس نسخة دوري الأبطال، ولا تعتبر بطولة مستقلة.",
      buttonLabel: "تحميل نتائج الملحق المؤهل",
      competition: {
        ...qualifier,
        id: `${competition.id || "champions-league"}-qualifier`,
        type: "league_qualifier",
        name: qualifier.name || `ملحق ${competition.name || "دوري الأبطال"}`,
        seasonId: competition.seasonId || qualifier.seasonId || "",
        startDate: qualifier.startDate || competition.startDate || "",
        endDate: qualifier.endDate || competition.endDate || "",
        participants: Array.isArray(qualifier.participants) ? qualifier.participants : (Array.isArray(competition.participants) ? competition.participants : []),
        matches: normalizedMatches,
        qualifiersCount: qualifier.qualifiedCount || normalizedMatches.length,
        qualifiedMemberIds: Array.isArray(qualifier.qualifiedMemberIds) ? qualifier.qualifiedMemberIds : computeLeagueQualifierQualifiedIds({ matches: normalizedMatches, qualifiersCount: qualifier.qualifiedCount || normalizedMatches.length }),
        status: qualifier.status || competition.status || "active",
      },
    };
  }
  return null;
}

function EmbeddedQualifierSection({ competition = {}, config = {}, trophyMap = {} }) {
  const info = embeddedQualifierCompetitionForDisplay(competition);
  if (!info?.competition) return null;
  return (
    <SmartCompetitionSection
      title={info.title}
      subtitle={info.description}
      countLabel={`${formatLatinNumber((info.competition.matches || []).length)} مباريات`}
      previewItems={(info.competition.matches || []).map((match) => match.label || `${match.homeName || "-"} ضد ${match.awayName || "-"}`)}
      defaultOpen={(info.competition.matches || []).length <= 2}
      headAction={<button type="button" className="miniDownloadBtn" onClick={() => downloadCompetitionResultsImage(info.competition, config, trophyMap)}>{info.buttonLabel}</button>}
    >
      <QualifierBracket competition={info.competition} />
    </SmartCompetitionSection>
  );
}

function LeagueQualifierSection({ qualifiers = [] }) {
  const rows = (qualifiers || []).filter(Boolean);
  if (!rows.length) return null;
  return (
    <SmartCompetitionSection
      title="الملحق المؤهل للدوري"
      countLabel={`${formatLatinNumber(rows.length)} ملحق`}
      previewItems={rows.map((row) => row.name || "ملحق الدوري")}
      defaultOpen={rows.length <= 1}
    >
      <div className="leagueQualifierList">
        {rows.map((competition) => (
          <article className="leagueQualifierCard" key={competition.id || competition.name}>
            <div className="leagueQualifierTitle">
              <b>{competition.name || "ملحق الدوري"}</b>
              <small>{competitionStatusLabel(competition.status)}{competition.startDate ? ` • ${competition.startDate}` : ""}</small>
            </div>
            <QualifierBracket competition={competition} />
          </article>
        ))}
      </div>
    </SmartCompetitionSection>
  );
}

export function WorldCupGroupsSection({ competition = {}, config = {}, trophyMap = {} }) {
  const groups = worldCupGroupRows(competition || {});
  const qualifiedIds = computeWorldCupQualifiedIds(competition || {});
  return (
    <SmartCompetitionSection
      title="مجموعات كأس العالم"
      subtitle="يتأهل أول كل مجموعة + أفضل ثاني إلى الأدوار الإقصائية."
      countLabel={`${formatLatinNumber(groups.length)} مجموعات`}
      previewItems={groups.map((group) => `المجموعة ${group.groupName}`)}
      defaultOpen={groups.length <= 2}
      headAction={<button type="button" className="miniDownloadBtn" onClick={() => downloadCompetitionStandingsImage(competition, config, trophyMap)}>تحميل ترتيب المجموعات</button>}
    >
      <div className="worldCupGroupsGrid">
        {groups.map((group) => (
          <article className="worldCupGroupCard" key={group.groupKey}>
            <h4>المجموعة {group.groupName}</h4>
            {group.participants.length < 3 ? <p className="worldCupByeNote">راحة / BYE: {3 - group.participants.length} مقعد</p> : null}
            <div className="leagueTable miniWorldCupTable">
              <div className="leagueTableHead"><span>#</span><span>العضو</span><span>لعب</span><span>له</span><span>عليه</span><span>فارق</span><span>نقاط</span></div>
              {(group.standings || []).map((row, index) => (
                <div key={row.memberId} className={qualifiedIds.some((id) => same(id, row.memberId)) ? "leagueTableRow qualified" : "leagueTableRow"}>
                  <span>{index + 1}</span><span>{row.memberName}{row.needsPlayoff ? <em className="playoffBadge">فاصلة</em> : null}</span><span>{row.played}</span><span>{row.goalsFor}</span><span>{row.goalsAgainst}</span><span>{row.goalDifference}</span><b>{row.points}</b>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SmartCompetitionSection>
  );
}

export function ChampionsLeagueGroupsSection({ competition = {}, config = {}, trophyMap = {} }) {
  const groups = championsLeagueGroupRows(competition || {});
  const qualifiedIds = computeChampionsLeagueQualifiedIds(competition || {});
  const leagueGroupsMode = isLeagueGroupsCompetition(competition);
  const sectionTitle = leagueGroupsMode ? "مجموعات الدوري" : "مجموعات دوري الأبطال";
  return (
    <SmartCompetitionSection
      title={sectionTitle}
      subtitle="يتأهل الأول والثاني من كل مجموعة إلى نصف النهائي."
      countLabel={`${formatLatinNumber(groups.length)} مجموعات`}
      previewItems={groups.map((group) => `المجموعة ${group.groupName}`)}
      defaultOpen={groups.length <= 2}
      headAction={<button type="button" className="miniDownloadBtn" onClick={() => downloadCompetitionStandingsImage(competition, config, trophyMap)}>تحميل ترتيب المجموعات</button>}
    >
      <div className="worldCupGroupsGrid championsLeagueGroupsGrid">
        {groups.map((group) => (
          <article className="worldCupGroupCard" key={group.groupKey}>
            <h4>المجموعة {group.groupName}</h4>
            {group.participants.length < 4 ? <p className="worldCupByeNote">راحة / BYE: {4 - group.participants.length} مقعد</p> : null}
            <div className="leagueTable miniWorldCupTable">
              <div className="leagueTableHead"><span>#</span><span>العضو</span><span>لعب</span><span>له</span><span>عليه</span><span>فارق</span><span>نقاط</span></div>
              {(group.standings || []).map((row, index) => (
                <div key={row.memberId} className={qualifiedIds.some((id) => same(id, row.memberId)) ? "leagueTableRow qualified" : "leagueTableRow"}>
                  <span>{index + 1}</span><span>{row.memberName}{row.needsPlayoff ? <em className="playoffBadge">فاصلة</em> : null}</span><span>{row.played}</span><span>{row.goalsFor}</span><span>{row.goalsAgainst}</span><span>{row.goalDifference}</span><b>{row.points}</b>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SmartCompetitionSection>
  );
}

export function KnockoutBracketSection({ competition = {}, title = "الأدوار الإقصائية" }) {
  if (!competition) return null;
  const columns = knockoutColumns(competition);
  const matchCount = columns.reduce((sum, column) => sum + column.matches.length, 0);
  return (
    <SmartCompetitionSection
      title={title}
      subtitle={`${competitionTypeLabel(competition.type)} ضمن الأدوار الإقصائية.`}
      countLabel={`${formatLatinNumber(matchCount)} مباريات`}
      previewItems={columns.map((column) => column.title)}
      defaultOpen={matchCount <= 4}
    >
      <QualifierBracket competition={competition} />
    </SmartCompetitionSection>
  );
}

function ProfileMatchesSection({ title = "مباريات العضو", subtitle = "المباريات غير المسجلة في البطولات النشطة.", rows = [], members = [], emptyText = "لا توجد مباريات حالياً.", onOpenCompetition }) {
  const visibleRows = Array.isArray(rows) ? rows : [];
  return (
    <SmartCompetitionSection
      title={title}
      subtitle={subtitle}
      countLabel={formatLatinNumber(visibleRows.length)}
      previewItems={visibleRows.map(({ competition, match }) => `${competition?.name || "بطولة"} • ${match?.homeName || "-"} ضد ${match?.awayName || "-"}`)}
      defaultOpen={visibleRows.length <= 3}
    >
      {visibleRows.length ? (
        <div className="profileMatchesGrid">
          {visibleRows.map(({ competition, match }, index) => {
            const homeName = match.homeName || getMemberName(members, match.homeMemberId) || "طرف أول";
            const awayName = match.awayName || getMemberName(members, match.awayMemberId) || "طرف ثان";
            const stageLabel = match.label || seasonCenterPhaseLabel(match.phase) || "مباراة";
            const gameTitle = match.gameTitle || "FIFA 2025";
            return (
              <button
                type="button"
                className="profileMatchCard"
                key={(competition?.id || "competition") + "-" + (match?.id || index)}
                onClick={() => onOpenCompetition && onOpenCompetition(competition?.id)}
              >
                <div className="profileMatchTop">
                  <b>{competition?.name || competition?.title || "بطولة"}</b>
                  <span>{stageLabel}</span>
                </div>
                <div className="profileMatchTeams">
                  <strong>{homeName}</strong>
                  <em>ضد</em>
                  <strong>{awayName}</strong>
                </div>
                <small>{gameTitle}</small>
              </button>
            );
          })}
        </div>
      ) : <div className="empty">{emptyText}</div>}
    </SmartCompetitionSection>
  );
}

const smartCompetitionCss = `
.fgCompetitionSmartBox{
  overflow:hidden;
}
.fgCompetitionSmartHead{
  width:100%;
  appearance:none;
  border:0;
  background:transparent;
  color:inherit;
  padding:0;
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:flex-start;
  gap:10px;
  text-align:right;
  direction:rtl;
}
.fgCompetitionSmartHead[aria-expanded]{
  cursor:pointer;
}
.fgCompetitionSmartTitle{
  min-width:0;
}
.fgCompetitionSmartTitle h3{
  margin:0;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  font-size:clamp(19px,5vw,27px);
  line-height:1.28;
  font-weight:1000;
}
.fgCompetitionSmartTitle p{
  margin:5px 0 0;
  color:#9BA0C0;
  -webkit-text-fill-color:#9BA0C0;
  font-size:12px;
  line-height:1.45;
  font-weight:800;
}
.fgCompetitionSmartSide{
  display:inline-flex;
  align-items:center;
  justify-content:flex-end;
  gap:8px;
  min-width:0;
}
.fgCompetitionSmartSide strong{
  min-width:42px;
  height:30px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 10px;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.22);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-size:11px;
  font-weight:1000;
  white-space:nowrap;
}
.fgCompetitionSmartCue{
  width:28px;
  height:28px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.08);
  transition:transform .18s ease;
}
.fgCompetitionSmartCue svg{
  width:15px;
  height:15px;
  stroke:currentColor;
  stroke-width:2.4;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.fgCompetitionSmartHead.open .fgCompetitionSmartCue{
  transform:rotate(180deg);
}
.fgCompetitionSmartPreview{
  display:flex;
  align-items:center;
  gap:7px;
  min-width:0;
  margin-top:7px;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  font-size:11px;
  font-weight:900;
  white-space:nowrap;
  overflow:hidden;
}
.fgCompetitionSmartPreview span{
  min-width:0;
  max-width:132px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.fgCompetitionSmartPreview b{
  flex:0 0 auto;
  min-width:34px;
  height:24px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 8px;
  background:rgba(0,230,118,.10);
  border:1px solid rgba(0,230,118,.18);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-size:11px;
  font-weight:1000;
}
.fgCompetitionSmartAction{
  margin-top:10px;
  display:flex;
  justify-content:flex-start;
}
.fgCompetitionSmartBody{
  margin-top:12px;
}
.fallbackCompetitionIcon{
  display:grid;
  place-items:center;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
}
.fallbackCompetitionIcon svg,
.fallbackCompetitionIcon .competitionTypeIcon,
.fallbackCompetitionIcon .competitionInstanceIcon,
.fallbackCompetitionIcon .competitionDetailIcon{
  width:70%;
  height:70%;
}
.fallbackCompetitionIcon svg{
  stroke:currentColor;
  stroke-width:1.9;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
@media(max-width:720px){
  .fgCompetitionSmartHead{
    gap:8px;
  }
  .fgCompetitionSmartSide strong{
    font-size:10px;
    padding:0 8px;
  }
  .fgCompetitionSmartPreview span{
    max-width:104px;
  }
}
`;

export default function CompetitionViewerSection({ competitions = [], currentMemberId = "", focusedCompetitionId = "", config = {}, trophyMap = {}, standalone = false }) {
  const competitionRows = (competitions || [])
    .filter((item) => ["league", "mini_league", "league_qualifier", "cup", "super_cup", "champions_league", "world_cup"].includes(clean(item.type || "league")))
    .sort((a, b) => competitionTimeValue(a) - competitionTimeValue(b));
  const mainCompetitionTypes = ["league", "cup", "super_cup", "world_cup", "champions_league"];
  const rowsForType = (type) => competitionRows.filter((item) => {
    const key = competitionTypeKey(item.type);
    if (type === "league") return key === "league" || key === "mini_league";
    return key === type;
  });
  const typeGroups = mainCompetitionTypes
    .map((type) => ({ type, rows: rowsForType(type) }))
    .filter((group) => group.rows.length)
    .sort((a, b) => competitionTimeValue(a.rows[0]) - competitionTimeValue(b.rows[0]));
  const focusedCompetition = focusedCompetitionId ? competitionRows.find((item) => same(item.id, focusedCompetitionId)) : null;
  const defaultType = focusedCompetition ? (competitionTypeKey(focusedCompetition.type) === "league_qualifier" ? "league" : competitionTypeKey(focusedCompetition.type)) : (typeGroups[0]?.type || "league");
  const [selectedType, setSelectedType] = useState(defaultType);
  const currentTypeRows = rowsForType(selectedType);
  const activeCompetition = currentTypeRows[0] || competitionRows[0] || null;
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(focusedCompetitionId || activeCompetition?.id || "");
  const appliedFocusedCompetitionRef = useRef("");
  const selectedCompetitionRaw = competitionRows.find((item) => same(item.id, selectedCompetitionId)) || activeCompetition;
  const selectedCompetition = competitionTypeKey(selectedCompetitionRaw?.type || "") === "cup"
    ? buildLinkedLeagueCupDisplayCompetition(selectedCompetitionRaw, competitionRows)
    : selectedCompetitionRaw;

  useEffect(() => {
    const nextFocusedId = cleanId(focusedCompetitionId || "");
    if (focusedCompetition && nextFocusedId && appliedFocusedCompetitionRef.current !== nextFocusedId) {
      setSelectedType(competitionTypeKey(focusedCompetition.type) === "league_qualifier" ? "league" : competitionTypeKey(focusedCompetition.type));
      setSelectedCompetitionId(focusedCompetition.id);
      appliedFocusedCompetitionRef.current = nextFocusedId;
      return;
    }
    if (!nextFocusedId) appliedFocusedCompetitionRef.current = "";
    if (!currentTypeRows.some((item) => same(item.id, selectedCompetitionId))) {
      setSelectedCompetitionId(currentTypeRows[0]?.id || activeCompetition?.id || "");
    }
  }, [focusedCompetitionId, focusedCompetition?.id, competitionRows.length, selectedType, currentTypeRows.length]);

  const standings = selectedCompetition && (clean(selectedCompetition.type || "league") === "league" || clean(selectedCompetition.type || "") === "mini_league" || isChampionsLeagueSingleGroup(selectedCompetition)) && !isLeagueGroupsCompetition(selectedCompetition) ? computeLeagueStandings(filterCompetitionParticipantsForCalculation(selectedCompetition), filterCompetitionMatchesForCalculation(selectedCompetition)) : [];
  const selectedTypeKey = competitionTypeKey(selectedCompetition?.type || "");
  const selectedScheduleMatches = selectedCompetition ? sortedCompetitionMatchesForSchedule(selectedCompetition) : [];
  const groupedMatches = selectedCompetition ? groupLeagueMatchesByRound(selectedCompetition.matches || []) : [];
  const myMatches = currentMemberId ? selectedScheduleMatches.filter((match) => same(match.homeMemberId, currentMemberId) || same(match.awayMemberId, currentMemberId)) : [];
  const viewerLeagueGroupsMode = selectedCompetition ? isLeagueGroupsCompetition(selectedCompetition) : false;
  const viewerChampionsSingleGroup = selectedCompetition ? isChampionsLeagueSingleGroup(selectedCompetition) : false;
  const viewerHasGroupStage = selectedCompetition ? (selectedTypeKey === "world_cup" || (selectedTypeKey === "champions_league" && !viewerChampionsSingleGroup) || viewerLeagueGroupsMode) : false;
  const isLeague = clean(selectedCompetition?.type || "league") === "league" || clean(selectedCompetition?.type || "") === "mini_league" || viewerChampionsSingleGroup;
  const publicGroupMatches = selectedCompetition && viewerHasGroupStage
    ? selectedScheduleMatches.filter((match) => clean(match.phase || "") === "group")
    : [];
  const publicGroupedGroupMatches = groupLeagueMatchesByRound(publicGroupMatches);
  const qualifierRowsForSelectedLeague = selectedCompetition && isLeague
    ? competitionRows.filter((item) =>
        competitionTypeKey(item.type) === "league_qualifier" &&
        same(item.seasonId || "", selectedCompetition.seasonId || "")
      )
    : [];
  const qualifiedIds = selectedCompetition?.qualifiedMemberIds || computeLeagueQualifierQualifiedIds(selectedCompetition || {});
  const completedMatchesCount = (selectedCompetition?.matches || []).filter((m) => clean(m.resultStatus || m.status) === "completed").length;

  return (
    <>
      <style>{smartCompetitionCss}</style>
      {standalone ? (
        <section className="sectionBox glassSoft fifaAdminHero">
          <div><span className="heroKicker">FIFA GROUP</span><h2>البطولات التنافسية</h2></div><strong>📊</strong>
        </section>
      ) : null}

      <SmartCompetitionSection
        title="البطولات التنافسية"
        countLabel={`${formatLatinNumber(competitionRows.length)} بطولة`}
        previewItems={typeGroups.map((group) => `${competitionTypeLabel(group.type)} ${formatLatinNumber(group.rows.length)}`)}
        defaultOpen
        collapsible={typeGroups.length > 3 || currentTypeRows.length > 4}
        className="competitionTypeShell"
      >
        {typeGroups.length ? (
          <>
            <div className="competitionTypeGrid">
              {typeGroups.map((group) => {
                const sample = group.rows[0] || { type: group.type };
                return (
                  <button key={group.type} type="button" className={selectedType === group.type ? "competitionTypeCard active" : "competitionTypeCard"} onClick={() => { setSelectedType(group.type); setSelectedCompetitionId(group.rows[0]?.id || ""); }}>
                    <CompetitionIcon competition={{ ...sample, type: group.type }} config={config} trophyMap={trophyMap} className="competitionTypeIcon" />
                    <b>{competitionTypeLabel(group.type)}</b>
                    <small>{formatLatinNumber(group.rows.length)} بطولة</small>
                  </button>
                );
              })}
            </div>
            <div className="competitionInstanceList">
              {currentTypeRows.map((competition) => (
                <button key={competition.id} type="button" className={same(selectedCompetition?.id, competition.id) ? "competitionInstanceCard active" : "competitionInstanceCard"} onClick={() => setSelectedCompetitionId(competition.id)}>
                  <CompetitionIcon competition={competition} config={config} trophyMap={trophyMap} className="competitionInstanceIcon" />
                  <div><b>{competition.name || competitionTypeLabel(competition.type)}</b><small>{competitionStatusLabel(competition.status)}{competition.startDate ? ` • ${competition.startDate}` : ""}</small></div>
                </button>
              ))}
            </div>
          </>
        ) : <div className="empty">لا توجد بطولات تنافسية منشأة بعد.</div>}
      </SmartCompetitionSection>

      {selectedCompetition ? (
        <>
          <SmartCompetitionSection
            title={selectedCompetition.name || competitionTypeLabel(selectedCompetition.type)}
            subtitle={`${competitionTypeLabel(selectedCompetition.type)} • ${competitionStatusLabel(selectedCompetition.status)} ${selectedCompetition.startDate ? `• ${selectedCompetition.startDate}` : ""}${selectedCompetition.endDate ? ` → ${selectedCompetition.endDate}` : ""}`}
            countLabel="تفاصيل"
            defaultOpen
            collapsible={false}
            className="competitionDetailSmartShell"
          >
            <div className="sectionHead compact competitionDetailHead">
              <CompetitionIcon competition={selectedCompetition} config={config} trophyMap={trophyMap} className="competitionDetailIcon" />
              <div><h3>{selectedCompetition.name}</h3><p>{competitionTypeLabel(selectedCompetition.type)} • {competitionStatusLabel(selectedCompetition.status)}</p></div>
            </div>
            <div className="leagueSummaryStrip compactSummaryStrip">
              <div className="leagueSummaryMetric"><span>المشاركون</span><b>{(selectedCompetition.participants || []).length}</b></div>
              <div className="leagueSummaryMetric"><span>المباريات</span><b>{(selectedCompetition.matches || []).length}</b></div>
              <div className="leagueSummaryMetric"><span>المكتملة</span><b>{completedMatchesCount}</b></div>
              <div className="leagueSummaryMetric"><span>{isLeague || ["cup", "super_cup", "world_cup", "champions_league"].includes(competitionTypeKey(selectedCompetition.type)) ? "البطل" : "المتأهلون"}</span><b>{isLeague ? getApprovedCompetitionChampionName(selectedCompetition, standings[0]?.memberName || "") : ["cup", "super_cup", "world_cup", "champions_league"].includes(competitionTypeKey(selectedCompetition.type)) ? getApprovedCompetitionChampionName(selectedCompetition, getKnockoutChampion(selectedCompetition)?.memberName || "") : (qualifiedIds.length || "-")}</b></div>
            </div>
            <div className="imageActionRow">
              <button type="button" onClick={() => downloadCompetitionFullDetailsImage(selectedCompetition, config, trophyMap)}>تحميل صورة تفاصيل البطولة</button>
              <button type="button" onClick={() => downloadCompetitionStandingsImage(selectedCompetition, config, trophyMap)} disabled={!isLeague && !viewerHasGroupStage}>{viewerHasGroupStage ? "تحميل ترتيب المجموعات" : "تحميل صورة الترتيب"}</button>
              {viewerHasGroupStage ? <button type="button" onClick={() => downloadCompetitionScheduleTableImage(selectedCompetition, config, trophyMap)}>{clean(selectedCompetition.status) === "completed" ? "تحميل نتائج المباريات" : "تحميل جدول المباريات"}</button> : null}
              <button type="button" onClick={() => downloadCompetitionResultsImage(selectedCompetition, config, trophyMap)}>{viewerHasGroupStage ? "تحميل صورة الأدوار الإقصائية" : clean(selectedCompetition.status) === "completed" ? "تحميل نتائج المباريات" : "تحميل جدول المباريات"}</button>
            </div>
          </SmartCompetitionSection>

          {String(selectedCompetition.adminNote || "").trim() ? (
            <SmartCompetitionSection title="ملاحظات البطولة" subtitle="ملاحظات FIFA Admin الخاصة بهذه النسخة." countLabel="ملاحظة" defaultOpen={false}>
              <div className="leagueRuleNote">{selectedCompetition.adminNote}</div>
            </SmartCompetitionSection>
          ) : null}

          {selectedTypeKey === "world_cup" ? <WorldCupGroupsSection competition={selectedCompetition} config={config} trophyMap={trophyMap} /> : ((selectedTypeKey === "champions_league" && !viewerChampionsSingleGroup) || isLeagueGroupsCompetition(selectedCompetition)) ? <ChampionsLeagueGroupsSection competition={selectedCompetition} config={config} trophyMap={trophyMap} /> : null}

          {publicGroupMatches.length ? (
            <SmartCompetitionSection
              title="جدول مباريات دور المجموعات"
              subtitle="كل مباريات المجموعات ظاهرة للأعضاء."
              countLabel={`${formatLatinNumber(publicGroupMatches.length)} مباريات`}
              previewItems={publicGroupMatches.map((match) => `${match.homeName || "-"} ضد ${match.awayName || "-"}`)}
              defaultOpen={publicGroupMatches.length <= 4}
            >
              <div className="leagueRoundsList">
                {publicGroupedGroupMatches.map((round) => (
                  <div className="leagueRoundBox" key={round.round}>
                    <h4>{round.matches?.[0]?.groupName ? `المجموعة ${round.matches[0].groupName}` : `الجولة ${round.round}`}</h4>
                    <div className="leagueMatchesList">{round.matches.map((match) => <ReadonlyLeagueMatch key={match.id} match={match} />)}</div>
                  </div>
                ))}
              </div>
            </SmartCompetitionSection>
          ) : null}

          {isLeague && !isLeagueGroupsCompetition(selectedCompetition) ? (
            <SmartCompetitionSection title="الترتيب" countLabel={`${formatLatinNumber(standings.length)} أعضاء`} previewItems={standings.slice(0, 3).map((row) => row.memberName)} defaultOpen>
              <div className="leagueTable">
                <div className="leagueTableHead"><span>#</span><span>العضو</span><span>لعب</span><span>ف</span><span>ت</span><span>خ</span><span>له</span><span>عليه</span><span>فارق</span><span>نقاط</span></div>
                {standings.map((row, index) => (
                  <div key={row.memberId} className={index === 0 ? "leagueTableRow champion" : (selectedCompetition.relegatedMemberIds || []).some((id) => same(id, row.memberId)) ? "leagueTableRow relegated" : (selectedCompetition.absentMemberIds || []).some((id) => same(id, row.memberId)) ? "leagueTableRow absent" : "leagueTableRow"}>
                    <span>{index + 1}</span><span>{row.memberName}{row.needsPlayoff ? <em className="playoffBadge">فاصلة</em> : null}{(selectedCompetition.absentMemberIds || []).some((id) => same(id, row.memberId)) ? <em className="absentBadge">غائب</em> : null}</span><span>{row.played}</span><span>{row.wins}</span><span>{row.draws}</span><span>{row.losses}</span><span>{row.goalsFor}</span><span>{row.goalsAgainst}</span><span>{row.goalDifference}</span><b>{row.points}</b>
                  </div>
                ))}
              </div>
            </SmartCompetitionSection>
          ) : !["cup", "super_cup", "world_cup", "champions_league"].includes(selectedTypeKey) && qualifiedIds.length ? (
            <SmartCompetitionSection title="المتأهلون" countLabel={`${formatLatinNumber(qualifiedIds.length)} أعضاء`} defaultOpen>
              <div className="incomingOfferedPlayers">{qualifiedIds.map((id) => <span key={id}>{getMemberName(selectedCompetition.participants || [], id) || id}</span>)}</div>
            </SmartCompetitionSection>
          ) : null}

          {myMatches.length ? (
            <SmartCompetitionSection title="مبارياتي" countLabel={`${formatLatinNumber(myMatches.length)} مباريات`} previewItems={myMatches.map((match) => `${match.homeName || "-"} ضد ${match.awayName || "-"}`)} defaultOpen={myMatches.length <= 2}>
              <div className="leagueMatchesList">{myMatches.map((match) => <ReadonlyLeagueMatch key={match.id} match={match} />)}</div>
            </SmartCompetitionSection>
          ) : null}

          {isLeague ? (
            <SmartCompetitionSection
              title={clean(selectedCompetition.status) === "completed" ? "نتائج المباريات" : "جدول المباريات"}
              countLabel={`${formatLatinNumber(selectedScheduleMatches.length)} مباريات`}
              previewItems={selectedScheduleMatches.map((match) => `${match.homeName || "-"} ضد ${match.awayName || "-"}`)}
              defaultOpen={selectedScheduleMatches.length <= 4}
            >
              <div className="leagueRoundsList">
                {groupedMatches.map((round) => (
                  <div className="leagueRoundBox" key={round.round}>
                    <h4>{isLeagueGroupsCompetition(selectedCompetition) ? leagueTwoGroupsAdminRoundTitle(round.matches?.[0] || {}, round.round) : `الجولة ${round.round}`}</h4>
                    <div className="leagueMatchesList">{round.matches.map((match) => <ReadonlyLeagueMatch key={match.id} match={match} />)}</div>
                  </div>
                ))}
              </div>
            </SmartCompetitionSection>
          ) : (
            <KnockoutBracketSection competition={selectedCompetition} title="الأدوار الإقصائية" />
          )}

          {isLeague && !selectedCompetition?.leagueQualifier?.enabled && qualifierRowsForSelectedLeague.length ? (
            <LeagueQualifierSection qualifiers={qualifierRowsForSelectedLeague} />
          ) : null}
          <EmbeddedQualifierSection competition={selectedCompetition} config={config} trophyMap={trophyMap} />
          <CompetitionStatsBox competition={selectedCompetition} />
        </>
      ) : null}
    </>
  );
}

export { ProfileMatchesSection };
