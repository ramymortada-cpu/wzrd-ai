# WZZRD AI — Pre-Launch Execution Plan (Deep Audit)

بصفتي مهندس بخبرة 30 سنة في إطلاق التطبيقات، راجعت الكود بالكامل (Server, Client, DB, CI/CD, Security). التطبيق قوي جداً كـ Architecture، لكن فيه ثغرات قاتلة (Showstoppers) لو نزلنا بيها لايف، إما الداتا هتبوظ، أو الـ CI هيفشل، أو اليوزر هيشوف 404.

هنا خطة التنفيذ المفصلة مقسمة حسب الأولوية. **لازم نخلص Phase 1 و Phase 2 قبل الإطلاق.**

---

## Phase 1: Critical Showstoppers (لازم فوراً)

هذه المشاكل ستؤدي إلى فشل التطبيق أو فشل الـ Deployment.

| Task | المشكلة | الحل المطلوب |
|------|---------|--------------|
| **1.1** | **Duplicate Migrations**<br>في ملفين `0011` وملفين `0022` في مجلد `drizzle/`. ده بيكسر الـ Drizzle runner وممكن يدمر الـ Production DB. | مسح الملفات المكررة القديمة (`0011_cynical_vance_astro.sql` و `0022_acquisition_engine.sql`) والتأكد إن الـ runner بيقرأ بالترتيب الصح. |
| **1.2** | **Broken CI/CD Docker Build**<br>الـ CI بيفشل في خطوة `Build & push API image` لأنه بيدور على `infrastructure/docker/Dockerfile.api` والمجلد ده مش موجود أصلاً (عندنا `Dockerfile` واحد في الـ root). | تعديل `.github/workflows/ci.yml` عشان يستخدم الـ `Dockerfile` الموجود في الـ root، أو نمسح خطوة الـ Docker build لو إحنا بنعمل deploy على Railway مباشرة. |
| **1.3** | **Missing Pages (404)**<br>الـ UI مليان لينكات لـ `/services-info` و `/pricing` و `/referrals`، لكن الصفحات دي مش موجودة في `App.tsx` أو ممسوحة. | 1. إنشاء صفحة `/services-info` بسيطة.<br>2. إضافة route الـ `/pricing` في `App.tsx` (الملف موجود بس مش معموله route).<br>3. إخفاء أي زرار لـ referrals مؤقتاً. |
| **1.4** | **OTP Rate Limiting**<br>مفيش Rate Limit على الـ OTP Login (`auth.requestLogin` و `auth.verifyLogin`). أي حد يقدر يعمل Brute Force ويبعت آلاف الإيميلات. | إضافة `rateLimiters.auth` على الـ OTP endpoints في `server/_core/index.ts`. |

---

## Phase 2: Branding & UX Polish (قبل الإطلاق بيوم)

التطبيق اسمه WZZRD AI، لكن بقايا "Primo Marca" موجودة في كل مكان، وده بيضرب الـ Positioning.

| Task | المشكلة | الحل المطلوب |
|------|---------|--------------|
| **2.1** | **Primo Marca Leftovers**<br>اسم Primo Marca موجود في `package.json`، `siteConfig.ts`، `i18n.tsx`، وفي الـ Dashboard Layout. | تغيير كل الـ references لـ WZZRD AI. تغيير الإيميل الافتراضي من `hello@primomarca.com` لـ إيميل WZZRD. |
| **2.2** | **Missing SEO & OG Tags**<br>مفيش صورة `og-image.png` في الـ `public` folder، رغم إن `index.html` بيشاور عليها. السوشيال شيرينج هيبان مكسور. | تصميم/إضافة `og-image.png` (1200x630) في `client/public/`. |
| **2.3** | **CSP Missing Groq**<br>الـ Content Security Policy في `security.ts` مش بتسمح بـ `api.groq.com`، وده ممكن يكسر الـ API calls لو اتعملت من الـ Client. | إضافة `https://api.groq.com` لـ `connect-src` في `server/_core/security.ts`. |

---

## Phase 3: Hardening & Post-Launch (أول أسبوع بعد الإطلاق)

أشياء لن تمنع الإطلاق، لكن يجب حلها للاستقرار.

| Task | المشكلة | الحل المطلوب |
|------|---------|--------------|
| **3.1** | **In-Memory OTP Store**<br>الـ OTP متخزن في `Map` في الميموري. لو السيرفر عمل Restart، كل الـ OTPs هتروح. لو عملنا Scale لـ 2 instances، الـ Login هيفشل. | نقل الـ OTP store لـ Redis أو Database table بـ TTL. |
| **3.2** | **Research Engine Mock**<br>الـ `research.ts` router فيه `TODO` صريح إنه بيستخدم Mock data ومش متوصل بـ real APIs. | ربط الـ Research Engine بـ Perplexity/Tavily أو إخفاء الـ Feature مؤقتاً. |
| **3.3** | **Console.log Cleanup**<br>فيه 5 `console.log` في السيرفر مش بيستخدموا `logger.info`، فمش هيتسجلوا في Sentry. | استبدالهم بـ `logger.info` أو `logger.error`. |

---

## طريقة العمل (Workflow)

بناءً على طلبك، هنمشي **Task by Task** بالترتيب (Sequential). مش هعمل حاجة غير لما تديني الـ "Go-ahead".

**أول حاجة لازم نعملها دلوقتي هي Phase 1.1 (Duplicate Migrations) و Phase 1.2 (CI/CD Fix).**

تحب أبدأ في **Task 1.1 و 1.2** فوراً؟
