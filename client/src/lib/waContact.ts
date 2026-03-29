/**
 * WhatsApp wa.me number: country code + local digits, no + prefix.
 * Set VITE_WHATSAPP_E164 in .env (see .env.example). Static HTML under public/ must match manually.
 */
export const WHATSAPP_E164: string =
  (import.meta.env.VITE_WHATSAPP_E164 as string | undefined)?.replace(/\D/g, '') || '201107107012';

export function waMeHref(prefilledText?: string): string {
  const base = `https://wa.me/${WHATSAPP_E164}`;
  if (!prefilledText) return base;
  return `${base}?text=${encodeURIComponent(prefilledText)}`;
}

export type WaMeQualifiedLeadContext = {
  /** Name of the lead/user (optional) */
  leadName?: string | null;
  /** Brand/company name (optional) */
  brandName?: string | null;
  /** Tool/diagnosis label to mention (optional) */
  diagnosisLabel?: string | null;
  /** Score out of 100 (optional) */
  score?: number | null;
  /** Biggest problem / top finding (optional) */
  topIssue?: string | null;
};

/**
 * Smart WhatsApp hand-off link: builds a qualified, prefilled message
 * using whatever context is available (works even when user/company is missing).
 */
export function waMeQualifiedLeadHref(
  context: WaMeQualifiedLeadContext,
): string {
  const leadName = context.leadName?.trim() || null;
  const brandName = context.brandName?.trim() || null;
  const diagnosisLabel = context.diagnosisLabel?.trim() || "تشخيص البراند";
  const score = typeof context.score === "number" ? context.score : null;
  const topIssue = context.topIssue?.trim() || null;

  const lines: string[] = [];
  lines.push("أهلاً رامي،");

  if (leadName && brandName) {
    lines.push(`أنا ${leadName} من شركة ${brandName}.`);
  } else if (leadName) {
    lines.push(`أنا ${leadName}.`);
  } else if (brandName) {
    lines.push(`أنا من شركة ${brandName}.`);
  } else {
    lines.push("أنا مهتم/ة بعمل تقييم لبراند.");
  }

  if (score != null) {
    lines.push(
      `عملت تشخيص (${diagnosisLabel}) على WZZRD AI والـ Score بتاعي ${score}/100.`,
    );
  } else {
    lines.push(`عملت تشخيص (${diagnosisLabel}) على WZZRD AI.`);
  }

  if (topIssue) {
    lines.push(`أكبر مشكلة ظهرتلي هي: ${topIssue}.`);
  }

  lines.push("حابب نحدد ميعاد للمكالمة عشان نصلح ده. تقدر تقترح وقت مناسب؟");

  return waMeHref(lines.join("\n"));
}
