/**
 * Public lead capture — merge additional procedures into this router as needed.
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { leadMagnetSubscribers } from "../../drizzle/schema";

export const leadsRouter = router({
  subscribeToLeadMagnet: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true };

      try {
        await db.insert(leadMagnetSubscribers).values({
          email: input.email,
          source: "home_guide_2026",
        });
      } catch (err: unknown) {
        const isDuplicate =
          (err instanceof Error && err.message.includes("Duplicate entry")) ||
          (typeof err === "object" &&
            err !== null &&
            "code" in err &&
            (err as { code: string }).code === "ER_DUP_ENTRY");
        if (!isDuplicate) throw err;
      }
      return { success: true };
    }),
});
