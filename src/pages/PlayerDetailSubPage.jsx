import React, { useState } from 'react'
import { clean, cleanId, same, toNumber, formatMoney } from '../utils/helpers'
import { avatar } from '../utils/ui'
import { MIN_SQUAD_PLAYERS } from '../constants'
import { getPlayerStableId, isFreeAgentPoolContract, isFreeAgentPlayer, isFreeOriginContract, getFreeAgentSlotOwnerIdFromContract, hasFreeAgentRegistrationRecord, hasEverUsedFreeAgentSlot, getRosterPlayerKindFromContract, isBlockingOwnPlayerOfferStillValid, isAcceptedOrCompletedPlayerOffer, isOfferExpired, isActivePlayerOfferStatus, notificationTimeValue, getPlayerRosterKindLabel, playerOfferStatusMessage, exchangeContractLabel, getMemberName, isPlayerReleasedByContracts, normalizeOfferAsTransferContractRow, formatTransferDate, dateValue, loanDurationLabel, isLoanTransferRow } from '../utils'
import { FALLBACK_PLAYER_IMAGE } from '../constants'
import TransferContractModal from '../components/transfers/TransferContractModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function PlayerDetailSubPage({
  player,
  ownerMember,
  currentMemberId,
  currentMember,
  playerOffers,
  playerContracts = [],
  freeAgentRegistrations = [],
  freePlayerStatus = [],
  freeAgentQueue = [],
  ownerPlayerCount = 0,
  canMakeOffer,
  isMarketOpen,
  members = [],
  onBack,
  onOffer,
  onCancelOffer,
  onAcceptOffer,
  onRejectOffer,
  onReleasePlayer,
  onTerminateLoan,
  onRegisterFreeAgentFee,
  logoUrl = "",
}) {
  const playerId = getPlayerStableId(player);
  const activeContract = (playerContracts || []).find((contract) => same(contract.playerId, playerId) && clean(contract.status || "active") === "active");
  const activeContractType = clean(activeContract?.contractType || "");
  const playerReleased = activeContractType === "released" || Boolean(activeContract?.permanentlyRemoved);
  const playerHasActiveContract = Boolean(activeContract && !isFreeAgentPoolContract(activeContract));
  const playerBlocksNewOffer = Boolean(activeContract && activeContractType === "released");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [busyAction, setBusyAction] = useState(false);
  const [instantContract, setInstantContract] = useState(null);

  const existingOffer = (playerOffers || []).find((offer) =>
    same(offer.fromMemberId, currentMemberId) &&
    same(offer.targetPlayerId, playerId) &&
    isBlockingOwnPlayerOfferStillValid(offer)
  );
  const existingOfferStatus = clean(existingOffer?.status || "");
  const acceptedDeal = (playerOffers || []).find((offer) =>
    same(offer.targetPlayerId, playerId) && isAcceptedOrCompletedPlayerOffer(offer)
  );
  const acceptedDealStatus = clean(acceptedDeal?.status || "") === "approvedpendingwindow" && (acceptedDeal?.completedAt || acceptedDeal?.marketWasOpenAtApproval || acceptedDeal?.executedAt || acceptedDeal?.loanStartDate || acceptedDeal?.marketExecutionCompletedAt) ? "completed" : clean(acceptedDeal?.status || "");
  const canCancelOffer = existingOffer && existingOfferStatus === "pending" && !acceptedDeal;
  const canEdit = canCancelOffer && toNumber(existingOffer.editCount) < toNumber(existingOffer.maxEdits || 1);
  const isAvailableFreeAgentContract = isFreeAgentPoolContract(activeContract);
  const isLooseFreeAgent = Boolean((isFreeAgentPlayer(player) && !activeContract && !cleanId(player.memberid)) || isAvailableFreeAgentContract);
  const displayOwnerId = activeContract && activeContractType !== "released" && !isAvailableFreeAgentContract
    ? cleanId(activeContract.currentMemberId)
    : (isLooseFreeAgent ? "" : cleanId(ownerMember?.id));
  const effectiveOwnerId = displayOwnerId;
  const realOwnerIdForDisplay = activeContract && activeContractType === "loan"
    ? cleanId(activeContract.originalOwnerMemberId || activeContract.ownerMemberId)
    : displayOwnerId;
  const realOwnerNameForDisplay = isLooseFreeAgent
    ? "لا يوجد"
    : activeContract && activeContractType === "loan"
    ? (activeContract.originalOwnerMemberName || activeContract.ownerMemberName || getMemberName(members, realOwnerIdForDisplay))
    : activeContract
    ? (activeContract.currentMemberName || getMemberName(members, displayOwnerId))
    : (ownerMember?.name || "-");
  const ownerIntroText = isLooseFreeAgent ? "لاعب حر متاح" : "لاعب في قائمة " + (activeContract?.currentMemberName || ownerMember?.name || "العضو");
  const isOwner = Boolean(currentMemberId && effectiveOwnerId && same(currentMemberId, effectiveOwnerId));
  const playerRosterKindForOwner = getRosterPlayerKindFromContract(player, activeContract, effectiveOwnerId);
  const canReleasePlayer = Boolean(
    isOwner &&
      isMarketOpen &&
      !playerReleased &&
      !acceptedDeal &&
      playerRosterKindForOwner !== "free" &&
      (!activeContract || activeContractType === "owned") &&
      toNumber(ownerPlayerCount) > MIN_SQUAD_PLAYERS
  );
  const canTerminateLoan = Boolean(
    activeContract &&
      activeContractType === "loan" &&
      isMarketOpen &&
      (same(activeContract.currentMemberId, currentMemberId) || same(activeContract.originalOwnerMemberId || activeContract.ownerMemberId, currentMemberId))
  );
  const canManagePlayer = Boolean(isOwner || canTerminateLoan);
  const freeAgentFeeRegistered = hasFreeAgentRegistrationRecord(freeAgentRegistrations, playerId, currentMemberId);
  const memberFreeContract = (playerContracts || []).find((contract) =>
    same(contract.currentMemberId, currentMemberId) &&
    isFreeOriginContract(contract) &&
    same(getFreeAgentSlotOwnerIdFromContract(contract, contract.originalOwnerMemberId || contract.ownerMemberId || currentMemberId), currentMemberId) &&
    clean(contract.status || "active") === "active" &&
    clean(contract.contractType || "owned") === "owned"
  );
  const memberFreeStatus = (freePlayerStatus || []).find((item) => same(item.memberId || item.id, currentMemberId));
  const hasPendingFreeAgentRequest = (freeAgentQueue || []).some((item) =>
    same(item.memberId, currentMemberId) && ["pending_window", "processing"].includes(clean(item.status || "pending_window"))
  );
  const freeAgentActionIsReplacement = Boolean(memberFreeContract && !same(memberFreeContract.playerId, playerId));
  const freeAgentSlotEverUsed = hasEverUsedFreeAgentSlot(freeAgentRegistrations, memberFreeStatus, memberFreeContract, currentMemberId);
  const freeAgentSlotLost = Boolean(freeAgentSlotEverUsed && !memberFreeContract);
  const freeAgentAlreadyCurrent = Boolean(memberFreeContract && same(memberFreeContract.playerId, playerId));
  const freeAgentIsAvailableForRegistration = Boolean(isLooseFreeAgent);
  const canRegisterFreeAgentFee = Boolean(
    currentMemberId &&
      freeAgentIsAvailableForRegistration &&
      !freeAgentFeeRegistered &&
      !playerReleased &&
      !freeAgentAlreadyCurrent &&
      !freeAgentSlotLost &&
      !hasPendingFreeAgentRequest
  );
  const receivedOffers = (playerOffers || [])
    .filter((offer) =>
      same(offer.toMemberId, currentMemberId) &&
      same(offer.targetPlayerId, playerId) &&
      clean(offer.status || "pending") === "pending" &&
      !isOfferExpired(offer)
    )
    .sort((a, b) => notificationTimeValue(b.createdAt) - notificationTimeValue(a.createdAt));

  function askConfirm(options) {
    setActionMessage("");
    setConfirmDialog(options);
  }

  async function runConfirmedAction() {
    if (!confirmDialog?.onConfirm || busyAction) return;
    setBusyAction(true);
    setActionMessage("");
    try {
      const result = await confirmDialog.onConfirm();
      setActionMessage(confirmDialog.successMessage || "تم تنفيذ العملية بنجاح.");
      setConfirmDialog(null);
      if (result?.instantContract) {
        setInstantContract(result.instantContract);
      }
    } catch (err) {
      setActionMessage(err?.message || "تعذر تنفيذ العملية.");
    } finally {
      setBusyAction(false);
    }
  }

  function confirmCancelOffer(offer) {
    askConfirm({
      title: "إلغاء العرض؟",
      body: "سيتم تحرير المبلغ المحجوز، لكن رسوم التقديم لا ترجع.",
      confirmText: "نعم، إلغاء العرض",
      tone: "danger",
      successMessage: "تم إلغاء العرض.",
      onConfirm: async () => onCancelOffer?.(offer),
    });
  }

  function confirmAcceptOffer(offer) {
    askConfirm({
      title: "قبول العرض؟",
      body: isMarketOpen
        ? "سيتم قبول العرض وتسجيل الصفقة فورًا."
        : "سيتم قبول العرض ووضع الصفقة بانتظار فتح سوق الانتقالات.",
      confirmText: "قبول العرض",
      tone: "success",
      successMessage: "تم قبول العرض.",
      onConfirm: async () => onAcceptOffer?.(offer.id),
    });
  }

  function confirmRejectOffer(offer) {
    askConfirm({
      title: "رفض العرض؟",
      body: "سيتم رفض العرض وإبلاغ العضو مقدم العرض.",
      confirmText: "رفض العرض",
      tone: "danger",
      successMessage: "تم رفض العرض.",
      onConfirm: async () => onRejectOffer?.(offer.id),
    });
  }

  function confirmReleasePlayer() {
    askConfirm({
      title: "استغناء عن اللاعب؟",
      body: "سيتم إنهاء عقد اللاعب مع قائمتك ونقله إلى قائمة اللاعبين الأحرار ليصبح متاحًا للتسجيل خلال سوق الانتقالات.",
      confirmText: "تأكيد الاستغناء",
      tone: "danger",
      successMessage: "تم تسجيل الاستغناء.",
      onConfirm: async () => onReleasePlayer?.(player),
    });
  }

  function confirmTerminateLoan() {
    const isOriginalOwner = same(activeContract?.originalOwnerMemberId || activeContract?.ownerMemberId, currentMemberId);
    askConfirm({
      title: "فسخ عقد الإعارة؟",
      body: isOriginalOwner
        ? "سيعود اللاعب لقائمتك، ويسترد المستعير مبلغ الإعارة مع تعويض 10,000,000."
        : "سيعود اللاعب لمالكه الأصلي، وستدفع تعويض 10,000,000 وتخسر مبلغ الإعارة.",
      confirmText: "تأكيد الفسخ",
      tone: "danger",
      successMessage: "تم فسخ عقد الإعارة.",
      onConfirm: async () => onTerminateLoan?.(activeContract),
    });
  }

  function confirmRegisterFreeAgentFee() {
    askConfirm({
      title: freeAgentActionIsReplacement ? "تبديل اللاعب الحر؟" : "تسجيل اللاعب الحر؟",
      body: freeAgentActionIsReplacement
        ? (isMarketOpen ? "سيتم خصم 5,000,000 وتنفيذ تبديل اللاعب الحر فورًا." : "سيتم حفظ طلب التبديل وخصم 5,000,000 عند فتح سوق الانتقالات إذا توفر الرصيد.")
        : (isMarketOpen ? "سيتم تسجيل هذا اللاعب كلاعب حر فورًا وبدون رسوم." : "سيتم حفظ طلب تسجيل هذا اللاعب الحر وتنفيذه عند فتح سوق الانتقالات بدون رسوم."),
      confirmText: freeAgentActionIsReplacement ? "تأكيد التبديل" : "تأكيد التسجيل",
      tone: "success",
      successMessage: freeAgentActionIsReplacement ? (isMarketOpen ? "تم تبديل اللاعب الحر وخصم الرسوم." : "تم حفظ طلب تبديل اللاعب الحر.") : (isMarketOpen ? "تم تسجيل اللاعب الحر بدون رسوم." : "تم حفظ طلب تسجيل اللاعب الحر."),
      onConfirm: async () => onRegisterFreeAgentFee?.(player),
    });
  }

  return (
    <section className="playerDetailSubPage glassSoft">
      <button className="backToMembersBtn" type="button" onClick={onBack}>← قائمة اللاعبين</button>

      <div className="playerDetailHero">
        <div className="playerDetailImageBox">
          <img src={player.image || avatar(player.name)} alt={player.name || ""} />
        </div>
        <div className="playerDetailInfo">
          <small>{ownerIntroText}</small>
          <h2>{player.name || "لاعب"}</h2>
          <div className="playerDetailChips">
            <span>{player.position || "مركز غير محدد"}</span>
            <span>{getPlayerRosterKindLabel(player, playerContracts, effectiveOwnerId || currentMemberId)}</span>
            {player.team ? <span>{player.team}</span> : null}
          </div>
        </div>
        <strong className="playerDetailRating">{player.rating || "-"}</strong>
      </div>

      <div className="playerDetailStatsGrid">
        <div><small>المركز</small><b>{player.position || "-"}</b></div>
        <div><small>حالة اللاعب</small><b>{getPlayerRosterKindLabel(player, playerContracts, effectiveOwnerId || currentMemberId)}</b></div>
        <div><small>التقييم</small><b>{player.rating || "-"}</b></div>
        <div><small>{activeContractType === "loan" ? "المالك الحقيقي" : "المالك"}</small><b>{realOwnerNameForDisplay}</b></div>
      </div>

      {playerReleased ? (
        <section className="playerDealStatus glassSoft danger">
          <b>تم الاستغناء عن اللاعب</b>
          <p>تم إنهاء عقد هذا اللاعب وخروجه من اللعبة نهائيًا.</p>
          <small>لا يمكن تقديم عروض شراء أو إعارة على هذا اللاعب ولا يمكن إعادته لأي قائمة.</small>
        </section>
      ) : null}

      {acceptedDeal ? (
        <section className="playerDealStatus glassSoft">
          <b>{acceptedDealStatus === "completed" ? "صفقة مكتملة" : "صفقة مقبولة بانتظار فتح السوق"}</b>
          <p>
            تم قبول عرض من {acceptedDeal.fromMemberName || getMemberName(members, acceptedDeal.fromMemberId)}
            {toNumber(acceptedDeal.amount) ? " بقيمة " + formatMoney(acceptedDeal.amount) : " بدون مبلغ مالي"}.
          </p>
          <small>هذا اللاعب غير متاح لعروض جديدة حتى يتم إلغاء الصفقة أو تحديث حالتها من الإدارة.</small>
        </section>
      ) : null}

      {playerBlocksNewOffer && !acceptedDeal ? (
        <section className="playerDealStatus glassSoft">
          <b>{activeContract.contractType === "loan" ? "عقد إعارة نشط" : "عقد ملكية نشط"}</b>
          <p>
            اللاعب حاليًا في قائمة {getMemberName(members, activeContract.currentMemberId)}
            {activeContract.contractType === "loan" && activeContract.loanDurationMonths ? " بعقد إعارة لمدة " + activeContract.loanDurationMonths + " شهور" : ""}.
          </p>
          <small>العقد النشط يحدد نوع العروض المتاحة لهذا اللاعب.</small>
        </section>
      ) : null}

      {canMakeOffer && !playerReleased && !acceptedDeal && !playerBlocksNewOffer ? (
        <div className="playerDetailActions">
          {!existingOffer ? (
            <button type="button" className="playerDetailPrimaryBtn" onClick={() => onOffer?.(player, null)}>
              التقدم بعرض
            </button>
          ) : canCancelOffer ? (
            <>
              {canEdit ? (
                <button type="button" className="playerDetailPrimaryBtn edit" onClick={() => onOffer?.(player, existingOffer)}>
                  تعديل العرض
                </button>
              ) : null}
              <button type="button" className="playerDetailPrimaryBtn cancel" onClick={() => confirmCancelOffer(existingOffer)}>
                إلغاء العرض
              </button>
            </>
          ) : (
            <div className="playerDetailNotice">{playerOfferStatusMessage(existingOfferStatus)}</div>
          )}
        </div>
      ) : null}

      {(isOwner || canTerminateLoan || canRegisterFreeAgentFee) ? (
        <section className="playerOwnerTools glassSoft">
          <div className="playerOwnerToolsHead">
            <div>
              <b>إدارة اللاعب</b>
              <small>{isMarketOpen ? "سوق الانتقالات مفتوح الآن" : "التنفيذ النهائي ينتظر فتح السوق"}</small>
            </div>
            {isOwner ? (
              canReleasePlayer ? (
                <button type="button" className="playerReleaseBtn" onClick={confirmReleasePlayer}>استغناء عن اللاعب</button>
              ) : playerRosterKindForOwner !== "free" ? (
                <span className="playerOwnerLockedNote">
                  {playerReleased
                    ? "تم الاستغناء عن هذا اللاعب"
                    : !isMarketOpen
                    ? "الاستغناء متاح فقط خلال فترة الانتقالات"
                    : toNumber(ownerPlayerCount) <= MIN_SQUAD_PLAYERS
                    ? "لا يمكن الاستغناء عندما تكون القائمة 17 لاعبًا"
                    : "لا يمكن الاستغناء عن لاعب مرتبط بعقد أو صفقة مقبولة"}
                </span>
              ) : null
            ) : null}
            {activeContractType === "loan" ? (
              canTerminateLoan ? (
                <button type="button" className="playerReleaseBtn" onClick={confirmTerminateLoan}>فسخ الإعارة</button>
              ) : (
                <span className="playerOwnerLockedNote">فسخ الإعارة متاح فقط لأطراف العقد خلال فترة الانتقالات</span>
              )
            ) : null}
            {canRegisterFreeAgentFee ? (
              <button type="button" className="playerReleaseBtn freeAgentFeeBtn" onClick={confirmRegisterFreeAgentFee}>
                {freeAgentActionIsReplacement ? "تبديل اللاعب الحر" : "تسجيل اللاعب الحر"}
              </button>
            ) : null}
          </div>

          <div className="incomingOffersBox">
            <h3>استعراض العروض المقدمة</h3>
            {receivedOffers.length ? (
              <div className="incomingOffersList">
                {receivedOffers.map((offer) => (
                  <article className="incomingOfferCard" key={offer.id}>
                    <div className="incomingOfferTop">
                      <b>{offer.fromMemberName || getMemberName(members, offer.fromMemberId)}</b>
                      <span>{offer.type === "loan" ? "عقد إعارة" : "عقد شراء"}</span>
                    </div>
                    <div className="incomingOfferMeta">
                      <span><small>المبلغ</small><strong>{formatMoney(offer.amount || 0)}</strong></span>
                      {offer.type === "loan" ? <span><small>المدة</small><strong>{offer.loanDurationMonths || "-"} شهور</strong></span> : null}
                      <span><small>لاعبون مقابل الصفقة</small><strong>{Array.isArray(offer.offeredPlayers) ? offer.offeredPlayers.length : 0}</strong></span>
                    </div>
                    {Array.isArray(offer.offeredPlayers) && offer.offeredPlayers.length ? (
                      <div className="incomingOfferedPlayers">
                        {offer.offeredPlayers.map((item) => (
                          <span key={item.playerId || item.playerName}>{item.playerName} • {exchangeContractLabel(item)}</span>
                        ))}
                      </div>
                    ) : null}
                    {offer.notes ? <p className="incomingOfferNotes">{offer.notes}</p> : null}
                    <div className="incomingOfferActions">
                      <button type="button" className="accept" onClick={() => confirmAcceptOffer(offer)}>الموافقة على العرض</button>
                      <button type="button" className="reject" onClick={() => confirmRejectOffer(offer)}>رفض العرض</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">لا توجد عروض نشطة على هذا اللاعب حالياً.</div>
            )}
          </div>
        </section>
      ) : !canMakeOffer ? (
        <div className="playerDetailNotice">لا توجد إجراءات متاحة لهذا اللاعب حاليًا.</div>
      ) : null}

      {actionMessage ? <div className="moneyModalMessage">{actionMessage}</div> : null}

      {instantContract ? (
        <TransferContractModal row={instantContract.row} player={instantContract.player} logoUrl={logoUrl} onClose={() => setInstantContract(null)} />
      ) : null}

      {confirmDialog ? (
        <ConfirmDialog
          title={confirmDialog.title}
          body={confirmDialog.body}
          confirmText={confirmDialog.confirmText}
          tone={confirmDialog.tone}
          busy={busyAction}
          onCancel={() => !busyAction && setConfirmDialog(null)}
          onConfirm={runConfirmedAction}
        />
      ) : null}
    </section>
  );
}
