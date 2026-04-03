/**
 * Reports.tsx — WZZRD AI Content Library
 *
 * A public page listing PDF reports, guides, frameworks, and templates.
 * Free items → instant download.
 * Paid items → deduct credits then return pdfUrl.
 *
 * Categories (from reportsLib router):
 *   market_report | brand_guide | marketing_guide | template | framework | other
 *
 * Bilingual: AR (RTL) / EN (LTR)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { useI18n } from '@/lib/i18n';
import SEO from '@/components/SEO';
import { useAuth } from '@/_core/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'all' | 'market_report' | 'brand_guide' | 'marketing_guide' | 'template' | 'framework' | 'other';

interface Report {
  id: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  descAr: string | null;
  descEn: string | null;
  category: string;
  coverImage: string | null;
  isFree: number | boolean;
  creditCost: number;
  downloadCount: number;
  createdAt: string;
}

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES: { value: Category; labelEn: string; labelAr: string; icon: string }[] = [
  { value: 'all',              labelEn: 'All',              labelAr: 'الكل',             icon: '📚' },
  { value: 'market_report',    labelEn: 'Market Reports',   labelAr: 'تقارير السوق',     icon: '📊' },
  { value: 'brand_guide',      labelEn: 'Brand Guides',     labelAr: 'أدلة البراند',     icon: '🎨' },
  { value: 'marketing_guide',  labelEn: 'Marketing Guides', labelAr: 'أدلة التسويق',     icon: '📣' },
  { value: 'template',         labelEn: 'Templates',        labelAr: 'قوالب',            icon: '📋' },
  { value: 'framework',        labelEn: 'Frameworks',       labelAr: 'فريمووركس',        icon: '🧩' },
  { value: 'other',            labelEn: 'Other',            labelAr: 'أخرى',             icon: '📁' },
];

// ─── Placeholder cards when no reports exist yet ──────────────────────────────
const PLACEHOLDER_REPORTS: Report[] = [
  {
    id: -1, slug: 'coming-soon-1',
    titleAr: 'تقرير حالة التسويق الرقمي في السوق العربي 2025',
    titleEn: 'State of Digital Marketing in the Arab Market 2025',
    descAr: 'تحليل شامل لأحدث اتجاهات التسويق الرقمي في المنطقة العربية — قريباً.',
    descEn: 'A comprehensive analysis of the latest digital marketing trends in the Arab region — coming soon.',
    category: 'market_report', coverImage: null, isFree: true, creditCost: 0, downloadCount: 0, createdAt: new Date().toISOString(),
  },
  {
    id: -2, slug: 'coming-soon-2',
    titleAr: 'دليل بناء هوية البراند من الصفر',
    titleEn: 'Brand Identity Building Guide from Scratch',
    descAr: 'خطوات عملية لبناء هوية بصرية ولفظية متماسكة — قريباً.',
    descEn: 'Practical steps to build a cohesive visual and verbal identity — coming soon.',
    category: 'brand_guide', coverImage: null, isFree: true, creditCost: 0, downloadCount: 0, createdAt: new Date().toISOString(),
  },
  {
    id: -3, slug: 'coming-soon-3',
    titleAr: 'فريمووورك تحليل المنافسين',
    titleEn: 'Competitor Analysis Framework',
    descAr: 'قالب جاهز لتحليل المنافسين وتحديد الفجوات — قريباً.',
    descEn: 'A ready-made template for competitor analysis and gap identification — coming soon.',
    category: 'framework', coverImage: null, isFree: false, creditCost: 200, downloadCount: 0, createdAt: new Date().toISOString(),
  },
  {
    id: -4, slug: 'coming-soon-4',
    titleAr: 'قالب خطة المحتوى الشهرية',
    titleEn: 'Monthly Content Plan Template',
    descAr: 'قالب احترافي لتخطيط المحتوى على مدار الشهر — قريباً.',
    descEn: 'A professional template for planning content throughout the month — coming soon.',
    category: 'template', coverImage: null, isFree: false, creditCost: 150, downloadCount: 0, createdAt: new Date().toISOString(),
  },
  {
    id: -5, slug: 'coming-soon-5',
    titleAr: 'دليل التسويق بالمحتوى للشركات الناشئة',
    titleEn: 'Content Marketing Guide for Startups',
    descAr: 'كيف تبني استراتيجية محتوى بميزانية محدودة — قريباً.',
    descEn: 'How to build a content strategy on a limited budget — coming soon.',
    category: 'marketing_guide', coverImage: null, isFree: true, creditCost: 0, downloadCount: 0, createdAt: new Date().toISOString(),
  },
  {
    id: -6, slug: 'coming-soon-6',
    titleAr: 'تقرير أسعار الإعلانات الرقمية 2025',
    titleEn: 'Digital Advertising Pricing Report 2025',
    descAr: 'أسعار الإعلانات على منصات التواصل الاجتماعي ومحركات البحث — قريباً.',
    descEn: 'Ad pricing on social media platforms and search engines — coming soon.',
    category: 'market_report', coverImage: null, isFree: false, creditCost: 300, downloadCount: 0, createdAt: new Date().toISOString(),
  },
];

// ─── Category badge styles ────────────────────────────────────────────────────
const categoryStyle = (cat: string): { bg: string; color: string } => {
  switch (cat) {
    case 'market_report':   return { bg: '#EEF2FF', color: '#1B4FD8' };
    case 'brand_guide':     return { bg: '#FDF4FF', color: '#7C3AED' };
    case 'marketing_guide': return { bg: '#F0FDF4', color: '#16A34A' };
    case 'template':        return { bg: '#FFFBEB', color: '#D97706' };
    case 'framework':       return { bg: '#FFF1F2', color: '#E11D48' };
    default:                return { bg: '#F3F4F6', color: '#6B7280' };
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const { user } = useAuth();

  const [reports, setReports]             = useState<Report[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [credits, setCredits]             = useState<number | null>(null);
  const [downloading, setDownloading]     = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds]     = useState<Set<number>>(new Set());

  // ── Fetch credits ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetch('/api/trpc/credits.balance', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const val =
          d?.result?.data?.json?.balance ??
          d?.result?.data?.balance ??
          d?.result?.data?.json?.credits ??
          d?.result?.data?.credits;
        if (typeof val === 'number') setCredits(val);
      })
      .catch(() => {});
  }, [user]);

  // ── Fetch already-unlocked report IDs ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetch('/api/trpc/reportsLib.myDownloads', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const list = d?.result?.data?.json ?? d?.result?.data ?? [];
        if (Array.isArray(list)) {
          setUnlockedIds(new Set(list.map((x: { reportId: number }) => x.reportId)));
        }
      })
      .catch(() => {});
  }, [user]);

  // ── Fetch reports ──────────────────────────────────────────────────────────
  const fetchReports = useCallback(async (cat: Category) => {
    setLoading(true);
    try {
      const input = cat === 'all'
        ? JSON.stringify({ json: { limit: 50 } })
        : JSON.stringify({ json: { category: cat, limit: 50 } });
      const res = await fetch(
        `/api/trpc/reportsLib.list?input=${encodeURIComponent(input)}`
      );
      const data = await res.json();
      const list = data?.result?.data?.json ?? data?.result?.data ?? [];
      setReports(Array.isArray(list) ? list : []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(activeCategory); }, [activeCategory, fetchReports]);

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = async (report: Report) => {
    setDownloadError(null);
    const isFree = report.isFree === 1 || report.isFree === true;

    // Placeholder cards — not downloadable yet
    if (report.id < 0) {
      setDownloadError(
        isAr ? 'هذا التقرير قيد الإعداد — سيكون متاحاً قريباً.' : 'This report is being prepared — coming soon.'
      );
      return;
    }

    if (isFree) {
      // Free: fetch the slug to get the pdfUrl
      try {
        const res = await fetch(
          `/api/trpc/reportsLib.getBySlug?input=${encodeURIComponent(JSON.stringify({ json: { slug: report.slug } }))}`
        );
        const data = await res.json();
        const pdfUrl = data?.result?.data?.json?.pdfUrl ?? data?.result?.data?.pdfUrl;
        if (pdfUrl) {
          window.open(pdfUrl, '_blank');
        }
      } catch {
        setDownloadError(isAr ? 'حدث خطأ. حاول مجدداً.' : 'An error occurred. Please try again.');
      }
      return;
    }

    // Paid: require login
    if (!user) {
      navigate('/signup');
      return;
    }

    // Already unlocked
    if (unlockedIds.has(report.id)) {
      // Re-fetch to get pdfUrl
      setDownloading(report.id);
      try {
        const res = await fetch('/api/trpc/reportsLib.download', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { reportId: report.id } }),
        });
        const data = await res.json();
        const pdfUrl = data?.result?.data?.json?.pdfUrl ?? data?.result?.data?.pdfUrl;
        if (pdfUrl) window.open(pdfUrl, '_blank');
      } catch {
        setDownloadError(isAr ? 'حدث خطأ. حاول مجدداً.' : 'An error occurred. Please try again.');
      } finally {
        setDownloading(null);
      }
      return;
    }

    // Check credits
    if (credits !== null && credits < report.creditCost) {
      setDownloadError(
        isAr
          ? `رصيدك غير كافٍ. تحتاج ${report.creditCost} كريدت.`
          : `Insufficient credits. You need ${report.creditCost} credits.`
      );
      return;
    }

    // Deduct & download
    setDownloading(report.id);
    try {
      const res = await fetch('/api/trpc/reportsLib.download', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { reportId: report.id } }),
      });
      const data = await res.json();
      if (data?.error) {
        setDownloadError(
          isAr
            ? (data.error?.message || 'حدث خطأ. حاول مجدداً.')
            : (data.error?.message || 'An error occurred. Please try again.')
        );
        return;
      }
      const pdfUrl = data?.result?.data?.json?.pdfUrl ?? data?.result?.data?.pdfUrl;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        setUnlockedIds(prev => new Set([...prev, report.id]));
        if (credits !== null) setCredits(credits - report.creditCost);
      }
    } catch {
      setDownloadError(isAr ? 'حدث خطأ. حاول مجدداً.' : 'An error occurred. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // ── Display list ───────────────────────────────────────────────────────────
  const displayReports = loading
    ? []
    : reports.length > 0
      ? reports
      : PLACEHOLDER_REPORTS.filter(r => activeCategory === 'all' || r.category === activeCategory);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="wzrd-public-page min-h-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <SEO
        title="Reports & Resources Library"
        titleAr="مكتبة التقارير والموارد"
        description="Free and premium reports, guides, and templates for brand building and marketing in the Arab market."
        descriptionAr="تقارير وأدلة وقوالب مجانية ومدفوعة لبناء البراند والتسويق في السوق العربي."
        path="/reports"
        locale={locale}
      />
      <WzrdPublicHeader credits={credits} />

      {/* ── Hero ── */}
      <section className="border-b border-[#E8E3DC] bg-white px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#EEF2FF] px-4 py-1.5 text-xs font-bold text-[#1B4FD8]">
            📚 {isAr ? 'مكتبة المحتوى' : 'Content Library'}
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight text-[#111827] sm:text-4xl">
            {isAr
              ? 'تقارير وأدلة تسويقية مجانية ومدفوعة'
              : 'Free & Premium Marketing Reports'}
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[#6B7280]">
            {isAr
              ? 'كل ما تحتاجه لفهم السوق، بناء البراند، وتنفيذ استراتيجيات تسويقية ناجحة — في مكان واحد.'
              : 'Everything you need to understand the market, build your brand, and execute successful marketing strategies — in one place.'}
          </p>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {[
              { n: displayReports.filter(r => r.isFree === 1 || r.isFree === true).length || '3+', label: isAr ? 'تقارير مجانية' : 'Free Reports' },
              { n: displayReports.length || '6+', label: isAr ? 'مورد متاح' : 'Resources' },
              { n: '2K+', label: isAr ? 'تحميل' : 'Downloads' },
            ].map(({ n, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-[#1B4FD8]">{n}</div>
                <div className="text-xs text-[#9CA3AF]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Error Banner */}
        {downloadError && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{downloadError}</span>
            <button
              type="button"
              onClick={() => setDownloadError(null)}
              className="ms-4 text-red-400 hover:text-red-600"
            >✕</button>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background: activeCategory === cat.value ? '#1B4FD8' : '#F3F4F6',
                color: activeCategory === cat.value ? '#FFFFFF' : '#374151',
                border: activeCategory === cat.value ? '1px solid #1B4FD8' : '1px solid #E5E7EB',
              }}
            >
              <span>{cat.icon}</span>
              <span>{isAr ? cat.labelAr : cat.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-[#E5E7EB] bg-white p-5">
                <div className="mb-3 h-40 rounded-xl bg-[#F3F4F6]" />
                <div className="mb-2 h-4 w-3/4 rounded bg-[#F3F4F6]" />
                <div className="h-3 w-1/2 rounded bg-[#F3F4F6]" />
              </div>
            ))}
          </div>
        )}

        {/* Reports Grid */}
        {!loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayReports.map(report => {
              const isFree = report.isFree === 1 || report.isFree === true;
              const isPlaceholder = report.id < 0;
              const isUnlocked = unlockedIds.has(report.id);
              const isDownloading = downloading === report.id;
              const catStyle = categoryStyle(report.category);
              const catInfo = CATEGORIES.find(c => c.value === report.category);
              const title = isAr ? report.titleAr : report.titleEn;
              const desc  = isAr ? (report.descAr || report.descEn) : (report.descEn || report.descAr);

              return (
                <div
                  key={report.id}
                  className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all hover:shadow-md"
                  style={{ opacity: isPlaceholder ? 0.75 : 1 }}
                >
                  {/* Cover Image or Placeholder */}
                  <div
                    className="relative flex h-44 items-center justify-center overflow-hidden rounded-t-2xl"
                    style={{ background: catStyle.bg }}
                  >
                    {report.coverImage ? (
                      <img
                        src={report.coverImage}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-60">
                        <span className="text-5xl">{catInfo?.icon ?? '📄'}</span>
                        <span className="text-xs font-semibold" style={{ color: catStyle.color }}>
                          {isAr ? catInfo?.labelAr : catInfo?.labelEn}
                        </span>
                      </div>
                    )}

                    {/* Free / Paid badge */}
                    <div
                      className="absolute top-3 end-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: isFree ? '#F0FDF4' : '#EEF2FF',
                        color: isFree ? '#16A34A' : '#1B4FD8',
                        border: `1px solid ${isFree ? '#BBF7D0' : '#C7D2FE'}`,
                      }}
                    >
                      {isFree
                        ? (isAr ? 'مجاني' : 'FREE')
                        : `${report.creditCost} ${isAr ? 'كريدت' : 'CR'}`}
                    </div>

                    {/* Coming Soon overlay */}
                    {isPlaceholder && (
                      <div className="absolute inset-0 flex items-end justify-center rounded-t-2xl bg-gradient-to-t from-black/30 to-transparent pb-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-[#374151]">
                          {isAr ? 'قريباً' : 'Coming Soon'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Category pill */}
                    <span
                      className="mb-2 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: catStyle.bg, color: catStyle.color }}
                    >
                      {isAr ? catInfo?.labelAr : catInfo?.labelEn}
                    </span>

                    <h3 className="mb-2 text-sm font-bold leading-snug text-[#111827]">
                      {title}
                    </h3>

                    {desc && (
                      <p className="mb-4 flex-1 text-xs leading-relaxed text-[#6B7280] line-clamp-3">
                        {desc}
                      </p>
                    )}

                    {/* Download count */}
                    {!isPlaceholder && report.downloadCount > 0 && (
                      <p className="mb-3 text-[10px] text-[#9CA3AF]">
                        ↓ {report.downloadCount.toLocaleString()} {isAr ? 'تحميل' : 'downloads'}
                      </p>
                    )}

                    {/* CTA Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(report)}
                      disabled={isDownloading || isPlaceholder}
                      className="mt-auto w-full rounded-full py-2.5 text-xs font-bold transition-all disabled:opacity-50"
                      style={{
                        background: isPlaceholder
                          ? '#F3F4F6'
                          : isUnlocked || isFree
                            ? '#1B4FD8'
                            : '#111827',
                        color: isPlaceholder ? '#9CA3AF' : '#FFFFFF',
                      }}
                    >
                      {isDownloading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          {isAr ? 'جاري التحميل…' : 'Downloading…'}
                        </span>
                      ) : isPlaceholder ? (
                        isAr ? 'قريباً' : 'Coming Soon'
                      ) : isUnlocked ? (
                        isAr ? '↓ تحميل مرة أخرى' : '↓ Download Again'
                      ) : isFree ? (
                        isAr ? '↓ تحميل مجاني' : '↓ Free Download'
                      ) : user ? (
                        isAr ? `↓ فتح — ${report.creditCost} كريدت` : `↓ Unlock — ${report.creditCost} CR`
                      ) : (
                        isAr ? 'سجّل مجاناً للتحميل' : 'Sign up free to unlock'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayReports.length === 0 && (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">📭</div>
            <h3 className="mb-2 text-lg font-bold text-[#111827]">
              {isAr ? 'لا توجد تقارير في هذا القسم بعد' : 'No reports in this category yet'}
            </h3>
            <p className="text-sm text-[#6B7280]">
              {isAr ? 'نعمل على إضافة محتوى جديد باستمرار — تابعنا!' : 'We\'re constantly adding new content — stay tuned!'}
            </p>
          </div>
        )}

        {/* ── Value Proposition Strip ── */}
        <div className="mt-16 rounded-2xl border border-[#E5E7EB] bg-white p-8">
          <h2 className="mb-6 text-center text-lg font-black text-[#111827]">
            {isAr ? 'لماذا مكتبة WZZRD AI؟' : 'Why the WZZRD AI Library?'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: '🎯',
                titleEn: 'Actionable Content',
                titleAr: 'محتوى قابل للتطبيق',
                bodyEn: 'Every report and guide is built for real business decisions, not academic reading.',
                bodyAr: 'كل تقرير ودليل مصمم لقرارات أعمال حقيقية، مش للقراءة الأكاديمية.',
              },
              {
                icon: '🌍',
                titleEn: 'Arab Market Focus',
                titleAr: 'تركيز على السوق العربي',
                bodyEn: 'Data and insights specific to the MENA region — not generic global reports.',
                bodyAr: 'بيانات ورؤى خاصة بمنطقة الشرق الأوسط وشمال أفريقيا — مش تقارير عالمية عامة.',
              },
              {
                icon: '⚡',
                titleEn: 'Always Updated',
                titleAr: 'محدّث باستمرار',
                bodyEn: 'We publish new resources regularly. Free credits for early subscribers.',
                bodyAr: 'ننشر موارد جديدة بانتظام. كريدت مجاني للمشتركين الأوائل.',
              },
            ].map(item => (
              <div key={item.titleEn} className="rounded-xl bg-[#FAFAF5] p-5 text-center">
                <div className="mb-3 text-3xl">{item.icon}</div>
                <h3 className="mb-2 text-sm font-bold text-[#111827]">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-xs leading-relaxed text-[#6B7280]">
                  {isAr ? item.bodyAr : item.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA for non-logged-in users ── */}
        {!user && (
          <div className="mt-8 rounded-2xl border border-[#1B4FD8] bg-[#EEF2FF] p-8 text-center">
            <div className="mb-2 text-2xl">🎁</div>
            <h3 className="mb-2 text-lg font-bold text-[#111827]">
              {isAr ? 'سجّل مجاناً واحصل على ٥٠٠ كريدت' : 'Sign up free and get 500 credits'}
            </h3>
            <p className="mb-5 text-sm text-[#6B7280]">
              {isAr
                ? 'استخدم الكريدت لفتح التقارير المدفوعة وتشغيل أدوات التشخيص.'
                : 'Use credits to unlock paid reports and run diagnostic tools.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-full bg-[#1B4FD8] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#1440B8] transition"
            >
              {isAr ? 'إنشاء حساب مجاني ←' : 'Create free account →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
