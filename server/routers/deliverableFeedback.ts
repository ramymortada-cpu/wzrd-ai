/** Deliverable Feedback Router — client ratings on deliverables (portal + admin). */
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { createDeliverableFeedback, getDeliverableFeedbacks } from "../db";

export const deliverableFeedbackRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        deliverableId: z.number().int().positive(),
        clientId: z.number().int().positive().optional(),
        comment: z.string().min(1).max(5000),
        rating: z.number().int().min(1).max(5).optional(),
      })
    )
    .mutation(async ({ input }) => createDeliverableFeedback(input)),

  getByDeliverable: protectedProcedure
    .input(z.object({ deliverableId: z.number().int().positive() }))
    .query(async ({ input }) => getDeliverableFeedbacks(input.deliverableId)),
});
