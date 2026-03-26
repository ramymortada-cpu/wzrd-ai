import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';
import { waMeHref } from '@/lib/waContact';

const PLANS = [
  { id: 'single_report', credits: 100, price: 99, currency: 'EGP', popular: false, label: 'تقرير واحد', labelEn: 'Single Report', description: 'تقرير مفصّل واحد', descEn: '1 Premium AI report' },
  { id: 'bundle_6', credits: 800, price: 499, currency: 'EGP', popular: true, label: 'باقة ٦ تقارير', labelEn: '6-Report Bundle', description: 'وفّر ٤٥% — أشمل تحليل', descEn: 'Save 45% — comprehensive' },
  { id: 'credits_500', credits: 500, price: 499, currency: 'EGP', popular: false, label: '٥٠٠ كريدت', labelEn: '500 Credits', description: '~٢٥ أداة تشخيص', descEn: '~25 tool runs' },
  { id: 'credits_1500', credits: 1500, price: 999, currency: 'EGP', popular: false, label: '١٥٠٠ كريدت', labelEn: '1500 Credits', description: 'الأوفر — ~٧٥ أداة', descEn: 'Best value — ~75 tools' },
];

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
  const [promoCode, setPromoCode] = useState('');
  const [promoPlanId, setPromoPlanId] = useState(PLANS[0].id);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const planForPromo = useMemo(() => PLANS.find((p) => p.id === promoPlanId) ?? PLANS[0], [promoPlanId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={credits} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">{t('wzrd.buyMoreCredits')}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">{t('wzrd.keepUsingTools')}</p>
        </div>

        <div className="mb-10 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 shadow-sm">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
            {locale === 'ar' ? 'كود خصم (اختياري)' : 'Promo code (optional)'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
              placeholder={locale === 'ar' ? 'WZRD١٠' : 'CODE'}
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono text-sm"
              maxLength={50}
            />
            <select
              value={promoPlanId}
              onChange={(e) => { setPromoPlanId(e.target.value); setPromoResult(null); }}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm min-w-[180px]"
            >
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === 'ar' ? p.label : p.labelEn} — {p.price} EGP
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={verifyPromo}
              disabled={promoLoading}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {promoLoading ? '…' : locale === 'ar' ? 'تحقق' : 'Verify'}
            </button>
          </div>
          {promoResult && (
            <p className={`mt-3 text-sm ${promoResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {promoResult.valid
                ? (locale === 'ar'
                    ? `الكود صالح — السعر بعد الخصم: ${toArabicNumerals(String(promoResult.finalAmountEGP))} ج.م (كان ${toArabicNumerals(String(promoResult.originalAmountEGP))} ج.م)`
                    : `Valid — ${promoResult.finalAmountEGP} EGP (was ${promoResult.originalAmountEGP} EGP)`)
                : (promoResult.message || (locale === 'ar' ? 'الكود غير صالح' : 'Invalid code'))}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative p-8 rounded-2xl border transition shadow-md hover:shadow-xl hover:-translate-y-1 ${
              plan.popular
                ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/5'
                : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {t('wzrd.bestValue')}
                </div>
              )}
              <div className="text-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{locale === 'ar' ? plan.label : plan.labelEn}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{locale === 'ar' ? plan.description : plan.descEn}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold font-mono text-zinc-900 dark:text-white">{locale === 'ar' ? toArabicNumerals(plan.price.toLocaleString()) : plan.price.toLocaleString()}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 ms-1">EGP</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} {t('wzrd.credits')}</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/trpc/credits.purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          json: {
                            planId: plan.id,
                            ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
                          },
                        }),
                      });
                      const data = await res.json();
                      const result = data?.result?.data?.json;
                      if (result?.success && result?.redirectUrl) {
                        window.location.href = result.redirectUrl;
                      } else {
                        alert(result?.message || 'Payment failed. Please try again.');
                      }
                    } catch { alert('Connection error. Please try again.'); }
                  }}
                  className={`w-full py-4 rounded-xl font-bold text-base transition hover:-translate-y-0.5 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-700 hover:to-indigo-600'
                      : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  }`}
                >
                  {t('wzrd.buy')} {locale === 'ar' ? toArabicNumerals(plan.credits) : plan.credits} {t('wzrd.credits')}
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">{locale === 'ar' ? toArabicNumerals((plan.price / plan.credits).toFixed(1)) : (plan.price / plan.credits).toFixed(1)} EGP per credit</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 text-center shadow-sm">
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
