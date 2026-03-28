# RADD Pre-Flight Checklist — Master Tracker

**الغرض:** متابعة تنفيذ المهام قبل الإطلاق (Pre-Flight)  
**آخر تحديث:** 11 مارس 2025

---

## ترتيب التنفيذ

| اليوم | المهام | الوصف |
|-------|--------|-------|
| **يوم 1** | 14 → 20 → 17 | الأساسيات + المراقبة |
| **يوم 2** | 15 → 16 | المنطق المفقود |
| **يوم 3** | 18 → 19 | الجودة |

---

## المهام

### #14 — Docker Compose Fix
- [x] إضافة `outbound_call_worker` للإنتاج
- **الوقت:** 30 دقيقة
- **الملف:** `docs/manus-skills/14_docker_compose_fix.md`
- **الحالة:** ✅ تم

### #15 — Save The Sale
- [x] كتابة `handle_cancellation_request` + 13 اختبار
- **الوقت:** 3 ساعات
- **الملف:** `docs/manus-skills/15_save_the_sale.md`
- **الحالة:** ✅ تم

### #16 — Channel Fallback Scheduler
- [x] DelayedTaskScheduler بـ Redis Sorted Set + ربط بـ Twilio
- **الوقت:** 3 ساعات
- **الملف:** `docs/manus-skills/16_channel_fallback_scheduler.md`
- **الحالة:** ✅ تم — radd/scheduler/delayed_task.py، delayed_task_worker، twilio_router

### #17 — Business Health Monitoring
- [x] `/health/business` + Heartbeat + DLQ + Slack alerts
- **الوقت:** 4 ساعات
- **الملف:** `docs/manus-skills/17_business_health_monitoring.md`
- **الحالة:** ✅ تم — endpoint، heartbeat، DLQ، Slack عند DLQ>10

### #18 — Worker Refactor
- [x] تفكيك `message_worker.py` لـ 3 handlers
- **الوقت:** يوم
- **الملف:** `docs/manus-skills/18_worker_refactor.md`
- **الحالة:** ✅ تم — StreamConsumer، MessageHandler، ResponseSender

### #19 — E2E Smoke Test
- [ ] اختبار شامل من webhook لـ response
- **الوقت:** يوم
- **الملف:** `docs/manus-skills/19_e2e_smoke_test.md`
- **الحالة:** —

### #20 — Production Validation
- [x] Pre-flight script يفحص كل حاجة
- **الوقت:** ساعة
- **الملف:** `docs/manus-skills/20_production_validation.md`
- **الحالة:** ✅ تم — `apps/api/scripts/preflight.py`

---

## ملاحظات

- كل prompt مكتوب بنفس format الـ Cursor Prompts الموجودة (1-13)
- يحتوي على: "اقرأ أولاً"، كود مرجعي، اختبارات، acceptance criteria، وقائمة "لا تفعل"
- راجع `docs/MANUS_INSTRUCTIONS.md` قبل أي تعديل
