import React from 'react';
import { competitionLogoUrl, competitionDefaultIcon } from '../../utils';

export default function CompetitionIcon({ competition = {}, config = {}, trophyMap = {}, className = "competitionIcon" }) {
  const logo = competitionLogoUrl(competition, config, trophyMap);
  if (logo) return <img className={className} src={logo} alt="" />;
  return <span className={className + " fallbackCompetitionIcon"}>{competitionDefaultIcon(competition.type)}</span>;
}
