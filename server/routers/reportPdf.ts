/**
 * Report PDF Generator — creates branded PDF-ready HTML reports.
 * 
 * Flow:
 * 1. User runs free diagnosis → gets result
 * 2. User clicks "حمّل التقرير PDF" or "ابعت على إيميلي"
 * 3. Server generates branded HTML optimized for printing
 * 4. Frontend opens in new tab → auto-triggers print dialog
 * 
 * The HTML uses @media print styles for clean PDF output.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";

const APP_URL = process.env.APP_URL || 'https://wzzrdai.com';

function generateReportHtml(data: {
  toolName: string;
  toolNameAr: string;
  score: number;
  label: string;
  findings: Array<{ title: string; detail: string; severity: string }>;
  actionItems?: Array<{ task: string; difficulty: string }>;
  recommendation: string;
  userName?: string;
  date: string;
}): string {
  const scoreColor = data.score >= 70 ? '#10b981' : data.score >= 40 ? '#f59e0b' : '#ef4444';
  const severityBg = (s: string) => s === 'high' ? '#fef2f2' : s === 'medium' ? '#fffbeb' : '#ecfdf5';
  const severityColor = (s: string) => s === 'high' ? '#dc2626' : s === 'medium' ? '#d97706' : '#059669';
  const severityLabel = (s: string) => s === 'high' ? 'عالي' : s === 'medium' ? 'متوسط' : 'منخفض';
  const diffLabel = (d: string) => d === 'easy' ? 'سهل' : d === 'hard' ? 'صعب' : 'متوسط';
  const diffColor = (d: string) => d === 'easy' ? '#059669' : d === 'hard' ? '#dc2626' : '#d97706';

  const findingsHtml = data.findings.map(f => `
    <div style="padding:16px;border-radius:12px;background:${severityBg(f.severity)};border:1px solid ${severityColor(f.severity)}20;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:11px;font-weight:700;color:${severityColor(f.severity)};background:${severityColor(f.severity)}15;padding:2px 8px;border-radius:50px">${severityLabel(f.severity)}</span>
        <span style="font-weight:700;font-size:14px;color:#1e293b">${f.title}</span>
      </div>
      <p style="font-size:13px;color:#475569;line-height:1.7;margin:0">${f.detail}</p>
    </div>
  `).join('');

  const actionItemsHtml = (data.actionItems && data.actionItems.length > 0) ? `
    <div style="margin-bottom:28px">
      <div class="section-title">خطواتك العملية (${data.actionItems.length} مهمة)</div>
      ${data.actionItems.map((item, i) => `
        <div style="padding:12px 16px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px">
          <span style="flex-shrink:0;width:24px;height:24px;border-radius:6px;border:2px solid #86efac;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#166534">${i + 1}</span>
          <div style="flex:1">
            <span style="font-size:13px;color:#1e293b">${item.task}</span>
          </div>
          <span style="flex-shrink:0;font-size:10px;font-weight:700;color:${diffColor(item.difficulty)};background:${diffColor(item.difficulty)}15;padding:2px 8px;border-radius:50px">${diffLabel(item.difficulty)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تقرير ${data.toolNameAr} — WZZRD AI</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'IBM Plex Sans Arabic',sans-serif;background:#fff;color:#1e293b;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:700px;margin:0 auto;padding:40px 32px}

/* Header */
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
.logo{font-family:'Space Grotesk','IBM Plex Sans Arabic',sans-serif;font-size:22px;font-weight:700;color:#1e293b}
.logo b{color:#4f46e5}
.header-meta{text-align:left;font-size:12px;color:#94a3b8}

/* Score */
.score-section{text-align:center;margin-bottom:32px}
.score-circle{display:inline-flex;align-items:center;justify-content:center;width:100px;height:100px;border-radius:50%;border:4px solid ${scoreColor};margin-bottom:12px}
.score-num{font-size:40px;font-weight:700;color:${scoreColor};font-family:'Space Grotesk',sans-serif}
.score-label{font-size:14px;color:#64748b;margin-bottom:4px}
.tool-name{font-size:22px;font-weight:700;color:#1e293b}

/* Bar */
.bar-container{margin:16px auto;max-width:400px}
.bar-track{height:8px;border-radius:8px;background:linear-gradient(to left,#10b981,#f59e0b,#ef4444);position:relative}
.bar-marker{position:absolute;top:-4px;right:${data.score}%;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #1e293b;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.bar-labels{display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:4px}

/* Sections */
.section-title{font-size:16px;font-weight:700;color:#4f46e5;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
.findings{margin-bottom:28px}
.recommendation{padding:16px;border-radius:12px;background:#eef2ff;border:1px solid #c7d2fe;margin-bottom:28px}
.recommendation p{font-size:14px;color:#3730a3;margin:0}

/* CTA */
.cta{text-align:center;padding:24px;border-radius:16px;background:linear-gradient(135deg,#312e81,#4f46e5);color:#fff;margin-bottom:28px}
.cta h3{font-size:18px;font-weight:700;margin-bottom:8px}
.cta p{font-size:13px;opacity:.85;margin-bottom:12px}
.cta a{display:inline-block;padding:10px 28px;border-radius:50px;background:#fff;color:#4f46e5;font-weight:700;font-size:14px;text-decoration:none}

/* Footer */
.footer{padding-top:20px;border-top:2px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94a3b8}
.footer a{color:#4f46e5;text-decoration:none}

/* Print */
@media print{
  body{background:#fff}
  .page{padding:24px 20px;max-width:100%}
  .no-print{display:none!important}
  .cta{break-inside:avoid}
}

/* Download bar */
.download-bar{position:fixed;top:0;left:0;right:0;background:#4f46e5;color:#fff;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:16px;z-index:100;font-size:14px;font-weight:600}
.download-bar button{padding:8px 20px;border-radius:50px;border:2px solid #fff;background:transparent;color:#fff;font-weight:700;cursor:pointer;font-size:13px;transition:.2s}
.download-bar button:hover{background:#fff;color:#4f46e5}
</style>
</head>
<body>

<div class="download-bar no-print">
  <span>📄 التقرير جاهز</span>
  <button onclick="window.print()">⬇ حمّل كـ PDF</button>
  <button onclick="window.close()">✕ إغلاق</button>
</div>

<div class="page" style="margin-top:56px">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">WZZRD <b>AI</b></div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px">by WZZRD AI</div>
    </div>
    <div class="header-meta">
      <div>${data.date}</div>
      ${data.userName ? `<div>${data.userName}</div>` : ''}
      <div style="color:#4f46e5">${APP_URL}</div>
    </div>
  </div>

  <!-- Score -->
  <div class="score-section">
    <div class="tool-name">${data.toolNameAr}</div>
    <div style="font-size:13px;color:#64748b;margin-bottom:12px">${data.toolName}</div>
    <div class="score-circle">
      <span class="score-num">${data.score}</span>
    </div>
    <div class="score-label">${data.label} — ${data.score}/١٠٠</div>
    <div class="bar-container">
      <div class="bar-track"><div class="bar-marker"></div></div>
      <div class="bar-labels"><span>١٠٠</span><span>٠</span></div>
    </div>
  </div>

  <!-- Findings -->
  <div class="findings">
    <div class="section-title">نتائج التشخيص (${data.findings.length} نتيجة)</div>
    ${findingsHtml}
  </div>

  <!-- Action Items -->
  ${actionItemsHtml}

  <!-- Recommendation -->
  <div class="recommendation">
    <div class="section-title" style="border:none;padding:0;margin-bottom:8px">💡 التوصية</div>
    <p>${data.recommendation}</p>
  </div>

  <!-- CTA -->
  <div class="cta">
    <h3>عايز تقرير مفصّل أكتر؟</h3>
    <p>التقرير الـ Premium فيه تحليل عميق لكل محور + خطة عمل ٩٠ يوم + Quick Wins — بـ ٩٩ جنيه بس</p>
    <a href="${APP_URL}/tools">احصل على التقرير المفصّل ←</a>
  </div>

  <!-- Contact -->
  <div style="text-align:center;padding:20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:28px">
    <p style="font-size:13px;color:#64748b;margin-bottom:8px">محتاج مساعدة متخصصة؟</p>
    <p style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px">احجز Clarity Call مجاني — ١٥ دقيقة مع خبير</p>
    <a href="${APP_URL}/services-info" style="font-size:13px;color:#4f46e5;text-decoration:none">اعرف أكتر عن خدماتنا ←</a>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <strong>WZZRD AI</strong> by WZZRD AI<br>
      "Marks Fade, MARCAS Don't."
    </div>
    <div style="text-align:left">
      <a href="${APP_URL}">${APP_URL.replace('https://', '')}</a><br>
      <a href="https://instagram.com/primomarca">@primomarca</a>
    </div>
  </div>
</div>

<script>
// Auto-trigger print after 500ms
setTimeout(function() { /* window.print(); */ }, 500);
</script>
</body>
</html>`;
}

function escapeHtmlPdf(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type PremiumPillar = {
  name?: string;
  nameEn?: string;
  score?: number;
  analysis?: string;
  gap?: string;
  severity?: string;
};

function generatePremiumReportHtml(data: {
  toolName: string;
  toolNameAr: string;
  report: Record<string, unknown>;
  userName?: string;
  date: string;
}): string {
  const rep = data.report;
  const exec = rep.executiveSummary as Record<string, unknown> | undefined;
  const pillarList = Array.isArray(rep.pillars) ? (rep.pillars as PremiumPillar[]) : [];
  const priorityMatrix = rep.priorityMatrix as {
    urgent?: string[];
    important?: string[];
    improvement?: string[];
  } | undefined;
  const actionPlan = rep.actionPlan as {
    days30?: string[];
    days60?: string[];
    days90?: string[];
  } | undefined;
  const quickWins = Array.isArray(rep.quickWins) ? (rep.quickWins as string[]) : [];
  const recommendation = rep.recommendation as { phase?: string; reason?: string } | undefined;

  const severityBg = (s: string) =>
    s === 'critical' || s === 'high' ? '#fef2f2' : s === 'major' || s === 'medium' ? '#fffbeb' : '#ecfdf5';
  const severityColor = (s: string) =>
    s === 'critical' || s === 'high' ? '#dc2626' : s === 'major' || s === 'medium' ? '#d97706' : '#059669';

  let execHtml = '';
  if (exec) {
    const pillarScores = exec.pillarScores as Record<string, unknown> | undefined;
    const scoresBlock =
      pillarScores && typeof pillarScores === 'object'
        ? `
          <div style="display:flex;gap:10px;margin-bottom:16px">
            ${Object.entries(pillarScores)
              .map(
                ([k, v]) => `
              <div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                <div style="font-size:24px;font-weight:900;color:#4f46e5">${escapeHtmlPdf(String(v))}</div>
                <div style="font-size:10px;color:#64748b;text-transform:uppercase">${escapeHtmlPdf(k)}</div>
              </div>
            `,
              )
              .join('')}
          </div>
        `
        : '';
    const verdict = typeof exec.verdict === 'string' ? exec.verdict : '';
    execHtml = `
      <div class="section">
        <div class="section-title">١. الملخص التنفيذي</div>
        ${scoresBlock}
        <p>${escapeHtmlPdf(verdict)}</p>
      </div>
    `;
  }

  let pillarsHtml = '';
  if (pillarList.length > 0) {
    pillarsHtml = `
      <div class="section page-break">
        <div class="section-title">٢. تحليل المحاور</div>
        ${pillarList
          .map((p) => {
            const sev = String(p.severity ?? '');
            return `
          <div style="padding:16px;border-radius:12px;background:${severityBg(sev)};border:1px solid ${severityColor(sev)}40;margin-bottom:16px;break-inside:avoid">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <h3 style="font-size:16px;color:#1e293b;margin:0">${escapeHtmlPdf(String(p.name ?? p.nameEn ?? ''))}</h3>
              <span style="font-weight:bold;color:${severityColor(sev)}">${escapeHtmlPdf(String(p.score ?? ''))}/100</span>
            </div>
            <p style="font-size:13px;color:#475569;white-space:pre-line;margin-bottom:8px">${escapeHtmlPdf(String(p.analysis ?? ''))}</p>
            ${
              p.gap
                ? `<div style="font-size:12px;color:#d97706;background:#fff;padding:8px;border-radius:6px"><b>الفجوة:</b> ${escapeHtmlPdf(String(p.gap))}</div>`
                : ''
            }
          </div>
        `;
          })
          .join('')}
      </div>
    `;
  }

  let priorityHtml = '';
  if (priorityMatrix) {
    priorityHtml = `
      <div class="section page-break">
        <div class="section-title">٣. خريطة الأولويات</div>
        <div style="display:flex;gap:16px">
          ${
            priorityMatrix.urgent?.length
              ? `
            <div style="flex:1;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
              <h4 style="color:#dc2626;margin-bottom:12px;font-size:14px">🔴 عاجل ومهم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.urgent.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            priorityMatrix.important?.length
              ? `
            <div style="flex:1;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
              <h4 style="color:#d97706;margin-bottom:12px;font-size:14px">🟡 مهم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.important.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            priorityMatrix.improvement?.length
              ? `
            <div style="flex:1;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
              <h4 style="color:#16a34a;margin-bottom:12px;font-size:14px">🟢 تحسين</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.improvement.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  let actionPlanHtml = '';
  if (actionPlan) {
    actionPlanHtml = `
      <div class="section page-break">
        <div class="section-title">٤. خطة العمل</div>
        <div style="display:flex;gap:16px">
          ${
            actionPlan.days30?.length
              ? `
            <div style="flex:1;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
              <h4 style="color:#16a34a;margin-bottom:12px;font-size:14px">٣٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days30.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            actionPlan.days60?.length
              ? `
            <div style="flex:1;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
              <h4 style="color:#d97706;margin-bottom:12px;font-size:14px">٦٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days60.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
          ${
            actionPlan.days90?.length
              ? `
            <div style="flex:1;padding:16px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px">
              <h4 style="color:#4f46e5;margin-bottom:12px;font-size:14px">٩٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days90.map((i) => `<li style="margin-bottom:6px">${escapeHtmlPdf(i)}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  let quickWinsHtml = '';
  if (quickWins.length > 0) {
    quickWinsHtml = `
      <div class="section" style="background:#f0fdf4;border:2px solid #bbf7d0;padding:20px;border-radius:16px;break-inside:avoid">
        <div class="section-title" style="color:#16a34a;border:none;margin-bottom:16px">٥. Quick Wins — ابدأ النهارده</div>
        ${quickWins
          .map(
            (w, i) => `
          <div style="display:flex;gap:12px;margin-bottom:12px">
            <span style="flex-shrink:0;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold">${i + 1}</span>
            <p style="font-size:14px;color:#374151;margin:0;padding-top:2px">${escapeHtmlPdf(w)}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    `;
  }

  let recHtml = '';
  if (recommendation && (recommendation.phase || recommendation.reason)) {
    const phase = recommendation.phase ? escapeHtmlPdf(recommendation.phase) : '';
    const reason = recommendation.reason ? escapeHtmlPdf(recommendation.reason) : '';
    recHtml = `
      <div class="section" style="background:#4f46e5;color:#fff;padding:24px;border-radius:16px;break-inside:avoid">
        <div class="section-title" style="color:#fff;border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:16px">٦. التوصية النهائية</div>
        ${
          recommendation.phase
            ? `<div style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:50px;font-size:12px;font-weight:bold;margin-bottom:12px">${phase}</div>`
            : ''
        }
        <p style="font-size:14px;line-height:1.8;margin:0">${reason}</p>
      </div>
    `;
  }

  const toolAr = escapeHtmlPdf(data.toolNameAr);
  const toolEn = escapeHtmlPdf(data.toolName);
  const userLine = data.userName ? `<div>${escapeHtmlPdf(data.userName)}</div>` : '';
  const dateEsc = escapeHtmlPdf(data.date);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>التقرير الكامل: ${toolAr} — WZZRD AI</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'IBM Plex Sans Arabic',sans-serif;background:#fff;color:#1e293b;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:800px;margin:0 auto;padding:40px 32px}
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #e2e8f0;margin-bottom:32px}
.logo{font-family:'Space Grotesk','IBM Plex Sans Arabic',sans-serif;font-size:22px;font-weight:700;color:#1e293b}
.logo b{color:#4f46e5}
.header-meta{text-align:left;font-size:12px;color:#94a3b8}
.title-box{text-align:center;margin-bottom:40px;padding:32px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0}
.badge{display:inline-block;background:#eef2ff;color:#4f46e5;padding:6px 16px;border-radius:50px;font-size:12px;font-weight:bold;margin-bottom:16px}
.tool-name{font-size:28px;font-weight:900;color:#1e293b;margin-bottom:8px}
.section{margin-bottom:40px}
.section-title{font-size:18px;font-weight:800;color:#64748b;margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
.footer{padding-top:20px;border-top:2px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:40px}
.footer a{color:#4f46e5;text-decoration:none}
@media print{
  body{background:#fff}
  .page{padding:24px 20px;max-width:100%}
  .no-print{display:none!important}
  .page-break{page-break-before:always}
}
.download-bar{position:fixed;top:0;left:0;right:0;background:#4f46e5;color:#fff;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:16px;z-index:100;font-size:14px;font-weight:600}
.download-bar button{padding:8px 20px;border-radius:50px;border:2px solid #fff;background:transparent;color:#fff;font-weight:700;cursor:pointer;font-size:13px;transition:.2s}
.download-bar button:hover{background:#fff;color:#4f46e5}
</style>
</head>
<body>
<div class="download-bar no-print">
  <span>📄 التقرير الكامل جاهز</span>
  <button onclick="window.print()">⬇ حمّل كـ PDF</button>
  <button onclick="window.close()">✕ إغلاق</button>
</div>
<div class="page" style="margin-top:56px">
  <div class="header">
    <div>
      <div class="logo">WZZRD <b>AI</b></div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px">by WZZRD AI</div>
    </div>
    <div class="header-meta">
      <div>${dateEsc}</div>
      ${userLine}
    </div>
  </div>

  <div class="title-box">
    <div class="badge">✦ التقرير الكامل (Premium)</div>
    <h1 class="tool-name">${toolAr}</h1>
    <div style="font-size:14px;color:#64748b">${toolEn}</div>
  </div>

  ${execHtml}
  ${pillarsHtml}
  ${priorityHtml}
  ${actionPlanHtml}
  ${quickWinsHtml}
  ${recHtml}

  <div class="footer">
    <div>
      <strong>WZZRD AI</strong> by WZZRD AI<br>
      "Marks Fade, MARCAS Don't."
    </div>
    <div style="text-align:left">
      <a href="${APP_URL}">${escapeHtmlPdf(APP_URL.replace('https://', ''))}</a><br>
      <a href="https://instagram.com/primomarca">@primomarca</a>
    </div>
  </div>
</div>
<script>
setTimeout(function() { /* window.print(); */ }, 500);
</script>
</body>
</html>`;
}

// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export const reportPdfRouter = router({

  /** Generate premium HTML report (opens in new tab for PDF save) */
  generatePremiumHtml: protectedProcedure
    .input(
      z.object({
        toolName: z.string().max(100),
        toolNameAr: z.string().max(100),
        report: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(({ input, ctx }) => {
      const userName = ctx.user?.name || '';
      const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const html = generatePremiumReportHtml({
        toolName: input.toolName,
        toolNameAr: input.toolNameAr,
        report: input.report,
        userName,
        date,
      });
      logger.info({ userId: ctx.user?.id, tool: input.toolName }, '[ReportPDF] Premium generated');
      return { html };
    }),

  /** Generate branded HTML report (opens in new tab for PDF save) */
  generateHtml: protectedProcedure
    .input(z.object({
      toolName: z.string().max(100),
      toolNameAr: z.string().max(100),
      score: z.number(),
      label: z.string().max(50),
      findings: z.array(z.object({
        title: z.string(),
        detail: z.string(),
        severity: z.string(),
      })),
      actionItems: z.array(z.object({
        task: z.string(),
        difficulty: z.string(),
      })).optional(),
      recommendation: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      const userName = ctx.user?.name || '';
      const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

      const html = generateReportHtml({
        ...input,
        actionItems: input.actionItems || [],
        userName,
        date,
      });

      logger.info({ userId: ctx.user?.id, tool: input.toolName, score: input.score }, '[ReportPDF] Generated');
      return { html };
    }),

  /** Send report to user's email */
  sendToEmail: protectedProcedure
    .input(z.object({
      toolName: z.string().max(100),
      toolNameAr: z.string().max(100),
      score: z.number(),
      label: z.string().max(50),
      findings: z.array(z.object({
        title: z.string(),
        detail: z.string(),
        severity: z.string(),
      })),
      actionItems: z.array(z.object({
        task: z.string(),
        difficulty: z.string(),
      })).optional(),
      recommendation: z.string(),
      email: z.string().email().max(320),
    }))
    .mutation(async ({ input, ctx }) => {
      const userName = ctx.user?.name || '';
      const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

      const html = generateReportHtml({
        toolName: input.toolName,
        toolNameAr: input.toolNameAr,
        score: input.score,
        label: input.label,
        findings: input.findings,
        actionItems: input.actionItems || [],
        recommendation: input.recommendation,
        userName,
        date,
      });

      // Send via email
      try {
        const { sendEmail } = await import('../wzrdEmails');
        const sent = await sendEmail({
          to: input.email,
          subject: `تقرير ${input.toolNameAr} — WZZRD AI (${input.score}/١٠٠)`,
          html,
        });

        logger.info({ userId: ctx.user?.id, email: input.email, score: input.score }, '[ReportPDF] Sent to email');
        return { success: sent };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err: msg }, '[ReportPDF] Email send failed');
        return { success: false, error: 'فشل في إرسال الإيميل' };
      }
    }),
});
