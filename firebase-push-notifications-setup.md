# FIFA GROUP Push Notifications Setup

## الملفات المضافة

- `App.jsx`: نسخة كاملة محدثة لعرض زر تفعيل إشعارات الجوال وحفظ token العضو.
- `pushNotifications.js`: ملف React/Firebase Messaging لحفظ رمز الجهاز في Firestore.
- `public/firebase-messaging-sw.js`: Service Worker لاستقبال إشعارات الخلفية.
- `public/manifest.json`: Manifest لتثبيت التطبيق كتطبيق PWA.
- `functions/index.js`: Cloud Function تراقب `notifications/{id}` وترسل Push.
- `functions/package.json`: تبعيات Cloud Functions.
- `.env.example`: مكان VAPID key.

## خطوات التركيب

1. انسخ `App.jsx` إلى `src/App.jsx`.
2. انسخ `pushNotifications.js` إلى `src/pushNotifications.js`.
3. انسخ `public/firebase-messaging-sw.js` إلى مجلد `public`.
4. انسخ `public/manifest.json` إلى مجلد `public`.
5. انسخ مجلد `functions` إلى جذر مشروع Firebase.
6. افتح Firebase Console > Project settings > Cloud Messaging > Web Push certificates، واضغط Generate key pair.
7. ضع المفتاح العام في `.env`:

```env
VITE_FIREBASE_VAPID_KEY=PUT_YOUR_PUBLIC_VAPID_KEY_HERE
```

8. افتح `public/firebase-messaging-sw.js` واستبدل قيم `firebase.initializeApp` بنفس firebaseConfig الموجود عندك في `src/firebase.js`.
9. انشر الموقع على HTTPS مثل Vercel.
10. انشر Cloud Functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## طريقة العمل

- عندما يضغط العضو زر `تفعيل إشعارات الجوال`، يتم طلب الإذن من المتصفح.
- إذا وافق، يتم إنشاء FCM token وحفظه في Firestore داخل collection اسمها `pushTokens`.
- عندما يتم إنشاء مستند جديد في `notifications`، تقوم Cloud Function بإرسال Push للعضو المستهدف أو لكل الأعضاء إذا كان الإشعار عامًا.

## أمثلة مستندات notifications

إشعار خاص بعضو:

```js
{
  type: "money_transfer_incoming",
  toMemberId: "3",
  title: "تحويل مالي وارد",
  body: "وصل إليك تحويل بقيمة 5,000,000.",
  createdAt: serverTimestamp()
}
```

إشعار عام:

```js
{
  type: "transfer_window_opened",
  scope: "all",
  title: "فتح سوق الانتقالات",
  body: "تم فتح الفترة الأولى لسوق الانتقالات.",
  createdAt: serverTimestamp()
}
```
