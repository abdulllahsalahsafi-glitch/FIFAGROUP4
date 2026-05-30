import React from 'react';
import { clean, competitionTypeKey, buildCompetitionStats } from '../../utils';
import StatCard from '../ui/StatCard';

export default function CompetitionStatsBox({ competition }) {
  if (competitionTypeKey(competition?.type || "") === "super_cup") return null;
  const stats = buildCompetitionStats(competition || {});
  const isLeague = clean(competition?.type || "league") === "league";
  return (
    <section className="sectionBox glassSoft competitionStatsBox">
      <div className="sectionHead compact"><div><h3>إحصائيات البطولة</h3></div></div>
      <div className="statsPanelGrid compactStats">
        <StatCard icon="🏆" value={stats.champion || "-"} label={isLeague ? "البطل الحالي" : "بطل البطولة"} />
        <StatCard icon="⚽" value={stats.totalGoals} label="إجمالي الأهداف" />
        <StatCard icon="🔥" value={stats.topScorer?.memberName || "-"} label={stats.topScorer ? `أكثر تسجيلًا (${stats.topScorer.goalsFor})` : "أكثر تسجيلًا"} />
        <StatCard icon="🛡️" value={stats.bestDefense?.memberName || "-"} label={stats.bestDefense ? `أفضل دفاع (${stats.bestDefense.goalsAgainst})` : "أفضل دفاع"} />
        <StatCard icon="🥅" value={stats.mostConceded?.memberName || "-"} label={stats.mostConceded ? `الأكثر استقبالًا (${stats.mostConceded.goalsAgainst})` : "الأكثر استقبالًا"} />
        <StatCard icon="✅" value={stats.mostWins?.memberName || "-"} label={stats.mostWins ? `الأكثر فوزًا (${stats.mostWins.wins})` : "الأكثر فوزًا"} />
      </div>
    </section>
  );
}
