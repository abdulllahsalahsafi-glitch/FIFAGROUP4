import React, { useState } from 'react';
import { avatar } from '../utils';
import BackButton from '../components/ui/BackButton';

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
    ["مركزك", event.rankLabel || details.rankLabel || pointRankLabel(event.rank)],
    ["النقاط المكتسبة", Number(event.points || details.points || 0)],
    ["التاريخ", event.date || details.date],
  ];

  return rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
}

export default function MemberAllTrophiesSubPage({ member, groups, pointEvents = [], onBack, onOpenView }) {
  const [selectedPointEvent, setSelectedPointEvent] = useState(null);
  const safeGroups = groups || [];
  const safePointEvents = (pointEvents || []).filter((row) => Number(row.points || 0) > 0);
  const totalPoints = safePointEvents.reduce((sum, row) => sum + Number(row.points || 0), 0);

  return (
    <main className="widePage glass memberAllTrophiesSubPage">
      <style>{`
        .memberAllTrophiesSubPage .trophyGrid{
          margin-bottom:14px;
        }
        .seasonPointsDetailsBox{
          margin-top:14px;
          border-radius:26px;
          padding:14px;
          border:1px solid rgba(0,230,118,.14);
          background:linear-gradient(145deg,rgba(4,12,28,.82),rgba(2,6,23,.58));
          box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
        }
        .seasonPointsDetailsHead{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:12px;
        }
        .seasonPointsDetailsHead h3{
          margin:0;
          font-size:clamp(20px,5.2vw,28px);
          line-height:1.28;
          font-weight:1000;
          color:#EDF0FF;
          -webkit-text-fill-color:#EDF0FF;
        }
        .seasonPointsTotalPill{
          min-width:72px;
          height:36px;
          border-radius:999px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:0 13px;
          background:rgba(0,230,118,.12);
          border:1px solid rgba(0,230,118,.24);
          color:#00E676;
          -webkit-text-fill-color:#00E676;
          font-weight:1000;
          direction:ltr;
          unicode-bidi:plaintext;
          white-space:nowrap;
        }
        .seasonPointsTable{
          display:grid;
          gap:8px;
        }
        .seasonPointsTableRow{
          width:100%;
          appearance:none;
          border:1px solid rgba(255,255,255,.07);
          display:grid;
          grid-template-columns:minmax(0,1.35fr) minmax(76px,.62fr) minmax(70px,.48fr);
          gap:8px;
          align-items:center;
          min-height:46px;
          border-radius:16px;
          padding:8px 10px;
          background:rgba(2,6,23,.42);
          text-align:right;
          cursor:pointer;
        }
        .seasonPointsTableRow.head{
          min-height:34px;
          background:rgba(0,230,118,.08);
          border-color:rgba(0,230,118,.14);
          cursor:default;
        }
        .seasonPointsTableRow span{
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          font-size:12px;
          font-weight:900;
          color:#AEB6D2;
          -webkit-text-fill-color:#AEB6D2;
        }
        .seasonPointsTableRow b{
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
        .seasonPointsTableRow strong{
          justify-self:start;
          min-width:44px;
          height:30px;
          border-radius:999px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:0 11px;
          background:linear-gradient(135deg,rgba(0,230,118,.90),rgba(0,212,255,.78));
          color:#021018;
          -webkit-text-fill-color:#021018;
          font-size:13px;
          font-weight:1000;
          direction:ltr;
          unicode-bidi:plaintext;
        }
        .seasonPointsModalBackdrop{
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
        .seasonPointsModal{
          width:min(430px,100%);
          max-height:none;
          overflow:visible;
          border-radius:26px;
          border:1px solid rgba(0,230,118,.20);
          background:linear-gradient(145deg,rgba(4,12,28,.97),rgba(2,6,23,.95));
          box-shadow:0 24px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
          padding:15px;
          text-align:right;
        }
        .seasonPointsModalHead{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        }
        .seasonPointsModalHead h3{
          margin:0;
          font-size:clamp(18px,5.2vw,26px);
          line-height:1.25;
          color:#EDF0FF;
          -webkit-text-fill-color:#EDF0FF;
        }
        .seasonPointsModalClose{
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
        .seasonPointsModalRows{
          display:grid;
          gap:8px;
          margin-top:10px;
        }
        .seasonPointsModalRow{
          display:grid;
          grid-template-columns:104px minmax(0,1fr);
          gap:10px;
          align-items:center;
          border-radius:15px;
          padding:9px 11px;
          background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.065);
        }
        .seasonPointsModalRow span{
          color:#AEB6D2;
          -webkit-text-fill-color:#AEB6D2;
          font-size:12px;
          font-weight:900;
        }
        .seasonPointsModalRow b{
          color:#EDF0FF;
          -webkit-text-fill-color:#EDF0FF;
          font-size:13px;
          font-weight:1000;
          line-height:1.45;
          min-width:0;
          overflow-wrap:anywhere;
        }
        @media(max-width:720px){
          .seasonPointsDetailsBox{
            border-radius:22px;
            padding:12px;
          }
          .seasonPointsTableRow{
            grid-template-columns:minmax(0,1.25fr) minmax(64px,.55fr) minmax(54px,.42fr);
            gap:6px;
            padding:8px;
            border-radius:14px;
          }
          .seasonPointsTableRow b,
          .seasonPointsTableRow span{
            font-size:11.5px;
          }
          .seasonPointsTableRow strong{
            min-width:38px;
            height:28px;
            font-size:12px;
            padding:0 9px;
          }
          .seasonPointsModal{
            border-radius:24px;
            padding:14px;
          }
          .seasonPointsModalRow{
            grid-template-columns:92px minmax(0,1fr);
          }
        }
      `}</style>

      <BackButton onBack={onBack} />
      <header className="pageHead">
        <h2>بطولات {member.name}</h2>
        <p>كل البطولات التي فاز بها العضو مجمعة حسب نوع البطولة.</p>
      </header>

      <div className="trophyGrid">
        {safeGroups.length ? (
          safeGroups.map((group) => (
            <button
              className="trophyCard won"
              key={group.trophyId}
              onClick={() =>
                onOpenView({ type: "memberTrophy", member, group })
              }
            >
              <img src={group.image || avatar(group.name)} alt="" />
              <h4>{group.name}</h4>
              <b>{group.count}</b>
            </button>
          ))
        ) : (
          <div className="empty">لا توجد بطولات.</div>
        )}
      </div>

      {safePointEvents.length ? (
        <section className="seasonPointsDetailsBox">
          <div className="seasonPointsDetailsHead">
            <h3>تفاصيل النقاط المكتسبة</h3>
            <span className="seasonPointsTotalPill">{totalPoints}</span>
          </div>

          <div className="seasonPointsTable">
            <div className="seasonPointsTableRow head">
              <span>البطولة</span>
              <span>المركز</span>
              <span>النقاط</span>
            </div>
            {safePointEvents.map((row, index) => (
              <button
                type="button"
                className="seasonPointsTableRow"
                key={`${row.id || row.competitionId || index}-${row.rank}-${row.points}`}
                onClick={() => setSelectedPointEvent(row)}
              >
                <b>{pointEventName(row)}</b>
                <span>{pointRankLabel(row.rank)}</span>
                <strong>{Number(row.points || 0)}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {selectedPointEvent ? (
        <div className="seasonPointsModalBackdrop" onClick={() => setSelectedPointEvent(null)}>
          <section className="seasonPointsModal" onClick={(event) => event.stopPropagation()}>
            <div className="seasonPointsModalHead">
              <h3>تفاصيل النقاط</h3>
              <button type="button" className="seasonPointsModalClose" onClick={() => setSelectedPointEvent(null)}>
                ×
              </button>
            </div>
            <div className="seasonPointsModalRows">
              {pointEventDetailRows(selectedPointEvent).map(([label, value]) => (
                <div className="seasonPointsModalRow" key={label}>
                  <span>{label}</span>
                  <b>{String(value)}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
