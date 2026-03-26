import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { useI18n } from '@/lib/i18n';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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
        setCode('');
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

  const inputClass =
    'w-full rounded-2xl border-[0.5px] border-zinc-200/80 bg-zinc-50/80 px-4 py-3.5 text-sm text-zinc-900 placeholder-zinc-500 outline-none backdrop-blur-sm transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500';

  const otpSlotClass =
    'h-12 w-10 sm:h-14 sm:w-11 rounded-xl border-[0.5px] border-zinc-200/90 bg-white/70 text-lg font-mono font-bold text-zinc-900 first:rounded-xl last:rounded-xl dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-white data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/25';

  return (
    <div className="wzrd-auth-mesh relative min-h-screen text-white">
      <a href="/tools" className="absolute left-6 top-6 z-10 flex items-baseline gap-0.5 text-lg font-extrabold font-mono tracking-tight text-white/90 drop-shadow-md transition hover:text-white">
        <span>WZRD</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">AI</span>
      </a>

      <div className="flex min-h-screen items-center justify-center px-4 pb-16 pt-24">
        <div className="w-full max-w-md">
          <div className="wzrd-glass wzrd-auth-card rounded-3xl p-8 sm:p-10">
            {step === 'email' ? (
              <>
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">{t('wzrd.welcomeBack')}</h2>
                <p className="mb-6 text-sm leading-relaxed text-white/70">{t('wzrd.enterEmailSendCode')}</p>
                {error && <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</div>}
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestCode()}
                    placeholder="your@email.com"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={loading || !email}
                  className="wzrd-shimmer-btn w-full rounded-2xl bg-gradient-to-r from-primary to-violet-600 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? t('wzrd.sending') : t('wzrd.sendLoginCode')}
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white">{t('wzrd.checkEmail')}</h2>
                <p className="mb-1 text-sm text-white/70">{t('wzrd.sentCodeTo')}</p>
                <p className="mb-6 text-sm font-semibold text-cyan-200">{email}</p>
                {error && <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">{error}</div>}
                <div className="mb-6">
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-white/60">Code</label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} className={otpSlotClass} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  className="wzrd-shimmer-btn w-full rounded-2xl bg-gradient-to-r from-primary to-cyan-500 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? t('wzrd.verifying') : t('wzrd.verifyLogin')}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="mt-4 w-full text-sm text-white/60 transition hover:text-white"
                >
                  ← {t('wzrd.useDifferentEmail')}
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-white/55">
            {t('wzrd.noAccount')}{' '}
            <a href="/signup" className="font-semibold text-cyan-200 underline-offset-4 hover:text-white hover:underline">{t('wzrd.getCredits')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
