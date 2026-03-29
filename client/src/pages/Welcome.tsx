/**
 * Welcome.tsx — WZZRD AI Homepage
 * Design: warm cream bg (#FAFAF5), cobalt blue (#1B4FD8), charcoal text (#111827)
 * RTL Arabic-first, all 6 tools displayed and selling
 */

import { useState } from "react";
import { useLocation } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";

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

const TOOLS = [
  {
    id: "brand_diagnosis",
    icon: "🔬",
    nameAr: "تشخيص البراند",
    tagAr: "الأكثر طلباً",
    descAr: "اعرف نتيجة صحة علامتك التجارية في 30 ثانية — مع تقرير مفصّل بأهم المشاكل والحلول.",
    benefitAr: "ابدأ من هنا لو حاسس إن في حاجة غلط",
    cost: 20,
    route: "/tools/brand-diagnosis",
    popular: true,
  },
  {
    id: "offer_check",
    icon: "📦",
    nameAr: "فحص منطق العرض",
    tagAr: "لو المبيعات ضعيفة",
    descAr: "هل عرضك واضح؟ تسعيرك منطقي؟ الأداة دي بتكشف ليه العملاء بيقولوا 'هفكّر' وبتديك الحل.",
    benefitAr: "حوّل الـ 'هفكّر' لـ 'اشتريت'",
    cost: 25,
    route: "/tools/offer-check",
    popular: false,
  },
  {
    id: "message_check",
    icon: "💬",
    nameAr: "فحص الرسالة",
    tagAr: "هوية واضحة",
    descAr: "رسالتك متسقة في كل مكان؟ الأداة بتفحص الـ bio والموقع والمحتوى وبتديك تقرير الاتساق.",
    benefitAr: "خلي جمهورك يفهم قيمتك من أول نظرة",
    cost: 20,
    route: "/tools/message-check",
    popular: false,
  },
  {
    id: "presence_audit",
    icon: "🌐",
    nameAr: "فحص الحضور الرقمي",
    tagAr: "سوشيال + ويب",
    descAr: "الغريب بيشوف إيه لما يبحث عنك؟ فحص شامل للإنستجرام والموقع وقنوات التواصل.",
    benefitAr: "اعرف فجواتك قبل ما يعرفها منافسك",
    cost: 25,
    route: "/tools/presence-audit",
    popular: false,
  },
  {
    id: "identity_snapshot",
    icon: "🪞",
    nameAr: "لقطة الهوية",
    tagAr: "شخصية البراند",
    descAr: "شخصية البراند بتاعتك بتجذب النوع الصح من العملاء؟ أو بتبدو أرخص من المنتج الفعلي؟",
    benefitAr: "اجذب العميل المثالي بشكل تلقائي",
    cost: 20,
    route: "/tools/identity-snapshot",
    popular: false,
  },
  {
    id: "launch_readiness",
    icon: "🚀",
    nameAr: "جاهزية الإطلاق",
    tagAr: "قبل ما تصرف فلوس",
    descAr: "أد إيه أنت فعلاً جاهز تنزل السوق؟ شغّل الأداة دي قبل أي إنفاق على ماركتينج.",
    benefitAr: "وفّر آلاف الجنيهات من الإنفاق الخاطئ",
    cost: 30,
    route: "/tools/launch-readiness",
    popular: false,
  },
];

const STEPS = [
  {
    n: "١",
    title: "اختار الأداة المناسبة",
    desc: "٦ أدوات تشخيصية متخصصة — كل أداة بتحل مشكلة محددة. ابدأ بتشخيص البراند لو مش عارف من فين.",
  },
  {
    n: "٢",
    title: "أجب على الأسئلة",
    desc: "أسئلة ذكية ومحددة عن بزنسك — مش استبيان ممل. الـ AI بيفهم السياق ويحلل بعمق.",
  },
  {
    n: "٣",
    title: "استلم تقريرك الفوري",
    desc: "تقرير مفصّل بالمشاكل المكتشفة والحلول العملية — جاهز للتنفيذ على طول.",
  },
];

const STATS = [
  { num: "+٥٠٠", label: "تشخيص اتعمل", sub: "في أول ٣٠ يوم" },
  { num: "٩٣٪",  label: "توفير مقارنة بالوكالات", sub: "في التكلفة" },
  { num: "٣٠ث",  label: "وقت التشخيص الأولي", sub: "نتيجة فورية" },
  { num: "٦",    label: "أدوات تشخيصية", sub: "متخصصة ومتكاملة" },
];

const TESTIMONIALS = [
  {
    quote: "WZZRD AI ساعدتني أكتشف إن رسالتي التسويقية مش واضحة — وده كان سبب ضعف المبيعات. بعد التقرير غيّرت الـ bio وزاد التفاعل ٣ أضعاف.",
    name: "أحمد خالد",
    title: "مؤسس متجر إلكتروني",
    result: "×٣ تفاعل",
  },
  {
    quote: "جربت الأداة قبل إطلاق منتجي الجديد — اكتشفت ٤ مشاكل في التسعير والعرض. وفّرت عليّ آلاف الجنيهات من الإنفاق الخاطئ.",
    name: "سارة محمود",
    title: "مؤسسة براند أزياء",
    result: "وفّرت آلاف الجنيهات",
  },
  {
    quote: "التقرير كان أعمق من استشارة وكالة دفعت فيها ٥٠٠٠ جنيه. الـ AI فهم بزنسي وديني حلول عملية فعلاً.",
    name: "محمد عمر",
    title: "صاحب شركة خدمات",
    result: "أعمق من استشارة بـ٥٠٠٠ج",
  },
];

// ─── Tool Card ────────────────────────────────────────────────────────────────
function ToolCard({ tool, navigate }: { tool: typeof TOOLS[0]; navigate: (p: string) => void }) {
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
          position: "absolute", top: -12, right: 20,
          background: C.blue, color: "#fff",
          fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100,
        }}>
          ⭐ الأكثر طلباً
        </span>
      )}
      <span style={{
        position: "absolute", top: 20, left: 20,
        background: C.blueLight, color: C.blue,
        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100,
        border: `1px solid ${C.borderBlue}`,
      }}>
        {tool.cost} كريدت
      </span>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: C.blueLight, border: `1px solid ${C.borderBlue}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, marginBottom: 16,
      }}>
        {tool.icon}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
        {tool.tagAr}
      </p>
      <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 10 }}>
        {tool.nameAr}
      </h3>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
        {tool.descAr}
      </p>
      <div style={{
        background: C.blueLight, borderRadius: 8, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>✓ {tool.benefitAr}</span>
        <span style={{ fontSize: 16, color: C.blue }}>←</span>
      </div>
    </div>
  );
}

// ─── Footer Newsletter ────────────────────────────────────────────────────────
function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try { await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); } catch { /* ignore */ }
    setDone(true);
  };
  if (done) return <p style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>✓ تم الاشتراك! شكراً</p>;
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني"
        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", outline: "none", fontFamily: FONT }} />
      <button type="submit" style={{ padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff", background: C.blue, border: "none", cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" }}>
        اشترك
      </button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Welcome() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try { await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); } catch { /* ignore */ }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div style={{ background: C.bg, fontFamily: FONT, direction: "rtl", color: C.text, minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <WzrdPublicHeader />

      {/* ══ HERO ══ */}
      <section style={{ padding: "80px 24px 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${C.blueGlow}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, background: C.blueLight, border: `1px solid ${C.borderBlue}`, fontSize: 13, fontWeight: 700, color: C.blue }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
              أدوات تشخيص البراند بالذكاء الاصطناعي — للمؤسسين العرب
            </span>
          </div>
          {/* Headline */}
          <h1 style={{ textAlign: "center", fontSize: "clamp(34px, 5.5vw, 64px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 24, color: C.text }}>
            علامتك التجارية تستاهل أكتر —<br />
            <span style={{ color: C.blue }}>اعرف وين المشكلة</span> دلوقتي
          </h1>
          {/* Sub */}
          <p style={{ textAlign: "center", fontSize: 18, color: C.muted, lineHeight: 1.8, maxWidth: 600, margin: "0 auto 36px" }}>
            WZZRD AI بيحلل علامتك التجارية بعمق ويديك تقرير فوري بالمشاكل والحلول —
            بدل ما تدفع آلاف الجنيهات لوكالة وتستنى أسابيع.
          </p>
          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <a href="/tools/brand-diagnosis" onClick={(e) => { e.preventDefault(); navigate("/tools/brand-diagnosis"); }}
              style={{ padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 800, color: "#fff", background: C.blue, textDecoration: "none", boxShadow: `0 4px 20px ${C.blueGlow}` }}>
              ابدأ تشخيص مجاني ←
            </a>
            <a href="/pricing" onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}
              style={{ padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, color: C.blue, background: C.blueLight, border: `1.5px solid ${C.borderBlue}`, textDecoration: "none" }}>
              شوف الأسعار
            </a>
          </div>
          {/* Trust */}
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {["✓ بدون بطاقة ائتمان", "✓ نتيجة في أقل من دقيقة", "✓ تقرير باللغة العربية"].map((t) => (
              <span key={t} style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF BAR ══ */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>يثق بنا مؤسسون من</p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", alignItems: "center", flexWrap: "wrap", opacity: 0.55 }}>
            {["🇪🇬 مصر", "🇸🇦 السعودية", "🇦🇪 الإمارات", "🇰🇼 الكويت", "🇯🇴 الأردن"].map((c) => (
              <span key={c} style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROBLEM STATEMENT ══ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>هل ده بيحصل معاك؟</p>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 48, color: C.text }}>
            بتصرف على ماركتينج ومش شايف نتيجة؟
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { icon: "😤", prob: "الناس مش فاهمة إيه اللي بتقدمه بالظبط" },
              { icon: "💸", prob: "بتصرف على إعلانات بس الـ conversion ضعيف" },
              { icon: "😕", prob: "البراند بتاعك بيبدو أرخص من قيمته الحقيقية" },
              { icon: "🤷", prob: "مش عارف من فين تبدأ تصلح الموضوع" },
            ].map((item) => (
              <div key={item.prob} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 20px", display: "flex", gap: 14, alignItems: "flex-start", textAlign: "right" }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <p style={{ fontSize: 15, color: C.text, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{item.prob}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 40, fontSize: 17, color: C.muted, lineHeight: 1.8 }}>
            المشكلة مش في المنتج — المشكلة في{" "}
            <strong style={{ color: C.text }}>تشخيص غلط أو غياب التشخيص خالص.</strong>
            <br />WZZRD AI بيديك التشخيص الصح في دقائق.
          </p>
        </div>
      </section>

      {/* ══ TOOLS GRID ══ */}
      <section style={{ background: C.bgAlt, padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>أدواتنا التشخيصية</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, lineHeight: 1.3, color: C.text, marginBottom: 14 }}>
              ٦ أدوات — كل أداة بتحل مشكلة محددة
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520, margin: "0 auto" }}>
              مش أداة واحدة تعمل كل حاجة — كل أداة متخصصة في جانب معين من البراند عشان التشخيص يكون دقيق.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} navigate={navigate} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <a href="/tools" onClick={(e) => { e.preventDefault(); navigate("/tools"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, color: C.blue, background: C.blueLight, border: `1.5px solid ${C.borderBlue}`, textDecoration: "none" }}>
              شوف كل الأدوات ←
            </a>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>إزاي بيشتغل</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, lineHeight: 1.3, color: C.text }}>٣ خطوات وتقريرك جاهز</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, margin: "0 auto 20px", boxShadow: `0 4px 16px ${C.blueGlow}` }}>
                  {step.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ background: C.blue, padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center" }}>
            {STATS.map((s) => (
              <div key={s.num}>
                <div style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 8 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ padding: "80px 24px", background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>قصص نجاح عملائنا</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: C.text }}>ناس حقيقية — نتايج حقيقية</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                <span style={{ display: "inline-block", background: "#DCFCE7", color: "#16A34A", fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 100, alignSelf: "flex-start" }}>
                  📈 {t.result}
                </span>
                <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.blueLight, border: `2px solid ${C.borderBlue}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: C.blue }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEAD MAGNET ══ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: C.surface, border: `1.5px solid ${C.borderBlue}`, borderRadius: 20, padding: "48px 40px", boxShadow: `0 8px 40px ${C.blueGlow}`, display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0, width: 120, height: 160, background: `linear-gradient(135deg, ${C.blue}, #1239A6)`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: "#fff", boxShadow: `0 12px 32px ${C.blueGlow}`, transform: "perspective(600px) rotateY(-8deg)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, letterSpacing: 1, marginBottom: 8 }}>WZZRD AI</div>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.3)", marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.4 }}>دليل بناء علامة لا تُقهر</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 10 }}>2026 — مجاناً</div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ display: "inline-block", background: "#DCFCE7", color: "#16A34A", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100, marginBottom: 12 }}>مجاناً تماماً</span>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>حمّل دليل العلامة التجارية 2026</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
                ١٢ صفحة من الاستراتيجيات العملية لبناء علامة تجارية قوية في السوق العربي.
              </p>
              {sent ? (
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "14px 18px", fontSize: 14, fontWeight: 700, color: "#16A34A" }}>
                  ✓ تم الإرسال! سيصلك الدليل على بريدك قريباً
                </div>
              ) : (
                <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" disabled={submitting}
                    style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 8, fontSize: 14, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: "none", fontFamily: FONT }} />
                  <button type="submit" disabled={submitting} style={{ padding: "12px 22px", borderRadius: 8, fontSize: 14, fontWeight: 800, color: "#fff", background: C.blue, border: "none", cursor: "pointer", fontFamily: FONT }}>
                    أرسل لي الدليل
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.blue, marginBottom: 16 }}>ابدأ دلوقتي</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, lineHeight: 1.2, color: C.text, marginBottom: 16 }}>علامتك تستاهل أكتر من كده</h2>
          <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.8, marginBottom: 36 }}>
            آلاف المؤسسين في المنطقة العربية بيستخدموا WZZRD AI عشان يبنوا علامات تجارية تبيع — مش بس تبدو كويسة.
          </p>
          <a href="/signup" onClick={(e) => { e.preventDefault(); navigate("/signup"); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", borderRadius: 12, fontSize: 17, fontWeight: 900, color: "#fff", background: C.blue, textDecoration: "none", boxShadow: `0 6px 28px ${C.blueGlow}` }}>
            ابدأ تشخيص مجاني الآن ←
          </a>
          <p style={{ marginTop: 16, fontSize: 13, color: C.muted }}>لا بطاقة ائتمان — لا التزامات — نتيجة في دقائق</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: C.text, color: "rgba(255,255,255,0.7)", padding: "56px 24px 32px", fontFamily: FONT }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} dir="rtl">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 48 }}>
            <div>
              <img src="/logo.webp" alt="WZZRD AI" style={{ height: 36, marginBottom: 16, filter: "brightness(0) invert(1)" }} />
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", maxWidth: 240 }}>
                منصة تشخيص العلامة التجارية بالذكاء الاصطناعي — للمؤسسين العرب الطموحين.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>الأدوات</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "تشخيص البراند", href: "/tools/brand-diagnosis" },
                  { label: "فحص العرض", href: "/tools/offer-check" },
                  { label: "فحص الرسالة", href: "/tools/message-check" },
                  { label: "فحص الحضور", href: "/tools/presence-audit" },
                  { label: "لقطة الهوية", href: "/tools/identity-snapshot" },
                  { label: "جاهزية الإطلاق", href: "/tools/launch-readiness" },
                ].map((l) => (
                  <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); navigate(l.href); }}
                    style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>الشركة</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "الرئيسية", href: "/" },
                  { label: "الأسعار", href: "/pricing" },
                  { label: "المدونة", href: "/blog" },
                  { label: "تسجيل الدخول", href: "/login" },
                  { label: "إنشاء حساب", href: "/signup" },
                ].map((l) => (
                  <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); navigate(l.href); }}
                    style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>النشرة الأسبوعية</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 16 }}>
                استراتيجيات تسويقية ونصائح بناء البراند — كل أسبوع على بريدك.
              </p>
              <FooterNewsletter />
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>© 2026 WZZRD AI — جميع الحقوق محفوظة</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["سياسة الخصوصية", "شروط الاستخدام"].map((l) => (
                <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{l}</a>
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
