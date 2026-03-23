import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
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

async function startServer() {
  // Install global error handlers FIRST
  installProcessErrorHandlers();

  const app = express();
  const server = createServer(app);

  // === SECURITY & OBSERVABILITY MIDDLEWARE ===
  app.use(securityHeaders);
  app.use(requestLogger);

  // === SIMPLE HEALTH CHECK (for Docker/Railway — no auth, no params) ===
  app.get('/healthz', (_req, res) => res.status(200).json({ ok: true, uptime: Math.floor(process.uptime()) }));

  // === DEBUG: cookie check (temporary — remove after debugging) ===
  app.get('/api/debug/admin-check', (req, res) => {
    const cookie = req.headers.cookie || '';
    const hasSession = cookie.includes('app_session_id=');
    res.json({
      hasCookie: hasSession,
      cookieHeader: cookie.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
  });

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
  // AI Tools (10 req/min — prevents credit drain)
  app.use('/api/trpc/tools.brandDiagnosis', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.offerCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.messageCheck', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.presenceAudit', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.identitySnapshot', rateLimiters.toolUsage);
  app.use('/api/trpc/tools.launchReadiness', rateLimiters.toolUsage);
  // Signup (3 per hour — prevents spam accounts)
  app.use('/api/trpc/auth.signup', rateLimiters.signup);
  // Credits purchase (5 per hour)
  app.use('/api/trpc/credits.purchase', rateLimiters.purchase);
  // AI endpoints — expensive LLM calls (5 req/min)
  app.use('/api/trpc/ai.chat', rateLimiters.ai);
  app.use('/api/trpc/ai.analyzeNotes', rateLimiters.ai);
  app.use('/api/trpc/deliverables.generateWithAI', rateLimiters.ai);
  app.use('/api/trpc/research.full', rateLimiters.ai);
  app.use('/api/trpc/research.deep', rateLimiters.ai);
  app.use('/api/trpc/knowledge.amplify', rateLimiters.ai);
  // General API rate limit (100 req/min)
  app.use('/api/', rateLimiters.general);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  } catch {}

  // === GLOBAL ERROR HANDLER (must be LAST middleware) ===
  app.use(expressErrorHandler);

  // Bind to 0.0.0.0 for Railway/Docker — required for external health checks
  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, `Server running on http://0.0.0.0:${port}/`);

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
          try { await refreshStaleKnowledge(); } catch {}
        }, 6 * 60 * 60 * 1000);
        logger.info('Knowledge auto-refresh scheduled (every 6h)');
      } catch {}

      try {
        // Schedule auto monthly reports (check daily at 00:00)
        const { generateAllMonthlyReports } = await import('../autoReports');
        setInterval(async () => {
          const now = new Date();
          // Only generate on the 1st of each month
          if (now.getDate() === 1 && now.getHours() === 0) {
            try { await generateAllMonthlyReports(); } catch {}
          }
        }, 60 * 60 * 1000); // Check every hour
        logger.info('Auto monthly reports scheduled (1st of each month)');
      } catch {}

      // Start newsletter scheduler
      try {
        const { startNewsletterScheduler } = await import('../newsletter');
        startNewsletterScheduler();
      } catch {}
    }, 5000); // Wait 5s after startup to not block
  });
}

startServer().catch(err => {
  logger.fatal({ err }, 'Server failed to start');
  process.exit(1);
});
