# Skill 17: Business Health Monitoring

## When to Use
للمراقبة التشغيلية — endpoint صحة الأعمال + Heartbeat + DLQ + Slack alerts.

## اقرأ أولاً
- `apps/api/radd/main.py` — تسجيل الـ routers
- `radd/alerts/` — AlertManager الموجود
- `docs/DATA_FLOW.md` — Redis queues

## المهمة
1. **`GET /health/business`** — يفحص: DB، Redis، Qdrant، آخر رسالة معالجة
2. **Heartbeat** — worker يرسل heartbeat إلى Redis
3. **DLQ (Dead Letter Queue)** — نقل المهام الفاشلة إلى `cod_shield_dlq`
4. **Slack alerts** — تنبيه عند فشل متكرر أو DLQ ممتلئ

## Acceptance Criteria
- [ ] `/health/business` يعيد 200 مع تفاصيل كل خدمة
- [ ] Workers تسجّل heartbeat في Redis
- [ ] المهام الفاشلة تنتقل إلى DLQ بعد N محاولات
- [ ] Slack يُستدعى عند شروط محددة (مثلاً DLQ > 10)

## لا تفعل
- لا تكشف تفاصيل أمنية في `/health/business`
- لا ترسل تنبيهات Slack لكل فشل واحد — استخدم cooldown
