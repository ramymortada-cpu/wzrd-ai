import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/contexts/ThemeContext";
import { toArabicNumerals } from "@/lib/formatUtils";

interface WzrdPublicHeaderProps {
  credits?: number | null;
  showCredits?: boolean;
}

export default function WzrdPublicHeader({ credits, showCredits = true }: WzrdPublicHeaderProps) {
  const [, navigate] = useLocation();
  const { locale, toggleLocale, t } = useI18n();
  const { theme, toggleTheme, switchable } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo — left */}
        <a
          href="/tools"
          className="flex items-baseline gap-1 shrink-0"
        >
          <span className="text-lg font-bold tracking-wider font-mono text-zinc-900 dark:text-white">
            WZRD
          </span>
          <span className="text-lg font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
            AI
          </span>
        </a>

        {/* Nav — center */}
        <nav className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <a
            href="/tools"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {t("wzrd.tools")}
          </a>
          <a
            href="/profile"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {t("wzrd.profile")}
          </a>
          <a
            href="/pricing"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {t("wzrd.buyCredits")}
          </a>
        </nav>

        {/* Right: language + theme + credits */}
        <div className="flex items-center gap-3 shrink-0">
          {showCredits && credits != null && (
            <div className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2">
              <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                {locale === "ar" ? toArabicNumerals(credits) : credits}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("wzrd.credits")}
              </span>
            </div>
          )}
          {switchable && toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={toggleLocale}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {locale === "ar" ? "EN" : "ع"}
          </button>
        </div>
      </div>
    </header>
  );
}
