/**
 * Pipeline Router — autonomous execution pipeline.
 * 
 * NEW: executeStage triggers auto-execution of agents for any stage.
 * Ramy starts the pipeline → agents auto-research, diagnose, strategize, generate → Ramy reviews.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { createPipelineRun, getPipelineRunById, getPipelineRunsByClient, getAllPipelineRuns, updatePipelineRun, getPipelineAnalytics } from "../db";
import type { InsertPipelineRun } from "../../drizzle/schema";
import { executeStage } from "../autoExecution";

export const pipelineRouter = router({
  /** Start a pipeline run — optionally auto-execute immediately */
  start: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      projectId: z.number(),
      serviceType: z.enum(["business_health_check", "starting_business_logic", "brand_identity", "business_takeoff", "consultation"]),
      autoApprove: z.boolean().default(false),
      /** If true, starts auto-executing the first stage immediately */
      autoExecute: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const runId = await createPipelineRun({
        clientId: input.clientId, projectId: input.projectId,
        serviceType: input.serviceType, status: 'pending',
        autoApprove: input.autoApprove ? 1 : 0, startedAt: new Date(),
      });

      logger.info({ runId, service: input.serviceType, autoExecute: input.autoExecute }, 'Pipeline started');

      // Auto-execute first stage if requested (fire-and-forget)
      if (input.autoExecute) {
        executeStage(input.projectId, 'diagnose', runId)
          .then(result => {
            logger.info({ runId, stage: 'diagnose', status: result.status, steps: result.stepsCompleted }, 'Auto-execution of diagnose completed');
          })
          .catch(err => {
            logger.error({ err, runId }, 'Auto-execution of diagnose failed');
          });
      }

      return { runId };
    }),

  /** Execute a specific stage for a project */
  executeStage: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      stage: z.enum(["diagnose", "design", "deploy", "optimize"]),
      pipelineRunId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      return executeStage(input.projectId, input.stage, input.pipelineRunId);
    }),

  getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getPipelineRunById(input.id)),
  getByClient: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input }) => getPipelineRunsByClient(input.clientId)),
  list: protectedProcedure.query(async () => getAllPipelineRuns()),
  update: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(['pending', 'completed', 'failed', 'paused', 'researching', 'diagnosing', 'strategizing', 'generating', 'reviewing']).optional(), currentStep: z.number().optional(), errorMessage: z.string().max(5000).optional() })).mutation(async ({ input, ctx }) => { checkEditor(ctx); const { id, ...data } = input; await updatePipelineRun(id, data as Partial<InsertPipelineRun>); return { success: true }; }),
  analytics: protectedProcedure.query(async () => getPipelineAnalytics()),
});
