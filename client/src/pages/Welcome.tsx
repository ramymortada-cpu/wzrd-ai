import { useState, FormEvent } from "react";
import { Link } from "wouter";
import WzrdPublicHeader from "@/components/WzrdPublicHeader";
import { trpc } from "@/lib/trpc";

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
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-teal-950 flex flex-col items-center justify-center px-4 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400 mb-8">
            ✦ مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="text-5xl font-black text-white max-w-4xl mx-auto leading-tight">
            علامتك التجارية تستحق أكثر من Canva
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto text-center mt-6 leading-relaxed">
            WZRD AI يحلل علامتك التجارية ويبني هويتها بدقة احترافية — في دقائق لا أسابيع.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-400"
            >
              ابدأ مجاناً الآن
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              شوف كيف يعمل
            </a>
          </div>
          <p className="mt-12 text-sm text-gray-400 max-w-xl mx-auto">
            انضم إلى أكثر من 200 رائد أعمال عربي يثقون في WZRD AI
          </p>
        </section>

        {/* SECTION 2 — Authority */}
        <section className="bg-gray-50 dark:bg-gray-900/50 py-16 px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-zinc-900 dark:text-white max-w-3xl mx-auto mb-12 leading-snug">
            مبني على تحليل أكثر من 500 علامة تجارية في السوق العربي
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { stat: "٩٨٪", label: "دقة في تشخيص الهوية البصرية" },
              { stat: "٣ دقائق", label: "متوسط وقت الحصول على التقرير" },
              { stat: "٤.٩/٥", label: "تقييم المستخدمين الأوائل" },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm border border-zinc-100/80 dark:border-zinc-700/50"
              >
                <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mb-2">{card.stat}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{card.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3 — How It Works */}
        <section id="how-it-works" className="bg-white dark:bg-gray-950 py-20 px-4 scroll-mt-28">
          <h2 className="text-3xl font-black text-center text-zinc-900 dark:text-white mb-14">
            كيف يعمل WZRD AI؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
            {[
              { n: "١", title: "أجب على 5 أسئلة", desc: "عن علامتك التجارية وسوقك المستهدف" },
              { n: "٢", title: "الذكاء الاصطناعي يحلل", desc: "يقارن علامتك بمئات العلامات في نفس القطاع" },
              { n: "٣", title: "احصل على تقريرك", desc: "تقرير PDF احترافي جاهز للتنفيذ فوراً" },
            ].map((step) => (
              <div key={step.n}>
                <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center text-xl font-black mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 — Lead Magnet */}
        <section className="bg-teal-50/50 dark:bg-teal-950/20 border-y border-teal-100 dark:border-teal-900/30 py-16 px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <div>
              <span className="inline-block rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-bold px-3 py-1 mb-4">
                مجاناً تماماً
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-4">
                حمّل دليل العلامة التجارية 2026
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                ١٢ صفحة من الاستراتيجيات العملية لبناء علامة تجارية قوية في السوق العربي
              </p>
              {sent ? (
                <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-700 dark:text-green-400 font-medium">
                  تم الإرسال! سيصلك الدليل على بريدك قريباً ✓
                </p>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
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
            <div className="hidden md:flex justify-center">
              <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 shadow-2xl flex flex-col items-center justify-center p-6 text-white text-center [transform:perspective(1000px)_rotateY(-8deg)]">
                <p className="text-lg font-black leading-tight">دليل العلامة التجارية 2026</p>
                <p className="text-sm mt-2 text-teal-100">WZRD AI</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Final CTA */}
        <section className="bg-gradient-to-br from-gray-900 to-teal-950 text-white py-20 px-4 text-center">
          <h2 className="text-4xl font-black mb-4">جاهز تبني علامة تجارية تُنافس؟</h2>
          <p className="text-lg text-gray-300 mb-10">ابدأ مجاناً. لا بطاقة ائتمان. لا التزامات.</p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-teal-400 transition"
          >
            ابدأ تشخيص علامتك الآن
          </Link>
        </section>
      </main>
    </div>
  );
}
