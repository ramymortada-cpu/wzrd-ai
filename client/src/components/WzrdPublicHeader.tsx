/**
 * WzrdPublicHeader — الـ navbar الموحد لكل الـ public pages
 *
 * Design tokens (from wzrd-public-page in index.css):
 *   bg:      #FAFAF8  (warm white / beige)
 *   border:  #E8E3DC
 *   blue:    #1B4FD8
 *   text:    #111827
 *
 * Features:
 *   ✓ EN/AR language toggle (useI18n hook)
 *   ✓ RTL/LTR aware layout
 *   ✓ Credits badge when logged in
 *   ✓ Responsive hamburger menu
 *   ✓ Active page highlight
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

const BLUE   = "#1B4FD8";
const BG     = "rgba(250,250,248,0.97)";
const BORDER = "#E8E3DC";

const NAV_LINKS = [
  { ar: "الرئيسية",  en: "Home",    href: "/" },
  { ar: "الأدوات",   en: "Tools",   href: "/tools" },
  { ar: "التقارير",  en: "Reports", href: "/reports" },
  { ar: "الأسعار",   en: "Pricing", href: "/pricing" },
  { ar: "المدونة",   en: "Blog",    href: "/blog" },
];

interface WzrdPublicHeaderProps {
  credits?: number | null;
}

export default function WzrdPublicHeader({ credits }: WzrdPublicHeaderProps = {}) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { locale, toggleLocale } = useI18n();
  const isAr = locale === "ar";

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const navLabel = (link: typeof NAV_LINKS[0]) => isAr ? link.ar : link.en;

  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: BG,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${BORDER}`,
          fontFamily: isAr ? "'Cairo', 'Segoe UI', sans-serif" : "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Main bar ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); setMenuOpen(false); }}
            aria-label="WZZRD AI — Home"
            style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}
          >
            <img
              src="/logo.webp"
              alt="WZZRD AI"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </a>

          {/* ── Desktop Nav ── */}
          <nav
            className="wzrd-nav-desktop"
            style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive(link.href) ? 700 : 600,
                  color: isActive(link.href) ? BLUE : "#374151",
                  background: isActive(link.href) ? "#EEF2FF" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {navLabel(link)}
              </a>
            ))}
          </nav>

          {/* ── Desktop: lang toggle + auth ── */}
          <div
            className="wzrd-nav-desktop"
            style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
          >
            {/* EN / AR toggle */}
            <button
              onClick={toggleLocale}
              title={isAr ? "Switch to English" : "التبديل للعربية"}
              style={{
                padding: "6px 13px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#374151",
                background: "transparent",
                border: `1.5px solid ${BORDER}`,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = BLUE;
                b.style.color = BLUE;
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = BORDER;
                b.style.color = "#374151";
              }}
            >
              {isAr ? "EN" : "AR"}
            </button>

            {/* Credits badge — always visible: 0 for guests, real balance for logged-in users */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 12px",
              borderRadius: 999,
              background: user ? "#EEF2FF" : "#F3F4F6",
              border: `1px solid ${user ? "rgba(27,79,216,0.2)" : "#E5E7EB"}`,
              fontSize: 12,
              fontWeight: 700,
              color: user ? BLUE : "#9CA3AF",
              whiteSpace: "nowrap",
              cursor: user ? "default" : "pointer",
            }}
            onClick={() => { if (!user) navigate("/signup"); }}
            title={user ? undefined : (isAr ? "سجّل للحصول على ٥٠٠ كريدت مجاني" : "Sign up for 500 free credits")}
            >
              ⚡ {user ? (credits ?? 0) : 0} {isAr ? "كريدت" : "CR"}
            </div>

            {user ? (
              <a
                href="/tools"
                onClick={(e) => { e.preventDefault(); navigate("/tools"); }}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  background: BLUE,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(27,79,216,0.3)",
                }}
              >
              {isAr ? "← لوحة التحكم" : "Dashboard →"}
                </a>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); navigate("/login"); }}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#374151",
                    background: "transparent",
                    border: `1.5px solid ${BORDER}`,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {isAr ? "تسجيل الدخول" : "Log in"}
                </a>
                <a
                  href="/signup"
                  onClick={(e) => { e.preventDefault(); navigate("/signup"); }}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    background: BLUE,
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(27,79,216,0.3)",
                  }}
                >
                  {isAr ? "← ابدأ مجاناً" : "Get started →"}
                </a>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="wzrd-nav-mobile"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#374151", display: "none" }}
            aria-label={isAr ? "القائمة" : "Menu"}
          >
            {menuOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div
            style={{
              background: "#FAFAF8",
              borderTop: `1px solid ${BORDER}`,
              padding: "16px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); setMenuOpen(false); }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: isActive(link.href) ? 700 : 600,
                  color: isActive(link.href) ? BLUE : "#374151",
                  background: isActive(link.href) ? "#EEF2FF" : "transparent",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {navLabel(link)}
              </a>
            ))}

            {/* Language toggle */}
            <button
              onClick={() => { toggleLocale(); setMenuOpen(false); }}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "#374151",
                background: "#F3F4F6",
                border: "none",
                cursor: "pointer",
                textAlign: "start",
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif",
              }}
            >
              {isAr ? "🌐 Switch to English" : "🌐 التبديل للعربية"}
            </button>

            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {user ? (
                <a
                  href="/tools"
                  onClick={(e) => { e.preventDefault(); navigate("/tools"); setMenuOpen(false); }}
                  style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#fff", background: BLUE, textDecoration: "none", textAlign: "center" }}
                >
                  {isAr ? "← لوحة التحكم" : "Dashboard →"}
                </a>
              ) : (
                <>
                  <a
                    href="/login"
                    onClick={(e) => { e.preventDefault(); navigate("/login"); setMenuOpen(false); }}
                    style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#374151", border: `1.5px solid ${BORDER}`, textDecoration: "none", textAlign: "center" }}
                  >
                    {isAr ? "تسجيل الدخول" : "Log in"}
                  </a>
                  <a
                    href="/signup"
                    onClick={(e) => { e.preventDefault(); navigate("/signup"); setMenuOpen(false); }}
                    style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#fff", background: BLUE, textDecoration: "none", textAlign: "center" }}
                  >
                    {isAr ? "← ابدأ مجاناً" : "Get started →"}
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .wzrd-nav-desktop { display: none !important; }
            .wzrd-nav-mobile  { display: block !important; }
          }
          @media (min-width: 769px) {
            .wzrd-nav-mobile  { display: none !important; }
          }
        `}</style>
      </header>
    </>
  );
}
