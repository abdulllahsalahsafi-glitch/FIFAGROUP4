import React, { useState } from 'react'
import { cleanId, same, clean, formatMoney, dateValue, formatTransferDate, isLoanTransferRow, loanDurationLabel, exchangeContractLabel, getActiveMemberRestrictions } from '../../utils'
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


export default function MemberDealsSection({ member, members = [], transferHistory = [], playerOffers = [], memberRestrictions = [], logoUrl = "" }) {
  const memberId = cleanId(member?.id);
  const [dealSearch, setDealSearch] = useState("");
  const [selectedDealContract, setSelectedDealContract] = useState(null);
  const q = clean(dealSearch);
  const matchDeal = (row) => !q || clean([
    row.playerName,
    row.player,
    row.name,
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
  const memberDeals = (transferHistory || [])
    .filter((row) => same(row.fromMemberId, memberId) || same(row.toMemberId, memberId) || same(row.originalOwnerMemberId, memberId))
    .filter(matchDeal)
    .sort((a, b) => dateValue(b.date || formatTransferDate(b.createdAt)) - dateValue(a.date || formatTransferDate(a.createdAt)));
  const memberDealGroups = memberDeals.reduce((groups, row) => {
    const key = row.periodName || row.marketExecutionWindowName || row.period || row.periodTitle || row.periodId || "انتقالات Firebase";
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
    return groups;
  }, {});
  const activeRestrictions = getActiveMemberRestrictions(memberRestrictions, memberId);

  function openDealContract(row) {
    const player = {
      id: row?.playerId || row?.playerid || row?.playerID || row?.player_id || "",
      playerid: row?.playerId || row?.playerid || row?.playerID || row?.player_id || "",
      name: row?.playerName || row?.player || row?.name || "لاعب",
      image: row?.playerImage || FALLBACK_PLAYER_IMAGE,
      rating: row?.playerRating || "",
      position: row?.playerPosition || "",
    };
    setSelectedDealContract({ row, player });
  }

  return (
    <section className="sectionBox glassSoft memberDealsPanel fgProfileSectionPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="sectionHead compact fgProfileSectionHead">
        <div>
          <h3>سجل الصفقات</h3>
          <p>مرتبط بسجل فترات الانتقالات، لكنه مفلتر لهذا العضو فقط.</p>
        </div>
        <input value={dealSearch} onChange={(event) => setDealSearch(event.target.value)} placeholder="ابحث عن لاعب، عضو، نوع الصفقة، فترة..." />
      </div>
      {activeRestrictions.length ? <TransferRestrictionBanner rows={activeRestrictions} /> : null}
      <h4 className="dealSectionTitle">الصفقات حسب فترات الانتقالات</h4>
      <div className="memberDealList">
        {memberDeals.length ? Object.entries(memberDealGroups).map(([periodName, groupRows]) => (
          <div className="dealPeriodGroup" key={periodName}>
            <div className="dealPeriodTitle"><b>{periodName}</b><span>{groupRows.length} صفقة</span></div>
            {groupRows.map((row, index) => {
              const outgoing = same(row.fromMemberId, memberId);
              const incoming = same(row.toMemberId, memberId);
              const sideLabel = outgoing ? "خارج من القائمة" : incoming ? "داخل إلى القائمة" : "مالك أصلي";
              return (
                <article className="memberDealCard" key={String(row.id || row.relatedOfferId || index)}>
                  <img src={row.playerImage || FALLBACK_PLAYER_IMAGE} alt="" />
                  <div>
                    <b>{row.playerName || row.player || row.name || "لاعب"}</b>
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
            })}
          </div>
        )) : <div className="empty">لا توجد صفقات لهذا العضو في سجل الفترات.</div>}
      </div>
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
