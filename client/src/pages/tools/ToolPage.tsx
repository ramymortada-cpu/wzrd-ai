import React, { useState, useId, useEffect } from 'react';
import posthog from 'posthog-js';
import { useLocation } from 'wouter';
import { waMeQualifiedLeadHref } from '@/lib/waContact';
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from '@/lib/i18n';
import ReviewModal from '@/components/ReviewModal';
import ShareReportPanel from '@/components/ShareReportPanel';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  paywallAfterFreePreview?: boolean;
  freePreviewEndpoint?: string;
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

interface PremiumReportPayload {
  creditsUsed?: number;
  creditsRemaining?: number;
  report?: Record<string, unknown>;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
const severityStyle = (s: string) =>
  s === 'high'
    ? { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '#DC2626', label: 'high' }
    : s === 'medium'
      ? { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706', text: '#D97706', label: 'medium' }
      : { bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A', text: '#16A34A', label: 'low' };

/** Backend credit / balance errors (AR + EN) — show a pricing CTA in the UI. */
function looksLikeInsufficientCredits(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('credit') ||
    m.includes('credits') ||
    m.includes('كريدت') ||
    m.includes('رصيد') ||
    m.includes('insufficient')
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const uid = useId().replace(/:/g, '');
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = pct * circumference;

  const { c1, c2, ringBg, tierColor } =
    score >= 70
      ? { c1: '#1B4FD8', c2: '#3B82F6', ringBg: '#EEF2FF', tierColor: '#1B4FD8' }
      : score >= 40
        ? { c1: '#D97706', c2: '#F59E0B', ringBg: '#FFFBEB', tierColor: '#D97706' }
        : { c1: '#DC2626', c2: '#EF4444', ringBg: '#FEF2F2', tierColor: '#DC2626' };

  const gradId = `sg-${uid}`;

  const tierLabel = isAr
    ? score >= 70 ? '✦ علامة قوية' : score >= 40 ? '⚡ تحتاج تطوير' : '⚠ يحتاج تدخل عاجل'
    : score >= 70 ? '✦ Strong brand' : score >= 40 ? '⚡ Needs work' : '⚠ Urgent attention';

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-full"
        style={{ background: ringBg, border: '1px solid #E5E7EB' }}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke={`url(#${gradId})`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span className="text-3xl font-black" style={{ color: tierColor }}>{score}</span>
          <span className="text-xs font-semibold text-[#9CA3AF]">/100</span>
        </div>
      </div>
      <span
        className="mt-3 rounded-full px-4 py-1 text-xs font-bold"
        style={{ background: ringBg, color: tierColor, border: `1px solid ${c1}40` }}
      >
        {tierLabel}
      </span>
    </div>
  );
}

// ─── Tool Reviews Section ──────────────────────────────────────────────────────────
interface ToolReview {
  id: number;
  toolId: string;
  toolNameAr: string;
  toolNameEn: string;
  rating: number;
  commentAr: string | null;
  commentEn: string | null;
  country: string | null;
  countryFlag: string | null;
  createdAt: string;
}

function ToolReviews({ toolId }: { toolId: string }) {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const [reviews, setReviews] = React.useState<ToolReview[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const params = encodeURIComponent(JSON.stringify({ json: { toolId, limit: 6 } }));
    fetch(`/api/trpc/reviews.listByTool?input=${params}`)
      .then(r => r.json())
      .then(data => {
        const list = data?.result?.data?.json ?? data?.result?.data ?? [];
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [toolId]);

  if (!loaded || reviews.length === 0) return null;

  return (
    <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            {isAr ? 'آراء مستخدمين هذه الأداة' : 'What users say about this tool'}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <span key={s} className="text-sm" style={{ color: '#F59E0B' }}>&#9733;</span>
              ))}
            </div>
            <span className="text-xs font-semibold text-[#374151]">
              {reviews.length} {isAr ? 'تقييم' : 'reviews'}
            </span>
          </div>
        </div>
        <div className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#1B4FD8]">
          ✦ {isAr ? 'تقييمات حقيقية' : 'Verified'}
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {reviews.map(review => {
          const comment = isAr
            ? (review.commentAr || review.commentEn || '')
            : (review.commentEn || review.commentAr || '');
          if (!comment) return null;
          return (
            <div
              key={review.id}
              className="rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Stars */}
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <span
                        key={s}
                        className="text-xs"
                        style={{ color: s <= review.rating ? '#F59E0B' : '#E5E7EB' }}
                      >&#9733;</span>
                    ))}
                  </div>
                  {review.country && (
                    <span className="text-xs text-[#6B7280]">{review.country}</span>
                  )}
                </div>
                <span className="text-[10px] text-[#9CA3AF]">
                  {new Date(review.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#374151]">{comment}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WZZRING Loading Animation ───────────────────────────────────────────────
const WZZRING_STAGES_EN = [
  { icon: '🔍', label: 'Scanning your inputs…' },
  { icon: '🧠', label: 'Running AI diagnostics…' },
  { icon: '📊', label: 'Mapping brand signals…' },
  { icon: '⚡', label: 'Identifying critical gaps…' },
  { icon: '✦', label: 'Generating your report…' },
];
const WZZRING_STAGES_AR = [
  { icon: '🔍', label: 'جاري مسح المدخلات…' },
  { icon: '🧠', label: 'تشغيل تشخيص الذكاء الاصطناعي…' },
  { icon: '📊', label: 'رسم خريطة إشارات العلامة…' },
  { icon: '⚡', label: 'تحديد الفجوات الحرجة…' },
  { icon: '✦', label: 'إنشاء تقريرك…' },
];

function ToolSkeleton() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const stages = isAr ? WZZRING_STAGES_AR : WZZRING_STAGES_EN;
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [dotCount, setDotCount] = useState(1);

  // Cycle through stages every 4 seconds
  useEffect(() => {
    const stageTimer = setInterval(() => {
      setActiveStage(prev => {
        const next = prev < stages.length - 1 ? prev + 1 : prev;
        setCompletedStages(c => c.includes(prev) ? c : [...c, prev]);
        return next;
      });
    }, 4000);
    return () => clearInterval(stageTimer);
  }, [stages.length]);

  // Animate dots
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div className="wzrd-public-page min-h-screen">
      <div className="mx-auto max-w-lg px-6 py-16">

        {/* WZZRING Brand Header */}
        <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          {/* Animated ring */}
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
            {/* Outer pulsing ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: '#EEF2FF',
                border: '2px solid #1B4FD8',
                animation: 'wzzring-pulse 2s ease-in-out infinite',
              }}
            />
            {/* Spinning arc */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 112 112"
              style={{ animation: 'wzzring-spin 1.6s linear infinite' }}
            >
              <circle
                cx="56" cy="56" r="50"
                fill="none"
                stroke="#1B4FD8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="80 235"
              />
            </svg>
            {/* Inner counter-spin arc */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 112 112"
              style={{ animation: 'wzzring-spin-reverse 2.4s linear infinite' }}
            >
              <circle
                cx="56" cy="56" r="38"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="40 200"
                opacity="0.5"
              />
            </svg>
            {/* Center icon */}
            <span className="relative text-2xl" style={{ zIndex: 1 }}>
              {stages[activeStage].icon}
            </span>
          </div>

          {/* WZZRING wordmark */}
          <div className="mb-1 text-xs font-black uppercase tracking-[0.25em] text-[#1B4FD8]">
            WZZRING
            <span style={{ letterSpacing: '0.05em' }}>
              {'·'.repeat(dotCount)}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#111827]">
            {stages[activeStage].label}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            {isAr ? 'قد يستغرق حتى ٣٠ ثانية' : 'May take up to 30 seconds'}
          </p>
        </div>

        {/* Stage Progress */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            {isAr ? 'مراحل التحليل' : 'Analysis Stages'}
          </p>
          <div className="space-y-2.5">
            {stages.map((stage, i) => {
              const isDone = completedStages.includes(i);
              const isActive = i === activeStage;
              const isPending = !isDone && !isActive;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500"
                  style={{
                    background: isActive ? '#EEF2FF' : isDone ? '#F0FDF4' : '#FAFAF5',
                    border: isActive ? '1px solid #1B4FD8' : isDone ? '1px solid #BBF7D0' : '1px solid #E5E7EB',
                    opacity: isPending ? 0.5 : 1,
                  }}
                >
                  <span className="text-base">{stage.icon}</span>
                  <span
                    className="flex-1 text-xs font-medium"
                    style={{ color: isActive ? '#1B4FD8' : isDone ? '#16A34A' : '#6B7280' }}
                  >
                    {stage.label}
                  </span>
                  {isDone && (
                    <span className="text-xs font-bold text-[#16A34A]">✓</span>
                  )}
                  {isActive && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#1B4FD8]"
                      style={{ animation: 'wzzring-pulse 1s ease-in-out infinite' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes wzzring-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes wzzring-spin-reverse {
            from { transform: rotate(360deg); }
            to   { transform: rotate(0deg); }
          }
          @keyframes wzzring-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.7; transform: scale(1.04); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ToolPage({ config }: { config: ToolConfig }) {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [freePreview, setFreePreview] = useState<FreeToolPreview | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [premiumReport, setPremiumReport] = useState<PremiumReportPayload | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const updateField = (name: string, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [name]: value }));
  const handleSubmit = async () => {
    // ── Auth guard: must be logged in ──────────────────────────────────────────
    if (!user) {
      navigate('/login');
      return;
    }
    for (const field of config.fields) {
      if (field.required && !formData[field.name]) {
        setError(
          isAr
            ? `من فضلك اكمل: ${field.labelAr || field.label}`
            : `Please fill in: ${field.label}`
        );
        return;
      }
    }
    setLoading(true);
    setError('');
    setFreePreview(null);
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('tool_execution_started', { toolId: config.id });
    }
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
          setError(typeof msg === 'string' ? msg : (isAr ? 'فشل المعاينة. حاول مجدداً.' : 'Preview failed. Try again.'));
        } else {
          const preview = data.result?.data?.json ?? data.result?.data;
          if (preview?.score !== undefined && preview?.unlockToken) {
            setFreePreview(preview as FreeToolPreview);
            if (import.meta.env.VITE_POSTHOG_KEY) {
              posthog.capture('free_preview_shown', {
                toolId: config.id,
                score: (preview as FreeToolPreview).score,
              });
            }
          } else {
            setError(isAr ? 'استجابة غير متوقعة. حاول مجدداً.' : 'Unexpected response. Please try again.');
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
          setError(typeof msg === 'string' ? msg : (isAr ? 'فشل التحليل. تحقق من رصيدك.' : 'Analysis failed. Check your credits.'));
        } else {
          const toolResult = data.result?.data?.json ?? data.result?.data;
          if (toolResult?.score !== undefined) {
            setResult(toolResult);
            if (import.meta.env.VITE_POSTHOG_KEY) {
              posthog.capture('tool_execution_completed', {
                toolId: config.id,
                score: toolResult.score,
                creditsUsed: toolResult.creditsUsed,
              });
            }
          } else {
            setError(isAr ? 'استجابة غير متوقعة. حاول مجدداً.' : 'Unexpected response. Please try again.');
          }
        }
      }
    } catch {
      if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.capture('tool_execution_failed', { toolId: config.id });
      }
      setError(isAr ? 'خطأ في الشبكة. حاول مجدداً.' : 'Network error. Please try again.');
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
        setError(typeof msg === 'string' ? msg : (isAr ? 'فشل الفتح.' : 'Unlock failed.'));
      } else {
        const toolResult = data.result?.data?.json ?? data.result?.data;
        if (toolResult?.score !== undefined) {
          if (import.meta.env.VITE_POSTHOG_KEY) {
            posthog.capture("premium_report_purchased", { toolId: config.id, source: "unlock_credits" });
          }
          setResult(toolResult as ToolResult);
          setFreePreview(null);
        } else {
          setError(isAr ? 'استجابة غير متوقعة. حاول مجدداً.' : 'Unexpected response. Please try again.');
        }
      }
    } catch {
      setError(isAr ? 'خطأ في الشبكة. حاول مجدداً.' : 'Network error. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  // ═══ LOADING ═══
  if (loading) return <ToolSkeleton />;

  // ═══ PREMIUM REPORT ═══
  if (premiumReport) {
    const rep = premiumReport.report ?? {};
    const exec = rep.executiveSummary as Record<string, unknown> | undefined;
    const pillarList = Array.isArray(rep.pillars) ? (rep.pillars as Record<string, unknown>[]) : [];
    const priorityMatrix = rep.priorityMatrix as { urgent?: string[]; important?: string[]; improvement?: string[] } | undefined;
    const actionPlan = rep.actionPlan as { days30?: string[]; days60?: string[]; days90?: string[] } | undefined;
    const quickWins = Array.isArray(rep.quickWins) ? (rep.quickWins as string[]) : [];
    const recommendation = rep.recommendation as { phase?: string; reason?: string } | undefined;

    return (
      <div className="wzrd-public-page min-h-screen">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8] transition-colors"
          >
            {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
          </button>

          {/* Header */}
          <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-1.5 text-xs font-bold text-[#1B4FD8]">
              ✦ {isAr ? 'التقرير الكامل' : 'Full Premium Report'}
            </div>
            <h1 className="mt-3 text-2xl font-black text-[#111827]">
              {isAr ? config.nameAr || config.name : config.name}
            </h1>
            {premiumReport.creditsUsed !== undefined && (
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {isAr
                  ? `${premiumReport.creditsUsed} كريدت · متبقي ${premiumReport.creditsRemaining}`
                  : `${premiumReport.creditsUsed} credits used · ${premiumReport.creditsRemaining} remaining`}
              </p>
            )}
          </div>

          <div className="space-y-5">
            {/* Executive Summary */}
            {exec && (
              <div className="wzrd-public-card p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                  {isAr ? '١. الملخص التنفيذي' : '1. Executive Summary'}
                </h2>
                {exec.pillarScores != null && typeof exec.pillarScores === 'object' && (
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(exec.pillarScores as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] p-3 text-center">
                        <div className="text-2xl font-black text-[#1B4FD8]">{v as React.ReactNode}</div>
                        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{k}</div>
                      </div>
                    ))}
                  </div>
                )}
                {exec.verdict != null && (
                  <p className="text-sm leading-relaxed text-[#374151]">{String(exec.verdict as string)}</p>
                )}
              </div>
            )}

            {/* Pillars */}
            {pillarList.length > 0 && (
              <div className="wzrd-public-card p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                  {isAr ? '٢. تحليل المحاور' : '2. Pillar Analysis'}
                </h2>
                <div className="space-y-3">
                  {pillarList.map((p, i) => {
                    const sev = String(p.severity ?? 'low');
                    const s = severityStyle(sev === 'critical' ? 'high' : sev === 'major' ? 'medium' : 'low');
                    return (
                      <div key={i} className="rounded-xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-semibold text-[#111827]">{String(p.name ?? p.nameEn ?? '') as unknown as React.ReactNode}</h3>
                          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                            {String(p.score ?? '')}/100
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-[#374151] whitespace-pre-line">{String(p.analysis ?? '')}</p>
                        {p.gap != null && (
                          <p className="mt-2 rounded-lg bg-white/60 p-2 text-xs text-[#D97706]">
                            {isAr ? 'الفجوة:' : 'Gap:'} {String(p.gap as string)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Priority Matrix */}
            {priorityMatrix && (
              <div className="wzrd-public-card p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                  {isAr ? '٣. خريطة الأولويات' : '3. Priority Matrix'}
                </h2>
                <div className="space-y-3">
                  {[
                    { label: isAr ? '🔴 عاجل ومهم' : '🔴 Urgent & Important', items: priorityMatrix.urgent ?? [], bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
                    { label: isAr ? '🟡 مهم' : '🟡 Important', items: priorityMatrix.important ?? [], bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
                    { label: isAr ? '🟢 تحسين' : '🟢 Improvement', items: priorityMatrix.improvement ?? [], bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
                  ].filter(g => g.items.length > 0).map(({ label, items, bg, border, color }) => (
                    <div key={label} className="rounded-xl border p-4" style={{ background: bg, borderColor: border }}>
                      <h4 className="mb-2 text-xs font-bold" style={{ color }}>{label}</h4>
                      {items.map((item, i) => (
                        <p key={i} className="text-sm text-[#374151]">• {item}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            {actionPlan && (
              <div className="wzrd-public-card p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#6B7280]">
                  {isAr ? '٤. خطة العمل' : '4. Action Plan'}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: isAr ? '٣٠ يوم' : '30 Days', items: actionPlan.days30 ?? [], color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                    { label: isAr ? '٦٠ يوم' : '60 Days', items: actionPlan.days60 ?? [], color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { label: isAr ? '٩٠ يوم' : '90 Days', items: actionPlan.days90 ?? [], color: '#1B4FD8', bg: '#EEF2FF', border: '#C7D2FE' },
                  ].map(({ label, items, color, bg, border }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${border}` }}>
                      <h4 className="mb-2 text-xs font-bold" style={{ color }}>{label}</h4>
                      {items.map((a, i) => (
                        <p key={i} className="mb-1 text-xs text-[#374151]">• {a}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <div className="rounded-2xl border-2 border-[#BBF7D0] bg-[#F0FDF4] p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#16A34A]">
                  {isAr ? '٥. Quick Wins — ابدأ النهارده' : '5. Quick Wins — Start Today'}
                </h2>
                {quickWins.map((w, i) => (
                  <div key={i} className="mb-3 flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-xs font-bold text-white">{i + 1}</span>
                    <p className="text-sm leading-relaxed text-[#374151]">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Final Recommendation */}
            {recommendation && (
              <div className="rounded-2xl bg-[#1B4FD8] p-6 text-white">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-70">
                  {isAr ? '٦. التوصية النهائية' : '6. Final Recommendation'}
                </h2>
                {recommendation.phase && (
                  <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                    {recommendation.phase}
                  </span>
                )}
                <p className="text-sm leading-relaxed opacity-90">{recommendation.reason ?? ''}</p>
                <a
                  href="/services-info"
                  className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1B4FD8] hover:bg-[#EEF2FF] transition"
                >
                  {isAr ? 'تواصل مع WZZRD AI ←' : 'Talk to WZZRD AI →'}
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setResult(null); setPremiumReport(null); setFormData({}); }}
              className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-medium text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
            >
              {isAr ? 'حلل تاني ببيانات مختلفة' : 'Run a new analysis'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ FREE PREVIEW + PAYWALL ═══
  if (freePreview && !result) {
    const fp = freePreview;
    const issueCount = fp.findings?.length ?? fp.problemTitles?.length ?? 0;

    return (
      <div className="wzrd-public-page min-h-screen">
        <div className="mx-auto max-w-lg px-6 py-16">
          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8] transition-colors"
          >
            {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
          </button>

          {/* Score Card */}
          <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <ScoreRing score={fp.score} />
            <h2 className="mt-4 text-xl font-bold text-[#111827]">
              {isAr ? config.nameAr || config.name : config.name}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              {fp.label} · {isAr ? 'معاينة مجانية' : 'Free preview'}
            </p>
          </div>

          {/* Summary */}
          {fp.summary && (
            <p className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm leading-relaxed text-[#374151]">
              {fp.summary}
            </p>
          )}

          {/* Issues — blurred details */}
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
            {isAr ? 'عناوين المشاكل فقط — التفاصيل مقفولة' : 'Issue headlines only — details locked'}
          </p>
          <div className="mb-6 space-y-2">
            {fp.findings && fp.findings.length > 0
              ? fp.findings.map((f, i) => {
                  const s = severityStyle(f.severity);
                  return (
                    <div key={i} className="rounded-xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: s.text }}>{f.severity}</span>
                        <span className="text-sm font-semibold text-[#111827]">{f.title}</span>
                      </div>
                      <p className="select-none text-xs text-[#9CA3AF]" style={{ filter: 'blur(3px)' }} aria-hidden>
                        {isAr ? 'الشرح والحلول متاحة بعد الفتح…' : 'Explanation & fixes unlock after purchase…'}
                      </p>
                    </div>
                  );
                })
              : (fp.problemTitles ?? []).map((title, i) => {
                  const s = severityStyle('medium');
                  return (
                    <div key={i} className="rounded-xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
                      <span className="text-sm font-semibold text-[#111827]">{title}</span>
                      <p className="mt-1 select-none text-xs text-[#9CA3AF]" style={{ filter: 'blur(3px)' }} aria-hidden>
                        {isAr ? 'الشرح والحلول متاحة بعد الفتح…' : 'Explanation & fixes unlock after purchase…'}
                      </p>
                    </div>
                  );
                })
            }
          </div>

          {/* Unlock CTA */}
          <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-6 text-center">
            <p className="mb-2 text-base font-bold text-[#111827]">
              {isAr
                ? (fp.criticalCount > 0
                    ? `عندك ${fp.criticalCount} مشكلة حرجة — اكشف الحل والخطة`
                    : `عندك ${issueCount} نقاط رئيسية — اكشف التفاصيل وخطوات العمل`)
                : (fp.criticalCount > 0
                    ? `${fp.criticalCount} critical issues — unlock the fix & plan`
                    : `${issueCount} focus areas — unlock details & action steps`)}
            </p>
            <p className="mb-5 text-xs text-[#6B7280]">
              {isAr
                ? 'يتضمن: شرح كل نقطة، مهام عملية، وتوصية مختصرة'
                : 'Includes: deep dives, action items, and a recommendation'}
            </p>
            <button
              type="button"
              onClick={handleUnlockFullDiagnosis}
              disabled={unlocking}
              className="w-full rounded-full bg-[#1B4FD8] py-4 text-sm font-bold text-white shadow-md hover:bg-[#1440B8] disabled:opacity-50 transition"
            >
              {unlocking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isAr ? 'جاري الفتح…' : 'Unlocking…'}
                </span>
              ) : (
                isAr
                  ? `افتح التقرير الكامل — ${fp.unlockCost} كريدت`
                  : `Unlock full report — ${fp.unlockCost} credits`
              )}
            </button>
            <div className="mt-3 flex justify-center gap-4">
              <a href="/login" className="text-xs text-[#1B4FD8] hover:underline">
                {isAr ? 'مسجّل؟ سجّل الدخول' : 'Have an account? Log in'}
              </a>
              <a href="/signup" className="text-xs text-[#6B7280] hover:text-[#1B4FD8]">
                {isAr ? 'مش مسجّل؟ أنشئ حساباً' : 'New here? Sign up'}
              </a>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-600">
                <p>{error}</p>
                {looksLikeInsufficientCredits(error) && (
                  <a
                    href="/pricing"
                    className="mt-2 inline-block font-semibold text-[#1B4FD8] hover:underline"
                  >
                    {isAr ? 'اشترِ كريدت أو شوف الباقات ←' : 'Buy credits or view plans →'}
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setFreePreview(null); setFormData({}); setError(''); }}
            className="mt-4 w-full rounded-full border border-[#E5E7EB] py-3 text-sm text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
          >
            {isAr ? 'تعديل الإجابات' : 'Edit my answers'}
          </button>
        </div>
      </div>
    );
  }

  // ═══ RESULT VIEW ═══
  if (result) {
    return (
      <div className="wzrd-public-page min-h-screen">
        <div className="mx-auto max-w-lg px-6 py-16">
          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8] transition-colors"
          >
            {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
          </button>

          {/* Score */}
          <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <ScoreRing score={result.score} />
            <h2 className="mt-4 text-xl font-bold text-[#111827]">
              {isAr ? config.nameAr || config.name : config.name}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">{result.label}</p>
            {result.creditsUsed !== undefined && (
              <p className="mt-2 text-xs text-[#9CA3AF]">
                {isAr
                  ? `${result.creditsUsed} كريدت · متبقي ${result.creditsRemaining}`
                  : `${result.creditsUsed} credits used · ${result.creditsRemaining} remaining`}
              </p>
            )}
          </div>

          {/* Findings */}
          {result.findings?.length > 0 && (
            <div className="mb-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                {isAr ? 'النتائج' : 'Findings'}
              </h3>
              {result.findings.map((f, i) => {
                const s = severityStyle(f.severity);
                return (
                  <div key={i} className="rounded-xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
                    <div className="mb-2 flex items-start gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                      <div>
                        <p className="font-semibold text-[#111827]">{f.title}</p>
                        {f.detail && (
                          <p className="mt-1 text-sm leading-relaxed text-[#6B7280] whitespace-pre-line">{f.detail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Items */}
          {(result.actionItems?.length ?? 0) > 0 && (
            <div className="mb-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                {isAr ? 'خطوات العمل' : 'Action Items'}
              </h3>
              {result.actionItems!.map((a, i) => (
                <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <p className="text-sm leading-relaxed text-[#374151]">{a.task}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div className="mb-5 rounded-xl border border-[#E5E7EB] bg-white p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                {isAr ? 'التوصية' : 'Recommendation'}
              </p>
              <p className="text-sm leading-relaxed text-[#374151]">{result.recommendation}</p>
            </div>
          )}

          {/* Service Recommendation */}
          {result.serviceRecommendation?.show && (
            <div className="mb-5 rounded-2xl bg-[#1B4FD8] p-6 text-white">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">
                {isAr ? 'توصية الخدمة' : 'Service Recommendation'}
              </p>
              <p className="mb-1 text-base font-bold">
                {isAr ? result.serviceRecommendation.serviceAr : result.serviceRecommendation.service}
              </p>
              <p className="mb-4 text-sm opacity-80">
                {isAr ? result.serviceRecommendation.reasonAr : result.serviceRecommendation.reason}
              </p>
              <a
                href={result.serviceRecommendation.url}
                className="inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1B4FD8] hover:bg-[#EEF2FF] transition"
              >
                {isAr ? 'اعرف أكتر ←' : 'Learn more →'}
              </a>
            </div>
          )}

          {/* Share Report Panel */}
          <div className="mb-5">
            <ShareReportPanel
              toolNameAr={config.nameAr || config.name}
              toolNameEn={config.name}
              score={result.score}
              scoreLabelAr={result.label}
              scoreLabelEn={result.label}
            />
          </div>

          {/* Review CTA — only if not yet submitted */}
          {!reviewSubmitted && (
            <div className="mb-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center">
              <p className="mb-1 text-sm font-bold text-[#111827]">
                {isAr ? '⭐ شاركنا رأيك واحصل على ١٠٠ كريدت مجاناً' : '⭐ Share your feedback and get 100 free credits'}
              </p>
              <p className="mb-4 text-xs text-[#6B7280]">
                {isAr
                  ? 'تقييمك بيساعدنا نتحسن — وبيظهر على الصفحة الرئيسية بعد المراجعة'
                  : 'Your review helps us improve — and may appear on our homepage after moderation'}
              </p>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="rounded-full bg-[#059669] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#047857] transition"
              >
                {isAr ? 'قيّم التقرير ← ١٠٠ كريدت' : 'Rate this report ← 100 credits'}
              </button>
            </div>
          )}

          {/* Talk to expert */}
          <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 text-center">
            <p className="mb-3 text-sm text-[#6B7280]">
              {isAr ? 'جاهز تاخد الخطوة الجاية؟' : 'Ready to take the next step?'}
            </p>
            <a
              href={waMeQualifiedLeadHref({
                leadName: user?.name,
                brandName: user?.company,
                diagnosisLabel: isAr ? config.nameAr || config.name : config.name,
                score: result.score,
                topIssue: result.findings?.[0]?.title || null,
              })}
              className="inline-flex items-center gap-2 rounded-full border border-[#1B4FD8] px-6 py-3 text-sm font-bold text-[#1B4FD8] hover:bg-[#EEF2FF] transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isAr ? 'تواصل مع خبير ←' : 'Talk to an expert →'}
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="flex-1 rounded-full border border-[#E5E7EB] py-3 text-sm text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
            >
              {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setFormData({}); }}
              className="flex-1 rounded-full border border-[#E5E7EB] py-3 text-sm text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
            >
              {isAr ? 'حلل تاني' : 'New analysis'}
            </button>
          </div>

          {/* Review Modal */}
          {showReviewModal && (
            <ReviewModal
              toolId={config.id}
              toolNameAr={config.nameAr || config.name}
              toolNameEn={config.name}
              onClose={() => setShowReviewModal(false)}
              onSuccess={() => {
                setShowReviewModal(false);
                setReviewSubmitted(true);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // ═══ FORM VIEW ═══
  return (
    <div className="wzrd-public-page min-h-screen">
      <div className="mx-auto max-w-lg px-6 py-16">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8] transition-colors"
        >
          {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
        </button>

        {/* Tool Header Card */}
        <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-3xl">
              {config.icon}
            </span>
            <div>
              <h1 className="text-lg font-bold text-[#111827]">
                {isAr ? config.nameAr || config.name : config.name}
              </h1>
              <p className="text-xs leading-relaxed text-[#6B7280]">
                {config.paywallAfterFreePreview
                  ? (isAr
                      ? `${config.descriptionAr || config.description} · معاينة مجانية، ثم ~${config.cost} كريدت`
                      : `${config.description} · Free preview, then ~${config.cost} credits`)
                  : (isAr
                      ? `${config.descriptionAr || config.description} · ~${config.cost} كريدت`
                      : `${config.description} · ~${config.cost} credits`)}
              </p>
            </div>
          </div>
        </div>

        {/* Intro Card */}
        {config.intro && (
          <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h2 className="mb-2 text-sm font-bold text-[#111827]">
              {isAr ? config.intro.headlineAr || config.intro.headline : config.intro.headline}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-[#6B7280]">
              {isAr ? config.intro.bodyAr || config.intro.body : config.intro.body}
            </p>
            <div className="mb-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {isAr ? 'بيقيس:' : 'What it measures:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(isAr ? config.intro.measuresAr || config.intro.measures : config.intro.measures).map((m, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-0.5 text-[11px] font-medium text-[#374151]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-[#D97706]">
              <span className="font-bold">{isAr ? 'الأنسب لـ:' : 'Best for:'}</span>{' '}
              {isAr ? config.intro.bestForAr || config.intro.bestFor : config.intro.bestFor}
            </p>
          </div>
        )}

        {/* Tool Reviews — social proof */}
        <ToolReviews toolId={config.id} />

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{error}</p>
            {looksLikeInsufficientCredits(error) && (
              <a
                href="/pricing"
                className="mt-2 inline-block text-sm font-semibold text-[#1B4FD8] hover:underline"
              >
                {isAr ? 'اشترِ كريدت أو شوف الباقات ←' : 'Buy credits or view plans →'}
              </a>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          {config.fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#374151]">
                {isAr ? field.labelAr || field.label : field.label}
                {field.required && <span className="ms-1 text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={isAr ? field.placeholderAr || field.placeholder : field.placeholder}
                  maxLength={field.maxLength || 1000}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#1B4FD8] focus:ring-2 focus:ring-[#1B4FD8]/10 transition"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#1B4FD8] focus:ring-2 focus:ring-[#1B4FD8]/10 transition"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                >
                  <option value="">{isAr ? 'اختر…' : 'Select…'}</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#E5E7EB] accent-[#1B4FD8]"
                    checked={!!formData[field.name]}
                    onChange={e => updateField(field.name, e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-[#374151]">
                    {isAr ? field.placeholderAr || field.placeholder : field.placeholder}
                  </span>
                </label>
              ) : (
                <input
                  type="text"
                  placeholder={isAr ? field.placeholderAr || field.placeholder : field.placeholder}
                  maxLength={field.maxLength || 255}
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#1B4FD8] focus:ring-2 focus:ring-[#1B4FD8]/10 transition"
                  value={(formData[field.name] as string) || ''}
                  onChange={e => updateField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit / Auth Gate */}
        {!authLoading && !user ? (
          <div className="mt-5 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-center">
            <p className="mb-1 text-sm font-bold text-[#111827]">
              {isAr ? 'تسجيل الدخول مطلوب' : 'Login required'}
            </p>
            <p className="mb-4 text-xs text-[#6B7280]">
              {isAr
                ? 'لازم تسجّل دخول أو تعمل حساب عشان تستخدم الأدوات'
                : 'You need an account to use the AI tools'}
            </p>
            <div className="flex gap-3">
              <a
                href="/login"
                onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                className="flex-1 rounded-full border border-[#1B4FD8] py-3 text-sm font-bold text-[#1B4FD8] hover:bg-[#EEF2FF] transition text-center"
              >
                {isAr ? 'تسجيل الدخول' : 'Log in'}
              </a>
              <a
                href="/signup"
                onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
                className="flex-1 rounded-full bg-[#1B4FD8] py-3 text-sm font-bold text-white hover:bg-[#1440B8] transition text-center"
              >
                {isAr ? 'إنشاء حساب مجاني' : 'Create free account'}
              </a>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || authLoading}
            className="mt-5 w-full rounded-full bg-[#1B4FD8] py-4 text-sm font-bold text-white shadow-md hover:bg-[#1440B8] disabled:opacity-50 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {isAr ? 'جاري التحليل…' : 'Analysing…'}
              </span>
            ) : config.paywallAfterFreePreview
              ? (isAr ? 'عرض النتيجة المجانية ←' : 'See free preview →')
              : (isAr ? `تحليل — ${config.cost} كريدت` : `Analyse — ${config.cost} credits`)}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-[#9CA3AF]">
          {isAr ? 'بياناتك مشفرة ولا نشاركها مع أي طرف ثالث' : 'Your data is encrypted and never shared'}
        </p>
      </div>
    </div>
  );
}
