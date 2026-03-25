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
 * 3. Calls WZRD AI (resilientLLM)
 * 4. Returns structured result
 * 5. Links to educational content + services
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { deductCredits, getUserCredits, TOOL_COSTS, getDb } from "../db";
import { sendToolResultEmail } from "../wzrdEmails";
import { getToolSystemPrompt, isToolEnabled } from "../siteConfig";
import { diagnosisHistory, userChecklists } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { fireEmailTrigger } from "../emailTrigger";

type DiagnosisHistoryRow = typeof diagnosisHistory.$inferSelect;
type UserChecklistRow = typeof userChecklists.$inferSelect;

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
    const diagId = (insertResult as any)?.[0]?.insertId ?? 0;
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
      }).catch((err: any) => logger.warn({ err }, 'Failed to create checklist'));
    }
  }
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

  // 1. Get system prompt from admin (or use default)
  const adminPrompt = getToolSystemPrompt(toolId);
  const systemPrompt = adminPrompt || defaultSystemPrompt;

  // 2. Deduct credits
  const deduction = await deductCredits(userId, toolId);
  if (!deduction.success) {
    throw new Error(deduction.error || 'Insufficient credits');
  }

  // 2. Call AI
  const response = await resilientLLM({
    messages: [
      { role: 'system', content: systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.' },
      { role: 'user', content: userPrompt },
    ],
  }, { context: 'diagnosis' });

  const text = response.choices[0]?.message?.content as string;

  // 3. Parse response
  let parsed: { score?: number; findings?: Array<{ title: string; detail: string; severity: string }>; actionItems?: Array<{ task: string; difficulty: string }>; recommendation?: string };
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    // Try parsing the full response
    parsed = JSON.parse(clean);
  } catch {
    // Smart fallback: try to extract score from text
    const scoreMatch = text.match(/(?:score|نتيجة)[:\s]*(\d{1,3})/i);
    const extractedScore = scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : null;

    // Try to extract bullet points as findings
    const bulletPoints = text.match(/[•\-\*⚠✓→]\s*(.+)/g) || [];
    const findings = bulletPoints.slice(0, 3).map(b => ({
      title: b.replace(/^[•\-\*⚠✓→]\s*/, '').substring(0, 80),
      detail: '',
      severity: 'medium',
    }));

    parsed = {
      score: extractedScore ?? 50,
      findings: findings.length > 0 ? findings : [
        { title: 'Analysis Complete', detail: text.substring(0, 300), severity: 'medium' }
      ],
      recommendation: 'Run a full Health Check for detailed insights.',
    };

    logger.warn({ toolId, textLength: text.length, extractedScore }, 'AI response was not valid JSON — used smart fallback');
  }

  const score = Math.max(0, Math.min(100, parsed.score || 50));

  // Extract actionItems with defensive parsing
  let actionItems: Array<{ task: string; difficulty: 'easy' | 'medium' | 'hard' }> = [];
  try {
    actionItems = (parsed.actionItems || []).slice(0, 15).map(item => ({
      task: item.task || '',
      difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
    })).filter(item => item.task.length > 0);
  } catch {
    logger.warn({ toolId }, 'actionItems parse failed — using empty array');
  }

  const result: ToolResult = {
    score,
    label: scoreLabel(score),
    findings: (parsed.findings || []).slice(0, 5).map(f => ({
      title: f.title || 'Finding',
      detail: f.detail || '',
      severity: (['high', 'medium', 'low'].includes(f.severity) ? f.severity : 'medium') as 'high' | 'medium' | 'low',
    })),
    actionItems,
    recommendation: parsed.recommendation || 'Consider a full audit for detailed insights.',
    nextStep: { type: 'guide', title: 'Learn more', url: '/guides/brand-health' },
    serviceRecommendation: getServiceRecommendation(toolId, score),
    creditsUsed: deduction.cost,
    creditsRemaining: deduction.newBalance ?? 0,
  };

  // 4. Save to diagnosis_history (non-blocking — don't fail the tool if save fails)
  saveDiagnosisHistory(userId, toolId, result).catch(err => {
    logger.error({ err, userId, toolId }, 'Failed to save diagnosis history — result still shown to user');
  });

  // 4b. Fire email automation triggers (non-blocking)
  fireEmailTrigger('first_tool_run', userId, { score, toolName: toolDisplayName }).catch(() => {});
  if (score < 40) {
    fireEmailTrigger('low_score', userId, { score, toolName: toolDisplayName }).catch(() => {});
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

const TOOL_SYSTEM = `You are WZRD AI — a brand diagnosis engine trained on Keller's CBBE, Kapferer's Identity Prism, Sharp's How Brands Grow, and real MENA market data.

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
        inputs: ['companyName', 'industry', 'market', 'website', 'challenge'],
        guideUrl: '/guides/brand-health', guideTitle: 'How to Audit Your Brand Health',
        serviceUrl: '/services-info#audit', serviceTitle: 'Full Health Check' },
      { id: 'offer_check', name: 'Offer Logic Check', nameAr: 'فحص منطق العرض', icon: '📦', color: '#c8a24e', cost: 25,
        desc: 'Analyzes your packages, pricing logic, ICP clarity, and proof stack.',
        descAr: 'تحليل الباكدجات، منطق التسعير، وضوح الشريحة، وكومة الإثبات.',
        inputs: ['companyName', 'packages', 'pricing', 'targetAudience'],
        guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
        serviceUrl: '/services-info#build', serviceTitle: 'Starting Business Logic' },
      { id: 'message_check', name: 'Message Check', nameAr: 'فحص الرسالة', icon: '💬', color: '#44ddc9', cost: 20,
        desc: 'Checks if your messaging is consistent, clear, and differentiated across touchpoints.',
        descAr: 'فحص لو الرسالة متسقة، واضحة، ومميّزة عبر نقاط التواصل.',
        inputs: ['companyName', 'tagline', 'keyMessage', 'socialBio', 'websiteHeadline'],
        guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
        serviceUrl: '/services-info#build', serviceTitle: 'Brand Identity' },
      { id: 'presence_audit', name: 'Presence Audit', nameAr: 'فحص الحضور', icon: '🌐', color: '#ff6b6b', cost: 25,
        desc: 'Reviews how your brand appears across social, web, and inquiry channels.',
        descAr: 'مراجعة إزاي البراند بيظهر على السوشيال، الويب، وقنوات الاستفسار.',
        inputs: ['companyName', 'instagramHandle', 'website', 'otherChannels', 'inquiryFlow'],
        guideUrl: '/guides/brand-health', guideTitle: 'Brand Health Audit',
        serviceUrl: '/services-info#audit', serviceTitle: 'Full Health Check' },
      { id: 'identity_snapshot', name: 'Identity Snapshot', nameAr: 'لقطة الهوية', icon: '🪞', color: '#a78bfa', cost: 20,
        desc: 'Checks if your brand personality matches your target audience using Kapferer\'s Prism.',
        descAr: 'فحص لو شخصية البراند بتتوافق مع جمهورك باستخدام منظور Kapferer.',
        inputs: ['companyName', 'brandDescription', 'targetAudience', 'competitors'],
        guideUrl: '/guides/brand-identity', guideTitle: 'What Is Brand Identity',
        serviceUrl: '/services-info#build', serviceTitle: 'Brand Identity' },
      { id: 'launch_readiness', name: 'Launch Readiness', nameAr: 'جاهزية الإطلاق', icon: '🚀', color: '#f59e0b', cost: 30,
        desc: 'Scores how ready you are to go to market — identifies gaps and priority order.',
        descAr: 'تقييم أد إيه أنت جاهز تنزل السوق — يحدد الفجوات وترتيب الأولوية.',
        inputs: ['companyName', 'hasGuidelines', 'hasOfferStructure', 'hasContentPlan', 'hasWebsite', 'launchGoal'],
        guideUrl: '/guides/offer-logic', guideTitle: 'Offer Logic 101',
        serviceUrl: '/services-info#takeoff', serviceTitle: 'Business Takeoff' },
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

  /** Tool 1: Brand Diagnosis */
  brandDiagnosis: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      industry: z.string().max(100).optional(),
      market: z.string().max(50).optional(),
      website: z.string().max(500).optional(),
      challenge: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Analyze brand health for:
Company: ${input.companyName}
Industry: ${input.industry || 'Not specified'}
Market: ${input.market || 'MENA'}
Website: ${input.website || 'Not provided'}
Main challenge: ${input.challenge || 'Not specified'}

Score the brand 0-100. Identify the top 3-5 issues across: positioning clarity, messaging consistency, offer logic, visual perception, and customer journey. Be specific to THIS company.`;

      const result = await runToolAI('brand_diagnosis', 'Brand Diagnosis', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'How to Audit Your Brand Health', url: '/guides/brand-health' };
      logger.info({ userId: ctx.user!.id, tool: 'brand_diagnosis', score: result.score }, 'Brand Diagnosis completed');
      return result;
    }),

  /** Tool 2: Offer Logic Check */
  offerCheck: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      packages: z.string().max(2000),
      pricing: z.string().max(500).optional(),
      targetAudience: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Analyze offer logic for:
Company: ${input.companyName}
Current packages/services: ${input.packages}
Pricing approach: ${input.pricing || 'Not specified'}
Target audience: ${input.targetAudience || 'Not specified'}

Score 0-100. Check: Is the offer clear? Does pricing logic make sense? Are there too many/few options? Is the value proposition obvious? Is there a clear path from free→paid?`;

      const result = await runToolAI('offer_check', 'Offer Logic Check', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'Offer Logic 101', url: '/guides/offer-logic' };
      logger.info({ userId: ctx.user!.id, tool: 'offer_check', score: result.score }, 'Offer Check completed');
      return result;
    }),

  /** Tool 3: Message Check */
  messageCheck: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      tagline: z.string().max(500).optional(),
      keyMessage: z.string().max(1000).optional(),
      socialBio: z.string().max(500).optional(),
      websiteHeadline: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Analyze messaging consistency for:
Company: ${input.companyName}
Tagline: ${input.tagline || 'None'}
Key message: ${input.keyMessage || 'Not provided'}
Social bio: ${input.socialBio || 'Not provided'}
Website headline: ${input.websiteHeadline || 'Not provided'}

Score 0-100. Check: Are these consistent? Is the differentiation clear? Is the tone appropriate? Is there a Clarity Gap? Would a new customer understand this brand in 5 seconds?`;

      const result = await runToolAI('message_check', 'Message Check', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'Brand Identity Guide', url: '/guides/brand-identity' };
      logger.info({ userId: ctx.user!.id, tool: 'message_check', score: result.score }, 'Message Check completed');
      return result;
    }),

  /** Tool 4: Presence Audit */
  presenceAudit: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      instagramHandle: z.string().max(255).optional(),
      website: z.string().max(500).optional(),
      otherChannels: z.string().max(500).optional(),
      inquiryFlow: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Audit digital presence for:
Company: ${input.companyName}
Instagram: ${input.instagramHandle || 'Not provided'}
Website: ${input.website || 'Not provided'}
Other channels: ${input.otherChannels || 'None'}
Inquiry flow: ${input.inquiryFlow || 'Not described'}

Score 0-100. Check: Cross-channel consistency, premium perception, CTA clarity, inquiry flow friction, content-proof-CTA alignment. Why is this brand "present but not chosen"?`;

      const result = await runToolAI('presence_audit', 'Presence Audit', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'service', title: 'Full Health Check', url: '/services#audit' };
      logger.info({ userId: ctx.user!.id, tool: 'presence_audit', score: result.score }, 'Presence Audit completed');
      return result;
    }),

  /** Tool 5: Identity Snapshot */
  identitySnapshot: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      brandDescription: z.string().max(1000),
      targetAudience: z.string().max(500).optional(),
      competitors: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Analyze brand identity match for:
Company: ${input.companyName}
Brand describes itself as: ${input.brandDescription}
Target audience: ${input.targetAudience || 'Not specified'}
Main competitors: ${input.competitors || 'Not specified'}

Score 0-100. Using Kapferer's Identity Prism, check: Does the brand personality match the audience? Is the visual quality matching the positioning? Is there a "Commodity Trap" — looking like everyone else? What archetype does this brand project vs. what it should project?`;

      const result = await runToolAI('identity_snapshot', 'Identity Snapshot', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      result.nextStep = { type: 'guide', title: 'What Is Brand Identity', url: '/guides/brand-identity' };
      logger.info({ userId: ctx.user!.id, tool: 'identity_snapshot', score: result.score }, 'Identity Snapshot completed');
      return result;
    }),

  /** Tool 6: Launch Readiness */
  launchReadiness: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      hasGuidelines: z.boolean().default(false),
      hasOfferStructure: z.boolean().default(false),
      hasContentPlan: z.boolean().default(false),
      hasWebsite: z.boolean().default(false),
      launchGoal: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Assess launch readiness for:
Company: ${input.companyName}
Has brand guidelines: ${input.hasGuidelines ? 'Yes' : 'No'}
Has structured offers: ${input.hasOfferStructure ? 'Yes' : 'No'}
Has content plan: ${input.hasContentPlan ? 'Yes' : 'No'}
Has website: ${input.hasWebsite ? 'Yes' : 'No'}
Launch goal: ${input.launchGoal || 'Not specified'}

Score 0-100 on launch readiness. Identify what's missing and what's the priority order. Be specific about what "ready to launch" means for THIS type of business.`;

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
        const safe = history.map((h: DiagnosisHistoryRow) => ({
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

        return checklists.map((cl: UserChecklistRow) => ({
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
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Get the checklist
      const [checklist] = await db.select()
        .from(userChecklists)
        .where(and(
          eq(userChecklists.id, input.checklistId),
          eq(userChecklists.userId, ctx.user!.id),
        ));

      if (!checklist) {
        throw new Error('Checklist not found');
      }

      const items = Array.isArray(checklist.items) ? [...checklist.items] as any[] : [];
      if (input.itemIndex < 0 || input.itemIndex >= items.length) {
        throw new Error('Item index out of range');
      }

      // Toggle completion
      const item = items[input.itemIndex];
      item.completed = !item.completed;
      item.completedAt = item.completed ? new Date().toISOString() : null;

      const completedCount = items.filter((i: any) => i.completed).length;

      await db.update(userChecklists)
        .set({
          items,
          completedCount,
        })
        .where(eq(userChecklists.id, input.checklistId));

      return { items, completedCount, totalCount: items.length };
    }),

  // ════════════════════════════════════════════
  // COMPETITIVE BENCHMARK
  // ════════════════════════════════════════════

  /** Compare brand against 1-3 competitors */
  competitiveBenchmark: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      competitors: z.array(z.string().min(1).max(255)).min(1).max(3),
      industry: z.string().min(1).max(100),
      socialLinks: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate: company != competitor
      const lowerCompany = input.companyName.toLowerCase().trim();
      for (const comp of input.competitors) {
        if (comp.toLowerCase().trim() === lowerCompany) {
          throw new Error('متقدرش تقارن الشركة بنفسها — دخل منافس مختلف.');
        }
      }

      // Deduct 40 credits
      const deduction = await deductCredits(ctx.user!.id, 'competitive_benchmark');
      if (!deduction.success) {
        throw new Error(deduction.error || 'مفيش كريدت كافي. محتاج ٤٠ كريدت.');
      }

      const allCompanies = [input.companyName, ...input.competitors];
      const benchmarkPrompt = `You are WZRD AI Competitive Benchmark Engine. Analyze and compare these ${allCompanies.length} brands in the "${input.industry}" industry:

${allCompanies.map((c, i) => `${i + 1}. ${c}`).join('\n')}
${input.socialLinks ? `\nSocial links: ${input.socialLinks}` : ''}

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
        let parsed: any;
        try {
          parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        } catch {
          // Fallback
          parsed = {
            companies: allCompanies.map((c, i) => ({
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

        // Clamp all scores
        if (parsed.companies) {
          parsed.companies = parsed.companies.map((c: any) => ({
            ...c,
            totalScore: Math.max(0, Math.min(100, c.totalScore || 50)),
            pillars: Object.fromEntries(
              Object.entries(c.pillars || {}).map(([k, v]) => [k, Math.max(0, Math.min(100, (v as number) || 50))])
            ),
          }));
        }

        // Save to history
        const yourCompany = parsed.companies?.[0];
        if (yourCompany) {
          saveDiagnosisHistory(ctx.user!.id, 'competitive_benchmark', {
            score: yourCompany.totalScore,
            label: scoreLabel(yourCompany.totalScore),
            findings: (parsed.gaps || []).slice(0, 5).map((g: any) => ({
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
      } catch (err: any) {
        logger.error({ err }, 'Competitive benchmark failed');
        throw new Error('حصل مشكلة في التحليل — حاول تاني.');
      }
    }),

  // ════════════════════════════════════════════
  // QUICK MODE — 5 questions instead of 12
  // ════════════════════════════════════════════

  /** Quick Brand Diagnosis — 5 questions, faster but less detailed */
  quickDiagnosis: protectedProcedure
    .input(z.object({
      companyName: z.string().min(1).max(255),
      industry: z.string().min(1).max(100),
      targetAudience: z.string().min(1).max(500),
      biggestChallenge: z.string().min(1).max(500),
      socialLink: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userPrompt = `Quick brand diagnosis for:
Company: ${input.companyName}
Industry: ${input.industry}
Target audience: ${input.targetAudience}
Biggest challenge: ${input.biggestChallenge}
Social link: ${input.socialLink || 'Not provided'}

This is a QUICK diagnosis — be concise but specific. Score 0-100 and give top 3 findings + 5 action items.
Respond in Egyptian Arabic.`;

      const result = await runToolAI('brand_diagnosis', 'Quick Brand Diagnosis', TOOL_SYSTEM, userPrompt, ctx.user!.id, ctx.user!.email);
      // Quick mode uses same credits as brand_diagnosis (20)
      result.nextStep = { type: 'tool', title: 'Full Diagnosis', url: '/tools/brand-diagnosis' };
      logger.info({ userId: ctx.user!.id, tool: 'quick_diagnosis', score: result.score }, 'Quick Diagnosis completed');
      return result;
    }),
});
