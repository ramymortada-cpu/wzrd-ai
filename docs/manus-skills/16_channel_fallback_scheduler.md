# Skill 16: Channel Fallback Scheduler

## When to Use
عند فشل قناة (مثلاً WhatsApp) — جدولة إعادة المحاولة عبر قناة بديلة (مثلاً Twilio).

## اقرأ أولاً
- `docs/DATA_FLOW.md` — Redis، Twilio fallback
- `radd/webhooks/twilio_router.py` — Twilio webhooks
- `workers/outbound_call_worker.py` — مكالمات COD Shield

## المهمة
1. **DelayedTaskScheduler** — استخدام Redis Sorted Set لجدولة مهام مؤجلة
2. **ربط بـ Twilio** — عند فشل إرسال واتساب، جدولة مكالمة أو رسالة SMS بعد X دقائق
3. **Worker** يستهلك المهام عند انتهاء الـ delay

## Acceptance Criteria
- [ ] Redis Sorted Set يُستخدم لـ score = timestamp
- [ ] Scheduler يضيف مهام مع delay
- [ ] Worker منفصل أو مدمج يستهلك المهام عند الاستحقاق
- [ ] تكامل مع Twilio لإرسال المكالمة/SMS

## لا تفعل
- لا تستخدم polling مكثف — استخدم BZPOPMIN أو مشابه
- لا ترسل أكثر من محاولة واحدة دون تأخير معقول
