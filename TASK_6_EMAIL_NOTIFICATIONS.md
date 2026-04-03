# Task Brief 6: Email Notifications

## Context
The email trigger system (`server/emailTrigger.ts`) and `wzrdEmails.ts` are partially implemented. We need to ensure that when a user generates a Premium Report, they receive an email notification with a link to download or view it. We also need to ensure the `first_tool_run` and `low_score` triggers are fully functional and tested.

## Target Files
- `server/routers/premium.ts`
- `server/emailTrigger.ts`
- `server/wzrdEmails.ts`
- `drizzle/schema.ts` (if adding new triggers)

## Step-by-Step Instructions

1.  **Premium Report Email Trigger:**
    In `server/routers/premium.ts`, after successfully generating and saving a Premium Report, fire an email trigger.
    - `fireEmailTrigger('premium_purchase', userId, { toolName: input.toolId, score: input.freeScore })`
    - Ensure this trigger is defined in `drizzle/schema.ts` under `automationRules.trigger`.

2.  **Email Template Creation:**
    In `server/wzrdEmails.ts`, create a new template function `sendPremiumReportEmail(to, name, toolName, reportUrl)`.
    - Use the existing `wrapEmail` and `STYLE` constants to maintain brand consistency.
    - Include a clear CTA button linking to the user's dashboard or the specific report URL.

3.  **Trigger Handling:**
    In `server/emailTrigger.ts`, if the trigger is `premium_purchase`, call `sendPremiumReportEmail`.
    - Currently, `emailTrigger.ts` looks up templates from the DB. If we want to hardcode the premium email for reliability, we can add a specific case for it, or ensure the DB template exists.
    - *Decision:* Let's add a direct call to `sendPremiumReportEmail` in `premium.ts` for immediate delivery, similar to how `sendWelcomeEmail` is called in `auth.ts`.

4.  **Update `premium.ts`:**
    - Import `sendPremiumReportEmail` from `../wzrdEmails`.
    - After saving the report to the DB (if applicable, or just returning it to the client), call `sendPremiumReportEmail(user.email, user.name, toolDisplayName, reportUrl)`.
    - Since reports might not have a public URL yet, link to `/dashboard` or `/my-brand`.

## Expected Outcome
- Users receive a branded email immediately after purchasing a Premium Report.
- The email contains a link to view their report.
- The existing email infrastructure is utilized effectively.

## Verification
- Run `pnpm run dev`.
- Generate a Premium Report.
- Check the server logs to ensure the email was sent (or attempted to send via Resend).
- Verify the email content and CTA link.
