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
<title>تقرير ${data.toolNameAr} — WZRD AI</title>
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
      <div class="logo">WZRD <b>AI</b></div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px">by Primo Marca</div>
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
      <strong>WZRD AI</strong> by Primo Marca<br>
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

// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export const reportPdfRouter = router({

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
      const userName = (ctx.user as any)?.name || '';
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
      const userName = (ctx.user as any)?.name || '';
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
          subject: `تقرير ${input.toolNameAr} — WZRD AI (${input.score}/١٠٠)`,
          html,
        });

        logger.info({ userId: ctx.user?.id, email: input.email, score: input.score }, '[ReportPDF] Sent to email');
        return { success: sent };
      } catch (err: any) {
        logger.error({ err: err.message }, '[ReportPDF] Email send failed');
        return { success: false, error: 'فشل في إرسال الإيميل' };
      }
    }),
});
