/**
 * Notes Router — client notes CRUD.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { sanitizeObject } from "../_core/sanitize";
import { createClientNote, getNotesByClient, getNotesByProject, updateClientNote, deleteClientNote, getAllNotes } from "../db";

export const notesRouter = router({
  list: protectedProcedure.query(async () => getAllNotes()),
  getByClient: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input }) => getNotesByClient(input.clientId)),
  getByProject: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ input }) => getNotesByProject(input.projectId)),
  create: protectedProcedure
    .input(z.object({ clientId: z.number(), projectId: z.number().optional(), title: z.string().min(1).max(500), content: z.string().min(1).max(10000), category: z.enum(["diagnostic", "strategic", "meeting", "insight", "general"]).default("general") }))
    .mutation(async ({ input, ctx }) => { checkEditor(ctx); const sanitized = sanitizeObject(input); return createClientNote(sanitized); }),
  update: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().max(500).optional(), content: z.string().max(10000).optional(), category: z.enum(["diagnostic", "strategic", "meeting", "insight", "general"]).optional() }))
    .mutation(async ({ input, ctx }) => { checkEditor(ctx); const { id, ...data } = sanitizeObject(input); await updateClientNote(id, data); return { success: true }; }),
  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => { checkEditor(ctx); await deleteClientNote(input.id); return { success: true }; }),
});
