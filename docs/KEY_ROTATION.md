# WZZRD AI — API Key Rotation & Incident Response

## WHEN TO ROTATE A KEY

Rotate immediately if:
- Key appears in a public GitHub commit
- Unusual API usage spike (check `llm_usage_log`)
- Railway logs show unauthorized access
- You receive a breach notification from a provider

---

## KEY ROTATION PROCEDURES

### OpenAI (OPENAI_API_KEY)
1. `platform.openai.com` → API Keys → **Delete** the leaked key
2. Create **New secret key** → copy it
3. Railway → wzrd-ai service → **Variables** → Update `OPENAI_API_KEY`
4. Railway auto-redeploys (~2 min) — no manual action needed
5. Verify: check Railway logs for `[LLM] provider: openai` success

### Anthropic Claude (ANTHROPIC_API_KEY)
1. `console.anthropic.com` → API Keys → **Revoke** the key
2. Create new key → copy it
3. Railway → Variables → Update `ANTHROPIC_API_KEY`
4. Redeploy completes in ~2 min

### Groq (GROQ_API_KEY)
1. `console.groq.com` → API Keys → **Delete** key
2. Create new key → copy it
3. Railway → Variables → Update `GROQ_API_KEY`

### Google Custom Search (GOOGLE_SEARCH_API_KEY)
1. `console.cloud.google.com` → APIs & Services → **Credentials** → Delete key
2. Create new API Key → restrict to Custom Search API only
3. Railway → Variables → Update `GOOGLE_SEARCH_API_KEY`

### JWT Secret (JWT_SECRET)
1. Generate new secret: `openssl rand -hex 32`
2. Railway → Variables → Update `JWT_SECRET`
3. ⚠️ **WARNING**: This logs out ALL users immediately
4. Communicate downtime to users if needed (~2 min redeploy)

### Paymob (PAYMOB_HMAC_SECRET / PAYMOB_SECRET_KEY)
1. Log into Paymob Dashboard → Settings → API Keys → Regenerate
2. Update both `PAYMOB_HMAC_SECRET` and `PAYMOB_SECRET_KEY` in Railway
3. Test a payment in staging before going live
4. ⚠️ Any pending webhooks during rotation will fail HMAC — check Paymob webhook logs

---

## ABUSE RESPONSE PLAYBOOK

### Step 1: Identify
```sql
-- Run in DB console to find abusive users
SELECT user_id, COUNT(*) as calls, SUM(total_tokens) as tokens
FROM llm_usage_log
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY user_id
HAVING calls > 50
ORDER BY calls DESC;
```

### Step 2: Block
Option A — Zero credits (quickest):
```sql
UPDATE users SET credits = 0 WHERE id = <userId>;
```
Option B — Block IP via Cloudflare Firewall Rules

### Step 3: Investigate
- What endpoint was abused? (check `llm_usage_log.context`)
- How did they authenticate?
- Was it a vulnerability or just excessive legitimate use?

### Step 4: Fix & Notify
- Patch any vulnerability found
- Rotate any exposed keys
- If user data was accessed: notify affected users within 72h (GDPR requirement)

---

## SPENDING LIMIT REMINDERS

| Provider | Limit | Where to set |
|----------|-------|-------------|
| OpenAI | $50/month | `platform.openai.com/settings/organization/limits` |
| Anthropic | $100/month | `console.anthropic.com/settings/limits` |
| Google Search | 100 queries/day free | `console.cloud.google.com` → APIs → Quotas |
| Groq | Free tier (14,400 req/day) | No billing |

---

*Last updated: 2026-04-10*
