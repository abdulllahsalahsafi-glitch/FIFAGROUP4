import React, { useState, useEffect, useMemo, useRef } from 'react'
import { stripIcon } from '../constants'
import { renderSmartIcon, avatar, formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean, isEnabled } from '../utils/helpers'
import { sortRecordsDesc, isFifaSystemMember } from '../utils/data'
import { getSeasonCenterCompetitionMatches, isSeasonCenterOpenMatch, isSeasonCenterActiveOffer } from '../utils/seasonCenter'
import { getInitialPushStatus } from '../utils/admin'
import { buildLinkedLeagueCupDisplayCompetition } from '../utils/competition'
import { myProfileCss } from './MyProfilePage'
import TabButton from '../components/ui/TabButton'
import TransferRestrictionBanner from '../components/ui/TransferRestrictionBanner'
import FinanceSection from '../components/finance/FinanceSection'
import MemberTrophiesSection from '../components/members/MemberTrophiesSection'
import MemberStatsSection from '../components/members/MemberStatsSection'
import NotificationsPanel from '../components/notifications/NotificationsPanel'
import MoneyTransferModal from '../components/modals/MoneyTransferModal'
import ActiveSeasonMembersPanel from '../components/members/ActiveSeasonMembersPanel'
import PlayerOfferModal from '../components/modals/PlayerOfferModal'
import MemberDealsSection from '../components/members/MemberDealsSection'
import MemberOffersSection from '../components/members/MemberOffersSection'
import PlayersSection from '../components/players/PlayersSection'
import PlayerDetailSubPage from './PlayerDetailSubPage'
import HistoricalMembersStatsShowcase from '../components/members/HistoricalMembersStatsShowcase'
import { downloadMyProfileSummaryImage, exportBrandLogoUrl, downloadMemberFinanceImage } from '../utils/canvas'
import { ProfileMatchesSection } from '../components/competition/CompetitionViewerSection'

// NOTE: buildLinkedLeagueCupDisplayCompetition is still in App.jsx and will be extracted in a future step.

export default function MembersPage(props) {
  const {
    config,
    rankedMembers,
    members,
    selectedMember,
    selectedMemberId,
    totalForMember,
    setSelectedId,
    memberTab,
    setMemberTab,
    players,
    trophies,
    finance,
    financeBalance,
    currentMemberId,
    isFifaAdmin = false,
    currentMemberBalance,
    currentMemberAvailableBalance,
    currentMemberPlayers,
    playerContracts = [],
    playerOffers,
    freeAgentRegistrations = [],
    freePlayerStatus = [],
    freeAgentQueue = [],
    memberRestrictions = [],
    currentMemberRestrictions = [],
    transferHistory = [],
    allPlayerOffers = [],
    notifications = [],
    pushStatus = getInitialPushStatus(),
    pushBusy = false,
    onEnablePushNotifications,
    onDisablePushNotifications,
    onOpenNotification,
    onClearNotifications,
    onCreateMoneyTransfer,
    onCreatePlayerOffer,
    onUpdatePlayerOffer,
    onCancelPlayerOffer,
    onAcceptOffer,
    onRejectOffer,
    onReleasePlayer,
    onTerminateLoan,
    onRegisterFreeAgentFee,
    isMarketOpen,
    stats,
    selectedMemberProCount = 0,
    allTournaments = [],
    statsMap = {},
    search,
    setSearch,
    onOpenView,
    onInfo,
    onOpenMyProfile,
    competitions = [],
    onOpenCompetition,
  } = props;

  const [moneyModal, setMoneyModal] = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [memberSearch, setMemberSearch] = useState(search||"");
  const playerDetailReturnScrollRef = useRef(0);
  const canSendMoney = Boolean(currentMemberId && selectedMember?.id && !same(currentMemberId, selectedMember.id));
  const isCurrentMemberProfile = Boolean(currentMemberId && selectedMember?.id && same(currentMemberId, selectedMember.id));
  const canViewMemberOffers = Boolean(isCurrentMemberProfile || isFifaAdmin);
  const activeProfileCompetitions = (competitions || [])
    .filter((competition) => !["completed", "cancelled", "deleted", "archived"].includes(clean(competition.status || "active")))
    .map((competition) => buildLinkedLeagueCupDisplayCompetition(competition, competitions || []));
  const memberOpenMatches = selectedMemberId
    ? activeProfileCompetitions
        .flatMap((competition) => getSeasonCenterCompetitionMatches(competition))
        .filter(({ match }) => isSeasonCenterOpenMatch(match) && (same(match.homeMemberId, selectedMemberId) || same(match.awayMemberId, selectedMemberId)))
    : [];

  useEffect(() => {
    if (memberTab === "offers" && !canViewMemberOffers) {
      setMemberTab("players");
    }
  }, [memberTab, canViewMemberOffers, setMemberTab]);

  useEffect(() => {
    if (!playerDetail) return undefined;

    function handlePlayerDetailBack(event) {
      event.stopImmediatePropagation?.();
      closePlayerDetail();
      try {
        window.history.replaceState({ fifaGroupMember: true }, "");
      } catch {}
    }

    window.addEventListener("popstate", handlePlayerDetailBack, true);
    return () => window.removeEventListener("popstate", handlePlayerDetailBack, true);
  }, [playerDetail]);

  function openMoneyTransfer(prefillMember = null) {
    setMoneyModal({ toMemberId: prefillMember?.id || "" });
  }

  function openPlayerOffer(player, existingOffer = null, targetMember = null) {
    setOfferModal({ player, existingOffer, targetMember });
  }

  function openPlayerDetail(player) {
    const appNode = document.querySelector(".app");
    playerDetailReturnScrollRef.current = appNode ? appNode.scrollTop : window.scrollY || 0;
    try {
      window.history.pushState({ fifaGroupPlayerDetail: true }, "");
    } catch {}
    setPlayerDetail(player);
    requestAnimationFrame(() => {
      const nextAppNode = document.querySelector(".app");
      if (nextAppNode) nextAppNode.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function closePlayerDetail() {
    const returnTop = Math.max(0, Number(playerDetailReturnScrollRef.current) || 0);
    setPlayerDetail(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const appNode = document.querySelector(".app");
        if (appNode) {
          appNode.style.scrollBehavior = "auto";
          appNode.scrollTop = returnTop;
          requestAnimationFrame(() => {
            appNode.scrollTop = returnTop;
            appNode.style.scrollBehavior = "";
          });
        } else {
          window.scrollTo(0, returnTop);
        }
      });
    });
  }

  async function handleCancelPlayerOffer(existingOffer) {
    if (!existingOffer?.id) return;
    await onCancelPlayerOffer(existingOffer.id);
  }

  function openMember(memberId) {
    if (currentMemberId && same(memberId, currentMemberId)) {
      if (typeof onOpenMyProfile === "function") {
        onOpenMyProfile();
        return;
      }
    }
    try {
      window.history.pushState({ fifaGroupMember: true }, "");
    } catch {}
    setSelectedId(memberId);
    setMemberTab("players");
    setSearch("");
    setPlayerDetail(null);
    const appNode = document.querySelector(".app");
    if (appNode) appNode.scrollTo({ top: 0, behavior: "auto" });

  }

  function backToMembers() {
    setSelectedId("");
    setMemberTab("players");
    setSearch("");
    setPlayerDetail(null);
    try {
      window.history.replaceState({ fifaGroupRoot: true }, "");
    } catch {}
    const appNode = document.querySelector(".app");
    if (appNode) appNode.scrollTo({ top: 0, behavior: "auto" });

  }

  if (!selectedMember) {
    const mbCss = `
.v4ML{padding:0;animation:v4mlIn .28s ease both}
@keyframes v4mlIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.v4MLHead{border-radius:22px;padding:16px 18px;margin-bottom:14px;background:linear-gradient(145deg,#040C1C,#081830);border:1px solid rgba(0,230,118,.18);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:6px;text-align:right;min-height:110px;box-shadow:0 4px 24px rgba(0,0,0,.32)}
.v4MLHead::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 10%,#00E676 50%,transparent 90%);pointer-events:none;animation:phScanLine 2.8s ease-in-out infinite}
.v4MLTitle{font-size:clamp(22px,6vw,32px);font-weight:900;line-height:1.12;background:linear-gradient(135deg,#fff 40%,#00E676);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0;width:100%;text-align:right}
.v4MLSub{font-size:11px;font-weight:700;color:#9BA0C0;margin:0;width:100%;text-align:right}
.v4MLCnt{display:inline-flex;align-items:center;gap:5px;margin-top:4px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:#00E676}
.v4MLSrch{width:100%;height:44px;border-radius:14px;border:1px solid rgba(0,230,118,.14);background:rgba(2,6,23,.65);color:#EDF0FF;padding:0 14px;font-size:14px;font-family:inherit;outline:none;margin-bottom:13px;transition:border-color .2s;box-sizing:border-box}
.v4MLSrch:focus{border-color:rgba(0,230,118,.35);box-shadow:0 0 0 3px rgba(0,230,118,.07)}
.v4MGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.v4MCard{border-radius:20px;cursor:pointer;overflow:hidden;position:relative;border:1px solid rgba(0,230,118,.22);background:linear-gradient(145deg,#07122A,#0D1E42);backdrop-filter:blur(10px);transition:transform .18s;animation:v4mlCI .3s ease both;display:flex;flex-direction:column;align-items:center;padding:12px 8px 10px}
.v4MCard:active{transform:scale(.96)}
@keyframes v4mlCI{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.v4MCard:nth-child(2){animation-delay:.04s}.v4MCard:nth-child(3){animation-delay:.08s}.v4MCard:nth-child(4){animation-delay:.12s}.v4MCard:nth-child(5){animation-delay:.16s}.v4MCard:nth-child(6){animation-delay:.20s}.v4MCard:nth-child(7){animation-delay:.24s}.v4MCard:nth-child(8){animation-delay:.28s}.v4MCard:nth-child(9){animation-delay:.32s}
.v4MShine{position:absolute;inset:0;background:linear-gradient(115deg,transparent 20%,rgba(0,230,118,.06) 50%,transparent 80%);animation:v4mlSh 4s ease-in-out infinite;pointer-events:none}
@keyframes v4mlSh{0%,100%{transform:translateX(-100%) skewX(-15deg)}50%{transform:translateX(180%) skewX(-15deg)}}
.v4MAvArea{width:68px;height:68px;border-radius:50%;overflow:hidden;border:2px solid rgba(0,230,118,.35);margin:0 0 8px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.v4MAvImg{width:100%;height:100%;object-fit:cover}
.v4MAvFb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#00E676}
.v4MRnkBadge{align-self:flex-start;margin-bottom:6px;background:rgba(0,230,118,.12);border:1px solid rgba(0,230,118,.25);border-radius:8px;padding:2px 8px;font-size:10px;font-weight:900;color:#00E676}
.v4MBody{width:100%;display:flex;flex-direction:column;align-items:center;gap:4px}
.v4MName{font-size:11px;font-weight:900;color:#EDF0FF;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%}
.v4MClubs{display:flex;align-items:center;justify-content:center;gap:5px;min-height:16px}
.v4MClubLogo{width:15px;height:15px;object-fit:contain;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))}
.v4MClubTxt{font-size:8px;color:#9BA0C0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40px}
.v4MNatTxt{font-size:8px;color:#9BA0C0;font-weight:600}
.v4MStatsRow{display:flex;justify-content:center;gap:8px;margin-top:5px;padding-top:5px;border-top:1px solid rgba(0,230,118,.12);width:100%}
.v4MStatB{text-align:center}
.v4MStatBV{font-size:12px;font-weight:900;color:#00E676}
.v4MStatBL{font-size:7.5px;color:#6270A0;font-weight:600}
.v4MBar{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#00E676,#00B84C);border-radius:0 0 20px 20px;width:0!important;transform:scaleX(var(--bar-w,0));transform-origin:right}
    `;
    const filtered = memberSearch
      ? rankedMembers.filter(m=>(m.name||"").includes(memberSearch)||(m.team||"").includes(memberSearch)||(m.nationalteam||"").includes(memberSearch))
      : rankedMembers;
    const maxTrph3 = Math.max(1,...rankedMembers.map(m=>totalForMember(m.id)));
    const fmt2 = n => new Intl.NumberFormat("ar-SA",{notation:"compact",maximumFractionDigits:1}).format(Math.round(n||0));

    return (
      <main className="widePage v4ML">
        <style>{mbCss}</style>
        <div className="v4MLHead">
          <div className="v4MLTitle">الأعضاء</div>
          <div className="v4MLSub">اختر عضواً للدخول إلى بروفايله الكامل</div>
          <div className="v4MLCnt">
            <span style={{width:7,height:7,borderRadius:"50%",background:"#00E676",display:"inline-block"}}/>
            {rankedMembers.length} عضو نشط
          </div>
        </div>
        <input
          className="v4MLSrch"
          placeholder="ابحث عن عضو..."
          value={memberSearch}
          onChange={e=>setMemberSearch(e.target.value)}
        />
        <div className="v4MGrid">
          {filtered.map((member,index)=>{
            const trph = totalForMember(member.id);
            const bal = Number(member._balance||member.balance||0);
            const imgSrc = member.avatar||member.image||"";
            const teamLogo = member.teamlogo||"";
            const nationalLogo = member.nationallogo||"";
            const rnk = index===0?"🥇":index===1?"🥈":index===2?"🥉":null;
            const isTop = index < 3;
            return (
              <button
                key={String(member.id||index)}
                className="v4MCard"
                onClick={()=>openMember(member.id)}
                style={{
                  borderColor:"rgba(0,230,118,"+(isTop?(0.45-index*0.1):0.18)+")",
                  background:isTop?"rgba(0,230,118,"+(0.09-index*0.025)+")":undefined,
                }}
              >
                <div className="v4MShine"/>
                {/* Rank badge */}
                <div className="v4MRnkBadge">{rnk||("#"+(index+1))}</div>
                {/* Circle Avatar */}
                <div className="v4MAvArea">
                  {imgSrc
                    ? <img className="v4MAvImg" src={imgSrc} alt="" onError={e=>{e.target.style.display="none"}}/>
                    : <div className="v4MAvFb">{String(member.name||"").charAt(0)}</div>
                  }
                </div>
                {/* Card body */}
                <div className="v4MBody">
                  <div className="v4MName">{member.name}</div>
                  <div className="v4MClubs">
                    {teamLogo
                      ? <img src={teamLogo} className="v4MClubLogo" alt="" onError={e=>{e.target.style.display="none"}}/>
                      : member.team ? <span className="v4MClubTxt">{member.team}</span> : null
                    }
                    {nationalLogo
                      ? <img src={nationalLogo} className="v4MClubLogo" alt="" onError={e=>{e.target.style.display="none"}}/>
                      : member.nationalteam ? <span className="v4MNatTxt">{member.nationalteam}</span> : null
                    }
                  </div>
                  <div className="v4MStatsRow">
                    <div className="v4MStatB">
                      <div className="v4MStatBV">🏆 {trph}</div>
                      <div className="v4MStatBL">ألقاب</div>
                    </div>
                  </div>
                </div>
                <div className="v4MBar" style={{width:Math.round((trph/maxTrph3)*100)+"%"}}/>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  if (playerDetail) {
    return (
      <main className="widePage glass playerDetailFullPage">
        {offerModal ? (
          <PlayerOfferModal
            targetMember={offerModal.targetMember || selectedMember}
            targetPlayer={offerModal.player}
            existingOffer={offerModal.existingOffer}
            currentMemberId={currentMemberId}
            currentAvailableBalance={currentMemberAvailableBalance}
            currentMemberPlayers={currentMemberPlayers}
            onClose={() => setOfferModal(null)}
            onSubmit={offerModal.existingOffer ? onUpdatePlayerOffer : onCreatePlayerOffer}
          />
        ) : null}

        <PlayerDetailSubPage
          player={playerDetail}
          ownerMember={selectedMember}
          currentMemberId={currentMemberId}
          currentMember={members.find((member) => same(member.id, currentMemberId))}
          playerOffers={playerOffers}
          playerContracts={playerContracts}
          freeAgentRegistrations={freeAgentRegistrations}
          freePlayerStatus={freePlayerStatus}
          freeAgentQueue={freeAgentQueue}
          memberRestrictions={memberRestrictions}
          ownerPlayerCount={players.length}
          canMakeOffer={Boolean(currentMemberId && selectedMemberId && !same(currentMemberId, selectedMemberId))}
          isMarketOpen={isMarketOpen}
          members={members}
          onBack={closePlayerDetail}
          onOffer={openPlayerOffer}
          onCancelOffer={handleCancelPlayerOffer}
          onAcceptOffer={onAcceptOffer}
          onRejectOffer={onRejectOffer}
          onReleasePlayer={onReleasePlayer}
          onTerminateLoan={onTerminateLoan}
          onRegisterFreeAgentFee={onRegisterFreeAgentFee}
          logoUrl={exportBrandLogoUrl(config)}
        />
      </main>
    );
  }

  const mpCss = `
/* ── animations ─────────────────────────────────────── */
@keyframes mpIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes mpPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,230,118,0),0 0 18px rgba(0,230,118,.20)}50%{box-shadow:0 0 0 7px rgba(0,230,118,0),0 0 32px rgba(0,230,118,.45)}}
@keyframes mpShine{0%{transform:translateX(-120%) skewX(-18deg)}100%{transform:translateX(220%) skewX(-18deg)}}

/* ── page ────────────────────────────────────────────── */
.mpPage{animation:mpIn .32s cubic-bezier(.22,.9,.22,1) both;padding:0}

/* ── top bar ─────────────────────────────────────────── */
.mpTopBar{display:none}
.mpBack{display:none}
.mpDownloadGroup{display:none}
.mpDlBtn{display:none}
.mpHeroDownloadIcon{position:absolute;left:16px;top:16px;z-index:3;width:34px;height:34px;border:1px solid rgba(0,230,118,.26);border-radius:13px;background:rgba(0,230,118,.075);color:#00E676;-webkit-text-fill-color:#00E676;font-size:17px;font-weight:1000;line-height:1;display:grid;place-items:center;padding:0;cursor:pointer;font-family:inherit;box-shadow:0 8px 20px rgba(0,230,118,.12)}
.mpHeroDownloadIcon:active{background:rgba(0,230,118,.16);transform:scale(.96)}

/* ── hero card ───────────────────────────────────────── */
.mpHero{position:relative;border-radius:26px;overflow:hidden;background:linear-gradient(150deg,#02071A 0%,#040E25 55%,#030918 100%);border:1px solid rgba(0,230,118,.22);margin-bottom:10px;box-shadow:0 12px 44px rgba(0,0,0,.50),0 0 0 0 transparent}
.mpHero::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 10%,#00E676 50%,transparent 90%);pointer-events:none;animation:phScanLine 2.8s ease-in-out infinite}
.mpGlow{position:absolute;top:-40px;right:-40px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(0,230,118,.14) 0%,transparent 68%);pointer-events:none}
.mpGlow2{position:absolute;bottom:-60px;left:-30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.08) 0%,transparent 68%);pointer-events:none}

/* ── hero body ───────────────────────────────────────── */
.mpHeroBody{display:flex;align-items:center;gap:16px;padding:20px 18px 16px;position:relative;z-index:1}
.mpAvatarWrap{flex-shrink:0;position:relative;width:96px;height:96px}
.mpAvatarRing{position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 0deg,#00E676 0%,#00D4FF 40%,rgba(0,230,118,.15) 60%,#00E676 100%);animation:mpRingSpin 6s linear infinite}
@keyframes mpRingSpin{to{transform:rotate(360deg)}}
.mpAvatarInner{position:absolute;inset:3px;border-radius:50%;overflow:hidden;background:#040C1C;box-shadow:inset 0 0 12px rgba(0,0,0,.50)}
.mpAvatarImg{width:100%;height:100%;object-fit:cover;display:block}
.mpAvatarFb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#00E676;background:linear-gradient(145deg,#07122A,#0D1E42)}

.mpInfo{flex:1;min-width:0;text-align:right}
.mpName{font-size:clamp(24px,6.5vw,36px);font-weight:900;background:linear-gradient(130deg,#fff 30%,#aef8d8 60%,#00E676 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 10px;line-height:1.05;letter-spacing:-.02em}
.mpBadges{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;margin-bottom:9px}
.mpBadge{height:26px;display:inline-flex;align-items:center;gap:4px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);font-size:11px;font-weight:700;color:#BDC5DE;max-width:155px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.mpLogos{display:flex;gap:7px;justify-content:flex-end;align-items:center}
.mpLogo{width:28px;height:28px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5))}

/* ── stats row ───────────────────────────────────────── */
.mpStats{display:grid;grid-template-columns:1fr 1px 1fr;position:relative;z-index:1;border-top:1px solid rgba(0,230,118,.10)}
.mpStatBtn{padding:14px 10px;text-align:center;cursor:pointer;background:transparent;border:0;color:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;transition:background .15s;position:relative;overflow:hidden}
.mpStatBtn::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.025),transparent);transform:translateX(-120%) skewX(-18deg);transition:transform .5s}
.mpStatBtn:active::after{transform:translateX(220%) skewX(-18deg)}
.mpStatBtn:active{background:rgba(0,230,118,.07)}
.mpStatV{display:block;font-size:clamp(17px,4.5vw,24px);font-weight:900;color:#00E676;direction:ltr;unicode-bidi:plaintext;-webkit-text-fill-color:#00E676;line-height:1.1}
.mpStatL{display:block;font-size:10px;font-weight:700;color:#6270A0;-webkit-text-fill-color:#6270A0;letter-spacing:.04em}
.mpStatSep{background:rgba(0,230,118,.10);align-self:stretch;margin:10px 0}

/* ── transfer action ─────────────────────────────────── */
.mpTransfer{width:100%;height:50px;border:0;border-radius:18px;background:linear-gradient(135deg,#00E676,#00D4FF);color:#02030A;font-weight:900;font-size:15px;cursor:pointer;margin-bottom:12px;box-shadow:0 8px 28px rgba(0,230,118,.28),0 2px 0 rgba(255,255,255,.25) inset;-webkit-text-fill-color:#02030A;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.02em;position:relative;overflow:hidden;transition:box-shadow .2s,transform .15s}
.mpTransfer::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:translateX(-100%) skewX(-18deg);animation:mpShine 3s ease-in-out infinite}
.mpTransfer:active{transform:scale(.98);box-shadow:0 4px 14px rgba(0,230,118,.20)}
.mpTransfer:disabled{opacity:.35;cursor:not-allowed;filter:grayscale(.5);animation:none}
.mpTransfer:disabled::before{display:none}

/* ── responsive ──────────────────────────────────────── */
@media(max-width:400px){
  .mpAvatarWrap{width:80px;height:80px}
  .mpName{font-size:clamp(22px,6vw,28px)}
  .mpStatV{font-size:clamp(15px,4vw,20px)}
  .mpHeroBody{padding:16px 14px 12px;gap:12px}
}
`;

  const trophyTotal = trophies.reduce((sum, item) => sum + item.count, 0);
  const handleDownloadSelectedMemberProfile = () => downloadMyProfileSummaryImage({
    config,
    member: selectedMember,
    players,
    balance: financeBalance,
    trophiesCount: trophyTotal,
    proCount: selectedMemberProCount,
    trophyGroups: trophies,
    contracts: playerContracts,
    memberId: selectedMemberId,
    exportLabel: "ملف العضو النشط",
    fileNamePrefix: "FIFA-GROUP-MEMBER-PROFILE",
  });
  return (
    <main className="memberProfilePage mpPage">
      <style>{mpCss}</style>
      <style>{myProfileCss}</style>


      {/* بطاقة الهيرو */}
      <section className="mpHero">
        <div className="mpGlow" />
        <div className="mpGlow2" />
        <button
          type="button"
          className="mpHeroDownloadIcon"
          title="تحميل بروفايل العضو"
          aria-label="تحميل بروفايل العضو"
          onClick={handleDownloadSelectedMemberProfile}
        >↓</button>

        {/* الأفاتار + المعلومات */}
        <div className="mpHeroBody">
          {/* الأفاتار مع الحلقة المتحركة */}
          <div className="mpAvatarWrap">
            <div className="mpAvatarRing" />
            <div className="mpAvatarInner">
              {selectedMember.avatar
                ? <img className="mpAvatarImg" src={selectedMember.avatar} alt="" />
                : <div className="mpAvatarFb">{String(selectedMember.name || 'F').slice(0,1)}</div>
              }
            </div>
          </div>

          {/* الاسم + الشارات */}
          <div className="mpInfo">
            <p className="mpName">{selectedMember.name}</p>
            <div className="mpBadges">
              <span className="mpBadge">{renderSmartIcon(config.memberTeamIcon)} {selectedMember.team || 'بدون فريق'}</span>
              <span className="mpBadge">{renderSmartIcon(config.memberNationalIcon)} {selectedMember.nationalteam || 'بدون منتخب'}</span>
            </div>
            {(selectedMember.teamlogo || selectedMember.nationallogo) ? (
              <div className="mpLogos">
                {selectedMember.teamlogo ? <img className="mpLogo" src={selectedMember.teamlogo} alt="" /> : null}
                {selectedMember.nationallogo ? <img className="mpLogo" src={selectedMember.nationallogo} alt="" /> : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* شريط الإحصاءات */}
        <div className="mpStats">
          <button className="mpStatBtn" onClick={() => onOpenView({ type: 'memberFinance', member: selectedMember, rows: finance })}>
            <span className="mpStatV">{formatMoney(financeBalance)}</span>
            <span className="mpStatL">الرصيد</span>
          </button>
          <div className="mpStatSep" />
          <button className="mpStatBtn" onClick={() => onOpenView({ type: 'memberAllTrophies', member: selectedMember, groups: trophies })}>
            <span className="mpStatV">{trophyTotal}</span>
            <span className="mpStatL">البطولات</span>
          </button>
        </div>
      </section>

      {/* زر التحويل */}
      <button
        type="button"
        className="mpTransfer"
        disabled={!currentMemberId}
        onClick={() => openMoneyTransfer(canSendMoney ? selectedMember : null)}
      >💸 تحويل مالي</button>

      {currentMemberRestrictions?.length ? (
        <TransferRestrictionBanner rows={currentMemberRestrictions} />
      ) : null}

      {moneyModal ? (
        <MoneyTransferModal
          members={members}
          currentMemberId={currentMemberId}
          currentBalance={currentMemberBalance}
          defaultToMemberId={moneyModal.toMemberId}
          onClose={() => setMoneyModal(null)}
          onSubmit={onCreateMoneyTransfer}
        />
      ) : null}

      {offerModal ? (
        <PlayerOfferModal
          targetMember={selectedMember}
          targetPlayer={offerModal.player}
          existingOffer={offerModal.existingOffer}
          currentMemberId={currentMemberId}
          currentAvailableBalance={currentMemberAvailableBalance}
          currentMemberPlayers={currentMemberPlayers}
          onClose={() => setOfferModal(null)}
          onSubmit={offerModal.existingOffer ? onUpdatePlayerOffer : onCreatePlayerOffer}
        />
      ) : null}

      {playerDetail ? (
        <PlayerDetailSubPage
          player={playerDetail}
          ownerMember={selectedMember}
          currentMemberId={currentMemberId}
          currentMember={members.find((member) => same(member.id, currentMemberId))}
          playerOffers={playerOffers}
          playerContracts={playerContracts}
          freeAgentRegistrations={freeAgentRegistrations}
          freePlayerStatus={freePlayerStatus}
          freeAgentQueue={freeAgentQueue}
          memberRestrictions={memberRestrictions}
          ownerPlayerCount={players.length}
          canMakeOffer={Boolean(currentMemberId && selectedMemberId && !same(currentMemberId, selectedMemberId))}
          isMarketOpen={isMarketOpen}
          members={members}
          onBack={closePlayerDetail}
          onOffer={openPlayerOffer}
          onCancelOffer={handleCancelPlayerOffer}
          onAcceptOffer={onAcceptOffer}
          onRejectOffer={onRejectOffer}
          onReleasePlayer={onReleasePlayer}
          onTerminateLoan={onTerminateLoan}
          onRegisterFreeAgentFee={onRegisterFreeAgentFee}
        />
      ) : (
        <>
      <nav className="tabs">
        <TabButton
          tab={memberTab}
          id="players"
          label={config.playersTitle}
          setTab={setMemberTab}
        />
        {isEnabled(config.showMemberTrophies) ? (
          <TabButton
            tab={memberTab}
            id="trophies"
            label={config.trophiesTitle}
            setTab={setMemberTab}
          />
        ) : null}
        <TabButton
          tab={memberTab}
          id="memberStats"
          label="إحصائيات"
          setTab={setMemberTab}
        />
        <TabButton
          tab={memberTab}
          id="matches"
          label={(isCurrentMemberProfile ? "مبارياتي" : "مبارياته") + (memberOpenMatches.length ? ` (${memberOpenMatches.length})` : "")}
          setTab={setMemberTab}
        />
        <TabButton
          tab={memberTab}
          id="deals"
          label="سجل الصفقات"
          setTab={setMemberTab}
        />
        {canViewMemberOffers ? (
          <TabButton
            tab={memberTab}
            id="offers"
            label="عروض الانتقالات"
            setTab={setMemberTab}
          />
        ) : null}
        {isEnabled(config.showFinance) ? (
          <TabButton
            tab={memberTab}
            id="finance"
            label={config.financeTitle}
            setTab={setMemberTab}
          />
        ) : null}
        {isCurrentMemberProfile ? (
          <TabButton
            tab={memberTab}
            id="notifications"
            label={"الإشعارات" + (notifications.length ? ` (${notifications.length})` : "")}
            setTab={setMemberTab}
          />
        ) : null}
      </nav>

      {memberTab === "matches" ? (
        <ProfileMatchesSection
          title={isCurrentMemberProfile ? "مبارياتي" : "مبارياته"}
          subtitle="المباريات غير المسجلة في البطولات النشطة."
          rows={memberOpenMatches}
          members={members}
          emptyText="لا توجد مباريات غير مسجلة لهذا العضو."
          onOpenCompetition={onOpenCompetition}
        />
      ) : memberTab === "players" ? (
        <PlayersSection
          config={config}
          rows={players}
          search={search}
          setSearch={setSearch}
          playerCount={players.length}
          showOfferButton={Boolean(currentMemberId || selectedMemberId)}
          onOpenPlayerDetail={openPlayerDetail}
          playerContracts={playerContracts}
          selectedMemberId={selectedMemberId}
        />
      ) : null}
      {memberTab === "trophies" && isEnabled(config.showMemberTrophies) ? (
        <MemberTrophiesSection
          rows={trophies}
          member={selectedMember}
          onOpenView={onOpenView}
        />
      ) : null}
      {memberTab === "memberStats" ? (
        <MemberStatsSection
          config={config}
          stats={stats}
          member={selectedMember}
          members={members}
          onOpenView={onOpenView}
          onInfo={onInfo}
        />
      ) : null}
      {memberTab === "deals" ? (
        <MemberDealsSection
          member={selectedMember}
          members={members}
          transferHistory={transferHistory}
          playerOffers={allPlayerOffers}
          memberRestrictions={memberRestrictions}
          logoUrl={exportBrandLogoUrl(config)}
          onOpenPlayer={(player, ownerMember) => player && ownerMember && openPlayerDetail(player)}
        />
      ) : null}
      {memberTab === "offers" && canViewMemberOffers ? (
        <MemberOffersSection
          member={selectedMember}
          members={members}
          allPlayers={props.allPlayers || []}
          playerOffers={allPlayerOffers}
          currentMemberId={currentMemberId}
          isFifaAdmin={isFifaAdmin}
          logoUrl={exportBrandLogoUrl(config)}
          onOpenPlayer={(player) => player && openPlayerDetail(player)}
          onEditOffer={(offer, player, targetMember) => player && targetMember && openPlayerOffer(player, offer, targetMember)}
          onCancelOffer={handleCancelPlayerOffer}
          onAcceptOffer={onAcceptOffer}
          onRejectOffer={onRejectOffer}
        />
      ) : null}
      {memberTab === "finance" && isEnabled(config.showFinance) ? (
        <FinanceSection
          config={config}
          rows={finance}
          member={selectedMember}
          members={members}
          onDownload={() => downloadMemberFinanceImage({
            member: selectedMember,
            financeRows: finance,
            balance: financeBalance,
            config,
            members,
          })}
        />
      ) : null}
      {memberTab === "notifications" && isCurrentMemberProfile ? (
        <NotificationsPanel
          rows={notifications}
          members={members}
          currentMemberId={currentMemberId}
          pushStatus={pushStatus}
          pushBusy={pushBusy}
          onEnablePushNotifications={onEnablePushNotifications}
          onDisablePushNotifications={onDisablePushNotifications}
          onOpenNotification={onOpenNotification}
          onClearNotifications={onClearNotifications}
        />
      ) : null}
        </>
      )}
    </main>
  );
}
