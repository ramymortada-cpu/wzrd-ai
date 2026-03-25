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
import { checkOwner, isSuperAdmin } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { eq, desc, sql, and, like } from "drizzle-orm";
import { users, creditTransactions, clients, projects } from "../../drizzle/schema";
import { getDb } from "../db/index";
import { TOOL_COSTS, SIGNUP_BONUS, getCreditStats, updateToolCost } from "../db/credits";

export const wzrdAdminRouter = router({
  /**
   * Super-admin gate for the portal UI (does not throw — use for client layout).
   * APIs still enforce checkOwner individually.
   */
  bootstrap: protectedProcedure.query(({ ctx }) => {
    const u = ctx.user as { email?: string; name?: string } | null;
    if (!u) return { authenticated: false as const, superAdmin: false };
    return {
      authenticated: true as const,
      superAdmin: isSuperAdmin(ctx),
      email: u.email ?? null,
      name: u.name ?? null,
    };
  }),

  /** Snapshot of env + product metrics for the command center tab */
  commandCenter: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    let referralRecords = 0;
    let copilotMessages = 0;
    if (db) {
      try {
        const { referrals, copilotMessages: copilotMsgs } = await import("../../drizzle/schema");
        const [r] = await db.select({ c: sql<number>`count(*)` }).from(referrals);
        referralRecords = Number(r?.c ?? 0);
        const [cm] = await db.select({ c: sql<number>`count(*)` }).from(copilotMsgs);
        copilotMessages = Number(cm?.c ?? 0);
      } catch {
        /* migrations optional */
      }
    }
    return {
      environment: process.env.NODE_ENV || "development",
      appUrl: process.env.APP_URL || "",
      adminEmailsFromEnv: !!(process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.trim()),
      emailProvider: process.env.EMAIL_PROVIDER || "none",
      hasGroq: !!process.env.GROQ_API_KEY,
      hasClaude: !!process.env.ANTHROPIC_API_KEY,
      hasPaymob: !!(process.env.PAYMOB_SECRET_KEY && process.env.PAYMOB_PUBLIC_KEY),
      hasEmailApiKey: !!process.env.EMAIL_API_KEY,
      databaseConnected: !!db,
      referralRecords,
      copilotMessages,
    };
  }),

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
      type: z.enum([
        'all',
        'signup_bonus',
        'purchase',
        'tool_usage',
        'refund',
        'admin',
        'referral_bonus',
        'copilot_refund',
      ]).default('all'),
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

  // ═══════════════════════════════════════
  // CMS — Homepage + Services content
  // ═══════════════════════════════════════

  /** Get full site config (CMS + settings + prompts) */
  siteConfig: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    const { getSiteConfig } = require('../siteConfig');
    return getSiteConfig();
  }),

  /** Update homepage content */
  updateHomepage: protectedProcedure
    .input(z.object({
      heroTitle: z.string().max(200).optional(),
      heroTitleAr: z.string().max(200).optional(),
      heroSubtitle: z.string().max(500).optional(),
      heroSubtitleAr: z.string().max(500).optional(),
      ctaText: z.string().max(100).optional(),
      ctaTextAr: z.string().max(100).optional(),
      ctaUrl: z.string().max(200).optional(),
      showSignupForm: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const { updateHomepage } = require('../siteConfig');
      return { success: true, homepage: updateHomepage(input) };
    }),

  /** Update site settings */
  updateSiteSettings: protectedProcedure
    .input(z.object({
      companyName: z.string().max(100).optional(),
      whatsapp: z.string().max(20).optional(),
      email: z.string().max(100).optional(),
      instagram: z.string().max(100).optional(),
      linkedin: z.string().max(100).optional(),
      website: z.string().max(200).optional(),
      taglineEn: z.string().max(200).optional(),
      taglineAr: z.string().max(200).optional(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const { updateSiteSettings } = require('../siteConfig');
      return { success: true, site: updateSiteSettings(input) };
    }),

  /** Update a service */
  updateService: protectedProcedure
    .input(z.object({
      serviceId: z.string().max(50),
      nameEn: z.string().max(100).optional(),
      nameAr: z.string().max(100).optional(),
      descEn: z.string().max(500).optional(),
      descAr: z.string().max(500).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const { updateService } = require('../siteConfig');
      const { serviceId, ...updates } = input;
      return { success: updateService(serviceId, updates) };
    }),

  // ═══════════════════════════════════════
  // PROMPTS — AI tool system prompts
  // ═══════════════════════════════════════

  /** Update an AI tool's system prompt */
  updatePrompt: protectedProcedure
    .input(z.object({
      toolId: z.string().max(50),
      systemPrompt: z.string().max(5000).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const { updateToolPrompt } = require('../siteConfig');
      const { toolId, ...updates } = input;
      return { success: updateToolPrompt(toolId, updates) };
    }),

  // ═══════════════════════════════════════
  // TEAM — Internal users management
  // ═══════════════════════════════════════

  /** List all internal users (agency team) */
  teamList: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { team: [] };

    const rows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(sql`signupSource IS NULL OR signupSource != 'website'`)
      .orderBy(desc(users.createdAt))
      .limit(50);

    return { team: rows };
  }),

  /** Update team member role */
  updateTeamRole: protectedProcedure
    .input(z.object({
      userId: z.number().int(),
      role: z.enum(['user', 'admin']),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ═══════════════════════════════════════
  // AGENCY — Clients + Projects overview
  // ═══════════════════════════════════════

  /** All agency clients overview */
  agencyClients: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { clients: [], total: 0 };

    const rows = await db.select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      company: clients.companyName,
      industry: clients.industry,
      status: clients.status,
      createdAt: clients.createdAt,
    })
      .from(clients)
      .orderBy(desc(clients.createdAt))
      .limit(100);

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(clients);

    return { clients: rows, total: count?.count || 0 };
  }),

  /** All projects overview */
  agencyProjects: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { projects: [], total: 0, byStatus: {} };

    const rows = await db.select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      stage: projects.stage,
      clientId: projects.clientId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
      .from(projects)
      .orderBy(desc(projects.updatedAt))
      .limit(100);

    const [count] = await db.select({ count: sql<number>`count(*)` }).from(projects);

    const byStatus: Record<string, number> = {};
    rows.forEach((p: { status: string | null }) => { byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1; });

    return { projects: rows, total: count?.count || 0, byStatus };
  }),

  /** Reset site config to defaults */
  resetSiteConfig: protectedProcedure.mutation(({ ctx }) => {
    checkOwner(ctx);
    const { resetConfig } = require('../siteConfig');
    return { success: true, config: resetConfig() };
  }),

  // ═══════════════════════════════════════
  // CLIENTS CRUD
  // ═══════════════════════════════════════

  addClient: protectedProcedure
    .input(z.object({
      name: z.string().max(255),
      companyName: z.string().max(255).optional(),
      email: z.string().max(320).optional(),
      phone: z.string().max(50).optional(),
      market: z.enum(['ksa', 'egypt', 'uae', 'other']).optional(),
      industry: z.string().max(255).optional(),
      website: z.string().max(500).optional(),
      notes: z.string().max(5000).optional(),
      status: z.enum(['lead', 'active', 'completed', 'paused']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false, error: 'No DB' };
      const result = await db.insert(clients).values({
        name: input.name,
        companyName: input.companyName || null,
        email: input.email || null,
        phone: input.phone || null,
        market: input.market || 'egypt',
        industry: input.industry || null,
        website: input.website || null,
        notes: input.notes || null,
        status: input.status || 'lead',
      });
      return { success: true, id: result[0]?.insertId };
    }),

  updateClient: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().max(255).optional(),
      companyName: z.string().max(255).optional(),
      email: z.string().max(320).optional(),
      phone: z.string().max(50).optional(),
      market: z.enum(['ksa', 'egypt', 'uae', 'other']).optional(),
      industry: z.string().max(255).optional(),
      website: z.string().max(500).optional(),
      notes: z.string().max(5000).optional(),
      status: z.enum(['lead', 'active', 'completed', 'paused']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const { id, ...updates } = input;
      const cleanUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined) cleanUpdates[k] = v; }
      if (Object.keys(cleanUpdates).length > 0) {
        await db.update(clients).set(cleanUpdates).where(eq(clients.id, id));
      }
      return { success: true };
    }),

  deleteClient: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(clients).set({ deletedAt: new Date() }).where(eq(clients.id, input.id));
      return { success: true };
    }),

  // ═══════════════════════════════════════
  // PROJECTS CRUD
  // ═══════════════════════════════════════

  addProject: protectedProcedure
    .input(z.object({
      clientId: z.number().int(),
      name: z.string().max(255),
      serviceType: z.enum(['business_health_check', 'starting_business_logic', 'brand_identity', 'business_takeoff', 'consultation']),
      stage: z.enum(['diagnose', 'design', 'deploy', 'optimize', 'completed']).optional(),
      status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
      price: z.string().max(20).optional(),
      currency: z.string().max(10).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const result = await db.insert(projects).values({
        clientId: input.clientId,
        name: input.name,
        serviceType: input.serviceType,
        stage: input.stage || 'diagnose',
        status: input.status || 'active',
        price: input.price || null,
        currency: input.currency || 'EGP',
      });
      return { success: true, id: result[0]?.insertId };
    }),

  updateProject: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().max(255).optional(),
      stage: z.enum(['diagnose', 'design', 'deploy', 'optimize', 'completed']).optional(),
      status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
      price: z.string().max(20).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const { id, ...updates } = input;
      const cleanUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined) cleanUpdates[k] = v; }
      if (Object.keys(cleanUpdates).length > 0) {
        await db.update(projects).set(cleanUpdates).where(eq(projects.id, id));
      }
      return { success: true };
    }),

  // ═══════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      // Don't allow deleting yourself
      const u = ctx.user as { id?: number } | null;
      if (u?.id === input.userId) return { success: false, error: 'Cannot delete yourself' };
      await db.delete(users).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ═══════════════════════════════════════
  // TOOL RUN RESULTS (history)
  // ═══════════════════════════════════════

  toolRunHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().max(200).optional() }))
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { runs: [] };

      const rows = await db.select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        type: creditTransactions.type,
        toolName: creditTransactions.toolName,
        amount: creditTransactions.amount,
        createdAt: creditTransactions.createdAt,
      })
        .from(creditTransactions)
        .where(eq(creditTransactions.type, 'tool_usage'))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input?.limit || 50);

      return { runs: rows };
    }),

  // ═══════════════════════════════════════
  // NEWSLETTER SUBSCRIBERS
  // ═══════════════════════════════════════

  subscribersList: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { subscribers: [] };

    const rows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.newsletterOptIn, 1))
      .orderBy(desc(users.createdAt))
      .limit(200);

    return { subscribers: rows };
  }),

  removeSubscriber: protectedProcedure
    .input(z.object({ userId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(users).set({ newsletterOptIn: 0 }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ═══════════════════════════════════════
  // ADMIN ACTIVITY LOG
  // ═══════════════════════════════════════

  activityLog: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    // For now, return LLM usage log as activity proxy
    const db = await getDb();
    if (!db) return { activities: [] };

    try {
      const { llmUsageLog } = await import('../../drizzle/schema');
      const rows = await db.select()
        .from(llmUsageLog)
        .orderBy(desc(llmUsageLog.createdAt))
        .limit(50);
      return { activities: rows };
    } catch {
      return { activities: [] };
    }
  }),
});