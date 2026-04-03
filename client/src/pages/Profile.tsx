import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';
import WzrdPublicHeader from '@/components/WzrdPublicHeader';
import { toArabicNumerals } from '@/lib/formatUtils';
import type { AuthMe, CreditHistoryRow } from '@/lib/routerTypes';

export default function Profile() {
  const [, navigate] = useLocation();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<AuthMe>(null);
  const [history, setHistory] = useState<CreditHistoryRow[]>([]);

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
            {history.map((h: CreditHistoryRow, i: number) => (
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

        {/* GDPR Section */}
        <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm mt-8">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
            {locale === 'ar' ? 'بياناتك وخصوصيتك' : 'Your Data & Privacy'}
          </h3>
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/trpc/auth.exportData');
                  const d = await res.json();
                  const data = d.result?.data?.json ?? d.result?.data;
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wzzrd-data-export-${new Date().toISOString().slice(0,10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch { alert(locale === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export failed'); }
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition"
            >
              <div className="text-start">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {locale === 'ar' ? 'تصدير بياناتك' : 'Export Your Data'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {locale === 'ar' ? 'تحميل نسخة كاملة من بياناتك بصيغة JSON' : 'Download a complete copy of your data as JSON'}
                </p>
              </div>
              <span className="text-lg">📥</span>
            </button>

            <button
              onClick={() => {
                const msg = locale === 'ar'
                  ? 'هل أنت متأكد؟ سيتم حذف حسابك وكل بياناتك نهائياً.\n\nاكتب إيميلك للتأكيد:'
                  : 'Are you sure? Your account and all data will be permanently deleted.\n\nType your email to confirm:';
                const email = prompt(msg);
                if (!email) return;
                fetch('/api/trpc/auth.deleteAccount', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ json: { confirmEmail: email } }),
                })
                  .then(r => r.json())
                  .then(d => {
                    if (d.result?.data?.json?.success || d.result?.data?.success) {
                      document.cookie = 'app_session_id=;path=/;max-age=0';
                      window.location.href = '/welcome';
                    } else {
                      alert(locale === 'ar' ? 'الإيميل غير مطابق أو حدث خطأ' : 'Email mismatch or error occurred');
                    }
                  })
                  .catch(() => alert(locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
            >
              <div className="text-start">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {locale === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Account Permanently'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {locale === 'ar' ? 'سيتم حذف كل بياناتك وتشخيصاتك وتقاريرك' : 'All your data, diagnoses, and reports will be deleted'}
                </p>
              </div>
              <span className="text-lg">🗑️</span>
            </button>
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
