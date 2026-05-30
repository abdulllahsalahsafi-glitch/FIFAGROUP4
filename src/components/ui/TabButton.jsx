import React from 'react';

export default function TabButton({ tab, id, label, setTab }) {
  return (
    <button
      className={tab === id ? "tabBtn active" : "tabBtn"}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
}
