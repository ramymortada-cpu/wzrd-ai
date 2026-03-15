# تدفق البيانات — Webhooks → Workers → Redis → DB

هذا الملف يوثّق مسار البيانات من استقبال الويب هوكات حتى المعالجة والتخزين.

---

## 1. Webhooks (نقاط الدخول)

| Webhook | المسار | التحقق | الوجهة |
|---------|--------|--------|--------|
| WhatsApp | `POST /api/v1/webhooks/whatsapp` | HMAC-SHA256 (x-hub-signature-256) | Redis Stream `messages:{workspace_id}` |
| Cart Abandoned | `POST /api/v1/webhooks/cart/abandoned` | X-Webhook-Secret (إذا `WEBHOOK_API_KEY` مضبوط) | CartRecoveryFunnel → Redis `cart_recovery_queue` |
| Cart Purchased | `POST /api/v1/webhooks/cart/purchased` | X-Webhook-Secret | revenue_events + إلغاء الفانل |
| Shipping Generic | `POST /api/v1/webhooks/shipping/generic` | X-Webhook-Secret | Redis `cod_shield_calls` |
| Shipping Salla | `POST /api/v1/webhooks/shipping/salla` | X-Salla-Signature (HMAC-SHA256) | Redis `cod_shield_calls` |
| Shipping Shopify | `POST /api/v1/webhooks/shipping/shopify` | X-Shopify-Hmac-SHA256 | Redis `cod_shield_calls` |
| Twilio Call Status | `POST /api/v1/webhooks/twilio/call-status` | X-Twilio-Signature | DB (OutboundCall) + Redis (requeue/fallback) |
| Twilio Gather | `POST /api/v1/webhooks/twilio/gather` | X-Twilio-Signature | DB (OutboundCall) + Redis (save_the_sale) |

---

## 2. Redis (الطوابير والـ Streams)

| المفتاح | النوع | المنتج | المستهلك |
|---------|-------|--------|----------|
| `messages:{workspace_id}` | Stream | WhatsApp webhook, Instagram webhook | `message_worker` (XREADGROUP) |
| `cart_recovery_queue` | List (LPUSH) | CartRecoveryFunnel | (scheduler / worker مستقبلي) |
| `cod_shield_calls` | List (LPUSH) | Shipping webhooks, Twilio requeue | `outbound_call_worker` (BRPOP) |
| `cod_shield_whatsapp` | List (LPUSH) | Twilio (fallback, save_the_sale) | (worker مستقبلي) |
| `cod_shield_call_sid:{sid}` | String | outbound_call_worker (عند إنشاء المكالمة) | Twilio webhooks (lookup workspace) |

---

## 3. Workers (المعالجة الخلفية)

| Worker | الملف | المصدر | الإجراء |
|--------|-------|--------|---------|
| Message Worker | `workers/message_worker.py` | Redis Stream `messages:{workspace_id}` | تصنيف النية → RAG → قواعد → إرسال رد واتساب |
| Outbound Call Worker | `workers/outbound_call_worker.py` | Redis List `cod_shield_calls` | إنشاء مكالمة Twilio + حفظ call_sid في Redis |
| KB Indexer | `workers/kb_indexer.py` | (مُستدعى من API عند إضافة مستند) | تجزئة + embedding → Qdrant |

---

## 4. قاعدة البيانات (PostgreSQL)

- **conversations, messages**: من message_worker بعد المعالجة
- **revenue_events**: من cart_purchased webhook، Salla/Zid order webhooks، integrations
- **outbound_calls**: من outbound_call_worker + تحديث من Twilio webhooks
- **customers**: تحديث من pipeline (profile_updater)

---

## 5. مخطط مبسّط

```
[WhatsApp / Instagram]  →  POST /webhooks/whatsapp
                                    ↓
                            Redis Stream messages:{ws_id}
                                    ↓
                            message_worker (XREADGROUP)
                                    ↓
                            [Pipeline: intent → RAG → rules]
                                    ↓
                            DB (conversations, messages)
                                    ↓
                            WhatsApp API (رد)

[Cart Abandoned]  →  POST /webhooks/cart/abandoned  →  CartRecoveryFunnel
                                    ↓
                            Redis cart_recovery_queue
                                    ↓
                            (scheduler يرسل رسائل واتساب)

[Shipping Failed]  →  POST /webhooks/shipping/*  →  Redis cod_shield_calls
                                    ↓
                            outbound_call_worker (BRPOP)
                                    ↓
                            Twilio API (مكالمة) + Redis call_sid:{sid}
                                    ↓
[Twilio]  →  POST /webhooks/twilio/call-status  →  DB update + requeue/fallback
```

---

## 6. متغيرات البيئة للتحقق

| المتغير | الاستخدام |
|--------|----------|
| `WEBHOOK_API_KEY` | Cart + Shipping generic (X-Webhook-Secret) |
| `SALLA_WEBHOOK_SECRET` | Salla shipping (X-Salla-Signature) |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify shipping (X-Shopify-Hmac-SHA256) |
| `TWILIO_AUTH_TOKEN` | Twilio call-status + gather (X-Twilio-Signature) |
| `META_APP_SECRET` | WhatsApp (x-hub-signature-256) |
