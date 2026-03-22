/**
 * KNOWLEDGE AMPLIFICATION SYSTEM
 * ================================
 * 
 * This is the brain behind the brain. It takes knowledge from 3 sources:
 * 
 * 1. STATIC FOUNDATION (7,882 lines) — Academic frameworks, case studies, market data
 *    → Hardcoded, expert-curated, the "textbook" of brand engineering
 * 
 * 2. DYNAMIC ENTRIES (knowledge_entries table) — Added manually or by AI
 *    → Lessons learned, client patterns, new case studies, market updates
 * 
 * 3. CONVERSATION MEMORY — Insights extracted from AI conversations
 *    → Patterns the AI notices across conversations with clients
 * 
 * The system does 3 things:
 * A) AMPLIFY — Takes a manual entry and enriches it with context, connections, and depth
 * B) RETRIEVE — Selects the most relevant knowledge for each AI conversation
 * C) LEARN — Extracts reusable knowledge from conversations and research
 */

import { logger } from './_core/logger';
import { knowledgeCache } from './_core/cache';
import { resilientLLM } from './_core/llmRouter';
import {
  createKnowledgeEntry, getKnowledgeEntries, getKnowledgeForContext,
  getKnowledgeEntryById, updateKnowledgeEntry,
} from './db';

// ============ KNOWLEDGE TEMPLATES ============
// These help the user add structured knowledge that the AI can actually use.

export interface KnowledgeTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  fields: Array<{
    key: string;
    label: string;
    labelAr: string;
    type: 'text' | 'textarea' | 'select' | 'tags' | 'number';
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }>;
  /** How to format this template's data into knowledge the AI can use */
  formatForAI: (data: Record<string, any>) => string;
}

export const KNOWLEDGE_TEMPLATES: KnowledgeTemplate[] = [
  // ──────── CASE STUDY TEMPLATE ────────
  {
    id: 'case_study',
    name: 'Case Study',
    nameAr: 'دراسة حالة',
    description: 'Document a brand success story — your own projects or industry examples.',
    descriptionAr: 'وثّق قصة نجاح علامة تجارية — مشاريعك أو أمثلة من السوق.',
    category: 'case_study',
    fields: [
      { key: 'brandName', label: 'Brand/Company Name', labelAr: 'اسم العلامة/الشركة', type: 'text', required: true },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text', required: true },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: ['egypt', 'ksa', 'uae', 'global', 'other'] },
      { key: 'situation', label: 'Situation (Before)', labelAr: 'الوضع (قبل)', type: 'textarea', required: true, placeholder: 'What was the brand\'s situation before the intervention?' },
      { key: 'challenge', label: 'Key Challenge', labelAr: 'التحدي الرئيسي', type: 'textarea', required: true },
      { key: 'strategy', label: 'Strategy Applied', labelAr: 'الاستراتيجية المطبّقة', type: 'textarea', required: true },
      { key: 'results', label: 'Results & Impact', labelAr: 'النتائج والتأثير', type: 'textarea', required: true, placeholder: 'Include numbers: revenue growth %, market share, customer metrics...' },
      { key: 'lessonsLearned', label: 'Lessons Learned', labelAr: 'الدروس المستفادة', type: 'textarea' },
      { key: 'frameworksUsed', label: 'Frameworks/Methods Used', labelAr: 'الأطر/الأساليب المستخدمة', type: 'tags', placeholder: 'e.g., Keller CBBE, Kapferer Prism, Sharp...' },
      { key: 'patternToRecognize', label: 'When to Apply This', labelAr: 'متى تطبّق هذا', type: 'textarea', placeholder: 'What signals should the AI look for to recommend this pattern?' },
    ],
    formatForAI: (data) => `
## CASE STUDY: ${data.brandName} (${data.industry}, ${data.market})

**SITUATION:** ${data.situation}

**CHALLENGE:** ${data.challenge}

**STRATEGY:** ${data.strategy}

**RESULTS:** ${data.results}

${data.lessonsLearned ? `**LESSONS:** ${data.lessonsLearned}` : ''}
${data.frameworksUsed ? `**FRAMEWORKS:** ${data.frameworksUsed}` : ''}
${data.patternToRecognize ? `**PATTERN TO RECOGNIZE:** ${data.patternToRecognize}` : ''}
`.trim(),
  },

  // ──────── MARKET INSIGHT TEMPLATE ────────
  {
    id: 'market_insight',
    name: 'Market Insight',
    nameAr: 'رؤية سوقية',
    description: 'Add real market data — pricing, trends, consumer behavior, competition.',
    descriptionAr: 'أضف بيانات سوقية حقيقية — أسعار، اتجاهات، سلوك المستهلك، منافسة.',
    category: 'market_insight',
    fields: [
      { key: 'title', label: 'Insight Title', labelAr: 'عنوان الرؤية', type: 'text', required: true },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: ['egypt', 'ksa', 'uae', 'mena', 'global'], required: true },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text' },
      { key: 'dataPoint', label: 'Key Data/Numbers', labelAr: 'البيانات/الأرقام الرئيسية', type: 'textarea', required: true, placeholder: 'Market size: $X billion, Growth rate: X%, etc.' },
      { key: 'source', label: 'Source', labelAr: 'المصدر', type: 'text', placeholder: 'Research report, government data, industry survey...' },
      { key: 'sourceDate', label: 'Data Date', labelAr: 'تاريخ البيانات', type: 'text', placeholder: 'e.g., Q3 2025' },
      { key: 'implication', label: 'What This Means for Branding', labelAr: 'ماذا يعني هذا للعلامات التجارية', type: 'textarea' },
      { key: 'tags', label: 'Tags', labelAr: 'علامات', type: 'tags' },
    ],
    formatForAI: (data) => `
## MARKET INSIGHT: ${data.title}
**Market:** ${data.market} | **Industry:** ${data.industry || 'General'}
**Source:** ${data.source || 'Internal research'} (${data.sourceDate || 'Recent'})

**DATA:** ${data.dataPoint}

${data.implication ? `**BRANDING IMPLICATION:** ${data.implication}` : ''}
`.trim(),
  },

  // ──────── COMPETITOR INTEL TEMPLATE ────────
  {
    id: 'competitor_intel',
    name: 'Competitor Intelligence',
    nameAr: 'معلومات المنافسين',
    description: 'Track competitor agencies, their pricing, strengths, and weaknesses.',
    descriptionAr: 'تتبع الوكالات المنافسة وأسعارها ونقاط قوتها وضعفها.',
    category: 'competitor_intel',
    fields: [
      { key: 'competitorName', label: 'Competitor Name', labelAr: 'اسم المنافس', type: 'text', required: true },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: ['egypt', 'ksa', 'uae', 'global'] },
      { key: 'pricingTier', label: 'Pricing Tier', labelAr: 'مستوى التسعير', type: 'select', options: ['budget', 'mid-range', 'premium', 'luxury'] },
      { key: 'pricingDetails', label: 'Known Pricing', labelAr: 'أسعار معروفة', type: 'textarea', placeholder: 'Logo: X EGP, Full identity: X EGP...' },
      { key: 'strengths', label: 'Strengths', labelAr: 'نقاط القوة', type: 'textarea' },
      { key: 'weaknesses', label: 'Weaknesses', labelAr: 'نقاط الضعف', type: 'textarea' },
      { key: 'differentiator', label: 'Their Key Differentiator', labelAr: 'ما يميّزهم', type: 'text' },
      { key: 'howWeWin', label: 'How Primo Marca Wins Against Them', labelAr: 'كيف نتفوّق عليهم', type: 'textarea' },
    ],
    formatForAI: (data) => `
## COMPETITOR: ${data.competitorName} (${data.market}, ${data.pricingTier})
**Strengths:** ${data.strengths || 'Unknown'}
**Weaknesses:** ${data.weaknesses || 'Unknown'}
**Pricing:** ${data.pricingDetails || 'Unknown'}
**Differentiator:** ${data.differentiator || 'Unknown'}
**HOW WE WIN:** ${data.howWeWin || 'Through framework-backed strategy and premium deliverables'}
`.trim(),
  },

  // ──────── LESSON LEARNED TEMPLATE ────────
  {
    id: 'lesson_learned',
    name: 'Lesson Learned',
    nameAr: 'درس مستفاد',
    description: 'Capture insights from projects — what worked, what didn\'t, and why.',
    descriptionAr: 'سجّل الرؤى من المشاريع — ما نجح وما لم ينجح ولماذا.',
    category: 'lesson_learned',
    fields: [
      { key: 'title', label: 'Lesson Title', labelAr: 'عنوان الدرس', type: 'text', required: true },
      { key: 'context', label: 'Context (What happened?)', labelAr: 'السياق (ماذا حدث؟)', type: 'textarea', required: true },
      { key: 'whatWorked', label: 'What Worked', labelAr: 'ما نجح', type: 'textarea' },
      { key: 'whatFailed', label: 'What Didn\'t Work', labelAr: 'ما لم ينجح', type: 'textarea' },
      { key: 'rootCause', label: 'Root Cause', labelAr: 'السبب الجذري', type: 'textarea' },
      { key: 'recommendation', label: 'Recommendation for Future', labelAr: 'التوصية للمستقبل', type: 'textarea', required: true },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text' },
      { key: 'tags', label: 'Tags', labelAr: 'علامات', type: 'tags' },
    ],
    formatForAI: (data) => `
## LESSON: ${data.title}
**Context:** ${data.context}
${data.whatWorked ? `**What Worked:** ${data.whatWorked}` : ''}
${data.whatFailed ? `**What Failed:** ${data.whatFailed}` : ''}
${data.rootCause ? `**Root Cause:** ${data.rootCause}` : ''}
**RECOMMENDATION:** ${data.recommendation}
`.trim(),
  },

  // ──────── CLIENT PATTERN TEMPLATE ────────
  {
    id: 'client_pattern',
    name: 'Client Pattern',
    nameAr: 'نمط عميل',
    description: 'Recognize repeating client situations — builds the AI\'s pattern recognition.',
    descriptionAr: 'تعرّف على المواقف المتكررة للعملاء — يبني قدرة الذكاء الاصطناعي على التعرف على الأنماط.',
    category: 'client_pattern',
    fields: [
      { key: 'patternName', label: 'Pattern Name', labelAr: 'اسم النمط', type: 'text', required: true, placeholder: 'e.g., "The Successful Founder with No Brand"' },
      { key: 'signals', label: 'How to Recognize This Pattern', labelAr: 'كيف تتعرّف على هذا النمط', type: 'textarea', required: true, placeholder: 'What does this client say? What does their brand look like?' },
      { key: 'typicalIndustry', label: 'Typical Industry', labelAr: 'الصناعة النموذجية', type: 'text' },
      { key: 'typicalBudget', label: 'Typical Budget Range', labelAr: 'نطاق الميزانية النموذجي', type: 'text' },
      { key: 'bestApproach', label: 'Best Approach', labelAr: 'أفضل نهج', type: 'textarea', required: true },
      { key: 'recommendedService', label: 'Recommended Service', labelAr: 'الخدمة الموصى بها', type: 'select', options: ['business_health_check', 'starting_business_logic', 'brand_identity', 'business_takeoff', 'consultation'] },
      { key: 'pitfalls', label: 'Common Pitfalls', labelAr: 'الأخطاء الشائعة', type: 'textarea' },
      { key: 'successMetric', label: 'How to Measure Success', labelAr: 'كيف تقيس النجاح', type: 'textarea' },
    ],
    formatForAI: (data) => `
## CLIENT PATTERN: "${data.patternName}"
**SIGNALS:** ${data.signals}
**Industry:** ${data.typicalIndustry || 'Various'} | **Budget:** ${data.typicalBudget || 'Varies'}
**BEST APPROACH:** ${data.bestApproach}
**Recommended Service:** ${data.recommendedService || 'Depends on assessment'}
${data.pitfalls ? `**PITFALLS TO AVOID:** ${data.pitfalls}` : ''}
${data.successMetric ? `**SUCCESS METRIC:** ${data.successMetric}` : ''}
`.trim(),
  },

  // ──────── METHODOLOGY TEMPLATE ────────
  {
    id: 'methodology',
    name: 'Methodology / Process',
    nameAr: 'منهجية / عملية',
    description: 'Document a proven process or methodology for brand engineering tasks.',
    descriptionAr: 'وثّق عملية أو منهجية مثبتة لمهام هندسة العلامات التجارية.',
    category: 'methodology',
    fields: [
      { key: 'title', label: 'Methodology Name', labelAr: 'اسم المنهجية', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose / When to Use', labelAr: 'الغرض / متى تستخدم', type: 'textarea', required: true },
      { key: 'steps', label: 'Step-by-Step Process', labelAr: 'العملية خطوة بخطوة', type: 'textarea', required: true },
      { key: 'tools', label: 'Tools/Resources Needed', labelAr: 'الأدوات/الموارد المطلوبة', type: 'textarea' },
      { key: 'timeEstimate', label: 'Time Estimate', labelAr: 'الوقت المتوقع', type: 'text' },
      { key: 'qualityChecklist', label: 'Quality Checklist', labelAr: 'قائمة التحقق من الجودة', type: 'textarea' },
      { key: 'tags', label: 'Tags', labelAr: 'علامات', type: 'tags' },
    ],
    formatForAI: (data) => `
## METHODOLOGY: ${data.title}
**PURPOSE:** ${data.purpose}
**PROCESS:** ${data.steps}
${data.tools ? `**TOOLS:** ${data.tools}` : ''}
${data.timeEstimate ? `**TIME:** ${data.timeEstimate}` : ''}
${data.qualityChecklist ? `**QUALITY CHECK:** ${data.qualityChecklist}` : ''}
`.trim(),
  },
];

// ============ KNOWLEDGE AMPLIFIER ============
// Takes a manual entry and enriches it using AI.

/**
 * Amplifies a knowledge entry — adds connections, frameworks, and depth.
 * 
 * Example: User adds "Sahra Café rebrand increased foot traffic 35%"
 * Amplifier adds: which framework applies, similar patterns, counter-arguments,
 * what made it work, and when to recommend this approach to future clients.
 */
export async function amplifyKnowledgeEntry(
  entry: { title: string; content: string; category: string; industry?: string; market?: string }
): Promise<{
  enrichedContent: string;
  suggestedTags: string[];
  connectedFrameworks: string[];
  aiInsight: string;
}> {
  const prompt = `You are the AI Brain of Primo Marca, a premium brand engineering agency.

A consultant just added this knowledge entry:

CATEGORY: ${entry.category}
TITLE: ${entry.title}
CONTENT: ${entry.content}
${entry.industry ? `INDUSTRY: ${entry.industry}` : ''}
${entry.market ? `MARKET: ${entry.market}` : ''}

Your job is to AMPLIFY this knowledge. Make it 10x more useful for future brand consulting conversations.

Respond in JSON:
{
  "enrichedContent": "The original content PLUS: deeper analysis, specific frameworks that apply, connections to other brand principles, and actionable implications. Write as if this will be read by a senior brand strategist. Keep the original data but add 3-5 paragraphs of expert context.",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "connectedFrameworks": ["Framework1 — how it connects", "Framework2 — how it connects"],
  "aiInsight": "One powerful insight that's not obvious from the original entry — the kind of insight a 20-year veteran consultant would add."
}`;

  try {
    const response = await resilientLLM({
      messages: [
        { role: 'system', content: 'You are a brand strategy knowledge architect. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt },
      ],
    }, { context: 'knowledge' });

    const parsed = JSON.parse(response.choices[0].message.content as string);
    logger.info({ title: entry.title }, 'Knowledge entry amplified');
    return parsed;
  } catch (err) {
    logger.error({ err, title: entry.title }, 'Knowledge amplification failed');
    return {
      enrichedContent: entry.content,
      suggestedTags: [],
      connectedFrameworks: [],
      aiInsight: '',
    };
  }
}

/**
 * Extracts reusable knowledge from an AI conversation.
 * Called after notable conversations to build the knowledge base automatically.
 */
export async function extractKnowledgeFromConversation(
  messages: Array<{ role: string; content: string }>,
  context: { clientName?: string; industry?: string; market?: string; serviceType?: string }
): Promise<Array<{ title: string; content: string; category: string; tags: string[] }>> {
  // Only process conversations with 4+ messages (meaningful exchanges)
  if (messages.length < 4) return [];

  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')
    .substring(0, 8000); // Limit context

  const prompt = `Analyze this brand consulting conversation and extract reusable knowledge entries.

CONVERSATION:
${conversationText}

CLIENT CONTEXT:
- Industry: ${context.industry || 'Unknown'}
- Market: ${context.market || 'Unknown'}
- Service: ${context.serviceType || 'Unknown'}

Extract 0-3 knowledge entries that would be valuable for FUTURE client conversations.
Only extract if there's a genuine insight — don't force entries from trivial conversations.

Each entry should be:
- A lesson learned, client pattern, market insight, or methodology that applies beyond this specific client
- Specific enough to be actionable
- General enough to be reusable

Respond in JSON:
{
  "entries": [
    {
      "title": "Short descriptive title",
      "content": "Detailed knowledge content (2-4 paragraphs)",
      "category": "lesson_learned|client_pattern|market_insight|methodology",
      "tags": ["tag1", "tag2"]
    }
  ]
}

If nothing worth extracting, return: {"entries": []}`;

  try {
    const response = await resilientLLM({
      messages: [
        { role: 'system', content: 'You are a knowledge extraction system. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt },
      ],
    }, { context: 'knowledge' });

    const parsed = JSON.parse(response.choices[0].message.content as string);
    const entries = parsed.entries || [];
    
    if (entries.length > 0) {
      logger.info({ count: entries.length, industry: context.industry }, 'Knowledge extracted from conversation');
    }
    
    return entries;
  } catch (err) {
    logger.error({ err }, 'Knowledge extraction failed');
    return [];
  }
}

// ============ KNOWLEDGE QUALITY SCORING ============

/**
 * Scores a knowledge entry's quality and usefulness.
 * Factors: completeness, specificity, actionability, data presence, source quality.
 */
export function scoreKnowledgeQuality(entry: { title: string; content: string; category: string; tags?: string[] | null }): {
  score: number;
  breakdown: Record<string, number>;
  suggestions: string[];
} {
  const content = entry.content || '';
  const suggestions: string[] = [];
  const breakdown: Record<string, number> = {};

  // 1. Length/Completeness (0-25)
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 50) { breakdown.completeness = 5; suggestions.push('Add more detail — aim for at least 100 words'); }
  else if (wordCount < 100) { breakdown.completeness = 15; suggestions.push('Good start, but more context would help'); }
  else if (wordCount < 300) { breakdown.completeness = 20; }
  else { breakdown.completeness = 25; }

  // 2. Specificity — has numbers, data, examples (0-25)
  const hasNumbers = /\d+%|\$[\d,]+|[\d,]+\s*(EGP|SAR|USD|billion|million|thousand)/i.test(content);
  const hasSpecificNames = /[A-Z][a-z]+\s(Agency|Brand|Company|Corp|Inc|Ltd)/.test(content);
  const hasExamples = /for example|for instance|such as|case:|e\.g\./i.test(content);
  breakdown.specificity = (hasNumbers ? 10 : 0) + (hasSpecificNames ? 8 : 0) + (hasExamples ? 7 : 0);
  if (!hasNumbers) suggestions.push('Add specific numbers and data points');
  if (!hasExamples) suggestions.push('Add concrete examples');

  // 3. Actionability (0-20)
  const hasRecommendation = /recommend|should|must|always|never|best practice|key takeaway|lesson/i.test(content);
  const hasWhenToUse = /when.*client|when.*brand|if.*then|recognize.*pattern|signal/i.test(content);
  breakdown.actionability = (hasRecommendation ? 10 : 0) + (hasWhenToUse ? 10 : 0);
  if (!hasRecommendation) suggestions.push('Add a clear recommendation or takeaway');
  if (!hasWhenToUse) suggestions.push('Add "when to use this" guidance');

  // 4. Framework Connection (0-15)
  const frameworks = ['Keller', 'Kapferer', 'Sharp', 'Kahneman', 'Porter', 'Cialdini', 'Aaker', 'CBBE', 'Prism', 'SWOT'];
  const connectedFrameworks = frameworks.filter(f => content.includes(f));
  breakdown.frameworks = Math.min(15, connectedFrameworks.length * 5);
  if (connectedFrameworks.length === 0) suggestions.push('Connect to academic frameworks (Keller, Kapferer, etc.)');

  // 5. Tags & Categorization (0-15)
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  breakdown.organization = Math.min(15, tags.length * 3 + (entry.category !== 'general' ? 5 : 0));
  if (tags.length < 3) suggestions.push('Add at least 3 tags for better retrieval');

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown, suggestions };
}

// ============ KNOWLEDGE RETRIEVAL ============

/**
 * Gets the most relevant knowledge for a specific conversation context.
 * Combines static foundation + dynamic entries + smart scoring.
 */
export async function getRelevantKnowledge(context: {
  mode: string;
  serviceType?: string;
  industry?: string;
  market?: string;
  clientContext?: string;
  tokenBudget?: number;
}): Promise<string> {
  const budget = context.tokenBudget || 3000;
  const cacheKey = `knowledge:${context.mode}:${context.serviceType}:${context.industry}:${context.market}`;

  // Check cache first
  const cached = knowledgeCache.get(cacheKey);
  if (cached) return cached;

  // Get dynamic knowledge from database
  const dynamicKnowledge = await getKnowledgeForContext(context.industry, context.market);

  // Get entries by relevant categories based on mode
  const categoryPriority: Record<string, string[]> = {
    chat: ['client_pattern', 'lesson_learned', 'case_study', 'market_insight'],
    discovery: ['client_pattern', 'methodology', 'market_insight'],
    diagnosis: ['case_study', 'market_insight', 'competitor_intel', 'client_pattern'],
    deliverable: ['template', 'methodology', 'case_study'],
    proposal: ['competitor_intel', 'market_insight', 'case_study', 'client_pattern'],
  };

  const priorityCategories = categoryPriority[context.mode] || categoryPriority.chat;

  // Fetch dynamic entries by priority categories
  let allDynamic = '';
  for (const category of priorityCategories) {
    const entries = await getKnowledgeEntries({
      category,
      industry: context.industry,
      market: context.market,
    });
    if (entries.length > 0) {
      allDynamic += `\n## ${category.toUpperCase().replace('_', ' ')}\n`;
      for (const entry of entries.slice(0, 5)) {
        allDynamic += `### ${entry.title}\n${entry.content}\n\n`;
      }
    }
  }

  const result = dynamicKnowledge + allDynamic;

  // Trim to token budget (rough: 4 chars per token)
  const maxChars = budget * 4;
  const trimmed = result.length > maxChars ? result.substring(0, maxChars) + '\n\n[Knowledge truncated — more available]' : result;

  // Cache for 30 minutes
  knowledgeCache.set(cacheKey, trimmed);

  return trimmed;
}

// ============ KNOWLEDGE STATS ============

/**
 * Returns comprehensive knowledge base statistics.
 */
export async function getKnowledgeAnalytics(): Promise<{
  totalEntries: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  avgQualityScore: number;
  topTags: Array<{ tag: string; count: number }>;
  recentEntries: number;
  staticKnowledgeSize: number;
}> {
  const entries = await getKnowledgeEntries();

  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  let totalQuality = 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  let recentEntries = 0;

  for (const entry of entries) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    bySource[entry.source] = (bySource[entry.source] || 0) + 1;

    const quality = scoreKnowledgeQuality({ ...entry, tags: Array.isArray(entry.tags) ? entry.tags as string[] : undefined });
    totalQuality += quality.score;

    if (Array.isArray(entry.tags)) {
      for (const tag of entry.tags as string[]) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    if (new Date(entry.createdAt) > thirtyDaysAgo) recentEntries++;
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalEntries: entries.length,
    byCategory,
    bySource,
    avgQualityScore: entries.length > 0 ? Math.round(totalQuality / entries.length) : 0,
    topTags,
    recentEntries,
    staticKnowledgeSize: 7882, // Lines in static knowledge modules
  };
}

// ============ EXPORTS ============

export { KNOWLEDGE_TEMPLATES as templates };
