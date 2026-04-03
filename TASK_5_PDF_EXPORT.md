# Task Brief 5: Premium Report PDF Export

## Context
Currently, the `reportPdfRouter` generates a branded HTML report that opens in a new tab and triggers `window.print()` for the user to save as PDF. This works for the free/basic tool results, but the Premium Reports (which contain pillars, action plans, priority matrices, etc.) do not have a dedicated PDF export. We need to improve the PDF formatting and ensure Premium Reports can be exported beautifully.

## Target Files
- `server/routers/reportPdf.ts`
- `client/src/pages/tools/ToolPage.tsx`
- `server/pdfGenerator.ts` (if we want to use a server-side PDF generator like Puppeteer or `html-pdf` instead of `window.print()`)

## Step-by-Step Instructions

1.  **Premium Report HTML Template:**
    In `server/routers/reportPdf.ts`, create a new function `generatePremiumReportHtml(data)` that takes the full `PremiumReportPayload` (executive summary, pillars, action plan, priority matrix, quick wins) and formats it into a multi-page, print-friendly HTML document.
    - Use CSS `@media print` to handle page breaks (`page-break-before: always;`, `page-break-inside: avoid;`).
    - Ensure the styling matches the premium feel of the web UI (colors, fonts, layout).

2.  **New Endpoint for Premium PDF:**
    Add a new mutation `generatePremiumHtml` to `reportPdfRouter` that accepts the premium report data and returns the HTML string.

3.  **UI Integration:**
    In `client/src/pages/tools/ToolPage.tsx`, add a "Download PDF" button to the Premium Report view (around line 750, near the "Run a new analysis" button).
    - When clicked, call the new `generatePremiumHtml` mutation.
    - Open a new window with the returned HTML, which will auto-trigger `window.print()`.

4.  **Server-Side PDF Generation (Optional but recommended for better control):**
    If `window.print()` is too inconsistent across browsers, consider using Puppeteer on the server to render the HTML to a PDF buffer and return it as a downloadable file.
    - In `server/pdfGenerator.ts`, create `generatePdfFromHtml(html: string): Promise<Buffer>`.
    - Use `puppeteer.launch()`, `page.setContent(html)`, `page.pdf({ format: 'A4', printBackground: true })`.
    - Update the router to return the PDF buffer or a temporary URL.

## Expected Outcome
- Users can download their Premium Reports as beautifully formatted PDFs.
- The PDF includes all sections: Executive Summary, Pillars, Priority Matrix, Action Plan, and Quick Wins.
- Page breaks are handled gracefully.

## Verification
- Run `pnpm run dev`.
- Generate a Premium Report.
- Click "Download PDF".
- Verify the resulting PDF looks professional, has correct page breaks, and includes all data.
