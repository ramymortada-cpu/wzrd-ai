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

export default function Pricing() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [credits, setCredits] = useState<number | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>(FALLBACK_PLANS);
  const [promoCode, setPromoCode] = useState('');
  const [promoPlanId, setPromoPlanId] = useState(FALLBACK_PLANS[0].id);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

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
      setPromoResult({ valid: false, message: locale === 'ar' ? 'اكتب الكود الأول' : 'Enter a code', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
      return;
    }
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch('/api/trpc/premium.validatePromo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: { code, amountEGP: planForPromo.price },
        }),
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
        setPromoResult({ valid: false, message: locale === 'ar' ? 'رد غير متوقع' : 'Unexpected response', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
      }
    } catch {
      setPromoResult({ valid: false, message: locale === 'ar' ? 'خطأ في الاتصال' : 'Network error', finalAmountEGP: planForPromo.price, originalAmountEGP: planForPromo.price, discountPercent: null, discountFixedEGP: null });
    } finally {
      setPromoLoading(false);
    }
  };

  const purchasePlan = async (planId: string) => {
    try {
      const res = await fetch('/api/trpc/credits.purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            planId,
            ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
          },
        }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json;
      if (result?.success && result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        const msg = typeof result?.message === 'string' ? result.message : '';
        if (isPaymobGatewayConfigError(msg)) {
          toast.info(
            locale === 'ar'
              ? 'بوابة الدفع تحت التحديث — يرجى المحاولة لاحقاً.'
              : 'Payment gateway is initializing. Please try again later.',
            { duration: 6000 }
          );
        } else {
          toast.error(msg || (locale === 'ar' ? 'تعذّر إتمام الدفع.' : 'Payment failed. Please try again.'));
        }
      }
    } catch {
      toast.error(locale === 'ar' ? 'خطأ في الاتصال.' : 'Connection error. Please try again.');
    }
  };

  const getPlanFeatures = (plan: PlanRow) => {
    const label = locale === 'ar' ? plan.label : plan.labelEn;
    const desc = locale === 'ar' ? (plan.description || plan.descEn) : (plan.descEn || plan.description);
    return [
      `${label}`,
      `${locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} ${t('wzrd.credits')}`,
      desc || (locale === 'ar' ? 'تقارير وتحليلات قابلة للتنفيذ' : 'Actionable reports and insights'),
    ];
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 py-16 px-6">
      <WzrdPublicHeader credits={credits} />
      <div className="mx-auto max-w-5xl">
        <p className="text-center font-mono text-xs text-zinc-600 uppercase tracking-[0.2em] mb-4">
          // PRICING
        </p>
        <h1 className="text-center text-4xl font-bold tracking-tight mb-3">
          اختار الخطة المناسبة
        </h1>
        <p className="text-center text-zinc-400 text-sm mb-12">
          ابدأ مجاناً — ادفع بس لما تحتاج أكتر
        </p>

        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-primary to-cyan-500 dark:from-white dark:to-cyan-300">
            {t('wzrd.buyMoreCredits')}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base leading-relaxed">{t('wzrd.keepUsingTools')}</p>
        </div>

        <div className="mb-10 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-6 sm:p-8">
          <p className="text-sm font-semibold text-zinc-200 mb-3">
            {locale === 'ar' ? 'كود خصم (اختياري)' : 'Promo code (optional)'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
              placeholder={locale === 'ar' ? 'WZRD١٠' : 'CODE'}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 font-mono text-sm"
              maxLength={50}
            />
            <select
              value={promoPlanId}
              onChange={(e) => { setPromoPlanId(e.target.value); setPromoResult(null); }}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-sm min-w-[180px]"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === 'ar' ? p.label : p.labelEn} — {p.price} EGP
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={verifyPromo}
              disabled={promoLoading}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {promoLoading ? '…' : locale === 'ar' ? 'تحقق' : 'Verify'}
            </button>
          </div>
          {promoResult && (
            <p className={`mt-3 text-sm ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {promoResult.valid
                ? (locale === 'ar'
                    ? `الكود صالح — السعر بعد الخصم: ${toArabicNumerals(String(promoResult.finalAmountEGP))} ج.م (كان ${toArabicNumerals(String(promoResult.originalAmountEGP))} ج.م)`
                    : `Valid — ${promoResult.finalAmountEGP} EGP (was ${promoResult.originalAmountEGP} EGP)`)
                : (promoResult.message || (locale === 'ar' ? 'الكود غير صالح' : 'Invalid code'))}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-14 items-stretch">
          {plans.map(plan => (
            plan.popular ? (
              <div key={plan.id} className="relative rounded-2xl p-[1px] bg-gradient-to-b from-purple-500/50 via-cyan-500/30 to-transparent md:scale-105">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                  الأكثر طلباً
                </div>
                <div className="rounded-2xl bg-zinc-900 p-8 flex flex-col gap-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                  <h3 className="text-lg font-bold text-zinc-50">{locale === 'ar' ? plan.label : plan.labelEn}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {locale === 'ar' ? toArabicNumerals(plan.price.toLocaleString()) : plan.price.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 text-sm">جنيه</span>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {getPlanFeatures(plan).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="text-cyan-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => void purchasePlan(plan.id)}
                    className="w-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 py-3 text-sm font-bold text-white transition hover:opacity-90 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                  >
                    اشتري دلوقتي
                  </button>
                </div>
              </div>
            ) : (
              <div key={plan.id} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-8 flex flex-col gap-6">
                <h3 className="text-lg font-bold text-zinc-100">{locale === 'ar' ? plan.label : plan.labelEn}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-zinc-50">
                    {locale === 'ar' ? toArabicNumerals(plan.price.toLocaleString()) : plan.price.toLocaleString()}
                  </span>
                  <span className="text-zinc-500 text-sm">جنيه</span>
                </div>
                <ul className="space-y-2 flex-1">
                  {getPlanFeatures(plan).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void purchasePlan(plan.id)}
                  className="w-full rounded-full border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                  اشتري دلوقتي
                </button>
              </div>
            )
          ))}
        </div>

        <div className="wzrd-glass rounded-3xl p-8 sm:p-10 text-center border-amber-200/35 dark:border-amber-500/25">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{t('wzrd.diyAlternative')}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto" style={{ lineHeight: 1.7 }}>
            {t('wzrd.letPrimoHandle')}
          </p>
          <div className="flex gap-3 justify-center">
            <a href={waMeHref()} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm hover:-translate-y-0.5 transition shadow-md">
              {t('wzrd.bookClarityCall')}
            </a>
            <button onClick={() => navigate('/landing/services.html')} className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition">
              {t('wzrd.viewServices')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
