import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ToolInfo {
  id: string;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  icon: string;
  color: string;
  cost: number;
  route: string;
}

// Route mapping (backend doesn't know React routes)
const ROUTE_MAP: Record<string, string> = {
  brand_diagnosis: '/tools/brand-diagnosis',
  offer_check: '/tools/offer-check',
  message_check: '/tools/message-check',
  presence_audit: '/tools/presence-audit',
  identity_snapshot: '/tools/identity-snapshot',
  launch_readiness: '/tools/launch-readiness',
};

// Fallback if meta fetch fails
const FALLBACK_TOOLS: ToolInfo[] = [
  { id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', desc: 'Health score + top issues. The starting point.', descAr: 'نتيجة صحة + أهم المشاكل. نقطة البداية.', icon: '🔬', color: '#6d5cff', cost: 20, route: '/tools/brand-diagnosis' },
  { id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', desc: 'Is your offer clear? Pricing logical?', descAr: 'العرض واضح؟ التسعير منطقي؟', icon: '📦', color: '#c8a24e', cost: 25, route: '/tools/offer-check' },
  { id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', desc: 'Messaging consistency and clarity.', descAr: 'اتساق ووضوح الرسالة.', icon: '💬', color: '#44ddc9', cost: 20, route: '/tools/message-check' },
  { id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور', desc: 'Cross-channel digital presence check.', descAr: 'فحص الحضور الرقمي عبر القنوات.', icon: '🌐', color: '#ff6b6b', cost: 25, route: '/tools/presence-audit' },
  { id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', desc: 'Does your personality match your audience?', descAr: 'شخصيتك بتتوافق مع جمهورك؟', icon: '🪞', color: '#a78bfa', cost: 20, route: '/tools/identity-snapshot' },
  { id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', desc: 'How ready are you to go to market?', descAr: 'أد إيه أنت جاهز تنزل السوق؟', icon: '🚀', color: '#f59e0b', cost: 30, route: '/tools/launch-readiness' },
];

export default function Tools() {
  const [, navigate] = useLocation();
  const [credits, setCredits] = useState<number | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>(FALLBACK_TOOLS);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.json?.credits ?? d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));

    // Fetch tool metadata from backend (with fallback)
    fetch('/api/trpc/tools.meta')
      .then(r => r.json())
      .then(d => {
        const meta = d.result?.data?.json?.tools ?? d.result?.data?.tools;
        if (meta?.length) {
          setTools(meta.map((t: any) => ({
            ...t,
            route: ROUTE_MAP[t.id] || `/tools/${t.id.replace(/_/g, '-')}`,
          })));
        }
      })
      .catch(() => {}); // Keep fallback
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wider font-mono">
              WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase">by Primo Marca</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
              <span className="text-amber-400 font-mono text-sm font-bold">{credits ?? '...'}</span>
              <span className="text-zinc-500 text-xs">credits</span>
            </div>
            <a href="/profile" className="text-xs text-zinc-500 hover:text-amber-400 transition">Profile</a>
            <a href="/" className="text-xs text-zinc-500 hover:text-amber-400 transition">Home</a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Onboarding banner — shows for new users (credits = 100 = untouched) */}
        {credits === 100 && (
          <div className="mb-8 p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Welcome! Here's how to get started</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  You have <strong className="text-cyan-400">100 free credits</strong>. We recommend starting with <strong className="text-white">Brand Diagnosis</strong> — it gives you a health score across all 5 pillars and tells you where to focus next.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => navigate('/tools/brand-diagnosis')} className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-400 transition">
                    🔬 Start Brand Diagnosis (20 credits)
                  </button>
                  <button onClick={() => { const el = document.getElementById('tools-grid'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-400 text-sm hover:text-white transition">
                    Browse all tools ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase success banner */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchase') === 'success' && (
          <div className="mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-center">
            <p className="text-green-400 font-semibold">✅ Payment successful! Credits have been added to your account.</p>
          </div>
        )}

        <div className="mb-10">
          <p className="font-mono text-xs text-indigo-400 tracking-widest mb-2">// AI_TOOLS</p>
          <h2 className="text-3xl font-bold mb-3">Your AI Brand Toolkit</h2>
          <p className="text-zinc-400 max-w-lg">Each tool is powered by a specialized AI agent. Pick the one that fits your situation — or run them all.</p>
        </div>

        <div id="tools-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => {
            const canAfford = credits !== null && credits >= tool.cost;
            return (
              <button
                key={tool.id}
                onClick={() => canAfford && navigate(tool.route)}
                disabled={!canAfford}
                className={`text-left p-6 rounded-2xl border transition group ${
                  canAfford
                    ? 'border-zinc-800 bg-zinc-900/30 hover:border-amber-500/30 hover:-translate-y-1 cursor-pointer'
                    : 'border-zinc-800/50 bg-zinc-900/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-3xl mb-3">{tool.icon}</div>
                <h3 className="text-base font-bold mb-1 group-hover:text-amber-400 transition">{tool.name}</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{tool.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs" style={{ color: tool.color || '#44ddc9' }}>~{tool.cost} credits</span>
                  {canAfford ? (
                    <span className="text-xs text-amber-400">Run →</span>
                  ) : (
                    <span className="text-xs text-red-400">Not enough credits</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Buy more credits CTA */}
        {credits !== null && credits < 20 && (
          <div className="mt-10 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
            <h3 className="text-lg font-bold mb-2">Need more credits?</h3>
            <p className="text-sm text-zinc-400 mb-4">Buy credits to keep using AI tools, or contact Primo Marca for done-for-you services.</p>
            <div className="flex gap-3 justify-center">
              <a href="/pricing" className="px-6 py-2.5 rounded-full bg-amber-500 text-zinc-950 text-sm font-bold hover:-translate-y-0.5 transition">Buy Credits</a>
              <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full border border-zinc-700 text-sm hover:border-amber-500 transition">Talk to Primo Marca</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
