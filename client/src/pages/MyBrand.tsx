import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DiagnosisEntry {
  id: number;
  toolId: string;
  score: number;
  findings: Array<{ title: string; detail: string; severity: string }>;
  actionItems: Array<{ task: string; difficulty: string }>;
  recommendation: string;
  createdAt: string;
}

interface ChecklistItem {
  id: number;
  task: string;
  difficulty: string;
  completed: boolean;
  completedAt: string | null;
}

interface Checklist {
  id: number;
  diagnosisId: number;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  createdAt: string;
}

function BrandHealthEmptyIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="wmb-e1" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.55 0.18 290)" stopOpacity="0.55" />
          <stop offset="1" stopColor="oklch(0.72 0.12 200)" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="wmb-e2" x1="0" y1="60" x2="120" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.62 0.14 290)" stopOpacity="0.25" />
          <stop offset="1" stopColor="oklch(0.75 0.1 200)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#wmb-e2)" strokeWidth="0.75" />
      <path d="M30 78 Q48 42 60 52 T90 38" stroke="url(#wmb-e1)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M28 85 Q55 58 72 68 T94 72" stroke="oklch(0.55 0.15 290 / 0.35)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="48" r="8" fill="oklch(0.55 0.18 290 / 0.4)" />
      <circle cx="60" cy="48" r="4" fill="oklch(0.95 0.02 80)" className="dark:fill-white/90" />
    </svg>
  );
}

export default function MyBrand() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [history, setHistory] = useState<DiagnosisEntry[]>([]);
  const [trend, setTrend] = useState<string>('new');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisEntry | null>(null);

  // Fetch history + checklists
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/trpc/tools.myHistory').then(r => r.json()).then(d => {
        const data = d.result?.data?.json ?? d.result?.data ?? {};
        setHistory(data.history || []);
        setTrend(data.trend || 'new');
      }),
      fetch('/api/trpc/tools.myChecklists').then(r => r.json()).then(d => {
        const data = d.result?.data?.json ?? d.result?.data ?? [];
        setChecklists(Array.isArray(data) ? data : []);
      }),
    ])
      .catch(() => setError(isAr ? 'حصل مشكلة في التحميل — حاول تاني.' : 'Failed to load — please try again.'))
      .finally(() => setLoading(false));
  }, [isAr]);

  // Toggle checklist item
  const toggleItem = useCallback(async (checklistId: number, itemIndex: number) => {
    try {
      const res = await fetch('/api/trpc/tools.toggleChecklistItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { checklistId, itemIndex } }),
      });
      const d = await res.json();
      const result = d.result?.data?.json ?? d.result?.data;
      if (result) {
        setChecklists(prev => prev.map(cl =>
          cl.id === checklistId ? { ...cl, items: result.items, completedCount: result.completedCount, totalCount: result.totalCount } : cl
        ));
      }
    } catch {
      // silent fail — UI already toggled optimistically
    }
  }, []);

  const latest = history[0] || null;
  const prevScore = history[1]?.score ?? null;
  const scoreDiff = latest && prevScore !== null ? latest.score - prevScore : null;

  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : trend === 'stable' ? '→' : '';
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-500';
  const trendLabel = isAr
    ? (trend === 'improving' ? 'بيتحسّن' : trend === 'declining' ? 'بيتراجع' : trend === 'stable' ? 'ثابت' : 'جديد')
    : (trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : trend === 'stable' ? 'Stable' : 'New');

  const difficultyBadge = (d: string) => {
    const colors = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
    const labels = isAr ? { easy: 'سهل', medium: 'متوسط', hard: 'صعب' } : { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[d as keyof typeof colors] || colors.medium}`}>
        {labels[d as keyof typeof labels] || d}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const toolName = useCallback((id: string) => {
    const names: Record<string, string> = isAr
      ? { brand_diagnosis: 'تشخيص البراند', offer_check: 'فحص العرض', message_check: 'فحص الرسالة', presence_audit: 'فحص الحضور', identity_snapshot: 'لقطة الهوية', launch_readiness: 'جاهزية الإطلاق' }
      : { brand_diagnosis: 'Brand Diagnosis', offer_check: 'Offer Check', message_check: 'Message Check', presence_audit: 'Presence Audit', identity_snapshot: 'Identity Snapshot', launch_readiness: 'Launch Readiness' };
    return names[id] || id;
  }, [isAr]);

  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e) => ({
        label: new Date(e.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }),
        score: e.score,
        tool: toolName(e.toolId),
      }));
  }, [history, isAr, toolName]);

  const firstScore = chartData[0]?.score ?? null;
  const lastScore = chartData.length ? chartData[chartData.length - 1].score : null;
  const totalDelta =
    firstScore !== null && lastScore !== null && chartData.length >= 2 ? lastScore - firstScore : null;

  if (loading) {
    return (
      <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
        <WzrdPublicHeader />
        <div className="wzrd-public-pt mx-auto max-w-2xl px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/80" />
            <div className="h-40 rounded-3xl bg-zinc-200/80 dark:bg-zinc-700/80" />
            <div className="h-32 rounded-3xl bg-zinc-200/80 dark:bg-zinc-700/80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wzrd-page-radial min-h-screen text-zinc-900 dark:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="wzrd-public-pt mx-auto max-w-2xl px-4 pb-24 pt-2">

        {/* Page Title */}
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-primary to-cyan-600 dark:from-white dark:via-violet-200 dark:to-cyan-300">
          {isAr ? 'صحة البراند بتاعك' : 'Your Brand Health'}
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200/60 bg-red-500/10 p-4 text-sm text-red-700 dark:border-red-500/30 dark:text-red-300">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline">
              {isAr ? 'حاول تاني' : 'Retry'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="wzrd-glass rounded-3xl p-10 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-cyan-500/10 shadow-inner">
              <BrandHealthEmptyIllustration className="h-20 w-20" />
            </div>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {isAr ? 'مفيش تشخيصات لسه' : 'No diagnoses yet'}
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-sm leading-loose text-zinc-600 dark:text-zinc-400">
              {isAr ? 'ابدأ أول تشخيص عشان تشوف صحة البراند بتاعك.' : 'Run your first diagnosis to see your brand health.'}
            </p>
            <button
              onClick={() => navigate('/tools/brand-diagnosis')}
              className="wzrd-shimmer-btn rounded-full bg-gradient-to-r from-primary to-violet-600 px-8 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {isAr ? 'شغّل أول تشخيص ←' : '→ Run First Diagnosis'}
            </button>
          </div>
        ) : (
          <>
            {/* Score Card */}
            <div className="wzrd-glass mb-4 rounded-3xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{isAr ? 'آخر نتيجة' : 'Latest Score'}</span>
                <span className={`text-sm font-medium ${trendColor}`}>
                  {trendIcon} {trendLabel}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold tabular-nums">{latest!.score}</span>
                <span className="mb-1 text-xl text-zinc-400">/100</span>
                {scoreDiff !== null && (
                  <span className={`text-lg font-semibold mb-1 ${scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </span>
                )}
              </div>
              {/* Score Bar */}
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${latest!.score}%`,
                    backgroundColor: latest!.score >= 70 ? '#22c55e' : latest!.score >= 45 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-400">
                <span>{isAr ? 'حرج' : 'Critical'}</span>
                <span>{isAr ? 'ضعيف' : 'Weak'}</span>
                <span>{isAr ? 'محتاج شغل' : 'Needs Work'}</span>
                <span>{isAr ? 'قوي' : 'Strong'}</span>
              </div>
            </div>

            {/* Stats + score trend chart */}
            {chartData.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'عدد التشخيصات' : 'Diagnoses'}</div>
                    <div className="text-2xl font-bold tabular-nums">{history.length}</div>
                  </div>
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'من أول لآخر نتيجة' : 'First → latest'}</div>
                    <div
                      className={`text-2xl font-bold tabular-nums ${
                        totalDelta === null ? 'text-zinc-400' : totalDelta > 0 ? 'text-green-600' : totalDelta < 0 ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {totalDelta === null ? '—' : `${totalDelta > 0 ? '+' : ''}${totalDelta}`}
                    </div>
                  </div>
                  <div className="wzrd-glass rounded-3xl p-4 text-center">
                    <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'الحالة' : 'Status'}</div>
                    <div className={`text-lg font-semibold ${trendColor}`}>
                      {trendIcon} {trendLabel}
                    </div>
                  </div>
                </div>

                <div className="wzrd-glass mb-4 rounded-3xl p-4">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {isAr ? 'تطور النتيجة' : 'Score trend'}
                  </h3>
                  <div className="w-full" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wzrdScoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                            <stop offset="60%" stopColor="#7000FF" stopOpacity={0.08} />
                            <stop offset="100%" stopColor="#7000FF" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="wzrdScoreStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00F0FF" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                          <filter id="wzrdLineGlow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="0"
                          stroke="rgba(255,255,255,0.04)"
                          horizontal={true}
                          vertical={false}
                        />

                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#52525B', fontFamily: 'Inter, sans-serif' }}
                          stroke="transparent"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#52525B', fontFamily: 'Inter, sans-serif' }}
                          stroke="transparent"
                          tickLine={false}
                          axisLine={false}
                          width={32}
                        />

                        <ReferenceLine
                          y={70}
                          stroke="rgba(34,197,94,0.3)"
                          strokeDasharray="4 4"
                          label={{ value: '70', fill: 'rgba(34,197,94,0.5)', fontSize: 10 }}
                        />
                        <ReferenceLine
                          y={40}
                          stroke="rgba(239,68,68,0.3)"
                          strokeDasharray="4 4"
                          label={{ value: '40', fill: 'rgba(239,68,68,0.5)', fontSize: 10 }}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(10,10,10,0.95)',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            color: '#E4E4E7',
                            fontSize: '12px',
                          }}
                          itemStyle={{ color: '#00F0FF' }}
                          labelStyle={{ color: '#71717A', marginBottom: '4px' }}
                          formatter={(value: number) => [`${value}/100`, isAr ? 'النتيجة' : 'Score']}
                          labelFormatter={(_, payload) => (payload?.[0]?.payload?.tool as string) || ''}
                          cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }}
                        />

                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="url(#wzrdScoreStroke)"
                          strokeWidth={2}
                          fill="url(#wzrdScoreFill)"
                          filter="url(#wzrdLineGlow)"
                          dot={{
                            r: 4,
                            strokeWidth: 2,
                            stroke: '#00F0FF',
                            fill: '#050505',
                          }}
                          activeDot={{
                            r: 6,
                            stroke: '#00F0FF',
                            strokeWidth: 2,
                            fill: '#050505',
                            style: { filter: 'drop-shadow(0 0 6px #00F0FF)' },
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            {history.length > 1 && (
              <div className="wzrd-glass mb-4 rounded-3xl p-6">
                <h3 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {isAr ? 'السجل' : 'History'}
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 6).map((entry, i) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedDiagnosis(selectedDiagnosis?.id === entry.id ? null : entry)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: entry.score >= 70 ? '#dcfce7' : entry.score >= 45 ? '#fef3c7' : '#fee2e2',
                          color: entry.score >= 70 ? '#166534' : entry.score >= 45 ? '#92400e' : '#991b1b',
                        }}>
                        {entry.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">{toolName(entry.toolId)}</div>
                        <div className="text-xs text-zinc-400">{formatDate(entry.createdAt)}</div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                          {isAr ? 'الأحدث' : 'Latest'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Diagnosis Details */}
            {selectedDiagnosis && (
              <div className="wzrd-glass mb-4 rounded-3xl border border-indigo-200/50 p-5 dark:border-indigo-500/25">
                <h3 className="mb-3 text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                  {toolName(selectedDiagnosis.toolId)} — {formatDate(selectedDiagnosis.createdAt)}
                </h3>
                {(selectedDiagnosis.findings || []).map((f, i: number) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${f.severity === 'high' ? 'bg-red-500' : f.severity === 'low' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium">{f.title}</span>
                    {f.detail && <span className="ml-1 text-zinc-500">— {f.detail.substring(0, 100)}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Action Checklist */}
            {checklists.length > 0 && (
              <div className="wzrd-glass mb-4 rounded-3xl p-6">
                <h3 className="mb-1 text-base font-semibold">
                  {isAr ? 'خطواتك العملية' : 'Your Action Items'}
                </h3>
                {checklists.slice(0, 3).map(cl => {
                  const items = cl.items || [];
                  const pct = cl.totalCount > 0 ? Math.round((cl.completedCount / cl.totalCount) * 100) : 0;
                  return (
                    <div key={cl.id} className="mt-4">
                      {/* Progress */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>{cl.completedCount}/{cl.totalCount} {isAr ? 'مهمة' : 'tasks'}</span>
                        <span className="font-semibold text-indigo-600">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      {/* Items */}
                      <div className="space-y-2">
                        {items.map((item, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => toggleItem(cl.id, idx)}
                            className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${item.completed ? 'bg-emerald-500/10' : 'bg-zinc-100/60 hover:bg-zinc-200/50 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70'}`}
                            style={{ minHeight: '48px' }}
                          >
                            <div
                              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${item.completed ? 'border-green-500 bg-green-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}
                              style={{ minWidth: '24px', minHeight: '24px' }}
                            >
                              {item.completed && <span className="text-xs">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {item.task}
                              </span>
                            </div>
                            {difficultyBadge(item.difficulty)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* CTA after high completion */}
                {checklists[0] && checklists[0].completedCount >= checklists[0].totalCount * 0.7 && (
                  <div className="mt-6 rounded-2xl border border-indigo-200/50 bg-indigo-500/10 p-4 text-center dark:border-indigo-500/25">
                    <p className="mb-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">
                      {isAr ? 'خلّصت أغلب المهام! شغّل تشخيص جديد وشوف التحسّن.' : 'Almost done! Run a new diagnosis to see improvement.'}
                    </p>
                    <button
                      onClick={() => navigate('/tools/brand-diagnosis')}
                      className="rounded-full bg-gradient-to-r from-primary to-violet-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110"
                    >
                      {isAr ? 'شغّل تشخيص جديد ←' : '→ Run New Diagnosis'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ FEATURE CARDS ═══ */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Copilot Card */}
              <button
                onClick={() => navigate('/copilot')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">🧙‍♂️</div>
                <h4 className="text-sm font-bold">{isAr ? 'المستشار الذكي' : 'AI Copilot'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? 'اسأل أي سؤال' : 'Ask anything'}</p>
              </button>

              {/* Benchmark Card */}
              <button
                onClick={() => navigate('/tools/benchmark')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">📊</div>
                <h4 className="text-sm font-bold">{isAr ? 'قارن بالمنافسين' : 'Benchmark'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٤٠ كريدت' : '40 credits'}</p>
              </button>

              {/* Quick Diagnosis Card */}
              <button
                onClick={() => navigate('/tools/quick')}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">⚡</div>
                <h4 className="text-sm font-bold">{isAr ? 'تشخيص سريع' : 'Quick Check'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٥ أسئلة بس' : '5 questions'}</p>
              </button>

              {/* Referral Card */}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/trpc/referral.myCode');
                    const d = await res.json();
                    const data = d.result?.data?.json ?? d.result?.data ?? {};
                    if (data.shareUrl) {
                      await navigator.clipboard.writeText(data.shareUrl);
                      alert(isAr ? 'تم نسخ رابط الإحالة! ✅\nابعته لصاحبك — كل واحد فيكم هياخد ٥٠ كريدت.' : 'Referral link copied! ✅\nShare it — you both get 50 credits.');
                    }
                  } catch {
                    alert(isAr ? 'سجّل دخول الأول' : 'Please login first');
                  }
                }}
                className="wzrd-glass rounded-3xl p-4 text-center transition hover:ring-2 hover:ring-primary/15"
              >
                <div className="mb-2 text-2xl">🎁</div>
                <h4 className="text-sm font-bold">{isAr ? 'ادعي صاحبك' : 'Invite Friends'}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{isAr ? '٥٠ كريدت لكل واحد' : '50 credits each'}</p>
              </button>
            </div>

            {/* Re-diagnose CTA */}
            <div className="mt-4">
              <button
                onClick={() => navigate('/tools/brand-diagnosis')}
                className="w-full rounded-3xl bg-gradient-to-r from-primary via-violet-600 to-cyan-600 py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110"
              >
                {isAr ? 'شغّل تشخيص جديد وقارن' : 'Run New Diagnosis & Compare'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
