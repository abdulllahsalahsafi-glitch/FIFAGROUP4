import React from 'react';
import { clean, notificationDisplayDate, getInitialPushStatus } from '../../utils';


const profileSectionHeaderCss = `
.fgProfileSectionPanel .fgProfileSectionHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  border-radius:22px;
  background:linear-gradient(145deg,rgba(4,12,28,.74),rgba(2,6,23,.52));
  border:1px solid rgba(0,230,118,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045);
  margin-bottom:12px;
}
.fgProfileSectionPanel .fgProfileSectionHead > div{
  min-width:0;
  flex:1 1 auto;
}
.fgProfileSectionPanel .fgProfileSectionHead h3{
  margin:0;
  font-size:clamp(22px,5.6vw,30px);
  line-height:1.25;
  font-weight:1000;
  color:#EDF0FF;
  -webkit-text-fill-color:#EDF0FF;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead p{
  margin:5px 0 0;
  font-size:12px;
  line-height:1.45;
  font-weight:800;
  color:#AEB6D2;
  -webkit-text-fill-color:#AEB6D2;
  text-align:right;
}
.fgProfileSectionPanel .fgProfileSectionHead input{
  flex:0 0 min(270px,42%);
  min-width:120px;
}
.fgProfileSectionCountBadge{
  min-width:42px;
  height:30px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:0 10px;
  margin-inline-start:8px;
  background:rgba(0,230,118,.12);
  border:1px solid rgba(0,230,118,.22);
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-size:12px;
  font-weight:1000;
  vertical-align:middle;
}
@media(max-width:720px){
  .fgProfileSectionPanel .fgProfileSectionHead{
    display:grid;
    grid-template-columns:1fr;
    gap:10px;
    padding:11px 12px;
    border-radius:20px;
  }
  .fgProfileSectionPanel .fgProfileSectionHead input{
    width:100%;
    min-width:0;
    flex:auto;
  }
  .fgProfileSectionPanel .fgProfileSectionHead h3{
    font-size:clamp(21px,5.8vw,28px);
  }
}
`;


function NotificationsPanel({ rows, members, currentMemberId, pushStatus, pushBusy, onEnablePushNotifications, onDisablePushNotifications, onOpenNotification, onClearNotifications }) {
  const visibleRows = rows || [];
  const initialPush = getInitialPushStatus();
  const pushState = pushStatus?.state || initialPush.state;
  const pushMessage = pushStatus?.message || initialPush.message;
  const pushEnabled = pushState === "enabled";
  const permissionLabel = pushBusy
    ? "جاري التنفيذ..."
    : pushEnabled
    ? "إيقاف إشعارات هذا الجهاز"
    : "تفعيل إشعارات الجوال";
  const buttonHandler = pushEnabled ? onDisablePushNotifications : onEnablePushNotifications;

  return (
    <section className="notificationsPanel glassSoft fgProfileSectionPanel">
      <style>{profileSectionHeaderCss}</style>
      <div className="notificationsHead fgProfileSectionHead">
        <div>
          <h3>الإشعارات</h3>
          <p>{visibleRows.length ? `${visibleRows.length} آخر إشعارات` : "لا توجد إشعارات"}</p>
        </div>
        <div className="notificationsHeadActions">
          {visibleRows.length ? (
            <button
              type="button"
              className="clearNotificationsBtn"
              onClick={onClearNotifications}
              disabled={!onClearNotifications}
              title="إخفاء الإشعارات من حسابك"
            >
              تنظيف الإشعارات
            </button>
          ) : null}
          <button
            type="button"
            className={pushEnabled ? "enableDeviceNotifyBtn active stop" : "enableDeviceNotifyBtn"}
            onClick={buttonHandler}
            disabled={pushBusy || !buttonHandler}
            title={pushMessage}
          >
            {permissionLabel}
          </button>
        </div>
      </div>

      <div className={pushEnabled ? "pushNotifyBox active" : pushState === "error" ? "pushNotifyBox error" : "pushNotifyBox"}>
        <div>
          <b>{pushEnabled ? "إشعارات الجوال مفعلة" : "إشعارات الجوال"}</b>
          <small>{pushMessage}</small>
        </div>
      </div>

      {visibleRows.length ? (
        <div className="notificationsList">
          {visibleRows.map((item) => {
            const read = clean(item.status || "unread") === "read";
            const passive = Boolean(item.navigationDisabled);
            return (
              <button
                type="button"
                key={item.id}
                className={(read ? "notificationItem read clickableNotification" : "notificationItem clickableNotification") + (passive ? " disabledNotification" : "")}
                disabled={Boolean(passive)}
                onClick={() => !passive && onOpenNotification?.(item)}
              >
                <b>{item.title || "إشعار"}</b>
                <p>{item.body || "-"}</p>
                <small>{notificationDisplayDate(item.createdAt || item.date)}</small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty">لا توجد إشعارات حالياً.</div>
      )}
    </section>
  );
}

export default NotificationsPanel;
