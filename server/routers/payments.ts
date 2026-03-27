/**
 * Payments Router — financial tracking.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner, requireWorkspaceRole } from "../_core/authorization";
import { z } from "zod";
import { createPaymentInput } from "@shared/validators";
import { createPayment, getPaymentsByProject, getPaymentsByClient, getAllPayments, updatePayment } from "../db";

export const paymentsRouter = router({
  getByProject: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(async ({ input, ctx }) => { checkOwner(ctx); return getPaymentsByProject(input.projectId, ctx.workspaceId); }),
  getByClient: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input, ctx }) => { checkOwner(ctx); return getPaymentsByClient(input.clientId, ctx.workspaceId); }),
  getAll: protectedProcedure.query(async ({ ctx }) => { checkOwner(ctx); return getAllPayments(ctx.workspaceId); }),
  create: protectedProcedure.input(createPaymentInput).mutation(async ({ input, ctx }) => { checkOwner(ctx); requireWorkspaceRole(ctx, "editor"); return createPayment({ ...input, workspaceId: ctx.workspaceId }); }),
  update: protectedProcedure
    .input(z.object({ id: z.number(), amount: z.string().max(20).optional(), status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(), paidDate: z.date().optional(), description: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => { checkOwner(ctx); const { id, ...data } = input; await updatePayment(id, data); return { success: true }; }),
});
