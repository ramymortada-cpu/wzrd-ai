import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

const PLANS = [
  { id: 'starter', credits: 500, price: 499, currency: 'EGP', popular: false, label: 'Starter', description: '~20 tool runs' },
  { id: 'pro', credits: 1500, price: 999, currency: 'EGP', popular: true, label: 'Pro', description: '~60 tool runs — best value' },
  { id: 'agency', credits: 5000, price: 2499, currency: 'EGP', popular: false, label: 'Agency', description: '~200 tool runs' },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={credits} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-indigo-500 dark:text-indigo-400 tracking-widest mb-2">// CREDITS</p>
          <h2 className="text-3xl font-bold mb-3">{t('wzrd.buyMoreCredits')}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">{t('wzrd.keepUsingTools')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative p-6 rounded-2xl border transition shadow-sm ${
              plan.popular 
                ? 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/5' 
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-xs font-bold text-white">
                  {t('wzrd.bestValue')}
                </div>
              )}
              <div className="text-center">
                <h3 className="text-lg font-bold mb-1">{plan.label}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-white">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 ms-1">EGP</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">{plan.credits.toLocaleString()} {t('wzrd.credits')}</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/trpc/credits.purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ json: { planId: plan.id } }),
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
                  className={`w-full py-3 rounded-full font-bold text-sm transition hover:-translate-y-0.5 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  {t('wzrd.buy')} {plan.credits} {t('wzrd.credits')}
                </button>
                <p className="text-[10px] text-zinc-600 mt-2">{(plan.price / plan.credits).toFixed(1)} EGP per credit</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-500/10 text-center">
          <h3 className="text-xl font-bold mb-2">{t('wzrd.diyAlternative')}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 max-w-md mx-auto">
            {t('wzrd.letPrimoHandle')}
          </p>
          <div className="flex gap-3 justify-center">
            <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm hover:-translate-y-0.5 transition">
              {t('wzrd.bookClarityCall')}
            </a>
            <button onClick={() => navigate('/landing/services.html')} className="px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 hover:border-amber-500 transition">
              {t('wzrd.viewServices')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
