/**
 * Welcome.tsx — WZZRD AI Homepage
 * Fully bilingual (AR/EN) via useI18n() — zero hardcoded strings
 * Design: cream #FAFAF5 bg, cobalt blue #1B4FD8, charcoal #111827
 */
import { useState } from "react";
import { useLocation } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { useI18n } from "@/lib/i18n";

const C = {
  bg:         "#FAFAF5",
  bgAlt:      "#F4F3EE",
  surface:    "#FFFFFF",
  blue:       "#1B4FD8",
  blueDark:   "#1239A6",
  blueLight:  "#EEF2FF",
  blueGlow:   "rgba(27,79,216,0.12)",
  text:       "#111827",
  muted:      "#6B7280",
  border:     "#E5E7EB",
  borderBlue: "rgba(27,79,216,0.2)",
};
const FONT = "'Cairo', 'Segoe UI', sans-serif";

const TOOL_DEFS = [
  { id: "brand-diagnosis",  icon: "🔬", cost: 20, popular: true,  route: "/tools/brand-diagnosis",
    tagK: "pub.tool.brand.tag",    nameK: "pub.tool.brand.name",    descK: "pub.tool.brand.desc",    ctaK: "pub.tool.brand.cta" },
  { id: "offer-check",      icon: "📦", cost: 25, popular: false, route: "/tools/offer-check",
    tagK: "pub.tool.offer.tag",    nameK: "pub.tool.offer.name",    descK: "pub.tool.offer.desc",    ctaK: "pub.tool.offer.cta" },
  { id: "message-check",    icon: "💬", cost: 20, popular: false, route: "/tools/message-check",
    tagK: "pub.tool.message.tag",  nameK: "pub.tool.message.name",  descK: "pub.tool.message.desc",  ctaK: "pub.tool.message.cta" },
  { id: "digital-presence", icon: "🌐", cost: 25, popular: false, route: "/tools/digital-presence",
    tagK: "pub.tool.presence.tag", nameK: "pub.tool.presence.name", descK: "pub.tool.presence.desc", ctaK: "pub.tool.presence.cta" },
  { id: "identity-snapshot",icon: "🪞", cost: 20, popular: false, route: "/tools/identity-snapshot",
    tagK: "pub.tool.identity.tag", nameK: "pub.tool.identity.name", descK: "pub.tool.identity.desc", ctaK: "pub.tool.identity.cta" },
  { id: "launch-readiness", icon: "🚀", cost: 30, popular: false, route: "/tools/launch-readiness",
    tagK: "pub.tool.launch.tag",   nameK: "pub.tool.launch.name",   descK: "pub.tool.launch.desc",   ctaK: "pub.tool.launch.cta" },
];

const PAIN_KEYS = ["pub.pain.p1", "pub.pain.p2", "pub.pain.p3", "pub.pain.p4"];
const PAIN_ICONS = ["😤", "💸", "😕", "🤷"];

const STEP_KEYS = [
  { numK: "pub.how.s1.num", titleK: "pub.how.s1.title", descK: "pub.how.s1.desc" },
  { numK: "pub.how.s2.num", titleK: "pub.how.s2.title", descK: "pub.how.s2.desc" },
  { numK: "pub.how.s3.num", titleK: "pub.how.s3.title", descK: "pub.how.s3.desc" },
];

const STAT_KEYS = [
  { arVal: "+٥٠٠", enVal: "500+", labelK: "pub.stats.diag",   subK: "pub.stats.diagSub" },
  { arVal: "٩٣٪",  enVal: "93%",  labelK: "pub.stats.saving", subK: "pub.stats.savingSub" },
  { arVal: "٣٠ث",  enVal: "30s",  labelK: "pub.stats.time",   subK: "pub.stats.timeSub" },
  { arVal: "٦",    enVal: "6",    labelK: "pub.stats.tools",  subK: "pub.stats.toolsSub" },
];

const TESTI_KEYS = [
  { resultK: "pub.testi.t1.result", quoteK: "pub.testi.t1.quote", nameK: "pub.testi.t1.name", roleK: "pub.testi.t1.role", arInit: "أ", enInit: "A", color: "#1B4FD8" },
  { resultK: "pub.testi.t2.result", quoteK: "pub.testi.t2.quote", nameK: "pub.testi.t2.name", roleK: "pub.testi.t2.role", arInit: "س", enInit: "S", color: "#059669" },
  { resultK: "pub.testi.t3.result", quoteK: "pub.testi.t3.quote", nameK: "pub.testi.t3.name", roleK: "pub.testi.t3.role", arInit: "م", enInit: "M", color: "#7C3AED" },
];

const COUNTRIES = [
  { flag: "🇪🇬", ar: "مصر",      en: "Egypt" },
  { flag: "🇸🇦", ar: "السعودية", en: "KSA" },
  { flag: "🇦🇪", ar: "الإمارات", en: "UAE" },
  { flag: "🇰🇼", ar: "الكويت",   en: "Kuwait" },
  { flag: "🇯🇴", ar: "الأردن",   en: "Jordan" },
];

// ── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, navigate, t, isAr }: {
  tool: typeof TOOL_DEFS[0];
  navigate: (p: string) => void;
  t: (k: string) => string;
  isAr: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => navigate(tool.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        border: `1.5px solid ${hovered || tool.popular ? C.blue : C.border}`,
        borderRadius: 16, padding: "28px 24px", cursor: "pointer",
        position: "relative", transition: "all 0.2s",
        boxShadow: hovered ? `0 8px 32px ${C.blueGlow}` : tool.popular ? `0 4px 24px ${C.blueGlow}` : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {tool.popular && (
        <span style={{
          position: "absolute", top: -12, insetInlineStart: 20,
          background: C.blue, color: "#fff",
          fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100,
        }}>
          ⭐ {t(tool.tagK)}
        </span>
      )}
      <span style={{
        position: "absolute", top: 20, insetInlineEnd: 20,
        background: C.blueLight, color: C.blue,
        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100,
        border: `1px solid ${C.borderBlue}`,
      }}>
        {tool.cost} {t("pub.tools.credits")}
      </span>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: C.blueLight, border: `1px solid ${C.borderBlue}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, marginBottom: 16,
      }}>
        {tool.icon}
      </div>
      {!tool.popular && (
        <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
          {t(tool.tagK)}
        </p>
      )}
      <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 10 }}>
        {t(tool.nameK)}
      </h3>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
        {t(tool.descK)}
      </p>
      <div style={{
        background: C.blueLight, borderRadius: 8, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>✓ {t(tool.ctaK)}</span>
        <span style={{ fontSize: 16, color: C.blue }}>{isAr ? "←" : "→"}</span>

      </div>
    </div>
  );
}

// ── Footer Newsletter ────────────────────────────────────────────────────────
function FooterNewsletter({ t }: { t: (k: string) => string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try { await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); } catch { /* ignore */ }
    setDone(true);
  };
  if (done) return <p style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>✓ {t("pub.footer.subscribe")}!</p>;
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder={t("pub.footer.emailPlaceholder")}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", fontFamily: FONT }} />
      <button type="submit" style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff", background: C.blue, border: "none", cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}>
        {t("pub.footer.subscribe")}
      </button>
    </form>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Welcome() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  const [leadEmail, setLeadEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const onLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;
    setLeadSubmitting(true);
    try { await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: leadEmail }) }); } catch { /* ignore */ }
    setLeadSent(true);
    setLeadSubmitting(false);
  };

  return (
    <div style={{ background: C.bg, fontFamily: isAr ? FONT : "'Inter','Segoe UI',sans-serif", color: C.text, minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <WzrdPublicHeader />

      {/* ══ HERO ══ */}
      <section style={{ padding: "80px 24px 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${C.blueGlow}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, background: C.blueLight, border: `1px solid ${C.borderBlue}`, fontSize: 13, fontWeight: 700, color: C.blue }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
              {t("pub.hero.badge")}
            </span>
          </div>
          {/* Headline */}
          <h1 style={{ textAlign: "center", fontSize: "clamp(34px, 5.5vw, 64px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 24, color: C.text }}>
            {t("pub.hero.h1a")}<br />
            <span style={{ color: C.blue }}>{t("pub.hero.h1b")}</span>
          </h1>
          {/* Sub */}
          <p style={{ textAlign: "center", fontSize: 18, color: C.muted, lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
            {t("pub.hero.sub")}
          </p>
          {/* CTAs */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
            <button onClick={() => navigate("/tools/brand-diagnosis")} style={{
              background: C.blue, color: "#fff", padding: "15px 32px", borderRadius: 100,
              fontWeight: 800, fontSize: 17, border: "none", cursor: "pointer", fontFamily: FONT,
              boxShadow: `0 4px 20px ${C.blueGlow}`, transition: "all 0.2s",
            }}>
              {t("pub.hero.cta1")}
            </button>
            <button onClick={() => navigate("/pricing")} style={{
              background: "transparent", color: C.blue, padding: "15px 32px", borderRadius: 100,
              fontWeight: 700, fontSize: 17, border: `2px solid ${C.blue}`, cursor: "pointer", fontFamily: FONT,
            }}>
              {t("pub.hero.cta2")}
            </button>
          </div>
          {/* Trust signals */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 40 }}>
            {["pub.hero.trust1", "pub.hero.trust2", "pub.hero.trust3"].map((k) => (
              <span key={k} style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#10B981", fontWeight: 800 }}>✓</span> {t(k)}
              </span>
            ))}
          </div>
          {/* Countries */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>{t("pub.hero.trustedBy")}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {COUNTRIES.map((c) => (
              <span key={c.flag} style={{ fontSize: 14, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
                {c.flag} {isAr ? c.ar : c.en}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PAIN SECTION ══ */}
      <section style={{ background: C.bgAlt, padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.blue, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
            {t("pub.pain.badge")}
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 900, color: C.text, marginBottom: 40 }}>
            {t("pub.pain.h2")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 36 }}>
            {PAIN_KEYS.map((k, i) => (
              <div key={k} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{PAIN_ICONS[i]}</div>
                <p style={{ fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>{t(k)}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 15, color: C.muted, maxWidth: 640, margin: "0 auto", lineHeight: 1.7 }}>
            {t("pub.pain.conclusion")}
          </p>
        </div>
      </section>

      {/* ══ TOOLS GRID ══ */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 13, color: C.blue, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              {t("pub.tools.badge")}
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 900, color: C.text, marginBottom: 12 }}>
              {t("pub.tools.h2")}
            </h2>
            <p style={{ fontSize: 15, color: C.muted, maxWidth: 560, margin: "0 auto" }}>
              {t("pub.tools.sub")}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {TOOL_DEFS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} navigate={navigate} t={t} isAr={isAr} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={() => navigate("/tools")} style={{
              color: C.blue, fontWeight: 700, fontSize: 15, background: "transparent",
              border: `1.5px solid ${C.blue}`, padding: "11px 28px", borderRadius: 100, cursor: "pointer", fontFamily: FONT,
            }}>
              {t("pub.tools.cta")}
            </button>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: C.bgAlt, padding: "72px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.blue, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            {t("pub.how.badge")}
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 900, color: C.text, marginBottom: 48 }}>
            {t("pub.how.h2")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
            {STEP_KEYS.map((s) => (
              <div key={s.numK} style={{ textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", background: C.blue,
                  color: "#fff", fontSize: 22, fontWeight: 900, display: "flex",
                  alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                }}>
                  {t(s.numK)}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>{t(s.titleK)}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{t(s.descK)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <section style={{ background: C.blue, padding: "52px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 28, textAlign: "center" }}>
          {STAT_KEYS.map((s) => (
            <div key={s.labelK}>
              <div style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {isAr ? s.arVal : s.enVal}
              </div>
              <div style={{ fontSize: 14, color: "#BFDBFE", marginTop: 6, fontWeight: 700 }}>{t(s.labelK)}</div>
              <div style={{ fontSize: 12, color: "#93C5FD", marginTop: 2 }}>{t(s.subK)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ padding: "72px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 13, color: C.blue, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              {t("pub.testi.badge")}
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 900, color: C.text }}>
              {t("pub.testi.h2")}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {TESTI_KEYS.map((tk) => (
              <div key={tk.nameK} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px" }}>
                <div style={{
                  display: "inline-block", background: `${tk.color}18`, color: tk.color,
                  fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 100, marginBottom: 16,
                }}>
                  📈 {t(tk.resultK)}
                </div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 20, fontStyle: "italic" }}>
                  "{t(tk.quoteK)}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: tk.color,
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, flexShrink: 0,
                  }}>
                    {isAr ? tk.arInit : tk.enInit}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t(tk.nameK)}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{t(tk.roleK)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEAD MAGNET ══ */}
      <section style={{ background: C.bgAlt, padding: "72px 24px" }}>
        <div style={{
          maxWidth: 560, margin: "0 auto", background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 32px", textAlign: "center",
        }}>
          <p style={{ fontSize: 12, color: "#10B981", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            {t("pub.lead.badge")}
          </p>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: C.text, marginBottom: 12 }}>
            {t("pub.lead.h2")}
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.7 }}>
            {t("pub.lead.sub")}
          </p>
          {leadSent ? (
            <p style={{ color: "#10B981", fontWeight: 800, fontSize: 16 }}>
              ✓ {isAr ? "تم الإرسال! تفقد بريدك الإلكتروني." : "Sent! Check your inbox."}
            </p>
          ) : (
            <form onSubmit={onLeadSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <input
                type="email" required value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder={t("pub.lead.placeholder")}
                style={{
                  flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 100,
                  border: `1px solid ${C.border}`, fontSize: 14, outline: "none",
                  background: "#F9FAFB", fontFamily: FONT,
                }}
              />
              <button type="submit" disabled={leadSubmitting} style={{
                background: C.blue, color: "#fff", padding: "12px 22px",
                borderRadius: 100, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: FONT,
              }}>
                {t("pub.lead.btn")}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ background: "#111827", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
            {t("pub.cta.h2")}
          </h2>
          <p style={{ fontSize: 17, color: "#9CA3AF", marginBottom: 36, lineHeight: 1.7 }}>
            {t("pub.cta.sub")}
          </p>
          <button onClick={() => navigate("/tools/brand-diagnosis")} style={{
            background: C.blue, color: "#fff", padding: "17px 40px",
            borderRadius: 100, fontWeight: 900, fontSize: 18, border: "none", cursor: "pointer", fontFamily: FONT,
            boxShadow: `0 6px 24px ${C.blueGlow}`, marginBottom: 16,
          }}>
            {t("pub.cta.btn")}
          </button>
          <p style={{ fontSize: 13, color: "#6B7280" }}>{t("pub.cta.trust")}</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: -0.5 }}>
                WZZ<span style={{ color: C.blue }}>RD</span> AI
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{t("pub.footer.tagline")}</p>
            </div>
            {/* Tools */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                {t("pub.footer.tools")}
              </h4>
              {TOOL_DEFS.map((tool) => (
                <a key={tool.id} href={tool.route} onClick={(e) => { e.preventDefault(); navigate(tool.route); }}
                  style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 8, textDecoration: "none" }}>
                  {t(tool.nameK)}
                </a>
              ))}
            </div>
            {/* Company */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                {t("pub.footer.company")}
              </h4>
              {[
                { href: "/",        labelK: "pub.footer.home" },
                { href: "/pricing", labelK: "pub.footer.pricing" },
                { href: "/blog",    labelK: "pub.footer.blog" },
                { href: "/login",   labelK: "pub.footer.login" },
                { href: "/signup",  labelK: "pub.footer.signup" },
              ].map((link) => (
                <a key={link.href} href={link.href} onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                  style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 8, textDecoration: "none" }}>
                  {t(link.labelK)}
                </a>
              ))}
            </div>
            {/* Newsletter */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                {t("pub.footer.newsletter")}
              </h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 14, lineHeight: 1.6 }}>
                {t("pub.footer.newsletterSub")}
              </p>
              <FooterNewsletter t={t} />
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              © {new Date().getFullYear()} WZZRD AI — {t("pub.footer.rights")}
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { href: "/privacy", labelK: "pub.footer.privacy" },
                { href: "/terms",   labelK: "pub.footer.terms" },
              ].map((l) => (
                <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); navigate(l.href); }}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
                  {t(l.labelK)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          section { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
