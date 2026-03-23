import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

export interface ToolField {
  name: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  placeholderAr?: string;
  options?: Array<{ value: string; label: string; labelAr?: string }>;
  required?: boolean;
  maxLength?: number;
}

export interface ToolConfig {
  id: string;
  name: string;
  nameAr?: string;
  icon: string;
  cost: number;
  endpoint: string;
  description: string;
  descriptionAr?: string;
  fields: ToolField[];
  guideUrl: string;
  guideTitle: string;
  intro?: {
    headline: string;
    headlineAr?: string;
    body: string;
    bodyAr?: string;
    measures: string[];
    measuresAr?: string[];
    bestFor: string;
    bestForAr?: string;
  };
}

interface Finding {
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

interface ToolResult {
  score: number;
  label: string;
  findings: Finding[];
  recommendation: string;
  nextStep: { type: string; title: string; url: string };
  serviceRecommendation?: {
    show: boolean;
    tier: string;
    service: string;
    serviceAr: string;
    reason: string;
    reasonAr: string;
    url: string;
  } | null;
  creditsUsed: number;
  creditsRemaining: number;
}

const severityColor = (s: string) => s === 'high' ? 'text-red-400 border-red-400/20 bg-red-400/5' : s === 'medium' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 'text-green-400 border-green-400/20 bg-green-400/5';
const scoreColor = (s: number) => s >= 70 ? 'from-green-400 to-cyan-400' : s >= 40 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-pink-400';

// ═══════════════════════════════════════
// PROCESSING ANIMATION — shows analysis steps
// ═══════════════════════════════════════
const ANALYSIS_STEPS = [
  { label: 'جاري تحليل بيانات البراند...', labelEn: 'Analyzing brand data...', duration: 1500 },
  { label: 'فحص وضوح التموضع...', labelEn: 'Checking positioning clarity...', duration: 2000 },
  { label: 'تقييم اتساق الرسائل...', labelEn: 'Evaluating messaging consistency...', duration: 2000 },
  { label: 'مراجعة هيكل العرض...', labelEn: 'Reviewing offer structure...', duration: 1800 },
  { label: 'تحليل الهوية البصرية...', labelEn: 'Analyzing visual identity...', duration: 1500 },
  { label: 'فحص رحلة العميل...', labelEn: 'Checking customer journey...', duration: 1800 },
  { label: 'إنشاء التوصيات...', labelEn: 'Generating recommendations...', duration: 2000 },
];

function ProcessingScreen({ toolName, locale }: { toolName: string; locale: 'en' | 'ar' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Never hit 100 until done
        return prev + 0.5;
      });
    }, 100);

    // Step progression
    let stepTimeout: ReturnType<typeof setTimeout>;
    const advanceStep = (step: number) => {
      if (step >= ANALYSIS_STEPS.length) return;
      setCurrentStep(step);
      stepTimeout = setTimeout(() => advanceStep(step + 1), ANALYSIS_STEPS[step].duration);
    };
    advanceStep(0);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white flex flex-col">
      <WzrdPublicHeader showCredits={false} />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md mx-auto text-center w-full">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>🧠</span>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-2">{toolName}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8">{locale === 'ar' ? 'WZRD AI بيحلل البيانات بتاعتك...' : 'WZRD AI is analyzing your data...'}</p>

          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
        <div className="space-y-3 text-right" dir="rtl">
          {ANALYSIS_STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 transition-all duration-500 ${
                i < currentStep ? 'opacity-40' : i === currentStep ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {i < currentStep ? (
                <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                </span>
              ) : i === currentStep ? (
                <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
              )}
              <span className={`text-sm ${i === currentStep ? 'text-zinc-900 dark:text-white font-medium' : 'text-zinc-500 dark:text-zinc-500'}`}>
                {locale === 'ar' ? step.label : step.labelEn}
              </span>
            </div>
          ))}
        </div>

          <p className="text-[10px] text-zinc-500 dark:text-zinc-700 mt-12 tracking-widest">POWERED BY WZRD AI</p>
        </div>
      </div>
    </div>
  );
}

export default function ToolPage({ config }: { config: ToolConfig }) {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState('');

  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    for (const field of config.fields) {
      if (field.required && !formData[field.name]) {
        setError(`Please fill in: ${field.label}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    // Minimum 8 seconds processing time so user sees the full animation
    const minDelay = new Promise(resolve => setTimeout(resolve, 8000));

    try {
      const [, res] = await Promise.all([
        minDelay,
        fetch(`/api/trpc/${config.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: formData }),
        }),
      ]);
      const data = await res.json();

      if (data.error) {
        const msg = data.error.message || data.error.json?.message || '';
        setError(typeof msg === 'string' ? msg : 'Analysis failed. You may not have enough credits.');
      } else {
        // Handle both tRPC response formats: {result.data.json} or {result.data}
        const toolResult = data.result?.data?.json ?? data.result?.data;
        if (toolResult?.score !== undefined) {
          setResult(toolResult);
        } else {
          setError('Unexpected response format. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══ PROCESSING VIEW ═══
  if (loading) {
    return <ProcessingScreen toolName={locale === 'ar' && config.nameAr ? config.nameAr : config.name} locale={locale} />;
  }

  // ═══ RESULT VIEW ═══
  if (result) {
    const serviceLabel = locale === 'ar' ? result.serviceRecommendation?.serviceAr : result.serviceRecommendation?.service;
    const serviceReason = locale === 'ar' ? result.serviceRecommendation?.reasonAr : result.serviceRecommendation?.reason;
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <WzrdPublicHeader showCredits={false} />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition">{t('wzrd.backTools')}</button>

          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${scoreColor(result.score)} mb-4`}>
              <span className="text-4xl font-bold text-zinc-950 font-mono">{result.score}</span>
            </div>
            <h2 className="text-2xl font-bold">{locale === 'ar' && config.nameAr ? config.nameAr : config.name}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{result.label} · {result.creditsUsed} {t('wzrd.creditsUsed')} · {result.creditsRemaining} {t('wzrd.remaining')}</p>
          </div>

          <div className="space-y-3 mb-8">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-4 rounded-xl border shadow-sm ${severityColor(f.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">{f.severity}</span>
                  <h4 className="font-bold text-sm">{f.title}</h4>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 mb-8">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">💡 {result.recommendation}</p>
          </div>

          {result.serviceRecommendation?.show && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{result.serviceRecommendation.tier}</span>
                <span className="text-sm font-bold">{serviceLabel}</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{serviceReason}</p>
              <a href={result.serviceRecommendation.url} className="inline-block px-4 py-2 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition">
                {t('wzrd.learnAbout')} {serviceLabel} →
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a href={result.nextStep.url} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30 transition text-center shadow-sm">
              <span className="text-xl">📖</span>
              <p className="text-xs font-bold mt-2">{result.nextStep.title}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('wzrd.learnMore')}</p>
            </a>
            <a href="/services-info" className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30 transition text-center shadow-sm">
              <span className="text-xl">🤝</span>
              <p className="text-xs font-bold mt-2">{t('wzrd.talkToExpert')}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('wzrd.doneForYou')}</p>
            </a>
          </div>

          <button onClick={() => { setResult(null); setFormData({}); }} className="w-full mt-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 transition">
            {t('wzrd.runAgain')}
          </button>
        </div>
      </div>
    );
  }

  // ═══ FORM VIEW ═══
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader showCredits={false} />
      <div className="max-w-lg mx-auto px-6 py-16">
        <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition">{t('wzrd.backTools')}</button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{locale === 'ar' && config.nameAr ? config.nameAr : config.name}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{locale === 'ar' && config.descriptionAr ? config.descriptionAr : config.description} · ~{config.cost} {t('wzrd.credits')}</p>
          </div>
        </div>

        {config.intro && (
          <div className="mb-8 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 shadow-sm">
            <h2 className="text-base font-bold mb-2">{locale === 'ar' && config.intro.headlineAr ? config.intro.headlineAr : config.intro.headline}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{locale === 'ar' && config.intro.bodyAr ? config.intro.bodyAr : config.intro.body}</p>
            <div className="mb-3">
              <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider mb-2">{t('wzrd.whatItMeasures')}</p>
              <div className="flex flex-wrap gap-1.5">
                {(locale === 'ar' && config.intro.measuresAr ? config.intro.measuresAr : config.intro.measures).map((m, i) => (
                  <span key={i} className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 leading-relaxed">
              {locale === 'ar' && config.intro.bestForAr ? config.intro.bestForAr : (<><span className="font-bold">{t('wzrd.bestFor')}</span> {config.intro.bestFor}</>)}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {config.fields.map(field => {
            const fieldLabel = locale === 'ar' && field.labelAr ? field.labelAr : field.label;
            const fieldPlaceholder = locale === 'ar' && field.placeholderAr ? field.placeholderAr : field.placeholder;
            return (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{fieldLabel}</label>
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={fieldPlaceholder} maxLength={field.maxLength || 1000} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition resize-none"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                >
                  <option value="">{t('wzrd.select')}</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>{locale === 'ar' && o.labelAr ? o.labelAr : o.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-indigo-500" checked={!!formData[field.name]} onChange={e => updateField(field.name, e.target.checked)} />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{fieldPlaceholder}</span>
                </label>
              ) : (
                <input
                  type="text" placeholder={fieldPlaceholder} maxLength={field.maxLength || 255}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              )}
            </div>
          );})}
        </div>

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
        >
          {t('wzrd.analyze')} — {config.cost} {t('wzrd.credits')}
        </button>
      </div>
    </div>
  );
}
