import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { trpc } from '@/lib/trpc';

// ─── Score Ring (compact) ────────────────────────────────────────────────────
function MiniScoreRing({ score }: { score: number }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const dash = pct * circumference;
  const { c1, c2 } =
    score >= 70
      ? { c1: '#1B4FD8', c2: '#3B82F6' }
      : score >= 40
        ? { c1: '#D97706', c2: '#F59E0B' }
        : { c1: '#DC2626', c2: '#EF4444' };

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={c1} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="relative text-sm font-black" style={{ color: c1 }}>{score}</span>
    </div>
  );
}

// ─── Premium Report Viewer ───────────────────────────────────────────────────
function PremiumReportViewer({
  report,
  toolName,
  onClose,
  isAr,
}: {
  report: Record<string, unknown>;
  toolName: string;
  onClose: () => void;
  isAr: boolean;
}) {
  const exec = report.executiveSummary as {
    score?: number;
    topFindings?: string[];
    verdict?: string;
    pillarScores?: Record<string, number>;
  } | undefined;
  const pillars = report.pillars as Array<{
    name: string;
    nameEn: string;
    score: number;
    analysis: string;
    evidence: string[];
    gap: string;
    severity: string;
  }> | undefined;
  const priorityMatrix = report.priorityMatrix as {
    urgent?: string[];
    important?: string[];
    improvement?: string[];
  } | undefined;
  const actionPlan = report.actionPlan as {
    days30?: string[];
    days60?: string[];
    days90?: string[];
  } | undefined;
  const quickWins = report.quickWins as string[] | undefined;
  const recommendation = report.recommendation as {
    phase?: string;
    reason?: string;
  } | undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#111827]">
              {isAr ? 'التقرير الاحترافي' : 'Premium Report'}
            </h2>
            <p className="text-sm text-[#6B7280]">{toolName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-[#F3F4F6] p-2 text-[#6B7280] hover:bg-[#E5E7EB] transition"
          >
            ✕
          </button>
        </div>

        {/* Executive Summary */}
        {exec && (
          <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-[#FAFAF5] p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isAr ? 'الملخص التنفيذي' : 'Executive Summary'}
            </h3>
            {exec.score !== undefined && (
              <div className="mb-3 flex items-center gap-3">
                <MiniScoreRing score={exec.score} />
                <span className="text-2xl font-black text-[#111827]">{exec.score}/100</span>
              </div>
            )}
            {exec.verdict && (
              <p className="mb-3 text-sm leading-relaxed text-[#374151]">{exec.verdict}</p>
            )}
            {exec.topFindings && exec.topFindings.length > 0 && (
              <div className="space-y-1">
                {exec.topFindings.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                    <span className="mt-1 text-xs text-[#DC2626]">●</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pillars */}
        {pillars && pillars.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isAr ? 'تحليل المحاور' : 'Pillar Analysis'}
            </h3>
            <div className="space-y-3">
              {pillars.map((p, i) => {
                const sevColor = p.severity === 'critical' ? '#DC2626' : p.severity === 'major' ? '#D97706' : '#16A34A';
                return (
                  <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#111827]">{p.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: sevColor }}>{p.severity}</span>
                        <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs font-bold text-[#374151]">{p.score}/100</span>
                      </div>
                    </div>
                    <p className="mb-2 text-sm leading-relaxed text-[#374151] whitespace-pre-line">{p.analysis}</p>
                    {p.gap && (
                      <p className="text-xs text-[#6B7280]"><strong>{isAr ? 'الفجوة:' : 'Gap:'}</strong> {p.gap}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority Matrix */}
        {priorityMatrix && (
          <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isAr ? 'خريطة الأولويات' : 'Priority Matrix'}
            </h3>
            {priorityMatrix.urgent && priorityMatrix.urgent.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-bold text-[#DC2626]">{isAr ? '🔴 عاجل ومهم' : '🔴 Urgent & Important'}</p>
                {priorityMatrix.urgent.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
            {priorityMatrix.important && priorityMatrix.important.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-bold text-[#D97706]">{isAr ? '🟠 مهم مش عاجل' : '🟠 Important, Not Urgent'}</p>
                {priorityMatrix.important.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
            {priorityMatrix.improvement && priorityMatrix.improvement.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold text-[#16A34A]">{isAr ? '🟡 تحسين' : '🟡 Improvement'}</p>
                {priorityMatrix.improvement.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Plan */}
        {actionPlan && (
          <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
              {isAr ? 'خطة العمل' : 'Action Plan'}
            </h3>
            {actionPlan.days30 && actionPlan.days30.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-bold text-[#1B4FD8]">{isAr ? '📅 أول 30 يوم' : '📅 First 30 Days'}</p>
                {actionPlan.days30.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
            {actionPlan.days60 && actionPlan.days60.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-bold text-[#7C3AED]">{isAr ? '📅 30-60 يوم' : '📅 30-60 Days'}</p>
                {actionPlan.days60.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
            {actionPlan.days90 && actionPlan.days90.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold text-[#059669]">{isAr ? '📅 60-90 يوم' : '📅 60-90 Days'}</p>
                {actionPlan.days90.map((item, i) => (
                  <p key={i} className="ml-4 text-sm text-[#374151]">• {item}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Wins */}
        {quickWins && quickWins.length > 0 && (
          <div className="mb-6 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#059669]">
              {isAr ? '⚡ حاجات تعملها النهاردة' : '⚡ Quick Wins — Do Today'}
            </h3>
            {quickWins.map((w, i) => (
              <p key={i} className="mb-1 text-sm text-[#374151]">✓ {w}</p>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {recommendation && (
          <div className="mb-6 rounded-xl bg-[#1B4FD8] p-5 text-white">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider opacity-70">
              {isAr ? 'التوصية النهائية' : 'Final Recommendation'}
            </h3>
            {recommendation.phase && (
              <p className="mb-1 text-lg font-black">{recommendation.phase}</p>
            )}
            {recommendation.reason && (
              <p className="text-sm opacity-90">{recommendation.reason}</p>
            )}
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full rounded-full border border-[#E5E7EB] py-3 text-sm font-bold text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
        >
          {isAr ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MyReportsPage() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user, loading: authLoading } = useAuth();
  const [selectedReport, setSelectedReport] = useState<{
    report: Record<string, unknown>;
    toolName: string;
  } | null>(null);

  const reportsQuery = trpc.premium.getMyReports.useQuery(undefined, {
    enabled: !!user,
    staleTime: 30_000,
  });

  // Auth guard
  if (!authLoading && !user) {
    return (
      <div className="wzrd-public-page min-h-screen">
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <h2 className="mb-2 text-xl font-bold text-[#111827]">
            {isAr ? 'سجّل دخولك أولاً' : 'Please log in first'}
          </h2>
          <p className="mb-6 text-sm text-[#6B7280]">
            {isAr ? 'محتاج تسجّل دخول عشان تشوف تقاريرك.' : 'You need to log in to view your reports.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="rounded-full bg-[#1B4FD8] px-8 py-3 text-sm font-bold text-white hover:bg-[#1440B8] transition"
          >
            {isAr ? 'تسجيل الدخول' : 'Log In'}
          </button>
        </div>
      </div>
    );
  }

  const reports = reportsQuery.data ?? [];

  return (
    <div className="wzrd-public-page min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8] transition-colors"
          >
            {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
          </button>
          <h1 className="text-2xl font-black text-[#111827]">
            {isAr ? '✦ تقاريري الاحترافية' : '✦ My Premium Reports'}
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {isAr
              ? 'كل التقارير الاحترافية اللي اشتريتها — محفوظة ومتاحة دايماً.'
              : 'All your premium reports — saved and always accessible.'}
          </p>
        </div>

        {/* Loading */}
        {reportsQuery.isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-[#E5E7EB] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#F3F4F6]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-[#F3F4F6]" />
                    <div className="h-3 w-1/2 rounded bg-[#F3F4F6]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!reportsQuery.isLoading && reports.length === 0 && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center">
            <div className="mb-4 text-5xl">📭</div>
            <h3 className="mb-2 text-lg font-bold text-[#111827]">
              {isAr ? 'مفيش تقارير لسه' : 'No reports yet'}
            </h3>
            <p className="mb-6 text-sm text-[#6B7280]">
              {isAr
                ? 'لما تشتري تقرير احترافي من أي أداة، هيظهر هنا.'
                : 'When you purchase a premium report from any tool, it will appear here.'}
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="rounded-full bg-[#1B4FD8] px-8 py-3 text-sm font-bold text-white hover:bg-[#1440B8] transition"
            >
              {isAr ? 'استكشف الأدوات ←' : 'Explore Tools →'}
            </button>
          </div>
        )}

        {/* Reports List */}
        {reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((r) => {
              const exec = r.report?.executiveSummary as { score?: number; verdict?: string } | undefined;
              const score = exec?.score ?? r.freeScore ?? 0;
              return (
                <div
                  key={r.id}
                  className="group cursor-pointer rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:border-[#7C3AED] hover:shadow-md transition"
                  onClick={() => setSelectedReport({ report: r.report, toolName: r.toolName })}
                >
                  <div className="flex items-center gap-4">
                    <MiniScoreRing score={score} />
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#111827] group-hover:text-[#7C3AED] transition">
                        {r.toolName}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">
                        {new Date(r.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {' · '}
                        {r.creditsUsed} {isAr ? 'كريدت' : 'credits'}
                      </p>
                      {exec?.verdict && (
                        <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">{exec.verdict}</p>
                      )}
                    </div>
                    <span className="text-lg text-[#9CA3AF] group-hover:text-[#7C3AED] transition">
                      {isAr ? '←' : '→'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA to get more reports */}
        {reports.length > 0 && (
          <div className="mt-8 rounded-2xl border border-[#7C3AED] bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] p-6 text-center">
            <p className="mb-1 text-sm font-bold text-[#111827]">
              {isAr ? 'عايز تحلل أداة تانية؟' : 'Want to analyze another tool?'}
            </p>
            <p className="mb-4 text-xs text-[#6B7280]">
              {isAr
                ? 'عندنا 9 أدوات تشخيص — كل واحدة بتحلل جانب مختلف من البراند.'
                : 'We have 9 diagnostic tools — each analyzes a different aspect of your brand.'}
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="rounded-full bg-[#7C3AED] px-8 py-3 text-sm font-bold text-white hover:bg-[#6D28D9] transition"
            >
              {isAr ? 'استكشف الأدوات ←' : 'Explore Tools →'}
            </button>
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <PremiumReportViewer
          report={selectedReport.report}
          toolName={selectedReport.toolName}
          isAr={isAr}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
