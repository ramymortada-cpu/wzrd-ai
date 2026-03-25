# WZRD AI — SEO Pages + Smoke Test

## ملفات جديدة (٧):
- `client/public/landing/seo/brand-diagnosis.html`
- `client/public/landing/seo/offer-check.html`
- `client/public/landing/seo/message-check.html`
- `client/public/landing/seo/presence-audit.html`
- `client/public/landing/seo/identity-snapshot.html`
- `client/public/landing/seo/launch-readiness.html`
- `e2e/smoke.test.ts` (Playwright — 13 tests)

## ملف معدّل (١):
- `server/_core/vite.ts` — routes for /seo/* pages

## خطوات:
1. انسخ كل ملف لمكانه
2. `git add -A && git commit -m "feat: SEO pages + smoke test" && git push`

## تشغيل الـ Smoke Test:
```bash
npx playwright test e2e/smoke.test.ts
```

## الصفحات الجديدة:
- /seo/brand-diagnosis
- /seo/offer-check
- /seo/message-check
- /seo/presence-audit
- /seo/identity-snapshot
- /seo/launch-readiness
