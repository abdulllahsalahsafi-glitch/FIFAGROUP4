import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { clean, cleanId, toNumber, formatMoney, parseFinanceAmount, getPlayerStableId, normalizeExchangeContractType, normalizeExchangeLoanDuration } from '../../utils'
import { avatar } from '../../utils/ui'
import { OFFER_FEE } from '../../constants'

export default function PlayerOfferModal({
  targetMember,
  targetPlayer,
  existingOffer,
  currentMemberId,
  currentAvailableBalance,
  currentMemberPlayers,
  onClose,
  onSubmit,
}) {
  const isEditMode = Boolean(existingOffer?.id);
  const [contractType, setContractType] = useState(clean(existingOffer?.type) === "loan" ? "loan" : "buy");
  const [loanDurationMonths, setLoanDurationMonths] = useState(String(existingOffer?.loanDurationMonths || "2"));
  const [amount, setAmount] = useState(existingOffer?.amount ? String(existingOffer.amount) : "");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(Array.isArray(existingOffer?.offeredPlayers) ? existingOffer.offeredPlayers.map((player) => cleanId(player.playerId)) : []);
  const [exchangeTerms, setExchangeTerms] = useState(() => {
    const map = {};
    (Array.isArray(existingOffer?.offeredPlayers) ? existingOffer.offeredPlayers : []).forEach((player) => {
      const id = cleanId(player.playerId);
      if (!id) return;
      const exchangeContractType = normalizeExchangeContractType(player.exchangeContractType || player.swapContractType || player.contractMode);
      map[id] = {
        exchangeContractType,
        exchangeLoanDurationMonths: exchangeContractType === "loan" ? normalizeExchangeLoanDuration(player.exchangeLoanDurationMonths || player.loanDurationMonths) : 2,
      };
    });
    return map;
  });
  const [notes, setNotes] = useState(existingOffer?.notes || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const cleanAmount = Math.max(0, parseFinanceAmount(amount));
  const selectedPlayers = (currentMemberPlayers || []).filter((player) =>
    selectedPlayerIds.includes(getPlayerStableId(player))
  );
  const previousReservedAmount = isEditMode ? Math.max(0, toNumber(existingOffer?.reservedAmount ?? existingOffer?.amount)) : 0;
  const afterOfferBalance = currentAvailableBalance + previousReservedAmount - cleanAmount - OFFER_FEE;

  function togglePlayer(playerId) {
    setSelectedPlayerIds((ids) => {
      if (ids.includes(playerId)) {
        setExchangeTerms((terms) => {
          const next = { ...terms };
          delete next[playerId];
          return next;
        });
        return ids.filter((id) => id !== playerId);
      }
      setExchangeTerms((terms) => ({
        ...terms,
        [playerId]: terms[playerId] || { exchangeContractType: "owned", exchangeLoanDurationMonths: 2 },
      }));
      return [...ids, playerId];
    });
  }

  function updateExchangeTerm(playerId, patch) {
    setExchangeTerms((terms) => ({
      ...terms,
      [playerId]: {
        exchangeContractType: "owned",
        exchangeLoanDurationMonths: 2,
        ...(terms[playerId] || {}),
        ...patch,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    setBusy(true);
    const offerPayload = {
      contractType,
      targetMemberId: targetMember?.id,
      targetPlayerId: getPlayerStableId(targetPlayer),
      targetPlayerName: targetPlayer?.name || "",
      targetPlayerImage: targetPlayer?.image || "",
      targetPlayerPosition: targetPlayer?.position || "",
      targetPlayerRating: targetPlayer?.rating || "",
      amount: cleanAmount,
      offeredPlayers: selectedPlayers.map((player) => {
        const playerId = getPlayerStableId(player);
        const terms = exchangeTerms[playerId] || { exchangeContractType: "owned", exchangeLoanDurationMonths: 2 };
        const exchangeContractType = normalizeExchangeContractType(terms.exchangeContractType);
        const exchangeLoanDurationMonths = exchangeContractType === "loan" ? normalizeExchangeLoanDuration(terms.exchangeLoanDurationMonths) : null;
        return {
          playerId,
          playerName: player.name || "",
          playerImage: player.image || "",
          playerPosition: player.position || "",
          playerRating: player.rating || "",
          position: player.position || "",
          rating: player.rating || "",
          exchangeContractType,
          exchangeLoanDurationMonths,
          exchangeTypeLabel: exchangeContractType === "loan" ? "إعارة" : "بيع كامل",
        };
      }),
      loanDurationMonths: contractType === "loan" ? loanDurationMonths : null,
      notes,
    };

    try {
      if (isEditMode) {
        await onSubmit(existingOffer.id, offerPayload);
      } else {
        await onSubmit(offerPayload);
      }
      setMessage(isEditMode ? "تم تعديل العرض بنجاح." : "تم إرسال العرض بنجاح.");
      window.setTimeout(onClose, 800);
    } catch (err) {
      setMessage(err?.message || (isEditMode ? "تعذر تعديل العرض." : "تعذر إرسال العرض."));
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="offerModalBackdrop" onClick={onClose}>
      <form className="playerOfferModal glass" onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <small>سوق الانتقالات</small>
            <h3>{isEditMode ? "تعديل العرض" : "تقديم عرض"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>

        <section className="offerTargetPlayer glassSoft">
          <img src={targetPlayer?.image || avatar(targetPlayer?.name)} alt="" />
          <div>
            <b>{targetPlayer?.name || "لاعب"}</b>
            <small>{targetMember?.name || "عضو"} • {targetPlayer?.position || "-"}</small>
          </div>
          <strong>{targetPlayer?.rating || "-"}</strong>
        </section>

        <div className="offerBalanceRow glassSoft">
          <span>الرصيد المتاح للعروض</span>
          <b>{formatMoney(currentAvailableBalance)}</b>
        </div>

        <label className="offerField">
          <span>نوع العقد</span>
          <div className="offerSegmented">
            <button type="button" className={contractType === "buy" ? "active" : ""} onClick={() => setContractType("buy")}>عقد شراء</button>
            <button type="button" className={contractType === "loan" ? "active" : ""} onClick={() => setContractType("loan")}>عقد إعارة</button>
          </div>
        </label>

        {contractType === "loan" ? (
          <label className="offerField">
            <span>مدة عقد الإعارة</span>
            <select value={loanDurationMonths} onChange={(event) => setLoanDurationMonths(event.target.value)}>
              <option value="2">شهرين</option>
              <option value="4">4 شهور</option>
              <option value="6">6 شهور</option>
            </select>
          </label>
        ) : null}

        <label className="offerField">
          <span>مبلغ العرض (اختياري)</span>
          <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="مثال: 15000000" />
        </label>

        <section className="offerOwnPlayers">
          <div className="offerOwnPlayersHead">
            <span>لاعبون من قائمتك (اختياري)</span>
            <small>{selectedPlayers.length} محدد</small>
          </div>
          <div className="offerOwnPlayersGrid">
            {(currentMemberPlayers || []).length ? (
              currentMemberPlayers.map((player) => {
                const playerId = getPlayerStableId(player);
                const active = selectedPlayerIds.includes(playerId);
                return (
                  <button type="button" key={playerId} className={active ? "offerOwnPlayer active" : "offerOwnPlayer"} onClick={() => togglePlayer(playerId)}>
                    <img src={player.image || avatar(player.name)} alt="" />
                    <span>
                      <b>{player.name}</b>
                      <small>{player.position || "-"} • {player.rating || "-"}</small>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="empty">لا توجد قائمة لاعبين مرتبطة بحسابك.</div>
            )}
          </div>
          {selectedPlayers.length ? (
            <div className="offerExchangeTerms glassSoft">
              <b>تحديد عقد لاعبي التبادل</b>
              <small>اختر لكل لاعب هل ينتقل بيعًا كاملًا أو إعارة لمدة شهرين / 4 أشهر / 6 أشهر.</small>
              {selectedPlayers.map((player) => {
                const playerId = getPlayerStableId(player);
                const terms = exchangeTerms[playerId] || { exchangeContractType: "owned", exchangeLoanDurationMonths: 2 };
                const termType = normalizeExchangeContractType(terms.exchangeContractType);
                return (
                  <article className="offerExchangeTermRow" key={playerId}>
                    <div>
                      <b>{player.name || "لاعب"}</b>
                      <small>{player.position || "-"} • {player.rating || "-"}</small>
                    </div>
                    <div className="offerSegmented">
                      <button type="button" className={termType === "owned" ? "active" : ""} onClick={() => updateExchangeTerm(playerId, { exchangeContractType: "owned" })}>بيع كامل</button>
                      <button type="button" className={termType === "loan" ? "active" : ""} onClick={() => updateExchangeTerm(playerId, { exchangeContractType: "loan" })}>إعارة</button>
                    </div>
                    {termType === "loan" ? (
                      <div className="offerSegmented">
                        {[2, 4, 6].map((months) => (
                          <button
                            type="button"
                            key={months}
                            className={normalizeExchangeLoanDuration(terms.exchangeLoanDurationMonths) === months ? "active" : ""}
                            onClick={() => updateExchangeTerm(playerId, { exchangeLoanDurationMonths: months })}
                          >
                            {months} شهر
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <label className="offerField">
          <span>ملاحظات (اختياري)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="اكتب تفاصيل إضافية للعرض" />
        </label>

        <div className="offerSummary glassSoft">
          <span>{isEditMode ? "رسوم تعديل العرض غير مستردة" : "رسوم تقديم العرض غير مستردة"}</span>
          <b>{formatMoney(OFFER_FEE)}</b>
          <span>المتبقي بعد العرض والرسوم</span>
          <b className={afterOfferBalance < 0 ? "danger" : ""}>{formatMoney(afterOfferBalance)}</b>
        </div>

        {message ? <div className="moneyModalMessage">{message}</div> : null}

        <button type="submit" className="offerSubmitBtn" disabled={busy || !currentMemberId || afterOfferBalance < 0}>
          {busy ? "جارٍ الحفظ..." : isEditMode ? "حفظ التعديل" : "إرسال العرض"}
        </button>
      </form>
    </div>,
    document.body
  );
}
