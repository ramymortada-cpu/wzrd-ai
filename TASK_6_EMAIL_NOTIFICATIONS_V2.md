# Sprint 4 / Task 6: Email Notifications

**Goal:** Ensure users receive an email notification when they purchase a Premium Report, and implement the missing `credits_low` trigger when a user's balance drops below the threshold.

This brief is based on a deep audit of the codebase. The email infrastructure uses two parallel systems: direct calls via `wzrdEmails.ts` (for immediate transactional emails) and DB-driven automations via `emailTrigger.ts`. We will use the direct `wzrdEmails.ts` approach for the Premium Report to ensure immediate delivery, and the `emailTrigger.ts` approach for the `credits_low` warning.

## 1. Add Premium Report Email Template (`server/wzrdEmails.ts`)

**Add this new function to `server/wzrdEmails.ts` (below `sendToolResultEmail`):**

```typescript
/**
 * Premium Report email — sent after purchasing a full report
 */
export async function sendPremiumReportEmail(
  to: string,
  name: string,
  toolName: string,
  score: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const scoreColor = score >= 70 ? '#44ddc9' : score >= 40 ? '#c8a24e' : '#ff5f57';
  
  const body = `
<h1 style="${STYLE.h1}">Your Premium Report is Ready ✦</h1>
<p style="${STYLE.p}">Hi ${name || 'there'},</p>
<p style="${STYLE.p}">Your full Premium Report for <strong style="${STYLE.accent}">${toolName}</strong> has been generated successfully.</p>
<div style="${STYLE.score}color:${scoreColor};">${score}<span style="font-size:18px;color:#64647a;">/100</span></div>
<p style="${STYLE.p}">This comprehensive report includes:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">📊 Detailed Pillar Analysis</strong> <span style="${STYLE.findingDetail}">— deep dive into every aspect</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">🎯 Priority Matrix</strong> <span style="${STYLE.findingDetail}">— what to fix first</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">📅 30/60/90 Day Action Plan</strong> <span style="${STYLE.findingDetail}">— step-by-step roadmap</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">⚡ Quick Wins</strong> <span style="${STYLE.findingDetail}">— things you can fix today</span></td></tr>
</table>
<p style="text-align:center;padding-top:20px;">
  <a href="${appUrl}/tools" style="${STYLE.cta}">View Your Premium Report →</a>
</p>
<p style="font-size:12px;color:#64647a;line-height:1.6;text-align:center;margin-top:20px;">
  Note: You can download your report as a PDF directly from the results page.
</p>`;

  return sendEmail({
    to,
    subject: `✦ Your Premium Report is Ready: ${toolName}`,
    html: wrapEmail(body, `Your full Premium Report for ${toolName} is ready to view.`),
  });
}
```

## 2. Trigger Premium Email (`server/routers/premium.ts`)

**A. Import the new function at the top of `server/routers/premium.ts`:**
```typescript
import { sendPremiumReportEmail } from "../wzrdEmails";
import { fireEmailTrigger } from "../emailTrigger";
```

**B. Add the `TOOL_DISPLAY_NAME` map (or import it if you prefer, but defining it locally is fine for now since it's just for the email subject):**
```typescript
const TOOL_DISPLAY_NAME: Record<string, string> = {
  brand_diagnosis: 'Brand Diagnosis',
  offer_check: 'Offer Logic Check',
  message_check: 'Message Check',
  presence_audit: 'Presence Audit',
  identity_snapshot: 'Identity Snapshot',
  launch_readiness: 'Launch Readiness',
  design_health: 'Design Health Check',
};
```

**C. Call the email functions right before returning success in `generateReport` (around line 325):**
```typescript
        const execSummary = report.executiveSummary as { score?: number } | undefined;
        logger.info({ userId, toolId: input.toolId, score: execSummary?.score }, '[Premium] Report generated');
        
        // Send email notifications (non-blocking)
        const display = TOOL_DISPLAY_NAME[input.toolId] ?? input.toolId;
        const userEmail = ctx.user?.email;
        const userName = ctx.user?.name || '';
        
        if (userEmail) {
          sendPremiumReportEmail(userEmail, userName, display, execSummary?.score || input.freeScore).catch(() => {});
        }
        
        // Also fire the DB trigger for analytics/future automations
        fireEmailTrigger('premium_purchase', userId, { toolName: display, score: execSummary?.score || input.freeScore }).catch(() => {});

        return {
          success: true,
          report,
          creditsUsed: premiumCredits,
          creditsRemaining: remaining,
          model: 'Claude',
        };
```

## 3. Implement `credits_low` Trigger (`server/db/credits.ts`)

The `credits_low` trigger exists in the schema but is never fired. We should fire it when a user's balance drops below the cost of the cheapest tool (20 credits) after a deduction.

**A. Import `fireEmailTrigger` at the top of `server/db/credits.ts`:**
```typescript
import { fireEmailTrigger } from "../emailTrigger";
```

**B. Fire the trigger at the end of `deductCredits` (around line 205):**
```typescript
    // Log transaction
    await db.insert(creditTransactions).values({
      userId,
      amount: -cost,
      balance: newBalance,
      type: 'tool_usage',
      toolName,
      reason: `Used ${toolName} (-${cost} credits)`,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    // Fire low credits warning if balance drops below 20 (cost of cheapest tool)
    if (newBalance < 20) {
      fireEmailTrigger('credits_low', userId, { credits: newBalance }).catch(() => {});
    }

    return { success: true, newBalance, cost };
```

## Verification
1. Run `pnpm run dev`.
2. Generate a Premium Report.
3. Check the server console logs. You should see `[Email] Skipped — no provider configured` (or `[Email] Sent successfully` if you have Resend configured) for the Premium Report email.
4. Run enough free tools to drop your credit balance below 20.
5. Check the server console logs for the `credits_low` trigger firing.
