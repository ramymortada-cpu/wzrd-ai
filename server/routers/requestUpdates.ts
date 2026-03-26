/**
 * Request Updates Router — timeline entries for service requests.
 *
 * Endpoints:
 * - requestUpdates.listByRequest → get all updates for a request (client: visible only; admin: all)
 * - requestUpdates.create        → admin: add a new update/note to a request
 * - requestUpdates.setVisibility → admin: toggle client visibility of an update
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { getDb } from "../db/index";
import { requestUpdates, serviceRequests } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const UPDATE_TYPE_VALUES = [
  "status_change",
  "info_request",
  "file_upload",
  "meeting",
  "note",
  "delivery",
] as const;

export const requestUpdatesRouter = router({
  /**
   * List updates for a request.
   * - Regular users: only client-visible updates for their own requests.
   * - Admins: all updates for any request.
   */
  listByRequest: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const user = ctx.user!;
      const isAdmin = user.role === "admin";

      if (isAdmin) {
        // Admin sees all updates
        return db
          .select()
          .from(requestUpdates)
          .where(eq(requestUpdates.requestId, input.requestId))
          .orderBy(desc(requestUpdates.createdAt));
      }

      // Regular user: verify they own the request first
      const [request] = await db
        .select({ id: serviceRequests.id })
        .from(serviceRequests)
        .where(
          and(
            eq(serviceRequests.id, input.requestId),
            eq(serviceRequests.userId, user.id)
          )
        );

      if (!request) return [];

      return db
        .select()
        .from(requestUpdates)
        .where(
          and(
            eq(requestUpdates.requestId, input.requestId),
            eq(requestUpdates.isClientVisible, 1)
          )
        )
        .orderBy(desc(requestUpdates.createdAt));
    }),

  /** Admin: add a new update to a service request */
  create: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        status: z.string().min(1).max(50),
        title: z.string().min(1).max(255),
        titleAr: z.string().min(1).max(255),
        detail: z.string().max(2000).optional(),
        detailAr: z.string().max(2000).optional(),
        updateType: z.enum(UPDATE_TYPE_VALUES).default("note"),
        fileUrl: z.string().max(500).optional(),
        fileName: z.string().max(255).optional(),
        meetingLink: z.string().max(500).optional(),
        meetingDate: z.string().datetime().optional(),
        isClientVisible: z.boolean().default(true),
        createdBy: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(requestUpdates).values({
        requestId: input.requestId,
        status: input.status,
        title: input.title,
        titleAr: input.titleAr,
        detail: input.detail ?? null,
        detailAr: input.detailAr ?? null,
        updateType: input.updateType,
        fileUrl: input.fileUrl ?? null,
        fileName: input.fileName ?? null,
        meetingLink: input.meetingLink ?? null,
        meetingDate: input.meetingDate ? new Date(input.meetingDate) : null,
        isClientVisible: input.isClientVisible ? 1 : 0,
        createdBy: input.createdBy ?? (ctx.user as any)?.name ?? "admin",
      });

      logger.info(
        { requestId: input.requestId, updateType: input.updateType, status: input.status },
        "Request update created"
      );

      return { success: true };
    }),

  /** Admin: toggle client visibility of an update */
  setVisibility: protectedProcedure
    .input(
      z.object({
        updateId: z.number().int().positive(),
        isClientVisible: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(requestUpdates)
        .set({ isClientVisible: input.isClientVisible ? 1 : 0 })
        .where(eq(requestUpdates.id, input.updateId));

      logger.info(
        { updateId: input.updateId, isClientVisible: input.isClientVisible },
        "Request update visibility changed"
      );

      return { success: true };
    }),
});
