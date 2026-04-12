import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import posthog from 'posthog-js';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { waMeHref } from '@/lib/waContact';
import { formatTierPrice, TIER_PRICES, type TierPriceKey } from '@shared/const';

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

type PromoResult = {
  valid: boolean;
  message: string | null;
  finalAmountEGP: number;
  originalAmountEGP: number;
  discountPercent: number | null;
  discountFixedEGP: number | null;
};

function marketKey(raw: string | null | undefined): string {
  const m = (raw || 'egypt').toLowerCase();
  if (m === 'ksa' || m === 'uae' || m === 'egypt') return m;
  return 'other';
}

export default function Pricing() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const market = marketKey(user?.market ?? undefined);

  const fullPriceLabel = useMemo(() => formatTierPrice('full_audit', market), [market]);
  const strategyPriceLabel = useMemo(() => formatTierPrice('strategy_pack', market), [market]);

  const [promoCode, setPromoCode] = useState('');
  const [promoPlanId, setPromoPlanId] = useState<TierPriceKey>('full_audit');
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const promoBaseEgp = promoPlanId === 'strategy_pack' ? TIER_PRICES.strategy_pack.egypt : TIER_PRICES.full_audit.egypt;

  const purchaseMutation = trpc.credits.purchase.useMutation();

  const verifyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoResult({
        valid: false,
        message: isAr ? 'اكتب الكود الأول' : 'Please enter a promo code',
        finalAmountEGP: promoBaseEgp,
        originalAmountEGP: promoBaseEgp,
        discountPercent: null,
        discountFixedEGP: null,
      });
      return;
    }
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch('/api/trpc/premium.validatePromo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { code, amountEGP: promoBaseEgp } }),
      });
      const data = await res.json();
      const row = data?.result?.data?.json ?? data?.result?.data;
      if (row) {
        setPromoResult({
          valid: !!row.valid,
          message: row.message ?? null,
          finalAmountEGP: row.finalAmountEGP ?? promoBaseEgp,
          originalAmountEGP: row.originalAmountEGP ?? promoBaseEgp,
          discountPercent: row.discountPercent ?? null,
          discountFixedEGP: row.discountFixedEGP ?? null,
        });
      } else {
        setPromoResult({
          valid: false,
          message: isAr ? 'رد غير متوقع' : 'Unexpected response',
          finalAmountEGP: promoBaseEgp,
          originalAmountEGP: promoBaseEgp,
          discountPercent: null,
          discountFixedEGP: null,
        });
      }
    } catch {
      setPromoResult({
        valid: false,
        message: isAr ? 'خطأ في الاتصال' : 'Connection error',
        finalAmountEGP: promoBaseEgp,
        originalAmountEGP: promoBaseEgp,
        discountPercent: null,
        discountFixedEGP: null,
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const purchasePlan = useCallback(
    async (planId: 'full_audit' | 'strategy_pack') => {
      setPurchasingId(planId);
      try {
        const result = await purchaseMutation.mutateAsync({
          planId,
          ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
        });
        if (result?.success && result?.redirectUrl) {
          if (import.meta.env.VITE_POSTHOG_KEY) {
            posthog.capture('credits_purchase_initiated', {
              planId,
              hasPromo: Boolean(promoCode.trim()),
            });
          }
          window.location.href = result.redirectUrl;
        } else {
          const msg = typeof result?.message === 'string' ? result.message : '';
          if (isPaymobGatewayConfigError(msg)) {
            toast.info(
              isAr ? 'بوابة الدفع تحت التحديث — يرجى المحاولة لاحقاً.' : 'Payment gateway is being updated — please try again later.',
              { duration: 6000 }
            );
          } else {
            toast.error(msg || (isAr ? 'تعذّر إتمام الدفع.' : 'Payment could not be completed.'));
          }
        }
      } catch {
        toast.error(isAr ? 'خطأ في الاتصال. حاول تاني.' : 'Connection error. Please try again.');
      } finally {
        setPurchasingId(null);
      }
    },
    [isAr, promoCode, purchaseMutation]
  );

  useEffect(() => {
    void utils.auth.me.invalidate();
    void utils.credits.balance.invalidate();
  }, [utils]);

  const comparisonRows = isAr
    ? [
        ['التكلفة', fullPriceLabel + ' → ' + strategyPriceLabel, '٥٠٠٠–٣٠٠٠٠ ج.م/شهر'],
        ['وقت التسليم', 'فوري — دقائق', '٢–٤ أسابيع'],
        ['الشفافية', 'تقرير مفصّل بالأرقام', 'ملخص عام بدون بيانات'],
        ['التحكم', 'أنت بتشغّل الأدوات', 'بتنتظر الوكالة'],
      ]
    : [
        ['Cost', `${fullPriceLabel} → ${strategyPriceLabel}`, '5,000–30,000 EGP/month'],
        ['Delivery time', 'Instant — minutes', '2–4 weeks'],
        ['Transparency', 'Detailed data-driven report', 'Vague summary, no data'],
        ['Control', 'You run the tools', 'Waiting on the agency'],
      ];

  const faqItems = isAr
    ? [
        {
          q: 'إيه الفرق بين التحليل الشامل وحزمة الاستراتيجية؟',
          a: 'التحليل الشامل يعطيك تقييم ٧ محاور + خطة عمل. حزمة الاستراتيجية تضيف تحليل منافسين، رسائل العلامة، وخطة ٩٠ يوم تنفيذية — بعد ما يكون عندك تحليل شامل.',
        },
        {
          q: 'هل في اشتراك شهري؟',
          a: 'لا — دفعة واحدة لكل باقة. مفيش تجديد تلقائي.',
        },
        {
          q: 'هل الدفع آمن؟',
          a: 'آه — بنستخدم Paymob. بيانات الكارت مش بتوصلنا.',
        },
      ]
    : [
        {
          q: 'What is the difference between Full Audit and Strategy Pack?',
          a: 'Full Audit is the 7-pillar scorecard plus an action plan. Strategy Pack adds competitive intelligence, messaging direction, and a 90-day execution roadmap on top of a completed audit.',
        },
        {
          q: 'Is there a monthly subscription?',
          a: 'No — each tier is a one-time purchase with no auto-renewal.',
        },
        {
          q: 'Is payment secure?',
          a: 'Yes — checkout runs on Paymob. Card details never touch our servers.',
        },
      ];

  return (
    <div className="wzrd-public-page pb-16">
      <section className="relative overflow-hidden pt-6 pb-12 px-6">
        <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#7058F8]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="wzrd-section-pill" style={{ marginBottom: 16 }}>
            {isAr ? 'الأسعار' : 'Pricing'}
          </span>
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {isAr ? (
              <>
                ثلاث خطوات للوضوح —{' '}
                <span className="bg-gradient-to-l from-[#7058F8] to-cyan-400 bg-clip-text text-transparent">من فحص سريع لخطة تنفيذ</span>
              </>
            ) : (
              <>
                Three steps to clarity —{' '}
                <span className="bg-gradient-to-r from-[#7058F8] to-cyan-400 bg-clip-text text-transparent">from quick check to execution</span>
              </>
            )}
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            {isAr
              ? 'ابدأ بفحص مجاني، ثم التحليل الشامل، ثم حزمة الاستراتيجية لو محتاج خطة أعمق.'
              : 'Start with a free check, upgrade to the full audit, then add the strategy pack when you need deeper planning.'}
          </p>
        </div>
      </section>

      {/* Promo */}
      <section className="px-6 pb-8">
        <div className="wzrd-public-card mx-auto max-w-2xl p-6">
          <p className="mb-3 text-sm font-semibold text-foreground/80">{isAr ? 'عندك كود خصم؟' : 'Have a promo code?'}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoResult(null);
              }}
              placeholder="WZZRD10"
              className="wzrd-public-input flex-1 font-mono"
              maxLength={50}
            />
            <select
              value={promoPlanId}
              onChange={(e) => {
                setPromoPlanId(e.target.value as TierPriceKey);
                setPromoResult(null);
              }}
              className="wzrd-public-input min-w-[180px]"
            >
              <option value="full_audit">{isAr ? 'التحليل الشامل' : 'Full Audit'}</option>
              <option value="strategy_pack">{isAr ? 'حزمة الاستراتيجية' : 'Strategy Pack'}</option>
            </select>
            <button type="button" onClick={() => void verifyPromo()} disabled={promoLoading} className="wzrd-btn-primary px-6 py-2.5 text-sm">
              {promoLoading ? '...' : isAr ? 'تحقق' : 'Apply'}
            </button>
          </div>
          {promoResult && (
            <p className={`mt-3 text-sm font-medium ${promoResult.valid ? 'text-green-600' : 'text-red-600'}`}>
              {promoResult.valid
                ? isAr
                  ? `✓ الكود صالح — السعر بعد الخصم: ${promoResult.finalAmountEGP} ج.م`
                  : `✓ Code valid — discounted price: ${promoResult.finalAmountEGP} EGP`
                : `✗ ${promoResult.message || (isAr ? 'الكود غير صالح' : 'Invalid code')}`}
            </p>
          )}
        </div>
      </section>

      {/* 3 tiers */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {/* Quick Check */}
          <div className="relative flex flex-col rounded-2xl p-px transition-transform hover:-translate-y-1 wzrd-public-card">
            <div className="flex h-full flex-col gap-4 rounded-2xl p-6 bg-card">
              <div className="text-3xl">⚡</div>
              <h3 className="text-lg font-bold">{isAr ? 'فحص سريع' : 'Quick Check'}</h3>
              <p className="text-sm text-muted-foreground">{isAr ? 'أسئلة قليلة — نتيجة فورية بدون تسجيل.' : 'A short questionnaire — instant snapshot, no signup required on the public page.'}</p>
              <div className="mt-auto flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{isAr ? 'مجاناً' : 'Free'}</span>
              </div>
              <button
                type="button"
                className="wzrd-btn-primary w-full rounded-xl py-3 text-sm font-bold"
                onClick={() => navigate('/quick-check')}
              >
                {isAr ? 'ابدأ الفحص ←' : 'Start quick check →'}
              </button>
            </div>
          </div>

          {/* Full Audit */}
          <div className="relative flex flex-col rounded-2xl p-px transition-transform hover:-translate-y-1 wzrd-public-card ring-2 ring-primary/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[11px] font-extrabold text-white">
              {isAr ? 'الأكثر طلباً' : 'Most chosen'}
            </div>
            <div className="flex h-full flex-col gap-4 rounded-2xl p-6 bg-card pt-8">
              <div className="text-3xl">🧭</div>
              <h3 className="text-lg font-bold">{isAr ? 'التحليل الشامل' : 'Full Audit'}</h3>
              <p className="text-sm text-muted-foreground">
                {isAr ? '٧ محاور + خطة عمل + تقييم الثقة والمصادر.' : '7 pillars, action plan, confidence and source signals.'}
              </p>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-500">✓</span>{isAr ? 'بحث موقع ومنافسين' : 'Site + competitor research'}</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span>{isAr ? 'تقرير PDF' : 'PDF export'}</li>
              </ul>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{fullPriceLabel}</span>
                <span className="text-xs text-muted-foreground">{isAr ? 'دفعة واحدة' : 'one-time'}</span>
              </div>
              <button
                type="button"
                disabled={purchasingId === 'full_audit'}
                className="wzrd-btn-primary w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
                onClick={() => void purchasePlan('full_audit')}
              >
                {purchasingId === 'full_audit' ? '...' : isAr ? 'ادفع وابدأ التحليل' : 'Pay & start audit'}
              </button>
              <button type="button" className="text-xs text-primary underline" onClick={() => navigate('/app/full-audit')}>
                {isAr ? 'عندي رصيد — افتح أداة التحليل' : 'I already have balance — open audit'}
              </button>
            </div>
          </div>

          {/* Strategy Pack */}
          <div className="relative flex flex-col rounded-2xl p-px transition-transform hover:-translate-y-1 wzrd-public-card">
            <div className="flex h-full flex-col gap-4 rounded-2xl p-6 bg-card">
              <div className="text-3xl">📦</div>
              <h3 className="text-lg font-bold">{isAr ? 'حزمة الاستراتيجية' : 'Strategy Pack'}</h3>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'بعد التحليل الشامل: منافسين، رسائل، وخطة ٩٠ يوم.' : 'After your audit: competitors, messaging, and a 90-day roadmap.'}
              </p>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-emerald-500">✓</span>{isAr ? 'يتطلب تحليلاً محفوظاً' : 'Requires a saved full audit'}</li>
                <li className="flex gap-2"><span className="text-emerald-500">✓</span>{isAr ? 'توليد متوازي بثلاثة محاور' : 'Three parallel strategy sections'}</li>
              </ul>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{strategyPriceLabel}</span>
                <span className="text-xs text-muted-foreground">{isAr ? 'دفعة واحدة' : 'one-time'}</span>
              </div>
              <button
                type="button"
                disabled={purchasingId === 'strategy_pack'}
                className="w-full rounded-xl border-2 border-primary bg-primary/5 py-3 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-60"
                onClick={() => void purchasePlan('strategy_pack')}
              >
                {purchasingId === 'strategy_pack' ? '...' : isAr ? 'اشترِ الحزمة' : 'Buy strategy pack'}
              </button>
              <p className="text-[11px] text-muted-foreground">{isAr ? 'الاستخدام من صفحة التحليل بعد الشراء.' : 'Use from the audit page after purchase.'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 px-6 py-12">
        <div className="mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          {isAr
            ? 'الأسعار المعروضة حسب سوق حسابك؛ الدفع بالجنيه للمصر عبر Paymob.'
            : 'Prices follow your account market; Egyptian accounts checkout in EGP via Paymob.'}
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-extrabold">{isAr ? 'مقارنة سريعة' : 'Quick comparison'}</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 text-left font-semibold text-muted-foreground" />
                  <th className="p-3 text-center font-bold text-primary">WZZRD</th>
                  <th className="p-3 text-center text-muted-foreground">{isAr ? 'وكالة' : 'Agency'}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([feature, wzrd, agency]) => (
                  <tr key={String(feature)} className="border-b border-border/60 last:border-0">
                    <td className="p-3 font-medium">{feature}</td>
                    <td className="p-3 text-center font-semibold text-green-700">{wzrd}</td>
                    <td className="p-3 text-center text-muted-foreground">{agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-xl space-y-3">
          <h2 className="mb-4 text-center text-2xl font-extrabold">{isAr ? 'أسئلة شائعة' : 'FAQ'}</h2>
          {faqItems.map(({ q, a }) => (
            <details key={q} className="wzrd-public-card rounded-xl p-4">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-50 to-cyan-50 p-8 text-center dark:from-indigo-950/40 dark:to-cyan-950/20">
          <h3 className="text-lg font-bold">{isAr ? 'محتاج Enterprise؟' : 'Need Enterprise?'}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'تواصل معنا على WhatsApp.' : 'Reach us on WhatsApp for custom scopes.'}</p>
          <a href={waMeHref()} target="_blank" rel="noreferrer" className="wzrd-btn-primary mt-4 inline-block rounded-lg px-6 py-2 text-sm no-underline">
            WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
