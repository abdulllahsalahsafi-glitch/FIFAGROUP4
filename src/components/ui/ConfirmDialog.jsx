import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDialog({ title, body, confirmText, tone, busy, onCancel, onConfirm }) {
  return createPortal(
    <div className="fgConfirmBackdrop" onClick={onCancel}>
      <section className="fgConfirmBox glass" onClick={(event) => event.stopPropagation()} dir="rtl">
        <div className={tone === "danger" ? "fgConfirmIcon danger" : tone === "success" ? "fgConfirmIcon success" : "fgConfirmIcon"}>
          {tone === "danger" ? "!" : "✓"}
        </div>
        <h3>{title || "تأكيد العملية"}</h3>
        <p>{body || "هل تريد المتابعة؟"}</p>
        <div className="fgConfirmActions">
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>لا</button>
          <button type="button" className={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "جارٍ التنفيذ..." : confirmText || "نعم"}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
