# Sprint J — رادار الويب في نتائج Full Audit (UX)

**الأولوية:** 5 — UX  
**المدة المتوقعة:** 2–3 أيام  
**الحالة:** مخطط (بعد Deploy الحالي)  
**الـ shells:** **`/app/full-audit`** — `client/src/pages/FullAudit.tsx`

---

## 1. الهدف

عرض **Radar chart تفاعلي** في واجهة نتائج الـ Full Audit (بعد اكتمال التشغيل)، بالتوازي مع الرادار **الثابت SVG** الموجود في PDF.

- استخدام **`recharts`** (الحزمة مثبتة في `package.json` — `recharts@^2.15.2`).
- مكوّن مقترح: **`RadarChart`**, **`PolarGrid`**, **`PolarAngleAxis`**, **`PolarRadiusAxis`**, **`Radar`** من `recharts`.
- إعادة استخدام بيانات **`audit.pillars`** (نفس مصدر `buildRadarSvg` في `server/fullAuditPdf.ts`).

---

## 2. الوضع الحالي في الكود (baseline)

| المكوّن | الملف | الواقع |
|--------|--------|--------|
| نتائج الـ audit UI | `client/src/pages/FullAudit.tsx` | بطاقات `PillarCard` + شريط تقدم لكل محور — **لا** رسم بياني قطبي |
| PDF | `server/fullAuditPdf.ts` → `buildRadarSvg` | SVG مضمّن في HTML للطباعة — **لا يُعاد استخدامه في React** |
| recharts في المشروع | `client/src/pages/WzrdAdmin.tsx`, `Financials.tsx`, `MyBrand.tsx`, `client/src/components/ui/chart.tsx` | أنماط جاهزة لـ `ResponsiveContainer` + ألوان Tailwind |
| نوع البيانات | `FullAudit.tsx` — واجهة `Pillar` | `id`, `name`, `nameAr`, `score`, `summary`, `findings`, `source` |

---

## 3. الفجوات

1. **مكوّن جديد** مثلاً `FullAuditRadar.tsx` يستقبل `pillars: Pillar[]` + `isAr` لاختيار تسميات المحاور.
2. **دمجه في تخطيط النتائج** بعد الـ Hero score وقبل أو بجانب شبكة `PillarCard` (قرار تصميم: عمود واحد على الموبايل).
3. **إمكانية الوصول:** `aria-label`، تباين ألوان، عدم الاعتماد على اللون وحده.
4. **اختبار بصري خفيف** أو لقطة في `e2e` اختيارية — يكفي unit أن البيانات تُحوَّل لشكل `recharts` بدون NaN.

---

## 4. نطاق المنتج (MVP)

- [ ] رادار واحد يعرض حتى **7** محاور بدرجات 0–100.
- [ ] إخفاء الرادار إذا `pillars` فارغة أو غير صالحة.
- [ ] تنسيق متسق مع ألوان `scoreColor` / العلامة الذهبية للعميل إن أمكن.

### خارج نطاق MVP

- مقارنة لقطتين زمنيتين على نفس الرسم.
- تصدير PNG من المتصفح.

---

## 5. الـ Routes

| مسار | ملاحظة |
|------|--------|
| `/app/full-audit` | نفس الصفحة — لا مسار جديد |
| `/app/full-audit/:id` | عند تحميل audit محفوظ من DB |

---

## 6. الأداء

- الرسم خفيف؛ استخدم `ResponsiveContainer` بارتفاع ثابت (~280–320px) مثل الـ PDF.
- تجنب إعادة رسم ثقيلة في كل tick — `useMemo` على بيانات الرادار.

---

## 7. Tests + DoD

**Tests**

- وحدة: دالة `pillarsToRadarData(pillars)` → مصفوفة `{ subject, score }[]` بحد أقصى 7 عناصر.
- اختياري: React Testing Library snapshot بسيط.

**DoD**

- `pnpm vitest run` + `tsc --noEmit`.
- يدوياً: تشغيل audit حقيقي → الرادار يظهر ويتطابق تقريباً مع PDF.

---

## 8. تبعيات

- لا تعارض مع **Sprint H** (PDF يبقى SVG).
- **Sprint K:** لا ارتباط مباشر.
