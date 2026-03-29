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
        res.send('<html><body style="background:#fff;color:#111;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p>You won\'t receive weekly tips anymore.</p><a href="/welcome">← Back to WZZRD AI</a></div></body></html>');
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
        res.send('<html><body style="background:#fff;color:#111;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h2>Unsubscribed ✓</h2><p>You won\'t receive weekly tips anymore.</p><a href="/welcome">← Back to WZZRD AI</a></div></body></html>');
      } catch { res.status(500).send("Error processing unsubscribe"); }
    });
  }

  // TRUE SEO — Homepage pre-render: inject real content into <body> for crawlers.
  // Google, Facebook, WhatsApp crawlers see actual HTML text — not an empty div#root.
  // React will hydrate over this content seamlessly.
  app.get("/", (_req, res) => {
    try {
      const htmlPath = path.resolve(distPath, "index.html");
      let html = fs.readFileSync(htmlPath, "utf-8");
      const preRender = `<div id="root" data-prerender="true"><header style="background:#fff;border-bottom:1px solid #e5e7eb;padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between;font-family:Cairo,sans-serif;direction:rtl"><a href="/" style="font-weight:900;font-size:1.25rem;color:#1B4FD8;text-decoration:none">WZZRD AI</a><nav style="display:flex;gap:1.5rem"><a href="/" style="color:#374151;text-decoration:none;font-size:0.9rem">الرئيسية</a><a href="/tools" style="color:#374151;text-decoration:none;font-size:0.9rem">الأدوات</a><a href="/pricing" style="color:#374151;text-decoration:none;font-size:0.9rem">الأسعار</a><a href="/blog" style="color:#374151;text-decoration:none;font-size:0.9rem">المدونة</a></nav></header><main style="font-family:Cairo,sans-serif;direction:rtl;background:#FAFAF5;min-height:100vh"><section style="text-align:center;padding:5rem 1.5rem 3rem;max-width:800px;margin:0 auto"><p style="color:#1B4FD8;font-weight:700;font-size:0.85rem;letter-spacing:0.1em;margin-bottom:1rem">أدوات تشخيص البراند بالذكاء الاصطناعي — للمؤسسين العرب</p><h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;color:#111827;line-height:1.15;margin-bottom:1.5rem">علامتك التجارية تستاهل أكتر —<br/><span style="color:#1B4FD8">اعرف وين المشكلة دلوقتي</span></h1><p style="font-size:1.1rem;color:#4B5563;max-width:600px;margin:0 auto 2rem;line-height:1.8">WZZRD AI بيحلل علامتك التجارية ويعطيك تقرير فوري بالمشاكل والحلول — بدل ما تدفع آلاف لوكالة وتنتظر أسابيع.</p><a href="/signup" style="background:#1B4FD8;color:#fff;padding:0.875rem 2rem;border-radius:9999px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">ابدأ التشخيص المجاني</a></section><section style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem"><h2 style="text-align:center;font-size:1.75rem;font-weight:800;color:#111827;margin-bottom:2rem">6 أدوات تشخيص متخصصة</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem"><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">تشخيص البراند الكامل</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">تقرير شامل عن نقاط القوة والضعف في علامتك التجارية — الهوية والرسالة والحضور الرقمي والعرض.</p><a href="/tools/brand-diagnosis" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">ابدأ التشخيص ←</a></article><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">فحص منطق العرض</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">هل عرضك واضح ومقنع؟ هل السعر مناسب؟ هل الـ value proposition قوي؟ اعرف الإجابة في دقيقة.</p><a href="/tools/offer-logic-check" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">افحص عرضك ←</a></article><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">فحص الرسالة التسويقية</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">رسالتك بتوصل للعميل الصح؟ هل الـ tone of voice مناسب؟ هل الـ copy بيبيع؟</p><a href="/tools/message-check" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">افحص رسالتك ←</a></article><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">فحص الحضور الرقمي</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">موقعك وسوشيال ميديا بيعكسوا براندك صح؟ هل الـ SEO شغّال؟ هل العميل بيلاقيك بسهولة؟</p><a href="/tools/digital-presence-check" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">افحص حضورك ←</a></article><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">لقطة الهوية البصرية</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">اللوجو والألوان والخطوط بتعبر عن براندك صح؟ هل الهوية البصرية متسقة على كل القنوات؟</p><a href="/tools/identity-snapshot" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">افحص هويتك ←</a></article><article style="background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:1.5rem"><h3 style="font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:0.5rem">جاهزية الإطلاق</h3><p style="color:#6B7280;font-size:0.9rem;line-height:1.7">قبل ما تطلق منتجك أو خدمتك الجديدة — اعرف هل براندك جاهز فعلاً أم لا.</p><a href="/tools/launch-readiness" style="color:#1B4FD8;font-weight:600;font-size:0.9rem;text-decoration:none">افحص جاهزيتك ←</a></article></div></section><section style="background:#1B4FD8;color:#fff;padding:3rem 1.5rem;text-align:center;margin-top:3rem"><h2 style="font-size:1.75rem;font-weight:800;margin-bottom:1rem">جاهز تعرف مشكلة براندك؟</h2><p style="font-size:1rem;opacity:0.9;margin-bottom:2rem">ابدأ مجاناً — مفيش credit card، مفيش انتظار، النتيجة في 30 ثانية.</p><a href="/signup" style="background:#fff;color:#1B4FD8;padding:0.875rem 2rem;border-radius:9999px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">ابدأ دلوقتي مجاناً</a></section></main></div>`;
      html = html.replace('<div id="root"></div>', preRender);
      res.status(200).set({ "Content-Type": "text/html", "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", "Surrogate-Control": "no-store", "X-WZZRD-SSR": "homepage" }).end(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });

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
      html = html.replaceAll(/<!-- WZZRD_BLOG_SEO_START -->[\s\S]*?<!-- WZZRD_BLOG_SEO_END -->/g, "");

      const wantsAr = typeof req.headers["accept-language"] === "string"
        ? req.headers["accept-language"].toLowerCase().includes("ar")
        : false;

      const seoTitleRaw = post
        ? ((wantsAr ? (post.seoTitleAr || post.titleAr) : (post.seoTitleEn || post.titleEn)) || "WZZRD AI Blog")
        : "WZZRD AI Blog";
      const seoDescRaw = post
        ? ((wantsAr ? post.seoDescAr : post.seoDescEn) || "")
        : "WZZRD AI Blog";
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
        `<!-- WZZRD_BLOG_SEO_START -->\n<meta name="description" content="${seoDesc}">\n<meta property="og:title" content="${seoTitle}">\n<meta property="og:description" content="${seoDesc}">\n<meta property="og:image" content="${ogImage}">\n<meta property="og:type" content="article">\n<meta name="twitter:card" content="summary_large_image">\n<!-- WZZRD_BLOG_SEO_END -->\n</head>`,
      );

      res
        .status(200)
        .set({
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Surrogate-Control": "no-store",
          "X-WZZRD-SEO": !db ? "no_db" : (post ? "injected" : "no_post"),
        })
        .end(html);
    } catch {
      next();
    }
  });

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Surrogate-Control", "no-store");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
