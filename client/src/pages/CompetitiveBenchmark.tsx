import { useState } from 'react';
import { useLocation } from 'wouter';
import posthog from 'posthog-js';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { useAuth } from '@/_core/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { INDUSTRIES } from '@/lib/industries';

function normalizeUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}

type CompetitorRow = { name: string; url: string };

type BenchmarkCompany = {
  name?: string;
  totalScore?: number;
  pillars?: Record<string, number | string>;
  strengths?: string[];
  weaknesses?: string[];
};

type BenchmarkGap = {
  pillar: string;
  yourScore?: number;
  bestCompetitor?: string;
  bestScore?: number;
  gap: number;
  recommendation?: string;
};

type BenchmarkResult = {
  companies?: BenchmarkCompany[];
  gaps?: BenchmarkGap[];
  overallInsight?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
};

const PILLAR_KEYS = ['positioning', 'messaging', 'offer', 'identity', 'journey'] as const;

export default function CompetitiveBenchmark() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user, loading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([{ name: '', url: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const addCompetitor = () => {
    if (competitors.length >= 3) return;
    setCompetitors((prev) => [...prev, { name: '', url: '' }]);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length <= 1) return;
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: keyof CompetitorRow, value: string) => {
    setCompetitors((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!companyName.trim()) {
      setError(isAr ? 'اكتب اسم شركتك' : 'Enter your company name');
      return;
    }
    if (!industry) {
      setError(isAr ? 'اختر المجال' : 'Select an industry');
      return;
    }
    const filled = competitors.filter((c) => c.name.trim());
    if (filled.length === 0) {
      setError(isAr ? 'أضف اسم منافس واحد على الأقل' : 'Add at least one competitor name');
      return;
    }

    const payload: Record<string, unknown> = {
      companyName: companyName.trim(),
      industry,
      competitors: filled.map((c) => ({
        name: c.name.trim(),
        ...(normalizeUrl(c.url) ? { url: normalizeUrl(c.url) } : {}),
      })),
    };
    const mainU = normalizeUrl(companyUrl);
    if (mainU) payload.companyUrl = mainU;
    if (socialLinks.trim()) payload.socialLinks = socialLinks.trim();

    setLoading(true);
    setError('');
    setResult(null);
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('competitive_benchmark_started');
    }
    try {
      const res = await fetch('/api/trpc/tools.competitiveBenchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: payload }),
      });
      const data = await res.json();
      if (data.error) {
        const msg = data.error.message || data.error.json?.message || '';
        setError(typeof msg === 'string' ? msg : isAr ? 'فشل التحليل' : 'Analysis failed');
        return;
      }
      const out = (data.result?.data?.json ?? data.result?.data) as BenchmarkResult;
      if (out?.companies?.length) {
        setResult(out);
        if (import.meta.env.VITE_POSTHOG_KEY) {
          posthog.capture('competitive_benchmark_completed');
        }
        if (typeof out.creditsRemaining === 'number') setCredits(out.creditsRemaining);
      } else {
        setError(isAr ? 'استجابة غير متوقعة' : 'Unexpected response');
      }
    } catch {
      setError(isAr ? 'خطأ في الشبكة' : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="wzrd-public-page min-h-screen flex items-center justify-center text-slate-500">
        {isAr ? 'جاري التحميل…' : 'Loading…'}
      </div>
    );
  }

  return (
    <div className="wzrd-public-page min-h-screen">
      <WzrdPublicHeader credits={credits} />

      <div className="mx-auto max-w-2xl px-6 pb-20 pt-24">
        <button
          type="button"
          onClick={() => navigate('/tools')}
          className="mb-6 text-sm font-medium text-[#6B7280] hover:text-[#1B4FD8]"
        >
          {isAr ? '→ رجوع للأدوات' : '← Back to Tools'}
        </button>

        <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#1B4FD8]">
            📊 {isAr ? 'مقارنة منافسين' : 'Competitive Benchmark'}
          </div>
          <h1 className="mt-2 text-2xl font-black text-[#111827]">
            {isAr ? 'قارن براندك بالمنافسين' : 'Benchmark your brand vs competitors'}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            {isAr
              ? 'أضف روابط المواقع (اختياري) عشان نسحب محتوى حقيقي ونقارن بدقة. التكلفة ٤٠ كريدت.'
              : 'Add website URLs (optional) so we scrape real content for a data-driven comparison. Costs 40 credits.'}
          </p>
        </div>

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#9CA3AF] mb-1">
                {isAr ? 'اسم شركتك' : 'Your company name'} *
              </label>
              <input
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={isAr ? 'مثال: كافيه سهرة' : 'e.g. Sahra Café'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#9CA3AF] mb-1">
                {isAr ? 'موقع شركتك (اختياري)' : 'Your website (optional)'}
              </label>
              <input
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#9CA3AF] mb-1">
                {isAr ? 'المجال' : 'Industry'} *
              </label>
              <select
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm bg-white"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              >
                <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                {INDUSTRIES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.labelAr : o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#9CA3AF] mb-1">
                {isAr ? 'روابط سوشيال (اختياري)' : 'Social links (optional)'}
              </label>
              <input
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm"
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
                placeholder="Instagram, LinkedIn…"
              />
            </div>

            <div className="border-t border-[#E5E7EB] pt-4">
              <p className="text-sm font-bold text-[#111827] mb-3">
                {isAr ? 'المنافسون (١–٣)' : 'Competitors (1–3)'}
              </p>
              {competitors.map((row, index) => (
                <div key={index} className="mb-4 rounded-xl border border-[#F3F4F6] bg-[#FAFAFA] p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#6B7280]">
                      {isAr ? `منافس ${index + 1}` : `Competitor ${index + 1}`}
                    </span>
                    {competitors.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => removeCompetitor(index)}
                      >
                        {isAr ? 'حذف' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                    value={row.name}
                    onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                    placeholder={isAr ? 'اسم المنافس' : 'Competitor name'}
                  />
                  <input
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
                    value={row.url}
                    onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                    placeholder={isAr ? 'موقع المنافس (اختياري)' : 'Competitor website (optional)'}
                  />
                </div>
              ))}
              {competitors.length < 3 && (
                <button
                  type="button"
                  onClick={addCompetitor}
                  className="text-sm font-semibold text-[#1B4FD8] hover:underline"
                >
                  + {isAr ? 'إضافة منافس' : 'Add competitor'}
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1B4FD8] text-white font-bold py-3.5 text-sm hover:bg-[#153db0] disabled:opacity-50 transition"
            >
              {loading ? (isAr ? 'جاري التحليل…' : 'Analyzing…') : isAr ? 'شغّل المقارنة (٤٠ كريدت)' : 'Run benchmark (40 credits)'}
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-sm font-semibold text-[#1B4FD8] hover:underline"
            >
              {isAr ? '← تحليل جديد' : '← New analysis'}
            </button>

            {result.creditsUsed !== undefined && (
              <p className="text-xs text-[#9CA3AF]">
                {isAr
                  ? `${result.creditsUsed} كريدت · متبقي ${result.creditsRemaining ?? '—'}`
                  : `${result.creditsUsed} credits used · ${result.creditsRemaining ?? '—'} remaining`}
              </p>
            )}

            <div className="space-y-4">
              {(result.companies ?? []).map((co, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-black text-[#111827]">{co.name}</h3>
                    <span className="text-2xl font-black text-[#1B4FD8]">{co.totalScore ?? '—'}</span>
                  </div>
                  {co.pillars && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-xs">
                      {PILLAR_KEYS.map((k) => (
                        <div key={k} className="rounded-lg bg-[#F9FAFB] px-2 py-2 text-center">
                          <div className="text-[#9CA3AF] font-semibold capitalize">{k}</div>
                          <div className="font-bold text-[#111827]">{String(co.pillars?.[k] ?? '—')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {co.strengths && co.strengths.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-bold text-green-700 mb-1">{isAr ? 'نقاط قوة' : 'Strengths'}</div>
                      <ul className="list-disc list-inside text-sm text-[#374151]">
                        {co.strengths.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {co.weaknesses && co.weaknesses.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-amber-700 mb-1">{isAr ? 'نقاط ضعف' : 'Weaknesses'}</div>
                      <ul className="list-disc list-inside text-sm text-[#374151]">
                        {co.weaknesses.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(result.gaps ?? []).length > 0 && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-[#111827] mb-3">{isAr ? 'الفجوات' : 'Gaps'}</h3>
                <ul className="space-y-3 text-sm">
                  {(result.gaps ?? []).map((g, i) => (
                    <li key={i} className="border-b border-[#F3F4F6] pb-3 last:border-0">
                      <span className="font-bold text-[#1B4FD8]">{g.pillar}</span>
                      {g.gap != null && <span className="text-[#6B7280]"> — gap {g.gap}</span>}
                      {g.recommendation && <p className="mt-1 text-[#374151]">{g.recommendation}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.overallInsight && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFF] p-5">
                <h3 className="text-sm font-black text-[#1B4FD8] mb-2">{isAr ? 'الخلاصة' : 'Overall insight'}</h3>
                <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{result.overallInsight}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
