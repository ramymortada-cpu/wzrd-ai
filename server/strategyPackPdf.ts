/**
 * Strategy Pack PDF — Sprint H (HTML → Puppeteer, same stack as fullAuditPdf).
 */

import puppeteer from "puppeteer";
import type { FullAuditResult } from "../drizzle/schema";
import { escapeHtml, FULL_AUDIT_BRAND, buildFullAuditPrimoWaHref } from "./fullAuditPdf";

export type PersistedStrategyPackShape = {
  competitive: Record<string, unknown> | null;
  messaging: Record<string, unknown> | null;
  roadmap: Record<string, unknown> | null;
};

/** Read merged strategy from `full_audit_results.result_json` (Sprint H). */
export function getPersistedStrategyPack(row: FullAuditResult): PersistedStrategyPackShape | null {
  const rj = (row.resultJson ?? {}) as Record<string, unknown>;
  const raw = (rj.strategyPack ?? rj.strategy) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") return null;

  const competitive = (raw.competitive as Record<string, unknown> | null) ?? null;
  const messaging = (raw.messaging as Record<string, unknown> | null) ?? null;
  const roadmap = (raw.roadmap as Record<string, unknown> | null) ?? null;

  const filled = [competitive, messaging, roadmap].filter((p) => p != null && Object.keys(p).length > 0);
  if (filled.length < 2) return null;

  return { competitive, messaging, roadmap };
}

function sectionBlock(titleAr: string, titleEn: string, data: Record<string, unknown> | null): string {
  const inner =
    data != null && Object.keys(data).length > 0
      ? `<pre class="json-block">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`
      : `<p class="muted">—</p>`;
  return `
<section class="pdf-page">
  <h2>${escapeHtml(titleAr)} · ${escapeHtml(titleEn)}</h2>
  ${inner}
</section>`;
}

export function buildStrategyPackHtml(row: FullAuditResult): string {
  const pack = getPersistedStrategyPack(row);
  if (!pack) {
    throw new Error("No strategy pack in resultJson");
  }

  const company = escapeHtml(row.companyName);
  const industry = escapeHtml(row.industry);
  const score = row.overallScore ?? "—";
  const date = escapeHtml(new Date(row.createdAt).toLocaleDateString("ar-EG"));
  const wa = buildFullAuditPrimoWaHref(row);

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
    .brand-bar { background: ${FULL_AUDIT_BRAND.secondary}; color: #fff; padding: 8px 16px; font-size: 12px; letter-spacing: .15em; }
    .muted { color: ${FULL_AUDIT_BRAND.textLight}; }
    .json-block { background: ${FULL_AUDIT_BRAND.bgAlt}; border: 1px solid ${FULL_AUDIT_BRAND.divider}; border-radius: 8px; padding: 12px; font-size: 11px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    .cta-box { background: ${FULL_AUDIT_BRAND.bgAlt}; border: 2px solid ${FULL_AUDIT_BRAND.primary}; padding: 20px; border-radius: 12px; text-align: center; margin-top: 24px; }
    a.cta { color: ${FULL_AUDIT_BRAND.secondary}; font-weight: 700; }
  </style>
</head>
<body>
  <div class="brand-bar">WZZRD AI · STRATEGY PACK</div>

  <section class="pdf-page">
    <h1>حزمة الاستراتيجية</h1>
    <p class="muted" style="font-size:22px">Strategy Pack</p>
    <p style="font-size:20px; margin-top:16px">${company}</p>
    <p class="muted">${industry}</p>
    <p class="muted">نتيجة التحليل الشامل: <strong>${escapeHtml(String(score))}</strong>/100</p>
    <p class="muted">${date}</p>
    <div class="cta-box">
      <p>عايز فريق ينفذلك؟ — <strong>Primo Marca</strong></p>
      <p><a class="cta" href="${wa}">تواصل على WhatsApp</a> · <a class="cta" href="https://wzzrdai.com">wzzrdai.com</a></p>
    </div>
  </section>

  ${sectionBlock("التنافسية", "Competitive", pack.competitive)}
  ${sectionBlock("الرسالة والصوت", "Messaging", pack.messaging)}
  ${sectionBlock("خطة ٩٠ يوم", "90-day roadmap", pack.roadmap)}

  <section class="pdf-page">
    <h2>ملاحظة</h2>
    <p class="muted">تم إنشاء هذا المستند آلياً من بيانات حزمة الاستراتيجية المخزنة في WZZRD AI.</p>
  </section>
</body>
</html>`;
}

export async function renderStrategyPackPdfToFile(row: FullAuditResult, outPath: string): Promise<void> {
  const html = buildStrategyPackHtml(row);
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
