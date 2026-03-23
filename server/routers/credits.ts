/**
 * Credits Router — manages user credit balance and transactions.
 * 
 * Endpoints:
 * - credits.balance → current user's credit balance
 * - credits.history → transaction history
 * - credits.toolCosts → how much each tool costs
 * - credits.stats → admin: usage stats across all users
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import {
  getUserCredits, getCreditHistory, addCredits,
  getCreditStats, TOOL_COSTS, SIGNUP_BONUS,
} from "../db";

export const creditsRouter = router({
  /** Get current user's credit balance */
  balance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await getUserCredits(ctx.user!.id);
    return { credits: balance };
  }),

  /** Get current user's transaction history */
  history: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return getCreditHistory(ctx.user!.id, input?.limit || 50);
    }),

  /** Get tool costs map */
  toolCosts: protectedProcedure.query(() => {
    return {
      costs: TOOL_COSTS,
      signupBonus: SIGNUP_BONUS,
    };
  }),

  /** Admin: manually add credits to a user */
  adminAdd: protectedProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      amount: z.number().int().positive().max(10000),
      reason: z.string().max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const result = await addCredits(input.userId, input.amount, 'admin', input.reason);
      logger.info({ userId: input.userId, amount: input.amount, reason: input.reason }, 'Admin added credits');
      return result;
    }),

  /** Admin: bulk add credits to multiple users */
  bulkAdminAdd: protectedProcedure
    .input(z.object({
      userIds: z.array(z.number().int().positive()).max(50),
      amount: z.number().int().positive().max(5000),
      reason: z.string().max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const results: { userId: number; success: boolean }[] = [];
      for (const userId of input.userIds) {
        const r = await addCredits(userId, input.amount, 'admin', input.reason);
        results.push({ userId, success: r.success });
      }
      logger.info({ userIds: input.userIds.length, amount: input.amount }, 'Admin bulk added credits');
      return { results, added: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
    }),

  /** Admin: credit usage stats */
  stats: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    return getCreditStats();
  }),

  /** Get credit plans (for Pricing page — public, no auth) */
  plans: publicProcedure.query(async () => {
    const { getCreditPlans } = await import('../siteConfig');
    return { plans: getCreditPlans() };
  }),

  /** Validate promo code (returns discount without applying) — public for pre-check */
  validatePromo: publicProcedure
    .input(z.object({ code: z.string().max(50), planId: z.string(), amountEGP: z.number() }))
    .query(async ({ input }) => {
      const { validatePromoCode } = await import('../db/promoCodes');
      return validatePromoCode(input.code, input.amountEGP);
    }),

  /** Purchase credits via Paymob Checkout */
  purchase: protectedProcedure
    .input(z.object({
      planId: z.string().max(50),
      promoCode: z.string().max(50).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getCreditPlans } = await import('../siteConfig');
      const { validatePromoCode } = await import('../db/promoCodes');
      const { createPaymentIntention } = await import('../paymobIntegration');
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const plans = getCreditPlans();
      const plan = plans.find(p => p.id === input.planId);
      if (!plan) {
        return { success: false, redirectUrl: null, message: 'Invalid plan.' };
      }

      let amountCents = plan.priceEGP * 100;
      let promoCode: string | undefined;

      if (input.promoCode?.trim()) {
        const validation = await validatePromoCode(input.promoCode.trim(), plan.priceEGP);
        if (!validation.valid) {
          return { success: false, redirectUrl: null, message: validation.message || 'Invalid promo code.' };
        }
        amountCents = validation.finalAmountCents;
        promoCode = input.promoCode.trim().toUpperCase();
      }

      const result = await createPaymentIntention({
        planId: plan.id,
        credits: plan.credits,
        amountCents,
        planName: plan.name,
        userId: ctx.user!.id,
        userEmail: ctx.user!.email || '',
        userName: ctx.user!.name || 'User',
        appUrl,
        promoCode,
      });

      if ('error' in result) {
        logger.warn({ userId: ctx.user!.id, plan: input.planId, error: result.error }, 'Paymob checkout failed');
        return { success: false, redirectUrl: null, message: result.error };
      }

      return { success: true, redirectUrl: result.redirectUrl, message: 'Redirecting to payment...' };
    }),

  /** Check if a recent purchase was processed (poll after redirect back) */
  purchaseStatus: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if there's a recent purchase transaction for this user+plan
      const history = await getCreditHistory(ctx.user!.id, 5);
      const recentPurchase = history.find(t =>
        t.type === 'purchase' &&
        t.reason?.includes(input.planId) &&
        // Within last 10 minutes
        (Date.now() - new Date(t.createdAt).getTime()) < 10 * 60 * 1000
      );

      if (recentPurchase) {
        return { processed: true, creditsAdded: recentPurchase.amount, newBalance: recentPurchase.balance };
      }
      return { processed: false, creditsAdded: 0, newBalance: await getUserCredits(ctx.user!.id) };
    }),

  /** Admin: Refund credits to a user */
  refund: protectedProcedure
    .input(z.object({
      userId: z.number().int(),
      amount: z.number().int().min(1).max(10000),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const result = await addCredits(
        input.userId,
        input.amount,
        'refund',
        input.reason || `Admin refund: +${input.amount} credits`,
        { refundedBy: ctx.user!.id }
      );
      logger.info({ userId: input.userId, amount: input.amount, admin: ctx.user!.id }, 'Credits refunded');
      return result;
    }),
});
