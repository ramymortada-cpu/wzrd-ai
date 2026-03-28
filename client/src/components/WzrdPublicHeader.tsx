import React, { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wzrd-theme";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function applyThemeClass(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function readInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // افتراضي فاتح أول زيارة — إحساس «وكالة»؛ التبديل اليدوي يبقى في localStorage
  return "light";
}

export default function WzrdPublicHeader() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const initial = readInitialTheme();
    applyThemeClass(initial);
    setIsDark(initial === "dark");
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const mode: "light" | "dark" = prev ? "light" : "dark";
      applyThemeClass(mode);
      localStorage.setItem(STORAGE_KEY, mode);
      return !prev;
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-gray-950/95 dark:shadow-none dark:ring-1 dark:ring-white/10">
      <div
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4"
        dir="rtl"
      >
        <a
          href="/"
          className="shrink-0 text-lg font-bold text-gray-900 transition hover:text-teal-700 dark:text-white dark:hover:text-teal-300"
        >
          WZRD AI
        </a>

        <nav
          className="order-3 flex w-full basis-full flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-200 sm:order-none sm:flex-1 sm:basis-auto sm:justify-center md:gap-8"
          aria-label="التنقل الرئيسي"
        >
          <a
            href="#how-it-works"
            className="transition hover:text-teal-600 dark:hover:text-teal-400"
          >
            كيف يعمل
          </a>
          <a href="/tools" className="transition hover:text-teal-600 dark:hover:text-teal-400">
            الأدوات
          </a>
          <a href="/pricing" className="transition hover:text-teal-600 dark:hover:text-teal-400">
            الأسعار
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-800 transition hover:bg-gray-100 dark:border-white/15 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-amber-500 dark:text-amber-200" />
            ) : (
              <MoonIcon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            )}
          </button>
          <a
            href="#report-preview-heading"
            className="rounded-lg bg-teal-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm ring-1 ring-teal-800/30 transition hover:bg-teal-700 dark:bg-teal-500 dark:ring-white/25 dark:hover:bg-teal-600 sm:px-4"
          >
            ابدأ التشخيص مجاناً
          </a>
        </div>
      </div>
    </header>
  );
}
