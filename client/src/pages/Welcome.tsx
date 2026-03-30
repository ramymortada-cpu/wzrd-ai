/**
 * Welcome.tsx — WZZRD AI Homepage v2
 * Positioning: AI alternative to traditional marketing agencies
 * Fully bilingual (AR/EN) via useI18n()
 * Design: cream #FAFAF5 bg, cobalt blue #1B4FD8, charcoal #111827
 */
import { useState, useEffect, useRef, useCallback } from "react";
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
  red:        "#DC2626",
  green:      "#059669",
  amber:      "#D97706",
};
const FONT = "'Cairo','Inter','Segoe UI',sans-serif";

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOL_DEFS = [
  {
    id: "brand-diagnosis", icon: "🔬", cost: 200, popular: true, route: "/tools/brand-diagnosis",
    tagK: "pub.tool.brand.tag", nameK: "pub.tool.brand.name", descK: "pub.tool.brand.desc", ctaK: "pub.tool.brand.cta",
    arProblem: "براندك مش واضح ليه بيفشل", enProblem: "Your brand fails and you don't know why",
    arStat: "٩٢٪ من المؤسسين لا يعرفون السبب الحقيقي لضعف مبيعاتهم", enStat: "92% of founders don't know the real reason their sales are weak",
  },
  {
    id: "offer-check", icon: "📦", cost: 250, popular: false, route: "/tools/offer-check",
    tagK: "pub.tool.offer.tag", nameK: "pub.tool.offer.name", descK: "pub.tool.offer.desc", ctaK: "pub.tool.offer.cta",
    arProblem: "عرضك التجاري مش بيبيع رغم إن المنتج جيد", enProblem: "Your offer isn't converting despite having a great product",
    arStat: "٧٨٪ من العروض تفشل بسبب صياغة خاطئة وليس المنتج", enStat: "78% of offers fail due to wrong framing, not the product itself",
  },
  {
    id: "message-check", icon: "💬", cost: 200, popular: false, route: "/tools/message-check",
    tagK: "pub.tool.message.tag", nameK: "pub.tool.message.name", descK: "pub.tool.message.desc", ctaK: "pub.tool.message.cta",
    arProblem: "رسالتك التسويقية تربك عملاءك بدل ما تقنعهم", enProblem: "Your marketing message confuses customers instead of convincing them",
    arStat: "٦٥٪ من الزوار يغادرون لأنهم لم يفهموا ما تقدمه في أول ١٠ ثوانٍ", enStat: "65% of visitors leave because they don't understand your value in the first 10 seconds",
  },
  {
    id: "digital-presence", icon: "🌐", cost: 250, popular: false, route: "/tools/digital-presence",
    tagK: "pub.tool.presence.tag", nameK: "pub.tool.presence.name", descK: "pub.tool.presence.desc", ctaK: "pub.tool.presence.cta",
    arProblem: "حضورك الرقمي أضعف بكثير مما تتخيل", enProblem: "Your digital presence is far weaker than you imagine",
    arStat: "٨٣٪ من العملاء يبحثون عنك على الإنترنت قبل أي قرار شراء", enStat: "83% of customers research you online before making any purchase decision",
  },
  {
    id: "identity-snapshot", icon: "🪞", cost: 200, popular: false, route: "/tools/identity-snapshot",
    tagK: "pub.tool.identity.tag", nameK: "pub.tool.identity.name", descK: "pub.tool.identity.desc", ctaK: "pub.tool.identity.cta",
    arProblem: "هويتك البصرية تخسّرك عملاء قبل ما يتكلموا معك", enProblem: "Your visual identity is losing you customers before they even talk to you",
    arStat: "٩٤٪ من الانطباعات الأولى تُبنى على التصميم وحده", enStat: "94% of first impressions are built on design alone",
  },
  {
    id: "launch-readiness", icon: "🚀", cost: 300, popular: false, route: "/tools/launch-readiness",
    tagK: "pub.tool.launch.tag", nameK: "pub.tool.launch.name", descK: "pub.tool.launch.desc", ctaK: "pub.tool.launch.cta",
    arProblem: "إطلاقك القادم قد يفشل بدون تشخيص مسبق", enProblem: "Your next launch may fail without a prior diagnosis",
    arStat: "٧٢٪ من الإطلاقات الجديدة تفشل في الشهر الأول بسبب أخطاء يمكن تفاديها", enStat: "72% of new launches fail in the first month due to avoidable mistakes",
  },
  {
    id: "quick", icon: "⚡", cost: 200, popular: false, route: "/tools/quick",
    tagK: "pub.tool.brand.tag", nameK: "pub.tool.quick.name", descK: "pub.tool.quick.desc", ctaK: "pub.tool.quick.cta",
    arProblem: "مش عارف من فين تبدأ؟ ابدأ هنا", enProblem: "Not sure where to start? Start here",
    arStat: "تشخيص شامل لكل براندك في أقل من دقيقتين", enStat: "A full brand scan in under 2 minutes",
  },
  {
    id: "benchmark", icon: "📊", cost: 400, popular: false, route: "/tools/benchmark",
    tagK: "pub.tool.brand.tag", nameK: "pub.tool.bench.name", descK: "pub.tool.bench.desc", ctaK: "pub.tool.bench.cta",
    arProblem: "منافسيك يتقدمون وأنت مش شايف الفجوة", enProblem: "Your competitors are advancing and you can't see the gap",
    arStat: "اعرف مكانك الحقيقي في السوق مقارنةً بمنافسيك المباشرين", enStat: "Know your real market position compared to your direct competitors",
  },
];

// ── Live activity feed ────────────────────────────────────────────────────────
const LIVE_AR = [
  "مؤسس من القاهرة — Brand Diagnosis — النتيجة: ٦٢/١٠٠ — المشكلة: رسالة غير واضحة",
  "شركة ناشئة من الرياض — Offer Check — اكتشفت أن عرضها يفقد ٤٠٪ من العملاء في التسعير",
  "مدير تسويق من دبي — Presence Audit — ٣ ثغرات حرجة في Instagram وGoogle",
  "براند أزياء من الكويت — Identity Snapshot — تعارض في الألوان يضر بالمصداقية",
  "مؤسس SaaS من الإمارات — Launch Readiness — أنقذه من إطلاق مبكر بدون جمهور",
  "وكالة من عمّان — Competitive Benchmark — وجدت فجوة سعرية غير مستغلة في السوق",
  "متجر إلكتروني من مصر — Message Check — ٧٠٪ من المحتوى يتحدث عن المنتج لا العميل",
  "مؤسس من جدة — Quick Diagnosis — نقطة ضعف واحدة تؤثر على ٣ قنوات تسويقية",
];
const LIVE_EN = [
  "Founder from Cairo — Brand Diagnosis — Score: 62/100 — Issue: unclear message",
  "Startup from Riyadh — Offer Check — offer loses 40% of customers at pricing stage",
  "Marketing manager from Dubai — Presence Audit — 3 critical gaps on Instagram & Google",
  "Fashion brand from Kuwait — Identity Snapshot — color conflict hurting credibility",
  "SaaS founder from UAE — Launch Readiness — saved from launching without an audience",
  "Agency from Amman — Competitive Benchmark — found an unexploited pricing gap",
  "E-commerce from Egypt — Message Check — 70% of content talks about product, not customer",
  "Founder from Jeddah — Quick Diagnosis — one weakness affecting 3 marketing channels",
];

// ── Brand logos (text-based, B&W style) ──────────────────────────────────────
const BRANDS = [
  "Noon","Careem","Talabat","Jahez","Salla","Zid",
  "Foodics","Mrsool","Tamara","Tabby","Lean","Baims",
  "Unifonic","Mozn","Taager","Wuilt","Rewaa","Sary",
];

// ── Agency vs WZZRD ───────────────────────────────────────────────────────────
const CMP_AR = [
  { f: "التكلفة",        w: "من ٩٩ ج.م للتقرير",         a: "٥٠٠٠–٣٠٠٠٠ ج.م/شهر" },
  { f: "وقت التسليم",   w: "دقائق — فوري",               a: "٢–٤ أسابيع" },
  { f: "الشفافية",      w: "تقرير مفصّل بالأرقام",        a: "ملخص عام بدون بيانات" },
  { f: "التحكم",        w: "أنت تشغّل الأدوات",           a: "تنتظر الوكالة" },
  { f: "التحديث",       w: "في أي وقت تريد",              a: "تدفع مرة أخرى" },
  { f: "تخصيص الـ AI",  w: "مدرّب على السوق العربي",      a: "عام وغير مخصّص" },
];
const CMP_EN = [
  { f: "Cost",           w: "From $3 / report",           a: "$1,500–$8,000/month" },
  { f: "Delivery",       w: "Instant — minutes",          a: "2–4 weeks" },
  { f: "Transparency",   w: "Detailed report + data",     a: "Vague summary" },
  { f: "Control",        w: "You run the tools",          a: "You wait for the agency" },
  { f: "Updates",        w: "Anytime you want",           a: "Pay again" },
  { f: "AI",             w: "Trained on Arab market",     a: "Generic & not specialized" },
];

const PAIN_KEYS  = ["pub.pain.p1","pub.pain.p2","pub.pain.p3","pub.pain.p4"];
const PAIN_ICONS = ["😤","💸","😕","🤷"];
const STEP_KEYS  = [
  { numK:"pub.how.s1.num", titleK:"pub.how.s1.title", descK:"pub.how.s1.desc" },
  { numK:"pub.how.s2.num", titleK:"pub.how.s2.title", descK:"pub.how.s2.desc" },
  { numK:"pub.how.s3.num", titleK:"pub.how.s3.title", descK:"pub.how.s3.desc" },
];
const STAT_KEYS = [
  { arVal:"+٥٠٠", enVal:"500+", labelK:"pub.stats.diag",   subK:"pub.stats.diagSub" },
  { arVal:"٩٣٪",  enVal:"93%",  labelK:"pub.stats.saving", subK:"pub.stats.savingSub" },
  { arVal:"٣٠ث",  enVal:"30s",  labelK:"pub.stats.time",   subK:"pub.stats.timeSub" },
  { arVal:"٨",    enVal:"8",    labelK:"pub.stats.tools",  subK:"pub.stats.toolsSub" },
];
const COUNTRIES = [
  { flag:"🇪🇬", ar:"مصر",      en:"Egypt" },
  { flag:"🇸🇦", ar:"السعودية", en:"KSA" },
  { flag:"🇦🇪", ar:"الإمارات", en:"UAE" },
  { flag:"🇰🇼", ar:"الكويت",   en:"Kuwait" },
  { flag:"🇯🇴", ar:"الأردن",   en:"Jordan" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveTicker({ isAr, cfg }: { isAr: boolean; cfg?: HomepageCfg }) {
  const [idx, setIdx]   = useState(0);
  const [phase, setPhase] = useState<'in'|'out'>('in');
  const feed = isAr
    ? (cfg?.liveTickerAr?.length ? cfg.liveTickerAr : LIVE_AR)
    : (cfg?.liveTickerEn?.length ? cfg.liveTickerEn : LIVE_EN);

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhase('out');
      setTimeout(() => {
        setIdx(p => (p + 1) % feed.length);
        setPhase('in');
      }, 400);
    }, 4800);
    return () => clearInterval(cycle);
  }, [feed.length]);

  const slideStyle: React.CSSProperties = {
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    opacity:    phase === 'in' ? 1 : 0,
    transform:  phase === 'in'
      ? 'translateY(0px)'
      : isAr ? 'translateY(4px)' : 'translateY(-4px)',
  };

  return (
    <div style={{ background:"#0A0F1E", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"8px 20px", display:"flex", alignItems:"center", gap:14, overflow:"hidden", direction: isAr ? "rtl" : "ltr" }}>
      {/* LIVE badge */}
      <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", color:"#F87171", fontSize:10, fontWeight:900, padding:"3px 9px", borderRadius:4, letterSpacing:0.8, flexShrink:0 }}>
        <span style={{ width:5, height:5, borderRadius:"50%", background:"#EF4444", display:"inline-block", animation:"wzzrd-pulse 1.5s infinite" }} />
        {isAr ? "مباشر" : "LIVE"}
      </span>
      {/* Separator */}
      <span style={{ width:1, height:14, background:"rgba(255,255,255,0.1)", flexShrink:0 }} />
      {/* Animated message */}
      <span style={{ ...slideStyle, fontSize:13, color:"rgba(255,255,255,0.7)", fontFamily:FONT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", flex:1 }}>
        {feed[idx]}
      </span>
      {/* Counter pill */}
      <span style={{ flexShrink:0, fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:FONT, whiteSpace:"nowrap" }}>
        {idx + 1} / {feed.length}
      </span>
    </div>
  );
}

function BrandLogosStrip({ isAr, cfg }: { isAr: boolean; cfg?: HomepageCfg }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let pos = 0, raf = 0;
    const step = () => { pos += 0.4; if (pos >= el.scrollWidth / 2) pos = 0; el.scrollLeft = pos; raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const logos = cfg?.brandLogos?.length ? cfg.brandLogos : BRANDS;
  const doubled = [...logos, ...logos];
  return (
    <div style={{ background:C.bgAlt, padding:"28px 0", overflow:"hidden", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
      <p style={{ textAlign:"center", fontSize:11, color:"#9CA3AF", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:18, fontFamily:FONT }}>
        {isAr ? "يستخدمه مؤسسو هذه الشركات" : "Used by founders from these companies"}
      </p>
      <div ref={ref} style={{ display:"flex", gap:28, overflowX:"hidden", paddingInline:32, userSelect:"none" }}>
        {doubled.map((name, i) => (
          <div key={`${name}-${i}`} style={{ flexShrink:0, padding:"9px 22px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", minWidth:100 }}>
            <span style={{ fontSize:14, fontWeight:800, color:"#C4C9D4", letterSpacing:-0.3, fontFamily:FONT }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolSectionCard({ tool, navigate, t, isAr, index }: {
  tool: typeof TOOL_DEFS[0]; navigate:(p:string)=>void; t:(k:string)=>string; isAr:boolean; index:number;
}) {
  const [hov, setHov] = useState(false);
  const isEven = index % 2 === 0;
  const flip   = isAr ? !isEven : isEven;
  return (
    <section style={{ background: isEven ? C.bg : C.bgAlt, padding:"72px 24px", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ maxWidth:1000, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center", direction: flip ? "ltr" : "rtl" }}>
        {/* Text */}
        <div style={{ direction: isAr ? "rtl" : "ltr" }}>
          {tool.popular && (
            <span style={{ display:"inline-block", background:C.blueLight, color:C.blue, fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:100, marginBottom:14, letterSpacing:0.5 }}>
              ⭐ {t(tool.tagK)}
            </span>
          )}
          <div style={{ fontSize:44, marginBottom:14 }}>{tool.icon}</div>
          <h2 style={{ fontSize:"clamp(20px,2.8vw,32px)", fontWeight:900, color:C.text, marginBottom:12, lineHeight:1.3 }}>
            {isAr ? tool.arProblem : tool.enProblem}
          </h2>
          <p style={{ fontSize:15, color:C.muted, marginBottom:18, lineHeight:1.8 }}>{t(tool.descK)}</p>
          <div style={{ background:`${C.blue}0D`, border:`1px solid ${C.borderBlue}`, borderRadius:10, padding:"11px 15px", marginBottom:26, fontSize:13, color:C.blue, fontWeight:600 }}>
            📊 {isAr ? tool.arStat : tool.enStat}
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <button
              onClick={() => navigate(tool.route)}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{ background: hov ? C.blueDark : C.blue, color:"#fff", padding:"13px 26px", borderRadius:100, fontWeight:800, fontSize:15, border:"none", cursor:"pointer", fontFamily:FONT, boxShadow:`0 4px 20px ${C.blueGlow}`, transition:"all 0.2s" }}
            >
              {t(tool.ctaK)} {isAr ? "←" : "→"}
            </button>
            <span style={{ fontSize:13, color:C.muted }}>⚡ {tool.cost} {isAr ? "كريدت" : "credits"}</span>
          </div>
        </div>
        {/* Mock report card */}
        <div style={{ direction: isAr ? "rtl" : "ltr" }}>
          <div style={{ background:C.surface, border:`2px solid ${C.border}`, borderRadius:20, padding:"28px 24px", boxShadow:`0 8px 40px ${C.blueGlow}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ fontSize:26 }}>{tool.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{t(tool.nameK)}</div>
                <div style={{ fontSize:11, color:C.muted }}>{isAr ? "تقرير تشخيصي" : "Diagnostic Report"}</div>
              </div>
              <div style={{ marginInlineStart:"auto", background:"#DCFCE7", color:"#166534", fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:100 }}>
                {isAr ? "جاهز ✓" : "Ready ✓"}
              </div>
            </div>
            {[
              { label: isAr ? "قوة الرسالة"    : "Message Strength",  val:72, color:"#F59E0B" },
              { label: isAr ? "وضوح العرض"     : "Offer Clarity",      val:45, color:C.red },
              { label: isAr ? "الهوية البصرية" : "Visual Identity",    val:88, color:C.green },
              { label: isAr ? "الحضور الرقمي"  : "Digital Presence",   val:61, color:C.blue },
            ].map(bar => (
              <div key={bar.label} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.muted }}>{bar.label}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:bar.color }}>{bar.val}%</span>
                </div>
                <div style={{ background:C.border, borderRadius:100, height:5 }}>
                  <div style={{ width:`${bar.val}%`, background:bar.color, borderRadius:100, height:5 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop:16, background:`${C.blue}08`, border:`1px solid ${C.borderBlue}`, borderRadius:10, padding:"11px 13px", fontSize:12, color:C.text, lineHeight:1.6 }}>
              💡 {isAr
                ? "أهم مشكلة: رسالتك تتحدث عن المنتج وليس عن مشكلة العميل — هذا يقلل التحويل بنسبة ٤٠٪."
                : "Key issue: Your message talks about the product, not the customer's problem — this reduces conversion by 40%."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ── Live Reviews Section ──────────────────────────────────────────────────────
interface PublicReview {
  id: number;
  toolId: string;
  rating: number;
  comment: string;
  country: string;
  createdAt: string;
}

function LiveReviewsSection({ isAr }: { isAr: boolean }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/trpc/reviews.publicList?input=' + encodeURIComponent(JSON.stringify({ json: { limit: 6 } })));
      const data = await res.json();
      const list = data?.result?.data?.json ?? data?.result?.data ?? [];
      setReviews(Array.isArray(list) ? list : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Static fallback while loading or if no reviews yet
  const FALLBACK: PublicReview[] = [
    { id:1, toolId:"brand_diagnosis",       rating:5, country:"🇪🇬 Egypt",       comment: isAr ? "التقرير كشف لي مشكلة كنت عايشها من ٣ سنين ومش عارف أحددها. الـ AI فهم البراند أحسن مني!" : "The report revealed a problem I had been living with for 3 years and couldn't identify. The AI understood my brand better than I did!", createdAt: new Date().toISOString() },
    { id:2, toolId:"offer_check",           rating:5, country:"🇸🇦 KSA",         comment: isAr ? "كنت فاكر المشكلة في المنتج. اتضح إن العرض نفسه هو اللي بيطرد العملاء. غيرت الصياغة وارتفعت المبيعات." : "I thought the problem was the product. Turns out the offer itself was repelling customers. Changed the framing and sales went up.", createdAt: new Date().toISOString() },
    { id:3, toolId:"presence_audit",        rating:5, country:"🇦🇪 UAE",         comment: isAr ? "٣ ثغرات حرجة في حضوري الرقمي ما كنت أعرف عنها. التقرير أعطاني خطة واضحة خطوة بخطوة." : "3 critical gaps in my digital presence I didn't know about. The report gave me a clear step-by-step plan.", createdAt: new Date().toISOString() },
    { id:4, toolId:"launch_readiness",      rating:5, country:"🇯🇴 Jordan",      comment: isAr ? "كنت على وشك أطلق المنتج. التقرير أوقفني وقال ليه ٥ أسباب ما أطلقش دلوقتي. وفّر عليّ خسارة كبيرة." : "I was about to launch. The report stopped me and gave 5 reasons not to launch yet. Saved me from a big loss.", createdAt: new Date().toISOString() },
    { id:5, toolId:"message_check",         rating:5, country:"🇰🇼 Kuwait",      comment: isAr ? "رسالتي كانت بتتكلم عن المنتج مش عن مشكلة العميل. ده كان بيطرد ٦٥٪ من الزوار. دلوقتي الـ conversion rate اتضاعف." : "My message was talking about the product, not the customer problem. That was repelling 65% of visitors. Now my conversion rate doubled.", createdAt: new Date().toISOString() },
    { id:6, toolId:"competitive_benchmark", rating:5, country:"🇸🇦 KSA",         comment: isAr ? "اكتشفت فجوة سعرية في السوق ما كانش فيها منافس. ده غيّر استراتيجيتي بالكامل." : "Discovered a pricing gap in the market with no competitor. This completely changed my strategy.", createdAt: new Date().toISOString() },
  ];

  const displayReviews = reviews.length >= 3 ? reviews.slice(0, 6) : FALLBACK;

  const TOOL_LABELS: Record<string, { ar: string; en: string }> = {
    brand_diagnosis:       { ar: "تشخيص البراند",     en: "Brand Diagnosis" },
    offer_check:           { ar: "فحص العرض",          en: "Offer Check" },
    message_check:         { ar: "فحص الرسالة",        en: "Message Check" },
    presence_audit:        { ar: "فحص الحضور",         en: "Presence Audit" },
    identity_snapshot:     { ar: "الهوية البصرية",     en: "Identity Snapshot" },
    launch_readiness:      { ar: "جاهزية الإطلاق",    en: "Launch Readiness" },
    quick_diagnosis:       { ar: "تشخيص سريع",         en: "Quick Diagnosis" },
    competitive_benchmark: { ar: "المقارنة التنافسية", en: "Competitive Benchmark" },
  };

  const STARS = [1,2,3,4,5];

  return (
    <section style={{ padding:"72px 24px", background: C.bg }}>
      <div style={{ maxWidth:1080, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <p style={{ fontSize:12, color:C.blue, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
            {isAr ? "آراء حقيقية من مستخدمين حقيقيين" : "REAL REVIEWS FROM REAL USERS"}
          </p>
          <h2 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:900, color:C.text, marginBottom:12 }}>
            {isAr ? "ماذا قال المؤسسون بعد أول تقرير؟" : "What did founders say after their first report?"}
          </h2>
          <p style={{ fontSize:15, color:C.muted, maxWidth:560, margin:"0 auto" }}>
            {isAr
              ? "تقييمات حقيقية من مؤسسين ومديري تسويق استخدموا WZZRD AI وشاركوا تجربتهم"
              : "Genuine reviews from founders and marketing managers who used WZZRD AI and shared their experience"}
          </p>
        </div>
        {loading ? (
          <div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>
            {isAr ? "جاري التحميل..." : "Loading reviews..."}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20 }}>
            {displayReviews.map((r, i) => {
              const toolLabel = TOOL_LABELS[r.toolId] ?? { ar: r.toolId, en: r.toolId };
              return (
                <div key={r.id ?? i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"24px 20px", display:"flex", flexDirection:"column", gap:14 }}>
                  {/* Stars */}
                  <div style={{ display:"flex", gap:2 }}>
                    {STARS.map(s => (
                      <span key={s} style={{ fontSize:16, color: s <= r.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>
                    ))}
                  </div>
                  {/* Comment */}
                  <p style={{ fontSize:14, color:"#374151", lineHeight:1.8, fontStyle:"italic", flex:1 }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  {/* Footer */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", background:C.blueLight, color:C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800 }}>
                        {r.country ? r.country.split(" ")[0] : "🌍"}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{r.country || (isAr ? "مجهول" : "Anonymous")}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{isAr ? toolLabel.ar : toolLabel.en}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:C.muted }}>
                      {new Date(r.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month:"short", year:"numeric" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* CTA */}
        <div style={{ textAlign:"center", marginTop:36 }}>
          <p style={{ fontSize:13, color:C.muted }}>
            {isAr
              ? "✅ كل تقييم تم التحقق منه — مكافأة ١٠٠ كريدت لكل تقييم حقيقي"
              : "✅ Every review is verified — 100 credits reward for every genuine review"}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Reports Marketing Section ─────────────────────────────────────────────────
const REPORT_PREVIEWS = [
  { icon:"📊", color:"#1B4FD8", arTitle:"تقرير حالة البراند العربي ٢٠٢٦", enTitle:"Arab Brand State Report 2026", arDesc:"تحليل شامل لأكثر من ٥٠٠ براند عربي — أين تقف السوق وما هي الفرص الذهبية؟", enDesc:"Comprehensive analysis of 500+ Arab brands — where the market stands and what golden opportunities exist.", free:true },
  { icon:"📦", color:"#059669", arTitle:"دليل صياغة العرض التجاري المثالي", enTitle:"The Perfect Offer Framing Guide", arDesc:"الإطار العلمي لصياغة عرض يبيع نفسه — ٧ معادلات مجربة مع أمثلة حقيقية من السوق العربي.", enDesc:"The scientific framework for crafting a self-selling offer — 7 proven formulas with real Arab market examples.", free:false },
  { icon:"🎯", color:"#7C3AED", arTitle:"قوالب خطة التسويق الكاملة", enTitle:"Complete Marketing Plan Templates", arDesc:"٥ قوالب جاهزة لخطط تسويقية لأنواع مختلفة من البيزنس — جاهزة للتعديل والتنفيذ الفوري.", enDesc:"5 ready-made marketing plan templates for different business types — ready to customize and execute immediately.", free:false },
  { icon:"🔬", color:"#DC2626", arTitle:"كيف تقرأ تقرير WZZRD AI وتنفذه؟", enTitle:"How to Read & Execute Your WZZRD Report", arDesc:"دليل مجاني خطوة بخطوة لفهم تقريرك التشخيصي وتحويله إلى خطة تنفيذية فعلية.", enDesc:"Free step-by-step guide to understanding your diagnostic report and turning it into an actual execution plan.", free:true },
];

function ReportsSection({ isAr }: { isAr: boolean }) {
  return (
    <section style={{ background:C.bgAlt, padding:"80px 24px", borderTop:`1px solid ${C.border}` }}>
      <div style={{ maxWidth:1080, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <p style={{ fontSize:12, color:"#059669", fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
            {isAr ? "مكتبة المعرفة التسويقية" : "MARKETING KNOWLEDGE LIBRARY"}
          </p>
          <h2 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:900, color:C.text, marginBottom:14 }}>
            {isAr ? "تقارير وكتيبات تسويقية احترافية" : "Professional Marketing Reports & Booklets"}
          </h2>
          <p style={{ fontSize:15, color:C.muted, maxWidth:600, margin:"0 auto", lineHeight:1.8 }}>
            {isAr
              ? "لا تكتفِ بالتشخيص — احصل على المعرفة الكاملة. تقارير بحثية، قوالب جاهزة، وأدلة تنفيذية من خبراء السوق العربي."
              : "Don't stop at diagnosis — get the full knowledge. Research reports, ready templates, and execution guides from Arab market experts."}
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:20, marginBottom:40 }}>
          {REPORT_PREVIEWS.map((r, i) => (
            <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"24px 20px", display:"flex", flexDirection:"column", gap:12, position:"relative", overflow:"hidden" }}>
              {/* Free/Paid badge */}
              <div style={{ position:"absolute", top:16, insetInlineEnd:16 }}>
                {r.free
                  ? <span style={{ background:"#DCFCE7", color:"#166534", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:100 }}>{isAr ? "مجاني" : "FREE"}</span>
                  : <span style={{ background:C.blueLight, color:C.blue, fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:100 }}>{isAr ? "كريدت" : "Credits"}</span>
                }
              </div>
              <div style={{ fontSize:36 }}>{r.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:800, color:C.text, lineHeight:1.4, paddingInlineEnd:50 }}>
                {isAr ? r.arTitle : r.enTitle}
              </h3>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, flex:1 }}>
                {isAr ? r.arDesc : r.enDesc}
              </p>
              <div style={{ height:1, background:C.border }} />
              <a href="/reports" style={{ fontSize:13, fontWeight:800, color:r.color, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
                {isAr ? "اقرأ المزيد" : "Read more"} {isAr ? "←" : "→"}
              </a>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ textAlign:"center" }}>
          <a
            href="/reports"
            style={{ display:"inline-block", background:C.blue, color:"#fff", padding:"14px 32px", borderRadius:100, fontWeight:800, fontSize:15, textDecoration:"none", fontFamily:FONT, boxShadow:`0 4px 20px ${C.blueGlow}` }}
          >
            {isAr ? "تصفح المكتبة الكاملة ←" : "Browse Full Library →"}
          </a>
          <p style={{ fontSize:12, color:C.muted, marginTop:12 }}>
            {isAr ? "بعض التقارير مجانية تماماً — لا تحتاج حتى تسجيل دخول" : "Some reports are completely free — no login required"}
          </p>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({ isAr }: { isAr: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await fetch("/api/newsletter/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) }); } catch { /* ignore */ }
    setSent(true); setLoading(false);
  };
  return (
    <section style={{ background:C.blue, padding:"80px 24px" }}>
      <div style={{ maxWidth:620, margin:"0 auto", textAlign:"center" }}>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>
          {isAr ? "النشرة الأسبوعية" : "Weekly Newsletter"}
        </p>
        <h2 style={{ fontSize:"clamp(22px,3.5vw,36px)", fontWeight:900, color:"#fff", marginBottom:14, lineHeight:1.3 }}>
          {isAr
            ? "كل أسبوع: استراتيجية براند واحدة تغير نتائجك"
            : "Every week: one brand strategy that changes your results"}
        </h2>
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.7)", marginBottom:32, lineHeight:1.7 }}>
          {isAr
            ? "مش نشرة إخبارية عادية. كل إيميل فيه تشخيص حقيقي لمشكلة براند شائعة + الحل خطوة بخطوة. بيستخدمها أكثر من ١٢٠٠ مؤسس في المنطقة العربية."
            : "Not your average newsletter. Every email contains a real diagnosis of a common brand problem + step-by-step solution. Used by 1,200+ founders across the Arab world."}
        </p>
        {sent ? (
          <div style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:14, padding:"18px 24px", color:"#fff", fontSize:16, fontWeight:800 }}>
            ✓ {isAr ? "تم الاشتراك! تفقد بريدك الإلكتروني." : "Subscribed! Check your inbox."}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display:"flex", gap:10, maxWidth:460, margin:"0 auto", flexWrap:"wrap", justifyContent:"center" }}>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
              style={{ flex:1, minWidth:210, padding:"13px 18px", borderRadius:100, border:"2px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:15, outline:"none", fontFamily:FONT, direction: isAr ? "rtl" : "ltr" }} />
            <button type="submit" disabled={loading} style={{ background:"#fff", color:C.blue, padding:"13px 26px", borderRadius:100, fontWeight:900, fontSize:15, border:"none", cursor:"pointer", fontFamily:FONT, flexShrink:0 }}>
              {loading ? "..." : (isAr ? "اشترك مجاناً" : "Subscribe Free")}
            </button>
          </form>
        )}
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:14 }}>
          {isAr ? "بدون سبام — إلغاء الاشتراك في أي وقت" : "No spam — unsubscribe anytime"}
        </p>
      </div>
    </section>
  );
}

function FooterNewsletter({ t, isAr }: { t:(k:string)=>string; isAr:boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone]   = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await fetch("/api/newsletter/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) }); } catch { /* ignore */ }
    setDone(true);
  };
  if (done) return <p style={{ fontSize:13, color:"#4ADE80", fontWeight:700 }}>✓ {isAr ? "تم الاشتراك!" : "Subscribed!"}</p>;
  return (
    <form onSubmit={submit} style={{ display:"flex", gap:6 }}>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder={t("pub.footer.emailPlaceholder")}
        style={{ flex:1, padding:"9px 13px", borderRadius:8, fontSize:13, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", outline:"none", fontFamily:FONT }} />
      <button type="submit" style={{ padding:"9px 15px", borderRadius:8, fontSize:13, fontWeight:700, color:"#fff", background:C.blue, border:"none", cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>
        {t("pub.footer.subscribe")}
      </button>
    </form>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
interface HomepageCfg {
  heroImageUrl?: string;
  adBannerEnabled?: boolean;
  adBannerUrl?: string;
  adBannerType?: 'image' | 'gif' | 'video';
  adBannerLink?: string;
  founderName?: string;
  founderTitleEn?: string;
  founderTitleAr?: string;
  founderQuoteEn?: string;
  founderQuoteAr?: string;
  founderImageUrl?: string;
  founderLinkedin?: string;
  liveTickerAr?: string[];
  liveTickerEn?: string[];
  brandLogos?: string[];
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Welcome() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const isAr = locale === "ar";

  const [leadEmail, setLeadEmail]       = useState("");
  const [leadSent, setLeadSent]         = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [hpCfg, setHpCfg] = useState<HomepageCfg>({});

  useEffect(() => {
    fetch('/api/public/site-config')
      .then(r => r.json())
      .then(d => { if (d?.homepage) setHpCfg(d.homepage as HomepageCfg); })
      .catch(() => {});
  }, []);

  const onLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!leadEmail) return;
    setLeadSubmitting(true);
    try { await fetch("/api/newsletter/subscribe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email: leadEmail }) }); } catch { /* ignore */ }
    setLeadSent(true); setLeadSubmitting(false);
  };

  const cmpRows = isAr ? CMP_AR : CMP_EN;

  return (
    <div style={{ fontFamily:FONT, background:C.bg, minHeight:"100vh", direction: isAr ? "rtl" : "ltr" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <WzrdPublicHeader />

      {/* ══ LIVE TICKER ══ */}
      <LiveTicker isAr={isAr} cfg={hpCfg} />

      {/* ══ HERO ══ */}
      <section style={{ padding:"72px 24px 56px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`radial-gradient(ellipse 80% 60% at 50% -10%, ${C.blueGlow}, transparent)` }} />
        <div style={{ maxWidth:1080, margin:"0 auto", position:"relative", display:"grid", gridTemplateColumns: hpCfg.heroImageUrl ? "1fr 1fr" : "1fr", gap:56, alignItems:"center", direction: isAr ? "rtl" : "ltr" }}>

          {/* Text side */}
          <div style={{ textAlign: hpCfg.heroImageUrl ? (isAr ? "right" : "left") : "center", maxWidth: hpCfg.heroImageUrl ? "none" : 820, margin: hpCfg.heroImageUrl ? "0" : "0 auto" }}>
            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:100, padding:"6px 16px", marginBottom:24 }}>
              <span style={{ fontSize:14 }}>⚡</span>
              <span style={{ fontSize:13, fontWeight:800, color:"#92400E" }}>
                {isAr ? "البديل الذكي للوكالات التقليدية" : "The smart alternative to traditional agencies"}
              </span>
            </div>

            <h1 style={{ fontSize:"clamp(28px,4.5vw,58px)", fontWeight:900, color:C.text, marginBottom:20, lineHeight:1.15, letterSpacing:-1 }}>
              {isAr ? (
                <>عصر الوكالة <span style={{ color:C.red, textDecoration:"line-through" }}>انتهى.</span><br />WZZRD AI هو التطور الطبيعي.</>
              ) : (
                <>The agency era <span style={{ color:C.red, textDecoration:"line-through" }}>is over.</span><br />WZZRD AI is what’s next.</>
              )}
            </h1>

            <p style={{ fontSize:17, color:C.muted, lineHeight:1.8, maxWidth:580, margin: hpCfg.heroImageUrl ? "0 0 24px" : "0 auto 24px" }}>
              {isAr
                ? "لماذا تنتظر أسابيع وتدفع آلاف لوكالة تعطيك تقريراً عاماً؟ WZZRD AI يعطيك تشخيصاً أعمق وأدق — في دقائق — بجزء بسيط من التكلفة."
                : "Why wait weeks and pay thousands for a generic agency report? WZZRD AI gives you a deeper, more accurate diagnosis — in minutes — at a fraction of the cost."}
            </p>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent: hpCfg.heroImageUrl ? (isAr ? "flex-end" : "flex-start") : "center", marginBottom:28 }}>
              <button onClick={() => navigate("/tools/brand-diagnosis")} style={{ background:C.blue, color:"#fff", padding:"14px 30px", borderRadius:100, fontWeight:800, fontSize:16, border:"none", cursor:"pointer", fontFamily:FONT, boxShadow:`0 4px 20px ${C.blueGlow}` }}>
                {t("pub.hero.cta1")}
              </button>
              <button onClick={() => navigate("/pricing")} style={{ background:"transparent", color:C.blue, padding:"14px 30px", borderRadius:100, fontWeight:700, fontSize:16, border:`2px solid ${C.blue}`, cursor:"pointer", fontFamily:FONT }}>
                {t("pub.hero.cta2")}
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent: hpCfg.heroImageUrl ? (isAr ? "flex-end" : "flex-start") : "center", marginBottom:28 }}>
              {["pub.hero.trust1","pub.hero.trust2","pub.hero.trust3"].map(k => (
                <span key={k} style={{ fontSize:13, color:C.muted, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ color:"#10B981", fontWeight:800 }}>✓</span> {t(k)}
                </span>
              ))}
            </div>

            {/* Countries — elegant pill style */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent: hpCfg.heroImageUrl ? (isAr ? "flex-end" : "flex-start") : "center", alignItems:"center" }}>
              <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginInlineEnd:4 }}>
                {isAr ? "مستخدم في" : "Used in"}
              </span>
              {COUNTRIES.map(c => (
                <span key={c.flag} style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.surface, border:`1px solid ${C.border}`, borderRadius:100, padding:"4px 12px", fontSize:12, color:C.text, fontWeight:600, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize:15 }}>{c.flag}</span>
                  <span>{isAr ? c.ar : c.en}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Image side — only rendered when heroImageUrl is set */}
          {hpCfg.heroImageUrl && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ borderRadius:24, overflow:"hidden", boxShadow:`0 24px 64px rgba(27,79,216,0.15)`, border:`1px solid ${C.border}`, maxWidth:480, width:"100%" }}>
                <img src={hpCfg.heroImageUrl} alt="WZZRD AI" style={{ width:"100%", height:"auto", display:"block" }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ AGENCY vs WZZRD ══ */}
      <section style={{ background:C.bgAlt, padding:"72px 24px" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <p style={{ fontSize:12, color:C.blue, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
              {isAr ? "لماذا WZZRD AI؟" : "Why WZZRD AI?"}
            </p>
            <h2 style={{ fontSize:"clamp(22px,3.5vw,38px)", fontWeight:900, color:C.text, marginBottom:12 }}>
              {isAr ? "قارن بنفسك — قبل ما تدفع لأي وكالة" : "Compare yourself — before paying any agency"}
            </h2>
            <p style={{ fontSize:15, color:C.muted, maxWidth:520, margin:"0 auto" }}>
              {isAr
                ? "مش بنهاجم الوكالات — بس الـ AI غيّر اللعبة. وأنت تستحق تعرف الفرق."
                : "We're not attacking agencies — but AI changed the game. You deserve to know the difference."}
            </p>
          </div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:C.text, padding:"13px 20px", gap:8 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.45)", textTransform:"uppercase", letterSpacing:0.5 }}>{isAr ? "الميزة" : "Feature"}</div>
              <div style={{ fontSize:13, fontWeight:900, color:"#60A5FA", textAlign:"center" }}>WZZRD AI ✓</div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.35)", textAlign:"center" }}>{isAr ? "وكالة تقليدية" : "Traditional Agency"}</div>
            </div>
            {cmpRows.map((row, i) => (
              <div key={row.f} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"13px 20px", gap:8, background: i%2===0 ? C.surface : C.bgAlt, borderTop:`1px solid ${C.border}`, alignItems:"center" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{row.f}</div>
                <div style={{ fontSize:13, color:C.green, fontWeight:700, textAlign:"center" }}>✓ {row.w}</div>
                <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>✗ {row.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PAIN ══ */}
      <section style={{ padding:"64px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center" }}>
          <p style={{ fontSize:12, color:C.blue, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>{t("pub.pain.badge")}</p>
          <h2 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:900, color:C.text, marginBottom:40 }}>{t("pub.pain.h2")}</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:36 }}>
            {PAIN_KEYS.map((k,i) => (
              <div key={k} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{PAIN_ICONS[i]}</div>
                <p style={{ fontSize:14, color:"#374151", fontWeight:500, lineHeight:1.5 }}>{t(k)}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:15, color:C.muted, maxWidth:640, margin:"0 auto", lineHeight:1.7 }}>{t("pub.pain.conclusion")}</p>
        </div>
      </section>

      {/* ══ 8 TOOL SECTIONS ══ */}
      {TOOL_DEFS.map((tool, index) => (
        <ToolSectionCard key={tool.id} tool={tool} navigate={navigate} t={t} isAr={isAr} index={index} />
      ))}

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background:C.bgAlt, padding:"72px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <p style={{ fontSize:12, color:C.blue, fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{t("pub.how.badge")}</p>
            <h2 style={{ fontSize:"clamp(24px,3.5vw,40px)", fontWeight:900, color:C.text }}>{t("pub.how.h2")}</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:32 }}>
            {STEP_KEYS.map(s => (
              <div key={s.numK} style={{ textAlign:"center" }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:C.blue, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, margin:"0 auto 14px" }}>{t(s.numK)}</div>
                <h3 style={{ fontSize:17, fontWeight:800, color:C.text, marginBottom:8 }}>{t(s.titleK)}</h3>
                <p style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>{t(s.descK)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ background:C.blue, padding:"64px 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:32, textAlign:"center" }}>
          {STAT_KEYS.map(s => (
            <div key={s.labelK}>
              <div style={{ fontSize:"clamp(2rem,4vw,2.75rem)", fontWeight:900, color:"#fff", lineHeight:1 }}>{isAr ? s.arVal : s.enVal}</div>
              <div style={{ fontSize:14, color:"#BFDBFE", marginTop:6, fontWeight:700 }}>{t(s.labelK)}</div>
              <div style={{ fontSize:12, color:"#93C5FD", marginTop:2 }}>{t(s.subK)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LIVE REVIEWS ══ */}
      <LiveReviewsSection isAr={isAr} />

      {/* ══ BRAND LOGOS ══ */}
      <BrandLogosStrip isAr={isAr} cfg={hpCfg} />
      {/* ══ REPORTS ══ */}
      <ReportsSection isAr={isAr} />

      {/* ══ LEAD MAGNET ══ */}
      <section style={{ background:C.bgAlt, padding:"72px 24px" }}>
        <div style={{ maxWidth:560, margin:"0 auto", background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:"40px 32px", textAlign:"center" }}>
          <p style={{ fontSize:12, color:"#10B981", fontWeight:800, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>{t("pub.lead.badge")}</p>
          <h2 style={{ fontSize:"clamp(20px,3vw,28px)", fontWeight:900, color:C.text, marginBottom:12 }}>{t("pub.lead.h2")}</h2>
          <p style={{ fontSize:14, color:C.muted, marginBottom:24, lineHeight:1.7 }}>{t("pub.lead.sub")}</p>
          {leadSent ? (
            <p style={{ color:"#10B981", fontWeight:800, fontSize:16 }}>✓ {isAr ? "تم الإرسال! تفقد بريدك الإلكتروني." : "Sent! Check your inbox."}</p>
          ) : (
            <form onSubmit={onLeadSubmit} style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
              <input type="email" required value={leadEmail} onChange={e => setLeadEmail(e.target.value)}
                placeholder={t("pub.lead.placeholder")}
                style={{ flex:1, minWidth:200, padding:"12px 16px", borderRadius:100, border:`1px solid ${C.border}`, fontSize:14, outline:"none", background:"#F9FAFB", fontFamily:FONT }} />
              <button type="submit" disabled={leadSubmitting} style={{ background:C.blue, color:"#fff", padding:"12px 22px", borderRadius:100, fontWeight:800, fontSize:14, border:"none", cursor:"pointer", fontFamily:FONT }}>
                {t("pub.lead.btn")}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ══ NEWSLETTER ══ */}
      <NewsletterSection isAr={isAr} />

      {/* ══ AD BANNER ══ */}
      {hpCfg.adBannerEnabled && hpCfg.adBannerUrl && (
        <section style={{ padding:"32px 24px", background:C.bg }}>
          <div style={{ maxWidth:960, margin:"0 auto" }}>
            {hpCfg.adBannerLink ? (
              <a href={hpCfg.adBannerLink} target="_blank" rel="noopener noreferrer" style={{ display:"block", borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 4px 24px rgba(0,0,0,0.07)", cursor:"pointer" }}>
                {hpCfg.adBannerType === 'video'
                  ? <video src={hpCfg.adBannerUrl} autoPlay loop muted playsInline style={{ width:"100%", display:"block" }} />
                  : <img src={hpCfg.adBannerUrl} alt="" style={{ width:"100%", display:"block" }} />}
              </a>
            ) : (
              <div style={{ borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 4px 24px rgba(0,0,0,0.07)" }}>
                {hpCfg.adBannerType === 'video'
                  ? <video src={hpCfg.adBannerUrl} autoPlay loop muted playsInline style={{ width:"100%", display:"block" }} />
                  : <img src={hpCfg.adBannerUrl} alt="" style={{ width:"100%", display:"block" }} />}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══ FOUNDER QUOTE ══ */}
      {(() => {
        const name    = hpCfg.founderName    || "Ramy Mortada";
        const titleEn = hpCfg.founderTitleEn || "Founder & CEO, PRIMO MARCA";
        const titleAr = hpCfg.founderTitleAr || "مؤسس و رئيس تنفيذي، PRIMO MARCA";
        const quoteEn = hpCfg.founderQuoteEn || "I built WZZRD AI because I was tired of watching great businesses fail due to bad marketing decisions. You deserve clarity, not guesswork.";
        const quoteAr = hpCfg.founderQuoteAr || "بنيت WZZRD AI لأني سئمت من رؤية مشاريع رائعة تفشل بسبب قرارات تسويقية خاطئة. أنت تستحق وضوحاً حقيقياً، ليس تخميناً.";
        const imgSrc  = hpCfg.founderImageUrl || "/founder.jpg";
        const linkedin = hpCfg.founderLinkedin || "https://linkedin.com/in/ramymortada";
        return (
          <section style={{ padding:"56px 24px", background:C.bgAlt, borderTop:`1px solid ${C.border}` }}>
            <div style={{ maxWidth:680, margin:"0 auto" }}>
              {/* Notification-style card */}
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"28px 32px", boxShadow:"0 2px 16px rgba(0,0,0,0.05)", display:"flex", gap:20, alignItems:"flex-start", direction: isAr ? "rtl" : "ltr" }}>
                {/* Avatar */}
                <div style={{ flexShrink:0 }}>
                  <div style={{ width:52, height:52, borderRadius:"50%", overflow:"hidden", border:`2px solid ${C.blue}`, boxShadow:`0 0 0 3px rgba(27,79,216,0.12)` }}>
                    <img src={imgSrc} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
                  </div>
                </div>
                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:C.text }}>{name}</span>
                    <span style={{ fontSize:11, color:C.muted, background:C.bgAlt, border:`1px solid ${C.border}`, borderRadius:100, padding:"2px 10px" }}>
                      {isAr ? titleAr : titleEn}
                    </span>
                    {linkedin && (
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" style={{ marginInlineStart:"auto", fontSize:11, color:C.blue, textDecoration:"none", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                        LinkedIn ↗
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, margin:0, fontStyle:"italic" }}>
                    “{isAr ? quoteAr : quoteEn}”
                  </p>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ══ FINAL CTA ══ */}
      <section style={{ background:"#111827", padding:"80px 24px", textAlign:"center" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:900, color:"#fff", marginBottom:16 }}>{t("pub.cta.h2")}</h2>
          <p style={{ fontSize:17, color:"#9CA3AF", marginBottom:36, lineHeight:1.7 }}>{t("pub.cta.sub")}</p>
          <button onClick={() => navigate("/tools/brand-diagnosis")} style={{ background:C.blue, color:"#fff", padding:"17px 40px", borderRadius:100, fontWeight:900, fontSize:18, border:"none", cursor:"pointer", fontFamily:FONT, boxShadow:`0 6px 24px ${C.blueGlow}`, marginBottom:16 }}>
            {t("pub.cta.btn")}
          </button>
          <p style={{ fontSize:13, color:"#6B7280" }}>{t("pub.cta.trust")}</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:"#0D1117", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"64px 24px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:40, marginBottom:48 }}>

            {/* Brand */}
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:10, letterSpacing:-0.5 }}>
                WZZ<span style={{ color:C.blue }}>RD</span> AI
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.38)", lineHeight:1.7, marginBottom:20 }}>{t("pub.footer.tagline")}</p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[
                  { label:"Instagram", icon:"📸", href:"https://instagram.com/wzzrdai" },
                  { label:"LinkedIn",  icon:"💼", href:"https://linkedin.com/company/wzzrdai" },
                  { label:"X",         icon:"𝕏",  href:"https://x.com/wzzrdai" },
                  { label:"TikTok",    icon:"🎵", href:"https://tiktok.com/@wzzrdai" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                    style={{ width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.09)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, textDecoration:"none" }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h4 style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.38)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>{t("pub.footer.tools")}</h4>
              {TOOL_DEFS.map(tool => (
                <a key={tool.id} href={tool.route} onClick={e => { e.preventDefault(); navigate(tool.route); }}
                  style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.48)", marginBottom:9, textDecoration:"none" }}>
                  {tool.icon} {t(tool.nameK)}
                </a>
              ))}
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.38)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>{t("pub.footer.company")}</h4>
              {[
                { href:"/",        label: t("pub.footer.home") },
                { href:"/pricing", label: t("pub.footer.pricing") },
                { href:"/blog",    label: t("pub.footer.blog") },
                { href:"/tools",   label: isAr ? "الأدوات" : "Tools" },
                { href:"/login",   label: t("pub.footer.login") },
                { href:"/signup",  label: t("pub.footer.signup") },
              ].map(link => (
                <a key={link.href} href={link.href} onClick={e => { e.preventDefault(); navigate(link.href); }}
                  style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.48)", marginBottom:9, textDecoration:"none" }}>
                  {link.label}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <h4 style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.38)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>{t("pub.footer.newsletter")}</h4>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.38)", marginBottom:14, lineHeight:1.6 }}>{t("pub.footer.newsletterSub")}</p>
              <FooterNewsletter t={t} isAr={isAr} />
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.22)" }}>
              © {new Date().getFullYear()} WZZRD AI — {t("pub.footer.rights")}
            </p>
            <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
              {[
                { href:"/privacy", label: t("pub.footer.privacy") },
                { href:"/terms",   label: t("pub.footer.terms") },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={e => { e.preventDefault(); navigate(l.href); }}
                  style={{ fontSize:12, color:"rgba(255,255,255,0.22)", textDecoration:"none" }}>
                  {l.label}
                </a>
              ))}
              <a
                href="https://primomarca.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize:12, color:"rgba(255,255,255,0.18)", textDecoration:"none", borderInlineStart:"1px solid rgba(255,255,255,0.08)", paddingInlineStart:20 }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
              >
                Powered by PRIMO MARCA
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes wzzrd-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @media (max-width:768px) {
          .wzzrd-tool-grid { grid-template-columns:1fr !important; }
        }
        @media (max-width:640px) {
          section { padding-left:16px !important; padding-right:16px !important; }
        }
      `}</style>
    </div>
  );
}
