import React, { useState } from "react";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { trpc } from "@/lib/trpc";

export default function Welcome() {
  const [email, setEmail] = useState("");
  const subscribeMutation = trpc.leads.subscribeToLeadMagnet.useMutation();

  const onSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    subscribeMutation.mutate({ email: trimmed });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir="rtl">
      <WzrdPublicHeader />

      {/* SECTION 1 — Hero */}
      <section className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-teal-950">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400">
            ✦ مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="text-5xl font-black text-white">علامتك التجارية تستحق أكثر من Canva</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300">
            WZRD AI يحلل علامتك التجارية ويبني هويتها بدقة احترافية — في دقائق لا أسابيع.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center">
            <a
              href="/signup"
              className="rounded-2xl bg-teal-500 px-8 py-4 text-center text-lg font-bold text-white hover:bg-teal-400"
            >
              ابدأ مجاناً الآن
            </a>
            <a
              href="#how-it-works"
              className="rounded-2xl border border-white/20 px-8 py-4 text-center text-lg text-white"
            >
              شوف كيف يعمل
            </a>
          </div>
          <p className="mt-10 text-sm text-gray-400">
            انضم إلى أكثر من 200 رائد أعمال عربي يثقون في WZRD AI
          </p>
        </div>
      </section>

      {/* SECTION 2 — Social Proof */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            مبني على تحليل أكثر من 500 علامة تجارية في السوق العربي
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-gray-800">
              <p className="text-3xl font-black text-teal-600 dark:text-teal-400">٩٨٪</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">دقة في تشخيص الهوية البصرية</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-gray-800">
              <p className="text-3xl font-black text-teal-600 dark:text-teal-400">٣ دقائق</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">متوسط وقت الحصول على التقرير</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-gray-800">
              <p className="text-3xl font-black text-teal-600 dark:text-teal-400">٤.٩/٥</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">تقييم المستخدمين الأوائل</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — How It Works */}
      <section id="how-it-works" className="bg-white py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
            كيف يعمل WZRD AI؟
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-xl font-black text-white">
                ١
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">أجب على 5 أسئلة</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">عن علامتك التجارية وسوقك المستهدف</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-xl font-black text-white">
                ٢
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">الذكاء الاصطناعي يحلل</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                يقارن علامتك بمئات العلامات في نفس القطاع
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-xl font-black text-white">
                ٣
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">احصل على تقريرك</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">تقرير PDF احترافي جاهز للتنفيذ فوراً</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Lead Magnet */}
      <section className="border-y border-teal-100 bg-teal-50/50 py-16 dark:border-teal-900/30 dark:bg-teal-950/20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-teal-600/15 px-3 py-1 text-sm font-semibold text-teal-800 dark:text-teal-300">
              مجاناً تماماً
            </span>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              حمّل دليل العلامة التجارية 2026
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              ١٢ صفحة من الاستراتيجيات العملية لبناء علامة تجارية قوية في السوق العربي
            </p>
            {subscribeMutation.isSuccess ? (
              <p className="mt-6 font-medium text-emerald-600 dark:text-emerald-400">
                تم الإرسال! سيصلك الدليل على بريدك قريباً ✓
              </p>
            ) : (
              <form onSubmit={onSubmitLead} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
          <div className="hidden items-center justify-center md:flex">
            <div
              className="flex h-64 w-48 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-center text-white shadow-2xl [transform:perspective(1000px)_rotateY(-8deg)]"
              aria-hidden
            >
              <p className="text-lg font-bold">دليل العلامة التجارية 2026</p>
              <p className="mt-1 text-sm text-white/80">WZRD AI</p>
              <div className="my-3 h-0.5 w-12 bg-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Final CTA */}
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
