import React from 'react'

function SystemScreen({ title, subtitle, loading }) {
  return (
    <div className="systemScreen" dir="rtl">
      {/* CSS injected by App */}
      <div className="systemCard glass">
        {loading ? <div className="spinner" /> : null}
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default SystemScreen
