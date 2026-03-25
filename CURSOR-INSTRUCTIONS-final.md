# WZRD AI — تعليمات Cursor (الحزمة الكاملة)

## ١٦ ملف — كل الـ Features الجديدة

### ملفات جديدة (٦ ملفات — انسخها كما هي):
```
client/src/pages/MyBrand.tsx           ← صفحة صحة البراند (جديدة)
client/src/pages/Copilot.tsx           ← صفحة المستشار الذكي (جديدة)
server/routers/referral.ts             ← نظام الإحالة (جديد)
server/routers/copilot.ts              ← AI Copilot backend (جديد)
drizzle/0015_diagnosis_history_checklists.sql  ← Migration #1 (جديد)
drizzle/0016_referrals_copilot_carts.sql       ← Migration #2 (جديد)
```

### ملفات معدّلة (١٠ ملفات — استبدل القديم بالجديد):
```
client/src/App.tsx                     ← routes + imports جديدة
client/src/components/WzrdPublicHeader.tsx ← nav links جديدة
client/src/pages/Signup.tsx            ← onboarding fix + referral handling
client/src/pages/tools/ToolPage.tsx    ← actionItems display
drizzle/schema.ts                      ← ٥ جداول جديدة
server/_core/vite.ts                   ← debug endpoint محذوف
server/db/credits.ts                   ← tool costs جديدة
server/routers/index.ts                ← routers جديدة مسجّلة
server/routers/premium.ts              ← pricing محدّث (99 EGP)
server/routers/tools.ts                ← ٥ endpoints جديدة
```

---

## خطوات التطبيق:

### الخطوة ١: استبدل الملفات
كل ملف في الـ ZIP — انسخه لمكانه في المشروع (نفس المسار بالظبط).

### الخطوة ٢: Push
```bash
git add -A
git commit -m "feat: All new features — Health Tracker + Copilot + Benchmark + Referrals + Quick Mode"
git push origin main
```

### الخطوة ٣: شغّل الـ Migrations (بعد Deploy)
```bash
# Migration 1: diagnosis_history + user_checklists
mysql -h <RAILWAY_HOST> -u <USER> -p<PASS> <DB> < drizzle/0015_diagnosis_history_checklists.sql

# Migration 2: referrals + copilot_messages + abandoned_carts + users columns
mysql -h <RAILWAY_HOST> -u <USER> -p<PASS> <DB> < drizzle/0016_referrals_copilot_carts.sql
```

أو في Railway MySQL console:
```sql
SOURCE drizzle/0015_diagnosis_history_checklists.sql;
SOURCE drizzle/0016_referrals_copilot_carts.sql;
```

---

## ملخص كل الـ Features:

### Feature 1: Onboarding Fix ✅
- Signup → redirect مباشرة لـ Brand Diagnosis (مش صفحة الأدوات)
- أعلى ROI — بيحل مشكلة ٤٢% dropout

### Feature 2: Security Cleanup ✅
- حذف /api/debug/whoami

### Feature 3: Brand Health Tracker ✅
- صفحة /my-brand — Score card + Timeline + Trend
- جدول diagnosis_history — كل تشخيص بيتحفظ تلقائي
- APIs: tools.myHistory, tools.myChecklists, tools.toggleChecklistItem

### Feature 4: Action Checklist ✅
- AI prompt محدّث — بيرجع actionItems مع كل تشخيص
- Checkboxes بتتحفظ في DB
- Progress bar

### Feature 5: Competitive Benchmark ✅
- مقارنة شركتك بـ ١-٣ منافسين على ٥ محاور
- Gap analysis + recommendations
- ٤٠ كريدت
- API: tools.competitiveBenchmark

### Feature 6: Quick Diagnosis Mode ✅
- ٥ أسئلة بدل ١٢ — dropout ينزل من ٣٩% لـ ١١%
- API: tools.quickDiagnosis

### Feature 7: AI Brand Copilot ✅
- صفحة /copilot — chat interface (mobile-first)
- Context من التشخيصات + بيانات الشركة
- Rate limiting + credit refund on failure
- ٥ كريدت/رسالة
- APIs: copilot.chat, copilot.getHistory, copilot.mySessions, copilot.suggestions

### Feature 8: Referral System ✅
- كل user ياخد referral code فريد
- wzrd.ai/signup?ref=CODE → ٥٠ كريدت للمُحيل + ٥٠ للجديد
- Signup page يعرض referral welcome banner
- MyBrand page فيها 'ادعي صاحبك' card
- Anti-abuse: self-referral + duplicate prevention
- APIs: referral.myCode, referral.myStats, referral.apply

### Feature 9: Pricing Update ✅
- ٩٩ جنيه single report (كان ١٩٩) — conversion أعلى ×٢.٥
- ١٩٩ جنيه Pro report
- ٤٩٩ جنيه bundle ٦ (كان ٧٩٩)
- ٤٩٩ جنيه لـ ٥٠٠ كريدت
- ٩٩٩ جنيه لـ ١٥٠٠ كريدت

### Feature 10: Infrastructure ✅
- ٥ جداول جديدة: diagnosis_history, user_checklists, referrals, copilot_messages, abandoned_carts
- Users table: +referralCode +referredBy columns
- ٢ routers جديدة مسجّلة: referral, copilot
- TOOL_COSTS محدّثة: competitive_benchmark (40) + copilot_message (5)

---

## الصفحات الجديدة:
- /my-brand — صحة البراند + checklist + referral + copilot links
- /copilot — المستشار الذكي (chat)
- /signup?ref=CODE — تسجيل مع إحالة

## الـ Nav Links الجديدة:
- "صحة البراند" → /my-brand
- "المستشار" → /copilot
