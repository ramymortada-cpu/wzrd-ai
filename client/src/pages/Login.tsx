import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

export default function Login() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/trpc/auth.requestLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { email } }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json ?? data?.result?.data;
      if (result?.success) {
        setStep('code');
        if (result?.devCode) setCode(result.devCode);
      } else {
        setError(toErrorString(result?.message, 'Failed to send code.'));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) { setError(t('wzrd.enterCode')); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/trpc/auth.verifyLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { email, code } }),
      });
      const data = await res.json();
      const result = data?.result?.data?.json ?? data?.result?.data;
      if (result?.success) {
        navigate('/tools');
      } else {
        setError(toErrorString(result?.message, 'Invalid code.'));
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
      <div className="flex items-center justify-center px-4 pt-20 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-8">
            {step === 'email' ? (
              <>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t('wzrd.welcomeBack')}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{t('wzrd.enterEmailSendCode')}</p>
                {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestCode()} placeholder="your@email.com" className={inputClass}
                  />
                </div>
                <button onClick={requestCode} disabled={loading || !email}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 transition disabled:opacity-50">
                  {loading ? t('wzrd.sending') : t('wzrd.sendLoginCode')}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t('wzrd.checkEmail')}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{t('wzrd.sentCodeTo')}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-6">{email}</p>
                {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Code</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && verifyCode()} placeholder="000000" maxLength={6}
                    className="w-full px-4 py-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    autoFocus
                  />
                </div>
                <button onClick={verifyCode} disabled={loading || code.length !== 6}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-base hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 transition disabled:opacity-50">
                  {loading ? t('wzrd.verifying') : t('wzrd.verifyLogin')}
                </button>
                <button onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="w-full mt-4 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition">
                  ← {t('wzrd.useDifferentEmail')}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-sm text-zinc-600 dark:text-zinc-500 mt-8">
            {t('wzrd.noAccount')}{' '}
            <a href="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">{t('wzrd.getCredits')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
