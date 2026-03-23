/** Revisions Router — deliverable revisions (admin + public portal). */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { hashToken } from "../_core/tokenSecurity";
import {
  createDeliverableRevision,
  getDeliverableRevisions,
  getLatestRevisionVersion,
  getDeliverablesByProject,
  getPortalTokenByToken,
} from "../db";

export const revisionsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        deliverableId: z.number().int().positive(),
        content: z.string().min(1).max(50000),
        changeType: z.enum(["initial", "ai_regenerated", "manual_edit", "client_revision", "quality_update"]),
        changeSummary: z.string().max(500).optional(),
        changedBy: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const version = (await getLatestRevisionVersion(input.deliverableId)) + 1;
      return createDeliverableRevision({
        deliverableId: input.deliverableId,
        version,
        content: input.content,
        changeType: input.changeType,
        changeSummary: input.changeSummary ?? null,
        changedBy: input.changedBy ?? (ctx.user?.name ?? "System"),
      });
    }),

  list: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => getDeliverableRevisions(input.deliverableId)),

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
      return getDeliverableRevisions(input.deliverableId);
    }),
});
