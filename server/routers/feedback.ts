/** Feedback Router — deliverable feedback, comments, approvals. */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { commentInput } from "@shared/validators";
import { sanitizeObject } from "../_core/sanitize";
import { createDeliverableFeedback, getDeliverableFeedbacks, createDeliverableComment, getDeliverableComments, updateDeliverableComment, resolveDeliverableComment, deleteDeliverableComment, createDeliverableApproval, getDeliverableApprovals, getLatestApproval, getRevisionPair } from "../db";

export const feedbackRouter = router({
  getFeedbacks: protectedProcedure.input(z.object({ deliverableId: z.number().int().positive() })).query(async ({ input }) => getDeliverableFeedbacks(input.deliverableId)),
  createFeedback: protectedProcedure.input(z.object({ deliverableId: z.number(), comment: z.string().min(1).max(5000), rating: z.number().min(1).max(5).optional() })).mutation(async ({ input, ctx }) => createDeliverableFeedback(input)),
  getComments: protectedProcedure.input(z.object({ deliverableId: z.number().int().positive() })).query(async ({ input }) => getDeliverableComments(input.deliverableId)),
  addComment: protectedProcedure.input(commentInput).mutation(async ({ input, ctx }) => { checkEditor(ctx); const sanitized = sanitizeObject(input); return createDeliverableComment(sanitized); }),
  updateComment: protectedProcedure.input(z.object({ id: z.number(), comment: z.string().min(1).max(5000) })).mutation(async ({ input, ctx }) => { checkEditor(ctx); await updateDeliverableComment(input.id, { comment: input.comment }); return { success: true }; }),
  resolveComment: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => { checkEditor(ctx); await resolveDeliverableComment(input.id); return { success: true }; }),
  deleteComment: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => { checkEditor(ctx); await deleteDeliverableComment(input.id); return { success: true }; }),
  getApprovals: protectedProcedure.input(z.object({ deliverableId: z.number().int().positive() })).query(async ({ input }) => getDeliverableApprovals(input.deliverableId)),
  latestApproval: protectedProcedure.input(z.object({ deliverableId: z.number().int().positive() })).query(async ({ input }) => getLatestApproval(input.deliverableId)),
  compare: publicProcedure.input(z.object({ deliverableId: z.number(), versionA: z.number(), versionB: z.number() })).query(async ({ input }) => getRevisionPair(input.deliverableId, input.versionA, input.versionB)),
  publicList: publicProcedure.input(z.object({ deliverableId: z.number().int().positive() })).query(async ({ input }) => getDeliverableComments(input.deliverableId)),
  publicCreate: publicProcedure.input(z.object({ deliverableId: z.number(), authorName: z.string().min(1).max(255), comment: z.string().min(1).max(5000), parentId: z.number().optional(), version: z.number().optional() })).mutation(async ({ input, ctx }) => createDeliverableComment({ ...input, authorType: 'client' })),
  publicSubmit: publicProcedure.input(z.object({ deliverableId: z.number(), decision: z.enum(["approved", "changes_requested"]), reason: z.string().max(5000).optional(), clientName: z.string().min(1).max(255), version: z.number().optional() })).mutation(async ({ input, ctx }) => createDeliverableApproval(input)),
});
