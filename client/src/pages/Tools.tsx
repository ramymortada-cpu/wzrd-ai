import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import posthog from 'posthog-js';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { useI18n } from '@/lib/i18n';
import { waMeHref } from '@/lib/waContact';

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
  tag?: string;
  tagAr?: string;
}

const ROUTE_MAP: Record<string, string> = {
  brand_diagnosis: '/tools/brand-diagnosis',
  offer_check: '/tools/offer-check',
  message_check: '/tools/message-check',
  presence_audit: '/tools/presence-audit',
  identity_snapshot: '/tools/identity-snapshot',
  launch_readiness: '/tools/launch-readiness',
  competitive_benchmark: '/tools/benchmark',
  quick_diagnosis: '/tools/quick',
};

const FALLBACK_TOOLS: ToolInfo[] = [
  { id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', desc: 'Full health score + top issues. The essential starting point for any brand.', descAr: 'نتيجة صحة كاملة + أهم المشاكل. نقطة البداية الأساسية لأي براند.', icon: '🔬', color: '#1B4FD8', cost: 200, route: '/tools/brand-diagnosis', tag: 'Most Popular', tagAr: 'الأكثر استخداماً' },
  { id: 'quick_diagnosis', name: 'Quick Diagnosis', nameAr: 'تشخيص سريع', desc: '5 questions only — fast results in under 1 minute.', descAr: '٥ أسئلة بس — نتيجة سريعة في أقل من دقيقة.', icon: '⚡', color: '#0891B2', cost: 200, route: '/tools/quick', tag: 'Fast', tagAr: 'سريع' },
  { id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', desc: 'Is your offer clear? Is your pricing logical? Find out fast.', descAr: 'العرض واضح؟ التسعير منطقي؟ اعرف الإجابة بسرعة.', icon: '📦', color: '#D97706', cost: 250, route: '/tools/offer-check' },
  { id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', desc: 'Messaging consistency and clarity across all your channels.', descAr: 'اتساق ووضوح الرسالة عبر كل قنواتك.', icon: '💬', color: '#059669', cost: 200, route: '/tools/message-check' },
  { id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور', desc: 'Cross-channel digital presence check — website, social, search.', descAr: 'فحص الحضور الرقمي عبر القنوات — موقع، سوشيال، بحث.', icon: '🌐', color: '#DC2626', cost: 250, route: '/tools/presence-audit' },
  { id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', desc: 'Does your brand personality match your target audience?', descAr: 'شخصية البراند بتاعتك بتتوافق مع جمهورك المستهدف؟', icon: '🪞', color: '#7C3AED', cost: 200, route: '/tools/identity-snapshot' },
  { id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', desc: 'How ready are you to go to market? Get a readiness score.', descAr: 'أد إيه أنت جاهز تنزل السوق؟ احصل على نتيجة الجاهزية.', icon: '🚀', color: '#D97706', cost: 300, route: '/tools/launch-readiness', tag: 'New', tagAr: 'جديد' },
  { id: 'competitive_benchmark', name: 'Competitive Benchmark', nameAr: 'مقارنة المنافسين', desc: 'Compare your brand vs up to 3 competitors with optional real website scraping.', descAr: 'قارن براندك بحد ٣ منافسين مع سحب اختياري من المواقع.', icon: '📊', color: '#1B4FD8', cost: 400, route: '/tools/benchmark', tag: 'Compare', tagAr: 'قارن' },
];

export default function Tools() {
  const [, navigate] = useLocation();
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const [credits, setCredits] = useState<number | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>(FALLBACK_TOOLS);
  // Dismiss state for welcome card — stored in sessionStorage so it hides after first dismiss
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    try { return sessionStorage.getItem('wzrd_welcome_dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    fetch('/api/trpc/credits.balance', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const val = d?.result?.data?.json?.balance ?? d?.result?.data?.balance ?? d?.result?.data?.json?.credits ?? d?.result?.data?.credits;
        if (typeof val === 'number') setCredits(val);
      })
      .catch(() => {});

    fetch('/api/trpc/tools.meta')
      .then(r => r.json())
      .then(d => {
        const meta = d.result?.data?.json?.tools ?? d.result?.data?.tools;
        if (meta?.length) {
          setTools(
            meta
              .map((t: ToolInfo & { id: string }) => ({
                ...t,
                // Multiply API cost by 10 to match new display values
                cost: (Number(t.cost) || 0) * 10,
                route: ROUTE_MAP[t.id] || `/tools/${t.id.replace(/_/g, '-')}`,
              }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const dismissWelcome = () => {
    try { sessionStorage.setItem('wzrd_welcome_dismissed', '1'); } catch { /* ignore */ }
    setWelcomeDismissed(true);
  };

  // Welcome card: show when credits === 500 (fresh signup) and not dismissed
  const showWelcomeCard = credits === 500 && !welcomeDismissed;

  // Zero credits card: show when credits === 0 (logged in but no credits left)
  const showZeroCreditsCard = credits === 0;

  return (
    <div className="wzrd-public-page min-h-screen">
      <WzrdPublicHeader credits={credits} />

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-24">

        {/* ── Welcome Card (post-signup, 500 credits) ── */}
        {showWelcomeCard && (
          <div className="mb-8 rounded-2xl border border-[#C7D2FE] bg-gradient-to-br from-[#EEF2FF] to-[#F0F9FF] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1B4FD8] text-3xl shadow-md">🎉</span>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-[#111827]">
                    {isAr ? 'مبروك! أنت جاهز تبدأ 🚀' : 'Congratulations! You\'re all set 🚀'}
                  </h3>
                  <button
                    type="button"
                    onClick={dismissWelcome}
                    aria-label="Dismiss"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: '2px 6px' }}
                  >
                    ×
                  </button>
                </div>
                <p className="mb-1 text-sm font-semibold text-[#1B4FD8]">
                  {isAr ? '⚡ معاك ٥٠٠ كريدت مجاني — هدية ترحيب من WZZRD AI' : '⚡ You have 500 free credits — a welcome gift from WZZRD AI'}
                </p>
                <p className="mb-5 text-sm leading-relaxed text-[#374151]">
                  {isAr
                    ? 'استخدمهم دلوقتي في عمل أول تقرير تشخيص لبراندك. اكتشف نقاط القوة والضعف، واحصل على خطة تحسين فورية — كل ده في دقائق.'
                    : 'Use them now to run your first brand diagnostic report. Discover strengths and weaknesses, and get an instant improvement plan — all in minutes.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/tools/brand-diagnosis')}
                    className="rounded-full bg-[#1B4FD8] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#1440B8]"
                  >
                    🔬 {isAr ? 'ابدأ أول تقرير مجاني ←' : 'Start your free report →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="rounded-full border border-[#C7D2FE] bg-white px-6 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#1B4FD8]"
                  >
                    {isAr ? 'تصفح كل الأدوات' : 'Browse all tools'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Zero Credits Card ── */}
        {showZeroCreditsCard && (
          <div className="mb-8 rounded-2xl border border-[#FECACA] bg-gradient-to-br from-[#FFF5F5] to-[#FEF2F2] p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DC2626] text-3xl shadow-md">⚡</span>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-extrabold text-[#111827]">
                  {isAr ? 'الكريدت بتاعك خلص!' : 'Your credits are all used up!'}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-[#374151]">
                  {isAr
                    ? 'محتاج تشحن رصيدك عشان تكمل التحليل. اختار الباقة المناسبة ليك وابدأ من حيث وقفت — بدون انتظار.'
                    : 'You need to top up your credits to continue. Choose the right plan and pick up right where you left off — no waiting.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/pricing"
                    onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}
                    className="rounded-full bg-[#1B4FD8] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#1440B8]"
                    style={{ textDecoration: 'none' }}
                  >
                    {isAr ? '💳 اشحن الكريدت دلوقتي ←' : '💳 Buy credits now →'}
                  </a>
                  <a
                    href={waMeHref()}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#FECACA] bg-white px-6 py-2.5 text-sm font-semibold text-[#374151] transition hover:border-[#DC2626]"
                    style={{ textDecoration: 'none' }}
                  >
                    {isAr ? 'تكلم معنا على WhatsApp' : 'Chat with us on WhatsApp'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Payment success banner ── */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchase') === 'success' && (
          <div className="mb-6 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-center">
            <p className="font-semibold text-[#16A34A]">
              ✅ {isAr ? 'تم الدفع بنجاح — رصيدك اتحدث' : 'Payment successful — your credits have been updated'}
            </p>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1B4FD8]" />
            <span className="text-xs font-bold text-[#1B4FD8]">
              {isAr ? 'مدعوم بالذكاء الاصطناعي' : 'AI-powered toolkit'}
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-black text-[#111827] sm:text-5xl">
            {isAr ? 'أدوات التحليل الذكي' : 'AI Diagnostic Tools'}
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[#6B7280]">
            {isAr
              ? 'كل أداة بتعطيك تشخيص دقيق وخطوات عملية — في ثوانٍ، بدون استشارات مطولة.'
              : 'Each tool gives you a precise diagnosis and actionable steps — in seconds, no lengthy consultations.'}
          </p>
        </div>

        {/* ── Tools Grid ── */}
        <div id="tools-grid" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tools.map(tool => {
            const canAfford = credits === null || credits >= tool.cost;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  if (!canAfford) return;
                  if (import.meta.env.VITE_POSTHOG_KEY) {
                    posthog.capture('tool_selected', { toolId: tool.id, toolName: tool.name });
                  }
                  navigate(tool.route);
                }}
                disabled={!canAfford}
                className={`group relative rounded-2xl border bg-white p-6 text-start shadow-sm transition-all duration-200 ${
                  canAfford
                    ? 'cursor-pointer border-[#E5E7EB] hover:-translate-y-1 hover:border-[#1B4FD8]/40 hover:shadow-md'
                    : 'cursor-not-allowed border-[#E5E7EB] opacity-50'
                }`}
              >
                {tool.tag && (
                  <span
                    className="absolute end-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ background: tool.color }}
                  >
                    {isAr ? tool.tagAr : tool.tag}
                  </span>
                )}
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                  style={{ background: `${tool.color}15`, border: `1px solid ${tool.color}30` }}
                >
                  {tool.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-[#111827] group-hover:text-[#1B4FD8] transition-colors">
                  {isAr ? tool.nameAr : tool.name}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-[#6B7280]">
                  {isAr ? tool.descAr : tool.desc}
                </p>
                <div className="flex items-center justify-between rounded-xl border border-[#F3F4F6] bg-[#FAFAF5] px-4 py-2.5">
                  <span className="text-xs font-semibold text-[#6B7280]">
                    {isAr ? `${tool.cost} كريدت` : `${tool.cost} credits`}
                  </span>
                  <span className="text-sm font-bold transition-colors" style={{ color: canAfford ? tool.color : '#9CA3AF' }}>
                    {canAfford ? (isAr ? 'ابدأ ←' : 'Start →') : (isAr ? 'رصيد غير كافٍ' : 'Not enough credits')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Low credits warning (< 200, not zero) ── */}
        {credits !== null && credits > 0 && credits < 200 && (
          <div className="mt-12 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-8 text-center">
            <h3 className="mb-2 text-base font-bold text-[#111827]">
              {isAr ? 'رصيدك قارب على النفاد' : 'Running low on credits?'}
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-[#6B7280]">
              {isAr ? 'اشحن رصيدك وواصل التحليل بدون انقطاع.' : 'Top up and keep analysing without interruption.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="/pricing"
                onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}
                className="rounded-full bg-[#1B4FD8] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1440B8] transition"
                style={{ textDecoration: 'none' }}
              >
                {isAr ? 'اشحن الرصيد' : 'Buy credits'}
              </a>
              <a href={waMeHref()} target="_blank" rel="noreferrer" className="rounded-full border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm font-semibold text-[#374151] hover:border-[#1B4FD8] transition" style={{ textDecoration: 'none' }}>
                {isAr ? 'تكلم معنا' : 'Talk to us'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
