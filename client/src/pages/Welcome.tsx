import React, { useState } from "react";
import { Link } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
const COBALT = "#7058F8";
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" stroke={COBALT} strokeWidth="1.5" />
      <path d="M6 10.2 8.4 12.6 14 7" stroke={COBALT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill={COBALT} aria-hidden>
      <path d="M7 1l1.545 4.757H13.5l-4.045 2.938 1.545 4.757L7 10.514l-3.999 2.938 1.545-4.757L.5 5.757h4.955z" />
    </svg>
  );
}

function DiagnosticCard() {
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#7058F8]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">تقرير العلامة التجارية</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">مكتمل</span>
        </div>
        <div className="mb-5 flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r={RING_R} fill="none" className="stroke-white/10" strokeWidth="8" />
              <circle
                cx="50" cy="50" r={RING_R} fill="none"
                stroke={COBALT} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - 0.82)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-white">82</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">82 / 100</p>
            <p className="text-sm text-white/60">Brand Health Score</p>
            <p className="mt-1 text-xs text-amber-400">3 نقاط تحتاج تحسين</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "تماسك الهوية البصرية", pct: 92, color: "#7058F8" },
            { label: "وضوح رسالة البيع", pct: 68, color: "#f59e0b" },
            { label: "التمايز عن المنافسين", pct: 85, color: "#22d3ee" },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>{row.pct}%</span>
                <span>{row.label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-right">
          <p className="text-xs font-semibold text-amber-300">التوصية الأولى</p>
          <p className="mt-0.5 text-xs text-white/70">رسالة البيع مش واضحة — العميل مش فاهم ليه يختارك</p>
        </div>
      </div>
    </div>
  );
}

const PAINS = [
  {
    icon: "💸",
    title: "بتصرف على ماركتنج ومش شايف نتيجة",
    desc: "وكالات بتاخد فلوسك وبترجعلك تقارير فاضية. WZZRD AI بيديك الـ insights اللي بتحتاجها بنفسك.",
  },
  {
    icon: "😤",
    title: "البراند بتاعك واقف — مش بيتكلم",
    desc: "الناس بتزور الموقع وبتمشي. مش لأن المنتج وحش — لأن الرسالة مش واصلة.",
  },
  {
    icon: "⏰",
    title: "وقتك أغلى من إنك تستنى موافقة وكالة",
    desc: "في عصر الـ AI، المؤسس الذكي بيعمل في ساعة ما كانت بتاخد أسبوع.",
  },
];

const STEPS = [
  { n: "01", title: "شخّص علامتك", desc: "أجب على 5 أسئلة — WZZRD AI يحلل وضعك الحالي ويطلع تقرير فوري." },
  { n: "02", title: "افهم الفجوة", desc: "شوف بالظبط فين المشكلة: الهوية؟ الرسالة؟ التمايز؟ الجمهور؟" },
  { n: "03", title: "نفّذ بنفسك", desc: "خطوات واضحة، أدوات AI جاهزة، بدون وكالة وبدون انتظار." },
];

const TESTIMONIALS = [
  {
    name: "أحمد الشمري",
    role: "مؤسس SaaS — الرياض",
    text: "في أسبوع واحد فهمت ليه كل حملاتي كانت بتفشل. WZZRD AI أعطاني وضوح ما حصلتش عليه من وكالة دفعتلها 30 ألف.",
    stars: 5,
  },
  {
    name: "نور العبدالله",
    role: "صاحبة علامة تجارية — دبي",
    text: "كنت فاكرة المشكلة في المنتج. اتضح المشكلة في الرسالة. التقرير غيّر طريقة تفكيري كلها.",
    stars: 5,
  },
  {
    name: "محمد رضا",
    role: "مؤسس تقني — القاهرة",
    text: "أخيراً أداة بتتكلم عربي وبتفهم السوق. مش مجرد ترجمة لأداة غربية.",
    stars: 5,
  },
];

const FEATURES = [
  { icon: "🧠", title: "تشخيص AI فوري", desc: "تقرير Brand Health Score في دقائق — مش أيام.", wide: false },
  { icon: "🎯", title: "رسالة بيع تبيع", desc: "WZZRD AI يكتب لك الـ positioning statement اللي يخلي العميل يقول ده بالظبط اللي أنا محتاجه.", wide: true },
  { icon: "📊", title: "تحليل المنافسين", desc: "شوف فين أنت مقارنة بالسوق — وفين الفرصة.", wide: false },
  { icon: "✍️", title: "كوبي يبيع", desc: "عناوين، إعلانات، بيو — كلها مكتوبة بلغة عميلك.", wide: false },
  { icon: "🚀", title: "خطة تنفيذ واضحة", desc: "مش توصيات فاضية — خطوات مرتبة بالأولوية.", wide: false },
];

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white" dir="rtl">
      <WzrdPublicHeader />

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#7058F8]/10 blur-[120px]" />
          <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-cyan-500/8 blur-[80px]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:items-start">
          <div className="flex-1 text-center lg:text-right">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7058F8]/30 bg-[#7058F8]/10 px-4 py-1.5 text-sm font-semibold text-[#a78bfa]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7058F8]" />
              وكالة التسويق الذكية للمؤسسين الطموحين
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              علامتك التجارية{" "}
              <span className="bg-gradient-to-l from-[#7058F8] to-cyan-400 bg-clip-text text-transparent">
                مش ضعيفة —
              </span>
              <br />
              رسالتها مش واصلة
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/60 lg:mr-0 lg:text-right">
              WZZRD AI بيشخّص علامتك التجارية، يكشف الفجوة، ويديك خطة تنفيذ واضحة —
              بدون وكالة، بدون انتظار، بدون ما تصرف على حاجة مش عارف نتيجتها.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end lg:justify-start">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#7058F8] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#7058F8]/30 transition-all hover:bg-[#5a45d4] hover:shadow-[#7058F8]/50"
              >
                ابدأ تشخيص مجاني <ArrowRight />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white/80 transition hover:bg-white/10"
              >
                سجّل دخول
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40 lg:justify-start">
              <span className="flex items-center gap-1.5"><CheckCircle /> مجاني للبدء</span>
              <span className="flex items-center gap-1.5"><CheckCircle /> لا بطاقة ائتمان</span>
              <span className="flex items-center gap-1.5"><CheckCircle /> نتيجة في دقائق</span>
            </div>
          </div>
          <div className="flex w-full justify-center lg:w-auto lg:justify-end">
            <DiagnosticCard />
          </div>
        </div>
      </section>

      {/* ══ PAIN POINTS ══ */}
      <section className="border-y border-white/5 bg-white/[0.02] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#7058F8]">بتعاني من ده؟</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">المشكلة مش في المنتج — في الطريقة</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PAINS.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:border-[#7058F8]/40 hover:bg-[#7058F8]/5"
              >
                <div className="mb-4 text-3xl">{p.icon}</div>
                <h3 className="mb-2 text-base font-bold text-white">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#7058F8]">إزاي بيشتغل</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">3 خطوات — من التشخيص للتنفيذ</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7058F8]/15 text-lg font-black text-[#7058F8]">
                  {s.n}
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES BENTO ══ */}
      <section className="border-y border-white/5 bg-white/[0.02] px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#7058F8]">الأدوات</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">كل حاجة محتاجها — في مكان واحد</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-[#7058F8]/30 hover:bg-[#7058F8]/5 ${f.wide ? "col-span-2" : ""}`}
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══ */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#7058F8]">قالوا عننا</p>
            <h2 className="text-3xl font-black text-white md:text-4xl">مؤسسون غيّروا مسار علامتهم</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/70">"{t.text}"</p>
                <div className="border-t border-white/8 pt-4">
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEAD MAGNET ══ */}
      <section className="border-y border-white/5 bg-white/[0.02] px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border border-[#7058F8]/20 bg-gradient-to-br from-[#7058F8]/10 to-cyan-500/5 p-8 md:p-12">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="flex h-48 w-36 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#7058F8] to-cyan-500 p-5 text-center text-white shadow-2xl shadow-[#7058F8]/30 [transform:perspective(800px)_rotateY(-8deg)]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">WZZRD AI</p>
                <div className="my-2 h-px w-12 bg-white/30" />
                <p className="text-sm font-black leading-snug">دليل بناء علامة لا تُقهر</p>
                <p className="mt-2 text-xs text-white/60">2026 - مجاناً</p>
              </div>
              <div className="flex-1 text-center md:text-right">
                <span className="mb-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  مجاناً تماماً
                </span>
                <h2 className="mb-3 text-2xl font-black text-white md:text-3xl">
                  حمّل دليل العلامة التجارية 2026
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-white/60">
                  12 صفحة من الاستراتيجيات العملية لبناء علامة تجارية قوية في السوق العربي.
                </p>
                {sent ? (
                  <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
                    تم الإرسال! سيصلك الدليل على بريدك قريباً
                  </p>
                ) : (
                  <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="بريدك الإلكتروني"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-[#7058F8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5a45d4] disabled:opacity-60"
                    >
                      أرسل لي الدليل
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative overflow-hidden px-4 py-28 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7058F8]/12 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[#7058F8]">ابدأ دلوقتي</p>
          <h2 className="mb-5 text-4xl font-black leading-tight text-white md:text-5xl">
            علامتك تستاهل أكتر من كده
          </h2>
          <p className="mb-10 text-lg text-white/50">
            آلاف المؤسسين في المنطقة العربية بيستخدموا WZZRD AI عشان يبنوا علامات تجارية تبيع — مش بس تبدو كويسة.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 rounded-xl bg-[#7058F8] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-[#7058F8]/40 transition-all hover:bg-[#5a45d4] hover:shadow-[#7058F8]/60"
          >
            ابدأ تشخيص مجاني الآن <ArrowRight />
          </Link>
          <p className="mt-5 text-sm text-white/30">لا بطاقة ائتمان - لا التزامات - نتيجة في دقائق</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-white/30 md:flex-row">
          <p className="font-bold text-white/50">WZZRD AI</p>
          <div className="flex gap-6">
            <Link href="/pricing" className="transition hover:text-white/60">الأسعار</Link>
            <Link href="/login" className="transition hover:text-white/60">دخول</Link>
            <Link href="/signup" className="transition hover:text-white/60">تسجيل</Link>
          </div>
          <p>2026 WZZRD AI - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}
