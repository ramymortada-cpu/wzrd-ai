# WZRD AI — Production Hardening & Runbook (Phase 4)

This document provides the operational procedures, rollback strategies, and monitoring guidelines for the Phase 4 Enterprise & B2B Foundation deployment on Railway.

---

## 1. Pre-Flight Checklist (Before Deploy)

- [ ] **Database Backup:** Take a manual snapshot of the production MySQL database in Railway before running any migrations.
- [ ] **Environment Variables:** Ensure `REDIS_URL` is set in Railway (required for multi-instance WhatsApp/Telegram sessions, though it falls back to in-memory gracefully).
- [ ] **Maintenance Window:** Announce a 15-minute maintenance window to the team. The backfill script locks rows temporarily.

---

## 2. Deployment Sequence

1. **Deploy Code:** Trigger the Railway deployment for the `main` branch (which now includes Phase 4).
2. **Auto-Migration:** The `docker-entrypoint.sh` will automatically run `npx drizzle-kit migrate --force` to apply `0021_enterprise_b2b_foundation.sql`.
3. **Run Backfill Script:** Connect to the production MySQL database (via TablePlus, DBeaver, or Railway CLI) and execute `WZRD_PHASE4_PRODUCTION_BACKFILL.sql`.
4. **Verify Backfill:** Run the "Step 5: Full Verification Block" from the script. Ensure all `orphaned_rows` counts are exactly `0`.

---

## 3. Smoke Testing (Post-Deploy)

Immediately after deployment, perform these checks in the production environment:

| Area | Action | Expected Result |
|------|--------|-----------------|
| **Auth & Context** | Log in as an Admin user. | Successful login. |
| **Workspace Switcher** | Check the top of the left sidebar. | "Primary Workspace" is visible and selected. |
| **Data Isolation** | Navigate to `/clients` and `/projects`. | Existing clients and projects are visible (thanks to the backfill). |
| **B2B Primitives** | Navigate to `/contracts` and `/invoices`. | Pages load successfully (empty lists are expected). |
| **Team Settings** | Navigate to `/settings/team`. | All existing users are listed with their respective roles (owner/editor). |
| **Audit Logs** | Navigate to `/settings/audit-logs`. | Page loads successfully. Perform an action (e.g., create a client) and verify it appears in the log. |

---

## 4. Rollback Strategy (If Things Go Wrong)

If the deployment causes critical failures (e.g., users cannot access their data, 500 errors on core routes), follow this rollback procedure:

### Scenario A: Code Issue (DB is fine, but UI/API is broken)
1. **Revert Code:** In Railway, go to the Deployments tab.
2. **Redeploy Previous:** Find the last successful deployment before Phase 4 and click "Redeploy".
3. **Impact:** The new DB columns (`workspaceId`, etc.) will remain in the database, but the old code will simply ignore them. This is safe.

### Scenario B: Data Corruption / Backfill Failure
If the backfill script failed midway or data is inaccessible even after code rollback:
1. **Restore DB Snapshot:** Go to the Railway MySQL service.
2. **Restore:** Restore the database from the snapshot taken in the Pre-Flight Checklist.
3. **Revert Code:** Redeploy the pre-Phase 4 code in Railway.
4. **Investigate:** Check the Railway logs to understand why the migration or backfill failed before attempting again.

---

## 5. Monitoring & Alerts Setup

To ensure the multi-tenant architecture is functioning correctly, monitor the following in Railway logs:

### Key Log Patterns to Watch
The `server/_core/logger.ts` uses structured JSON logging. Watch for these patterns:

1. **Authorization Failures:**
   - `level: 30` (warn) or `level: 40` (error)
   - Message: `Unauthorized: Missing workspace context` or `Forbidden: Insufficient workspace role`
   - *Action:* If spiking, check if the frontend `x-workspace-id` header is being stripped by a proxy or if the user's membership was not backfilled correctly.

2. **Redis Fallback:**
   - Message: `Redis init failed — using in-memory fallbacks`
   - *Action:* Verify the `REDIS_URL` environment variable in Railway. If running multiple instances, in-memory fallback will cause session inconsistency for WhatsApp/Telegram.

3. **Database Timeouts:**
   - Message: `Deadlock found when trying to get lock` or `Lock wait timeout exceeded`
   - *Action:* The backfill script might have collided with active traffic. Ensure backfills are run during low-traffic periods.

### Recommended Railway Alerts
If you are using a log drain (e.g., Datadog, BetterStack) or Railway's built-in metrics:
- **Alert 1:** 5xx Error Rate > 1% over 5 minutes.
- **Alert 2:** High frequency of `TRPCError: UNAUTHORIZED` (indicates RBAC/Workspace context issues).
