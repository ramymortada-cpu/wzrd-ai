# Skill 19: E2E Smoke Test

## When to Use
قبل كل release — للتأكد من أن المسار الكامل من webhook إلى response يعمل.

## اقرأ أولاً
- `radd/webhooks/router.py` — استقبال WhatsApp
- `workers/message_worker.py` — معالجة الرسائل
- `tests/` — هيكل الاختبارات الحالي

## المهمة
اختبار E2E شامل:
1. إرسال طلب POST لمحاكاة webhook WhatsApp
2. انتظار معالجة الـ worker (أو محاكاة)
3. التحقق من وجود رد في Redis/DB أو WhatsApp API
4. تغطية: رسالة عادية، تصعيد، نية غير معروفة

## Acceptance Criteria
- [ ] Test يمر مع Redis + DB فعليين (أو testcontainers)
- [ ] يغطي مسار: webhook → stream → worker → response
- [ ] يمكن تشغيله في CI (مع خدمات مطلوبة)
- [ ] وقت التنفيذ معقول (< 2 دقيقة)

## لا تفعل
- لا ترسل رسائل حقيقية لـ WhatsApp API في الاختبار
- لا تعتمد على بيانات إنتاج — استخدم fixtures
