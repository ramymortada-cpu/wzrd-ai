# Pilot Launch Checklist — رَدّ AI Platform

> **استخدام:** راجع هذه القائمة قبل إطلاق أي Pilot مع تاجر حقيقي.  
> **هدف:** صفر مشاكل حرجة في أول 48 ساعة.

---

## 🔒 Security

- [ ] HMAC-SHA256 verification active on all WhatsApp webhooks
- [ ] JWT access token expiry < 24 hours
- [ ] JWT refresh token expiry ≤ 30 days
- [ ] RLS isolation verified — workspace A cannot see workspace B data (run: `make test-rls`)
- [ ] PII redaction >95% recall tested (Saudi National ID, phone, email patterns)
- [ ] Prompt injection tested (minimum 10 attack vectors in Arabic and English)
- [ ] Rate limiting active on all API endpoints (`slowapi`)
- [ ] `.env` file is NOT tracked in git (`git status` shows clean)
- [ ] `SECRET_KEY` is a cryptographically random 32+ byte string (not the default)
- [ ] Sentry DSN configured and capturing test errors

---

## ⚡ Performance

- [ ] P95 API response latency < 4 seconds (test with `locust` or `k6`)
- [ ] 50 concurrent WhatsApp sessions handled without errors
- [ ] Redis Stream consumer catches up within < 1 second per message
- [ ] WhatsApp response delivery confirmed within < 5 seconds end-to-end
- [ ] RAG pipeline completes within < 3 seconds (P95)
- [ ] Qdrant returns results in < 500ms (P95)

---

## 🌟 Arabic Quality

- [ ] 200 test queries → >90% intent classification accuracy
- [ ] Hallucination rate < 3% (check `hallucination_rate` KPI)
- [ ] Dialect detection accuracy >85% (Gulf vs Egyptian vs MSA)
- [ ] All 5 template responses reviewed and approved by Arabic speaker
- [ ] Customer context injection verified (VIP customers get personalized responses)
- [ ] 9 intents correctly classified (product_inquiry, product_comparison, purchase_hesitation included)

---

## 🏗️ Infrastructure

- [ ] Docker images build without errors (`make build`)
- [ ] `docker-compose.prod.yml` brings up all 7 services cleanly
- [ ] CI/CD GitHub Actions pipeline passes all checks (test → lint → build → push)
- [ ] SSL certificates configured and valid (nginx)
- [ ] Production domain configured in nginx config
- [ ] WhatsApp webhook URL registered and verified with Meta
- [ ] Salla OAuth credentials configured (client_id + client_secret)
- [ ] Database migrations run successfully (`make migrate`)

---

## 📊 Dashboard

- [ ] Login page works and redirects correctly
- [ ] Conversations page loads and displays messages
- [ ] KB management works — upload, approve, and index a document
- [ ] Escalation queue shows pending escalations correctly
- [ ] Knowledge Gaps tab shows data from escalated conversations
- [ ] Trust Ledger badge visible on AI messages with confidence data
- [ ] Honesty Counter (درع الأمانة) displays correctly on dashboard
- [ ] Settings page saves confidence thresholds and they take effect
- [ ] RTL rendering is correct on all pages (Arabic text aligns right)
- [ ] Empty states display proper Arabic messages (no broken English fallbacks)
- [ ] Morning Briefing WhatsApp message received and formatted correctly

---

## 🏪 Pilot Customer Setup

- [ ] Knowledge Base loaded (minimum 20 approved documents)
- [ ] All templates reviewed and customized for the merchant's tone
- [ ] Confidence thresholds calibrated (start: auto=0.85, soft=0.60)
- [ ] Agent accounts created and agents understand the escalation queue
- [ ] Business hours configured in workspace settings
- [ ] Morning Briefing owner phone number set in workspace settings
- [ ] At least 5 end-to-end test conversations completed successfully

---

## 🔧 Operations

- [ ] Shadow mode tested for minimum 48 hours (log only, no sends)
- [ ] Error monitoring confirmed active (Sentry receiving errors)
- [ ] Database backup tested and restore verified
- [ ] Rollback plan documented and team trained on executing it
- [ ] On-call contact for first 72 hours of pilot identified

---

## ✅ Sign-off

| Area | Owner | Status | Date |
|:-----|:------|:-------|:-----|
| Security | — | ⬜ | — |
| Performance | — | ⬜ | — |
| Arabic Quality | — | ⬜ | — |
| Infrastructure | — | ⬜ | — |
| Dashboard | — | ⬜ | — |
| Pilot Setup | — | ⬜ | — |
| Operations | — | ⬜ | — |

> **Launch Gate:** All sections must show ✅ before going live with a paying merchant.

---

*آخر تحديث: مارس 2026*
