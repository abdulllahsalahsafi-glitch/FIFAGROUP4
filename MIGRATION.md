# تحديث نظام التصميم FIFA GROUP v6 — تعليمات الترقية

هذا المجلد يحتوي كل التغييرات اللازمة لتطبيق **Palette A · Refined** وخطوط Tajawal + Orbitron محلياً على مستودع `FIFAGROUP2-` على GitHub.

## ما الذي تغيّر؟

1. **لونان فقط:**
   - `--fg-red` من `#FF4757` → **`#E63946`** (أحمر بثّ أعمق)
   - `--fg-gold` من `#FFD700` → **`#E5B53A`** (شامبانيا، ليس نيون أصفر)

2. **الخطوط محلياً** بدل Google Fonts CDN:
   - 7 أوزان من Tajawal
   - 6 أوزان من Orbitron

كل شيء آخر — الأخضر، السماوي، البنفسجي، المسافات، الـ shadows، الـ keyframes — لم يتغيّر.

---

## الخطوات (3 أوامر)

### 1. افتح مستودعك محلياً

```bash
cd path/to/FIFAGROUP2-
git checkout master
git pull
git checkout -b design-system-v6
```

### 2. انسخ الملفات من هذا المجلد

من مجلد `migration/` المُنزَّل، انسخ المحتوى فوق مستودعك:

```bash
# من داخل migration/
cp -r src/* /path/to/FIFAGROUP2-/src/
cp -r public/* /path/to/FIFAGROUP2-/public/
```

أو على Windows من File Explorer: اسحب مجلد `src` و `public` فوق المستودع واختر "Replace".

### الملفات التي ستُستبدل أو تُضاف:

| الملف | العملية |
|---|---|
| `src/fifaTheme.css` | يُستبدل |
| `src/theme/fifa-theme.css` | يُستبدل |
| `public/fonts/Tajawal-*.ttf` (7 ملفات) | يُضاف |
| `public/fonts/Orbitron-*.ttf` (6 ملفات) | يُضاف |

### 3. التزم وادفع

```bash
cd /path/to/FIFAGROUP2-
git add src/fifaTheme.css src/theme/fifa-theme.css public/fonts/
git commit -m "design: palette v6 (champagne gold + deeper red) + bundle Tajawal & Orbitron"
git push -u origin design-system-v6
```

ثم افتح Pull Request على GitHub وادمج إلى `master`.

---

## التحقق

بعد `git push`، شغّل التطبيق محلياً:

```bash
npm install   # إذا لم تكن قد فعلت
npm run dev
```

أو افحص الـ deploy التلقائي إذا كان مربوطاً بـ GitHub.

**ما يجب أن تراه:**
- الذهبي الجديد على البطولات والكؤوس — أهدأ، أقرب للنحاسي، لا يصرخ في وجهك
- الأحمر الجديد على شارات الهبوط والـ live dot الحمراء — أعمق، أقل وردي
- لا أكثر من تحميل خطوط من Google (شيك الـ Network tab) — كل الخطوط من `/fonts/`

**ما لن تراه:**
- أي اختلاف في التخطيط أو الـ React logic — لم نمسّ أي JSX
- أي اختلاف في الـ Firebase / Google Sheets — لم نمسّ أي logic

---

## مشاكل محتملة

**(1) الخطوط لا تظهر؟**
تأكد أن `public/fonts/` مرفوع وأن `vite.config.js` لم يستثنِه. Vite يخدم `public/` كـ root افتراضياً، لذا `/fonts/Tajawal-Regular.ttf` يجب أن يعمل بدون تعديل.

**(2) ألوان قديمة لا تزال تظهر في مكان ما؟**
ابحث في `src/` عن literal hex strings:
```bash
grep -r "#FFD700\|#FF4757" src/
```
إذا وجدت، استبدلها يدوياً بـ `#E5B53A` و `#E63946`.

**(3) أحجام الملفات؟**
كل خطوط Tajawal مجتمعة ≈ 700KB. Orbitron ≈ 250KB. إجمالي ≈ 1MB إضافي للـ bundle. هذا أقل من 4-5 طلبات Google Fonts، وأسرع تحميلاً.

---

## التراجع

إن أردت العودة:

```bash
git checkout master
git branch -D design-system-v6
```

أو في الـ PR على GitHub، اضغط Close.

---

## الخطوات التالية (اختيارية)

لاحقاً، إذا أردت تطبيق التحسينات الأخرى التي عملناها في نظام التصميم:

1. **Number Bleed hero** على `HomePage.jsx` — يحتاج تعديل JSX (سأساعدك إن أردت)
2. **Lucide icons** بدل الإيموجي — يحتاج استبدال `renderSmartIcon` في `src/utils/ui.jsx`
3. **الأزرار الموحّدة** — يحتاج CSS class جديدة عبر التطبيق

أرسل لي رسالة "طبّق التحسينات التالية" وسأجهّز patch ثانٍ.
