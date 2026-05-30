import React, { useState } from 'react'
import { Swords, Trophy, Target, TrendingDown, Download } from 'lucide-react'
import { stripIcon } from '../constants'
import { formatLatinNumber } from '../utils/ui'
import { cleanId } from '../utils/helpers'
import { getMemberName } from '../utils/admin'
import { downloadGeneralStatsImage } from '../utils/canvas'
import HistoricalMembersStatsShowcase from '../components/members/HistoricalMembersStatsShowcase'
import MuseumPage from './MuseumPage'

function StatHeroIcon({ type = '' }) {
  const common = { viewBox: '0 0 24 24', 'aria-hidden': 'true' }
  if (type === 'finals') {
    return (
      <svg {...common}>
        <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
        <path d="M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10" />
        <path d="M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10" />
        <path d="M12 12v4" />
        <path d="M8.5 20h7" />
        <path d="M10 16h4" />
      </svg>
    )
  }
  if (type === 'goals') {
    return (
      <svg {...common}>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v5l3 2" />
        <path d="M8 4.8 10 8" />
        <path d="M16 4.8 14 8" />
        <path d="M6 14h4" />
        <path d="M14 14h4" />
      </svg>
    )
  }
  if (type === 'members') {
    return (
      <svg {...common}>
        <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M17 12a2.5 2.5 0 1 0 0-5" />
        <path d="M14.5 19a3.8 3.8 0 0 1 6 0" />
      </svg>
    )
  }
  if (type === 'rate') {
    return (
      <svg {...common}>
        <path d="M5 18h14" />
        <path d="M7 15l3-4 3 2 4-6" />
        <path d="M17 7h-4" />
        <path d="M17 7v4" />
      </svg>
    )
  }
  return null
}

function GeneralStatsPage({ config, statsMap, members, allTournaments = [], trophyMap = {}, seasons = [], onOpenView }) {
  const [statsMode, setStatsMode] = useState("overview");
  const rows = Object.values(statsMap)
    .filter((row) => getMemberName(members, row.memberId) !== row.memberId)
    .sort((a, b) => b.finalsPlayed - a.finalsPlayed || b.finalsWon - a.finalsWon || b.finalGoalsFor - a.finalGoalsFor);

  const getMember = (id) => members.find((m) => cleanId(m.id) === id) || {};
  const winRate = (row) => row.finalsPlayed ? Math.round((row.finalsWon / row.finalsPlayed) * 100) : 0;

  const totalFinals  = Math.round(rows.reduce((s, r) => s + r.finalsPlayed, 0) / 2);
  const totalGoals   = rows.reduce((s, r) => s + r.finalGoalsFor, 0);

  const topFinals    = rows[0];
  const topWins      = [...rows].sort((a, b) => b.finalsWon - a.finalsWon)[0];
  const topGoals     = [...rows].sort((a, b) => b.finalGoalsFor - a.finalGoalsFor)[0];
  const topRelegated = [...rows].sort((a, b) => b.relegations - a.relegations)[0];
  const topWinRate   = [...rows].filter((r) => r.finalsPlayed >= 3)
    .sort((a, b) => winRate(b) - winRate(a))[0];

  const records = [
    { Icon: Swords, label: "الأكثر لعبًا",     row: topFinals,    val: (r) => `${r.finalsPlayed} نهائي` },
    { Icon: Trophy, label: "الأكثر فوزًا",      row: topWins,      val: (r) => `${r.finalsWon} فوز` },
    { Icon: Target, label: "الأكثر تسجيلًا",    row: topGoals,     val: (r) => `${r.finalGoalsFor} هدف` },
    { Icon: TrendingDown, label: "الأكثر هبوطًا",     row: topRelegated, val: (r) => `${r.relegations} مرة` },
  ];

  const heroCards = [
    { type: "finals", value: totalFinals, label: "إجمالي النهائيات" },
    { type: "goals", value: totalGoals, label: "إجمالي الأهداف" },
    { type: "members", value: rows.length, label: "الأعضاء" },
    { type: "rate", value: topWinRate ? winRate(topWinRate) + "%" : "-", label: "أعلى نسبة فوز" },
  ];

  const gsCss = `
.gsHeroGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.gsHeroCard{border-radius:20px;padding:16px 14px;background:linear-gradient(145deg,rgba(4,12,28,.90),rgba(6,15,34,.84));border:1px solid rgba(0,230,118,.16);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px}
.gsHeroIcon{width:38px;height:38px;border-radius:15px;display:grid;place-items:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);color:#00E676;-webkit-text-fill-color:#00E676}
.gsHeroIcon svg{width:22px;height:22px;stroke:currentColor;stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
.gsHeroV{font-size:clamp(26px,7vw,38px);font-weight:900;color:#00E676;direction:ltr;-webkit-text-fill-color:#00E676;line-height:1}
.gsHeroL{font-size:10px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0}
.gsRecordsGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.gsRecord{border-radius:22px;padding:14px;background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(6,15,34,.80));border:1px solid rgba(0,230,118,.14);color:inherit;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;transition:border-color .15s;width:100%;min-height:150px}
.gsRecord:active{border-color:rgba(0,230,118,.32)}
.gsRecordTop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:100%;text-align:center}
.gsRecordIcon{width:34px;height:34px;border-radius:13px;display:grid;place-items:center;color:#00E676;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);line-height:1;text-align:center}
.gsRecordIcon svg{width:21px;height:21px;stroke:currentColor;fill:none}
.gsRecordLabel{font-size:11px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;text-align:center;width:100%}
.gsRecordBody{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:100%;text-align:center}
.gsRecordAvatar{width:48px;height:48px;border-radius:16px;object-fit:cover;border:2px solid rgba(0,230,118,.28);display:block;margin:0 auto}
.gsRecordName{font-size:clamp(20px,5vw,26px);font-weight:900;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;text-align:center;width:100%;line-height:1.12}
.gsRecordVal{font-size:13px;font-weight:700;color:#00E676;-webkit-text-fill-color:#00E676;text-align:center;width:100%}
.gsTable{border-radius:22px;overflow:hidden;background:linear-gradient(145deg,rgba(4,12,28,.82),rgba(6,15,34,.72));border:1px solid rgba(0,230,118,.13);margin-bottom:14px}
.gsTableHead{display:grid;grid-template-columns:1.6fr .7fr .7fr .7fr 1fr .6fr;gap:6px;padding:11px 14px;background:rgba(0,230,118,.09);font-size:11px;font-weight:700;color:#9BA0C0;text-align:center}
.gsTableHead span:first-child{text-align:right}
.gsTableRow{display:grid;grid-template-columns:1.6fr .7fr .7fr .7fr 1fr .6fr;gap:6px;padding:10px 14px;align-items:center;text-align:center;border-top:1px solid rgba(0,230,118,.07);background:transparent;border-left:0;border-right:0;border-bottom:0;color:inherit;cursor:pointer;width:100%;transition:background .15s}
.gsTableRow:active{background:rgba(0,230,118,.06)}
.gsTableMember{display:flex;align-items:center;gap:7px;text-align:right;min-width:0}
.gsTableMember img{width:30px;height:30px;border-radius:10px;object-fit:cover;flex-shrink:0}
.gsTableMember b{color:#EDF0FF;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;-webkit-text-fill-color:#EDF0FF}
.gsTableRank{font-size:11px;font-weight:700;color:#6270A0;flex-shrink:0;min-width:18px;text-align:center}
.gsTableWin{color:#00E676!important;font-weight:900;-webkit-text-fill-color:#00E676!important}
.gsTableLoss{color:rgba(239,68,68,.9)!important;font-weight:900;-webkit-text-fill-color:rgba(239,68,68,.9)!important}
.gsRate{position:relative;height:20px;background:rgba(255,255,255,.06);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.gsRateBar{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(0,230,118,.55),rgba(0,230,118,.18));border-radius:6px}
.gsRate span{position:relative;z-index:1;font-size:10px;font-weight:700;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF}
.imageActionRow button{display:inline-flex;align-items:center;justify-content:center;gap:8px}
.imageActionRow button svg{width:18px;height:18px;stroke:currentColor;fill:none}
@media(max-width:420px){
  .gsHeroCard{min-height:136px}
  .gsTableHead,.gsTableRow{grid-template-columns:1.4fr .6fr .6fr .6fr .85fr .5fr;gap:3px;padding:9px 10px;font-size:11px}
  .gsTableMember b{font-size:11px}
  .gsRecordName{font-size:clamp(18px,4.5vw,22px)}
}`;

  return (
    <main className="widePage glass">
      <style>{gsCss}</style>
      <header className="pageHead">
        <h2>{stripIcon(config.statsTitle)}</h2>
        <p>نهائيات، أهداف، وهبوط الدوري، ومتحف إنجازات FIFA GROUP من السجل العام.</p>
      </header>

      <HistoricalMembersStatsShowcase members={members} allTournaments={allTournaments} statsMap={statsMap} config={config} />

      <nav className="tabs">
        <button type="button" className={statsMode === "overview" ? "tabBtn active" : "tabBtn"} onClick={() => setStatsMode("overview")}>الإحصائيات العامة</button>
        <button type="button" className={statsMode === "museum" ? "tabBtn active" : "tabBtn"} onClick={() => setStatsMode("museum")}>متحف FIFA GROUP</button>
      </nav>

      {statsMode === "museum" ? (
        <MuseumPage
          embedded
          config={config}
          members={members}
          allTournaments={allTournaments}
          trophyMap={trophyMap}
          seasons={seasons}
          statsMap={statsMap}
        />
      ) : (
        <>
          <div className="gsHeroGrid">
            {heroCards.map((item) => (
              <div className="gsHeroCard" key={item.label}>
                <span className="gsHeroIcon"><StatHeroIcon type={item.type} /></span>
                <span className="gsHeroV">{item.value}</span>
                <span className="gsHeroL">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="gsRecordsGrid">
            {records.map(({ Icon, label, row, val }) => {
              if (!row) return null;
              const member = getMember(row.memberId);
              return (
                <button
                  key={label}
                  className="gsRecord"
                  onClick={() => onOpenView({ type: "memberFinals", member: { id: row.memberId, name: getMemberName(members, row.memberId) }, title: `نهائيات ${getMemberName(members, row.memberId)}`, rows: row.finals })}
                >
                  <div className="gsRecordTop">
                    <span className="gsRecordLabel">{label}</span>
                    <span className="gsRecordIcon" aria-hidden="true"><Icon size={21} strokeWidth={2.25} /></span>
                  </div>
                  <div className="gsRecordBody">
                    {member.avatar ? <img className="gsRecordAvatar" src={member.avatar} alt="" /> : null}
                    <b className="gsRecordName">{getMemberName(members, row.memberId)}</b>
                    <span className="gsRecordVal">{val(row)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="gsTable">
            <div className="gsTableHead">
              <span>العضو</span>
              <span>نهائيات</span>
              <span>فوز</span>
              <span>خسارة</span>
              <span>نسبة الفوز</span>
              <span>هبوط</span>
            </div>
            {rows.map((row, idx) => {
              const rate = winRate(row);
              const member = getMember(row.memberId);
              return (
                <button
                  key={row.memberId}
                  className="gsTableRow"
                  onClick={() => onOpenView({ type: "memberFinals", member: { id: row.memberId, name: getMemberName(members, row.memberId) }, title: `نهائيات ${getMemberName(members, row.memberId)}`, rows: row.finals })}
                >
                  <div className="gsTableMember">
                    <span className="gsTableRank">#{idx + 1}</span>
                    {member.avatar ? <img src={member.avatar} alt="" /> : null}
                    <b>{getMemberName(members, row.memberId)}</b>
                  </div>
                  <span>{row.finalsPlayed}</span>
                  <span className="gsTableWin">{row.finalsWon}</span>
                  <span className="gsTableLoss">{row.finalsLost}</span>
                  <div className="gsRate">
                    <div className="gsRateBar" style={{ width: rate + "%" }} />
                    <span>{rate}%</span>
                  </div>
                  <span>{row.relegations || "—"}</span>
                </button>
              );
            })}
          </div>

          <div className="imageActionRow">
            <button onClick={() => downloadGeneralStatsImage({ statsMap, members, config })}>
              <Download size={18} strokeWidth={2.25} />
              <span>تحميل الإحصائيات</span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default GeneralStatsPage
