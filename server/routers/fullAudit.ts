/**
 * fullAudit.ts — Sprint A: Unified Brand Analysis
 * 7-pillar brand audit using 2 parallel LLM calls (CallA: pillars 1-4, CallB: pillars 5-7 + meta).
 * actionPlan is built in the backend — NOT by the LLM.
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { deductCredits, getUserCredits, getDb, TOOL_COSTS } from "../db";
import { fullAuditResults } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { scrapeWebsite, buildWebsiteContext, fetchLighthouseScores, searchGoogle } from "../researchEngine";
import { getSemanticKnowledge } from "../vectorSearch";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FULL_AUDIT_COST = 60;
export const FULL_AUDIT_PARTIAL_COST = 30;
export const LLM_TIMEOUT = 25000;

// ─── Input schema ─────────────────────────────────────────────────────────────

export const fullAuditInputSchema = z.object({
  companyName: z.string().min(1).max(200).trim(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  industry: z.string().min(1).max(100).trim(),
  targetAudience: z.string().min(1).max(1000).trim(),
  mainChallenge: z.string().min(1).max(1000).trim(),
  marketRegion: z.enum(['egypt', 'ksa', 'uae', 'other']).default('egypt'),
});

// ─── Language instruction ────────────────────────────────────────────────────

export function getLanguageInstruction(market: string): string {
  switch (market) {
    case 'egypt':
      return 'Respond in Egyptian Arabic (عامية مصرية). Casual, direct tone. English technical terms OK (Brand, SEO, Positioning).';
    case 'ksa':
      return 'Respond in formal Arabic suitable for Saudi business context. Professional tone with English technical terms where standard.';
    case 'uae':
      return 'Respond in formal Arabic suitable for UAE business context. Professional, international tone with English technical terms.';
    default:
      return 'Respond in Modern Standard Arabic with English technical terms where needed.';
  }
}

// ─── Action plan builder (NOT LLM) ──────────────────────────────────────────

export function buildActionPlan(
  top3Issues: Array<{ issue: string; fix: string }>,
  market: string
) {
  const isAr = market === 'egypt' || market === 'ksa' || market === 'uae';
  return {
    thisWeek: top3Issues.slice(0, 2).map((i) => i.fix),
    thisMonth: top3Issues.map((i) =>
      isAr ? `حل مشكلة: ${i.issue}` : `Address: ${i.issue}`
    ),
    next3Months: [
      isAr ? 'مراجعة شاملة بعد تنفيذ الخطوات' : 'Full review after implementing fixes',
      isAr ? 'قياس التحسن ومقارنة بالمنافسين' : 'Measure improvement vs competitors',
    ],
  };
}

// ─── Safe JSON parser ────────────────────────────────────────────────────────

export function safeParseLLM(text: string, label: string): Record<string, unknown> | null {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json\s*|```/g, '').trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (err) {
    logger.error({ err, text: text?.slice(0, 300) }, `[FullAudit] Failed to parse ${label}`);
    return null;
  }
}

// ─── System prompts ──────────────────────────────────────────────────────────

function buildCallAPrompt(market: string): string {
  return `You are WZZRD AI — an expert brand strategist specializing in the MENA market.

Analyze this brand across 4 pillars ONLY. Be BRUTALLY HONEST. Do NOT inflate scores.

If you have website data — use it as evidence. Quote specific elements you found.
If you do NOT have website data — say so explicitly and lower your confidence.
NEVER invent data. NEVER hallucinate statistics. If you don't know, say you don't know.

${getLanguageInstruction(market)}

Respond ONLY with valid JSON matching this exact structure:
{
  "pillars": [
    {
      "id": "identity",
      "name": "Brand Identity",
      "nameAr": "الهوية",
      "score": <number 0-100>,
      "summary": "<one sentence summary>",
      "findings": [
        { "title": "<finding title>", "detail": "<specific detail with evidence>", "severity": "high|medium|low" }
      ]
    },
    {
      "id": "positioning",
      "name": "Positioning",
      "nameAr": "التمركز",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [...]
    },
    {
      "id": "messaging",
      "name": "Messaging",
      "nameAr": "الرسالة",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [...]
    },
    {
      "id": "offer",
      "name": "Offer Logic",
      "nameAr": "العرض",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [...]
    }
  ]
}

Max 2-3 findings per pillar. Be specific, not generic. Use evidence from the data provided.`;
}

function buildCallBPrompt(market: string): string {
  return `You are WZZRD AI — an expert brand strategist specializing in the MENA market.

Analyze this brand across 3 pillars ONLY + produce the overall assessment. Be BRUTALLY HONEST.

If you have website/Lighthouse data — use real numbers as evidence.
If data is missing — say so explicitly.
NEVER invent data. NEVER hallucinate.

${getLanguageInstruction(market)}

Respond ONLY with valid JSON matching this exact structure:
{
  "pillars": [
    {
      "id": "digital_presence",
      "name": "Digital Presence",
      "nameAr": "التواجد الرقمي",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [
        { "title": "<>", "detail": "<>", "severity": "high|medium|low" }
      ]
    },
    {
      "id": "visual_design",
      "name": "Visual Design",
      "nameAr": "التصميم البصري",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [...]
    },
    {
      "id": "market_readiness",
      "name": "Market Readiness",
      "nameAr": "الجاهزية",
      "score": <number 0-100>,
      "summary": "<one sentence>",
      "findings": [...]
    }
  ],
  "overallScore": <number 0-100>,
  "overallLabel": "<ممتاز|كويس|محتاج شغل|ضعيف|حرج>",
  "confidence": "<high|medium|low>",
  "confidenceReason": "<why this confidence level>",
  "top3Issues": [
    { "issue": "<the problem>", "impact": "<the business impact>", "fix": "<practical fix>" }
  ],
  "limitations": ["<anything we couldn't analyze>"]
}

NOTE: Do NOT include actionPlan — it is generated separately in the backend.
Max 2-3 findings per pillar. Use real data, not generic advice.`;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const fullAuditRouter = router({

  /** Run a full 7-pillar brand audit (60 credits) */
  run: protectedProcedure
    .input(fullAuditInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!.id;

      // 1. Check credits
      const userCredits = await getUserCredits(userId);
      if (userCredits < FULL_AUDIT_COST) {
        return {
          success: false as const,
          error: 'insufficient_credits' as const,
          needed: FULL_AUDIT_COST,
          have: userCredits,
        };
      }

      // 2. Data gathering — all fail-safe
      const websiteUrl = input.website?.trim();
      const [scrapedResult, lighthouseResult, searchResult, knowledgeResult] =
        await Promise.allSettled([
          websiteUrl ? scrapeWebsite(websiteUrl) : Promise.resolve(null),
          websiteUrl ? fetchLighthouseScores(websiteUrl) : Promise.resolve(null),
          searchGoogle(`${input.companyName} ${input.industry} brand MENA`, 5),
          getSemanticKnowledge(`${input.industry} brand strategy MENA`, { tokenBudget: 1500 }),
        ]);

      // 3. Build data context
      const scrapedData = scrapedResult.status === 'fulfilled' ? scrapedResult.value : null;
      const lighthouseData = lighthouseResult.status === 'fulfilled' ? lighthouseResult.value : null;
      const searchData = searchResult.status === 'fulfilled' ? searchResult.value : [];
      const knowledgeData = knowledgeResult.status === 'fulfilled' ? knowledgeResult.value : '';

      let dataContext = '';
      if (scrapedData) {
        dataContext += `\nWEBSITE DATA:\n${buildWebsiteContext(scrapedData)}\n`;
      }
      if (lighthouseData) {
        dataContext += `\nLIGHTHOUSE SCORES:\nPerformance: ${lighthouseData.performance ?? 'N/A'}, SEO: ${lighthouseData.seo ?? 'N/A'}, Accessibility: ${lighthouseData.accessibility ?? 'N/A'}\n`;
      }
      if (searchData && searchData.length > 0) {
        dataContext += `\nSEARCH RESULTS:\n${searchData.slice(0, 3).map((r: { title: string; snippet: string }) => `- ${r.title}: ${r.snippet}`).join('\n')}\n`;
      }
      if (knowledgeData) {
        dataContext += `\nINDUSTRY KNOWLEDGE:\n${knowledgeData}\n`;
      }

      // 4. Build user context
      const userContext = `
BRAND: ${input.companyName}
INDUSTRY: ${input.industry}
TARGET AUDIENCE: ${input.targetAudience}
MAIN CHALLENGE: ${input.mainChallenge}
MARKET: ${input.marketRegion}
${websiteUrl ? `WEBSITE: ${websiteUrl}` : 'WEBSITE: Not provided'}
${dataContext || 'No external data available.'}`.trim();

      // 5. 2 parallel LLM calls
      const [callAResult, callBResult] = await Promise.allSettled([
        resilientLLM(
          {
            messages: [
              { role: 'system', content: buildCallAPrompt(input.marketRegion) },
              { role: 'user', content: userContext },
            ],
          },
          { context: 'full_audit_a', userId, timeout: LLM_TIMEOUT }
        ),
        resilientLLM(
          {
            messages: [
              { role: 'system', content: buildCallBPrompt(input.marketRegion) },
              { role: 'user', content: userContext },
            ],
          },
          { context: 'full_audit_b', userId, timeout: LLM_TIMEOUT }
        ),
      ]);

      // 6. Parse results — content can be string or content-part array
      const rawA = callAResult.status === 'fulfilled'
        ? callAResult.value?.choices?.[0]?.message?.content
        : null;
      const rawB = callBResult.status === 'fulfilled'
        ? callBResult.value?.choices?.[0]?.message?.content
        : null;
      const callAText = typeof rawA === 'string' ? rawA : '';
      const callBText = typeof rawB === 'string' ? rawB : '';

      const parsedA = callAText ? safeParseLLM(callAText, 'CallA') : null;
      const parsedB = callBText ? safeParseLLM(callBText, 'CallB') : null;

      // 7. Both failed → no deduction
      if (!parsedA && !parsedB) {
        logger.error({ userId }, '[FullAudit] Both LLM calls failed');
        return {
          success: false as const,
          error: 'ai_failed' as const,
          message: 'التحليل فشل — مفيش credits اتخصمت',
        };
      }

      // 8. Partial failure → deduct 30
      const isPartial = !parsedA || !parsedB;
      const creditsToDeduct = isPartial ? FULL_AUDIT_PARTIAL_COST : FULL_AUDIT_COST;

      // Deduct credits BEFORE saving (fail-closed)
      // deductCredits(userId, toolName, metadata?) — uses TOOL_COSTS['full_audit'] internally
      // For partial, we temporarily adjust TOOL_COSTS locally or use metadata override not possible,
      // so we use the lower-level deduction by adjusting: we call with 'full_audit' for 60
      // and call with 'full_audit_partial' for 30. Add partial cost to TOOL_COSTS dynamically:
      const toolNameForDeduction = isPartial ? 'full_audit_partial' : 'full_audit';
      // Ensure partial cost is registered
      if (isPartial && !TOOL_COSTS['full_audit_partial']) {
        TOOL_COSTS['full_audit_partial'] = FULL_AUDIT_PARTIAL_COST;
      }
      const deductResult = await deductCredits(userId, toolNameForDeduction, {
        companyName: input.companyName,
        partial: isPartial,
      });
      if (!deductResult.success) {
        return {
          success: false as const,
          error: 'insufficient_credits' as const,
          needed: creditsToDeduct,
          have: userCredits,
        };
      }

      // Merge pillars
      const pillarsA = (parsedA?.pillars as unknown[]) ?? [];
      const pillarsB = (parsedB?.pillars as unknown[]) ?? [];
      const allPillars = [...pillarsA, ...pillarsB];

      const top3Issues = (parsedB?.top3Issues as Array<{ issue: string; impact: string; fix: string }>) ?? [];
      const actionPlan = buildActionPlan(top3Issues, input.marketRegion);

      const auditResult = {
        pillars: allPillars,
        overallScore: parsedB?.overallScore ?? null,
        overallLabel: parsedB?.overallLabel ?? null,
        confidence: parsedB?.confidence ?? 'low',
        confidenceReason: parsedB?.confidenceReason ?? '',
        top3Issues,
        actionPlan,
        limitations: (parsedB?.limitations as string[]) ?? [],
      };

      // 9. Save to DB
      const db = await getDb();
      let savedId: number | null = null;
      if (db) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const insertValues: any = {
            userId,
            companyName: input.companyName,
            website: websiteUrl ?? null,
            industry: input.industry,
            targetAudience: input.targetAudience,
            mainChallenge: input.mainChallenge,
            marketRegion: input.marketRegion,
            overallScore: typeof auditResult.overallScore === 'number' ? auditResult.overallScore : null,
            confidence: auditResult.confidence,
            resultJson: auditResult,
            metaJson: {
              hasWebsiteData: Boolean(scrapedData),
              hasLighthouseData: Boolean(lighthouseData),
              searchResultsCount: searchData?.length ?? 0,
            },
            creditsUsed: creditsToDeduct,
          };
          const insertResult = await db.insert(fullAuditResults).values(insertValues);
          savedId = (insertResult as unknown as { insertId?: number }).insertId ?? null;
        } catch (err) {
          logger.error({ err, userId }, '[FullAudit] Failed to save to DB');
        }
      }

      if (isPartial) {
        return {
          success: true as const,
          partial: true as const,
          partialMessage: 'تحليل جزئي — بعض المحاور لم تكتمل',
          audit: auditResult,
          auditId: savedId,
          meta: { creditsUsed: creditsToDeduct },
        };
      }

      return {
        success: true as const,
        partial: false as const,
        audit: auditResult,
        auditId: savedId,
        meta: { creditsUsed: creditsToDeduct },
      };
    }),

  /** List current user's past audits */
  myAudits: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select({
        id: fullAuditResults.id,
        companyName: fullAuditResults.companyName,
        industry: fullAuditResults.industry,
        overallScore: fullAuditResults.overallScore,
        confidence: fullAuditResults.confidence,
        creditsUsed: fullAuditResults.creditsUsed,
        createdAt: fullAuditResults.createdAt,
      })
      .from(fullAuditResults)
      .where(eq(fullAuditResults.userId, ctx.user!.id))
      .orderBy(desc(fullAuditResults.createdAt))
      .limit(50);

    return results;
  }),

  /** Get a single saved audit by ID (ownership enforced) */
  getAudit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const [row] = await db
        .select()
        .from(fullAuditResults)
        .where(eq(fullAuditResults.id, input.id))
        .limit(1);

      if (!row) return null;

      // IDOR protection: must own the audit
      if (row.userId !== ctx.user!.id) {
        logger.warn({ userId: ctx.user!.id, auditId: input.id }, '[FullAudit] Unauthorized getAudit attempt');
        return null;
      }

      return row;
    }),
});
