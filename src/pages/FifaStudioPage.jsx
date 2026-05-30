import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl, toCssSize, toLatinDigits } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean, isEnabled } from '../utils/helpers'
import { sortRecordsDesc, isFifaSystemMember, groupMemberTrophies, isActiveSeasonMember } from '../utils/data'
import { competitionTypeArabic, getCompetitionChampionInfo, sortedCompetitionMatchesForSchedule, scheduleStageTitleForMatch } from '../utils/competition'
import { getMemberName } from '../utils/admin'
import { downloadActiveSeasonMemberCardImage, downloadHistoricalMemberCardImage, downloadStudioMemberCardImage, exportDateTimeLabel, safeFileName, roundRect, wrapCanvasText } from '../utils/canvas'

export default function FifaStudioPage({
  config = {},
  members = [],
  competitions = [],
  allTournaments = [],
  transferHistory = [],
  trophyMap = {},
  currentMember = null,
  currentMemberId = "",
  players = [],
  financeRows = [],
  playerContracts = [],
  statsMap = {},
  rankedMembers = [],
  getMemberPlayersForExport = null,
}) {
  const [template, setTemplate] = useState("champion");
  const [championId, setChampionId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [dealId, setDealId] = useState("");
  const [memberId, setMemberId] = useState("");

  const completedCompetitions = useMemo(() => {
    return (competitions || [])
      .filter((competition) => clean(competition.status || "") === "completed")
      .slice()
      .sort((a, b) => studioTimeValue(b.completedAt || b.updatedAt || b.endDate || b.date) - studioTimeValue(a.completedAt || a.updatedAt || a.endDate || a.date));
  }, [competitions]);

  const championOptions = useMemo(() => {
    const rows = [];
    completedCompetitions.forEach((competition) => {
      const champion = getCompetitionChampionInfo(competition);
      const championName = competition.championMemberName || competition.championName || champion?.memberName || "";
      if (!championName) return;
      rows.push({
        id: "competition:" + (competition.id || rows.length),
        source: "competition",
        competition,
        title: competition.name || competition.title || "بطولة",
        subtitle: competitionTypeArabic(competition.type || competition.competitionType) + " · " + studioEventDateLabel(competition.completedDate, competition.completedAt, competition.endDate, competition.date, competition.updatedAt),
        championName,
      });
    });
    (allTournaments || [])
      .filter((row) => cleanId(row.winnerId || row.winnerid || ""))
      .slice()
      .sort((a, b) => studioTimeValue(b.date || b.endDate || b.createdAt) - studioTimeValue(a.date || a.endDate || a.createdAt))
      .slice(0, 40)
      .forEach((row, index) => {
        const trophy = trophyMap[cleanId(row.trophyId || row.trophyid || row.type || "")] || {};
        const name = row.name || row.trophyName || trophy.name || competitionTypeArabic(row.type || row.trophyId || "بطولة");
        rows.push({
          id: "archive:" + (row.id || row.recordId || index),
          source: "archive",
          row,
          title: name + (row.edition ? " " + row.edition : ""),
          subtitle: studioEventDateLabel(row.date, row.endDate) || "السجل العام",
          championName: getMemberName(members, row.winnerId || row.winnerid) || row.winnerName || row.winner || "البطل",
        });
      });
    return rows.slice(0, 60);
  }, [completedCompetitions, allTournaments, trophyMap, members]);

  const resultOptions = useMemo(() => {
    const rows = [];
    (competitions || []).forEach((competition) => {
      sortedCompetitionMatchesForSchedule(competition)
        .filter((match) => clean(match.resultStatus || match.status) === "completed" && clean(match.phase || "") !== "bye")
        .forEach((match) => {
          rows.push({
            id: (competition.id || "competition") + "::" + (match.id || rows.length),
            competition,
            match,
            title: (competition.name || competition.title || "بطولة") + " · " + (match.label || scheduleStageTitleForMatch(competition, match)),
            subtitle: (match.homeName || getMemberName(members, match.homeMemberId) || "طرف أول") + " " + (match.homeGoals ?? "-") + " - " + (match.awayGoals ?? "-") + " " + (match.awayName || getMemberName(members, match.awayMemberId) || "طرف ثاني") + " · " + studioEventDateLabel(match.completedAt, match.date, match.updatedAt, competition.updatedAt),
            time: studioTimeValue(match.completedAt || match.updatedAt || match.date || competition.updatedAt || competition.createdAt),
          });
        });
    });
    return rows.sort((a, b) => b.time - a.time).slice(0, 80);
  }, [competitions, members]);

  const dealOptions = useMemo(() => {
    return (transferHistory || [])
      .filter((row) => !["cancelled", "canceled", "rejected", "failed"].includes(clean(row.status || "completed")))
      .slice()
      .sort((a, b) => studioTimeValue(b.completedAt || b.createdAt || b.date) - studioTimeValue(a.completedAt || a.createdAt || a.date))
      .slice(0, 80)
      .map((row, index) => ({
        id: row.id || row.relatedOfferId || ("deal-" + index),
        row,
        title: row.playerName || row.targetPlayerName || "صفقة انتقال",
        subtitle: (row.fromMemberName || getMemberName(members, row.fromMemberId) || "طرف") + " ← " + (row.toMemberName || getMemberName(members, row.toMemberId) || "طرف") + " · " + formatMoney(row.amount || row.loanAmount || 0) + " · " + studioEventDateLabel(row.completedAt, row.date, row.createdAt),
      }));
  }, [transferHistory, members]);

  const memberOptions = useMemo(() => {
    const rows = [];
    (members || [])
      .filter((member) => cleanId(member.id) && !same(member.id, "FIFA"))
      .forEach((member) => {
        const id = cleanId(member.id);
        const name = member.name || member.memberName || id;
        const activeIndex = (rankedMembers || []).findIndex((row) => same(row.id || row.memberId, id));
        const activeRow = activeIndex >= 0 ? (rankedMembers || [])[activeIndex] : null;
        if (isActiveSeasonMember(member) || activeRow) {
          rows.push({
            id: `active:${id}`,
            variant: "active",
            member: activeRow ? { ...member, ...activeRow, id } : member,
            seasonRank: activeRow?.rankOrder || (activeIndex >= 0 ? activeIndex + 1 : 1),
            seasonTitles: toNumber(activeRow?.titles ?? member.titles ?? 0),
            title: `${name} — بطاقة نشط`,
            subtitle: "عضو نشط في الموسم · " + (activeRow?.team || member.team || member.club || member.nationalteam || "FIFA GROUP"),
          });
        }
        rows.push({
          id: `historical:${id}`,
          variant: "historical",
          member,
          title: `${name} — بطاقة تاريخي`,
          subtitle: (isActiveSeasonMember(member) ? "نسخة تاريخية للعضو النشط" : "عضو تاريخي") + " · " + (member.team || member.club || member.nationalteam || "FIFA GROUP"),
        });
      });
    return rows;
  }, [members, rankedMembers]);

  const selectedChampion = championOptions.find((item) => item.id === championId) || championOptions[0] || null;
  const selectedMatch = resultOptions.find((item) => item.id === matchId) || resultOptions[0] || null;
  const selectedDeal = dealOptions.find((item) => item.id === dealId) || dealOptions[0] || null;
  const selectedMember = memberOptions.find((item) => item.id === memberId) || memberOptions[0] || null;

  useEffect(() => { if (!championId && championOptions[0]) setChampionId(championOptions[0].id); }, [championId, championOptions]);
  useEffect(() => { if (!matchId && resultOptions[0]) setMatchId(resultOptions[0].id); }, [matchId, resultOptions]);
  useEffect(() => { if (!dealId && dealOptions[0]) setDealId(dealOptions[0].id); }, [dealId, dealOptions]);
  useEffect(() => {
    if (!memberOptions.length) return;
    if (memberId && memberOptions.some((item) => item.id === memberId)) return;
    const preferred = memberOptions.find((item) => item.variant === "active" && same(item.member?.id, currentMemberId))
      || memberOptions.find((item) => same(item.member?.id, currentMemberId))
      || memberOptions[0];
    if (preferred) setMemberId(preferred.id);
  }, [memberId, memberOptions, currentMemberId]);
  useEffect(() => { if (!memberId && memberOptions[0]) setMemberId(memberOptions[0].id); }, [memberId, memberOptions]);

  function handleDownload() {
    if (template === "champion") return downloadStudioChampionImage({ item: selectedChampion, members, config, trophyMap });
    if (template === "result") return downloadStudioResultImage({ item: selectedMatch, members, config, trophyMap });
    if (template === "deal") return downloadStudioDealImage({ item: selectedDeal, members, config });
    const exportMemberId = cleanId(selectedMember?.member?.id || selectedMember?.id || "");
    const exportPlayers = typeof getMemberPlayersForExport === "function"
      ? getMemberPlayersForExport(exportMemberId)
      : (players || []).filter((player) => same(player.memberid || player.memberId, exportMemberId));
    return downloadStudioMemberCardImage({
      item: selectedMember,
      members,
      allTournaments,
      trophyMap,
      config,
      players: exportPlayers,
      financeRows,
      contracts: playerContracts,
      statsMap,
      rankedMembers,
    });
  }

  const currentPreview = template === "champion" ? selectedChampion : template === "result" ? selectedMatch : template === "deal" ? selectedDeal : selectedMember;
  const templateText = template === "champion" ? "إعلان بطل بطولة" : template === "result" ? "نتيجة مباراة" : template === "deal" ? "إعلان صفقة" : "بطاقة عضو";

  return (
    <main className="widePage glass fifaStudioPage">
      <style>{fifaStudioCss}</style>
      <header className="pageHead">
        <h2>استوديو FIFA GROUP</h2>
        <p>قوالب نشر رسمية من بيانات التطبيق — قراءة وتصدير فقط بدون تعديل أي بيانات.</p>
      </header>

      <section className="studioTemplates glassSoft">
        {[
          ["champion", "🏆", "بطل بطولة"],
          ["result", "⚔️", "نتيجة مباراة"],
          ["deal", "🔁", "صفقة انتقال"],
          ["member", "🪪", "بطاقة عضو"],
        ].map(([id, icon, label]) => (
          <button type="button" key={id} className={template === id ? "active" : ""} onClick={() => setTemplate(id)}>
            <span>{icon}</span>
            <b>{label}</b>
          </button>
        ))}
      </section>

      <section className="studioGrid">
        <div className="studioPanel glassSoft">
          <div className="sectionHead compact"><div><h3>اختيار القالب</h3><p>اختر نوع الصورة ثم البيانات المراد تصديرها.</p></div></div>
          <div className="studioField">
            <label>{templateText}</label>
            {template === "champion" ? (
              <select value={selectedChampion?.id || ""} onChange={(event) => setChampionId(event.target.value)}>
                {championOptions.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.championName}</option>)}
              </select>
            ) : template === "result" ? (
              <select value={selectedMatch?.id || ""} onChange={(event) => setMatchId(event.target.value)}>
                {resultOptions.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.subtitle}</option>)}
              </select>
            ) : template === "deal" ? (
              <select value={selectedDeal?.id || ""} onChange={(event) => setDealId(event.target.value)}>
                {dealOptions.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.subtitle}</option>)}
              </select>
            ) : (
              <select value={selectedMember?.id || ""} onChange={(event) => setMemberId(event.target.value)}>
                {memberOptions.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.subtitle}</option>)}
              </select>
            )}
          </div>
          <button type="button" className="studioDownloadBtn" onClick={handleDownload} disabled={!currentPreview}>تحميل الصورة</button>
          <p className="studioSafeNote">هذا الاستوديو لا يكتب في Firebase ولا يغير أي سجل. التصدير فقط.</p>
        </div>

        <div className="studioPreview glassSoft">
          <div className="studioPreviewCard">
            <small>FIFA GROUP STUDIO</small>
            <h3>{templateText}</h3>
            <b>{currentPreview?.title || currentPreview?.member?.name || "لا توجد بيانات"}</b>
            <p>{currentPreview?.subtitle || currentPreview?.championName || "اختر بيانات القالب لتجهيز الصورة."}</p>
            <span>جاهز للنشر</span>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Studio helper functions (kept here — not imported from utils)
// ---------------------------------------------------------------------------

function studioTimeValue(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function studioMatchScoreText(match = {}) {
  const hg = match.homeGoals ?? match.homeScore ?? match.score1 ?? "-";
  const ag = match.awayGoals ?? match.awayScore ?? match.score2 ?? "-";
  return String(hg) + " - " + String(ag);
}

function studioEventDateLabel(...values) {
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

function downloadStudioChampionImage({ item, members = [], config = {}, trophyMap = {} } = {}) {
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

function downloadStudioResultImage({ item, members = [], config = {}, trophyMap = {} } = {}) {
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
    stageLabel: match.label || scheduleStageTitleForMatch(competition, match) || "مباراة",
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

function downloadFifaStudioResultCardImage({
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

function downloadStudioDealImage({ item, members = [], config = {} } = {}) {
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

function downloadStudioMemberSummaryImage({ item, allTournaments = [], config = {} } = {}) {
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

function transferTypeDisplayLabel(value = "") {
  const key = clean(value);
  if (key === "loan") return "إعارة";
  if (key === "buy" || key === "owned") return "شراء نهائي";
  if (key === "release") return "إنهاء تعاقد";
  return value || "انتقال";
}

function downloadFifaStudioCardImage({ config = {}, filename = "FIFA-STUDIO", icon = "🎬", title = "استوديو FIFA GROUP", main = "FIFA GROUP", subtitle = "", rows = [] } = {}) {
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

const fifaStudioCss = `
.fifaStudioPage{direction:rtl;text-align:right}
.studioTemplates{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px;padding:10px;border-radius:24px}
.studioTemplates button{min-height:92px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(2,6,23,.40);color:#EDF0FF;font-family:inherit;font-weight:1000;display:grid;place-items:center;gap:5px;cursor:pointer}
.studioTemplates button.active{background:linear-gradient(135deg,rgba(0,230,118,.16),rgba(0,212,255,.07));border-color:rgba(0,230,118,.35);color:#00E676}
.studioTemplates span{font-size:26px}.studioTemplates b{font-size:13px}
.studioGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}.studioPanel,.studioPreview{border-radius:26px;padding:16px;min-width:0}.studioField{display:grid;gap:8px;margin:12px 0}.studioField label{font-size:12px;font-weight:900;color:#9BA0C0}.studioField select{width:100%;height:46px;border-radius:16px;border:1px solid rgba(0,230,118,.18);background:rgba(2,6,23,.72);color:#EDF0FF;font-family:inherit;font-weight:900;padding:0 12px;outline:none}.studioDownloadBtn{width:100%;height:50px;border:0;border-radius:18px;background:linear-gradient(135deg,#00E676,#00B84C);color:#020617;font-family:inherit;font-weight:1000;cursor:pointer}.studioDownloadBtn:disabled{opacity:.45;cursor:not-allowed}.studioSafeNote{margin:10px 0 0;color:#9BA0C0;font-size:12px;font-weight:800;line-height:1.5}.studioPreview{display:grid;place-items:center}.studioPreviewCard{width:min(420px,100%);min-height:360px;border-radius:30px;border:1px solid rgba(0,230,118,.25);background:radial-gradient(circle at 80% 0,rgba(0,230,118,.18),transparent 45%),linear-gradient(145deg,rgba(4,12,28,.95),rgba(2,6,23,.86));padding:26px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;text-align:right;gap:12px;box-shadow:0 20px 70px rgba(0,0,0,.32)}.studioPreviewCard small{letter-spacing:3px;color:#00E676;font-size:11px;font-weight:1000}.studioPreviewCard h3{margin:0;color:#EDF0FF;font-size:22px;font-weight:1000}.studioPreviewCard b{font-size:34px;line-height:1.2;color:#EDF0FF}.studioPreviewCard p{margin:0;color:#9BA0C0;font-size:14px;font-weight:800;line-height:1.5}.studioPreviewCard span{margin-top:10px;border-radius:999px;padding:8px 14px;background:rgba(0,230,118,.12);border:1px solid rgba(0,230,118,.24);color:#00E676;font-size:12px;font-weight:1000}
@media(max-width:720px){.studioTemplates{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.studioTemplates button{min-height:78px}.studioGrid{grid-template-columns:1fr}.studioPanel,.studioPreview{border-radius:22px;padding:13px}.studioPreviewCard{min-height:280px}.studioPreviewCard b{font-size:28px}}
`;
