/**
 * Signup.tsx — WZZRD AI
 * Design: warm cream (#FAFAF5) + cobalt blue (#1B4FD8) — matches homepage
 * RTL Arabic-first, all original signup logic preserved
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { INDUSTRIES } from '@/lib/industries';

const C = {
  bg:          "#FAFAF5",
  bgAlt:       "#F4F3EE",
  surface:     "#FFFFFF",
  blue:        "#1B4FD8",
  blueLight:   "#EEF2FF",
  blueGlow:    "rgba(27,79,216,0.12)",
  borderBlue:  "rgba(27,79,216,0.2)",
  text:        "#111827",
  muted:       "#6B7280",
  border:      "#E5E7EB",
  errorColor:  "#DC2626",
  errorBg:     "#FEF2F2",
  errorBorder: "#FECACA",
};
const FONT = "'Cairo', 'Segoe UI', sans-serif";

export default function Signup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: '', email: '', company: '', industry: '', newsletterOptIn: true,
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [refCode, setRefCode]   = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref.toUpperCase());
  }, []);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 15,
    border: `1.5px solid ${C.border}`, background: C.bg, color: C.text,
    outline: "none", fontFamily: FONT, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: C.muted,
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT, direction: "rtl", display: "flex", flexDirection: "column" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ textDecoration: "none" }}>
          <img src="/logo.webp" alt="WZZRD AI" style={{ height: 36 }} />
        </a>
        <span style={{ fontSize: 14, color: C.muted }}>
          عندك حساب؟{' '}
          <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            style={{ color: C.blue, fontWeight: 700, textDecoration: "none" }}>
            سجّل الدخول
          </a>
        </span>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>

          {/* Blue header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${C.blue} 0%, #1239A6 100%)`,
            borderRadius: "16px 16px 0 0",
            padding: "28px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚀</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>
              ابدأ رحلتك مع WZZRD AI
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6 }}>
              حساب مجاني — ابدأ تشخيص علامتك التجارية دلوقتي
            </p>
            {refCode && (
              <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", borderRadius: 100, padding: "5px 14px" }}>
                <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>🎁 كود إحالة: {refCode}</span>
              </div>
            )}
          </div>

          {/* White card */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            padding: "32px",
            boxShadow: `0 8px 40px ${C.blueGlow}`,
          }}>
            {error && (
              <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: C.errorBg, border: `1px solid ${C.errorBorder}`, fontSize: 14, color: C.errorColor, fontWeight: 600 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>الاسم الكامل *</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="محمد أحمد" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>البريد الإلكتروني *</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="your@email.com" dir="ltr" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>اسم الشركة / البراند</label>
              <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)}
                placeholder="اسم بزنسك (اختياري)" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>المجال</label>
              <select value={form.industry} onChange={(e) => set('industry', e.target.value)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                <option value="">اختار مجالك (اختياري)</option>
                {(INDUSTRIES as unknown as Array<{ value: string; labelAr: string }>).map((ind) => (
                  <option key={ind.value} value={ind.value}>{ind.labelAr}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
              onClick={() => set('newsletterOptIn', !form.newsletterOptIn)}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                border: `2px solid ${form.newsletterOptIn ? C.blue : C.border}`,
                background: form.newsletterOptIn ? C.blue : C.surface,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {form.newsletterOptIn && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                أريد استلام نصائح تسويقية واستراتيجيات بناء البراند أسبوعياً على بريدي
              </p>
            </div>

            <button
              type="button" onClick={handleSubmit}
              disabled={loading || !form.name || !form.email}
              style={{
                width: "100%", padding: "15px", borderRadius: 10, fontSize: 16, fontWeight: 900,
                color: "#fff", background: loading || !form.name || !form.email ? "#9CA3AF" : C.blue,
                border: "none", cursor: loading || !form.name || !form.email ? "not-allowed" : "pointer",
                fontFamily: FONT, boxShadow: loading || !form.name || !form.email ? "none" : `0 4px 20px ${C.blueGlow}`,
              }}
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حسابي المجاني ←'}
            </button>

            <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: C.muted }}>
              بالتسجيل أنت توافق على{' '}
              <a href="#" style={{ color: C.blue, textDecoration: "none" }}>شروط الاستخدام</a>
              {' '}و{' '}
              <a href="#" style={{ color: C.blue, textDecoration: "none" }}>سياسة الخصوصية</a>
            </p>
          </div>

          <div style={{ marginTop: 24, padding: "20px 24px", background: C.blueLight, border: `1px solid ${C.borderBlue}`, borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.blue, marginBottom: 12 }}>✓ إيه اللي هتاخده مجاناً:</p>
            {[
              "تشخيص أولي مجاني لعلامتك التجارية",
              "تقرير فوري بالمشاكل والحلول",
              "نصائح أسبوعية على بريدك",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: C.blue, fontWeight: 900, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: C.text }}>{item}</span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: C.muted }}>
            عندك حساب؟{' '}
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}
              style={{ color: C.blue, fontWeight: 700, textDecoration: "none" }}>
              سجّل الدخول ←
            </a>
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 24px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>© 2026 WZZRD AI — جميع الحقوق محفوظة</p>
      </div>
    </div>
  );
}
