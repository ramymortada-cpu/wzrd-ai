# Task Brief 4: Design Health Check Tool

## Context
The visual audit spike (`scripts/visualAuditSpike.ts`) using GPT-4o Vision was successful. We now need to build a full "Design Health Check" tool that takes a website URL, captures a screenshot using Puppeteer, and sends it to GPT-4o Vision for analysis. The tool will evaluate Color Harmony, Visual Hierarchy, and Whitespace & Clutter, returning a score out of 100.

## Target Files
- `server/researchEngine.ts` (to add screenshot capability)
- `server/routers/tools.ts` (to add the new tool endpoint)
- `client/src/pages/Tools.tsx` (to add the tool card)
- `shared/wzrdDiagnosisToolCosts.ts` (to set the credit cost)
- `server/db/credits.ts` (to register the tool cost)

## Step-by-Step Instructions

1.  **Puppeteer Screenshot Capability:**
    In `server/researchEngine.ts`, the Puppeteer fallback already exists. We need to add a function to capture a screenshot and return it as a base64 string or save it temporarily.
    - Create `captureScreenshot(url: string): Promise<string>` that launches Puppeteer, navigates to the URL, and calls `page.screenshot({ encoding: 'base64', fullPage: false })`.
    - Ensure the viewport is set to a standard desktop size (e.g., 1920x1080).

2.  **GPT-4o Vision Integration:**
    In `server/routers/tools.ts`, create a new endpoint or modify the existing `runToolAI` to handle image inputs.
    - If the tool is `design_health`, call `captureScreenshot(url)`.
    - Construct the OpenAI payload with the base64 image and the prompt from the spike script.
    - Parse the response into the standard `ToolResult` format (score, findings, recommendation).

3.  **Tool Configuration:**
    In `shared/wzrdDiagnosisToolCosts.ts`, add `design_health: 30` (or appropriate cost).
    In `client/src/pages/Tools.tsx`, add the tool card to `FALLBACK_TOOLS` and the route mapping.
    - `id: 'design_health'`
    - `name: 'Design Health Check'`
    - `nameAr: 'فحص صحة التصميم'`
    - `icon: '🎨'`

4.  **UI Updates:**
    Ensure the `ToolPage` can handle the specific inputs for this tool (just a URL field).
    - The existing dynamic form generation in `ToolPage` should handle this if configured correctly in the tool config.

## Expected Outcome
- Users can enter a URL and get a visual design audit powered by GPT-4o Vision.
- The tool captures a screenshot, analyzes it, and returns a structured report.
- The tool costs credits and integrates seamlessly with the existing UI.

## Verification
- Run `pnpm run dev`.
- Navigate to the Design Health Check tool.
- Enter a valid URL and run the analysis.
- Verify the screenshot is captured (check logs) and the AI returns a valid JSON response with a score and findings.
