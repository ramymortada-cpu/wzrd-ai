# Skill 20: Production Validation — Pre-Flight Script

## When to Use
قبل كل نشر للإنتاج — للتأكد من أن البيئة جاهزة.

## اقرأ أولاً
- `docs/MANUS_INSTRUCTIONS.md` — Environment Setup
- `apps/api/radd/config.py` — المتغيرات المطلوبة
- `docs/SECURITY_REPORT_FOR_MANUS.md` — Checklist قبل Pilot

## المهمة
إنشاء script `scripts/preflight.py` يفحص:
- وجود المتغيرات البيئية المطلوبة
- اتصال DB و Redis
- صحة التوكنات (إن أمكن)
- CORS و SECRET_KEY

## التنفيذ
تم إنشاء `apps/api/scripts/preflight.py`
```bash
cd apps/api && uv run python scripts/preflight.py
```

## Acceptance Criteria
- [x] Script يعمل: `uv run python scripts/preflight.py`
- [ ] يطبع تقرير واضح (pass/fail) لكل فحص
- [ ] Exit code 0 = كل شيء OK، غير ذلك = فشل
- [ ] لا يطبع قيم حساسة (secrets) في الـ output

## لا تفعل
- لا تطبع SECRET_KEY أو API keys في الـ output
- لا تفشل الـ script إذا كان متغير اختياري (مثل SENTRY_DSN) غير موجود
