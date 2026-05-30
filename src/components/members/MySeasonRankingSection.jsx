import React, { useMemo, useState } from 'react';
import { avatar, formatLatinNumber } from '../../utils/ui';

const mySeasonRankingCss = `
.mySeasonRankingPanel{
  direction:rtl;
  text-align:right;
}
.mySeasonRankingHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  border-radius:22px;
  background:linear-gradient(145deg,rgba(4,12,28,.74),rgba(2,6,23,.52));
  border:1px solid rgba(0,230,118,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
  margin-bottom:12px;
}
.mySeasonRankingHead h3{
  margin:0;
  font-size:clamp(22px,5.6vw,30px);
  line-height:1.25;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}
.mySeasonRankingHead p{
  margin:5px 0 0;
  font-size:12px;
  line-height:1.45;
  font-weight:800;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
}
.mySeasonRankingSummary{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:9px;
  margin-bottom:12px;
}
.mySeasonRankingStat{
  min-height:82px;
  border-radius:20px;
  padding:11px;
  background:linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.82));
  border:1px solid rgba(0,230,118,.14);
  display:grid;
  place-items:center;
  text-align:center;
  min-width:0;
}
.mySeasonRankingStat b{
  font-size:clamp(20px,5.6vw,34px);
  line-height:1.05;
  font-weight:1000;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  white-space:nowrap;
  direction:ltr;
  unicode-bidi:plaintext;
}
.mySeasonRankingStat span{
  font-size:11px;
  font-weight:900;
  color:#9BA0C0;
  -webkit-text-fill-color:#9BA0C0;
}

/* Smart collapsible boxes */
.mySeasonSmartBox{
  margin-top:13px;
  border-radius:24px;
  padding:12px;
  border:1px solid rgba(0,230,118,.14);
  background:linear-gradient(145deg,rgba(4,12,28,.82),rgba(2,6,23,.58));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
  overflow:hidden;
}
.mySeasonSmartHead{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:10px;
  align-items:start;
  width:100%;
  padding:0;
  border:0;
  background:transparent;
  text-align:right;
  color:inherit;
}
.mySeasonSmartHead.clickable{
  cursor:pointer;
}
.mySeasonSmartTitle{
  min-width:0;
}
.mySeasonSmartTitle h4,
.mySeasonSmartTitle h3{
  margin:0;
  font-size:clamp(19px,5vw,27px);
  line-height:1.25;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}
.mySeasonSmartPreview{
  display:flex;
  align-items:center;
  gap:7px;
  min-width:0;
  margin-top:7px;
  color:#9BA0C0;
  -webkit-text-fill-color:#9BA0C0;
  font-size:11px;
  font-weight:900;
  line-height:1.35;
  white-space:nowrap;
  overflow:hidden;
}
.mySeasonSmartPreview span{
  min-width:0;
  max-width:132px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.mySeasonSmartPreview b{
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
.mySeasonSmartPill{
  min-width:68px;
  height:34px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 12px;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.24);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-weight:1000;
  direction:rtl;
  white-space:nowrap;
}
.mySeasonSmartCue{
  width:26px;
  height:26px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin-inline-start:8px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.08);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  transition:transform .2s ease;
}
.mySeasonSmartCue svg{
  width:15px;
  height:15px;
  stroke:currentColor;
  stroke-width:2.4;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.mySeasonSmartHead.open .mySeasonSmartCue{
  transform:rotate(180deg);
}
.mySeasonSmartBody{
  margin-top:12px;
}
.mySeasonSmartHint{
  width:100%;
  margin-top:9px;
  border-radius:16px;
  padding:9px 10px;
  background:rgba(0,230,118,.07);
  border:1px solid rgba(0,230,118,.12);
  color:#A7F3D0;
  -webkit-text-fill-color:#A7F3D0;
  font-size:12px;
  font-weight:900;
  text-align:center;
}

/* Trophy preview/content */
.mySeasonRankingTrophies{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:9px;
}
.mySeasonRankingTrophy{
  min-height:98px;
  border-radius:20px;
  padding:11px;
  background:linear-gradient(145deg,rgba(4,12,28,.78),rgba(2,6,23,.54));
  border:1px solid rgba(0,230,118,.12);
  display:grid;
  grid-template-columns:50px minmax(0,1fr);
  gap:10px;
  align-items:center;
  text-align:right;
}
.mySeasonRankingTrophyIcon{
  width:50px;
  height:50px;
  border-radius:16px;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
  display:grid;
  place-items:center;
  overflow:hidden;
}
.mySeasonRankingTrophyIcon img{
  width:100%;
  height:100%;
  object-fit:contain;
  padding:4px;
}
.mySeasonRankingTrophyIcon svg{
  width:28px;
  height:28px;
  stroke:#00E676;
  stroke-width:1.8;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.mySeasonRankingTrophy b{
  display:block;
  min-width:0;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  font-size:13px;
  font-weight:1000;
  line-height:1.35;
  white-space:normal;
  overflow-wrap:anywhere;
}
.mySeasonRankingTrophy small{
  display:block;
  margin-top:4px;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  font-size:11px;
  line-height:1.35;
  font-weight:800;
}

/* Points table */
.mySeasonPointsTable{
  display:grid;
  gap:8px;
}
.mySeasonPointsRow{
  width:100%;
  appearance:none;
  border:1px solid rgba(255,255,255,.07);
  display:grid;
  grid-template-columns:minmax(0,1.35fr) minmax(70px,.6fr) minmax(58px,.42fr);
  gap:8px;
  align-items:center;
  min-height:44px;
  border-radius:15px;
  padding:8px 10px;
  background:rgba(2,6,23,.42);
  text-align:right;
  cursor:pointer;
}
.mySeasonPointsRow.head{
  min-height:34px;
  background:rgba(0,230,118,.08);
  border-color:rgba(0,230,118,.14);
  cursor:default;
}
.mySeasonPointsRow span{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:12px;
  font-weight:900;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
}
.mySeasonPointsRow b{
  min-width:0;
  overflow:visible;
  text-overflow:clip;
  white-space:normal;
  overflow-wrap:anywhere;
  line-height:1.35;
  font-size:13px;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}
.mySeasonPointsRow strong{
  justify-self:start;
  min-width:38px;
  height:28px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 9px;
  background:linear-gradient(135deg,rgba(0,230,118,.90),rgba(0,212,255,.78));
  color:#021018;
  -webkit-text-fill-color:#021018;
  font-size:12px;
  font-weight:1000;
  direction:ltr;
  unicode-bidi:plaintext;
}

/* Compact modal */
.mySeasonPointsModalBackdrop{
  position:fixed;
  inset:0;
  z-index:9999;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:18px;
  background:rgba(0,0,0,.64);
  backdrop-filter:blur(12px);
}
.mySeasonPointsModal{
  width:min(430px,100%);
  border-radius:26px;
  border:1px solid rgba(0,230,118,.20);
  background:linear-gradient(145deg,rgba(4,12,28,.97),rgba(2,6,23,.95));
  box-shadow:0 24px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
  padding:15px;
  text-align:right;
}
.mySeasonPointsModalHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
.mySeasonPointsModalHead h3{
  margin:0;
  font-size:clamp(18px,5.2vw,26px);
  line-height:1.25;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}
.mySeasonPointsModalClose{
  width:38px;
  height:38px;
  min-width:38px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.06);
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  font-weight:1000;
}
.mySeasonPointsModalRows{
  display:grid;
  gap:8px;
  margin-top:10px;
}
.mySeasonPointsModalRow{
  display:grid;
  grid-template-columns:104px minmax(0,1fr);
  gap:10px;
  align-items:center;
  border-radius:15px;
  padding:9px 11px;
  background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.065);
}
.mySeasonPointsModalRow span{
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  font-size:12px;
  font-weight:900;
}
.mySeasonPointsModalRow b{
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  font-size:13px;
  font-weight:1000;
  line-height:1.45;
  min-width:0;
  overflow-wrap:anywhere;
}
@media(max-width:720px){
  .mySeasonRankingSummary{
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:8px;
  }
  .mySeasonRankingStat{
    min-height:76px;
    border-radius:18px;
    padding:9px;
  }
  .mySeasonRankingTrophies{
    grid-template-columns:1fr;
  }
  .mySeasonSmartBox{
    border-radius:22px;
    padding:11px;
  }
  .mySeasonPointsRow{
    grid-template-columns:minmax(0,1.25fr) minmax(64px,.55fr) minmax(48px,.38fr);
    gap:6px;
    padding:8px;
    border-radius:14px;
  }
  .mySeasonPointsRow b,
  .mySeasonPointsRow span{
    font-size:11.5px;
  }
  .mySeasonSmartPreview span{
    max-width:105px;
  }
}
`;

function pointRankLabel(rank) {
  const value = Number(rank || 0);
  if (value === 1) return "البطل";
  if (value === 2) return "الوصيف";
  if (value === 3) return "الثالث";
  if (value === 4) return "الرابع";
  if (value === 5) return "الخامس";
  if (value === 6) return "السادس";
  return value ? `المركز ${value}` : "-";
}

function pointEventName(row = {}) {
  return row.name || row.details?.name || row.title || row.trophyName || row.trophyname || row.competitionName || row.competitionname || "بطولة";
}

function pointEventDetailRows(event = {}) {
  const details = event.details || {};
  const rows = [
    ["البطولة", pointEventName(event)],
    ["النسخة", details.edition],
    ["مركزك", pointRankLabel(event.rank)],
    ["النقاط المكتسبة", Number(event.points || details.points || 0)],
    ["التاريخ", event.date || details.date],
  ];
  return rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
}

function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function canonicalTypeCandidates(type = "", name = "") {
  const text = normalizeKey(`${type} ${name}`);
  if (["league", "الدوري"].some((item) => text.includes(normalizeKey(item)))) return ["league", "الدوري", "دوري"];
  if (["super_cup", "supercup", "السوبر", "كاسالسوبر", "كأسالسوبر"].some((item) => text.includes(normalizeKey(item)))) return ["super_cup", "supercup", "كأس السوبر", "كاس السوبر", "السوبر"];
  if (["world_cup", "worldcup", "كاسالعالم", "كأسالعالم"].some((item) => text.includes(normalizeKey(item)))) return ["world_cup", "worldcup", "كأس العالم", "كاس العالم"];
  if (["champions_league", "championsleague", "دوريالابطال", "دوريالأبطال"].some((item) => text.includes(normalizeKey(item)))) return ["champions_league", "championsleague", "دوري الأبطال", "دوري الابطال"];
  if (["cup", "الكاس", "الكأس"].some((item) => text.includes(normalizeKey(item)))) return ["cup", "الكأس", "الكاس", "كأس", "كاس"];
  return [];
}

function entryImage(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry.image || entry.icon || entry.logo || entry.trophyImage || entry.imageUrl || entry.url || "";
}

function lookupTrophyImage(trophyMap, row = {}) {
  const direct = row.image || row.trophyImage || row.details?.image || row.details?.trophyImage || "";
  if (direct) return direct;

  const name = pointEventName(row);
  const candidates = [
    row.trophyId,
    row.type,
    row.typeLabel,
    row.details?.type,
    row.details?.typeLabel,
    row.details?.trophyId,
    name,
    ...(canonicalTypeCandidates(row.type || row.trophyId || row.details?.type || "", name)),
  ].filter(Boolean);

  if (!trophyMap) return "";

  const getEntry = (key) => {
    if (!key) return null;
    if (typeof trophyMap.get === "function") {
      return trophyMap.get(key) || trophyMap.get(normalizeKey(key));
    }
    return trophyMap[key] || trophyMap[normalizeKey(key)];
  };

  for (const key of candidates) {
    const found = entryImage(getEntry(key));
    if (found) return found;
  }

  if (typeof trophyMap === "object") {
    const entries = typeof trophyMap.entries === "function"
      ? Array.from(trophyMap.entries())
      : Object.entries(trophyMap);
    const normalizedCandidates = candidates.map(normalizeKey);
    for (const [key, value] of entries) {
      const normalizedKey = normalizeKey(key);
      if (normalizedCandidates.some((candidate) => candidate && (candidate === normalizedKey || normalizedKey.includes(candidate) || candidate.includes(normalizedKey)))) {
        const found = entryImage(value);
        if (found) return found;
      }
    }
  }

  return "";
}

function TrophyFallbackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v3c0 3.3-1.8 6-4 6s-4-2.7-4-6V4Z" />
      <path d="M7.5 6H5.8c-.9 0-1.5.7-1.3 1.6.4 2.1 1.7 3.4 3.6 3.9" />
      <path d="M16.5 6h1.7c.9 0 1.5.7 1.3 1.6-.4 2.1-1.7 3.4-3.6 3.9" />
      <path d="M12 13v4" />
      <path d="M8.5 20h7" />
      <path d="M10 17h4" />
    </svg>
  );
}

function ChevronCue() {
  return (
    <span className="mySeasonSmartCue" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="m7 10 5 5 5-5" />
      </svg>
    </span>
  );
}

function SmartSectionHeader({ title, countLabel, previewItems = [], extraCount = 0, open, collapsible, onToggle }) {
  const Tag = collapsible ? "button" : "div";
  return (
    <Tag
      type={collapsible ? "button" : undefined}
      className={`mySeasonSmartHead${collapsible ? " clickable" : ""}${open ? " open" : ""}`}
      onClick={collapsible ? onToggle : undefined}
      aria-expanded={collapsible ? open : undefined}
    >
      <div className="mySeasonSmartTitle">
        <h3>{title}</h3>
        {previewItems.length || extraCount > 0 ? (
          <div className="mySeasonSmartPreview">
            {previewItems.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
            {extraCount > 0 ? <b>+{formatLatinNumber(extraCount)}</b> : null}
          </div>
        ) : null}
      </div>
      <span className="mySeasonSmartPill">
        {countLabel}
        {collapsible ? <ChevronCue /> : null}
      </span>
    </Tag>
  );
}

export default function MySeasonRankingSection({ member, rankingRow, rankOrder = 0, trophyMap = {} }) {
  const [selectedPointEvent, setSelectedPointEvent] = useState(null);
  const safeRanking = rankingRow || null;
  const pointEvents = (safeRanking?.pointEvents || []).filter((row) => Number(row.points || 0) > 0);
  const wonRows = (safeRanking?.rows || []).filter((row) => Number(row.rank || 1) === 1 || row.winnerId || row.memberId);
  const totalPoints = Number(safeRanking?.points || 0);
  const totalTitles = Number(safeRanking?.titles || 0);

  const trophyAutoCollapsed = wonRows.length > 3;
  const pointsAutoCollapsed = pointEvents.length > 5;
  const [trophiesOpen, setTrophiesOpen] = useState(!trophyAutoCollapsed);
  const [pointsOpen, setPointsOpen] = useState(!pointsAutoCollapsed);

  const visibleTrophies = trophiesOpen ? wonRows : wonRows.slice(0, 2);
  const visiblePointEvents = pointsOpen ? pointEvents : pointEvents.slice(0, 5);

  const trophyPreview = useMemo(() => wonRows.slice(0, 2).map(pointEventName), [wonRows]);
  const pointsPreview = useMemo(() => pointEvents.slice(0, 2).map(pointEventName), [pointEvents]);

  return (
    <section className="sectionBox glassSoft mySeasonRankingPanel">
      <style>{mySeasonRankingCss}</style>

      <div className="mySeasonRankingHead">
        <div>
          <h3>تصنيفي في الموسم</h3>
          <p>ملخص مركزك ونقاطك وبطولاتك في الموسم النشط.</p>
        </div>
      </div>

      {safeRanking ? (
        <>
          <div className="mySeasonRankingSummary">
            <div className="mySeasonRankingStat">
              <b>#{formatLatinNumber(rankOrder || safeRanking.rankOrder || 0)}</b>
              <span>المركز</span>
            </div>
            <div className="mySeasonRankingStat">
              <b>{formatLatinNumber(totalPoints)}</b>
              <span>النقاط</span>
            </div>
            <div className="mySeasonRankingStat">
              <b>{formatLatinNumber(totalTitles)}</b>
              <span>البطولات</span>
            </div>
          </div>

          <section className="mySeasonSmartBox">
            <SmartSectionHeader
              title="بطولاتي في الموسم"
              countLabel={`${formatLatinNumber(wonRows.length)} بطولة`}
              previewItems={trophyAutoCollapsed && !trophiesOpen ? trophyPreview : []}
              extraCount={trophyAutoCollapsed && !trophiesOpen ? Math.max(0, wonRows.length - 2) : 0}
              open={trophiesOpen}
              collapsible={trophyAutoCollapsed}
              onToggle={() => setTrophiesOpen((value) => !value)}
            />

            {visibleTrophies.length ? (
              <div className="mySeasonSmartBody">
                <div className="mySeasonRankingTrophies">
                  {visibleTrophies.map((row, index) => {
                    const image = lookupTrophyImage(trophyMap, row);
                    return (
                      <article className="mySeasonRankingTrophy" key={`${row.id || row.competitionId || row.name || index}`}>
                        <div className="mySeasonRankingTrophyIcon">
                          {image ? <img src={image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <TrophyFallbackIcon />}
                        </div>
                        <div>
                          <b>{pointEventName(row)}</b>
                          <small>{row.date || row.details?.date || "بدون تاريخ"}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {trophyAutoCollapsed && !trophiesOpen ? (
                  <div className="mySeasonSmartHint">اضغط على عنوان القسم لعرض كل البطولات.</div>
                ) : null}
              </div>
            ) : (
              <div className="mySeasonSmartBody">
                <div className="empty">لا توجد بطولات موسم مسجلة لك حتى الآن.</div>
              </div>
            )}
          </section>

          <section className="mySeasonSmartBox">
            <SmartSectionHeader
              title="تفاصيل النقاط المكتسبة"
              countLabel={formatLatinNumber(totalPoints)}
              previewItems={pointsAutoCollapsed && !pointsOpen ? pointsPreview : []}
              extraCount={pointsAutoCollapsed && !pointsOpen ? Math.max(0, pointEvents.length - 5) : 0}
              open={pointsOpen}
              collapsible={pointsAutoCollapsed}
              onToggle={() => setPointsOpen((value) => !value)}
            />

            {pointEvents.length ? (
              <div className="mySeasonSmartBody">
                <div className="mySeasonPointsTable">
                  <div className="mySeasonPointsRow head">
                    <span>البطولة</span>
                    <span>مركزك</span>
                    <span>النقاط</span>
                  </div>
                  {visiblePointEvents.map((row, index) => (
                    <button
                      type="button"
                      className="mySeasonPointsRow"
                      key={`${row.id || row.competitionId || index}-${row.rank}-${row.points}`}
                      onClick={() => setSelectedPointEvent(row)}
                    >
                      <b>{pointEventName(row)}</b>
                      <span>{pointRankLabel(row.rank)}</span>
                      <strong>{formatLatinNumber(Number(row.points || 0))}</strong>
                    </button>
                  ))}
                </div>
                {pointsAutoCollapsed && !pointsOpen ? (
                  <div className="mySeasonSmartHint">اضغط على عنوان القسم لعرض كل صفوف النقاط.</div>
                ) : null}
              </div>
            ) : (
              <div className="mySeasonSmartBody">
                <div className="empty">لا توجد نقاط موسم مسجلة لك حتى الآن.</div>
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="empty">لا توجد بيانات تصنيف مرتبطة بعضويتك في الموسم النشط.</div>
      )}

      {selectedPointEvent ? (
        <div className="mySeasonPointsModalBackdrop" onClick={() => setSelectedPointEvent(null)}>
          <section className="mySeasonPointsModal" onClick={(event) => event.stopPropagation()}>
            <div className="mySeasonPointsModalHead">
              <h3>تفاصيل النقاط</h3>
              <button type="button" className="mySeasonPointsModalClose" onClick={() => setSelectedPointEvent(null)}>
                ×
              </button>
            </div>
            <div className="mySeasonPointsModalRows">
              {pointEventDetailRows(selectedPointEvent).map(([label, value]) => (
                <div className="mySeasonPointsModalRow" key={label}>
                  <span>{label}</span>
                  <b>{String(value)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
