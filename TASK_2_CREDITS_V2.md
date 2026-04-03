# Sprint 4 / Task 2: Credits System Hardening & Auto-Refunds

## Context
The core credits system is already built: `users.credits` column exists, `credit_transactions` table tracks history, `deductCredits` is atomic, Paymob webhook is mounted, and the UI shows the balance.

However, there is a critical gap in the tool execution flow: **if the AI fails after credits are deducted, the user loses their credits.** We need to implement auto-refunds for failed AI calls in both `tools.ts` and `premium.ts`. We also need to ensure the UI gracefully handles low/zero credit states during tool execution.

## Objectives
1. Implement auto-refund logic in `server/routers/tools.ts` for failed AI calls.
2. Implement auto-refund logic in `server/routers/premium.ts` for failed premium report generation.
3. Ensure the UI gracefully handles the "Insufficient Credits" error thrown by the backend.

## Step-by-Step Implementation

### 1. Auto-Refunds in `server/routers/tools.ts`
Currently, `runToolAI` deducts credits first, then calls `callDiagnosisModel`. If `callDiagnosisModel` throws an error, the credits are lost.

**Action:**
In `server/routers/tools.ts`, locate the `runToolAI` function. Wrap the AI call and parsing in a `try/catch` block. If it fails, refund the credits before re-throwing the error.

```typescript
// server/routers/tools.ts (inside runToolAI)

  // 1. Deduct credits
  const deduction = await deductCredits(userId, toolId);
  if (!deduction.success) {
    throw new Error(deduction.error || 'Insufficient credits');
  }

  let parsedBody;
  try {
    // 2. Call AI
    const text = await callDiagnosisModel(toolId, defaultSystemPrompt, userPrompt);
    parsedBody = parseDiagnosisAiResponse(text, toolId);
  } catch (err) {
    // AUTO-REFUND ON FAILURE
    const { logger } = await import('../_core/logger');
    logger.error({ err, userId, toolId }, 'AI call failed, refunding credits');
    
    const { addCredits } = await import('../db');
    await addCredits(
      userId, 
      deduction.cost, 
      'refund', 
      `Refund: AI failed for ${toolDisplayName}`
    );
    
    throw new Error('فشل تحليل الذكاء الاصطناعي. تم استرجاع رصيدك. يرجى المحاولة مرة أخرى.');
  }
```

### 2. Auto-Refunds in `server/routers/premium.ts`
Similarly, `generateReport` deducts premium credits first, then calls Claude.

**Action:**
In `server/routers/premium.ts`, locate the `generateReport` mutation. Wrap the Claude invocation and JSON parsing in a `try/catch`. If it fails, refund the credits.

```typescript
// server/routers/premium.ts (inside generateReport)

      // 1. Deduct credits
      const premiumCredits = getPremiumReportCreditCost();
      const deduction = await deductPremiumCredits(userId, premiumCredits, input.toolId);
      if (!deduction.success) {
        return { success: false, error: deduction.error };
      }

      // ... build userPrompt ...

      // 3. Call Claude
      let report: Record<string, unknown>;
      try {
        const response = await invokeClaude({
          messages: [
            { role: 'system', content: PREMIUM_SYSTEM + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.' },
            { role: 'user', content: userPrompt },
          ],
        });
        
        const msgContent = response.choices?.[0]?.message?.content;
        const text = typeof msgContent === 'string' ? msgContent : '';
        
        // Parse JSON
        try {
          const jsonStr = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
          report = JSON.parse(jsonStr) as Record<string, unknown>;
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            report = JSON.parse(match[0]) as Record<string, unknown>;
          } else {
            throw new Error('Failed to parse Claude response');
          }
        }
      } catch (err) {
        // AUTO-REFUND ON FAILURE
        logger.error({ err, userId, toolId: input.toolId }, '[Premium] AI call failed, refunding credits');
        
        const { addCredits } = await import('../db');
        await addCredits(
          userId, 
          premiumCredits, 
          'refund', 
          `Refund: Premium report failed for ${input.toolId}`
        );
        
        return { success: false, error: 'فشل في إنشاء التقرير. تم استرجاع رصيدك. يرجى المحاولة مرة أخرى.' };
      }
```

### 3. UI Error Handling for Insufficient Credits
The UI in `client/src/pages/tools/ToolPage.tsx` already has some error handling, but we should ensure that if the backend throws an "Insufficient credits" error, the user is clearly prompted to buy more.

**Action:**
In `client/src/pages/tools/ToolPage.tsx`, inside `handleUnlockFullDiagnosis` and `onSubmit` (for premium report), check if the error message contains "credits" or "رصيد". If so, we can optionally show a specific CTA, or just rely on the existing error display which already shows the message from the backend. The backend error from `deductPremiumCredits` is already: `'رصيد الكريدت مش كافي. محتاج ' + amount + ' كريدت.'`. This is sufficient for now, just verify it displays correctly.

## Verification Steps
1. Run `pnpm run dev`.
2. **Test Insufficient Credits:** Set your user's credits to 0 in the DB. Try to run a tool or generate a premium report. Verify the UI shows the insufficient credits error.
3. **Test Auto-Refund:** Temporarily break the AI call (e.g., change the model name to an invalid one in `callDiagnosisModel` or `invokeClaude`). Run a tool with sufficient credits. Verify the tool fails, but your credit balance remains unchanged (deducted then immediately refunded). Check the `credit_transactions` table in the DB to see the `tool_usage` deduction followed immediately by a `refund` transaction.
