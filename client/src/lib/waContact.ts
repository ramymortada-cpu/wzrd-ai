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
