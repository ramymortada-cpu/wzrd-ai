/**
 * AI Conversations Router — list, get, update conversations.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { getAiConversationsByProject, getAiConversationById, updateAiConversation, createAiConversation } from "../db";

export const conversationsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.projectId) return getAiConversationsByProject(input.projectId);
      return [];
    }),
  save: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      clientId: z.number().optional(),
      context: z.string().optional(),
      messages: z.array(z.any()),
      title: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const result = await createAiConversation({
        projectId: input.projectId ?? null,
        clientId: input.clientId ?? null,
        context: (input.context ?? 'general') as 'general' | 'business_health_check' | 'starting_business_logic' | 'brand_identity' | 'business_takeoff' | 'consultation',
        messages: input.messages,
        title: input.title ?? 'Conversation',
      });
      return { id: result.id };
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => getAiConversationById(input.id)),
  update: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), title: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => { checkEditor(ctx); const { id, ...data } = input; await updateAiConversation(id, data); return { success: true }; }),
});
