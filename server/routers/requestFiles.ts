/**
 * Request Files Router — file attachments for service requests.
 *
 * Endpoints:
 * - requestFiles.listByRequest → list all files for a request
 * - requestFiles.upload        → admin: attach a file to a request
 * - requestFiles.clientUpload  → client: upload a file to their own request
 * - requestFiles.delete        → admin: remove a file record
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { getDb } from "../db/index";
import { requestFiles, serviceRequests } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const requestFilesRouter = router({
  /**
   * List all files attached to a request.
   * - Regular users: only files for their own requests.
   * - Admins: files for any request.
   */
  listByRequest: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const user = ctx.user!;
      const isAdmin = user.role === "admin";

      if (!isAdmin) {
        // Verify the user owns this request
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
      }

      return db
        .select()
        .from(requestFiles)
        .where(eq(requestFiles.requestId, input.requestId))
        .orderBy(desc(requestFiles.createdAt));
    }),

  /** Admin: attach a file (team delivery) to a service request */
  upload: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        fileName: z.string().min(1).max(255),
        fileUrl: z.string().url().max(500),
        fileType: z.string().max(50).optional(),
        fileSizeKb: z.number().int().positive().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(requestFiles).values({
        requestId: input.requestId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileType: input.fileType ?? null,
        fileSizeKb: input.fileSizeKb ?? null,
        uploadedBy: "team",
        description: input.description ?? null,
      });

      logger.info(
        { requestId: input.requestId, fileName: input.fileName, uploadedBy: "team" },
        "File attached to service request by team"
      );

      return { success: true };
    }),

  /** Client: upload a file to their own service request */
  clientUpload: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        fileName: z.string().min(1).max(255),
        fileUrl: z.string().url().max(500),
        fileType: z.string().max(50).optional(),
        fileSizeKb: z.number().int().positive().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify the user owns this request
      const [request] = await db
        .select({ id: serviceRequests.id })
        .from(serviceRequests)
        .where(
          and(
            eq(serviceRequests.id, input.requestId),
            eq(serviceRequests.userId, ctx.user!.id)
          )
        );

      if (!request) {
        throw new Error("Request not found or access denied");
      }

      await db.insert(requestFiles).values({
        requestId: input.requestId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileType: input.fileType ?? null,
        fileSizeKb: input.fileSizeKb ?? null,
        uploadedBy: "client",
        description: input.description ?? null,
      });

      logger.info(
        { requestId: input.requestId, fileName: input.fileName, userId: ctx.user!.id },
        "File uploaded to service request by client"
      );

      return { success: true };
    }),

  /** Admin: delete a file record from a service request */
  delete: protectedProcedure
    .input(z.object({ fileId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .delete(requestFiles)
        .where(eq(requestFiles.id, input.fileId));

      logger.info({ fileId: input.fileId }, "Request file deleted");

      return { success: true };
    }),
});
