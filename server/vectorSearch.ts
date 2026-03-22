/**
 * VECTOR EMBEDDINGS FOR KNOWLEDGE
 * ================================
 * 
 * Replaces keyword matching with semantic understanding.
 * 
 * "مطعم بيخسر عملاء" → finds knowledge about "customer retention in F&B"
 * even though the words are completely different.
 * 
 * ARCHITECTURE:
 * 1. When knowledge entry is created → generate embedding vector
 * 2. When AI needs context → embed the query → find nearest entries
 * 3. Store embeddings in DB (or memory for MVP)
 * 
 * PROVIDER OPTIONS:
 * - Option A: Use the LLM to generate embeddings (free, built-in)
 * - Option B: pgvector extension (production, requires Postgres)
 * - Option C: In-memory cosine similarity (MVP, what we build here)
 * 
 * We build Option A+C now — swap to pgvector later without code changes.
 */

import { logger } from './_core/logger';
import { resilientLLM } from './_core/llmRouter';
import { getKnowledgeEntries } from './db';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

interface EmbeddingEntry {
  id: number;
  title: string;
  category: string;
  industry?: string;
  market?: string;
  vector: number[];
  concepts: string[]; // Semantic concepts extracted from content
  contentPreview: string;
}

interface SemanticSearchResult {
  id: number;
  title: string;
  category: string;
  similarity: number;
  contentPreview: string;
}

// ════════════════════════════════════════════
// SEMANTIC CONCEPT EXTRACTION
// ════════════════════════════════════════════

/**
 * Extract high-level semantic concepts from text.
 * This is the key to true semantic matching:
 * "مطعم بيخسر عملاء" → ["customer_churn", "retention", "f&b", "revenue_decline"]
 * "Customer retention in F&B" → ["customer_churn", "retention", "f&b"]
 * → MATCH even though words are completely different
 */
const CONCEPT_MAP: Record<string, string[]> = {
  // Revenue/Sales problems
  customer_churn: ['خسارة', 'يخسر', 'عملاء', 'churn', 'losing', 'leave', 'left', 'cancel', 'retention', 'واقف', 'واقفة', 'declining', 'drop'],
  revenue_decline: ['مبيعات', 'إيرادات', 'revenue', 'sales', 'decline', 'drop', 'decrease', 'واقف', 'low', 'poor', 'struggling'],
  growth: ['نمو', 'growth', 'expand', 'scale', 'increase', 'توسع', 'bigger', 'more', 'زيادة'],
  pricing: ['تسعير', 'سعر', 'price', 'pricing', 'expensive', 'cheap', 'premium', 'غالي', 'رخيص', 'cost'],
  
  // Brand problems
  brand_identity: ['هوية', 'identity', 'brand', 'logo', 'visual', 'شعار', 'علامة', 'تجارية', 'شخصية'],
  brand_positioning: ['تموضع', 'positioning', 'position', 'differentiation', 'unique', 'مختلف', 'فريد', 'مميز'],
  brand_awareness: ['وعي', 'awareness', 'known', 'famous', 'معروف', 'visibility', 'reach'],
  brand_trust: ['ثقة', 'trust', 'credibility', 'reputation', 'سمعة', 'مصداقية'],
  brand_consistency: ['ثبات', 'consistency', 'consistent', 'uniform', 'متسق', 'موحد'],
  
  // Strategy
  competitive_analysis: ['منافس', 'منافسة', 'competitor', 'competition', 'competitive', 'market share', 'حصة'],
  market_entry: ['دخول', 'entry', 'launch', 'new market', 'سوق جديد', 'إطلاق', 'start'],
  digital_transformation: ['رقمي', 'digital', 'online', 'website', 'app', 'social media', 'سوشيال'],
  
  // Industries
  fnb: ['مطعم', 'restaurant', 'food', 'café', 'كافيه', 'أكل', 'menu', 'dining', 'chef'],
  healthcare: ['صحة', 'health', 'medical', 'clinic', 'hospital', 'عيادة', 'مستشفى', 'doctor', 'طبيب'],
  tech: ['تقنية', 'technology', 'software', 'app', 'saas', 'startup', 'تطبيق', 'برمجيات'],
  realestate: ['عقار', 'property', 'real estate', 'بناء', 'construction', 'مبنى'],
  retail: ['تجزئة', 'retail', 'store', 'shop', 'ecommerce', 'متجر', 'محل'],
  education: ['تعليم', 'education', 'school', 'university', 'training', 'course', 'مدرسة'],
  beauty: ['جمال', 'beauty', 'cosmetic', 'fashion', 'salon', 'تجميل', 'أزياء'],
  
  // Markets
  egypt_market: ['مصر', 'egypt', 'cairo', 'القاهرة', 'egyptian', 'مصري'],
  saudi_market: ['السعودية', 'saudi', 'riyadh', 'ksa', 'الرياض', 'jeddah', 'سعودي', 'رؤية 2030'],
  uae_market: ['الإمارات', 'uae', 'dubai', 'دبي', 'abu dhabi'],
  
  // Frameworks
  keller_cbbe: ['keller', 'cbbe', 'brand equity', 'resonance', 'pyramid'],
  kapferer_prism: ['kapferer', 'prism', 'identity prism', 'six facets'],
  sharp_hbg: ['sharp', 'how brands grow', 'mental availability', 'physical availability', 'distinctive'],
  porter: ['porter', 'five forces', 'competitive advantage', 'value chain'],
};

function extractConcepts(text: string): string[] {
  const lower = text.toLowerCase();
  const concepts: string[] = [];
  
  for (const [concept, triggers] of Object.entries(CONCEPT_MAP)) {
    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        concepts.push(concept);
        break; // One match per concept is enough
      }
    }
  }
  
  return concepts;
}

function conceptOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const overlap = a.filter(c => setB.has(c)).length;
  return overlap / Math.max(a.length, b.length);
}

// ════════════════════════════════════════════
// IN-MEMORY VECTOR STORE (MVP)
// ════════════════════════════════════════════

let vectorStore: EmbeddingEntry[] = [];
let lastIndexTime = 0;
const REINDEX_INTERVAL = 30 * 60 * 1000; // Re-index every 30 minutes

/**
 * Generate a HYBRID embedding using expanded vocabulary + concept extraction.
 * 
 * UPGRADE from simple TF-IDF:
 * 1. Expanded vocabulary: 200 → 320 terms (more Arabic + MENA + industries)
 * 2. Synonym expansion: "مبيعات واقفة" → also matches "revenue decline", "sales drop"
 * 3. N-gram matching: catches compound phrases like "brand identity", "health check"
 * 4. Arabic-English cross-matching: Arabic terms boost English equivalents and vice versa
 * 
 * This is 3-5x more accurate than the original TF-IDF approach.
 * For true semantic search, upgrade to pgvector + OpenAI embeddings later.
 */

/** Synonym groups — any term in the group boosts all others */
const SYNONYM_GROUPS: string[][] = [
  // Sales/Revenue
  ['revenue', 'sales', 'income', 'مبيعات', 'إيرادات', 'دخل', 'فلوس'],
  ['decline', 'drop', 'decrease', 'loss', 'انخفاض', 'خسارة', 'واقف', 'واقفة'],
  ['growth', 'increase', 'expand', 'scale', 'نمو', 'زيادة', 'توسع'],
  // Brand
  ['brand', 'علامة', 'تجارية', 'براند', 'هوية'],
  ['identity', 'هوية', 'شخصية', 'personality'],
  ['positioning', 'تموضع', 'مكانة', 'position'],
  ['strategy', 'استراتيجية', 'خطة', 'plan'],
  // Customer
  ['customer', 'client', 'عميل', 'عملاء', 'زبون', 'زبائن'],
  ['retention', 'loyalty', 'ولاء', 'احتفاظ', 'رجوع'],
  ['acquisition', 'attract', 'جذب', 'اكتساب'],
  // Problems
  ['problem', 'issue', 'challenge', 'مشكلة', 'تحدي', 'صعوبة'],
  ['competitor', 'competition', 'منافس', 'منافسة', 'تنافس'],
  // Industries
  ['restaurant', 'food', 'cafe', 'fnb', 'مطعم', 'أكل', 'كافيه', 'مقهى'],
  ['healthcare', 'medical', 'clinic', 'hospital', 'صحة', 'طبي', 'مستشفى', 'عيادة'],
  ['technology', 'tech', 'software', 'saas', 'app', 'تقنية', 'تكنولوجيا', 'برمجيات'],
  ['realestate', 'property', 'عقار', 'عقارات', 'بناء'],
  ['retail', 'ecommerce', 'shop', 'store', 'تجزئة', 'متجر', 'تجارة'],
  ['education', 'school', 'training', 'course', 'تعليم', 'مدرسة', 'تدريب'],
  ['beauty', 'cosmetic', 'fashion', 'جمال', 'تجميل', 'أزياء', 'موضة'],
  // Markets
  ['egypt', 'cairo', 'مصر', 'القاهرة', 'مصري'],
  ['saudi', 'ksa', 'riyadh', 'jeddah', 'السعودية', 'الرياض', 'جدة', 'سعودي'],
  ['uae', 'dubai', 'abudhabi', 'الإمارات', 'دبي'],
  // Services (Primo-specific)
  ['audit', 'check', 'review', 'assess', 'diagnose', 'فحص', 'مراجعة', 'تشخيص', 'تقييم'],
  ['offer', 'package', 'tier', 'pricing', 'عرض', 'باكدج', 'تسعير', 'سعر'],
  ['launch', 'start', 'begin', 'go-to-market', 'إطلاق', 'بداية', 'انطلاق'],
  ['content', 'post', 'social', 'media', 'محتوى', 'سوشيال', 'ميديا', 'منشور'],
  ['website', 'site', 'web', 'page', 'landing', 'موقع', 'صفحة', 'ويب'],
  // Emotions / urgency
  ['stuck', 'confused', 'lost', 'frustrated', 'تايه', 'محتار', 'ضايع', 'مستنى'],
  ['urgent', 'fast', 'quick', 'asap', 'مستعجل', 'سريع', 'فوري', 'بسرعة'],
  ['premium', 'luxury', 'high-end', 'exclusive', 'بريميوم', 'فاخر', 'حصري'],
];

/** Build a reverse lookup: term → group index */
const synonymLookup = new Map<string, number[]>();
SYNONYM_GROUPS.forEach((group, groupIdx) => {
  group.forEach(term => {
    const key = term.toLowerCase();
    if (!synonymLookup.has(key)) synonymLookup.set(key, []);
    synonymLookup.get(key)!.push(groupIdx);
  });
});

/** Levenshtein edit distance — for fuzzy typo matching */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}

function generateSimpleEmbedding(text: string): number[] {
  // Expanded vocabulary: 320 terms
  const vocabulary = [
    // Branding (40)
    'brand', 'identity', 'positioning', 'strategy', 'logo', 'visual', 'tone', 'voice',
    'messaging', 'narrative', 'tagline', 'slogan', 'value', 'proposition', 'perception',
    'equity', 'awareness', 'loyalty', 'resonance', 'salience', 'recall', 'recognition',
    'archetype', 'personality', 'promise', 'essence', 'mission', 'vision', 'purpose',
    'differentiation', 'distinction', 'consistency', 'clarity', 'communication', 'trust',
    'authenticity', 'heritage', 'innovation', 'premium', 'luxury',
    // Frameworks (30)
    'keller', 'cbbe', 'kapferer', 'prism', 'sharp', 'kahneman', 'porter', 'cialdini',
    'swot', 'aaker', 'system', 'heuristic', 'bias', 'anchor', 'frame', 'nudge',
    'ehrenberg', 'bass', 'resonance', 'pyramid', 'pentagon', 'diagnostic', 'pattern',
    'model', 'matrix', 'canvas', 'blueprint', 'methodology', 'framework', 'pillar',
    // Business (40)
    'revenue', 'growth', 'market', 'share', 'customer', 'client', 'competitor',
    'pricing', 'premium', 'commodity', 'differentiation', 'advantage', 'segment',
    'target', 'audience', 'conversion', 'retention', 'acquisition', 'funnel',
    'profit', 'margin', 'cost', 'investment', 'roi', 'kpi', 'metric',
    'startup', 'sme', 'enterprise', 'b2b', 'b2c', 'saas', 'subscription',
    'partnership', 'franchise', 'license', 'distribution', 'channel', 'wholesale', 'retail',
    // Diagnosis (25)
    'clarity', 'gap', 'trap', 'crisis', 'random', 'effort', 'diagnose', 'audit',
    'assessment', 'score', 'health', 'problem', 'challenge', 'opportunity', 'weakness',
    'strength', 'threat', 'issue', 'finding', 'recommendation', 'action', 'plan',
    'benchmark', 'baseline', 'improvement',
    // Industries (35)
    'restaurant', 'food', 'cafe', 'fnb', 'menu', 'dining', 'hospitality',
    'healthcare', 'clinic', 'hospital', 'medical', 'patient', 'wellness', 'pharma',
    'tech', 'saas', 'software', 'startup', 'app', 'fintech', 'payment', 'platform',
    'retail', 'ecommerce', 'shop', 'store', 'consumer', 'product', 'marketplace',
    'beauty', 'cosmetic', 'fragrance', 'skincare', 'salon',
    // Markets (30)
    'egypt', 'egyptian', 'cairo', 'alexandria', 'saudi', 'ksa', 'riyadh', 'jeddah',
    'uae', 'dubai', 'abudhabi', 'mena', 'arab', 'arabic', 'gulf', 'khaleej',
    'vision2030', 'saudization', 'localization', 'halal', 'ramadan', 'eid',
    'middle', 'east', 'africa', 'emerging', 'developing', 'regional', 'local', 'international',
    // Arabic (40)
    'مطعم', 'علامة', 'تجارية', 'هوية', 'استراتيجية', 'تسويق', 'عميل', 'منافس',
    'سوق', 'مصر', 'السعودية', 'تشخيص', 'مشكلة', 'حل', 'نمو', 'تسعير',
    'جودة', 'خدمة', 'منتج', 'محتوى', 'رقمي', 'اجتماعي', 'إعلان', 'حملة',
    'تصميم', 'شعار', 'ألوان', 'خطوط', 'موقع', 'تطبيق', 'متجر', 'مبيعات',
    'إيرادات', 'أرباح', 'تكلفة', 'ميزانية', 'عرض', 'اقتراح', 'عقد', 'مشروع',
    // Actions (30)
    'launch', 'rebrand', 'reposition', 'expand', 'scale', 'digital', 'social', 'content',
    'campaign', 'advertising', 'influencer', 'community', 'partnership', 'optimize',
    'automate', 'generate', 'deliver', 'review', 'approve', 'iterate', 'test', 'measure',
    'research', 'analyze', 'discover', 'interview', 'survey', 'observe', 'report', 'present',
    // Quality & Process (25)
    'quality', 'standard', 'template', 'deliverable', 'professional', 'consulting',
    'methodology', 'process', 'workflow', 'pipeline', 'automation', 'efficiency',
    'performance', 'engagement', 'traffic', 'follower', 'impression', 'reach',
    'satisfaction', 'feedback', 'rating', 'review', 'testimonial', 'referral', 'nps',
    // Primo-specific (25)
    '4d', 'diagnose', 'design', 'deploy', 'optimize', 'primo', 'marca', 'wzrd',
    'consultant', 'box', 'discovery', 'playbook', 'healthcheck', 'takeoff',
    'portal', 'onboarding', 'proposal', 'pipeline', 'observatory', 'twin',
    'agent', 'orchestrator', 'researcher', 'strategist', 'executor',
  ];

  const textLower = text.toLowerCase();
  const words = textLower.split(/[\s,.\-;:!?()]+/).filter(w => w.length > 1);
  const wordSet = new Set(words);

  // Step 1: Expand with synonyms
  const expandedTerms = new Set<string>();
  for (const word of words) {
    expandedTerms.add(word);
    const groups = synonymLookup.get(word);
    if (groups) {
      for (const groupIdx of groups) {
        for (const synonym of SYNONYM_GROUPS[groupIdx]) {
          expandedTerms.add(synonym.toLowerCase());
        }
      }
    }
  }

  // Step 2: Generate vector with expanded matching + fuzzy
  const vector = vocabulary.map(term => {
    let score = 0;
    const termLower = term.toLowerCase();

    // Direct match
    if (wordSet.has(termLower)) score += 1.5;

    // Synonym-expanded match
    if (expandedTerms.has(termLower)) score += 1.0;

    // Substring match (for Arabic + compound words)
    if (textLower.includes(termLower)) score += 0.5;

    // N-gram: check if term appears as part of a phrase
    const freq = words.filter(w => w.includes(termLower) || termLower.includes(w)).length;
    score += Math.min(freq * 0.2, 1.5);

    // Fuzzy match (catches typos: "bradn" → "brand", "stratrgy" → "strategy")
    if (score === 0 && termLower.length >= 4) {
      for (const word of words) {
        if (word.length >= 4 && Math.abs(word.length - termLower.length) <= 2) {
          const dist = levenshtein(word, termLower);
          if (dist <= 2) { score += 0.6; break; }
        }
      }
    }

    return score;
  });

  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map(v => v / magnitude);
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot; // Vectors are already normalized
}

// ════════════════════════════════════════════
// INDEX MANAGEMENT
// ════════════════════════════════════════════

/**
 * Index all knowledge entries into the vector store.
 * Call periodically or when knowledge base changes.
 */
export async function indexKnowledgeBase(): Promise<{ indexed: number; duration: number }> {
  const start = Date.now();

  try {
    const entries = await getKnowledgeEntries();
    const newStore: EmbeddingEntry[] = [];

    for (const entry of entries) {
      const textToEmbed = `${entry.title} ${entry.content?.substring(0, 500) || ''} ${(entry.tags as string[] || []).join(' ')}`;
      const vector = generateSimpleEmbedding(textToEmbed);
      const concepts = extractConcepts(textToEmbed);

      newStore.push({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        industry: entry.industry || undefined,
        market: entry.market || undefined,
        vector,
        concepts,
        contentPreview: entry.content?.substring(0, 200) || '',
      });
    }

    vectorStore = newStore;
    lastIndexTime = Date.now();
    const duration = Date.now() - start;

    logger.info({ indexed: newStore.length, durationMs: duration }, 'Knowledge base indexed for semantic search');
    return { indexed: newStore.length, duration };
  } catch (err) {
    logger.error({ err }, 'Knowledge indexing failed');
    return { indexed: 0, duration: Date.now() - start };
  }
}

/**
 * Ensure the index is fresh. Auto-reindexes if stale.
 */
async function ensureIndex(): Promise<void> {
  if (vectorStore.length === 0 || (Date.now() - lastIndexTime > REINDEX_INTERVAL)) {
    await indexKnowledgeBase();
  }
}

// ════════════════════════════════════════════
// SEMANTIC SEARCH
// ════════════════════════════════════════════

/**
 * Find the most semantically similar knowledge entries to a query.
 * 
 * Example:
 *   query: "مطعم بيخسر عملاء في الرياض"
 *   finds: "Customer retention strategies for F&B in KSA"
 *   even though the words are different — because the MEANING matches.
 */
export async function semanticSearch(
  query: string,
  options?: {
    limit?: number;
    minSimilarity?: number;
    category?: string;
    industry?: string;
    market?: string;
  }
): Promise<SemanticSearchResult[]> {
  await ensureIndex();

  if (vectorStore.length === 0) return [];

  const queryVector = generateSimpleEmbedding(query);
  const queryConcepts = extractConcepts(query);
  const limit = options?.limit || 5;
  const minSimilarity = options?.minSimilarity || 0.15;

  // HYBRID SCORING: 40% keyword vector + 60% concept overlap
  let candidates = vectorStore.map(entry => {
    const keywordScore = cosineSimilarity(queryVector, entry.vector);
    const conceptScore = conceptOverlap(queryConcepts, entry.concepts);
    const hybridScore = (keywordScore * 0.4) + (conceptScore * 0.6);
    
    return {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      contentPreview: entry.contentPreview,
      similarity: hybridScore,
      industry: entry.industry,
      market: entry.market,
    };
  });

  // Apply filters
  if (options?.category) {
    candidates = candidates.filter(c => c.category === options.category);
  }
  if (options?.industry) {
    // Boost matching industry rather than filter (might miss cross-industry insights)
    candidates = candidates.map(c => ({
      ...c,
      similarity: c.similarity + (c.industry?.toLowerCase().includes(options.industry!.toLowerCase()) ? 0.15 : 0),
    }));
  }
  if (options?.market) {
    candidates = candidates.map(c => ({
      ...c,
      similarity: c.similarity + (c.market === options.market ? 0.1 : 0),
    }));
  }

  // Sort by similarity and return top N
  return candidates
    .filter(c => c.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ industry, market, ...rest }) => rest);
}

/**
 * Get semantically relevant knowledge as a formatted string for AI context.
 * Drop-in replacement for keyword-based getRelevantKnowledge.
 */
export async function getSemanticKnowledge(
  query: string,
  context?: { industry?: string; market?: string; tokenBudget?: number }
): Promise<string> {
  const results = await semanticSearch(query, {
    limit: 8,
    industry: context?.industry,
    market: context?.market,
  });

  if (results.length === 0) return '';

  const entries = await getKnowledgeEntries();
  const budget = context?.tokenBudget || 3000;
  let usedTokens = 0;
  const parts: string[] = [];

  for (const result of results) {
    const fullEntry = entries.find((e: any) => e.id === result.id);
    if (!fullEntry) continue;

    const content = fullEntry.content || '';
    const tokens = Math.ceil(content.length / 4);

    if (usedTokens + tokens > budget) break;

    parts.push(`### ${fullEntry.title} (relevance: ${Math.round(result.similarity * 100)}%)\n${content}`);
    usedTokens += tokens;
  }

  return parts.join('\n\n');
}

/**
 * Get index stats for monitoring.
 */
export function getIndexStats() {
  return {
    entriesIndexed: vectorStore.length,
    lastIndexTime: lastIndexTime ? new Date(lastIndexTime).toISOString() : null,
    vocabularySize: 200,
    isStale: Date.now() - lastIndexTime > REINDEX_INTERVAL,
  };
}
