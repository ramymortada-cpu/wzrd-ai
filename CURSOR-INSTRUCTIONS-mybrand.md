# WZRD AI — تعليمات Cursor

## الملفات المعدّلة (٩ ملفات):

### ملفات جديدة (انسخها كما هي):
1. `client/src/pages/MyBrand.tsx` — صفحة صحة البراند (جديدة)
2. `drizzle/0015_diagnosis_history_checklists.sql` — Migration (جديد)

### ملفات معدّلة (استبدل القديم بالجديد):
3. `client/src/App.tsx` — أضفنا route `/my-brand` + lazy import
4. `client/src/pages/Signup.tsx` — redirect من `/tools` لـ `/tools/brand-diagnosis`
5. `client/src/pages/tools/ToolPage.tsx` — أضفنا actionItems display
6. `client/src/components/WzrdPublicHeader.tsx` — أضفنا nav link "صحة البراند"
7. `server/routers/tools.ts` — أضفنا ٣ endpoints + history save + actionItems
8. `server/_core/vite.ts` — حذفنا `/api/debug/whoami`
9. `drizzle/schema.ts` — أضفنا جدولين: `diagnosisHistory` + `userChecklists`

## خطوات التطبيق في Cursor:

### الخطوة ١: استبدل الملفات
كل ملف في الـ zip — انسخه لمكانه في المشروع (نفس المسار بالظبط).

### الخطوة ٢: شغّل الـ Migration
بعد الـ push لـ Railway — شغّل:
```sql
-- في Railway MySQL console أو أي MySQL client:
SOURCE drizzle/0015_diagnosis_history_checklists.sql;
```
أو:
```bash
mysql -h <RAILWAY_HOST> -u <USER> -p<PASS> <DB> < drizzle/0015_diagnosis_history_checklists.sql
```

### الخطوة ٣: Push
```bash
git add -A
git commit -m "feat: Brand Health Tracker + Action Checklist + Onboarding Fix"
git push origin main
```

## ملخص التغييرات:
- ✅ Signup → يوجّه مباشرة لـ Brand Diagnosis (مش صفحة الأدوات)
- ✅ حذف debug endpoint (/api/debug/whoami)
- ✅ جدول diagnosis_history — يحفظ كل نتيجة تشخيص
- ✅ جدول user_checklists — مهام عملية لكل تشخيص
- ✅ AI prompt محدّث — بيرجع actionItems مع كل تشخيص
- ✅ ٣ APIs جديدة: myHistory + myChecklists + toggleChecklistItem
- ✅ صفحة /my-brand — Score card + Timeline + Checklist
- ✅ Action Items تظهر في نتيجة التشخيص
- ✅ Nav link "صحة البراند" في الـ header
