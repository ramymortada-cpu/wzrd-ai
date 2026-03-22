/**
 * WZRD AI Admin Router — manages the public-facing system.
 * 
 * Endpoints:
 * - wzrdAdmin.dashboard → overview stats (signups, credits, tools, revenue)
 * - wzrdAdmin.users → public users list with filters
 * - wzrdAdmin.creditLog → all credit transactions
 * - wzrdAdmin.toolStats → tool usage analytics
 * - wzrdAdmin.payments → payment/purchase log
 * - wzrdAdmin.subscribers → newsletter subscribers
 * - wzrdAdmin.config → read/update AI prompts, tool costs, credit plans
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { users, creditTransactions } from "../../drizzle/schema";
import { getDb } from "../db/index";
import { TOOL_COSTS, SIGNUP_BONUS, getCreditStats, updateToolCost } from "../db/credits";

export const wzrdAdminRouter = router({
  /** Overview dashboard — all key metrics */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return null;

    // Total public users (signed up via website)
    const [userCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(eq(users.signupSource, 'website'));

    // Users today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [todayUsers] = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(and(eq(users.signupSource, 'website'), sql`createdAt >= ${today}`));

    // Users this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [weekUsers] = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(and(eq(users.signupSource, 'website'), sql`createdAt >= ${weekAgo}`));

    // Credits stats
    const creditStats = await getCreditStats();

    // Total tool runs
    const [toolRuns] = await db.select({ count: sql<number>`count(*)` })
      .from(creditTransactions).where(eq(creditTransactions.type, 'tool_usage'));

    // Total revenue from credit purchases
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(creditTransactions).where(eq(creditTransactions.type, 'purchase'));

    // Newsletter subscribers
    const [subs] = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(and(eq(users.newsletterOptIn, 1), eq(users.signupSource, 'website')));

    // Average tool score (from metadata)
    const recentTools = await db.select({ metadata: creditTransactions.metadata })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, 'tool_usage'))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(100);

    let avgScore = 0;
    let scoreCount = 0;
    for (const t of recentTools) {
      try {
        const meta = typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata;
        if (meta?.score) { avgScore += meta.score; scoreCount++; }
      } catch {}
    }

    return {
      users: {
        total: userCount?.count || 0,
        today: todayUsers?.count || 0,
        thisWeek: weekUsers?.count || 0,
      },
      credits: {
        totalIssued: creditStats.totalCreditsIssued,
        totalUsed: creditStats.totalCreditsUsed,
        usersWithCredits: creditStats.totalUsersWithCredits,
      },
      tools: {
        totalRuns: toolRuns?.count || 0,
        avgScore: scoreCount > 0 ? Math.round(avgScore / scoreCount) : 0,
        topTools: creditStats.topTools,
      },
      revenue: {
        totalCreditsRevenue: revenue?.total || 0,
      },
      newsletter: {
        subscribers: subs?.count || 0,
      },
    };
  }),

  /** Public users list with search + pagination */
  users: protectedProcedure
    .input(z.object({
      search: z.string().max(100).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { users: [], total: 0 };

      const search = input?.search;
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        company: users.company,
        industry: users.industry,
        credits: users.credits,
        newsletterOptIn: users.newsletterOptIn,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.signupSource, 'website'));

      if (search) {
        query = db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          company: users.company,
          industry: users.industry,
          credits: users.credits,
          newsletterOptIn: users.newsletterOptIn,
          createdAt: users.createdAt,
        }).from(users).where(and(
          eq(users.signupSource, 'website'),
          sql`(name LIKE ${`%${search}%`} OR email LIKE ${`%${search}%`} OR company LIKE ${`%${search}%`})`
        ));
      }

      const rows = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(users).where(eq(users.signupSource, 'website'));

      return { users: rows, total: countResult?.count || 0 };
    }),

  /** Credit transactions log */
  creditLog: protectedProcedure
    .input(z.object({
      type: z.enum(['all', 'signup_bonus', 'purchase', 'tool_usage', 'refund', 'admin']).default('all'),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { transactions: [], total: 0 };

      const type = input?.type || 'all';
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      const whereClause = type === 'all' ? undefined : eq(creditTransactions.type, type);

      const rows = await db.select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        balance: creditTransactions.balance,
        type: creditTransactions.type,
        toolName: creditTransactions.toolName,
        reason: creditTransactions.reason,
        createdAt: creditTransactions.createdAt,
      })
        .from(creditTransactions)
        .where(whereClause)
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(creditTransactions)
        .where(whereClause);

      return { transactions: rows, total: countResult?.count || 0 };
    }),

  /** Tool usage analytics */
  toolStats: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { tools: [], dailyUsage: [] };

    // Per-tool stats
    const toolRows = await db.select({
      toolName: creditTransactions.toolName,
      runs: sql<number>`count(*)`,
      creditsSpent: sql<number>`SUM(ABS(amount))`,
    })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, 'tool_usage'))
      .groupBy(creditTransactions.toolName);

    // Daily usage last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyRows = await db.select({
      date: sql<string>`DATE(createdAt)`,
      runs: sql<number>`count(*)`,
      credits: sql<number>`SUM(ABS(amount))`,
    })
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.type, 'tool_usage'),
        sql`createdAt >= ${thirtyDaysAgo}`
      ))
      .groupBy(sql`DATE(createdAt)`)
      .orderBy(sql`DATE(createdAt)`);

    return {
      tools: toolRows.map((r: any) => ({
        name: r.toolName || 'unknown',
        runs: r.runs,
        creditsSpent: r.creditsSpent,
      })),
      dailyUsage: dailyRows.map((r: any) => ({
        date: r.date,
        runs: r.runs,
        credits: r.credits,
      })),
    };
  }),

  /** Payment log (purchases only) */
  payments: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { payments: [], total: 0 };

      const rows = await db.select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        reason: creditTransactions.reason,
        metadata: creditTransactions.metadata,
        createdAt: creditTransactions.createdAt,
      })
        .from(creditTransactions)
        .where(eq(creditTransactions.type, 'purchase'))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input?.limit || 50);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(creditTransactions).where(eq(creditTransactions.type, 'purchase'));

      return { payments: rows, total: countResult?.count || 0 };
    }),

  /** Newsletter subscribers list */
  subscribers: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { subscribers: [], total: 0 };

    const rows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      company: users.company,
      industry: users.industry,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(and(eq(users.newsletterOptIn, 1), eq(users.signupSource, 'website')))
      .orderBy(desc(users.createdAt))
      .limit(200);

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(users).where(and(eq(users.newsletterOptIn, 1), eq(users.signupSource, 'website')));

    return { subscribers: rows, total: countResult?.count || 0 };
  }),

  /** WZRD AI config — read tool costs + credit plans */
  config: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    return {
      toolCosts: TOOL_COSTS,
      signupBonus: SIGNUP_BONUS,
      creditPlans: {
        starter: { credits: 500, priceEGP: 499 },
        pro: { credits: 1500, priceEGP: 999 },
        agency: { credits: 5000, priceEGP: 2499 },
      },
      dailyCreditCap: 200,
      emailProvider: process.env.EMAIL_PROVIDER || 'none',
      paymobConfigured: !!(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY),
      groqConfigured: !!process.env.GROQ_API_KEY,
      claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
    };
  }),

  /** Force send newsletter NOW (admin trigger) */
  sendNewsletter: protectedProcedure.mutation(async ({ ctx }) => {
    checkOwner(ctx);
    try {
      const { sendWeeklyNewsletter } = await import('../newsletter');
      const result = await sendWeeklyNewsletter();
      return { success: true, ...result };
    } catch (err) {
      return { success: false, sent: 0, failed: 0 };
    }
  }),

  /** Email delivery analytics */
  emailStats: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const { getEmailStats } = await import('../wzrdEmails');
    return getEmailStats();
  }),

  /** Admin: Update a tool's credit cost */
  updateToolCost: protectedProcedure
    .input(z.object({
      toolName: z.string().max(50),
      cost: z.number().int().min(1).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const success = updateToolCost(input.toolName, input.cost);
      if (success) {
        logger.info({ toolName: input.toolName, newCost: input.cost, admin: ctx.user!.id }, '[Admin] Tool cost updated');
      }
      return { success, toolCosts: TOOL_COSTS };
    }),

  /** Paymob webhook event log */
  webhookLog: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    try {
      const { getWebhookLog } = await import('../paymobIntegration');
      return { events: getWebhookLog() };
    } catch {
      return { events: [] };
    }
  }),
});