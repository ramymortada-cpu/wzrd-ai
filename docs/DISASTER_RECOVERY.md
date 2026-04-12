# WZZRD AI — Disaster Recovery & Incident Response

> Last updated: April 2026

---

## 🔴 Scenario 1: Railway Service Down

**Symptoms:** Website returns 502/503, Railway dashboard shows "crashed" replicas.

**Steps:**
1. Check Railway dashboard → Latest deployment logs → look for startup errors
2. If migration failure → run manually in Railway shell:
   ```bash
   node scripts/run-drizzle-mysql-migrations.mjs
   ```
3. If OOM → scale up the Railway instance (Settings → Resources)
4. If the DB is unreachable → check MySQL service status in Railway
5. Railway auto-restarts on crash — wait 2-3 minutes before manual action
6. **User impact:** Full outage until Railway recovers. No failover configured.

---

## 🔴 Scenario 2: Database Corrupted or Deleted

**Symptoms:** All queries fail, Railway logs show DB connection errors.

**Steps:**
1. **Immediately:** Stop all Railway deployments to prevent further writes
2. Open Railway → MySQL service → Backups
3. Restore from the most recent backup (Railway stores 7 days of backups)
4. Verify schema integrity after restore:
   ```bash
   node scripts/run-drizzle-mysql-migrations.mjs
   ```
5. Re-enable deployments
6. **Data loss risk:** Up to 24 hours if backups are daily. Configure more frequent backups if needed.

### Backup Verification (monthly check):
```bash
# In Railway shell — verify backup exists and has expected row counts
mysql -u root -p < "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM credit_transactions;"
```

---

## 🔴 Scenario 3: API Key Leaked / Compromised

**Symptoms:** Unexpected charges on OpenAI/Anthropic/Groq, or alert from `llm_usage_log`.

### Steps by provider:

**OpenAI (`OPENAI_API_KEY`):**
1. `platform.openai.com` → API Keys → **Delete** the compromised key immediately
2. Create a new key
3. Railway → Variables → Update `OPENAI_API_KEY`
4. Railway auto-redeploys (~2 min)
5. Check `llm_usage_log` for abuse scope: `SELECT userId, COUNT(*), SUM(tokenCount) FROM llm_usage_log WHERE createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY userId ORDER BY 2 DESC LIMIT 20`

**Anthropic (`ANTHROPIC_API_KEY`):**
1. `console.anthropic.com` → API Keys → Revoke
2. Create new key → Update Railway → `ANTHROPIC_API_KEY`

**Groq (`GROQ_API_KEY`):**
1. `console.groq.com` → API Keys → Delete + Create new
2. Update Railway → `GROQ_API_KEY`

**Google Search (`GOOGLE_SEARCH_API_KEY`):**
1. `console.cloud.google.com` → Credentials → Delete key
2. Create new key → Update Railway → `GOOGLE_SEARCH_API_KEY`

**JWT Secret (`JWT_SECRET`):**
1. Generate new secret: `openssl rand -hex 32`
2. Railway → Variables → Update `JWT_SECRET`
3. ⚠️ **Warning:** This logs out ALL users immediately
4. Set `JWT_SECRET_PREVIOUS` to the old value for a 24-hour grace period

**Paymob (`PAYMOB_*`):**
1. Contact Paymob support to rotate keys
2. Update Railway → `PAYMOB_SECRET_KEY`, `PAYMOB_HMAC_SECRET`, etc.

---

## 🟠 Scenario 4: LLM API Abuse / Runaway Costs

**Symptoms:** `[ALERT] Possible API abuse` in logs, unusual spending on provider dashboards.

**Steps:**
1. Identify the abusing user:
   ```sql
   SELECT userId, COUNT(*) as calls, MAX(createdAt) as lastCall
   FROM llm_usage_log
   WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
   GROUP BY userId
   ORDER BY calls DESC
   LIMIT 10;
   ```
2. Block the user:
   ```sql
   UPDATE users SET credits = 0 WHERE id = <userId>;
   -- OR suspend the account:
   UPDATE users SET role = 'suspended' WHERE id = <userId>;
   ```
3. If the abuse is from unauthenticated requests → block IP via Cloudflare Firewall
4. Check if the abuse exploited a vulnerability → patch before re-enabling
5. Rotate the affected API key
6. File a dispute with the provider if fraudulent usage occurred

---

## 🟠 Scenario 5: Paymob Webhook Failure (Double-Charging)

**Symptoms:** User paid but credits not added, or credits added twice.

**Steps:**
1. Check `paymob_processed_transactions` table for the transaction ID
2. If missing → webhook was not received; manually add credits:
   ```sql
   INSERT INTO credit_transactions (userId, amount, type, note) VALUES (<userId>, <amount>, 'purchase', 'Manual fix — Paymob webhook missed');
   UPDATE users SET credits = credits + <amount> WHERE id = <userId>;
   ```
3. If duplicate → verify `paymob_processed_transactions` has idempotency record
4. Contact Paymob support with the `merchant_order_id`

---

## 🟡 Scenario 6: Cloudflare DDoS Attack

**Symptoms:** Massive traffic spike, Railway CPU at 100%, high error rate.

**Steps:**
1. Login to Cloudflare dashboard
2. Enable **"Under Attack Mode"** (Security → Settings)
3. Add firewall rule to block attacking IPs/ASNs
4. Contact Railway support if traffic bypasses Cloudflare (wrong DNS setup)
5. After attack: review logs, tighten rate limits

---

## Routine Maintenance Checklist

### Daily (automated):
- [ ] `pnpm audit --prod` — 0 vulnerabilities
- [ ] Railway healthcheck at `/healthz` responding 200
- [ ] `llm_usage_log` table not growing unexpectedly

### Weekly:
- [ ] Review Railway deployment logs for errors
- [ ] Check OpenAI/Anthropic spending dashboards
- [ ] Verify database backups are being created

### Monthly:
- [ ] Rotate JWT_SECRET (set old as JWT_SECRET_PREVIOUS for 24h)
- [ ] Test database restore from backup
- [ ] Review `audit_log` for suspicious admin actions
- [ ] Update dependencies: `pnpm update && pnpm audit`

---

## Emergency Contacts

| Service | Dashboard | Support |
|---------|-----------|---------|
| Railway | railway.app/dashboard | help@railway.app |
| OpenAI | platform.openai.com | help.openai.com |
| Anthropic | console.anthropic.com | support@anthropic.com |
| Paymob | accept.paymob.com | support@paymob.com |
| Cloudflare | dash.cloudflare.com | cloudflare.com/support |
