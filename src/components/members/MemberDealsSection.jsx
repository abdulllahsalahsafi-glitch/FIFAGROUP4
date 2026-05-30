import React, { useState } from 'react'
import { cleanId, same, clean, formatMoney, dateValue, formatTransferDate, isLoanTransferRow, loanDurationLabel, exchangeContractLabel, getActiveMemberRestrictions, notificationTimeValue, normalizeOfferAsTransferContractRow } from '../../utils'
import { FALLBACK_PLAYER_IMAGE } from '../../constants'
import TransferContractModal from '../transfers/TransferContractModal'
import TransferRestrictionBanner from '../ui/TransferRestrictionBanner'


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
.fgProfileSectionPanel .fgProfileSectionHead > div{min-width:0;flex:1 1 auto}
.fgProfileSectionPanel .fgProfileSectionHead h3{margin:0;font-size:clamp(22px,5.6vw,30px);line-height:1.25;font-weight:1000;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;text-align:right}
.fgProfileSectionPanel .fgProfileSectionHead p{margin:5px 0 0;font-size:12px;line-height:1.45;font-weight:800;color:#AEB6D2;-webkit-text-fill-color:#AEB6D2;text-align:right}
.fgProfileSectionPanel .fgProfileSectionHead input{flex:0 0 min(270px,42%);min-width:120px}
.fgProfileSectionCountBadge{min-width:42px;height:30px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;margin-inline-start:8px;background:rgba(0,230,118,.12);border:1px solid rgba(0,230,118,.22);color:#00E676;-webkit-text-fill-color:#00E676;font-size:12px;font-weight:1000;vertical-align:middle}
.memberDealsTabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 12px;margin-bottom:2px;scrollbar-width:none}
.memberDealsTabs::-webkit-scrollbar{display:none}
.memberDealsTabs button{height:38px;border:1px solid rgba(0,230,118,.14);background:rgba(2,6,23,.36);color:#DDE7FF;-webkit-text-fill-color:#DDE7FF;border-radius:999px;padding:0 14px;font-size:12px;font-weight:1000;white-space:nowrap;cursor:pointer}
.memberDealsTabs button.active{background:rgba(0,230,118,.16);border-color:rgba(0,230,118,.34);color:#00E676;-webkit-text-fill-color:#00E676}
.memberTransferStatsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.memberTransferStatCard{border-radius:20px;border:1px solid rgba(0,230,118,.14);background:linear-gradient(145deg,rgba(4,12,28,.72),rgba(2,6,23,.46));padding:14px;text-align:right;min-width:0}
.memberTransferStatCard small{display:block;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;font-size:11px;font-weight:900;margin-bottom:7px}
.memberTransferStatCard b{display:block;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;font-size:clamp(19px,5.2vw,28px);font-weight:1000;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr;text-align:right}
.memberTransferStatCard.in b{color:#00E676;-webkit-text-fill-color:#00E676}.memberTransferStatCard.out b{color:#F87171;-webkit-text-fill-color:#F87171}.memberTransferStatCard.spend b{color:#FACC15;-webkit-text-fill-color:#FACC15}.memberTransferStatCard.revenue b{color:#38BDF8;-webkit-text-fill-color:#38BDF8}
@media(max-width:720px){
  .fgProfileSectionPanel .fgProfileSectionHead{display:grid;grid-template-columns:1fr;gap:10px;padding:11px 12px;border-radius:20px}
  .fgProfileSectionPanel .fgProfileSectionHead input{width:100%;min-width:0;flex:auto}
  .fgProfileSectionPanel .fgProfileSectionHead h3{font-size:clamp(21px,5.8vw,28px)}
  .memberTransferStatsGrid{grid-template-columns:1fr}
}
`;

function dealTimeValue(row = {}) {
  return notificationTimeValue(row.completedAt || row.executedAt || row.updatedAt || row.createdAt) || dateValue(row.date || formatTransferDate(row.createdAt));
}

function isCompletedOfferRow(offer = {}) {
  const status = clean(offer.status || "");
  return status === "completed" || (status === "approvedpendingwindow" && (offer.completedAt || offer.marketWasOpenAtApproval || offer.executedAt || offer.loanStartDate || offer.marketExecutionCompletedAt));
}

function rowPlayerId(row = {}) {
  return cleanId(row.playerId || row.playerid || row.targetPlayerId || row.id || "");
}

function rowPlayerName(row = {}) {
  return row.playerName || row.targetPlayerName || row.player || row.name || "لاعب";
}

function isIncomingRow(row = {}, memberId = "") {
  return same(row.toMemberId || row.currentMemberId, memberId);
}

function isOutgoingRow(row = {}, memberId = "") {
  return same(row.fromMemberId, memberId) && !same(row.toMemberId || row.currentMemberId, memberId);
}

function isFreeAgentCostRow(row = {}, memberId = "") {
  const type = clean(row.type || row.typeLabel || row.note || "");
  return same(row.toMemberId || row.currentMemberId, memberId) && (
    type.includes("free_agent") ||
    type.includes("لاعبحر") ||
    type.includes("لاعب حر") ||
    type.includes("شرط جزائي") ||
    type.includes("كسر عقد") ||
    type.includes("تبديل")
  );
}

export default function MemberDealsSection({ member, members = [], transferHistory = [], playerOffers = [], memberRestrictions = [], logoUrl = "" }) {
  const memberId = cleanId(member?.id);
  const [dealSearch, setDealSearch] = useState("");
  const [dealTab, setDealTab] = useState("incoming");
  const [selectedDealContract, setSelectedDealContract] = useState(null);
  const q = clean(dealSearch);

  const completedOfferRows = (playerOffers || [])
    .filter(isCompletedOfferRow)
    .map((offer) => ({ ...normalizeOfferAsTransferContractRow(offer), relatedOfferId: offer.id || "", sourceKind: "completed_offer" }));

  const transferRows = (transferHistory || []).map((row) => ({ ...row, sourceKind: row.sourceKind || "transfer_history" }));
  const allRows = [...transferRows];

  completedOfferRows.forEach((row) => {
    const exists = allRows.some((item) =>
      (row.relatedOfferId && same(item.relatedOfferId, row.relatedOfferId)) ||
      (rowPlayerId(item) && same(rowPlayerId(item), rowPlayerId(row)) && same(item.fromMemberId, row.fromMemberId) && same(item.toMemberId, row.toMemberId) && toNumber(item.amount) === toNumber(row.amount))
    );
    if (!exists) allRows.push(row);
  });

  const expandedRows = [];
  allRows.forEach((row) => {
    expandedRows.push(row);
    const type = clean(row.type || row.typeLabel || "");
    const oldPlayerId = cleanId(row.oldPlayerId || row.oldplayerid || "");
    const oldPlayerName = row.oldPlayerName || row.oldplayername || "";
    if (same(row.toMemberId || row.currentMemberId, memberId) && oldPlayerId && (type.includes("free_agent_replacement") || type.includes("تبديل"))) {
      expandedRows.push({
        ...row,
        id: String(row.id || row.relatedQueueId || "deal") + "-old-free-out",
        playerId: oldPlayerId,
        playerName: oldPlayerName || "لاعب حر سابق",
        playerImage: row.oldPlayerImage || "",
        amount: 0,
        fromMemberId: memberId,
        fromMemberName: member?.name || row.toMemberName || "",
        toMemberId: "free_agents",
        toMemberName: "لاعب حر",
        typeLabel: "خروج لاعب حر بعد التبديل",
        sourceKind: "free_agent_replacement_out",
        syntheticOutgoing: true,
      });
    }
  });

  const matchDeal = (row) => !q || clean([
    rowPlayerName(row),
    row.fromMemberName,
    row.toMemberName,
    row.type,
    row.typeLabel,
    row.status,
    row.periodName,
    row.date,
    isLoanTransferRow(row) ? loanDurationLabel(row.loanDurationMonths) : "",
    Array.isArray(row.offeredPlayers) ? row.offeredPlayers.map((item) => item.playerName || item.name || "").join(" ") : "",
  ].join(" ")).includes(q);

  const memberDeals = expandedRows
    .filter((row) => same(row.fromMemberId, memberId) || same(row.toMemberId, memberId) || same(row.currentMemberId, memberId) || same(row.originalOwnerMemberId, memberId))
    .filter(matchDeal)
    .sort((a, b) => dealTimeValue(b) - dealTimeValue(a));

  const incomingDeals = memberDeals.filter((row) => isIncomingRow(row, memberId));
  const outgoingDeals = memberDeals.filter((row) => isOutgoingRow(row, memberId));
  const activeRestrictions = getActiveMemberRestrictions(memberRestrictions, memberId);

  const spending = memberDeals.reduce((sum, row) => {
    const amount = Math.max(0, toNumber(row.amount || row.feeAmount || row.cost || 0));
    if (!amount) return sum;
    if (same(row.toMemberId || row.currentMemberId, memberId)) return sum + amount;
    if (isFreeAgentCostRow(row, memberId)) return sum + amount;
    return sum;
  }, 0);

  const revenue = memberDeals.reduce((sum, row) => {
    const amount = Math.max(0, toNumber(row.amount || 0));
    if (!amount) return sum;
    return isOutgoingRow(row, memberId) ? sum + amount : sum;
  }, 0);

  const statsRows = [
    { label: "لاعبون دخلوا القائمة", value: incomingDeals.length, tone: "in" },
    { label: "لاعبون خرجوا من القائمة", value: outgoingDeals.length, tone: "out" },
    { label: "حجم الإنفاق", value: formatMoney(spending), tone: "spend" },
    { label: "عوائد السوق", value: formatMoney(revenue), tone: "revenue" },
  ];

  const visibleRows = dealTab === "outgoing" ? outgoingDeals : incomingDeals;

  function openDealContract(row) {
    const player = {
      id: rowPlayerId(row),
      playerid: rowPlayerId(row),
      name: rowPlayerName(row),
      image: row.playerImage || row.targetPlayerImage || FALLBACK_PLAYER_IMAGE,
      rating: row.playerRating || row.targetPlayerRating || "",
      position: row.playerPosition || row.targetPlayerPosition || "",
    };
    setSelectedDealContract({ row, player });
  }

  function renderDealCard(row, index) {
    const outgoing = isOutgoingRow(row, memberId);
    const incoming = isIncomingRow(row, memberId);
    const sideLabel = outgoing ? "خارج من القائمة" : incoming ? "داخل إلى القائمة" : "مرتبط بالعضو";
    return (
      <article className="memberDealCard" key={String(row.id || row.relatedOfferId || row.relatedQueueId || index)}>
        <img src={row.playerImage || row.targetPlayerImage || FALLBACK_PLAYER_IMAGE} alt="" />
        <div>
          <b>{rowPlayerName(row)}</b>
          <small>{sideLabel} • {row.typeLabel || row.type || "صفقة"}{isLoanTransferRow(row) ? " • " + loanDurationLabel(row.loanDurationMonths) : ""}</small>
          <p>{row.periodName || row.period || "فترة انتقالات"} • {row.fromMemberName || row.from || "-"} ← {row.toMemberName || row.to || "-"}</p>
          {Array.isArray(row.offeredPlayers) && row.offeredPlayers.length ? (
            <div className="miniSwapPlayers">
              {row.offeredPlayers.map((item, swapIndex) => (
                <span key={item.playerId || item.playerName || swapIndex}>
                  <img src={item.playerImage || item.image || FALLBACK_PLAYER_IMAGE} alt="" />
                  {item.playerName || item.name || "لاعب"} • {exchangeContractLabel(item)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <strong>{formatMoney(row.amount || 0)}</strong>
        <button type="button" className="transferContractBtn" onClick={() => openDealContract(row)}>تحميل صورة العقد</button>
      </article>
    );
  }

  return (
    <section className="sectionBox glassSoft memberDealsPanel fgProfileSectionPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="sectionHead compact fgProfileSectionHead">
        <div>
          <h3>سجل الصفقات</h3>
          <p>الصفقات مرتبة من الأحدث إلى الأقدم، مع فصل الداخلين والخارجين من القائمة.</p>
        </div>
        <input value={dealSearch} onChange={(event) => setDealSearch(event.target.value)} placeholder="ابحث عن لاعب، عضو، نوع الصفقة، فترة..." />
      </div>
      {activeRestrictions.length ? <TransferRestrictionBanner rows={activeRestrictions} /> : null}
      <nav className="memberDealsTabs" aria-label="تصفية سجل الصفقات">
        <button type="button" className={dealTab === "incoming" ? "active" : ""} onClick={() => setDealTab("incoming")}>الداخلون ({incomingDeals.length})</button>
        <button type="button" className={dealTab === "outgoing" ? "active" : ""} onClick={() => setDealTab("outgoing")}>الخارجون ({outgoingDeals.length})</button>
        <button type="button" className={dealTab === "stats" ? "active" : ""} onClick={() => setDealTab("stats")}>إحصائيات الانتقالات</button>
      </nav>

      {dealTab === "stats" ? (
        <div className="memberTransferStatsGrid">
          {statsRows.map((item) => (
            <article className={`memberTransferStatCard ${item.tone}`} key={item.label}>
              <small>{item.label}</small>
              <b>{typeof item.value === "number" ? item.value : item.value}</b>
            </article>
          ))}
        </div>
      ) : (
        <div className="memberDealList">
          {visibleRows.length ? visibleRows.map(renderDealCard) : <div className="empty">لا توجد صفقات في هذه الخانة.</div>}
        </div>
      )}

      {selectedDealContract ? (
        <TransferContractModal
          row={selectedDealContract.row}
          player={selectedDealContract.player}
          logoUrl={logoUrl}
          onClose={() => setSelectedDealContract(null)}
        />
      ) : null}
    </section>
  );
}
