/**
 * Full Audit PDF — Sprint B (Plan B: HTML → Puppeteer)
 * Arabic + charts render natively in HTML; avoids jsPDF font/shaping issues.
 * Do not modify pdfGenerator.ts — this module is standalone.
 */

import { mkdir, writeFile, readdir, unlink, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import puppeteer from "puppeteer";
import { logger } from "./_core/logger";
import type { FullAuditResult } from "../drizzle/schema";

/** After Arabic gate test — we ship HTML+Puppeteer for full-audit PDFs. */
export const FULL_AUDIT_PDF_ENGINE = "html-puppeteer" as const;

// Match server/pdfGenerator.ts BRAND (WZZRD)
export const FULL_AUDIT_BRAND = {
  primary: "#E8A838",
  secondary: "#1A1A2E",
  accent: "#F5A623",
  text: "#1A1A2E",
  textLight: "#6B7280",
  bg: "#FFFFFF",
  bgAlt: "#FFF9F0",
  divider: "#E5E7EB",
} as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidFullAuditPdfUuid(uuid: string): boolean {
  return UUID_RE.test(uuid);
}

export function escapeHtml(s: unknown): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getFullAuditPdfDir(): string {
  return process.env.WZZRD_PDF_TMP_DIR ?? join(tmpdir(), "wzzrd-pdfs");
}

/** Delete PDF + meta older than maxAgeMs (default 24h). */
export async function cleanupOldFullAuditPdfs(dir: string, maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
  let removed = 0;
  try {
    const names = await readdir(dir);
    const now = Date.now();
    for (const name of names) {
      if (!name.endsWith(".meta.json")) continue;
      const base = name.replace(/\.meta\.json$/, "");
      const metaPath = join(dir, name);
      try {
        const raw = await readFile(metaPath, "utf8");
        const meta = JSON.parse(raw) as { createdAt?: number };
        const created = meta.createdAt ?? 0;
        if (now - created <= maxAgeMs) continue;
        await unlink(metaPath).catch(() => {});
        await unlink(join(dir, `${base}.pdf`)).catch(() => {});
        removed += 1;
      } catch {
        /* skip */
      }
    }
  } catch (err) {
    logger.debug({ err, dir }, "[FullAuditPdf] cleanup skipped");
  }
  return removed;
}

interface PillarLike {
  id?: string;
  name?: string;
  nameAr?: string;
  score?: number;
  summary?: string;
  source?: string;
  findings?: Array<{ title?: string; detail?: string; severity?: string }>;
}

interface AuditJson {
  pillars?: PillarLike[];
  overallScore?: number | null;
  overallLabel?: string | null;
  confidence?: string;
  confidenceScore?: number;
  confidenceReason?: string;
  confidenceReasonAr?: string;
  top3Issues?: Array<{ issue?: string; impact?: string; fix?: string }>;
  actionPlan?: { thisWeek?: string[]; thisMonth?: string[]; next3Months?: string[] };
  limitations?: string[];
}

function normalizePillars(data: AuditJson): PillarLike[] {
  const raw = Array.isArray(data.pillars) ? data.pillars : [];
  if (raw.length >= 7) return raw.slice(0, 7);
  const placeholders: PillarLike[] = [];
  for (let i = raw.length; i < 7; i++) {
    placeholders.push({
      id: `missing_${i}`,
      name: "—",
      nameAr: "غير متاح",
      score: 0,
      summary: "No data for this pillar.",
      source: "user_input",
      findings: [],
    });
  }
  return [...raw, ...placeholders];
}

/** SVG radar chart (7 axes) — no external Chart.js (fewer network deps in CI). */
export function buildRadarSvg(pillars: PillarLike[], size = 280): string {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const n = 7;
  const scores = pillars.slice(0, 7).map((p) => (typeof p.score === "number" ? Math.max(0, Math.min(100, p.score)) : 0));
  while (scores.length < 7) scores.push(0);

  const points = scores.map((s, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    const r = (R * s) / 100;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  });

  const grid = [0.25, 0.5, 0.75, 1]
    .map((f) => {
      const poly = Array.from({ length: n }, (_, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
        return `${cx + R * f * Math.cos(angle)},${cy + R * f * Math.sin(angle)}`;
      }).join(" ");
      return `<polygon fill="none" stroke="${FULL_AUDIT_BRAND.divider}" stroke-width="1" points="${poly}" />`;
    })
    .join("");

  const axes = Array.from({ length: n }, (_, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${FULL_AUDIT_BRAND.divider}" stroke-width="1" />`;
  }).join("");

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${grid}
  ${axes}
  <polygon fill="${FULL_AUDIT_BRAND.primary}33" stroke="${FULL_AUDIT_BRAND.primary}" stroke-width="2" points="${points.join(" ")}" />
</svg>`.trim();
}

export function buildFullAuditHtml(row: FullAuditResult): string {
  const data = (row.resultJson ?? {}) as AuditJson;
  const pillars = normalizePillars(data);
  const company = escapeHtml(row.companyName);
  const industry = escapeHtml(row.industry);
  const score = typeof data.overallScore === "number" ? data.overallScore : row.overallScore ?? "—";
  const label = escapeHtml(data.overallLabel ?? "");
  const conf = escapeHtml(data.confidence ?? "");
  const confReason = escapeHtml(data.confidenceReasonAr || data.confidenceReason || "");
  const date = escapeHtml(new Date(row.createdAt).toLocaleDateString("ar-EG"));
  const radar = buildRadarSvg(pillars);

  const top3 = (data.top3Issues ?? []).slice(0, 3);
  const ap = data.actionPlan ?? {};
  const lim = Array.isArray(data.limitations) ? data.limitations : [];

  const pillarPages = pillars
    .map((p, idx) => {
      const title = escapeHtml(p.nameAr || p.name || `Pillar ${idx + 1}`);
      const sc = typeof p.score === "number" ? p.score : "—";
      const src = escapeHtml(p.source ?? "");
      const sum = escapeHtml(p.summary ?? "");
      const findings = (p.findings ?? [])
        .map(
          (f) => `
      <div class="finding sev-${escapeHtml(f.severity ?? "low")}">
        <strong>${escapeHtml(f.title ?? "")}</strong>
        <p>${escapeHtml(f.detail ?? "")}</p>
      </div>`
        )
        .join("");
      return `
<section class="pdf-page">
  <h2>${idx + 3}. ${title}</h2>
  <p class="meta">Score: <strong>${sc}</strong> · Source: ${src}</p>
  <p>${sum}</p>
  <div class="findings">${findings || "<p class='muted'>No findings.</p>"}</div>
</section>`;
    })
    .join("");

  const top3Html = top3
    .map(
      (t, i) => `
    <div class="issue">
      <h4>${i + 1}. ${escapeHtml(t.issue ?? "")}</h4>
      <p><em>Impact:</em> ${escapeHtml(t.impact ?? "")}</p>
      <p><em>Fix:</em> ${escapeHtml(t.fix ?? "")}</p>
    </div>`
    )
    .join("");

  const week = (ap.thisWeek ?? []).map((x) => `<li>☐ ${escapeHtml(x)}</li>`).join("");
  const month = (ap.thisMonth ?? []).map((x) => `<li>☐ ${escapeHtml(x)}</li>`).join("");
  const quarter = (ap.next3Months ?? []).map((x) => `<li>☐ ${escapeHtml(x)}</li>`).join("");

  const limHtml = lim.map((l) => `<li>${escapeHtml(l)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&amp;display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Amiri', serif; color: ${FULL_AUDIT_BRAND.text}; background: ${FULL_AUDIT_BRAND.bg}; margin: 0; padding: 0; }
    .pdf-page { page-break-after: always; padding: 28px 36px; min-height: 260mm; }
    .pdf-page:last-of-type { page-break-after: auto; }
    h1 { color: ${FULL_AUDIT_BRAND.secondary}; font-size: 28px; }
    h2 { color: ${FULL_AUDIT_BRAND.primary}; border-bottom: 2px solid ${FULL_AUDIT_BRAND.divider}; padding-bottom: 8px; }
    .cover-score { font-size: 72px; font-weight: 700; color: ${FULL_AUDIT_BRAND.primary}; }
    .brand-bar { background: ${FULL_AUDIT_BRAND.secondary}; color: #fff; padding: 8px 16px; font-size: 12px; letter-spacing: .15em; }
    .muted { color: ${FULL_AUDIT_BRAND.textLight}; }
    .finding { border-right: 4px solid ${FULL_AUDIT_BRAND.divider}; padding: 8px 12px; margin: 8px 0; background: ${FULL_AUDIT_BRAND.bgAlt}; }
    .finding.sev-high { border-color: #DC2626; }
    .finding.sev-medium { border-color: #F59E0B; }
    .finding.sev-low { border-color: #10B981; }
    .exec-grid { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
    .cta-box { background: ${FULL_AUDIT_BRAND.bgAlt}; border: 2px solid ${FULL_AUDIT_BRAND.primary}; padding: 20px; border-radius: 12px; text-align: center; }
    a.cta { color: ${FULL_AUDIT_BRAND.secondary}; font-weight: 700; }
  </style>
</head>
<body>
  <div class="brand-bar">WZZRD AI · FULL BRAND AUDIT</div>

  <section class="pdf-page">
    <h1>تقرير التحليل الشامل</h1>
    <p class="cover-score">${escapeHtml(String(score))}<span class="muted" style="font-size:28px">/100</span></p>
    <p style="font-size:22px">${label}</p>
    <p class="muted">${company} · ${industry}</p>
    <p class="muted">الثقة: ${conf}</p>
    <p>${confReason}</p>
    <p class="muted">${date}</p>
  </section>

  <section class="pdf-page">
    <h2>2. الملخص التنفيذي</h2>
    <div class="exec-grid">
      <div>${radar}</div>
      <div style="flex:1; min-width:200px;">
        <h3>أهم 3 قضايا</h3>
        ${top3Html || "<p class='muted'>—</p>"}
      </div>
    </div>
  </section>

  ${pillarPages}

  <section class="pdf-page">
    <h2>10. خطة العمل</h2>
    <h3>هذا الأسبوع</h3><ul>${week || "<li class='muted'>—</li>"}</ul>
    <h3>هذا الشهر</h3><ul>${month || "<li class='muted'>—</li>"}</ul>
    <h3>الثلاثة أشهر القادمة</h3><ul>${quarter || "<li class='muted'>—</li>"}</ul>
  </section>

  <section class="pdf-page">
    <h2>11. القيود والمنهجية</h2>
    <ul>${limHtml || "<li class='muted'>—</li>"}</ul>
    <p class="muted">تم إنشاء هذا التقرير آلياً بناءً على بيانات التحليل المخزنة في WZZRD AI.</p>
  </section>

  <section class="pdf-page">
    <h2>12. الخطوة التالية</h2>
    <div class="cta-box">
      <p>استشارة استراتيجية مع <strong>Primo Marca</strong></p>
      <p><a class="cta" href="https://wa.me/">WhatsApp</a> · <a class="cta" href="https://wzzrdai.com">wzzrdai.com</a></p>
    </div>
  </section>
</body>
</html>`;
}

export async function renderFullAuditPdfToFile(row: FullAuditResult, outPath: string): Promise<void> {
  const html = buildFullAuditHtml(row);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });
  } finally {
    await browser.close();
  }
}

export async function writePdfMetaFile(
  dir: string,
  uuid: string,
  meta: { userId: number; createdAt: number; auditId: number }
): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${uuid}.meta.json`), JSON.stringify(meta), "utf8");
}

export async function readPdfMetaFile(dir: string, uuid: string): Promise<{ userId: number; createdAt: number; auditId: number } | null> {
  try {
    const raw = await readFile(join(dir, `${uuid}.meta.json`), "utf8");
    return JSON.parse(raw) as { userId: number; createdAt: number; auditId: number };
  } catch {
    return null;
  }
}

export async function pdfFileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}
