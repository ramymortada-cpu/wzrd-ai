import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

interface CompanyResult {
  name: string;
  totalScore: number;
  pillars: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

interface BenchmarkResult {
  companies: CompanyResult[];
  gaps: Array<{ pillar: string; yourScore: number; bestCompetitor: string; bestScore: number; gap: number; recommendation: string }>;
  overallInsight: string;
  creditsUsed: number;
  creditsRemaining: number;
}

const PILLAR_LABELS: Record<string, { ar: string; en: string }> = {
  positioning: { ar: 'التموضع', en: 'Positioning' },
  messaging: { ar: 'الرسائل', en: 'Messaging' },
  offer: { ar: 'العرض', en: 'Offer' },
  identity: { ar: 'الهوية', en: 'Identity' },
  journey: { ar: 'الرحلة', en: 'Journey' },
};

export default function CompetitiveBenchmark() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [form, setForm] = useState({ companyName: '', competitor1: '', competitor2: '', competitor3: '', industry: '', socialLinks: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.competitor1.trim() || !form.industry.trim()) {
      setError(isAr ? 'ادخل اسم شركتك ومنافس واحد على الأقل والمجال.' : 'Enter your company, at least 1 competitor, and industry.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const competitors = [form.competitor1, form.competitor2, form.competitor3].filter(c => c.trim());

    try {
      const res = await fetch('/api/trpc/tools.competitiveBenchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: { companyName: form.companyName, competitors, industry: form.industry, socialLinks: form.socialLinks || undefined } }),
      });
      const d = await res.json();
      const data = d.result?.data?.json ?? d.result?.data;

      if (data?.companies) {
        setResult(data);
      } else {
        setError(d.error?.json?.message || d.error?.message || (isAr ? 'حصل مشكلة — حاول تاني.' : 'Something went wrong.'));
      }
    } catch {
      setError(isAr ? 'مشكلة في الاتصال.' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : '#ef4444';
  const scoreBg = (s: number) => s >= 70 ? 'bg-green-50' : s >= 45 ? 'bg-yellow-50' : 'bg-red-50';

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition outline-none";

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <WzrdPublicHeader />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isAr ? 'مقارنة بالمنافسين' : 'Competitive Benchmark'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isAr ? 'قارن البراند بتاعك بالمنافسين على ٥ محاور — ٤٠ كريدت' : 'Compare your brand against competitors on 5 pillars — 40 credits'}
        </p>

        {!result ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'اسم شركتك' : 'Your Company'} *</label>
                <input className={inputClass} placeholder={isAr ? 'مثال: Primo Marca' : 'e.g. Primo Marca'}
                  value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'منافس ١' : 'Competitor 1'} *</label>
                <input className={inputClass} placeholder={isAr ? 'اسم المنافس الأول' : 'First competitor'}
                  value={form.competitor1} onChange={e => setForm({ ...form, competitor1: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'منافس ٢ (اختياري)' : 'Competitor 2 (optional)'}</label>
                <input className={inputClass} placeholder={isAr ? 'اسم المنافس الثاني' : 'Second competitor'}
                  value={form.competitor2} onChange={e => setForm({ ...form, competitor2: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'منافس ٣ (اختياري)' : 'Competitor 3 (optional)'}</label>
                <input className={inputClass} placeholder={isAr ? 'اسم المنافس الثالث' : 'Third competitor'}
                  value={form.competitor3} onChange={e => setForm({ ...form, competitor3: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'المجال' : 'Industry'} *</label>
                <input className={inputClass} placeholder={isAr ? 'مثال: مطاعم، أزياء، خدمات' : 'e.g. restaurants, fashion, services'}
                  value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'روابط سوشيال (اختياري)' : 'Social Links (optional)'}</label>
                <input className={inputClass} placeholder={isAr ? 'روابط Instagram أو Facebook' : 'Instagram or Facebook URLs'}
                  value={form.socialLinks} onChange={e => setForm({ ...form, socialLinks: e.target.value })} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-4 p-3 bg-red-50 rounded-xl">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-base hover:bg-indigo-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isAr ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                isAr ? 'قارن — ٤٠ كريدت' : 'Compare — 40 credits'
              )}
            </button>
          </div>
        ) : (
          <div>
            {/* Company Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {result.companies.map((comp, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeTab === i ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {comp.name} ({comp.totalScore})
                </button>
              ))}
            </div>

            {/* Active Company Card */}
            {result.companies[activeTab] && (() => {
              const comp = result.companies[activeTab];
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{comp.name}</h3>
                    <div className="text-3xl font-bold" style={{ color: scoreColor(comp.totalScore) }}>
                      {comp.totalScore}<span className="text-base text-gray-400">/100</span>
                    </div>
                  </div>

                  {/* Pillar Bars */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(comp.pillars || {}).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600">{PILLAR_LABELS[key]?.[isAr ? 'ar' : 'en'] || key}</span>
                          <span className="font-bold" style={{ color: scoreColor(val as number) }}>{val as number}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, backgroundColor: scoreColor(val as number) }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <h4 className="text-xs font-bold text-green-700 mb-2">{isAr ? 'نقاط القوة' : 'Strengths'}</h4>
                      {(comp.strengths || []).map((s, i) => (
                        <p key={i} className="text-xs text-green-600 mb-1">✓ {s}</p>
                      ))}
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl">
                      <h4 className="text-xs font-bold text-red-700 mb-2">{isAr ? 'نقاط الضعف' : 'Weaknesses'}</h4>
                      {(comp.weaknesses || []).map((w, i) => (
                        <p key={i} className="text-xs text-red-600 mb-1">✗ {w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Gap Analysis */}
            {result.gaps && result.gaps.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-4">
                <h3 className="text-sm font-bold text-amber-800 mb-3">{isAr ? 'تحليل الفجوات' : 'Gap Analysis'}</h3>
                {result.gaps.map((g, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-amber-700">{PILLAR_LABELS[g.pillar]?.[isAr ? 'ar' : 'en'] || g.pillar}</span>
                      <span className="text-red-600 font-bold">-{g.gap} {isAr ? 'نقطة' : 'pts'}</span>
                    </div>
                    <p className="text-xs text-amber-600">{g.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Overall Insight */}
            {result.overallInsight && (
              <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5 mb-4">
                <h3 className="text-sm font-bold text-indigo-800 mb-2">{isAr ? 'الخلاصة' : 'Overall Insight'}</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">{result.overallInsight}</p>
              </div>
            )}

            {/* Credits + Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setResult(null); setActiveTab(0); }}
                className="flex-1 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                {isAr ? 'مقارنة جديدة' : 'New Comparison'}
              </button>
              <a href="/my-brand" className="flex-1 py-3 bg-indigo-600 rounded-2xl text-sm font-medium text-white text-center hover:bg-indigo-500 transition">
                {isAr ? 'صحة البراند ←' : '→ My Brand'}
              </a>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              {isAr ? `استخدمت ${result.creditsUsed} كريدت — متبقي ${result.creditsRemaining}` : `Used ${result.creditsUsed} credits — ${result.creditsRemaining} remaining`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
