/* FIFA GROUP Firebase Cloud Messaging service worker.
   ضع هذا الملف داخل مجلد public في مشروع React/Vite. */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// انسخ نفس firebaseConfig الموجود في src/firebase.js هنا.
// بدون هذه القيم لن تعمل إشعارات الخلفية.
firebase.initializeApp({
  apiKey: "AIzaSyD-Bbu8-GvdfxzWdZCKI70tXPftcYkkkJM",
  authDomain: "fifa-group.firebaseapp.com",
  projectId: "fifa-group",
  storageBucket: "fifa-group.firebasestorage.app",
  messagingSenderId: "1063835143344",
  appId: "1:1063835143344:web:6b37c2e4984f5800977f75"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "FIFA GROUP";
  const options = {
    body: notification.body || data.body || "لديك إشعار جديد.",
    icon: data.icon || notification.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.notificationId || data.relatedId || "fifa-group-notification",
    dir: "rtl",
    data: {
      url: data.clickUrl || "/",
      notificationId: data.notificationId || "",
      type: data.type || "",
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate?.(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
      return null;
    })
  );
});
