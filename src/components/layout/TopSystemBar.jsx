import React from "react";
import { createPortal } from "react-dom";
import { Bell, ChevronRight } from "lucide-react";

export function TopSystemBar({ title, scrolled, unreadCount = 0, onNotificationsClick, authProfile, canGoBack = false, onBack }) {
  const top = (
    <div className={scrolled ? "topSystemPortalBar scrolled" : "topSystemPortalBar"} aria-hidden="false">
      <div className="topSystemInner">
        <button className="topNotifyBtn" type="button" onClick={onNotificationsClick} aria-label="notifications">
          <Bell size={20} strokeWidth={2.35} />
          {unreadCount ? <span>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
        </button>
        <strong className="topSystemTitle">{title || "FIFA GROUP"}</strong>
        {canGoBack ? (
          <button className="topSystemBackBtn" type="button" onClick={onBack} aria-label="back">
            <ChevronRight size={22} strokeWidth={2.6} />
          </button>
        ) : <span className="topSystemBackSpacer" />}
      </div>
    </div>
  );
  if (typeof document === "undefined") return top;
  return createPortal(top, document.body);
}
