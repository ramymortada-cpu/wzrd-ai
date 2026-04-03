# Sprint 4 Deployment Runbook

This runbook outlines the exact steps required to deploy the Sprint 4 features (RAG, Credits, PostHog, Design Health Check, PDF Export, Email Notifications) to the production environment on Railway.

## 1. Pre-Deployment Checklist (Environment Variables)

Before triggering the deployment, you must add the new environment variables to your Railway project.

1. Go to your Railway Dashboard and select the **WZZRD AI** web service.
2. Navigate to the **Variables** tab.
3. Add the following new variables:

| Variable Name | Required? | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | **Yes** | Required for the new Design Health Check tool (GPT-4o Vision) and RAG embeddings. Get this from your OpenAI dashboard. |
| `VITE_POSTHOG_KEY` | Optional | Required if you want to track the new analytics funnels. Get this from your PostHog project settings. |
| `VITE_POSTHOG_HOST` | Optional | Usually `https://us.i.posthog.com` or `https://eu.i.posthog.com` depending on your PostHog region. |

*Note: If `OPENAI_API_KEY` is missing, the Design Health Check tool will gracefully return an error to the user, and the RAG system will fall back to the simple TF-IDF search.*

## 2. Deployment Execution

1. Ensure your `main` branch on GitHub is up to date with all Sprint 4 PRs (up to PR #75).
2. Railway should automatically trigger a new deployment when you push to `main`.
3. If automatic deployments are disabled, go to the Railway Dashboard and click **Deploy** manually.
4. Wait for the build process to complete (usually 3-5 minutes).

## 3. Database Migration

Sprint 4 introduces a new `embedding` column to the `knowledge_entries` table.

*Note: The `package.json` start script (`npx drizzle-kit push --force && NODE_ENV=production node dist/index.js`) automatically applies schema changes on startup. However, it is best practice to verify the migration.*

1. Once the deployment is live, go to the **Terminal** tab of your web service in Railway.
2. Run the following command to ensure the migration is fully applied:
   ```bash
   pnpm db:migrate
   ```
3. You should see output confirming that `0027_knowledge_entries_embedding.sql` was applied.

## 4. Post-Deployment Smoke Tests

After the deployment is successful and the database is migrated, perform the following tests on the live production site (`https://wzzrdai.com` or your Railway URL) to verify Sprint 4 features:

### Test A: Design Health Check (Vision AI)
1. Navigate to `/tools/design-health`.
2. Enter a valid website URL (e.g., `https://example.com`).
3. Run the free diagnosis.
4. **Expected Result:** The tool should successfully capture a screenshot and return a visual analysis using GPT-4o Vision.

### Test B: Premium Report & PDF Export
1. Navigate to any tool result page (e.g., Brand Diagnosis).
2. Click the button to generate a **Premium Report** (ensure your account has sufficient credits).
3. Once the premium report loads, click the **Download PDF** button.
4. **Expected Result:** A new tab should open with the formatted HTML report, and the browser's print dialog should appear.

### Test C: Email Notifications & Auto-Refund
1. Check the email inbox associated with your test account.
2. **Expected Result:** You should have received a "Premium Report" email containing the score and a link back to the tool.
3. (Optional) If you can force an AI failure (e.g., by temporarily providing an invalid URL that bypasses validation), verify that the UI shows "الكريدت اترجعت" (Credits refunded) and your balance is restored.

### Test D: PostHog Analytics (If configured)
1. Log in to your PostHog dashboard.
2. Navigate to the **Live Events** or **Activity** tab.
3. **Expected Result:** You should see new events flowing in, such as `tool_execution_started`, `premium_report_purchased`, and `user_logged_in`.

## Rollback Plan

If critical issues are discovered during smoke testing:
1. In Railway, go to the **Deployments** tab.
2. Find the previous successful deployment (from before Sprint 4).
3. Click the three dots (`...`) next to it and select **Rollback**.
4. The database migration (`0027`) is non-destructive (it only adds a nullable column), so no database rollback is required.
