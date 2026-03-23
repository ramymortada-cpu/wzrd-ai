import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';

const INDUSTRIES = [
  { value: 'f&b', label: 'Food & Beverage', labelAr: 'مأكولات ومشروبات' },
  { value: 'tech', label: 'Technology', labelAr: 'تكنولوجيا' },
  { value: 'healthcare', label: 'Healthcare', labelAr: 'رعاية صحية' },
  { value: 'retail', label: 'Retail / E-commerce', labelAr: 'تجزئة' },
  { value: 'realestate', label: 'Real Estate', labelAr: 'عقارات' },
  { value: 'education', label: 'Education', labelAr: 'تعليم' },
  { value: 'beauty', label: 'Beauty / Fashion', labelAr: 'جمال / أزياء' },
  { value: 'other', label: 'Other', labelAr: 'آخر' },
];

export default function Signup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: '', email: '', company: '', industry: '', newsletterOptIn: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Please fill in your name and email');
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wider text-white font-mono">
            WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
          </h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase mt-1">by Primo Marca</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-xl font-bold text-white mb-1">Get 100 Free Credits</h2>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 rounded-full px-3 py-1 mb-6">
            ⚡ 100 CREDITS FREE
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="space-y-3">
            <input
              type="text" placeholder="Your name" maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email" placeholder="Work email" maxLength={255}
              className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text" placeholder="Company name" maxLength={255}
              className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
              value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
            />
            <select
              className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white text-sm outline-none focus:border-indigo-500 transition"
              value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>

            <label className="flex items-start gap-2 pt-1">
              <input
                type="checkbox" className="mt-1 accent-indigo-500"
                checked={form.newsletterOptIn}
                onChange={e => setForm({ ...form, newsletterOptIn: e.target.checked })}
              />
              <span className="text-xs text-zinc-500">Send me weekly brand tips (unsubscribe anytime)</span>
            </label>
          </div>

          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? '...' : 'Get My 100 Free Credits →'}
          </button>

          <p className="text-center text-xs text-zinc-600 mt-3">No credit card. No spam. Just clarity.</p>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Already have an account? <a href="/login" className="text-amber-500 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
