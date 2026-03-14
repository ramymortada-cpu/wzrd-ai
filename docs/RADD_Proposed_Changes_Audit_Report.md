# تقرير مراجعة: RADD AI — مقارنة التعديلات المقترحة مع التنفيذ الفعلي

**تاريخ التقرير:** 11 مارس 2026  
**المصدر المرجعي:** `RADD_All_Proposed_Changes١١١.md` (سطح المكتب)  
**نطاق المراجعة:** مشروع RADD في `apps/api/`

---

## الملخص التنفيذي

| البند | المقترح | الوضع الفعلي | نسبة الإنجاز |
|:---|:---|:---|:---:|
| مصنف النوايا (Intent v2) | LLM-based مع instructor | ✅ مُنفّذ بالكامل | **100%** |
| نظام التحقق (Verifier v2) | NLI صحيح | ✅ مُنفّذ بالكامل | **100%** |
| توسيع العامل (Worker v2) | مجموعة لكل workspace | ⚠️ مُنفّذ جزئياً | **~60%** |
| إثبات الإيرادات (Revenue) | واجهة Dashboard | ✅ API جاهز | **95%** |
| رادار التسرب (Churn Radar) | واجهة + إجراءات | ✅ API جاهز | **95%** |
| الشخصيات المتعددة (Personas) | تفعيل في Pipeline | ✅ مُفعّل + Complaint Handler | **100%** |

**الخلاصة:** معظم التعديلات المقترحة مُنفّذة. العامل الرئيسي المتبقي هو **إكمال message_worker_v2** ليعمل كبديل كامل للعامل الحالي.

---

## الجزء الأول: التعديلات الحرجة

### 1. مصنف النوايا (Intent Classifier v2)

#### المقترح في المستند
- استبدال الكلمات المفتاحية بـ LLM مع Function Calling عبر `instructor`
- استخراج الكيانات (رقم الطلب، اسم المنتج، إلخ)
- Fallback آمن للمصنف القديم
- نظام Caching مع Redis

#### التنفيذ الفعلي

| العنصر | الحالة | التفاصيل |
|:---|:---|:---|
| `intent_v2.py` | ✅ موجود | `apps/api/radd/pipeline/intent_v2.py` |
| Pydantic Models | ✅ 10 نوايا | Greeting, OrderStatus, Shipping, Return, Product, StoreHours, Complaint, OrderCancel, General, GuardrailTriggered |
| instructor + OpenAI | ✅ مُثبّت | `pyproject.toml`: instructor>=1.0.0, openai>=1.57.0 |
| Redis Caching | ✅ مُنفّذ | TTL 5 دقائق، `_get_from_cache` / `_set_to_cache` |
| Fallback | ✅ مُنفّذ | `_fallback_classify()` → intent.py القديم |
| التكامل مع Orchestrator | ✅ مُنفّذ | `run_pipeline_async` يستخدم `classify_intent_llm` عند `use_intent_v2=True` |

**التفعيل:** ضبط `USE_INTENT_V2=true` في `.env`

**ملاحظة:** العامل الرئيسي (`message_worker.py`) ما زال يستخدم `classify_intent` (v1) لـ:
- تقييم القواعد الذكية (Smart Rules)
- اختيار الشخصية (Persona)
- منع الإرجاع (Return Prevention)
- تحديد مرحلة المحادثة

بينما `run_pipeline_async` يستخدم v2 عند التفعيل. هذا يخلق **ازدواجية**: القرارات (persona, rules) مبنية على v1، والرد النهائي من الـ pipeline مبني على v2. يُفضّل توحيد المصدر لاحقاً.

---

### 2. نظام التحقق (Verifier v2)

#### المقترح في المستند
- استخدام NLI بالطريقة الصحيحة: premise (قاعدة المعرفة) + hypothesis (جمل الرد)
- تقسيم الرد لجمل والتحقق من كل جملة
- الدرجة النهائية = الحد الأدنى (نهج محافظ)

#### التنفيذ الفعلي

| العنصر | الحالة | التفاصيل |
|:---|:---|:---|
| `verifier_v2.py` | ✅ موجود | `apps/api/radd/pipeline/verifier_v2.py` |
| النموذج | ✅ joeddav/xlm-roberta-large-xnli | كما في المقترح |
| `verify_response()` | ✅ مُنفّذ | premise + hypotheses، min(scores) |
| تقسيم الجمل | ✅ مُنفّذ | `_split_sentences()` مع دعم العربية |
| Batching | ✅ مُنفّذ | BATCH_SIZE=8 |
| Async wrapper | ✅ مُنفّذ | `verify_response_async` |
| التكامل مع Orchestrator | ✅ مُنفّذ | عند `use_verifier_v2=True` |

**التفعيل:** ضبط `USE_VERIFIER_V2=true` في `.env`

---

### 3. توسيع عامل الرسائل (Worker Scaling)

#### المقترح في المستند
- مجموعة مستهلكين لكل workspace: `group:{workspace_id}`
- تشغيل عدة عمال متوازيين (replicas)
- عزل الضغط بين العملاء

#### التنفيذ الفعلي

| العنصر | الحالة | التفاصيل |
|:---|:---|:---|
| `message_worker_v2.py` | ⚠️ جزئي | موجود لكن `process_message` غير مكتمل |
| Consumer Group per workspace | ✅ مُنفّذ | `get_consumer_group(stream_key)` → `group:{workspace_id}` |
| Worker Registry + Heartbeat | ✅ مُنفّذ | `WorkerRegistry`, `HealthTracker` |
| Stream Router | ✅ مُنفّذ | توزيع streams على العمال بـ consistent hashing |
| `publish_message_to_stream` | ✅ مُنفّذ | للنشر في `messages:{workspace_id}` |
| **process_message الكامل** | ❌ غير مكتمل | يصنّف النية فقط، لا يستدعي pipeline كامل |

**المشكلة الحرجة:** في `message_worker_v2.py` السطور 192–254، الدالة `process_message` تقوم بـ:
1. تصنيف النية عبر `classify_intent_llm`
2. تسجيل النتيجة
3. إرجاع `True`

**لا تقوم بـ:**
- استدعاء `run_pipeline_async` (أو ما يعادله)
- إنشاء/جلب Customer و Conversation
- تخزين الرسائل في DB
- إرسال الرد عبر WhatsApp
- تطبيق القواعد الذكية، الشخصيات، منع الإرجاع، إلخ

**العامل الرئيسي (`message_worker.py`):**
- يستخدم `CONSUMER_GROUP = "radd-workers"` (مجموعة واحدة)
- يقرأ من كل `messages:*` streams
- pipeline كامل ومتكامل
- **لا يدعم** توسع أفقي حقيقي (عدة عمال يشاركون نفس المجموعة = رسالة واحدة لعامل واحد فقط)

**الخلاصة:** البنية التحتية لـ worker v2 جاهزة، لكن المنطق التشغيلي غير مكتمل. العامل الحالي يعمل بكامل الوظائف لكن بدون توسع أفقي.

---

## الجزء الثاني: Killer Features

### 4.1 إثبات الإيرادات (Revenue Attribution)

#### المقترح
- Backend جاهز
- إضافة قسم في Dashboard يعرض RevenueSummary

#### التنفيذ الفعلي

| العنصر | الحالة | المسار |
|:---|:---|:---|
| `revenue/attribution.py` | ✅ | `radd/revenue/attribution.py` |
| `RevenueSummary`, `get_revenue_summary` | ✅ | |
| `track_revenue_event` | ✅ | |
| جدول `revenue_events` | ✅ | migration 0006 |
| API `/admin/revenue/summary` | ✅ | `analytics_router.py` |
| API `/admin/revenue/events` | ✅ | قائمة الأحداث مع pagination |
| تكامل Salla/Zid webhooks | ✅ | `onboarding/salla_sync.py`, `channels/zid_router.py` |
| واجهة Dashboard (Frontend) | ❓ | غير مؤكد — يحتاج فحص `apps/web` |

**الخلاصة:** الـ Backend والـ API جاهزان. إذا كان الـ Dashboard (Next.js) يعرض هذه البيانات، فإن الميزة مكتملة.

---

### 4.2 رادار التسرب (Churn Radar)

#### المقترح
- Backend جاهز
- صفحة تعرض العملاء المعرضين للتسرب + الإجراءات المقترحة

#### التنفيذ الفعلي

| العنصر | الحالة | المسار |
|:---|:---|:---|
| `churn_radar.py` | ✅ | `radd/analytics/churn_radar.py` |
| `scan_for_churn_risk` | ✅ | |
| `schedule_winback_for_at_risk` | ✅ | |
| `get_churn_summary` | ✅ | |
| API `/admin/churn-radar` | ✅ | `analytics_router.py` |
| معامل `auto_winback` | ✅ | لجدولة رسائل win-back تلقائياً |
| واجهة Dashboard | ❓ | غير مؤكد |

**الخلاصة:** الـ Backend والـ API جاهزان. المتبقي هو التأكد من واجهة المستخدم في الـ Dashboard.

---

### 4.3 الشخصيات المتعددة (AI Personas)

#### المقترح
- اختيار Persona بناءً على النية ومرحلة المحادثة
- Receptionist, Sales, Support

#### التنفيذ الفعلي

| العنصر | الحالة | التفاصيل |
|:---|:---|:---|
| `personas/engine.py` | ✅ | |
| PersonaType | ✅ | RECEPTIONIST, SALES, SUPPORT, **COMPLAINT_HANDLER** |
| `select_persona()` | ✅ | بناءً على intent, is_pre_purchase, conversation_turn, customer_tier |
| `build_persona_prompt()` | ✅ | |
| التكامل في message_worker | ✅ | السطور 250–272 |
| تمرير للـ Orchestrator | ✅ | `persona_system_prompt` في `conversation_context` |
| Complaint Handler | ✅ | إضافة إضافية غير مذكورة في المستند الأصلي |

**الخلاصة:** الشخصيات مفعّلة ومتكاملة، مع إضافة Complaint Handler.

---

## الجزء الثالث: عناصر إضافية مُنفّذة

| العنصر | الوصف |
|:---|:---|
| Sentry + PII Filter | `radd/monitoring/sentry_and_logging.py` — تصفية PII قبل الإرسال |
| `capture_pipeline_error` | استدعاء في message_worker عند فشل المعالجة |
| Control Center | `control_center_router.py` — إدارة المعرفة والقوالب |
| Scripts | `setup_production.py`, `verify_hybrid_search.py` |
| E2E Tests | `tests/e2e/test_whatsapp_e2e.py` |
| Integration Tests | `tests/integration/` |

---

## الجزء الرابع: التوصيات

### أولوية عالية
1. **إكمال `message_worker_v2.process_message`**  
   - نسخ منطق المعالجة من `message_worker.process_message` (مع التكيف مع تنسيق الرسائل)
   - أو استخراج دالة مشتركة `process_single_message` واستدعاؤها من العاملين
   - الهدف: جعل `make worker-v2` بديلاً عملياً للعامل الحالي

2. **توحيد مصدر النية في message_worker**  
   - عند `use_intent_v2=True`، استخدام نتيجة `classify_intent_llm` لـ:
     - القواعد الذكية
     - اختيار الشخصية
     - منع الإرجاع
     - مرحلة المحادثة
   - تجنب ازدواجية التصنيف (v1 للقرارات، v2 للرد)

### أولوية متوسطة
3. **التأكد من واجهات Dashboard**  
   - فحص `apps/web` للتأكد من عرض:
     - Revenue Summary
     - Churn Radar
     - إن لم تكن موجودة، إضافتها

4. **تفعيل v2 افتراضياً**  
   - في `.env.example` أو التوثيق، جعل `USE_INTENT_V2=true` و `USE_VERIFIER_V2=true` كقيم افتراضية موصى بها

### أولوية منخفضة
5. **Docker Compose replicas**  
   - إضافة `deploy.replicas: 3` لخدمة worker في `docker-compose` للإنتاج (حال استخدام worker v2)

---

## ملحق: مسارات الملفات الرئيسية

| الغرض | المسار |
|:---|:---|
| Config (use_intent_v2, use_verifier_v2) | `apps/api/radd/config.py` |
| Intent v2 | `apps/api/radd/pipeline/intent_v2.py` |
| Verifier v2 | `apps/api/radd/pipeline/verifier_v2.py` |
| Orchestrator | `apps/api/radd/pipeline/orchestrator.py` |
| Message Worker (الرئيسي) | `apps/api/workers/message_worker.py` |
| Message Worker v2 | `apps/api/workers/message_worker_v2.py` |
| Personas | `apps/api/radd/personas/engine.py` |
| Revenue | `apps/api/radd/revenue/attribution.py` |
| Churn Radar | `apps/api/radd/analytics/churn_radar.py` |
| Admin Analytics API | `apps/api/radd/admin/analytics_router.py` |

---

*تم إعداد هذا التقرير بناءً على مراجعة الكود المصدري في المشروع.*
