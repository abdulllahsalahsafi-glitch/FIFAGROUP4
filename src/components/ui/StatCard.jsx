import React from 'react';
import { renderSmartIcon } from '../../utils';

export default function StatCard({ icon, value, label, onClick }) {
  const content = (
    <>
      <span className="statIcon">{renderSmartIcon(icon)}</span>
      <b>{value}</b>
      <small>{label}</small>
    </>
  );
  return onClick ? (
    <button className="statCard clickable glassSoft" onClick={onClick}>
      {content}
    </button>
  ) : (
    <article className="statCard glassSoft">{content}</article>
  );
}
