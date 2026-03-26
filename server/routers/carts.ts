/**
 * Abandoned Carts Router — track premium purchase attempts that didn't complete.
 *
 * Endpoints:
 * - carts.track      → record a cart click (create or update)
 * - carts.myPending  → list user's incomplete carts
 * - carts.complete   → mark a cart as completed after successful purchase
 * - carts.listAll    → admin: list all abandoned carts for follow-up
 * - carts.markFollowUpSent → admin: mark follow-up email as sent
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { getDb } from "../db/index";
import { abandonedCarts } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const cartsRouter = router({
  /** Record a cart click — creates a new abandoned cart entry */
  track: protectedProcedure
    .input(
      z.object({
        productType: z.string().min(1).max(50),
        amountEgp: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(abandonedCarts).values({
        userId: ctx.user!.id,
        productType: input.productType,
        amountEgp: input.amountEgp,
        completed: 0,
        followUpSent: 0,
      });

      logger.info(
        { userId: ctx.user!.id, productType: input.productType, amountEgp: input.amountEgp },
        "Abandoned cart tracked"
      );

      return { success: true };
    }),

  /** List current user's incomplete (abandoned) carts */
  myPending: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const carts = await db
      .select()
      .from(abandonedCarts)
      .where(
        and(
          eq(abandonedCarts.userId, ctx.user!.id),
          eq(abandonedCarts.completed, 0)
        )
      )
      .orderBy(desc(abandonedCarts.createdAt))
      .limit(20);

    return carts;
  }),

  /** Mark a cart as completed (called after successful payment) */
  complete: protectedProcedure
    .input(z.object({ cartId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(abandonedCarts)
        .set({ completed: 1 })
        .where(
          and(
            eq(abandonedCarts.id, input.cartId),
            eq(abandonedCarts.userId, ctx.user!.id)
          )
        );

      logger.info({ cartId: input.cartId, userId: ctx.user!.id }, "Cart marked as completed");

      return { success: true };
    }),

  /** Admin: list all abandoned (incomplete) carts for follow-up */
  listAll: protectedProcedure
    .input(
      z
        .object({
          onlyAbandoned: z.boolean().default(true),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return [];

      const query = db
        .select()
        .from(abandonedCarts)
        .orderBy(desc(abandonedCarts.createdAt))
        .limit(input?.limit ?? 100);

      if (input?.onlyAbandoned !== false) {
        return db
          .select()
          .from(abandonedCarts)
          .where(eq(abandonedCarts.completed, 0))
          .orderBy(desc(abandonedCarts.createdAt))
          .limit(input?.limit ?? 100);
      }

      return query;
    }),

  /** Admin: mark follow-up email as sent for a cart */
  markFollowUpSent: protectedProcedure
    .input(z.object({ cartId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(abandonedCarts)
        .set({ followUpSent: 1 })
        .where(eq(abandonedCarts.id, input.cartId));

      logger.info({ cartId: input.cartId }, "Cart follow-up marked as sent");

      return { success: true };
    }),
});
