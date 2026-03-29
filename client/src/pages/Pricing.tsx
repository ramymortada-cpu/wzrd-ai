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

  const isAr = locale === 'ar';
  return (
    <div className="wzrd-public-page">
      <WzrdPublicHeader credits={credits} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#7058F8]/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-20 left-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="wzrd-section-pill" style={{marginBottom: 16}}>
            {isAr ? 'الأسعار' : 'Pricing'}
          </span>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            استثمار في نتيجة —{' '}
            <span className="bg-gradient-to-l from-[#7058F8] to-cyan-400 bg-clip-text text-transparent">
              مش مصروف على تجربة
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed" style={{color: '#6B7280'}}>
            كل جنيه بتدفعه بيرجع لك في شكل وضوح — تعرف بالظبط إيه اللي بيوقف علامتك، وإيه الخطوة الجاية.
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs" style={{color: '#6B7280'}}>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> بدون اشتراك شهري</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> ادفع مرة واحدة</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> نتائج فورية</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> دفع آمن عبر Paymob</span>
          </div>
        </div>
      </section>

      {/* ── Promo Code ── */}
      <section className="px-6 pb-8">
        <div className="wzrd-public-card mx-auto max-w-2xl p-6">
          <p className="mb-3 text-sm font-semibold" style={{color: '#374151'}}>عندك كود خصم؟ {!isAr && <span style={{color: '#374151'}}>Have a promo code?</span>}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
              placeholder="WZZRD10"
              className="wzrd-public-input flex-1 font-mono"
              maxLength={50}
            />
            <select
              value={promoPlanId}
              onChange={(e) => { setPromoPlanId(e.target.value); setPromoResult(null); }}
              className="wzrd-public-input min-w-[180px]"
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
              className="wzrd-btn-primary px-6 py-2.5 text-sm"
            >
              {promoLoading ? '...' : 'تحقق'}
            </button>
          </div>
          {promoResult && (
            <p className="mt-3 text-sm font-medium" style={{color: promoResult.valid ? '#16A34A' : '#DC2626'}}>
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
                className={`relative flex flex-col rounded-2xl p-px transition-transform hover:-translate-y-1 wzrd-public-card ${
                  isPopular
                    ? ''
                    : ''
                }`}
              >
                {isPopular && (
                  <div style={{position: 'absolute', top: -12, right: isAr ? 'auto' : 20, left: isAr ? 20 : 'auto', background: '#F59E0B', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999}}>
                    {isAr ? '⭐ الأكثر طلباً' : '⭐ Most Popular'}
                  </div>
                )}
                <div className="flex h-full flex-col gap-5 rounded-2xl p-7" style={{background: isPopular ? '#1B4FD8' : '#FFFFFF'}}>
                  {/* Plan header */}
                  <div>
                    <div className="mb-3 text-3xl">{icon}</div>
                    <h3 className="text-lg font-bold" style={{color: isPopular ? '#fff' : '#111827'}}>
                      {locale === 'ar' ? plan.label : plan.labelEn}
                    </h3>
                    <p className="mt-1 text-sm" style={{color: isPopular ? 'rgba(255,255,255,0.75)' : '#6B7280'}}>
                      {locale === 'ar' ? (plan.description || plan.descEn) : (plan.descEn || plan.description)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight" style={{color: isPopular ? '#fff' : '#111827'}}>
                      {locale === 'ar' ? toArabicNumerals(plan.price.toLocaleString()) : plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm" style={{color: isPopular ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}}>ج.م</span>
                    <span className="mr-2 text-xs" style={{color: isPopular ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}}>{isAr ? 'دفعة واحدة' : 'one-time'}</span>
                  </div>

                  {/* Credits badge */}
                  <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: isPopular ? 'rgba(255,255,255,0.15)' : '#EEF2FF', fontSize: 12, fontWeight: 700, color: isPopular ? '#fff' : '#1B4FD8'}}>
                    ⚡ {locale === 'ar' ? toArabicNumerals(plan.credits.toLocaleString()) : plan.credits.toLocaleString()} كريدت
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm" style={{color: isPopular ? 'rgba(255,255,255,0.85)' : '#374151'}}>
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
                    className="mt-auto w-full rounded-xl py-3.5 text-sm font-bold transition"
                    style={{background: isPopular ? '#fff' : '#1B4FD8', color: isPopular ? '#1B4FD8' : '#fff', border: isPopular ? 'none' : 'none', opacity: isPurchasing ? 0.6 : 1, cursor: isPurchasing ? 'not-allowed' : 'pointer', fontFamily: "'Cairo', sans-serif"}}
                  >
                    {isPurchasing ? '...' : (isAr ? 'ابدأ دلوقتي ←' : 'Get started →')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Value Comparison ── */}
      <section style={{padding: '0 24px 64px', background: '#F9FAFB'}}>
        <div style={{maxWidth: 800, margin: '0 auto', paddingTop: 48}}>
          <h2 style={{textAlign: 'center', fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 32, fontFamily: "'Cairo', sans-serif"}}>
            {isAr ? 'مقارنة — WZZRD AI vs. الوكالة التقليدية' : 'WZZRD AI vs. Traditional Agency'}
          </h2>
          <div style={{borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#fff'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
              <thead>
                <tr style={{background: '#F3F4F6', borderBottom: '1px solid #E5E7EB'}}>
                  <th style={{padding: '14px 20px', textAlign: isAr ? 'right' : 'left', color: '#6B7280', fontWeight: 600}}></th>
                  <th style={{padding: '14px 20px', textAlign: 'center', color: '#1B4FD8', fontWeight: 800}}>WZZRD AI</th>
                  <th style={{padding: '14px 20px', textAlign: 'center', color: '#9CA3AF', fontWeight: 600}}>{isAr ? 'وكالة تقليدية' : 'Traditional Agency'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['التكلفة', 'من ٩٩ ج.م', '٥٠٠٠–٣٠٠٠٠ ج.م/شهر'],
                  ['وقت التسليم', 'فوري — دقائق', '٢–٤ أسابيع'],
                  ['الشفافية', 'تقرير مفصّل بالأرقام', 'ملخص عام بدون بيانات'],
                  ['التحكم', 'أنت بتشغّل الأدوات', 'بتنتظر الوكالة'],
                  ['التحديث', 'في أي وقت', 'بتدفع مرة تانية'],
                  ['الـ AI', 'مدرّب على السوق المصري والخليجي', 'عام ومش مخصّص'],
                ].map(([feature, wzrd, agency]) => (
                  <tr key={feature as string} style={{borderBottom: '1px solid #F3F4F6'}}>
                    <td style={{padding: '12px 20px', fontWeight: 600, color: '#374151'}}>{feature}</td>
                    <td style={{padding: '12px 20px', textAlign: 'center', fontWeight: 700, color: '#16A34A'}}>{wzrd}</td>
                    <td style={{padding: '12px 20px', textAlign: 'center', color: '#9CA3AF'}}>{agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{padding: '48px 24px 64px'}}>
        <div style={{maxWidth: 680, margin: '0 auto'}}>
          <h2 style={{textAlign: 'center', fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 32, fontFamily: "'Cairo', sans-serif"}}>{isAr ? 'أسئلة شائعة' : 'FAQ'}</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
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
              <details key={q} className="wzrd-public-card" style={{padding: '16px 20px'}}>
                <summary style={{listStyle: 'none', fontWeight: 700, color: '#111827', fontSize: 15, cursor: 'pointer', fontFamily: "'Cairo', sans-serif"}}>{q}</summary>
                <p style={{marginTop: 10, fontSize: 14, color: '#6B7280', lineHeight: 1.7}}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise CTA ── */}
      <section style={{padding: '0 24px 80px'}}>
        <div style={{maxWidth: 640, margin: '0 auto', background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)', border: '1px solid rgba(27,79,216,0.15)', borderRadius: 20, padding: '40px 32px', textAlign: 'center'}}>
          <div style={{fontSize: 40, marginBottom: 16}}>🏢</div>
          <h3 style={{fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 10, fontFamily: "'Cairo', sans-serif"}}>{isAr ? 'محتاج حل Enterprise؟' : 'Need an Enterprise solution?'}</h3>
          <p style={{fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24}}>{isAr ? 'لو عندك فريق أو وكالة أو شركة — عندنا باقات مخصوصة بـ multi-workspace وتقارير white-label وأولوية دعم.' : 'If you have a team, agency, or company — we offer custom plans with multi-workspace, white-label reports, and priority support.'}</p>
          <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12}}>
            <a href={waMeHref()} target="_blank" rel="noreferrer" className="wzrd-btn-primary" style={{padding: '12px 24px', fontSize: 14, borderRadius: 8, textDecoration: 'none'}}>{isAr ? 'تكلّم معنا على WhatsApp' : 'Chat on WhatsApp'}</a>
            <button onClick={() => navigate('/landing/services.html')} className="wzrd-btn-ghost" style={{padding: '12px 24px', fontSize: 14}}>{isAr ? 'شوف الخدمات' : 'View services'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
