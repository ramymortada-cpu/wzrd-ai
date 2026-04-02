/**
 * AI Tools Router — 6 brand diagnosis tools, each consumes credits.
 * 
 * Tools:
 * 1. Brand Diagnosis (~20 credits) — health score + top issues
 * 2. Offer Logic Check (~25 credits) — package/pricing analysis
 * 3. Message Check (~20 credits) — consistency + clarity
 * 4. Presence Audit (~25 credits) — cross-channel check
 * 5. Identity Snapshot (~20 credits) — personality match
 * 6. Launch Readiness (~30 credits) — readiness score + gaps
 * 
 * Each tool:
 * 1. Checks credit balance
 * 2. Deducts credits
 * 3. Calls WZZRD AI (resilientLLM)
 * 4. Returns structured result
 * 5. Links to educational content + services
 */

import { randomUUID } from "node:crypto";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  brandDiagnosisInputSchema,
  offerCheckInputSchema,
  messageCheckInputSchema,
  presenceAuditInputSchema,
  identitySnapshotInputSchema,
  launchReadinessInputSchema,
} from "@shared/wzrdDiagnosisToolSchemas";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { deductCredits, getUserCredits, TOOL_COSTS, getDb, toggleChecklistItemForUser } from "../db";
import { upsertLeadFromToolDiagnosis } from "../db/leads";
import { sendToolResultEmail } from "../wzrdEmails";
import { getToolSystemPrompt, isToolEnabled } from "../siteConfig";
import { diagnosisHistory, userChecklists } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { fireEmailTrigger } from "../emailTrigger";
import { getRedis } from "../_core/redis";
import { scrapeWebsite, buildWebsiteContext } from "../researchEngine";

/** Clamp benchmark pillar scores (module-level fn so callers pass a narrowed array, not `parsed.companies` twice). */
function clampBenchmarkCompanyRows(
  rows: Array<{
    name?: string;
    totalScore?: number;
    pillars?: Record<string, unknown>;
    strengths?: string[];
    weaknesses?: string[];
  }>,
) {
  return rows.map((c) => ({
    ...c,
    totalScore: Math.max(0, Math.min(100, c.totalScore || 50)),
    pillars: Object.fromEntries(
      Object.entries(c.pillars || {}).map(([k, v]) => [
        k,
        Math.max(0, Math.min(100, (typeof v === 'number' ? v : Number(v)) || 50)),
      ]),
    ),
  }));
}

/**
 * Save diagnosis result to history (non-blocking).
 * If save fails, the tool result is still shown — we just lose the history entry.
 */
async function saveDiagnosisHistory(userId: number, toolId: string, result: ToolResult): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const insertResult = await db.insert(diagnosisHistory).values({
    userId,
    toolId,
    score: result.score,
    pillarScores: null,
    findings: result.findings,
    actionItems: result.actionItems.length > 0 ? result.actionItems : null,
    recommendation: result.recommendation,
    schemaVersion: 1,
  });

  // Auto-create checklist if actionItems exist
  if (result.actionItems.length > 0) {
    const insertRows = insertResult as unknown as { insertId?: number }[];
    const diagId = Number(insertRows[0]?.insertId ?? 0);
    if (diagId > 0) {
      const checklistItems = result.actionItems.map((item, i) => ({
        id: i,
        task: item.task,
        difficulty: item.difficulty,
        completed: false,
        completedAt: null,
      }));
      await db.insert(userChecklists).values({
        userId,
        diagnosisId: diagId,
        items: checklistItems,
        completedCount: 0,
        totalCount: checklistItems.length,
      }).catch((err: unknown) => logger.warn({ err }, 'Failed to create checklist'));
    }
  }

  await upsertLeadFromToolDiagnosis({
    userId,
    toolId,
    result: {
      score: result.score,
      recommendation: result.recommendation,
      findings: result.findings,
    },
  }).catch((err) => logger.warn({ err, userId, toolId }, 'CRM lead sync from diagnosis failed'));
}

// ════════════════════════════════════════════
// SHARED TYPES
// ════════════════════════════════════════════

interface ToolResult {
  score: number;
  label: string;
  findings: Array<{ title: string; detail: string; severity: 'high' | 'medium' | 'low' }>;
  actionItems: Array<{ task: string; difficulty: 'easy' | 'medium' | 'hard' }>;
  recommendation: string;
  nextStep: { type: 'guide' | 'service' | 'tool'; title: string; url: string };
  serviceRecommendation: { show: boolean; tier: string; service: string; serviceAr: string; reason: string; reasonAr: string; url: string } | null;
  creditsUsed: number;
  creditsRemaining: number;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Needs Work';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

/**
 * Smart service recommendation based on tool + score.
 * Low score → strong recommendation. High score → subtle suggestion.
 */
/** Fallback in-memory pending unlock when REDIS_URL is unset (free preview → paid unlock). */
const BRAND_UNLOCK_TTL_MS = 45 * 60 * 1000;
const BRAND_DIAG_UNLOCK_REDIS_TTL_SEC = 2700;

type ToolDiagUnlockPayload = {
  toolId: string;
  score: number;
  findings: ToolResult['findings'];
  actionItems: ToolResult['actionItems'];
  recommendation: string;
};

const toolDiagUnlockPending = new Map<string, ToolDiagUnlockPayload & { expiresAt: number }>();

function toolDiagUnlockRedisKey(token: string): string {
  return `diag:token:${token}`;
}

function pruneExpiredUnlockTokens(): void {
  const now = Date.now();
  for (const [k, v] of toolDiagUnlockPending) {
    if (v.expiresAt < now) toolDiagUnlockPending.delete(k);
  }
}

function storedPayloadMatchesTool(parsed: Partial<ToolDiagUnlockPayload>, expectedToolId: string): boolean {
  const tid = parsed.toolId;
  if (tid === expectedToolId) return true;
  if ((tid === undefined || tid === null) && expectedToolId === 'brand_diagnosis') return true;
  return false;
}

async function storeToolDiagUnlockPending(token: string, payload: ToolDiagUnlockPayload): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(toolDiagUnlockRedisKey(token), JSON.stringify(payload), 'EX', BRAND_DIAG_UNLOCK_REDIS_TTL_SEC);
    return;
  }
  pruneExpiredUnlockTokens();
  toolDiagUnlockPending.set(token, {
    ...payload,
    expiresAt: Date.now() + BRAND_UNLOCK_TTL_MS,
  });
}

async function loadToolDiagUnlockPending(
  token: string,
  expectedToolId: string,
): Promise<Omit<ToolDiagUnlockPayload, 'toolId'> | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get(toolDiagUnlockRedisKey(token));
    if (raw == null || raw === '') return null;
    try {
      const parsed = JSON.parse(raw) as Partial<ToolDiagUnlockPayload>;
      if (!storedPayloadMatchesTool(parsed, expectedToolId)) return null;
      const { score, findings, actionItems, recommendation } = parsed;
      if (typeof score !== 'number' || !Array.isArray(findings) || !Array.isArray(actionItems) || typeof recommendation !== 'string') {
        return null;
      }
      return { score, findings, actionItems, recommendation };
    } catch {
      return null;
    }
  }
  pruneExpiredUnlockTokens();
  const fromMap = toolDiagUnlockPending.get(token);
  if (!fromMap) return null;
  if (fromMap.expiresAt < Date.now()) {
    toolDiagUnlockPending.delete(token);
    return null;
  }
  if (!storedPayloadMatchesTool(fromMap, expectedToolId)) return null;
  const { score, findings, actionItems, recommendation } = fromMap;
  return { score, findings, actionItems, recommendation };
}

async function clearToolDiagUnlockPending(token: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(toolDiagUnlockRedisKey(token));
    return;
  }
  toolDiagUnlockPending.delete(token);
}

const TOOL_DISPLAY_NAME: Record<string, string> = {
  brand_diagnosis: 'Brand Diagnosis',
  offer_check: 'Offer Logic Check',
  message_check: 'Message Check',
  presence_audit: 'Presence Audit',
  identity_snapshot: 'Identity Snapshot',
  launch_readiness: 'Launch Readiness',
};

async function unlockDiagnosisFromPending(
  ctx: { user: { id: number; email?: string | null } },
  unlockToken: string,
  toolId: string,
  nextStep: ToolResult['nextStep'],
): Promise<ToolResult> {
  const pending = await loadToolDiagUnlockPending(unlockToken, toolId);
  if (!pending) {
    throw new Error('انتهت صلاحية المعاينة، أعد التشخيص المجاني');
  }
  const deduction = await deductCredits(ctx.user!.id, toolId);
  if (!deduction.success) {
    throw new Error('رصيدك غير كافٍ');
  }
  await clearToolDiagUnlockPending(unlockToken);

  const result: ToolResult = {
    score: pending.score,
    label: scoreLabel(pending.score),
    findings: pending.findings,
    actionItems: pending.actionItems,
    recommendation: pending.recommendation,
    nextStep,
    serviceRecommendation: getServiceRecommendation(toolId, pending.score),
    creditsUsed: deduction.cost,
    creditsRemaining: deduction.newBalance ?? 0,
  };

  const display = TOOL_DISPLAY_NAME[toolId] ?? toolId;
  saveDiagnosisHistory(ctx.user!.id, toolId, result).catch((err) => {
    logger.error({ err, userId: ctx.user!.id, tool: toolId }, 'Failed to save diagnosis history after unlock');
  });
  fireEmailTrigger('first_tool_run', ctx.user!.id, { score: pending.score, toolName: display }).catch(() => {});
  if (pending.score < 40) {
    fireEmailTrigger('low_score', ctx.user!.id, { score: pending.score, toolName: display }).catch(() => {});
  }
  if (ctx.user!.email) {
    sendToolResultEmail(
      ctx.user!.email,
      '',
      display,
      result.score,
      result.findings.map((f) => ({ title: f.title, detail: f.detail })),
      result.recommendation,
      result.nextStep.url,
    ).catch(() => {});
  }
  logger.info({ userId: ctx.user!.id, tool: toolId, score: result.score, phase: 'unlock' }, 'Tool diagnosis unlocked');
  return result;
}

function parseDiagnosisAiResponse(
  text: string,
  toolId: string,
): {
  score: number;
  findings: ToolResult['findings'];
  actionItems: ToolResult['actionItems'];
  recommendation: string;
} {
  let parsed: { score?: number; findings?: Array<{ title: string; detail: string; severity: string }>; actionItems?: Array<{ task: string; difficulty: string }>; recommendation?: string };
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    const scoreMatch = text.match(/(?:score|نتيجة)[:\s]*(\d{1,3})/i);
    const extractedScore = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : null;
    const bulletPoints = text.match(/[•\-*⚠✓→]\s*(.+)/g) || [];
    const findings = bulletPoints.slice(0, 3).map(b => ({
      title: b.replace(/^[•\-*⚠✓→]\s*/, '').substring(0, 80),
      detail: '',
      severity: 'medium',
    }));
    parsed = {
      score: extractedScore ?? 50,
      findings: findings.length > 0 ? findings : [
        { title: 'Analysis Complete', detail: text.substring(0, 300), severity: 'medium' },
      ],
      recommendation: 'Run a full Health Check for detailed insights.',
    };
    logger.warn({ toolId, textLength: text.length, extractedScore }, 'AI response was not valid JSON — used smart fallback');
  }

  const score = Math.max(0, Math.min(100, parsed.score || 50));
  let actionItems: Array<{ task: string; difficulty: 'easy' | 'medium' | 'hard' }> = [];
  try {
    actionItems = (parsed.actionItems || []).slice(0, 15).map(item => ({
      task: item.task || '',
      difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
    })).filter(item => item.task.length > 0);
  } catch {
    logger.warn({ toolId }, 'actionItems parse failed — using empty array');
  }

  return {
    score,
    findings: (parsed.findings || []).slice(0, 5).map(f => ({
      title: f.title || 'Finding',
      detail: f.detail || '',
      severity: (['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium') as 'high' | 'medium' | 'low',
    })),
    actionItems,
    recommendation: parsed.recommendation || 'Consider a full audit for detailed insights.',
  };
}

async function callDiagnosisModel(
  toolId: string,
  defaultSystemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const adminPrompt = getToolSystemPrompt(toolId);
  const systemPrompt = adminPrompt || defaultSystemPrompt;
  const response = await resilientLLM({
    messages: [
      { role: 'system', content: systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.' },
      { role: 'user', content: userPrompt },
    ],
  }, { context: 'diagnosis' });
  return response.choices[0]?.message?.content as string;
}

function getServiceRecommendation(toolName: string, score: number): ToolResult['serviceRecommendation'] {
  // Only show service recommendation for scores below 70
  if (score >= 70) return null;

  const map: Record<string, { tier: string; service: string; serviceAr: string; url: string }> = {
    brand_diagnosis: { tier: 'AUDIT', service: 'Full Health Check', serviceAr: 'فحص صحة شامل', url: '/services-info#audit' },
    offer_check: { tier: 'BUILD', service: 'Starting Business Logic', serviceAr: 'منطق العرض', url: '/services-info#build' },
    message_check: { tier: 'BUILD', service: 'Brand Identity', serviceAr: 'هوية البراند', url: '/services-info#build' },
    presence_audit: { tier: 'AUDIT', service: 'Full Health Check', serviceAr: 'فحص صحة شامل', url: '/services-info#audit' },
    identity_snapshot: { tier: 'BUILD', service: 'Brand Identity', serviceAr: 'هوية البراند', url: '/services-info#build' },
    launch_readiness: { tier: 'TAKEOFF', service: 'Business Takeoff', serviceAr: 'باكدج الإقلاع', url: '/services-info#takeoff' },
  };

  const svc = map[toolName];
  if (!svc) return null;

  const severity = score < 40 ? 'critical' : 'moderate';
  const reasons: Record<string, { en: string; ar: string }> = {
    critical: {
      en: `Your score of ${score}/100 indicates significant issues that need professional attention. DIY fixes might miss root causes.`,
      ar: `نتيجتك ${score}/100 بتشير لمشاكل كبيرة محتاجة اهتمام احترافي. الإصلاحات اليدوية ممكن تفوّت الأسباب الجذرية.`,
    },
    moderate: {
      en: `At ${score}/100, focused professional work could unlock significant improvement. Consider a done-for-you approach.`,
      ar: `بنتيجة ${score}/100، شغل احترافي مركّز ممكن يحقق تحسن كبير. فكّر في الـ done-for-you.`,
    },
  };

  return {
    show: true,
    tier: svc.tier,
    service: svc.service,
    serviceAr: svc.serviceAr,
    reason: reasons[severity].en,
    reasonAr: reasons[severity].ar,
    url: svc.url,
  };
}

async function runToolAI(
  toolId: string,
  toolDisplayName: string,
  defaultSystemPrompt: string,
  userPrompt: string,
  userId: number,
  userEmail?: string | null
): Promise<ToolResult> {
  // 0. Check if tool is enabled in admin
  if (!isToolEnabled(toolId)) {
    throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
  }

  // 1. Deduct credits
  const deduction = await deductCredits(userId, toolId);
  if (!deduction.success) {
    throw new Error(deduction.error || 'Insufficient credits');
  }

  const text = await callDiagnosisModel(toolId, defaultSystemPrompt, userPrompt);
  const parsedBody = parseDiagnosisAiResponse(text, toolId);

  const result: ToolResult = {
    score: parsedBody.score,
    label: scoreLabel(parsedBody.score),
    findings: parsedBody.findings,
    actionItems: parsedBody.actionItems,
    recommendation: parsedBody.recommendation,
    nextStep: { type: 'guide', title: 'Learn more', url: '/guides/brand-health' },
    serviceRecommendation: getServiceRecommendation(toolId, parsedBody.score),
    creditsUsed: deduction.cost,
    creditsRemaining: deduction.newBalance ?? 0,
  };

  // 4. Save to diagnosis_history (non-blocking — don't fail the tool if save fails)
  saveDiagnosisHistory(userId, toolId, result).catch(err => {
    logger.error({ err, userId, toolId }, 'Failed to save diagnosis history — result still shown to user');
  });

  // 4b. Fire email automation triggers (non-blocking)
  fireEmailTrigger('first_tool_run', userId, { score: parsedBody.score, toolName: toolDisplayName }).catch(() => {});
  if (parsedBody.score < 40) {
    fireEmailTrigger('low_score', userId, { score: parsedBody.score, toolName: toolDisplayName }).catch(() => {});
  }

  // 5. Send result email (non-blocking)
  if (userEmail) {
    sendToolResultEmail(
      userEmail, '', toolDisplayName, result.score,
      result.findings.map(f => ({ title: f.title, detail: f.detail })),
      result.recommendation, result.nextStep.url
    ).catch(() => {});
  }

  return result;
}

// ════════════════════════════════════════════
// TOOL PROMPTS
// ════════════════════════════════════════════

const TOOL_SYSTEM = `You are WZZRD AI — a brand diagnosis engine trained on Keller's CBBE, Kapferer's Identity Prism, Sharp's How Brands Grow, and real MENA market data.

You analyze brands with brutal honesty. No fluff. No generic advice. Every finding must be specific and actionable.

Respond in JSON format:
{
  "score": <0-100>,
  "findings": [
    { "title": "<short title>", "detail": "<specific explanation>", "severity": "high|medium|low" }
  ],
  "actionItems": [
    { "task": "<specific actionable task in Arabic>", "difficulty": "easy|medium|hard" }
  ],
  "recommendation": "<one sentence next step>"
}

CRITICAL: You MUST include actionItems array. For each finding, include 2-3 specific, actionable tasks the business owner can do TODAY. Tasks must be in Egyptian Arabic and be practical (not generic). Max 15 actionItems total.`;

function buildBrandDiagnosisUserPrompt(input: z.infer<typeof brandDiagnosisInputSchema>): string {
  return `Analyze brand health for:
Company: ${input.companyName}
Industry: ${input.industry}
Market: ${input.market}
Years in business: ${input.yearsInBusiness || 'Not specified'}
Team size: ${input.teamSize || 'Not specified'}
Website: ${input.website || 'Not provided'}
Social accounts: ${input.socialMedia || 'Not provided'}
Differentiation vs competitors: ${input.currentPositioning || 'Not specified'}
Target audience: ${input.targetAudience}
Monthly revenue (band): ${input.monthlyRevenue || 'Not specified'}
Main brand challenge: ${input.biggestChallenge}
Previous branding work: ${input.previousBranding || 'Not specified'}

Score the brand 0-100. Identify the top 3-5 issues across: positioning clarity, messaging consistency, offer logic, visual perception, and customer journey. Be specific to THIS company.`;
}

function buildOfferCheckUserPrompt(input: z.infer<typeof offerCheckInputSchema>): string {
  return `Analyze offer logic for:
Company: ${input.companyName}
Industry: ${input.industry}
Packages/services (detail): ${input.currentPackages}
Number of packages (band): ${input.numberOfPackages || 'Not specified'}
Pricing model: ${input.pricingModel || 'Not specified'}
Price range: ${input.cheapestPrice || '?'} – ${input.highestPrice || '?'} (local currency)
Target audience / ICP: ${input.targetAudience}
Common objections: ${input.commonObjections || 'Not specified'}
Competitor pricing context: ${input.competitorPricing || 'Not specified'}

Score 0-100. Check: Is the offer clear? Does pricing logic make sense? Are there too many/few options? Is the value proposition obvious? Is there a clear path from free→paid?`;
}

function buildMessageCheckUserPrompt(input: z.infer<typeof messageCheckInputSchema>): string {
  return `Analyze messaging consistency for:
Company: ${input.companyName}
Industry: ${input.industry}
Tagline: ${input.tagline || 'None'}
Elevator pitch (what you do): ${input.elevatorPitch}
Website headline: ${input.websiteHeadline || 'Not provided'}
Instagram bio: ${input.instagramBio || 'Not provided'}
LinkedIn/Facebook about: ${input.linkedinAbout || 'Not provided'}
Key differentiator: ${input.keyDifferentiator || 'Not provided'}
Tone of voice (selected): ${input.toneOfVoice || 'Not specified'}
Customer quote (social proof): ${input.customerQuote || 'Not provided'}

Score 0-100. Check: Are these consistent? Is the differentiation clear? Is the tone appropriate? Is there a Clarity Gap? Would a new customer understand this brand in 5 seconds?`;
}

function buildPresenceAuditUserPrompt(input: z.infer<typeof presenceAuditInputSchema>): string {
  return `Audit digital presence for:
Company: ${input.companyName}
Industry: ${input.industry}
Website: ${input.website || 'Not provided'}
Instagram handle: ${input.instagramHandle || 'Not provided'}
Instagram followers (band): ${input.instagramFollowers || 'Not specified'}
Other platforms: ${input.otherPlatforms || 'None'}
Posting frequency: ${input.postingFrequency || 'Not specified'}
Content types posted: ${input.contentType || 'Not specified'}
How customers reach you: ${input.inquiryMethod}
Typical response time: ${input.avgResponseTime || 'Not specified'}
Google Business Profile: ${input.googleBusiness || 'Not specified'}

Score 0-100. Check: Cross-channel consistency, premium perception, CTA clarity, inquiry flow friction, content-proof-CTA alignment. Why is this brand "present but not chosen"?`;
}

function buildIdentitySnapshotUserPrompt(input: z.infer<typeof identitySnapshotInputSchema>): string {
  return `Analyze brand identity match for:
Company: ${input.companyName}
Industry: ${input.industry}
Brand personality (if it were a person): ${input.brandPersonality}
Target audience: ${input.targetAudience}
Brand colors: ${input.brandColors || 'Not specified'}
Logo status: ${input.hasLogo || 'Not specified'}
Brand guidelines status: ${input.hasGuidelines || 'Not specified'}
Competitors: ${input.competitors || 'Not specified'}
Desired perception (what people should feel): ${input.desiredPerception}
Gap between desired and actual: ${input.currentGap || 'Not specified'}

Score 0-100. Using Kapferer's Identity Prism, check: Does the brand personality match the audience? Is the visual quality matching the positioning? Is there a "Commodity Trap" — looking like everyone else? What archetype does this brand project vs. what it should project?`;
}

function buildLaunchReadinessUserPrompt(input: z.infer<typeof launchReadinessInputSchema>): string {
  return `Assess launch readiness for:
Company: ${input.companyName}
Industry: ${input.industry}
Launch type: ${input.launchType}
Target launch window: ${input.targetLaunchDate || 'Not set'}
Brand guidelines status: ${input.hasGuidelines || 'Not specified'}
Structured packages/pricing status: ${input.hasOfferStructure || 'Not specified'}
Website status: ${input.hasWebsite || 'Not specified'}
Content plan status: ${input.hasContentPlan || 'Not specified'}
Monthly marketing budget (band): ${input.marketingBudget || 'Not specified'}
Team capacity for launch: ${input.teamCapacity || 'Not specified'}
Biggest concern: ${input.biggestConcern}
Success metric after ~3 months: ${input.successMetric || 'Not specified'}

Score 0-100 on launch readiness. Identify what's missing and what's the priority order. Be specific about what "ready to launch" means for THIS type of business.`;
}

type ParsedDiagnosisBody = ReturnType<typeof parseDiagnosisAiResponse>;

function freeToolDiagnosisPreviewPayload(
  toolId: string,
  body: ParsedDiagnosisBody,
  unlockToken: string,
): {
  score: number;
  label: string;
  summary: string;
  problemTitles: string[];
  criticalCount: number;
  unlockToken: string;
  unlockCost: number;
} {
  const unlockCost = TOOL_COSTS[toolId] ?? 0;
  const criticalCount = body.findings.filter((f) => f.severity === 'high').length;
  return {
    score: body.score,
    label: scoreLabel(body.score),
    summary: body.recommendation,
    problemTitles: body.findings.map((f) => f.title),
    criticalCount,
    unlockToken,
    unlockCost,
  };
}

// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export const toolsRouter = router({
  /** Rich metadata for all tools — powers custom UI per tool */
  meta: protectedProcedure.query(() => ({
    tools: [
      { id: 'brand_diagnosis', name: 'Brand Diagnosis', nameAr: 'تشخيص البراند', icon: '🔬', color: '#6d5cff', cost: 20,
        desc: 'Comprehensive health score across positioning, messaging, offers, identity, and customer journey.',
        descAr: 'نتيجة صحة شاملة عبر التموضع، الرسائل، العروض، الهوية، ورحلة العميل.',
        inputs: ['companyName', 'industry', 'market', 'targetAudience', 'biggestChallenge', 'currentPositioning', 'socialMedia', 'yearsInBusiness', 'teamSize', 'monthlyRevenue', 'previousBranding', 'website'],
        guideUrl: '/guides/brand-health', guideTitle: 'How to Audit Your Brand Health',
        serviceUrl: '/services-info#audit', serviceTitle: 'Full Health Check' },
      { id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', icon: '📦', color: '#c8a24e', cost: 25,
        desc: 'Analyzes your packages, pricing logic, ICP clarity, and proof stack.',
        descAr: 'تحليل الباكدجات، منطق التسعير، وضوح الشريحة، وكومة الإثبات.',
        inputs: ['companyName', 'industry', 'currentPackages', 'numberOfPackages', 'pricingModel', 'cheapestPrice', 'highestPrice', 'targetAudience', 'commonObjections', 'competitorPricing'],
        guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
        serviceUrl: '/services-info#build', serviceTitle: 'Starting Business Logic' },
      { id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', icon: '💬', color: '#44ddc9', cost: 20,
        desc: 'Checks if your messaging is consistent, clear, and differentiated across touchpoints.',
        descAr: 'فحص لو الرسالة متسقة، واضحة، ومميّزة عبر نقاط التواصل.',
        inputs: ['companyName', 'industry', 'tagline', 'elevatorPitch', 'websiteHeadline', 'instagramBio', 'linkedinAbout', 'keyDifferentiator', 'toneOfVoice', 'customerQuote'],
        guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
        serviceUrl: '/services-info#build', serviceTitle: 'Brand Identity' },
      { id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور', icon: '🌐', color: '#ff6b6b', cost: 25,
        desc: 'Reviews how your brand appears across social, web, and inquiry channels.',
        descAr: 'مراجعة إزاي البراند بيظهر على السوشيال، الويب، وقنوات الاستفسار.',
        inputs: ['companyName', 'industry', 'website', 'instagramHandle', 'instagramFollowers', 'otherPlatforms', 'postingFrequency', 'contentType', 'inquiryMethod', 'avgResponseTime', 'googleBusiness'],
        guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Audit',
        serviceUrl: '/services-info#audit', serviceTitle: 'Full Health Check' },
      { id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', icon: '🪞', color: '#a78bfa', cost: 20,
        desc: 'Checks if your brand personality matches your target audience using Kapferer\'s Prism.',
        descAr: 'فحص لو شخصية البراند بتتوافق مع جمهورك باستخدام منظور Kapferer.',
        inputs: ['companyName', 'industry', 'brandPersonality', 'targetAudience', 'brandColors', 'hasLogo', 'hasGuidelines', 'competitors', 'desiredPerception', 'currentGap'],
        guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
        serviceUrl: '/services-info#build', serviceTitle: 'Brand Identity' },
      { id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', icon: '🚀', color: '#f59e0b', cost: 30,
        desc: 'Scores how ready you are to go to market — identifies gaps and priority order.',
        descAr: 'تقييم أد إيه أنت جاهز تنزل السوق — يحدد الفجوات وترتيب الأولوية.',
        inputs: ['companyName', 'industry', 'launchType', 'targetLaunchDate', 'hasGuidelines', 'hasOfferStructure', 'hasWebsite', 'hasContentPlan', 'marketingBudget', 'teamCapacity', 'biggestConcern', 'successMetric'],
        guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
        serviceUrl: '/services-info#takeoff', serviceTitle: 'Business Takeoff' },
      { id: 'competitive_benchmark', name: 'Competitive Benchmark', nameAr: 'مقارنة المنافسين', icon: '📊', color: '#1B4FD8', cost: 40,
        desc: 'Compare your brand against up to 3 competitors using real scraped website data.',
        descAr: 'قارن براندك بحد ٣ منافسين باستخدام بيانات حقيقية من المواقع.',
        inputs: ['companyName', 'companyUrl', 'competitors', 'industry', 'socialLinks'],
        guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Audit',
        serviceUrl: '/services-info#audit', serviceTitle: 'Full Health Check' },
    ],
  })),

  /** Check if user has enough credits for a tool */
  canUse: protectedProcedure
    .input(z.object({ toolName: z.string() }))
    .query(async ({ input, ctx }) => {
      const balance = await getUserCredits(ctx.user!.id);
      const cost = TOOL_COSTS[input.toolName] || 0;
      return { canUse: balance >= cost, balance, cost };
    }),

  /**
   * Brand Diagnosis — Step 1 (free): score + finding titles/severity only.
   * Full AI run is cached server-side; unlock with credits via unlockBrandDiagnosis.
   */
  freeBrandDiagnosis: protectedProcedure
    .input(brandDiagnosisInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('brand_diagnosis')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildBrandDiagnosisUserPrompt(input);
      const text = await callDiagnosisModel('brand_diagnosis', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'brand_diagnosis');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'brand_diagnosis',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      const criticalCount = body.findings.filter((f) => f.severity === 'high').length;
      const unlockCost = TOOL_COSTS.brand_diagnosis ?? 20;
      logger.info({ tool: 'brand_diagnosis', phase: 'free_preview', score: body.score, criticalCount }, 'Brand Diagnosis free preview generated');
      return {
        score: body.score,
        label: scoreLabel(body.score),
        findings: body.findings.map((f) => ({ title: f.title, severity: f.severity })),
        criticalCount,
        unlockToken,
        unlockCost,
      };
    }),

  /** Brand Diagnosis — Step 2 (paid): deduct credits + return full prescription from cached AI result */
  unlockBrandDiagnosis: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'brand_diagnosis', {
        type: 'guide',
        title: 'How to Audit Your Brand Health',
        url: '/guides/brand-health',
      }),
    ),

  freeOfferCheckDiagnosis: protectedProcedure
    .input(offerCheckInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('offer_check')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildOfferCheckUserPrompt(input);
      const text = await callDiagnosisModel('offer_check', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'offer_check');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'offer_check',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      logger.info({ tool: 'offer_check', phase: 'free_preview', score: body.score }, 'Offer Check free preview');
      return freeToolDiagnosisPreviewPayload('offer_check', body, unlockToken);
    }),

  unlockOfferCheck: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'offer_check', {
        type: 'guide',
        title: 'Offer Logic 101',
        url: '/guides/offer-logic',
      }),
    ),

  freeMessageCheckDiagnosis: protectedProcedure
    .input(messageCheckInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('message_check')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildMessageCheckUserPrompt(input);
      const text = await callDiagnosisModel('message_check', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'message_check');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'message_check',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      logger.info({ tool: 'message_check', phase: 'free_preview', score: body.score }, 'Message Check free preview');
      return freeToolDiagnosisPreviewPayload('message_check', body, unlockToken);
    }),

  unlockMessageCheck: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'message_check', {
        type: 'guide',
        title: 'Brand Identity Guide',
        url: '/guides/brand-identity',
      }),
    ),

  freePresenceAuditDiagnosis: protectedProcedure
    .input(presenceAuditInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('presence_audit')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildPresenceAuditUserPrompt(input);
      const text = await callDiagnosisModel('presence_audit', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'presence_audit');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'presence_audit',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      logger.info({ tool: 'presence_audit', phase: 'free_preview', score: body.score }, 'Presence Audit free preview');
      return freeToolDiagnosisPreviewPayload('presence_audit', body, unlockToken);
    }),

  unlockPresenceAudit: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'presence_audit', {
        type: 'service',
        title: 'Full Health Check',
        url: '/services#audit',
      }),
    ),

  freeIdentitySnapshotDiagnosis: protectedProcedure
    .input(identitySnapshotInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('identity_snapshot')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildIdentitySnapshotUserPrompt(input);
      const text = await callDiagnosisModel('identity_snapshot', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'identity_snapshot');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'identity_snapshot',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      logger.info({ tool: 'identity_snapshot', phase: 'free_preview', score: body.score }, 'Identity Snapshot free preview');
      return freeToolDiagnosisPreviewPayload('identity_snapshot', body, unlockToken);
    }),

  unlockIdentitySnapshot: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'identity_snapshot', {
        type: 'guide',
        title: 'What Is Brand Identity',
        url: '/guides/brand-identity',
      }),
    ),

  freeLaunchReadinessDiagnosis: protectedProcedure
    .input(launchReadinessInputSchema)
    .mutation(async ({ input }) => {
      if (!isToolEnabled('launch_readiness')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً. يرجى المحاولة لاحقاً.');
      }
      pruneExpiredUnlockTokens();
      const userPrompt = buildLaunchReadinessUserPrompt(input);
      const text = await callDiagnosisModel('launch_readiness', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'launch_readiness');
      const unlockToken = randomUUID();
      await storeToolDiagUnlockPending(unlockToken, {
        toolId: 'launch_readiness',
        score: body.score,
        findings: body.findings,
        actionItems: body.actionItems,
        recommendation: body.recommendation,
      });
      logger.info({ tool: 'launch_readiness', phase: 'free_preview', score: body.score }, 'Launch Readiness free preview');
      return freeToolDiagnosisPreviewPayload('launch_readiness', body, unlockToken);
    }),

  unlockLaunchReadiness: protectedProcedure
    .input(z.object({ unlockToken: z.string().uuid() }))
    .mutation(({ input, ctx }) =>
      unlockDiagnosisFromPending(ctx, input.unlockToken, 'launch_readiness', {
        type: 'service',
        title: 'Business Takeoff Package',
        url: '/services#takeoff',
      }),
    ),

  /** Tool 1: Brand Diagnosis — legacy single-step (deducts before result); prefer free + unlock in UI */
  brandDiagnosis: protectedProcedure
    .input(brandDiagnosisInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildBrandDiagnosisUserPrompt(input);
      const result = await runToolAI('brand_diagnosis', 'Brand Diagnosis', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'How to Audit Your Brand Health', url: '/guides/brand-health' };
      logger.info({ userId: ctx.user!.id, tool: 'brand_diagnosis', score: result.score }, 'Brand Diagnosis completed');
      return result;
    }),

  /** Tool 2: Offer Logic Check — client field \`currentPackages\` feeds packages copy */
  offerCheck: protectedProcedure
    .input(offerCheckInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildOfferCheckUserPrompt(input);
      const result = await runToolAI('offer_check', 'Offer Logic Check', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'Offer Logic 101', url: '/guides/offer-logic' };
      logger.info({ userId: ctx.user!.id, tool: 'offer_check', score: result.score }, 'Offer Check completed');
      return result;
    }),

  /** Tool 3: Message Check */
  messageCheck: protectedProcedure
    .input(messageCheckInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildMessageCheckUserPrompt(input);
      const result = await runToolAI('message_check', 'Message Check', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'Brand Identity Guide', url: '/guides/brand-identity' };
      logger.info({ userId: ctx.user!.id, tool: 'message_check', score: result.score }, 'Message Check completed');
      return result;
    }),

  /** Tool 4: Presence Audit */
  presenceAudit: protectedProcedure
    .input(presenceAuditInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildPresenceAuditUserPrompt(input);
      const result = await runToolAI('presence_audit', 'Presence Audit', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'service', title: 'Full Health Check', url: '/services#audit' };
      logger.info({ userId: ctx.user!.id, tool: 'presence_audit', score: result.score }, 'Presence Audit completed');
      return result;
    }),

  /** Tool 5: Identity Snapshot */
  identitySnapshot: protectedProcedure
    .input(identitySnapshotInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildIdentitySnapshotUserPrompt(input);
      const result = await runToolAI('identity_snapshot', 'Identity Snapshot', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'What Is Brand Identity', url: '/guides/brand-identity' };
      logger.info({ userId: ctx.user!.id, tool: 'identity_snapshot', score: result.score }, 'Identity Snapshot completed');
      return result;
    }),

  /** Tool 6: Launch Readiness — form sends string enum values, not booleans */
  launchReadiness: protectedProcedure
    .input(launchReadinessInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userPrompt = buildLaunchReadinessUserPrompt(input);
      const result = await runToolAI('launch_readiness', 'Launch Readiness', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'service', title: 'Business Takeoff Package', url: '/services#takeoff' };
      logger.info({ userId: ctx.user!.id, tool: 'launch_readiness', score: result.score }, 'Launch Readiness completed');
      return result;
    }),

  /** Guide Download — sends PDF link via email (Lead Magnet #2) */
  downloadGuide: publicProcedure
    .input(z.object({
      email: z.string().email().max(255),
      guideName: z.enum(['brand-health', 'offer-logic', 'brand-identity']),
    }))
    .mutation(async ({ input }) => {
      const guideMap: Record<string, { title: string; url: string }> = {
        'brand-health': { title: 'How to Audit Your Brand Health', url: '/landing/guide-brand-health.html' },
        'offer-logic': { title: 'Offer Logic 101: Why Smart Products Fail to Sell', url: '/landing/guide-offer-logic.html' },
        'brand-identity': { title: 'What Is Brand Identity (And Why a Logo Isn\'t One)', url: '/landing/guide-brand-identity.html' },
      };
      const guide = guideMap[input.guideName];
      if (!guide) return { success: false, message: 'Guide not found' };

      // Send email with guide link
      try {
        const { sendGuideEmail } = await import('../wzrdEmails');
        await sendGuideEmail(input.email, guide.title, guide.url);
      } catch { /* email optional */ }

      logger.info({ email: input.email, guide: input.guideName }, 'Guide downloaded');
      return { success: true, title: guide.title, url: guide.url };
    }),

  // ════════════════════════════════════════════
  // BRAND HEALTH TRACKER — History + Checklist
  // ════════════════════════════════════════════

  /** Get diagnosis history — last 12 entries + trend */
  myHistory: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { history: [], trend: 'new' as const, latest: null, totalDiagnoses: 0 };

        const history = await db.select()
          .from(diagnosisHistory)
          .where(eq(diagnosisHistory.userId, ctx.user!.id))
          .orderBy(desc(diagnosisHistory.createdAt))
          .limit(12);

        // Defensive parsing — handle different schema versions
        const safe = history.map((h: (typeof history)[number]) => ({
          ...h,
          pillarScores: typeof h.pillarScores === 'object' && h.pillarScores ? h.pillarScores : {},
          findings: Array.isArray(h.findings) ? h.findings : [],
          actionItems: Array.isArray(h.actionItems) ? h.actionItems : [],
        }));

        // Calculate trend
        let trend: 'improving' | 'declining' | 'stable' | 'new' = 'new';
        if (safe.length >= 2) {
          const diff = safe[0].score - safe[1].score;
          trend = diff > 3 ? 'improving' : diff < -3 ? 'declining' : 'stable';
        }

        return {
          history: safe,
          trend,
          latest: safe[0] || null,
          totalDiagnoses: safe.length,
        };
      } catch (err) {
        logger.error({ err, userId: ctx.user!.id }, 'myHistory error');
        return { history: [], trend: 'new' as const, latest: null, totalDiagnoses: 0 };
      }
    }),

  /** Get checklists for current user */
  myChecklists: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb();
        if (!db) return [];

        const checklists = await db.select()
          .from(userChecklists)
          .where(eq(userChecklists.userId, ctx.user!.id))
          .orderBy(desc(userChecklists.createdAt))
          .limit(10);

        return checklists.map((cl: (typeof checklists)[number]) => ({
          ...cl,
          items: Array.isArray(cl.items) ? cl.items : [],
        }));
      } catch (err) {
        logger.error({ err }, 'myChecklists error');
        return [];
      }
    }),

  /** Toggle a checklist item (complete/uncomplete) */
  toggleChecklistItem: protectedProcedure
    .input(z.object({
      checklistId: z.number(),
      itemIndex: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      return toggleChecklistItemForUser(ctx.user!.id, input.checklistId, input.itemIndex);
    }),

  // ════════════════════════════════════════════
  // COMPETITIVE BENCHMARK
  // ════════════════════════════════════════════

  /** Compare brand against 1-3 competitors */
  competitiveBenchmark: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      companyUrl: z.preprocess(
        (v) => (v === '' || v === null || v === undefined ? undefined : String(v).trim()),
        z.string().url().optional(),
      ),
      competitors: z.array(z.object({
        name: z.string().min(1).max(255),
        url: z.preprocess(
          (v) => (v === '' || v === null || v === undefined ? undefined : String(v).trim()),
          z.string().url().optional(),
        ),
      })).min(1).max(3),
      industry: z.string().min(1).max(100),
      socialLinks: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lowerCompany = input.companyName.toLowerCase().trim();
      for (const comp of input.competitors) {
        if (comp.name.toLowerCase().trim() === lowerCompany) {
          throw new Error('متقدرش تقارن الشركة بنفسها — دخل منافس مختلف.');
        }
      }

      const deduction = await deductCredits(ctx.user!.id, 'competitive_benchmark');
      if (!deduction.success) {
        throw new Error(deduction.error || 'مفيش كريدت كافي. محتاج ٤٠ كريدت.');
      }

      const scrapeBlock = async (label: string, name: string, url: string | undefined): Promise<string> => {
        if (!url?.trim()) return '';
        try {
          const scraped = await scrapeWebsite(url.trim());
          if (scraped && scraped.quality !== 'failed') {
            return `\n--- ${label}: ${name} WEBSITE DATA ---\n${buildWebsiteContext(scraped, 1500)}`;
          }
        } catch (err) {
          logger.warn({ err, url, name }, '[Benchmark] Scrape failed for company');
        }
        return '';
      };

      const scrapeBlocks = await Promise.all([
        scrapeBlock('MAIN', input.companyName, input.companyUrl),
        ...input.competitors.map((c) => scrapeBlock('COMPETITOR', c.name, c.url)),
      ]);
      const scrapedContext = scrapeBlocks.join('');

      const allCompanyNames = [input.companyName, ...input.competitors.map((c) => c.name)];

      const benchmarkPrompt = `You are WZZRD AI Competitive Benchmark Engine. Analyze and compare these ${allCompanyNames.length} brands in the "${input.industry}" industry:
${allCompanyNames.map((c, i) => `${i + 1}. ${c}`).join('\n')}
${input.socialLinks ? `\nSocial links: ${input.socialLinks}` : ''}

Here is the scraped website data for these companies (if available):
${scrapedContext.trim() ? scrapedContext : 'No website data was scraped. Rely only on verifiable general knowledge; do not invent specific on-site claims for any brand.'}

When scraped data exists for a company, base your pillar scores and strengths/weaknesses primarily on that content. When it does not, say so briefly and score conservatively.

For EACH company, score 0-100 on these 5 pillars:
1. Positioning (clarity + differentiation)
2. Messaging (consistency + tone)
3. Offer Structure (pricing + packaging logic)
4. Visual Identity (professional + cohesive)
5. Customer Journey (touchpoints + experience)

CRITICAL RULES:
- DIFFERENTIATE clearly between companies. Don't give similar scores to everyone.
- Be SPECIFIC to each company — no generic advice.
- If you don't have enough info about a competitor, say so honestly and estimate conservatively.
- Respond in Egyptian Arabic.

Respond ONLY in this JSON format:
{
  "companies": [
    {
      "name": "company name",
      "totalScore": 65,
      "pillars": { "positioning": 70, "messaging": 55, "offer": 60, "identity": 75, "journey": 65 },
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"]
    }
  ],
  "gaps": [
    { "pillar": "messaging", "yourScore": 55, "bestCompetitor": "CompetitorX", "bestScore": 80, "gap": 25, "recommendation": "specific recommendation in Arabic" }
  ],
  "overallInsight": "one paragraph analysis in Arabic"
}`;

      try {
        const response = await resilientLLM({
          messages: [
            { role: 'system', content: 'You are a brand competitive analysis expert. Respond ONLY with valid JSON. No markdown.' },
            { role: 'user', content: benchmarkPrompt },
          ],
        }, { context: 'benchmark' });

        const text = response.choices[0]?.message?.content as string;

        type BenchmarkCompanyRow = {
          name?: string;
          totalScore?: number;
          pillars?: Record<string, unknown>;
          strengths?: string[];
          weaknesses?: string[];
        };
        type BenchmarkGapRow = {
          pillar: string;
          gap: number;
          recommendation?: string;
        };
        type BenchmarkParsed = {
          companies?: BenchmarkCompanyRow[];
          gaps?: BenchmarkGapRow[];
          overallInsight?: string;
        };

        let parsed: BenchmarkParsed;
        try {
          parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as BenchmarkParsed;
        } catch {
          // Fallback
          parsed = {
            companies: allCompanyNames.map((c) => ({
              name: c,
              totalScore: 50 + Math.floor(Math.random() * 30),
              pillars: { positioning: 50, messaging: 50, offer: 50, identity: 50, journey: 50 },
              strengths: ['تحليل أولي'],
              weaknesses: ['محتاج بيانات أكتر'],
            })),
            gaps: [],
            overallInsight: 'حصل مشكلة في التحليل المقارن — حاول تاني مع تفاصيل أكتر.',
          };
          logger.warn({ textLength: text.length }, 'Benchmark JSON parse failed — used fallback');
        }

        const companiesClamp = parsed.companies;
        if (companiesClamp) {
          parsed.companies = clampBenchmarkCompanyRows(companiesClamp as BenchmarkCompanyRow[]);
        }

        // Save to history — optional element access avoids duplicate reads on `parsed.companies`
        const yourCompany: BenchmarkCompanyRow | undefined = parsed.companies?.[0];
        if (yourCompany) {
          const row = yourCompany as BenchmarkCompanyRow;
          const score = row.totalScore ?? 50;
          saveDiagnosisHistory(ctx.user!.id, 'competitive_benchmark', {
            score,
            label: scoreLabel(score),
            findings: (parsed.gaps || []).slice(0, 5).map((g) => ({
              title: `فجوة في ${g.pillar}: ${g.gap} نقطة`,
              detail: g.recommendation || '',
              severity: g.gap > 20 ? 'high' : g.gap > 10 ? 'medium' : 'low',
            })),
            actionItems: [],
            recommendation: parsed.overallInsight || '',
            nextStep: { type: 'service', title: 'Brand Strategy', url: '/services-info' },
            serviceRecommendation: null,
            creditsUsed: deduction.cost,
            creditsRemaining: deduction.newBalance ?? 0,
          }).catch(() => {});
        }

        return {
          ...parsed,
          creditsUsed: deduction.cost,
          creditsRemaining: deduction.newBalance ?? 0,
        };
      } catch (err: unknown) {
        logger.error({ err }, 'Competitive benchmark failed');
        throw new Error('حصل مشكلة في التحليل — حاول تاني.');
      }
    }),

  // ════════════════════════════════════════════
  // QUICK MODE — 5 questions instead of 12
  // ════════════════════════════════════════════

  /**
   * Quick Brand Diagnosis — lead magnet: no login, no credits.
   * Returns score + finding titles/severity only (no detail, no action items in response).
   */
  freeQuickDiagnosis: publicProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      industry: z.string().min(1).max(100),
      targetAudience: z.string().min(1).max(500),
      biggestChallenge: z.string().min(1).max(500),
      socialLink: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      if (!isToolEnabled('brand_diagnosis')) {
        throw new Error('هذه الأداة معطّلة مؤقتاً.');
      }
      const userPrompt = `Quick brand diagnosis for:
Company: ${input.companyName}
Industry: ${input.industry}
Target audience: ${input.targetAudience}
Biggest challenge: ${input.biggestChallenge}
Social link: ${input.socialLink || 'Not provided'}

This is a QUICK diagnosis — be concise but specific. Score 0-100 and give top 3 findings + 5 action items.
Respond in Egyptian Arabic.`;

      const text = await callDiagnosisModel('brand_diagnosis', TOOL_SYSTEM, userPrompt);
      const body = parseDiagnosisAiResponse(text, 'brand_diagnosis');
      logger.info({ tool: 'free_quick_diagnosis', score: body.score }, 'Free quick diagnosis completed');
      return {
        score: body.score,
        label: scoreLabel(body.score),
        findings: body.findings.map((f) => ({ title: f.title, severity: f.severity })),
        criticalCount: body.findings.filter((f) => f.severity === 'high').length,
      };
    }),
});
