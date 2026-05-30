import React, { useState, useMemo } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean } from '../utils/helpers'
import { sortRecordsDesc, groupMemberTrophies, getTrophyDisplayName, seasonNumber, groupByTrophy } from '../utils/data'
import { getMemberName } from '../utils/admin'

const museumCss = `
.museumPage{position:relative;overflow:hidden}.museumEmbedded{padding:0;overflow:visible}.museumHero{border-radius:28px;padding:18px;margin-bottom:14px;display:grid;gap:14px;background:linear-gradient(145deg,rgba(4,12,28,.86),rgba(8,24,48,.62));border:1px solid rgba(0,230,118,.18)}.museumHeroTop{display:flex;align-items:center;justify-content:space-between;gap:14px}.museumHeroText h3{margin:0;font-size:28px;font-weight:1000;background:linear-gradient(135deg,#fff 45%,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.museumHeroText p{margin:7px 0 0;color:#9BA0C0;font-weight:800;line-height:1.55}.museumSeal{width:74px;height:74px;border-radius:24px;display:grid;place-items:center;font-size:34px;background:linear-gradient(135deg,rgba(0,230,118,.20),rgba(0,212,255,.12));border:1px solid rgba(0,230,118,.28);box-shadow:0 16px 40px rgba(0,0,0,.30)}.museumQuickStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.museumQuickStats div{min-height:76px;border-radius:20px;padding:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);display:grid;align-content:center;text-align:center}.museumQuickStats b{font-size:25px;color:#ecfeff;direction:ltr}.museumQuickStats small{font-size:11px;color:#9BA0C0;font-weight:900}.museumTabs{display:flex;gap:8px;overflow-x:auto;margin:14px 0}.museumTabs button{height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#dbeafe;font-weight:1000;padding:0 13px;white-space:nowrap}.museumTabs button.active{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#020617;border-color:transparent}.museumGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}.museumCard{position:relative;min-height:132px;border-radius:24px;padding:14px;background:rgba(2,6,23,.38);border:1px solid rgba(255,255,255,.09);overflow:hidden;text-align:right}.museumCard::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.04),transparent 62%);pointer-events:none}.museumCardHead{position:relative;display:flex;align-items:center;gap:12px}.museumRank{width:42px;height:42px;border-radius:16px;display:grid;place-items:center;background:rgba(0,230,118,.11);border:1px solid rgba(0,230,118,.24);color:var(--cyan);font-weight:1000}.museumAvatar{width:58px;height:58px;border-radius:19px;object-fit:cover;background:white;flex:0 0 auto}.museumIconBox{width:58px;height:58px;border-radius:19px;object-fit:contain;display:grid;place-items:center;background:rgba(255,255,255,.08);font-size:28px;flex:0 0 auto}.museumCard h3{position:relative;margin:10px 0 5px;font-size:21px;line-height:1.25;color:#ecfeff}.museumCard p{position:relative;margin:0;color:#9BA0C0;font-weight:800;line-height:1.45}.museumBigValue{position:relative;margin-top:10px;display:flex;align-items:baseline;gap:6px}.museumBigValue b{font-size:36px;color:var(--cyan);direction:ltr}.museumBigValue small{color:#dbeafe;font-weight:900}.museumMiniRow{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);color:#cbd5e1;font-weight:900}.museumMiniRow span{color:#94a3b8}.museumWide{grid-column:1/-1}.museumRecords{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}.museumRecord{border-radius:20px;padding:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);min-height:92px}.museumRecord span{display:block;color:#9BA0C0;font-weight:900;font-size:12px}.museumRecord b{display:block;margin-top:7px;color:#ecfeff;font-size:19px;line-height:1.35}.museumRecord small{display:block;margin-top:5px;color:var(--cyan);font-weight:1000}.museumEmpty{padding:18px;border-radius:20px;background:rgba(255,255,255,.045);color:#9BA0C0;font-weight:900;text-align:center}.museumAction{position:relative;margin-top:10px;height:34px;border:0;border-radius:999px;background:linear-gradient(135deg,rgba(0,230,118,.94),rgba(0,212,255,.88));color:#020617;font-weight:1000;padding:0 13px}.museumSectionTitle{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0 10px}.museumSectionTitle h3{margin:0;font-size:22px;color:#ecfeff}.museumSectionTitle small{color:#9BA0C0;font-weight:900}
@media(max-width:720px){.museumHeroTop{align-items:flex-start}.museumSeal{width:58px;height:58px;border-radius:20px;font-size:28px}.museumHeroText h3{font-size:22px}.museumQuickStats{grid-template-columns:repeat(2,minmax(0,1fr))}.museumGrid{grid-template-columns:1fr}.museumCard{min-height:122px}.museumRecords{grid-template-columns:1fr}}
`;

function MuseumPage({ embedded = false, config = {}, members = [], allTournaments = [], trophyMap = {}, seasons = [], statsMap = {} }) {
  const [tab, setTab] = useState("legends");
  const rows = useMemo(() => (allTournaments || []).filter((item) => cleanId(item.winnerId) && !same(item.winnerId, "FIFA")), [allTournaments]);
  const memberById = useMemo(() => {
    const map = new Map();
    (members || []).forEach((member) => {
      const id = cleanId(member.id);
      if (id) map.set(id, member);
    });
    return map;
  }, [members]);
  const trophyGroups = useMemo(() => groupByTrophy(rows, trophyMap), [rows, trophyMap]);
  const memberTotals = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => {
      const id = cleanId(item.winnerId);
      if (!id) return;
      if (!map.has(id)) map.set(id, { memberId: id, count: 0, rows: [] });
      const entry = map.get(id);
      entry.count += 1;
      entry.rows.push(item);
    });
    return Array.from(map.values())
      .map((entry) => {
        const member = memberById.get(cleanId(entry.memberId)) || {};
        return {
          ...entry,
          rows: sortRecordsDesc(entry.rows || []),
          name: member.name || getMemberName(members, entry.memberId) || entry.memberId,
          avatar: member.avatar || member.image || "",
          team: member.team || member.club || member.nationalteam || "FIFA GROUP",
        };
      })
      .sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name), "ar"));
  }, [rows, memberById, members]);
  const trophyKings = useMemo(() => {
    return trophyGroups.map((group) => {
      const counter = new Map();
      (group.rows || []).forEach((item) => {
        const id = cleanId(item.winnerId);
        if (!id) return;
        counter.set(id, (counter.get(id) || 0) + 1);
      });
      const leaders = Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
      const [topId, topCount] = leaders[0] || ["", 0];
      const member = memberById.get(cleanId(topId)) || {};
      return {
        trophyId: group.trophyId,
        trophyName: group.name || getTrophyDisplayName(group.trophyId),
        trophyImage: group.image || trophyMap[cleanId(group.trophyId)]?.image || "",
        total: group.count || 0,
        kingId: topId,
        kingName: topId ? (member.name || getMemberName(members, topId) || topId) : "-",
        kingAvatar: member.avatar || member.image || "",
        kingCount: topCount || 0,
      };
    }).sort((a, b) => b.total - a.total || b.kingCount - a.kingCount);
  }, [trophyGroups, trophyMap, memberById, members]);
  const seasonLegends = useMemo(() => {
    return (seasons || []).map((season) => {
      const seasonId = cleanId(season.seasonId || season.seasonid || season.id);
      const seasonRows = rows.filter((item) => same(item.seasonId, seasonId));
      const counter = new Map();
      seasonRows.forEach((item) => {
        const id = cleanId(item.winnerId);
        if (!id) return;
        counter.set(id, (counter.get(id) || 0) + 1);
      });
      const [topId, topCount] = Array.from(counter.entries()).sort((a, b) => b[1] - a[1])[0] || ["", 0];
      const latest = sortRecordsDesc(seasonRows)[0];
      return {
        seasonId,
        seasonName: season.seasonName || season.seasonname || season.name || seasonId,
        count: seasonRows.length,
        topId,
        topName: topId ? getMemberName(members, topId) : "-",
        topCount: topCount || 0,
        latestChampion: latest ? getMemberName(members, latest.winnerId) : "-",
        latestTitle: latest?.name || "-",
      };
    }).filter((item) => item.seasonId || item.count).sort((a, b) => seasonNumber(b.seasonId) - seasonNumber(a.seasonId));
  }, [seasons, rows, members]);
  const finalRows = useMemo(() => {
    return Object.values(statsMap || {})
      .filter((stats) => cleanId(stats.memberId) && !same(stats.memberId, "FIFA"))
      .map((stats) => {
        const member = memberById.get(cleanId(stats.memberId)) || {};
        return {
          ...stats,
          name: member.name || getMemberName(members, stats.memberId) || stats.memberId,
          avatar: member.avatar || member.image || "",
        };
      });
  }, [statsMap, memberById, members]);
  const records = useMemo(() => {
    const latest = sortRecordsDesc(rows)[0];
    const mostRepeated = trophyKings[0];
    const mostActiveSeason = seasonLegends.slice().sort((a, b) => b.count - a.count)[0];
    const finalsPlayedLeader = finalRows.slice().sort((a, b) => b.finalsPlayed - a.finalsPlayed)[0];
    const finalsWonLeader = finalRows.slice().sort((a, b) => b.finalsWon - a.finalsWon)[0];
    const mostDecorated = memberTotals[0];
    return [
      { label: "إجمالي البطولات", value: rows.length, detail: "من السجل العام" },
      { label: "أكثر عضو تتويجًا", value: mostDecorated?.name || "-", detail: mostDecorated ? `${mostDecorated.count} بطولة` : "-" },
      { label: "أكثر بطولة تكررت", value: mostRepeated?.trophyName || "-", detail: mostRepeated ? `${mostRepeated.total} نسخة` : "-" },
      { label: "أكثر موسم ازدحامًا", value: mostActiveSeason?.seasonName || "-", detail: mostActiveSeason ? `${mostActiveSeason.count} بطولة` : "-" },
      { label: "آخر بطل تاريخي", value: latest ? getMemberName(members, latest.winnerId) : "-", detail: latest ? `${latest.name || "بطولة"} · ${latest.date || "بدون تاريخ"}` : "-" },
      { label: "أكثر من لعب نهائيات", value: finalsPlayedLeader?.name || "-", detail: finalsPlayedLeader ? `${finalsPlayedLeader.finalsPlayed} نهائي` : "-" },
      { label: "أكثر من فاز بنهائيات", value: finalsWonLeader?.name || "-", detail: finalsWonLeader ? `${finalsWonLeader.finalsWon} نهائي فائز` : "-" },
    ];
  }, [rows, trophyKings, seasonLegends, finalRows, memberTotals, members]);
  const totals = {
    trophies: rows.length,
    members: memberTotals.length,
    trophyTypes: trophyGroups.length,
    seasons: seasonLegends.filter((item) => item.count).length,
  };
  const tabs = [
    ["legends", "أساطير المتوجين"],
    ["kings", "ملوك البطولات"],
    ["seasons", "أبطال المواسم"],
    ["finals", "سجل النهائيات"],
    ["records", "الأرقام القياسية"],
  ];

  const MuseumShell = embedded ? "section" : "main";

  return (
    <MuseumShell className={embedded ? "museumPage museumEmbedded" : "widePage glass museumPage"} dir="rtl">
      <style>{museumCss}</style>
      {!embedded ? (
        <header className="pageHead">
          <h2>متحف FIFA GROUP</h2>
          <p>متحف تاريخي لإنجازات الأعضاء، ملوك البطولات، أبطال المواسم، والأرقام القياسية من السجل العام.</p>
        </header>
      ) : null}

      <section className="museumHero glassSoft">
        <div className="museumHeroTop">
          <div className="museumHeroText">
            <h3>تاريخ البطولات في مكان واحد</h3>
            <p>قراءة فقط من السجل العام، بدون أي تأثير على البطولات أو الانتقالات أو ملفات الأعضاء.</p>
          </div>
          <div className="museumSeal">🏛️</div>
        </div>
        <div className="museumQuickStats">
          <div><b>{totals.trophies}</b><small>بطولة تاريخية</small></div>
          <div><b>{totals.members}</b><small>عضو متوج</small></div>
          <div><b>{totals.trophyTypes}</b><small>نوع بطولة</small></div>
          <div><b>{totals.seasons}</b><small>موسم موثق</small></div>
        </div>
      </section>

      <div className="museumTabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "legends" ? (
        <section>
          <div className="museumSectionTitle"><h3>أساطير المتوجين</h3><small>الأكثر تحقيقًا للبطولات</small></div>
          <div className="museumGrid">
            {memberTotals.slice(0, 12).map((item, index) => (
              <article className="museumCard" key={item.memberId}>
                <div className="museumCardHead">
                  <div className="museumRank">#{index + 1}</div>
                  {item.avatar ? <img className="museumAvatar" src={item.avatar} alt="" /> : <div className="museumIconBox">👤</div>}
                  <div><h3>{item.name}</h3><p>{item.team || "FIFA GROUP"}</p></div>
                </div>
                <div className="museumBigValue"><b>{item.count}</b><small>بطولة</small></div>
                <div className="museumMiniRow"><span>آخر تتويج</span><b>{item.rows?.[0]?.name || "-"}</b></div>
              </article>
            ))}
            {!memberTotals.length ? <div className="museumEmpty museumWide">لا توجد بيانات تتويج كافية حتى الآن.</div> : null}
          </div>
        </section>
      ) : null}

      {tab === "kings" ? (
        <section>
          <div className="museumSectionTitle"><h3>ملوك البطولات</h3><small>أكثر عضو حقق كل بطولة</small></div>
          <div className="museumGrid">
            {trophyKings.map((item) => (
              <article className="museumCard" key={item.trophyId}>
                <div className="museumCardHead">
                  {item.trophyImage ? <img className="museumAvatar" src={item.trophyImage} alt="" style={{ objectFit: "contain", background: "rgba(255,255,255,.08)" }} /> : <div className="museumIconBox">🏆</div>}
                  <div><h3>{item.trophyName}</h3><p>إجمالي النسخ: {item.total}</p></div>
                </div>
                <div className="museumBigValue"><b>{item.kingCount}</b><small>تتويج</small></div>
                <div className="museumMiniRow"><span>ملك البطولة</span><b>{item.kingName}</b></div>
              </article>
            ))}
            {!trophyKings.length ? <div className="museumEmpty museumWide">لا توجد بطولات كافية لاحتساب الملوك.</div> : null}
          </div>
        </section>
      ) : null}

      {tab === "seasons" ? (
        <section>
          <div className="museumSectionTitle"><h3>أبطال المواسم</h3><small>ملخص كل موسم</small></div>
          <div className="museumGrid">
            {seasonLegends.map((item) => (
              <article className="museumCard" key={item.seasonId || item.seasonName}>
                <div className="museumCardHead">
                  <div className="museumIconBox">📅</div>
                  <div><h3>{item.seasonName}</h3><p>{item.count} بطولة موثقة</p></div>
                </div>
                <div className="museumMiniRow"><span>الأكثر تتويجًا</span><b>{item.topName}</b></div>
                <div className="museumMiniRow"><span>عدد تتويجاته</span><b>{item.topCount}</b></div>
                <div className="museumMiniRow"><span>آخر بطل</span><b>{item.latestChampion}</b></div>
              </article>
            ))}
            {!seasonLegends.length ? <div className="museumEmpty museumWide">لا توجد مواسم موثقة حتى الآن.</div> : null}
          </div>
        </section>
      ) : null}

      {tab === "finals" ? (
        <section>
          <div className="museumSectionTitle"><h3>سجل النهائيات</h3><small>الأكثر حضورًا وفوزًا في النهائيات</small></div>
          <div className="museumGrid">
            {[
              ["أكثر من لعب نهائيات", "finalsPlayed", "نهائي"],
              ["أكثر من فاز في النهائيات", "finalsWon", "نهائي فائز"],
              ["أكثر من خسر نهائيات", "finalsLost", "نهائي خاسر"],
              ["أكثر أهداف في النهائيات", "finalGoalsFor", "هدف"],
            ].map(([title, key, label]) => {
              const leaders = finalRows.slice().sort((a, b) => toNumber(b[key]) - toNumber(a[key])).slice(0, 5);
              return (
                <article className="museumCard museumWide" key={key}>
                  <div className="museumSectionTitle" style={{ marginTop: 0 }}><h3>{title}</h3><small>Top 5</small></div>
                  <div className="museumRecords">
                    {leaders.map((item, index) => (
                      <div className="museumRecord" key={`${key}-${item.memberId}`}>
                        <span>#{index + 1}</span>
                        <b>{item.name}</b>
                        <small>{toNumber(item[key])} {label}</small>
                      </div>
                    ))}
                    {!leaders.length ? <div className="museumEmpty">لا توجد بيانات نهائيات.</div> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "records" ? (
        <section>
          <div className="museumSectionTitle"><h3>الأرقام القياسية</h3><small>مختارات من تاريخ FIFA GROUP</small></div>
          <div className="museumRecords">
            {records.map((record) => (
              <div className="museumRecord" key={record.label}>
                <span>{record.label}</span>
                <b>{record.value}</b>
                <small>{record.detail}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </MuseumShell>
  );
}

export default MuseumPage
