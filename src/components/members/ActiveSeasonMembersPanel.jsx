import React from 'react';
import { toNumber, cleanId, formatMoney, computeMemberBalance, getMemberFinanceRows, isFifaSystemMember } from '../../utils';
import { formatLatinNumber } from '../../utils/ui';
import { downloadActiveSeasonMemberCardImage } from '../../utils/canvas';

function MemberStatIcon({ type }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.35,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'fgMemberLegacyStatIcon',
    'aria-hidden': 'true',
  };

  if (type === 'money') {
    return React.createElement('svg', common,
      React.createElement('path', { d: 'M7 8.5c0-1.4 2.2-2.5 5-2.5s5 1.1 5 2.5-2.2 2.5-5 2.5-5-1.1-5-2.5Z' }),
      React.createElement('path', { d: 'M7 8.5v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3' }),
      React.createElement('path', { d: 'M7 11.5v3c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3' })
    );
  }

  if (type === 'points') {
    return React.createElement('svg', common,
      React.createElement('path', { d: 'M5 18h14' }),
      React.createElement('path', { d: 'M7 15l3-4 3 2 4-6' }),
      React.createElement('path', { d: 'M17 7h-4' }),
      React.createElement('path', { d: 'M17 7v4' })
    );
  }

  return React.createElement('svg', common,
    React.createElement('path', { d: 'M8 4h8v4a4 4 0 0 1-8 0V4Z' }),
    React.createElement('path', { d: 'M7 6H5.5a1.5 1.5 0 0 0-.6 2.9L8 10' }),
    React.createElement('path', { d: 'M17 6h1.5a1.5 1.5 0 0 1 .6 2.9L16 10' }),
    React.createElement('path', { d: 'M12 12v4' }),
    React.createElement('path', { d: 'M8.5 20h7' }),
    React.createElement('path', { d: 'M10 16h4' })
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

const fifaMemberLegacyScrollerCss = `
.fgMemberLegacyPanel{
  position:relative;
  margin:0 0 14px;
  padding:14px;
  border-radius:28px;
  background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(3,8,20,.74));
  border:1px solid rgba(0,230,118,.16);
  box-shadow:0 18px 60px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.08);
  overflow:hidden;
}
.fgMemberLegacyPanel::before{
  content:"";
  position:absolute;
  inset:0;
  background:radial-gradient(circle at 84% 0%,rgba(0,230,118,.10),transparent 42%),radial-gradient(circle at 8% 100%,rgba(0,212,255,.07),transparent 42%);
  pointer-events:none;
}
.fgMemberLegacyHead{
  position:relative;
  z-index:1;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:10px;
  margin-bottom:12px;
  text-align:right;
}
.fgMemberLegacyHead h3{
  margin:0;
  font-size:clamp(19px,5vw,28px);
  font-weight:1000;
  line-height:1.32;
  padding-top:3px;
  padding-bottom:2px;
  background:linear-gradient(135deg,#fff 42%,#00E676);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
  overflow:visible;
}
.fgMemberLegacyHead p{
  margin:6px 0 0;
  color:#94a3b8;
  font-size:11px;
  font-weight:900;
  line-height:1.55;
}
.fgMemberLegacyCount{
  flex-shrink:0;
  border-radius:999px;
  padding:7px 11px;
  background:rgba(0,230,118,.10);
  border:1px solid rgba(0,230,118,.24);
  color:#a7f3d0;
  -webkit-text-fill-color:#a7f3d0;
  font-size:11px;
  font-weight:1000;
  white-space:nowrap;
}
.fgMemberLegacyRow{
  position:relative;
  z-index:1;
  display:flex;
  gap:10px;
  overflow-x:auto;
  padding:4px 0 12px;
  scrollbar-width:none;
  -webkit-overflow-scrolling:touch;
}
.fgMemberLegacyRow::-webkit-scrollbar{
  display:none;
}
.fgMemberLegacyCard{
  flex:0 0 auto;
  width:132px;
  height:254px;
  border:0;
  background:transparent;
  color:#edf0ff;
  padding:0;
  cursor:pointer;
  perspective:900px;
  font-family:inherit;
}
.fgMemberLegacyCardInner{
  position:relative;
  width:100%;
  height:100%;
}
.fgMemberLegacyFront{
  position:absolute;
  inset:0;
  border-radius:18px;
  overflow:hidden;
  background:linear-gradient(145deg,var(--fg-card-a,#07122A),var(--fg-card-b,#0D1E42));
  border:1px solid var(--fg-card-border,rgba(0,230,118,.25));
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:10px 9px 9px;
  box-shadow:0 16px 34px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.08);
}
.fgMemberLegacyFront::before{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.06) 50%,transparent 80%);
  animation:fgLegacyShine 4.5s ease-in-out infinite;
  pointer-events:none;
}
.fgMemberLegacyFront::after{
  content:"";
  position:absolute;
  right:10px;
  left:10px;
  bottom:8px;
  height:2px;
  border-radius:999px;
  background:linear-gradient(90deg,transparent,var(--fg-card-accent,#00E676),transparent);
  opacity:.70;
}
@keyframes fgLegacyShine{
  0%,100%{transform:translateX(-100%) skewX(-15deg)}
  50%{transform:translateX(180%) skewX(-15deg)}
}
.fgMemberLegacyDownloadIcon{
  position:absolute;
  top:9px;
  left:9px;
  z-index:4;
  width:26px;
  height:26px;
  border-radius:999px;
  border:1px solid rgba(0,230,118,.34);
  background:rgba(0,230,118,.12);
  color:#a7f3d0;
  -webkit-text-fill-color:#a7f3d0;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  line-height:1;
}
.fgMemberLegacyDownloadIcon svg{
  width:15px;
  height:15px;
  stroke:currentColor;
  stroke-width:2.35;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.fgMemberLegacyDownloadIcon:active{
  background:rgba(0,230,118,.22);
}
.fgMemberLegacyRank{
  font-size:11px;
  font-weight:1000;
  color:var(--fg-card-accent,#00E676);
  -webkit-text-fill-color:var(--fg-card-accent,#00E676);
  align-self:flex-start;
  background:rgba(2,6,23,.36);
  border:1px solid var(--fg-card-border,rgba(0,230,118,.25));
  border-radius:9px;
  padding:2px 7px;
  line-height:1.4;
}
.fgMemberLegacyAvatarWrap{
  width:66px;
  height:66px;
  border-radius:50%;
  overflow:hidden;
  border:2px solid var(--fg-card-border,rgba(0,230,118,.35));
  margin:6px 0;
  background:rgba(255,255,255,.06);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  box-shadow:0 0 0 4px rgba(255,255,255,.025);
}
.fgMemberLegacyAvatar{
  width:100%;
  height:100%;
  object-fit:cover;
}
.fgMemberLegacyFallback{
  font-size:26px;
  font-weight:1000;
  color:var(--fg-card-accent,#00E676);
  -webkit-text-fill-color:var(--fg-card-accent,#00E676);
}
.fgMemberLegacyName{
  font-size:11px;
  font-weight:1000;
  color:#fff;
  -webkit-text-fill-color:#fff;
  text-align:center;
  margin-bottom:2px;
  width:100%;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.fgMemberLegacyTeam{
  font-size:8.5px;
  color:rgba(255,255,255,.55);
  -webkit-text-fill-color:rgba(255,255,255,.55);
  text-align:center;
  margin-bottom:5px;
  width:100%;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.fgMemberLegacyTeam.national{
  font-size:7.8px;
  color:rgba(255,255,255,.45);
  -webkit-text-fill-color:rgba(255,255,255,.45);
  margin-top:-3px;
  margin-bottom:5px;
}
.fgMemberLegacyDivider{
  height:1px;
  background:linear-gradient(90deg,transparent,var(--fg-card-border,rgba(0,230,118,.25)),transparent);
  width:90%;
  margin-bottom:5px;
}
.fgMemberLegacyStats{
  display:grid;
  grid-template-columns:1fr;
  gap:4px;
  width:100%;
  margin-top:auto;
}
.fgMemberLegacyStat{
  direction:rtl;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:4px;
  border-radius:8px;
  background:rgba(2,6,23,.20);
  padding:3px 5px;
  min-width:0;
}
.fgMemberLegacyStat span{
  min-width:0;
  display:inline-flex;
  align-items:center;
  gap:4px;
  font-size:7.6px;
  font-weight:900;
  color:rgba(255,255,255,.64);
  -webkit-text-fill-color:rgba(255,255,255,.64);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.fgMemberLegacyStat b{
  font-size:9.5px;
  font-weight:1000;
  color:#fff;
  -webkit-text-fill-color:#fff;
  max-width:70px;
  text-align:left;
  direction:ltr;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.fgMemberLegacyStatIcon{
  display:block;
  stroke:currentColor;
  flex:0 0 auto;
  color:var(--fg-card-accent,#00E676);
}
.fgMemberLegacyCard.tone0{--fg-card-a:#071f25;--fg-card-b:#0b1634;--fg-card-accent:#00E676;--fg-card-border:rgba(0,230,118,.36)}
.fgMemberLegacyCard.tone1{--fg-card-a:#061c31;--fg-card-b:#10173a;--fg-card-accent:#00D4FF;--fg-card-border:rgba(0,212,255,.34)}
.fgMemberLegacyCard.tone2{--fg-card-a:#130d2d;--fg-card-b:#08152e;--fg-card-accent:#A855F7;--fg-card-border:rgba(168,85,247,.34)}
.fgMemberLegacyCard.tone3{--fg-card-a:#241b08;--fg-card-b:#08162b;--fg-card-accent:#FFD700;--fg-card-border:rgba(255,215,0,.34)}
.fgMemberLegacyCard.tone4{--fg-card-a:#260b20;--fg-card-b:#08152e;--fg-card-accent:#F472B6;--fg-card-border:rgba(244,114,182,.34)}
.fgMemberLegacyCard.tone5{--fg-card-a:#24100a;--fg-card-b:#071b25;--fg-card-accent:#FF6B35;--fg-card-border:rgba(255,107,53,.34)}
.fgMemberLegacyPanel.grid .fgMemberLegacyRow{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:10px;
  overflow-x:visible;
  padding-bottom:4px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyCard{
  width:100%;
  height:238px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyAvatarWrap{
  width:56px;
  height:56px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyName{
  font-size:10px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyTeam{
  font-size:7.5px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyStat b{
  max-width:62px;
  font-size:8.8px;
}
.fgMemberLegacyPanel.grid .fgMemberLegacyStat span{
  font-size:7.2px;
}
@media(max-width:420px){
  .fgMemberLegacyPanel{padding:12px}
  .fgMemberLegacyCard{width:128px;height:248px}
  .fgMemberLegacyAvatarWrap{width:64px;height:64px}
  .fgMemberLegacyHead{align-items:flex-start}
  .fgMemberLegacyCount{font-size:10px;padding:6px 9px}
  .fgMemberLegacyPanel.grid .fgMemberLegacyRow{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .fgMemberLegacyPanel.grid .fgMemberLegacyCard{height:230px}
}
`;

export default function ActiveSeasonMembersPanel({
  members = [],
  financeRows = [],
  config = {},
  totalForMember,
  onOpenMember,
  title = "الأعضاء النشطون في الموسم السادس",
  subtitle = "اضغط على أي عضو لفتح بروفايله العام.",
  compact = false,
  grid = false,
}) {
  const rows = (members || [])
    .filter((member) => cleanId(member.id || member.memberId || "") && !isFifaSystemMember(member))
    .map((member, index) => {
      const memberId = cleanId(member.id || member.memberId || "");
      const titles = Number.isFinite(Number(member.titles))
        ? Number(member.titles)
        : Number.isFinite(Number(member.total))
          ? Number(member.total)
          : typeof totalForMember === "function"
            ? totalForMember(memberId)
            : 0;
      const points = Number.isFinite(Number(member.points)) ? Number(member.points) : 0;
      return {
        ...member,
        id: memberId,
        titles: Math.max(0, Number(titles) || 0),
        points: Math.max(0, Number(points) || 0),
        rankOrder: Number(member.rankOrder || member.rank || index + 1) || index + 1,
      };
    })
    .sort((a, b) =>
      (toNumber(b.points) - toNumber(a.points)) ||
      (toNumber(b.titles) - toNumber(a.titles)) ||
      String(a.name || a.memberName || a.id).localeCompare(String(b.name || b.memberName || b.id), "ar")
    );

  if (!rows.length) return null;

  return (
    <section className={`fgMemberLegacyPanel active ${compact ? "compact" : ""} ${grid ? "grid" : ""}`}>
      <style>{fifaMemberLegacyScrollerCss}</style>
      <div className="fgMemberLegacyHead">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="fgMemberLegacyCount">{formatLatinNumber(rows.length)} عضو</span>
      </div>

      <div className="fgMemberLegacyRow">
        {rows.map((member, index) => {
          const memberName = member.name || member.memberName || member.id;
          const imgSrc = member.avatar || member.image || member.photo || "";
          const teamText = member.team || member.club || "FIFA GROUP";
          const nationalText = member.nationalteam || member.nationalTeam || member.national || "-";
          const memberFinanceRows = Array.isArray(financeRows) && financeRows.length ? getMemberFinanceRows(financeRows, member.id) : [];
          const balance = memberFinanceRows.length ? computeMemberBalance(memberFinanceRows, member.balance, member.id) : toNumber(member._balance || member.balance || 0);
          const trophies = toNumber(member.titles || 0);
          const points = toNumber(member.points || 0);

          const frontStats = [
            ["trophy", "بطولات الموسم", formatLatinNumber(trophies)],
            ["points", "نقاط الموسم", formatLatinNumber(points)],
            ["money", "الرصيد", formatMoney(balance)],
          ];

          return (
            <article
              key={member.id || index}
              role="button"
              tabIndex={0}
              className={`fgMemberLegacyCard tone${index % 6}`}
              onClick={() => typeof onOpenMember === "function" ? onOpenMember(member.id) : null}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && typeof onOpenMember === "function") {
                  event.preventDefault();
                  onOpenMember(member.id);
                }
              }}
              aria-label={`فتح بروفايل ${memberName}`}
            >
              <div className="fgMemberLegacyCardInner">
                <div className="fgMemberLegacyFront">
                  <span
                    role="button"
                    tabIndex={0}
                    className="fgMemberLegacyDownloadIcon"
                    title="تحميل بطاقة العضو النشط"
                    aria-label={`تحميل بطاقة ${memberName} النشط`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      downloadActiveSeasonMemberCardImage({
                        member,
                        rankedMembers: rows,
                        financeRows,
                        balance,
                        seasonRank: index + 1,
                        seasonTitles: trophies,
                        seasonPoints: points,
                        config,
                      });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        downloadActiveSeasonMemberCardImage({
                          member,
                          rankedMembers: rows,
                          financeRows,
                          balance,
                          seasonRank: index + 1,
                          seasonTitles: trophies,
                          seasonPoints: points,
                          config,
                        });
                      }
                    }}
                  >
                    <DownloadIcon />
                  </span>

                  <div className="fgMemberLegacyRank">#{formatLatinNumber(index + 1)}</div>
                  <div className="fgMemberLegacyAvatarWrap">
                    {imgSrc ? (
                      <img
                        className="fgMemberLegacyAvatar"
                        src={imgSrc}
                        alt=""
                        onError={(event) => { event.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <span className="fgMemberLegacyFallback">{String(memberName || "?").slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="fgMemberLegacyName">{memberName}</div>
                  <div className="fgMemberLegacyTeam">{teamText}</div>
                  <div className="fgMemberLegacyTeam national">{nationalText}</div>
                  <div className="fgMemberLegacyDivider" />

                  <div className="fgMemberLegacyStats">
                    {frontStats.map(([type, label, value]) => (
                      <div className="fgMemberLegacyStat" key={label}>
                        <span><MemberStatIcon type={type} />{label}</span>
                        <b>{value}</b>
                      </div>
                    ))}
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
