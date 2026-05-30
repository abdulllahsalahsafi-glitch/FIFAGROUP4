import React from "react";
import { createPortal } from "react-dom";
import { BarChart3, Film, Landmark, Link2, LogOut, ShieldCheck, Trophy } from "lucide-react";
import { isEnabled } from "../../utils/helpers";

export function SideMenu({ open, setOpen, goPage, config, isFifaAdmin = false, onLogout }) {
  if (!open) return null;

  const items = [
    isFifaAdmin ? ["fifaAdmin", ShieldCheck, "لوحة FIFA"] : null,
    isFifaAdmin ? ["leagueAdmin", Trophy, "إدارة البطولات التنافسية"] : null,
    ["studio", Film, "استوديو FIFA GROUP"],
    isEnabled(config.showStats) ? ["stats", BarChart3, "الإحصائيات العامة"] : null,
    isEnabled(config.showArchive) ? ["archive", Landmark, "السجل العام"] : null,
    isEnabled(config.showLinks) ? ["links", Link2, config.linksTitle] : null,
  ].filter(Boolean);

  function selectPage(id) {
    setOpen(false);
    goPage(id);
  }

  const drawer = (
    <div className="fgMenuBackdrop" onClick={() => setOpen(false)}>
      <aside
        className="fgMenuPanel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="fgMenuHeader">
          <h2>القائمة</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
          >
            ×
          </button>
        </header>

        <div className="fgMenuItems">
          {items.map(([id, Icon, label]) => (
            <button
              className="fgMenuItem"
              type="button"
              key={id}
              onClick={() => selectPage(id)}
            >
              <span className="fgMenuIcon" aria-hidden="true">
                <Icon size={21} strokeWidth={2.25} />
              </span>
              <b>{label}</b>
            </button>
          ))}
        </div>

        {onLogout && (
          <div className="fgMenuLogoutBox">
            <button
              className="fgMenuItem fgMenuLogout"
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
            >
              <span className="fgMenuIcon" aria-hidden="true">
                <LogOut size={21} strokeWidth={2.25} />
              </span>
              <b>تسجيل الخروج</b>
            </button>
          </div>
        )}
      </aside>
    </div>
  );

  if (typeof document === "undefined") return drawer;
  return createPortal(drawer, document.body);
}
