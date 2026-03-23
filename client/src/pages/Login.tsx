import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';

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
    if (!code || code.length !== 6) { setError('Enter the 6-digit code.'); return; }
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white font-mono tracking-wider">
            WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">by Primo Marca</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          {step === 'email' ? (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
              <p className="text-sm text-zinc-500 mb-6">Enter your email — we'll send a login code.</p>
              {error && <p className="text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-400/5 border border-red-400/10">{error}</p>}
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && requestCode()}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-indigo-500 mb-4"
              />
              <button onClick={requestCode} disabled={loading || !email}
                className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                {loading ? 'Sending...' : 'Send Login Code'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Check your email</h2>
              <p className="text-sm text-zinc-500 mb-1">We sent a 6-digit code to:</p>
              <p className="text-sm text-indigo-400 font-medium mb-6">{email}</p>
              {error && <p className="text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-400/5 border border-red-400/10">{error}</p>}
              <input
                type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyCode()}
                placeholder="000000" maxLength={6}
                className="w-full px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder:text-zinc-700 outline-none focus:border-indigo-500 mb-4"
                autoFocus
              />
              <button onClick={verifyCode} disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-50 hover:opacity-90 transition">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button onClick={() => { setStep('email'); setCode(''); setError(''); }}
                className="w-full mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition">
                ← Use a different email
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          No account? <a href="/signup" className="text-amber-500 hover:underline">Get 100 free credits</a>
        </p>
      </div>
    </div>
  );
}
