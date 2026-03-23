/** Approvals Router — deliverable approvals (admin + public portal). */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { hashToken } from "../_core/tokenSecurity";
import {
  createDeliverableApproval,
  getDeliverableApprovals,
  getLatestApproval,
  getDeliverablesByProject,
  getPortalTokenByToken,
  updateDeliverable,
} from "../db";

export const approvalsRouter = router({
  list: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => getDeliverableApprovals(input.deliverableId)),

  latest: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => getLatestApproval(input.deliverableId)),

  publicSubmit: publicProcedure
    .input(
      z.object({
        token: z.string().max(255),
        deliverableId: z.number().int().positive(),
        decision: z.enum(["approved", "changes_requested"]),
        reason: z.string().max(5000).optional(),
        clientName: z.string().min(1).max(255),
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
      const result = await createDeliverableApproval({
        deliverableId: input.deliverableId,
        decision: input.decision,
        reason: input.reason,
        clientName: input.clientName,
        version: input.version,
      });
      if (input.decision === "approved" && result) {
        await updateDeliverable(input.deliverableId, { status: "approved" });
      }
      return result;
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
      return getDeliverableApprovals(input.deliverableId);
    }),
});
