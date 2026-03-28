# RADD AI — Deployment Guide

## Environment Variables

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Set to `production` | `production` |
| `SECRET_KEY` | **Critical** — Used for token encryption (Fernet), session signing. Must be ≥32 chars. | See below |
| `JWT_SECRET_KEY` | JWT signing key | Strong random string |
| `DATABASE_URL` | PostgreSQL connection (asyncpg) | `postgresql+asyncpg://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection | `redis://host:6379/0` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional

| Variable | Description |
|----------|-------------|
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SENTRY_DSN` | Sentry error tracking |
| `QDrant` | Vector DB for knowledge base |

---

## SECRET_KEY — Generation & Validation

In **production** (`APP_ENV=production`), `SECRET_KEY` is validated:

- Must **not** be: `change-me`, `radd-default-secret`, or empty
- Must be **at least 32 characters**

### Generate a Strong SECRET_KEY

**Option 1 — Fernet key (recommended for token encryption):**

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Example output: `gAAAAABl...` (44 chars, URL-safe base64)

**Option 2 — Random string (32+ chars):**

```bash
openssl rand -base64 32
```

**Option 3 — Python:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Set in Production

```bash
export SECRET_KEY="your-generated-key-here"
# or in .env (never commit .env to git):
# SECRET_KEY=your-generated-key-here
```

---

## Docker Deployment

Images are built and pushed to GHCR via CI. See `.github/workflows/manus-deploy.yml`.

```bash
# Pull and run API
docker pull ghcr.io/owner/radd-api:latest
docker run -e SECRET_KEY=... -e DATABASE_URL=... ghcr.io/owner/radd-api:latest
```

---

## Health Checks

- `GET /health` — Basic liveness
- `GET /ready` — Readiness (DB, Redis, Qdrant)

---

## Security Checklist

- [ ] `SECRET_KEY` is strong (≥32 chars) and not a default value
- [ ] `JWT_SECRET_KEY` is unique and strong
- [ ] `DATABASE_URL` uses SSL in production
- [ ] `CORS_ORIGINS` is restricted (no `*` in production)
- [ ] `.env` is in `.gitignore` and never committed
