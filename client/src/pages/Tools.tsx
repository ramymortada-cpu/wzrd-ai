/**
 * WZRD AI — أدوات التشخيص (Prompt 5: paywall + modal).
 */
import React, { useCallback, useEffect, useState } from "react";
import WzrdPublicHeader from "../components/WzrdPublicHeader";

type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};

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

function FreeToolLink({
  tool,
  className = "",
}: {
  tool: ToolItem;
  className?: string;
}) {
  return (
    <a
      href={tool.href}
      className={`flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-teal-800/60 ${className}`}
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

function LockedToolCard({ tool, onUnlock }: { tool: ToolItem; onUnlock: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-inset ring-white/10 dark:border-gray-700 dark:bg-gray-900">
      <span className="text-3xl opacity-90" aria-hidden>
        {tool.icon}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{tool.description}</p>
      <button
        type="button"
        onClick={onUnlock}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-3 text-center text-sm font-bold text-white shadow-md transition hover:from-yellow-300 hover:to-yellow-500"
      >
        افتح الأداة (Unlock Tool)
      </button>
    </div>
  );
}

function PaywallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-900"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="paywall-title" className="text-xl font-bold text-gray-900 dark:text-white">
          ارتقِ بعلامتك التجارية إلى المستوى التالي
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          لقد استنفدت رصيدك المجاني. اشحن رصيدك الآن للوصول غير المحدود إلى أدوات الذكاء الاصطناعي المتقدمة.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <a
            href="/pricing"
            className="flex-1 rounded-xl bg-teal-600 py-3 text-center font-semibold text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            عرض باقات الأسعار
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-gray-800"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tools() {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const primaryTool = ALL_TOOLS[0];
  const quickTool = ALL_TOOLS[1];
  const paidTools = ALL_TOOLS.slice(2);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100" dir="rtl">
      <WzrdPublicHeader />
      <PaywallModal open={paywallOpen} onClose={closePaywall} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">أدوات التشخيص</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
          الأدوات المجانية متاحة فوراً؛ لباقي الأدوات احصل على اشتراك لفتح القفل دون تعطيل تجربة الاستكشاف.
        </p>

        <p className="mb-4 mt-10 text-sm font-medium text-teal-600 dark:text-teal-400">✓ متاح مجاناً</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FreeToolLink
            tool={primaryTool}
            className="transition-shadow hover:shadow-lg hover:shadow-teal-500/15 sm:col-span-2 lg:col-span-2 lg:ring-1 lg:ring-inset lg:ring-gray-200/90 dark:lg:ring-white/10"
          />
          <FreeToolLink tool={quickTool} />
        </div>

        <p className="mb-4 mt-12 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span aria-hidden>🔒</span>
          تتطلب اشتراكاً — افتح الأداة للترقية
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paidTools.map((tool) => (
            <LockedToolCard key={tool.id} tool={tool} onUnlock={openPaywall} />
          ))}
        </div>
      </main>
    </div>
  );
}
