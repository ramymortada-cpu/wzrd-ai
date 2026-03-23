/**
 * Converts Western numerals (0-9) to Arabic-Indic numerals (٠-٩) for RTL display.
 * Use when locale is Arabic for consistent number presentation.
 */
export function toArabicNumerals(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
}
