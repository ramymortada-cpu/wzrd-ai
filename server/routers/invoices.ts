import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { requireWorkspaceRole } from "../_core/authorization";
import { createInvoice, getInvoiceById, listInvoices, markInvoicePaid } from "../db";

export const invoicesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    requireWorkspaceRole(ctx, "viewer");
    return listInvoices(ctx.workspaceId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "viewer");
      return getInvoiceById(input.id, ctx.workspaceId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number().int().positive(),
        projectId: z.number().int().positive().optional(),
        amount: z.string().min(1).max(20),
        currency: z.string().max(10).default("EGP"),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "editor");
      return createInvoice({
        workspaceId: ctx.workspaceId,
        clientId: input.clientId,
        projectId: input.projectId ?? null,
        amount: input.amount,
        currency: input.currency,
        dueDate: input.dueDate ?? null,
        status: "open",
      });
    }),

  markAsPaid: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      requireWorkspaceRole(ctx, "editor");
      await markInvoicePaid(input.id, ctx.workspaceId);
      return { success: true as const };
    }),
});
