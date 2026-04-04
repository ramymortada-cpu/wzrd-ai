/**
 * PRIMO PROJECT DOCUMENTATION TEMPLATES
 * ======================================
 * 
 * Structured templates for Ramy to document his past projects
 * and convert 10+ years of experience into AI knowledge.
 * 
 * Each template has:
 * - Guided fields (what to fill in)
 * - AI amplification (auto-enriches after submission)
 * - Pattern extraction (identifies reusable patterns)
 * - Framework mapping (connects to academic frameworks)
 * 
 * HOW RAMY USES THIS:
 * 1. Go to Knowledge Base → "Add from Experience"
 * 2. Pick a template (Project, Pricing Lesson, Client Pattern, etc.)
 * 3. Fill in the fields (10-15 minutes per entry)
 * 4. AI amplifies it + extracts patterns
 * 5. Future AI conversations use this knowledge
 */

import { logger } from './_core/logger';
import { resilientLLM } from './_core/llmRouter';
import { createKnowledgeEntry } from './db';
import { amplifyKnowledgeEntry } from './knowledgeAmplifier';

// ════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ════════════════════════════════════════════

export interface PrimoTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string; // Lucide icon name
  fields: TemplateField[];
  category: string;
  /** AI prompt to extract patterns from this entry */
  patternExtractionPrompt: string;
}

interface TemplateField {
  key: string;
  label: string;
  labelAr: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'tags';
  placeholder?: string;
  placeholderAr?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string; labelAr: string }>;
  helpText?: string;
  helpTextAr?: string;
}

export const PRIMO_TEMPLATES: PrimoTemplate[] = [
  // ──── PAST PROJECT ────
  {
    id: 'past_project',
    name: 'Past Project Documentation',
    nameAr: 'توثيق مشروع سابق',
    description: 'Document a completed project — the most valuable knowledge source for the AI.',
    descriptionAr: 'وثّق مشروع مكتمل — أهم مصدر معرفة للذكاء الاصطناعي.',
    icon: 'FolderKanban',
    category: 'case_study',
    fields: [
      { key: 'clientName', label: 'Client/Company Name', labelAr: 'اسم العميل/الشركة', type: 'text', required: true },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text', required: true, placeholder: 'e.g., F&B, Healthcare, Tech' },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', required: true, options: [
        { value: 'egypt', label: 'Egypt', labelAr: 'مصر' },
        { value: 'ksa', label: 'Saudi Arabia', labelAr: 'السعودية' },
        { value: 'uae', label: 'UAE', labelAr: 'الإمارات' },
        { value: 'other', label: 'Other', labelAr: 'أخرى' },
      ]},
      { key: 'serviceType', label: 'Service Provided', labelAr: 'الخدمة المقدّمة', type: 'select', options: [
        { value: 'business_health_check', label: 'Business Health Check', labelAr: 'فحص صحة الأعمال' },
        { value: 'starting_business_logic', label: 'Starting Business Logic', labelAr: 'منطق بدء الأعمال' },
        { value: 'brand_identity', label: 'Brand Identity', labelAr: 'هوية العلامة التجارية' },
        { value: 'business_takeoff', label: 'Business Takeoff', labelAr: 'انطلاقة الأعمال' },
        { value: 'consultation', label: 'Consultation', labelAr: 'استشارة' },
      ]},
      { key: 'situationBefore', label: 'Situation Before (What was the problem?)', labelAr: 'الوضع قبل (ايه المشكلة كانت؟)', type: 'textarea', required: true, placeholder: 'Describe the client\'s situation when they came to you. What were their symptoms? What did they think the problem was?', helpText: 'Be specific — mention revenue, customer count, market position if you remember.' },
      { key: 'realDiagnosis', label: 'Your Diagnosis (What was the REAL problem?)', labelAr: 'تشخيصك (ايه المشكلة الحقيقية؟)', type: 'textarea', required: true, placeholder: 'What did you discover was the root cause? Was it different from what the client thought?', helpText: 'This is gold for the AI — it learns to diagnose like you.' },
      { key: 'diagnosticPattern', label: 'Diagnostic Pattern', labelAr: 'نمط التشخيص', type: 'select', options: [
        { value: 'clarity_gap', label: 'Clarity Gap — Brand unclear', labelAr: 'فجوة الوضوح — العلامة غير واضحة' },
        { value: 'commodity_trap', label: 'Commodity Trap — Competing on price', labelAr: 'فخ السلعة — منافسة بالسعر' },
        { value: 'random_effort', label: 'Random Effort — No systematic approach', labelAr: 'مجهود عشوائي — بدون نظام' },
        { value: 'identity_crisis', label: 'Identity Crisis — Don\'t know who they are', labelAr: 'أزمة هوية — مش عارفين مين هم' },
        { value: 'other', label: 'Other', labelAr: 'أخرى' },
      ]},
      { key: 'strategyApplied', label: 'Strategy You Applied', labelAr: 'الاستراتيجية اللي طبّقتها', type: 'textarea', required: true, placeholder: 'What did you do? What frameworks did you use? What was the key strategic decision?' },
      { key: 'keyDecision', label: 'The ONE Decision That Made The Difference', labelAr: 'القرار الوحيد اللي غيّر كل حاجة', type: 'textarea', helpText: 'Every project has that one insight or decision that unlocked everything. What was it?' },
      { key: 'results', label: 'Results (with numbers if possible)', labelAr: 'النتائج (بالأرقام لو ممكن)', type: 'textarea', required: true, placeholder: 'Revenue change? Customer growth? Brand perception shift? Be as specific as possible.' },
      { key: 'whatWorked', label: 'What Worked Best', labelAr: 'ايه اللي نجح أكتر', type: 'textarea' },
      { key: 'whatFailed', label: 'What Didn\'t Work (honest)', labelAr: 'ايه اللي ما نجحش (بصراحة)', type: 'textarea', helpText: 'Failures are as valuable as successes for learning.' },
      { key: 'clientFeedback', label: 'Client Feedback (if available)', labelAr: 'رأي العميل (لو متاح)', type: 'textarea' },
      { key: 'timeframe', label: 'Project Duration', labelAr: 'مدة المشروع', type: 'text', placeholder: 'e.g., 6 weeks, 3 months' },
      { key: 'price', label: 'Price Charged (EGP)', labelAr: 'السعر (جنيه)', type: 'number' },
    ],
    patternExtractionPrompt: `Analyze this project and extract:
1. The diagnostic pattern (what signal led to the real diagnosis?)
2. The strategic pattern (what approach worked and when should it be applied again?)
3. The pricing pattern (was the price right? What would you charge next time?)
4. The industry pattern (does this apply to similar businesses in this industry?)
5. One sentence "when you see X, recommend Y" rule for the AI.`,
  },

  // ──── PRICING LESSON ────
  {
    id: 'pricing_lesson',
    name: 'Pricing Lesson',
    nameAr: 'درس في التسعير',
    description: 'Document a pricing decision — what you charged, why, and what happened.',
    descriptionAr: 'وثّق قرار تسعير — بكام، ليه، وإيه اللي حصل.',
    icon: 'DollarSign',
    category: 'lesson_learned',
    fields: [
      { key: 'context', label: 'The Situation', labelAr: 'الموقف', type: 'textarea', required: true, placeholder: 'What was the client, service, and market?' },
      { key: 'priceCharged', label: 'Price Charged (EGP)', labelAr: 'السعر المطلوب (جنيه)', type: 'number', required: true },
      { key: 'clientReaction', label: 'Client Reaction', labelAr: 'رد فعل العميل', type: 'select', options: [
        { value: 'accepted_immediately', label: 'Accepted immediately', labelAr: 'وافق فوراً' },
        { value: 'negotiated_down', label: 'Negotiated down', labelAr: 'فاوض وقلّل' },
        { value: 'rejected', label: 'Rejected (too expensive)', labelAr: 'رفض (غالي)' },
        { value: 'thought_cheap', label: 'Made me feel I charged too little', labelAr: 'حسسني إني طلبت قليل' },
      ]},
      { key: 'whatLearned', label: 'What You Learned', labelAr: 'إيه اللي اتعلمته', type: 'textarea', required: true },
      { key: 'wouldChange', label: 'What Would You Change Next Time?', labelAr: 'هتغيّر إيه المرة الجاية؟', type: 'textarea' },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text' },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: [
        { value: 'egypt', label: 'Egypt', labelAr: 'مصر' },
        { value: 'ksa', label: 'KSA', labelAr: 'السعودية' },
        { value: 'uae', label: 'UAE', labelAr: 'الإمارات' },
      ]},
    ],
    patternExtractionPrompt: `Extract pricing intelligence:
1. What pricing bracket does this client fit? (budget/mid/premium/luxury)
2. What was the price-to-value perception?
3. Should this change the default pricing for this service+market combination?
4. One pricing rule for the AI: "For [industry] in [market], the sweet spot is..."`,
  },

  // ──── DISCOVERY INSIGHT ────
  {
    id: 'discovery_insight',
    name: 'Discovery Call Insight',
    nameAr: 'رؤية من مكالمة اكتشاف',
    description: 'Document a pattern you noticed during a discovery call.',
    descriptionAr: 'وثّق نمط لاحظته أثناء مكالمة اكتشاف.',
    icon: 'MessageSquare',
    category: 'client_pattern',
    fields: [
      { key: 'whatClientSaid', label: 'What The Client Said', labelAr: 'إيه اللي العميل قاله', type: 'textarea', required: true, placeholder: 'The exact words or sentiment — this is what triggers the pattern.' },
      { key: 'whatItReallyMeant', label: 'What It Really Meant', labelAr: 'إيه معناه الحقيقي', type: 'textarea', required: true, placeholder: 'Your interpretation — what was the real issue behind the words?' },
      { key: 'rightResponse', label: 'The Right Response/Question', labelAr: 'الرد/السؤال الصح', type: 'textarea', required: true, placeholder: 'What did you say or ask that unlocked the real conversation?' },
      { key: 'industry', label: 'Industry (if specific)', labelAr: 'الصناعة (لو محددة)', type: 'text' },
      { key: 'frequency', label: 'How Often You See This', labelAr: 'بتشوفها كل قد إيه', type: 'select', options: [
        { value: 'rare', label: 'Rare (1-2 times)', labelAr: 'نادر (مرة أو اتنين)' },
        { value: 'sometimes', label: 'Sometimes (3-5 times)', labelAr: 'أحياناً (3-5 مرات)' },
        { value: 'often', label: 'Often (6+ times)', labelAr: 'كتير (6 مرات+)' },
        { value: 'almost_always', label: 'Almost every call', labelAr: 'تقريباً كل مكالمة' },
      ]},
    ],
    patternExtractionPrompt: `Extract a discovery pattern:
1. The SIGNAL: What does the client say that indicates this pattern?
2. The DIAGNOSIS: What is the underlying issue?
3. The FOLLOW-UP: What's the best question to ask next?
4. Write a rule: "When client says [X], it usually means [Y], so ask [Z]."`,
  },

  // ──── MARKET OBSERVATION ────
  {
    id: 'market_observation',
    name: 'Market Observation',
    nameAr: 'ملاحظة سوقية',
    description: 'Something you noticed about the market — a trend, shift, or opportunity.',
    descriptionAr: 'حاجة لاحظتها عن السوق — ترند، تحوّل، أو فرصة.',
    icon: 'TrendingUp',
    category: 'market_insight',
    fields: [
      { key: 'observation', label: 'What You Observed', labelAr: 'إيه اللي لاحظته', type: 'textarea', required: true },
      { key: 'evidence', label: 'Evidence/Examples', labelAr: 'أدلة/أمثلة', type: 'textarea', placeholder: 'What made you notice this? Specific examples?' },
      { key: 'implication', label: 'What This Means for Branding', labelAr: 'ده يعني إيه للعلامات التجارية', type: 'textarea', required: true },
      { key: 'industry', label: 'Industry', labelAr: 'الصناعة', type: 'text' },
      { key: 'market', label: 'Market', labelAr: 'السوق', type: 'select', options: [
        { value: 'egypt', label: 'Egypt', labelAr: 'مصر' },
        { value: 'ksa', label: 'KSA', labelAr: 'السعودية' },
        { value: 'mena', label: 'MENA', labelAr: 'منطقة الشرق الأوسط' },
      ]},
    ],
    patternExtractionPrompt: `Analyze this observation:
1. Is this a short-term trend or structural shift?
2. Which client types should hear about this?
3. How should this change the AI's recommendations?`,
  },
];

// ════════════════════════════════════════════
// TEMPLATE PROCESSING
// ════════════════════════════════════════════

/**
 * Process a filled template → create knowledge entry + extract patterns.
 */
function fieldStr(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return v == null ? "" : String(v);
}

export async function processFilledTemplate(
  templateId: string,
  data: Record<string, unknown>,
  options?: { amplify?: boolean }
): Promise<{
  entryId: number | null;
  patterns: string[];
  insights: string;
}> {
  const template = PRIMO_TEMPLATES.find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  // Format content from fields
  const contentParts: string[] = [];
  for (const field of template.fields) {
    const value = data[field.key];
    if (value != null && String(value).trim() !== "") {
      contentParts.push(`**${field.label}:** ${String(value)}`);
    }
  }
  const content = contentParts.join('\n\n');
  const ctx = fieldStr(data, "context");
  const title =
    fieldStr(data, "clientName") ||
    (ctx ? ctx.substring(0, 100) : "") ||
    fieldStr(data, "observation").substring(0, 100) ||
    "Untitled";

  // Extract patterns using AI
  let patterns: string[] = [];
  let insights = '';

  try {
    const response = await resilientLLM({
      messages: [
        { role: 'system', content: 'You are WZZRD AI\'s knowledge architect. Extract actionable patterns from consultant experience. Respond in JSON: { "patterns": ["pattern1", "pattern2"], "insights": "one paragraph of deep insight" }' },
        { role: 'user', content: `${template.patternExtractionPrompt}\n\nDATA:\n${content}` },
      ],
    }, { context: 'knowledge' });
    const parsed = JSON.parse(response.choices[0].message.content as string);
    patterns = parsed.patterns || [];
    insights = parsed.insights || '';
  } catch (err) {
    logger.debug({ err }, 'Pattern extraction failed');
  }

  // Build enriched content
  const enrichedContent = `${content}\n\n---\n\n**AI-Extracted Patterns:**\n${patterns.map(p => `- ${p}`).join('\n')}\n\n**AI Insight:** ${insights}`;

  // Create knowledge entry
  const tags: string[] = [
    templateId,
    fieldStr(data, "industry").toLowerCase(),
    fieldStr(data, "market"),
    fieldStr(data, "diagnosticPattern"),
    fieldStr(data, "serviceType"),
    "primo_experience",
  ].filter(Boolean);

  const entryId = await createKnowledgeEntry({
    title: `[${template.name}] ${title}`,
    content: enrichedContent,
    category: template.category as 'case_study' | 'framework' | 'lesson_learned' | 'market_insight' | 'competitor_intel' | 'client_pattern' | 'methodology' | 'template' | 'general',
    industry: fieldStr(data, "industry") || undefined,
    market: fieldStr(data, "market") || undefined,
    source: 'manual',
    tags: [...new Set(tags)].slice(0, 20),
  });

  // Amplify if requested
  if (options?.amplify && entryId) {
    try {
      await amplifyKnowledgeEntry({
        title, content: enrichedContent,
        category: template.category,
        industry: fieldStr(data, "industry") || undefined,
        market: fieldStr(data, "market") || undefined,
      });
    } catch { /* Non-blocking */ }
  }

  logger.info({ templateId, title, patterns: patterns.length }, 'Template processed into knowledge');
  return { entryId, patterns, insights };
}

/**
 * Get all available templates for the frontend.
 */
export function getAvailableTemplates() {
  return PRIMO_TEMPLATES.map(t => ({
    id: t.id, name: t.name, nameAr: t.nameAr,
    description: t.description, descriptionAr: t.descriptionAr,
    icon: t.icon, category: t.category,
    fieldCount: t.fields.length,
    fields: t.fields,
  }));
}
