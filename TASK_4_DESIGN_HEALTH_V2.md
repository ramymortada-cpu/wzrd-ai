# Sprint 4 / Task 4: Design Health Check Tool (GPT-4o Vision)

**Goal:** Build a new diagnosis tool that takes a website URL, captures a screenshot using Puppeteer, and uses GPT-4o Vision to evaluate Color Harmony, Visual Hierarchy, and Whitespace & Clutter.

This brief is based on a deep audit of the codebase. The spike script (`scripts/visualAuditSpike.ts`) proved the concept works. Now we need to integrate it into the main app.

## 1. Add Screenshot Capability (`server/researchEngine.ts`)

The existing Puppeteer fallback in `researchEngine.ts` only scrapes HTML and explicitly blocks images/fonts. We need a new function specifically for taking screenshots.

**Add this function to `server/researchEngine.ts`:**

```typescript
export async function captureScreenshot(url: string): Promise<string | null> {
  try {
    logger.debug({ url }, 'Attempting to capture screenshot via Puppeteer');
    const [, release] = await browserSemaphore.acquire();
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(userAgents[0]);
        
        // Do NOT block images/fonts here, we need them for the screenshot
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Capture screenshot as base64
        const base64 = await page.screenshot({ encoding: 'base64', fullPage: false });
        logger.info({ url }, 'Screenshot captured successfully');
        return base64 as string;
      } finally {
        await browser.close();
      }
    } finally {
      release();
    }
  } catch (err) {
    logger.error({ url, err: err instanceof Error ? err.message : String(err) }, 'Screenshot capture failed');
    return null;
  }
}
```

## 2. Define Tool Schema & Cost

**In `shared/wzrdDiagnosisToolSchemas.ts`:**
Add the new schema and export its type:

```typescript
export const designHealthInputSchema = z.object({
  companyName: req(255),
  industry: req(100),
  website: req(500), // Required for this tool
});

export type DesignHealthInput = z.infer<typeof designHealthInputSchema>;
```

**In `shared/wzrdDiagnosisToolCosts.ts`:**
Add the cost to `WZRD_DIAGNOSIS_TOOL_COSTS`:

```typescript
  design_health: 30,
```

## 3. Create the Tool Endpoint (`server/routers/tools.ts`)

This tool is unique because it requires GPT-4o Vision directly, bypassing `resilientLLM` (which currently routes to Groq/Claude).

**A. Add to imports:**
```typescript
import { captureScreenshot } from '../researchEngine';
import { designHealthInputSchema } from '@shared/wzrdDiagnosisToolSchemas';
import { getOpenAIClient } from '../vectorSearch'; // Reuse the lazy client
```

**B. Add to `TOOL_DISPLAY_NAME`:**
```typescript
  design_health: 'Design Health Check',
```

**C. Add the Vision AI caller function:**
```typescript
async function callVisionModel(
  toolId: string,
  systemPrompt: string,
  userPrompt: string,
  base64Image: string
): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured for Vision model');
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt + '\n\n' + userPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content || '{}';
}
```

**D. Add the endpoints (Free Preview + Unlock):**
```typescript
  freeDesignHealthDiagnosis: protectedProcedure
    .input(designHealthInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('design_health')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();

      // 1. Capture Screenshot
      const base64Image = await captureScreenshot(input.website);
      if (!base64Image) {
        throw new Error('فشل في التقاط صورة للموقع. تأكد من صحة الرابط.');
      }

      // 2. Call Vision Model
      const userPrompt = `Company: ${input.companyName}\nIndustry: ${input.industry}\nWebsite: ${input.website}\n\nAnalyze this website screenshot. Focus ONLY on Color Harmony, Visual Hierarchy, and Whitespace & Clutter.`;
      const text = await callVisionModel('design_health', TOOL_SYSTEM, userPrompt, base64Image);
      const body = parseDiagnosisAiResponse(text, 'design_health');

      // 3. Cache Result
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'design_health',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });

      const criticalCount = body.findings.filter((f) => f.severity === 'high').length;
      const unlockCost = TOOL_COSTS.design_health ?? 30;

      logger.info({ tool: 'design_health', phase: 'free_preview', score: body.score }, 'Design Health free preview generated');

      return {
        score: body.score,
        label: scoreLabel(body.score),
        findings: body.findings.map((f) => ({ title: f.title, severity: f.severity })),
        criticalCount,
        unlockToken,
        unlockCost,
      };
    }),

  unlockDesignHealth: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'design_health', {
        type: 'guide',
        title: 'Brand Identity Guide',
        url: '/guides/brand-identity',
      }),
    ),
```

**E. Add to `meta` query:**
```typescript
      { id: 'design_health', name: 'Design Health Check', nameAr: 'فحص صحة التصميم', icon: '🎨', color: '#ec4899', cost: 30,
        desc: 'Visual audit of your website using AI vision. Checks color harmony, hierarchy, and clutter.',
        descAr: 'فحص بصري لموقعك باستخدام الذكاء الاصطناعي. يراجع تناسق الألوان، التسلسل الهرمي، والزحمة.',
        inputs: ['companyName', 'industry', 'website'],
        guideUrl: '/guides/brand-identity', guideTitle: 'Brand Identity Guide',
        serviceUrl: '/services-info#build', serviceTitle: 'Brand Identity' },
```

## 4. Create the Frontend Page (`client/src/pages/tools/DesignHealth.tsx`)

Create a new file `client/src/pages/tools/DesignHealth.tsx`:

```tsx
import ToolPage from './ToolPage';
import { INDUSTRIES } from '@/lib/industries';

export default function DesignHealth() {
  return <ToolPage config={{
    id: 'design_health', name: 'Design Health Check', nameAr: 'فحص صحة التصميم', icon: '🎨', cost: 300,
    endpoint: 'tools.designHealth', // Not used directly due to paywall, but required by type
    paywallAfterFreePreview: true,
    freePreviewEndpoint: 'tools.freeDesignHealthDiagnosis',
    unlockEndpoint: 'tools.unlockDesignHealth',
    description: 'Visual audit of your website using AI vision',
    descriptionAr: 'فحص بصري لموقعك باستخدام الذكاء الاصطناعي',
    guideUrl: '/guides/brand-identity', guideTitle: 'Brand Identity Guide',
    intro: {
      headline: 'Is your website design helping or hurting your brand?',
      headlineAr: 'هل تصميم موقعك بيفيد براندك ولا بيضره؟',
      body: 'This tool captures a screenshot of your website and uses advanced AI vision to evaluate Color Harmony, Visual Hierarchy, and Whitespace & Clutter.',
      bodyAr: 'الأداة دي بتاخد صورة لموقعك وبتستخدم الذكاء الاصطناعي البصري عشان تقيّم تناسق الألوان، التسلسل الهرمي البصري، والمساحات الفاضية والزحمة.',
      measures: ['Color Harmony', 'Visual Hierarchy', 'Whitespace & Clutter'],
      measuresAr: ['تناسق الألوان', 'التسلسل الهرمي البصري', 'المساحات الفاضية والزحمة'],
      bestFor: 'Anyone with an active website who wants an objective, instant design critique.',
      bestForAr: 'الأفضل لـ: أي حد عنده موقع شغال وعايز تقييم تصميم موضوعي وفوري.',
    },
    fields: [
      { name: 'companyName', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', placeholder: 'e.g. Sahra Café', placeholderAr: 'مثال: كافيه سهرة', required: true },
      { name: 'industry', label: 'Industry', labelAr: 'المجال', type: 'select', options: [...INDUSTRIES], required: true },
      { name: 'website', label: 'Website URL', labelAr: 'رابط الموقع', type: 'text', placeholder: 'https://...', required: true },
    ],
  }} />;
}
```

## 5. Wire it up in the Frontend

**In `client/src/pages/Tools.tsx`:**
Add to `ROUTE_MAP`:
```typescript
  design_health: '/tools/design-health',
```
Add to `FALLBACK_TOOLS`:
```typescript
  { id: 'design_health', name: 'Design Health Check', nameAr: 'فحص صحة التصميم', desc: 'Visual audit of your website using AI vision.', descAr: 'فحص بصري لموقعك باستخدام الذكاء الاصطناعي.', icon: '🎨', color: '#ec4899', cost: 300, route: '/tools/design-health', tag: 'Vision', tagAr: 'بصري' },
```

**In `client/src/App.tsx`:**
Add lazy import:
```typescript
const DesignHealthPage = lazy(() => import("./pages/tools/DesignHealth"));
```
Add Route (around line 182):
```tsx
                <Route path="/tools/design-health">{() => <SuspenseWrapper><DesignHealthPage /></SuspenseWrapper>}</Route>
```

## Verification
1. Run `pnpm run dev`.
2. Navigate to `/tools/design-health`.
3. Enter a valid URL (e.g., `https://example.com`).
4. Click "Run Free Diagnosis".
5. Verify the backend logs show `Screenshot captured successfully` and the AI returns a valid score.
6. Verify the paywall appears and unlocking works.
