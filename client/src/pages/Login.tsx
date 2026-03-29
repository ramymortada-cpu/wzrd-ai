import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function Login() {
  const [, navigate] = useLocation();
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
      setError('خطأ في الاتصال. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) { setError('اكتب الكود كامل'); return; }
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
        setError(toErrorString(result?.message, 'الكود غلط أو انتهى.'));
      }
    } catch {
      setError('خطأ في الاتصال. حاول تاني.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D1A] text-white" dir="rtl">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 right-1/3 h-[500px] w-[500px] rounded-full bg-[#7058F8]/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-cyan-500/8 blur-[120px]" />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <a href="/" className="mb-10 flex items-baseline gap-1.5 text-xl font-extrabold tracking-tight text-white transition hover:opacity-80">
          <span>WZZRD</span>
          <span className="rounded bg-[#7058F8] px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
        </a>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
            {step === 'email' ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">أهلاً بعودتك</h1>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    ادخل إيميلك وهنبعتلك كود دخول فوري — بدون باسورد.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="mb-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestCode()}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                    dir="ltr"
                  />
                </div>

                <button
                  type="button"
                  onClick={requestCode}
                  disabled={loading || !email}
                  className="w-full rounded-xl bg-gradient-to-l from-[#7058F8] to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-[#7058F8]/20 transition hover:opacity-90 hover:shadow-[0_0_24px_rgba(112,88,248,0.5)] disabled:opacity-50"
                >
                  {loading ? 'جاري الإرسال...' : 'ابعتلي كود الدخول'}
                </button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">تحقق من إيميلك</h1>
                  <p className="mt-2 text-sm text-white/50">
                    بعتنالك كود مكوّن من ٦ أرقام على
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#a08fff]" dir="ltr">{email}</p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-white/40">
                    كود التحقق
                  </label>
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="h-12 w-10 rounded-xl border border-white/10 bg-white/5 text-lg font-mono font-bold text-white sm:h-14 sm:w-11 data-[active=true]:border-[#7058F8]/70 data-[active=true]:ring-2 data-[active=true]:ring-[#7058F8]/30"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-xl bg-gradient-to-l from-[#7058F8] to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-[#7058F8]/20 transition hover:opacity-90 hover:shadow-[0_0_24px_rgba(112,88,248,0.5)] disabled:opacity-50"
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="mt-4 w-full text-sm text-white/40 transition hover:text-white/70"
                >
                  ← استخدم إيميل تاني
                </button>
              </>
            )}
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-white/40">
            مش عندك حساب؟{' '}
            <a href="/signup" className="font-semibold text-[#a08fff] transition hover:text-white">
              سجّل دلوقتي
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
