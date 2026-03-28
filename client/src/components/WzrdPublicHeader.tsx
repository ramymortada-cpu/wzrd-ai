import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { toArabicNumerals } from "@/lib/formatUtils";
import { useAuth } from "@/_core/hooks/useAuth";

interface WzrdPublicHeaderProps {
  credits?: number | null;
  showCredits?: boolean;
}

const navLinkClass =
  "whitespace-nowrap text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-primary transition shrink-0";

export default function WzrdPublicHeader({ credits, showCredits = true }: WzrdPublicHeaderProps) {
  const [, navigate] = useLocation();
  const { locale, toggleLocale, t } = useI18n();
  const { theme, toggleTheme, switchable } = useTheme();
  const { user } = useAuth();
  const showCommandCenter = Boolean(user && "canAccessCommandCenter" in user && (user as { canAccessCommandCenter?: boolean }).canAccessCommandCenter);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-3 sm:px-5 pointer-events-none">
      <div
        className="pointer-events-auto flex w-full max-w-6xl items-center gap-2 sm:gap-3 rounded-full border-[0.5px] border-white/50 dark:border-zinc-600/50 bg-white/75 dark:bg-zinc-950/70 backdrop-blur-2xl pl-3 pr-2 py-2 sm:pl-5 sm:pr-3 sm:py-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.1)_inset] dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
      >
        <a href="/tools" className="flex shrink-0 items-baseline gap-1" onClick={(e) => { e.preventDefault(); navigate("/tools"); }}>
          <span className="font-display text-base font-bold tracking-tight text-zinc-900 dark:text-white sm:text-lg">
            WZRD
          </span>
          <span className="wzrd-badge-cyan py-0.5 text-[10px] font-semibold leading-none sm:text-[11px]">AI</span>
        </a>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-5 overflow-x-auto scrollbar-hide px-1 py-0.5">
          <a href="/tools" className={navLinkClass} onClick={(e) => { e.preventDefault(); navigate("/tools"); }}>
            {t("wzrd.tools")}
          </a>
          <a href="/profile" className={navLinkClass}>
            {t("wzrd.profile")}
          </a>
          <a href="/pricing" className={navLinkClass}>
            {t("wzrd.buyCredits")}
          </a>
          <a href="/my-brand" className={navLinkClass}>
            {locale === "ar" ? "صحة البراند" : "My Brand"}
          </a>
          <a href="/copilot" className={navLinkClass}>
            {locale === "ar" ? "المستشار" : "Copilot"}
          </a>
          <a href="/my-requests" className={navLinkClass}>
            {locale === "ar" ? "طلباتي" : "My Requests"}
          </a>
          {showCommandCenter && (
            <a
              href="/dashboard"
              className={`${navLinkClass} text-primary font-semibold`}
            >
              {locale === "ar" ? "مركز القيادة" : "Command Center"}
            </a>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showCredits && credits != null && (
            <div className="flex items-center gap-2 rounded-full border-[0.5px] border-primary/25 bg-gradient-to-r from-primary/12 to-cyan-500/10 px-3 py-1.5 dark:from-primary/20 dark:to-cyan-500/15">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-cyan-300 to-primary" />
              </span>
              <span className="font-mono text-xs font-bold text-primary sm:text-sm">
                {locale === "ar" ? toArabicNumerals(credits) : credits} {t("wzrd.credits")}
              </span>
            </div>
          )}
          {switchable && toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full bg-zinc-100 px-2.5 py-1.5 text-[10px] font-bold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 sm:text-xs"
          >
            {locale === "ar" ? "EN" : "ع"}
          </button>
        </div>
      </div>
    </header>
  );
}
