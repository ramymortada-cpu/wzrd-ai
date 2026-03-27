import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { requireWorkspaceRole } from "../_core/authorization";
import { createContract, getContractById, listContracts, signContract } from "../db";

export const contractsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requireWorkspaceRole(ctx, "viewer");
    return listContracts(ctx.workspaceId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "viewer");
      return getContractById(input.id, ctx.workspaceId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number().int().positive(),
        projectId: z.number().int().positive().optional(),
        title: z.string().min(2).max(500),
        content: z.string().max(100000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "editor");
      return createContract({
        workspaceId: ctx.workspaceId,
        clientId: input.clientId,
        projectId: input.projectId ?? null,
        title: input.title,
        content: input.content ?? null,
        status: "draft",
      });
    }),

  sign: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), signatureData: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "editor");
      await signContract(input.id, ctx.workspaceId, input.signatureData);
      return { success: true as const };
    }),
});
