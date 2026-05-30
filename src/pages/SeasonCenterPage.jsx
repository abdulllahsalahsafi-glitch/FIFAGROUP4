import React from 'react'
import { cleanId, same, clean, formatMoney } from '../utils/helpers'
import {
  getSeasonCenterCompetitionMatches,
  isSeasonCenterOpenMatch,
  getSeasonCenterRadarItems,
  isSeasonCenterActiveOffer,
  seasonCenterPhaseLabel,
  getSeasonCenterCompetitionStats,
} from '../utils/seasonCenter'
import { notificationTimeValue, isTransferMarketOpen } from '../utils/admin'
import { competitionTypeArabic, buildLinkedLeagueCupDisplayCompetition } from '../utils/competition'

function getMemberName(members, memberId) {
  const id = cleanId(memberId);
  const row = (members || []).find((member) => same(member.id || member.memberId, id));
  return row?.name || row?.memberName || memberId || "-";
}

const seasonCenterCss = `
.seasonCenterPage{direction:rtl;text-align:right}
.seasonCenterSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}
.seasonCenterStat{min-height:94px;border-radius:22px;padding:14px;background:linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.82));border:1px solid rgba(0,230,118,.14);display:grid;place-items:center;text-align:center}
.seasonCenterStat b{font-size:clamp(20px,5vw,32px);line-height:1;color:#00E676;font-weight:1000;direction:rtl;-webkit-text-fill-color:#00E676}
.seasonCenterStat span{font-size:11px;font-weight:800;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;margin-top:6px}
.seasonCenterStat.blue b{color:#00D4FF;-webkit-text-fill-color:#00D4FF}.seasonCenterStat.violet b{color:#A855F7;-webkit-text-fill-color:#A855F7}.seasonCenterStat.muted b{color:#9BA0C0;-webkit-text-fill-color:#9BA0C0}
.seasonCenterGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.seasonCenterWide{grid-column:1/-1}
.seasonCenterBox{border-radius:26px;padding:16px;min-width:0;overflow:hidden}
.seasonCenterBoxHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.seasonCenterBoxHead h3{margin:0;font-size:22px;font-weight:1000;line-height:1.2;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF}
.seasonCenterBoxHead p{margin:5px 0 0;font-size:12px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;line-height:1.45}
.seasonCenterBoxHead span{min-width:44px;height:34px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;padding:0 12px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.22);color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;font-size:12px;white-space:nowrap}
.seasonCenterBoxHead span.closed{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#9BA0C0;-webkit-text-fill-color:#9BA0C0}.seasonCenterBoxHead span.open{background:rgba(0,230,118,.12);border-color:rgba(0,230,118,.28)}
.seasonCenterList,.seasonCenterAlerts,.seasonCenterMiniRows,.seasonCenterTimeline{display:grid;gap:8px}
.seasonCenterMatch,.seasonCenterCompetition,.seasonCenterAlerts button,.seasonCenterAlerts div,.seasonCenterMarketState,.seasonCenterMiniRows div,.seasonCenterTimelineItem,.seasonCenterEmpty{width:100%;border-radius:18px;border:1px solid rgba(0,230,118,.12);background:rgba(2,6,23,.36);color:#EDF0FF;text-align:right;padding:12px;min-width:0}
.seasonCenterMatch,.seasonCenterCompetition,.seasonCenterAlerts button,button.seasonCenterTimelineItem{cursor:pointer}
.seasonCenterMatch small,.seasonCenterMatch span,.seasonCenterCompetition small,.seasonCenterMarketState small,.seasonCenterAlerts small{display:block;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-size:11px;font-weight:700;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seasonCenterMatch b{display:block;margin:5px 0;font-size:15px;line-height:1.45;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seasonCenterMatch em{font-style:normal;color:#00E676;-webkit-text-fill-color:#00E676;margin:0 6px}
.seasonCenterCompetition{display:flex;align-items:center;justify-content:space-between;gap:10px}.seasonCenterCompetition b,.seasonCenterMarketState b,.seasonCenterAlerts b,.seasonCenterMiniRows b{display:block;font-size:14px;line-height:1.35;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seasonCenterCompetition>span{min-width:44px;height:34px;border-radius:14px;display:grid;place-items:center;background:rgba(0,230,118,.10);color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;direction:ltr}
.seasonCenterMiniRows div{display:flex;align-items:center;justify-content:space-between;gap:10px}.seasonCenterMiniRows span{color:#00E676;-webkit-text-fill-color:#00E676;font-weight:1000;direction:ltr;white-space:nowrap}.seasonCenterEmpty{color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-weight:800;text-align:center}
.seasonCenterTimelineItem{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px}.seasonCenterTimelineItem i{font-style:normal;min-width:58px;height:30px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.22);color:#00E676;-webkit-text-fill-color:#00E676;font-size:11px;font-weight:1000}.seasonCenterTimelineItem b{display:block;font-size:14px;line-height:1.35;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seasonCenterTimelineItem small{display:block;margin-top:3px;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-size:11px;font-weight:700;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seasonCenterTimelineItem em{font-style:normal;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-size:11px;font-weight:800;direction:ltr;white-space:nowrap}
@media(max-width:720px){.seasonCenterSummary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.seasonCenterStat{min-height:82px;border-radius:18px;padding:10px}.seasonCenterGrid{grid-template-columns:1fr;gap:10px}.seasonCenterBox{border-radius:20px;padding:13px}.seasonCenterBoxHead h3{font-size:19px}.seasonCenterMatch b{font-size:14px}.seasonCenterTimelineItem{grid-template-columns:auto minmax(0,1fr);align-items:start}.seasonCenterTimelineItem em{grid-column:2}}
`;

function SeasonCenterPage({
  config,
  members = [],
  competitions = [],
  transferWindows = [],
  playerOffers = [],
  notifications = [],
  currentMember,
  currentMemberId = "",
  isFifaAdmin = false,
  onOpenCompetition,
}) {
  const memberId = cleanId(currentMemberId);
  const activeCompetitions = (competitions || [])
    .filter((competition) => {
      const status = clean(competition.status || "active");
      return !["completed", "cancelled", "deleted", "archived"].includes(status);
    })
    .map((competition) => buildLinkedLeagueCupDisplayCompetition(competition, competitions || []))
    .sort((a, b) => notificationTimeValue(b.createdAt || b.updatedAt || b.startDate) - notificationTimeValue(a.createdAt || a.updatedAt || a.startDate));

  const allMatches = activeCompetitions.flatMap((competition) => getSeasonCenterCompetitionMatches(competition));
  const openMatches = allMatches.filter((item) => isSeasonCenterOpenMatch(item.match));
  const myMatches = memberId
    ? openMatches.filter(({ match }) => same(match.homeMemberId, memberId) || same(match.awayMemberId, memberId))
    : [];

  const visibleMatches = (isFifaAdmin ? openMatches : myMatches).slice(0, 8);
  const visibleCompetitions = activeCompetitions.slice(0, 6);
  const activeOfferRows = (playerOffers || []).filter((offer) => {
    if (!isSeasonCenterActiveOffer(offer)) return false;
    if (isFifaAdmin) return true;
    return memberId && (same(offer.fromMemberId, memberId) || same(offer.toMemberId, memberId));
  });

  const marketOpen = isTransferMarketOpen(transferWindows || []);
  const openWindow = (transferWindows || []).find((item) => clean(item.status || "") === "open") || null;
  const waitingLinkedCups = activeCompetitions.filter((competition) =>
    clean(competition.competitionType || competition.type) === "cup" && clean(competition.cupMode || competition.cupScheduleMode || "").includes("linked")
  );

  const latestNotifications = (notifications || []).slice(0, 4);
  const radarItems = getSeasonCenterRadarItems({
    activeCompetitions,
    allCompetitions: competitions || [],
    openMatches,
    myMatches,
    activeOfferRows,
    marketOpen,
    openWindow,
    isFifaAdmin,
    latestNotifications,
  });
  const summaryCards = [
    { label: "بطولات نشطة", value: activeCompetitions.length, tone: "green" },
    { label: isFifaAdmin ? "مباريات غير مسجلة" : "مبارياتك القادمة", value: isFifaAdmin ? openMatches.length : myMatches.length, tone: "blue" },
    { label: isFifaAdmin ? "عروض منظورة" : "عروضك النشطة", value: activeOfferRows.length, tone: "violet" },
    { label: "سوق الانتقالات", value: marketOpen ? "مفتوح" : "مغلق", tone: marketOpen ? "green" : "muted" },
  ];

  return (
    <main className="widePage glass seasonCenterPage">
      <style>{seasonCenterCss}</style>
      <header className="pageHead">
        <h2>مركز الموسم</h2>
        <p>نظرة سريعة على البطولات النشطة، المباريات القادمة، سوق الانتقالات، والتنبيهات المهمة.</p>
      </header>

      <section className="seasonCenterSummary">
        {summaryCards.map((card) => (
          <div className={`seasonCenterStat ${card.tone}`} key={card.label}>
            <b>{card.value}</b>
            <span>{card.label}</span>
          </div>
        ))}
      </section>

      <section className="seasonCenterGrid">
        <div className="seasonCenterBox glassSoft">
          <div className="seasonCenterBoxHead">
            <div>
              <h3>{isFifaAdmin ? "المباريات غير المسجلة" : "مبارياتك القادمة"}</h3>
              <p>{isFifaAdmin ? "كل المواجهات التي تحتاج نتيجة في البطولات النشطة." : "مبارياتك التي لم تُسجل نتيجتها بعد."}</p>
            </div>
            <span>{visibleMatches.length}</span>
          </div>
          <div className="seasonCenterList">
            {visibleMatches.length ? visibleMatches.map(({ competition, match }, index) => (
              <button
                type="button"
                className="seasonCenterMatch"
                key={(competition.id || competition.name || "competition") + "-" + (match.id || index)}
                onClick={() => onOpenCompetition && onOpenCompetition(competition.id)}
              >
                <small>{competition.name || competition.title || "بطولة"} · {match.label || seasonCenterPhaseLabel(match.phase) || "مباراة"}</small>
                <b>{match.homeName || getMemberName(members, match.homeMemberId) || "بانتظار"} <em>ضد</em> {match.awayName || getMemberName(members, match.awayMemberId) || "بانتظار"}</b>
                <span>{match.gameTitle || match.game || match.gameCode || "—"}</span>
              </button>
            )) : (
              <div className="seasonCenterEmpty">لا توجد مباريات مطلوبة الآن.</div>
            )}
          </div>
        </div>

        <div className="seasonCenterBox glassSoft">
          <div className="seasonCenterBoxHead">
            <div>
              <h3>حالة البطولات</h3>
              <p>ملخص البطولات النشطة ونسبة اكتمال النتائج.</p>
            </div>
            <span>{visibleCompetitions.length}</span>
          </div>
          <div className="seasonCenterList">
            {visibleCompetitions.length ? visibleCompetitions.map((competition) => {
              const stats = getSeasonCenterCompetitionStats(competition, competitions);
              return (
                <button
                  type="button"
                  className="seasonCenterCompetition"
                  key={competition.id || competition.name}
                  onClick={() => onOpenCompetition && onOpenCompetition(competition.id)}
                >
                  <div>
                    <b>{competition.name || competition.title || "بطولة"}</b>
                    <small>{competitionTypeArabic(competition.competitionType || competition.type)} · {stats.completed}/{stats.total} {stats.unitLabel || "مكتملة"}</small>
                  </div>
                  <span>{stats.percent ?? (stats.total ? Math.round((stats.completed / stats.total) * 100) : 0)}%</span>
                </button>
              );
            }) : (
              <div className="seasonCenterEmpty">لا توجد بطولات نشطة حاليًا.</div>
            )}
          </div>
        </div>

        <div className="seasonCenterBox glassSoft">
          <div className="seasonCenterBoxHead">
            <div>
              <h3>سوق الانتقالات</h3>
              <p>{isFifaAdmin ? "ملخص إداري مختصر للعروض والسوق." : "عروضك أنت فقط مع حالة السوق، بدون كشف عروض الآخرين."}</p>
            </div>
            <span className={marketOpen ? "open" : "closed"}>{marketOpen ? "مفتوح" : "مغلق"}</span>
          </div>
          <div className="seasonCenterMarketState">
            <b>{marketOpen ? (openWindow?.title || openWindow?.name || "فترة انتقالات مفتوحة") : "لا توجد فترة انتقالات مفتوحة"}</b>
            <small>{marketOpen && openWindow?.endDate ? "حتى " + openWindow.endDate : "العروض والصفقات تظهر في صفحة الانتقالات."}</small>
          </div>
          {activeOfferRows.length ? (
            <div className="seasonCenterMiniRows">
              {activeOfferRows.slice(0, 3).map((offer) => (
                <div key={offer.id || offer.targetPlayerId || offer.playerId}>
                  <b>{offer.targetPlayerName || offer.playerName || "عرض انتقال"}</b>
                  <span>{formatMoney(offer.amount || 0)}</span>
                </div>
              ))}
            </div>
          ) : <div className="seasonCenterEmpty">{isFifaAdmin ? "لا توجد عروض نشطة الآن." : "لا توجد عروض نشطة تخصك الآن."}</div>}
        </div>

        <div className="seasonCenterBox glassSoft">
          <div className="seasonCenterBoxHead">
            <div>
              <h3>الرادار الذكي</h3>
              <p>تنبيهات قراءة فقط لما يحتاج انتباه داخل الموسم.</p>
            </div>
            <span>{radarItems.length}</span>
          </div>
          <div className="seasonCenterAlerts">
            {radarItems.length ? radarItems.map((item, index) => {
              const content = (
                <>
                  <b>{item.title}</b>
                  <small>{item.body}</small>
                </>
              );
              return item.competitionId ? (
                <button
                  type="button"
                  key={(item.competitionId || item.title) + "-" + index}
                  onClick={() => onOpenCompetition && onOpenCompetition(item.competitionId)}
                >
                  {content}
                </button>
              ) : (
                <div key={(item.title || "radar") + "-" + index}>{content}</div>
              );
            }) : <div className="seasonCenterEmpty">لا توجد تنبيهات مهمة حاليًا.</div>}
          </div>
        </div>

      </section>
    </main>
  );
}

export default SeasonCenterPage
