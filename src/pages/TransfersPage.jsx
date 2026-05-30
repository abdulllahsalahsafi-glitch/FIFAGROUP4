import React, { useState } from 'react'
import { avatar } from '../utils/ui'
import { cleanId, toNumber, formatMoney, clean, same } from '../utils/helpers'
import { getActiveMembers, dateValue } from '../utils/data'
import { notificationTimeValue } from '../utils/admin'
import { exportBrandLogoUrl } from '../utils/canvas'
import TransferContractModal from '../components/transfers/TransferContractModal'

const FALLBACK_PLAYER_IMAGE = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// ── Local helpers (not yet extracted to utility files) ──────────────────────

function sortMixedRowsDesc(a, b) {
  return (
    dateValue(b.date || b.createdAt || b.createdat) - dateValue(a.date || a.createdAt || a.createdat) ||
    notificationTimeValue(b.createdAt || b.createdat || b.updatedAt || b.updatedat || b.date) - notificationTimeValue(a.createdAt || a.createdat || a.updatedAt || a.updatedat || a.date)
  );
}

function getPlayerStableId(player) {
  return cleanId(player?.playerid || player?.playerId || player?.id || player?.name);
}

function toBooleanFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = clean(value);
  if (!text) return false;
  return ["true", "1", "yes", "y", "on", "active", "نعم", "صح", "صحيح"].includes(text);
}

function isFreeAgentPlayer(player = {}) {
  const text = clean([
    player?.rosterType, player?.rostertype, player?.playerType, player?.playertype,
    player?.registrationType, player?.registrationtype, player?.sourceType, player?.sourcetype,
    player?.status, player?.notes, player?.note, player?.freeAgent, player?.freeagent,
    player?.isFreeAgent, player?.isfreeagent,
  ].join(" "));
  return Boolean(
    text.includes("free_agent") || text.includes("free agent") || text.includes("free") ||
    text.includes("حر") || text.includes("لاعبحر") || text.includes("لاعب حر")
  );
}

function isFreeAgentPoolContract(contract = {}) {
  if (!contract) return false;
  const type = clean(contract.contractType || "");
  const status = clean(contract.status || "active");
  return Boolean(
    status === "active" &&
      !cleanId(contract.currentMemberId) &&
      (type === "free_agent" || type === "freeagent" ||
        toBooleanFlag(contract.availableFreeAgent) || toBooleanFlag(contract.releasedToFreeAgent))
  );
}

function isPlayerReleasedByContracts(contracts = [], playerId = "") {
  const id = cleanId(playerId);
  if (!id) return false;
  return (contracts || []).some((contract) =>
    same(contract.playerId, id) &&
    clean(contract.status || "active") === "active" &&
    (clean(contract.contractType) === "released" || Boolean(contract.permanentlyRemoved))
  );
}

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

function exchangeContractLabel(item = {}) {
  const kind = clean(item.exchangeContractType || item.swapContractType || item.contractMode || item.contractType || "");
  if (kind === "loan") return "إعارة " + loanDurationLabel(item.exchangeLoanDurationMonths || item.loanDurationMonths || 2);
  return "بيع كامل";
}

export default function TransfersPage({
  config,
  periods,
  activePeriodId,
  setTransferPeriod,
  rows,
  players,
  members = [],
  currentMember,
  currentMemberId,
  playerContracts = [],
  freeAgentQueue = [],
  onOpenView,
}) {
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferSearch, setTransferSearch] = useState("");
  const [marketTab, setMarketTab] = useState("history");
  const [freeAgentFilter, setFreeAgentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const normalizedTransferSearch = clean(transferSearch);

  const filteredTransferRows = (rows || []).filter((row) => {
    if (!normalizedTransferSearch) return true;
    return clean([
      row.playerName, row.player, row.name, row.from, row.to,
      row.fromMemberName, row.toMemberName, row.type, row.typeLabel,
      row.note, row.period, row.periodName, row.date,
    ].join(" ")).includes(normalizedTransferSearch);
  });

  // فلترة حسب نوع الصفقة + ترتيب من الأحدث إلى الأقدم
  const displayRows = (typeFilter === "all" ? filteredTransferRows : filteredTransferRows.filter((row) => {
    const t = clean(row.typeLabel || row.type || "");
    if (typeFilter === "buy")  return t.includes("شراء") || t === "buy";
    if (typeFilter === "loan") return t.includes("إعارة") || t === "loan";
    if (typeFilter === "swap") return t.includes("مقايضة") || t === "swap" || t === "exchange";
    if (typeFilter === "free") return t.includes("مجاني") || t === "free" || toNumber(row.amount || 0) === 0;
    return true;
  })).slice().sort(sortMixedRowsDesc);

  // إحصائيات السوق
  const mktVolume = filteredTransferRows.reduce((s, r) => s + toNumber(r.amount || 0), 0);
  const mktMax    = Math.max(0, ...filteredTransferRows.map((r) => toNumber(r.amount || 0)));
  const mktFreq   = {};
  filteredTransferRows.forEach((r) => { const t = r.typeLabel || r.type || "صفقة"; mktFreq[t] = (mktFreq[t] || 0) + 1; });
  const mktTopType = Object.entries(mktFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // تجميع حسب التاريخ
  const timelineGroups = {};
  displayRows.forEach((row) => {
    const d = row.date || "بدون تاريخ";
    if (!timelineGroups[d]) timelineGroups[d] = [];
    timelineGroups[d].push(row);
  });
  const timelineDates = Object.keys(timelineGroups).sort((a, b) => b.localeCompare(a));

  // لون الشارة حسب النوع
  function typeBadgeStyle(row) {
    const t = clean(row.typeLabel || row.type || "");
    if (t.includes("شراء") || t === "buy")   return { bg:"rgba(0,230,118,.14)", bd:"rgba(0,230,118,.28)", cl:"#00E676" };
    if (t.includes("إعارة") || t === "loan") return { bg:"rgba(251,146,60,.14)", bd:"rgba(251,146,60,.30)", cl:"#fb923c" };
    if (t.includes("مقايضة") || t === "swap" || t === "exchange") return { bg:"rgba(129,140,248,.14)", bd:"rgba(129,140,248,.28)", cl:"#818cf8" };
    return { bg:"rgba(255,255,255,.07)", bd:"rgba(255,255,255,.12)", cl:"#9BA0C0" };
  }

  const allFreeAgents = (players || [])
    .map((player) => {
      const playerId = getPlayerStableId(player);
      const activeContract = (playerContracts || []).find((contract) =>
        same(contract.playerId, playerId) && clean(contract.status || "active") === "active"
      );
      const pendingQueue = (freeAgentQueue || []).find((item) =>
        same(item.newPlayerId, playerId) && ["pending_window", "processing"].includes(clean(item.status || "pending_window"))
      );
      const freeAgentPoolAvailable = isFreeAgentPoolContract(activeContract);
      const freeAgentStatusKey = activeContract && !freeAgentPoolAvailable ? "registered" : pendingQueue ? "pending" : "available";
      return { ...player, activeContract, pendingQueue, freeAgentStatusKey, freeAgentPoolAvailable };
    })
    .filter((player) => isFreeAgentPlayer(player) || player.freeAgentPoolAvailable)
    .filter((player) => freeAgentFilter === "all" || player.freeAgentStatusKey === freeAgentFilter)
    .filter((player) => {
      if (!normalizedTransferSearch) return true;
      const status = player.activeContract ? "مسجل" : player.pendingQueue ? "محجوز" : "متاح";
      return clean([player.name, player.position, player.team, player.rating, player.playerType, status].join(" ")).includes(normalizedTransferSearch);
    })
    .sort((a, b) => toNumber(b.rating) - toNumber(a.rating));

  const availableFreeCount = allFreeAgents.filter((player) => !player.activeContract && !player.pendingQueue).length;

  const activeMarketMembers = getActiveMembers(members || []);
  const activeMarketMemberMap = new Map(activeMarketMembers.map((member) => [cleanId(member.id), member]));
  const activeMarketContracts = (playerContracts || []).filter((contract) => clean(contract.status || "active") === "active");

  const allRestrictedPlayers = (players || [])
    .map((player) => {
      const playerId = getPlayerStableId(player);
      if (!playerId || isPlayerReleasedByContracts(playerContracts, playerId)) return null;

      const activeContract = activeMarketContracts.find((contract) => same(contract.playerId, playerId));
      if (activeContract) {
        const contractType = clean(activeContract.contractType || "");
        if (contractType === "released" || isFreeAgentPoolContract(activeContract)) return null;

        const ownerMemberId = cleanId(activeContract.currentMemberId || activeContract.ownerMemberId || activeContract.originalOwnerMemberId || "");
        const ownerMember = activeMarketMemberMap.get(ownerMemberId);
        if (!ownerMember || same(ownerMemberId, "free_agents")) return null;

        return {
          ...player,
          activeContract,
          ownerMember,
          ownerMemberId,
          marketTeamLabel: player.team || player.club || player.teamname || player.clubname || player.playerteam || "",
        };
      }

      const ownerMemberId = cleanId(player.memberid || player.memberId || player.memberID || "");
      const ownerMember = activeMarketMemberMap.get(ownerMemberId);
      if (!ownerMember || isFreeAgentPlayer(player)) return null;

      return {
        ...player,
        activeContract: null,
        ownerMember,
        ownerMemberId,
        marketTeamLabel: player.team || player.club || player.teamname || player.clubname || player.playerteam || "",
      };
    })
    .filter(Boolean)
    .filter((player) => {
      if (!normalizedTransferSearch) return true;
      return clean([
        player.name,
        player.position,
        player.marketTeamLabel,
        player.team,
        player.rating,
      ].join(" ")).includes(normalizedTransferSearch);
    })
    .sort((a, b) => toNumber(b.rating) - toNumber(a.rating) || clean(a.name).localeCompare(clean(b.name), "ar"));

  function getTransferPlayer(row) {
    const playerId = cleanId(row.playerid || row.playerId || row.playerID || row.player_id);
    const fallbackName = row.playerName || row.name || row.player || "لاعب غير مسجل";
    const found = playerId
      ? (players || []).find((player) => same(getPlayerStableId(player), playerId))
      : (players || []).find((player) => clean(player.name) === clean(fallbackName));
    if (!found) return { name: fallbackName, image: row.playerImage || FALLBACK_PLAYER_IMAGE, rating: row.playerRating || "", position: row.playerPosition || "", isFallback: true };
    return { name: row.playerName || row.name || found.name || fallbackName, image: row.playerImage || found.image || FALLBACK_PLAYER_IMAGE, rating: row.playerRating || found.rating || "", position: row.playerPosition || found.position || "", isFallback: false };
  }

  function openTransfer(row, player) { setSelectedTransfer({ row, player }); }

  const tmCss = `
/* ── market intelligence ─────────────────────── */
.mktStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.mktStat{border-radius:18px;padding:12px 10px;background:linear-gradient(145deg,rgba(4,12,28,.90),rgba(6,15,34,.84));border:1px solid rgba(0,230,118,.16);text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px}
.mktV{font-size:clamp(14px,3.5vw,20px);font-weight:900;color:#00E676;direction:ltr;-webkit-text-fill-color:#00E676;line-height:1}
.mktL{font-size:9px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;line-height:1.3;text-align:center}

/* ── type filter chips ───────────────────────── */
.tmTypeFilters{display:flex;gap:7px;margin-bottom:12px;flex-wrap:wrap}
.tmChip{height:32px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(4,12,28,.60);color:#9BA0C0;font-size:12px;font-weight:700;cursor:pointer;-webkit-text-fill-color:#9BA0C0;transition:all .15s;white-space:nowrap}
.tmChip.active,.tmChip:active{background:rgba(0,230,118,.16);border-color:rgba(0,230,118,.38);color:#EDF0FF;-webkit-text-fill-color:#EDF0FF}
.tmChip.buy.active{background:rgba(0,230,118,.16);border-color:rgba(0,230,118,.38);color:#00E676;-webkit-text-fill-color:#00E676}
.tmChip.loan.active{background:rgba(251,146,60,.14);border-color:rgba(251,146,60,.32);color:#fb923c;-webkit-text-fill-color:#fb923c}
.tmChip.swap.active{background:rgba(129,140,248,.14);border-color:rgba(129,140,248,.30);color:#818cf8;-webkit-text-fill-color:#818cf8}

/* ── timeline date header ────────────────────── */
.tmDateGroup{margin-bottom:6px;margin-top:14px}
.tmDateGroup:first-child{margin-top:0}
.tmDateLabel{font-size:11px;font-weight:700;color:#6270A0;padding:0 4px 8px;display:flex;align-items:center;gap:8px}
.tmDateLabel::before{content:"";flex:1;height:1px;background:rgba(0,230,118,.12)}

/* ── new transfer card ───────────────────────── */
.tmCard{box-sizing:border-box;border-radius:22px;padding:14px;background:linear-gradient(145deg,rgba(4,12,28,.90),rgba(6,15,34,.82));border:1px solid rgba(0,230,118,.14);margin-bottom:8px;cursor:pointer;transition:border-color .15s;width:100%;max-width:100%;text-align:right;color:inherit;overflow:hidden}
.tmCard:active{border-color:rgba(0,230,118,.32);background:linear-gradient(145deg,rgba(0,230,118,.06),rgba(6,15,34,.88))}
.tmCardTop{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.tmPlayerImg{width:56px;height:56px;border-radius:18px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,.06)}
.tmPlayerInfo{flex:1;min-width:0;text-align:right}
.tmPlayerName{font-size:clamp(16px,4.2vw,20px);font-weight:900;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmPlayerPos{font-size:11px;font-weight:700;color:#9BA0C0;-webkit-text-fill-color:#9BA0C0;margin-top:3px}
.tmRating{min-width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#00E676,#00D4FF);display:grid;place-items:center;font-size:17px;font-weight:900;color:#02030A;-webkit-text-fill-color:#02030A;flex-shrink:0}
.tmRoute{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:9px 12px;border-radius:14px;background:rgba(0,0,0,.20);border:1px solid rgba(255,255,255,.06)}
.tmRouteFrom,.tmRouteTo{flex:1;font-size:13px;font-weight:900;color:#EDF0FF;-webkit-text-fill-color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmRouteFrom{text-align:right}
.tmRouteTo{text-align:left}
.tmRouteArrow{font-size:16px;color:#00E676;flex-shrink:0}
.tmBadges{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.tmBadge{height:26px;display:inline-flex;align-items:center;gap:4px;padding:0 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.tmSwapPreview{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07)}
.tmSwapPreview span{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#9BA0C0;background:rgba(129,140,248,.10);border:1px solid rgba(129,140,248,.20);border-radius:999px;padding:3px 9px 3px 6px}
.tmSwapPreview span img{width:20px;height:20px;border-radius:6px;object-fit:cover}
.tmContractBtn{margin-top:10px;width:100%;height:34px;border-radius:12px;border:1px solid rgba(0,230,118,.22);background:rgba(0,230,118,.06);color:#00E676;font-size:12px;font-weight:700;cursor:pointer;-webkit-text-fill-color:#00E676;transition:background .15s}
.tmContractBtn:active{background:rgba(0,230,118,.14)}
.restrictedPlayerCard{padding:10px 12px;border-radius:20px;margin-bottom:7px;min-height:84px}
.restrictedPlayerCard .tmCardTop{margin-bottom:0;gap:10px}
.restrictedPlayerCard .tmPlayerImg{width:52px;height:52px;border-radius:16px}
.restrictedPlayerCard .tmRating{min-width:46px;height:46px;border-radius:15px;font-size:18px}
.restrictedPlayerCard .tmPlayerName{font-size:clamp(16px,4.6vw,22px);line-height:1.15}
.restrictedPlayerBadges{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-start;margin-top:7px}
.restrictedPlayerBadge{height:26px;display:inline-flex;align-items:center;padding:0 12px;border-radius:999px;font-size:12px;font-weight:900;white-space:nowrap}
.freeAgentsGrid{width:100%;max-width:100%;box-sizing:border-box;overflow:hidden;display:grid;gap:8px}
.freeAgentsGrid .restrictedPlayerCard{width:100%;max-width:100%;box-sizing:border-box;overflow:hidden}
.restrictedPlayerCard .tmCardTop{width:100%;max-width:100%;box-sizing:border-box}
.restrictedPlayerCard .tmPlayerInfo{min-width:0;overflow:hidden}
.restrictedPlayerCard .tmRating{flex:0 0 auto}
@media(max-width:420px){
  .mktStrip{grid-template-columns:repeat(2,1fr)}
  .mktV{font-size:clamp(13px,3vw,18px)}
  .tmCardTop{gap:10px}
  .tmPlayerImg{width:48px;height:48px;border-radius:16px}
  .tmRating{min-width:38px;height:38px;font-size:15px;border-radius:12px}
}`;

  return (
    <main className="widePage glass">
      <style>{tmCss}</style>
      <header className="pageHead">
        <h2>سوق الانتقالات</h2>
        <p>سجل الصفقات واللاعبون الأحرار في مكان واحد.</p>
      </header>

      <nav className="tabs">
        <button className={marketTab === "history" ? "tabBtn active" : "tabBtn"} onClick={() => setMarketTab("history")}>سجل الانتقالات</button>
        <button className={marketTab === "free" ? "tabBtn active" : "tabBtn"} onClick={() => setMarketTab("free")}>اللاعبون الأحرار</button>
        <button className={marketTab === "restricted" ? "tabBtn active" : "tabBtn"} onClick={() => setMarketTab("restricted")}>اللاعبون المقيدون</button>
      </nav>

      {marketTab === "history" ? (
        <>
          {/* ── شريط ذكاء السوق ────────────────────── */}
          <div className="mktStrip">
            <div className="mktStat">
              <span className="mktV">{filteredTransferRows.length}</span>
              <span className="mktL">إجمالي الصفقات</span>
            </div>
            <div className="mktStat">
              <span className="mktV">{formatMoney(mktVolume)}</span>
              <span className="mktL">حجم السوق</span>
            </div>
            <div className="mktStat">
              <span className="mktV">{formatMoney(mktMax)}</span>
              <span className="mktL">أغلى صفقة</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{fontSize:"clamp(10px,2.5vw,14px)"}}>{mktTopType}</span>
              <span className="mktL">الأكثر تداولاً</span>
            </div>
          </div>

          {/* ── بحث ──────────────────────────────────── */}
          <label className="transferSearchBox glassSoft">
            <span>بحث في سجل الانتقالات</span>
            <input value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} placeholder="ابحث باسم لاعب، عضو، تاريخ..." />
          </label>

          {/* ── فلاتر النوع ───────────────────────────── */}
          <div className="tmTypeFilters">
            {[
              { key:"all",  label:"الكل" },
              { key:"buy",  label:"شراء",    cls:"buy" },
              { key:"loan", label:"إعارة",   cls:"loan" },
              { key:"swap", label:"مقايضة",  cls:"swap" },
              { key:"free", label:"مجاني",   cls:"" },
            ].map(({ key, label, cls }) => (
              <button key={key} className={`tmChip ${cls || ""} ${typeFilter === key ? "active" : ""}`} onClick={() => setTypeFilter(key)}>{label}</button>
            ))}
          </div>

          {/* ── تبويب الفترات ────────────────────────── */}
          <nav className="tabs">
            {periods.map((period, idx) => (
              <button key={period.id} className={same(period.id, activePeriodId) ? "tabBtn active" : "tabBtn"} onClick={() => setTransferPeriod(period.id)}>
                {period.name || `الفترة ${idx + 1}`}
              </button>
            ))}
          </nav>

          {/* ── التايم لاين ──────────────────────────── */}
          {displayRows.length ? (
            <div className="transferList">
              {timelineDates.map((date) => (
                <div className="tmDateGroup" key={date}>
                  <div className="tmDateLabel">{date}</div>
                  {timelineGroups[date].map((row, idx) => {
                    const player  = getTransferPlayer(row);
                    const bs      = typeBadgeStyle(row);
                    const isLoan  = isLoanTransferRow(row);
                    const hasSwap = Array.isArray(row.offeredPlayers) && row.offeredPlayers.length > 0;
                    return (
                      <article className="tmCard" key={String(row.id || idx)} onClick={() => openTransfer(row, player)}>

                        {/* صورة اللاعب + الاسم + التقييم */}
                        <div className="tmCardTop">
                          <img className="tmPlayerImg" src={player.image} alt={player.name} />
                          <div className="tmPlayerInfo">
                            <div className="tmPlayerName">{player.name}</div>
                            {player.position ? <div className="tmPlayerPos">{player.position}</div> : null}
                          </div>
                          {player.rating ? <div className="tmRating">{player.rating}</div> : null}
                        </div>

                        {/* مسار الانتقال */}
                        <div className="tmRoute">
                          <span className="tmRouteFrom">{row.fromMemberName || row.from || "—"}</span>
                          <span className="tmRouteArrow">←</span>
                          <span className="tmRouteTo">{row.toMemberName || row.to || "—"}</span>
                        </div>

                        {/* الشارات */}
                        <div className="tmBadges">
                          <span className="tmBadge" style={{background:bs.bg,border:`1px solid ${bs.bd}`,color:bs.cl,WebkitTextFillColor:bs.cl}}>
                            {row.typeLabel || row.type || "صفقة"}
                          </span>
                          {toNumber(row.amount || 0) > 0 ? (
                            <span className="tmBadge" style={{background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.18)",color:"#00E676",WebkitTextFillColor:"#00E676"}}>
                              💰 {formatMoney(row.amount)}
                            </span>
                          ) : null}
                          {isLoan ? (
                            <span className="tmBadge" style={{background:"rgba(251,146,60,.10)",border:"1px solid rgba(251,146,60,.22)",color:"#fb923c",WebkitTextFillColor:"#fb923c"}}>
                              ⏳ {loanDurationLabel(row.loanDurationMonths)}
                            </span>
                          ) : null}
                          {row.note && row.note !== "-" && !isLoan ? (
                            <span className="tmBadge" style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.11)",color:"#9BA0C0",WebkitTextFillColor:"#9BA0C0"}}>
                              {row.note}
                            </span>
                          ) : null}
                        </div>

                        {/* لاعبو المقايضة */}
                        {hasSwap ? (
                          <div className="tmSwapPreview">
                            {row.offeredPlayers.map((item, si) => (
                              <span key={item.playerId || item.playerName || si}>
                                <img src={item.playerImage || item.image || FALLBACK_PLAYER_IMAGE} alt="" />
                                {item.playerName || item.name || "لاعب"} • {exchangeContractLabel(item)}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <button type="button" className="tmContractBtn" onClick={(e) => { e.stopPropagation(); openTransfer(row, player); }}>
                          عرض العقد
                        </button>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">لا توجد انتقالات مطابقة.</div>
          )}
        </>
      ) : marketTab === "free" ? (
        <>
          {/* ── شريط إحصاء اللاعبين الأحرار ─────────── */}
          <div className="mktStrip">
            <div className="mktStat">
              <span className="mktV">{allFreeAgents.length}</span>
              <span className="mktL">إجمالي</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#00E676",WebkitTextFillColor:"#00E676"}}>
                {allFreeAgents.filter(p => !p.activeContract && !p.pendingQueue).length}
              </span>
              <span className="mktL">متاح</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#9BA0C0",WebkitTextFillColor:"#9BA0C0"}}>
                {allFreeAgents.filter(p => p.activeContract && !p.freeAgentPoolAvailable).length}
              </span>
              <span className="mktL">مسجل</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#fb923c",WebkitTextFillColor:"#fb923c"}}>
                {allFreeAgents.filter(p => p.pendingQueue).length}
              </span>
              <span className="mktL">بانتظار القيد</span>
            </div>
          </div>

          {/* ── بحث ──────────────────────────────────── */}
          <label className="transferSearchBox glassSoft">
            <span>بحث في اللاعبين الأحرار</span>
            <input value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} placeholder="ابحث باسم لاعب، مركز، فريق أو تقييم..." />
          </label>

          {/* ── فلاتر الحالة ──────────────────────────── */}
          <div className="tmTypeFilters">
            <button className={`tmChip ${freeAgentFilter==="all"?"active":""}`}       onClick={()=>setFreeAgentFilter("all")}>الكل</button>
            <button className={`tmChip buy ${freeAgentFilter==="available"?"active":""}`}  onClick={()=>setFreeAgentFilter("available")}>متاح</button>
            <button className={`tmChip ${freeAgentFilter==="registered"?"active":""}`} onClick={()=>setFreeAgentFilter("registered")}>مسجل</button>
            <button className={`tmChip loan ${freeAgentFilter==="pending"?"active":""}`}   onClick={()=>setFreeAgentFilter("pending")}>بانتظار القيد</button>
          </div>

          {/* ── قائمة اللاعبين ────────────────────────── */}
          <div className="freeAgentsGrid">
            {allFreeAgents.length ? allFreeAgents.map((player, index) => {
              const unavailable = Boolean((player.activeContract && !player.freeAgentPoolAvailable) || player.pendingQueue);
              const teamLabel = player.team || player.club || player.teamname || player.clubname || player.playerteam || "";
              return (
                <article
                  className={unavailable ? "tmCard restrictedPlayerCard freeAgentUnavailable" : "tmCard restrictedPlayerCard"}
                  key={String(getPlayerStableId(player) || player.name || index)}
                  style={{opacity: unavailable ? .75 : 1}}
                  onClick={() => {
                    const ownerMember = player.activeContract && !player.freeAgentPoolAvailable && player.activeContract.currentMemberId
                      ? members.find((m) => same(m.id, player.activeContract.currentMemberId))
                      : { id:"", name:"" };
                    if (!onOpenView) return;
                    onOpenView({ type:"playerDetailOffer", player, ownerMember });
                  }}
                >
                  <div className="tmCardTop">
                    <img className="tmPlayerImg" src={player.image || avatar(player.name)} alt="" />
                    <div className="tmPlayerInfo">
                      <div className="tmPlayerName">{player.name}</div>
                      <div className="restrictedPlayerBadges">
                        {player.position ? <span className="restrictedPlayerBadge" style={{background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.18)",color:"#BFFFE0",WebkitTextFillColor:"#BFFFE0"}}>{player.position}</span> : null}
                        {teamLabel ? <span className="restrictedPlayerBadge" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.10)",color:"#BDC5DE",WebkitTextFillColor:"#BDC5DE"}}>{teamLabel}</span> : null}
                      </div>
                    </div>
                    {player.rating ? <div className="tmRating">{player.rating}</div> : null}
                  </div>
                </article>
              );
            }) : <div className="empty">لا توجد لاعبين أحرار مطابقين للبحث.</div>}
          </div>
        </>
      ) : (
        <>
          {/* ── شريط إحصاء اللاعبين المقيدين ─────────── */}
          <div className="mktStrip">
            <div className="mktStat">
              <span className="mktV">{allRestrictedPlayers.length}</span>
              <span className="mktL">إجمالي</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#00E676",WebkitTextFillColor:"#00E676"}}>
                {new Set(allRestrictedPlayers.map((player) => clean(player.marketTeamLabel || player.team)).filter(Boolean)).size}
              </span>
              <span className="mktL">فريق</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#00E676",WebkitTextFillColor:"#00E676"}}>
                {Math.max(0, ...allRestrictedPlayers.map((player) => toNumber(player.rating || 0)))}
              </span>
              <span className="mktL">أعلى تقييم</span>
            </div>
            <div className="mktStat">
              <span className="mktV" style={{color:"#9BA0C0",WebkitTextFillColor:"#9BA0C0"}}>
                {new Set(allRestrictedPlayers.map((player) => clean(player.position)).filter(Boolean)).size}
              </span>
              <span className="mktL">مركز</span>
            </div>
          </div>

          {/* ── بحث ──────────────────────────────────── */}
          <label className="transferSearchBox glassSoft">
            <span>بحث في اللاعبين المقيدين</span>
            <input value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} placeholder="ابحث باسم لاعب، مركز، فريق أو تقييم..." />
          </label>

          {/* ── قائمة اللاعبين المقيدين ───────────────── */}
          <div className="freeAgentsGrid">
            {allRestrictedPlayers.length ? allRestrictedPlayers.map((player, index) => {
              const teamLabel = player.marketTeamLabel || player.team || "";
              return (
                <article
                  className="tmCard restrictedPlayerCard"
                  key={String(getPlayerStableId(player) || player.name || index)}
                  onClick={() => {
                    if (!onOpenView) return;
                    onOpenView({ type:"playerDetailOffer", player, ownerMember: player.ownerMember });
                  }}
                >
                  <div className="tmCardTop">
                    <img className="tmPlayerImg" src={player.image || avatar(player.name)} alt="" />
                    <div className="tmPlayerInfo">
                      <div className="tmPlayerName">{player.name}</div>
                      <div className="restrictedPlayerBadges">
                        {player.position ? <span className="restrictedPlayerBadge" style={{background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.18)",color:"#BFFFE0",WebkitTextFillColor:"#BFFFE0"}}>{player.position}</span> : null}
                        {teamLabel ? <span className="restrictedPlayerBadge" style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.10)",color:"#BDC5DE",WebkitTextFillColor:"#BDC5DE"}}>{teamLabel}</span> : null}
                      </div>
                    </div>
                    {player.rating ? <div className="tmRating">{player.rating}</div> : null}
                  </div>
                </article>
              );
            }) : <div className="empty">لا توجد لاعبين مقيدين مطابقين للبحث.</div>}
          </div>
        </>
      )}

      {selectedTransfer ? (
        <TransferContractModal row={selectedTransfer.row} player={selectedTransfer.player} logoUrl={exportBrandLogoUrl(config)} onClose={() => setSelectedTransfer(null)} />
      ) : null}
    </main>
  );
}
