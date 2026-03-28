/**
 * WZRD AI — marketing / signup preview landing.
 * Route: add to wouter (e.g. <Route path="/" component={Welcome} />).
 */
import React from "react";
import "../styles/wzrd-welcome.css";

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

/** Abstract “AI Brand Report” glass panel with glowing ring + mock rows */
function HeroBrandReportVisual() {
  const ringRadius = 44;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = 0.82;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md dark:border-white/20 dark:bg-white/10 sm:p-7"
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
                className="stroke-white/15"
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
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div dir="ltr" className="text-white">
                <p className="text-2xl font-semibold tabular-nums leading-none sm:text-3xl">82%</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/70 sm:text-xs">
                  Brand fit
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5 self-stretch sm:pt-1">
          <div className="mb-1 flex items-center justify-between gap-2 border-b border-white/15 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/90 sm:text-sm">
              AI Brand Report
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-cyan-100 ring-1 ring-white/20 sm:text-xs">
              جاهز للمراجعة
            </span>
          </div>

          {[
            { label: "وضوح الرسالة", value: "عالي", width: "w-[88%]" },
            { label: "تميّز السوق", value: "قوي", width: "w-[76%]" },
            { label: "انسجام الهوية", value: "ممتاز", width: "w-[92%]" },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5 dark:bg-black/20"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2" dir="rtl">
                <span className="truncate text-xs font-medium text-white/95 sm:text-sm">{row.label}</span>
                <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-100 ring-1 ring-white/15 sm:text-xs">
                  {row.value}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-l from-amber-300/90 via-violet-300/90 to-cyan-300/90 ${row.width}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconPreciseAnalysis({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="16" cy="16" r="12" className="stroke-current" strokeWidth="1.25" opacity="0.35" />
      <circle cx="16" cy="16" r="6" className="stroke-current" strokeWidth="1.25" opacity="0.55" />
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4" className="stroke-current" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2" className="fill-current" />
    </svg>
  );
}

function IconLocalIdentity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M8 26V12l8-6 8 6v14"
        className="stroke-current"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M12 26V17h8v9" className="stroke-current" strokeWidth="1.25" strokeLinejoin="round" />
      <path
        d="M16 8v3M13 11h6"
        className="stroke-current"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

function IconActionableStrategy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M6 10h8v6H6zM18 8h8v10h-8zM6 20h8v6H6z"
        className="stroke-current"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M14 13h2M14 23h2" className="stroke-current" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M10 13h2M10 23h2M22 12v2" className="stroke-current" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white dark:from-slate-950 dark:via-slate-900 dark:to-black">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 20% 20%, rgb(56 189 248 / 0.25), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 30%, rgb(167 139 250 / 0.22), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgb(251 191 36 / 0.12), transparent 45%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-12 sm:pb-16 sm:pt-16 md:pb-20 md:pt-20 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
            <div className="order-1 text-center lg:text-right" dir="rtl">
              <h1 className="text-hero-premium text-3xl font-bold leading-[1.35] tracking-tight sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.3] xl:text-5xl">
                شخّص. صمّم. أطلق. علامتك التجارية بالذكاء الاصطناعي
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0 lg:max-w-none">
                بديلك الذكي لوكالات التسويق. احصل على استراتيجية وهوية بصرية متكاملة في دقائق.
              </p>
            </div>

            <div className="order-2">
              <HeroBrandReportVisual />
            </div>
          </div>
        </div>
      </header>

      <div
        className="border-b border-slate-200/90 bg-slate-50/95 py-5 dark:border-white/10 dark:bg-slate-900/60"
        role="region"
        aria-label="مصداقية التدريب"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <p
            className="text-center text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:flex-1 sm:text-right sm:text-base"
            dir="rtl"
          >
            تم تدريب نماذجنا على تحليل أكثر من 500 علامة تجارية ناجحة في السوق السعودي والخليجي.
          </p>
          <ul
            className="flex flex-wrap items-center justify-center gap-6 sm:shrink-0 sm:justify-end sm:gap-8"
            dir="rtl"
          >
            <li className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 sm:min-w-[5.5rem]">
              <IconPreciseAnalysis className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">تحليل دقيق</span>
            </li>
            <li className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 sm:min-w-[5.5rem]">
              <IconLocalIdentity className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">هوية محلية</span>
            </li>
            <li className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 sm:min-w-[6.5rem]">
              <IconActionableStrategy className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <span className="text-center text-xs font-medium leading-snug text-slate-700 dark:text-slate-300">
                استراتيجية قابلة للتنفيذ
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <section
            aria-labelledby="report-preview-heading"
            className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:p-10"
          >
            <h2
              id="report-preview-heading"
              className="mb-8 text-center text-xl font-semibold text-gray-900 dark:text-gray-100 md:text-2xl"
            >
              Report Preview
            </h2>

            <div className="grid gap-8 md:grid-cols-2 md:gap-10">
              <div className="order-2 md:order-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Brand Score</span>
                      <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        92<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/100</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: "92%" }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Consistency, clarity, and differentiation vs. peers
                    </p>
                  </div>

                  <div className="col-span-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Generated copy
                      </span>
                      <button
                        type="button"
                        className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label="Copy text"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p dir="rtl" className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      نقدّم تجربة متوازنة تجمع بين الثقة والدفء — رسالة واضحة لجمهورك قبل الإطلاق.
                    </p>
                  </div>

                  <div className="col-span-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <span className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sentiment
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div className="h-full w-[72%] rounded-full bg-emerald-500" />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                          72%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div className="h-full w-[18%] rounded-full bg-amber-400" />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                          18%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div className="h-full w-[10%] rounded-full bg-rose-400" />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                          10%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> إيجابي
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" /> محايد
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-400" /> سلبي
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 flex flex-col justify-center md:order-2" dir="rtl">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  معاينة عالية الدقة لما ستحصل عليه بعد التسجيل — جاهزة لمراجعة فيصل قبل الالتزام.
                </p>
                <ul className="space-y-3 text-gray-900 dark:text-gray-100">
                  <li className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="text-base leading-snug">تحليل المنافسين العميق</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="text-base leading-snug">نبرة الصوت المخصصة</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="text-base leading-snug">خطة إطلاق متكاملة</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
