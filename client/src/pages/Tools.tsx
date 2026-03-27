import { useState, useEffect, useRef, useCallback, type MouseEvent } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { StaggerList } from '@/components/StaggerList';
import { toArabicNumerals } from '@/lib/formatUtils';
import { waMeHref } from '@/lib/waContact';
import type { ToolMetaRow } from '@/lib/routerTypes';

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

const ROUTE_MAP: Record<string, string> = {
  brand_diagnosis: '/tools/brand-diagnosis',
  offer_check: '/tools/offer-check',
  message_check: '/tools/message-check',
  presence_audit: '/tools/presence-audit',
  identity_snapshot: '/tools/identity-snapshot',
  launch_readiness: '/tools/launch-readiness',
};

function ToolsGridCard({
  tool,
  locale,
  canAfford,
  onNavigate,
  t,
}: {
  tool: ToolInfo;
  locale: string;
  canAfford: boolean;
  onNavigate: () => void;
  t: (key: string) => string;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const onMove = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setGlow({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    },
    [],
  );

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => canAfford && onNavigate()}
      onMouseMove={onMove}
      disabled={!canAfford}
      className={`group relative overflow-hidden rounded-3xl border-[0.5px] p-8 sm:p-10 text-left transition-all duration-500 ease-out ${
        canAfford
          ? 'wzrd-glass cursor-pointer border-white/40 hover:-translate-y-2 hover:shadow-2xl dark:border-zinc-600/50'
          : 'cursor-not-allowed border-zinc-200/50 bg-zinc-100/40 opacity-55 dark:border-zinc-800 dark:bg-zinc-900/30'
      }`}
    >
      {canAfford && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(0,240,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 90% 10%, ${tool.color}33, transparent 55%), radial-gradient(ellipse 60% 50% at 10% 90%, ${tool.color}22, transparent 50%)`,
          }}
        />
      )}

      <span className="absolute right-5 top-5 z-10 rounded-full border-[0.5px] border-primary/20 bg-gradient-to-r from-primary/15 to-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-primary backdrop-blur-sm dark:from-primary/25">
        {locale === 'ar' ? toArabicNumerals(tool.cost) : tool.cost} {t('wzrd.credits')}
      </span>

      <div className="relative z-[1]">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-white/95 to-zinc-100/90 text-4xl ring-1 ring-white/70 dark:from-zinc-800/95 dark:to-zinc-950/90 dark:ring-zinc-600/45"
          style={{
            boxShadow: `0 16px 44px -14px ${tool.color}66, 0 0 0 1px ${tool.color}22 inset`,
          }}
        >
          <span className="drop-shadow-sm">{tool.icon}</span>
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 transition group-hover:text-primary dark:text-white">
          {locale === 'ar' ? tool.nameAr : tool.name}
        </h3>
        <p className="mb-8 text-sm leading-loose text-zinc-600 dark:text-zinc-400">
          {locale === 'ar' ? tool.descAr : tool.desc}
        </p>
        <div className="flex items-center justify-between rounded-2xl border-[0.5px] border-zinc-200/60 bg-white/40 px-4 py-3 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-950/30">
          <span className="text-sm font-semibold text-primary">
            {canAfford ? `${t('wzrd.run')} →` : <span className="text-red-500 dark:text-red-400">{t('wzrd.notEnoughCredits')}</span>}
          </span>
        </div>
      </div>
    </button>
  );
}

const FALLBACK_TOOLS: ToolInfo[] = [
  { id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', desc: 'Health score + top issues. The starting point.', descAr: 'نتيجة صحة + أهم المشاكل. نقطة البداية.', icon: '🔬', color: '#6d5cff', cost: 20, route: '/tools/brand-diagnosis' },
  { id: 'quick_diagnosis', name: 'Quick Diagnosis', nameAr: 'تشخيص سريع', desc: '5 questions only — fast results in 1 minute.', descAr: '٥ أسئلة بس — نتيجة سريعة في دقيقة.', icon: '⚡', color: '#06b6d4', cost: 20, route: '/tools/quick' },
  { id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', desc: 'Is your offer clear? Pricing logical?', descAr: 'العرض واضح؟ التسعير منطقي؟', icon: '📦', color: '#c8a24e', cost: 25, route: '/tools/offer-check' },
  { id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', desc: 'Messaging consistency and clarity.', descAr: 'اتساق ووضوح الرسالة.', icon: '💬', color: '#44ddc9', cost: 20, route: '/tools/message-check' },
  { id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور', desc: 'Cross-channel digital presence check.', descAr: 'فحص الحضور الرقمي عبر القنوات.', icon: '🌐', color: '#ff6b6b', cost: 25, route: '/tools/presence-audit' },
  { id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', desc: 'Does your personality match your audience?', descAr: 'شخصيتك بتتوافق مع جمهورك؟', icon: '🪞', color: '#a78bfa', cost: 20, route: '/tools/identity-snapshot' },
  { id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', desc: 'How ready are you to go to market?', descAr: 'أد إيه أنت جاهز تنزل السوق؟', icon: '🚀', color: '#f59e0b', cost: 30, route: '/tools/launch-readiness' },
  { id: 'competitive_benchmark', name: 'Competitive Benchmark', nameAr: 'مقارنة بالمنافسين', desc: 'Compare your brand against competitors.', descAr: 'قارن البراند بتاعك بالمنافسين.', icon: '📊', color: '#8b5cf6', cost: 40, route: '/tools/benchmark' },
];

export default function Tools() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [credits, setCredits] = useState<number | null>(null);
  const [tools, setTools] = useState<ToolInfo[]>(FALLBACK_TOOLS);

  useEffect(() => {
    fetch('/api/trpc/credits.balance')
      .then(r => r.json())
      .then(d => setCredits(d.result?.data?.json?.credits ?? d.result?.data?.credits ?? 0))
      .catch(() => setCredits(0));

    fetch('/api/trpc/tools.meta')
      .then(r => r.json())
      .then(d => {
        const meta = d.result?.data?.json?.tools ?? d.result?.data?.tools;
        if (meta?.length) {
          setTools(
            meta.map((t: ToolMetaRow) => ({
              id: t.id,
              name: t.name,
              nameAr: t.nameAr,
              desc: t.desc,
              descAr: t.descAr,
              icon: t.icon,
              color: t.color,
              cost: t.cost,
              route: ROUTE_MAP[t.id] || `/tools/${t.id.replace(/_/g, '-')}`,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const heroTitle = locale === 'ar' ? 'أدوات التحليل الذكي' : 'AI Toolkit';

  return (
    <div className="wzrd-page-radial text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={credits} />

      <div className="wzrd-public-pt max-w-5xl mx-auto px-6 pb-16">
        {credits === 100 && (
          <div className="mb-8 wzrd-glass rounded-3xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-2xl shadow-inner">🎉</span>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-1">{t('wzrd.welcomeStart')}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{t('wzrd.youHaveCredits')}</p>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" onClick={() => navigate('/tools/brand-diagnosis')} className="wzrd-shimmer-btn rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition duration-500 hover:-translate-y-0.5">
                    🔬 {t('wzrd.startDiagnosis')}
                  </button>
                  <button type="button" onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-full border-[0.5px] border-zinc-300/80 bg-white/50 px-5 py-2.5 text-sm font-medium text-zinc-700 backdrop-blur-sm transition hover:border-primary/40 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
                    {t('wzrd.browseTools')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchase') === 'success' && (
          <div className="mb-8 rounded-2xl border-[0.5px] border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center backdrop-blur-md">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">✅ {t('wzrd.paymentSuccess')}</p>
          </div>
        )}

        <div className="mb-12 text-center sm:mb-20">
          <div
            className="animate-wzrd-fade-in mb-6 inline-flex items-center gap-2"
          >
            <span className="wzrd-badge-cyan">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-cyan" />
              {locale === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI-powered toolkit'}
            </span>
          </div>
          <h2
            className={`mb-5 animate-wzrd-slide-up bg-gradient-to-r from-zinc-900 via-primary to-cyan-500 bg-clip-text text-5xl font-extrabold leading-[1.05] tracking-tight text-transparent dark:from-white dark:via-violet-200 dark:to-cyan-300 sm:text-6xl md:text-7xl ${locale === 'ar' ? 'font-sans' : 'font-display'}`}
            style={{ animationDelay: '60ms' }}
          >
            {heroTitle}
          </h2>
          <p
            className="animate-wzrd-slide-up mx-auto max-w-xl text-base leading-loose text-zinc-600 dark:text-zinc-400 sm:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            {t('wzrd.eachToolDesc')}
          </p>
        </div>

        <div id="tools-grid" className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <StaggerList staggerMs={80}>
            {tools.map(tool => {
              const canAfford = credits !== null && credits >= tool.cost;
              return (
                <ToolsGridCard
                  key={tool.id}
                  tool={tool}
                  locale={locale}
                  canAfford={canAfford}
                  onNavigate={() => navigate(tool.route)}
                  t={t}
                />
              );
            })}
          </StaggerList>
        </div>

        {credits !== null && credits < 20 && (
          <div className="mt-14 wzrd-glass rounded-3xl p-8 sm:p-10 text-center border-amber-200/40 dark:border-amber-500/20">
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-2">{t('wzrd.needMoreCredits')}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{t('wzrd.buyCreditsDesc')}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="/pricing" className="wzrd-shimmer-btn inline-flex rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-950 shadow-lg transition hover:-translate-y-0.5">{t('wzrd.buyCredits')}</a>
              <a href={waMeHref()} target="_blank" rel="noreferrer" className="inline-flex rounded-full border-[0.5px] border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-primary dark:border-zinc-600 dark:text-zinc-300">
                {t('wzrd.talkToPrimo')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
