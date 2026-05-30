import React from 'react';
import { formatArchiveFinalText, getMemberName } from '../../utils';

export default function RecordCard({ row, members, hideWinner, onClick }) {
  const finalText = formatArchiveFinalText(row, members);

  return (
    <button
      className={
        finalText
          ? "tournamentRecordCard hasFinal"
          : "tournamentRecordCard noFinal"
      }
      onClick={onClick}
    >
      <div className="recordCardMeta">
        <span>
          <small>النسخة</small>
          <b>{row.edition || "-"}</b>
        </span>
        {!hideWinner ? (
          <span>
            <small>البطل</small>
            <b>{getMemberName(members, row.winnerId)}</b>
          </span>
        ) : null}
        <span>
          <small>التاريخ</small>
          <b>{row.date || "-"}</b>
        </span>
      </div>

      {finalText ? (
        <div className="recordCardFinal">
          <small>النهائي</small>
          <strong>{finalText}</strong>
        </div>
      ) : (
        <div className="recordCardFinal muted">
          <small>تفاصيل</small>
          <strong>
            {row.notes && row.notes !== "-" ? row.notes : "لا يوجد نهائي مسجل"}
          </strong>
        </div>
      )}
    </button>
  );
}
