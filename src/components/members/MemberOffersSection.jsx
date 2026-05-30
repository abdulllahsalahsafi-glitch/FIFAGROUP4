import React, { useState } from 'react'
import { cleanId, same, clean, formatMoney, notificationTimeValue, isOfferExpired, loanDurationLabel, exchangeContractLabel, getMemberName, playerOfferStatusMessage, normalizeOfferAsTransferContractRow, getPlayerStableId } from '../../utils'
import { FALLBACK_PLAYER_IMAGE } from '../../constants'
import TransferContractModal from '../transfers/TransferContractModal'


const profileSectionHeaderCss = `
.fgProfileSectionPanel .fgProfileSectionHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  border-radius:22px;
  background:linear-gradient(145deg,rgba(4,12,28,.74),rgba(2,6,23,.52));
  border:1px solid rgba(0,230,118,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
  margin-bottom:12px;
}
.fgProfileSectionPanel .fgProfileSectionHead > div{
  min-width:0;
  flex:1 1 auto;
}
.fgProfileSectionPanel .fgProfileSectionHead h3{
  margin:0;
  font-size:clamp(22px,5.6vw,30px);
  line-height:1.25;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead p{
  margin:5px 0 0;
  font-size:12px;
  line-height:1.45;
  font-weight:800;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead input{
  flex:0 0 min(270px,42%);
  min-width:120px;
}
.fgProfileSectionCountBadge{
  min-width:42px;
  height:30px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 10px;
  margin-inline-start:8px;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.22);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-size:12px;
  font-weight:1000;
  vertical-align:middle;
}
@media(max-width:720px){
  .fgProfileSectionPanel .fgProfileSectionHead{
    display:grid;
    grid-template-columns:1fr;
    gap:10px;
    padding:11px 12px;
    border-radius:20px;
  }
  .fgProfileSectionPanel .fgProfileSectionHead input{
    width:100%;
    min-width:0;
    flex:auto;
  }
  .fgProfileSectionPanel .fgProfileSectionHead h3{
    font-size:clamp(21px,5.8vw,28px);
  }
}
`;


export default function MemberOffersSection({ member, members = [], allPlayers = [], playerOffers = [], currentMemberId = "", isFifaAdmin = false, logoUrl = "", onOpenPlayer, onEditOffer, onCancelOffer, onAcceptOffer, onRejectOffer }) {
  const memberId = cleanId(member?.id);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerSubTab, setOfferSubTab] = useState("incoming_active");
  const [selectedOfferContract, setSelectedOfferContract] = useState(null);
  const q = clean(offerSearch);
  const isOwnOfferCenter = Boolean(currentMemberId && same(currentMemberId, memberId));
  const isReadOnlyAdminView = Boolean(isFifaAdmin && !isOwnOfferCenter);
  const canViewOfferCenter = isOwnOfferCenter || isFifaAdmin;

  if (!canViewOfferCenter) return null;

  const memberOffers = (playerOffers || [])
    .filter((offer) => same(offer.fromMemberId, memberId) || same(offer.toMemberId, memberId))
    .filter((offer) => {
      if (!q) return true;
      const offeredNames = Array.isArray(offer.offeredPlayers)
        ? offer.offeredPlayers.map((item) => [item.playerName || item.name || "", exchangeContractLabel(item)].join(" ")).join(" ")
        : "";
      return clean([
        offer.targetPlayerName,
        offer.fromMemberName,
        offer.toMemberName,
        offer.typeLabel,
        offer.type,
        offer.status,
        offer.amount,
        offeredNames,
      ].join(" ")).includes(q);
    })
    .sort((a, b) => notificationTimeValue(b.createdAt) - notificationTimeValue(a.createdAt));

  function offerStatusKey(offer) {
    const status = clean(offer.status || "pending");
    if (status === "pending" && isOfferExpired(offer)) return "expired";
    if (status === "approvedpendingwindow" && (offer.completedAt || offer.marketWasOpenAtApproval || offer.executedAt || offer.loanStartDate)) return "completed";
    return status;
  }

  function isPendingOffer(offer) { return offerStatusKey(offer) === "pending"; }
  function isPendingWindowOffer(offer) { return offerStatusKey(offer) === "approvedpendingwindow"; }
  function isCompletedOffer(offer) { return offerStatusKey(offer) === "completed"; }
  function isClosedOffer(offer) {
    const status = offerStatusKey(offer);
    return ["rejected","cancelledbybuyer","cancelledbyseller","cancelled","expired","cancelledbecauseplayerunavailable","cancelledbecauseplayerreleased"].includes(status);
  }

  function offerCenterStatusLabel(offer) {
    const status = offerStatusKey(offer);
    if (status === "pending") return "بانتظار الرد";
    if (status === "approvedpendingwindow") return "مقبول بانتظار فتح السوق";
    if (status === "completed") return "مكتملة";
    if (status === "rejected") return "مرفوضة";
    if (status === "cancelledbybuyer" || status === "cancelledbyseller" || status === "cancelled") return "ملغاة";
    if (status === "expired") return "منتهية";
    if (status === "cancelledbecauseplayerunavailable") return "أغلقت لارتباط اللاعب";
    if (status === "cancelledbecauseplayerreleased") return "أغلقت بسبب الاستغناء";
    return playerOfferStatusMessage(status);
  }

  const incomingActiveOffers = memberOffers.filter((offer) => same(offer.toMemberId, memberId) && isPendingOffer(offer));
  const outgoingActiveOffers = memberOffers.filter((offer) => same(offer.fromMemberId, memberId) && isPendingOffer(offer));
  const pendingWindowOffers = memberOffers.filter(isPendingWindowOffer);
  const completedOffers = memberOffers.filter(isCompletedOffer);
  const closedOffers = memberOffers.filter(isClosedOffer);

  const offerTabs = [
    ["incoming_active", "الواردة", incomingActiveOffers],
    ["outgoing_active", "الصادرة", outgoingActiveOffers],
    ["pending_window", "بانتظار السوق", pendingWindowOffers],
    ["completed", "المكتملة", completedOffers],
    ["closed", "المرفوضة / الملغاة", closedOffers],
  ];
  const activeTab = offerTabs.find(([id]) => id === offerSubTab) || offerTabs[0];
  const visibleOffers = activeTab[2] || [];

  function findOfferPlayer(offer) {
    return (allPlayers || []).find((player) => same(getPlayerStableId(player), offer.targetPlayerId)) || {
      playerid: offer.targetPlayerId,
      id: offer.targetPlayerId,
      name: offer.targetPlayerName,
      image: offer.targetPlayerImage,
      position: offer.targetPlayerPosition,
      rating: offer.targetPlayerRating,
      memberid: offer.toMemberId,
    };
  }

  function targetMemberForOffer(offer) {
    return (members || []).find((item) => same(item.id, offer.toMemberId)) || { id: offer.toMemberId, name: offer.toMemberName };
  }

  function offerDirectionLabel(offer) {
    if (same(offer.toMemberId, memberId)) return "عرض وارد";
    if (same(offer.fromMemberId, memberId)) return "عرض صادر";
    return "عرض مرتبط";
  }

  function offerTypeLine(offer) {
    const type = offer.type === "loan" ? "عقد إعارة" : "عقد شراء";
    const duration = offer.type === "loan" ? " • " + loanDurationLabel(offer.loanDurationMonths) : "";
    return type + duration;
  }

  function openCompletedOfferContract(offer, player) {
    const row = normalizeOfferAsTransferContractRow(offer);
    const contractPlayer = {
      id: row.playerId || row.playerid || player?.id || player?.playerid || "",
      playerid: row.playerId || row.playerid || player?.playerid || player?.id || "",
      name: row.playerName || player?.name || "لاعب",
      image: row.playerImage || player?.image || FALLBACK_PLAYER_IMAGE,
      rating: row.playerRating || player?.rating || "",
      position: row.playerPosition || player?.position || "",
    };
    setSelectedOfferContract({ row, player: contractPlayer });
  }

  return (
    <section className="sectionBox glassSoft memberDealsPanel fgProfileSectionPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="sectionHead compact fgProfileSectionHead">
        <div>
          <h3>عروض الانتقالات</h3>
          <p>{isReadOnlyAdminView ? "استعراض إداري للعروض المرتبطة بهذا العضو دون تنفيذ قرارات نيابة عنه." : "مركز منظم لإدارة عروضك حسب الحالة."}</p>
        </div>
        <input value={offerSearch} onChange={(event) => setOfferSearch(event.target.value)} placeholder="ابحث عن لاعب، عضو، نوع العرض..." />
      </div>
      <nav className="tabs">
        {offerTabs.map(([id, label, rows]) => (
          <button key={id} className={offerSubTab === id ? "tabBtn active" : "tabBtn"} onClick={() => setOfferSubTab(id)}>
            {label} ({rows.length})
          </button>
        ))}
      </nav>
      <div className="memberDealList">
        {visibleOffers.length ? visibleOffers.map((offer, index) => {
          const pending = isPendingOffer(offer);
          const completed = isCompletedOffer(offer);
          const canManageOutgoingOffer = Boolean(pending && currentMemberId && same(currentMemberId, offer.fromMemberId));
          const canManageIncomingOffer = Boolean(pending && currentMemberId && same(currentMemberId, offer.toMemberId));
          const player = findOfferPlayer(offer);
          const targetMember = targetMemberForOffer(offer);
          const offeredPlayers = Array.isArray(offer.offeredPlayers) ? offer.offeredPlayers : [];
          return (
            <article className="memberDealCard offer managedOfferCard" key={String(offer.id || index)}>
              <img src={offer.targetPlayerImage || player.image || FALLBACK_PLAYER_IMAGE} alt="" />
              <div>
                <b>{offer.targetPlayerName || player.name || "لاعب"}</b>
                <small>{offerDirectionLabel(offer)} • {offerTypeLine(offer)}</small>
                <p>{offer.fromMemberName || getMemberName(members, offer.fromMemberId)} ← {offer.toMemberName || getMemberName(members, offer.toMemberId)} • {formatMoney(offer.amount || 0)}</p>
                {offeredPlayers.length ? (
                  <div className="miniSwapPlayers">
                    {offeredPlayers.map((item, swapIndex) => (
                      <span key={item.playerId || item.playerName || swapIndex}>
                        <img src={item.playerImage || item.image || FALLBACK_PLAYER_IMAGE} alt="" />
                        {item.playerName || item.name || "لاعب"} • {exchangeContractLabel(item)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <strong>{offerCenterStatusLabel(offer)}</strong>
              <div className="offerCenterActions">
                <button type="button" onClick={() => onOpenPlayer?.(player)}>صفحة اللاعب</button>
                {canManageOutgoingOffer ? <button type="button" onClick={() => onEditOffer?.(offer, player, targetMember)}>تعديل</button> : null}
                {canManageOutgoingOffer ? <button className="danger" type="button" onClick={() => onCancelOffer?.(offer)}>إلغاء</button> : null}
                {canManageIncomingOffer ? <button type="button" onClick={() => onAcceptOffer?.(offer.id)}>قبول</button> : null}
                {canManageIncomingOffer ? <button className="danger" type="button" onClick={() => onRejectOffer?.(offer.id)}>رفض</button> : null}
                {completed ? <button type="button" onClick={() => openCompletedOfferContract(offer, player)}>عرض العقد</button> : null}
              </div>
            </article>
          );
        }) : <div className="empty">لا توجد عروض في هذه الخانة.</div>}
      </div>
      {selectedOfferContract ? (
        <TransferContractModal
          row={selectedOfferContract.row}
          player={selectedOfferContract.player}
          logoUrl={logoUrl}
          onClose={() => setSelectedOfferContract(null)}
        />
      ) : null}
    </section>
  );
}
