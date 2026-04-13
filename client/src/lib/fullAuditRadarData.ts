/**
 * Sprint J — map Full Audit pillars to recharts Radar rows (0–100, max 7 axes).
 */

export type PillarRadarInput = {
  name: string;
  nameAr: string;
  score: number;
};

const MAX_AXES = 7;
const MAX_LABEL_LEN = 18;

function shortenLabel(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_LABEL_LEN) return t;
  return `${t.slice(0, MAX_LABEL_LEN - 1)}…`;
}

export function pillarsToRadarData(
  pillars: PillarRadarInput[] | null | undefined,
  isAr: boolean,
): Array<{ subject: string; score: number }> {
  if (!pillars?.length) return [];

  const slice = pillars.slice(0, MAX_AXES);
  const out: Array<{ subject: string; score: number }> = [];

  for (const p of slice) {
    const raw = typeof p.score === "number" && Number.isFinite(p.score) ? p.score : 0;
    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const rawLabel = isAr ? (p.nameAr || p.name) : (p.name || p.nameAr);
    const label = shortenLabel(rawLabel.trim() || "—");
    out.push({ subject: label, score });
  }

  return out;
}
