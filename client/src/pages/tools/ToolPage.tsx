import { useState } from 'react';
import { useLocation } from 'wouter';
import { toErrorString } from '@/lib/errorUtils';

export interface ToolField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  maxLength?: number;
}

export interface ToolConfig {
  id: string;
  name: string;
  icon: string;
  cost: number;
  endpoint: string;
  description: string;
  fields: ToolField[];
  guideUrl: string;
  guideTitle: string;
  intro?: {
    headline: string;
    body: string;
    measures: string[];
    bestFor: string;
  };
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

const severityColor = (s: string) => s === 'high' ? 'text-red-400 border-red-400/20 bg-red-400/5' : s === 'medium' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 'text-green-400 border-green-400/20 bg-green-400/5';
const scoreColor = (s: number) => s >= 70 ? 'from-green-400 to-cyan-400' : s >= 40 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-pink-400';

export default function ToolPage({ config }: { config: ToolConfig }) {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState('');

  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

    try {
      const res = await fetch(`/api/trpc/${config.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: formData }),
      });
      const data = await res.json();

      if (data.error) {
        setError(toErrorString(data.error, 'Analysis failed. You may not have enough credits.'));
      } else {
        // Handle both tRPC response formats: {result.data.json} or {result.data}
        const toolResult = data.result?.data?.json ?? data.result?.data;
        if (toolResult?.score !== undefined) {
          setResult(toolResult);
        } else {
          setError('Unexpected response format. Please try again.');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══ RESULT VIEW ═══
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Back */}
          <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 mb-8 transition">← Back to Tools</button>

          {/* Score */}
          <div className="text-center mb-10">
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${scoreColor(result.score)} mb-4`}>
              <span className="text-4xl font-bold text-zinc-950 font-mono">{result.score}</span>
            </div>
            <h2 className="text-2xl font-bold">{config.name}</h2>
            <p className="text-sm text-zinc-500 mt-1">{result.label} · {result.creditsUsed} credits used · {result.creditsRemaining} remaining</p>
          </div>

          {/* Findings */}
          <div className="space-y-3 mb-8">
            {result.findings.map((f, i) => (
              <div key={i} className={`p-4 rounded-xl border ${severityColor(f.severity)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">{f.severity}</span>
                  <h4 className="font-bold text-sm">{f.title}</h4>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mb-8">
            <p className="text-sm font-medium text-indigo-300">💡 {result.recommendation}</p>
          </div>

          {/* Service Recommendation (only shows for score < 70) */}
          {result.serviceRecommendation?.show && (
            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{result.serviceRecommendation.tier}</span>
                <span className="text-sm font-bold text-white">{result.serviceRecommendation.service}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{result.serviceRecommendation.reason}</p>
              <a href={result.serviceRecommendation.url} className="inline-block px-4 py-2 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition">
                Learn about {result.serviceRecommendation.service} →
              </a>
            </div>
          )}

          {/* Next Steps */}
          <div className="grid grid-cols-2 gap-3">
            <a href={result.nextStep.url} className="p-4 rounded-xl border border-zinc-800 hover:border-amber-500/30 transition text-center">
              <span className="text-xl">📖</span>
              <p className="text-xs font-bold mt-2">{result.nextStep.title}</p>
              <p className="text-[10px] text-zinc-500">Learn more — free</p>
            </a>
            <a href="/services-info" className="p-4 rounded-xl border border-zinc-800 hover:border-amber-500/30 transition text-center">
              <span className="text-xl">🤝</span>
              <p className="text-xs font-bold mt-2">Talk to Expert</p>
              <p className="text-[10px] text-zinc-500">Done-for-you by Primo Marca</p>
            </a>
          </div>

          {/* Run another */}
          <button onClick={() => { setResult(null); setFormData({}); }} className="w-full mt-6 py-3 rounded-full border border-zinc-800 text-sm text-zinc-400 hover:border-indigo-500 transition">
            Run again with different data
          </button>
        </div>
      </div>
    );
  }

  // ═══ FORM VIEW ═══
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <button onClick={() => navigate('/tools')} className="text-xs text-zinc-500 hover:text-amber-400 mb-8 transition">← Back to Tools</button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{config.name}</h1>
            <p className="text-xs text-zinc-500">{config.description} · ~{config.cost} credits</p>
          </div>
        </div>

        {/* Intro section — what this tool does */}
        {config.intro && (
          <div className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/20">
            <h2 className="text-base font-bold text-white mb-2">{config.intro.headline}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{config.intro.body}</p>
            <div className="mb-3">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">What it measures:</p>
              <div className="flex flex-wrap gap-1.5">
                {config.intro.measures.map((m, i) => (
                  <span key={i} className="text-[11px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-400/80 leading-relaxed">
              <span className="font-bold">Best for:</span> {config.intro.bestFor}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder} maxLength={field.maxLength || 1000} rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition resize-none"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-indigo-500" checked={!!formData[field.name]} onChange={e => updateField(field.name, e.target.checked)} />
                  <span className="text-sm text-zinc-400">{field.placeholder}</span>
                </label>
              ) : (
                <input
                  type="text" placeholder={field.placeholder} maxLength={field.maxLength || 255}
                  className="w-full px-4 py-3 rounded-lg bg-white/3 border border-zinc-800 text-white placeholder-zinc-600 text-sm outline-none focus:border-indigo-500 transition"
                  value={(formData[field.name] as string) || ''} onChange={e => updateField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full mt-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-bold text-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              WZRD AI is analyzing...
            </span>
          ) : (
            `Analyze — ${config.cost} credits`
          )}
        </button>
      </div>
    </div>
  );
}
