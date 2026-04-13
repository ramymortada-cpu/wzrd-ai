# Sprint G — Quick Check + Website Scraping + Lighthouse (Conversion)

**الأولوية:** 2 — Conversion  
**المدة المتوقعة:** ~1 أسبوع  
**الحالة:** مخطط (بعد Deploy الحالي)  
**الـ shells:** مسار عام **`/quick-check`** (لا يدخل `/app/*` — متوافق مع `App.tsx`)

---

## 1. الهدف

عند إرسال **Quick Check** مع **`website`** صالح:

1. تشغيل **`scrapeWebsite`** + **`fetchLighthouseScores`** بالتوازي (نفس نمط `fullAudit.run` / `premium` reports).
2. إرجاع للواجهة (وبناءً للـ prompt):
   - **`top3Issues`** (أو ما يعادلها في نص التشخيص — قد تكون مدمجة في `fullDiagnosis` أو حقول جديدة صريحة).
   - **`lighthouseScores`** (أو ملخص أداء مختصر لتجنب حمولة كبيرة على public endpoint).
   - **`hasWebsiteData`** boolean يوضح إن البيانات جاءت من موقع حقيقي وليس افتراضياً.

**قيود:** `submitQuickCheck` هو **`publicProcedure`** — يجب الحفاظ على **rate limit** (`server/_core/middleware.ts` → `leads.submitQuickCheck`) وتجنب timeouts طويلة جداً.

---

## 2. الوضع الحالي في الكود (baseline)

| المكوّن | الملف | الواقع |
|--------|--------|--------|
| الإدخال | `shared/validators.ts` → `quickCheckInput` | يتضمن `website: optionalUrl` + `answers` |
| الواجهة | `client/src/pages/QuickCheck.tsx` | حقل `website` في `formData` يُرسل مع الطلب |
| الـ API | `server/routers/leads.ts` → `submitQuickCheck` | يبني prompt من `answersText` + **سطر ثابت** `Website: ${sanitized.website \|\| 'None'}` — **لا يستدعي scrape ولا Lighthouse** |
| الإرجاع للعميل | نفس الـ mutation | `{ id, diagnosisTeaser, score, scoreLabel, recommendedService }` فقط — **لا** `top3Issues` / `lighthouse` / `hasWebsiteData` |
| المحركات الجاهزة | `server/researchEngine.ts` (مستوردة في `fullAudit.ts`, `premium.ts`) | `scrapeWebsite`, `fetchLighthouseScores`, `buildWebsiteContext` موجودة ومُختبرة في مسارات أخرى |
| مرجع تنفيذي | `server/routers/fullAudit.ts` (~394–395) | `Promise.allSettled` على scrape + lighthouse عند `websiteUrl` |
| مرجع ثانٍ | `server/routers/premium.ts` (~260–268) | نفس النمط مع `try/catch` وتسجيل تحذير |

---

## 3. الفجوات (ما يجب بناؤه في Sprint G)

1. **استدعاء scrape + Lighthouse داخل `submitQuickCheck`** بعد التحقق من الـ URL (عبر **`urlSanitizer`** إن وُجد في المسار العام).
2. **دمج المخرجات في الـ LLM prompt** (مقتطف محدود الحجم من الـ scrape + أرقام Lighthouse) حتى يتحسن التشخيص بدون تسريب حمولة ضخمة.
3. **توسيع الـ response** (مع الحفاظ على التوافق الخلفي إن لزم):
   - `hasWebsiteData: boolean`
   - `lighthouseScores?: { performance?, accessibility?, bestPractices?, seo? }` أو شكل موحّد مع `fullAudit` meta
   - `top3Issues?: string[]` — إما من الـ JSON schema للـ LLM أو استخراج منسّق من `fullDiagnosis`
4. **Timeout أقصر من Full Audit** للمسار العام (مثلاً 15–20s لكل من scrape/lighthouse أو إلغاء ذكي).
5. **اختبارات:** `server/business-logic.test.ts` / ملف جديد — mock لـ `scrapeWebsite`/`fetchLighthouseScores` + تأكيد أن الـ response يحتوي الحقول عند وجود URL.

---

## 4. نطاق المنتج (MVP)

- [ ] إذا `website` فارغ أو غير صالح → السلوك الحالي بدون تغيير كاسر.
- [ ] إذا URL صالح → parallel fetch → `hasWebsiteData` + دمج في prompt → حقول إضافية في الـ return.
- [ ] تحديث **`QuickCheck.tsx`** لعرض شارة «تم تحليل الموقع» + ملخص Lighthouse إن وُجد (اختياري UI صغير).
- [ ] لا تخزين كامل لـ HTML في `lead` إلا إذا كان هناك قرار منتج (يفضل تجنب ذلك في الـ MVP).

---

## 5. الـ Routes

| نوع | مسار |
|-----|------|
| عام | `/quick-check` — بدون تغيير |
| API | `POST` tRPC `leads.submitQuickCheck` — بدون مسار HTTP جديد |

---

## 6. الأمان

- **Public endpoint:** لا تعرض أخطاء داخلية تفصيلية للعميل؛ log فقط.
- **Rate limit:** موجود — راجع الحاجة لتشديد إضافي بعد إضافة scrape (تكلفة CPU/شبكة).
- **SSRF:** استخدم نفس حماية الـ URL كما في باقي المشروع (`urlSanitizer` / قواعد `researchEngine`).

---

## 7. Tests + DoD

**Tests**

- Unit: parser/response shape لـ `submitQuickCheck` مع URL mock.
- تكامل خفيف: التأكد أن `quickCheckInput` يمرّ مع `website`.

**Definition of Done**

- `pnpm vitest run` أخضر.
- `pnpm exec tsc --noEmit` بدون أخطاء.
- استدعاء حقيقي (staging) بـ URL عام يعيد `hasWebsiteData === true` عند نجاح Lighthouse (أو `false` عند فشل مع graceful degradation).

---

## 8. تبعيات

- **Sprint I:** بريد المتابعة قد يستخدم نفس `top3Issues` في القوالب.
- **Sprint F:** لا تعارض مباشر — نفس محرك البحث لكن سياق مختلف.
