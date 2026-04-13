/** Brand Twin Router — health audits, alerts, metrics + OBSERVATORY. */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { runBrandAudit, compareSnapshots } from "../brandTwin";
import { eq, and, desc } from "drizzle-orm";
import { brandAlerts } from "../../drizzle/schema";
import {
  createBrandHealthSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  getSnapshotById,
  getAlertsByClient,
  updateAlertStatus,
  getMetricsByClient,
  getBrandTwinDashboard,
  getClientById,
  updateClient,
} from "../db";
import { getDb } from "../db/index";
import { observeClient, observeAllClients } from "../brandObservatory";

export const brandTwinRouter = router({
  dashboard: protectedProcedure.query(async () => getBrandTwinDashboard()),

  runAudit: protectedProcedure.input(z.object({ clientId: z.number(), companyName: z.string().max(255).optional(), industry: z.string().max(255).optional(), market: z.string().max(100).optional(), website: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      let auditInput = input as { clientId: number; companyName: string; industry: string; market: string; website?: string };
      if (!input.companyName || !input.industry || !input.market) {
        const client = await getClientById(input.clientId);
        if (!client) throw new Error('Client not found');
        auditInput = { clientId: input.clientId, companyName: client.companyName || client.name || 'Unknown', industry: client.industry || 'General', market: client.market || 'Egypt', website: input.website || client.website || undefined };
      }
      const result = await runBrandAudit({
        client: {
          name: auditInput.companyName,
          companyName: auditInput.companyName,
          industry: auditInput.industry,
          market: auditInput.market,
          website: auditInput.website ?? undefined,
        },
      });
      if (result) {
        const snapshotId = await createBrandHealthSnapshot({ ...result, clientId: input.clientId });
        logger.info({ clientId: input.clientId, score: result.overallScore }, 'Brand audit completed');
        return { snapshotId, ...result };
      }
      throw new Error('Brand audit failed');
    }),

  latestSnapshot: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input }) => getLatestSnapshot(input.clientId)),
  history: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), limit: z.number().max(50).default(20) })).query(async ({ input }) => getSnapshotHistory(input.clientId, input.limit)),
  snapshot: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getSnapshotById(input.id)),

  compare: protectedProcedure.input(z.object({ snapshotIdA: z.number(), snapshotIdB: z.number() })).query(async ({ input }) => {
    const a = await getSnapshotById(input.snapshotIdA); const b = await getSnapshotById(input.snapshotIdB);
    if (!a || !b) throw new Error('Snapshots not found');
    return compareSnapshots(a, b);
  }),

  alerts: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), status: z.string().max(50).optional() })).query(async ({ input }) => getAlertsByClient(input.clientId, input.status)),
  getLatest: protectedProcedure.input(z.object({ clientId: z.number().int().positive() })).query(async ({ input }) => getLatestSnapshot(input.clientId)),
  getHistory: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), limit: z.number().max(50).default(20) })).query(async ({ input }) => getSnapshotHistory(input.clientId, input.limit)),
  getAlerts: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), status: z.string().max(50).optional() })).query(async ({ input }) => getAlertsByClient(input.clientId, input.status)),
  allAlerts: protectedProcedure.input(z.object({ status: z.string().max(50).optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = input?.status ? [eq(brandAlerts.status, input.status as 'active' | 'resolved' | 'acknowledged' | 'dismissed')] : [];
    return conditions.length > 0 ? await db.select().from(brandAlerts).where(and(...conditions)).orderBy(desc(brandAlerts.createdAt)).limit(100) : await db.select().from(brandAlerts).orderBy(desc(brandAlerts.createdAt)).limit(100);
  }),
  getSnapshot: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => getSnapshotById(input.id)),
  updateAlert: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["active", "acknowledged", "resolved", "dismissed"]) })).mutation(async ({ input, ctx }) => { checkEditor(ctx); await updateAlertStatus(input.id, input.status); return { success: true }; }),
  metrics: protectedProcedure.input(z.object({ clientId: z.number().int().positive(), dimension: z.string().max(100).optional() })).query(async ({ input }) => getMetricsByClient(input.clientId, input.dimension)),

  /** Brand Monitor schedule (Sprint F) */
  monitorSettings: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      checkEditor(ctx);
      const c = await getClientById(input.clientId, ctx.workspaceId);
      if (!c) return null;
      return {
        clientId: c.id,
        companyName: c.companyName || c.name,
        brandMonitorEnabled: Boolean(c.brandMonitorEnabled),
        brandMonitorIntervalDays: c.brandMonitorIntervalDays ?? 7,
        brandMonitorLastRunAt: c.brandMonitorLastRunAt ?? null,
      };
    }),

  updateMonitorSettings: protectedProcedure
    .input(
      z.object({
        clientId: z.number().int().positive(),
        brandMonitorEnabled: z.boolean(),
        brandMonitorIntervalDays: z.number().int().min(1).max(90),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const c = await getClientById(input.clientId, ctx.workspaceId);
      if (!c) throw new Error("Client not found");
      await updateClient(input.clientId, {
        brandMonitorEnabled: input.brandMonitorEnabled ? 1 : 0,
        brandMonitorIntervalDays: input.brandMonitorIntervalDays,
      });
      return { success: true as const };
    }),

  /** Observatory: scan a single client for brand signals */
  observe: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const c = await getClientById(input.clientId, ctx.workspaceId);
      if (!c) throw new Error("Client not found");
      return observeClient(input.clientId);
    }),

  /** Observatory: scan ALL active clients */
  observeAll: protectedProcedure.mutation(async ({ ctx }) => { checkEditor(ctx); return observeAllClients(); }),
});
