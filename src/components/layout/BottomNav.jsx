import React from "react";
import { createPortal } from "react-dom";
import { Home, Menu, RefreshCw, Trophy, User } from "lucide-react";
import { isEnabled } from "../../utils/helpers";

export function NavButton({ page, menuOpen, id, Icon, label, onClick }) {
  return (
    <button
      className={!menuOpen && page === id ? "navBtn active" : "navBtn"}
      onClick={onClick}
    >
      <span className="navIcon" aria-hidden="true">
        <Icon size={22} strokeWidth={2.35} />
      </span>
      <span className="navLabel">{label}</span>
    </button>
  );
}

export function BottomNav({ page, goPage, menuOpen, setMenuOpen, config }) {
  const navStyle = {
    position: "fixed",
    left: "50%",
    right: "auto",
    bottom: "calc(10px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    width: "min(640px, calc(100vw - 18px))",
    maxWidth: "640px",
    height: "72px",
    minHeight: "72px",
    maxHeight: "72px",
    margin: 0,
    padding: "7px",
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "5px",
    borderRadius: "26px",
    overflow: "visible",
    background: "linear-gradient(180deg,#081126,#050a17)",
    border: "1px solid rgba(255,255,255,.14)",
    boxShadow:
      "0 -8px 28px rgba(0,0,0,.32), 0 18px 60px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.14)",
    zIndex: 2147483601,
    direction: "rtl",
    boxSizing: "border-box",
  };

  const curtainStyle = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "calc(92px + env(safe-area-inset-bottom))",
    background: "#020617",
    zIndex: 2147483600,
    pointerEvents: "none",
  };

  const nav = (
    <>
      <div
        className="bottomNavPortalCurtain forceBottomCurtain"
        aria-hidden="true"
        style={curtainStyle}
      />
      <nav className="mainNav glassSoft forceBottomNav" style={navStyle}>
        <NavButton
          page={page}
          menuOpen={menuOpen}
          id="home"
          Icon={Home}
          label="الرئيسية"
          onClick={() => goPage("home")}
        />
        <NavButton
          page={page}
          menuOpen={menuOpen}
          id="myProfile"
          Icon={User}
          label="ملفي"
          onClick={() => goPage("myProfile")}
        />
        {isEnabled(config.showSeasonTournaments) ? (
          <NavButton
            page={page}
            menuOpen={menuOpen}
            id="season"
            Icon={Trophy}
            label="الموسم"
            onClick={() => goPage("season", { clearFocusedCompetition: true })}
          />
        ) : null}
        {isEnabled(config.showTransfers) ? (
          <NavButton
            page={page}
            menuOpen={menuOpen}
            id="transfers"
            Icon={RefreshCw}
            label="الانتقالات"
            onClick={() => goPage("transfers")}
          />
        ) : null}
        <button
          className={menuOpen ? "navBtn active" : "navBtn"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="navIcon" aria-hidden="true">
            <Menu size={22} strokeWidth={2.35} />
          </span>
          <span className="navLabel">المزيد</span>
        </button>
      </nav>
    </>
  );

  if (typeof document === "undefined") return nav;
  return createPortal(nav, document.body);
}