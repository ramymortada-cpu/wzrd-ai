# Manus Skills — Radd AI Platform

مجموعة skills جاهزة للاستخدام مع Manus agent على مشروع رَدّ.

## قائمة الـ Skills

| # | الملف | متى تستخدمه |
|---|-------|-------------|
| 01 | `01_setup_environment.md` | أول مرة تشتغل على المشروع |
| 02 | `02_add_new_intent.md` | إضافة نوع جديد من أسئلة العملاء للـ NLP |
| 03 | `03_add_kb_document.md` | إضافة وثيقة لقاعدة المعرفة (سياسات، FAQ) |
| 04 | `04_add_new_workspace.md` | تسجيل متجر جديد في المنصة |
| 05 | `05_database_migration.md` | إضافة جدول أو عمود جديد في قاعدة البيانات |
| 06 | `06_debug_pipeline.md` | تشخيص مشاكل الـ NLP أو الردود الخاطئة |
| 07 | `07_deploy_production.md` | رفع نسخة جديدة على السيرفر |
| 08 | `08_add_api_endpoint.md` | إضافة endpoint جديد في الـ API |
| 09 | `09_run_tests.md` | تشغيل الاختبارات وإضافة اختبارات جديدة |
| 10 | `10_add_frontend_page.md` | إضافة صفحة جديدة في الـ Dashboard |
| 14 | `14_docker_compose_fix.md` | إضافة outbound_call_worker للإنتاج |
| 15 | `15_save_the_sale.md` | handle_cancellation_request + اختبارات |
| 16 | `16_channel_fallback_scheduler.md` | DelayedTaskScheduler + Twilio |
| 17 | `17_business_health_monitoring.md` | /health/business + Heartbeat + DLQ |
| 18 | `18_worker_refactor.md` | تفكيك message_worker لـ 3 handlers |
| 19 | `19_e2e_smoke_test.md` | اختبار E2E من webhook لـ response |
| 20 | `20_production_validation.md` | Pre-flight script |

## الاستخدام

اقرأ الملف المناسب واتبع الخطوات بالترتيب.
كل skill يحتوي على:
- **متى تستخدمه** — شرط الاستخدام
- **خطوات مفصّلة** — كود جاهز للتنفيذ
- **Validation** — كيف تتحقق أن الخطوة نجحت
- **Common Issues** — المشاكل الشائعة وحلولها

## ملاحظة مهمة
قبل أي تعديل، راجع `MANUS_INSTRUCTIONS.md` في root المشروع —
خاصةً قسم **"What NOT to Do"** و **"Critical Architecture Rules"**.
