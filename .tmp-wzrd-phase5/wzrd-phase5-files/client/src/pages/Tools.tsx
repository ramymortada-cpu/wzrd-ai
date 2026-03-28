/**
 * WZRD AI — أدوات التشخيص (عرض مجاني محدود + paywall للباقي).
 */
import React from "react";
import WzrdPublicHeader from "../components/WzrdPublicHeader";
import "../styles/wzrd-welcome.css";

type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};

/** قائمة الأدوات المعروضة (ثابتة — يمكن لاحقاً استبدالها بنتيجة tRPC دون تغيير تصميم البطاقة). */
const ALL_TOOLS: ToolItem[] = [
  {
    id: "brand_diagnosis",
    title: "تشخيص العلامة التجارية",
    description: "تحليل شامل لموقعك وهويتك مقارنة بالمنافسين في سوقك.",
    href: "/tools/diagnosis",
    icon: "🔬",
  },
  {
    id: "quick_scan",
    title: "مسح سريع",
    description: "لمحة فورية عن قوة رسالتك ووضوح عرضك أمام العميل.",
    href: "/tools/quick",
    icon: "⚡",
  },
  {
    id: "benchmark",
    title: "مقارنة مع المنافسين",
    description: "قارن مؤشرات ظهورك ونبرة صوتك مع علامات رائدة في قطاعك.",
    href: "/tools/benchmark",
    icon: "📊",
  },
  {
    id: "message_check",
    title: "فحص الرسالة والعرض",
    description: "تقييم نصوص الإعلانات والصفحات من زاوية التحويل والثقة.",
    href: "/tools/message",
    icon: "💬",
  },
  {
    id: "offer_check",
    title: "فحص العرض والتسعير",
    description: "هل عرضك واضح ومقنع؟ تحليل بنيوي لعناصر القيمة والشراء.",
    href: "/tools/offer",
    icon: "📦",
  },
  {
    id: "seo_brand",
    title: "SEO للعلامة",
    description: "توصيات لمظهرك في البحث وتماسك الكلمات المفتاحية مع الهوية.",
    href: "/seo/brand-diagnosis",
    icon: "🔍",
  },
];

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <a
      href={tool.href}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-teal-800/60"
    >
      <span className="text-3xl" aria-hidden>
        {tool.icon}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{tool.description}</p>
      <span className="mt-4 text-sm font-medium text-teal-600 dark:text-teal-400">ابدأ الأداة ←</span>
    </a>
  );
}

export default function Tools() {
  const freeTools = ALL_TOOLS.slice(0, 2);
  const paidTools = ALL_TOOLS.slice(2);

  const gridClass =
    "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100" dir="rtl">
      <WzrdPublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">أدوات التشخيص</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          اختر أداة للبدء. الأدوات المجانية متاحة فوراً؛ باقي الأدوات تفتح مع الاشتراك.
        </p>

        <p className="mb-4 mt-10 text-sm font-medium text-teal-600 dark:text-teal-400">✓ متاح مجاناً</p>
        <div className={gridClass}>
          {freeTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <p className="mb-4 mt-10 flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500">
          <span aria-hidden>🔒</span>
          يتطلب اشتراكاً
        </p>

        <div className="relative mt-10">
          <div className="pointer-events-none select-none blur-sm opacity-60">
            <div className={gridClass}>
              {paidTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/60 backdrop-blur-sm dark:bg-gray-950/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={32}
              height={32}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" />
            </svg>
            <p className="text-lg font-bold text-gray-900 dark:text-white">هذه الأدوات متاحة للمشتركين</p>
            <p className="max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
              اشترك الآن للوصول إلى جميع أدوات تشخيص علامتك التجارية
            </p>
            <a
              href="/pricing"
              className="mt-2 inline-block rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              اشترك الآن
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
