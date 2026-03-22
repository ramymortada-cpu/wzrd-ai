import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Profile() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user info
    fetch('/api/trpc/auth.me')
      .then(r => r.json())
      .then(d => setUser(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});

    // Fetch credit history
    fetch('/api/trpc/credits.history')
      .then(r => r.json())
      .then(d => setHistory(d.result?.data?.json ?? d.result?.data ?? []))
      .catch(() => {});
  }, []);

  const typeLabel: Record<string, string> = {
    signup_bonus: '🎁 Signup Bonus',
    purchase: '💳 Purchase',
    tool_usage: '🔬 Tool Usage',
    refund: '↩️ Refund',
    admin: '⚙️ Admin',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wider font-mono">
            WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
          </h1>
          <div className="flex gap-4">
            <a href="/tools" className="text-xs text-zinc-500 hover:text-amber-400 transition">Tools</a>
            <a href="/pricing" className="text-xs text-zinc-500 hover:text-amber-400 transition">Buy Credits</a>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Account Info */}
        <div className="mb-8">
          <p className="font-mono text-xs text-indigo-400 tracking-widest mb-2">// PROFILE</p>
          <h2 className="text-2xl font-bold mb-1">{user?.name || 'Loading...'}</h2>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>

        {/* Credits Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Available Credits</p>
              <p className="text-4xl font-bold font-mono text-amber-400">{user?.credits ?? '...'}</p>
            </div>
            <button onClick={() => navigate('/pricing')}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition">
              Buy More
            </button>
          </div>
        </div>

        {/* Credit History */}
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-3">Credit History</h3>
          <div className="space-y-1">
            {history.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-900/20">
                <div>
                  <span className="text-sm">{typeLabel[t.type] || t.type}</span>
                  {t.toolName && <span className="text-xs text-zinc-600 ml-2">{t.toolName.replace(/_/g, ' ')}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount}
                  </span>
                  <span className="text-xs text-zinc-600">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-zinc-600 text-sm py-4 text-center">No transactions yet</p>}
          </div>
        </div>

        {/* Logout */}
        <div className="mt-12 text-center">
          <button onClick={() => {
            fetch('/api/trpc/auth.logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
              .finally(() => { document.cookie = 'app_session_id=;path=/;max-age=0'; window.location.href = '/welcome'; });
          }} className="text-xs text-red-400 hover:text-red-300 transition">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
