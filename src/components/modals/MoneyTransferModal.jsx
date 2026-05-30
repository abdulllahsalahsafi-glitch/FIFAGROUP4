import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { cleanId, same, formatMoney, getActiveMembers, avatar } from '../../utils';

function MoneyTransferModal({
  members,
  currentMemberId,
  currentBalance,
  defaultToMemberId,
  onClose,
  onSubmit,
}) {
  const [toMemberId, setToMemberId] = useState(defaultToMemberId || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const recipients = getActiveMembers(members).filter(
    (member) => cleanId(member.id) && !same(member.id, currentMemberId)
  );
  const selectedRecipient = recipients.find((member) => same(member.id, toMemberId));

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await onSubmit({ toMemberId, amount, note });
      setMessage("تم تنفيذ التحويل بنجاح.");
      window.setTimeout(onClose, 650);
    } catch (err) {
      setMessage(err?.message || "تعذر تنفيذ التحويل.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="moneyModalBackdrop" onClick={onClose}>
      <form
        className="moneyTransferModal glass"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>تحويل تلقائي</small>
            <h3>تحويل أموال</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>

        <div className="moneyBalanceBox glassSoft">
          <span>رصيدك المتاح</span>
          <b>{formatMoney(currentBalance)}</b>
        </div>

        <label className="moneyField">
          <span>العضو المستقبل</span>
          <select value={toMemberId} onChange={(event) => setToMemberId(event.target.value)}>
            <option value="">اختر عضوًا</option>
            {recipients.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </label>

        {selectedRecipient ? (
          <div className="moneyRecipientPreview glassSoft">
            <img src={selectedRecipient.avatar || avatar(selectedRecipient.name)} alt="" />
            <div>
              <b>{selectedRecipient.name}</b>
              <small>{selectedRecipient.team || "بدون فريق"}</small>
            </div>
          </div>
        ) : null}

        <label className="moneyField">
          <span>المبلغ</span>
          <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="مثال: 5000000" />
        </label>

        <label className="moneyField">
          <span>ملاحظة اختيارية</span>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="سبب التحويل" />
        </label>

        {message ? <p className="moneyModalMessage">{message}</p> : null}

        <button className="moneySubmitBtn" type="submit" disabled={busy}>
          {busy ? "جاري التنفيذ..." : "تنفيذ التحويل"}
        </button>
      </form>
    </div>,
    document.body
  );
}

export default MoneyTransferModal;
