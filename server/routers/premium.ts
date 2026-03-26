/**
 * Premium Tools Router — Full reports powered by Claude Opus/Sonnet.
 * 
 * Flow:
 * 1. User runs FREE diagnosis (Groq) → gets score + 5 findings
 * 2. User clicks "Upgrade to Full Report" → pays credits or EGP
 * 3. System generates PREMIUM report (Claude) with:
 *    - Detailed analysis per pillar (5 pillars, 1-2 pages each)
 *    - Action Plan with priority matrix
 *    - Implementation Timeline (30/60/90 days)
 *    - Competitor Positioning Map
 *    - Quick Wins (3 things to fix this week)
 * 4. Report is stored and can be re-downloaded
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { invokeClaude } from "../_core/llmProviders";
import { getDb } from "../db/index";
import { users, creditTransactions } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { validatePromoCode, type PromoValidation } from "../db/promoCodes";

function mapPromoToClient(v: PromoValidation) {
  return {
    valid: v.valid,
    message: v.message ?? null,
    discountPercent: v.discountPercent ?? null,
    discountFixedEGP: v.discountFixedEGP ?? null,
    finalAmountEGP: Math.round(v.finalAmountCents) / 100,
    originalAmountEGP: Math.round(v.originalAmountCents) / 100,
  };
}

const promoInput = z.object({
  code: z.string().min(1).max(50),
  amountEGP: z.number().positive(),
});

// ════════════════════════════════════════════
// PRICING
// ════════════════════════════════════════════

export const PREMIUM_PRICES = {
  single_report: { credits: 100, egp: 99, label: 'تقرير مفصّل', labelEn: 'Full Report' },
  single_report_pro: { credits: 200, egp: 199, label: 'تقرير مفصّل Pro', labelEn: 'Full Report Pro' },
  bundle_6: { credits: 800, egp: 499, label: 'باقة ٦ تقارير', labelEn: '6-Report Bundle (Save 45%)' },
  credits_500: { credits: 500, egp: 499, label: '٥٠٠ كريدت', labelEn: '500 Credits' },
  credits_1500: { credits: 1500, egp: 999, label: '١٥٠٠ كريدت (الأوفر)', labelEn: '1500 Credits (Best Value)' },
};

// ════════════════════════════════════════════
// PREMIUM SYSTEM PROMPT
// ════════════════════════════════════════════

const PREMIUM_SYSTEM = `You are WZRD AI Premium — an elite brand strategy consultant powered by Keller's CBBE, Kapferer's Identity Prism, Sharp's How Brands Grow, Cialdini's Influence principles, and real MENA market intelligence.

You produce PREMIUM full-length brand diagnosis reports in Arabic (Egyptian dialect, مصري). Professional terms can stay in English but all explanations in Arabic.

Your report MUST include ALL of these sections:

## ١. ملخص تنفيذي (Executive Summary)
- Score out of 100 with breakdown per pillar
- Top 3 critical findings
- One-paragraph verdict

## ٢. تحليل تفصيلي لكل محور (5 Pillars Deep Dive)
For EACH of these 5 pillars, write 3-5 paragraphs:
- وضوح التموضع (Positioning Clarity) — using Keller's CBBE
- اتساق الرسائل (Messaging Consistency) — cross-channel analysis
- منطق العرض والتسعير (Offer & Pricing Logic) — Anchoring, Decoy, Jam Study
- الهوية البصرية (Visual Identity) — Kapferer's Prism alignment
- رحلة العميل (Customer Journey) — touchpoint friction analysis

For each pillar include:
- Current state assessment
- Specific evidence from the provided data
- Gap analysis (where you are vs where you should be)
- Severity rating (critical/major/minor)

## ٣. خريطة الأولويات (Priority Matrix)
Categorize all findings into:
- 🔴 عاجل ومهم (Fix this week)
- 🟠 مهم مش عاجل (Fix this month)  
- 🟡 تحسين (Nice to have)

## ٤. خطة العمل (Action Plan)
- 30-day quick wins (3-5 specific actions)
- 60-day strategic moves (3-5 actions)
- 90-day transformation goals (3-5 actions)

## ٥. Quick Wins — ٣ حاجات تعملها النهاردة
Three specific, actionable things the brand owner can implement TODAY with zero budget.

## ٦. التوصية النهائية
Which Primo Marca service phase is recommended and why (AUDIT / BUILD / TAKEOFF).

IMPORTANT RULES:
- Write 2000-3000 words minimum
- Be brutally honest — no fluff
- Every finding must reference specific data from the user's input
- Use Egyptian Arabic (مصري) — professional but accessible
- Format with clear headings and bullet points
- Technical terms in English are fine, explanations in Arabic

Respond in valid JSON:
{
  "executiveSummary": { "score": 0-100, "pillarScores": { "positioning": 0-100, "messaging": 0-100, "offer": 0-100, "identity": 0-100, "journey": 0-100 }, "topFindings": ["...", "...", "..."], "verdict": "..." },
  "pillars": [{ "name": "...", "nameEn": "...", "score": 0-100, "analysis": "...", "evidence": ["..."], "gap": "...", "severity": "critical|major|minor" }],
  "priorityMatrix": { "urgent": ["..."], "important": ["..."], "improvement": ["..."] },
  "actionPlan": { "days30": ["..."], "days60": ["..."], "days90": ["..."] },
  "quickWins": ["...", "...", "..."],
  "recommendation": { "phase": "AUDIT|BUILD|TAKEOFF", "reason": "..." }
}`;

// ════════════════════════════════════════════
// CREDIT DEDUCTION FOR PREMIUM
// ════════════════════════════════════════════

async function deductPremiumCredits(userId: number, amount: number, tool: string): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database unavailable' };

  // Atomic deduction
  const result = await db.execute(
    sql`UPDATE users SET credits = credits - ${amount} WHERE id = ${userId} AND credits >= ${amount}`
  );
  
  const affected = (result as any)[0]?.affectedRows ?? (result as any).affectedRows ?? 0;
  if (affected === 0) return { success: false, error: 'رصيد الكريدت مش كافي. محتاج ' + amount + ' كريدت.' };

  // Log transaction
  const [balanceRow] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
  await db.insert(creditTransactions).values({
    userId,
    amount: -amount,
    balance: balanceRow?.credits || 0,
    type: 'tool_usage',
    toolName: `premium_${tool}`,
    reason: 'Premium full report',
  });

  return { success: true };
}

// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export const premiumRouter = router({

  /** Validate promo against list price (expiry, uses, min amount) */
  validatePromo: publicProcedure
    .input(promoInput)
    .mutation(async ({ input }) => {
      const v = await validatePromoCode(input.code, input.amountEGP);
      return mapPromoToClient(v);
    }),

  /** Alias of validatePromo — same checks (used by pricing UI / clients) */
  applyPromo: publicProcedure
    .input(promoInput)
    .mutation(async ({ input }) => {
      const v = await validatePromoCode(input.code, input.amountEGP);
      return mapPromoToClient(v);
    }),

  /** Get premium pricing (public — show on landing/tools) */
  pricing: publicProcedure.query(() => PREMIUM_PRICES),

  /** Generate premium full report */
  generateReport: protectedProcedure
    .input(z.object({
      toolId: z.string().max(50),
      formData: z.record(z.string(), z.unknown()),
      freeScore: z.number().optional(), // score from free diagnosis
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user!.id;
      const userEmail = (ctx.user as any)?.email;

      // 1. Deduct credits
      const deduction = await deductPremiumCredits(userId, PREMIUM_PRICES.single_report.credits, input.toolId);
      if (!deduction.success) {
        return { success: false, error: deduction.error };
      }

      // 2. Build user prompt from form data
      let userPrompt = `أجب بالعربي المصري.\n\n`;
      userPrompt += `Tool: ${input.toolId}\n`;
      if (input.freeScore) userPrompt += `Free diagnosis score: ${input.freeScore}/100\n`;
      userPrompt += `\nUser provided data:\n`;
      
      for (const [key, value] of Object.entries(input.formData)) {
        if (value && typeof value === 'string' && value.trim()) {
          userPrompt += `${key}: ${value}\n`;
        }
      }

      // 3. Call Claude
      try {
        const response = await invokeClaude({
          messages: [
            { role: 'system', content: PREMIUM_SYSTEM + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.' },
            { role: 'user', content: userPrompt },
          ],
        });

        const text = (response.choices?.[0]?.message?.content as string) 
          || (response as any).content?.[0]?.text 
          || '';

        // Parse JSON
        let report: any;
        try {
          const jsonStr = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
          report = JSON.parse(jsonStr);
        } catch {
          // Try to extract JSON from response
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            report = JSON.parse(match[0]);
          } else {
            logger.error({ textLength: text.length }, '[Premium] Failed to parse Claude response');
            return { success: false, error: 'فشل في إنشاء التقرير. يرجى المحاولة مرة أخرى.' };
          }
        }

        // 4. Get remaining credits
        const db = await getDb();
        let remaining = 0;
        if (db) {
          const [row] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
          remaining = row?.credits || 0;
        }

        logger.info({ userId, toolId: input.toolId, score: report.executiveSummary?.score }, '[Premium] Report generated');

        return {
          success: true,
          report,
          creditsUsed: PREMIUM_PRICES.single_report.credits,
          creditsRemaining: remaining,
          model: 'Claude',
        };

      } catch (err: any) {
        logger.error({ err: err.message, userId }, '[Premium] Claude call failed');
        return { success: false, error: 'خطأ في الـ AI. تأكد إن الـ Claude API key مفعّل.' };
      }
    }),

  /** Check if Claude is available (public — for tools CTA) */
  status: publicProcedure.query(() => {
    const { ENV } = require('../_core/env');
    return {
      claudeAvailable: !!ENV.claudeApiKey,
      model: ENV.claudeModel,
      prices: PREMIUM_PRICES,
    };
  }),
});
