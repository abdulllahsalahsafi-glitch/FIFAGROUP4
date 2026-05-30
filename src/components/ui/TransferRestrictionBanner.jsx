import React from 'react';
import { isTransferRestrictionActive, transferRestrictionShortText } from '../../utils';

export default function TransferRestrictionBanner({ rows = [] }) {
  const activeRows = (rows || []).filter(isTransferRestrictionActive);
  if (!activeRows.length) return null;
  return (
    <section className="transferRestrictionBanner glassSoft">
      <b>⛔ إيقاف من نظام الانتقالات</b>
      {activeRows.map((row) => (
        <p key={row.id || `${row.memberId}-${row.endDate}`}>{transferRestrictionShortText(row)} • من {row.startDate || "-"} حتى {row.endDate || "-"}{row.reason ? " • " + row.reason : ""}</p>
      ))}
    </section>
  );
}
