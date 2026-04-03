# Task Brief 2: Credits System

## Context
The credits system currently exists in `server/db/credits.ts` and `server/routers/credits.ts`, but we need to ensure the full flow is complete: purchase, consumption, and tracking. The Paymob integration is partially set up in `server/paymobIntegration.ts`. We need to finalize the purchase flow, ensure UI reflects credit balances correctly, and handle edge cases like failed deductions or refunds.

## Target Files
- `server/routers/credits.ts`
- `server/paymobIntegration.ts`
- `client/src/pages/tools/ToolPage.tsx`
- `client/src/pages/Tools.tsx`
- `client/src/components/Header.tsx` (or wherever credits are displayed)

## Step-by-Step Instructions

1.  **Finalize Paymob Purchase Flow:**
    In `server/routers/credits.ts`, the `purchase` mutation creates a payment intention. We need to ensure the webhook handler in `server/paymobIntegration.ts` (or a new webhook router) correctly processes successful payments and adds credits to the user's account using `addCredits`.
    - Create or verify `server/routers/webhooks.ts` to handle Paymob callbacks.
    - Validate the HMAC signature.
    - On success, find the user and plan, then call `addCredits(userId, plan.credits, 'purchase', 'Paymob purchase')`.

2.  **UI Credit Display:**
    Ensure the user's credit balance is prominently displayed in the header or dashboard.
    - In `client/src/components/Header.tsx` (or similar), fetch `trpc.credits.balance.useQuery()` and display it.
    - If credits are low, show a warning or a "Buy Credits" button.

3.  **Tool Consumption Logic:**
    In `server/routers/tools.ts` and `server/routers/premium.ts`, the deduction logic (`deductCredits`) is already present. Ensure that if a tool fails *after* deduction, the credits are refunded.
    - Wrap the AI call in a `try/catch`.
    - In the `catch` block, call `addCredits(userId, cost, 'refund', 'Tool execution failed')` before throwing the error to the client.

4.  **Purchase UI:**
    Create or update a "Buy Credits" page or modal (`client/src/pages/Pricing.tsx` or similar) that lists the plans from `getPaymobPlansMap()` and calls the `credits.purchase` mutation.

## Expected Outcome
- Users can purchase credits via Paymob.
- Successful purchases automatically update the user's balance.
- Failed tool executions automatically refund credits.
- The UI clearly shows the current credit balance and cost per tool.

## Verification
- Run `pnpm run dev`.
- Attempt to use a tool with insufficient credits; verify it blocks execution.
- Simulate a Paymob webhook success; verify credits are added.
- Force a tool failure (e.g., invalid API key); verify credits are refunded.
