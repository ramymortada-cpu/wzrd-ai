/**
 * Login.tsx — WZZRD AI
 * Design: warm cream (#FAFAF5) + cobalt blue (#1B4FD8) — matches homepage
 * RTL Arabic-first, passwordless OTP flow
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useI18n } from '@/lib/i18n';

const C = {
  bg:          "#FAFAF5",
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

export default function Login() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [step, setStep]       = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: isAr ? FONT : "'Inter','Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Top Bar */}
      <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{ textDecoration: "none" }}>
          <img src="/logo.webp" alt="WZZRD AI" style={{ height: 36 }} />
        </a>
        <span style={{ fontSize: 14, color: C.muted }}>
          {isAr ? 'مش عندك حساب؟' : "Don't have an account?"}{' '}
          <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
            style={{ color: C.blue, fontWeight: 700, textDecoration: "none" }}>
            {isAr ? 'سجّل مجاناً' : 'Sign up free'}
          </a>
        </span>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Blue header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${C.blue} 0%, #1239A6 100%)`,
            borderRadius: "16px 16px 0 0",
            padding: "28px 32px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              {step === 'email' ? '👋' : '📧'}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>
              {step === 'email'
                ? (isAr ? 'أهلاً بعودتك' : 'Welcome back')
                : (isAr ? 'تحقق من إيميلك' : 'Check your email')}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6 }}>
              {step === 'email'
                ? (isAr ? 'ادخل إيميلك وهنبعتلك كود دخول فوري — بدون باسورد' : 'Enter your email and we\'ll send you a one-time login code')
                : (isAr ? `بعتنالك كود مكوّن من ٦ أرقام على ${email}` : `We sent a 6-digit code to ${email}`)}
            </p>
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
              <div style={{
                marginBottom: 20, padding: "12px 16px", borderRadius: 10,
                background: C.errorBg, border: `1px solid ${C.errorBorder}`,
                fontSize: 14, color: C.errorColor, fontWeight: 600,
              }}>
                ⚠ {error}
              </div>
            )}

            {step === 'email' ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && requestCode()}
                    placeholder="your@email.com"
                    dir="ltr"
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 10, fontSize: 15,
                      border: `1.5px solid ${C.border}`, background: C.bg, color: C.text,
                      outline: "none", fontFamily: FONT, boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  type="button" onClick={requestCode}
                  disabled={loading || !email}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 800,
                    color: "#fff", background: loading || !email ? "#9CA3AF" : C.blue,
                    border: "none", cursor: loading || !email ? "not-allowed" : "pointer",
                    fontFamily: FONT, boxShadow: loading || !email ? "none" : `0 4px 16px ${C.blueGlow}`,
                  }}
                >
                  {loading ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'ابعتلي كود الدخول ←' : 'Send me a login code →')}
                </button>
                <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: C.blueLight, border: `1px solid ${C.borderBlue}`, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: C.blue, fontWeight: 700, margin: 0 }}>
                    {isAr ? '🔒 بدون باسورد — كود مؤقت يُرسل على إيميلك مباشرة' : '🔒 No password — a one-time code sent directly to your inbox'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
                    كود التحقق (٦ أرقام)
                  </label>
                  <div style={{ display: "flex", justifyContent: "center" }} dir="ltr">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup className="gap-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot
                            key={i} index={i}
                            className="h-12 w-10 rounded-xl border text-lg font-mono font-bold sm:h-14 sm:w-11 data-[active=true]:ring-2"
                            style={{ borderColor: C.border, background: C.bg, color: C.text }}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <button
                  type="button" onClick={verifyCode}
                  disabled={loading || code.length !== 6}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, fontSize: 15, fontWeight: 800,
                    color: "#fff", background: loading || code.length !== 6 ? "#9CA3AF" : C.blue,
                    border: "none", cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
                    fontFamily: FONT, boxShadow: loading || code.length !== 6 ? "none" : `0 4px 16px ${C.blueGlow}`,
                  }}
                >
                  {loading ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'تأكيد الدخول ←' : 'Confirm login →')}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  style={{ marginTop: 14, width: "100%", background: "none", border: "none", fontSize: 13, color: C.muted, cursor: "pointer", fontFamily: FONT, padding: "8px" }}
                >
                  {isAr ? '← استخدم إيميل تاني' : '← Use a different email'}
                </button>
              </>
            )}
          </div>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: C.muted }}>
            {isAr ? 'مش عندك حساب؟' : "Don't have an account?"}{' '}
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
              style={{ color: C.blue, fontWeight: 700, textDecoration: "none" }}>
              {isAr ? 'سجّل مجاناً ←' : 'Sign up free →'}
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px", textAlign: "center", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>© {new Date().getFullYear()} WZZRD AI — {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
      </div>
    </div>
  );
}
