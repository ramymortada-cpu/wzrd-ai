# Skill 14: Docker Compose Fix — إضافة outbound_call_worker للإنتاج

## When to Use
عند نشر الإنتاج — الـ `outbound_call_worker` مطلوب لمعالجة مكالمات COD Shield من Redis queue `cod_shield_calls`.

## اقرأ أولاً
- `docs/DATA_FLOW.md` — قسم Outbound Call Worker
- `apps/api/workers/outbound_call_worker.py` — الكود الموجود
- `infrastructure/docker-compose.prod.yml` — الملف المستهدف

## المهمة
إضافة خدمة `outbound_call_worker` إلى `docker-compose.prod.yml` بنفس نمط `worker` و `kb_indexer`.

## الكود المرجعي

```yaml
# worker و kb_indexer يستخدمان نفس الصورة radd-worker
# command يحدد أي worker يُشغّل
worker:
  command: ["python", "-m", "workers.message_worker"]
kb_indexer:
  command: ["python", "-m", "workers.kb_indexer"]
```

## الخطوات

### 1. إضافة خدمة outbound_call_worker
بعد `kb_indexer` وقبل `web`، أضف:

```yaml
  # ─── Outbound Call Worker (COD Shield) ────────────────────────────────────
  outbound_call_worker:
    image: ${REGISTRY:-ghcr.io/radd-ai}/radd-worker:${TAG:-latest}
    build:
      context: ..
      dockerfile: infrastructure/docker/Dockerfile.worker
    command: ["python", "-m", "workers.outbound_call_worker"]
    <<: *api-env
    networks: [radd_net]
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
```

### 2. التحقق
```bash
docker compose -f infrastructure/docker-compose.prod.yml config
# يجب أن يظهر outbound_call_worker بدون أخطاء
```

## Acceptance Criteria
- [ ] `outbound_call_worker` يظهر في `docker compose config`
- [ ] يستخدم نفس الصورة `radd-worker`
- [ ] يعتمد على `api` (condition: service_healthy)
- [ ] يستخدم `*api-env` (env_file + environment)

## لا تفعل
- لا تضيف `volumes` للـ model_cache — outbound_call_worker لا يحتاج NLI model
- لا تغيّر `command` — يجب أن يكون `workers.outbound_call_worker`
