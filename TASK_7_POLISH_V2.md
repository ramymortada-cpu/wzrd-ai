# Sprint 4 / Task 7: Polish & Catch-all

**Goal:** Finalize Sprint 4 by addressing the remaining edge cases, cleaning up the codebase, and ensuring everything is ready for production deployment.

This brief covers the final polish items identified during the sprint.

## 1. Fix `credits_low` Trigger for Premium Deductions (`server/routers/premium.ts`)

In Task 6, we added the `credits_low` trigger to standard tool runs, but missed it for premium report purchases.

**A. Import `fireEmailTrigger` at the top of `server/routers/premium.ts` (if not already there):**
```typescript
import { fireEmailTrigger } from "../emailTrigger";
```

**B. Update `deductPremiumCredits` (around line 140) to fire the trigger:**
```typescript
  // Log transaction
  const [balanceRow] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  const newBalance = balanceRow?.credits || 0;
  
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    balance: newBalance,
    type: 'tool_usage',
    toolName: `premium_${tool}`,
    reason: 'Premium full report',
  });

  // Fire low credits warning if balance drops below 20 (cost of cheapest tool)
  if (newBalance < 20) {
    fireEmailTrigger('credits_low', userId, { credits: newBalance }).catch(() => {});
  }

  return { success: true };
```

## 2. Clean Up Duplicate `TOOL_DISPLAY_NAME` Maps

We currently have `TOOL_DISPLAY_NAME` defined identically in both `tools.ts` and `premium.ts`. Let's centralize it.

**A. Add it to `shared/wzrdDiagnosisToolCosts.ts`:**
```typescript
export const WZRD_DIAGNOSIS_TOOL_NAMES: Record<string, string> = {
  brand_diagnosis: 'Brand Diagnosis',
  offer_check: 'Offer Logic Check',
  message_check: 'Message Check',
  presence_audit: 'Presence Audit',
  identity_snapshot: 'Identity Snapshot',
  launch_readiness: 'Launch Readiness',
  design_health: 'Design Health Check',
};
```

**B. Update `server/routers/tools.ts`:**
- Import `WZRD_DIAGNOSIS_TOOL_NAMES` from `@shared/wzrdDiagnosisToolCosts`.
- Delete the local `TOOL_DISPLAY_NAME` constant.
- Replace all usages of `TOOL_DISPLAY_NAME` with `WZRD_DIAGNOSIS_TOOL_NAMES`.

**C. Update `server/routers/premium.ts`:**
- Import `WZRD_DIAGNOSIS_TOOL_NAMES` from `@shared/wzrdDiagnosisToolCosts`.
- Delete the local `TOOL_DISPLAY_NAME` constant.
- Replace all usages of `TOOL_DISPLAY_NAME` with `WZRD_DIAGNOSIS_TOOL_NAMES`.

## 3. Update `.env.example`

Add the new Sprint 4 environment variables to `.env.example` so new developers know they are required/available.

**Add this section to `.env.example`:**
```env
# ── SPRINT 4 NEW VARS ──
# Required for Design Health Check (GPT-4o Vision) and RAG Embeddings
# OPENAI_API_KEY=sk-proj-your-key-here

# PostHog Analytics (optional)
# VITE_POSTHOG_KEY=phc_your_key_here
# VITE_POSTHOG_HOST=https://us.i.posthog.com
```

## 4. Final Code Cleanup

- Search for and remove any stray `console.log` statements added during Sprint 4 development (excluding the structured `logger.info`/`logger.error` calls).
- Run `pnpm exec tsc --noEmit` to ensure there are zero TypeScript errors.
- Run `pnpm exec eslint . --max-warnings 0` to ensure there are zero linting errors.

## Verification
1. Run `pnpm run dev`.
2. Verify that the app compiles without errors.
3. Verify that purchasing a premium report when your balance is low triggers the `credits_low` email in the server logs.
