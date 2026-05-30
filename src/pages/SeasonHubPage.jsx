import React, { useState, useEffect } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar } from '../utils/ui'
import { cleanId, toNumber, same } from '../utils/helpers'
import CompetitionViewerSection from '../components/competition/CompetitionViewerSection'
import ActiveSeasonMembersPanel from '../components/members/ActiveSeasonMembersPanel'

function SeasonHubPage({
  config,
  activeSeason,
  groups = [],
  total = 0,
  members = [],
  competitions = [],
  financeRows = [],
  trophyMap = {},
  currentMemberId = "",
  focusedCompetitionId = "",
  rankingRows = [],
  activeTab = "members",
  onTabChange,
  onOpenView,
  onOpenMember,
}) {
  const [fallbackTab, setFallbackTab] = useState(activeTab || "members");
  const tab = activeTab || fallbackTab;

  function changeTab(nextTab) {
    if (typeof onTabChange === "function") onTabChange(nextTab);
    else setFallbackTab(nextTab);
  }

  useEffect(() => {
    if (cleanId(focusedCompetitionId || "")) changeTab("competitions");
  }, [focusedCompetitionId]);

  const seasonTitle =
    activeSeason?.seasonName ||
    activeSeason?.name ||
    config.seasonName ||
    config.seasonTitle ||
    "الموسم";

  return (
    <main className="widePage glass seasonHubPage">
      <header className="pageHead seasonHubPageHead">
        <h2>{stripIcon(seasonTitle)}</h2>
        <p>الأعضاء النشطون، البطولات التنافسية، التصنيف وسجل البطولات.</p>
      </header>

      <nav className="archiveModeTabs glassSoft seasonHubTabs">
        <button className={tab === "members" ? "active" : ""} onClick={() => changeTab("members")}>
          الأعضاء النشطون
        </button>
        <button className={tab === "competitions" ? "active" : ""} onClick={() => changeTab("competitions")}>
          البطولات التنافسية
        </button>
        <button className={tab === "ranking" ? "active" : ""} onClick={() => changeTab("ranking")}>
          تصنيف الأعضاء
        </button>
        <button className={tab === "records" ? "active" : ""} onClick={() => changeTab("records")}>
          سجل البطولات
        </button>
      </nav>

      {tab === "members" ? (
        <ActiveSeasonMembersPanel
          members={(rankingRows || []).length ? rankingRows : members}
          financeRows={financeRows}
          config={config}
          totalForMember={(memberId) => {
            const row = (rankingRows || []).find((item) => same(item.memberId || item.id, memberId));
            return Number(row?.titles || row?.total || 0);
          }}
          onOpenMember={onOpenMember}
          title={`الأعضاء النشطون في ${stripIcon(seasonTitle)}`}
          subtitle="واجهة سريعة لعرض أعضاء الموسم الحالي وترتيبهم."
          compact
          grid
        />
      ) : null}

      {tab === "competitions" ? (
        <CompetitionViewerSection
          competitions={competitions}
          currentMemberId={currentMemberId}
          focusedCompetitionId={focusedCompetitionId}
          config={config}
          trophyMap={trophyMap}
        />
      ) : null}

      {tab === "records" ? (
        <section className="sectionBox glassSoft">
          <div className="sectionHead compact">
            <div>
              <h3>سجل البطولات</h3>
              <p>{total ? `${total} بطولة` : "لا توجد بطولات مسجلة لهذا الموسم."}</p>
            </div>
          </div>

          <div className="seasonSimpleList">
            {groups.length ? (
              groups
                .slice()
                .sort(
                  (a, b) =>
                    toNumber(b.count) - toNumber(a.count) ||
                    String(a.name || "").localeCompare(String(b.name || ""), "ar")
                )
                .map((item) => (
                  <button
                    key={item.trophyId}
                    className="seasonSimpleRow glassSoft"
                    onClick={() =>
                      onOpenView?.({
                        type: "seasonTrophy",
                        title: `${item.name} — ${seasonTitle}`,
                        group: item,
                      })
                    }
                  >
                    <img src={item.image || avatar(item.name)} alt="" />
                    <div>
                      <b>{item.name}</b>
                      <small>{item.count} نسخة</small>
                    </div>
                    <span>{renderSmartIcon(config.seasonCountIcon)} {item.count}</span>
                    <span>{renderSmartIcon(config.seasonPointsIcon)} {item.points || 0}</span>
                  </button>
                ))
            ) : (
              <div className="empty">لا توجد بطولات مسجلة لهذا الموسم.</div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "ranking" ? (
        <section className="sectionBox glassSoft rankingInlineBox">
          <div className="sectionHead compact">
            <div>
              <h3>تصنيف الأعضاء</h3>
            </div>
          </div>

          <div className="rankingList">
            {(rankingRows || []).length ? (
              rankingRows.map((row, index) => {
                const rank = index + 1;

                return (
                  <button
                    key={row.memberId || row.id || index}
                    className={rank === 1 ? "rankingCard rankingCompactCard first clickable" : "rankingCard rankingCompactCard clickable"}
                    onClick={() =>
                      row.memberId
                        ? onOpenView?.({
                            type: "rankingMemberWins",
                            member: row,
                            rows: row.rows || [],
                            pointEvents: row.pointEvents || [],
                            title: `بطولات ${row.name || row.memberName || row.memberId} في الموسم`,
                          })
                        : null
                    }
                  >
                    <span className="rankingRank">#{rank}</span>
                    <img className="rankingAvatar" src={row.avatar || avatar(row.name || row.memberName)} alt="" />
                    <div className="rankingIdentity">
                      <b>{row.name || row.memberName || row.memberId}</b>
                    </div>
                    <div className="rankingSeasonLogos">
                      {row.teamLogo ? <img src={row.teamLogo} alt="" /> : null}
                      {row.nationalLogo ? <img src={row.nationalLogo} alt="" /> : null}
                    </div>
                    <div className="rankingInlineStats">
                      <span>{renderSmartIcon(config.rankingTitlesIcon)} {row.titles}</span>
                      <span>{renderSmartIcon(config.rankingPointsIcon)} {row.points}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="empty">لا يوجد تصنيف متاح لهذا الموسم.</div>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default SeasonHubPage
