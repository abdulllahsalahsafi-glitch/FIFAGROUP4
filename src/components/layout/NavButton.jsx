import React from 'react';
import { renderSmartIcon } from '../../utils';

export default function NavButton({ page, menuOpen, id, icon, label, onClick }) {
  return (
    <button
      className={!menuOpen && page === id ? "navBtn active" : "navBtn"}
      onClick={onClick}
    >
      <span className="navIcon">{renderSmartIcon(icon)}</span>
      <span className="navLabel">{label}</span>
    </button>
  );
}
