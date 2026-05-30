import React, { useState } from "react";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  cleanId,
  firebaseAuthMessage,
  same,
  usernameKey,
  usernameToFirebaseEmail,
} from "../../utils/helpers";
import { normalizeImageUrl } from "../../utils/ui";

const authCss = `
.authShell{
  min-height:100vh;
  min-height:100dvh;
  width:100%;
  box-sizing:border-box;
  display:grid;
  place-items:center;
  padding:calc(18px + env(safe-area-inset-top)) 14px calc(18px + env(safe-area-inset-bottom));
  color:#EDF0FF;
  font-family:'Tajawal',Arial,sans-serif;
  overflow:auto;
  background:
    radial-gradient(ellipse 320px 160px at 50% -2%,rgba(0,230,118,.11) 0%,transparent 65%),
    radial-gradient(circle at 8% 6%,rgba(0,230,118,.12) 0%,transparent 50%),
    radial-gradient(circle at 94% 10%,rgba(168,85,247,.08) 0%,transparent 50%),
    linear-gradient(135deg,#02030A 0%,#061225 48%,#02030A 100%);
}
.authCard{
  width:min(410px,calc(100vw - 28px));
  max-height:calc(100dvh - 36px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow:auto;
  box-sizing:border-box;
  border-radius:28px;
  padding:22px 18px 20px;
  text-align:center;
  background:linear-gradient(145deg,rgba(4,12,28,.92),rgba(6,15,34,.82));
  border:1px solid rgba(0,230,118,.18);
  box-shadow:0 0 60px rgba(0,230,118,.08),0 40px 80px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.09);
  backdrop-filter:blur(24px);
  -webkit-backdrop-filter:blur(24px);
}
.authLogo{
  width:68px;
  height:68px;
  margin:0 auto 12px;
  border-radius:22px;
  display:grid;
  place-items:center;
  color:#02030A;
  font-weight:1000;
  font-size:26px;
  letter-spacing:.5px;
  background:linear-gradient(135deg,#00E676,#00D4FF);
  box-shadow:0 0 46px rgba(0,230,118,.32),0 14px 30px rgba(0,0,0,.30);
  font-family:'Orbitron','Tajawal',sans-serif;
  overflow:hidden;
}
.authLogo.hasImage{
  background:rgba(2,6,23,.46);
  border:1px solid rgba(0,230,118,.22);
  padding:8px;
}
.authLogo img{
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
}
.authKicker{
  margin:0 0 5px;
  color:#00E676;
  font-weight:1000;
  letter-spacing:.8px;
  font-size:13px;
}
.authCard h1{
  margin:0;
  font-size:31px;
  line-height:1.08;
  font-weight:1000;
  font-family:'Orbitron','Tajawal',sans-serif;
  letter-spacing:.4px;
  background:linear-gradient(135deg,#fff 42%,#00E676);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.authSub{
  margin:9px auto 16px;
  color:#9BA0C0;
  line-height:1.55;
  font-weight:800;
  font-size:14px;
}
.authForm{
  display:grid;
  gap:10px;
}
.authForm label{
  display:grid;
  gap:7px;
  text-align:right;
}
.authForm span{
  color:#DDE7FF;
  font-size:13px;
  font-weight:1000;
}
.authForm input,
.authForm select{
  height:46px;
  border-radius:17px;
  border:1px solid rgba(0,230,118,.16);
  background:rgba(2,6,23,.62);
  color:#EDF0FF;
  outline:none;
  padding:0 14px;
  font-size:16px;
  font-family:'Tajawal',Arial,sans-serif;
}
.authForm input:focus,
.authForm select:focus{
  border-color:rgba(0,230,118,.42);
  box-shadow:0 0 0 3px rgba(0,230,118,.08);
}
.authForm select option{
  color:#020617;
}
.authForm button{
  height:48px;
  margin-top:4px;
  border:0;
  border-radius:18px;
  color:#02030A;
  font-size:16px;
  font-weight:1000;
  background:linear-gradient(135deg,#00E676,#00D4FF);
  cursor:pointer;
  font-family:'Tajawal',Arial,sans-serif;
  box-shadow:0 14px 30px rgba(0,230,118,.18);
}
.authForm button:disabled,
.authForgot:disabled{
  opacity:.65;
  cursor:not-allowed;
}
.authMessage{
  margin:0;
  padding:10px 12px;
  border-radius:14px;
  color:#fecaca;
  background:rgba(239,68,68,.12);
  border:1px solid rgba(239,68,68,.24);
  font-weight:900;
  line-height:1.5;
}
.authForgot,
.authSwitch{
  margin-top:13px;
  border:0;
  background:transparent;
  color:#00E676;
  -webkit-text-fill-color:#00E676;
  font-weight:1000;
  cursor:pointer;
  font-family:'Tajawal',Arial,sans-serif;
}
.authForgot{display:block;width:100%;color:#9AE6B4;-webkit-text-fill-color:#9AE6B4;}
.authMiniBadge{
  position:fixed;
  top:calc(48px + env(safe-area-inset-top));
  left:12px;
  z-index:2147483500;
  height:34px;
  display:flex;
  align-items:center;
  gap:8px;
  padding:0 8px 0 12px;
  border-radius:999px;
  direction:rtl;
}
.authMiniBadge span{
  max-width:120px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  color:#e0f2fe;
  font-size:12px;
  font-weight:1000;
}
.authMiniBadge button{
  height:24px;
  border:0;
  border-radius:999px;
  padding:0 9px;
  background:rgba(255,255,255,.12);
  color:white;
  font-size:11px;
  font-weight:1000;
  cursor:pointer;
}
@media(max-width:720px){
  .authShell{align-items:center;}
  .authCard{border-radius:24px;padding:20px 16px;width:min(390px,calc(100vw - 24px));}
  .authCard h1{font-size:28px;}
  .authLogo{width:62px;height:62px;border-radius:20px;}
  .authSub{font-size:13px;margin-bottom:14px;}
  .authMiniBadge{top:calc(44px + env(safe-area-inset-top));left:8px;}
}
`;


async function isMemberAlreadyLinked(memberIdToCheck) {
  const normalizedMemberId = cleanId(memberIdToCheck);
  if (!normalizedMemberId) return false;

  const usersQuery = query(
    collection(db, "users"),
    where("memberId", "==", normalizedMemberId),
    limit(1)
  );

  const usersSnapshot = await getDocs(usersQuery);
  return !usersSnapshot.empty;
}

async function canReadLinkedMemberBeforeAuth(memberIdToCheck) {
  try {
    return await isMemberAlreadyLinked(memberIdToCheck);
  } catch (err) {
    if (err?.code === "permission-denied") {
      return false;
    }
    throw err;
  }
}

export function LoginPage({ members = [], appTitle = "FIFA GROUP", seasonTitle = "", logoUrl = "" }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isRegister = mode === "register";
  const activeMembers = Array.isArray(members) ? members : [];
  const safeLogoUrl = normalizeImageUrl(logoUrl);

  async function handleResetPassword() {
    setMessage("");
    const cleanUsername = String(username || "").trim();
    if (!cleanUsername) {
      setMessage("اكتب اسم المستخدم أولًا لإرسال رابط إعادة تعيين كلمة المرور.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, usernameToFirebaseEmail(cleanUsername));
      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد الحساب المرتبط بهذا المستخدم.");
    } catch (err) {
      console.error(err);
      setMessage(firebaseAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const cleanUsername = String(username || "").trim();
    const cleanPassword = String(password || "").trim();
    const normalizedMemberId = cleanId(memberId);

    if (!cleanUsername) {
      setMessage("اكتب اسم المستخدم.");
      return;
    }

    if (cleanPassword.length < 6) {
      setMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (isRegister && !normalizedMemberId) {
      setMessage("اختر العضو المرتبط بهذا الحساب.");
      return;
    }

    setBusy(true);

    try {
      const email = usernameToFirebaseEmail(cleanUsername);

      if (isRegister) {
        if (await canReadLinkedMemberBeforeAuth(normalizedMemberId)) {
          setMessage("هذه العضوية مرتبطة بحساب مسبقًا. تواصل مع FIFA لإعادة التفعيل أو تغيير الحساب.");
          return;
        }

        const result = await createUserWithEmailAndPassword(auth, email, cleanPassword);

        if (await isMemberAlreadyLinked(normalizedMemberId)) {
          await deleteUser(result.user).catch((deleteErr) => console.error(deleteErr));
          setMessage("هذه العضوية مرتبطة بحساب مسبقًا. تواصل مع FIFA لإعادة التفعيل أو تغيير الحساب.");
          return;
        }

        const selectedMember = activeMembers.find((item) => same(item.id, normalizedMemberId));

        await setDoc(doc(db, "users", result.user.uid), {
          username: cleanUsername,
          usernameKey: usernameKey(cleanUsername),
          memberId: normalizedMemberId,
          memberName: selectedMember?.name || "",
          role: "member",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return;
      }

      await signInWithEmailAndPassword(auth, email, cleanPassword);
    } catch (err) {
      console.error(err);
      setMessage(firebaseAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell" dir="rtl">
      <style>{authCss}</style>
      <section className="authCard">
        <div className={safeLogoUrl ? "authLogo hasImage" : "authLogo"}>
          {safeLogoUrl ? <img src={safeLogoUrl} alt="FIFA GROUP" /> : "FG"}
        </div>
        <p className="authKicker">{seasonTitle || "FIFA GROUP"}</p>
        <h1>{appTitle || "FIFA GROUP"}</h1>
        <p className="authSub">
          {isRegister
            ? "أنشئ حسابك باسم مستخدم وكلمة مرور، ثم اربطه بعضويتك."
            : "ادخل باسم المستخدم وكلمة المرور الخاصة بك."}
        </p>

        <form onSubmit={handleSubmit} className="authForm">
          <label>
            <span>اسم المستخدم</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="مثال: abdullah"
              autoComplete="username"
            />
          </label>

          <label>
            <span>كلمة المرور</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </label>

          {isRegister ? (
            <label>
              <span>اختر عضويتك</span>
              <select
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">اختر العضو</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {message ? <p className="authMessage">{message}</p> : null}

          <button type="submit" disabled={busy}>
            {busy ? "جاري التنفيذ..." : isRegister ? "إنشاء الحساب" : "دخول"}
          </button>
        </form>

        {!isRegister ? (
          <button type="button" className="authForgot" disabled={busy} onClick={handleResetPassword}>
            نسيت كلمة المرور؟
          </button>
        ) : null}

        <button
          type="button"
          className="authSwitch"
          onClick={() => {
            setMode(isRegister ? "login" : "register");
            setMessage("");
          }}
        >
          {isRegister ? "لدي حساب بالفعل" : "إنشاء حساب جديد"}
        </button>
      </section>
    </main>
  );
}

export function AuthMiniBadge({ profile, onLogout }) {
  const displayName = profile?.memberName || profile?.username || "عضو";

  return (
    <div className="authMiniBadge glassSoft">
      <span>أهلاً {displayName}</span>
      <button type="button" onClick={onLogout}>
        خروج
      </button>
    </div>
  );
}
