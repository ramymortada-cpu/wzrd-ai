/**
 * Quality & LLM Monitoring Router
 * ================================
 * 
 * Endpoints:
 * - quality.assess — Run QA on a deliverable
 * - quality.ownerReview — Ramy rates a deliverable
 * - quality.clientFeedback — Client rates from Portal
 * - quality.getForDeliverable — Get all quality data for a deliverable
 * - quality.dashboard — Quality trends + stats
 * - quality.llmStats — LLM usage, cache hits, provider status
 */

import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import {
  assessDeliverableQuality,
  recordOwnerReview,
  recordClientFeedback,
  getDeliverableQuality,
  getQualityDashboard,
  getClientFeedback,
} from "../qualityFeedback";
import {
  insertQualityScore, insertClientFeedback, updateOwnerReview,
  getQualityScoreByDeliverable, getClientFeedbackByDeliverable,
  getQualityTrendsFromDB, getClientFeedbackStats,
} from "../db";
import { getLLMStats, isLLMHealthy } from "../_core/llmRouter";
import { getCacheStats } from "../_core/llmCache";
import { logger } from "../_core/logger";
import type { ClientFeedbackRow } from "../../drizzle/schema";

export const qualityRouter = router({
  /**
   * Assess a deliverable's quality (auto-scoring).
   * Called automatically when a deliverable is generated, or manually.
   */
  assess: protectedProcedure
    .input(z.object({
      deliverableId: z.number().int().positive(),
      content: z.string().min(10).max(100000),
      type: z.string().max(100).optional(),
      skipAI: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const result = await assessDeliverableQuality(
        input.content,
        input.deliverableId,
        input.type,
        { skipAI: input.skipAI }
      );

      // Persist to DB
      await insertQualityScore({
        deliverableId: input.deliverableId,
        ruleScore: result.ruleScore,
        aiScore: result.aiScore,
        finalScore: result.finalScore,
        passed: result.passed,
        issues: result.issues,
        aiReview: result.aiReview,
        rejectedReason: result.rejectedReason,
      });

      return {
        score: result.finalScore,
        passed: result.passed,
        label: result.finalScore >= 85 ? 'excellent' :
               result.finalScore >= 75 ? 'good' :
               result.finalScore >= 55 ? 'needs_review' : 'rejected',
        issues: result.issues,
        aiReview: result.aiReview,
        rejectedReason: result.rejectedReason,
      };
    }),

  /**
   * Owner (Ramy) reviews a deliverable — 1-5 stars + notes.
   */
  ownerReview: protectedProcedure
    .input(z.object({
      deliverableId: z.number().int().positive(),
      score: z.number().int().min(1).max(5),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      recordOwnerReview({
        deliverableId: input.deliverableId,
        score: input.score,
        notes: input.notes || null,
      });

      // Persist to DB
      await updateOwnerReview(input.deliverableId, input.score, input.notes);

      logger.info({ deliverableId: input.deliverableId, score: input.score }, 'Owner review saved');
      return { success: true };
    }),

  /**
   * Client feedback from the Portal — rating + comments.
   * This is a PUBLIC endpoint (clients access via portal token).
   */
  clientFeedback: publicProcedure
    .input(z.object({
      deliverableId: z.number().int().positive(),
      projectId: z.number().int().positive().optional(),
      clientName: z.string().max(255),
      rating: z.number().int().min(1).max(5),
      positiveNotes: z.string().max(2000).optional(),
      negativeNotes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input }) => {
      recordClientFeedback({
        deliverableId: input.deliverableId,
        projectId: input.projectId || null,
        clientName: input.clientName,
        rating: input.rating,
        positiveNotes: input.positiveNotes || null,
        negativeNotes: input.negativeNotes || null,
      });

      // Persist to DB
      await insertClientFeedback({
        deliverableId: input.deliverableId,
        projectId: input.projectId,
        clientName: input.clientName,
        rating: input.rating,
        positiveNotes: input.positiveNotes,
        negativeNotes: input.negativeNotes,
      });

      return { success: true, message: 'شكراً لملاحظاتك! / Thank you for your feedback!' };
    }),

  /**
   * Get quality data for a specific deliverable (all 3 levels).
   * Checks both in-memory (current session) and DB (persisted).
   */
  getForDeliverable: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => {
      // Try DB first (persisted), fallback to memory
      const dbScore = await getQualityScoreByDeliverable(input.deliverableId);
      const dbFeedback = await getClientFeedbackByDeliverable(input.deliverableId);
      const memoryData = getDeliverableQuality(input.deliverableId);

      return {
        autoScore: dbScore?.finalScore ?? memoryData.autoScore,
        passed: dbScore ? !!dbScore.passed : memoryData.passed,
        ownerScore: dbScore?.ownerScore ?? memoryData.ownerScore,
        ownerNotes: dbScore?.ownerNotes ?? memoryData.ownerNotes,
        clientFeedbackCount: dbFeedback.length || memoryData.clientFeedbackCount,
        clientRating: dbFeedback.length > 0
          ? Math.round((dbFeedback.reduce((s: number, f: ClientFeedbackRow) => s + f.rating, 0) / dbFeedback.length) * 10) / 10
          : memoryData.clientRating,
        issues: memoryData.issues,
        aiReview: memoryData.aiReview,
      };
    }),

  /**
   * Get client feedback for a deliverable.
   */
  getClientFeedbackList: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(({ input }) => {
      return getClientFeedback(input.deliverableId);
    }),

  /**
   * Quality dashboard — trends, stats, common issues.
   */
  dashboard: protectedProcedure.query(async () => {
    const memoryDashboard = getQualityDashboard();
    const dbTrends = await getQualityTrendsFromDB();
    const dbFeedbackStats = await getClientFeedbackStats();

    return {
      ...memoryDashboard,
      db: {
        qualityTrends: dbTrends,
        clientFeedback: dbFeedbackStats,
      },
    };
  }),

  /**
   * LLM usage statistics — calls, cache hits, tokens, costs, provider status.
   */
  llmStats: protectedProcedure.query(() => {
    return {
      ...getLLMStats(),
      healthy: isLLMHealthy(),
    };
  }),

  /**
   * Health check — is the LLM system operational?
   */
  health: publicProcedure.query(() => {
    return {
      llmHealthy: isLLMHealthy(),
      cacheStats: getCacheStats(),
      timestamp: new Date().toISOString(),
    };
  }),
});
