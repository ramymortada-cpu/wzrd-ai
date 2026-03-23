import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';

export default function Profile() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/trpc/auth.me')
      .then(r => r.json())
      .then(d => setUser(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});

    fetch('/api/trpc/credits.history')
      .then(r => r.json())
      .then(d => setHistory(d.result?.data?.json ?? d.result?.data ?? []))
      .catch(() => {});
  }, []);

  const typeLabel: Record<string, { en: string; ar: string }> = {
    signup_bonus: { en: '🎁 Signup Bonus', ar: 'كريديت تسجيل' },
    purchase: { en: '💳 Purchase', ar: 'شراء' },
    tool_usage: { en: '🔬 Tool Usage', ar: 'استخدام أداة' },
    refund: { en: '↩️ Refund', ar: 'استرداد' },
    admin: { en: '⚙️ Admin', ar: 'أدمن' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={user?.credits} />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {user?.name || (locale === 'ar' ? 'جاري التحميل...' : 'Loading...')}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">{user?.email}</p>
        </div>

        <div className="p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('wzrd.availableCredits')}</p>
              <p className="text-4xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {user?.credits != null ? (locale === 'ar' ? toArabicNumerals(user.credits) : user.credits) : '...'}
              </p>
            </div>
            <button onClick={() => navigate('/pricing')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-bold hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 transition">
              {t('wzrd.buyMore')}
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{t('wzrd.creditHistory')}</h3>
          <div className="space-y-2">
            {history.map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition">
                <div>
                  <span className="text-sm font-medium">{typeLabel[h.type] ? typeLabel[h.type][locale] : h.type}</span>
                  {h.toolName && <span className="text-xs text-zinc-500 dark:text-zinc-500 ms-2">{h.toolName.replace(/_/g, ' ')}</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm font-bold ${h.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {h.amount > 0 ? '+' : ''}{locale === 'ar' ? toArabicNumerals(h.amount) : h.amount}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">{new Date(h.createdAt).toLocaleDateString(locale)}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-zinc-500 dark:text-zinc-500 text-sm py-8 text-center">{t('wzrd.noTransactions')}</p>}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button onClick={() => {
            fetch('/api/trpc/auth.logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
              .finally(() => { document.cookie = 'app_session_id=;path=/;max-age=0'; window.location.href = '/welcome'; });
          }} className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition">
            {t('wzrd.logOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
