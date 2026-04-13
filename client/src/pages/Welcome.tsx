/**
 * Welcome.tsx — Sprint K: Arabic-first marketing home (`/`)
 * RTL when locale is Arabic (default via I18nProvider + localStorage).
 * Cream + cobalt palette; primary funnel CTA → /quick-check.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { useI18n } from "@/lib/i18n";

const C = {
  bg: "#FAFAF5",
  bgAlt: "#F4F3EE",
  surface: "#FFFFFF",
  blue: "#1B4FD8",
  blueDark: "#1239A6",
  blueLight: "#EEF2FF",
  blueGlow: "rgba(27,79,216,0.12)",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  red: "#DC2626",
  green: "#059669",
} as const;

const FONT = "'Cairo','Inter','Segoe UI',sans-serif";

const HERO_HEADLINE_AR = "اعرف صحة علامتك في ٦٠ ثانية — مجاناً";
const HERO_HEADLINE_EN = "Know your brand health in 60 seconds — free";
const HERO_SUB_AR =
  "فحص سريع بالذكاء الاصطناعي: موقعك، أهم الملاحظات، وخطوة تالية واضحة — بدون تسجيل معقد.";
const HERO_SUB_EN =
  "A fast AI check: your site, top issues, and a clear next step — no heavy signup flow.";

const LIVE_AR = [
  "مؤسس من القاهرة — فحص سريع — النتيجة: تحسينات واضحة على الصفحة الرئيسية",
  "شركة من الرياض — تقرير موجز في دقائق",
  "متجر من دبي — أولويات Lighthouse مرتبة حسب الأثر",
];
const LIVE_EN = [
  "Founder from Cairo — quick check — homepage fixes surfaced fast",
  "Company from Riyadh — brief report in minutes",
  "Store from Dubai — Lighthouse priorities ranked by impact",
];

const TOOL_DEFS = [
  {
    id: "brand-diagnosis",
    icon: "🔬",
    route: "/app/tools/brand-diagnosis",
    nameK: "pub.tool.brand.name",
    descK: "pub.tool.brand.desc",
  },
  {
    id: "offer-check",
    icon: "📦",
    route: "/app/tools/offer-check",
    nameK: "pub.tool.offer.name",
    descK: "pub.tool.offer.desc",
  },
  {
    id: "message-check",
    icon: "💬",
    route: "/app/tools/message-check",
    nameK: "pub.tool.message.name",
    descK: "pub.tool.message.desc",
  },
  {
    id: "presence-audit",
    icon: "🌐",
    route: "/app/tools/presence-audit",
    nameK: "pub.tool.presence.name",
    descK: "pub.tool.presence.desc",
  },
  {
    id: "identity-snapshot",
    icon: "🪞",
    route: "/app/tools/identity-snapshot",
    nameK: "pub.tool.identity.name",
    descK: "pub.tool.identity.desc",
  },
  {
    id: "launch-readiness",
    icon: "🚀",
    route: "/app/tools/launch-readiness",
    nameK: "pub.tool.launch.name",
    descK: "pub.tool.launch.desc",
  },
  {
    id: "benchmark",
    icon: "📊",
    route: "/app/tools/benchmark",
    nameK: "pub.tool.bench.name",
    descK: "pub.tool.bench.desc",
  },
] as const;

const CMP_AR = [
  { f: "التكلفة", w: "من ٩٩ ج.م للتقرير", a: "٥٠٠٠–٣٠٠٠٠ ج.م/شهر" },
  { f: "وقت التسليم", w: "دقائق", a: "٢–٤ أسابيع" },
  { f: "الشفافية", w: "أرقام وتفاصيل", a: "ملخص عام" },
  { f: "التحديث", w: "في أي وقت", a: "تكلفة إضافية" },
];
const CMP_EN = [
  { f: "Cost", w: "From ~$3 / report", a: "$1,500–$8,000/mo" },
  { f: "Delivery", w: "Minutes", a: "2–4 weeks" },
  { f: "Transparency", w: "Numbers + detail", a: "High-level summary" },
  { f: "Updates", w: "Anytime", a: "Extra fees" },
];

const STEP_KEYS = [
  { numK: "pub.how.s1.num", titleK: "pub.how.s1.title", descK: "pub.how.s1.desc" },
  { numK: "pub.how.s2.num", titleK: "pub.how.s2.title", descK: "pub.how.s2.desc" },
  { numK: "pub.how.s3.num", titleK: "pub.how.s3.title", descK: "pub.how.s3.desc" },
] as const;

const STAT_KEYS = [
  { arVal: "+٥٠٠", enVal: "500+", labelK: "pub.stats.diag", subK: "pub.stats.diagSub" },
  { arVal: "٩٣٪", enVal: "93%", labelK: "pub.stats.saving", subK: "pub.stats.savingSub" },
  { arVal: "٣٠ث", enVal: "30s", labelK: "pub.stats.time", subK: "pub.stats.timeSub" },
  { arVal: "٨", enVal: "8", labelK: "pub.stats.tools", subK: "pub.stats.toolsSub" },
] as const;

function LiveTicker({ isAr }: { isAr: boolean }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const feed = isAr ? LIVE_AR : LIVE_EN;

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIdx((p) => (p + 1) % feed.length);
        setPhase("in");
      }, 400);
    }, 4800);
    return () => clearInterval(cycle);
  }, [feed.length]);

  const slideStyle: React.CSSProperties = {
    transition: "opacity 0.4s ease, transform 0.4s ease",
    opacity: phase === "in" ? 1 : 0,
    transform: phase === "in" ? "translateY(0px)" : isAr ? "translateY(4px)" : "translateY(-4px)",
  };

  return (
    <div
      style={{
        background: "#0A0F1E",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        overflow: "hidden",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#F87171",
          fontSize: 10,
          fontWeight: 900,
          padding: "3px 9px",
          borderRadius: 4,
          letterSpacing: 0.8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#EF4444",
            display: "inline-block",
            animation: "wzzrd-pulse 1.5s infinite",
          }}
        />
        {isAr ? "مباشر" : "LIVE"}
      </span>
      <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
      <span
        style={{
          ...slideStyle,
          fontSize: 13,
          color: "rgba(255,255,255,0.75)",
          fontFamily: FONT,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {feed[idx]}
      </span>
      <span style={{ flexShrink: 0, fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: FONT, whiteSpace: "nowrap" }}>
        {idx + 1} / {feed.length}
      </span>
    </div>
  );
}

function NewsletterSection({ isAr }: { isAr: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* ignore */
    }
    setSent(true);
    setLoading(false);
  };
  return (
    <section style={{ background: C.blue, padding: "56px 24px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          {isAr ? "النشرة" : "Newsletter"}
        </p>
        <h2 style={{ fontSize: "clamp(20px,3vw,32px)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.3 }}>
          {isAr ? "نصائح براند أسبوعية — بدون ضجيج" : "Weekly brand tips — no noise"}
        </h2>
        {sent ? (
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 14,
              padding: "18px 24px",
              color: "#fff",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ✓ {isAr ? "تم الاشتراك!" : "Subscribed!"}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "بريدك الإلكتروني" : "Your email"}
              style={{
                flex: 1,
                minWidth: 210,
                padding: "13px 18px",
                borderRadius: 100,
                border: "2px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 15,
                outline: "none",
                fontFamily: FONT,
                direction: isAr ? "rtl" : "ltr",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#fff",
                color: C.blue,
                padding: "13px 26px",
                borderRadius: 100,
                fontWeight: 900,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                flexShrink: 0,
              }}
            >
              {loading ? "…" : isAr ? "اشترك" : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function FooterNewsletter({ t, isAr }: { t: (k: string) => string; isAr: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* ignore */
    }
    setDone(true);
  };
  if (done) return <p style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>✓ {isAr ? "تم!" : "Done!"}</p>;
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 6 }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("pub.footer.emailPlaceholder")}
        style={{
          flex: 1,
          padding: "9px 13px",
          borderRadius: 8,
          fontSize: 13,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff",
          outline: "none",
          fontFamily: FONT,
          direction: isAr ? "rtl" : "ltr",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "9px 15px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          color: "#fff",
          background: C.blue,
          border: "none",
          cursor: "pointer",
          fontFamily: FONT,
          whiteSpace: "nowrap",
        }}
      >
        {t("pub.footer.subscribe")}
      </button>
    </form>
  );
}

export default function Welcome() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      lang={locale}
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: isAr ? "'Cairo',sans-serif" : "'Inter',sans-serif",
      }}
    >
      <WzrdPublicHeader />
      <LiveTicker isAr={isAr} />

      <main>
        {/* Hero — primary CTA: Quick Check */}
        <section style={{ padding: "48px 24px 32px", textAlign: "center", background: `linear-gradient(180deg, ${C.blueLight} 0%, ${C.bg} 55%)` }}>
          <p style={{ fontSize: 12, color: C.blue, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
            {t("pub.hero.badge")}
          </p>
          <h1 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 900, color: C.text, lineHeight: 1.2, margin: "0 auto 16px", maxWidth: 720 }}>
            {isAr ? HERO_HEADLINE_AR : HERO_HEADLINE_EN}
          </h1>
          <p style={{ fontSize: "clamp(15px,2.4vw,18px)", color: C.muted, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.75 }}>
            {isAr ? HERO_SUB_AR : HERO_SUB_EN}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/quick-check")}
              style={{
                background: C.blue,
                color: "#fff",
                padding: "16px 32px",
                borderRadius: 100,
                fontWeight: 900,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                boxShadow: `0 8px 28px ${C.blueGlow}`,
              }}
            >
              {isAr ? "ابدأ الفحص السريع ←" : "Start quick check →"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/full-audit")}
              style={{
                background: C.surface,
                color: C.blue,
                padding: "14px 24px",
                borderRadius: 100,
                fontWeight: 700,
                fontSize: 15,
                border: `2px solid ${C.blue}`,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              {isAr ? "التحليل الشامل" : "Full brand audit"}
            </button>
          </div>
          <p style={{ fontSize: 13, color: C.muted, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <span>✓ {t("pub.hero.trust1")}</span>
            <span>✓ {isAr ? "موقع + Lighthouse عند توفر الرابط" : "Site + Lighthouse when URL provided"}</span>
            <span>✓ {t("pub.hero.trust3")}</span>
          </p>
        </section>

        {/* Stats */}
        <section style={{ padding: "24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            {STAT_KEYS.map((s) => (
              <div key={s.labelK} style={{ textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.blue }}>{isAr ? s.arVal : s.enVal}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{t(s.labelK)}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{t(s.subK)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "48px 24px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <p style={{ textAlign: "center", fontSize: 12, color: C.blue, fontWeight: 800, letterSpacing: 1.2, marginBottom: 8 }}>{t("pub.how.badge")}</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, marginBottom: 32 }}>
            {t("pub.how.h2")}
          </h2>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {STEP_KEYS.map((s) => (
              <div key={s.numK} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 20px", textAlign: isAr ? "right" : "left" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 8 }}>{t(s.numK)}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{t(s.titleK)}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 }}>{t(s.descK)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section style={{ padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 12, color: C.blue, fontWeight: 800, letterSpacing: 1.2, marginBottom: 8 }}>{t("pub.tools.badge")}</p>
            <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, marginBottom: 10 }}>{t("pub.tools.h2")}</h2>
            <p style={{ fontSize: 15, color: C.muted, maxWidth: 560, margin: "0 auto" }}>{t("pub.tools.sub")}</p>
          </div>
          <div className="wzzrd-tool-grid" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {TOOL_DEFS.map((tool) => (
              <a
                key={tool.id}
                href={tool.route}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(tool.route);
                }}
                style={{
                  display: "block",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "20px 18px",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  textAlign: isAr ? "right" : "left",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>{t(tool.nameK)}</h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>{t(tool.descK)}</p>
                <span style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 800, color: C.blue }}>
                  {isAr ? "افتح الأداة ←" : "Open tool →"}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section style={{ padding: "40px 24px", background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(20px,2.8vw,28px)", fontWeight: 900, marginBottom: 24 }}>
            {isAr ? "WZZRD AI مقابل الوكالة التقليدية" : "WZZRD AI vs traditional agency"}
          </h2>
          <div style={{ maxWidth: 720, margin: "0 auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, direction: dir }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: "12px 8px", textAlign: isAr ? "right" : "left" }}>{isAr ? "البند" : "Factor"}</th>
                  <th style={{ padding: "12px 8px", color: C.blue, textAlign: "center" }}>WZZRD AI</th>
                  <th style={{ padding: "12px 8px", textAlign: isAr ? "left" : "right", color: C.muted }}>{isAr ? "وكالة" : "Agency"}</th>
                </tr>
              </thead>
              <tbody>
                {(isAr ? CMP_AR : CMP_EN).map((row) => (
                  <tr key={row.f} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700 }}>{row.f}</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", color: C.green, fontWeight: 600 }}>{row.w}</td>
                    <td style={{ padding: "12px 8px", textAlign: isAr ? "left" : "right", color: C.muted }}>{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Brand strip (static) */}
        <section style={{ padding: "28px 24px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
          <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 700 }}>{t("pub.hero.trustedBy")}</p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px 18px",
              maxWidth: 900,
              margin: "0 auto",
              opacity: 0.85,
            }}
          >
            {["Noon", "Careem", "Salla", "Zid", "Jahez", "Tabby", "Foodics", "Unifonic"].map((b) => (
              <span key={b} style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.3 }}>
                {b}
              </span>
            ))}
          </div>
        </section>

        <NewsletterSection isAr={isAr} />

        {/* Final CTA */}
        <section style={{ background: "#111827", padding: "56px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,34px)", fontWeight: 900, color: "#fff", marginBottom: 12 }}>{t("pub.cta.h2")}</h2>
            <p style={{ fontSize: 15, color: "#9CA3AF", marginBottom: 28, lineHeight: 1.7 }}>{t("pub.cta.sub")}</p>
            <button
              type="button"
              onClick={() => navigate("/quick-check")}
              style={{
                background: C.blue,
                color: "#fff",
                padding: "16px 36px",
                borderRadius: 100,
                fontWeight: 900,
                fontSize: 17,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT,
                boxShadow: `0 6px 24px ${C.blueGlow}`,
              }}
            >
              {isAr ? "ابدأ الفحص السريع ←" : "Start quick check →"}
            </button>
            <p style={{ fontSize: 12, color: "#6B7280", marginTop: 14 }}>{t("pub.cta.trust")}</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: "#0D1117", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
                WZZ<span style={{ color: C.blue }}>RD</span> AI
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{t("pub.footer.tagline")}</p>
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, marginBottom: 12 }}>{t("pub.footer.tools")}</h4>
              {TOOL_DEFS.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.route}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(tool.route);
                  }}
                  style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, textDecoration: "none" }}
                >
                  {tool.icon} {t(tool.nameK)}
                </a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, marginBottom: 12 }}>{t("pub.footer.company")}</h4>
              {[
                { href: "/", label: t("pub.footer.home") },
                { href: "/quick-check", label: isAr ? "فحص سريع" : "Quick check" },
                { href: "/app/pricing", label: t("pub.footer.pricing") },
                { href: "/blog", label: t("pub.footer.blog") },
                { href: "/login", label: t("pub.footer.login") },
                { href: "/signup", label: t("pub.footer.signup") },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                  style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 8, textDecoration: "none" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, marginBottom: 12 }}>{t("pub.footer.newsletter")}</h4>
              <FooterNewsletter t={t} isAr={isAr} />
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            <span>© {new Date().getFullYear()} WZZRD AI — {t("pub.footer.rights")}</span>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate("/privacy"); }} style={{ color: "inherit", textDecoration: "none" }}>
                {t("pub.footer.privacy")}
              </a>
              <a href="/terms" onClick={(e) => { e.preventDefault(); navigate("/terms"); }} style={{ color: "inherit", textDecoration: "none" }}>
                {t("pub.footer.terms")}
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes wzzrd-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @media (max-width:768px) {
          .wzzrd-tool-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
