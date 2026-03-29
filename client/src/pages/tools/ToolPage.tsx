import { useState, useId } from 'react';
import { useLocation } from 'wouter';
import { waMeQualifiedLeadHref } from '@/lib/waContact';
import { useAuth } from "@/_core/hooks/useAuth";
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
  /** If true: first submit runs free AI preview (no credits), then user unlocks full prescription with credits */
  paywallAfterFreePreview?: boolean;
  /** tRPC procedure path for free preview (default: tools.freeBrandDiagnosis) */
  freePreviewEndpoint?: string;
  /** tRPC procedure path for paid unlock (default: tools.unlockBrandDiagnosis) */
  unlockEndpoint?: string;
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

/** Free preview payload — brand uses findings+severity; other tools use summary + problemTitles */
interface FreeToolPreview {
  score: number;
  label: string;
  criticalCount: number;
  unlockToken: string;
  unlockCost: number;
  findings?: Array<{ title: string; severity: string }>;
  summary?: string;
  problemTitles?: string[];
}

/** JSON from premium.generateReport (nested structure varies by tool) */
interface PremiumReportPayload {
  creditsUsed?: number;
  creditsRemaining?: number;
  report?: Record<string, unknown>;
}

const severityColor = (s: string) =>
  s === 'high'
    ? 'text-rose-200/90 border-rose-400/20 bg-rose-500/[0.06] shadow-[inset_3px_0_0_0_rgba(244,63,94,0.35)]'
    : s === 'medium'
      ? 'text-amber-100/90 border-amber-400/18 bg-amber-500/[0.06] shadow-[inset_3px_0_0_0_rgba(251,191,36,0.35)]'
      : 'text-emerald-200/85 border-emerald-400/18 bg-emerald-500/[0.06] shadow-[inset_3px_0_0_0_rgba(52,211,153,0.35)]';

function ScoreRing({ score }: { score: number }) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const uid = useId().replace(/:/g, '');
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = pct * c;

  const { c1, c2, glowColor } =
    score >= 70
      ? { c1: '#00F0FF', c2: '#A855F7', glowColor: 'rgba(0,240,255,0.3)' }
      : score >= 40
        ? { c1: '#FBBF24', c2: '#FB923C', glowColor: 'rgba(251,191,36,0.3)' }
        : { c1: '#F87171', c2: '#F472B6', glowColor: 'rgba(248,113,113,0.3)' };

  const gid = `wzrd-sg-${uid}`;
  const glowId = `${gid}-glow`;

  const svgGlowFilter =
    score >= 70
      ? 'drop-shadow(0 0 12px rgba(16,185,129,0.6))'
      : score >= 40
        ? 'drop-shadow(0 0 12px rgba(245,158,11,0.6))'
        : 'drop-shadow(0 0 12px rgba(239,68,68,0.6))';

  const tierLabel = isAr
    ? score >= 70
      ? '✦ علامة قوية'
      : score >= 40
        ? '⚡ تحتاج تطوير'
        : '⚠ يحتاج تدخل عاجل'
    : score >= 70
      ? '✦ Strong brand'
      : score >= 40
        ? '⚡ Needs work'
        : '⚠ Urgent attention';

  return (
    <div className="relative mx-auto mb-4 flex flex-col items-center">
      <div
        className="pointer-events-none absolute rounded-full opacity-40 blur-2xl"
        style={{
          width: '140px',
          height: '140px',
          background: glowColor,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative h-[8.5rem] w-[8.5rem]" aria-hidden>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" style={{ filter: svgGlowFilter }}>
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />

          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={c1}
            strokeWidth="8"
            strokeOpacity="0.06"
            strokeDasharray={`${c}`}
          />

          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            filter={`url(#${glowId})`}
            style={{
              transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="font-mono text-[2.6rem] font-bold tabular-nums leading-none"
            style={{ color: c1, textShadow: `0 0 20px ${glowColor}` }}
          >
            {score}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-zinc-600">/ 100</span>
        </div>
      </div>

      <div
        className="mt-3 rounded-full border px-3 py-1 text-xs font-semibold"
        style={{
          background: `${glowColor.replace('0.3', '0.08')}`,
          borderColor: `${glowColor.replace('0.3', '0.3')}`,
          color: c1,
        }}
      >
        {tierLabel}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PROCESSING ANIMATION — shows analysis steps
// ═══════════════════════════════════════
function ToolSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mx-auto h-32 w-32 rounded-full bg-zinc-800/60" />
        <div className="mx-auto h-6 w-48 rounded-lg bg-zinc-800/60" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-800/40 border border-zinc-800/50" />
        ))}
        <div className="h-12 rounded-full bg-zinc-800/30" />
      </div>
    </div>
  );
}


export default function ToolPage({ config }: { config: ToolConfig }) {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [freePreview, setFreePreview] = useState<FreeToolPreview | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [premiumReport, setPremiumReport] = useState<PremiumReportPayload | null>(null);

  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Premium report upgrades + checklist sync intentionally omitted from V4 "Report View" result UI.

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
    setFreePreview(null);

    const minDelay = new Promise(resolve => setTimeout(resolve, 8000));

    try {
      if (config.paywallAfterFreePreview) {
        const freePath = config.freePreviewEndpoint ?? 'tools.freeBrandDiagnosis';
        const [, res] = await Promise.all([
          minDelay,
          fetch(`/api/trpc/${freePath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: formData }),
          }),
        ]);
        const data = await res.json();
        if (data.error) {
          const msg = data.error.message || data.error.json?.message || '';
          setError(typeof msg === 'string' ? msg : 'Preview failed. Try again.');
        } else {
          const preview = data.result?.data?.json ?? data.result?.data;
          if (preview?.score !== undefined && preview?.unlockToken) {
            setFreePreview(preview as FreeToolPreview);
          } else {
            setError('Unexpected response. Please try again.');
          }
        }
      } else {
        const [, res] = await Promise.all([
          minDelay,
          fetch(`/api/trpc/${config.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ json: formData }),
          }),
        ]);
        const data = await res.json();
        if (data.error) {
          const msg = data.error.message || data.error.json?.message || '';
          setError(typeof msg === 'string' ? msg : 'Analysis failed. You may not have enough credits.');
        } else {
          const toolResult = data.result?.data?.json ?? data.result?.data;
          if (toolResult?.score !== undefined) {
            setResult(toolResult);
          } else {
            setError('Unexpected response format. Please try again.');
          }
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockFullDiagnosis = async () => {
    if (!freePreview?.unlockToken) return;
    setUnlocking(true);
    setError('');
    try {
      const unlockPath = config.unlockEndpoint ?? 'tools.unlockBrandDiagnosis';
      const res = await fetch(`/api/trpc/${unlockPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: { unlockToken: freePreview.unlockToken } }),
      });
      const data = await res.json();
      if (data.error) {
        const msg = data.error.json?.message || data.error.message || '';
        setError(typeof msg === 'string' ? msg : 'Unlock failed.');
      } else {
        const toolResult = data.result?.data?.json ?? data.result?.data;
        if (toolResult?.score !== undefined) {
          setResult(toolResult as ToolResult);
          setFreePreview(null);
        } else {
          setError('Unexpected response. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  // ═══ PROCESSING VIEW ═══
  if (loading) {
    return <ToolSkeleton />;
  }

  // ═══ PREMIUM REPORT VIEW ═══
  if (premiumReport) {
    const r = premiumReport;
    const rep = r.report;
    const exec = rep?.executiveSummary as Record<string, unknown> | undefined;
    const pillarList = Array.isArray(rep?.pillars) ? (rep.pillars as Record<string, unknown>[]) : [];
    const priorityMatrix = rep?.priorityMatrix as {
      urgent?: string[];
      important?: string[];
      improvement?: string[];
    } | undefined;
    const actionPlan = rep?.actionPlan as {
      days30?: string[];
      days60?: string[];
      days90?: string[];
    } | undefined;
    const quickWins = Array.isArray(rep?.quickWins) ? (rep.quickWins as string[]) : [];
    const recommendation = rep?.recommendation as { phase?: string; reason?: string } | undefined;
    return (
      <div className="wzrd-page-radial text-zinc-900 dark:text-white">
        <div className="mx-auto max-w-3xl px-6 py-16" dir="rtl">
          <button onClick={() => navigate('/tools')} className="mb-8 text-xs text-zinc-500 transition hover:text-primary">
            رجوع للأدوات →
          </button>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold mb-4">
              ⭐ تقرير WZZRD AI Premium
            </div>
            <h1 className="text-3xl font-bold mb-2">{config.nameAr || config.name}</h1>
            <p className="text-sm text-gray-500">تقرير مفصّل — {r.creditsUsed} كريدت · {r.creditsRemaining} متبقي</p>
          </div>

          {/* Executive Summary */}
          {exec ? (
            <div className="wzrd-glass mb-8 rounded-3xl border-indigo-200/60 p-6 dark:border-indigo-800/50">
              <h2 className="text-lg font-bold mb-3">١. الملخص التنفيذي</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold font-mono text-indigo-600">
                  {String(exec.score ?? '')}
                  <span className="text-lg text-gray-400">/١٠٠</span>
                </span>
              </div>
              {exec.pillarScores != null && typeof exec.pillarScores === 'object' ? (
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(exec.pillarScores as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="text-center p-2 rounded-lg bg-white dark:bg-zinc-800">
                      <p className="text-lg font-bold font-mono">{String(v)}</p>
                      <p className="text-[10px] text-gray-500">{k}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {exec.verdict != null && String(exec.verdict).length > 0 ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{String(exec.verdict)}</p>
              ) : null}
            </div>
          ) : null}

          {/* Pillars Deep Dive */}
          {pillarList.map((p, i) => (
            <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base">{String(p.name ?? p.nameEn ?? "")}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.severity === 'critical' ? 'bg-red-100 text-red-600' : p.severity === 'major' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                  {String(p.score ?? "")}/100 · {String(p.severity ?? "")}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{String(p.analysis ?? "")}</p>
              {p.gap ? <p className="text-xs text-amber-600 mt-2 p-2 rounded bg-amber-50 dark:bg-amber-900/10">الفجوة: {String(p.gap)}</p> : null}
            </div>
          ))}

          {/* Priority Matrix */}
          {priorityMatrix ? (
            <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-8">
              <h2 className="text-lg font-bold mb-4">٣. خريطة الأولويات</h2>
              {(priorityMatrix.urgent?.length ?? 0) > 0 ? (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-red-600 mb-1">🔴 عاجل ومهم</h4>
                  {(priorityMatrix.urgent ?? []).map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 mr-4">
                      • {item}
                    </p>
                  ))}
                </div>
              ) : null}
              {(priorityMatrix.important?.length ?? 0) > 0 ? (
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-amber-600 mb-1">🟠 مهم مش عاجل</h4>
                  {(priorityMatrix.important ?? []).map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 mr-4">
                      • {item}
                    </p>
                  ))}
                </div>
              ) : null}
              {(priorityMatrix.improvement?.length ?? 0) > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-green-600 mb-1">🟡 تحسين</h4>
                  {(priorityMatrix.improvement ?? []).map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 mr-4">
                      • {item}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Action Plan */}
          {actionPlan ? (
            <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 mb-8">
              <h2 className="text-lg font-bold mb-4">٤. خطة العمل</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <h4 className="text-xs font-bold text-green-700 mb-2">٣٠ يوم</h4>
                  {(actionPlan.days30 ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-gray-600 mb-1">
                      • {a}
                    </p>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                  <h4 className="text-xs font-bold text-amber-700 mb-2">٦٠ يوم</h4>
                  {(actionPlan.days60 ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-gray-600 mb-1">
                      • {a}
                    </p>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10">
                  <h4 className="text-xs font-bold text-indigo-700 mb-2">٩٠ يوم</h4>
                  {(actionPlan.days90 ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-gray-600 mb-1">
                      • {a}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick Wins */}
          {quickWins.length > 0 ? (
            <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 mb-8">
              <h2 className="text-lg font-bold mb-3">٥. Quick Wins — ٣ حاجات تعملها النهاردة</h2>
              {quickWins.map((w, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-green-600 font-bold">{i + 1}.</span>
                  <p className="text-sm text-gray-700">{w}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Recommendation */}
          {recommendation ? (
            <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-8">
              <h2 className="text-lg font-bold mb-2">٦. التوصية النهائية</h2>
              <p className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full mb-2">{recommendation.phase ?? ''}</p>
              <p className="text-sm opacity-90 leading-relaxed">{recommendation.reason ?? ''}</p>
              <a href="/services-info" className="inline-block mt-3 px-5 py-2 rounded-full bg-white text-indigo-600 text-sm font-bold hover:bg-gray-100 transition">تواصل مع Primo Marca ←</a>
            </div>
          ) : null}

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

  // ═══ FREE PREVIEW + PAYWALL (brand diagnosis) ═══
  if (freePreview && !result) {
    const fp = freePreview;
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(99,102,241,0.2),transparent_52%),radial-gradient(ellipse_45%_35%_at_100%_100%,rgba(6,182,212,0.07),transparent_42%),radial-gradient(ellipse_40%_30%_at_0%_80%,rgba(192,132,252,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
          <button type="button" onClick={() => navigate('/tools')} className="mb-8 text-xs text-zinc-500 transition hover:text-amber-400">
            ← {isAr ? 'رجوع للأدوات' : 'Back to Tools'}
          </button>

          <div className="mb-10 text-center">
            <div className="wzrd-fade-in-stagger mx-auto inline-block rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-6 backdrop-blur-xl">
              <ScoreRing score={fp.score} />
              <h2 className="text-2xl font-bold tracking-tight">{config.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {fp.label} · {isAr ? 'معاينة مجانية' : 'Free preview'}
              </p>
            </div>
          </div>

          {fp.summary ? (
            <p className="mb-6 text-center text-sm leading-relaxed text-zinc-300" dir={isAr ? 'rtl' : 'ltr'}>
              {fp.summary}
            </p>
          ) : null}

          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {isAr ? 'عناوين المشاكل فقط — التفاصيل مقفولة' : 'Issue headlines only — details locked'}
          </p>

          <div className="mb-8 space-y-3">
            {(fp.findings && fp.findings.length > 0
              ? fp.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`wzrd-fade-in-stagger rounded-2xl border p-4 backdrop-blur-xl ${severityColor(f.severity as Finding['severity'])}`}
                    style={{ animationDelay: `${0.06 + i * 0.06}s` }}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider opacity-60">{f.severity}</span>
                      <h4 className="text-sm font-bold">{f.title}</h4>
                    </div>
                    <p className="text-xs opacity-50 blur-[3px] select-none" aria-hidden>
                      {isAr ? 'الشرح والحلول متاحة بعد الفتح…' : 'Explanation unlocks after purchase…'}
                    </p>
                  </div>
                ))
              : (fp.problemTitles ?? []).map((title, i) => (
                  <div
                    key={i}
                    className={`wzrd-fade-in-stagger rounded-2xl border p-4 backdrop-blur-xl ${severityColor('medium')}`}
                    style={{ animationDelay: `${0.06 + i * 0.06}s` }}
                  >
                    <h4 className="text-sm font-bold">{title}</h4>
                    <p className="text-xs opacity-50 blur-[3px] select-none mt-1" aria-hidden>
                      {isAr ? 'الشرح والحلول متاحة بعد الفتح…' : 'Explanation unlocks after purchase…'}
                    </p>
                  </div>
                )))}
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-950/40 via-zinc-950/90 to-violet-950/50 p-6 shadow-[0_0_40px_-10px_rgba(245,158,11,0.35)]">
            <div
              className="pointer-events-none absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.05)_45%,transparent_70%)]"
              aria-hidden
            />
            <div className="relative text-center">
              <p className="mb-2 text-lg font-bold text-amber-100" dir={isAr ? 'rtl' : 'ltr'}>
                {isAr
                  ? (fp.criticalCount > 0
                      ? `عندك ${fp.criticalCount} مشكلة حرجة — اكشف الحل والخطة`
                      : `عندك ${fp.findings?.length ?? fp.problemTitles?.length ?? 0} نقاط رئيسية — اكشف التفاصيل وخطوات العمل`)
                  : (fp.criticalCount > 0
                      ? `${fp.criticalCount} critical issues — unlock the fix & plan`
                      : `${fp.findings?.length ?? fp.problemTitles?.length ?? 0} focus areas — unlock details & action plan`)}
              </p>
              <p className="mb-6 text-xs text-zinc-400">
                {isAr ? 'يتضمن: شرح كل نقطة، مهام عملية، وتوصية مختصرة' : 'Includes: deep dives, action items, recommendation'}
              </p>
              <button
                type="button"
                onClick={handleUnlockFullDiagnosis}
                disabled={unlocking}
                className="wzrd-shimmer-btn relative w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/30 transition hover:brightness-110 disabled:opacity-50"
              >
                {unlocking ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
                    {isAr ? 'جاري الفتح…' : 'Unlocking…'}
                  </span>
                ) : (
                  (isAr ? `افتح التقرير الكامل — ${fp.unlockCost} كريدت` : `Unlock full report — ${fp.unlockCost} credits`)
                )}
              </button>
              <a href="/login" className="mt-3 block text-center text-xs text-indigo-400 hover:underline">
                {isAr ? 'مسجّل؟ سجّل الدخول لفتح التقرير' : 'Have an account? Log in to unlock'}
              </a>
              <a href="/signup" className="mt-1 block text-center text-xs text-zinc-500 hover:text-zinc-300">
                {isAr ? 'مش مسجّل؟ أنشئ حساباً واحصل على كريدت' : 'New here? Sign up for credits'}
              </a>
              {error ? <p className="mt-4 text-center text-sm text-red-400">{error}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFreePreview(null);
              setFormData({});
              setError('');
            }}
            className="mt-8 w-full rounded-full border border-zinc-800 py-3 text-sm text-zinc-400 transition hover:border-indigo-500"
          >
            {isAr ? 'تعديل الإجابات' : 'Edit my answers'}
          </button>
        </div>
      </div>
    );
  }

  // ═══ RESULT VIEW (after unlock / legacy tools) ═══
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl px-6 py-4 sticky top-0 z-10">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
              WZZRD AI · Brand Report
            </span>
            <span className="font-mono text-xs text-zinc-600">
              {new Date().toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-12 space-y-10" dir="rtl">
          <div className="text-center space-y-3">
            <ScoreRing score={result.score} />
            <h1 className="text-2xl font-bold tracking-tight">{config.name}</h1>
            <p className="text-sm text-zinc-500">{result.label}</p>
          </div>

          <div className="space-y-3">
            <h2 className="font-mono text-xs text-zinc-600 uppercase tracking-[0.2em]">
              // FINDINGS
            </h2>
            {result.findings?.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-5 transition hover:border-zinc-700/50"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      f.severity === 'high' ? 'bg-red-500' : f.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-zinc-100">{f.title}</p>
                    {f.detail && (
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{f.detail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(result.actionItems?.length ?? 0) > 0 || Boolean(result.recommendation) ? (
            <div className="space-y-3">
              <h2 className="font-mono text-xs text-zinc-600 uppercase tracking-[0.2em]">
                // RECOMMENDATIONS
              </h2>
              {result.actionItems?.map((r, i) => (
                <div key={i} className="rounded-xl border border-zinc-800/30 bg-zinc-900/20 p-5">
                  <p className="text-sm text-zinc-300 leading-relaxed">{r.task}</p>
                </div>
              ))}
              {result.recommendation ? (
                <div className="rounded-xl border border-zinc-800/30 bg-zinc-900/20 p-5">
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center space-y-3">
            <p className="text-sm text-zinc-400">جاهز تاخد الخطوة الجاية؟</p>
            <a
              href={waMeQualifiedLeadHref({
                leadName: user?.name,
                brandName: user?.company,
                diagnosisLabel: config.nameAr || config.name,
                score: result.score,
                topIssue: result.findings?.[0]?.title || null,
              })}
              className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 px-6 py-3 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/10 hover:border-purple-400/60"
              target="_blank"
              rel="noopener noreferrer"
            >
              تواصل مع خبير ←
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="flex-1 rounded-full border border-zinc-800/60 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-700/60 hover:bg-zinc-900/20 transition"
            >
              ← رجوع للأدوات
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setFormData({});
              }}
              className="flex-1 rounded-full border border-zinc-800/60 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-700/60 hover:bg-zinc-900/20 transition"
            >
              حلل تاني ببيانات مختلفة
            </button>
          </div>
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
              {config.paywallAfterFreePreview
                ? (isAr
                    ? `${config.descriptionAr || config.description} · معاينة مجانية، ثم ~${config.cost} كريدت للتفاصيل`
                    : `${config.description} · Free preview, then ~${config.cost} credits for full unlock`)
                : `${config.description} · ~${config.cost} credits`}
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
          {config.paywallAfterFreePreview
            ? (isAr ? 'عرض النتيجة المجانية ←' : 'See free preview →')
            : `تحليل — ${config.cost} كريدت`}
        </button>
      </div>
    </div>
  );
}
