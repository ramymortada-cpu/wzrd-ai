import { useState } from 'react';
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

      // Rate limit (429) and other non-tRPC errors return { error, retryAfter }
      if (!res.ok) {
        setError(toErrorString(data?.error, `Request failed (${res.status})`));
        return;
      }

      const result = data?.result?.data?.json ?? data?.result?.data;

      if (result?.success) {
        navigate('/tools');
      } else {
        setError(toErrorString(result?.message, 'Something went wrong'));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <WzrdPublicHeader showCredits={false} />
      <div className="flex items-center justify-center p-8 pt-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-lg shadow-zinc-200/50 dark:shadow-none p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{t('wzrd.getCredits')}</h2>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-400/5 border border-cyan-500/20 dark:border-cyan-400/10 rounded-full px-3 py-1 mb-6">
              ⚡ {t('wzrd.creditsFree')}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="space-y-3">
              <input
                type="text" placeholder={t('wzrd.yourName')} maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="email" placeholder={t('wzrd.workEmail')} maxLength={255}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="text" placeholder={t('wzrd.companyName')} maxLength={255}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
              />
              <select
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">{t('wzrd.selectIndustry')}</option>
                {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{locale === 'ar' ? i.labelAr : i.label}</option>)}
              </select>

              <label className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox" className="mt-1 accent-indigo-500"
                  checked={form.newsletterOptIn}
                  onChange={e => setForm({ ...form, newsletterOptIn: e.target.checked })}
                />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('wzrd.newsletterTip')}</span>
              </label>
            </div>

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full mt-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? '...' : t('wzrd.getCreditsBtn')}
            </button>

            <p className="text-center text-xs text-zinc-500 dark:text-zinc-600 mt-3">{t('wzrd.noCard')}</p>
          </div>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-600 mt-6">
            {t('wzrd.alreadyAccount')}{' '}
            <a href="/login" className="text-amber-600 dark:text-amber-500 hover:underline font-medium">{t('wzrd.logIn')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
