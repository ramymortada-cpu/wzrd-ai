import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import SEO from '@/components/SEO';
import { toArabicNumerals } from '@/lib/formatUtils';
import type { AuthMe } from '@/lib/routerTypes';

export default function Referrals() {
  const { t, locale } = useI18n();
  const isAr = locale === 'ar';
  const [user, setUser] = useState<AuthMe>(null);
  const [code, setCode] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [stats, setStats] = useState<{ totalReferred: number; creditsEarned: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/trpc/auth.me')
      .then(r => r.json())
      .then(d => setUser(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});

    fetch('/api/trpc/referral.myCode')
      .then(r => r.json())
      .then(d => {
        const data = d.result?.data?.json ?? d.result?.data;
        setCode(data?.code || '');
        setShareUrl(data?.shareUrl || '');
      })
      .catch(() => {});

    fetch('/api/trpc/referral.myStats')
      .then(r => r.json())
      .then(d => setStats(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = isAr
      ? `جرّب WZZRD AI — أداة تشخيص البراند بالذكاء الاصطناعي. سجّل من الرابط ده وكل واحد فينا هياخد ٥٠ كريدت مجاناً:\n${shareUrl}`
      : `Try WZZRD AI — AI brand diagnosis tool. Sign up with this link and we both get 50 free credits:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareTwitter = () => {
    const msg = isAr
      ? `اكتشفت أداة ذكية لتشخيص البراند — WZZRD AI 🔥\nجربها مجاناً:`
      : `Discovered an amazing AI brand diagnosis tool — WZZRD AI 🔥\nTry it free:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <SEO
        title={isAr ? 'ادعُ أصحابك — WZZRD AI' : 'Invite Friends — WZZRD AI'}
        description={isAr ? 'ادعُ أصحابك واحصل على 50 كريدت مجاني لكل إحالة ناجحة' : 'Invite friends and earn 50 free credits for each successful referral'}
      />
      <WzrdPublicHeader credits={user?.credits} />
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-3xl font-bold mb-3">
            {isAr ? 'ادعُ أصحابك واكسب كريدت مجاني' : 'Invite Friends, Earn Free Credits'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            {isAr
              ? 'كل صاحب يسجّل من رابطك، كل واحد فيكم بياخد ٥٠ كريدت مجاناً'
              : 'For every friend who signs up with your link, you both get 50 free credits'}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
              <p className="text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {isAr ? toArabicNumerals(stats.totalReferred) : stats.totalReferred}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {isAr ? 'أصحاب سجّلوا' : 'Friends Referred'}
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
              <p className="text-3xl font-bold font-mono text-green-600 dark:text-green-400">
                {isAr ? toArabicNumerals(stats.creditsEarned) : stats.creditsEarned}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {isAr ? 'كريدت اكتسبتها' : 'Credits Earned'}
              </p>
            </div>
          </div>
        )}

        {/* Share Link */}
        <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md mb-6">
          <h3 className="text-lg font-bold mb-4">
            {isAr ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl || (isAr ? 'جاري التحميل...' : 'Loading...')}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-mono"
              dir="ltr"
            />
            <button
              onClick={copyLink}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition whitespace-nowrap"
            >
              {copied ? (isAr ? 'تم النسخ ✅' : 'Copied ✅') : (isAr ? 'انسخ الرابط' : 'Copy Link')}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition"
          >
            <span>📱</span>
            {isAr ? 'شارك على واتساب' : 'Share on WhatsApp'}
          </button>
          <button
            onClick={shareTwitter}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white font-bold hover:bg-zinc-800 dark:hover:bg-zinc-600 transition"
          >
            <span>𝕏</span>
            {isAr ? 'شارك على تويتر' : 'Share on X/Twitter'}
          </button>
        </div>

        {/* How it works */}
        <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h3 className="text-lg font-bold mb-4">
            {isAr ? 'إزاي بيشتغل؟' : 'How It Works'}
          </h3>
          <div className="space-y-4">
            {[
              { step: '1', ar: 'انسخ رابط الإحالة الخاص بك', en: 'Copy your unique referral link' },
              { step: '2', ar: 'ابعته لأصحابك أو شاركه على السوشيال ميديا', en: 'Share it with friends or on social media' },
              { step: '3', ar: 'لما صاحبك يسجّل من الرابط، كل واحد فيكم بياخد ٥٠ كريدت', en: 'When they sign up, you both get 50 credits' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {isAr ? toArabicNumerals(Number(s.step)) : s.step}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-1.5">
                  {isAr ? s.ar : s.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
