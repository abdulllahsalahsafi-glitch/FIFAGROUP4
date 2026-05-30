import React from 'react';
import { getMemberName, getTrophyDisplayName, sortByDateAsc } from '../utils';
import BackButton from '../components/ui/BackButton';

export default function FinalsSubPage({ title, rows, members, onBack, onOpenView }) {
  const safeRows = Array.isArray(rows)
    ? rows.filter((item) => item && item.tournament)
    : [];
  const sorted = safeRows
    .slice()
    .sort((a, b) => sortByDateAsc(b.tournament, a.tournament));

  return (
    <main className="widePage glass finalsSubPage">
      <BackButton onBack={onBack} />
      <header className="pageHead">
        <h2>{title || "تفاصيل النهائيات"}</h2>
        <p>{sorted.length} نهائي مرتبة من الأحدث إلى الأقدم.</p>
      </header>

      <div className="finalsCardsList">
        {sorted.length ? (
          sorted.map((item, index) => {
            const row = item.tournament;
            const finalText =
              row.finalResult && row.finalResult !== "-"
                ? row.finalResult
                : row.notes && row.notes.includes("النهائي")
                ? String(row.notes).replace(/^النهائي\s*\/\s*/, "")
                : "";
            return (
              <button
                className={
                  item.result === "win" ? "finalsCard win" : "finalsCard loss"
                }
                key={row.id || index}
                onClick={() => onOpenView({ type: "record", record: row })}
              >
                <div className="finalsCardTop">
                  <span>{item.result === "win" ? "فوز" : "خسارة"}</span>
                  <b>
                    {row.trophyName ||
                      row.name ||
                      getTrophyDisplayName(row.trophyId) ||
                      row.trophyId}
                  </b>
                  <small>{row.date || "-"}</small>
                </div>

                <div className="finalsCardMeta">
                  <span>
                    <small>النسخة</small>
                    <b>{row.edition || "-"}</b>
                  </span>
                  <span>
                    <small>الخصم</small>
                    <b>{getMemberName(members, item.opponentId)}</b>
                  </span>
                  <span>
                    <small>الأهداف</small>
                    <b>
                      {item.goalsFor} - {item.goalsAgainst}
                    </b>
                  </span>
                </div>

                {finalText ? (
                  <strong className="finalsResultText">
                    النهائي: {finalText}
                  </strong>
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="empty">لا توجد نهائيات مسجلة لهذا الاختيار.</div>
        )}
      </div>
    </main>
  );
}
