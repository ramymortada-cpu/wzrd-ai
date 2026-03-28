# RADD AI — نظرة شاملة للمحلل

> **الغرض:** وثيقة لشخص يريد تحليل RADD AI، فهم التكنولوجيا، وتحديد ما يمكن إعادة استخدامه وما يحتاج بناءً جديداً.  
> **الخيارات الثلاثة:** (1) توسيع RADD AI نفسه (2) أخذ الـ architecture وبناء منتج جديد (3) RADD AI كأول use-case داخل platform أكبر.

---

## 1. ما هو RADD AI؟

**رَدّ (Radd)** — منصة دعم عملاء بالذكاء الاصطناعي، موجهة لتجارة السعودية الإلكترونية، تعتمد على WhatsApp.

- **الوظيفة:** استقبال رسائل العملاء على WhatsApp → تصنيف النية → استرجاع من قاعدة المعرفة (RAG) → توليد رد بالعربية (مع دعم اللهجات) → إرسال الرد أو تصعيد للوكيل البشري.
- **التكاملات:** Salla، Shopify، Zid (منصات تجارة إلكترونية سعودية). COD Shield (مكالمات تأكيد الطلب — مصر).
- **الهدف:** أتمتة 80%+ من استفسارات الدعم الروتينية.

---

## 2. الـ Architecture الفعلي (بعد الـ Refactor)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  WhatsApp / Instagram / Webhooks (Cart, Shipping, Twilio)               │
│       ↓                                                                 │
│  FastAPI (radd/webhooks) → Redis Streams messages:{workspace_id}        │
│       ↓                                                                 │
│  StreamConsumer (workers/handlers/stream_consumer.py)                   │
│       ↓                                                                 │
│  MessageHandler (workers/handlers/message_handler.py)                   │
│       ↓                                                                 │
│  ┌────────────────── NLP Pipeline ──────────────────────────────────┐   │
│  │ normalize → detect_dialect → classify_intent (LLM أو keyword)      │   │
│  │      ↓                                                            │   │
│  │ Actions (radd/actions/base.py):                                   │   │
│  │   • order_status → Salla / Shopify API                            │   │
│  │   • shipping → track_shipment (Salla)                             │   │
│  │   • cancel_request → Save The Sale (radd/actions/save_the_sale)   │   │
│  │   • create_return → Salla API                                     │   │
│  │      ↓                                                            │   │
│  │ RAG: Qdrant (vector) + PG BM25 + RRF                              │   │
│  │      ↓                                                            │   │
│  │ GPT-4.1-mini (عربي، واعي باللهجة)                                 │   │
│  │      ↓                                                            │   │
│  │ NLI verify (xlm-roberta-large-xnli)                                │   │
│  │      ↓                                                            │   │
│  │ Guardrails (PII redaction + injection)                            │   │
│  │      ↓                                                            │   │
│  │ Confidence routing → auto_rag | escalated_soft | escalated_hard   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       ↓                                                                 │
│  ResponseSender (workers/handlers/response_sender.py) → WhatsApp API    │
│       ↓                                                                 │
│  Next.js Dashboard (RTL Arabic, WebSocket للوكلاء)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Workers المنفصلة

| Worker | الملف | الوظيفة |
|--------|-------|---------|
| Message Worker | `workers/message_worker.py` → يستدعي `StreamConsumer` + `MessageHandler` | قراءة Redis Streams، معالجة الرسائل |
| Delayed Task Worker | `workers/delayed_task_worker.py` | مهام مؤجلة (cart recovery، follow-ups) |
| Outbound Call Worker | `workers/outbound_call_worker.py` | COD Shield — مكالمات تأكيد الطلب (Twilio) |
| KB Indexer | `workers/kb_indexer.py` | تشفير المستندات + Qdrant |

---

## 3. التكنولوجيا (Tech Stack)

| الطبقة | التقنية |
|--------|---------|
| Backend | FastAPI، Python 3.12+ |
| DB | PostgreSQL 16 (asyncpg) |
| Cache / Queue | Redis 7 (Streams + Lists) |
| Vector DB | Qdrant |
| NLP | OpenAI (GPT-4.1-mini، text-embedding-3-small)، transformers (xlm-roberta) |
| E-commerce | Salla API، Shopify API، Zid |
| Voice | Twilio |
| Frontend | Next.js 15، RTL Arabic |
| Infra | Docker Compose، Nginx |

---

## 4. هيكل الملفات الفعلي (مهم — يختلف عن الوثائق القديمة)

```
apps/api/
├── radd/
│   ├── actions/           # تكاملات خارجية
│   │   ├── base.py        # detect_and_run_action — dispatcher
│   │   ├── salla.py       # حالة الطلب، استخراج رقم الطلب
│   │   ├── salla_advanced.py  # تتبع الشحن، إلغاء، إرجاع
│   │   ├── save_the_sale.py   # Save The Sale (13 اختبار)
│   │   ├── shopify.py
│   │   └── ...
│   ├── admin/             # لوحة التحكم — KPIs، إعدادات، عملاء
│   ├── auth/              # JWT + RBAC
│   ├── db/                # SQLAlchemy models
│   ├── escalation/        # طابور التصعيد + workflow الوكلاء
│   ├── knowledge/         # إدارة قاعدة المعرفة + embedding
│   ├── pipeline/          # NLP: normalizer, dialect, intent, RAG, verifier, guardrails
│   ├── scheduler/         # delayed_task.py — مهام مؤجلة
│   ├── sales/             # cart_recovery، engine، recommendations
│   ├── webhooks/           # WhatsApp، cart، shipping، Twilio
│   ├── whatsapp/          # WhatsApp Cloud API client
│   └── ...
├── workers/
│   ├── handlers/          # ← الـ Refactor الفعلي
│   │   ├── message_handler.py   # معالجة رسالة واحدة
│   │   ├── stream_consumer.py  # قراءة Redis Streams
│   │   └── response_sender.py   # إرسال الرد
│   ├── message_worker.py       # نقطة الدخول (يستدعي StreamConsumer)
│   ├── delayed_task_worker.py
│   ├── outbound_call_worker.py
│   └── kb_indexer.py
└── tests/
```

---

## 5. الفجوة بين الوثائق والكود

| الوثيقة تقول | الكود الفعلي |
|--------------|--------------|
| `workers/message_worker.py` (monolith) | `workers/handlers/` (message_handler + stream_consumer + response_sender) |
| `radd/sales/engine.py` | `radd/actions/base.py` + `radd/actions/save_the_sale.py` |
| `radd/followups/scheduler.py` | `radd/scheduler/delayed_task.py` + `workers/delayed_task_worker.py` |
| DLQ في `dead_letter_queue` | DLQ في `cod_shield_dlq` (Outbound Call Worker فقط) |

---

## 6. الميزات المنفذة

- [x] Webhook WhatsApp → Redis Stream → MessageHandler → Response
- [x] تصنيف النية (intent) — LLM أو keyword
- [x] RAG (Qdrant + BM25 + RRF)
- [x] دعم اللهجات (gulf، levantine، egyptian)
- [x] Actions: order_status، shipping، cancel_request (Save The Sale)، create_return
- [x] تصعيد (escalation) — soft/hard
- [x] COD Shield — مكالمات تأكيد الطلب (Twilio)
- [x] Cart recovery + delayed tasks
- [x] Health + Heartbeat (message + outbound workers)
- [x] E2E Smoke Tests (4 اختبارات)

---

## 7. ما يمكن إعادة استخدامه (Reusable)

| المكوّن | الملاحظات |
|---------|-----------|
| **Pipeline (NLP)** | normalizer، dialect، intent، RAG، verifier — قابل للاستخراج |
| **Actions pattern** | `detect_and_run_action` — نموذج واضح لتكاملات خارجية |
| **Redis Streams** | queue pattern جاهز |
| **DB models** | Workspace، Channel، Conversation، Message، Customer — multi-tenant |
| **Auth** | JWT + RBAC |
| **Webhooks** | بنية استقبال WhatsApp / webhooks عامة |

---

## 8. ما قد يحتاج بناءً جديداً

| البند | السبب |
|-------|-------|
| Platform layer | لو الخيار 3 — RADD كـ use-case داخل platform أكبر |
| تكاملات جديدة | منصات تجارة أخرى، قنوات أخرى (Telegram، إلخ) |
| Worker Watchdog | مراقبة heartbeats + Slack عند موت worker (غير منفذ) |
| توثيق محدث | الملفات والمسارات تغيرت |

---

## 9. أوامر التشغيل

```bash
make up        # Postgres, Redis, Qdrant, MinIO
make migrate   # Alembic
make seed      # بيانات تطوير
make api       # FastAPI :8000
make worker    # Message worker
make web       # Next.js :3000
make test      # pytest
./scripts/run_e2e_smoke.sh  # E2E smoke tests
```

---

## 10. الملفات الأساسية للقراءة

1. `README.md` — نظرة عامة
2. `radd/main.py` — نقاط النهاية، health
3. `radd/actions/base.py` — منطق الـ actions
4. `radd/pipeline/orchestrator.py` — تدفق الـ NLP
5. `workers/handlers/message_handler.py` — معالجة الرسائل
6. `workers/handlers/stream_consumer.py` — Redis Streams consumer
7. `radd/db/models.py` — نموذج البيانات

---

*آخر تحديث: مارس 2025 — يعكس الكود بعد Pre-Flight Checklist (#14–20).*
