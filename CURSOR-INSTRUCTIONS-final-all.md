# WZRD AI — الحزمة النهائية الشاملة
# ٣٢ ملف | ٢,٤٤٣ سطر | كل الـ Features + SEO + Homepage + Smoke Test

## هذه الحزمة تحل محل كل الحزم السابقة

---

## الملفات الجديدة (١٧):
```
client/src/pages/MyBrand.tsx
client/src/pages/Copilot.tsx
client/src/pages/CompetitiveBenchmark.tsx
client/src/pages/QuickDiagnosis.tsx
client/public/landing/seo/brand-diagnosis.html
client/public/landing/seo/offer-check.html
client/public/landing/seo/message-check.html
client/public/landing/seo/presence-audit.html
client/public/landing/seo/identity-snapshot.html
client/public/landing/seo/launch-readiness.html
server/routers/copilot.ts
server/routers/referral.ts
server/emailTrigger.ts
drizzle/0015_diagnosis_history_checklists.sql
drizzle/0016_referrals_copilot_carts.sql
e2e/smoke.test.ts
```

## الملفات المعدّلة (١٥):
```
client/src/App.tsx
client/src/components/WzrdPublicHeader.tsx
client/src/pages/Signup.tsx
client/src/pages/Tools.tsx
client/src/pages/Pricing.tsx
client/src/pages/tools/ToolPage.tsx
client/public/landing/index.html
client/public/landing/services.html
server/_core/vite.ts
server/db/credits.ts
server/routers/auth.ts
server/routers/index.ts
server/routers/premium.ts
server/routers/reportPdf.ts
server/routers/tools.ts
drizzle/schema.ts
```

## خطوات:
1. انسخ كل ملف لمكانه
2. `pnpm exec tsc --noEmit && pnpm run build`
3. `git add -A && git commit -m "feat: Complete WZRD AI — all features" && git push`
4. بعد Deploy:
```bash
mysql -h <HOST> -u <USER> -p<PASS> <DB> < drizzle/0015_diagnosis_history_checklists.sql
mysql -h <HOST> -u <USER> -p<PASS> <DB> < drizzle/0016_referrals_copilot_carts.sql
```
5. Smoke test: `npx playwright test e2e/smoke.test.ts`

## ⚠️ تنبيهات:
- WhatsApp: غيّر `201000000000` في services.html لرقمك الحقيقي
- GA4: فك التعليق من GA4 snippet في index.html وحط Measurement ID بتاعك
- Groq API Key: غيّره في Railway (القديم اتعرض)

## كل الـ Features (٢٠+):
1. Onboarding redirect → brand diagnosis
2. Debug endpoint removed
3. Brand Health Tracker (/my-brand)
4. Action Checklist (toggleable tasks)
5. Competitive Benchmark (/tools/benchmark)
6. Quick Diagnosis (/tools/quick — 5 questions)
7. AI Copilot (/copilot — full chat)
8. Referral System (invite → 50 credits each)
9. Premium Blurred Preview (A/B winner)
10. Pricing Update (99/199/499/999 EGP)
11. Enhanced PDF Reports (actionItems + CTA)
12. Email Triggers (signup + tool_run + low_score)
13. Abandoned Cart tracking (DB)
14. Tools page: 8 tools
15. MyBrand: 4 feature cards (2x2)
16. 6 SEO Landing Pages
17. Playwright Smoke Test (13 tests)
18. Homepage: new features section + nav links + GA4
19. WhatsApp number fix
20. Daily credit cap (500/day)

## الصفحات:
/my-brand | /copilot | /tools/benchmark | /tools/quick | /pricing
/seo/brand-diagnosis | /seo/offer-check | /seo/message-check
/seo/presence-audit | /seo/identity-snapshot | /seo/launch-readiness
