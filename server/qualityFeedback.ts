/**
 * QUALITY FEEDBACK PIPELINE
 * =========================
 * 
 * 3-level quality measurement:
 * 
 * Level 1: AUTO SCORING (on every deliverable)
 *   - Rule-based QA → instant score
 *   - AI-powered QA → deep review
 *   - Score < 70 → auto-reject → re-generate
 *   - Score 70-85 → needs review
 *   - Score > 85 → auto-approve
 * 
 * Level 2: OWNER REVIEW (Ramy rates)
 *   - 1-5 stars + optional notes
 *   - Tracked over time → quality trends
 *   - Feeds back into prompt improvement
 * 
 * Level 3: CLIENT FEEDBACK (from Portal)
 *   - 👍/👎 + optional comment
 *   - Tracked per deliverable type
 *   - Used to improve deliverable templates
 */

import { logger } from './_core/logger';
import { runRuleBasedQA, runAIReview } from './qualityAssurance';

// ============ TYPES ============

export interface QualityScore {
  deliverableId: number;
  ruleScore: number;
  aiScore: number | null;
  finalScore: number;
  passed: boolean;
  issues: Array<{ id: string; name: string; detail: string }>;
  aiReview: {
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    suggestedImprovements: string[];
  } | null;
  rejectedReason: string | null;
}

export interface OwnerReview {
  deliverableId: number;
  score: number; // 1-5
  notes: string | null;
}

export interface ClientFeedback {
  deliverableId: number;
  projectId: number | null;
  clientName: string;
  rating: number; // 1-5
  positiveNotes: string | null;
  negativeNotes: string | null;
}

export interface QualityTrend {
  period: string;
  avgAutoScore: number;
  avgOwnerScore: number;
  avgClientRating: number;
  totalDeliverables: number;
  rejectedCount: number;
  passRate: string;
}

// ============ IN-MEMORY STORES (will be DB-backed with migration 0013) ============

const qualityScores: QualityScore[] = [];
const ownerReviews: OwnerReview[] = [];
const clientFeedbacks: ClientFeedback[] = [];

// ============ THRESHOLDS ============

const THRESHOLDS = {
  AUTO_REJECT: 55,       // Below this → auto-reject
  NEEDS_REVIEW: 75,      // Below this → flag for Ramy
  AUTO_APPROVE: 85,      // Above this → approved directly
  AI_REVIEW_THRESHOLD: 60, // Below this → also run AI review
};

// ============ LEVEL 1: AUTO SCORING ============

/**
 * Run the full quality assessment pipeline on a deliverable.
 * Returns a score and whether it passed, with detailed breakdown.
 */
export async function assessDeliverableQuality(
  content: string,
  deliverableId: number,
  deliverableType?: string,
  options?: { skipAI?: boolean }
): Promise<QualityScore> {
  // Step 1: Rule-based QA (instant, no LLM)
  const ruleChecks = runRuleBasedQA(content, deliverableType);
  const ruleScore = ruleChecks.length > 0
    ? Math.round(ruleChecks.reduce((sum, c) => sum + (c.score / c.maxScore) * 100, 0) / ruleChecks.length)
    : 50;

  // Step 2: AI review (if score is borderline or if explicitly requested)
  const aiScore: number | null = null;
  let aiReview: QualityScore['aiReview'] = null;

  if (!options?.skipAI && ruleScore < THRESHOLDS.AI_REVIEW_THRESHOLD) {
    try {
      const aiResult = await runAIReview(content, { deliverableType: deliverableType ?? undefined });
      if (aiResult) {
        aiReview = {
          overallAssessment: aiResult.overallAssessment,
          strengths: aiResult.strengths ?? [],
          weaknesses: aiResult.weaknesses ?? [],
          suggestedImprovements: aiResult.suggestedImprovements ?? [],
        };
      }
    } catch (err) {
      logger.warn({ err, deliverableId }, 'AI quality review failed — using rule-based score only');
    }
  }

  // Step 3: Calculate final score (weighted)
  const finalScore = aiScore !== null
    ? Math.round(ruleScore * 0.4 + aiScore * 0.6) // AI review weighs more
    : ruleScore;

  // Step 4: Determine pass/fail
  const passed = finalScore >= THRESHOLDS.AUTO_REJECT;
  let rejectedReason: string | null = null;

  if (finalScore < THRESHOLDS.AUTO_REJECT) {
    const failedChecks = ruleChecks.filter(c => !c.passed).map(c => c.name);
    rejectedReason = `Score ${finalScore}/100 (threshold: ${THRESHOLDS.AUTO_REJECT}). Failed: ${failedChecks.join(', ')}`;
    logger.warn({ deliverableId, finalScore, failedChecks }, 'Deliverable AUTO-REJECTED');
  } else if (finalScore < THRESHOLDS.NEEDS_REVIEW) {
    logger.info({ deliverableId, finalScore }, 'Deliverable needs owner review');
  } else if (finalScore >= THRESHOLDS.AUTO_APPROVE) {
    logger.info({ deliverableId, finalScore }, 'Deliverable AUTO-APPROVED');
  }

  const result: QualityScore = {
    deliverableId,
    ruleScore,
    aiScore,
    finalScore,
    passed,
    issues: ruleChecks.filter(c => !c.passed).map(c => ({
      id: c.id,
      name: c.name,
      detail: c.detail,
    })),
    aiReview,
    rejectedReason,
  };

  // Store
  qualityScores.push(result);

  return result;
}

/**
 * Get quality classification label.
 */
export function getQualityLabel(score: number): { label: string; labelAr: string; color: string } {
  if (score >= THRESHOLDS.AUTO_APPROVE) return { label: 'Excellent', labelAr: 'ممتاز', color: 'green' };
  if (score >= THRESHOLDS.NEEDS_REVIEW) return { label: 'Good', labelAr: 'جيد', color: 'blue' };
  if (score >= THRESHOLDS.AUTO_REJECT) return { label: 'Needs Review', labelAr: 'يحتاج مراجعة', color: 'yellow' };
  return { label: 'Rejected', labelAr: 'مرفوض', color: 'red' };
}

// ============ LEVEL 2: OWNER REVIEW ============

/**
 * Record Ramy's review of a deliverable.
 */
export function recordOwnerReview(review: OwnerReview): void {
  // Remove existing review for same deliverable
  const idx = ownerReviews.findIndex(r => r.deliverableId === review.deliverableId);
  if (idx >= 0) ownerReviews[idx] = review;
  else ownerReviews.push(review);

  logger.info({
    deliverableId: review.deliverableId,
    score: review.score,
  }, 'Owner review recorded');
}

/**
 * Get owner review for a deliverable.
 */
export function getOwnerReview(deliverableId: number): OwnerReview | null {
  return ownerReviews.find(r => r.deliverableId === deliverableId) || null;
}

// ============ LEVEL 3: CLIENT FEEDBACK ============

/**
 * Record client feedback from the Portal.
 */
export function recordClientFeedback(feedback: ClientFeedback): void {
  clientFeedbacks.push(feedback);

  logger.info({
    deliverableId: feedback.deliverableId,
    rating: feedback.rating,
    clientName: feedback.clientName,
  }, 'Client feedback recorded');
}

/**
 * Get all client feedback for a deliverable.
 */
export function getClientFeedback(deliverableId: number): ClientFeedback[] {
  return clientFeedbacks.filter(f => f.deliverableId === deliverableId);
}

// ============ ANALYTICS ============

/**
 * Get quality score for a specific deliverable (all 3 levels).
 */
export function getDeliverableQuality(deliverableId: number) {
  const autoScore = qualityScores.find(q => q.deliverableId === deliverableId);
  const ownerReview = ownerReviews.find(r => r.deliverableId === deliverableId);
  const feedback = clientFeedbacks.filter(f => f.deliverableId === deliverableId);
  const avgClientRating = feedback.length > 0
    ? Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10
    : null;

  return {
    autoScore: autoScore?.finalScore || null,
    autoLabel: autoScore ? getQualityLabel(autoScore.finalScore) : null,
    passed: autoScore?.passed || false,
    issues: autoScore?.issues || [],
    aiReview: autoScore?.aiReview || null,
    ownerScore: ownerReview?.score || null,
    ownerNotes: ownerReview?.notes || null,
    clientRating: avgClientRating,
    clientFeedbackCount: feedback.length,
  };
}

/**
 * Get quality trends over time (for dashboard).
 */
export function getQualityTrends(): {
  overall: { avgAutoScore: number; avgOwnerScore: number; avgClientRating: number; passRate: string };
  byType: Record<string, { avgScore: number; count: number }>;
  recentIssues: Array<{ issue: string; count: number }>;
} {
  const autoScores = qualityScores.map(q => q.finalScore);
  const ownerScores = ownerReviews.map(r => r.score);
  const clientRatings = clientFeedbacks.map(f => f.rating);
  const passCount = qualityScores.filter(q => q.passed).length;

  // Count most common issues
  const issueCount: Record<string, number> = {};
  for (const qs of qualityScores) {
    for (const issue of qs.issues) {
      issueCount[issue.name] = (issueCount[issue.name] || 0) + 1;
    }
  }
  const recentIssues = Object.entries(issueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }));

  return {
    overall: {
      avgAutoScore: autoScores.length > 0
        ? Math.round(autoScores.reduce((a, b) => a + b, 0) / autoScores.length)
        : 0,
      avgOwnerScore: ownerScores.length > 0
        ? Math.round((ownerScores.reduce((a, b) => a + b, 0) / ownerScores.length) * 10) / 10
        : 0,
      avgClientRating: clientRatings.length > 0
        ? Math.round((clientRatings.reduce((a, b) => a + b, 0) / clientRatings.length) * 10) / 10
        : 0,
      passRate: qualityScores.length > 0
        ? `${Math.round((passCount / qualityScores.length) * 100)}%`
        : '0%',
    },
    byType: {}, // Will be populated when we track deliverable types
    recentIssues,
  };
}

/**
 * Get all quality data for dashboard display.
 */
export function getQualityDashboard() {
  return {
    trends: getQualityTrends(),
    thresholds: THRESHOLDS,
    totalAssessed: qualityScores.length,
    totalOwnerReviews: ownerReviews.length,
    totalClientFeedback: clientFeedbacks.length,
  };
}
