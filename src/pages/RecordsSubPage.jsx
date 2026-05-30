import React from 'react';
import { sortRecordsDesc } from '../utils';
import BackButton from '../components/ui/BackButton';
import RecordCard from '../components/ui/RecordCard';

export default function RecordsSubPage({
  title,
  subtitle,
  rows,
  members,
  hideWinner,
  onBack,
  onOpenView,
}) {
  const sorted = sortRecordsDesc(rows || []);
  return (
    <main className="widePage glass">
      <BackButton onBack={onBack} />
      <header className="pageHead">
        <h2>{title}</h2>
        <p>{subtitle || `${sorted.length} نسخة مرتبة من الأحدث إلى الأقدم.`}</p>
      </header>
      <div className="listGrid tournamentRecordsList">
        {sorted.length ? (
          sorted.map((row, index) => (
            <RecordCard
              key={row.id || index}
              row={row}
              members={members}
              hideWinner={hideWinner}
              onClick={() => onOpenView({ type: "record", record: row })}
            />
          ))
        ) : (
          <div className="empty">لا توجد تفاصيل.</div>
        )}
      </div>
    </main>
  );
}
