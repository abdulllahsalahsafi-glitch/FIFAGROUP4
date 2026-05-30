import React from 'react';
import { formatArchiveFinalText, getMemberName } from '../utils';
import BackButton from '../components/ui/BackButton';

export default function RecordDetailPage({ record, members, onBack }) {
  const finalText = formatArchiveFinalText(record, members);
  const notesText = record.notes && record.notes !== "-" ? record.notes : "";

  return (
    <main className="widePage glass">
      <BackButton onBack={onBack} />
      <section className="recordHero glassSoft">
        {record.image ? <img src={record.image} alt="" /> : null}
        <div>
          <h2>
            {record.name} — النسخة {record.edition}
          </h2>
          <p>
            {record.date} • {record.seasonId}
          </p>
        </div>
      </section>

      <section className="recordDetailCard glassSoft">
        <div className="recordDetailTop">
          <div>
            <span>النسخة</span>
            <b>{record.edition || "-"}</b>
          </div>
          <div>
            <span>البطل</span>
            <b>{getMemberName(members, record.winnerId)}</b>
          </div>
          <div>
            <span>التاريخ</span>
            <b>{record.date || "-"}</b>
          </div>
        </div>

        {finalText ? (
          <div className="recordFinalBox">
            <span>النهائي</span>
            <b>{finalText}</b>
          </div>
        ) : null}

        {notesText ? (
          <div className="recordNotesBox">
            <span>ملاحظات</span>
            <p>{notesText}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
