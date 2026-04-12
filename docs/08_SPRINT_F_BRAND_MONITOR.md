# Sprint F — Brand Monitor (Revenue)

**الأولوية:** 1 — Revenue  
**المدة المتوقعة:** 2–3 أسابيع  
**الحالة:** مخطط (بعد Deploy الحالي)  
**الـ shells:** `/app/*` (عميل — اختياري لاحقاً)، `/cc/*` (وكالة — رئيسي)، `/admin/*` (إعدادات/تقارير إن لزم)

---

## 1. الهدف

تحويل **مراقبة العلامة** من «محرك خلفي + زر يدوي» إلى **منتج واضح يُباع أو يُقيد بالكريدت**:

- جدولة فحوصات دورية (يومي / أسبوعي) لكل عميل نشط.
- لوحة **Brand Monitor** في Command Center: إشارات، تنبيهات، اتجاهات، إجراءات مقترحة.
- تكامل إشعارات (داخل التطبيق → بريد / Slack لاحقاً مع Sprint I).
- تسعير أو حد كريدت لكل مسح لتبرير الـ Revenue.

---

## 2. الوضع الحالي في الكود (baseline)

| المكوّن | المسار / الملف | ملاحظات |
|--------|------------------|----------|
| Observatory engine | `server/brandObservatory.ts` | `observeClient`, `observeAllClients` — إشارات من Google search، توليد alerts، knowledge entries |
| tRPC | `server/routers/brandTwin.ts` | `brandTwin.observe`, `brandTwin.observeAll` — `checkEditor` |
| UI تقريباً | `client/src/pages/BrandTwin.tsx` + مسار `/cc/brand-twin` | Brand Twin / health — توسيع أو شاشة مرافقة للـ Monitor |
| جداول | `drizzle/schema.ts` — `brand_alerts`, `brand_health_snapshots`, `brand_metrics` | جاهزة للعرض والتصفية |

### 2.1 فجوات يجب معالجتها في Sprint F (تقنية)

1. **`createBrandAlert` vs Observatory**  
   `brandObservatory` يمرّر حقولاً مثل `type` / `message` بينما `server/db/brand.ts` → `createBrandAlert` يتوقع `title`, `description`, `dimension`, و`severity` ضمن enum الجدول (`critical` \| `warning` \| `info` \| `opportunity`).  
   **مهمة Sprint F:** توحيد طبقة الـ mapper (أو تعديل الـ observatory) + اختبارات إدراج فعلي في DB.

2. **لا يوجد cron مدمج للـ observeAll**  
   التشغيل اليومي حالياً يدوي عبر tRPC.  
   **مهمة Sprint F:** worker أو `setInterval` خلف `NODE_ENV` + خيار Railway Cron / جدولة خارجية تستدعي endpoint محمي بـ secret.

3. **التكلفة وإساءة الاستخدام**  
   كل مسح يستدعي بحثاً خارجياً.  
   **مهمة Sprint F:** rate limit لكل `clientId` + خيار خصم كريدت من `TOOL_COSTS` أو باقي إضافي في `server/db/credits.ts`.

---

## 3. نطاق المنتج (MVP → v1)

### MVP (أسبوع 1–2)

- [ ] إصلاح مسار الحفظ: alerts تظهر في `brandTwin.getAlerts` / لوحة العميل بدون أخطاء.
- [ ] صفحة أو تبويب **Brand Monitor** تحت `/cc/...` تعرض: آخر مسح، الإشارات، التنبيهات النشطة، زر «مسح الآن» (مع صلاحية editor).
- [ ] إعدادات لكل عميل: تفعيل المراقبة، تكرار (أسبوعي كافٍ للـ MVP).
- [ ] اختبارات: `vitest` على mapper + procedure واحدة للجدولة (أو flag في DB).

### v1 (أسبوع 2–3)

- [ ] تقرير أسبوعي ملخص (PDF اختياري لاحقاً مع Sprint H).
- [ ] ربط بسيط بالـ credits أو باقة مدفوعة في `shared/const.ts`.
- [ ] لوحة إجمالية لكل العملاء (at-risk من الإشارات السلبية).

---

## 4. الـ Routes (التزام المشروع)

| الجمهور | مسار مقترح |
|----------|------------|
| Agency | `/cc/brand-monitor` أو دمج تبويبات داخل `/cc/brand-twin` مع URL فرعي واضح |
| Admin | إن احتجت إحصائيات عالمية: `/admin` أو إعدادات في `Settings` — بدون ازدواج مع عميل إلا إذا كان المنتج يستهدف B2C لاحقاً |

لا تضف مسارات عميل `/app/*` في الـ MVP إلا إذا كان هناك SKU واضح للعميل النهائي.

---

## 5. الأمان والصلاحيات

- كل إجراءات الكتابة: `checkEditor` أو أعلى حسب السياسة (مسح جميع العملاء قد يبقى `checkOwner` فقط).
- أي webhook/cron داخلي: توقيع سري (`CRON_SECRET`) + عدم تعريض `observeAll` بدون حماية.

---

## 6. Definition of Done

- `pnpm vitest run` — أخضر.
- `pnpm exec tsc --noEmit` — بدون أخطاء.
- مسار واحد على الأقل في `/cc/*` يعرض بيانات حقيقية من `brand_alerts` بعد مسح تجريبي.
- توثيق متغيرات البيئة الجديدة في `env-example.txt` إن وُجدت.

---

## 7. تبعيات مع سبرنتات أخرى

| Sprint | التقاطع |
|--------|---------|
| **G** Quick Check scraping | يمكن إعادة استخدام أدوات الـ URL / البحث — تنسيق عقود البيانات |
| **I** Email cron | إرسال ملخص التنبيهات تلقائياً |
| **J** Web radar | UX للتنبيهات والروابط الخارجية |

---

## 8. ملخص تنفيذي

**Sprint F** يصقل ما هو موجود (`brandObservatory` + `brandTwin`) إلى **منتج Brand Monitor** موثوق في DB وجدولة وتجربة وكالة، مع بوابة إيرادات (كريدت أو باقة). ابدأ بإصلاح طبقة الـ alerts ثم الواجهة ثم الجدولة.
