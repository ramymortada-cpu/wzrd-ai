import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const PLANS = [
  { id: 'starter', credits: 500, price: 499, currency: 'EGP', popular: false, label: 'Starter', description: '~20 tool runs' },
  { id: 'pro', credits: 1500, price: 999, currency: 'EGP', popular: true, label: 'Pro', description: '~60 tool runs — best value' },
  { id: 'agency', credits: 5000, price: 2499, currency: 'EGP', popular: false, label: 'Agency', description: '~200 tool runs' },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wider font-mono">
              WZRD <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-widest uppercase">by Primo Marca</p>
          </div>
          <div className="flex items-center gap-4">
            {credits !== null && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
                <span className="text-amber-400 font-mono text-sm font-bold">{credits}</span>
                <span className="text-zinc-500 text-xs">credits</span>
              </div>
            )}
            <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 transition">← Tools</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-indigo-400 tracking-widest mb-2">// CREDITS</p>
          <h2 className="text-3xl font-bold mb-3">Buy More Credits</h2>
          <p className="text-zinc-400 max-w-md mx-auto">Keep using AI tools to diagnose and improve your brand. Each tool costs 20-30 credits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative p-6 rounded-2xl border transition ${
              plan.popular 
                ? 'border-indigo-500/30 bg-indigo-500/5' 
                : 'border-zinc-800 bg-zinc-900/30'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-xs font-bold text-white">
                  BEST VALUE
                </div>
              )}
              <div className="text-center">
                <h3 className="text-lg font-bold mb-1">{plan.label}</h3>
                <p className="text-xs text-zinc-500 mb-4">{plan.description}</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold font-mono text-white">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-zinc-500 ml-1">EGP</span>
                </div>
                <p className="text-xs text-zinc-500 mb-6">{plan.credits.toLocaleString()} credits</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/trpc/credits.purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ json: { planId: plan.id } }),
                      });
                      const data = await res.json();
                      const result = data?.result?.data?.json;
                      if (result?.success && result?.redirectUrl) {
                        window.location.href = result.redirectUrl;
                      } else {
                        alert(result?.message || 'Payment failed. Please try again.');
                      }
                    } catch { alert('Connection error. Please try again.'); }
                  }}
                  className={`w-full py-3 rounded-full font-bold text-sm transition hover:-translate-y-0.5 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  Buy {plan.credits} Credits
                </button>
                <p className="text-[10px] text-zinc-600 mt-2">{(plan.price / plan.credits).toFixed(1)} EGP per credit</p>
              </div>
            </div>
          ))}
        </div>

        {/* Done-for-you alternative */}
        <div className="p-8 rounded-2xl border border-amber-500/15 bg-amber-500/3 text-center">
          <h3 className="text-xl font-bold mb-2">Don't want to DIY?</h3>
          <p className="text-sm text-zinc-400 mb-4 max-w-md mx-auto">
            Let Primo Marca handle everything — strategy, identity, execution. 
            Clear scope, clear deliverables, clear finish line.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm hover:-translate-y-0.5 transition">
              Book a Clarity Call
            </a>
            <button onClick={() => navigate('/landing/services.html')} className="px-6 py-3 rounded-full border border-zinc-700 text-sm text-zinc-300 hover:border-amber-500 transition">
              View Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
