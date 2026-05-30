import { db } from "./firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const PUBLIC_VAPID_KEY = "BKP7IWDp4EyGEbW7Dcat_nWfdDg2KOWhxo-Jc53xQ3sIPS5vMzg83wZGfFdPn6JaVkm_hCAyV9PhIQHM337czx0";

const PUSH_SW_PATH = "/firebase-messaging-sw.js";

function cleanId(value) {
  return String(value ?? "").trim();
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  return /iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

function isSecureContextForPush() {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || window.location.protocol === "https:" || window.location.hostname === "localhost";
}

function iosPwaHelpMessage() {
  return "على iPhone يجب فتح FIFA GROUP من الأيقونة المضافة إلى الشاشة الرئيسية، وليس من Safari. احذف الأيقونة القديمة إن وجدت، ثم افتح الرابط من Safari واختر مشاركة ثم إضافة إلى الشاشة الرئيسية، وبعدها افتح التطبيق من الأيقونة وجرب التفعيل.";
}

function deviceId() {
  if (typeof window === "undefined") return "server";
  const key = "fg_push_device_id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const next =
    (window.crypto?.randomUUID?.() ||
      `fg-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .replace(/[^a-zA-Z0-9_-]/g, "");
  window.localStorage.setItem(key, next);
  return next;
}

function browserName() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/CriOS/i.test(ua)) return "Chrome iOS";
  if (/FxiOS/i.test(ua)) return "Firefox iOS";
  if (/EdgiOS/i.test(ua)) return "Edge iOS";
  if (/CriOS|Chrome/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Edg/i.test(ua)) return "Edge";
  return "Browser";
}

function platformName() {
  if (typeof navigator === "undefined") return "unknown";
  if (isIOSDevice()) return "iOS";
  return navigator.userAgentData?.platform || navigator.platform || "unknown";
}

async function ensureSupported() {
  if (typeof window === "undefined") {
    throw new Error("إشعارات الجوال لا تعمل خارج المتصفح.");
  }

  if (!isSecureContextForPush()) {
    throw new Error("إشعارات الجوال تحتاج رابط HTTPS آمن.");
  }

  if (!("Notification" in window)) {
    throw new Error("هذا المتصفح لا يدعم إشعارات الويب.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("هذا المتصفح لا يدعم Service Worker.");
  }

  if (!("PushManager" in window)) {
    if (isIOSDevice() && !isStandalonePwa()) {
      throw new Error(iosPwaHelpMessage());
    }
    throw new Error("هذا المتصفح لا يدعم PushManager.");
  }

  if (isIOSDevice() && !isStandalonePwa()) {
    throw new Error(iosPwaHelpMessage());
  }

  if (!PUBLIC_VAPID_KEY) {
    throw new Error("أضف VITE_FIREBASE_VAPID_KEY في Vercel ثم أعد نشر التطبيق لتفعيل إشعارات الجوال.");
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    if (isIOSDevice()) {
      throw new Error(
        "iPhone يدعم إشعارات الويب فقط عندما يكون التطبيق مثبتًا ومفتوحًا من الشاشة الرئيسية. إذا كنت فتحته من الأيقونة وما زالت الرسالة تظهر، أعد إضافة التطبيق من Safari بعد التأكد من وجود manifest و firebase-messaging-sw.js."
      );
    }
    throw new Error("Firebase Messaging غير مدعوم على هذا الجهاز أو المتصفح.");
  }
}

async function registerMessagingServiceWorker() {
  const registration = await navigator.serviceWorker.register(PUSH_SW_PATH, {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  return registration;
}

async function saveToken({ token, authUser, memberId, memberName, username }) {
  const safeMemberId = cleanId(memberId);
  if (!token || !safeMemberId) {
    throw new Error("بيانات حفظ الإشعار غير مكتملة.");
  }

  const tokenDocId = token.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 900);
  await setDoc(
    doc(db, "pushTokens", tokenDocId),
    {
      token,
      active: true,
      memberId: safeMemberId,
      memberName: memberName || "",
      username: username || "",
      uid: authUser?.uid || "",
      deviceId: deviceId(),
      browser: browserName(),
      platform: platformName(),
      standalone: isStandalonePwa(),
      isIOS: isIOSDevice(),
      userAgent: navigator.userAgent || "",
      permission: window.Notification.permission,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function enableFifaPushNotifications({ authUser, memberId, memberName, username }) {
  await ensureSupported();

  const permission = await window.Notification.requestPermission();
  if (permission !== "granted") {
    return {
      state: permission === "denied" ? "denied" : "ready",
      message:
        permission === "denied"
          ? "تم رفض الإشعارات. افتح إعدادات الجهاز أو المتصفح، وفعّل إشعارات FIFA GROUP إذا ظهر في القائمة."
          : "لم يتم منح إذن الإشعارات بعد.",
    };
  }

  const registration = await registerMessagingServiceWorker();
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: PUBLIC_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("تعذر إنشاء رمز إشعارات لهذا الجهاز.");
  }

  await saveToken({ token, authUser, memberId, memberName, username });

  return {
    state: "enabled",
    message: "تم تفعيل إشعارات الجوال لهذا الجهاز.",
    token,
  };
}

export async function syncFifaPushTokenIfAllowed({ authUser, memberId, memberName, username, onStatus }) {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  if (window.Notification.permission !== "granted") return null;
  if (!authUser || !cleanId(memberId)) return null;

  await ensureSupported();

  const registration = await registerMessagingServiceWorker();
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: PUBLIC_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  await saveToken({ token, authUser, memberId, memberName, username });
  onStatus?.({
    state: "enabled",
    message: "إشعارات الجوال مفعلة لهذا الجهاز.",
    token,
  });
  return token;
}

export function listenToForegroundPushMessages(callback) {
  return isSupported()
    .then((supported) => {
      if (!supported) return () => {};
      const messaging = getMessaging();
      return onMessage(messaging, (payload) => callback?.(payload));
    })
    .catch(() => () => {});
}

