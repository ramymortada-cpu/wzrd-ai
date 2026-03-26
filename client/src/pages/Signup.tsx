import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
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

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950">
      <WzrdPublicHeader showCredits={false} />
      <div className="flex items-center justify-center p-8 pt-20">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t('wzrd.getCredits')}</h2>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full px-3 py-1.5 mb-6">
              ⚡ {t('wzrd.creditsFree')}
            </div>

            {refCode && (
              <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                🎁 {locale === 'ar' ? `صاحبك بعتلك دعوة! هتاخدوا ٥٠ كريدت إضافي لكل واحد.` : `You've been invited! You'll both get 50 bonus credits.`}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('wzrd.yourName')}</label>
                <input type="text" placeholder={t('wzrd.yourName')} maxLength={100} className={inputClass}
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('wzrd.workEmail')}</label>
                <input type="email" placeholder={t('wzrd.workEmail')} maxLength={255} className={inputClass}
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('wzrd.companyName')}</label>
                <input type="text" placeholder={t('wzrd.companyName')} maxLength={255} className={inputClass}
                  value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('wzrd.selectIndustry')}</label>
                <select className={inputClass} value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}>
                  <option value="">{t('wzrd.select')}</option>
                  {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{locale === 'ar' ? i.labelAr : i.label}</option>)}
                </select>
              </div>

              <label className="flex items-start gap-3 pt-1">
                <input type="checkbox" className="mt-1 accent-indigo-500 w-4 h-4"
                  checked={form.newsletterOptIn} onChange={e => setForm({ ...form, newsletterOptIn: e.target.checked })} />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('wzrd.newsletterTip')}</span>
              </label>
            </div>

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base transition hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? '...' : t('wzrd.getCreditsBtn')}
            </button>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4">{t('wzrd.noCard')}</p>
          </div>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-500 mt-8">
            {t('wzrd.alreadyAccount')}{' '}
            <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">{t('wzrd.logIn')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
