/**
 * MULTI-AGENT ORCHESTRATOR
 * ========================
 * 
 * Instead of ONE AI doing everything, we have 5 SPECIALIZED agents:
 * 
 * 1. Dr. Diagnose  — Discovery, diagnosis, client assessment
 * 2. The Strategist — Positioning, frameworks, strategy
 * 3. The Executor   — Deliverables, templates, quality
 * 4. The Researcher — Web search, market data, competitors
 * 5. The PM         — Project coordination, recommendations
 * 
 * The Orchestrator analyzes each message and routes it to the RIGHT agent.
 * Each agent has a specialized system prompt with ONLY the knowledge it needs.
 * 
 * WHY THIS IS BETTER:
 * - Each agent is an expert at ONE thing (vs one agent mediocre at everything)
 * - Smaller, focused system prompts = better LLM output
 * - The Researcher can be called by OTHER agents (not just the user)
 * - Conversation history tracks WHICH agent responded
 */

import { logger } from './_core/logger';
import { resilientLLM } from './_core/llmRouter';
import { getActivePrompt } from './promptLab';
import {
  DIAGNOSTIC_ENGINE, DISCOVERY_QUESTIONS_BANK,
  CONVERSATION_LOGIC, QUALITY_STANDARDS, DELIVERABLE_TEMPLATES,
  CONSULTANT_BOX_MODEL, ACADEMIC_FOUNDATION,
  buildSystemPrompt,
  matchCaseStudies, formatCaseStudiesForPrompt,
} from './knowledgeBase';
import { matchFrameworks, formatFrameworksForPrompt } from './academicFrameworks';
import { getRelevantMarketIntelligence } from './marketIntelligence';
import { getRelevantKnowledge } from './knowledgeAmplifier';
import { getSemanticKnowledge } from './vectorSearch';
import { liveResearch } from './liveIntelligence';
import { getIndustryPack, formatIndustryPackForAI } from './industryPacks';
import { formatMENACaseStudiesForAI } from './menaCaseStudies';

// ════════════════════════════════════════════
// AGENT TYPES
// ════════════════════════════════════════════

export type AgentId = 'diagnostician' | 'strategist' | 'executor' | 'researcher' | 'pm';

export interface AgentResponse {
  agent: AgentId;
  agentLabel: string;
  agentLabelAr: string;
  message: string;
  /** If the agent triggered research, include sources */
  sources?: string[];
  /** If the agent recommends handing off to another agent */
  handoff?: { toAgent: AgentId; reason: string };
}

interface AgentContext {
  clientContext?: string;
  industry?: string;
  market?: string;
  serviceType?: string;
  projectStage?: string;
  conversationHistory: Array<{ role: string; content: string; agent?: string }>;
}

const AGENT_LABELS: Record<AgentId, { en: string; ar: string }> = {
  diagnostician: { en: 'Dr. Diagnose', ar: 'د. التشخيص' },
  strategist: { en: 'The Strategist', ar: 'الاستراتيجي' },
  executor: { en: 'The Executor', ar: 'المُنفّذ' },
  researcher: { en: 'The Researcher', ar: 'الباحث' },
  pm: { en: 'Project Manager', ar: 'مدير المشاريع' },
};

// ════════════════════════════════════════════
// AGENT ROUTING — Analyze message → pick agent
// ════════════════════════════════════════════

/** Signal patterns for each agent */
const ROUTING_SIGNALS: Record<AgentId, { keywords: string[]; patterns: RegExp[] }> = {
  diagnostician: {
    keywords: [
      'problem', 'challenge', 'issue', 'struggling', 'assess', 'diagnose', 'audit',
      'health check', 'evaluate', 'what do you think', 'مشكلة', 'تحدي', 'تقييم', 'تشخيص',
      'فحص', 'مبيعات واقفة', 'مش عارف', 'ايه المشكلة', 'ايه الغلط',
    ],
    patterns: [
      /what('s| is)? (wrong|the problem|the issue|happening)/i,
      /i('m| am) (struggling|losing|not sure)/i,
      /help me (understand|figure out|assess)/i,
      /ايه (المشكلة|الغلط|اللي حاصل)/,
      /مش (عارف|فاهم|شايف)/,
    ],
  },
  strategist: {
    keywords: [
      'strategy', 'positioning', 'position', 'differentiate', 'brand identity',
      'messaging', 'value proposition', 'competitive advantage', 'target audience',
      'framework', 'keller', 'kapferer', 'sharp', 'استراتيجية', 'تموضع', 'هوية',
      'رسالة', 'ميزة تنافسية', 'جمهور مستهدف',
    ],
    patterns: [
      /how (should|can|do) (i|we) (position|differentiate|brand)/i,
      /what('s| is) (our|my|the) (positioning|strategy|brand)/i,
      /build (a |the )?(brand|identity|strategy)/i,
      /ازاي (نتموضع|نتميز|نبني)/,
      /عايز (استراتيجية|خطة|تموضع)/,
    ],
  },
  executor: {
    keywords: [
      'deliverable', 'generate', 'create', 'write', 'produce', 'draft', 'document',
      'report', 'proposal', 'template', 'guidelines', 'content', 'copy',
      'اكتب', 'انتج', 'اعمل', 'وثيقة', 'تقرير', 'مقترح', 'محتوى', 'تسليم',
    ],
    patterns: [
      /(create|generate|write|draft|produce) (a |the )?(report|proposal|document|deliverable|content|audit|brand)/i,
      /can you (make|create|write|prepare)/i,
      /(اكتب|حضر|اعمل|جهز) (لي |)(تقرير|مقترح|وثيقة|محتوى)/,
    ],
  },
  researcher: {
    keywords: [
      'research', 'search', 'find', 'data', 'market size', 'competitor', 'trend',
      'statistics', 'benchmark', 'industry', 'ابحث', 'بيانات', 'منافس', 'سوق', 'حجم السوق',
      'احصائيات', 'ترند',
    ],
    patterns: [
      /(research|search|find|look up|what('s| is) the) (market|data|competitor|trend|size|price)/i,
      /how (big|large) is the (market|industry)/i,
      /who are (the|my|our) competitors/i,
      /ابحث (عن|لي)/,
      /(مين|ايه) المنافسين/,
      /حجم (السوق|الصناعة)/,
    ],
  },
  pm: {
    keywords: [
      'project', 'timeline', 'deadline', 'status', 'progress', 'next step', 'plan',
      'schedule', 'milestone', 'stage', 'مشروع', 'خطة', 'مرحلة', 'الخطوة الجاية',
      'فين احنا', 'ايه اللي اتعمل', 'recommend', 'service', 'which service', 'pricing',
    ],
    patterns: [
      /what('s| is) (the )?(status|progress|next step|timeline|plan)/i,
      /which (service|package) (should|do|would)/i,
      /how (long|much) (will|does|would)/i,
      /(فين|ايه) (احنا|الخطوة|المرحلة)/,
      /ايه (الخدمة|الباقة) المناسبة/,
      /هياخد (وقت|كام)/,
    ],
  },
};

/**
 * Analyzes a message and determines which agent should handle it.
 * Uses keyword matching + pattern detection + conversation context.
 */
export function routeToAgent(
  message: string,
  context: AgentContext
): AgentId {
  const msgLower = message.toLowerCase();
  const scores: Record<AgentId, number> = {
    diagnostician: 0, strategist: 0, executor: 0, researcher: 0, pm: 0,
  };

  // Score by keywords
  for (const [agent, signals] of Object.entries(ROUTING_SIGNALS) as Array<[AgentId, typeof ROUTING_SIGNALS[AgentId]]>) {
    for (const keyword of signals.keywords) {
      if (msgLower.includes(keyword.toLowerCase())) {
        scores[agent] += 10;
      }
    }
    for (const pattern of signals.patterns) {
      if (pattern.test(message)) {
        scores[agent] += 20;
      }
    }
  }

  // Context-based boosting
  if (context.projectStage === 'diagnose') scores.diagnostician += 15;
  if (context.projectStage === 'design') scores.strategist += 15;
  if (context.projectStage === 'deploy') scores.executor += 15;
  if (context.projectStage === 'optimize') scores.researcher += 10;

  // If conversation just started (< 4 messages), favor diagnostician
  if (context.conversationHistory.length < 4) scores.diagnostician += 10;

  // If last agent was diagnostician and diagnosis seems complete, boost strategist
  const lastAgent = context.conversationHistory
    .filter(m => m.agent).pop()?.agent;
  if (lastAgent === 'diagnostician' && context.conversationHistory.length > 6) {
    scores.strategist += 15;
  }

  // Find highest score
  const bestAgent = (Object.entries(scores) as Array<[AgentId, number]>)
    .sort((a, b) => b[1] - a[1])[0];

  // If no strong signal (all scores < 10), default based on context
  if (bestAgent[1] < 10) {
    if (context.conversationHistory.length < 4) return 'diagnostician';
    return 'pm'; // PM is the general coordinator
  }

  return bestAgent[0];
}

// ════════════════════════════════════════════
// AGENT SYSTEM PROMPTS — Each agent's brain
// ════════════════════════════════════════════

function buildAgentPrompt(agent: AgentId, context: AgentContext): string {
  const baseIdentity = `You are part of the Wzrd AI team at WZZRD AI — a premium brand engineering studio founded by Ramy Mortada.\n\n`;

  switch (agent) {
    // ──── DR. DIAGNOSE ────
    case 'diagnostician':
      return baseIdentity + `## YOUR ROLE: Dr. Diagnose — The Diagnostician

You are the first point of contact. Your job is to UNDERSTAND before you advise.

**Your approach:**
- Ask ONE focused question at a time
- Listen for what they DON'T say as much as what they DO say
- Identify diagnostic patterns: Clarity Gap, Commodity Trap, Random Effort, Identity Crisis
- Never prescribe before you diagnose
- Reflect back what you hear: "So if I understand correctly..."

**When you have enough information (usually 4-6 questions), deliver:**
1. A clear diagnosis with the pattern name
2. The root cause (not the symptom)
3. Your recommended service + WHY this service solves their specific problem

${DIAGNOSTIC_ENGINE}

${DISCOVERY_QUESTIONS_BANK}

${CONVERSATION_LOGIC}

${context.clientContext ? `\n## CLIENT CONTEXT\n${context.clientContext}` : ''}
`;

    // ──── THE STRATEGIST ────
    case 'strategist': {
      // Select only the 2-3 most relevant frameworks (saves ~12K tokens)
      const clientSituation = [context.clientContext, context.industry, context.market].filter(Boolean).join(' ');
      const relevantFrameworks = matchFrameworks({
        clientSituation: clientSituation || undefined,
        serviceType: context.serviceType,
        limit: 3,
      });
      const frameworkText = relevantFrameworks.length > 0
        ? formatFrameworksForPrompt(relevantFrameworks)
        : ACADEMIC_FOUNDATION; // Fallback to summary only

      const marketData = getRelevantMarketIntelligence({ market: context.market, industry: context.industry });

      return baseIdentity + `## YOUR ROLE: The Strategist — Brand Strategy Architect

You build strategies backed by academic frameworks and real data.

**Your approach:**
- Always cite which framework you're applying (Keller CBBE, Kapferer Prism, Sharp, etc.)
- Use specific numbers and benchmarks, never vague claims
- Build positioning that's defensible and differentiated
- Connect every recommendation to the client's specific situation

**Your outputs:**
- Brand Positioning Statement (target, frame of reference, POD, RTB)
- Messaging Framework (brand narrative, value prop, key messages per audience)
- Strategic Recommendations with timeline and priorities

${frameworkText}

${CONSULTANT_BOX_MODEL}

${marketData}

${context.clientContext ? `\n## CLIENT CONTEXT\n${context.clientContext}` : ''}
`;
    }

    // ──── THE EXECUTOR ────
    case 'executor': {
      // Select top 3 relevant case studies (saves ~8K tokens)
      const matchedCases = matchCaseStudies({
        clientSituation: context.clientContext || '',
        tags: context.serviceType ? [context.serviceType] : undefined,
        limit: 3,
      });
      const caseText = matchedCases.length > 0
        ? formatCaseStudiesForPrompt(matchedCases)
        : '(No matching case studies — rely on frameworks and quality standards)';

      return baseIdentity + `## YOUR ROLE: The Executor — Deliverable Producer

You produce client-ready deliverables at consulting quality.

**Your standards:**
- Every deliverable must be SPECIFIC to this client — zero generic content
- Every deliverable must be ACTIONABLE — the client can execute based on this
- Every deliverable must reference data and frameworks, not just opinions
- Every deliverable must follow WZZRD AI's tone: confident, professional, honest, educational

**Quality gates:**
- Does it mention specific numbers/data?
- Does it reference academic frameworks?
- Is it structured with clear sections?
- Would Ramy be proud to sign this?

${QUALITY_STANDARDS}

${DELIVERABLE_TEMPLATES}

## RELEVANT CASE STUDIES
${caseText}

${context.clientContext ? `\n## CLIENT CONTEXT\n${context.clientContext}` : ''}
`;
    }

    // ──── THE RESEARCHER ────
    case 'researcher': {
      // Only include market intel relevant to the query (saves ~5K tokens)
      const marketIntel = getRelevantMarketIntelligence({ market: context.market, industry: context.industry });

      return baseIdentity + `## YOUR ROLE: The Researcher — Market Intelligence Specialist

You find, analyze, and structure real-world data.

**Your approach:**
- Always specify your sources and dates
- Distinguish between confirmed data and estimates
- Structure findings clearly: market size, key players, trends, opportunities, challenges
- Focus on data relevant to branding and brand strategy
- Specialize in MENA markets (Egypt, KSA, UAE)

**When asked to research:**
1. Clarify what exactly needs to be researched
2. Search using available tools
3. Synthesize into actionable insights
4. Store findings as knowledge entries for future use

${marketIntel}

${context.clientContext ? `\n## CLIENT CONTEXT\n${context.clientContext}` : ''}
`;
    }

    // ──── THE PM ────
    case 'pm':
      return baseIdentity + `## YOUR ROLE: Project Manager — Coordinator & Advisor

You coordinate between agents, manage expectations, and keep things on track.

**Your responsibilities:**
- Recommend the right service based on the situation
- Explain pricing, timelines, and what's included
- Provide project status updates
- Handle general questions and small talk professionally
- Route complex requests to the right specialist

**Pricing (EGP):**
- Business Health Check: 140,000
- Starting Business Logic: 160,000
- Brand Identity: 210,000
- Business Takeoff: 320,000
- Consultation: 70,000

**4D Framework stages:** Diagnose → Design → Deploy → Optimize

${CONSULTANT_BOX_MODEL}

${CONVERSATION_LOGIC}

${context.clientContext ? `\n## CLIENT CONTEXT\n${context.clientContext}` : ''}
`;

    default:
      return buildSystemPrompt({ mode: 'chat', serviceType: context.serviceType, clientContext: context.clientContext });
  }
}

// ════════════════════════════════════════════
// ORCHESTRATOR — The main entry point
// ════════════════════════════════════════════

/**
 * Main orchestrator function. Routes to the right agent and gets a response.
 */
export async function orchestrate(
  message: string,
  context: AgentContext
): Promise<AgentResponse> {
  // 1. Route to the right agent
  const agentId = routeToAgent(message, context);
  const labels = AGENT_LABELS[agentId];

  logger.info({ agent: agentId, messageLength: message.length }, 'Agent routed');

  // 2. Build agent-specific system prompt (Prompt Lab → hardcoded fallback)
  const labPrompt = getActivePrompt(`${agentId}_system`, context.conversationHistory.length);
  let systemPrompt = labPrompt?.content || buildAgentPrompt(agentId, context);

  // 3. Add dynamic knowledge — keyword-based + semantic search
  const dynamicKnowledge = await getRelevantKnowledge({
    mode: agentId === 'diagnostician' ? 'discovery' :
          agentId === 'strategist' ? 'diagnosis' :
          agentId === 'executor' ? 'deliverable' :
          agentId === 'researcher' ? 'diagnosis' : 'chat',
    serviceType: context.serviceType,
    industry: context.industry,
    market: context.market,
    clientContext: context.clientContext,
    tokenBudget: 1500,
  });

  // 3a. Semantic search — finds knowledge by meaning, not keywords
  const semanticKnowledge = await getSemanticKnowledge(message, {
    industry: context.industry,
    market: context.market,
    tokenBudget: 1500,
  });

  const combinedKnowledge = [dynamicKnowledge, semanticKnowledge].filter(Boolean).join('\n\n---\n\n');
  if (combinedKnowledge) {
    systemPrompt += '\n\n## YOUR KNOWLEDGE BASE\n' + combinedKnowledge;
  }

  // 3b. Inject industry-specific knowledge pack
  if (context.industry) {
    const pack = getIndustryPack(context.industry);
    if (pack) {
      systemPrompt += '\n\n' + formatIndustryPackForAI(pack, context.market);
    }
  }

  // 3c. Inject MENA case studies relevant to this conversation
  const menaCases = formatMENACaseStudiesForAI(context.industry, context.market, 3);
  if (menaCases) {
    systemPrompt += '\n\n## MENA CASE STUDIES (use these examples instead of global brands)\n' + menaCases;
  }

  // 4. Special: If researcher, also do live search
  let sources: string[] | undefined;
  if (agentId === 'researcher') {
    try {
      const research = await liveResearch(message, {
        industry: context.industry,
        market: context.market,
      });
      if (research.answer && research.answer.length > 100) {
        systemPrompt += '\n\n## LIVE RESEARCH RESULTS\n' + research.answer;
        sources = research.sources;
      }
    } catch (err) {
      logger.debug({ err }, 'Live research skipped for researcher agent');
    }
  }

  // 5. Build conversation messages with agent labels
  const messages = context.conversationHistory.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: message });

  // 6. Call LLM via resilient layer (cache + circuit breaker + fallback built-in)
  const agentContext = agentId === 'researcher' ? 'research' :
                       agentId === 'diagnostician' ? 'diagnosis' :
                       agentId === 'executor' ? 'chat' : 'chat';
  const response = await resilientLLM({
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  }, { context: agentContext, timeout: 60000 });

  const assistantMessage = response.choices[0].message.content as string;

  // 7. Detect handoff signals
  let handoff: AgentResponse['handoff'] | undefined;
  const handoffPatterns: Record<string, AgentId> = {
    'let me hand this to the strategist': 'strategist',
    'the executor can handle': 'executor',
    'let me get the researcher': 'researcher',
    'خليني أحوّل للاستراتيجي': 'strategist',
    'خليني أحوّل للباحث': 'researcher',
  };
  for (const [pattern, targetAgent] of Object.entries(handoffPatterns)) {
    if (assistantMessage.toLowerCase().includes(pattern)) {
      handoff = { toAgent: targetAgent, reason: pattern };
      break;
    }
  }

  logger.info({
    agent: agentId,
    responseLength: assistantMessage.length,
    hasHandoff: !!handoff,
    hasSources: !!sources?.length,
  }, 'Agent response generated');

  return {
    agent: agentId,
    agentLabel: labels.en,
    agentLabelAr: labels.ar,
    message: assistantMessage,
    sources,
    handoff,
  };
}

/**
 * Get agent info for the frontend to display.
 */
export function getAgentInfo(agentId: AgentId) {
  return {
    id: agentId,
    ...AGENT_LABELS[agentId],
    description: {
      diagnostician: 'Asks the right questions to find the root cause',
      strategist: 'Builds data-backed brand strategies',
      executor: 'Produces client-ready deliverables',
      researcher: 'Finds real market data and competitor intelligence',
      pm: 'Coordinates the team and manages the project',
    }[agentId],
  };
}

export { AGENT_LABELS };
