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
        if (result?.devCode) {
          setCode(result.devCode); // Pre-fill OTP when returned (EMAIL_PROVIDER=none)
        }
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <WzrdPublicHeader showCredits={false} />
      <div className="flex items-center justify-center px-4 pt-16 pb-8">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg shadow-zinc-200/50 dark:shadow-none p-6">
            {step === 'email' ? (
              <>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t('wzrd.welcomeBack')}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{t('wzrd.enterEmailSendCode')}</p>
                {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-500/5 dark:bg-red-400/5 border border-red-500/10 dark:border-red-400/10">{error}</p>}
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && requestCode()}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 mb-4"
                />
                <button onClick={requestCode} disabled={loading || !email}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                  {loading ? t('wzrd.sending') : t('wzrd.sendLoginCode')}
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t('wzrd.checkEmail')}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('wzrd.sentCodeTo')}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6">{email}</p>
                {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-500/5 dark:bg-red-400/5 border border-red-500/10 dark:border-red-400/10">{error}</p>}
                <input
                  type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()}
                  placeholder="000000" maxLength={6}
                  className="w-full px-4 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-zinc-500 dark:placeholder-zinc-700 outline-none focus:border-indigo-500 mb-4"
                  autoFocus
                />
                <button onClick={verifyCode} disabled={loading || code.length !== 6}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                  {loading ? t('wzrd.verifying') : t('wzrd.verifyLogin')}
                </button>
                <button onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="w-full mt-3 text-xs text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-400 transition">
                  ← {t('wzrd.useDifferentEmail')}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-600 mt-6">
            {t('wzrd.noAccount')}{' '}
            <a href="/signup" className="text-amber-600 dark:text-amber-500 hover:underline font-medium">{t('wzrd.getCredits')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
