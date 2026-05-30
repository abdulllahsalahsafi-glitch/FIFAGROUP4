import React from 'react';
import { getPlayerStableId, same, toNumber, isActivePlayerOfferStatus, isOfferExpired } from '../../utils';

export default function PlayerOfferAction({ player, currentMemberId, playerOffers, onOffer, onCancelOffer }) {
  const playerId = getPlayerStableId(player);
  const existingOffer = (playerOffers || []).find((offer) =>
    same(offer.fromMemberId, currentMemberId) &&
    same(offer.targetPlayerId, playerId) &&
    isActivePlayerOfferStatus(offer.status) &&
    !isOfferExpired(offer)
  );

  if (!existingOffer) {
    return (
      <div className="playerOfferActions oneAction">
        <button type="button" className="playerOfferButton" onClick={() => onOffer?.(player, null)}>
          تقديم عرض
        </button>
      </div>
    );
  }

  const canEdit = toNumber(existingOffer.editCount) < toNumber(existingOffer.maxEdits || 1);

  if (canEdit) {
    return (
      <div className="playerOfferActions forceTwoActions">
        <button type="button" className="playerOfferButton edit" onClick={() => onOffer?.(player, existingOffer)}>
          تعديل العرض
        </button>
        <button type="button" className="playerOfferButton cancel" onClick={() => onCancelOffer?.(existingOffer)}>
          إلغاء العرض
        </button>
      </div>
    );
  }

  return (
    <div className="playerOfferActions oneAction">
      <button type="button" className="playerOfferButton cancel" onClick={() => onCancelOffer?.(existingOffer)}>
        إلغاء العرض
      </button>
    </div>
  );
}
