import React from 'react';
import { buildGoalsForMessage, buildGoalsAgainstMessage } from '../../utils';
import StatCard from '../ui/StatCard';


const svgDataIcon = (paths, color = "#00E676") =>
  "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
  );

const statFallbackIcons = {
  finalsPlayed: svgDataIcon('<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10"/><path d="M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10"/><path d="M12 12v4"/><path d="M8.5 20h7"/>', "#FACC15"),
  finalsWon: svgDataIcon('<path d="M20 6 9 17l-5-5"/><path d="M12 3v4"/><path d="M7 7h10"/><path d="M8 21h8"/>', "#00E676"),
  finalsLost: svgDataIcon('<path d="M8 8l8 8"/><path d="M16 8l-8 8"/><path d="M12 3v3"/><path d="M7 21h10"/>', "#F87171"),
  goalsFor: svgDataIcon('<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M4 12h16"/><path d="m15 9 3-3"/><path d="m18 6-1 4"/>', "#38BDF8"),
  goalsAgainst: svgDataIcon('<path d="M4 7h16v10H4z"/><path d="M8 7v10"/><path d="M16 7v10"/><path d="M12 11v2"/><path d="m9 4 6 16"/>', "#A855F7"),
  relegations: svgDataIcon('<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/><path d="M5 5h14"/>', "#F97316"),
};


const profileSectionHeaderCss = `
.fgProfileSectionPanel .fgProfileSectionHead{
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
.fgProfileSectionPanel .fgProfileSectionHead > div{
  min-width:0;
  flex:1 1 auto;
}
.fgProfileSectionPanel .fgProfileSectionHead h3{
  margin:0;
  font-size:clamp(22px,5.6vw,30px);
  line-height:1.25;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead p{
  margin:5px 0 0;
  font-size:12px;
  line-height:1.45;
  font-weight:800;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead input{
  flex:0 0 min(270px,42%);
  min-width:120px;
}
.fgProfileSectionCountBadge{
  min-width:42px;
  height:30px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 10px;
  margin-inline-start:8px;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.22);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-size:12px;
  font-weight:1000;
  vertical-align:middle;
}
@media(max-width:720px){
  .fgProfileSectionPanel .fgProfileSectionHead{
    display:grid;
    grid-template-columns:1fr;
    gap:10px;
    padding:11px 12px;
    border-radius:20px;
  }
  .fgProfileSectionPanel .fgProfileSectionHead input{
    width:100%;
    min-width:0;
    flex:auto;
  }
  .fgProfileSectionPanel .fgProfileSectionHead h3{
    font-size:clamp(21px,5.8vw,28px);
  }
}
`;


export default function MemberStatsSection({ config, stats, member, members, onOpenView, onInfo }) {
  return (
    <section className="sectionBox glassSoft fgProfileSectionPanel memberStatsPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="sectionHead compact fgProfileSectionHead">
        <div>
          <h3>إحصائيات {member.name}</h3>
          <p>اضغط على الكروت لفتح التفاصيل.</p>
        </div>
      </div>
      <div className="statsPanelGrid">
        <StatCard
          icon={config.finalsPlayedIcon || statFallbackIcons.finalsPlayed}
          value={stats.finalsPlayed}
          label="نهائيات خاضها"
          onClick={() =>
            onOpenView({
              type: "memberFinals",
              member,
              title: `نهائيات ${member.name}`,
              rows: stats.finals,
            })
          }
        />
        <StatCard
          icon={config.finalsWonIcon || statFallbackIcons.finalsWon}
          value={stats.finalsWon}
          label="نهائيات فاز بها"
          onClick={() =>
            onOpenView({
              type: "memberFinals",
              member,
              title: `نهائيات فاز بها ${member.name}`,
              rows: stats.finals.filter((row) => row.result === "win"),
            })
          }
        />
        <StatCard
          icon={config.finalsLostIcon || statFallbackIcons.finalsLost}
          value={stats.finalsLost}
          label="نهائيات خسرها"
          onClick={() =>
            onOpenView({
              type: "memberFinals",
              member,
              title: `نهائيات خسرها ${member.name}`,
              rows: stats.finals.filter((row) => row.result === "loss"),
            })
          }
        />
        <StatCard
          icon={config.goalsForIcon || statFallbackIcons.goalsFor}
          value={stats.finalGoalsFor}
          label="أهداف سجلها"
          onClick={() =>
            onInfo(buildGoalsForMessage(stats, members, member.name))
          }
        />
        <StatCard
          icon={config.goalsAgainstIcon || statFallbackIcons.goalsAgainst}
          value={stats.finalGoalsAgainst}
          label="أهداف تلقاها"
          onClick={() =>
            onInfo(buildGoalsAgainstMessage(stats, members, member.name))
          }
        />
        <StatCard icon={config.relegationsIcon || statFallbackIcons.relegations} value={stats.relegations} label="مرات الهبوط" />
      </div>
    </section>
  );
}
