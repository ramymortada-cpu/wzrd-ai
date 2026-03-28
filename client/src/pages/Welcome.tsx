import React, { useState } from "react";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { trpc } from "@/lib/trpc";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
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

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        className="stroke-gray-500 dark:stroke-gray-400"
        strokeWidth="1.5"
      />
      <path
        d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        className="stroke-gray-500 dark:stroke-gray-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Glassmorphism «AI Brand Report» — حلقة تقدم + صفوف وهمية */
function HeroBrandReportVisual() {
  const ringRadius = 44;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = 0.82;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md dark:border-white/20 dark:bg-white/10 sm:p-7"
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-400/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/25"
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative">
            <svg
              className="ring-glow-pulse h-28 w-28 -rotate-90 sm:h-32 sm:w-32"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="wzrdHeroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="55%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                className="stroke-white/20 dark:stroke-white/15"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                stroke="url(#wzrdHeroRingGrad)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black tabular-nums text-white sm:text-xl">82%</span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-medium text-white/80">Brand Score</p>
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-right">
          <p className="text-sm font-semibold text-white">معاينة التقرير</p>
          {[
            { label: "تماسك الهوية", w: "w-[92%]" },
            { label: "وضوح الرسالة", w: "w-[78%]" },
            { label: "التمايز عن المنافسين", w: "w-[85%]" },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>{row.label}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full bg-gradient-to-l from-teal-400 to-cyan-400 ${row.w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconAnalysis({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M8 36V28M18 36V20M28 36V24M38 36V14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLocal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 42s12-8.5 12-20a12 12 0 1 0-24 0c0 11.5 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22" r="4" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function IconStrategy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M14 32h20M14 24h14M14 16h20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="16" r="3" fill="currentColor" />
      <circle cx="30" cy="24" r="3" fill="currentColor" />
      <circle cx="34" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

export default function Welcome() {
  const [email, setEmail] = useState("");
  const subscribeMutation = trpc.leads.subscribeToLeadMagnet.useMutation();

  const onSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    subscribeMutation.mutate({ email: trimmed });
  };

  const previewBullets = [
    "تحليل المنافسين العميق",
    "نبرة الصوت المخصصة",
    "خطة إطلاق متكاملة",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      <WzrdPublicHeader />

      {/* SECTION 1 — Hero (Prompt 1) */}
      <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-teal-950">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="text-center lg:text-right">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400">
              ✦ مدعوم بالذكاء الاصطناعي
            </span>
            <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-hero-premium font-black">
                شخّص. صمّم. أطلق. علامتك التجارية بالذكاء الاصطناعي
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-300 lg:mx-0 lg:max-w-none lg:text-xl">
              بديلك الذكي لوكالات التسويق. احصل على استراتيجية وهوية بصرية متكاملة في دقائق.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center lg:justify-start">
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

      {/* Authority proof — بدل إحصاءات وهمية (Prompt 1) */}
      <section
        className="border-y border-gray-200/80 bg-gray-50 py-12 dark:border-white/10 dark:bg-gray-900/50"
        aria-label="مصداقية التدريب"
      >
        <div className="mx-auto max-w-6xl px-4">
          <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-gray-700 dark:text-gray-300 sm:text-lg">
            تم تدريب نماذجنا على تحليل أكثر من 500 علامة تجارية ناجحة في السوق السعودي والخليجي.
          </p>
          <ul className="mt-10 flex flex-col items-center justify-center gap-10 sm:flex-row sm:flex-wrap sm:gap-14 md:gap-20">
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <IconAnalysis className="h-10 w-10 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">تحليل دقيق</span>
            </li>
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <IconLocal className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">هوية محلية</span>
            </li>
            <li className="flex max-w-[11rem] flex-col items-center gap-2 text-center">
              <IconStrategy className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">استراتيجية قابلة للتنفيذ</span>
            </li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
            كيف يعمل WZRD AI؟
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: "١", t: "أجب على 5 أسئلة", d: "عن علامتك التجارية وسوقك المستهدف" },
              { n: "٢", t: "الذكاء الاصطناعي يحلل", d: "يقارن علامتك بمئات العلامات في نفس القطاع" },
              { n: "٣", t: "احصل على تقريرك", d: "تقرير PDF احترافي جاهز للتنفيذ فوراً" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-xl font-black text-white">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{step.t}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Preview — Bento (Prompt 2) */}
      <section
        className="border-y border-gray-200 bg-gray-50 py-16 dark:border-white/10 dark:bg-gray-900/40"
        aria-labelledby="report-preview-heading"
      >
        <div className="mx-auto max-w-6xl px-4">
          <h2
            id="report-preview-heading"
            className="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl"
          >
            معاينة التقرير — ماذا ستحصل؟
          </h2>
          <div className="grid items-start gap-10 md:grid-cols-2 md:gap-12">
            <div className="order-2 md:order-1">
              <ul className="space-y-4 text-right">
                {previewBullets.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="text-base font-medium text-gray-800 dark:text-gray-200">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Brand Score</span>
                    <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      92<span className="text-sm font-normal text-gray-500">/100</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400"
                      style={{ width: "92%" }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    الاتساق، الوضوح، والتمايز أمام المنافسين
                  </p>
                </div>
                <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
                  <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">تحليل المشاعر</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                      ثقة
                    </span>
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-300">
                      طموح
                    </span>
                    <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-xs text-sky-800 dark:text-sky-300">
                      ودّي
                    </span>
                  </div>
                </div>
                <div className="col-span-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">نبرة الصوت</p>
                    <button
                      type="button"
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="نسخ"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    &quot;احترافي، قريب من العميل السعودي، مع لمسة شبابية…&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnet (Prompt 4) */}
      <section className="border-y border-teal-200/60 bg-teal-500/5 py-16 dark:border-teal-800/40 dark:bg-teal-500/10">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">لست مستعداً للتشخيص الكامل بعد؟</h2>
            <p className="mt-3 text-lg text-gray-700 dark:text-gray-300">
              احصل على دليلنا المجاني: &quot;أسرار بناء علامة تجارية لا تُقهر في 2026&quot;
            </p>
            {subscribeMutation.isSuccess ? (
              <p className="mt-6 font-medium text-emerald-600 dark:text-emerald-400">
                تم الإرسال! سيصلك الدليل على بريدك قريباً ✓
              </p>
            ) : (
              <form onSubmit={onSubmitLead} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  disabled={subscribeMutation.isPending}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  أرسل لي الدليل
                </button>
              </form>
            )}
          </div>
          <div className="hidden justify-center md:flex">
            <div
              className="flex aspect-[3/4] w-48 max-w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-purple-600 p-6 text-center text-white shadow-2xl transition-transform duration-300 [transform:perspective(1000px)_rotateY(-12deg)] hover:[transform:perspective(1000px)_rotateY(0deg)]"
              aria-hidden
            >
              <p className="text-base font-bold leading-snug">أسرار بناء علامة لا تُقهر</p>
              <p className="mt-2 text-xs text-white/85">2026 · WZRD AI</p>
              <div className="my-4 h-0.5 w-14 bg-white/40" />
              <p className="text-xs text-white/80">دليل مجاني</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-gray-900 to-teal-950 py-20 text-center text-white">
        <h2 className="text-4xl font-black">جاهز تبني علامة تجارية تُنافس؟</h2>
        <p className="mt-4 text-lg text-gray-300">ابدأ مجاناً. لا بطاقة ائتمان. لا التزامات.</p>
        <a
          href="/signup"
          className="mt-8 inline-block rounded-2xl bg-teal-500 px-10 py-4 text-xl font-bold text-white hover:bg-teal-400"
        >
          ابدأ تشخيص علامتك الآن
        </a>
      </section>
    </div>
  );
}
