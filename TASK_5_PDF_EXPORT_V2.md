# Sprint 4 / Task 5: Premium Report PDF Export

**Goal:** Add a "Download PDF" capability to the Premium Report view. The existing `reportPdfRouter` only supports the free/basic tool results. We need to extend it to handle the complex, multi-section Premium Reports (Executive Summary, Pillars, Priority Matrix, Action Plan, Quick Wins).

This brief is based on a deep audit of the codebase. The premium report is currently displayed inline in `ToolPage.tsx`, but there is no way to export it.

## 1. Create the Premium HTML Template (`server/routers/reportPdf.ts`)

The existing `generateReportHtml` function is great for basic results. We need a new function `generatePremiumReportHtml` that takes the full `PremiumReportPayload` and formats it for printing.

**Add this function to `server/routers/reportPdf.ts` (above the router definition):**

```typescript
function generatePremiumReportHtml(data: {
  toolName: string;
  toolNameAr: string;
  report: Record<string, any>;
  userName?: string;
  date: string;
}): string {
  const rep = data.report;
  const exec = rep.executiveSummary as Record<string, any> | undefined;
  const pillarList = Array.isArray(rep.pillars) ? rep.pillars : [];
  const priorityMatrix = rep.priorityMatrix as { urgent?: string[]; important?: string[]; improvement?: string[] } | undefined;
  const actionPlan = rep.actionPlan as { days30?: string[]; days60?: string[]; days90?: string[] } | undefined;
  const quickWins = Array.isArray(rep.quickWins) ? rep.quickWins : [];
  const recommendation = rep.recommendation as { phase?: string; reason?: string } | undefined;

  const severityBg = (s: string) => s === 'critical' ? '#fef2f2' : s === 'major' ? '#fffbeb' : '#ecfdf5';
  const severityColor = (s: string) => s === 'critical' ? '#dc2626' : s === 'major' ? '#d97706' : '#059669';

  // Build HTML sections
  let execHtml = '';
  if (exec) {
    execHtml = `
      <div class="section">
        <div class="section-title">١. الملخص التنفيذي</div>
        ${exec.pillarScores ? `
          <div style="display:flex;gap:10px;margin-bottom:16px">
            ${Object.entries(exec.pillarScores).map(([k, v]) => `
              <div style="flex:1;text-align:center;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                <div style="font-size:24px;font-weight:900;color:#4f46e5">${v}</div>
                <div style="font-size:10px;color:#64748b;text-transform:uppercase">${k}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <p>${exec.verdict || ''}</p>
      </div>
    `;
  }

  let pillarsHtml = '';
  if (pillarList.length > 0) {
    pillarsHtml = `
      <div class="section page-break">
        <div class="section-title">٢. تحليل المحاور</div>
        ${pillarList.map(p => `
          <div style="padding:16px;border-radius:12px;background:${severityBg(p.severity)};border:1px solid ${severityColor(p.severity)}40;margin-bottom:16px;break-inside:avoid">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <h3 style="font-size:16px;color:#1e293b;margin:0">${p.name || p.nameEn || ''}</h3>
              <span style="font-weight:bold;color:${severityColor(p.severity)}">${p.score}/100</span>
            </div>
            <p style="font-size:13px;color:#475569;white-space:pre-line;margin-bottom:8px">${p.analysis || ''}</p>
            ${p.gap ? `<div style="font-size:12px;color:#d97706;background:#fff;padding:8px;border-radius:6px"><b>الفجوة:</b> ${p.gap}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  let priorityHtml = '';
  if (priorityMatrix) {
    priorityHtml = `
      <div class="section page-break">
        <div class="section-title">٣. خريطة الأولويات</div>
        <div style="display:flex;gap:16px">
          ${priorityMatrix.urgent?.length ? `
            <div style="flex:1;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
              <h4 style="color:#dc2626;margin-bottom:12px;font-size:14px">🔴 عاجل ومهم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.urgent.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${priorityMatrix.important?.length ? `
            <div style="flex:1;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
              <h4 style="color:#d97706;margin-bottom:12px;font-size:14px">🟡 مهم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.important.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${priorityMatrix.improvement?.length ? `
            <div style="flex:1;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
              <h4 style="color:#16a34a;margin-bottom:12px;font-size:14px">🟢 تحسين</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${priorityMatrix.improvement.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
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
          ${actionPlan.days30?.length ? `
            <div style="flex:1;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px">
              <h4 style="color:#16a34a;margin-bottom:12px;font-size:14px">٣٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days30.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${actionPlan.days60?.length ? `
            <div style="flex:1;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
              <h4 style="color:#d97706;margin-bottom:12px;font-size:14px">٦٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days60.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${actionPlan.days90?.length ? `
            <div style="flex:1;padding:16px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px">
              <h4 style="color:#4f46e5;margin-bottom:12px;font-size:14px">٩٠ يوم</h4>
              <ul style="padding-right:20px;font-size:13px;color:#374151;margin:0">
                ${actionPlan.days90.map(i => `<li style="margin-bottom:6px">${i}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  let quickWinsHtml = '';
  if (quickWins.length > 0) {
    quickWinsHtml = `
      <div class="section" style="background:#f0fdf4;border:2px solid #bbf7d0;padding:20px;border-radius:16px;break-inside:avoid">
        <div class="section-title" style="color:#16a34a;border:none;margin-bottom:16px">٥. Quick Wins — ابدأ النهارده</div>
        ${quickWins.map((w, i) => `
          <div style="display:flex;gap:12px;margin-bottom:12px">
            <span style="flex-shrink:0;width:24px;height:24px;background:#16a34a;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold">${i + 1}</span>
            <p style="font-size:14px;color:#374151;margin:0;padding-top:2px">${w}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  let recHtml = '';
  if (recommendation) {
    recHtml = `
      <div class="section" style="background:#4f46e5;color:#fff;padding:24px;border-radius:16px;break-inside:avoid">
        <div class="section-title" style="color:#fff;border-bottom:1px solid rgba(255,255,255,0.2);margin-bottom:16px">٦. التوصية النهائية</div>
        ${recommendation.phase ? `<div style="display:inline-block;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:50px;font-size:12px;font-weight:bold;margin-bottom:12px">${recommendation.phase}</div>` : ''}
        <p style="font-size:14px;line-height:1.8;margin:0">${recommendation.reason || ''}</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>التقرير الكامل: ${data.toolNameAr} — WZZRD AI</title>
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
      <div style="font-size:12px;color:#94a3b8;margin-top:2px">by Primo Marca</div>
    </div>
    <div class="header-meta">
      <div>${data.date}</div>
      ${data.userName ? `<div>${data.userName}</div>` : ''}
    </div>
  </div>
  
  <div class="title-box">
    <div class="badge">✦ التقرير الكامل (Premium)</div>
    <h1 class="tool-name">${data.toolNameAr}</h1>
    <div style="font-size:14px;color:#64748b">${data.toolName}</div>
  </div>

  ${execHtml}
  ${pillarsHtml}
  ${priorityHtml}
  ${actionPlanHtml}
  ${quickWinsHtml}
  ${recHtml}

  <div class="footer">
    <div>
      <strong>WZZRD AI</strong> by Primo Marca<br>
      "Marks Fade, MARCAS Don't."
    </div>
    <div style="text-align:left">
      <a href="https://wzzrd.ai">wzzrd.ai</a><br>
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
```

## 2. Add the Endpoint (`server/routers/reportPdf.ts`)

**Add this mutation to `reportPdfRouter`:**

```typescript
  /** Generate premium HTML report (opens in new tab for PDF save) */
  generatePremiumHtml: protectedProcedure
    .input(z.object({
      toolName: z.string().max(100),
      toolNameAr: z.string().max(100),
      report: z.record(z.string(), z.unknown()),
    }))
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
      logger.info({ userId: ctx.user?.id, tool: input.toolName }, '[ReportPDF] Premium Generated');
      return { html };
    }),
```

## 3. Wire it up in the Frontend (`client/src/pages/tools/ToolPage.tsx`)

**A. Add the trpc hook at the top of `ToolPage`:**
```typescript
  const pdfMutation = trpc.reportPdf.generateHtml.useMutation();
  const premiumPdfMutation = trpc.reportPdf.generatePremiumHtml.useMutation();
```

**B. Add the handler functions:**
```typescript
  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      const res = await pdfMutation.mutateAsync({
        toolName: config.name,
        toolNameAr: config.nameAr || config.name,
        score: result.score,
        label: result.label,
        findings: result.findings,
        actionItems: result.actionItems,
        recommendation: result.recommendation,
      });
      if (res.html) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(res.html);
          win.document.close();
        }
      }
    } catch (err) {
      console.error('PDF generation failed', err);
    }
  };

  const handleDownloadPremiumPdf = async () => {
    if (!premiumReport?.report) return;
    try {
      const res = await premiumPdfMutation.mutateAsync({
        toolName: config.name,
        toolNameAr: config.nameAr || config.name,
        report: premiumReport.report,
      });
      if (res.html) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(res.html);
          win.document.close();
        }
      }
    } catch (err) {
      console.error('Premium PDF generation failed', err);
    }
  };
```

**C. Add the button to the Premium Report view (around line 770, before the "Run a new analysis" button):**
```tsx
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadPremiumPdf}
                disabled={premiumPdfMutation.isPending}
                className="flex-1 rounded-full bg-[#1B4FD8] py-3 text-sm font-bold text-white hover:bg-[#1440B8] disabled:opacity-50 transition"
              >
                {premiumPdfMutation.isPending ? (isAr ? 'جاري التجهيز...' : 'Preparing...') : (isAr ? '⬇ حمّل التقرير (PDF)' : '⬇ Download PDF')}
              </button>
              <button
                type="button"
                onClick={() => { setResult(null); setPremiumReport(null); setFormData({}); }}
                className="flex-1 rounded-full border border-[#E5E7EB] py-3 text-sm font-medium text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
              >
                {isAr ? 'حلل تاني ببيانات مختلفة' : 'Run a new analysis'}
              </button>
            </div>
```
*(Replace the existing single "Run a new analysis" button with this flex row)*

**D. Add the button to the Standard Result view (around line 1080, replacing the existing "New analysis" button row):**
```tsx
          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfMutation.isPending}
              className="flex-1 rounded-full bg-[#1B4FD8] py-3 text-sm font-bold text-white hover:bg-[#1440B8] disabled:opacity-50 transition"
            >
              {pdfMutation.isPending ? (isAr ? 'جاري التجهيز...' : 'Preparing...') : (isAr ? '⬇ حمّل النتيجة (PDF)' : '⬇ Download PDF')}
            </button>
            <button
              type="button"
              onClick={() => { setResult(null); setFormData({}); }}
              className="flex-1 rounded-full border border-[#E5E7EB] py-3 text-sm text-[#6B7280] hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition"
            >
              {isAr ? 'حلل تاني' : 'New analysis'}
            </button>
          </div>
```

## Verification
1. Run `pnpm run dev`.
2. Run a free diagnosis and click "Download PDF" — verify it opens a new tab with the basic report.
3. Unlock a premium report (or mock the state) and click "Download PDF" — verify it opens a new tab with the multi-page premium report.
4. Verify page breaks work correctly when printing.
