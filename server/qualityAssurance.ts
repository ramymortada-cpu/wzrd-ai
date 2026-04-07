/**
 * QUALITY ASSURANCE LAYER
 * =======================
 * 
 * Reviews every deliverable before it reaches the client.
 * 
 * 2 levels:
 * 1. RULE-BASED QA — instant checks (no LLM needed)
 *    - Length, structure, specificity, data presence
 *    
 * 2. AI-POWERED QA — deep review (uses LLM)
 *    - Tone, accuracy, framework usage, actionability
 * 
 * Every deliverable gets a quality score (0-100) and must pass
 * a minimum threshold before it can be marked as "delivered".
 */

import { logger } from './_core/logger';
import { resilientLLM } from './_core/llmRouter';

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

export interface QAResult {
  score: number;
  passed: boolean;
  checks: QACheck[];
  aiReview?: {
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    suggestedImprovements: string[];
  };
}

interface QACheck {
  id: string;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

const PASS_THRESHOLD = 60; // Minimum score to mark as deliverable

// ════════════════════════════════════════════
// 1. RULE-BASED QA (instant)
// ════════════════════════════════════════════

export function runRuleBasedQA(
  content: string,
  deliverableType?: string
): QACheck[] {
  const checks: QACheck[] = [];

  // ── Length Check ──
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const minWords: Record<string, number> = {
    'brand_audit': 800, 'brand_positioning': 500, 'messaging_framework': 400,
    'business_model': 600, 'competitive_analysis': 500, 'strategy_deck': 700,
    'social_strategy': 400, default: 300,
  };
  const required = minWords[deliverableType || 'default'] || minWords.default;
  checks.push({
    id: 'length', name: 'Content length',
    passed: wordCount >= required,
    score: Math.min(15, Math.round((wordCount / required) * 15)),
    maxScore: 15,
    detail: `${wordCount} words (minimum ${required})`,
  });

  // ── Structure Check — has sections/headers ──
  const headerCount = (content.match(/^#{1,3}\s|^\*\*[A-Z]/gm) || []).length;
  const hasSections = headerCount >= 3;
  checks.push({
    id: 'structure', name: 'Document structure',
    passed: hasSections,
    score: hasSections ? 10 : Math.min(5, headerCount * 2),
    maxScore: 10,
    detail: `${headerCount} sections found (minimum 3)`,
  });

  // ── Specificity — has real names, numbers, data ──
  const hasNumbers = /\d+(%|\s*(EGP|SAR|USD|million|billion|thousand|k))/i.test(content);
  const hasNames = /[A-Z][a-z]+\s(Agency|Brand|Company|Group|Ltd|Inc)/.test(content) ||
                   /WZZRD AI|Keller|Kapferer|Sharp|Porter|Kahneman|Cialdini/.test(content);
  const specificity = (hasNumbers ? 8 : 0) + (hasNames ? 7 : 0);
  checks.push({
    id: 'specificity', name: 'Specific data & references',
    passed: specificity >= 10,
    score: specificity,
    maxScore: 15,
    detail: `Numbers: ${hasNumbers ? 'Yes' : 'No'}, Named entities: ${hasNames ? 'Yes' : 'No'}`,
  });

  // ── Framework Usage — mentions academic frameworks ──
  const frameworks = ['Keller', 'CBBE', 'Kapferer', 'Prism', 'Sharp', 'Kahneman', 'System 1',
    'System 2', 'Porter', 'Five Forces', 'Cialdini', 'SWOT', 'Aaker', 'brand equity',
    'positioning', 'value proposition', 'mental availability', 'distinctive assets'];
  const foundFrameworks = frameworks.filter(f => content.toLowerCase().includes(f.toLowerCase()));
  checks.push({
    id: 'frameworks', name: 'Academic framework usage',
    passed: foundFrameworks.length >= 2,
    score: Math.min(15, foundFrameworks.length * 5),
    maxScore: 15,
    detail: `Frameworks found: ${foundFrameworks.length > 0 ? foundFrameworks.join(', ') : 'None'}`,
  });

  // ── Actionability — has recommendations/next steps ──
  const actionWords = /recommend|should|action|next step|implement|execute|priorit|timeline|immediate|phase \d/i;
  const hasActions = actionWords.test(content);
  const hasBulletActions = (content.match(/^[-•*]\s/gm) || []).length >= 3;
  checks.push({
    id: 'actionability', name: 'Actionable recommendations',
    passed: hasActions && hasBulletActions,
    score: (hasActions ? 8 : 0) + (hasBulletActions ? 7 : 0),
    maxScore: 15,
    detail: `Action language: ${hasActions ? 'Yes' : 'No'}, Bullet points: ${hasBulletActions ? 'Yes' : 'No'}`,
  });

  // ── Client-Specific — not generic ──
  const genericPhrases = [
    'your company', 'the client', 'many businesses', 'in today\'s market',
    'it is important to', 'as we all know', 'in general',
  ];
  const genericCount = genericPhrases.filter(p => content.toLowerCase().includes(p)).length;
  const isSpecific = genericCount <= 2;
  checks.push({
    id: 'client_specific', name: 'Client-specific (not generic)',
    passed: isSpecific,
    score: isSpecific ? 10 : Math.max(0, 10 - genericCount * 3),
    maxScore: 10,
    detail: `Generic phrases found: ${genericCount} (max 2)`,
  });

  // ── Tone Check — professional, not chatbot-like ──
  const chatbotPhrases = [
    'sure!', 'absolutely!', 'great question', 'happy to help', 'here you go',
    'let me', 'i\'d be happy', 'certainly!', 'of course!',
  ];
  const chatbotCount = chatbotPhrases.filter(p => content.toLowerCase().includes(p)).length;
  const isProfessional = chatbotCount === 0;
  checks.push({
    id: 'tone', name: 'Professional consultant tone',
    passed: isProfessional,
    score: isProfessional ? 10 : Math.max(0, 10 - chatbotCount * 3),
    maxScore: 10,
    detail: chatbotCount === 0 ? 'Professional tone confirmed' : `${chatbotCount} informal phrases found`,
  });

  // ── Arabic/MENA Context (bonus) ──
  const menaReferences = /egypt|saudi|ksa|uae|dubai|mena|cairo|riyadh|jeddah|مصر|السعودية|الرياض|القاهرة/i;
  const hasMENA = menaReferences.test(content);
  checks.push({
    id: 'mena_context', name: 'MENA market context',
    passed: hasMENA,
    score: hasMENA ? 10 : 0,
    maxScore: 10,
    detail: hasMENA ? 'MENA market references found' : 'No MENA-specific references',
  });

  return checks;
}

// ════════════════════════════════════════════
// 2. AI-POWERED QA (deep review)
// ════════════════════════════════════════════

export async function runAIReview(
  content: string,
  context: { deliverableType?: string; clientName?: string; industry?: string; market?: string }
): Promise<QAResult['aiReview']> {
  try {
    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are the Quality Assurance reviewer for WZZRD AI, a premium brand engineering studio. 

Your job: Review this deliverable and assess if it meets consulting-quality standards.

Standards:
1. SPECIFICITY — Does it reference real data, numbers, market facts? Or is it generic?
2. FRAMEWORK — Does it apply brand strategy frameworks (Keller, Kapferer, Sharp, etc.) correctly?
3. ACTIONABILITY — Can the client execute based on this? Are recommendations clear and prioritized?
4. TONE — Does it read like a senior consultant wrote it? Not a chatbot, not a student.
5. CLIENT FIT — Is it clearly written for THIS specific client, not a template?
6. MENA RELEVANCE — Does it account for Arab market context (Egypt/KSA)?

Respond in JSON only.`,
        },
        {
          role: 'user',
          content: `Review this deliverable:

TYPE: ${context.deliverableType || 'General'}
CLIENT: ${context.clientName || 'Unknown'}
INDUSTRY: ${context.industry || 'Unknown'}
MARKET: ${context.market || 'Unknown'}

CONTENT:
${content.substring(0, 6000)}

Return JSON:
{
  "overallAssessment": "One paragraph honest assessment",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestedImprovements": ["improvement 1", "improvement 2", "improvement 3"]
}`,
        },
      ],
    }, { context: 'quality' });

    return JSON.parse(response.choices[0].message.content as string);
  } catch (err) {
    logger.error({ err }, 'AI QA review failed');
    return undefined;
  }
}

// ════════════════════════════════════════════
// 3. COMBINED QA — Rule-based + AI
// ════════════════════════════════════════════

/**
 * Full QA review of a deliverable.
 * 
 * @param content - The deliverable content
 * @param options.deepReview - If true, also runs AI review (slower but more thorough)
 * @param options.deliverableType - Type for calibrated thresholds
 * @returns QAResult with score, pass/fail, and detailed checks
 */
export async function reviewDeliverable(
  content: string,
  options?: {
    deepReview?: boolean;
    deliverableType?: string;
    clientName?: string;
    industry?: string;
    market?: string;
  }
): Promise<QAResult> {
  // 1. Rule-based checks (instant)
  const checks = runRuleBasedQA(content, options?.deliverableType);
  const score = checks.reduce((sum, c) => sum + c.score, 0);
  const passed = score >= PASS_THRESHOLD;

  // 2. AI review (optional, slower)
  let aiReview: QAResult['aiReview'] | undefined;
  if (options?.deepReview) {
    aiReview = await runAIReview(content, {
      deliverableType: options.deliverableType,
      clientName: options.clientName,
      industry: options.industry,
      market: options.market,
    });
  }

  logger.info({
    score,
    passed,
    deliverableType: options?.deliverableType,
    checksPassedCount: checks.filter(c => c.passed).length,
    totalChecks: checks.length,
    deepReview: !!options?.deepReview,
  }, 'QA review completed');

  return { score, passed, checks, aiReview };
}

/**
 * Quick quality check — rule-based only, instant.
 * Use this for real-time feedback while content is being generated.
 */
export function quickQualityCheck(content: string): { score: number; passed: boolean; topIssue: string } {
  const checks = runRuleBasedQA(content);
  const score = checks.reduce((sum, c) => sum + c.score, 0);
  const worstCheck = checks.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0];
  return {
    score,
    passed: score >= PASS_THRESHOLD,
    topIssue: worstCheck?.passed ? 'All checks passed' : `${worstCheck?.name}: ${worstCheck?.detail}`,
  };
}
