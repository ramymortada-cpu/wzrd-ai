/**
 * Clients Router — CRUD operations for client management.
 * 
 * Features:
 * - Full input validation with .max() constraints
 * - Audit trail on all mutations
 * - Soft delete support
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner, checkEditor, requireWorkspaceRole } from "../_core/authorization";
import { z } from "zod";
import { createClientInput, updateClientInput } from "@shared/validators";
import { paginationInput } from "../_core/pagination";
import { sanitizeObject } from "../_core/sanitize";
import { audit, computeChanges } from "../_core/audit";
import { logger } from "../_core/logger";
import {
  createClient, getClients, getClientById, updateClient, softDeleteClient,
} from "../db/clients";
import { getUserByEmail } from "../db/users";
import { getDb } from "../db";
import { diagnosisHistory } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { deepResearch } from "../liveIntelligence";

export const clientsRouter = router({
  /** List all clients with pagination */
  list: protectedProcedure
    .input(z.object({ ...paginationInput }).optional())
    .query(async ({ input, ctx }) => {
      const page = input?.page || 1;
      const pageSize = input?.pageSize || 20;
      return getClients({ page, pageSize, workspaceId: ctx.workspaceId });
    }),

  /** Get a single client by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      return getClientById(input.id, ctx.workspaceId);
    }),

  /** WZRD tool diagnosis history for users whose email matches this client (Brand Health Tracker data). */
  diagnosisForClient: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      checkEditor(ctx);
      const client = await getClientById(input.clientId, ctx.workspaceId);
      const cEmail = client?.email?.trim();
      if (!cEmail) return [];
      let user = await getUserByEmail(cEmail);
      if (!user) user = await getUserByEmail(cEmail.toLowerCase());
      if (!user) return [];
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(diagnosisHistory)
        .where(eq(diagnosisHistory.userId, user.id))
        .orderBy(desc(diagnosisHistory.createdAt))
        .limit(50);
      return rows.map((h: (typeof rows)[number]) => ({
        ...h,
        findings: Array.isArray(h.findings) ? h.findings : [],
        actionItems: Array.isArray(h.actionItems) ? h.actionItems : [],
      }));
    }),

  /** Create a new client — auto-triggers background research */
  create: protectedProcedure
    .input(createClientInput)
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const sanitized = sanitizeObject(input);
      const result = await createClient({ ...sanitized, workspaceId: ctx.workspaceId });

      const insertId = (result as unknown as { insertId?: number }[])?.[0]?.insertId ?? (result as unknown as { insertId?: number })?.insertId;
      if (insertId) {
        await audit('clients', insertId, 'create', ctx.user?.id, sanitized, { workspaceId: ctx.workspaceId });
        logger.info({ clientId: insertId, name: sanitized.name }, 'Client created');

        // AUTO-RESEARCH: Fire-and-forget background research
        // Non-blocking — doesn't slow down the client creation response
        const companyName = sanitized.companyName || sanitized.name;
        const industry = sanitized.industry;
        const market = sanitized.market;

        if (companyName && industry) {
          const topic = `${companyName} ${industry} branding ${market || 'MENA'}`;
          deepResearch(topic, { industry, market: market || undefined })
            .then(result => {
              if (result.entriesCreated > 0) {
                logger.info({
                  clientId: insertId, company: companyName,
                  entriesCreated: result.entriesCreated, sources: result.sourcesUsed,
                }, 'Auto-research completed for new client');
              }
            })
            .catch(err => {
              logger.debug({ err, clientId: insertId }, 'Auto-research failed (non-blocking)');
            });
        }
      }

      return result;
    }),

  /** Update an existing client */
  update: protectedProcedure
    .input(updateClientInput)
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      requireWorkspaceRole(ctx, "editor");
      const { id, ...data } = sanitizeObject(input);

      // Get current state for audit diff
      const before = await getClientById(id, ctx.workspaceId);
      if (!before) throw new Error('Client not found');

      await updateClient(id, data);

      // Audit trail with changes
      const changes = computeChanges(before as Record<string, unknown>, data);
      if (Object.keys(changes).length > 0) {
        await audit('clients', id, 'update', ctx.user?.id, changes, { workspaceId: ctx.workspaceId });
        logger.info({ clientId: id, changes: Object.keys(changes) }, 'Client updated');
      }

      return { success: true };
    }),

  /** Soft delete a client */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx); // Only owner can delete clients
      requireWorkspaceRole(ctx, "admin");
      await softDeleteClient(input.id);
      await audit('clients', input.id, 'delete', ctx.user?.id, undefined, { workspaceId: ctx.workspaceId });
      logger.info({ clientId: input.id }, 'Client soft-deleted');
      return { success: true };
    }),
});
