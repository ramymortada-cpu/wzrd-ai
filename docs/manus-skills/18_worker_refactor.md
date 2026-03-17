# Skill 18: Worker Refactor — تفكيك message_worker.py

## When to Use
عندما يصبح `message_worker.py` كبيراً أو يصعب صيانته.

## اقرأ أولاً
- `apps/api/workers/message_worker.py` — الكود الحالي
- `radd/pipeline/orchestrator.py` — المنطق الأساسي
- `docs/DATA_FLOW.md` — تدفق الرسائل

## المهمة
تفكيك `message_worker.py` إلى 3 handlers:
1. **StreamConsumer** — قراءة من Redis Stream، توزيع الرسائل
2. **MessageHandler** — معالجة رسالة واحدة (intent → RAG → rules → response)
3. **ResponseSender** — إرسال الرد عبر WhatsApp/Instagram

مع الحفاظ على نفس السلوك الخارجي (نفس الـ queue، نفس الـ output).

## Acceptance Criteria
- [x] 3 ملفات أو classes منفصلة
- [x] الاختبارات الحالية تمر
- [x] لا تغيير في تنسيق Redis أو API
- [x] يمكن تشغيل worker بنفس الأمر: `python -m workers.message_worker`

## التنفيذ
- `workers/handlers/stream_consumer.py` — StreamConsumer
- `workers/handlers/message_handler.py` — MessageHandler
- `workers/handlers/response_sender.py` — ResponseSender
- `workers/message_worker.py` — يستورد الـ 3 ويشغّل StreamConsumer

## لا تفعل
- لا تغيّر تنسيق الـ stream أو الـ queue
- لا تكسر الـ backward compatibility مع الرسائل الموجودة في الـ queue
