import React from 'react'
import CompetitionViewerSection from '../components/competition/CompetitionViewerSection'

export default function LeagueViewerPage({ competitions = [], currentMemberId = "", focusedCompetitionId = "", config = {}, trophyMap = {} }) {
  return (
    <main className="pageShell leagueAdminShell">
      <CompetitionViewerSection competitions={competitions} currentMemberId={currentMemberId} focusedCompetitionId={focusedCompetitionId} config={config} trophyMap={trophyMap} standalone />
    </main>
  );
}
