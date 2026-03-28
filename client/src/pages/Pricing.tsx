/**
 * WZRD AI — صفحة الأسعار (Prompt 6: decoy + كوبون + FAQ).
 */
import React, { useState } from "react";
import WzrdPublicHeader from "../components/WzrdPublicHeader";

const PLANS = [
  {
    name: "مجاني",
    price: { monthly: 0, yearly: 0 },
    currency: "ريال",
    description: "للمستكشفين الذين يريدون تجربة WZRD",
    features: [
      "تشخيصان مجانيان",
      "تقرير نصي مختصر",
      "الوصول لأداتين أساسيتين",
    ],
    cta: "ابدأ مجاناً",
    ctaHref: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: { monthly: 149, yearly: 119 },
    currency: "ريال / شهر",
    description: "للمؤسسين الجادين الذين يبنون علامة لا تُنسى",
    features: [
      "تشخيصات غير محدودة",
      "تقرير PDF كامل قابل للتنزيل",
      "الوصول لجميع الأدوات",
      "مقارنة تنافسية (قريباً)",
      "دعم أولوية عبر واتساب",
    ],
    cta: "ابدأ تجربة 7 أيام مجاناً",
    ctaHref: "/signup?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: { monthly: 499, yearly: 399 },
    currency: "ريال / شهر",
    description: "للوكالات والشركات التي تدير أكثر من علامة",
    features: [
      "كل مزايا Pro",
      "حتى 10 علامات تجارية",
      "تقارير White-label",
      "API access",
      "مدير حساب مخصص",
    ],
    cta: "تواصل معنا",
    ctaHref: "mailto:hello@wzrd.ai",
    highlighted: false,
  },
] as const;

function displayPriceForBilling(monthly: number, billing: "monthly" | "yearly"): number {
  if (monthly === 0) return 0;
  if (billing === "monthly") return monthly;
  return Math.round(monthly * 0.8);
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "هل يمكنني استرداد أموالي؟",
    a: "نعم، وفق سياسة الاسترداد المعروضة عند الشراء. إن لم تكن راضياً خلال الفترة المحددة يمكنك طلب استرداد وفق الشروط.",
  },
  {
    q: "كيف يعمل التقرير؟",
    a: "تجيب عن أسئلة قصيرة عن علامتك، يحلل النظام بياناتك ومنافسيك، ثم يصدر لك تقريراً منظماً بتوصيات عملية جاهزة للتنفيذ.",
  },
  {
    q: "هل تدعمون اللغة العربية بالكامل؟",
    a: "نعم، الواجهة والتقارير مصممة للعربية (RTL) مع دعم كامل للنصوص والمصطلحات المحلية.",
  },
  {
    q: "هل يمكنني الإلغاء في أي وقت؟",
    a: "نعم، يمكنك إلغاء اشتراكك في أي وقت دون التزام طويل الأمد.",
  },
  {
    q: "ما الفرق بين التقرير المجاني والـ Pro؟",
    a: "التقرير المجاني يعطيك ملخصاً نصياً. تقرير Pro يعطيك PDF كاملاً مع توصيات مفصّلة وخطة عمل.",
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white" dir="rtl">
      <WzrdPublicHeader />

      <main className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-14 text-center">
          <h1 className="mb-4 text-4xl font-bold">اختر خطتك</h1>
          <p className="mx-auto max-w-xl text-lg text-gray-500 dark:text-gray-400">
            ابدأ مجاناً. ادفع فقط عندما تكون مستعداً للنمو الحقيقي.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 font-semibold transition-colors ${
                billing === "monthly"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              شهري
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-5 py-2 font-semibold transition-colors ${
                billing === "yearly"
                  ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              سنوي (وفّر 20%)
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 py-4 md:grid-cols-3 md:gap-8">
          {PLANS.map((plan) => {
            const shownPrice = displayPriceForBilling(plan.price.monthly, billing);
            const isMid = plan.highlighted;
            return (
              <div
                key={plan.name}
                className={`flex flex-col gap-5 rounded-2xl border p-8 transition-shadow ${
                  isMid
                    ? "relative z-10 border-teal-500 bg-teal-50 shadow-xl shadow-teal-500/20 ring-2 ring-teal-500 dark:bg-teal-950/40 md:scale-105"
                    : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900"
                }`}
              >
                {isMid ? (
                  <span className="absolute -top-3 right-6 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
                    الأكثر طلباً
                  </span>
                ) : null}

                <div>
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{shownPrice}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.currency}</span>
                </div>

                <ul className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.ctaHref}
                  className={`mt-auto rounded-xl py-3 text-center font-semibold transition-colors ${
                    isMid
                      ? "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          {!couponOpen ? (
            <button
              type="button"
              onClick={() => setCouponOpen(true)}
              className="text-sm font-medium text-teal-600 underline decoration-teal-600/40 underline-offset-4 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              لديك كود خصم؟
            </button>
          ) : (
            <div className="mx-auto flex max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="أدخل كود الخصم"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold dark:bg-gray-800"
              >
                تطبيق
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">أسئلة شائعة</h2>
          {FAQ_ITEMS.map(({ q, a }) => (
            <details key={q} className="group border-b border-gray-200 py-4 dark:border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900 dark:text-white">
                {q}
                <span className="text-gray-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            لديك سؤال؟ تواصل معنا على{" "}
            <a href="mailto:hello@wzrd.ai" className="text-teal-600 underline dark:text-teal-400">
              hello@wzrd.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
