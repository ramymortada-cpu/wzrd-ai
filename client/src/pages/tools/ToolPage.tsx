import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

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

function ProcessingScreen({ toolName }: { toolName: string }) {
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
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
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
                  <span className="text-green-400 text-xs">✓</span>
                </span>
              ) : i === currentStep ? (
                <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex-shrink-0" />
              )}
              <span className={`text-sm ${i === currentStep ? 'text-white font-medium' : 'text-zinc-500'}`}>
                {step.label}
              </span>
            </div>
          ))}
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
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white">
        <div className="max-w-3xl mx-auto px-6 py-16" dir="rtl">
          <button onClick={() => navigate('/tools')} className="text-xs text-gray-500 hover:text-indigo-600 mb-8 transition">رجوع للأدوات →</button>
          
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
            <div className="p-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800 mb-8">
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Back */}
          <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 mb-8 transition">← Back to Tools</button>

          {/* Score */}
          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${scoreColor(result.score)} mb-4`}>
              <span className="text-4xl font-bold text-zinc-950 font-mono">{result.score}</span>
            </div>
            <h2 className="text-2xl font-bold">{config.name}</h2>
            <p className="text-sm text-zinc-500 mt-1">{result.label} · {result.creditsUsed} credits used · {result.creditsRemaining} remaining</p>
          </div>

          {/* Findings */}
          <div className="space-y-3 mb-8">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-4 rounded-xl border ${severityColor(f.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">{f.severity}</span>
                  <h4 className="font-bold text-sm">{f.title}</h4>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{f.detail}</p>
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
                    body: JSON.stringify({ json: { toolName: config.name, toolNameAr: config.nameAr || config.name, score: result.score, label: result.label, findings: result.findings, recommendation: result.recommendation } }),
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
                    body: JSON.stringify({ json: { toolName: config.name, toolNameAr: config.nameAr || config.name, score: result.score, label: result.label, findings: result.findings, recommendation: result.recommendation, email } }),
                  });
                  alert('تم الإرسال! ✅');
                } catch { alert('فشل الإرسال'); }
              }}
              className="flex-1 py-3 rounded-full border border-green-500/30 text-sm text-green-400 hover:bg-green-500/10 transition flex items-center justify-center gap-2"
            >📧 ابعت على إيميلي</button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`نتيجة تشخيص البراند بتاعي: ${result.score}/100\n${result.findings.map(f => '• ' + f.title).join('\n')}\n\nشخّص البراند بتاعك مجاناً:\n${typeof window !== 'undefined' ? window.location.origin : ''}/welcome`)}`}
              target="_blank" rel="noopener"
              className="flex-1 py-3 rounded-full border border-emerald-500/30 text-sm text-emerald-400 hover:bg-emerald-500/10 transition flex items-center justify-center gap-2"
            >💬 شارك على WhatsApp</a>
          </div>

          {/* ═══ PREMIUM UPGRADE — BLURRED PREVIEW (A/B winner: 2.9x better conversion) ═══ */}
          <div className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 to-purple-900/20 mb-8 overflow-hidden">
            <div className="p-6 text-center border-b border-indigo-500/20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3">
                ⭐ PREMIUM
              </div>
              <h3 className="text-xl font-bold mb-1" dir="rtl">التقرير المفصّل</h3>
              <p className="text-xs text-zinc-500" dir="rtl">٢٠٠٠+ كلمة — تحليل عميق لكل محور</p>
            </div>
            
            {/* Blurred Preview Sections */}
            <div className="p-5 space-y-3" dir="rtl">
              {[
                { title: '١. تحليل التموضع والتمايز', preview: 'البراند بتاعك حالياً واقف في منطقة...' },
                { title: '٢. خريطة الأولويات', preview: 'أول ٣ حاجات لازم تعملها بالترتيب...' },
                { title: '٣. خطة عمل ٣٠-٦٠-٩٠ يوم', preview: 'الشهر الأول: ركّز على تصليح الـ...' },
                { title: '٤. Quick Wins — حاجات تعملها النهاردة', preview: 'غيّر الـ bio بتاعك لـ: ...' },
                { title: '٥. تحليل المنافسين الأولي', preview: 'مقارنة بالمنافسين في نفس المجال...' },
                { title: '٦. توصيات مخصصة', preview: 'بناءً على الـ score بتاعك في كل محور...' },
              ].map((section, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold text-indigo-300 mb-1">{section.title}</h4>
                  <p className="text-xs text-zinc-500" style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                    {section.preview} وده بيأثر على الـ perception بتاع العملاء بشكل كبير. محتاج تركّز على تحسين الجزء ده لأنه الأساس اللي كل حاجة تانية مبنية عليه. الخطوة العملية الأولى هي إنك تعمل audit سريع للـ touchpoints الحالية.
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-6 text-center bg-indigo-900/20">
              <button 
                onClick={handlePremiumUpgrade}
                disabled={premiumLoading}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-base transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
              >
                {premiumLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    جاري إنشاء التقرير المفصّل...
                  </span>
                ) : (
                  `اكشف التقرير الكامل — ٩٩ جنيه بس`
                )}
              </button>
              {premiumError && <p className="text-xs text-red-400 mt-2">{premiumError}</p>}
              <p className="text-xs text-zinc-600 mt-2">١٠٠ كريدت · ضمان استرجاع لو مش راضي</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mb-8">
            <p className="text-sm font-medium text-indigo-300">💡 {result.recommendation}</p>
          </div>

          {/* Service Recommendation (only shows for score < 70) */}
          {result.serviceRecommendation?.show && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{result.serviceRecommendation.tier}</span>
                <span className="text-sm font-bold text-white">{result.serviceRecommendation.service}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{result.serviceRecommendation.reason}</p>
              <a href={result.serviceRecommendation.url} className="inline-block px-4 py-2 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition">
                Learn about {result.serviceRecommendation.service} →
              </a>
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 mb-8 transition">← Back to Tools</button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{config.name}</h1>
            <p className="text-xs text-zinc-500">{config.description} · ~{config.cost} credits</p>
          </div>
        </div>

        {/* Intro section — what this tool does */}
        {config.intro && (
          <div className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <h2 className="text-base font-bold text-white mb-2">{config.intro.headline}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{config.intro.body}</p>
            <div className="mb-3">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">What it measures:</p>
              <div className="flex flex-wrap gap-1.5">
                {config.intro.measures.map((m, i) => (
                  <span key={i} className="text-[11px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-400/80 leading-relaxed">
              <span className="font-bold">Best for:</span> {config.intro.bestFor}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder} maxLength={field.maxLength || 1000} rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition resize-none"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-indigo-500" checked={!!formData[field.name]} onChange={e => updateField(field.name, e.target.checked)} />
                  <span className="text-sm text-zinc-400">{field.placeholder}</span>
                </label>
              ) : (
                <input
                  type="text" placeholder={field.placeholder} maxLength={field.maxLength || 255}
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
        >
          تحليل — {config.cost} كريدت
        </button>
      </div>
    </div>
  );
}
