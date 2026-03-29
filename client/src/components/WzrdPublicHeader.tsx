/**
 * WzrdPublicHeader — الـ navbar الموحد لكل الـ public pages
 *
 * Design tokens:
 *   bg:      #FAFAF8  (warm white / beige)
 *   border:  #E8E3DC
 *   blue:    #1B4FD8  (from logo)
 *   text:    #111827
 *   muted:   #6B7280
 *
 * NOTE: هذا الـ header للـ public pages فقط (Welcome, Pricing, Login, Signup, Tools, Blog)
 * الـ dashboard له WzrdAppShell منفصل
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const BLUE = "#1B4FD8";

const NAV_LINKS = [
  { label: "الرئيسية", href: "/" },
  { label: "الأدوات",  href: "/tools" },
  { label: "الأسعار",  href: "/pricing" },
  { label: "المدونة",  href: "/blog" },
];

interface WzrdPublicHeaderProps {
  credits?: number | null;
}

export default function WzrdPublicHeader({ credits }: WzrdPublicHeaderProps = {}) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      {/* ── Google Font ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,250,248,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8E3DC",
          fontFamily: "'Cairo', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
          dir="rtl"
        >
          {/* ── Logo → Home ── */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigate("/"); setMenuOpen(false); }}
            style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}
            aria-label="WZZRD AI — الرئيسية"
          >
            <img
              src="/logo.webp"
              alt="WZZRD AI"
              style={{ height: 38, width: "auto", objectFit: "contain" }}
            />
          </a>

          {/* ── Desktop Nav ── */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flex: 1,
              justifyContent: "center",
            }}
            className="wzrd-nav-desktop"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: isActive(link.href) ? 700 : 600,
                  color: isActive(link.href) ? BLUE : "#4B5563",
                  background: isActive(link.href) ? "#EEF2FF" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
            className="wzrd-nav-desktop"
          >
            {user ? (
              <>
                {credits != null && (
                  <div style={{
                    padding: "6px 14px",
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 700,
                    color: BLUE,
                    background: "#EEF2FF",
                    border: "1px solid rgba(27,79,216,0.2)",
                    whiteSpace: "nowrap",
                  }}>
                    {credits} كريدت
                  </div>
                )}
                <a
                  href="/tools"
                  onClick={(e) => { e.preventDefault(); navigate("/tools"); }}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    background: BLUE,
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(27,79,216,0.3)",
                  }}
                >
                  لوحة التحكم ←
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); navigate("/login"); }}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#374151",
                    background: "transparent",
                    border: "1.5px solid #D1D5DB",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  تسجيل الدخول
                </a>
                <a
                  href="/signup"
                  onClick={(e) => { e.preventDefault(); navigate("/signup"); }}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    background: BLUE,
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(27,79,216,0.3)",
                  }}
                >
                  ابدأ مجاناً ←
                </a>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="wzrd-nav-mobile"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              color: "#374151",
              display: "none",
            }}
            aria-label="القائمة"
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
            dir="rtl"
            style={{
              background: "#FAFAF8",
              borderTop: "1px solid #E8E3DC",
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
                {link.label}
              </a>
            ))}
            <div style={{ borderTop: "1px solid #E8E3DC", marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {user ? (
                <a
                  href="/tools"
                  onClick={(e) => { e.preventDefault(); navigate("/tools"); setMenuOpen(false); }}
                  style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#fff", background: BLUE, textDecoration: "none", textAlign: "center" }}
                >
                  لوحة التحكم ←
                </a>
              ) : (
                <>
                  <a
                    href="/login"
                    onClick={(e) => { e.preventDefault(); navigate("/login"); setMenuOpen(false); }}
                    style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#374151", border: "1.5px solid #D1D5DB", textDecoration: "none", textAlign: "center" }}
                  >
                    تسجيل الدخول
                  </a>
                  <a
                    href="/signup"
                    onClick={(e) => { e.preventDefault(); navigate("/signup"); setMenuOpen(false); }}
                    style={{ padding: "12px 16px", borderRadius: 8, fontSize: 15, fontWeight: 700, color: "#fff", background: BLUE, textDecoration: "none", textAlign: "center" }}
                  >
                    ابدأ مجاناً ←
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Responsive CSS ── */}
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
