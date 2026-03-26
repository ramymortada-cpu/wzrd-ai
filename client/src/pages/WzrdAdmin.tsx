/**
 * WZRD AI Admin — manages the public WZRD AI system.
 * Sidebar nav, bilingual, improved UX.
 */
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'overview' | 'users' | 'credits' | 'tools' | 'payments' | 'webhooks' | 'cms' | 'prompts' | 'pricing' | 'team' | 'agency' | 'config' | 'requests';

const FETCH_OPTS: RequestInit = { credentials: 'include' };

async function api(endpoint: string, input?: Record<string, unknown>) {
  try {
    const url = input
      ? `/api/trpc/${endpoint}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
      : `/api/trpc/${endpoint}`;
    const res = await fetch(url, FETCH_OPTS);
    if (!res.ok) { console.error(`[Admin] ${endpoint} failed: ${res.status}`); return null; }
    const data = await res.json();
    if (data?.error) { console.error(`[Admin] ${endpoint} error:`, data.error); return null; }
    return data?.result?.data?.json ?? data?.result?.data ?? null;
  } catch (err) { console.error(`[Admin] ${endpoint} fetch error:`, err); return null; }
}

async function apiMutation(endpoint: string, input?: Record<string, unknown>) {
  try {
    const res = await fetch(`/api/trpc/${endpoint}`, {
      ...FETCH_OPTS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ json: input || {} }),
    });
    const data = await res.json();
    if (data?.error) { console.error(`[Admin] mutation ${endpoint} error:`, data.error); return null; }
    return data?.result?.data?.json ?? data?.result?.data ?? null;
  } catch (err) { console.error(`[Admin] mutation ${endpoint} error:`, err); return null; }
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (ar: string, en: string) => string }) {
  const map: Record<string, { ar: string; en: string; cls: string }> = {
    active: { ar: 'نشط', en: 'Active', cls: 'bg-green-100 text-green-700' },
    paused: { ar: 'متوقف', en: 'Paused', cls: 'bg-amber-100 text-amber-700' },
    completed: { ar: 'مكتمل', en: 'Completed', cls: 'bg-blue-100 text-blue-700' },
    cancelled: { ar: 'ملغي', en: 'Cancelled', cls: 'bg-red-100 text-red-700' },
    lead: { ar: 'ليد', en: 'Lead', cls: 'bg-gray-100 text-gray-600' },
  };
  const m = map[status] || { ar: status, en: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${m.cls}`}>{t(m.ar, m.en)}</span>;
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-50">{icon}</span>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function Toast({ message, onDismiss, type = 'success' }: { message: string; onDismiss: () => void; type?: 'success' | 'error' }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] py-3 px-6 text-center text-sm font-medium shadow-lg ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
      {message}
    </div>
  );
}

// ═══════════════════════════════════════
// STAT CARD — icon, accent border, gradient, count-up
// ═══════════════════════════════════════
function StatCard({ label, value, sub, icon, accent = 'border-l-indigo-500', gradient = 'from-indigo-50/50 to-white' }: {
  label: string; value: string | number; sub?: string; icon: string; accent?: string; gradient?: string;
}) {
  return (
    <div className={`p-5 rounded-xl border border-gray-200 bg-gradient-to-br ${gradient} shadow-sm hover:shadow-md transition-all border-l-4 ${accent}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold font-mono text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════
// CSV EXPORT UTILITY
// ═══════════════════════════════════════
function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

type T = (ar: string, en: string) => string;

// ═══════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════
function OverviewTab({ t }: { t: T }) {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [recentRuns, setRecentRuns] = useState<{ runs: any[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [d, r] = await Promise.all([
      api('wzrdAdmin.dashboard'),
      api('wzrdAdmin.toolRunHistory', { limit: 5 }),
    ]);
    setData(d);
    setRecentRuns(r);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  if (!data) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{t('تحديث كل 30 ثانية', 'Auto-refresh every 30s')}</span>
        <button onClick={load} disabled={refreshing} className="text-xs text-indigo-600 hover:text-indigo-500 disabled:opacity-50">
          {refreshing ? t('جاري...', 'Refreshing...') : t('تحديث', 'Refresh')}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('إجمالي التسجيلات', 'Total Signups')} value={data.users?.total || 0} sub={`+${data.users?.today || 0} ${t('النهاردة', 'today')}`} icon="👥" accent="border-l-indigo-500" gradient="from-indigo-50/50 to-white" />
        <StatCard label={t('هذا الأسبوع', 'This Week')} value={data.users?.thisWeek || 0} icon="📅" accent="border-l-cyan-500" gradient="from-cyan-50/50 to-white" />
        <StatCard label={t('عمليات التشخيص', 'Tool Runs')} value={data.tools?.totalRuns || 0} sub={`${t('متوسط النتيجة', 'Avg score')}: ${data.tools?.avgScore || '—'}`} icon="🔬" accent="border-l-amber-500" gradient="from-amber-50/50 to-white" />
        <StatCard label={t('مشتركين النشرة', 'Newsletter Subs')} value={data.newsletter?.subscribers || 0} icon="📬" accent="border-l-green-500" gradient="from-green-50/50 to-white" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label={t('كريدت صادر', 'Credits Issued')} value={data.credits?.totalIssued || 0} icon="⚡" accent="border-l-emerald-500" gradient="from-emerald-50/50 to-white" />
        <StatCard label={t('كريدت مستخدم', 'Credits Used')} value={data.credits?.totalUsed || 0} icon="📉" accent="border-l-red-500" gradient="from-red-50/50 to-white" />
        <StatCard label={t('إيرادات الكريدت', 'Credit Revenue')} value={`${(data.revenue?.totalCreditsRevenue || 0).toLocaleString()} ${t('كريدت', 'credits')}`} icon="💰" accent="border-l-amber-500" gradient="from-amber-50/50 to-white" />
      </div>

      {(recentRuns?.runs?.length ?? 0) > 0 && (
        <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <h4 className="text-sm font-bold text-gray-600 mb-3">{t('آخر النشاطات', 'Recent Activity')}</h4>
          <div className="space-y-2">
            {recentRuns!.runs.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium">User #{r.userId}</span>
                  <span className="text-gray-500 mx-2">·</span>
                  <span className="text-sm text-gray-600">{r.toolName?.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(new Date(r.createdAt))} ago</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tools?.topTools?.length > 0 && (
        <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <h4 className="text-sm font-bold text-gray-600 mb-3">{t('أكتر الأدوات استخداماً', 'Top Tools')}</h4>
          <div className="space-y-2">
            {data.tools.topTools.map((item: any) => (
              <div key={item.tool} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                <span className="text-sm font-medium">{item.tool?.replace(/_/g, ' ')}</span>
                <div className="flex gap-4">
                  <span className="text-xs text-gray-500">{item.uses} {t('عملية', 'runs')}</span>
                  <span className="text-xs text-amber-600">{item.creditsSpent} {t('كريدت', 'credits')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links — New Features */}
      <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
        <h4 className="text-sm font-bold text-gray-600 mb-3">{t('روابط سريعة', 'Quick Links')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { href: '/my-brand', icon: '📈', label: t('صحة البراند', 'Brand Health') },
            { href: '/copilot', icon: '🧙‍♂️', label: t('المستشار', 'Copilot') },
            { href: '/tools/benchmark', icon: '📊', label: t('مقارنة', 'Benchmark') },
            { href: '/tools/quick', icon: '⚡', label: t('سريع', 'Quick') },
            { href: '/pricing', icon: '💰', label: t('الأسعار', 'Pricing') },
            { href: '/seo/brand-diagnosis', icon: '🔍', label: t('SEO', 'SEO') },
            { href: '/services-info', icon: '🏢', label: t('خدمات', 'Services') },
            { href: '/welcome', icon: '🏠', label: t('الرئيسية', 'Home') },
          ].map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener"
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition text-sm">
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Estimated API Costs */}
      <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
        <h4 className="text-sm font-bold text-amber-700 mb-2">{t('تكلفة API المقدّرة', 'Estimated API Costs')}</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-amber-800">{data.tools?.totalRuns || 0}</div>
            <div className="text-xs text-amber-600">{t('تشخيصات (Groq: مجاني)', 'Diagnoses (Groq: free)')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-800">~{Math.round((data.credits?.totalUsed || 0) * 0.012)}</div>
            <div className="text-xs text-amber-600">{t('جنيه تقديري Claude', 'EGP est. Claude')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-800">{data.revenue?.totalCreditsRevenue || 0}</div>
            <div className="text-xs text-amber-600">{t('كريدت مباع', 'Credits sold')}</div>
          </div>
        </div>
        <p className="text-xs text-amber-500 mt-2 text-center">{t('التقدير مبني على متوسط ٦ جنيه/تقرير Claude', 'Based on avg 6 EGP/Claude report')}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════
const PAGE_SIZE = 20;

function UsersTab({ t, onSuccess, onError }: { t: T; onSuccess?: (msg?: string) => void; onError?: (msg: string) => void }) {
  const [data, setData] = useState<{ users: any[]; total: number } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [addingCredits, setAddingCredits] = useState<number | null>(null);
  const [creditsAmount, setCreditsAmount] = useState('50');
  const [addResult, setAddResult] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAmount, setBulkAmount] = useState('50');
  const [bulkReason, setBulkReason] = useState('Admin bulk add');
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(() => {
    api('wzrdAdmin.users', { search: search || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }).then(setData);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = data?.users ?? [];
    if (selectedIds.size >= ids.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids.map((u: any) => u.id)));
  };

  const handleAddCredits = async (userId: number) => {
    const amount = parseInt(creditsAmount);
    if (!amount || amount <= 0) return;
    setAddResult('Adding...');
    const r = await apiMutation('credits.adminAdd', { userId, amount, reason: 'Admin manual add' });
    if (r?.success) {
      setAddResult(`✅ +${amount}`);
      setAddingCredits(null);
      onSuccess?.();
      load();
    } else {
      setAddResult('❌');
      onError?.(t('فشل إضافة الكريدت', 'Failed to add credits'));
    }
  };

  const handleBulkAdd = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const amount = parseInt(bulkAmount);
    if (!amount || amount <= 0) return;
    setBulkLoading(true);
    const r = await apiMutation('credits.bulkAdminAdd', { userIds: ids, amount, reason: bulkReason });
    setBulkLoading(false);
    if (r?.added !== undefined) {
      setSelectedIds(new Set());
      load();
      const msg = r.failed > 0
        ? t(`تم إضافة ${r.added}، فشل ${r.failed}`, `Added ${r.added}, failed ${r.failed}`)
        : t(`تم إضافة كريدت لـ ${r.added} مستخدم`, `Added credits to ${r.added} users`);
      onSuccess?.(msg);
    } else {
      onError?.(t('فشل الإضافة الجماعية', 'Bulk add failed'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('المستخدمين', 'Public Users')} <span className="text-gray-500 text-sm font-normal">({data?.total || 0})</span></h3>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (!data?.users?.length) return;
            exportCSV('wzrd-users',
              [t('الاسم', 'Name'), t('البريد', 'Email'), t('الشركة', 'Company'), t('المجال', 'Industry'), t('الكريدت', 'Credits'), t('النشرة', 'Newsletter'), t('تاريخ التسجيل', 'Signed Up')],
              data.users.map((u: any) => [u.name, u.email, u.company, u.industry, u.credits, u.newsletterOptIn ? 'Yes' : 'No', new Date(u.createdAt).toLocaleDateString()])
            );
          }} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:text-white transition">
            ↓ {t('تصدير CSV', 'Export CSV')}
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('بحث عن مستخدم...', 'Search users...')}
            className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 w-64 outline-none focus:border-indigo-500" />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-amber-800">{selectedIds.size} {t('محدد', 'selected')}</span>
          <input type="number" value={bulkAmount} onChange={e => setBulkAmount(e.target.value)} min={1} max={5000}
            className="w-20 px-2 py-1.5 rounded-lg border border-amber-200 text-sm font-mono outline-none focus:ring-2 focus:ring-amber-500" placeholder="50" />
          <input value={bulkReason} onChange={e => setBulkReason(e.target.value)}
            className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg border border-amber-200 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder={t('سبب الإضافة', 'Reason')} />
          <button onClick={handleBulkAdd} disabled={bulkLoading}
            className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-500 disabled:opacity-50">
            {bulkLoading ? t('جاري...', '...') : `+ ${t('كريدت لـ', 'Credits to')} ${selectedIds.size}`}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-2 py-1 text-amber-700 hover:text-amber-900 text-xs">{t('إلغاء التحديد', 'Clear')}</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
              <th className="pb-2 pr-2 w-8">
                <input type="checkbox" checked={(data?.users?.length ?? 0) > 0 && selectedIds.size >= (data?.users?.length ?? 0)} onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              </th>
              <th className="pb-2 pr-4">{t('الاسم', 'Name')}</th>
              <th className="pb-2 pr-4">{t('البريد', 'Email')}</th>
              <th className="pb-2 pr-4">{t('الشركة', 'Company')}</th>
              <th className="pb-2 pr-4">{t('المجال', 'Industry')}</th>
              <th className="pb-2 pr-4 text-right">{t('الكريدت', 'Credits')}</th>
              <th className="pb-2 pr-4">{t('النشرة', 'Newsletter')}</th>
              <th className="pb-2 pr-4">{t('تاريخ التسجيل', 'Joined')}</th>
              <th className="pb-2">{t('إجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u: any, i: number) => (
              <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${selectedIds.has(u.id) ? 'bg-amber-50/50' : ''}`}>
                <td className="py-2 pr-2">
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                </td>
                <td className="py-2 pr-4 font-medium">{u.name || '—'}</td>
                <td className="py-2 pr-4 text-gray-600">{u.email}</td>
                <td className="py-2 pr-4 text-gray-500">{u.company || '—'}</td>
                <td className="py-2 pr-4 text-gray-500">{u.industry || '—'}</td>
                <td className="py-2 pr-4 text-right font-mono text-amber-600">{u.credits}</td>
                <td className="py-2 pr-4">{u.newsletterOptIn ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1">
                  {addingCredits === u.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)} 
                        className="w-16 px-2 py-1 rounded bg-gray-50 border border-gray-300 text-xs outline-none" />
                      <button onClick={() => handleAddCredits(u.id)} className="px-2 py-1 rounded bg-green-50 text-green-600 text-xs hover:bg-green-100">{t('إضافة', 'Add')}</button>
                      <button onClick={() => setAddingCredits(null)} className="px-2 py-1 rounded text-gray-400 text-xs hover:text-gray-600">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingCredits(u.id); setAddResult(''); }} 
                      className="px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs hover:bg-amber-100 transition">
                      + {t('كريدت', 'Credits')}
                    </button>
                  )}
                  <button onClick={async () => { if(confirm(t('حذف المستخدم ده؟', 'Delete this user?'))) { await apiMutation('wzrdAdmin.deleteUser', { userId: u.id }); load(); }}} className="px-2 py-1 rounded text-red-400 text-xs hover:text-red-600 hover:bg-red-50 transition">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.users?.length) && <EmptyState icon="👥" message={t('مفيش مستخدمين لسه', 'No users yet')} />}
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">{t('صفحة', 'Page')} {page + 1} / {Math.ceil(data.total / PAGE_SIZE)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-white border border-gray-200 text-xs disabled:opacity-50">{t('السابق', 'Previous')}</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= data.total} className="px-3 py-1 rounded bg-white border border-gray-200 text-xs disabled:opacity-50">{t('التالي', 'Next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CREDITS TAB
// ═══════════════════════════════════════
function CreditsTab({ t }: { t: T }) {
  const [data, setData] = useState<{ transactions: any[]; total: number } | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('wzrdAdmin.creditLog', { type: filter, limit: 100, offset: 0 }).then(setData);
  }, [filter]);

  const typeColor: Record<string, string> = {
    signup_bonus: 'text-green-600 bg-green-400/10',
    purchase: 'text-amber-600 bg-amber-400/10',
    tool_usage: 'text-red-600 bg-red-400/10',
    refund: 'text-blue-400 bg-blue-400/10',
    admin: 'text-purple-400 bg-purple-400/10',
  };

  const filterLabels: Record<string, string> = {
    all: t('الكل', 'All'),
    signup_bonus: t('مكافأة تسجيل', 'signup bonus'),
    purchase: t('شراء', 'purchase'),
    tool_usage: t('استخدام أداة', 'tool usage'),
    refund: t('استرجاع', 'refund'),
    admin: t('أدمن', 'admin'),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('الكريدت', 'Credits')} <span className="text-gray-500 text-sm font-normal">({data?.total || 0})</span></h3>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (!data?.transactions?.length) return;
            exportCSV('wzrd-credits',
              ['ID', 'User ID', 'Amount', 'Balance', 'Type', 'Tool', 'Reason', 'Date'],
              data.transactions.map((tr: any) => [tr.id, tr.userId, tr.amount, tr.balance, tr.type, tr.toolName, tr.reason, new Date(tr.createdAt).toLocaleDateString()])
            );
          }} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:text-white transition">
            ↓ {t('تصدير CSV', 'Export CSV')}
          </button>
          <div className="flex gap-1">
          {['all', 'signup_bonus', 'purchase', 'tool_usage', 'refund', 'admin'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-50 text-gray-500 hover:text-indigo-600'}`}>
              {filterLabels[f] || f.replace(/_/g, ' ')}
            </button>
          ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {(data?.transactions || []).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200/50 hover:bg-white">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${typeColor[t.type] || 'text-gray-600'}`}>{t.type}</span>
              <span className="text-sm text-gray-700">{t.reason || t.toolName || '—'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-mono text-sm font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount}
              </span>
              <span className="text-xs text-gray-400">bal: {t.balance}</span>
              <span className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {(!data?.transactions?.length) && <EmptyState icon="⚡" message={t('مفيش معاملات لسه', 'No transactions yet')} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DAILY USAGE CHART (Recharts)
// ═══════════════════════════════════════
function DailyUsageChart({ data }: { data: Array<{ date: string; runs: number; credits: number }> }) {
  const chartData = data.map(d => ({
    date: d.date?.slice(5) || '', // "MM-DD"
    runs: d.runs,
    credits: d.credits,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fill: '#64647a', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(chartData.length / 8))} />
          <YAxis tick={{ fill: '#64647a', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#111114', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Bar dataKey="runs" fill="#818cf8" radius={[3, 3, 0, 0]} name="runs" />
          <Bar dataKey="credits" fill="#c8a24e40" radius={[3, 3, 0, 0]} name="credits" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════
// TOOLS TAB
// ═══════════════════════════════════════
function ToolsTab({ t }: { t: T }) {
  const [data, setData] = useState<{ tools: any[]; dailyUsage: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.toolStats').then(setData); }, []);

  const toolIcons: Record<string, string> = {
    brand_diagnosis: '🔬', offer_check: '📦', message_check: '💬',
    presence_audit: '🌐', identity_snapshot: '🪞', launch_readiness: '🚀',
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t('تحليلات استخدام الأدوات', 'Tool Usage Analytics')}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {(data?.tools || []).map((tool: any) => (
          <div key={tool.name} className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{toolIcons[tool.name] || '🔧'}</span>
              <span className="text-sm font-medium capitalize">{tool.name?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-600">{tool.runs}</p>
            <p className="text-xs text-gray-400">{tool.creditsSpent} {t('كريدت', 'credits')}</p>
          </div>
        ))}
      </div>

      {data?.dailyUsage?.length ? (
        <div>
          <h4 className="text-sm font-bold text-gray-600 mb-2">{t('الاستخدام اليومي (30 يوم)', 'Daily Usage (30 days)')}</h4>
          <DailyUsageChart data={data.dailyUsage} />
        </div>
      ) : <p className="text-gray-400 text-sm">{t('مفيش بيانات استخدام لسه', 'No usage data yet')}</p>}
    </div>
  );
}

// ═══════════════════════════════════════
// PAYMENTS TAB
// ═══════════════════════════════════════
function PaymentsTab({ t }: { t: T }) {
  const [data, setData] = useState<{ payments: any[]; total: number } | null>(null);
  useEffect(() => { api('wzrdAdmin.payments').then(setData); }, []);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t('سجل المدفوعات', 'Payment Log')} <span className="text-gray-500 text-sm font-normal">({data?.total || 0})</span></h3>
      <div className="space-y-2">
        {(data?.payments || []).map((p: any) => {
          let meta: any = {};
          try { meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : (p.metadata || {}); } catch {}
          return (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="text-sm font-medium">{p.reason}</p>
                <p className="text-xs text-gray-400">User #{p.userId} · {meta.planId || '—'} plan</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-green-600">+{p.amount}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
        {(!data?.payments?.length) && <EmptyState icon="💳" message={t('مفيش مدفوعات لسه', 'No payments yet')} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// WEBHOOKS TAB
// ═══════════════════════════════════════
function WebhooksTab({ t }: { t: T }) {
  const [data, setData] = useState<{ events: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.webhookLog').then(setData); }, []);

  const statusColors: Record<string, string> = {
    success: 'text-green-600 bg-green-400/10',
    failed: 'text-red-600 bg-red-400/10',
    duplicate: 'text-amber-600 bg-amber-400/10',
    invalid_hmac: 'text-red-500 bg-red-50',
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t('سجل الإشعارات', 'Webhook Events')} <span className="text-gray-500 text-sm font-normal">({data?.events?.length || 0})</span></h3>
      
      {(data?.events?.length || 0) === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl">🔔</span>
          <p className="text-gray-500 text-sm mt-3">No webhook events yet</p>
          <p className="text-gray-400 text-xs mt-1">Events will appear here when Paymob sends payment notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data!.events.map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-white">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusColors[e.status] || 'text-gray-600'}`}>{e.status}</span>
                <div>
                  <p className="text-sm text-gray-700">
                    {e.status === 'success' && `✅ +${e.credits} credits → User #${e.userId} (${e.planId})`}
                    {e.status === 'failed' && `❌ Payment failed: ${e.error || 'Unknown'}`}
                    {e.status === 'duplicate' && `⏭️ Duplicate webhook — already processed`}
                    {e.status === 'invalid_hmac' && `🚫 Invalid HMAC signature — rejected`}
                  </p>
                  {e.transactionId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">txn: {e.transactionId}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {e.amountCents > 0 && <p className="text-xs text-gray-500">{(e.amountCents / 100).toFixed(0)} EGP</p>}
                <p className="text-[10px] text-gray-400">{new Date(e.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// CONFIG TAB
// ═══════════════════════════════════════
function ConfigTab({ t }: { t: T }) {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState('');
  const [pingResult, setPingResult] = useState('');
  const [nlResult, setNlResult] = useState('');
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');
  const [costSaved, setCostSaved] = useState('');

  useEffect(() => { api('wzrdAdmin.config').then(setConfig); }, []);

  const handleSaveCost = async (tool: string) => {
    const cost = parseInt(editCost);
    if (!cost || cost < 1) return;
    setCostSaved('Saving...');
    const r = await apiMutation('wzrdAdmin.updateToolCost', { toolName: tool, cost });
    if (r?.success) {
      setConfig(prev => prev ? { ...prev, toolCosts: r.toolCosts } : prev);
      setCostSaved('✅');
      setEditingTool(null);
    } else {
      setCostSaved('❌ Failed');
    }
    setTimeout(() => setCostSaved(''), 2000);
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestResult('Sending...');
    const r = await apiMutation('admin.testEmail', { to: testEmail });
    setTestResult(r?.message || 'Failed');
  };

  const handlePing = async () => {
    setPingResult('Pinging...');
    const r = await apiMutation('admin.pingLLM', {});
    setPingResult(r?.success ? `✅ ${r.provider} — ${r.responseTime}ms — "${r.reply}"` : `❌ ${r.reply}`);
  };

  const handleNewsletter = async () => {
    setNlResult('Sending...');
    const r = await apiMutation('wzrdAdmin.sendNewsletter', {});
    setNlResult(r?.success ? `✅ Sent: ${r.sent}, Failed: ${r.failed}` : '❌ Failed');
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">WZRD AI {t('الإعدادات', 'Config')}</h3>

      {/* System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`p-3 rounded-lg border text-center ${config?.groqConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-gray-500">Groq</p>
          <p className={`text-sm font-bold ${config?.groqConfigured ? 'text-green-600' : 'text-red-600'}`}>{config?.groqConfigured ? t('مفعّل', 'Configured') : t('غير مفعّل', 'Not configured')}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.claudeConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-gray-200 bg-white'}`}>
          <p className="text-xs text-gray-500">Claude</p>
          <p className={`text-sm font-bold ${config?.claudeConfigured ? 'text-green-600' : 'text-gray-400'}`}>{config?.claudeConfigured ? t('مفعّل', 'Configured') : '— Optional'}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.paymobConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-gray-500">Paymob</p>
          <p className={`text-sm font-bold ${config?.paymobConfigured ? 'text-green-600' : 'text-red-600'}`}>{config?.paymobConfigured ? t('مفعّل', 'Configured') : t('غير مفعّل', 'Not configured')}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.emailProvider !== 'none' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-gray-500">{t('البريد', 'Email')}</p>
          <p className={`text-sm font-bold ${config?.emailProvider !== 'none' ? 'text-green-600' : 'text-red-600'}`}>{config?.emailProvider !== 'none' ? t('مفعّل', 'Configured') : t('غير مفعّل', 'Not configured')}</p>
        </div>
      </div>

      {/* Tool Costs (editable) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-bold text-gray-600">{t('تكلفة الأدوات', 'Tool Costs')} ({t('كريدت', 'credits')})</h4>
          {costSaved && <span className="text-xs text-green-600">{costSaved}</span>}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {config?.toolCosts && Object.entries(config.toolCosts).map(([tool, cost]) => (
            <div key={tool} className="p-2 rounded-lg border border-gray-200 bg-white text-center cursor-pointer hover:border-amber-500/30 transition"
              onClick={() => { if (editingTool !== tool) { setEditingTool(tool); setEditCost(String(cost)); } }}>
              <p className="text-[10px] text-gray-400 capitalize">{tool.replace(/_/g, ' ')}</p>
              {editingTool === tool ? (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveCost(tool); if (e.key === 'Escape') setEditingTool(null); }}
                    className="w-12 text-center text-sm font-mono bg-gray-100 border border-amber-500/30 rounded px-1 py-0.5 text-white outline-none" autoFocus />
                  <button onClick={() => handleSaveCost(tool)} className="text-green-600 text-xs hover:text-green-300">✓</button>
                </div>
              ) : (
                <p className="text-lg font-bold font-mono text-amber-600">{cost as number}</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Click a cost to edit · Signup bonus: {config?.signupBonus} · Daily cap: {config?.dailyCreditCap}/day</p>
      </div>

      {/* Credit Plans */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-600 mb-2">Credit Plans (EGP)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {config?.creditPlans?.plans?.map((p: { id: string; priceEGP: number; credits: number; name?: string }) => (
            <div key={p.id} className="p-3 rounded-lg border border-gray-200 bg-white text-center">
              <p className="text-xs text-gray-500 truncate" title={p.id}>{p.name || p.id}</p>
              <p className="text-lg font-bold text-gray-900">{p.priceEGP} EGP</p>
              <p className="text-xs text-amber-600">{p.credits} credits</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <h4 className="text-sm font-bold mb-2">🧪 {t('إرسال بريد تجريبي', 'Test Email')}</h4>
          <div className="flex gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none" />
            <button onClick={handleTestEmail} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">{t('إرسال', 'Send')}</button>
          </div>
          {testResult && <p className="text-xs text-gray-600 mt-2">{testResult}</p>}
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <h4 className="text-sm font-bold mb-2">🤖 {t('اختبار الـ AI', 'Ping LLM')}</h4>
          <button onClick={handlePing} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 transition">Ping</button>
          {pingResult && <p className="text-xs text-gray-600 mt-2">{pingResult}</p>}
        </div>

        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <h4 className="text-sm font-bold mb-2">📬 {t('إرسال النشرة', 'Send Newsletter')}</h4>
          <button onClick={handleNewsletter} className="px-4 py-2 rounded-lg bg-amber-500 text-gray-900 text-sm font-bold hover:bg-amber-400 transition">{t('إرسال لكل المشتركين', 'Send to All Subscribers')}</button>
          {nlResult && <p className="text-xs text-gray-600 mt-2">{nlResult}</p>}
        </div>

        <EmailStatsSection t={t} />
      </div>
    </div>
  );
}

/** Email analytics mini-panel */
function EmailStatsSection({ t }: { t: T }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { api('wzrdAdmin.emailStats').then(setStats); }, []);

  if (!stats) return null;
  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold text-gray-600 mb-3">📧 {t('تحليلات البريد', 'Email Analytics')}</h4>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Sent" value={stats.totalSent} icon="✓" accent="border-l-green-500" gradient="from-green-50/50 to-white" />
        <StatCard label="Failed" value={stats.totalFailed} icon="✕" accent="border-l-red-500" gradient="from-red-50/50 to-white" />
        <StatCard label="Skipped" value={stats.totalSkipped} icon="—" accent="border-l-gray-400" gradient="from-gray-50 to-white" />
      </div>
      {Object.keys(stats.byTemplate || {}).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">By Template</p>
          <div className="space-y-1">
            {Object.entries(stats.byTemplate).map(([tmpl, data]: [string, any]) => (
              <div key={tmpl} className="flex items-center justify-between p-2 rounded-lg border border-gray-200/50">
                <span className="text-xs text-gray-600 capitalize">{tmpl}</span>
                <div className="flex gap-3">
                  <span className="text-xs text-green-600">{data.sent} sent</span>
                  <span className="text-xs text-red-600">{data.failed} failed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats.recentEmails?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent Emails</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {stats.recentEmails.slice(0, 20).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-200/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={e.status === 'sent' ? 'text-green-600' : e.status === 'failed' ? 'text-red-600' : 'text-gray-400'}>
                    {e.status === 'sent' ? '✓' : e.status === 'failed' ? '✕' : '—'}
                  </span>
                  <span className="text-gray-600 truncate">{e.to}</span>
                </div>
                <span className="text-gray-400 flex-shrink-0 ml-2">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// CMS TAB — Homepage + Site Settings
// ═══════════════════════════════════════
function CmsTab({ t, onSuccess, onError }: { t: T; onSuccess?: () => void; onError?: (msg: string) => void }) {
  const [sc, setSc] = useState<any>(null);
  const [saving, setSaving] = useState('');

  useEffect(() => { api('wzrdAdmin.siteConfig').then(setSc); }, []);

  const saveHomepage = async () => {
    if (!sc) return;
    setSaving('Saving...');
    const ok = await apiMutation('wzrdAdmin.updateHomepage', sc.homepage);
    if (ok !== null) { setSaving('✅ Saved'); onSuccess?.(); } else { setSaving(''); onError?.(t('فشل الحفظ', 'Save failed')); }
    setTimeout(() => setSaving(''), 2000);
  };

  const saveSite = async () => {
    if (!sc) return;
    setSaving('Saving...');
    const ok = await apiMutation('wzrdAdmin.updateSiteSettings', sc.site);
    if (ok !== null) { setSaving('✅ Saved'); onSuccess?.(); } else { setSaving(''); onError?.(t('فشل الحفظ', 'Save failed')); }
    setTimeout(() => setSaving(''), 2000);
  };

  if (!sc) return <p className="text-gray-500 text-sm animate-pulse">{t('جاري التحميل...', 'Loading...')}</p>;

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('إدارة المحتوى', 'Content Management')}</h3>
        {saving && <span className="text-xs text-green-600">{saving}</span>}
      </div>

      {/* Homepage */}
      <div className="mb-6 p-5 rounded-2xl border border-gray-200 bg-white">
        <h4 className="text-sm font-bold text-gray-600 mb-3">🏠 {t('الصفحة الرئيسية', 'Homepage')}</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t('عنوان الهيرو (EN)', 'Hero Title (EN)')} value={sc.homepage.heroTitle} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroTitle: v}})} />
          <Field label={t('عنوان الهيرو (AR)', 'Hero Title (AR)')} value={sc.homepage.heroTitleAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroTitleAr: v}})} />
          <Field label="Subtitle (EN)" value={sc.homepage.heroSubtitle} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroSubtitle: v}})} />
          <Field label="Subtitle (AR)" value={sc.homepage.heroSubtitleAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroSubtitleAr: v}})} />
          <Field label="CTA Text (EN)" value={sc.homepage.ctaText} onChange={v => setSc({...sc, homepage: {...sc.homepage, ctaText: v}})} />
          <Field label="CTA Text (AR)" value={sc.homepage.ctaTextAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, ctaTextAr: v}})} />
        </div>
        <button onClick={saveHomepage} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">{t('حفظ الرئيسية', 'Save Homepage')}</button>
      </div>

      {/* Site Settings */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white">
        <h4 className="text-sm font-bold text-gray-600 mb-3">🌐 {t('إعدادات الموقع', 'Site Settings')}</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Company Name" value={sc.site.companyName} onChange={v => setSc({...sc, site: {...sc.site, companyName: v}})} />
          <Field label="WhatsApp" value={sc.site.whatsapp} onChange={v => setSc({...sc, site: {...sc.site, whatsapp: v}})} />
          <Field label="Email" value={sc.site.email} onChange={v => setSc({...sc, site: {...sc.site, email: v}})} />
          <Field label="Instagram" value={sc.site.instagram} onChange={v => setSc({...sc, site: {...sc.site, instagram: v}})} />
          <Field label="LinkedIn" value={sc.site.linkedin} onChange={v => setSc({...sc, site: {...sc.site, linkedin: v}})} />
          <Field label="Website" value={sc.site.website} onChange={v => setSc({...sc, site: {...sc.site, website: v}})} />
          <Field label="Tagline (EN)" value={sc.site.taglineEn} onChange={v => setSc({...sc, site: {...sc.site, taglineEn: v}})} />
          <Field label="Tagline (AR)" value={sc.site.taglineAr} onChange={v => setSc({...sc, site: {...sc.site, taglineAr: v}})} />
        </div>
        <button onClick={saveSite} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">{t('حفظ الإعدادات', 'Save Settings')}</button>
      </div>

      {/* Services */}
      <div className="mt-6 p-5 rounded-2xl border border-gray-200 bg-white">
        <h4 className="text-sm font-bold text-gray-600 mb-3">📦 {t('الخدمات', 'Services')}</h4>
        <div className="space-y-2">
          {sc.services?.services?.map((svc: any) => (
            <div key={svc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200/50">
              <div>
                <p className="text-sm font-medium">{svc.nameEn} <span className="text-gray-500">/ {svc.nameAr}</span></p>
                <p className="text-[10px] text-gray-400 uppercase">{svc.tier} tier</p>
              </div>
              <button onClick={async () => {
                const newEnabled = !svc.enabled;
                await apiMutation('wzrdAdmin.updateService', { serviceId: svc.id, enabled: newEnabled });
                setSc({...sc, services: {...sc.services, services: sc.services.services.map((s: any) => s.id === svc.id ? {...s, enabled: newEnabled} : s)}});
              }} className={`px-3 py-1 rounded-full text-xs font-bold ${svc.enabled ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {svc.enabled ? t('نشط', 'Active') : t('معطّل', 'Disabled')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PRICING TAB — Credit Plans + Promo Codes
// ═══════════════════════════════════════
function PricingTab({ t, onSuccess, onError }: { t: T; onSuccess?: () => void; onError?: (m: string) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, any>>({});
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<Record<string, any>>({ id: '', credits: 500, priceEGP: 499, name: '', nameAr: '' });
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState('');

  const load = useCallback(async () => {
    const [pRes, pcRes] = await Promise.all([
      api('wzrdAdmin.creditPlansList'),
      api('wzrdAdmin.promoCodeList'),
    ]);
    setPlans(pRes?.plans || []);
    setPromoCodes(pcRes?.codes || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const savePlan = async (planId: string, updates: any) => {
    setSaving('Saving...');
    await apiMutation('wzrdAdmin.updateCreditPlan', { planId, ...updates });
    setEditingPlan(null);
    setSaving('✅');
    onSuccess?.();
    load();
    setTimeout(() => setSaving(''), 2000);
  };

  const removePlan = async (planId: string) => {
    if (!confirm(t('حذف الباقة؟', 'Delete this plan?'))) return;
    await apiMutation('wzrdAdmin.removeCreditPlan', { planId });
    load();
    onSuccess?.();
  };

  const createPromo = async () => {
    if (!promoForm.code?.trim()) { onError?.(t('الكود مطلوب', 'Code required')); return; }
    setSaving('...');
    await apiMutation('wzrdAdmin.promoCodeCreate', {
      code: promoForm.code.trim(),
      discountType: promoForm.discountType || 'percent',
      discountValue: parseInt(promoForm.discountValue) || 10,
      minAmountEGP: parseInt(promoForm.minAmountEGP) || 0,
      maxUses: promoForm.maxUses ? parseInt(promoForm.maxUses) : null,
      validUntil: promoForm.validUntil || null,
    });
    setShowPromoForm(false);
    setPromoForm({});
    setSaving('✅');
    load();
    onSuccess?.();
    setTimeout(() => setSaving(''), 2000);
  };

  const togglePromo = async (id: number, enabled: number) => {
    await apiMutation('wzrdAdmin.promoCodeUpdate', { id, enabled });
    load();
  };

  const deletePromo = async (id: number) => {
    if (!confirm(t('حذف الكود؟', 'Delete this promo?'))) return;
    await apiMutation('wzrdAdmin.promoCodeDelete', { id });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('الباقات وأكواد الخصم', 'Plans & Promo Codes')}</h3>
        {saving && <span className="text-xs text-green-600">{saving}</span>}
      </div>

      {/* Credit Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-600">📦 {t('باقات الكريدت', 'Credit Plans')}</h4>
          <button onClick={() => setShowAddPlan(true)} className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-bold">+ {t('باقة جديدة', 'New Plan')}</button>
        </div>
        {showAddPlan && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 mb-4 flex flex-wrap gap-2 items-center">
            <input placeholder="ID (en)" value={newPlan.id} onChange={e => setNewPlan({...newPlan, id: e.target.value})} className="px-2 py-1 rounded border text-sm w-24" />
            <input type="number" placeholder="Credits" value={newPlan.credits} onChange={e => setNewPlan({...newPlan, credits: parseInt(e.target.value) || 0})} className="px-2 py-1 rounded border text-sm w-20" />
            <input type="number" placeholder="EGP" value={newPlan.priceEGP} onChange={e => setNewPlan({...newPlan, priceEGP: parseInt(e.target.value) || 0})} className="px-2 py-1 rounded border text-sm w-20" />
            <input placeholder="Name (EN)" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="px-2 py-1 rounded border text-sm w-28" />
            <input placeholder="Name (AR)" value={newPlan.nameAr} onChange={e => setNewPlan({...newPlan, nameAr: e.target.value})} className="px-2 py-1 rounded border text-sm w-28" />
            <button onClick={async () => { if (newPlan.id && newPlan.name) { await apiMutation('wzrdAdmin.updateCreditPlan', { planId: newPlan.id, credits: newPlan.credits, priceEGP: newPlan.priceEGP, name: newPlan.name, nameAr: newPlan.nameAr }); setNewPlan({ id: '', credits: 500, priceEGP: 499, name: '', nameAr: '' }); setShowAddPlan(false); load(); onSuccess?.(); }}} className="px-3 py-1 rounded bg-green-600 text-white text-xs">✓</button>
            <button onClick={() => setShowAddPlan(false)} className="px-3 py-1 rounded text-gray-500 text-xs">✕</button>
          </div>
        )}
        <div className="space-y-2">
          {plans.map((p: any) => (
            <div key={p.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
              {editingPlan === p.id ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <input value={editDraft.credits ?? p.credits} onChange={e => setEditDraft({...editDraft, credits: parseInt(e.target.value) || 0})} type="number" className="w-20 px-2 py-1 rounded border text-sm" placeholder="Credits" />
                  <input value={editDraft.priceEGP ?? p.priceEGP} onChange={e => setEditDraft({...editDraft, priceEGP: parseInt(e.target.value) || 0})} type="number" className="w-20 px-2 py-1 rounded border text-sm" placeholder="EGP" />
                  <input value={editDraft.name ?? p.name} onChange={e => setEditDraft({...editDraft, name: e.target.value})} className="w-28 px-2 py-1 rounded border text-sm" placeholder="Name EN" />
                  <input value={editDraft.nameAr ?? p.nameAr} onChange={e => setEditDraft({...editDraft, nameAr: e.target.value})} className="w-28 px-2 py-1 rounded border text-sm" placeholder="Name AR" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={Boolean(editDraft.popular ?? p.popular)} onChange={e => setEditDraft({ ...editDraft, popular: e.target.checked })} />
                    {t('مميز', 'Popular')}
                  </label>
                  <button onClick={() => { savePlan(p.id, { credits: editDraft.credits ?? p.credits, priceEGP: editDraft.priceEGP ?? p.priceEGP, name: editDraft.name ?? p.name, nameAr: editDraft.nameAr ?? p.nameAr, descEn: editDraft.descEn ?? p.descEn, descAr: editDraft.descAr ?? p.descAr, popular: editDraft.popular ?? p.popular }); setEditDraft({}); setEditingPlan(null); }} className="px-3 py-1 rounded bg-green-600 text-white text-xs">✓</button>
                  <button onClick={() => { setEditingPlan(null); setEditDraft({}); }} className="px-3 py-1 rounded text-gray-500 text-xs">✕</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">{p.name}</span> <span className="text-gray-500">/ {p.nameAr}</span>
                    <span className="ml-2 text-amber-600 font-mono">{p.credits} {t('نقطة', 'credits')}</span>
                    <span className="ml-2 text-gray-600 font-mono">{p.priceEGP} EGP</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingPlan(p.id); setEditDraft({ credits: p.credits, priceEGP: p.priceEGP, name: p.name, nameAr: p.nameAr, descEn: p.descEn, descAr: p.descAr, popular: p.popular }); }} className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-xs">{t('تعديل', 'Edit')}</button>
                    <button onClick={() => removePlan(p.id)} className="px-2 py-1 rounded text-red-500 text-xs hover:bg-red-50">🗑</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Promo Codes */}
      <div>
        <h4 className="text-sm font-bold text-gray-600 mb-3">🏷️ {t('أكواد الخصم', 'Promo Codes')}</h4>
        <button onClick={() => setShowPromoForm(true)} className="mb-3 px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold">+ {t('كود جديد', 'New Code')}</button>
        {showPromoForm && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 mb-4 space-y-2">
            <input placeholder={t('كود الخصم', 'Promo code')} value={promoForm.code || ''} onChange={e => setPromoForm({...promoForm, code: e.target.value})} className="px-3 py-2 rounded border text-sm w-40" />
            <select value={promoForm.discountType || 'percent'} onChange={e => setPromoForm({...promoForm, discountType: e.target.value})} className="px-3 py-2 rounded border text-sm">
              <option value="percent">{t('نسبة مئوية', 'Percent')} (%)</option>
              <option value="fixed">{t('مبلغ ثابت', 'Fixed EGP')}</option>
            </select>
            <input type="number" placeholder={t('القيمة', 'Value')} value={promoForm.discountValue || ''} onChange={e => setPromoForm({...promoForm, discountValue: e.target.value})} className="px-3 py-2 rounded border text-sm w-20" />
            <input type="number" placeholder={t('الحد الأدنى EGP', 'Min EGP')} value={promoForm.minAmountEGP || ''} onChange={e => setPromoForm({...promoForm, minAmountEGP: e.target.value})} className="px-3 py-2 rounded border text-sm w-24" />
            <input type="number" placeholder={t('أقصى استخدامات', 'Max uses')} value={promoForm.maxUses || ''} onChange={e => setPromoForm({...promoForm, maxUses: e.target.value})} className="px-3 py-2 rounded border text-sm w-24" />
            <input type="date" placeholder="Valid until" value={promoForm.validUntil || ''} onChange={e => setPromoForm({...promoForm, validUntil: e.target.value})} className="px-3 py-2 rounded border text-sm" />
            <div className="flex gap-2">
              <button onClick={createPromo} className="px-4 py-2 rounded bg-green-600 text-white text-sm font-bold">✓ {t('إضافة', 'Add')}</button>
              <button onClick={() => setShowPromoForm(false)} className="px-4 py-2 rounded text-gray-500 text-sm">✕</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {promoCodes.map((pc: any) => (
            <div key={pc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
              <div>
                <span className="font-mono font-bold">{pc.code}</span>
                <span className="mx-2 text-gray-500">{pc.discountType === 'percent' ? `${pc.discountValue}%` : `${pc.discountValue} EGP`}</span>
                <span className="text-xs text-gray-400">({pc.usedCount}/{pc.maxUses ?? '∞'})</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePromo(pc.id, pc.enabled ? 0 : 1)} className={`px-2 py-1 rounded text-xs ${pc.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {pc.enabled ? t('نشط', 'On') : t('معطّل', 'Off')}
                </button>
                <button onClick={() => deletePromo(pc.id)} className="px-2 py-1 rounded text-red-400 text-xs">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PROMPTS TAB — AI tool system prompts
// ═══════════════════════════════════════
function PromptsTab({ t }: { t: T }) {
  const [sc, setSc] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState('');
  const [testResult, setTestResult] = useState<{ loading?: boolean; error?: string; reply?: string; model?: string } | null>(null);
  const [testSampleInput, setTestSampleInput] = useState('');

  useEffect(() => { api('wzrdAdmin.siteConfig').then(setSc); }, []);

  const savePrompt = async (toolId: string) => {
    setSaving('Saving...');
    await apiMutation('wzrdAdmin.updatePrompt', { toolId, systemPrompt: draft });
    setSc({...sc, prompts: sc.prompts.map((p: any) => p.toolId === toolId ? {...p, systemPrompt: draft} : p)});
    setEditing(null);
    setSaving('✅');
    setTimeout(() => setSaving(''), 2000);
  };

  const handleTest = async (toolId: string) => {
    setTestResult({ loading: true });
    const r = await apiMutation('wzrdAdmin.testPrompt', { toolId, sampleInput: testSampleInput.trim() || undefined });
    if (r?.success && r.reply) {
      setTestResult({ reply: r.reply, model: r.model ?? undefined });
    } else {
      setTestResult({ error: r?.error || t('فشل الاختبار', 'Test failed') });
    }
  };

  if (!sc) return <LoadingSkeleton />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('أوامر أدوات الـ AI', 'AI Tool Prompts')}</h3>
        {saving && <span className="text-xs text-green-600">{saving}</span>}
      </div>
      <p className="text-xs text-gray-500 mb-4">{t('عدّل الأمر اللي كل أداة بتستخدمه. التعديلات بتطبق فوراً.', 'Edit the system prompt each AI tool uses. Changes take effect immediately.')}</p>

      <div className="space-y-3">
        {sc.prompts?.map((p: any) => (
          <div key={p.toolId} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(prev => ({ ...prev, [p.toolId]: !prev[p.toolId] }))} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{p.toolName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.enabled ? t('نشط', 'Active') : t('معطّل', 'Disabled')}
                </span>
                <span className="text-[10px] text-gray-400">({(p.systemPrompt?.length || 0)} {t('حرف', 'chars')})</span>
              </div>
              <span className="text-gray-400">{expanded[p.toolId] ? '▼' : '▶'}</span>
            </button>
            {expanded[p.toolId] && (
              <div className="p-4 pt-0 border-t border-gray-100">
                <div className="flex gap-2 mb-2">
                  <button onClick={async () => { await apiMutation('wzrdAdmin.updatePrompt', { toolId: p.toolId, enabled: !p.enabled }); setSc({...sc, prompts: sc.prompts.map((x: any) => x.toolId === p.toolId ? {...x, enabled: !x.enabled} : x)}); }} className="text-xs text-gray-500 hover:text-amber-600 transition">
                    {p.enabled ? t('تعطيل', 'Disable') : t('تفعيل', 'Enable')}
                  </button>
                  <button onClick={() => { setEditing(p.toolId); setDraft(p.systemPrompt); }} className="text-xs text-indigo-600 hover:text-indigo-600 transition">
                    {t('تعديل', 'Edit Prompt')}
                  </button>
                </div>
                {editing === p.toolId ? (
                  <div>
                    <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={8}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-indigo-200 text-xs text-gray-700 font-mono outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                    <p className="text-[10px] text-gray-400 mt-1">{draft.length} {t('حرف', 'chars')}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => savePrompt(p.toolId)} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-600 text-xs font-bold">{t('حفظ', 'Save')}</button>
                      <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-gray-500 text-xs">{t('إلغاء', 'Cancel')}</button>
                    </div>
                  </div>
                ) : null}
                {/** Test section — available when expanded */}
                {expanded[p.toolId] && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{t('اختبار الأمر', 'Test Prompt')}</p>
                    <textarea value={testSampleInput} onChange={e => setTestSampleInput(e.target.value)} rows={2} placeholder={t('نص تجريبي (اختياري)', 'Sample input (optional)')}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-cyan-500 resize-y mb-2" />
                    <div className="flex gap-2 items-center">
                      <button onClick={() => handleTest(p.toolId)} disabled={testResult?.loading}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-600 text-xs font-bold hover:bg-cyan-500/30 disabled:opacity-50">
                        {testResult?.loading ? t('جاري...', 'Testing...') : t('تشغيل', 'Run Test')}
                      </button>
                      {testResult?.reply && (
                        <div className="flex-1 p-3 rounded-lg bg-cyan-50/50 border border-cyan-200 text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {testResult.reply}
                          {testResult.model && <p className="text-[10px] text-gray-400 mt-1">Model: {testResult.model}</p>}
                        </div>
                      )}
                      {testResult?.error && <p className="text-xs text-red-600">{testResult.error}</p>}
                    </div>
                  </div>
                )}
                {editing !== p.toolId && expanded[p.toolId] && (
                  <p className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap">{p.systemPrompt}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TEAM TAB — Internal users
// ═══════════════════════════════════════
function TeamTab({ t }: { t: T }) {
  const [data, setData] = useState<{ team: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.teamList').then(setData); }, []);

  const changeRole = async (userId: number, role: string) => {
    await apiMutation('wzrdAdmin.updateTeamRole', { userId, role });
    setData(prev => prev ? { team: prev.team.map(u => u.id === userId ? {...u, role} : u) } : prev);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{t('أعضاء الفريق', 'Team Members')} <span className="text-gray-500 text-sm font-normal">({data?.team?.length || 0})</span></h3>

      <div className="space-y-2">
        {(data?.team || []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
            <div>
              <p className="text-sm font-medium">{u.name || 'Unnamed'}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-white outline-none">
                <option value="admin">{t('أدمن', 'Admin')}</option>
                <option value="user">{t('مستخدم', 'User')}</option>
              </select>
              <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {(!data?.team?.length) && <p className="text-gray-400 text-sm py-8 text-center">{t('مفيش أعضاء لسه', 'No team members yet')}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// AGENCY TAB — Clients + Projects overview
// ═══════════════════════════════════════
function AgencyTab({ t, onSuccess, onError }: { t: T; onSuccess?: () => void; onError?: (msg: string) => void }) {
  const [clientsList, setClientsList] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<any>(null);
  const [view, setView] = useState<'clients' | 'projects'>('clients');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const reload = () => {
    api('wzrdAdmin.agencyClients').then(setClientsList);
    api('wzrdAdmin.agencyProjects').then(setProjectsList);
  };
  useEffect(() => { reload(); }, []);

  const addClient = async () => {
    if (!form.name) { setMsg(t('الاسم مطلوب', 'Name required')); return; }
    const ok = await apiMutation('wzrdAdmin.addClient', form);
    if (ok !== null) { setForm({}); setShowForm(false); setMsg('✅ ' + t('تم الإضافة', 'Added')); onSuccess?.(); reload(); } else { onError?.(t('فشل الإضافة', 'Add failed')); }
    setTimeout(() => setMsg(''), 2000);
  };

  const updateStatus = async (id: number, status: string, type: 'client' | 'project') => {
    if (type === 'client') await apiMutation('wzrdAdmin.updateClient', { id, status });
    else await apiMutation('wzrdAdmin.updateProject', { id, status });
    reload();
  };

  const deleteClient = async (id: number) => {
    if (!confirm(t('حذف العميل ده؟', 'Delete this client?'))) return;
    await apiMutation('wzrdAdmin.deleteClient', { id });
    reload();
  };

  const addProject = async () => {
    if (!form.projectName || !form.clientId) { setMsg(t('الاسم والعميل مطلوبين', 'Name and client required')); return; }
    const ok = await apiMutation('wzrdAdmin.addProject', {
      name: form.projectName,
      clientId: parseInt(form.clientId),
      serviceType: form.serviceType || 'consultation',
    });
    if (ok !== null) { setForm({}); setShowForm(false); setMsg('✅ ' + t('تم الإضافة', 'Added')); onSuccess?.(); reload(); } else { onError?.(t('فشل الإضافة', 'Add failed')); }
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t('الوكالة', 'Agency')} <span className="text-gray-400 text-sm font-normal">{t('إدارة العملاء والمشاريع', 'Clients & Projects')}</span></h3>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <button onClick={() => setView('clients')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${view === 'clients' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t('العملاء', 'Clients')} ({clientsList?.total || 0})
            </button>
            <button onClick={() => setView('projects')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${view === 'projects' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t('المشاريع', 'Projects')} ({projectsList?.total || 0})
            </button>
          </div>
          <button onClick={() => { setShowForm(!showForm); setForm({}); }} className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-600 text-white hover:bg-green-500 transition">
            + {view === 'clients' ? t('عميل جديد', 'New Client') : t('مشروع جديد', 'New Project')}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}

      {/* Add Form */}
      {showForm && view === 'clients' && (
        <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/50 mb-4 space-y-3">
          <h4 className="text-sm font-bold text-indigo-700">{t('إضافة عميل جديد', 'Add New Client')}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="الاسم *" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="اسم الشركة" value={form.companyName || ''} onChange={e => setForm({...form, companyName: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="البريد الإلكتروني" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="رقم الهاتف" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <input placeholder="المجال" value={form.industry || ''} onChange={e => setForm({...form, industry: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <select value={form.market || 'egypt'} onChange={e => setForm({...form, market: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="egypt">مصر</option><option value="ksa">السعودية</option><option value="uae">الإمارات</option><option value="other">أخرى</option>
            </select>
          </div>
          <textarea placeholder="ملاحظات" value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400" rows={2} />
          <div className="flex gap-2">
            <button onClick={addClient} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500">{t('إضافة', 'Add')}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-gray-500 text-sm">{t('إلغاء', 'Cancel')}</button>
          </div>
        </div>
      )}

      {showForm && view === 'projects' && (
        <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/50 mb-4 space-y-3">
          <h4 className="text-sm font-bold text-indigo-700">{t('إضافة مشروع جديد', 'Add New Project')}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="اسم المشروع *" value={form.projectName || ''} onChange={e => setForm({...form, projectName: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <select value={form.clientId || ''} onChange={e => setForm({...form, clientId: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="">اختر العميل *</option>
              {(clientsList?.clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={form.serviceType || 'consultation'} onChange={e => setForm({...form, serviceType: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
              <option value="business_health_check">فحص صحة البراند</option>
              <option value="brand_identity">هوية بصرية</option>
              <option value="starting_business_logic">إطار رسائل</option>
              <option value="business_takeoff">نظام إطلاق</option>
              <option value="consultation">استشارة</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addProject} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500">{t('إضافة', 'Add')}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-gray-500 text-sm">{t('إلغاء', 'Cancel')}</button>
          </div>
        </div>
      )}

      {/* Status summary */}
      {projectsList?.byStatus && Object.keys(projectsList.byStatus).length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(projectsList.byStatus).map(([status, count]) => (
            <StatCard key={status} label={t(status === 'active' ? 'نشط' : status === 'completed' ? 'مكتمل' : status === 'paused' ? 'متوقف' : status === 'cancelled' ? 'ملغي' : status, status)} value={count as number} icon="📊" accent={status === 'active' ? 'border-l-green-500' : status === 'completed' ? 'border-l-blue-500' : 'border-l-gray-400'} gradient={status === 'active' ? 'from-green-50/50 to-white' : status === 'completed' ? 'from-blue-50/50 to-white' : 'from-gray-50 to-white'} />
          ))}
        </div>
      )}

      {/* Lists */}
      {view === 'clients' ? (
        <div className="space-y-2">
          {(clientsList?.clients || []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
              <div>
                <p className="text-sm font-medium">{c.name} {c.company && <span className="text-gray-400">· {c.company}</span>}</p>
                <p className="text-xs text-gray-500">{c.email || ''} · {c.industry || ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={c.status} onChange={e => updateStatus(c.id, e.target.value, 'client')} className="px-2 py-1 rounded-full border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="lead">{t('ليد', 'Lead')}</option><option value="active">{t('نشط', 'Active')}</option><option value="completed">{t('مكتمل', 'Completed')}</option><option value="paused">{t('متوقف', 'Paused')}</option>
                </select>
                <button onClick={() => deleteClient(c.id)} className="text-xs text-red-400 hover:text-red-600 transition">🗑</button>
              </div>
            </div>
          ))}
          {(!clientsList?.clients?.length) && <p className="text-gray-400 text-sm py-8 text-center">{t('مفيش عملاء لسه', 'No clients yet')}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {(projectsList?.projects || []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">المرحلة: {p.stage} · عميل #{p.clientId}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={p.status} onChange={e => updateStatus(p.id, e.target.value, 'project')} className="px-2 py-1 rounded-full border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="active">{t('نشط', 'Active')}</option><option value="paused">{t('متوقف', 'Paused')}</option><option value="completed">{t('مكتمل', 'Completed')}</option><option value="cancelled">{t('ملغي', 'Cancelled')}</option>
                </select>
              </div>
            </div>
          ))}
          {(!projectsList?.projects?.length) && <p className="text-gray-400 text-sm py-8 text-center">{t('مفيش مشاريع لسه', 'No projects yet')}</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// REQUESTS ADMIN TAB
// ═══════════════════════════════════════

const STATUS_OPTIONS = [
  { value: 'received', ar: 'تم الاستلام', en: 'Received', icon: '📩' },
  { value: 'reviewing', ar: 'مراجعة', en: 'Reviewing', icon: '👀' },
  { value: 'info_needed', ar: 'محتاج معلومات', en: 'Info Needed', icon: '❓' },
  { value: 'meeting_scheduled', ar: 'اجتماع محدد', en: 'Meeting Set', icon: '📅' },
  { value: 'in_progress', ar: 'جاري التنفيذ', en: 'In Progress', icon: '⚙️' },
  { value: 'internal_review', ar: 'مراجعة داخلية', en: 'Internal Review', icon: '🔍' },
  { value: 'revision', ar: 'تعديلات', en: 'Revision', icon: '✏️' },
  { value: 'ready_for_delivery', ar: 'جاهز للتسليم', en: 'Ready', icon: '📦' },
  { value: 'delivered', ar: 'تم التسليم', en: 'Delivered', icon: '✅' },
  { value: 'completed', ar: 'مكتمل', en: 'Completed', icon: '🏆' },
];

function RequestsAdminTab({ t }: { t: T }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [updateForm, setUpdateForm] = useState({
    newStatus: '', title: '', titleAr: '', detail: '', detailAr: '',
    estimatedDelivery: '', fileUrl: '', fileName: '', meetingLink: '', meetingDate: '',
    isClientVisible: true,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api('serviceRequest.listAll');
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadTimeline = async (req: any) => {
    setSelected(req);
    setUpdateForm(f => ({ ...f, newStatus: req.status }));
    const data = await api('serviceRequest.getTimeline', { requestId: req.id });
    setTimeline(data?.updates || []);
  };

  const submitUpdate = async () => {
    if (!updateForm.newStatus || !updateForm.title || !updateForm.titleAr) return;
    setSaving(true);
    try {
      await apiMutation('serviceRequest.updateStatus', {
        requestId: selected.id,
        ...updateForm,
      });
      await load();
      await loadTimeline({ ...selected, status: updateForm.newStatus });
      setUpdateForm(f => ({ ...f, title: '', titleAr: '', detail: '', detailAr: '', fileUrl: '', fileName: '', meetingLink: '', meetingDate: '' }));
    } catch {}
    setSaving(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">{t('طلبات العملاء', 'Client Requests')}</h2>
        <span className="text-sm text-gray-400">{requests.length} {t('طلب', 'requests')}</span>
      </div>

      {selected ? (
        /* Detail View */
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="text-sm text-indigo-600 hover:underline">
            {t('← رجوع', '← Back')}
          </button>

          {/* Request info */}
          <div className="p-5 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-gray-400">#{selected.requestNumber}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                backgroundColor: (selected.statusLabel?.color || '#6366f1') + '20',
                color: selected.statusLabel?.color || '#6366f1'
              }}>
                {selected.statusLabel?.icon} {t(selected.statusLabel?.ar, selected.statusLabel?.en)}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900">{t(selected.serviceTypeAr, selected.serviceType)}</h3>
            <p className="text-xs text-gray-400 mt-1">User #{selected.userId} · {new Date(selected.createdAt).toLocaleDateString()}</p>
            {selected.description && <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">{selected.description}</p>}
          </div>

          {/* Status Update Form */}
          <div className="p-5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50">
            <h4 className="text-sm font-bold text-indigo-800 mb-3">{t('تحديث الحالة', 'Update Status')}</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('الحالة الجديدة', 'New Status')}</label>
                <select value={updateForm.newStatus} onChange={e => setUpdateForm({ ...updateForm, newStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.icon} {t(s.ar, s.en)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('موعد التسليم', 'Est. Delivery')}</label>
                <input type="date" value={updateForm.estimatedDelivery} onChange={e => setUpdateForm({ ...updateForm, estimatedDelivery: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('العنوان (عربي)', 'Title (Arabic)')}</label>
                <input value={updateForm.titleAr} onChange={e => setUpdateForm({ ...updateForm, titleAr: e.target.value })}
                  placeholder={t('مثال: بدأنا الشغل', 'e.g. Work started')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('العنوان (إنجليزي)', 'Title (English)')}</label>
                <input value={updateForm.title} onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })}
                  placeholder="e.g. Work started"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('تفاصيل (عربي)', 'Detail (Arabic)')}</label>
                <textarea rows={2} value={updateForm.detailAr} onChange={e => setUpdateForm({ ...updateForm, detailAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('تفاصيل (إنجليزي)', 'Detail (English)')}</label>
                <textarea rows={2} value={updateForm.detail} onChange={e => setUpdateForm({ ...updateForm, detail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none" />
              </div>
            </div>
            {/* Optional: file + meeting + transcript */}
            <details className="mb-3">
              <summary className="text-xs text-indigo-600 cursor-pointer font-medium">{t('إضافة ملف / اجتماع / transcript', 'Add file / meeting / transcript')}</summary>
              <div className="mt-3 space-y-3">
                {/* Meeting section */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-2">📅 {t('اجتماع', 'Meeting')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder={t('رابط (Zoom/Meet)', 'Meeting link')} value={updateForm.meetingLink}
                      onChange={e => setUpdateForm({ ...updateForm, meetingLink: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-blue-200 text-sm bg-white" />
                    <input type="datetime-local" value={updateForm.meetingDate}
                      onChange={e => setUpdateForm({ ...updateForm, meetingDate: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-blue-200 text-sm bg-white" />
                  </div>
                </div>
                {/* File section */}
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-xs font-bold text-green-700 mb-2">📎 {t('ملف / تسليم', 'File / Delivery')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder={t('رابط الملف (Google Drive, etc.)', 'File URL')} value={updateForm.fileUrl}
                      onChange={e => setUpdateForm({ ...updateForm, fileUrl: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-green-200 text-sm bg-white" />
                    <input placeholder={t('اسم الملف (مثال: Brand-Report.pdf)', 'File name')} value={updateForm.fileName}
                      onChange={e => setUpdateForm({ ...updateForm, fileName: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-green-200 text-sm bg-white" />
                  </div>
                </div>
                {/* Transcript section */}
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="text-xs font-bold text-purple-700 mb-2">📝 {t('ملخص / Transcript الاجتماع', 'Meeting Summary / Transcript')}</p>
                  <p className="text-xs text-purple-500 mb-2">{t('الصق ملخص الاجتماع أو نقاط الحوار هنا — هيظهر للعميل كتحديث منفصل', 'Paste meeting summary or key discussion points — will show to client as update')}</p>
                  <textarea rows={5} value={updateForm.detailAr}
                    onChange={e => setUpdateForm({ ...updateForm, detailAr: e.target.value })}
                    placeholder={t('النقاط الرئيسية:\n• اتفقنا على ...\n• الخطوة الجاية ...\n• موعد التسليم ...', 'Key points:\n• Agreed on...\n• Next step...\n• Delivery date...')}
                    className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm bg-white resize-none" />
                </div>
              </div>
            </details>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={updateForm.isClientVisible}
                  onChange={e => setUpdateForm({ ...updateForm, isClientVisible: e.target.checked })} />
                {t('ظاهر للعميل', 'Client visible')}
              </label>
              <div className="flex-1" />
              <button onClick={submitUpdate} disabled={saving || !updateForm.title || !updateForm.titleAr}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 transition disabled:opacity-50">
                {saving ? t('جاري...', 'Saving...') : t('حفظ التحديث', 'Save Update')}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="p-5 rounded-xl border border-gray-200 bg-white">
              <h4 className="text-sm font-bold text-gray-600 mb-3">{t('سجل التحديثات', 'Timeline')}</h4>
              <div className="space-y-3">
                {timeline.map((u: any) => (
                  <div key={u.id} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{t(u.titleAr, u.title)}</div>
                      {(u.detail || u.detailAr) && <p className="text-xs text-gray-500 mt-0.5">{t(u.detailAr, u.detail)}</p>}
                      {u.fileUrl && <a href={u.fileUrl} target="_blank" rel="noopener" className="text-xs text-indigo-600 mt-1 inline-block">📎 {u.fileName || 'File'}</a>}
                      {u.meetingLink && <a href={u.meetingLink} target="_blank" rel="noopener" className="text-xs text-blue-600 mt-1 inline-block ml-3">📅 Meeting</a>}
                      <span className="block text-xs text-gray-300 mt-1">{new Date(u.createdAt).toLocaleString()} · {u.isClientVisible ? '👁 visible' : '🔒 internal'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t('لا يوجد طلبات', 'No requests')}</p>
          ) : requests.map((req: any) => (
            <button key={req.id} onClick={() => loadTimeline(req)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-left">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">#{req.requestNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                    backgroundColor: (req.statusLabel?.color || '#6366f1') + '20',
                    color: req.statusLabel?.color || '#6366f1'
                  }}>
                    {req.statusLabel?.icon} {t(req.statusLabel?.ar, req.statusLabel?.en)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800">{t(req.serviceTypeAr, req.serviceType)}</div>
                <div className="text-xs text-gray-400">User #{req.userId} · {new Date(req.createdAt).toLocaleDateString()}</div>
              </div>
              <span className="text-gray-300">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS: Array<{ id: Tab; labelAr: string; labelEn: string; icon: string }> = [
  { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: '📊' },
  { id: 'cms', labelAr: 'المحتوى', labelEn: 'CMS', icon: '📝' },
  { id: 'agency', labelAr: 'الوكالة', labelEn: 'Agency', icon: '🏢' },
  { id: 'requests', labelAr: 'طلبات العملاء', labelEn: 'Client Requests', icon: '📋' },
  { id: 'users', labelAr: 'المستخدمين', labelEn: 'Users', icon: '👥' },
  { id: 'credits', labelAr: 'الكريدت', labelEn: 'Credits', icon: '⚡' },
  { id: 'tools', labelAr: 'الأدوات', labelEn: 'Tools', icon: '🔬' },
  { id: 'prompts', labelAr: 'الأوامر', labelEn: 'Prompts', icon: '🧠' },
  { id: 'pricing', labelAr: 'الباقات والخصومات', labelEn: 'Plans & Promos', icon: '💰' },
  { id: 'team', labelAr: 'الفريق', labelEn: 'Team', icon: '👔' },
  { id: 'payments', labelAr: 'المدفوعات', labelEn: 'Payments', icon: '💳' },
  { id: 'webhooks', labelAr: 'الإشعارات', labelEn: 'Webhooks', icon: '🔔' },
  { id: 'config', labelAr: 'الإعدادات', labelEn: 'Config', icon: '⚙️' },
];

export default function WzrdAdmin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string } | null | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [locale, setLocale] = useState<'ar' | 'en'>(() =>
    (typeof window !== 'undefined' && (localStorage.getItem('wzrd-admin-locale') as 'ar' | 'en')) || 'ar'
  );
  const t: T = (ar, en) => locale === 'ar' ? ar : en;
  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
    localStorage.setItem('wzrd-admin-locale', next);
  };

  useEffect(() => {
    fetch('/api/trpc/auth.me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const u = d.result?.data?.json ?? d.result?.data;
        setAdminUser(u ? { name: u.name } : null);
      })
      .catch(() => setAdminUser(null));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = e.key >= '1' && e.key <= '9' ? parseInt(e.key, 10) : 0;
      if (n && TABS[n - 1]) { setTab(TABS[n - 1].id); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const isRtl = locale === 'ar';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ message: msg, type });
  const dismissToast = () => setToast(null);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}

      {/* Session guard — show banner if not logged in */}
      {adminUser === null && (
        <div className="fixed top-0 left-0 right-0 z-[99] bg-amber-500 text-white py-2 px-4 text-center text-sm">
          {t('سجّل دخولك الأول', 'Please log in first')} — <a href="/login" className="underline font-bold">{t('تسجيل الدخول', 'Sign in')}</a>
        </div>
      )}

      {/* Sidebar - fixed 240px */}
      <aside className={`fixed top-0 z-40 w-60 h-full bg-white border border-gray-200 shadow-sm flex flex-col md:translate-x-0 transition-transform duration-200
        ${isRtl ? 'right-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">WZRD <span className="text-indigo-600">AI</span></span>
            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{t('أدمن', 'ADMIN')}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(tabItem => (
            <button key={tabItem.id} onClick={() => { setTab(tabItem.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === tabItem.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={tab === tabItem.id ? (isRtl ? { borderRight: '4px solid rgb(79 70 229)' } : { borderLeft: '4px solid rgb(79 70 229)' }) : {}}
            >
              <span>{tabItem.icon}</span> {locale === 'ar' ? tabItem.labelAr : tabItem.labelEn}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          <span className="opacity-60">{t('1–9 لوحة', '1–9 tabs')}</span><br />Primo Marca © 2026
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 md:hidden" aria-label="Menu">
              <span className="text-xl">☰</span>
            </button>
            <div className="flex-1 flex items-center gap-4">
              <p className="text-sm text-gray-600">{t('مرحباً،', 'Hi,')} {adminUser?.name || 'Admin'}</p>
              <span className="text-xs text-gray-400">{timeStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setTab('agency'); setSidebarOpen(false); }} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100">+ {t('عميل', 'Client')}</button>
              <button onClick={() => { setTab('users'); setSidebarOpen(false); }} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100">+ {t('كريدت', 'Credits')}</button>
              <span className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer" title="Notifications">🔔</span>
              <button onClick={toggleLocale} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">{locale === 'ar' ? 'EN' : 'ع'}</button>
              <a href="/" className="text-xs text-gray-500 hover:text-amber-600">{t('← لوحة التحكم', '← Dashboard')}</a>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {tab === 'overview' && <OverviewTab t={t} />}
            {tab === 'cms' && <CmsTab t={t} onSuccess={() => showToast(t('تم الحفظ', 'Saved!'))} onError={(m) => showToast(m, 'error')} />}
            {tab === 'agency' && <AgencyTab t={t} onSuccess={() => showToast(t('تم الحفظ', 'Saved!'))} onError={(m) => showToast(m, 'error')} />}
            {tab === 'users' && <UsersTab t={t} onSuccess={(m) => showToast(m || t('تم إضافة الكريدت', 'Credits added!'))} onError={(m) => showToast(m, 'error')} />}
            {tab === 'credits' && <CreditsTab t={t} />}
            {tab === 'tools' && <ToolsTab t={t} />}
            {tab === 'prompts' && <PromptsTab t={t} />}
            {tab === 'pricing' && <PricingTab t={t} onSuccess={() => showToast(t('تم الحفظ', 'Saved!'))} onError={(m) => showToast(m, 'error')} />}
            {tab === 'team' && <TeamTab t={t} />}
            {tab === 'payments' && <PaymentsTab t={t} />}
            {tab === 'webhooks' && <WebhooksTab t={t} />}
            {tab === 'config' && <ConfigTab t={t} />}
            {tab === 'requests' && <RequestsAdminTab t={t} />}
          </div>
        </main>
      </div>
    </div>
  );
}
