// ═══════════════════════════════════════════════════════════
// src/utils/helpers.js
// الدوال المساعدة العامة المستخرجة من App.jsx
// ═══════════════════════════════════════════════════════════

export function formatTransferDate(value) {
  if (value?.toDate) return value.toDate().toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function usernameKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function usernameToFirebaseEmail(value) {
  const encoded = encodeURIComponent(usernameKey(value))
    .replace(/%/g, "p")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${encoded || "user"}@fifagroup.local`;
}

export function firebaseAuthMessage(error) {
  const code = String(error?.code || "");
  if (code.includes("auth/email-already-in-use"))
    return "اسم المستخدم مستخدم مسبقًا.";
  if (code.includes("auth/invalid-credential"))
    return "اسم المستخدم أو كلمة المرور غير صحيحة.";
  if (code.includes("auth/user-not-found"))
    return "لا يوجد حساب بهذا الاسم.";
  if (code.includes("auth/wrong-password"))
    return "كلمة المرور غير صحيحة.";
  if (code.includes("auth/weak-password"))
    return "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";
  return "حدث خطأ. حاول مرة أخرى.";
}

export function clean(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function cleanId(value) {
  return String(value || "").trim();
}

export function same(a, b) {
  return cleanId(a) === cleanId(b);
}

export function toNumber(value) {
  const number = Number(String(value || "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value) {
  const raw = String(value || "0").trim();
  const number = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number)) return raw;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.max(Math.min(number, 999999999), -999999999)
  );
}

export function isEnabled(value) {
  return String(value).toLowerCase() !== "false" && String(value) !== "0";
}

export function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9؀-ۿ]/g, "");
}

export function removeBom(value) {
  return String(value || "").replace(/^﻿/, "");
}

export function parseCSV(text) {
  const cleanText = removeBom(String(text || ""));
  if (!cleanText.trim()) return [];
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < cleanText.length; i += 1) {
    const char = cleanText[i];
    const next = cleanText[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell);
  rows.push(row);
  const nonEmpty = rows.filter((r) => r.some((c) => String(c || "").trim()));
  if (!nonEmpty.length) return [];
  const headers = nonEmpty[0].map((item) => normalizeKey(item));
  return nonEmpty.slice(1).map((values) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = String(values[index] || "").trim();
    });
    return obj;
  });
}

// ─── Local helpers used by sort functions ─────────────────────────────────────
function _dateValue(date) {
  const match = String(date || "").match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return 0;
  return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function _notificationTimeValue(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

// ─── Sort / misc helpers moved from App.jsx ────────────────────────────────────

export function firstValue(source, ...keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

export function splitIds(value) {
  return String(value || "")
    .split(/[\/،,|]+/)
    .map((item) => String(item || "").trim())
    .filter(
      (item) =>
        item &&
        !["none", "unknown", "لايوجد", "لابيانات", "-"].includes(String(item || "").trim().toLowerCase())
    );
}

export function sortByDateDesc(a, b) {
  return (
    _dateValue(b.date || b.createdAt || b.createdat) - _dateValue(a.date || a.createdAt || a.createdat) ||
    toNumber(b.edition) - toNumber(a.edition)
  );
}

export function sortMixedRowsDesc(a, b) {
  return (
    _dateValue(b.date || b.createdAt || b.createdat) - _dateValue(a.date || a.createdAt || a.createdat) ||
    _notificationTimeValue(b.createdAt || b.createdat || b.updatedAt || b.updatedat || b.date) - _notificationTimeValue(a.createdAt || a.createdat || a.updatedAt || a.updatedat || a.date)
  );
}

export function sortByDateAsc(a, b) {
  return (
    _dateValue(a.date) - _dateValue(b.date) ||
    toNumber(a.edition) - toNumber(b.edition)
  );
}

export function sortRecordsAsc(rows) {
  return (rows || []).slice().sort(sortByDateAsc);
}
