# خطة دمج RADD_Complete_Implementation_v2

**التاريخ:** 14 مارس 2026  
**المصدر:** `~/Desktop/RADD_Complete_Implementation_v2.zip`  
**الغرض:** دمج الملفات الإضافية التي لم تكن في RADD_Implementation_Package_v2

---

## نظرة عامة

| المكون | الحالة في المشروع | إجراء الدمج |
|--------|-------------------|-------------|
| personas_engine | موجود (3 شخصيات) | إضافة Complaint Handler + دمج INTENT_TO_PERSONA |
| churn_radar | موجود (churn_radar.py) | إضافة API endpoints من Complete |
| control_analytics_templates | غير موجود | نسخ + ربط routers |
| sentry_and_logging | Sentry موجود | إضافة PII filter + StructuredFormatter |
| test_whatsapp_e2e | غير موجود | نسخ + تعديل imports |
| setup_production | غير موجود | نسخ إلى scripts/ |
| verify_hybrid_search | غير موجود | نسخ إلى scripts/ |

---

## المرحلة 1: Personas — إضافة Complaint Handler

**الملف:** `radd/personas/engine.py`

المشروع لديه 3 شخصيات (Receptionist, Sales, Support). Complete v2 يضيف **Complaint Handler**.

### التعديلات:
1. إضافة `COMPLAINT_HANDLER = "complaint_handler"` إلى PersonaType
2. إضافة COMPLAINT_HANDLER_PROMPT و PersonaConfig
3. إضافة `INTENT_TO_PERSONA` mapping من Complete (greeting→Receptionist, complaint→ComplaintHandler, إلخ)
4. دمج `select_persona()` و `build_system_prompt_with_persona()` إذا كانت أبسط

**المصدر:** `/tmp/radd_complete/radd_v2_complete/personas/personas_engine.py`

---

## المرحلة 2: Churn Radar — إضافة API Endpoints

**الوضع الحالي:** `radd/analytics/churn_radar.py` يحتوي `scan_for_churn_risk()` و `ChurnAlert`.  
**analytics_router** يعرض `/admin/churn/summary` و `/admin/churn/alerts`.

**من Complete v2:** `churn_radar.py` فيه `AtRiskCustomer`, `ChurnRadarSummary`, `detect_at_risk_customers()`, و endpoints:
- `GET /churn-radar/summary`
- `GET /churn-radar/customers`
- `POST /churn-radar/action/{customer_id}`

### التعديلات:
1. مراجعة `detect_at_risk_customers` من Complete — قد يكون منطقاً مختلفاً
2. إذا كان أفضل: استبدال أو دمج مع `scan_for_churn_risk`
3. إضافة endpoints الناقصة في analytics_router إذا لم تكن موجودة

---

## المرحلة 3: Control Center + KB + Analytics + Templates

**الملف:** `dashboard_components/control_analytics_templates.py`

يحتوي على 4 routers:
- **control_router** — `/control-center`: decisions, pause/resume automation, pending reviews
- **kb_router** — `/knowledge/manage`: gaps, suggest content, health
- **analytics_router** — `/analytics`: summary, trends, peak hours, intent distribution
- **templates_router** — `/templates`: list, create, preview

### التعديلات:
1. نسخ الملف إلى `radd/admin/control_center_router.py`
2. فصل الـ routers أو دمجها في admin router
3. ربط بـ `get_db_session` و `require_reviewer`
4. التحقق من تعارض المسارات مع analytics_router الحالي:
   - المشروع: `/admin/analytics` — Complete: `/analytics`
   - نستخدم prefix `/admin` لتوحيد المسارات

---

## المرحلة 4: Sentry + Structured Logging

**الملف:** `monitoring/sentry_and_logging.py`

### المحتوى:
- `init_sentry()` — مع SqlalchemyIntegration, RedisIntegration, `_filter_pii`
- `capture_pipeline_error()` — لتسجيل أخطاء الـ pipeline
- `StructuredFormatter` — JSON logs
- `configure_logging()` — إعداد structured logging

### التعديلات:
1. نسخ إلى `radd/monitoring/sentry_and_logging.py`
2. في `main.py`: استدعاء `init_sentry()` من الملف الجديد بدل الكود الحالي، أو دمج `_filter_pii` و `capture_pipeline_error`
3. المشروع يستخدم `structlog` — `StructuredFormatter` قد يكون بديلاً أو مكملاً
4. إضافة `capture_pipeline_error` في orchestrator عند الـ except

---

## المرحلة 5: E2E WhatsApp Tests

**الملف:** `e2e_tests/test_whatsapp_e2e.py`

### المحتوى:
- 140 حالة اختبار (عربي فصحى، خليجي، إنجليزي، مختلط، injection)
- `E2ERunner` يستدعي `POST /api/v1/pipeline/test` مع `text` و `workspace_id`

### التعديلات:
1. نسخ إلى `tests/e2e/test_whatsapp_e2e.py`
2. التحقق من وجود endpoint `/api/v1/pipeline/test` — إذا لم يكن موجوداً، إنشاؤه أو تعديل الاختبار لاستخدام webhook simulation
3. إضافة marker `@pytest.mark.e2e` و `@pytest.mark.skipif(not os.getenv("E2E_WHATSAPP"))`
4. تحديث imports

---

## المرحلة 6: Scripts — setup_production + verify_hybrid_search

### 6.1 setup_production.py
- `check_env()` — فحص SECRET_KEY, JWT, DATABASE_URL, REDIS, OPENAI, META, WA
- `check_security()` — CORS, unique secrets
- `generate_env()` — توليد .env.production
- `generate_nginx()` — توليد nginx config

**الوجهة:** `apps/api/scripts/setup_production.py`

**الاستخدام:**
```bash
uv run python scripts/setup_production.py
uv run python scripts/setup_production.py --generate-env
uv run python scripts/setup_production.py --generate-nginx
```

### 6.2 verify_hybrid_search.py
- `verify_fts_setup()` — التحقق من عمود tsv و GIN index
- `apply_fts_fixes()` — إضافة tsv, trigger, backfill
- `test_hybrid_search()` — اختبار BM25

**الوجهة:** `apps/api/scripts/verify_hybrid_search.py`

**ملاحظة:** يحتاج `db_session` — يمكن تشغيله كـ CLI مع اتصال DB.

---

## ترتيب التنفيذ المقترح

| # | المرحلة | المدة | الأولوية |
|---|---------|-------|----------|
| 1 | Scripts (setup_production, verify_hybrid_search) | 30 دقيقة | عالية |
| 2 | Sentry + Logging (PII filter, capture_pipeline_error) | 45 دقيقة | عالية |
| 3 | Personas (Complaint Handler) | 1 ساعة | متوسطة |
| 4 | Control Center routers | 1.5 ساعة | متوسطة |
| 5 | Churn Radar API (إن لزم) | 45 دقيقة | منخفضة |
| 6 | E2E tests | 1 ساعة | متوسطة |

---

## الملفات المطلوب نسخها

| المصدر (من Complete v2) | الوجهة |
|-------------------------|--------|
| `personas/personas_engine.py` | مرجع — دمج Complaint Handler في `radd/personas/engine.py` |
| `dashboard_components/churn_radar.py` | مرجع — دمج مع `radd/analytics/churn_radar.py` |
| `dashboard_components/control_analytics_templates.py` | `radd/admin/control_center_router.py` |
| `monitoring/sentry_and_logging.py` | `radd/monitoring/sentry_and_logging.py` |
| `e2e_tests/test_whatsapp_e2e.py` | `tests/e2e/test_whatsapp_e2e.py` |
| `scripts/setup_production.py` | `scripts/setup_production.py` |
| `scripts/verify_hybrid_search.py` | `scripts/verify_hybrid_search.py` |

---

## تعارضات محتملة

| المكون | التعارض | الحل |
|--------|---------|------|
| analytics_router | Complete يضيف `/analytics` | استخدام prefix `/admin` ودمج مع analytics_router الحالي |
| churn_radar | منطق مختلف (AtRiskCustomer vs ChurnAlert) | اختيار واحد أو دمج الـ models |
| personas | PersonaType مختلف (Complaint Handler جديد) | إضافة فقط، عدم استبدال |
| Sentry | main.py يهيئ Sentry بالفعل | دمج _filter_pii و capture_pipeline_error |

---

## قائمة تحقق

- [ ] نسخ setup_production.py
- [ ] نسخ verify_hybrid_search.py
- [ ] نسخ sentry_and_logging.py وربطها
- [ ] إضافة Complaint Handler للـ personas
- [ ] نسخ control_analytics_templates وربط routers
- [ ] مراجعة churn_radar ودمج إن لزم
- [ ] نسخ test_whatsapp_e2e وتعديله
- [ ] تشغيل الاختبارات
