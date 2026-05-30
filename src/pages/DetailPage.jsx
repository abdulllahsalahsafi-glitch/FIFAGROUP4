import React, { useState } from 'react'
import { DEFAULT_CONFIG, stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean, isEnabled } from '../utils/helpers'
import { sortRecordsDesc, groupMemberTrophies, groupByTrophy, getPlayerStableId } from '../utils/data'
import { isPlayerReleasedByContracts } from '../utils/admin'
import BackButton from '../components/ui/BackButton'
import RecordCard from '../components/ui/RecordCard'
import FinanceSection from '../components/finance/FinanceSection'
import RecordsSubPage from './RecordsSubPage'
import FinalsSubPage from './FinalsSubPage'
import MemberAllTrophiesSubPage from './MemberAllTrophiesSubPage'
import PlayerDetailSubPage from './PlayerDetailSubPage'
import PlayerOfferModal from '../components/modals/PlayerOfferModal'
import PlayersSection from '../components/players/PlayersSection'
import RecordDetailPage from './RecordDetailPage'

export default function DetailPage({
  config = DEFAULT_CONFIG,
  view,
  members,
  players,
  finance,
  trophyMap = {},
  playerContracts = [],
  freeAgentRegistrations = [],
  freePlayerStatus = [],
  freeAgentQueue = [],
  currentMemberId,
  currentMember,
  currentAvailableBalance = 0,
  currentMemberPlayers = [],
  playerOffers,
  isMarketOpen,
  onBack,
  onOpenView,
  onInfo,
  onCreatePlayerOffer,
  onUpdatePlayerOffer,
  onCancelPlayerOffer,
  onAcceptOffer,
  onRejectOffer,
  onReleasePlayer,
  onTerminateLoan,
  onRegisterFreeAgentFee,
}) {
  const [detailOfferModal, setDetailOfferModal] = useState(null);

  function openDetailPlayerOffer(player, existingOffer = null) {
    setDetailOfferModal({
      player,
      existingOffer,
      targetMember: view?.ownerMember || null,
    });
  }

  async function cancelDetailPlayerOffer(existingOffer) {
    if (!existingOffer?.id) return;
    await onCancelPlayerOffer?.(existingOffer.id);
  }

  if (!view) return null;
  if (view.type === "playerDetailOffer")
    return (
      <main className="widePage glass">
        {detailOfferModal ? (
          <PlayerOfferModal
            targetMember={detailOfferModal.targetMember || view.ownerMember}
            targetPlayer={detailOfferModal.player}
            existingOffer={detailOfferModal.existingOffer}
            currentMemberId={currentMemberId}
            currentAvailableBalance={currentAvailableBalance}
            currentMemberPlayers={currentMemberPlayers}
            onClose={() => setDetailOfferModal(null)}
            onSubmit={detailOfferModal.existingOffer ? onUpdatePlayerOffer : onCreatePlayerOffer}
          />
        ) : null}
        <BackButton onBack={onBack} />
        <PlayerDetailSubPage
          player={view.player}
          ownerMember={view.ownerMember}
          currentMemberId={currentMemberId}
          currentMember={currentMember}
          playerOffers={playerOffers}
          playerContracts={playerContracts}
          freeAgentRegistrations={freeAgentRegistrations}
          freePlayerStatus={freePlayerStatus}
          freeAgentQueue={freeAgentQueue}
          ownerPlayerCount={(players || []).filter((item) => same(item.memberid, view.ownerMember?.id) && !isPlayerReleasedByContracts(playerContracts, getPlayerStableId(item))).length}
          canMakeOffer={Boolean(currentMemberId && view.ownerMember?.id && !same(currentMemberId, view.ownerMember.id))}
          isMarketOpen={isMarketOpen}
          members={members}
          onBack={onBack}
          onOffer={openDetailPlayerOffer}
          onCancelOffer={cancelDetailPlayerOffer}
          onAcceptOffer={onAcceptOffer}
          onRejectOffer={onRejectOffer}
          onReleasePlayer={onReleasePlayer}
          onTerminateLoan={onTerminateLoan}
          onRegisterFreeAgentFee={onRegisterFreeAgentFee}
        />
      </main>
    );
  if (view.type === "record")
    return (
      <RecordDetailPage
        record={view.record}
        members={members}
        onBack={onBack}
      />
    );
  if (view.type === "memberTrophy")
    return (
      <RecordsSubPage
        title={`${view.group.name} — ${view.group.count} بطولة`}
        subtitle={`بطولات ${view.member.name}`}
        rows={view.group.rows}
        members={members}
        hideWinner
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  if (view.type === "memberAllTrophies")
    return (
      <MemberAllTrophiesSubPage
        member={view.member}
        groups={view.groups}
        pointEvents={view.pointEvents || []}
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  if (view.type === "memberFinance")
    return (
      <main className="widePage glass">
        <BackButton onBack={onBack} />
        <header className="pageHead">
          <h2>السجل المالي — {view.member.name}</h2>
          <p>كل الحركات المالية الخاصة بالعضو.</p>
        </header>
        <FinanceSection
          config={{ financeTitle: "السجل المالي" }}
          rows={view.rows || []}
          member={view.member}
          members={members}
        />
      </main>
    );
  if (view.type === "memberPlayers")
    return (
      <main className="widePage glass">
        <BackButton onBack={onBack} />
        <header className="pageHead">
          <h2>لاعبو {view.member.name}</h2>
          <p>قائمة لاعبي العضو.</p>
        </header>
        <PlayersSection
          config={{
            playersTitle: "قائمة اللاعبين",
            showSearch: "false",
            searchPlaceholder: "",
          }}
          rows={view.rows || []}
          search=""
          setSearch={() => {}}
          playerCount={(view.rows || []).length}
        />
      </main>
    );
  if (view.type === "memberFinals")
    return (
      <FinalsSubPage
        title={view.title}
        rows={view.rows || []}
        members={members}
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  if (view.type === "seasonTrophy" || view.type === "archiveTrophy")
    return (
      <RecordsSubPage
        title={view.title}
        rows={view.group.rows}
        members={members}
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  if (view.type === "rankingMemberWins") {
    const groups = groupByTrophy(view.rows || [], trophyMap);
    return (
      <MemberAllTrophiesSubPage
        member={{ name: view.member?.name || "العضو" }}
        groups={groups}
        pointEvents={view.pointEvents || view.member?.pointEvents || []}
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  }
  if (view.type === "archiveMemberWins")
    return (
      <RecordsSubPage
        title={view.title}
        subtitle="كل البطولات التي فاز بها العضو في جميع المواسم."
        rows={view.rows || []}
        members={members}
        hideWinner
        onBack={onBack}
        onOpenView={onOpenView}
      />
    );
  return (
    <main className="widePage glass">
      <BackButton onBack={onBack} />
      <div className="empty">لا توجد تفاصيل متاحة لهذا الكرت.</div>
    </main>
  );
}
