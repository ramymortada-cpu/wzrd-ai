import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';

export default function Profile() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Fetch user info
    fetch('/api/trpc/auth.me')
      .then(r => r.json())
      .then(d => setUser(d.result?.data?.json ?? d.result?.data))
      .catch(() => {});

    // Fetch credit history
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <WzrdPublicHeader credits={user?.credits} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs text-indigo-500 dark:text-indigo-400 tracking-widest mb-2">// PROFILE</p>
          <h2 className="text-2xl font-bold mb-1">{user?.name || (locale === 'ar' ? 'جاري التحميل...' : 'Loading...')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('wzrd.availableCredits')}</p>
              <p className="text-4xl font-bold font-mono text-amber-600 dark:text-amber-400">{user?.credits ?? '...'}</p>
            </div>
            <button onClick={() => navigate('/pricing')}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition">
              {t('wzrd.buyMore')}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-3">{t('wzrd.creditHistory')}</h3>
          <div className="space-y-1">
            {history.map((h: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/20">
                <div>
                  <span className="text-sm">{typeLabel[h.type] ? typeLabel[h.type][locale] : h.type}</span>
                  {h.toolName && <span className="text-xs text-zinc-500 dark:text-zinc-600 ms-2">{h.toolName.replace(/_/g, ' ')}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-bold ${h.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {h.amount > 0 ? '+' : ''}{h.amount}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-600">{new Date(h.createdAt).toLocaleDateString(locale)}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && <p className="text-zinc-500 dark:text-zinc-600 text-sm py-4 text-center">{t('wzrd.noTransactions')}</p>}
          </div>
        </div>

        <div className="mt-12 text-center">
          <button onClick={() => {
            fetch('/api/trpc/auth.logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
              .finally(() => { document.cookie = 'app_session_id=;path=/;max-age=0'; window.location.href = '/welcome'; });
          }} className="text-xs text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition">
            {t('wzrd.logOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
