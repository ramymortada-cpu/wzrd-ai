/**
 * Auth Router — authentication, signup, session management.
 * 
 * Endpoints:
 * - auth.me → current user
 * - auth.signup → public signup (email) + 100 credits
 * - auth.login → login by email (returns user + sets session)
 * - auth.logout → clear session
 */

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { fireEmailTrigger } from "../emailTrigger";
import { createPublicUser, getUserByEmail, getDb } from "../db";
import { addCredits, SIGNUP_BONUS } from "../db";
import { sendWelcomeEmail } from "../wzrdEmails";
import { signSession } from "../_core/session";
import { isOwnerAdmin } from "../_core/authorization";
import { otpCodes, users, creditTransactions, diagnosisHistory, brandProfiles } from "../../drizzle/schema";
import { eq, and, gt, sql } from "drizzle-orm";

// OTP is now stored in the `otp_codes` database table
// (was: in-memory Map — lost on restart, broken with multiple instances)

export const authRouter = router({
  /** Get current user (+ canAccessCommandCenter for WZZRD admin nav) */
  me: publicProcedure.query((opts) => {
    const u = opts.ctx.user;
    if (!u) return null;
    return {
      ...u,
      canAccessCommandCenter: isOwnerAdmin({ email: u.email ?? undefined, role: u.role }),
    };
  }),
  
  /** Public signup — creates user + 100 credits */
  signup: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().max(255),
      company: z.string().max(255).optional(),
      industry: z.string().max(100).optional(),
      market: z.string().max(50).optional(),
      newsletterOptIn: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if already exists
      const existing = await getUserByEmail(input.email);
      if (existing) {
        // Set session cookie (JWT signed) so React app recognizes user
        if (ctx.res) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          const token = await signSession({ id: existing.id, openId: existing.openId, email: existing.email || '' });
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        }
        return {
          success: true,
          isNew: false,
          user: { id: existing.id, name: existing.name, email: existing.email, credits: existing.credits },
          message: 'Welcome back! You already have an account.',
        };
      }

      // Create new user
      const result = await createPublicUser({
        name: input.name,
        email: input.email,
        company: input.company,
        industry: input.industry,
        market: input.market,
        newsletterOptIn: input.newsletterOptIn,
      });

      if (!result) {
        return { success: false, isNew: false, user: null, message: 'Failed to create account. Please try again.' };
      }

      // Log the signup bonus as a credit transaction
      const creditResult = await addCredits(result.id, SIGNUP_BONUS, 'signup_bonus', 'Welcome bonus — 100 free credits');
      if (!creditResult.success) {
        logger.error({ userId: result.id, email: input.email }, 'Signup: addCredits failed');
        return { success: false, isNew: false, user: null, message: 'Account created but credits failed. Please contact support.' };
      }

      // Set session cookie (JWT signed) so React app recognizes user
      if (ctx.res) {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const token = await signSession({ id: result.id, openId: result.openId, email: input.email });
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      }

      logger.info({ userId: result.id, email: input.email }, 'New user signed up with 100 credits');

      // Send welcome email (async, don't block)
      sendWelcomeEmail(input.email, input.name).catch(() => {});

      // Fire email automation trigger (non-blocking)
      fireEmailTrigger('signup', result.id, { credits: SIGNUP_BONUS }).catch(() => {});

      return {
        success: true,
        isNew: true,
        user: { id: result.id, name: input.name, email: input.email, credits: SIGNUP_BONUS },
        message: `Welcome ${input.name}! You have ${SIGNUP_BONUS} free credits.`,
      };
    }),

  /** Step 1: Request login — sends 6-digit code to email */
  requestLogin: publicProcedure
    .input(z.object({
      email: z.string().email().max(255),
    }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        // SECURITY: Don't reveal whether email exists — prevents user enumeration
        logger.info({ email: input.email }, 'Login attempt for non-existent email');
        return { success: true, message: 'If this email is registered, you will receive a login code.' };
      }

      // Generate 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const devBypass = process.env.NODE_ENV === 'development' || process.env.EMAIL_PROVIDER === 'none';
      if (devBypass) {
        logger.info({ email: input.email, code }, '[DEV] OTP login code');
      }

      // Store OTP in database with 10min expiry
      const db = await getDb();
      if (!db) {
        logger.error({ email: input.email }, '[Auth] Database unavailable — cannot store OTP');
        return { success: false, message: 'Service temporarily unavailable. Please try again.' };
      }
      // Delete any existing OTP for this email
      await db.delete(otpCodes).where(eq(otpCodes.email, input.email));
      // Insert new OTP
      await db.insert(otpCodes).values({
        email: input.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Send code via email
      const { sendEmail } = await import('../wzrdEmails');
      await sendEmail({
        to: input.email,
        subject: `Your WZZRD AI login code: ${code}`,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#09090b;color:#f4f4f6;border-radius:16px;text-align:center">
          <p style="font-size:12px;color:#64647a;letter-spacing:3px">WZZRD AI</p>
          <h1 style="font-size:40px;font-family:monospace;letter-spacing:8px;margin:24px 0;color:#6d5cff">${code}</h1>
          <p style="font-size:14px;color:#b0b0be">Enter this code to log in. Expires in 10 minutes.</p>
          <p style="font-size:11px;color:#64647a;margin-top:24px">If you didn't request this, ignore this email.</p>
        </div>`,
      }).catch(() => {});

      logger.info({ email: input.email }, 'Login OTP sent');
      return {
        success: true,
        message: 'If this email is registered, you will receive a login code.',
        ...(devBypass && { devCode: code }), // Return OTP in response when email disabled
      };
    }),

  /** Step 2: Verify OTP code and set session */
  verifyLogin: publicProcedure
    .input(z.object({
      email: z.string().email().max(255),
      code: z.string().length(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return { success: false, user: null, message: 'Database unavailable.' };
      }

      // Per-email lockout: check existing OTP for failed attempts BEFORE verifying
      const [existingOtp] = await db.select()
        .from(otpCodes)
        .where(eq(otpCodes.email, input.email))
        .limit(1);

      if (existingOtp && existingOtp.failedAttempts >= 5) {
        // Delete the locked-out OTP — user must request a new one
        await db.delete(otpCodes).where(eq(otpCodes.email, input.email));
        return { success: false, user: null, message: 'Too many failed attempts. Please request a new code.' };
      }

      // Look up OTP from database (email + code + not expired)
      const [stored] = await db.select()
        .from(otpCodes)
        .where(and(
          eq(otpCodes.email, input.email),
          eq(otpCodes.code, input.code),
          gt(otpCodes.expiresAt, new Date()),
        ))
        .limit(1);
      
      if (!stored) {
        // Increment failed attempts counter for this email
        if (existingOtp) {
          await db.update(otpCodes)
            .set({ failedAttempts: sql`failed_attempts + 1` })
            .where(eq(otpCodes.email, input.email));
        }
        return { success: false, user: null, message: 'Invalid or expired code. Please try again.' };
      }

      // OTP valid — delete it
      await db.delete(otpCodes).where(eq(otpCodes.email, input.email));

      const user = await getUserByEmail(input.email);
      if (!user) {
        return { success: false, user: null, message: 'Account not found.' };
      }

      // Set session cookie (JWT signed)
      if (ctx.res) {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const token = await signSession({ id: user.id, openId: user.openId, email: user.email || '' });
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
      }

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, credits: user.credits },
        message: `Welcome back, ${user.name}!`,
      };
    }),

  /** Logout */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  /**
   * Delete own account (GDPR / Saudi PDPL compliance).
   * Removes all personal data, clears session.
   */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user!.id;
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');

    try {
      // Delete personal data in dependency order (child → parent)
      await db.delete(diagnosisHistory).where(eq(diagnosisHistory.userId, userId));
      await db.delete(brandProfiles).where(eq(brandProfiles.userId, userId));
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, userId));
      const [userRow] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
      if (userRow?.email) {
        await db.delete(otpCodes).where(eq(otpCodes.email, userRow.email));
      }
      await db.delete(users).where(eq(users.id, userId));

      // Clear session cookie
      if (ctx.res) {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      }

      logger.info({ userId }, '[Auth] Account deleted by user request');
      return { success: true };
    } catch (err) {
      logger.error({ err, userId }, '[Auth] deleteAccount failed');
      throw new Error('Failed to delete account. Please contact support.');
    }
  }),
});
