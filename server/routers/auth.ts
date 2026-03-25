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
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { fireEmailTrigger } from "../emailTrigger";
import { createPublicUser, getUserByEmail } from "../db";
import { addCredits, SIGNUP_BONUS } from "../db";
import { sendWelcomeEmail } from "../wzrdEmails";
import { signSession } from "../_core/session";

// In-memory OTP store (email → { code, expires })
// In production with multiple servers, use Redis instead
const otpStore = new Map<string, { code: string; expires: number }>();

export const authRouter = router({
  /** Get current user */
  me: publicProcedure.query(opts => opts.ctx.user),
  
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
        return { success: false, message: 'No account found. Please sign up first.' };
      }

      // Generate 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const devBypass = process.env.NODE_ENV === 'development' || process.env.EMAIL_PROVIDER === 'none';
      if (devBypass) {
        console.log(`\n🔑 [DEV] OTP code for ${input.email}: ${code}\n`);
      }

      // Store OTP with 10min expiry (in-memory)
      otpStore.set(input.email, { code, expires: Date.now() + 10 * 60 * 1000 });

      // Send code via email
      const { sendEmail } = await import('../wzrdEmails');
      await sendEmail({
        to: input.email,
        subject: `Your WZRD AI login code: ${code}`,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#09090b;color:#f4f4f6;border-radius:16px;text-align:center">
          <p style="font-size:12px;color:#64647a;letter-spacing:3px">WZRD AI</p>
          <h1 style="font-size:40px;font-family:monospace;letter-spacing:8px;margin:24px 0;color:#6d5cff">${code}</h1>
          <p style="font-size:14px;color:#b0b0be">Enter this code to log in. Expires in 10 minutes.</p>
          <p style="font-size:11px;color:#64647a;margin-top:24px">If you didn't request this, ignore this email.</p>
        </div>`,
      }).catch(() => {});

      logger.info({ email: input.email }, 'Login OTP sent');
      return {
        success: true,
        message: 'Login code sent to your email.',
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
      const stored = otpStore.get(input.email);
      
      if (!stored || stored.code !== input.code) {
        return { success: false, user: null, message: 'Invalid code. Please try again.' };
      }
      
      if (Date.now() > stored.expires) {
        otpStore.delete(input.email);
        return { success: false, user: null, message: 'Code expired. Please request a new one.' };
      }

      // OTP valid — clear it
      otpStore.delete(input.email);

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
});
