# Sprint 4 Deployment Runbook

This runbook outlines the steps to deploy Sprint 4 features (RAG, credits/refunds, PostHog, Design Health Check, PDF export, email notifications) to production on **Railway**.

---

## 1. Pre-deployment checklist (environment variables)

In the Railway dashboard, open the **WZZRD AI** web service → **Variables**.

| Variable | Required? | Description |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | **Yes** (for full Sprint 4 behavior) | **Design Health Check** (GPT-4o Vision) and **OpenAI embeddings** for RAG. Create a key in the [OpenAI dashboard](https://platform.openai.com/api-keys). |
| `VITE_POSTHOG_KEY` | Optional | PostHog project API key — enables funnel / analytics events from the client. |
| `VITE_POSTHOG_HOST` | Optional | Usually `https://us.i.posthog.com` or `https://eu.i.posthog.com` for your region. |

### Behavior without `OPENAI_API_KEY`

- **Design Health Check** should surface a clear error to the user (vision path unavailable).
- **RAG / semantic knowledge:** indexing runs in **TF-IDF–style “simple” mode** (no OpenAI query vectors). If OpenAI is configured and the **index** used OpenAI vectors but a **query embedding** call fails at runtime, that request gets **no semantic knowledge injection** (empty RAG block); tools still run.

---

## 2. Deployment execution

1. Confirm **`main`** on GitHub includes all Sprint 4 work (through **PR #75**).
2. Push to **`main`** (or merge) so Railway triggers a build, **or** use **Deploy** manually if auto-deploy is off.
3. Wait for the build to finish (often ~3–5 minutes).

---

## 3. Database migration (`knowledge_entries.embedding`)

Sprint 4 adds a nullable **`embedding`** JSON column on **`knowledge_entries`** (see `drizzle/schema.ts` and `drizzle/0027_knowledge_entries_embedding.sql`).

### Primary mechanism (Railway `start`)

The production **`start`** script runs:

```bash
npx drizzle-kit push --force && NODE_ENV=production node dist/index.js
```

**`drizzle-kit push --force`** syncs the live database to the Drizzle schema, including **`embedding`**, on every container start. No separate migration step is strictly required if this succeeds.

### Optional verification

1. Railway → service → **Terminal** (or connect with your MySQL client using `DATABASE_URL`).
2. Confirm the column exists, for example:

   ```sql
   SHOW COLUMNS FROM knowledge_entries LIKE 'embedding';
   ```

### Optional: run numbered SQL migrations

If your ops process uses the repo script that applies `drizzle/*.sql` in order:

```bash
pnpm db:migrate:sql
```

That script includes **`0027_knowledge_entries_embedding.sql`**. Duplicate-column errors are treated as safe skips.

**Note:** `pnpm db:migrate` runs **`drizzle-kit migrate`** against Drizzle’s migration journal; this repo also relies on **`push`** at startup. Use **`push`** / schema verification as the source of truth for the **`embedding`** column unless your team standardizes on Kit migrations only.

---

## 4. Post-deployment smoke tests

Use your production URL (e.g. **https://wzzrdai.com** or the Railway app URL).

### Test A: Design Health Check (Vision)

1. Open **`/tools/design-health`** (or the routed path your app uses for that tool).
2. Submit a valid public URL (e.g. `https://example.com`).
3. Run the free diagnosis.
4. **Expected:** Screenshot capture + visual analysis via GPT-4o Vision when **`OPENAI_API_KEY`** is set.

### Test B: Premium report & PDF export

1. Run a tool to completion, then unlock **Premium** (enough credits).
2. Open **Download PDF** on the premium (or standard) result view.
3. **Expected:** A new tab with the print-styled HTML; use the in-page **PDF / print** control or the browser’s print dialog for **Save as PDF**.

### Test C: Email & auto-refund

1. With **`EMAIL_PROVIDER`** / **`EMAIL_API_KEY`** configured, check the test account inbox after a successful premium generation.
2. **Expected:** Premium report email with score and link back to tools (or **`[Email] Skipped`** in logs if email is not configured).
3. **Optional:** After a forced AI failure path, confirm refund messaging (e.g. credits restored) matches product copy.

### Test D: PostHog (if configured)

1. Open the PostHog project → **Live events** (or equivalent).
2. **Expected:** Events such as tool execution / premium purchase / login flows, depending on what you implemented in Sprint 4.

---

## 5. Rollback plan

1. Railway → **Deployments**.
2. Find the last known-good deployment (pre–Sprint 4 if needed).
3. **⋯** → **Rollback**.

**Database:** Migration **0027** only **adds** a nullable column — rollback of app code does not require dropping the column for safety; optional cleanup can be planned separately.

---

## Quick reference

| Topic | Detail |
|-------|--------|
| New env (critical) | `OPENAI_API_KEY` |
| Schema change | `knowledge_entries.embedding` (JSON, nullable) |
| SQL file | `drizzle/0027_knowledge_entries_embedding.sql` |
| Boot-time sync | `drizzle-kit push --force` in `pnpm start` |
