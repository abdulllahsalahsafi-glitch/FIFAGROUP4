import React, { useState, useEffect, useMemo } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar } from '../utils/ui'
import { cleanId, same } from '../utils/helpers'
import { sortRecordsDesc, groupByTrophy } from '../utils/data'
import { downloadArchiveByTrophyImage, downloadArchiveBySeasonImage, downloadArchiveByMemberImage } from '../utils/canvas'

export default function ArchivePage({
  config,
  seasons,
  allTournaments,
  members,
  trophyMap,
  onOpenView,
  defaultMode = "trophy",
}) {
  const [archiveMode, setArchiveMode] = useState(defaultMode);
  useEffect(() => { setArchiveMode(defaultMode); }, [defaultMode]);

  const trophyRows = useMemo(() => {
    return groupByTrophy(allTournaments || [], trophyMap).sort(
      (a, b) =>
        b.count - a.count || String(a.name).localeCompare(String(b.name), "ar")
    );
  }, [allTournaments, trophyMap]);

  const memberRows = useMemo(() => {
    const map = {};
    (allTournaments || []).forEach((row) => {
      const memberId = cleanId(row.winnerId);
      if (!memberId) return;
      const member = (members || []).find((item) => same(item.id, memberId));
      if (!map[memberId]) {
        map[memberId] = {
          memberId,
          name: member?.name || memberId,
          avatar: member?.avatar || "",
          rows: [],
          trophyMap: {},
        };
      }
      map[memberId].rows.push(row);
      const trophyId = cleanId(row.trophyId);
      if (!map[memberId].trophyMap[trophyId]) {
        const trophy = trophyMap[trophyId] || {};
        map[memberId].trophyMap[trophyId] = {
          trophyId,
          name: trophy.name || row.trophyName || trophyId,
          image: trophy.image || "",
          count: 0,
        };
      }
      map[memberId].trophyMap[trophyId].count += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        total: item.rows.length,
        rows: sortRecordsDesc(item.rows),
        trophies: Object.values(item.trophyMap).sort(
          (a, b) =>
            b.count - a.count ||
            String(a.name).localeCompare(String(b.name), "ar")
        ),
      }))
      .sort(
        (a, b) =>
          b.total - a.total ||
          String(a.name).localeCompare(String(b.name), "ar")
      );
  }, [allTournaments, members, trophyMap]);

  const completedArchiveCount = allTournaments?.filter(t => t.winnerId && t.winnerId !== '-' && t.winnerId !== '').length || 0;

  return (
    <main className="widePage glass archiveHubPage">
      <header className="pageHead archiveHubHead">
        <h2>{stripIcon(config.archiveTitle)}</h2>
        <p>اختر طريقة العرض.</p>
        {completedArchiveCount ? (
          <span className="archiveTotalBadge" aria-label={`إجمالي البطولات ${completedArchiveCount}`}>
            <b>{completedArchiveCount}</b>
            <small>بطولة</small>
          </span>
        ) : null}
      </header>

      {/* ── أزرار التحميل ────────────────────────────── */}
      {/* ── تبويبات العرض ────────────────────────────── */}
      <nav className="archiveModeTabs glassSoft">
        <button
          className={archiveMode === "trophy" ? "active" : ""}
          onClick={() => setArchiveMode("trophy")}
        >{renderSmartIcon(config.archiveTrophyTabIcon)} حسب البطولة</button>
        <button
          className={archiveMode === "season" ? "active" : ""}
          onClick={() => setArchiveMode("season")}
        >{renderSmartIcon(config.archiveSeasonTabIcon)} حسب الموسم</button>
        <button
          className={archiveMode === "member" ? "active" : ""}
          onClick={() => setArchiveMode("member")}
        >{renderSmartIcon(config.archiveMemberTabIcon)} حسب العضو</button>
      </nav>

      {archiveMode === "trophy" ? (
        <>
          <div className="sectionHead archiveSectionHead" style={{marginBottom:'10px'}}>
            <div><h3>السجل حسب البطولة</h3></div>
            <button className="secDlBtn" title="تحميل حسب البطولة" onClick={() => downloadArchiveByTrophyImage({ allTournaments, trophyMap, members, config })}>⤓</button>
          </div>
          <section className="archiveTrophyTable">
          {trophyRows.map((group, index) => (
            <button
              key={group.trophyId}
              className="archiveTrophyRow glassSoft"
              onClick={() =>
                onOpenView({
                  type: "archiveTrophy",
                  title: `${group.name} — جميع المواسم`,
                  group,
                })
              }
            >
              <span className="archiveRowRank">#{index + 1}</span>
              <img src={group.image || avatar(group.name)} alt="" />
              <b>{group.name}</b>
              <em>{group.count}</em>
            </button>
          ))}
        </section>
        </>
      ) : null}

      {archiveMode === "season" ? (
        <>
          <div className="sectionHead archiveSectionHead" style={{marginBottom:'10px'}}>
            <div><h3>السجل حسب الموسم</h3></div>
            <button className="secDlBtn" title="تحميل حسب الموسم" onClick={() => downloadArchiveBySeasonImage({ seasons, allTournaments, trophyMap, members, config })}>⤓</button>
          </div>
          <section className="archiveSeasonGrid bigArchiveGrid">
          {seasons.map((season) => (
            <article
              key={season.seasonId}
              className="archiveSeasonCard glassSoft"
            >
              <em>{season.count}</em>
              <h3>{season.seasonName}</h3>
              <p>
                {season.startDate || "-"} — {season.endDate || "الآن"}
              </p>
              <small>الأعضاء: {season.membersCount || "-"}</small>
              <div className="seasonTrophyChips">
                {season.groups.map((group) => (
                  <button
                    key={group.trophyId}
                    onClick={() =>
                      onOpenView({
                        type: "archiveTrophy",
                        title: `${group.name} — ${season.seasonName}`,
                        group,
                      })
                    }
                  >
                    <img src={group.image || avatar(group.name)} alt="" />
                    <span>{group.count}</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
        </>
      ) : null}

      {archiveMode === "member" ? (
        <>
          <div className="sectionHead archiveSectionHead" style={{marginBottom:'10px'}}>
            <div><h3>السجل حسب الفائز</h3></div>
            <button className="secDlBtn" title="تحميل حسب الفائز" onClick={() => downloadArchiveByMemberImage({ allTournaments, members, trophyMap, config })}>⤓</button>
          </div>
          <section className="archiveMemberList">
          {memberRows.map((member, index) => (
            <button
              key={member.memberId}
              className="archiveMemberCard glassSoft"
              onClick={() =>
                onOpenView({
                  type: "archiveMemberWins",
                  title: `بطولات ${member.name} — كل المواسم`,
                  rows: member.rows,
                })
              }
            >
              <span className="archiveMemberRank">#{index + 1}</span>
              <img
                className="archiveMemberAvatar"
                src={member.avatar || avatar(member.name)}
                alt=""
              />
              <div className="archiveMemberInfo">
                <b>{member.name}</b>
                <div className="archiveMemberTrophies">
                  {member.trophies.map((trophy) => (
                    <span key={trophy.trophyId}>
                      <img src={trophy.image || avatar(trophy.name)} alt="" />
                      <strong>{trophy.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
              <em>{member.total}</em>
            </button>
          ))}
        </section>
        </>
      ) : null}
    </main>
  );
}
