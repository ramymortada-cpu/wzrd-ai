import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { INDUSTRIES } from '@/lib/industries';

export default function Signup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: '', email: '', company: '', industry: '', newsletterOptIn: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref.toUpperCase());
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('اكتب اسمك وإيميلك الأول');
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
        if (refCode && result.user?.id) {
          fetch('/api/trpc/referral.applyReferral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { code: refCode, newUserId: result.user.id } }),
          }).catch(() => {});
        }
        navigate('/tools/brand-diagnosis');
      } else {
        setError(toErrorString(result?.message, 'حصل حاجة غلط'));
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
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-[#7058F8]/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-cyan-500/8 blur-[120px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <a href="/" className="mb-8 flex items-baseline gap-1.5 text-xl font-extrabold tracking-tight text-white transition hover:opacity-80">
          <span>WZZRD</span>
          <span className="rounded bg-[#7058F8] px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
        </a>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">ابدأ مجاناً</h1>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                سجّل وهتاخد كريدت مجاني تجرّب بيه أدوات تشخيص البراند فوراً.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#7058F8]/30 bg-[#7058F8]/10 px-3 py-1.5 text-xs font-bold text-[#a08fff]">
                ⚡ كريدت مجاني عند التسجيل
              </div>
            </div>

            {refCode && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                🎁 صاحبك بعتلك دعوة — هتاخدوا ٥٠ كريدت إضافي لكل واحد!
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                  الاسم
                </label>
                <input
                  type="text"
                  placeholder="اسمك الكامل"
                  maxLength={100}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  maxLength={255}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                  اسم الشركة / البراند <span className="normal-case text-white/25">(اختياري)</span>
                </label>
                <input
                  type="text"
                  placeholder="اسم الشركة أو البراند"
                  maxLength={255}
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/40">
                  القطاع <span className="normal-case text-white/25">(اختياري)</span>
                </label>
                <select
                  value={form.industry}
                  onChange={e => setForm({ ...form, industry: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#0D0D1A] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#7058F8]/50 focus:ring-2 focus:ring-[#7058F8]/20"
                >
                  <option value="">اختار القطاع</option>
                  {(INDUSTRIES as readonly { value: string; label: string; labelAr: string }[]).map(i => (
                    <option key={i.value} value={i.value}>{i.labelAr || i.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#7058F8]"
                  checked={form.newsletterOptIn}
                  onChange={e => setForm({ ...form, newsletterOptIn: e.target.checked })}
                />
                <span className="text-sm leading-relaxed text-white/50">
                  أبعتلي نصايح أسبوعية عن تطوير البراند والتسويق — مجاناً.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-l from-[#7058F8] to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-[#7058F8]/20 transition hover:opacity-90 hover:shadow-[0_0_24px_rgba(112,88,248,0.5)] disabled:opacity-50"
            >
              {loading ? 'جاري التسجيل...' : 'ابدأ مجاناً — بدون كارت'}
            </button>

            <p className="mt-3 text-center text-xs text-white/30">
              بالتسجيل بتوافق على شروط الاستخدام وسياسة الخصوصية.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            عندك حساب بالفعل؟{' '}
            <a href="/login" className="font-semibold text-[#a08fff] transition hover:text-white">
              سجّل دخولك
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
