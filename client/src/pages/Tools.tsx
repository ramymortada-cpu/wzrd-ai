import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';
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
}

const ROUTE_MAP: Record<string, string> = {
  brand_diagnosis: '/tools/brand-diagnosis',
  offer_check: '/tools/offer-check',
  message_check: '/tools/message-check',
  presence_audit: '/tools/presence-audit',
  identity_snapshot: '/tools/identity-snapshot',
  launch_readiness: '/tools/launch-readiness',
};

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
          setTools(meta.map((t: any) => ({
            ...t,
            route: ROUTE_MAP[t.id] || `/tools/${t.id.replace(/_/g, '-')}`,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const heroTitle = locale === 'ar' ? 'أدوات التحليل الذكي' : 'AI Toolkit';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={credits} />

      {/* Hero section */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        {credits === 100 && (
          <div className="mb-8 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 dark:from-indigo-500/5 dark:to-cyan-500/5 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🎉</span>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t('wzrd.welcomeStart')}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{t('wzrd.youHaveCredits')}</p>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => navigate('/tools/brand-diagnosis')} className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition hover:-translate-y-0.5">
                    🔬 {t('wzrd.startDiagnosis')}
                  </button>
                  <button onClick={() => document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm hover:text-zinc-900 dark:hover:text-white transition">
                    {t('wzrd.browseTools')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('purchase') === 'success' && (
          <div className="mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 dark:bg-green-500/10 text-center">
            <p className="text-green-600 dark:text-green-400 font-semibold">✅ {t('wzrd.paymentSuccess')}</p>
          </div>
        )}

        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">{heroTitle}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">{t('wzrd.eachToolDesc')}</p>
        </div>

        {/* Tools grid — 2-col desktop, 1-col mobile */}
        <div id="tools-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map(tool => {
            const canAfford = credits !== null && credits >= tool.cost;
            return (
              <button
                key={tool.id}
                onClick={() => canAfford && navigate(tool.route)}
                disabled={!canAfford}
                className={`text-left p-8 rounded-2xl border transition-all duration-300 group shadow-md ${
                  canAfford
                    ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-500/40 cursor-pointer'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800/50 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="text-4xl mb-5">{tool.icon}</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {locale === 'ar' ? tool.nameAr : tool.name}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed" style={{ lineHeight: 1.7 }}>
                  {locale === 'ar' ? tool.descAr : tool.desc}
                </p>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                  <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {locale === 'ar' ? toArabicNumerals(tool.cost) : tool.cost} {t('wzrd.credits')}
                  </span>
                  {canAfford ? (
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {t('wzrd.run')} →
                    </span>
                  ) : (
                    <span className="text-sm text-red-500 dark:text-red-400">{t('wzrd.notEnoughCredits')}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {credits !== null && credits < 20 && (
          <div className="mt-12 p-8 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 text-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{t('wzrd.needMoreCredits')}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{t('wzrd.buyCreditsDesc')}</p>
            <div className="flex gap-3 justify-center">
              <a href="/pricing" className="px-6 py-2.5 rounded-full bg-amber-500 text-zinc-950 text-sm font-bold hover:-translate-y-0.5 transition shadow-md">{t('wzrd.buyCredits')}</a>
              <a href={waMeHref()} target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm hover:border-amber-500 transition">{t('wzrd.talkToPrimo')}</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
