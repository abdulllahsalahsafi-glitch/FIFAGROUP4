// ═══════════════════════════════════════════════════════════
// src/utils/ui.js
// دوال واجهة المستخدم المستخرجة من App.jsx
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { clean } from './helpers';

// DEFAULT_CONFIG is inlined here for linkIcon default param.
// Keep icon defaults empty so old emoji icons do not appear when settings are missing.
const DEFAULT_CONFIG = {
  linkFacebookIcon: "",
  linkTournamentsIcon: "",
  linkSeasonIcon: "",
  linkDefaultIcon: "",
};

export function toLatinDigits(value) {
  const source = String(value ?? "");
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return source.replace(/[٠-٩]/g, (d) => String(arabic.indexOf(d))).replace(/[۰-۹]/g, (d) => String(persian.indexOf(d)));
}

export function formatLatinNumber(value) {
  const number = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number)) return toLatinDigits(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(number));
}

export function renderSmartIcon(value) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  if (/^https?:\/\//i.test(icon) || icon.startsWith("data:image")) {
    return React.createElement('img', { className: "smartIconImg", src: icon, alt: "" });
  }
  return null;
}

export function normalizeImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch?.[1])
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
  const imgurMatch = url.match(/^https?:\/\/imgur\.com\/([A-Za-z0-9]+)$/);
  if (imgurMatch?.[1]) return `https://i.imgur.com/${imgurMatch[1]}.png`;
  return url;
}

export function toCssSize(value, fallback = "50px") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return `${raw}px`;
  return raw;
}

export function avatar(seed) {
  return (
    "https://api.dicebear.com/8.x/initials/svg?seed=" +
    encodeURIComponent(seed || "user")
  );
}

export function linkIcon(name, config = DEFAULT_CONFIG) {
  const value = clean(name);
  if (value.includes("فيس")) return config.linkFacebookIcon;
  if (value.includes("بطولات")) return config.linkTournamentsIcon;
  if (value.includes("موسم")) return config.linkSeasonIcon;
  return config.linkDefaultIcon;
}