# Primo Command Center — Production Deployment Guide
## Railway + Anthropic Claude + MySQL

---

## المتطلبات

| الشيء | التفاصيل | التكلفة |
|-------|---------|--------|
| **Railway account** | https://railway.app | $5/شهر (Hobby plan) |
| **Anthropic API key** | https://console.anthropic.com | ~$3/مليون token |
| **GitHub account** | لربط الـ repo | مجاني |

---

## الخطوات — Step by Step

### Step 1: Groq API Key — مجاني! (3 دقائق)

1. اذهب إلى https://console.groq.com/keys
2. أنشئ حساب (بدون credit card)
3. اضغط **Create API Key**
4. انسخ الـ key (يبدأ بـ `gsk_...`)
5. **خلاص — ده الـ primary provider ومجاني**

### Step 1b: Anthropic API Key — اختياري (5 دقائق)

**ده اختياري.** لو عايز deliverables بجودة أعلى:

1. اذهب إلى https://console.anthropic.com
2. أنشئ حساب + أضف رصيد ($10)
3. **API Keys** → **Create Key**
4. انسخ الـ key (يبدأ بـ `sk-ant-api03-...`)

**بدون Claude:** كل حاجة تشتغل على Groq — مجاناً.
**مع Claude:** deliverables + proposals تروح لـ Claude (أذكى)، الباقي يروح Groq (أرخص).

### Step 2: رفع الكود على GitHub (5 دقائق)

```bash
# 1. فك الضغط عن الـ zip
unzip primo-command-center-10of10-final.zip -d primo-command-center
cd primo-command-center

# 2. أنشئ repo جديد على GitHub (private)
# اذهب لـ https://github.com/new → اسمه primo-command-center → Private

# 3. ارفع الكود
git init
git add .
git commit -m "Primo Command Center v1.0 — production ready"
git remote add origin https://github.com/YOUR_USERNAME/primo-command-center.git
git push -u origin main
```

### Step 3: إنشاء مشروع Railway (10 دقائق)

1. اذهب إلى https://railway.app → **New Project**
2. اختر **Deploy from GitHub Repo**
3. اختر `primo-command-center` repo
4. Railway هيبدأ يبني تلقائياً (استنى — هيفشل لأنه محتاج env vars)

### Step 4: إضافة MySQL Database (دقيقتين)

1. في نفس المشروع على Railway → **+ New** → **Database** → **MySQL**
2. Railway هيضيف MySQL service تلقائياً
3. اذهب إلى MySQL service → **Connect** tab
4. انسخ الـ `DATABASE_URL` (هيكون شكله: `mysql://root:xxx@xxx.railway.app:3306/railway`)

### Step 5: إضافة Environment Variables (5 دقائق)

1. اذهب إلى الـ **web service** (مش MySQL) → **Variables** tab
2. أضف المتغيرات التالية:

```
NODE_ENV=production
JWT_SECRET=<اعمل واحد عشوائي: openssl rand -hex 32>
DATABASE_URL=<من Step 4>
GROQ_API_KEY=gsk_<الـ key من Step 1>
GROQ_MODEL=llama-3.3-70b-versatile
```

**اختياري — لو عايز Claude كمان:**
```
ANTHROPIC_API_KEY=sk-ant-api03-<الـ key من Step 1b>
CLAUDE_MODEL=claude-sonnet-4-20250514
```

3. اضغط **Deploy** (أو هيعمل redeploy تلقائياً)

### Step 6: Run Database Migrations (5 دقائق)

1. في Railway → الـ web service → **Settings** → **Deploy Command**
2. غيّره مؤقتاً إلى:
```
npx drizzle-kit migrate && node dist/index.js
```
3. أو من **Terminal** tab في Railway:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
4. بعد ما الـ migrations تشتغل، رجّع الـ deploy command لـ: `node dist/index.js`

### Step 7: Test! (دقيقتين)

1. Railway هيديك URL شكله: `https://primo-command-center-production.up.railway.app`
2. افتحه في المتصفح
3. **تهانينا — Wzrd AI شغال في production!** 🎉

---

## التكلفة الشهرية المتوقعة

| البند | Groq فقط (مجاني) | Groq + Claude |
|-------|-------------------|---------------|
| Railway Hobby Plan | $5/شهر | $5/شهر |
| Railway MySQL | مدمج | مدمج |
| Groq (80% calls) | **$0** (free tier) | **$0** |
| Claude (20% calls) | — | ~$2-5/شهر |
| **الإجمالي** | **$5/شهر** | **$7-10/شهر** |

**بالمقارنة:** Claude لوحده كان هيكلفك ~$25-30/شهر.

---

## إعدادات اختيارية

### Custom Domain
1. Railway → Service → **Settings** → **Custom Domain**
2. أضف مثلاً: `app.primomarca.com`
3. أضف CNAME record في DNS: `app.primomarca.com → xxx.up.railway.app`

### Telegram Bot
1. أنشئ bot على @BotFather في Telegram → خذ الـ token
2. أضف في Railway Variables: `TELEGRAM_BOT_TOKEN=123456:ABC-DEF...`
3. اعمل webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.up.railway.app/api/webhooks/telegram`

### Email Notifications (Resend)
1. أنشئ حساب على https://resend.com (مجاني أول 100 email/يوم)
2. أضف في Railway Variables:
```
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxx
EMAIL_FROM=Primo Marca <noreply@your-domain.com>
```

---

## Troubleshooting

| المشكلة | الحل |
|---------|------|
| **Build failed** | اتأكد إن `pnpm-lock.yaml` موجود في الـ repo |
| **DB connection error** | اتأكد إن `DATABASE_URL` منسوخ صح من MySQL service |
| **LLM timeout** | اتأكد إن `ANTHROPIC_API_KEY` صح وعندك رصيد |
| **White screen** | افحص Browser Console — غالباً env var ناقص |
| **Migrations failed** | شغّل `npx drizzle-kit generate` الأول |

---

## Monitoring

- **Railway Dashboard:** يوريك CPU + Memory + Logs في الوقت الحقيقي
- **Health Check:** `https://your-app.up.railway.app/api/trpc/system.health`
- **LLM Stats:** اذهب لصفحة Admin في التطبيق → LLM Stats
- **Logs:** Railway → Service → **Logs** tab

---

## الترقية المستقبلية

| لو محتاج | الحل |
|----------|------|
| أكتر من 500 msg/يوم | غيّر الـ model لـ `claude-haiku-4-5-20251001` ($0.25/M — أرخص 12x) |
| ملفات كبيرة | أضف AWS S3 bucket |
| أكتر من 1 user | الـ RBAC جاهز — أضف users في الـ DB |
| WhatsApp | أنشئ WhatsApp Business Account + أضف الـ tokens |
