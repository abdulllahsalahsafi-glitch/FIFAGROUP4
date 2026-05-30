import React from 'react'
import { cleanId, clean, same, isEnabled, dateOnlyMs, getPlayerStableId, getRosterPlayerKindFromContract, getPlayerRosterKindLabel, getMemberName } from '../../utils'
import { avatar } from '../../utils/ui'
import { FALLBACK_PLAYER_IMAGE } from '../../constants'


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


export default function PlayersSection({ config, rows, search, setSearch, playerCount, showOfferButton = false, onOpenPlayerDetail, playerContracts = [], selectedMemberId = "" }) {
  const memberId = cleanId(selectedMemberId);
  const activeContracts = (playerContracts || []).filter((contract) => clean(contract.status || "active") === "active");
  const playerKindCounts = (rows || []).reduce(
    (counts, player) => {
      const playerId = getPlayerStableId(player);
      const contract = activeContracts.find((item) => same(item.playerId, playerId));
      const kind = getRosterPlayerKindFromContract(player, contract, memberId);
      if (kind === "free") counts.free += 1;
      else if (kind === "pro_owned" || kind === "pro_loan") counts.pro += 1;
      else counts.base += 1;
      return counts;
    },
    { base: 0, free: 0, pro: 0 }
  );

  const loanRows = activeContracts
    .filter((contract) => clean(contract.contractType || "") === "loan")
    .filter((contract) => {
      const current = cleanId(contract.currentMemberId || "");
      const original = cleanId(contract.originalOwnerMemberId || contract.ownerMemberId || contract.baseOwnerMemberId || "");
      return same(current, memberId) || same(original, memberId);
    })
    .map((contract) => {
      const current = cleanId(contract.currentMemberId || "");
      const original = cleanId(contract.originalOwnerMemberId || contract.ownerMemberId || contract.baseOwnerMemberId || "");
      const endDate = contract.loanEndDate || contract.endDate || "";
      const daysLeft = endDate ? Math.ceil((dateOnlyMs(endDate, 0) - Date.now()) / 86400000) : null;
      return {
        id: contract.id || contract.playerId,
        playerName: contract.playerName || "لاعب",
        playerImage: contract.playerImage || FALLBACK_PLAYER_IMAGE,
        currentMemberName: contract.currentMemberName || getMemberName([], current) || current,
        originalOwnerName: contract.originalOwnerMemberName || contract.ownerMemberName || contract.baseOwnerMemberName || original,
        directionLabel: same(current, memberId) ? "معار لديك" : "معار إلى " + (contract.currentMemberName || current || "عضو"),
        endDate,
        daysLeft,
      };
    });

  return (
    <section className="sectionBox glassSoft fgProfileSectionPanel playersSectionPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="sectionHead compact fgProfileSectionHead">
        <div>
          <h3>
            {config.playersTitle}{" "}
            <span className="fgProfileSectionCountBadge">{playerCount}</span>
          </h3>
          <p>مرتبة حسب القدرة من الأعلى إلى الأقل</p>
        </div>
        {isEnabled(config.showSearch) ? (
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={config.searchPlaceholder}
          />
        ) : null}
      </div>
      <div className="playersGrid">
        {rows.length ? (
          rows.map((player, index) => (
            <article
              className={onOpenPlayerDetail ? "playerCard playerCardClickable" : "playerCard"}
              key={String(getPlayerStableId(player) || player.name || index)}
              onClick={onOpenPlayerDetail ? () => onOpenPlayerDetail?.(player) : undefined}
              role={onOpenPlayerDetail ? "button" : undefined}
              tabIndex={onOpenPlayerDetail ? 0 : undefined}
              onKeyDown={onOpenPlayerDetail ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenPlayerDetail?.(player);
                }
              } : undefined}
            >
              <img
                className="playerPhoto"
                src={player.image || avatar(player.name)}
                alt=""
              />
              <div className="playerInfo">
                <h4>{player.name}</h4>
                <p className="playerMeta">
                  <span className="playerPosition">{player.position || "مركز غير محدد"}</span>
                  <span className="playerContract">{getPlayerRosterKindLabel(player, playerContracts, selectedMemberId)}</span>
                </p>
              </div>
              <b className="playerRating">{player.rating}</b>
            </article>
          ))
        ) : (
          <div className="empty">لا توجد بيانات لاعبين.</div>
        )}
      </div>

      {loanRows.length ? (
        <section className="loanedPlayersPanel glassSoft">
          <div className="loanedPlayersHead">
            <b>اللاعبون المعارون حاليًا</b>
            <small>{loanRows.length} إعارة نشطة</small>
          </div>
          <div className="loanedPlayersList">
            {loanRows.map((loan) => (
              <article className="loanedPlayerRow" key={String(loan.id)}>
                <img src={loan.playerImage || FALLBACK_PLAYER_IMAGE} alt="" />
                <div>
                  <b>{loan.playerName}</b>
                  <small>{loan.directionLabel}</small>
                </div>
                <span>{loan.endDate ? (loan.daysLeft !== null && loan.daysLeft >= 0 ? `باقي ${loan.daysLeft} يوم` : "انتهت المدة") : "بدون تاريخ"}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="playerRosterStats glassSoft">
        <span><small>أساسي</small><b>{playerKindCounts.base}</b></span>
        <span><small>لاعب حر</small><b>{playerKindCounts.free}</b></span>
        <span><small>محترف</small><b>{playerKindCounts.pro}</b></span>
      </div>
    </section>
  );
}
