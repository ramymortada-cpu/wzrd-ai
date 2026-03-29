import React, { useState, type FormEvent } from "react";
import { Link } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { trpc } from "@/lib/trpc";

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

function HeroBrandReportVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:p-7">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl" aria-hidden />
      <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <div className="flex flex-col items-center">
          <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <defs>
                <linearGradient id="wzrdHeroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                className="stroke-white/20"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="url(#wzrdHeroRingGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - 0.82)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-white">82%</span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-white/80">Brand Score</p>
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-right">
          <p className="text-sm font-semibold text-white">معاينة التقرير</p>
          {[
            { label: "تماسك الهوية", w: "w-[92%]" },
            { label: "وضوح الرسالة", w: "w-[78%]" },
            { label: "التمايز عن المنافسين", w: "w-[85%]" },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between gap-2 text-xs text-white/90">
                <span>{row.label}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-l from-teal-400 to-cyan-400 ${row.w}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-6 w-6 shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" className="stroke-emerald-500" strokeWidth="1.5" />
      <path
        d="M6 10.2 8.4 12.6 14 7"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" className="stroke-gray-500" strokeWidth="1.5" />
      <path
        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        className="stroke-gray-500"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Welcome() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const subscribe = trpc.leads.subscribeToLeadMagnet.useMutation({
    onSuccess: () => {
      setSent(true);
      setEmail("");
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribe.mutate({ email: email.trim() });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-zinc-900 dark:bg-gray-950 dark:text-zinc-100">
      <WzrdPublicHeader credits={null} showCredits={false} />

      <main className="pt-28">
        {/* SECTION 1 — Hero */}
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-teal-950 px-4 pb-20 pt-8">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-right">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400">
                ✦ مدعوم بالذكاء الاصطناعي
              </span>
              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                <span className="text-hero-premium">شخّص. صمّم. أطلق.</span>{" "}
                علامتك التجارية بالذكاء الاصطناعي
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300 lg:mx-0">
                بديلك الذكي لوكالات التسويق. احصل على استراتيجية وهوية بصرية متكاملة في دقائق.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="/signup"
                  className="rounded-2xl bg-teal-500 px-8 py-4 text-center text-lg font-bold text-white hover:bg-teal-400"
                >
                  ابدأ مجاناً الآن
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-2xl border border-white/20 px-8 py-4 text-center text-lg text-white hover:bg-white/5"
                >
                  شوف كيف يعمل
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <HeroBrandReportVisual />
            </div>
          </div>
        </section>

        {/* SECTION 2 — Authority strip */}
        <section className="border-y border-gray-200/80 bg-gray-50 py-12 dark:border-white/10 dark:bg-gray-900/50">
          <p className="mx-auto max-w-3xl px-4 text-center text-base text-gray-700 dark:text-gray-300 sm:text-lg">
            تم تدريب نماذجنا على تحليل أكثر من 500 علامة تجارية ناجحة في السوق السعودي والخليجي.
          </p>
          <ul className="mt-10 flex flex-col items-center justify-center gap-10 px-4 sm:flex-row sm:gap-14">
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <svg
                className="h-10 w-10 text-teal-600 dark:text-teal-400"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M8 36V28M18 36V20M28 36V24M38 36V14" />
              </svg>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">تحليل دقيق</span>
            </li>
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <svg
                className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M24 42s12-8.5 12-20a12 12 0 1 0-24 0c0 11.5 12 20 12 20Z" />
                <circle cx="24" cy="22" r="4" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">هوية محلية</span>
            </li>
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <svg
                className="h-10 w-10 text-amber-600 dark:text-amber-400"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M14 32h20M14 24h14M14 16h20" />
                <circle cx="36" cy="16" r="3" fill="currentColor" />
                <circle cx="30" cy="24" r="3" fill="currentColor" />
                <circle cx="34" cy="32" r="3" fill="currentColor" />
              </svg>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">استراتيجية قابلة للتنفيذ</span>
            </li>
          </ul>
        </section>

        {/* SECTION 3 — How It Works */}
        <section id="how-it-works" className="scroll-mt-28 bg-white px-4 py-20 dark:bg-gray-950">
          <h2 className="mb-14 text-center text-3xl font-black text-zinc-900 dark:text-white">
            كيف يعمل WZZRD AI؟
          </h2>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
            {[
              { n: "١", title: "أجب على 5 أسئلة", desc: "عن علامتك التجارية وسوقك المستهدف" },
              { n: "٢", title: "الذكاء الاصطناعي يحلل", desc: "يقارن علامتك بمئات العلامات في نفس القطاع" },
              { n: "٣", title: "احصل على تقريرك", desc: "تقرير PDF احترافي جاهز للتنفيذ فوراً" },
            ].map((step) => (
              <div key={step.n}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-xl font-black text-white">
                  {step.n}
                </div>
                <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — Report Bento Preview */}
        <section className="border-y border-gray-200 bg-gray-50 py-16 dark:border-white/10 dark:bg-gray-900/40">
          <h2 className="mb-10 text-center text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">
            معاينة التقرير — ماذا ستحصل؟
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-4 md:grid-cols-2 md:gap-12">
            <ul className="order-2 flex flex-col gap-6 md:order-1">
              {[
                "تحليل المنافسين العميق",
                "نبرة الصوت المخصصة",
                "خطة إطلاق متكاملة",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-base text-zinc-800 dark:text-zinc-200">{text}</span>
                </li>
              ))}
            </ul>
            <div className="order-1 grid grid-cols-2 gap-4 md:order-2">
              <div className="col-span-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">Brand Score</span>
                  <span className="text-sm font-bold text-emerald-600">92/100</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full w-[92%] rounded-full bg-gradient-to-l from-emerald-500 to-teal-400" />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  الاتساق، الوضوح، والتمايز أمام المنافسين
                </p>
              </div>
              <div className="col-span-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-gray-800">
                <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">تحليل المشاعر</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-200">
                    ثقة
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-900 dark:text-amber-100">
                    طموح
                  </span>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-900 dark:text-sky-100">
                    ودّي
                  </span>
                </div>
              </div>
              <div className="col-span-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">نبرة الصوت</p>
                  <button type="button" className="rounded p-1 text-gray-500 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <CopyIcon />
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  احترافي، قريب من العميل السعودي، مع لمسة شبابية…
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Lead Magnet */}
        <section className="border-y border-teal-200/60 bg-teal-500/5 py-16 dark:border-teal-800/40 dark:bg-teal-500/10">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 md:grid-cols-2">
            <div>
              <span className="mb-4 inline-block rounded-full bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                مجاناً تماماً
              </span>
              <h2 className="mb-4 text-2xl font-black text-zinc-900 dark:text-white md:text-3xl">
                حمّل دليل العلامة التجارية 2026
              </h2>
              <p className="mb-6 leading-relaxed text-zinc-600 dark:text-zinc-400">
                ١٢ صفحة من الاستراتيجيات العملية لبناء علامة تجارية قوية في السوق العربي
              </p>
              {sent ? (
                <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 font-medium text-green-700 dark:text-green-400">
                  تم الإرسال! سيصلك الدليل على بريدك قريباً ✓
                </p>
              ) : (
                <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/40 dark:border-zinc-700 dark:bg-zinc-900"
                    disabled={subscribe.isPending}
                  />
                  <button
                    type="submit"
                    disabled={subscribe.isPending}
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-teal-500 disabled:opacity-60"
                  >
                    أرسل لي الدليل
                  </button>
                </form>
              )}
              {subscribe.isError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">تعذر الإرسال. حاول مرة أخرى.</p>
              )}
            </div>
            <div className="hidden justify-center md:flex">
              <div className="flex aspect-[3/4] w-48 max-w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-purple-600 p-6 text-center text-white shadow-2xl transition-transform duration-300 [transform:perspective(1000px)_rotateY(-12deg)] hover:[transform:perspective(1000px)_rotateY(0deg)]">
                <p className="font-bold">أسرار بناء علامة لا تُقهر</p>
                <p className="mt-2 text-xs text-white/85">2026 · WZZRD AI</p>
                <div className="my-3 h-px w-16 bg-white/40" />
                <p className="text-xs text-white/80">دليل مجاني</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6 — Final CTA */}
        <section className="bg-gradient-to-br from-gray-900 to-teal-950 px-4 py-20 text-center text-white">
          <h2 className="mb-4 text-4xl font-black">جاهز تبني علامة تجارية تُنافس؟</h2>
          <p className="mb-10 text-lg text-gray-300">ابدأ مجاناً. لا بطاقة ائتمان. لا التزامات.</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-10 py-4 text-base font-bold text-white shadow-lg transition hover:bg-teal-400"
          >
            ابدأ تشخيص علامتك الآن
          </Link>
        </section>
      </main>
    </div>
  );
}
