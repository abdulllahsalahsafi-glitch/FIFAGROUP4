import React from 'react';
export default function BackButton({ onBack }) {
  return (
    <button className="floatingBackBtn" onClick={onBack} aria-label="رجوع">
      <svg
        width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block' }}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
