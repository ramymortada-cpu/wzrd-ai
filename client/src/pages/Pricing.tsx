import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';

export default function Pricing() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [credits, setCredits] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoByPlan, setPromoByPlan] = useState<Record<string, { valid: boolean; finalAmountCents?: number; message?: string }>>({});

  useEffect(() => {
    fetch('/api/trpc/credits.balance', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  useEffect(() => {
    fetch('/api/trpc/credits.plans', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPlans(d?.result?.data?.plans || []))
      .catch(() => setPlans([]));
  }, []);

  const applyPromo = async () => {
    if (!promoCode.trim() || plans.length === 0) return;
    const results: Record<string, any> = {};
    for (const p of plans) {
      const res = await fetch(`/api/trpc/credits.validatePromo?input=${encodeURIComponent(JSON.stringify({ json: { code: promoCode.trim(), planId: p.id, amountEGP: p.priceEGP } }))}`, { credentials: 'include' });
      const data = await res.json();
      results[p.id] = data?.result?.data || { valid: false, message: 'Invalid' };
    }
    setPromoByPlan(results);
  };

  const buyPlan = async (plan: any) => {
    try {
      const body: any = { planId: plan.id };
      if (promoCode.trim()) body.promoCode = promoCode.trim();
      const res = await fetch('/api/trpc/credits.purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: body }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json;
      if (result?.success && result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        alert(result?.message || 'Payment failed. Please try again.');
      }
    } catch {
      alert('Connection error. Please try again.');
    }
  };

  const displayPrice = (plan: any) => {
    const p = promoByPlan[plan.id];
    if (p?.valid && p.finalAmountCents !== undefined) return (p.finalAmountCents / 100).toLocaleString();
    return plan.priceEGP.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={credits} />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">{t('wzrd.buyMoreCredits')}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">{t('wzrd.keepUsingTools')}</p>
        </div>

        {/* Promo code */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <input value={promoCode} onChange={e => { setPromoCode(e.target.value); setPromoByPlan({}); }} placeholder={locale === 'ar' ? 'كود الخصم' : 'Promo code'} className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm w-40" />
          <button onClick={applyPromo} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
            {locale === 'ar' ? 'تطبيق' : 'Apply'}
          </button>
          {Object.keys(promoByPlan).length > 0 && (
            <span className={`text-sm ${Object.values(promoByPlan).some(v => v.valid) ? 'text-green-600' : 'text-red-600'}`}>
              {Object.values(promoByPlan).some(v => v.valid) ? (locale === 'ar' ? '✓ تم تطبيق الخصم' : '✓ Discount applied') : Object.values(promoByPlan)[0]?.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {plans.length === 0 ? <p className="col-span-3 text-center text-zinc-500 py-8">{locale === 'ar' ? 'جاري التحميل...' : 'Loading plans...'}</p> : null}
          {plans.map(plan => (
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
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{locale === 'ar' && plan.nameAr ? plan.nameAr : plan.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{locale === 'ar' && plan.descriptionAr ? plan.descriptionAr : plan.description || ''}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold font-mono text-zinc-900 dark:text-white">{locale === 'ar' ? toArabicNumerals(displayPrice(plan)) : displayPrice(plan)}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 ms-1">EGP</span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">{locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} {t('wzrd.credits')}</p>
                <button
                  onClick={() => buyPlan(plan)}
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
            <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm hover:-translate-y-0.5 transition shadow-md">
              {t('wzrd.bookClarityCall')}
            </a>
            <a href="/services-info" className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition inline-block">
              {t('wzrd.viewServices')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
