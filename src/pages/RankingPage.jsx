import React from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { formatMoney, cleanId, toNumber } from '../utils/helpers'

function RankingPage({ config, rows, onOpenView }) {
  let lastPoints = null;
  let lastTitles = null;
  let lastRank = 0;
  return (
    <main className="widePage glass rankingPage">
      <header className="pageHead">
        <h2>{stripIcon(config.rankingTitle)}</h2>
        <p>كل أعضاء الموسم يظهرون حتى بدون بطولة، والتعادل يعطي نفس المركز.</p>
      </header>
      <div className="rankingList rankingCompactList">
        {rows.map((row, index) => {
          const rank =
            row.points === lastPoints && row.titles === lastTitles
              ? lastRank
              : index + 1;
          lastPoints = row.points;
          lastTitles = row.titles;
          lastRank = rank;

          return (
            <button
              className={
                rank === 1
                  ? "rankingCard rankingCompactCard first clickable"
                  : "rankingCard rankingCompactCard clickable"
              }
              key={row.memberId}
              onClick={() =>
                onOpenView({
                  type: "rankingMemberWins",
                  member: row,
                  rows: row.rows,
                  title: `بطولات ${row.name} في الموسم`,
                })
              }
            >
              <span className="rankingRank">#{rank}</span>
              <img
                className="rankingAvatar"
                src={row.avatar || avatar(row.name)}
                alt=""
              />
              <div className="rankingIdentity">
                <b>{row.name}</b>
              </div>
              <div className="rankingSeasonLogos">
                {row.teamLogo ? <img src={row.teamLogo} alt="" /> : null}
                {row.nationalLogo ? (
                  <img src={row.nationalLogo} alt="" />
                ) : null}
              </div>
              <div className="rankingInlineStats">
                <span>{renderSmartIcon(config.rankingTitlesIcon)} {row.titles}</span>
                <span>{renderSmartIcon(config.rankingPointsIcon)} {row.points}</span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

export default RankingPage
