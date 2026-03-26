import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { waMeHref } from '@/lib/waContact';
import { toArabicNumerals } from '@/lib/formatUtils';
import { useI18n } from '@/lib/i18n';

export interface ToolField {
  name: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  placeholderAr?: string;
  options?: Array<{ value: string; label: string }>;
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
  fieldSections?: Array<{ title: string; titleAr?: string; fieldNames: string[] }>;
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
  actionItems?: Array<{ task: string; difficulty: 'easy' | 'medium' | 'hard' }>;
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

const severityColor = (s: string) =>
  s === 'high'
    ? 'text-rose-200/90 border-rose-400/20 bg-rose-500/[0.06] shadow-[inset_3px_0_0_0_rgba(244,63,94,0.35)]'
    : s === 'medium'
      ? 'text-amber-100/90 border-amber-400/18 bg-amber-500/[0.06] shadow-[inset_3px_0_0_0_rgba(251,191,36,0.35)]'
      : 'text-emerald-200/85 border-emerald-400/18 bg-emerald-500/[0.06] shadow-[inset_3px_0_0_0_rgba(52,211,153,0.35)]';

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = pct * c;
  const { c1, c2 } =
    score >= 70
      ? { c1: '#4ade80', c2: '#22d3ee' }
      : score >= 40
        ? { c1: '#fbbf24', c2: '#fb923c' }
        : { c1: '#f87171', c2: '#f472b6' };
  const gid = `wzrd-score-grad-${score}-${Math.round(pct * 1000)}`;
  return (
    <div className="relative mx-auto mb-2 h-[7.75rem] w-[7.75rem]" aria-hidden>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(39,39,42,0.55)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono text-white tabular-nums">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">/100</span>
      </div>
    </div>
  );
}

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

function ProcessingScreen({ toolName }: { toolName: string }) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
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
    <div className="wzrd-auth-mesh flex min-h-screen items-center justify-center text-white">
      <div className="max-w-md mx-auto px-6 text-center">
        {/* Animated brain icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>🧠</span>
          </div>
        </div>

        {/* Tool name */}
        <h2 className="text-lg font-bold mb-2">{toolName}</h2>
        <p className="text-xs text-zinc-500 mb-8">WZRD AI يحلل البيانات بتاعتك...</p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Courier-style tracking timeline */}
        <div
          className="relative mx-auto max-w-md px-2 text-start"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div
            className={`absolute top-3 bottom-3 w-px bg-gradient-to-b from-emerald-400/30 via-white/20 to-zinc-600/40 ${isAr ? 'right-[13px]' : 'left-[13px]'}`}
            aria-hidden
          />
          <ul className="relative space-y-4">
            {ANALYSIS_STEPS.map((step, i) => {
              const label = isAr ? step.label : step.labelEn;
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <li key={i} className="relative flex gap-4 pe-1">
                  <div
                    className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      done
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                        : active
                          ? 'wzrd-courier-pulse border-cyan-400/60 bg-cyan-500/25 text-cyan-100'
                          : 'border-zinc-600/60 bg-zinc-900/80 text-zinc-600'
                    }`}
                  >
                    {done ? (
                      <span className="text-xs font-bold">✓</span>
                    ) : active ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-cyan-200 to-primary shadow-[0_0_12px_oklch(0.75_0.15_200)]" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={`text-sm leading-snug transition-colors duration-300 ${
                        active ? 'font-semibold text-white' : done ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {label}
                    </p>
                    {active && (
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-cyan-200/80">
                        {isAr ? 'جاري المعالجة…' : 'In progress…'}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Subtle branding */}
        <p className="text-[10px] text-zinc-700 mt-12 tracking-widest">POWERED BY WZRD AI</p>
      </div>
    </div>
  );
}

export default function ToolPage({ config }: { config: ToolConfig }) {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState('');
  const [premiumReport, setPremiumReport] = useState<any>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumError, setPremiumError] = useState('');
  const [premiumOffer, setPremiumOffer] = useState({ credits: 100, egp: 99 });

  useEffect(() => {
    fetch('/api/trpc/premium.pricing')
      .then((r) => r.json())
      .then((d) => {
        const prices = d?.result?.data?.json ?? d?.result?.data;
        const sr = prices?.single_report;
        if (sr && typeof sr.credits === 'number' && typeof sr.egp === 'number') {
          setPremiumOffer({ credits: sr.credits, egp: sr.egp });
        }
      })
      .catch(() => {});
  }, []);

  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePremiumUpgrade = async () => {
    setPremiumLoading(true);
    setPremiumError('');
    try {
      const res = await fetch('/api/trpc/premium.generateReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: {
          toolId: config.id,
          formData,
          freeScore: result?.score,
        }}),
      });
      const data = await res.json();
      const reportData = data?.result?.data?.json ?? data?.result?.data;
      
      if (reportData?.success && reportData?.report) {
        setPremiumReport(reportData);
      } else {
        setPremiumError(reportData?.error || 'فشل في إنشاء التقرير. حاول تاني.');
      }
    } catch {
      setPremiumError('خطأ في الاتصال. حاول تاني.');
    } finally {
      setPremiumLoading(false);
    }
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
    return <ProcessingScreen toolName={config.name} />;
  }

  // ═══ PREMIUM REPORT VIEW ═══
  if (premiumReport) {
    const r = premiumReport;
    return (
      <div className="wzrd-page-radial text-zinc-900 dark:text-white">
        <div className="mx-auto max-w-3xl px-6 py-16" dir="rtl">
          <button onClick={() => navigate('/tools')} className="mb-8 text-xs text-zinc-500 transition hover:text-primary">
            رجوع للأدوات →
          </button>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold mb-4">
              ⭐ تقرير WZRD AI Premium
            </div>
            <h1 className="text-3xl font-bold mb-2">{config.nameAr || config.name}</h1>
            <p className="text-sm text-gray-500">تقرير مفصّل — {r.creditsUsed} كريدت · {r.creditsRemaining} متبقي</p>
          </div>

          {/* Executive Summary */}
          {r.report?.executiveSummary && (
            <div className="wzrd-glass mb-8 rounded-3xl border-indigo-200/60 p-6 dark:border-indigo-800/50">
              <h2 className="text-lg font-bold mb-3">١. الملخص التنفيذي</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold font-mono text-indigo-600">{r.report.executiveSummary.score}<span className="text-lg text-gray-400">/١٠٠</span></span>
              </div>
              {r.report.executiveSummary.pillarScores && (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(r.report.executiveSummary.pillarScores).map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg bg-white dark:bg-zinc-800">
                      <p className="text-lg font-bold font-mono">{String(v)}</p>
                      <p className="text-[10px] text-gray-500">{k}</p>
                    </div>
                  ))}
                </div>
              )}
              {r.report.executiveSummary.verdict && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.report.executiveSummary.verdict}</p>
              )}
            </div>
          )}

          {/* Pillars Deep Dive */}
          {r.report?.pillars?.map((p: any, i: number) => (
            <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">{p.name || p.nameEn}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.severity === 'critical' ? 'bg-red-100 text-red-600' : p.severity === 'major' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                  {p.score}/100 · {p.severity}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{p.analysis}</p>
              {p.gap && <p className="text-xs text-amber-600 mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/10">الفجوة: {p.gap}</p>}
            </div>
          ))}

          {/* Priority Matrix */}
          {r.report?.priorityMatrix && (
            <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-8">
              <h2 className="text-lg font-bold mb-4">٣. خريطة الأولويات</h2>
              {r.report.priorityMatrix.urgent?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-red-600 mb-1">🔴 عاجل ومهم</h4>
                  {r.report.priorityMatrix.urgent.map((item: string, i: number) => <p key={i} className="text-sm text-gray-600 mr-4">• {item}</p>)}
                </div>
              )}
              {r.report.priorityMatrix.important?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-amber-600 mb-1">🟠 مهم مش عاجل</h4>
                  {r.report.priorityMatrix.important.map((item: string, i: number) => <p key={i} className="text-sm text-gray-600 mr-4">• {item}</p>)}
                </div>
              )}
              {r.report.priorityMatrix.improvement?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-green-600 mb-1">🟡 تحسين</h4>
                  {r.report.priorityMatrix.improvement.map((item: string, i: number) => <p key={i} className="text-sm text-gray-600 mr-4">• {item}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Action Plan */}
          {r.report?.actionPlan && (
            <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-8">
              <h2 className="text-lg font-bold mb-4">٤. خطة العمل</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <h4 className="text-xs font-bold text-green-700 mb-2">٣٠ يوم</h4>
                  {(r.report.actionPlan.days30 || []).map((a: string, i: number) => <p key={i} className="text-xs text-gray-600 mb-1">• {a}</p>)}
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                  <h4 className="text-xs font-bold text-amber-700 mb-2">٦٠ يوم</h4>
                  {(r.report.actionPlan.days60 || []).map((a: string, i: number) => <p key={i} className="text-xs text-gray-600 mb-1">• {a}</p>)}
                </div>
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10">
                  <h4 className="text-xs font-bold text-indigo-700 mb-2">٩٠ يوم</h4>
                  {(r.report.actionPlan.days90 || []).map((a: string, i: number) => <p key={i} className="text-xs text-gray-600 mb-1">• {a}</p>)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {r.report?.quickWins && (
            <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 mb-8">
              <h2 className="text-lg font-bold mb-3">٥. Quick Wins — ٣ حاجات تعملها النهاردة</h2>
              {r.report.quickWins.map((w: string, i: number) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-green-600 font-bold">{i + 1}.</span>
                  <p className="text-sm text-gray-700">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {r.report?.recommendation && (
            <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-8">
              <h2 className="text-lg font-bold mb-2">٦. التوصية النهائية</h2>
              <p className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full mb-2">{r.report.recommendation.phase}</p>
              <p className="text-sm opacity-90 leading-relaxed">{r.report.recommendation.reason}</p>
              <a href="/services-info" className="inline-block mt-3 px-5 py-2 rounded-full bg-white text-indigo-600 text-sm font-bold hover:bg-gray-100 transition">تواصل مع Primo Marca ←</a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setPremiumReport(null); setFormData({}); }} className="flex-1 py-3 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-indigo-500 transition">
              حلل تاني ببيانات مختلفة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ RESULT VIEW (Free) ═══
  if (result) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(99,102,241,0.2),transparent_52%),radial-gradient(ellipse_45%_35%_at_100%_100%,rgba(6,182,212,0.07),transparent_42%),radial-gradient(ellipse_40%_30%_at_0%_80%,rgba(192,132,252,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
          {/* Back */}
          <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 mb-8 transition">← Back to Tools</button>

          {/* Score */}
          <div className="text-center mb-10">
            <div className="wzrd-fade-in-stagger mx-auto inline-block rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-6 backdrop-blur-xl" style={{ animationDelay: '0s' }}>
              <ScoreRing score={result.score} />
              <h2 className="text-2xl font-bold tracking-tight">{config.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {result.label} · {result.creditsUsed} credits used · {result.creditsRemaining} remaining
              </p>
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-3 mb-8">
            {result.findings.map((f, i) => (
              <div
                key={i}
                className={`wzrd-fade-in-stagger rounded-2xl border p-4 backdrop-blur-xl ${severityColor(f.severity)}`}
                style={{ animationDelay: `${0.08 + i * 0.07}s` }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">{f.severity}</span>
                  <h4 className="text-sm font-bold">{f.title}</h4>
                </div>
                <p className="text-xs leading-relaxed opacity-85">{f.detail}</p>
              </div>
            ))}
          </div>

          {/* ═══ ACTION ITEMS ═══ */}
          {result.actionItems && result.actionItems.length > 0 && (
            <div className="mb-8 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-base font-bold text-emerald-300 mb-3" dir="rtl">
                خطواتك العملية ({result.actionItems.length} مهمة)
              </h3>
              <div className="space-y-2">
                {result.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50" dir="rtl">
                    <div className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-emerald-500/40 flex items-center justify-center text-xs text-emerald-400 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-zinc-200">{item.task}</span>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      item.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.difficulty === 'easy' ? 'سهل' : item.difficulty === 'hard' ? 'صعب' : 'متوسط'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-3 text-center" dir="rtl">
                تابع تقدمك من <a href="/my-brand" className="text-indigo-400 hover:underline">صفحة صحة البراند</a>
              </p>
            </div>
          )}

          {/* ═══ SHARE / DOWNLOAD ═══ */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/trpc/reportPdf.generateHtml', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify({ json: { toolName: config.name, toolNameAr: config.nameAr || config.name, score: result.score, label: result.label, findings: result.findings, actionItems: result.actionItems || [], recommendation: result.recommendation } }),
                  });
                  const data = await res.json();
                  const html = data?.result?.data?.json?.html;
                  if (html) { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } }
                } catch {}
              }}
              className="flex-1 py-3 rounded-full border border-indigo-500/30 text-sm text-indigo-400 hover:bg-indigo-500/10 transition flex items-center justify-center gap-2"
            >📄 حمّل كـ PDF</button>
            <button
              onClick={async () => {
                const email = (window as any).__userEmail || prompt('ادخل إيميلك:');
                if (!email) return;
                try {
                  await fetch('/api/trpc/reportPdf.sendToEmail', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                    body: JSON.stringify({ json: { toolName: config.name, toolNameAr: config.nameAr || config.name, score: result.score, label: result.label, findings: result.findings, actionItems: result.actionItems || [], recommendation: result.recommendation, email } }),
                  });
                  alert('تم الإرسال! ✅');
                } catch { alert('فشل الإرسال'); }
              }}
              className="flex-1 py-3 rounded-full border border-green-500/30 text-sm text-green-400 hover:bg-green-500/10 transition flex items-center justify-center gap-2"
            >📧 ابعت على إيميلي</button>
            <a
              href={waMeHref(
                `نتيجة تشخيص البراند بتاعي: ${result.score}/100\n${result.findings.map(f => '• ' + f.title).join('\n')}\n\nشخّص البراند بتاعك مجاناً:\n${typeof window !== 'undefined' ? window.location.origin : ''}/welcome`,
              )}
              target="_blank" rel="noopener"
              className="flex-1 py-3 rounded-full border border-emerald-500/30 text-sm text-emerald-400 hover:bg-emerald-500/10 transition flex items-center justify-center gap-2"
            >💬 شارك على WhatsApp</a>
          </div>

          {/* ═══ PREMIUM UPGRADE — BLURRED PREVIEW (A/B winner: 2.9x better conversion) ═══ */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/80 via-zinc-950/90 to-violet-950/70 shadow-[0_0_60px_-12px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400/20">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_20%,rgba(255,255,255,0.06)_45%,transparent_70%)]" aria-hidden />
            <div className="relative border-b border-indigo-500/20 p-6 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/25 to-yellow-500/15 px-3 py-1 text-xs font-bold text-amber-100 shadow-inner">
                ⭐ PREMIUM
              </div>
              <h3 className="mb-1 text-xl font-bold" dir="rtl">التقرير المفصّل</h3>
              <p className="text-xs text-zinc-500" dir="rtl">٢٠٠٠+ كلمة — تحليل عميق لكل محور</p>
            </div>
            
            {/* Blurred Preview Sections */}
            <div className="relative space-y-3 p-5" dir="rtl">
              {[
                { title: '١. تحليل التموضع والتمايز', preview: 'البراند بتاعك حالياً واقف في منطقة...' },
                { title: '٢. خريطة الأولويات', preview: 'أول ٣ حاجات لازم تعملها بالترتيب...' },
                { title: '٣. خطة عمل ٣٠-٦٠-٩٠ يوم', preview: 'الشهر الأول: ركّز على تصليح الـ...' },
                { title: '٤. Quick Wins — حاجات تعملها النهاردة', preview: 'غيّر الـ bio بتاعك لـ: ...' },
                { title: '٥. تحليل المنافسين الأولي', preview: 'مقارنة بالمنافسين في نفس المجال...' },
                { title: '٦. توصيات مخصصة', preview: 'بناءً على الـ score بتاعك في كل محور...' },
              ].map((section, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-indigo-300 mb-1">{section.title}</h4>
                  <p className="text-xs text-zinc-500" style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                    {section.preview} وده بيأثر على الـ perception بتاع العملاء بشكل كبير. محتاج تركّز على تحسين الجزء ده لأنه الأساس اللي كل حاجة تانية مبنية عليه. الخطوة العملية الأولى هي إنك تعمل audit سريع للـ touchpoints الحالية.
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="relative bg-indigo-950/40 p-6 text-center backdrop-blur-sm">
              <button 
                onClick={handlePremiumUpgrade}
                disabled={premiumLoading}
                className="wzrd-shimmer-btn relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-bold text-white shadow-[0_12px_40px_-8px_rgba(99,102,241,0.55)] transition hover:brightness-110 disabled:opacity-50"
              >
                {premiumLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    جاري إنشاء التقرير المفصّل...
                  </span>
                ) : (
                  `اكشف التقرير الكامل — ${toArabicNumerals(String(premiumOffer.egp))} جنيه بس`
                )}
              </button>
              {premiumError && <p className="text-xs text-red-400 mt-2">{premiumError}</p>}
              <p className="text-xs text-zinc-600 mt-2">
                {toArabicNumerals(String(premiumOffer.credits))} كريدت · ضمان استرجاع لو مش راضي
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mb-8">
            <p className="text-sm font-medium text-indigo-300">💡 {result.recommendation}</p>
          </div>

          {/* Service Recommendation (only shows for score < 70) */}
          {result.serviceRecommendation?.show && (
            <div
              className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_0_40px_-10px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/25"
              style={{
                background: 'linear-gradient(145deg, oklch(0.22 0.03 280) 0%, oklch(0.16 0.04 290) 40%, oklch(0.12 0.02 260) 100%)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(251, 191, 36, 0.12), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(99, 102, 241, 0.15), transparent 45%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
                    {result.serviceRecommendation.tier}
                  </span>
                  <span className="text-base font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-white to-amber-100">
                    {result.serviceRecommendation.service}
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-zinc-300">{result.serviceRecommendation.reason}</p>
                <a
                  href={result.serviceRecommendation.url}
                  className="wzrd-shimmer-btn inline-flex rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:brightness-105"
                >
                  Learn about {result.serviceRecommendation.service} →
                </a>
              </div>
            </div>
          )}

          {/* ═══ DONE-FOR-YOU CTA — shows for score < 65 ═══ */}
          {result.score < 65 && (
            <div
              className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/50 via-teal-950/35 to-zinc-950/80 p-6 shadow-[0_0_48px_-12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/15"
              dir="rtl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.04)_48%,transparent_70%)]" aria-hidden />
              <div className="relative text-center">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {result.score < 40
                    ? 'البراند بتاعك محتاج تدخل متخصص'
                    : 'عايز نتيجة أسرع؟ خلّينا نشتغل عليها'}
                </h3>
                <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto leading-relaxed">
                  {result.score < 40
                    ? 'النتيجة بتقول إن فيه مشاكل أساسية محتاجة خبير. فريقنا يقدر يصلحها في أسبوع — مش شهور.'
                    : 'بدل ما تصلح كل حاجة بنفسك — فريقنا يقدر يعمل اللي محتاج يتعمل وأنت تركّز على شغلك.'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      // Save diagnosis context for the service request form
                      try {
                        sessionStorage.setItem('wzrd_service_context', JSON.stringify({
                          toolName: config.name,
                          toolNameAr: config.nameAr || config.name,
                          score: result.score,
                          topFindings: result.findings.slice(0, 3).map(f => f.title).join(' | '),
                          timestamp: new Date().toISOString(),
                        }));
                      } catch {}
                      window.location.href = '/my-requests?from=diagnosis';
                    }}
                    className="px-6 py-3 rounded-full bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                  >
                    اطلب خدمة — فريقنا يشتغل عليها ←
                  </button>
                  <a
                    href={waMeHref(`أهلاً — عملت تشخيص وجبت ${result.score}/100 وعايز مساعدة متخصصة`)}
                    target="_blank" rel="noopener"
                    className="px-6 py-3 rounded-full border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/10 transition"
                  >
                    💬 كلّمنا على WhatsApp
                  </a>
                </div>
                <p className="text-xs text-zinc-600 mt-3">أسعار تبدأ من ٥,٠٠٠ جنيه · Clarity Call مجاني · بدون التزام</p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="grid grid-cols-2 gap-3">
            <a href={result.nextStep.url} className="p-4 rounded-xl border border-zinc-800 hover:border-amber-500/30 transition text-center">
              <span className="text-xl">📖</span>
              <p className="text-xs font-bold mt-2">{result.nextStep.title}</p>
              <p className="text-[10px] text-zinc-500">Learn more — free</p>
            </a>
            <a href="/services-info" className="p-4 rounded-xl border border-zinc-800 hover:border-amber-500/30 transition text-center">
              <span className="text-xl">🤝</span>
              <p className="text-xs font-bold mt-2">Talk to Expert</p>
              <p className="text-[10px] text-zinc-500">Done-for-you by Primo Marca</p>
            </a>
          </div>

          {/* Run another */}
          <button onClick={() => { setResult(null); setFormData({}); }} className="w-full mt-6 py-3 rounded-full border border-zinc-800 text-sm text-zinc-400 hover:border-indigo-500 transition">
            Run again with different data
          </button>
        </div>
      </div>
    );
  }

  // ═══ FORM VIEW ═══
  return (
    <div className="wzrd-page-radial text-zinc-900 dark:text-white">
      <div className="mx-auto max-w-lg px-6 py-16">
        <button
          onClick={() => navigate('/tools')}
          className="mb-8 text-xs text-zinc-500 transition hover:text-primary dark:text-zinc-400 dark:hover:text-amber-400"
        >
          ← Back to Tools
        </button>

        <div className="wzrd-glass mb-6 flex items-center gap-3 rounded-3xl p-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{config.name}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {config.description} · ~{config.cost} credits
            </p>
          </div>
        </div>

        {/* Intro section — what this tool does */}
        {config.intro && (
          <div className="wzrd-glass mb-8 rounded-3xl p-5">
            <h2 className="mb-2 text-base font-bold">{config.intro.headline}</h2>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{config.intro.body}</p>
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">What it measures:</p>
              <div className="flex flex-wrap gap-1.5">
                {config.intro.measures.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-100/90 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/90">
              <span className="font-bold">Best for:</span> {config.intro.bestFor}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="wzrd-glass space-y-4 rounded-3xl p-6 sm:p-8">
          {config.fields.map((field, fi) => (
            <div
              key={field.name}
              className="wzrd-fade-in-stagger"
              style={{ animationDelay: `${0.04 + fi * 0.05}s` }}
            >
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  maxLength={field.maxLength || 1000}
                  rows={3}
                  className="wzrd-field-premium resize-none backdrop-blur-md"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="wzrd-field-premium backdrop-blur-md"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={!!formData[field.name]}
                    onChange={e => updateField(field.name, e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{field.placeholder}</span>
                </label>
              ) : (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  maxLength={field.maxLength || 255}
                  className="wzrd-field-premium backdrop-blur-md"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="wzrd-shimmer-btn relative mt-6 w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-sm font-bold text-zinc-950 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50"
        >
          تحليل — {config.cost} كريدت
        </button>
      </div>
    </div>
  );
}
