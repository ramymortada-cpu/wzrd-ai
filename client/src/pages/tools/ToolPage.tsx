import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';

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
// PROCESSING — professional timeline-based analysis (15s min)
// ═══════════════════════════════════════
const ANALYSIS_STAGES = [
  {
    title: 'قراءة البيانات المدخلة',
    titleEn: 'Reading Input Data',
    tag: undefined,
    substeps: ['تم استلام بيانات الشركة والمجال والسوق', 'جاري تجهيز البيانات للتحليل...'],
    substepsEn: ['Company and market data received', 'Preparing data for analysis...'],
    duration: 1500,
  },
  {
    title: 'تحليل وضوح التموضع',
    titleEn: 'Positioning Clarity Analysis',
    tag: "Keller's CBBE Framework",
    substeps: ['بنقارن التموضع بتاعك بمعايير السوق', 'بنشوف لو فيه Clarity Gap أو Positioning Trap', 'بنقيس مدى وضوح القيمة المقدمة...'],
    substepsEn: ['Comparing positioning against market standards', 'Checking for Clarity Gap or Positioning Trap', 'Measuring value proposition clarity...'],
    duration: 2500,
  },
  {
    title: 'فحص اتساق الرسائل',
    titleEn: 'Messaging Consistency Audit',
    tag: 'Cross-Channel Analysis',
    substeps: ['بنراجع التاجلاين والبايو والرسالة الأساسية', 'بنقيس الاتساق عبر القنوات المختلفة', 'بنحدد أي تناقضات في الرسائل...'],
    substepsEn: ['Reviewing tagline, bio, and core message', 'Measuring cross-channel consistency', 'Identifying messaging contradictions...'],
    duration: 2000,
  },
  {
    title: 'تقييم منطق العرض والتسعير',
    titleEn: 'Offer & Pricing Logic',
    tag: 'Behavioral Economics',
    substeps: ['بنحلل هيكل الباكدجات والتسعير', 'بنطبق مبادئ الـ Anchoring والـ Decoy Effect', 'بنقيم قوة الـ Proof Stack...'],
    substepsEn: ['Analyzing package structure and pricing', 'Applying Anchoring and Decoy Effect principles', 'Evaluating Proof Stack strength...'],
    duration: 2000,
  },
  {
    title: 'تحليل الهوية البصرية',
    titleEn: 'Visual Identity Analysis',
    tag: "Kapferer's Prism",
    substeps: ['بنراجع اللوجو والألوان والتايبوغرافي', 'بنقيس تماسك الهوية البصرية عبر القنوات...'],
    substepsEn: ['Reviewing logo, colors, and typography', 'Measuring visual identity cohesion across channels...'],
    duration: 1800,
  },
  {
    title: 'فحص رحلة العميل',
    titleEn: 'Customer Journey Mapping',
    tag: 'Touchpoint Analysis',
    substeps: ['بنتتبع رحلة العميل من أول ما يعرفك لحد ما يشتري', 'بنحدد نقاط الاحتكاك والضعف...'],
    substepsEn: ['Tracing journey from awareness to purchase', 'Identifying friction points and drop-offs...'],
    duration: 1800,
  },
  {
    title: 'حساب النتيجة النهائية',
    titleEn: 'Calculating Final Score',
    tag: undefined,
    substeps: ['بنجمع نتائج الـ 5 محاور', 'بنحسب الـ weighted score الإجمالي...'],
    substepsEn: ['Aggregating results from 5 pillars', 'Computing weighted total score...'],
    duration: 1500,
  },
  {
    title: 'إنشاء التوصيات المخصصة',
    titleEn: 'Generating Custom Recommendations',
    tag: undefined,
    substeps: ['بنحدد أهم المشاكل حسب الأولوية', 'بنكتب توصيات مخصصة لحالتك...', 'جاري تجهيز التقرير النهائي...'],
    substepsEn: ['Prioritizing critical issues', 'Writing recommendations for your case...', 'Preparing final report...'],
    duration: 2000,
  },
] as const;

const TOTAL_DURATION = ANALYSIS_STAGES.reduce((s, st) => s + st.duration, 0); // ~15.1s

function TypewriterSubstep({ text, visible = true }: { text: string; visible?: boolean }) {
  const [charsShown, setCharsShown] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCharsShown(0);
      return;
    }
    const target = text.length;
    if (target === 0) return;
    const step = Math.max(1, Math.ceil(target / 12));
    const interval = setInterval(() => {
      setCharsShown(prev => {
        if (prev >= target) {
          clearInterval(interval);
          return target;
        }
        return Math.min(prev + step, target);
      });
    }, 40);
    return () => clearInterval(interval);
  }, [text, visible]);

  if (!visible) return null;
  const display = text.slice(0, charsShown);
  return (
    <span className="block text-xs text-zinc-400 mt-1">
      {'> '}{display}
      {charsShown < text.length && <span className="inline-block w-0.5 h-3 ml-0.5 bg-indigo-400 animate-pulse align-middle" />}
    </span>
  );
}

function ProcessingScreen({ toolName, locale }: { toolName: string; locale: 'en' | 'ar' }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [substepIndex, setSubstepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const stage = ANALYSIS_STAGES[stageIndex];
  const substeps = stage ? (locale === 'ar' ? stage.substeps : stage.substepsEn) : [];
  const displaySubstep = substeps[substepIndex];

  useEffect(() => {
    if (isComplete) {
      setProgress(100);
      return;
    }
    if (!stage) return;

    // Substep advance every 500ms
    const substepTimer = setInterval(() => {
      setSubstepIndex(prev => {
        if (prev < substeps.length - 1) return prev + 1;
        return prev;
      });
    }, 500);

    // Stage advance after duration
    const stageTimer = setTimeout(() => {
      setStageIndex(prev => {
        if (prev >= ANALYSIS_STAGES.length - 1) {
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
      setSubstepIndex(0);
    }, stage.duration);

    return () => {
      clearInterval(substepTimer);
      clearTimeout(stageTimer);
    };
  }, [stageIndex, isComplete]);

  // Progress bar: smooth over total duration
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = isComplete ? 100 : Math.min(99, (elapsed / TOTAL_DURATION) * 100);
      setProgress(prev => (pct > prev ? pct : prev));
    }, 100);
    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Subtle particle background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-indigo-400/30 animate-pulse"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <WzrdPublicHeader showCredits={false} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-8">
        <div className="max-w-md w-full">
          <h2 className="text-center text-lg font-bold mb-1" dir="rtl">
            {locale === 'ar' ? '🧠 WZRD AI يحلل البراند بتاعك' : '🧠 WZRD AI is analyzing your brand'}
          </h2>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Vertical timeline - RTL right-aligned */}
          <div className="space-y-0" dir="rtl">
            {ANALYSIS_STAGES.map((s, i) => {
              const isDone = i < stageIndex || isComplete;
              const isActive = i === stageIndex && !isComplete;
              const isWaiting = i > stageIndex;
              const title = locale === 'ar' ? s.title : s.titleEn;

              return (
                <div
                  key={i}
                  className={`relative flex gap-4 transition-opacity duration-300 ${
                    isWaiting ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  {/* Connector line (except last) */}
                  {i < ANALYSIS_STAGES.length - 1 && (
                    <div
                      className="absolute top-6 bottom-0 w-px bg-zinc-700 -translate-x-1/2"
                      style={{ right: '11px' }}
                    />
                  )}

                  {/* Dot */}
                  <div className="flex-shrink-0 mt-1" style={{ width: 24 }}>
                    {isDone ? (
                      <span className="flex w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 items-center justify-center">
                        <span className="text-emerald-400 text-[10px]">✓</span>
                      </span>
                    ) : isActive ? (
                      <span className="flex w-6 h-6 rounded-full bg-indigo-500/30 border-2 border-indigo-400 items-center justify-center animate-pulse ring-4 ring-indigo-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      </span>
                    ) : (
                      <span className="flex w-6 h-6 rounded-full bg-zinc-700 border border-zinc-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                        {title}
                        {i === stageIndex && !isComplete && (
                          <span className="text-zinc-500 font-normal mr-1">...</span>
                        )}
                      </span>
                      {isDone && <span className="text-emerald-400 text-xs">✓</span>}
                      {s.tag && (isActive || isDone) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          {s.tag}
                        </span>
                      )}
                    </div>

                    {/* Substeps - only for active stage */}
                    {isActive && substeps.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {substeps.slice(0, substepIndex + 1).map((sub, j) =>
                          j < substepIndex ? (
                            <span key={j} className="block text-xs text-zinc-400 mt-1">{'> '}{sub}</span>
                          ) : (
                            <TypewriterSubstep key={j} text={sub} visible />
                          )
                        )}
                      </div>
                    )}

                    {isComplete && i === ANALYSIS_STAGES.length - 1 && (
                      <p className="text-xs text-zinc-400 mt-1">
                        {locale === 'ar' ? '> جاري تجهيز التقرير النهائي...' : '> Preparing your final report...'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-zinc-600 text-center mt-10 tracking-widest">POWERED BY WZRD AI</p>
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

    // Minimum 15 seconds so the timeline animation completes (consulting feel)
    const minDelay = new Promise(resolve => setTimeout(resolve, Math.max(15000, TOTAL_DURATION)));

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
    const isAr = locale === 'ar';
    const serviceLabel = isAr ? result.serviceRecommendation?.serviceAr : result.serviceRecommendation?.service;
    const serviceReason = isAr ? result.serviceRecommendation?.reasonAr : result.serviceRecommendation?.reason;
    const scoreLabelMap: Record<string, string> = { Strong: 'wzrd.scoreStrong', 'Needs Work': 'wzrd.scoreNeedsWork', Weak: 'wzrd.scoreWeak', Critical: 'wzrd.scoreCritical' };
    const displayScoreLabel = isAr && scoreLabelMap[result.label] ? t(scoreLabelMap[result.label]) : result.label;
    const severityKeyMap: Record<string, string> = { high: 'wzrd.severityHigh', medium: 'wzrd.severityMedium', low: 'wzrd.severityLow' };
    const getSeverityLabel = (sev: string) => (isAr && severityKeyMap[(sev || '').toLowerCase()] ? t(severityKeyMap[(sev || '').toLowerCase()]) : sev);
    const tierMap: Record<string, string> = { AUDIT: 'wzrd.tierAudit', BUILD: 'wzrd.tierBuild', TAKEOFF: 'wzrd.tierTakeoff' };
    const nextStepTitleMap: Record<string, string> = {
      'How to Audit Your Brand Health': 'wzrd.nextStepAudit',
      'Offer Logic 101': 'wzrd.nextStepOffer',
      'Brand Identity Guide': 'wzrd.nextStepBrandGuide',
      'What Is Brand Identity': 'wzrd.nextStepIdentity',
      'Full Health Check': 'wzrd.nextStepHealth',
      'Business Takeoff Package': 'wzrd.nextStepTakeoff',
    };
    const displayNextStepTitle = isAr && nextStepTitleMap[result.nextStep?.title ?? ''] ? t(nextStepTitleMap[result.nextStep.title]) : (result.nextStep?.title ?? '');
    const displayTier = isAr && result.serviceRecommendation && tierMap[result.serviceRecommendation.tier] ? t(tierMap[result.serviceRecommendation.tier]) : (result.serviceRecommendation?.tier ?? '');
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <WzrdPublicHeader showCredits={false} />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 mb-8 transition">{t('wzrd.backTools')}</button>

          <div className="mb-10" dir="ltr">
            <h2 className="text-2xl font-bold text-center">{locale === 'ar' && config.nameAr ? config.nameAr : config.name}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-1">{displayScoreLabel} · {locale === 'ar' ? toArabicNumerals(result.creditsUsed) : result.creditsUsed} {t('wzrd.creditsUsed')} · {locale === 'ar' ? toArabicNumerals(result.creditsRemaining) : result.creditsRemaining} {t('wzrd.remaining')}</p>

            {/* Score gauge */}
            <div className="mt-6 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-mono font-semibold text-zinc-700 dark:text-zinc-200">{locale === 'ar' ? toArabicNumerals(result.score) : result.score}/{locale === 'ar' ? toArabicNumerals(100) : '100'}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  result.score >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                  result.score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {displayScoreLabel}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 overflow-visible">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-300 dark:border-zinc-600 shadow-md"
                  style={{ left: `${result.score}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                <span>{locale === 'ar' ? toArabicNumerals(0) : '0'}</span>
                <span>{locale === 'ar' ? toArabicNumerals(100) : '100'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-4 rounded-xl border shadow-sm ${severityColor(f.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">{getSeverityLabel(f.severity)}</span>
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
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{displayTier}</span>
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
              <p className="text-xs font-bold mt-2">{displayNextStepTitle}</p>
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{locale === 'ar' && config.descriptionAr ? config.descriptionAr : config.description} · ~{locale === 'ar' ? toArabicNumerals(config.cost) : config.cost} {t('wzrd.credits')}</p>
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
          {t('wzrd.analyze')} — {locale === 'ar' ? toArabicNumerals(config.cost) : config.cost} {t('wzrd.credits')}
        </button>
      </div>
    </div>
  );
}
