# Sprint H — Strategy Pack PDF (Value)

**الأولوية:** 3 — Value  
**المدة المتوقعة:** 1–2 أسبوع  
**الحالة:** مخطط (بعد Deploy الحالي)  
**الـ shells:** **`/app/full-audit`** (نتائج + أزرار) — المحمي بـ `ClientLayout` + `protectedProcedure`

---

## 1. الهدف

توليد **PDF لحزمة الاستراتيجية (25+ صفحة)** بنفس المكدس الحالي للـ Full Audit:

- **Puppeteer** + **HTML** + خط **Amiri** (من Google Fonts) كما في `server/fullAuditPdf.ts`.
- أقسام واضحة:
  - **Competitive** (تنافسية)
  - **Messaging** (الرسالة)
  - **90-day Roadmap** (خطة ٩٠ يوم)

مصدر البيانات: ناتج **`fullAudit.generateStrategyPack`** المخزّن/المرتبط بـ `auditId` (الـ mutation موجودة في `server/routers/fullAudit.ts` وتخصم كريدت `strategy_pack`).

---

## 2. الوضع الحالي في الكود (baseline)

| المكوّن | الملف | الواقع |
|--------|--------|--------|
| توليد المحتوى | `server/routers/fullAudit.ts` → `generateStrategyPack` | `protectedProcedure` — 3 استدعاءات LLM متوازية، عتبة نجاح ≥2، خصم كريدت عند النجاح |
| الواجهة | `client/src/pages/FullAudit.tsx` | عرض JSON عبر `StrategyJsonBlock` لـ competitive / messaging / roadmap — **لا زر PDF للـ Strategy** |
| PDF Full Audit | `server/fullAuditPdf.ts` + `renderFullAuditPdfToFile` | HTML طويل، `buildRadarSvg`, `escapeHtml`, `FULL_AUDIT_BRAND`، Puppeteer |
| التحميل | `fullAudit.generatePdf` + `server/fullAuditPdfRoutes.ts` | مسار تنزيل UUID + `writePdfMetaFile` + تنظيف 24h |
| الـ middleware | `server/_core/middleware.ts` | `fullAudit.generateStrategyPack` تحت `rateLimiters.publicWrite` (حد معدّل الطلبات — الاسم تاريخي؛ الـ procedure نفسها protected) |

---

## 3. الفجوات

1. **لا يوجد `strategyPdf.ts` أو فرع داخل `fullAuditPdf.ts`** يرender الـ strategy sections إلى HTML متعدد الصفحات.
2. **لا يوجد `fullAudit.generateStrategyPdf`** (أو اسم موازٍ) يتحقق من الملكية + وجود `strategy` في `resultJson` / عمود مخصص إن وُجد.
3. **تخزين ناتج Strategy Pack:** `generateStrategyPack` يرجع `{ strategy: { competitive, messaging, roadmap } }` للعميل **دون** `update` واضح لـ `full_audit_results.resultJson` في `fullAudit.ts` — اليوم الواجهة (`FullAudit.tsx`) تحتفظ بالـ JSON في **state محلي** فقط. للـ PDF لازم **مصدر حقيقة في DB** (دمج `strategyPack` داخل `resultJson` أو عمود JSON منفصل + migration إن لزم) حتى لا يضيع المحتوى بعد refresh ولا نُعيد LLM عند كل تحميل.
4. **حجم وتنقل الصفحات:** breakpoints CSS للطباعة، فصل صفحات للأقسام الثلاثة + غلاف + TOC اختياري.
5. **اختبارات:** مشابهة `server/full-audit-pdf.test.ts` — smoke على أن HTML يُنتج بدون crash (يمكن mock puppeteer في CI إن لزم).

---

## 4. نطاق المنتج (MVP → v1)

### MVP

- [ ] إذا لم يُشغّل Strategy Pack بعد → رسالة واضحة في UI + عدم عرض زر PDF.
- [ ] بعد نجاح `generateStrategyPack` → زر **«تحميل PDF»** يستدعي procedure جديدة → `downloadUrl` مثل Full Audit أو نفس الـ route مع `kind=strategy`.
- [ ] HTML: غلاف WZZRD + 3 أقسام كبيرة + `escapeHtml` لكل نص مستخدم من LLM.

### v1

- [ ] 25+ صفحة مع مخططات/جداول إضافية إن لزم.
- [ ] إدماج مقتطف من نتائج الـ 7 pillars من نفس الـ audit كمقدمة (اختياري منتج).

---

## 5. الـ Routes

| نوع | مسار / API |
|-----|------------|
| UI | `/app/full-audit` و `/app/full-audit/:id` — زر جديد في `FullAudit.tsx` |
| API | `fullAudit.generateStrategyPdf` (مقترح) — `protectedProcedure` + ownership على `auditId` |
| تنزيل | إعادة استخدام نمط `/api/download-pdf/:uuid` مع meta يميز `auditId` + نوع الملف أو مسار منفصل لتفادي التعارض |

---

## 6. الأمان

- نفس قواعد **Full Audit PDF:** ملكية `userId`، عدم تسريب مسارات نظام الملفات، تنظيف الملفات القديمة.
- **XSS:** كل محتوى LLM يمر عبر `escapeHtml` عند إدراجه في HTML.

---

## 7. Tests + DoD

**Tests**

- وحدة: بناء HTML strategy من payload ثابت.
- اختياري: لقطة PDF في بيئة لها Chromium (أو skip في CI).

**DoD**

- `pnpm vitest run` + `tsc --noEmit` أخضر.
- مسار يدوي: تشغيل Strategy Pack → تحميل PDF → فتح الملف والتحقق من الأقسام الثلاثة.

---

## 8. تبعيات

- **Sprint G:** لا إلزام مباشر.
- **Sprint I:** يمكن ربط بريد «Strategy جاهزة» بعد اكتمال PDF (اختياري).
