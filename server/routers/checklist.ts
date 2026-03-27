import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { findLatestChecklistForUserTool, toggleChecklistItemForUser } from "../db/checklist";

export const checklistRouter = router({
  /** Latest saved checklist for this tool + user (pairs with latest diagnosis row). */
  forTool: protectedProcedure
    .input(z.object({ toolId: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      return findLatestChecklistForUserTool(ctx.user!.id, input.toolId);
    }),

  toggleItem: protectedProcedure
    .input(
      z.object({
        checklistId: z.number().int().positive(),
        itemIndex: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return toggleChecklistItemForUser(ctx.user!.id, input.checklistId, input.itemIndex);
    }),
});
