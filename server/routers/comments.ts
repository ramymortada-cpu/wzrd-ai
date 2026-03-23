/** Comments Router — deliverable comments (admin + public portal). */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { sanitizeObject } from "../_core/sanitize";
import { hashToken } from "../_core/tokenSecurity";
import {
  createDeliverableComment,
  getDeliverableComments,
  resolveDeliverableComment,
  deleteDeliverableComment,
  getDeliverablesByProject,
  getPortalTokenByToken,
} from "../db";

function buildThreadedComments(flat: any[]): any[] {
  const byId = new Map<number, any>();
  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots: any[] = [];
  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export const commentsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        deliverableId: z.number().int().positive(),
        comment: z.string().min(1).max(5000),
        authorType: z.enum(["owner", "team", "client"]),
        authorName: z.string().min(1).max(255),
        parentId: z.number().int().positive().optional(),
        version: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const sanitized = sanitizeObject(input);
      return createDeliverableComment(sanitized);
    }),

  list: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const flat = await getDeliverableComments(input.deliverableId);
      return buildThreadedComments(flat);
    }),

  resolve: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      await resolveDeliverableComment(input.id);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      await deleteDeliverableComment(input.id);
      return { success: true };
    }),

  publicList: publicProcedure
    .input(
      z.object({
        token: z.string().max(255),
        deliverableId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error("Invalid or expired portal link");
      const deliverables = await getDeliverablesByProject(portalToken.projectId);
      if (!deliverables.some((d: { id: number }) => d.id === input.deliverableId)) {
        throw new Error("Deliverable not found in this project");
      }
      const flat = await getDeliverableComments(input.deliverableId);
      return buildThreadedComments(flat);
    }),

  publicCreate: publicProcedure
    .input(
      z.object({
        token: z.string().max(255),
        deliverableId: z.number().int().positive(),
        comment: z.string().min(1).max(5000),
        authorName: z.string().min(1).max(255),
        parentId: z.number().int().positive().optional(),
        version: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error("Invalid or expired portal link");
      const deliverables = await getDeliverablesByProject(portalToken.projectId);
      if (!deliverables.some((d: { id: number }) => d.id === input.deliverableId)) {
        throw new Error("Deliverable not found in this project");
      }
      return createDeliverableComment({
        deliverableId: input.deliverableId,
        authorType: "client",
        authorName: input.authorName,
        comment: input.comment,
        parentId: input.parentId,
        version: input.version,
      });
    }),
});
