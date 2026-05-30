import React from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar } from '../utils/ui'

export default function SeasonPage({
  config,
  activeSeason,
  groups,
  total,
  members,
  onOpenView,
}) {
  return (
    <main className="widePage glass seasonCardsPage">
      <header className="pageHead">
        <h2>{stripIcon(config.seasonTournamentsTitle)}</h2>
        <p>
          {activeSeason?.seasonName || config.seasonName}: {total} بطولة مسجلة
          تلقائيًا من الأرشيف.
        </p>
      </header>

      <div className="seasonSimpleList">
        {groups.map((item) => (
          <button
            key={item.trophyId}
            className="seasonSimpleRow glassSoft"
            onClick={() =>
              onOpenView({
                type: "seasonTrophy",
                title: `${item.name} — ${activeSeason?.seasonName || "الموسم"}`,
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
        ))}
      </div>
    </main>
  );
}
