// FIFA GROUP — sanitized V3/V4 visual bridge
// Keeps the legacy layout fixes, but applies Claude Design System v6 fixes:
// - disables Google Fonts import from v3Override
// - replaces old neon gold/red literals with refined v6 colors
// - preserves all existing layout/stability CSS

import { v3OverrideCss as legacyV3OverrideCss } from "./v3Override";

export const v3OverrideCss = String(legacyV3OverrideCss || "")
  .replace(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\);?/gi, "/* Google Fonts disabled: local fonts are loaded from fifa-theme.css */")
  .replace(/#FFD700/gi, "#E5B53A")
  .replace(/#FF4757/gi, "#E63946")
  .replace(/rgba\(255\s*,\s*215\s*,\s*0\s*,/gi, "rgba(229,181,58,")
  .replace(/rgba\(255\s*,\s*71\s*,\s*87\s*,/gi, "rgba(230,57,70,")
  .replace(/rgb\(255\s*,\s*215\s*,\s*0\s*\)/gi, "rgb(229,181,58)")
  .replace(/rgb\(255\s*,\s*71\s*,\s*87\s*\)/gi, "rgb(230,57,70)");
