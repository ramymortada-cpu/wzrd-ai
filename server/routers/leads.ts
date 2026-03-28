/**
 * Public lead capture.
 * If your repo already exports `leadsRouter` with `submitQuickCheck` etc., merge this
 * `subscribeToLeadMagnet` into that same `router({ ... })` object instead of replacing the file.
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { leadMagnetSubscribers } from "../db/schema";

export const leadsRouter = router({
  subscribeToLeadMagnet: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) return { success: true as const };

      try {
        await database.insert(leadMagnetSubscribers).values({
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
      return { success: true as const };
    }),
});
