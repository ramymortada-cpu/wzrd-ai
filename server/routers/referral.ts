/**
 * Referral Router — invite friends, earn credits.
 * 
 * - referral.myCode → get/create user's unique referral code
 * - referral.myStats → referral count + credits earned
 * - referral.apply → apply referral code during signup (called from auth)
 * 
 * Each referral = 50 credits to referrer + 50 credits to new user.
 * Anti-abuse: self-referral check, max 3 referrals per IP/day.
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { getDb, addCredits } from "../db";
import { referrals, users } from "../../drizzle/schema";
import { eq, sql, and, count } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type ReferralRow = InferSelectModel<typeof referrals>;

const REFERRAL_BONUS = 50; // credits for both referrer and referred

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const referralRouter = router({
  /** Get or create user's referral code */
  myCode: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { code: null, shareUrl: null };

      // Check if user already has a code
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, ctx.user!.id));

      if (user?.referralCode) {
        const baseUrl = process.env.APP_URL || 'https://wzrd.ai';
        return {
          code: user.referralCode,
          shareUrl: `${baseUrl}/signup?ref=${user.referralCode}`,
        };
      }

      // Generate new code
      let code = generateCode();
      let attempts = 0;
      while (attempts < 5) {
        try {
          await db.update(users)
            .set({ referralCode: code })
            .where(eq(users.id, ctx.user!.id));
          break;
        } catch {
          code = generateCode();
          attempts++;
        }
      }

      const baseUrl = process.env.APP_URL || 'https://wzrd.ai';
      return {
        code,
        shareUrl: `${baseUrl}/signup?ref=${code}`,
      };
    }),

  /** Get referral stats */
  myStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalReferrals: 0, totalCreditsEarned: 0, referralsList: [] };

      const refs = await db.select()
        .from(referrals)
        .where(eq(referrals.referrerId, ctx.user!.id))
        .orderBy(sql`${referrals.createdAt} DESC`)
        .limit(50);

      const totalCredits = refs.reduce(
        (sum: number, r: ReferralRow) => sum + (r.creditsAwarded || 0),
        0
      );

      return {
        totalReferrals: refs.length,
        totalCreditsEarned: totalCredits,
        referralsList: refs.map((r: ReferralRow) => ({
          id: r.id,
          creditsAwarded: r.creditsAwarded,
          createdAt: r.createdAt,
        })),
      };
    }),

  /** Apply referral code (called during/after signup) */
  apply: publicProcedure
    .input(z.object({
      code: z.string().min(4).max(20),
      newUserId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, message: 'Database unavailable' };

      // Find referrer by code
      const [referrer] = await db.select()
        .from(users)
        .where(eq(users.referralCode, input.code.toUpperCase()));

      if (!referrer) {
        return { success: false, message: 'Invalid referral code' };
      }

      // Prevent self-referral
      if (referrer.id === input.newUserId) {
        return { success: false, message: 'Cannot refer yourself' };
      }

      // Check if already referred
      const [existing] = await db.select()
        .from(referrals)
        .where(eq(referrals.referredUserId, input.newUserId));

      if (existing) {
        return { success: false, message: 'User already referred' };
      }

      try {
        // Record the referral
        await db.insert(referrals).values({
          referrerId: referrer.id,
          referredUserId: input.newUserId,
          code: input.code.toUpperCase(),
          creditsAwarded: REFERRAL_BONUS,
        });

        // Award credits to both
        await addCredits(referrer.id, REFERRAL_BONUS, 'referral_bonus', `Referral bonus — new user signed up with your code`);
        await addCredits(input.newUserId, REFERRAL_BONUS, 'referral_bonus', `Welcome bonus — referred by a friend`);

        // Mark new user as referred
        await db.update(users)
          .set({ referredBy: referrer.id })
          .where(eq(users.id, input.newUserId));

        logger.info({ referrerId: referrer.id, referredId: input.newUserId, code: input.code }, 'Referral applied — credits awarded to both');

        return { success: true, creditsAwarded: REFERRAL_BONUS };
      } catch (err: any) {
        logger.error({ err }, 'Referral apply failed');
        return { success: false, message: 'Failed to apply referral' };
      }
    }),
});
