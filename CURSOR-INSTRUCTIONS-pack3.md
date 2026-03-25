# WZRD AI — الحزمة الكاملة (كل الـ Features)

## كل الملفات — انسخ كل واحد لمكانه في المشروع:

### ملفات جديدة (٩):
- `client/src/pages/MyBrand.tsx` — صحة البراند
- `client/src/pages/Copilot.tsx` — المستشار الذكي
- `client/src/pages/CompetitiveBenchmark.tsx` — مقارنة بالمنافسين
- `client/src/pages/QuickDiagnosis.tsx` — تشخيص سريع (٥ أسئلة)
- `server/routers/copilot.ts` — AI Copilot backend
- `server/routers/referral.ts` — نظام الإحالة
- `server/emailTrigger.ts` — Email automation helper
- `drizzle/0015_diagnosis_history_checklists.sql` — Migration 1
- `drizzle/0016_referrals_copilot_carts.sql` — Migration 2

### ملفات معدّلة (١١) — استبدل القديم:
- `client/src/App.tsx`
- `client/src/components/WzrdPublicHeader.tsx`
- `client/src/pages/Signup.tsx`
- `client/src/pages/Pricing.tsx`
- `client/src/pages/tools/ToolPage.tsx`
- `server/_core/vite.ts`
- `server/db/credits.ts`
- `server/routers/auth.ts`
- `server/routers/index.ts`
- `server/routers/premium.ts`
- `server/routers/tools.ts`
- `drizzle/schema.ts`

## بعد النسخ:
```bash
git add -A
git commit -m "feat: All features — Health Tracker + Copilot + Benchmark + Referrals + Quick Mode + Email Triggers"
git push origin main
```

## بعد Deploy — شغّل الـ Migrations:
```bash
mysql -h <HOST> -u <USER> -p<PASS> <DB> < drizzle/0015_diagnosis_history_checklists.sql
mysql -h <HOST> -u <USER> -p<PASS> <DB> < drizzle/0016_referrals_copilot_carts.sql
```
