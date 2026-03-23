/**
 * WZRD AI Admin — manages the public WZRD AI system.
 * 
 * Tabs:
 * 1. Overview — key metrics dashboard
 * 2. Users — public signups list + search
 * 3. Credits — transaction log + filters
 * 4. Tools — usage analytics per tool
 * 5. Payments — purchase log
 * 6. Config — system config + newsletter + test email
 */
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'overview' | 'users' | 'credits' | 'tools' | 'payments' | 'webhooks' | 'cms' | 'prompts' | 'team' | 'agency' | 'config';

async function api(endpoint: string, input?: Record<string, unknown>) {
  const url = input
    ? `/api/trpc/${endpoint}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `/api/trpc/${endpoint}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.result?.data?.json ?? data?.result?.data ?? null;
}

async function apiMutation(endpoint: string, input?: Record<string, unknown>) {
  const res = await fetch(`/api/trpc/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ json: input || {} }),
  });
  const data = await res.json();
  return data?.result?.data?.json ?? data?.result?.data ?? null;
}

// ═══════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════
function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
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

// ═══════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════
function OverviewTab() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  useEffect(() => { api('wzrdAdmin.dashboard').then(setData); }, []);

  if (!data) return <p className="text-zinc-500 text-sm">Loading...</p>;

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">WZRD AI Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Signups" value={data.users?.total || 0} sub={`+${data.users?.today || 0} today`} color="text-indigo-400" />
        <StatCard label="This Week" value={data.users?.thisWeek || 0} color="text-cyan-400" />
        <StatCard label="Tool Runs" value={data.tools?.totalRuns || 0} sub={`Avg score: ${data.tools?.avgScore || '—'}`} color="text-amber-400" />
        <StatCard label="Newsletter Subs" value={data.newsletter?.subscribers || 0} color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Credits Issued" value={(data.credits?.totalIssued || 0).toLocaleString()} color="text-emerald-400" />
        <StatCard label="Credits Used" value={(data.credits?.totalUsed || 0).toLocaleString()} color="text-red-400" />
        <StatCard label="Credit Revenue" value={`${(data.revenue?.totalCreditsRevenue || 0).toLocaleString()} credits`} color="text-amber-400" />
      </div>

      {data.tools?.topTools?.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-zinc-400 mb-2">Top Tools</h4>
          <div className="space-y-2">
            {data.tools.topTools.map((t: any) => (
              <div key={t.tool} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/20">
                <span className="text-sm font-medium">{t.tool?.replace(/_/g, ' ')}</span>
                <div className="flex gap-4">
                  <span className="text-xs text-zinc-500">{t.uses} runs</span>
                  <span className="text-xs text-amber-400">{t.creditsSpent} credits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════
function UsersTab() {
  const [data, setData] = useState<{ users: any[]; total: number } | null>(null);
  const [search, setSearch] = useState('');
  const [addingCredits, setAddingCredits] = useState<number | null>(null);
  const [creditsAmount, setCreditsAmount] = useState('50');
  const [addResult, setAddResult] = useState('');

  const load = useCallback(() => {
    api('wzrdAdmin.users', { search: search || undefined, limit: 50, offset: 0 }).then(setData);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleAddCredits = async (userId: number) => {
    const amount = parseInt(creditsAmount);
    if (!amount || amount <= 0) return;
    setAddResult('Adding...');
    const r = await apiMutation('credits.adminAdd', { userId, amount, reason: 'Admin manual add' });
    if (r?.success) {
      setAddResult(`✅ Added ${amount} credits`);
      setAddingCredits(null);
      load(); // Refresh list
    } else {
      setAddResult('❌ Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Public Users <span className="text-zinc-500 text-sm font-normal">({data?.total || 0})</span></h3>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (!data?.users?.length) return;
            exportCSV('wzrd-users',
              ['Name', 'Email', 'Company', 'Industry', 'Credits', 'Newsletter', 'Signed Up'],
              data.users.map((u: any) => [u.name, u.email, u.company, u.industry, u.credits, u.newsletterOptIn ? 'Yes' : 'No', new Date(u.createdAt).toLocaleDateString()])
            );
          }} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition">
            ↓ CSV
          </button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, company..."
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 w-64 outline-none focus:border-indigo-500" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Company</th>
              <th className="pb-2 pr-4">Industry</th>
              <th className="pb-2 pr-4 text-right">Credits</th>
              <th className="pb-2 pr-4">Newsletter</th>
              <th className="pb-2 pr-4">Signed Up</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.users || []).map((u: any) => (
              <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                <td className="py-2 pr-4 font-medium">{u.name || '—'}</td>
                <td className="py-2 pr-4 text-zinc-400">{u.email}</td>
                <td className="py-2 pr-4 text-zinc-500">{u.company || '—'}</td>
                <td className="py-2 pr-4 text-zinc-500">{u.industry || '—'}</td>
                <td className="py-2 pr-4 text-right font-mono text-amber-400">{u.credits}</td>
                <td className="py-2 pr-4">{u.newsletterOptIn ? <span className="text-green-400 text-xs">✓</span> : <span className="text-zinc-600 text-xs">—</span>}</td>
                <td className="py-2 pr-4 text-zinc-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-2">
                  {addingCredits === u.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)} 
                        className="w-16 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-white outline-none" />
                      <button onClick={() => handleAddCredits(u.id)} className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30">Add</button>
                      <button onClick={() => setAddingCredits(null)} className="px-2 py-1 rounded text-zinc-600 text-xs hover:text-zinc-400">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingCredits(u.id); setAddResult(''); }} 
                      className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition">
                      + Credits
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.users?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No users yet</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// CREDITS TAB
// ═══════════════════════════════════════
function CreditsTab() {
  const [data, setData] = useState<{ transactions: any[]; total: number } | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('wzrdAdmin.creditLog', { type: filter, limit: 100, offset: 0 }).then(setData);
  }, [filter]);

  const typeColor: Record<string, string> = {
    signup_bonus: 'text-green-400 bg-green-400/10',
    purchase: 'text-amber-400 bg-amber-400/10',
    tool_usage: 'text-red-400 bg-red-400/10',
    refund: 'text-blue-400 bg-blue-400/10',
    admin: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Credit Transactions <span className="text-zinc-500 text-sm font-normal">({data?.total || 0})</span></h3>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (!data?.transactions?.length) return;
            exportCSV('wzrd-credits',
              ['ID', 'User ID', 'Amount', 'Balance', 'Type', 'Tool', 'Reason', 'Date'],
              data.transactions.map((t: any) => [t.id, t.userId, t.amount, t.balance, t.type, t.toolName, t.reason, new Date(t.createdAt).toLocaleDateString()])
            );
          }} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition">
            ↓ CSV
          </button>
          <div className="flex gap-1">
          {['all', 'signup_bonus', 'purchase', 'tool_usage', 'refund', 'admin'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === t ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}>
              {t === 'all' ? 'All' : t.replace(/_/g, ' ')}
            </button>
          ))}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        {(data?.transactions || []).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${typeColor[t.type] || 'text-zinc-400'}`}>{t.type}</span>
              <span className="text-sm text-zinc-300">{t.reason || t.toolName || '—'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-mono text-sm font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.amount > 0 ? '+' : ''}{t.amount}
              </span>
              <span className="text-xs text-zinc-600">bal: {t.balance}</span>
              <span className="text-xs text-zinc-600">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {(!data?.transactions?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No transactions yet</p>}
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
          <Bar dataKey="runs" fill="#818cf8" radius={[3, 3, 0, 0]} name="Tool Runs" />
          <Bar dataKey="credits" fill="#c8a24e40" radius={[3, 3, 0, 0]} name="Credits" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════
// TOOLS TAB
// ═══════════════════════════════════════
function ToolsTab() {
  const [data, setData] = useState<{ tools: any[]; dailyUsage: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.toolStats').then(setData); }, []);

  const toolIcons: Record<string, string> = {
    brand_diagnosis: '🔬', offer_check: '📦', message_check: '💬',
    presence_audit: '🌐', identity_snapshot: '🪞', launch_readiness: '🚀',
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Tool Usage Analytics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {(data?.tools || []).map((t: any) => (
          <div key={t.name} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{toolIcons[t.name] || '🔧'}</span>
              <span className="text-sm font-medium capitalize">{t.name?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-2xl font-bold font-mono text-indigo-400">{t.runs}</p>
            <p className="text-xs text-zinc-600">{t.creditsSpent} credits spent</p>
          </div>
        ))}
      </div>

      {data?.dailyUsage?.length ? (
        <div>
          <h4 className="text-sm font-bold text-zinc-400 mb-2">Daily Usage (30 days)</h4>
          <DailyUsageChart data={data.dailyUsage} />
        </div>
      ) : <p className="text-zinc-600 text-sm">No usage data yet</p>}
    </div>
  );
}

// ═══════════════════════════════════════
// PAYMENTS TAB
// ═══════════════════════════════════════
function PaymentsTab() {
  const [data, setData] = useState<{ payments: any[]; total: number } | null>(null);
  useEffect(() => { api('wzrdAdmin.payments').then(setData); }, []);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Payments <span className="text-zinc-500 text-sm font-normal">({data?.total || 0})</span></h3>
      <div className="space-y-2">
        {(data?.payments || []).map((p: any) => {
          let meta: any = {};
          try { meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : (p.metadata || {}); } catch {}
          return (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
              <div>
                <p className="text-sm font-medium">{p.reason}</p>
                <p className="text-xs text-zinc-600">User #{p.userId} · {meta.planId || '—'} plan</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold font-mono text-green-400">+{p.amount}</p>
                <p className="text-xs text-zinc-600">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
        {(!data?.payments?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No payments yet</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// WEBHOOKS TAB
// ═══════════════════════════════════════
function WebhooksTab() {
  const [data, setData] = useState<{ events: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.webhookLog').then(setData); }, []);

  const statusColors: Record<string, string> = {
    success: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
    duplicate: 'text-amber-400 bg-amber-400/10',
    invalid_hmac: 'text-red-500 bg-red-500/10',
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Paymob Webhook Events <span className="text-zinc-500 text-sm font-normal">({data?.events?.length || 0})</span></h3>
      
      {(data?.events?.length || 0) === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl">🔔</span>
          <p className="text-zinc-500 text-sm mt-3">No webhook events yet</p>
          <p className="text-zinc-600 text-xs mt-1">Events will appear here when Paymob sends payment notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data!.events.map((e: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${statusColors[e.status] || 'text-zinc-400'}`}>{e.status}</span>
                <div>
                  <p className="text-sm text-zinc-300">
                    {e.status === 'success' && `✅ +${e.credits} credits → User #${e.userId} (${e.planId})`}
                    {e.status === 'failed' && `❌ Payment failed: ${e.error || 'Unknown'}`}
                    {e.status === 'duplicate' && `⏭️ Duplicate webhook — already processed`}
                    {e.status === 'invalid_hmac' && `🚫 Invalid HMAC signature — rejected`}
                  </p>
                  {e.transactionId && <p className="text-[10px] text-zinc-600 font-mono mt-0.5">txn: {e.transactionId}</p>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {e.amountCents > 0 && <p className="text-xs text-zinc-500">{(e.amountCents / 100).toFixed(0)} EGP</p>}
                <p className="text-[10px] text-zinc-600">{new Date(e.timestamp).toLocaleString()}</p>
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
function ConfigTab() {
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
      <h3 className="text-lg font-bold mb-4">WZRD AI Configuration</h3>

      {/* System Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`p-3 rounded-lg border text-center ${config?.groqConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-zinc-500">Groq LLM</p>
          <p className={`text-sm font-bold ${config?.groqConfigured ? 'text-green-400' : 'text-red-400'}`}>{config?.groqConfigured ? '✅ Active' : '❌ Not Set'}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.claudeConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
          <p className="text-xs text-zinc-500">Claude LLM</p>
          <p className={`text-sm font-bold ${config?.claudeConfigured ? 'text-green-400' : 'text-zinc-600'}`}>{config?.claudeConfigured ? '✅ Active' : '— Optional'}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.paymobConfigured ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-zinc-500">Paymob</p>
          <p className={`text-sm font-bold ${config?.paymobConfigured ? 'text-green-400' : 'text-red-400'}`}>{config?.paymobConfigured ? '✅ Active' : '❌ Not Set'}</p>
        </div>
        <div className={`p-3 rounded-lg border text-center ${config?.emailProvider !== 'none' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className="text-xs text-zinc-500">Email</p>
          <p className={`text-sm font-bold ${config?.emailProvider !== 'none' ? 'text-green-400' : 'text-red-400'}`}>{config?.emailProvider !== 'none' ? `✅ ${config?.emailProvider}` : '❌ Not Set'}</p>
        </div>
      </div>

      {/* Tool Costs (editable) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-bold text-zinc-400">Tool Costs (credits)</h4>
          {costSaved && <span className="text-xs text-green-400">{costSaved}</span>}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {config?.toolCosts && Object.entries(config.toolCosts).map(([tool, cost]) => (
            <div key={tool} className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/30 text-center cursor-pointer hover:border-amber-500/30 transition"
              onClick={() => { if (editingTool !== tool) { setEditingTool(tool); setEditCost(String(cost)); } }}>
              <p className="text-[10px] text-zinc-600 capitalize">{tool.replace(/_/g, ' ')}</p>
              {editingTool === tool ? (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveCost(tool); if (e.key === 'Escape') setEditingTool(null); }}
                    className="w-12 text-center text-sm font-mono bg-zinc-800 border border-amber-500/30 rounded px-1 py-0.5 text-white outline-none" autoFocus />
                  <button onClick={() => handleSaveCost(tool)} className="text-green-400 text-xs hover:text-green-300">✓</button>
                </div>
              ) : (
                <p className="text-lg font-bold font-mono text-amber-400">{cost as number}</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">Click a cost to edit · Signup bonus: {config?.signupBonus} · Daily cap: {config?.dailyCreditCap}/day</p>
      </div>

      {/* Credit Plans */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-zinc-400 mb-2">Credit Plans (EGP)</h4>
        <div className="grid grid-cols-3 gap-2">
          {config?.creditPlans && Object.entries(config.creditPlans).map(([plan, info]: [string, any]) => (
            <div key={plan} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 text-center">
              <p className="text-xs text-zinc-500 capitalize">{plan}</p>
              <p className="text-lg font-bold text-white">{info.priceEGP} EGP</p>
              <p className="text-xs text-amber-400">{info.credits} credits</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
          <h4 className="text-sm font-bold mb-2">🧪 Test Email</h4>
          <div className="flex gap-2">
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com"
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm outline-none" />
            <button onClick={handleTestEmail} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">Send</button>
          </div>
          {testResult && <p className="text-xs text-zinc-400 mt-2">{testResult}</p>}
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
          <h4 className="text-sm font-bold mb-2">🤖 Ping LLM Provider</h4>
          <button onClick={handlePing} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 transition">Ping</button>
          {pingResult && <p className="text-xs text-zinc-400 mt-2">{pingResult}</p>}
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
          <h4 className="text-sm font-bold mb-2">📬 Send Newsletter Now</h4>
          <button onClick={handleNewsletter} className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 text-sm font-bold hover:bg-amber-400 transition">Send to All Subscribers</button>
          {nlResult && <p className="text-xs text-zinc-400 mt-2">{nlResult}</p>}
        </div>

        <EmailStatsSection />
      </div>
    </div>
  );
}

/** Email analytics mini-panel */
function EmailStatsSection() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { api('wzrdAdmin.emailStats').then(setStats); }, []);

  if (!stats) return null;
  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold text-zinc-400 mb-3">📧 Email Analytics</h4>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Sent" value={stats.totalSent} color="text-green-400" />
        <StatCard label="Failed" value={stats.totalFailed} color="text-red-400" />
        <StatCard label="Skipped" value={stats.totalSkipped} color="text-zinc-500" />
      </div>
      {Object.keys(stats.byTemplate || {}).length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">By Template</p>
          <div className="space-y-1">
            {Object.entries(stats.byTemplate).map(([tmpl, data]: [string, any]) => (
              <div key={tmpl} className="flex items-center justify-between p-2 rounded-lg border border-zinc-800/50">
                <span className="text-xs text-zinc-400 capitalize">{tmpl}</span>
                <div className="flex gap-3">
                  <span className="text-xs text-green-400">{data.sent} sent</span>
                  <span className="text-xs text-red-400">{data.failed} failed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats.recentEmails?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Recent Emails</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {stats.recentEmails.slice(0, 20).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-zinc-800/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={e.status === 'sent' ? 'text-green-400' : e.status === 'failed' ? 'text-red-400' : 'text-zinc-600'}>
                    {e.status === 'sent' ? '✓' : e.status === 'failed' ? '✕' : '—'}
                  </span>
                  <span className="text-zinc-400 truncate">{e.to}</span>
                </div>
                <span className="text-zinc-600 flex-shrink-0 ml-2">{new Date(e.timestamp).toLocaleTimeString()}</span>
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
function CmsTab() {
  const [sc, setSc] = useState<any>(null);
  const [saving, setSaving] = useState('');

  useEffect(() => { api('wzrdAdmin.siteConfig').then(setSc); }, []);

  const saveHomepage = async () => {
    if (!sc) return;
    setSaving('Saving...');
    await apiMutation('wzrdAdmin.updateHomepage', sc.homepage);
    setSaving('✅ Saved');
    setTimeout(() => setSaving(''), 2000);
  };

  const saveSite = async () => {
    if (!sc) return;
    setSaving('Saving...');
    await apiMutation('wzrdAdmin.updateSiteSettings', sc.site);
    setSaving('✅ Saved');
    setTimeout(() => setSaving(''), 2000);
  };

  if (!sc) return <p className="text-zinc-500 text-sm">Loading...</p>;

  const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-indigo-500" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Content Management</h3>
        {saving && <span className="text-xs text-green-400">{saving}</span>}
      </div>

      {/* Homepage */}
      <div className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h4 className="text-sm font-bold text-zinc-400 mb-3">🏠 Homepage</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Hero Title (EN)" value={sc.homepage.heroTitle} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroTitle: v}})} />
          <Field label="Hero Title (AR)" value={sc.homepage.heroTitleAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroTitleAr: v}})} />
          <Field label="Subtitle (EN)" value={sc.homepage.heroSubtitle} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroSubtitle: v}})} />
          <Field label="Subtitle (AR)" value={sc.homepage.heroSubtitleAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, heroSubtitleAr: v}})} />
          <Field label="CTA Text (EN)" value={sc.homepage.ctaText} onChange={v => setSc({...sc, homepage: {...sc.homepage, ctaText: v}})} />
          <Field label="CTA Text (AR)" value={sc.homepage.ctaTextAr} onChange={v => setSc({...sc, homepage: {...sc.homepage, ctaTextAr: v}})} />
        </div>
        <button onClick={saveHomepage} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">Save Homepage</button>
      </div>

      {/* Site Settings */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h4 className="text-sm font-bold text-zinc-400 mb-3">🌐 Site Settings</h4>
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
        <button onClick={saveSite} className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition">Save Settings</button>
      </div>

      {/* Services */}
      <div className="mt-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
        <h4 className="text-sm font-bold text-zinc-400 mb-3">📦 Services</h4>
        <div className="space-y-2">
          {sc.services?.services?.map((svc: any) => (
            <div key={svc.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50">
              <div>
                <p className="text-sm font-medium">{svc.nameEn} <span className="text-zinc-500">/ {svc.nameAr}</span></p>
                <p className="text-[10px] text-zinc-600 uppercase">{svc.tier} tier</p>
              </div>
              <button onClick={async () => {
                const newEnabled = !svc.enabled;
                await apiMutation('wzrdAdmin.updateService', { serviceId: svc.id, enabled: newEnabled });
                setSc({...sc, services: {...sc.services, services: sc.services.services.map((s: any) => s.id === svc.id ? {...s, enabled: newEnabled} : s)}});
              }} className={`px-3 py-1 rounded-full text-xs font-bold ${svc.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {svc.enabled ? 'Active' : 'Disabled'}
              </button>
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
function PromptsTab() {
  const [sc, setSc] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => { api('wzrdAdmin.siteConfig').then(setSc); }, []);

  const savePrompt = async (toolId: string) => {
    setSaving('Saving...');
    await apiMutation('wzrdAdmin.updatePrompt', { toolId, systemPrompt: draft });
    setSc({...sc, prompts: sc.prompts.map((p: any) => p.toolId === toolId ? {...p, systemPrompt: draft} : p)});
    setEditing(null);
    setSaving('✅');
    setTimeout(() => setSaving(''), 2000);
  };

  if (!sc) return <p className="text-zinc-500 text-sm">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">AI Tool Prompts</h3>
        {saving && <span className="text-xs text-green-400">{saving}</span>}
      </div>
      <p className="text-xs text-zinc-500 mb-4">Edit the system prompt each AI tool uses. Changes take effect immediately.</p>

      <div className="space-y-3">
        {sc.prompts?.map((p: any) => (
          <div key={p.toolId} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{p.toolName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {p.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  await apiMutation('wzrdAdmin.updatePrompt', { toolId: p.toolId, enabled: !p.enabled });
                  setSc({...sc, prompts: sc.prompts.map((x: any) => x.toolId === p.toolId ? {...x, enabled: !x.enabled} : x)});
                }} className="text-xs text-zinc-500 hover:text-amber-400 transition">
                  {p.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => { setEditing(p.toolId); setDraft(p.systemPrompt); }} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Edit Prompt
                </button>
              </div>
            </div>

            {editing === p.toolId ? (
              <div>
                <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-indigo-500/30 text-xs text-zinc-300 font-mono outline-none resize-y" />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => savePrompt(p.toolId)} className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">Save</button>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-zinc-500 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600 font-mono leading-relaxed line-clamp-3">{p.systemPrompt}</p>
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
function TeamTab() {
  const [data, setData] = useState<{ team: any[] } | null>(null);
  useEffect(() => { api('wzrdAdmin.teamList').then(setData); }, []);

  const changeRole = async (userId: number, role: string) => {
    await apiMutation('wzrdAdmin.updateTeamRole', { userId, role });
    setData(prev => prev ? { team: prev.team.map(u => u.id === userId ? {...u, role} : u) } : prev);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Team Members <span className="text-zinc-500 text-sm font-normal">({data?.team?.length || 0})</span></h3>

      <div className="space-y-2">
        {(data?.team || []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
            <div>
              <p className="text-sm font-medium">{u.name || 'Unnamed'}</p>
              <p className="text-xs text-zinc-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <span className="text-xs text-zinc-600">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {(!data?.team?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No team members yet</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// AGENCY TAB — Clients + Projects overview
// ═══════════════════════════════════════
function AgencyTab() {
  const [clients, setClients] = useState<any>(null);
  const [projects, setProjects] = useState<any>(null);
  const [view, setView] = useState<'clients' | 'projects'>('clients');

  useEffect(() => {
    api('wzrdAdmin.agencyClients').then(setClients);
    api('wzrdAdmin.agencyProjects').then(setProjects);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Agency Overview</h3>
        <div className="flex gap-1">
          <button onClick={() => setView('clients')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${view === 'clients' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
            Clients ({clients?.total || 0})
          </button>
          <button onClick={() => setView('projects')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${view === 'projects' ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
            Projects ({projects?.total || 0})
          </button>
        </div>
      </div>

      {/* Project status summary */}
      {projects?.byStatus && Object.keys(projects.byStatus).length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(projects.byStatus).map(([status, count]) => (
            <StatCard key={status} label={status} value={count as number} color={status === 'active' ? 'text-green-400' : status === 'completed' ? 'text-indigo-400' : 'text-zinc-400'} />
          ))}
        </div>
      )}

      {view === 'clients' ? (
        <div className="space-y-2">
          {(clients?.clients || []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.company || c.email} · {c.industry || 'No industry'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : c.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {c.status}
                </span>
                <span className="text-xs text-zinc-600">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {(!clients?.clients?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No clients yet</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {(projects?.projects || []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-zinc-500">Stage: {p.stage} · Client #{p.clientId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : p.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400' : p.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {p.status}
                </span>
                <span className="text-xs text-zinc-600">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {(!projects?.projects?.length) && <p className="text-zinc-600 text-sm py-8 text-center">No projects yet</p>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'cms', label: 'CMS', icon: '📝' },
  { id: 'agency', label: 'Agency', icon: '🏢' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'credits', label: 'Credits', icon: '⚡' },
  { id: 'tools', label: 'Tools', icon: '🔬' },
  { id: 'prompts', label: 'Prompts', icon: '🧠' },
  { id: 'team', label: 'Team', icon: '👔' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'webhooks', label: 'Webhooks', icon: '🔔' },
  { id: 'config', label: 'Config', icon: '⚙️' },
];

export default function WzrdAdmin() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold tracking-wider">
              WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
            </span>
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
          </div>
          <a href="/" className="text-xs text-zinc-500 hover:text-amber-400 transition">← Dashboard</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                tab === t.id ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab />}
        {tab === 'cms' && <CmsTab />}
        {tab === 'agency' && <AgencyTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'credits' && <CreditsTab />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'prompts' && <PromptsTab />}
        {tab === 'team' && <TeamTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'webhooks' && <WebhooksTab />}
        {tab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
}
