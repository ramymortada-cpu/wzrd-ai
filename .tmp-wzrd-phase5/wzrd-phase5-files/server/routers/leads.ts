/**
 * Public lead capture — Lead Magnet on Welcome (no auth).
 */
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db/index";
import { leadMagnetSubscribers } from "../../drizzle/schema";

function isDuplicateEmailError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Duplicate") || msg.includes("ER_DUP_ENTRY")) return true;
  const o = err as { code?: string; errno?: number; cause?: { errno?: number } };
  if (o.code === "ER_DUP_ENTRY" || o.errno === 1062) return true;
  if (o.cause && typeof o.cause === "object" && o.cause.errno === 1062) return true;
  return false;
}

export const leadsRouter = router({
  subscribeToLeadMagnet: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true as const };

      try {
        await db.insert(leadMagnetSubscribers).values({
          email: input.email.trim().toLowerCase(),
        });
      } catch (e) {
        if (!isDuplicateEmailError(e)) {
          // Still return success — never leak DB errors to the client
        }
      }

      return { success: true as const };
    }),
});
