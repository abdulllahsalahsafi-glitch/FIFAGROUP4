import React from 'react';
import { createPortal } from 'react-dom';
import { clean, same, toNumber } from '../../utils/helpers';
import { formatTransferDate, formatMoney } from '../../utils/helpers';

const FALLBACK_PLAYER_IMAGE = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// ── Local helpers (not yet extracted to utility files) ──────────────────────

function isLoanTransferRow(row = {}) {
  const value = clean([row?.type, row?.typeLabel, row?.contractType].join(" "));
  return value.includes("loan") || value.includes("إعارة") || value.includes("اعارة");
}

function loanDurationLabel(months) {
  const value = toNumber(months);
  if (value === 2) return "شهرين";
  if (value === 4) return "4 شهور";
  if (value === 6) return "6 شهور";
  return value ? value + " شهور" : "-";
}

function getTransferContractParties(row = {}) {
  const loan = isLoanTransferRow(row);
  const seller = row?.fromMemberName || row?.from || row?.previousMemberName || "-";
  const buyer = row?.toMemberName || row?.to || row?.currentMemberName || "-";
  const realOwner = row?.originalOwnerMemberName || row?.ownerMemberName || row?.realOwnerMemberName || seller || "-";
  return {
    from: loan ? realOwner : seller,
    to: buyer,
    fromLabel: loan ? "المالك الحقيقي" : "من",
    toLabel: loan ? "المستعير" : "إلى",
    signerFromLabel: loan ? "توقيع المالك الحقيقي" : "توقيع الطرف الأول",
    signerToLabel: loan ? "توقيع المستلم" : "توقيع الطرف الثاني",
  };
}

function effectiveTransferStatusLabel(row = {}) {
  const transferStatusLabel = (status) => {
    const value = clean(status || "");
    if (value === "completed") return "مكتملة";
    if (value === "approvedpendingwindow") return "بانتظار فتح السوق";
    if (value === "active") return "نشطة";
    if (value === "terminated") return "منتهية";
    if (value === "cancelled") return "ملغاة";
    return status || "مسجلة";
  };
  if (clean(row?.status) === "approvedpendingwindow" && (row?.marketWasOpenAtApproval || row?.loanStartDate || row?.completedAt)) return "مكتملة";
  return transferStatusLabel(row?.status);
}

function formatContractIssuedAt(row = {}) {
  const raw = row?.approvedAt || row?.createdAt || row?.updatedAt || row?.date || null;
  let date = null;
  if (raw?.toDate) date = raw.toDate();
  else if (raw?.seconds) date = new Date(Number(raw.seconds) * 1000);
  else if (typeof raw === "string" && raw.length > 10) date = new Date(raw);
  if (!date || Number.isNaN(date.getTime())) date = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function exchangeContractLabel(item = {}) {
  const kind = clean(item.exchangeContractType || item.swapContractType || item.contractMode || item.contractType || "");
  if (kind === "loan") return "إعارة " + loanDurationLabel(item.exchangeLoanDurationMonths || item.loanDurationMonths || 2);
  return "بيع كامل";
}

// NOTE: downloadTransferContractImage is a large canvas function still in App.jsx.
// This stub will be replaced once that function is extracted to canvas utils.
function downloadTransferContractImage(row = {}, player = {}, logoUrl = "") {
  console.warn("downloadTransferContractImage not yet extracted to canvas utils");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TransferContractModal({ row, player, logoUrl = "", onClose }) {
  const parties = getTransferContractParties(row);
  const loan = isLoanTransferRow(row);
  const contractTitle = row?.typeLabel || (loan ? "عقد إعارة" : clean(row?.type) === "buy" ? "عقد شراء" : row?.type || "صفقة");
  const amountLabel = formatMoney(row?.amount || row?.rawAmount || row?.amountNumber || 0);
  const offeredPlayers = Array.isArray(row?.offeredPlayers) ? row.offeredPlayers : [];

  function handleDownload() {
    downloadTransferContractImage(row, player, logoUrl);
  }

  return createPortal(
    <div className="offerModalBackdrop" onClick={onClose}>
      <section className="transferContractModal glass" onClick={(event) => event.stopPropagation()} dir="rtl">
        <header>
          <div>
            <small>FIFA GROUP</small>
            <h3>العقد الخاص بالصفقة</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>

        <div className="transferContractCard glassSoft">
          <div className="contractWatermark">FG</div>
          <div className="contractTopLine">
            <span>{row?.period || row?.periodName || "سوق الانتقالات"}</span>
            <b>{contractTitle}</b>
          </div>
          <div className="contractPlayerBlock">
            <img src={player?.image || row?.playerImage || FALLBACK_PLAYER_IMAGE} alt="" />
            <div>
              <h2>{player?.name || row?.playerName || row?.player || "لاعب"}</h2>
              <p>{player?.position || row?.playerPosition || ""}</p>
            </div>
            <strong>{player?.rating || row?.playerRating || "-"}</strong>
          </div>
          <div className="contractRoute">
            <div><small>{parties.fromLabel}</small><b>{parties.from}</b></div>
            <span>←</span>
            <div><small>{parties.toLabel}</small><b>{parties.to}</b></div>
          </div>
          <div className="contractMetaGrid">
            <div><small>قيمة الصفقة</small><b>{amountLabel}</b></div>
            {loan ? <div><small>مدة الإعارة</small><b>{loanDurationLabel(row?.loanDurationMonths)}</b></div> : null}
            {loan ? <div><small>بداية الإعارة</small><b>{row?.loanStartDate || row?.date || formatTransferDate(row?.createdAt)}</b></div> : null}
            <div><small>تاريخ الإصدار</small><b>{formatContractIssuedAt(row)}</b></div>
            <div><small>الحالة</small><b>{effectiveTransferStatusLabel(row)}</b></div>
          </div>
          {offeredPlayers.length ? (
            <div className="contractSwapPlayers">
              <small>لاعبون ضمن المقابل</small>
              <div>
                {offeredPlayers.map((item, index) => (
                  <span key={item.playerId || item.playerName || index}>
                    <img src={item.playerImage || item.image || FALLBACK_PLAYER_IMAGE} alt="" />
                    <b>{item.playerName || item.name || "لاعب"} • {exchangeContractLabel(item)}</b>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="contractSignatures">
            <div><span /> <b>{parties.from || "الطرف الأول"}</b><small>{parties.signerFromLabel}</small></div>
            <div><span /> <b>{parties.to || "الطرف الثاني"}</b><small>{parties.signerToLabel}</small></div>
          </div>
        </div>

        <button type="button" className="offerSubmitBtn" onClick={handleDownload}>حفظ العقد كصورة PNG</button>
      </section>
    </div>,
    document.body
  );
}
