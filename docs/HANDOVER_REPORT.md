# تقرير تسليم شامل — RADD AI

> منصة خدمة عملاء ذكية عربية لمتاجر التجارة الإلكترونية السعودية  
> WhatsApp-native · Arabic-first · RAG + NLP

---

## 1. روابط الوصول

### Git Repository

| البند | القيمة |
|-------|--------|
| **الرابط العام** | `https://github.com/ramymortada-cpu/RADD-AI` |
| **Clone (HTTPS)** | `git clone https://github.com/ramymortada-cpu/RADD-AI.git` |
| **Clone (SSH)** | `git clone git@github.com:ramymortada-cpu/RADD-AI.git` |
| **الفرع الرئيسي** | `main` |

> ⚠️ **تنبيه أمني:** إذا كان `git remote` يحتوي على token (مثل `https://token@github.com/...`)، يُفضّل إزالته واستخدام SSH أو credential helper:
> ```bash
> git remote set-url origin https://github.com/ramymortada-cpu/RADD-AI.git
> ```
> وإلغاء أي token ظاهر من GitHub → Settings → Developer settings → Personal access tokens.

---

## 2. بيانات الدخول الافتراضية (Development)

| الخدمة | القيمة | الملاحظة |
|--------|--------|----------|
| **Dashboard (بعد seed)** | | |
| Workspace slug | `demo` | |
| البريد | `owner@demo.com` | |
| كلمة المرور | `Demo1234!` | |
| **PostgreSQL (محلي)** | | |
| المستخدم | `radd` | |
| كلمة المرور | `radd_dev_password` | |
| قاعدة البيانات | `radd_dev` | |
| المنفذ | `5432` | |
| **Redis (محلي)** | | |
| URL | `redis://localhost:6379/0` | |
| **MinIO (محلي)** | | |
| المستخدم | `radd_minio` | |
| كلمة المرور | `radd_minio_password` | |
| Console | `http://localhost:9001` | |
| **Qdrant (محلي)** | | |
| URL | `http://localhost:6333` | |
| Dashboard | `http://localhost:6333/dashboard` | |

---

## 3. الخدمات الخارجية المطلوبة (Production)

| الخدمة | الغرض | رابط التسجيل | التكلفة |
|--------|-------|--------------|---------|
| **OpenAI** | GPT + Embeddings | [platform.openai.com](https://platform.openai.com) | ~$0.002/1k msg |
| **Meta WhatsApp** | WhatsApp Cloud API | [business.facebook.com](https://business.facebook.com) | 1000 رسالة مجاناً/شهر |
| **Neon** | PostgreSQL (serverless) | [neon.tech](https://neon.tech) | Free tier |
| **Upstash** | Redis (serverless) | [upstash.com](https://upstash.com) | Free tier |
| **Salla** | تكامل الطلبات | [salla.dev](https://salla.dev) | Free (Partner API) |
| **Qdrant Cloud** | Vector DB (اختياري) | [cloud.qdrant.io](https://cloud.qdrant.io) | أو self-hosted |

> **ملاحظة:** مفاتيح API وبيانات الدخول تُخزّن في `.env` ولا تُرفع إلى Git.

---

## 4. هيكل المشروع

```
RADD-AI/
├── apps/
│   ├── api/                    # Backend — FastAPI (Python 3.12)
│   │   ├── radd/
│   │   │   ├── admin/         # لوحة التحكم، KPIs، إعدادات، مستخدمين
│   │   │   ├── auth/          # JWT، RBAC، blacklist
│   │   │   ├── actions/      # Salla API، إجراءات خارجية
│   │   │   ├── conversations/
│   │   │   ├── db/            # SQLAlchemy، models، sessions
│   │   │   ├── escalation/
│   │   │   ├── intelligence/  # Cross-merchant، RADD score، agent assist
│   │   │   ├── knowledge/    # KB، embeddings، RAG
│   │   │   ├── pipeline/     # NLP، intent، guardrails
│   │   │   ├── webhooks/     # WhatsApp، Instagram
│   │   │   ├── websocket/
│   │   │   └── whatsapp/
│   │   ├── workers/
│   │   │   ├── message_worker.py
│   │   │   └── kb_indexer.py
│   │   ├── alembic/
│   │   ├── scripts/
│   │   └── tests/
│   ├── web/                   # Frontend — Next.js 15 (RTL Arabic)
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── mobile/                # (إن وجد)
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── docs/
│   ├── DEPLOYMENT.md
│   └── HANDOVER_REPORT.md
├── .github/workflows/
├── Makefile
├── .env.example
└── README.md
```

---

## 5. التقنيات المستخدمة

| الطبقة | التقنية | الإصدار |
|--------|----------|---------|
| Backend | FastAPI | ≥0.115 |
| Python | 3.12+ | |
| DB | PostgreSQL + asyncpg | 16 |
| Cache/Queue | Redis | 7 |
| Vector DB | Qdrant | 1.12 |
| NLP | transformers, torch | |
| Frontend | Next.js | 15.2 |
| React | 19 | |
| Styling | Tailwind CSS | 4 |
| Package Manager (API) | uv | |
| Package Manager (Web) | pnpm | 9 |

---

## 6. أوامر التشغيل السريع

```bash
# 1. استنساخ المشروع
git clone https://github.com/ramymortada-cpu/RADD-AI.git
cd RADD-AI

# 2. إعداد البيئة
cp .env.example .env
# تعديل .env — إضافة OPENAI_API_KEY على الأقل

# 3. تثبيت الاعتماديات
make install

# 4. تشغيل الخدمات (Postgres, Redis, Qdrant, MinIO)
make up

# 5. تشغيل migrations
make migrate

# 6. إدخال بيانات تجريبية
make seed

# 7. تشغيل التطبيق (3 terminals)
make api      # API على :8000
make worker   # Worker
make web      # Frontend على :3000
```

**روابط محلية:**
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Dashboard: http://localhost:3000
- MinIO: http://localhost:9001
- Qdrant: http://localhost:6333/dashboard

---

## 7. المتغيرات البيئية الأساسية

| المتغير | الوصف | مثال |
|---------|-------|------|
| `APP_ENV` | development / staging / production | `development` |
| `SECRET_KEY` | تشفير tokens (≥32 حرف في production) | انظر docs/DEPLOYMENT.md |
| `DATABASE_URL` | PostgreSQL | `postgresql+asyncpg://user:pass@host:5432/db` |
| `REDIS_URL` | Redis | `redis://localhost:6379/0` |
| `OPENAI_API_KEY` | OpenAI | `sk-...` |
| `JWT_SECRET_KEY` | توقيع JWT | |
| `META_APP_SECRET` | Meta webhook | |
| `META_VERIFY_TOKEN` | Webhook verify | |
| `WA_PHONE_NUMBER_ID` | WhatsApp | |
| `WA_API_TOKEN` | WhatsApp | |

القائمة الكاملة في `.env.example`.

---

## 8. الاختبارات

| النوع | الأمر | المتطلبات |
|-------|-------|-----------|
| Unit tests | `make test-api` أو `cd apps/api && uv run pytest tests/ --ignore=tests/integration` | |
| Integration tests | `cd apps/api && uv run pytest tests/integration/ -v` | Docker |
| Frontend tests | `make test-web` | |

---

## 9. CI/CD

- **الملف:** `.github/workflows/manus-deploy.yml`
- **المحفزات:** push / pull_request على `main`
- **الوظائف:**
  - `test-api` — Lint، unit tests
  - `test-api-integration` — Integration tests (testcontainers)
  - `test-web` — Typecheck، lint
  - `build-push` — بناء صور Docker ورفعها إلى GHCR (عند push إلى main)

---

## 10. النشر (Production)

- **الدليل:** `docs/DEPLOYMENT.md`
- **الخيارات:** Docker Compose على VPS أو GitHub Actions + Auto-deploy
- **الصور:** `ghcr.io/<owner>/radd-api`, `radd-worker`, `radd-web`

---

## 11. نقاط أمان مهمة

- [ ] `SECRET_KEY` قوي (≥32 حرف) في production
- [ ] `JWT_SECRET_KEY` فريد وقوي
- [ ] `DATABASE_URL` يستخدم SSL في production
- [ ] `CORS_ORIGINS` محدد (لا `*` في production)
- [ ] `.env` في `.gitignore` ولا يُرفع إلى Git
- [ ] عدم تخزين tokens في `git remote` — استخدام SSH أو credential helper

---

## 12. جهات الاتصال والمراجع

| المورد | الرابط |
|--------|--------|
| README | `README.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| API Docs | http://localhost:8000/docs (عند التشغيل) |

---

*آخر تحديث: مارس 2025*
