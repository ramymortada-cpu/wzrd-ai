# Sprint I — مجدول بريد المتابعة 48h (Retention)

**الأولوية:** 4 — Retention  
**المدة المتوقعة:** ~1 أسبوع  
**الحالة:** مخطط (بعد Deploy الحالي)  
**الـ shells:** منطق السيرفر + قوالب DB؛ **لا مسار UI جديد إلزامي** (إعدادات موجودة جزئياً في `/admin/settings` عبر email automation إن كانت مفعّلة)

---

## 1. الهدف

بعد أحداث التحويل:

- **Quick Check** مكتمل (lead عام — قد يكون بدون `userId`).
- **Full Audit** أو **Strategy Pack** مكتمل لمستخدم مسجّل.

إرسال **بريد متابعة بعد ~48 ساعة** إذا لم يكن المستخدم/الLead قد اتخذ **الخطوة التالية** (تعريف واضح لكل قناة: تسجيل، شراء، فتح رابط، إلخ).

**Scheduler:** يعمل **كل ساعة** يفحص صفوف «مجدولة» ويرسل ما استحق.

**تخطي الإرسال** إذا:

- المستخدم اشترى / فتح التقرير / سجّل دخول ونفّذ CTA (يتطلب تعريف «إجراء التحويل» في DB أو أعلام بسيطة).

---

## 2. الوضع الحالي في الكود (baseline)

| المكوّن | الملف | الواقع |
|--------|--------|--------|
| بريد فوري Quick Check | `server/wzrdEmails.ts` → `sendQuickCheckResultEmail` | يُستدعى من `leads.submitQuickCheck` — **فوري** (Sprint E) |
| تكامل Resend | `wzrdEmails.sendEmail` | يعمل عند `EMAIL_PROVIDER=resend` |
| قواعد الأتمتة | `server/emailTrigger.ts` → `fireEmailTrigger` | يقرأ `automationRules` + `emailTemplates`؛ إذا `delayMinutes > 0` يُدرج في **`emailSendLog`** بحالة **`queued`** |
| معالجة `queued` | بحث في `server/**/*.ts` | **لا يوجد worker** يمر على `queued` ويُرسل لاحقاً — السجلات تبقى معلّقة |
| enum المحفزات | `drizzle/schema.ts` → `automationRules.trigger` | `signup`, `first_tool_run`, `low_score`, `credits_low`, `inactive_*`, `premium_purchase`, `manual` — **لا** `quick_check_48h` أو `audit_followup` |
| جدولة عامة | `server/_core/index.ts` | `setInterval` كل ساعة لشهرية التقارير؛ `startNewsletterScheduler`; `startAbandonedCartWorker`؛ **لا** مجدول لـ email queue |
| سجل الإرسال | `emailSendLog` | يحتوي `status`, `trigger`, `userId` (اختياري) |

---

## 3. الفجوات (التنفيذ)

1. **جدول أو حقول جديدة** (أو إسناد ذكي لـ `emailSendLog`):
   - وقت التنفيذ المخطط `scheduledAt`.
   - نوع الحملة: `quick_check` | `full_audit` | `strategy_pack`.
   - مفتاح إلغاء: `cancelledReason` / ربط بـ `leadId` أو `userId` + `auditId`.

2. **تسجيل الجدولة** عند:
   - نهاية `submitQuickCheck` (للبريد — قد يحتاج `leadId` + email فقط).
   - نجاح `fullAudit.run` / اكتمال Strategy (للمستخدم المسجّل).

3. **`processEmailQueue` hourly:**
   - استعلام `WHERE status='queued' AND scheduledAt <= NOW()` (أو ما يعادله في Drizzle).
   - إرسال عبر `sendEmail`؛ تحديث `sent` / `failed`.
   - تسجيل سبب التخطي (تم الشراء، إلخ).

4. **قوالب HTML** في `emailTemplates` + قواعد `automationRules` — أو توسيع seed في `server/seeds/emailTemplates.ts`.

5. **توسيع enum `trigger` في MySQL** — يتطلب **migration** (`drizzle/`) لأن القيم محصورة في الـ schema.

6. **Quick Check بدون userId:** إما إبقاء المتابعة عبر **email فقط** بدون `fireEmailTrigger`، أو جدول `lead_email_schedules` منفصل.

---

## 4. نطاق المنتج (MVP)

- [ ] مجدول ساعي واحد في `server/_core/index.ts` (أو ملف `server/emailQueueWorker.ts`) يعالج `emailSendLog.queued` بشرط `scheduledAt`.
- [ ] مسار واحد: **مستخدم مسجّل** + **Full Audit اكتمل** → جدولة 48h → بريد CTA إلى `/app/pricing` أو `/app/full-audit`.
- [ ] تخطي إذا `deductCredits` أو شراء Paymob حدث لنفس المستخدم في النافذة الزمنية (استعلام على `creditTransactions` أو جدول الطلبات).
- [ ] اختبارات وحدة على دالة «هل يجب الإرسال؟».

### v1

- [ ] Quick Check leads (email فقط).
- [ ] Strategy Pack نفس المنطق.
- [ ] لوحة مراقبة بسيطة في Admin لحالة الطابور.

---

## 5. الـ Routes

| نوع | مسار |
|-----|------|
| لا UI جديد للـ MVP | — |
| اختياري لاحقاً | `/admin/settings` — ربط قوالب موجودة في `emailAutomation` router |

---

## 6. الأمان والخصوصية

- عدم تسريب `auditId` في روابط عامة بدون token موقّت إن لزم.
- احترام **unsubscribe** لاحقاً (خارج MVP إن لم يكن موجوداً).

---

## 7. Tests + DoD

**Tests**

- vitest: جدولة + إلغاء + معالجة دفعة وهمية.
- لا تعتمد على شبكة Resend في CI — mock `sendEmail`.

**DoD**

- `pnpm vitest run` + `tsc --noEmit`.
- في staging: سجل `queued` → بعد تعديل الساعة الاختبارية أو `scheduledAt` يدوياً → يتحول إلى `sent`.

---

## 8. تبعيات

- **Sprint G:** يمكن أن يغذي محتوى البريد بـ `top3Issues`.
- **Sprint H:** بريد «PDF جاهز» اختياري بعد H.
