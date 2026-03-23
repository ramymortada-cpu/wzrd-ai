/**
 * Proposal Acceptance Router — client-facing proposal accept/reject (public or protected).
 */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createProposalAcceptance, updateProposal, getProposalAcceptances } from "../db";

export const proposalAcceptanceRouter = router({
  submit: publicProcedure
    .input(z.object({
      proposalId: z.number(),
      clientId: z.number(),
      decision: z.enum(["accepted", "rejected", "revision_requested"]),
      signatureName: z.string().min(1).max(255),
      signatureTitle: z.string().max(255).optional(),
      feedback: z.string().max(5000).optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await createProposalAcceptance({
        proposalId: input.proposalId,
        clientId: input.clientId,
        decision: input.decision,
        signatureName: input.signatureName,
        signatureTitle: input.signatureTitle ?? null,
        feedback: input.feedback ?? null,
      });
      if (input.decision === "accepted") {
        await updateProposal(input.proposalId, { status: "accepted" });
      } else if (input.decision === "rejected") {
        await updateProposal(input.proposalId, { status: "rejected" });
      }
      return result;
    }),

  getByProposal: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ input }) => getProposalAcceptances(input.proposalId)),
});
