import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

/** App root — always process.cwd() so paths work in esbuild ESM bundle (no import.meta.dirname). */
function appRoot(): string {
  return process.cwd();
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // ═══ Landing pages — BEFORE Vite so anonymous / gets landing, not React ═══
  const landingPath = path.resolve(appRoot(), "client", "public", "landing");
  if (fs.existsSync(landingPath)) {
    app.use("/landing", express.static(landingPath));

    // Smart root: no session → landing, has session → pass to Vite/React
    app.get("/", (req, res, next) => {
      const cookieHeader = req.headers.cookie || "";
      const hasSession = cookieHeader.includes("app_session_id=");
      if (!hasSession) {
        res.sendFile(path.resolve(landingPath, "index.html"));
      } else {
        next();
      }
    });

    // Public routes → landing pages
    app.get("/api/public/site-config", (_req, res) => {
      try {
        const { getSiteConfig } = require('../siteConfig');
        const cfg = getSiteConfig();
        res.json({ homepage: cfg.homepage, site: cfg.site, services: cfg.services });
      } catch { res.json({}); }
    });

    app.get("/welcome", (_req, res) => res.sendFile(path.resolve(landingPath, "index.html")));
    app.get("/services-info", (_req, res) => res.sendFile(path.resolve(landingPath, "services.html")));
    app.get("/guides/brand-health", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-brand-health.html")));
    app.get("/guides/offer-logic", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-offer-logic.html")));
    app.get("/guides/brand-identity", (_req, res) => res.sendFile(path.resolve(landingPath, "guide-brand-identity.html")));

    // Newsletter unsubscribe
    app.get("/unsubscribe", async (req, res) => {
      const email = req.query.email as string;
      if (!email) { res.status(400).send("Email required"); return; }
      try {
        const { unsubscribeUser } = await import("../newsletter");
        await unsubscribeUser(email);
        res.send(`<html><body style="background:#09090b;color:#f4f4f6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p style="color:#b0b0be">You won't receive weekly tips anymore.</p><a href="/welcome" style="color:#c8a24e">← Back to WZRD AI</a></div></body></html>`);
      } catch { res.status(500).send("Error processing unsubscribe"); }
    });
  }

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(appRoot(), "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(appRoot(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // ═══ Landing pages — served BEFORE React catch-all ═══
  const landingPath = path.resolve(appRoot(), "client", "public", "landing");
  const distLandingPath = path.resolve(distPath, "landing");
  const activeLandingPath = fs.existsSync(landingPath) ? landingPath : distLandingPath;

  if (fs.existsSync(activeLandingPath)) {
    app.use("/landing", express.static(activeLandingPath));

    // Smart root: logged in → React dashboard, not logged in → landing page
    app.get("/", (req, res, next) => {
      const cookieHeader = req.headers.cookie || '';
      const hasSession = cookieHeader.includes('app_session_id=');
      if (!hasSession) {
        res.sendFile(path.resolve(activeLandingPath, "index.html"));
      } else {
        next();
      }
    });

    // Public routes → landing pages
    app.get("/api/public/site-config", (_req, res) => {
      try {
        const { getSiteConfig } = require('../siteConfig');
        const cfg = getSiteConfig();
        res.json({ homepage: cfg.homepage, site: cfg.site, services: cfg.services });
      } catch { res.json({}); }
    });

    app.get("/welcome", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "index.html")));
    app.get("/services-info", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "services.html")));
    app.get("/guides/brand-health", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-brand-health.html")));
    app.get("/guides/offer-logic", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-offer-logic.html")));
    app.get("/guides/brand-identity", (_req, res) => res.sendFile(path.resolve(activeLandingPath, "guide-brand-identity.html")));

    // Newsletter unsubscribe (GET — works from email link click)
    app.get("/unsubscribe", async (req, res) => {
      const email = req.query.email as string;
      if (!email) { res.status(400).send("Email required"); return; }
      try {
        const { unsubscribeUser } = await import("../newsletter");
        await unsubscribeUser(email);
        res.send(`<html><body style="background:#09090b;color:#f4f4f6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p style="color:#b0b0be">You won't receive weekly tips anymore.</p><a href="/welcome" style="color:#c8a24e">← Back to WZRD AI</a></div></body></html>`);
      } catch { res.status(500).send("Error processing unsubscribe"); }
    });
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (React SPA)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
