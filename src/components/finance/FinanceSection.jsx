import React from 'react';
import { stripIcon } from '../../constants';
import {
  cleanId, formatMoney,
  computeMemberBalance, getFinanceDirection, getFinanceSignedAmount,
  getFinanceRecordNote, getFinanceDisplayTitle, getFinanceRecordDate, financeTypeClass,
} from '../../utils';

const financeSectionScopedCss = `
.fgFinanceSection{
  overflow:hidden;
}

.fgFinanceHead{
  display:grid;
  grid-template-columns:minmax(0,1fr);
  gap:10px;
  padding:12px;
}

.fgFinanceTitleRow{
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:10px;
  align-items:center;
  direction:ltr;
}

.fgFinanceDownloadBtn{
  grid-column:1;
  justify-self:start;
  width:42px;
  height:42px;
  padding:0;
  border-radius:16px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.25);
  box-shadow:0 0 22px rgba(0,230,118,.12), inset 0 1px 0 rgba(255,255,255,.07);
}

.fgFinanceDownloadBtn svg{
  width:21px;
  height:21px;
  stroke:currentColor;
  stroke-width:2.4;
  fill:none;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.fgFinanceHeadTitle{
  grid-column:2;
  margin:0;
  min-width:0;
  direction:rtl;
  text-align:right;
  line-height:1.25;
}

.fgFinanceHeadNote{
  margin:6px 0 0;
  direction:rtl;
  text-align:right;
}

.fgFinanceBalancePill{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  text-align:right;
  direction:rtl;
}

.fgFinanceList{
  display:grid;
  gap:10px;
}

.fgFinanceCard{
  display:grid;
  grid-template-columns:minmax(0,1fr);
  gap:12px;
  min-width:0;
  padding:14px;
  border-radius:22px;
  overflow:hidden;
  direction:rtl;
  text-align:right;
}

.fgFinanceCardTop{
  width:100%;
  min-width:0;
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  grid-template-areas:"date amount";
  gap:12px;
  align-items:start;
  direction:ltr;
}

.fgFinanceDate{
  grid-area:date;
  justify-self:start;
  direction:ltr;
  unicode-bidi:plaintext;
  white-space:nowrap;
  text-align:left;
  font-weight:900;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  line-height:1.1;
  padding-top:5px;
}

.fgFinanceAmount{
  grid-area:amount;
  justify-self:end;
  min-width:0;
  max-width:100%;
  display:block;
  direction:ltr;
  unicode-bidi:plaintext;
  white-space:nowrap;
  text-align:right;
  line-height:1.02;
  font-size:clamp(22px,5.7vw,34px);
  font-weight:1000;
  letter-spacing:-.035em;
}

.fgFinanceAmount.long{
  font-size:clamp(20px,5.1vw,30px);
  letter-spacing:-.045em;
}

.fgFinanceAmount.veryLong{
  font-size:clamp(18px,4.5vw,27px);
  letter-spacing:-.055em;
}

.fgFinanceCard.income .fgFinanceAmount,
.fgFinanceAmount.income{
  color:#86efac;
  -webkit-text-fill-color:#86efac;
}

.fgFinanceCard.expense .fgFinanceAmount,
.fgFinanceAmount.expense{
  color:#fca5a5;
  -webkit-text-fill-color:#fca5a5;
}

.fgFinanceCard.neutral .fgFinanceAmount,
.fgFinanceAmount.neutral{
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}

.fgFinanceAction{
  width:100%;
  min-width:0;
  direction:rtl;
  text-align:right;
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:normal;
  word-break:normal;
  line-height:1.35;
  font-size:clamp(18px,4.7vw,25px);
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
}

.fgFinanceDescription{
  width:100%;
  min-width:0;
  margin:0;
  direction:rtl;
  text-align:right;
  white-space:normal;
  overflow:visible;
  text-overflow:clip;
  overflow-wrap:normal;
  word-break:normal;
  line-height:1.55;
  max-height:none;
  -webkit-line-clamp:unset;
  -webkit-box-orient:initial;
  color:#DDE5F8;
  -webkit-text-fill-color:#DDE5F8;
  font-size:clamp(15px,4.1vw,21px);
}

@media(max-width:720px){
  .fgFinanceHead{
    padding:11px;
  }

  .fgFinanceDownloadBtn{
    width:40px;
    height:40px;
    border-radius:15px;
  }

  .fgFinanceDownloadBtn svg{
    width:20px;
    height:20px;
  }

  .fgFinanceCard{
    padding:13px;
    border-radius:20px;
    gap:11px;
  }

  .fgFinanceCardTop{
    gap:9px;
  }

  .fgFinanceDate{
    font-size:13px;
    padding-top:4px;
  }

  .fgFinanceAmount{
    font-size:clamp(21px,5.4vw,32px);
  }

  .fgFinanceAmount.long{
    font-size:clamp(19px,4.8vw,28px);
  }

  .fgFinanceAmount.veryLong{
    font-size:clamp(17px,4.3vw,25px);
  }
}

@media(max-width:390px){
  .fgFinanceCardTop{
    gap:7px;
  }

  .fgFinanceDate{
    font-size:12px;
  }

  .fgFinanceAmount{
    font-size:clamp(20px,5vw,29px);
  }

  .fgFinanceAmount.long{
    font-size:clamp(18px,4.5vw,26px);
  }

  .fgFinanceAmount.veryLong{
    font-size:clamp(16px,4.1vw,24px);
  }
}
`;

function amountSizeClass(amountText = "") {
  const digits = String(amountText || "").replace(/[^0-9]/g, "").length;
  if (digits >= 11) return "veryLong";
  if (digits >= 9) return "long";
  return "";
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export default function FinanceSection({ config, rows, member, members = [], onDownload }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const memberId = cleanId(member?.id || member?.memberId || member?.memberid);
  const balance = computeMemberBalance(safeRows, 0, memberId);

  return (
    <section className="sectionBox glassSoft fgFinanceSection" dir="rtl">
      <style>{financeSectionScopedCss}</style>

      <div className="sectionHead compact fgFinanceHead">
        <div className="fgFinanceTitleBlock">
          <div className="fgFinanceTitleRow">
            {onDownload ? (
              <button
                type="button"
                className="fgFinanceDownloadBtn"
                title="تحميل صورة السجل المالي"
                onClick={onDownload}
                aria-label="تحميل صورة السجل المالي"
              >
                <DownloadIcon />
              </button>
            ) : <span />}
            <h3 className="fgFinanceHeadTitle">{stripIcon(config.financeTitle)}</h3>
          </div>
          <p className="fgFinanceHeadNote">الحركات المالية المسجلة</p>
        </div>

        <div className="financeBalancePill fgFinanceBalancePill">
          <small>الرصيد الحالي</small>
          <b>{formatMoney(balance)}</b>
        </div>
      </div>

      <div className="listGrid fgFinanceList">
        {safeRows.length ? (
          safeRows.map((item, index) => {
            const direction = getFinanceDirection(item, memberId);
            const signedAmount = getFinanceSignedAmount(item, memberId);
            const amountText = formatMoney(Math.abs(signedAmount));
            const sizeClass = amountSizeClass(amountText);
            const cardClass = financeTypeClass(item, memberId) || direction || "neutral";

            return (
              <article
                className={`fgFinanceCard ${cardClass}`}
                key={String(item.id || index)}
                dir="rtl"
              >
                <div className="fgFinanceCardTop">
                  <time className="fgFinanceDate">{getFinanceRecordDate(item)}</time>
                  <strong className={`fgFinanceAmount ${direction || "neutral"} ${sizeClass}`}>
                    {direction === "income" ? "+" : direction === "expense" ? "−" : ""}
                    {amountText}
                  </strong>
                </div>

                <div className="fgFinanceAction">
                  {getFinanceDisplayTitle(item, memberId, members)}
                </div>

                <p className="fgFinanceDescription">
                  {getFinanceRecordNote(item)}
                </p>
              </article>
            );
          })
        ) : (
          <div className="empty">لا يوجد سجل مالي لهذا العضو.</div>
        )}
      </div>
    </section>
  );
}
