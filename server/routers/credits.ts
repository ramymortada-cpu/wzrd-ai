/**
 * Credits Router — manages user credit balance and transactions.
 * 
 * Endpoints:
 * - credits.balance → current user's credit balance
 * - credits.history → transaction history
 * - credits.toolCosts → how much each tool costs
 * - credits.stats → admin: usage stats across all users
 */

import { protectedProcedure, router } from "../_core/trpc";
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

  /** Admin: credit usage stats */
  stats: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    return getCreditStats();
  }),

  /** Purchase credits via Paymob Checkout */
  purchase: protectedProcedure
    .input(z.object({
      planId: z.enum(['starter', 'pro', 'agency']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createPaymentIntention } = await import('../paymobIntegration');
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const result = await createPaymentIntention(
        input.planId,
        ctx.user!.id,
        ctx.user!.email || '',
        ctx.user!.name || 'User',
        appUrl
      );

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
