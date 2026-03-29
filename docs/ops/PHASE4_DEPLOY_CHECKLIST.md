# WZZRD AI — Phase 4 Deploy: Ops Checklist

**Engineer:** _______________  **Date:** _______________  **Start Time:** _______________

---

## T-15 min — Pre-Flight

- [ ] أعلن maintenance window للفريق (Slack / WhatsApp)
- [ ] افتح Railway Dashboard → MySQL service → خد **Manual Snapshot**
- [ ] تأكد إن الـ snapshot اتعمل بنجاح قبل ما تكمل
- [ ] افتح اتصال مباشر بالـ production MySQL (TablePlus / DBeaver / Railway CLI)

---

## T-0 — Deploy

- [ ] Railway Dashboard → Deployments → **Deploy `main`**
- [ ] انتظر الـ build يخلص (عادةً 3-5 دقايق)
- [ ] تأكد إن الـ health check بيرجع `200 OK` على `/healthz`
- [ ] افتح الـ Railway logs وتأكد إن سطر `🔄 Running database migrations...` ظهر وخلص بدون error

---

## T+5 min — Backfill

- [ ] شغّل `WZRD_PHASE4_PRODUCTION_BACKFILL.sql` كامل على production MySQL
- [ ] تأكد إن كل الـ statements اتنفّذت بدون error

---

## T+7 min — Verification Gate ✅

شغّل الـ queries دي وتأكد من النتائج:

- [ ] **5a:** workspace row موجود (`id=1, name='Primary Workspace'`)
- [ ] **5b:** في على الأقل `owner: 1` في الـ members summary
- [ ] **5d:** كل الـ `orphaned_rows = 0` لكل الجداول الستة

> **⛔ لو أي قيمة في 5d مش صفر — وقّف الـ deploy وشغّل الـ UPDATE يدوياً على الجدول المتأثر قبل ما تكمل.**

---

## T+10 min — Smoke Test

- [ ] `/` (Dashboard) — بيتحمّل وبيظهر Client Health Overview
- [ ] `/clients` — بيظهر الـ clients الموجودين
- [ ] `/contracts` — بيتحمّل (list فاضي مقبول)
- [ ] `/invoices` — بيتحمّل (list فاضي مقبول)
- [ ] `/settings/team` — بيظهر الـ members
- [ ] `/settings/audit-logs` — بيتحمّل
- [ ] إنشاء client جديد → تأكد إنه اتسجّل في الـ DB بـ `workspaceId = 1`

---

## T+10 to T+40 min — Monitoring Window

- [ ] افتح Railway Logs وراقب أي من الـ patterns دي:
  - `Unauthorized: Missing workspace context` → مشكلة في الـ header
  - `Redis init failed` → تحقق من `REDIS_URL`
  - `Lock wait timeout exceeded` → DB contention
- [ ] لو مفيش errors — **الـ deploy مكتمل بنجاح ✅**

---

## Rollback (لو حاجة غلطت)

| السيناريو | الإجراء |
|-----------|---------|
| كود بس (UI/API مكسور) | Railway → Deployments → Redeploy آخر deployment ناجح قبل Phase 4 |
| Data corruption | Railway → MySQL → Restore Snapshot → Redeploy الكود القديم |

---

**End Time:** _______________  **Status:** ☐ Success  ☐ Rolled Back  **Notes:** _______________
