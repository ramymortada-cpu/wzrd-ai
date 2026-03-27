/**
 * Deliverables Router — CRUD + AI generation + quality gates + templates.
 * Extracted from monolithic routers.ts (lines 158-674).
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor, checkOwner } from "../_core/authorization";
import { z } from "zod";
import { sanitizeObject } from "../_core/sanitize";
import { audit } from "../_core/audit";
import { logger } from "../_core/logger";
import { resilientLLM } from "../_core/llmRouter";
import { generateAndUploadPDF, getQualityChecklist } from "../pdfGenerator";
import { generateImage } from "../_core/imageGeneration";
import { matchTemplate, getAvailableTemplates } from "../templateEngine";
import { buildSystemPrompt } from "../knowledgeBase";
import { reviewDeliverable, quickQualityCheck } from "../qualityAssurance";
import { assessDeliverableQuality, getQualityLabel } from "../qualityFeedback";
import { validateFile, generateFileKey, getPresignedUploadUrl } from "../_core/fileUpload";
import {
  getDeliverablesByProject, updateDeliverable, deleteDeliverable, listAllDeliverables,
  createDeliverableRevision, getLatestRevisionVersion,
} from "../db";
import type { Deliverable } from "../../drizzle/schema";

export const deliverablesRouter = router({
  list: protectedProcedure.query(async () => listAllDeliverables()),

  getByProject: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ input }) => getDeliverablesByProject(input.projectId)),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().max(500).optional(),
      description: z.string().max(2000).optional(),
      stage: z.enum(["diagnose", "design", "deploy", "optimize"]).optional(),
      status: z.enum(["pending", "in_progress", "ai_generated", "review", "approved", "delivered"]).optional(),
      content: z.string().max(50000).optional(),
      sortOrder: z.number().int().min(0).max(999).optional(),
      fileUrl: z.string().max(2000).optional(),
      fileKey: z.string().max(255).optional(),
      fileType: z.string().max(50).optional(),
      qualityScore: z.number().int().min(0).max(100).optional(),
      qualityChecklist: z.any().optional(),
      reviewNotes: z.string().max(10000).optional(),
      imageUrls: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const { id, ...data } = sanitizeObject(input);

      // Auto-QA: if content is being updated, run quality check
      if (data.content && data.content.length > 100) {
        const qa = quickQualityCheck(data.content);
        data.qualityScore = qa.score;
        if (!qa.passed) {
          logger.warn({ deliverableId: id, qaScore: qa.score, issue: qa.topIssue }, 'Deliverable below quality threshold');
        }
      }

      await updateDeliverable(id, data);
      await audit('deliverables', id, 'update', ctx.user?.id);
      return { success: true };
    }),

  /** Deep QA review — rule-based + AI review */
  qualityReview: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      deepReview: z.boolean().default(false),
      clientName: z.string().max(255).optional(),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const deliverables = await listAllDeliverables();
      const deliverable = deliverables.find((d: Deliverable) => d.id === input.id);
      if (!deliverable?.content) throw new Error('Deliverable has no content to review');

      const result = await reviewDeliverable(deliverable.content, {
        deepReview: input.deepReview,
        deliverableType: deliverable.title,
        clientName: input.clientName,
        industry: input.industry,
        market: input.market,
      });

      // Save the QA score back to the deliverable
      await updateDeliverable(input.id, {
        qualityScore: result.score,
        qualityChecklist: { checks: result.checks, aiReview: result.aiReview },
      });

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx); // Only owner can delete deliverables
      await deleteDeliverable(input.id);
      await audit('deliverables', input.id, 'delete', ctx.user?.id);
      return { success: true };
    }),

  generateWithAI: protectedProcedure
    .input(z.object({
      deliverableId: z.number(),
      projectId: z.number(),
      clientId: z.number().optional(),
      title: z.string().max(500),
      stage: z.string().max(50),
      serviceType: z.string().max(100),
      clientContext: z.string().max(10000).optional(),
      language: z.enum(["en", "ar"]).default("en"),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const systemPrompt = buildSystemPrompt({
        mode: 'deliverable',
        serviceType: input.serviceType,
        clientContext: input.clientContext,
        projectStage: input.stage,
      });
      const userPrompt = `Generate the deliverable: "${input.title}" for stage: ${input.stage}.\nService: ${input.serviceType}\n${input.clientContext ? `Client Context: ${input.clientContext}` : ''}\nLanguage: ${input.language === 'ar' ? 'Arabic' : 'English'}`;
      
      const response = await resilientLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }, { context: 'chat' });
      const content = response.choices[0].message.content as string;
      
      await updateDeliverable(input.deliverableId, {
        content,
        status: 'ai_generated',
        aiGenerated: 1,
      });

      // Save as revision
      const version = (await getLatestRevisionVersion(input.deliverableId)) + 1;
      await createDeliverableRevision({
        deliverableId: input.deliverableId,
        version,
        content,
        changeType: version === 1 ? 'initial' : 'ai_regenerated',
        changeSummary: `AI generated for "${input.title}"`,
        changedBy: 'ai',
      });

      logger.info({ deliverableId: input.deliverableId, title: input.title }, 'AI generated deliverable');

      // ── AUTO QUALITY CHECK ──
      let qualityScore = 0;
      let qualityLabel = 'pending';
      try {
        const qa = await assessDeliverableQuality(content, input.deliverableId, input.serviceType, { skipAI: true });
        qualityScore = qa.finalScore;
        qualityLabel = getQualityLabel(qa.finalScore).label;

        // Auto-reject: score < 55 → re-generate once
        if (qa.finalScore < 55 && version <= 1) {
          logger.warn({ deliverableId: input.deliverableId, score: qa.finalScore }, 'Deliverable auto-rejected — re-generating');
          const retry = await resilientLLM({
            messages: [
              { role: 'system', content: systemPrompt + '\n\nIMPORTANT: Previous version was rejected for low quality. Issues: ' + qa.issues.map(i => i.name).join(', ') + '. Make it MORE specific, MORE actionable, and MORE data-driven.' },
              { role: 'user', content: userPrompt },
            ],
          }, { context: 'chat' });
          const retryContent = retry.choices[0].message.content as string;
          await updateDeliverable(input.deliverableId, { content: retryContent, qualityScore: qa.finalScore });
          return { content: retryContent, version, qualityScore: qa.finalScore, qualityLabel, regenerated: true };
        }

        // Update deliverable with quality score
        await updateDeliverable(input.deliverableId, { qualityScore });
      } catch (err) {
        logger.warn({ err, deliverableId: input.deliverableId }, 'Auto QA check failed — delivering without score');
      }

      return { content, version, qualityScore, qualityLabel };
    }),

  generatePDF: protectedProcedure
    .input(z.object({
      deliverableId: z.number(),
      content: z.string().max(50000),
      title: z.string().max(500),
      serviceType: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const result = await generateAndUploadPDF({ content: input.content, title: input.title, serviceType: input.serviceType });
      if (result?.url) {
        await updateDeliverable(input.deliverableId, { fileUrl: result.url, fileKey: result.key, fileType: 'pdf' });
      }
      return result;
    }),

  generateImages: protectedProcedure
    .input(z.object({
      deliverableId: z.number(),
      prompts: z.array(z.string().max(1000)).min(1).max(4),
      style: z.string().max(255).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const imageUrls: string[] = [];
      for (const prompt of input.prompts) {
        try {
          const result = await generateImage({ prompt: input.style ? `${prompt}, ${input.style}` : prompt });
          if (result?.url) imageUrls.push(result.url);
        } catch (e) { logger.warn({ err: e, prompt }, 'Image generation failed'); }
      }
      if (imageUrls.length > 0) {
        await updateDeliverable(input.deliverableId, { imageUrls });
      }
      return { imageUrls };
    }),

  initQualityGate: protectedProcedure
    .input(z.object({ deliverableId: z.number(), title: z.string().max(500), serviceType: z.string().max(100).optional() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const checklist = getQualityChecklist(input.title);
      await updateDeliverable(input.deliverableId, { qualityChecklist: checklist, qualityScore: 0 });
      return { checklist };
    }),

  updateQualityGate: protectedProcedure
    .input(z.object({
      deliverableId: z.number(),
      checklist: z.array(z.object({ item: z.string().max(500), checked: z.boolean(), notes: z.string().max(1000).optional() })),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const score = Math.round((input.checklist.filter(c => c.checked).length / input.checklist.length) * 100);
      await updateDeliverable(input.deliverableId, { qualityChecklist: input.checklist, qualityScore: score });
      return { score, checklist: input.checklist };
    }),

  addReviewNotes: protectedProcedure
    .input(z.object({ deliverableId: z.number(), notes: z.string().max(10000) }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      await updateDeliverable(input.deliverableId, { reviewNotes: input.notes });
      return { success: true };
    }),

  getTemplates: protectedProcedure.query(async () => getAvailableTemplates()),

  matchTemplate: protectedProcedure
    .input(z.object({ title: z.string().max(500), serviceType: z.string().max(100).optional(), stage: z.string().max(50).optional() }))
    .query(async ({ input }) => matchTemplate(input.title, [input.serviceType, input.stage].filter(Boolean).join(' '))),

  /** Validate a file before upload */
  validateUpload: protectedProcedure
    .input(z.object({
      fileName: z.string().max(255),
      fileSize: z.number().int().positive(),
      fileType: z.string().max(100),
      context: z.enum(['portal', 'internal']).default('internal'),
    }))
    .query(({ input }) => {
      return validateFile(
        { name: input.fileName, size: input.fileSize, type: input.fileType },
        input.context
      );
    }),

  /** Get a presigned upload URL for S3 */
  getUploadUrl: protectedProcedure
    .input(z.object({
      projectId: z.number().int().positive().optional(),
      fileName: z.string().max(255),
      fileType: z.string().max(100),
      context: z.string().max(50).default('deliverable'),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const key = generateFileKey(input.context, input.projectId || null, input.fileName);
      const result = await getPresignedUploadUrl(key, input.fileType);
      return result;
    }),
});
