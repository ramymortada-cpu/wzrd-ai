/** Diff Router — revision comparison (admin + public portal). */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { hashToken } from "../_core/tokenSecurity";
import { getRevisionPair, getDeliverablesByProject, getPortalTokenByToken } from "../db";

export const diffRouter = router({
  compare: publicProcedure
    .input(
      z.object({
        token: z.string().max(255),
        deliverableId: z.number().int().positive(),
        versionA: z.number().int().positive(),
        versionB: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const portalToken = await getPortalTokenByToken(hashToken(input.token));
      if (!portalToken) throw new Error("Invalid or expired portal link");
      const deliverables = await getDeliverablesByProject(portalToken.projectId);
      if (!deliverables.some((d: { id: number }) => d.id === input.deliverableId)) {
        throw new Error("Deliverable not found in this project");
      }
      const pair = await getRevisionPair(input.deliverableId, input.versionA, input.versionB);
      return { versionA: pair.revA, versionB: pair.revB };
    }),

  adminCompare: protectedProcedure
    .input(
      z.object({
        deliverableId: z.number().int().positive(),
        versionA: z.number().int().positive(),
        versionB: z.number().int().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      checkEditor(ctx);
      const pair = await getRevisionPair(input.deliverableId, input.versionA, input.versionB);
      return { versionA: pair.revA, versionB: pair.revB };
    }),
});
