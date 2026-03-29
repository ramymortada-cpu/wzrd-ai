import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { useI18n } from '@/lib/i18n';
import { INDUSTRIES } from '@/lib/industries';

export default function Signup() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', company: '', industry: '', newsletterOptIn: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState<string | null>(null);

  // Read referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref.toUpperCase());
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError(t('wzrd.fillNameEmail'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trpc/auth.signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: form }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(toErrorString(data?.error, `Request failed (${res.status})`));
        return;
      }

      const result = data?.result?.data?.json ?? data?.result?.data;

      if (result?.success) {
        // Apply referral code if present (non-blocking)
        if (refCode && result.user?.id) {
          fetch('/api/trpc/referral.applyReferral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { code: refCode, newUserId: result.user.id } }),
          }).catch(() => {});
        }
        navigate('/tools/brand-diagnosis');
      } else {
        setError(toErrorString(result?.message, 'Something went wrong'));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border-[0.5px] border-zinc-200/80 bg-zinc-50/80 px-4 py-3.5 text-sm text-zinc-900 outline-none backdrop-blur-sm transition placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500';

  return (
    <div className="wzrd-auth-mesh relative grid min-h-screen text-white md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,440px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 md:flex lg:p-12">
        <a href="/tools" className="flex w-fit items-baseline gap-1 text-lg font-bold transition hover:text-white">
          <span className="font-display tracking-tight">WZZRD</span>
          <span className="wzrd-badge-cyan text-[10px]">AI</span>
        </a>
        <div>
          <p className="wzrd-badge-cyan mb-4 w-fit text-[10px]">WZZRD</p>
          <h1
            className={`max-w-md text-3xl font-bold leading-tight tracking-tight lg:text-4xl ${locale === 'ar' ? 'font-sans' : 'font-display'}`}
          >
            <span className="wzrd-gradient-text">{locale === 'ar' ? 'ابدأ بكريدت مجاني' : 'Start with free credits'}</span>
            {locale === 'ar' ? ' — جرّب أدوات التشخيص.' : ' — try the diagnostic toolkit.'}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            {locale === 'ar'
              ? 'سجّل بالبريد، واحصل على رصيدك وابدأ فوراً.'
              : 'Sign up with email, claim your balance, and run your first scan.'}
          </p>
        </div>
        <p className="text-xs text-white/40">WZZRD AI</p>
      </aside>

      <div className="relative flex min-h-screen flex-col justify-center p-6 pb-20 pt-24 sm:p-8 md:px-8">
        <a href="/tools" className="absolute left-6 top-6 z-10 flex items-baseline gap-1 text-lg font-bold text-white/90 drop-shadow-md transition hover:text-white md:hidden">
          <span className="font-display">WZZRD</span>
          <span className="wzrd-badge-cyan text-[10px]">AI</span>
        </a>
        <div className="mx-auto w-full max-w-md">
          <div className="wzrd-glass wzrd-auth-card rounded-3xl p-8 sm:p-10">
            <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">{t('wzrd.getCredits')}</h2>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1.5 font-mono text-xs font-bold text-cyan-100">
              ⚡ {t('wzrd.creditsFree')}
            </div>

            {refCode && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-sm text-emerald-50">
                🎁 {locale === 'ar' ? `صاحبك بعتلك دعوة! هتاخدوا ٥٠ كريدت إضافي لكل واحد.` : `You've been invited! You'll both get 50 bonus credits.`}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-red-400/35 bg-red-500/15 p-4 text-sm text-red-100">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">{t('wzrd.yourName')}</label>
                <input type="text" placeholder={t('wzrd.yourName')} maxLength={100} className={inputClass}
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">{t('wzrd.workEmail')}</label>
                <input type="email" placeholder={t('wzrd.workEmail')} maxLength={255} className={inputClass}
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">{t('wzrd.companyName')}</label>
                <input type="text" placeholder={t('wzrd.companyName')} maxLength={255} className={inputClass}
                  value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">{t('wzrd.selectIndustry')}</label>
                <select className={inputClass} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                  <option value="">{t('wzrd.select')}</option>
                  {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{locale === 'ar' ? i.labelAr : i.label}</option>)}
                </select>
              </div>

              <label className="flex items-start gap-3 pt-1">
                <input type="checkbox" className="mt-1 accent-indigo-500 w-4 h-4"
                  checked={form.newsletterOptIn} onChange={e => setForm({ ...form, newsletterOptIn: e.target.checked })} />
                <span className="text-sm leading-relaxed text-white/70">{t('wzrd.newsletterTip')}</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmit} disabled={loading}
              className="wzrd-shimmer-btn mt-6 w-full rounded-2xl bg-gradient-to-r from-primary to-cyan-500 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? '...' : t('wzrd.getCreditsBtn')}
            </button>

            <p className="mt-4 text-center text-xs text-white/50">{t('wzrd.noCard')}</p>
          </div>

          <p className="mt-8 text-center text-sm text-white/55">
            {t('wzrd.alreadyAccount')}{' '}
            <a href="/login" className="font-semibold text-cyan-200 underline-offset-4 hover:text-white hover:underline">{t('wzrd.logIn')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
