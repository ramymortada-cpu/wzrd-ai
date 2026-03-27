import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db";
import { escapeHtmlAttr } from "./html";

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

  // TRUE SEO (Production only): inject meta tags for blog posts into HTML response.
  // Must be registered BEFORE express.static so it intercepts /blog/:slug routes.
  app.get("/blog/:slug", async (req, res, next) => {
    try {
      const db = await getDb();

      const { blogPosts } = await import("../../drizzle/schema");
      const { and, eq } = await import("drizzle-orm");
      const slug = decodeURIComponent(req.params.slug || "");

      let post:
        | {
            seoTitleAr: string | null;
            seoTitleEn: string | null;
            titleAr: string;
            titleEn: string;
            seoDescAr: string | null;
            seoDescEn: string | null;
            coverImage: string | null;
          }
        | undefined;

      if (db) {
        [post] = await db
          .select({
            seoTitleAr: blogPosts.seoTitleAr,
            seoTitleEn: blogPosts.seoTitleEn,
            titleAr: blogPosts.titleAr,
            titleEn: blogPosts.titleEn,
            seoDescAr: blogPosts.seoDescAr,
            seoDescEn: blogPosts.seoDescEn,
            coverImage: blogPosts.coverImage,
          })
          .from(blogPosts)
          .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, 1)))
          .limit(1);
      }

      const htmlPath = path.resolve(distPath, "index.html");
      let html = fs.readFileSync(htmlPath, "utf-8");

      // Clear any prior injected block (defensive in case of template reuse).
      html = html.replaceAll(/<!-- WZRD_BLOG_SEO_START -->[\s\S]*?<!-- WZRD_BLOG_SEO_END -->/g, "");

      const wantsAr = typeof req.headers["accept-language"] === "string"
        ? req.headers["accept-language"].toLowerCase().includes("ar")
        : false;

      const seoTitleRaw = post
        ? ((wantsAr ? (post.seoTitleAr || post.titleAr) : (post.seoTitleEn || post.titleEn)) || "WZRD AI Blog")
        : "WZRD AI Blog";
      const seoDescRaw = post
        ? ((wantsAr ? post.seoDescAr : post.seoDescEn) || "")
        : "WZRD AI Blog";
      const ogImageRaw = post?.coverImage || "";

      const seoTitle = escapeHtmlAttr(seoTitleRaw);
      const seoDesc = escapeHtmlAttr(seoDescRaw);
      const ogImage = escapeHtmlAttr(ogImageRaw);

      // Replace <title>…</title> when present, otherwise insert a title.
      if (/<title>[\s\S]*?<\/title>/i.test(html)) {
        html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${seoTitle}</title>`);
      } else {
        html = html.replace(
          "</head>",
          `<title>${seoTitle}</title>\n</head>`,
        );
      }

      html = html.replace(
        "</head>",
        `<!-- WZRD_BLOG_SEO_START -->\n<meta name="description" content="${seoDesc}">\n<meta property="og:title" content="${seoTitle}">\n<meta property="og:description" content="${seoDesc}">\n<meta property="og:image" content="${ogImage}">\n<meta property="og:type" content="article">\n<meta name="twitter:card" content="summary_large_image">\n<!-- WZRD_BLOG_SEO_END -->\n</head>`,
      );

      res
        .status(200)
        .set({
          "Content-Type": "text/html",
          "X-WZRD-SEO": !db ? "no_db" : (post ? "injected" : "no_post"),
        })
        .end(html);
    } catch {
      next();
    }
  });

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
