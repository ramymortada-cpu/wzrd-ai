import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";

// Safe dirname — works in both dev and esbuild bundle
const __dir = (() => {
  try {
    if (typeof import.meta.dirname === 'string') return import.meta.dirname;
  } catch {
    /* import.meta.dirname not available */
  }
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    /* fileURLToPath fallback */
  }
  return process.cwd();
})();

const PROJECT_ROOT = path.resolve(__dir, process.env.NODE_ENV === 'production' ? '..' : '../..');

export async function setupVite(app: Express, server: Server) {
  // Dev only — dynamic imports to avoid bundling vite in production
  const { createServer: createViteServer } = await import("vite");
  // Use variable path so esbuild doesn't bundle vite.config.ts
  const configPath = "../../vite.config";
  const viteConfig = (await import(/* @vite-ignore */ configPath)).default;

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  const landingPath = path.resolve(PROJECT_ROOT, "client", "public", "landing");
  if (fs.existsSync(landingPath)) {
    app.use("/landing", express.static(landingPath));

    app.get("/", (req, res, next) => {
      const hasSession = (req.headers.cookie || "").includes("app_session_id=");
      if (!hasSession) res.sendFile(path.resolve(landingPath, "index.html"));
      else next();
    });

    app.get("/api/public/site-config", (_req, res) => {
      try {
        const { getPublicSiteConfig } = require('../siteConfig');
        res.json(getPublicSiteConfig());
      } catch {
        res.json({});
      }
    });

    app.get("/welcome", (_req, res) => res.sendFile(path.resolve(landingPath, "index.html")));
    app.get("/services-info", (_req, res) => res.sendFile(path.resolve(landingPath, "services.html")));
    app.get("/guides/brand-health", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-brand-health.html")));
    app.get("/guides/offer-logic", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-offer-logic.html")));
    app.get("/guides/brand-identity", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-brand-identity.html")));

    // SEO Landing Pages
    const seoToolsDev = ['brand-diagnosis','offer-check','message-check','presence-audit','identity-snapshot','launch-readiness'];
    for (const tool of seoToolsDev) {
      app.get(`/seo/${tool}`, (_req, res) => res.sendFile(path.resolve(landingPath, "seo", `${tool}.html`)));
    }

    app.get("/unsubscribe", async (req, res) => {
      const email = req.query.email as string;
      if (!email) { res.status(400).send("Email required"); return; }
      try {
        const { unsubscribeUser } = await import("../newsletter");
        await unsubscribeUser(email);
        res.send('<html><body style="background:#fff;color:#111;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p>You won\'t receive weekly tips anymore.</p><a href="/welcome">← Back to WZRD AI</a></div></body></html>');
      } catch { res.status(500).send("Error processing unsubscribe"); }
    });
  }

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const clientTemplate = path.resolve(PROJECT_ROOT, "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dir, "public");
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find build directory: ${distPath}`);
  }

  const distLandingPath = path.resolve(distPath, "landing");
  const srcLandingPath = path.resolve(PROJECT_ROOT, "client", "public", "landing");
  const activeLandingPath = fs.existsSync(distLandingPath) ? distLandingPath : (fs.existsSync(srcLandingPath) ? srcLandingPath : distLandingPath);

  if (fs.existsSync(activeLandingPath)) {
    app.use("/landing", express.static(activeLandingPath));

    app.get("/", (req, res, next) => {
      const hasSession = (req.headers.cookie || '').includes('app_session_id=');
      if (!hasSession) res.sendFile(path.resolve(activeLandingPath, "index.html"));
      else next();
    });

    app.get("/api/public/site-config", (_req, res) => {
      try {
        const { getPublicSiteConfig } = require('../siteConfig');
        res.json(getPublicSiteConfig());
      } catch {
        res.json({});
      }
    });

    app.get("/welcome", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "index.html")));
    app.get("/services-info", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "services.html")));
    app.get("/guides/brand-health", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-brand-health.html")));
    app.get("/guides/offer-logic", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-offer-logic.html")));
    app.get("/guides/brand-identity", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-brand-identity.html")));

    // SEO Landing Pages — one per tool
    const seoTools = ['brand-diagnosis','offer-check','message-check','presence-audit','identity-snapshot','launch-readiness'];
    for (const tool of seoTools) {
      app.get(`/seo/${tool}`, (_req, res) => res.sendFile(path.resolve(activeLandingPath, "seo", `${tool}.html`)));
    }

    app.get("/unsubscribe", async (req, res) => {
      const email = req.query.email as string;
      if (!email) { res.status(400).send("Email required"); return; }
      try {
        const { unsubscribeUser } = await import("../newsletter");
        await unsubscribeUser(email);
        res.send('<html><body style="background:#fff;color:#111;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p>You won\'t receive weekly tips anymore.</p><a href="/welcome">← Back to WZRD AI</a></div></body></html>');
      } catch { res.status(500).send("Error processing unsubscribe"); }
    });
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
