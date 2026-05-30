import React, { useState, useMemo } from 'react';
import { cleanId, same } from '../../utils';
import { isFifaSystemMember } from '../../utils/data';
import { formatLatinNumber } from '../../utils/ui';
import { downloadHistoricalMemberCardImage } from '../../utils/canvas';

const fifaMemberLegacyScrollerCss = `
.fgMemberLegacyPanel{position:relative;margin:0 0 14px;padding:14px;border-radius:28px;background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(3,8,20,.74));border:1px solid rgba(0,230,118,.16);box-shadow:0 18px 60px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.08);overflow:hidden}.fgMemberLegacyPanel::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 84% 0%,rgba(0,230,118,.10),transparent 42%),radial-gradient(circle at 8% 100%,rgba(0,212,255,.07),transparent 42%);pointer-events:none}.fgMemberLegacyHead{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:12px;text-align:right}.fgMemberLegacyHead h3{margin:0;font-size:clamp(19px,5vw,28px);font-weight:1000;line-height:1.15;background:linear-gradient(135deg,#fff 42%,#00E676);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.fgMemberLegacyHead p{margin:6px 0 0;color:#94a3b8;font-size:11px;font-weight:900;line-height:1.55}.fgMemberLegacyCount{flex-shrink:0;border-radius:999px;padding:7px 11px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.24);color:#a7f3d0;font-size:11px;font-weight:1000;white-space:nowrap}.fgMemberLegacyRow{position:relative;z-index:1;display:flex;gap:10px;overflow-x:auto;padding:4px 0 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.fgMemberLegacyRow::-webkit-scrollbar{display:none}.fgMemberLegacyCard{flex:0 0 auto;width:132px;height:250px;border:0;background:transparent;color:#edf0ff;padding:0;cursor:pointer;perspective:900px;font-family:inherit}.fgMemberLegacyCardInner{position:relative;width:100%;height:100%;transition:transform .55s cubic-bezier(.4,0,.2,1);transform-style:preserve-3d}.fgMemberLegacyCard.flipped .fgMemberLegacyCardInner{transform:rotateY(180deg)}.fgMemberLegacyFront,.fgMemberLegacyBack{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;overflow:hidden}.fgMemberLegacyBack{transform:rotateY(180deg)}.fgMemberLegacyFront{background:linear-gradient(145deg,var(--fg-card-a,#07122A),var(--fg-card-b,#0D1E42));border:1px solid var(--fg-card-border,rgba(0,230,118,.25));display:flex;flex-direction:column;align-items:center;padding:10px 9px 9px;position:relative;box-shadow:0 16px 34px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.08)}.fgMemberLegacyFront::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.06) 50%,transparent 80%);animation:fgLegacyShine 4.5s ease-in-out infinite;pointer-events:none}.fgMemberLegacyFront::after{content:"";position:absolute;right:10px;left:10px;bottom:8px;height:2px;border-radius:999px;background:linear-gradient(90deg,transparent,var(--fg-card-accent,#00E676),transparent);opacity:.70}@keyframes fgLegacyShine{0%,100%{transform:translateX(-100%) skewX(-15deg)}50%{transform:translateX(180%) skewX(-15deg)}}.fgMemberLegacyRank{font-size:11px;font-weight:1000;color:var(--fg-card-accent,#00E676);align-self:flex-start;background:rgba(2,6,23,.36);border:1px solid var(--fg-card-border,rgba(0,230,118,.25));border-radius:9px;padding:2px 7px;line-height:1.4}.fgMemberLegacyAvatarWrap{width:70px;height:70px;border-radius:50%;overflow:hidden;border:2px solid var(--fg-card-border,rgba(0,230,118,.35));margin:6px 0;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 4px rgba(255,255,255,.025)}.fgMemberLegacyAvatar{width:100%;height:100%;object-fit:cover}.fgMemberLegacyFallback{font-size:26px;font-weight:1000;color:var(--fg-card-accent,#00E676)}.fgMemberLegacyName{font-size:11px;font-weight:1000;color:#fff;text-align:center;margin-bottom:2px;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyTeam{font-size:8.5px;color:rgba(255,255,255,.55);text-align:center;margin-bottom:5px;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyDivider{height:1px;background:linear-gradient(90deg,transparent,var(--fg-card-border,rgba(0,230,118,.25)),transparent);width:90%;margin-bottom:5px}.fgMemberLegacyStats{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:100%}.fgMemberLegacyStat{display:flex;align-items:center;gap:2px;padding:2px 0;min-width:0}.fgMemberLegacyStat b{font-size:11px;font-weight:1000;color:#fff;min-width:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr}.fgMemberLegacyStat span{font-size:7.5px;font-weight:800;color:rgba(255,255,255,.58);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyBackBox{background:linear-gradient(145deg,#050810,#081224);border:1px solid var(--fg-card-border,rgba(0,230,118,.18));height:100%;border-radius:18px;padding:11px 9px;display:flex;flex-direction:column;gap:5px}.fgMemberLegacyBackTitle{font-size:10px;font-weight:900;color:var(--fg-card-accent,#00E676);text-align:center;letter-spacing:.4px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyBackStat{display:flex;align-items:center;gap:5px}.fgMemberLegacyBackLabel{font-size:9px;color:#9BA0C0;font-weight:800;width:34px;text-align:right}.fgMemberLegacyBackBar{flex:1;height:5px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden}.fgMemberLegacyBackFill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--fg-card-accent,#00E676),#00D4FF)}.fgMemberLegacyBackValue{font-size:10px;font-weight:1000;color:#EDF0FF;min-width:20px;text-align:left;direction:ltr}.fgMemberLegacyCard.tone0{--fg-card-a:#071f25;--fg-card-b:#0b1634;--fg-card-accent:#00E676;--fg-card-border:rgba(0,230,118,.36)}.fgMemberLegacyCard.tone1{--fg-card-a:#061c31;--fg-card-b:#10173a;--fg-card-accent:#00D4FF;--fg-card-border:rgba(0,212,255,.34)}.fgMemberLegacyCard.tone2{--fg-card-a:#130d2d;--fg-card-b:#08152e;--fg-card-accent:#A855F7;--fg-card-border:rgba(168,85,247,.34)}.fgMemberLegacyCard.tone3{--fg-card-a:#241b08;--fg-card-b:#08162b;--fg-card-accent:#FFD700;--fg-card-border:rgba(255,215,0,.34)}.fgMemberLegacyCard.tone4{--fg-card-a:#260b20;--fg-card-b:#08152e;--fg-card-accent:#F472B6;--fg-card-border:rgba(244,114,182,.34)}.fgMemberLegacyCard.tone5{--fg-card-a:#24100a;--fg-card-b:#071b25;--fg-card-accent:#FF6B35;--fg-card-border:rgba(255,107,53,.34)}.fgMemberLegacyPanel.historical .fgMemberLegacyCard{cursor:pointer}.fgMemberLegacyPanel.active .fgMemberLegacyCard{height:238px}.fgMemberLegacyPanel.active .fgMemberLegacyFront{background:linear-gradient(145deg,var(--fg-card-a,#07122A),rgba(2,6,23,.72) 78%)}@media(max-width:420px){.fgMemberLegacyPanel{padding:12px}.fgMemberLegacyCard{width:128px;height:242px}.fgMemberLegacyPanel.active .fgMemberLegacyCard{height:232px}.fgMemberLegacyAvatarWrap{width:66px;height:66px}.fgMemberLegacyHead{align-items:flex-start}.fgMemberLegacyCount{font-size:10px;padding:6px 9px}}.fgMemberLegacyPanel.active .fgMemberLegacyStats{grid-template-columns:1fr;gap:4px;margin-top:auto}.fgMemberLegacyPanel.active .fgMemberLegacyStat{justify-content:space-between;border-radius:8px;background:rgba(2,6,23,.20);padding:3px 5px}.fgMemberLegacyPanel.active .fgMemberLegacyStat b{font-size:10px;max-width:72px}.fgMemberLegacyPanel.active .fgMemberLegacyStat span{font-size:7.5px}.fgMemberLegacyPanel.grid .fgMemberLegacyRow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;overflow-x:visible;padding-bottom:4px}.fgMemberLegacyPanel.grid .fgMemberLegacyCard{width:100%;height:232px}.fgMemberLegacyPanel.grid .fgMemberLegacyAvatarWrap{width:62px;height:62px}@media(max-width:420px){.fgMemberLegacyPanel.grid .fgMemberLegacyRow{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.fgMemberLegacyPanel.grid .fgMemberLegacyCard{height:222px}.fgMemberLegacyPanel.grid .fgMemberLegacyName{font-size:10px}.fgMemberLegacyPanel.grid .fgMemberLegacyTeam{font-size:7.5px}.fgMemberLegacyPanel.grid .fgMemberLegacyAvatarWrap{width:56px;height:56px}}
.fgMemberLegacyTeam.national{font-size:7.8px;color:rgba(255,255,255,.45);margin-top:-3px;margin-bottom:5px}.fgMemberLegacyPanel.active .fgMemberLegacyStats{grid-template-columns:1fr;gap:5px;margin-top:auto}.fgMemberLegacyPanel.active .fgMemberLegacyStat{direction:rtl;justify-content:space-between;align-items:center;text-align:right;border-radius:8px;background:rgba(2,6,23,.20);padding:3px 5px}.fgMemberLegacyPanel.active .fgMemberLegacyStat span{font-size:7.8px;font-weight:900;color:rgba(255,255,255,.64);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyPanel.active .fgMemberLegacyStat b{font-size:9.5px;font-weight:1000;color:#fff;max-width:70px;text-align:left;direction:ltr;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fgMemberLegacyPanel.grid .fgMemberLegacyStat b{max-width:62px;font-size:8.8px}.fgMemberLegacyPanel.grid .fgMemberLegacyStat span{font-size:7.2px}`;

export default function HistoricalMembersStatsShowcase({ members = [], allTournaments = [], statsMap = {}, config = {} }) {
  const [flippedCard, setFlippedCard] = useState(null);
  const rows = useMemo(() => {
    const trophyCounts = new Map();
    (allTournaments || []).forEach((item) => {
      const id = cleanId(item.winnerId || item.memberId || "");
      if (!id || same(id, "FIFA")) return;
      trophyCounts.set(id, (trophyCounts.get(id) || 0) + 1);
    });
    return (members || [])
      .filter((member) => cleanId(member.id) && !isFifaSystemMember(member))
      .map((member) => {
        const id = cleanId(member.id);
        const stats = statsMap[id] || {};
        return {
          ...member,
          id,
          trophies: trophyCounts.get(id) || 0,
          finals: stats.finalsPlayed || 0,
          wins: stats.finalsWon || 0,
          goalsFor: stats.finalGoalsFor || 0,
          goalsAgainst: stats.finalGoalsAgainst || 0,
          losses: stats.finalsLost || 0,
        };
      })
      .sort((a, b) => (b.trophies - a.trophies) || (b.finals - a.finals) || String(a.name || a.id).localeCompare(String(b.name || b.id), "ar"));
  }, [members, allTournaments, statsMap]);

  if (!rows.length) return null;
  const maxValues = {
    trophies: Math.max(1, ...rows.map((row) => row.trophies || 0)),
    finals: Math.max(1, ...rows.map((row) => row.finals || 0)),
    wins: Math.max(1, ...rows.map((row) => row.wins || 0)),
    goalsFor: Math.max(1, ...rows.map((row) => row.goalsFor || 0)),
    goalsAgainst: Math.max(1, ...rows.map((row) => row.goalsAgainst || 0)),
    losses: Math.max(1, ...rows.map((row) => row.losses || 0)),
  };
  const barColor = (pct) => pct >= 80 ? "#00E676" : pct >= 55 ? "#00D4FF" : pct >= 30 ? "#A855F7" : "#64748b";

  return (
    <section className="fgMemberLegacyPanel historical">
      <style>{fifaMemberLegacyScrollerCss}</style>
      <style>{`.fgMemberLegacyDownloadIcon{position:absolute;top:9px;left:9px;z-index:4;width:26px;height:26px;border-radius:999px;border:1px solid rgba(168,85,247,.34);background:rgba(168,85,247,.12);color:#d8b4fe;-webkit-text-fill-color:#d8b4fe;font-size:15px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;line-height:1}.fgMemberLegacyDownloadIcon:active{background:rgba(168,85,247,.20)}`}</style>
      <div className="fgMemberLegacyHead">
        <div>
          <h3>الأعضاء التاريخيون</h3>
          <p>صف واحد قابل للسحب الجانبي، بنفس بطاقة الأرشيف الأصلية.</p>
        </div>
        <span className="fgMemberLegacyCount">{formatLatinNumber(rows.length)} عضو</span>
      </div>
      <div className="fgMemberLegacyRow">
        {rows.map((member, index) => {
          const memberName = member.name || member.memberName || member.id;
          const imgSrc = member.avatar || member.image || member.photo || "";
          const teamText = member.team || member.club || member.nationalteam || "FIFA GROUP";
          const cardId = member.id || index;
          const isFlipped = flippedCard === cardId;
          const frontStats = [
            ["ألقاب", member.trophies],
            ["نهائي", member.finals],
            ["فوز", member.wins],
            ["هدف", member.goalsFor],
            ["تلقى", member.goalsAgainst],
            ["خسر", member.losses],
          ];
          const backStats = [
            { label: "ألقاب", value: member.trophies, max: maxValues.trophies },
            { label: "نهائي", value: member.finals, max: maxValues.finals },
            { label: "فوز", value: member.wins, max: maxValues.wins },
            { label: "هدف", value: member.goalsFor, max: maxValues.goalsFor },
            { label: "تلقى", value: member.goalsAgainst, max: maxValues.goalsAgainst },
            { label: "خسر", value: member.losses, max: maxValues.losses },
          ];
          return (
            <article
              key={cardId}
              className={`fgMemberLegacyCard tone${index % 6} ${isFlipped ? "flipped" : ""}`}
              onClick={() => setFlippedCard(isFlipped ? null : cardId)}
            >
              <div className="fgMemberLegacyCardInner">
                <div className="fgMemberLegacyFront">
                  <button
                    type="button"
                    className="fgMemberLegacyDownloadIcon"
                    title="تحميل البطاقة التاريخية"
                    onClick={(event) => {
                      event.stopPropagation();
                      downloadHistoricalMemberCardImage({ member, members, allTournaments, statsMap, config });
                    }}
                  >⤓</button>
                  <div className="fgMemberLegacyRank">#{formatLatinNumber(index + 1)}</div>
                  <div className="fgMemberLegacyAvatarWrap">
                    {imgSrc ? <img className="fgMemberLegacyAvatar" src={imgSrc} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="fgMemberLegacyFallback">{String(memberName || "?").slice(0, 1)}</span>}
                  </div>
                  <div className="fgMemberLegacyName">{memberName}</div>
                  <div className="fgMemberLegacyTeam">{teamText}</div>
                  <div className="fgMemberLegacyDivider" />
                  <div className="fgMemberLegacyStats">
                    {frontStats.map(([label, value]) => (
                      <div className="fgMemberLegacyStat" key={label}>
                        <b>{formatLatinNumber(value || 0)}</b><span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fgMemberLegacyBack">
                  <div className="fgMemberLegacyBackBox">
                    <div className="fgMemberLegacyBackTitle">{memberName}</div>
                    {backStats.map((item) => {
                      const pct = item.max > 0 ? Math.round(((item.value || 0) / item.max) * 100) : 0;
                      return (
                        <div className="fgMemberLegacyBackStat" key={item.label}>
                          <span className="fgMemberLegacyBackLabel">{item.label}</span>
                          <div className="fgMemberLegacyBackBar"><i className="fgMemberLegacyBackFill" style={{ width: pct + "%", background: barColor(pct) }} /></div>
                          <b className="fgMemberLegacyBackValue">{formatLatinNumber(item.value || 0)}</b>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
