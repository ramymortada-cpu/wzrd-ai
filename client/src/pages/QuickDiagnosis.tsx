import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

type QDFormKey = 'companyName' | 'industry' | 'targetAudience' | 'biggestChallenge' | 'socialLink';
type QDForm = Record<QDFormKey, string>;

interface QDResult {
  score: number;
  label: string;
  findings?: Array<{ title: string; severity: string }>;
  criticalCount?: number;
}

export default function QuickDiagnosis() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<QDForm>({
    companyName: '',
    industry: '',
    targetAudience: '',
    biggestChallenge: '',
    socialLink: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QDResult | null>(null);

  const questions: Array<{ key: QDFormKey; label: string; placeholder: string }> = [
    { key: 'companyName', label: isAr ? 'إيه اسم الشركة/المشروع؟' : "What's your company name?", placeholder: isAr ? 'مثال: كافيه النجمة' : 'e.g. Star Cafe' },
    { key: 'industry', label: isAr ? 'في أي مجال؟' : 'What industry?', placeholder: isAr ? 'مثال: مطاعم، أزياء، خدمات' : 'e.g. restaurants, fashion' },
    { key: 'targetAudience', label: isAr ? 'مين العميل المثالي بتاعك؟' : 'Who is your ideal customer?', placeholder: isAr ? 'مثال: شباب ٢٠-٣٥ في القاهرة' : 'e.g. young professionals 25-35' },
    { key: 'biggestChallenge', label: isAr ? 'إيه أكبر تحدي بتواجهه دلوقتي؟' : "What's your biggest challenge right now?", placeholder: isAr ? 'مثال: المبيعات بتقل / مش عارف أوصل لعملاء' : 'e.g. declining sales' },
    { key: 'socialLink', label: isAr ? 'لينك أي حساب سوشيال (اختياري)' : 'Any social media link (optional)', placeholder: isAr ? 'instagram.com/yourpage' : 'instagram.com/yourpage' },
  ];

  const handleNext = () => {
    const q = questions[step];
    const val = form[q.key]?.trim();
    if (!val && step < 4) { // socialLink is optional
      setError(isAr ? 'ده سؤال مطلوب.' : 'This field is required.');
      return;
    }
    setError('');
    if (step < 4) {
      setStep(step + 1);
    } else {
      runDiagnosis();
    }
  };

  const runDiagnosis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/trpc/tools.freeQuickDiagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: form }),
      });
      const d = await res.json();
      const data = d.result?.data?.json ?? d.result?.data;
      if (data?.score !== undefined) {
        setResult(data as QDResult);
      } else {
        setError(d.error?.json?.message || d.error?.message || (isAr ? 'حصل مشكلة — حاول تاني.' : 'Something went wrong.'));
      }
    } catch {
      setError(isAr ? 'مشكلة في الاتصال.' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : '#ef4444';

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
        <WzrdPublicHeader />
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Score */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-4" style={{ backgroundColor: scoreColor(result.score) + '20', border: `3px solid ${scoreColor(result.score)}` }}>
              <span className="text-4xl font-bold" style={{ color: scoreColor(result.score) }}>{result.score}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{form.companyName}</h2>
            <p className="text-sm text-gray-500">{result.label} · {isAr ? 'مجاناً — معاينة سريعة' : 'Free quick preview'}</p>
          </div>

          {/* Findings */}
          <div className="space-y-3 mb-6">
            {(result.findings || []).map((f, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${f.severity === 'high' ? 'bg-red-500' : f.severity === 'low' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <h4 className="text-sm font-bold text-gray-900">{f.title}</h4>
                </div>
                <p className="text-xs text-gray-400 blur-[2px] select-none">
                  {isAr ? 'التفاصيل والحلول في التشخيص الكامل ←' : 'Full details in complete diagnosis →'}
                </p>
              </div>
            ))}
          </div>

          {(result.criticalCount ?? 0) > 0 ? (
            <p className="text-center text-sm font-semibold text-amber-700 mb-4">
              {isAr
                ? `${result.criticalCount} تحذير حرج — افتح التشخيص الكامل للخطة`
                : `${result.criticalCount} critical flags — open full diagnosis for the plan`}
            </p>
          ) : null}

          {/* CTAs */}
          <div className="space-y-3">
            <a href="/signup" className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-center text-base hover:bg-indigo-500 transition">
              {isAr ? 'سجّل مجاناً واحصل على تشخيص كامل مع الكريدت ←' : '→ Sign up free — full diagnosis with credits'}
            </a>
            <a href="/app/tools/brand-diagnosis" className="block w-full py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 text-center hover:bg-gray-50 transition">
              {isAr ? 'عندك حساب؟ التشخيص الكامل ←' : 'Have an account? Full diagnosis →'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex gap-1.5 mb-8">
            {questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Question */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {questions[step].label}
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            {isAr ? `سؤال ${step + 1} من ٥` : `Question ${step + 1} of 5`}
          </p>

          <input
            type="text"
            autoFocus
            value={form[questions[step].key]}
            onChange={e => {
              const k = questions[step].key;
              setForm(prev => ({ ...prev, [k]: e.target.value }));
            }}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            placeholder={questions[step].placeholder}
            className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 text-gray-900 text-base placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none"
          />

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => { setStep(step - 1); setError(''); }}
                className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                {isAr ? 'رجوع' : 'Back'}
              </button>
            )}
            <button onClick={handleNext} disabled={loading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-base hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : step < 4 ? (isAr ? 'التالي ←' : 'Next →') : (isAr ? 'شخّص البراند ←' : 'Diagnose →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
