import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';
import { waMeHref } from '@/lib/waContact';

function isPaymobGatewayConfigError(message: string): boolean {
  const m = (message || '').toLowerCase();
  return (
    m.includes('paymob not configured') ||
    m.includes('paymob_secret') ||
    m.includes('paymob_public') ||
    m.includes('no paymob integration') ||
    (m.includes('paymob') && m.includes('key'))
  );
}

type PlanRow = {
  id: string;
  credits: number;
  price: number;
  currency: string;
  popular: boolean;
  label: string;
  labelEn: string;
  description: string;
  descEn: string;
};

const FALLBACK_PLANS: PlanRow[] = [
  { id: 'single_report', credits: 100, price: 99, currency: 'EGP', popular: false, label: 'تقرير واحد', labelEn: 'Single Report', description: 'تقرير مفصّل واحد', descEn: '1 Premium AI report' },
  { id: 'bundle_6', credits: 800, price: 499, currency: 'EGP', popular: true, label: 'باقة ٦ تقارير', labelEn: '6-Report Bundle', description: 'وفّر ٤٥% — أشمل تحليل', descEn: 'Save 45% — comprehensive' },
  { id: 'credits_500', credits: 500, price: 499, currency: 'EGP', popular: false, label: '٥٠٠ كريدت', labelEn: '500 Credits', description: '~٢٥ أداة تشخيص', descEn: '~25 tool runs' },
  { id: 'credits_1500', credits: 1500, price: 999, currency: 'EGP', popular: false, label: '١٥٠٠ كريدت', labelEn: '1500 Credits', description: 'الأوفر — ~٧٥ أداة', descEn: 'Best value — ~75 tools' },
];

function mapApiPlans(raw: unknown): PlanRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((p: Record<string, unknown>) => ({
    id: String(p.id),
    credits: Number(p.credits) || 0,
    price: Number(p.priceEGP) || 0,
    currency: 'EGP',
    popular: Boolean(p.popular),
    label: String(p.nameAr || p.name || p.id),
    labelEn: String(p.name || p.id),
    description: String(p.descAr || ''),
    descEn: String(p.descEn || ''),
  }));
}

type PromoResult = {
  valid: boolean;
  message: string | null;
  finalAmountEGP: number;
  originalAmountEGP: number;
  discountPercent: number | null;
  discountFixedEGP: number | null;
};

const PLAN_FEATURES: Record<string, string[]> = {
  single_report: [
    'تقرير Brand Health Score كامل',
    'تحليل هوية العلامة التجارية',
    'خطة تحسين فورية',
    'صالح ٣٠ يوم',
  ],
  bundle_6: [
    '٦ تقارير متكاملة',
    'Brand Health + Identity + Offer Logic',
    'تقرير SEO + Presence Audit',
    'خطة تنفيذ مرتبة بالأولوية',
    'دعم WhatsApp مباشر',
    'وفّر ٤٥% مقارنة بالتقارير الفردية',
  ],
  credits_500: [
    '٥٠٠ كريدت — ~٢٥ أداة',
    'كل أدوات التشخيص متاحة',
    'استخدام مرن حسب احتياجك',
    'صالحة ٦ أشهر',
  ],
  credits_1500: [
    '١٥٠٠ كريدت — ~٧٥ أداة',
    'الأوفر في السعر',
    'كل أدوات التشخيص + التقارير',
    'أولوية في الدعم',
    'صالحة سنة كاملة',
  ],
};

const PLAN_ICONS: Record<string, string> = {
  single_report: '📄',
  bundle_6: '🚀',
  credits_500: '⚡',
  credits_1500: '💎',
};

export default function Pricing() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const [credits, setCredits] = useState<number | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>(FALLBACK_PLANS);
  const [promoCode, setPromoCode] = useState('');
  const [promoPlanId, setPromoPlanId] = useState(FALLBACK_PLANS[0].id);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((d) => {
        const mapped = mapApiPlans(d?.creditPlans?.plans);
        if (mapped && mapped.length) {
          setPlans(mapped);
          setPromoPlanId(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const planForPromo = useMemo(() => plans.find((p) => p.id === promoPlanId) ?? plans[0], [plans, promoPlanId]);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  const verifyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoResult({ valid: false, message: 'اكتب الكود الأول', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
      return;
    }
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch('/api/trpc/premium.validatePromo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { code, amountEGP: planForPromo.price } }),
      });
      const data = await res.json();
      const row = data?.result?.data?.json ?? data?.result?.data;
      if (row) {
        setPromoResult({
          valid: !!row.valid,
          message: row.message ?? null,
          finalAmountEGP: row.finalAmountEGP ?? planForPromo.price,
          originalAmountEGP: row.originalAmountEGP ?? planForPromo.price,
          discountPercent: row.discountPercent ?? null,
          discountFixedEGP: row.discountFixedEGP ?? null,
        });
      } else {
        setPromoResult({ valid: false, message: 'رد غير متوقع', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
      }
    } catch {
      setPromoResult({ valid: false, message: 'خطأ في الاتصال', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
    } finally {
      setPromoLoading(false);
    }
  };

  const purchasePlan = async (planId: string) => {
    setPurchasingId(planId);
    try {
      const res = await fetch('/api/trpc/credits.purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { planId, ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}) },
        }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json;
      if (result?.success && result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        const msg = typeof result?.message === 'string' ? result.message : '';
        if (isPaymobGatewayConfigError(msg)) {
          toast.info('بوابة الدفع تحت التحديث — يرجى المحاولة لاحقاً.', { duration: 6000 });
        } else {
          toast.error(msg || 'تعذّر إتمام الدفع.');
        }
      }
    } catch {
      toast.error('خطأ في الاتصال. حاول تاني.');
    } finally {
      setPurchasingId(null);
    }
  };

  const getPlanFeatures = (plan: PlanRow): string[] => {
    return PLAN_FEATURES[plan.id] ?? [
      locale === 'ar' ? plan.label : plan.labelEn,
      `${locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} كريدت`,
      locale === 'ar' ? (plan.description || plan.descEn) : (plan.descEn || plan.description),
    ];
  };

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white" dir="rtl">
      <WzrdPublicHeader credits={credits} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#7058F8]/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 left-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full border border-[#7058F8]/30 bg-[#7058F8]/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#a08fff] uppercase">
            الأسعار
          </span>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            استثمار في نتيجة —{' '}
            <span className="bg-gradient-to-l from-[#7058F8] to-cyan-400 bg-clip-text text-transparent">
              مش مصروف على تجربة
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/60">
            كل جنيه بتدفعه بيرجع لك في شكل وضوح — تعرف بالظبط إيه اللي بيوقف علامتك، وإيه الخطوة الجاية.
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> بدون اشتراك شهري</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> ادفع مرة واحدة</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> نتائج فورية</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> دفع آمن عبر Paymob</span>
          </div>
        </div>
      </section>

      {/* ── Promo Code ── */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-3 text-sm font-semibold text-white/80">عندك كود خصم؟</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
              placeholder="WZZRD10"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder-white/30 outline-none focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
              maxLength={50}
            />
            <select
              value={promoPlanId}
              onChange={(e) => { setPromoPlanId(e.target.value); setPromoResult(null); }}
              className="rounded-xl border border-white/10 bg-[#0D0D1A] px-4 py-2.5 text-sm text-white min-w-[180px]"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === 'ar' ? p.label : p.labelEn} — {p.price} ج.م
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={verifyPromo}
              disabled={promoLoading}
              className="rounded-xl bg-[#7058F8] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#5a45d4] disabled:opacity-50"
            >
              {promoLoading ? '...' : 'تحقق'}
            </button>
          </div>
          {promoResult && (
            <p className={`mt-3 text-sm font-medium ${promoResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
              {promoResult.valid
                ? `✓ الكود صالح — السعر بعد الخصم: ${toArabicNumerals(String(promoResult.finalAmountEGP))} ج.م (كان ${toArabicNumerals(String(promoResult.originalAmountEGP))} ج.م)`
                : `✗ ${promoResult.message || 'الكود غير صالح'}`}
            </p>
          )}
        </div>
      </section>

      {/* ── Plans Grid ── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 items-stretch">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            const isPurchasing = purchasingId === plan.id;
            const features = getPlanFeatures(plan);
            const icon = PLAN_ICONS[plan.id] ?? '⚡';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-px transition-transform hover:-translate-y-1 ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#7058F8] via-cyan-500/50 to-transparent shadow-[0_0_60px_rgba(112,88,248,0.25)]'
                    : 'bg-white/10'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#7058F8] to-cyan-400 px-5 py-1 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                    🔥 الأكثر طلباً
                  </div>
                )}
                <div className={`flex h-full flex-col gap-5 rounded-2xl p-7 ${isPopular ? 'bg-[#13132A]' : 'bg-[#0D0D1A]'}`}>
                  {/* Plan header */}
                  <div>
                    <div className="mb-3 text-3xl">{icon}</div>
                    <h3 className="text-lg font-bold text-white">
                      {locale === 'ar' ? plan.label : plan.labelEn}
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      {locale === 'ar' ? (plan.description || plan.descEn) : (plan.descEn || plan.description)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-extrabold tracking-tight ${isPopular ? 'text-white' : 'text-white/90'}`}>
                      {locale === 'ar' ? toArabicNumerals(plan.price.toLocaleString()) : plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-white/40">ج.م</span>
                    <span className="mr-2 text-xs text-white/30">دفعة واحدة</span>
                  </div>

                  {/* Credits badge */}
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#7058F8]/30 bg-[#7058F8]/10 px-3 py-1 text-xs font-semibold text-[#a08fff]">
                    ⚡ {locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} كريدت
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                        <span className={`mt-0.5 shrink-0 text-base ${isPopular ? 'text-[#7058F8]' : 'text-emerald-400'}`}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => void purchasePlan(plan.id)}
                    disabled={isPurchasing}
                    className={`mt-auto w-full rounded-xl py-3.5 text-sm font-bold transition disabled:opacity-60 ${
                      isPopular
                        ? 'bg-gradient-to-l from-[#7058F8] to-cyan-500 text-white hover:opacity-90 hover:shadow-[0_0_24px_rgba(112,88,248,0.5)]'
                        : 'border border-white/20 text-white hover:border-[#7058F8]/50 hover:bg-[#7058F8]/10'
                    }`}
                  >
                    {isPurchasing ? '...' : 'ابدأ دلوقتي'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Value Comparison ── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            مقارنة — WZZRD AI vs. الوكالة التقليدية
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-right font-semibold text-white/60"></th>
                  <th className="px-6 py-4 text-center font-bold text-[#7058F8]">WZZRD AI</th>
                  <th className="px-6 py-4 text-center font-semibold text-white/40">وكالة تقليدية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['التكلفة', 'من ٩٩ ج.م', '٥٠٠٠–٣٠٠٠٠ ج.م/شهر'],
                  ['وقت التسليم', 'فوري — دقائق', '٢–٤ أسابيع'],
                  ['الشفافية', 'تقرير مفصّل بالأرقام', 'ملخص عام بدون بيانات'],
                  ['التحكم', 'أنت بتشغّل الأدوات', 'بتنتظر الوكالة'],
                  ['التحديث', 'في أي وقت', 'بتدفع مرة تانية'],
                  ['الـ AI', 'مدرّب على السوق المصري والخليجي', 'عام ومش مخصّص'],
                ].map(([feature, wzrd, agency]) => (
                  <tr key={feature} className="hover:bg-white/3 transition">
                    <td className="px-6 py-4 font-medium text-white/70">{feature}</td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-400">{wzrd}</td>
                    <td className="px-6 py-4 text-center text-white/30">{agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">أسئلة شائعة</h2>
          <div className="space-y-4">
            {[
              {
                q: 'إيه الفرق بين الكريدت والتقرير؟',
                a: 'الكريدت هو وحدة الاستخدام — كل أداة بتاكل عدد معين من الكريدت. التقرير هو ناتج الأداة — تقرير Brand Health مثلاً بياخد ١٠٠ كريدت.',
              },
              {
                q: 'هل الكريدت بتنتهي؟',
                a: 'الكريدت صالحة حسب الباقة — من ٦ أشهر لسنة كاملة. مفيش اشتراك شهري ومفيش تجديد تلقائي.',
              },
              {
                q: 'هل الدفع آمن؟',
                a: 'آه — بنستخدم Paymob، أكبر بوابة دفع في مصر. بياناتك مش بتوصلنا خالص.',
              },
              {
                q: 'ممكن أسترد فلوسي؟',
                a: 'لو استخدمت أقل من ١٠% من الكريدت خلال ٧ أيام، نقدر نرتب استرداد. تواصل معنا على WhatsApp.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer list-none font-semibold text-white/90 group-open:text-[#7058F8]">
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise CTA ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[#7058F8]/20 bg-gradient-to-b from-[#7058F8]/10 to-transparent p-10 text-center">
          <div className="mb-4 text-4xl">🏢</div>
          <h3 className="mb-3 text-xl font-bold text-white">محتاج حل Enterprise؟</h3>
          <p className="mb-6 text-sm leading-relaxed text-white/60">
            لو عندك فريق أو وكالة أو شركة — عندنا باقات مخصوصة بـ multi-workspace وتقارير white-label وأولوية دعم.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={waMeHref()}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#7058F8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5a45d4] hover:shadow-[0_0_20px_rgba(112,88,248,0.4)]"
            >
              تكلّم معنا على WhatsApp
            </a>
            <button
              onClick={() => navigate('/landing/services.html')}
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-[#7058F8]/50 hover:text-white"
            >
              شوف الخدمات
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
