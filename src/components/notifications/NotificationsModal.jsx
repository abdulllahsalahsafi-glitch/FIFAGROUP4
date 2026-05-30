import React from 'react';
import { createPortal } from 'react-dom';
import NotificationsPanel from './NotificationsPanel';

function NotificationsModal({ rows, members, currentMemberId, pushStatus, pushBusy, onEnablePushNotifications, onDisablePushNotifications, onClose, onOpenNotification, onClearNotifications }) {
  return createPortal(
    <div className="notificationsModalBackdrop" onClick={onClose}>
      <section className="notificationsModal glass" onClick={(event) => event.stopPropagation()} dir="rtl">
        <header>
          <div>
            <small>FIFA GROUP</small>
            <h3>الإشعارات</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق">×</button>
        </header>
        <NotificationsPanel
          rows={rows}
          members={members}
          currentMemberId={currentMemberId}
          pushStatus={pushStatus}
          pushBusy={pushBusy}
          onEnablePushNotifications={onEnablePushNotifications}
          onDisablePushNotifications={onDisablePushNotifications}
          onOpenNotification={onOpenNotification}
          onClearNotifications={onClearNotifications}
        />
      </section>
    </div>,
    document.body
  );
}

export default NotificationsModal;
