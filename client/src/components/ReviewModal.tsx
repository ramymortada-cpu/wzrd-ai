/**
 * ReviewModal — Incentivized Review Loop
 * Shows after a tool report is ready.
 * User rates (1–5 stars) + writes a comment + selects country.
 * On submit → 100 credits are awarded automatically.
 * Fully bilingual (AR/EN).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/lib/i18n";

const C = {
  bg:         "#FAFAF5",
  surface:    "#FFFFFF",
  blue:       "#1B4FD8",
  blueDark:   "#1239A6",
  blueLight:  "#EEF2FF",
  blueGlow:   "rgba(27,79,216,0.12)",
  text:       "#111827",
  muted:      "#6B7280",
  border:     "#E5E7EB",
  borderBlue: "rgba(27,79,216,0.2)",
  green:      "#059669",
  amber:      "#F59E0B",
  overlay:    "rgba(0,0,0,0.55)",
};
const FONT = "'Cairo','Inter','Segoe UI',sans-serif";

const COUNTRIES = [
  { name: "Egypt",        nameAr: "مصر",         flag: "🇪🇬" },
  { name: "Saudi Arabia", nameAr: "السعودية",    flag: "🇸🇦" },
  { name: "UAE",          nameAr: "الإمارات",    flag: "🇦🇪" },
  { name: "Kuwait",       nameAr: "الكويت",      flag: "🇰🇼" },
  { name: "Jordan",       nameAr: "الأردن",      flag: "🇯🇴" },
  { name: "Qatar",        nameAr: "قطر",         flag: "🇶🇦" },
  { name: "Bahrain",      nameAr: "البحرين",     flag: "🇧🇭" },
  { name: "Oman",         nameAr: "عُمان",       flag: "🇴🇲" },
  { name: "Morocco",      nameAr: "المغرب",      flag: "🇲🇦" },
  { name: "Tunisia",      nameAr: "تونس",        flag: "🇹🇳" },
  { name: "Algeria",      nameAr: "الجزائر",     flag: "🇩🇿" },
  { name: "Libya",        nameAr: "ليبيا",       flag: "🇱🇾" },
  { name: "Lebanon",      nameAr: "لبنان",       flag: "🇱🇧" },
  { name: "Iraq",         nameAr: "العراق",      flag: "🇮🇶" },
  { name: "Sudan",        nameAr: "السودان",     flag: "🇸🇩" },
  { name: "Other",        nameAr: "دولة أخرى",  flag: "🌍" },
];

const STAR_LABELS_AR = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز 🔥"];
const STAR_LABELS_EN = ["", "Poor", "Fair", "Good", "Very Good", "Excellent 🔥"];

interface ReviewModalProps {
  toolId:     string;
  toolNameAr: string;
  toolNameEn: string;
  onClose:    () => void;
  onSuccess?: (creditsAwarded: number) => void;
}

export default function ReviewModal({
  toolId, toolNameAr, toolNameEn, onClose, onSuccess,
}: ReviewModalProps) {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [step, setStep]           = useState<"review" | "success">("review");
  const [rating, setRating]       = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentAr, setCommentAr] = useState("");
  const [commentEn, setCommentEn] = useState("");
  const [country, setCountry]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [creditsAwarded, setCreditsAwarded] = useState(0);

  const submitMutation = trpc.reviews.submit.useMutation({
    onSuccess: (data) => {
      setCreditsAwarded(data.creditsAwarded);
      setStep("success");
      if (onSuccess) onSuccess(data.creditsAwarded);
    },
    onError: (_err) => {
      setError(isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, please try again");
      setSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      setError(isAr ? "من فضلك اختار تقييمك بالنجوم" : "Please select a star rating");
      return;
    }
    setError("");
    setSubmitting(true);
    submitMutation.mutate({
      toolId,
      toolNameAr,
      toolNameEn,
      rating,
      commentAr: commentAr.trim() || undefined,
      commentEn: commentEn.trim() || undefined,
      country:   country || undefined,
    });
  };

  const displayRating = hoverRating || rating;
  const starLabel = isAr ? STAR_LABELS_AR[displayRating] : STAR_LABELS_EN[displayRating];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: C.overlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: C.surface,
        borderRadius: 24,
        padding: "36px 32px",
        maxWidth: 520,
        width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
        fontFamily: FONT,
        direction: isAr ? "rtl" : "ltr",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, insetInlineEnd: 16,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: C.muted, lineHeight: 1, padding: "4px 8px",
          }}
        >×</button>

        {step === "review" ? (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>⭐</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>
                {isAr ? "شاركنا رأيك" : "Share your feedback"}
              </h2>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                {isAr
                  ? <>تقييمك بيساعدنا نتحسن — وهتاخد <strong style={{ color: C.blue }}>١٠٠ كريدت مجاني</strong> كشكر منا</>
                  : <>Your review helps us improve — and you'll get <strong style={{ color: C.blue }}>100 free credits</strong> as a thank you</>
                }
              </p>
              {/* Tool name badge */}
              <div style={{
                display: "inline-block", marginTop: 10,
                background: C.blueLight, border: `1px solid ${C.borderBlue}`,
                borderRadius: 100, padding: "4px 14px",
                fontSize: 12, fontWeight: 700, color: C.blue,
              }}>
                {isAr ? toolNameAr : toolNameEn}
              </div>
            </div>

            {/* Star rating */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 38, lineHeight: 1,
                      filter: star <= displayRating ? "none" : "grayscale(1) opacity(0.3)",
                      transform: star <= displayRating ? "scale(1.1)" : "scale(1)",
                      transition: "all 0.15s",
                    }}
                  >⭐</button>
                ))}
              </div>
              {displayRating > 0 && (
                <p style={{ fontSize: 14, fontWeight: 700, color: C.amber }}>
                  {starLabel}
                </p>
              )}
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                {isAr ? "تعليقك (اختياري)" : "Your comment (optional)"}
              </label>
              <textarea
                value={isAr ? commentAr : commentEn}
                onChange={e => isAr ? setCommentAr(e.target.value) : setCommentEn(e.target.value)}
                placeholder={isAr
                  ? "ما الذي أعجبك في التقرير؟ ما الذي يمكن تحسينه؟"
                  : "What did you like about the report? What could be improved?"
                }
                rows={3}
                maxLength={1000}
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 12, border: `1.5px solid ${C.border}`,
                  fontSize: 14, color: C.text, background: "#F9FAFB",
                  resize: "vertical", outline: "none", fontFamily: FONT,
                  direction: isAr ? "rtl" : "ltr",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: "end" }}>
                {(isAr ? commentAr : commentEn).length}/1000
              </p>
            </div>

            {/* Country selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                {isAr ? "بلدك (اختياري)" : "Your country (optional)"}
              </label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: 12, border: `1.5px solid ${C.border}`,
                  fontSize: 14, color: country ? C.text : C.muted,
                  background: "#F9FAFB", outline: "none", fontFamily: FONT,
                  direction: isAr ? "rtl" : "ltr",
                  cursor: "pointer",
                }}
              >
                <option value="">{isAr ? "اختار بلدك" : "Select your country"}</option>
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {isAr ? c.nameAr : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward reminder */}
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 22 }}>🎁</span>
              <p style={{ fontSize: 13, color: "#166534", fontWeight: 600, margin: 0 }}>
                {isAr
                  ? "بمجرد إرسال تقييمك — هتاخد ١٠٠ كريدت فوراً في حسابك"
                  : "As soon as you submit — 100 credits will be added to your account instantly"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 12, textAlign: "center" }}>
                ⚠️ {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              style={{
                width: "100%",
                background: submitting || rating === 0 ? "#9CA3AF" : C.blue,
                color: "#fff",
                padding: "14px",
                borderRadius: 100,
                fontWeight: 900,
                fontSize: 16,
                border: "none",
                cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
                fontFamily: FONT,
                transition: "background 0.2s",
              }}
            >
              {submitting
                ? (isAr ? "جاري الإرسال..." : "Submitting...")
                : (isAr ? "أرسل التقييم واحصل على ١٠٠ كريدت ⚡" : "Submit & get 100 credits ⚡")
              }
            </button>

            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>
              {isAr
                ? "تقييمك سيظهر على الصفحة الرئيسية بعد المراجعة"
                : "Your review will appear on the homepage after moderation"}
            </p>
          </>
        ) : (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 12 }}>
              {isAr ? "شكراً جزيلاً!" : "Thank you so much!"}
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
              {isAr
                ? "تقييمك وصلنا وبيتراجع دلوقتي. وكمان تم إضافة:"
                : "Your review has been received and is being reviewed. We've also added:"}
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: C.blueLight, border: `2px solid ${C.borderBlue}`,
              borderRadius: 100, padding: "12px 28px",
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: C.blue }}>
                +{creditsAwarded > 0 ? creditsAwarded : 100} {isAr ? "كريدت" : "Credits"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
              {isAr
                ? "تم إضافة الكريدت لحسابك فوراً — يمكنك استخدامها في أي أداة تشخيص"
                : "Credits have been added to your account instantly — use them on any diagnostic tool"}
            </p>
            <button
              onClick={onClose}
              style={{
                background: C.blue, color: "#fff",
                padding: "13px 32px", borderRadius: 100,
                fontWeight: 800, fontSize: 15,
                border: "none", cursor: "pointer", fontFamily: FONT,
              }}
            >
              {isAr ? "متشكرين ✓" : "Got it ✓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
