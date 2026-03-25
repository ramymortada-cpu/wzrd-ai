import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

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

  const toolName = (id: string) => {
    const names: Record<string, string> = isAr
      ? { brand_diagnosis: 'تشخيص البراند', offer_check: 'فحص العرض', message_check: 'فحص الرسالة', presence_audit: 'فحص الحضور', identity_snapshot: 'لقطة الهوية', launch_readiness: 'جاهزية الإطلاق' }
      : { brand_diagnosis: 'Brand Diagnosis', offer_check: 'Offer Check', message_check: 'Message Check', presence_audit: 'Presence Audit', identity_snapshot: 'Identity Snapshot', launch_readiness: 'Launch Readiness' };
    return names[id] || id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WzrdPublicHeader />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-32 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isAr ? 'صحة البراند بتاعك' : 'Your Brand Health'}
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
            <button onClick={() => window.location.reload()} className="underline ml-2">
              {isAr ? 'حاول تاني' : 'Retry'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">🔬</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {isAr ? 'مفيش تشخيصات لسه' : 'No diagnoses yet'}
            </h2>
            <p className="text-gray-500 mb-6">
              {isAr ? 'ابدأ أول تشخيص عشان تشوف صحة البراند بتاعك.' : 'Run your first diagnosis to see your brand health.'}
            </p>
            <button
              onClick={() => navigate('/tools/brand-diagnosis')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-500 transition text-base"
            >
              {isAr ? 'شغّل أول تشخيص ←' : '→ Run First Diagnosis'}
            </button>
          </div>
        ) : (
          <>
            {/* Score Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{isAr ? 'آخر نتيجة' : 'Latest Score'}</span>
                <span className={`text-sm font-medium ${trendColor}`}>
                  {trendIcon} {trendLabel}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-gray-900">{latest!.score}</span>
                <span className="text-xl text-gray-400 mb-1">/100</span>
                {scoreDiff !== null && (
                  <span className={`text-lg font-semibold mb-1 ${scoreDiff > 0 ? 'text-green-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </span>
                )}
              </div>
              {/* Score Bar */}
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${latest!.score}%`,
                    backgroundColor: latest!.score >= 70 ? '#22c55e' : latest!.score >= 45 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>{isAr ? 'حرج' : 'Critical'}</span>
                <span>{isAr ? 'ضعيف' : 'Weak'}</span>
                <span>{isAr ? 'محتاج شغل' : 'Needs Work'}</span>
                <span>{isAr ? 'قوي' : 'Strong'}</span>
              </div>
            </div>

            {/* Timeline */}
            {history.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {isAr ? 'السجل' : 'History'}
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 6).map((entry, i) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedDiagnosis(selectedDiagnosis?.id === entry.id ? null : entry)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: entry.score >= 70 ? '#dcfce7' : entry.score >= 45 ? '#fef3c7' : '#fee2e2',
                          color: entry.score >= 70 ? '#166534' : entry.score >= 45 ? '#92400e' : '#991b1b',
                        }}>
                        {entry.score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{toolName(entry.toolId)}</div>
                        <div className="text-xs text-gray-400">{formatDate(entry.createdAt)}</div>
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
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 mb-4">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">
                  {toolName(selectedDiagnosis.toolId)} — {formatDate(selectedDiagnosis.createdAt)}
                </h3>
                {(selectedDiagnosis.findings || []).map((f: any, i: number) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${f.severity === 'high' ? 'bg-red-500' : f.severity === 'low' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="font-medium text-gray-800">{f.title}</span>
                    {f.detail && <span className="text-gray-500 ml-1">— {f.detail.substring(0, 100)}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Action Checklist */}
            {checklists.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
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
                        {items.map((item: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => toggleItem(cl.id, idx)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl transition text-left ${item.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                            style={{ minHeight: '48px' }}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
                              style={{ minWidth: '24px', minHeight: '24px' }}>
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
                  <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-center">
                    <p className="text-sm text-indigo-800 font-medium mb-3">
                      {isAr ? 'خلّصت أغلب المهام! شغّل تشخيص جديد وشوف التحسّن.' : 'Almost done! Run a new diagnosis to see improvement.'}
                    </p>
                    <button
                      onClick={() => navigate('/tools/brand-diagnosis')}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-500 transition"
                    >
                      {isAr ? 'شغّل تشخيص جديد ←' : '→ Run New Diagnosis'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ FEATURE CARDS ═══ */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Copilot Card */}
              <button
                onClick={() => navigate('/copilot')}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">🧙‍♂️</div>
                <h4 className="text-sm font-bold text-gray-900">{isAr ? 'المستشار الذكي' : 'AI Copilot'}</h4>
                <p className="text-xs text-gray-400 mt-1">{isAr ? 'اسأل أي سؤال' : 'Ask anything'}</p>
              </button>

              {/* Benchmark Card */}
              <button
                onClick={() => navigate('/tools/benchmark')}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">📊</div>
                <h4 className="text-sm font-bold text-gray-900">{isAr ? 'قارن بالمنافسين' : 'Benchmark'}</h4>
                <p className="text-xs text-gray-400 mt-1">{isAr ? '٤٠ كريدت' : '40 credits'}</p>
              </button>

              {/* Quick Diagnosis Card */}
              <button
                onClick={() => navigate('/tools/quick')}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="text-sm font-bold text-gray-900">{isAr ? 'تشخيص سريع' : 'Quick Check'}</h4>
                <p className="text-xs text-gray-400 mt-1">{isAr ? '٥ أسئلة بس' : '5 questions'}</p>
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
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">🎁</div>
                <h4 className="text-sm font-bold text-gray-900">{isAr ? 'ادعي صاحبك' : 'Invite Friends'}</h4>
                <p className="text-xs text-gray-400 mt-1">{isAr ? '٥٠ كريدت لكل واحد' : '50 credits each'}</p>
              </button>
            </div>

            {/* Re-diagnose CTA */}
            <div className="mt-4">
              <button
                onClick={() => navigate('/tools/brand-diagnosis')}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-base hover:bg-indigo-500 transition shadow-sm"
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
