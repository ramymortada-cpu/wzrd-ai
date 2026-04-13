import "dotenv/config";
import { validateCriticalEnv } from "./env";
validateCriticalEnv(); // Crash immediately if critical env vars are missing in production
import express from "express";
import { createServer } from "http";
import net from "net";
import { spawn } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { securityHeaders } from "./security";
import { requestLogger, logger } from "./logger";
import { rateLimiters } from "./rateLimit";
import { csrfProtection, setCsrfToken } from "./csrf";
import { mountMessagingWebhooks } from "../messagingIntegration";
import { installProcessErrorHandlers, expressErrorHandler } from "./errorHandler";
import { initSentry } from "./sentry";
import { startDataRetentionScheduler } from "./dataRetention";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Logs integration status at startup for operator visibility.
 * Shows which services are configured and which are missing.
 */
function logStartupChecklist() {
  const checks: Record<string, boolean> = {
    'Database': !!process.env.DATABASE_URL,
    'Auth (JWT)': !!process.env.JWT_SECRET,
    'Groq (LLM)': !!process.env.GROQ_API_KEY,
    'Claude (Premium)': !!process.env.ANTHROPIC_API_KEY,
    'Sentry': !!process.env.SENTRY_DSN,
    'Email': !!process.env.EMAIL_API_KEY,
    'Paymob': !!process.env.PAYMOB_SECRET_KEY,
    'WhatsApp': !!process.env.WHATSAPP_TOKEN,
    'JWT Rotation': !!process.env.JWT_SECRET_PREVIOUS,
  };
  const configured = Object.entries(checks).filter(([, v]) => v).map(([k]) => k);
  const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  logger.info({ configured, missing }, `Startup: ${configured.length}/${Object.keys(checks).length} integrations ready`);
}

async function startServer() {
  // Initialize Sentry FIRST
  initSentry();

  // Install global error handlers
  installProcessErrorHandlers();

  const app = express();
  const server = createServer(app);

  // === SECURITY & OBSERVABILITY MIDDLEWARE ===
  app.use(securityHeaders);
  app.use(requestLogger);

  // === HEALTH CHECK (DB-aware — returns 503 when DB is unreachable) ===
  app.get('/healthz', async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('db null');
      await db.execute(sql`SELECT 1`);
      res.status(200).json({ ok: true, uptime: Math.floor(process.uptime()) });
    } catch {
      res.status(503).json({ ok: false, error: 'database_unavailable' });
    }
  });

  // Legacy path — do not expose session debug on any environment
  app.get('/api/debug/whoami', (_req, res) => res.status(404).json({ error: 'not_found' }));

  // === RATE LIMITING ON PUBLIC ENDPOINTS ===
  // Quick-check uses LLM — most aggressive limiting (3 req/min)
  app.use('/api/trpc/leads.submitQuickCheck', rateLimiters.quickCheck);
  // Portal endpoints (30 req/min)
  app.use('/api/trpc/portal.viewProject', rateLimiters.portal);
  app.use('/api/trpc/portal.addComment', rateLimiters.publicWrite);
  app.use('/api/trpc/portal.submitApproval', rateLimiters.publicWrite);
  // Feedback public endpoints (10 req/min)
  app.use('/api/trpc/feedback.publicCreate', rateLimiters.publicWrite);
  app.use('/api/trpc/feedback.publicSubmit', rateLimiters.publicWrite);
  // Onboarding public (10 req/min)
  app.use('/api/trpc/onboarding.submit', rateLimiters.publicWrite);
  app.use('/api/trpc/referral.applyReferral', rateLimiters.publicWrite); // 10/min — prevents brute-force
  // AI Tools (10 req/min — prevents credit drain)
  app.use('/api/trpc/tools.brandDiagnosis', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.offerCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.messageCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.presenceAudit', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.identitySnapshot', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.launchReadiness', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.competitiveBenchmark', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeBrandDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockBrandDiagnosis', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeOfferCheckDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockOfferCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeMessageCheckDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockMessageCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freePresenceAuditDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockPresenceAudit', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeIdentitySnapshotDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockIdentitySnapshot', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeLaunchReadinessDiagnosis', rateLimiters.ai);
  app.use('/api/trpc/tools.unlockLaunchReadiness', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.freeQuickDiagnosis', rateLimiters.quickCheck);
  app.use('/api/trpc/copilot.chat', rateLimiters.ai);
  // Signup (3 per hour — prevents spam accounts)
  app.use('/api/trpc/auth.signup', rateLimiters.signup);
  // OTP login — 5 requests per 15 minutes (prevents email flooding + brute-force code guessing)
  app.use('/api/trpc/auth.requestLogin', rateLimiters.otpRequest);
  app.use('/api/trpc/auth.verifyLogin', rateLimiters.otpVerify);
  // Invite token acceptance — 5 per hour per IP (prevents brute-force)
  app.use('/api/trpc/workspaces.acceptInvite', rateLimiters.acceptInvite);
  // Credits purchase (5 per hour)
  app.use('/api/trpc/credits.purchase', rateLimiters.purchase);
  app.use('/api/trpc/premium.validatePromo', rateLimiters.publicWrite);
  app.use('/api/trpc/premium.applyPromo', rateLimiters.publicWrite);
  // AI endpoints — expensive LLM calls (5 req/min)
  app.use('/api/trpc/ai.chat', rateLimiters.ai);
  app.use('/api/trpc/ai.analyzeNotes', rateLimiters.ai);
  app.use('/api/trpc/deliverables.generateWithAI', rateLimiters.ai);
  app.use('/api/trpc/research.full', rateLimiters.ai);
  app.use('/api/trpc/research.deep', rateLimiters.ai);
  app.use('/api/trpc/knowledge.amplify', rateLimiters.ai);
  app.use('/api/trpc/brandProfile.autoExtract', rateLimiters.ai);
  app.use('/api/trpc/brandProfile.updateProfile', rateLimiters.publicWrite);
  // General API rate limit (100 req/min)
  app.use('/api/', rateLimiters.general);

  // Body size capped to reduce DoS surface; use presigned S3 for large uploads
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // === CSRF PROTECTION ===
  // Sets token cookie on first request, validates on mutations
  // Skips tRPC routes (they use their own auth) and webhooks
  app.use(csrfProtection);

  // CSRF token endpoint — frontend calls this on load to get a token
  app.get('/api/csrf-token', (req, res) => {
    const token = setCsrfToken(res);
    res.json({ token });
  });

  // === MESSAGING WEBHOOKS (WhatsApp + Telegram) ===
  mountMessagingWebhooks(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Full Audit PDF download (Sprint B) — cookie auth, before tRPC
  const { mountFullAuditPdfDownload } = await import("../fullAuditPdfRoutes");
  mountFullAuditPdfDownload(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = process.env.PORT ? preferredPort : await findAvailablePort(preferredPort);

  if (!process.env.PORT && port !== preferredPort) {
    logger.info({ preferredPort, port }, 'Preferred port busy, using alternative');
  }

  // === PAYMOB WEBHOOK (before error handler) ===
  try {
    const { mountPaymobWebhook } = await import('../paymobIntegration');
    mountPaymobWebhook(app);
  } catch {
    /* Paymob integration optional */
  }

  // === GLOBAL ERROR HANDLER (must be LAST middleware) ===
  app.use(expressErrorHandler);

  // Bind to 0.0.0.0 for Railway/Docker — required for external health checks
  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, `Server running on http://0.0.0.0:${port}/`);

    // Log integration status for operator visibility
    logStartupChecklist();

    // === BLOG SEED (fire-and-forget, runs after server is up) ===
    // Spawned detached so Railway's health check passes before seeding begins.
    try {
      const seeder = spawn('node', ['scripts/seed-blogs-safe.mjs'], {
        detached: true,
        stdio: 'inherit',
      });
      seeder.unref();
      logger.info('Blog seed script spawned in background');
    } catch (err) {
      logger.warn({ err }, 'Failed to spawn blog seed script — skipping');
    }

    // === POST-STARTUP TASKS (non-blocking) ===
    setTimeout(async () => {
      try {
        // Load site config from DB (CMS, prompts, settings)
        const { loadConfigFromDb } = await import('../siteConfig');
        await loadConfigFromDb();
        logger.info('Site config loaded from DB');
      } catch (err) {
        logger.warn({ err }, 'Site config DB load failed — using defaults');
      }

      // Migrate static knowledge to DB (idempotent — safe to re-run)
      try {
        const { migrateStaticKnowledge } = await import('../knowledgeMigration');
        await migrateStaticKnowledge();
      } catch (err) {
        logger.warn({ err }, '[Startup] Knowledge migration failed — non-critical, continuing');
      }

      try {
        // Auto-index knowledge base for semantic search
        const { indexKnowledgeBase } = await import('../vectorSearch');
        await indexKnowledgeBase();
        logger.info('Knowledge base auto-indexed at startup');
      } catch (err) {
        logger.warn({ err }, 'Auto-index failed — semantic search may be limited');
      }

      try {
        // Schedule auto-refresh of stale knowledge (every 6 hours)
        const { refreshStaleKnowledge } = await import('../liveIntelligence');
        setInterval(async () => {
          try {
            await refreshStaleKnowledge();
          } catch {
            /* refresh non-fatal */
          }
        }, 6 * 60 * 60 * 1000);
        logger.info('Knowledge auto-refresh scheduled (every 6h)');
      } catch {
        /* scheduler optional */
      }

      try {
        // Schedule auto monthly reports (check daily at 00:00)
        const { generateAllMonthlyReports } = await import('../autoReports');
        setInterval(async () => {
          const now = new Date();
          // Only generate on the 1st of each month
          if (now.getDate() === 1 && now.getHours() === 0) {
            try {
              await generateAllMonthlyReports();
            } catch {
              /* report run non-fatal */
            }
          }
        }, 60 * 60 * 1000); // Check every hour
        logger.info('Auto monthly reports scheduled (1st of each month)');
      } catch {
        /* monthly schedule optional */
      }

      // Start newsletter scheduler
      try {
        const { startNewsletterScheduler } = await import('../newsletter');
        startNewsletterScheduler();
      } catch {
        /* newsletter optional */
      }

      // Start data retention cleanup scheduler
      try {
        startDataRetentionScheduler();
      } catch (err) {
        logger.warn({ err }, 'Data retention scheduler failed to start');
      }

      try {
        const { startAbandonedCartWorker } = await import('../abandonedCartWorker');
        startAbandonedCartWorker();
      } catch (err) {
        logger.warn({ err }, 'Abandoned cart worker failed to start');
      }

      try {
        const { startBrandMonitorWorker } = await import('../brandMonitorWorker');
        startBrandMonitorWorker();
      } catch (err) {
        logger.warn({ err }, 'Brand monitor worker failed to start');
      }

      try {
        const { startEmailQueueWorker } = await import('../emailQueueWorker');
        startEmailQueueWorker();
      } catch (err) {
        logger.warn({ err }, 'Email queue worker failed to start');
      }

      try {
        const { seedEmailTemplates } = await import('../seeds/emailTemplates');
        await seedEmailTemplates();
      } catch (err) {
        logger.warn({ err }, 'Email template seed failed — automations may be empty until seeded');
      }
    }, 5000); // Wait 5s after startup to not block
  });
}

startServer().catch(err => {
  logger.fatal({ err }, 'Server failed to start');
  process.exit(1);
});
