/**
 * ShareReportPanel — Social Share for WZZRD AI Tool Reports
 * Appears in the result state of ToolPage.
 * Lets users share their report score on LinkedIn, X (Twitter), WhatsApp, and copy link.
 * Fully bilingual (AR/EN).
 */
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const C = {
  surface:    "#FFFFFF",
  blue:       "#1B4FD8",
  blueLight:  "#EEF2FF",
  borderBlue: "rgba(27,79,216,0.2)",
  text:       "#111827",
  muted:      "#6B7280",
  border:     "#E5E7EB",
  green:      "#059669",
  greenLight: "#F0FDF4",
};
const FONT = "'Cairo','Inter','Segoe UI',sans-serif";

interface ShareReportPanelProps {
  toolNameAr:  string;
  toolNameEn:  string;
  /** Overall score 0-100 */
  score?:      number;
  /** Score label e.g. "جيد" / "Good" */
  scoreLabelAr?: string;
  scoreLabelEn?: string;
  /** The current page URL — defaults to window.location.href */
  reportUrl?:  string;
}

export default function ShareReportPanel({
  toolNameAr,
  toolNameEn,
  score,
  scoreLabelAr,
  scoreLabelEn,
  reportUrl,
}: ShareReportPanelProps) {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);

  const url = reportUrl ?? (typeof window !== "undefined" ? window.location.href : "https://wzzrd.ai/tools");

  // ── Share text ──────────────────────────────────────────────────────────────
  const scoreText = score != null
    ? (isAr
        ? `حصلت على ${score}/100 ${scoreLabelAr ? `(${scoreLabelAr})` : ""} في`
        : `I scored ${score}/100 ${scoreLabelEn ? `(${scoreLabelEn})` : ""} on`)
    : (isAr ? "جربت" : "I just tried");

  const shareTextAr =
    `${scoreText} تقرير ${toolNameAr} من WZZRD AI 🚀\n` +
    `أداة ذكاء اصطناعي بتحلل براندك وتديك تقرير احترافي في دقائق — بدون وكالة تسويق!\n` +
    `جرّبها مجاناً: ${url}\n#WZZRD_AI #تسويق_ذكي #براند`;

  const shareTextEn =
    `${scoreText} the ${toolNameEn} report by WZZRD AI 🚀\n` +
    `An AI tool that diagnoses your brand and delivers a professional report in minutes — no agency needed!\n` +
    `Try it free: ${url}\n#WZZRDAI #AIMarketing #BrandDiagnosis`;

  const shareText = isAr ? shareTextAr : shareTextEn;

  // ── Share handlers ──────────────────────────────────────────────────────────
  const shareLinkedIn = () => {
    const params = new URLSearchParams({
      url,
      summary: shareText,
      title:   isAr ? `تقرير ${toolNameAr} — WZZRD AI` : `${toolNameEn} Report — WZZRD AI`,
    });
    window.open(`https://www.linkedin.com/shareArticle?mini=true&${params}`, "_blank", "width=600,height=500");
  };

  const shareX = () => {
    const params = new URLSearchParams({ text: shareText, url });
    window.open(`https://twitter.com/intent/tweet?${params}`, "_blank", "width=600,height=400");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const BUTTONS = [
    {
      id:      "linkedin",
      label:   "LinkedIn",
      icon:    (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      bg:      "#0A66C2",
      onClick: shareLinkedIn,
    },
    {
      id:      "x",
      label:   "X (Twitter)",
      icon:    (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
        </svg>
      ),
      bg:      "#000000",
      onClick: shareX,
    },
    {
      id:      "whatsapp",
      label:   "WhatsApp",
      icon:    (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      bg:      "#25D366",
      onClick: shareWhatsApp,
    },
  ];

  return (
    <div style={{
      background: C.blueLight,
      border: `1.5px solid ${C.borderBlue}`,
      borderRadius: 20,
      padding: "24px 28px",
      fontFamily: FONT,
      direction: isAr ? "rtl" : "ltr",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>📣</span>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>
            {isAr ? "شارك نتيجتك" : "Share your result"}
          </h3>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, marginTop: 2 }}>
            {isAr
              ? "شارك تقريرك على السوشيال ميديا وساعد زملاءك يكتشفوا WZZRD AI"
              : "Share your report on social media and help others discover WZZRD AI"}
          </p>
        </div>
      </div>

      {/* Score preview card */}
      {score != null && (
        <div style={{
          background: C.surface,
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 18,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              {isAr ? toolNameAr : toolNameEn}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, marginTop: 2 }}>
              {isAr ? "نتيجتك" : "Your score"}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{
              fontSize: 32, fontWeight: 900, color: C.blue,
              display: "block", lineHeight: 1,
            }}>
              {score}
            </span>
            <span style={{ fontSize: 11, color: C.muted }}>/ 100</span>
          </div>
          {(scoreLabelAr || scoreLabelEn) && (
            <div style={{
              background: C.blueLight, border: `1px solid ${C.borderBlue}`,
              borderRadius: 100, padding: "4px 12px",
              fontSize: 12, fontWeight: 700, color: C.blue,
            }}>
              {isAr ? scoreLabelAr : scoreLabelEn}
            </div>
          )}
        </div>
      )}

      {/* Share buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        {BUTTONS.map(btn => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: btn.bg, color: "#fff",
              padding: "10px 18px", borderRadius: 100,
              fontWeight: 700, fontSize: 13,
              border: "none", cursor: "pointer", fontFamily: FONT,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}

        {/* Copy link */}
        <button
          onClick={copyLink}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: copied ? C.green : C.surface,
            color: copied ? "#fff" : C.text,
            padding: "10px 18px", borderRadius: 100,
            fontWeight: 700, fontSize: 13,
            border: `1.5px solid ${copied ? C.green : C.border}`,
            cursor: "pointer", fontFamily: FONT,
            transition: "all 0.2s",
          }}
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {isAr ? "تم النسخ!" : "Copied!"}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {isAr ? "نسخ الرابط" : "Copy link"}
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
        {isAr
          ? "💡 مشاركة تقريرك بتساعد أصحاب البيزنس الآخرين يكتشفوا WZZRD AI"
          : "💡 Sharing your report helps other business owners discover WZZRD AI"}
      </p>
    </div>
  );
}
