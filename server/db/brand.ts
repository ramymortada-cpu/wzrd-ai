import { eq, desc, and, sql } from "drizzle-orm";
import {
  brandHealthSnapshots,
  InsertBrandHealthSnapshot,
  brandAlerts,
  InsertBrandAlert,
  brandMetrics,
  InsertBrandMetric,
  type BrandMetric,
} from "../../drizzle/schema";
import { getDb } from "./index";

/** Observatory alert severities (brandObservatory) → DB enum `brand_alerts.severity` */
export type ObservatoryAlertSeverity = "low" | "medium" | "high" | "critical";

export interface ObservatoryAlertInput {
  type: string;
  severity: ObservatoryAlertSeverity;
  message: string;
  recommendation: string;
}

/**
 * Maps Brand Observatory alerts to `brand_alerts` row shape (Sprint F).
 * DB allows: critical | warning | info | opportunity
 */
export function mapObservatoryAlertToInsert(
  clientId: number,
  alert: ObservatoryAlertInput,
  snapshotId: number | null = null,
): InsertBrandAlert {
  const severityMap: Record<ObservatoryAlertSeverity, InsertBrandAlert["severity"]> = {
    low: "info",
    medium: "warning",
    high: "critical",
    critical: "critical",
  };
  const dimensionByType: Record<string, InsertBrandAlert["dimension"]> = {
    negative_sentiment: "reputation",
    competitor_activity: "market_fit",
    market_shift: "market_fit",
  };
  const dimension = dimensionByType[alert.type] ?? "overall";
  const severity = severityMap[alert.severity] ?? "warning";
  const titleBase = `Brand Monitor — ${alert.type.replace(/_/g, " ")}`;
  const title = titleBase.length > 500 ? titleBase.slice(0, 497) + "…" : titleBase;
  return {
    clientId,
    snapshotId,
    severity,
    dimension,
    title,
    description: alert.message,
    recommendation: alert.recommendation,
  };
}

export async function createBrandHealthSnapshot(data: Record<string, unknown>) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(brandHealthSnapshots).values({ clientId: data.clientId, overallScore: data.overallScore, identityScore: data.identityScore, positioningScore: data.positioningScore, messagingScore: data.messagingScore, visualScore: data.visualScore, digitalPresenceScore: data.digitalPresenceScore, reputationScore: data.reputationScore, marketFitScore: data.marketFitScore, dimensionDetails: data.dimensionDetails || null, summary: data.summary || null, strengths: data.strengths || null, weaknesses: data.weaknesses || null, opportunities: data.opportunities || null, threats: data.threats || null, auditType: data.auditType || "ai_auto", researchReportId: data.researchReportId || null } as InsertBrandHealthSnapshot);
  return result[0].insertId;
}
export async function getLatestSnapshot(clientId: number) { const db = await getDb(); if (!db) return null; const rows = await db.select().from(brandHealthSnapshots).where(eq(brandHealthSnapshots.clientId, clientId)).orderBy(desc(brandHealthSnapshots.createdAt)).limit(1); return rows[0] || null; }
export async function getSnapshotHistory(clientId: number, limit = 20) { const db = await getDb(); if (!db) return []; return db.select().from(brandHealthSnapshots).where(eq(brandHealthSnapshots.clientId, clientId)).orderBy(desc(brandHealthSnapshots.createdAt)).limit(limit); }
export async function getSnapshotById(id: number) { const db = await getDb(); if (!db) return null; const rows = await db.select().from(brandHealthSnapshots).where(eq(brandHealthSnapshots.id, id)); return rows[0] || null; }
export async function createBrandAlert(data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(brandAlerts).values({
    clientId: data.clientId,
    snapshotId: data.snapshotId || null,
    severity: data.severity,
    dimension: data.dimension as InsertBrandAlert["dimension"],
    title: data.title,
    description: data.description,
    recommendation: data.recommendation || null,
  } as InsertBrandAlert);
  return result[0].insertId;
}

export async function createBrandAlertFromObservatory(
  clientId: number,
  alert: ObservatoryAlertInput,
  snapshotId?: number | null,
): Promise<number | undefined> {
  const row = mapObservatoryAlertToInsert(clientId, alert, snapshotId ?? null);
  return createBrandAlert(row as unknown as Record<string, unknown>);
}

export async function getAlertsByClient(clientId: number, status?: string) { const db = await getDb(); if (!db) return []; const conditions: ReturnType<typeof eq>[] = [eq(brandAlerts.clientId, clientId)]; if (status) conditions.push(eq(brandAlerts.status, status as "active" | "resolved" | "acknowledged" | "dismissed")); return db.select().from(brandAlerts).where(and(...conditions)).orderBy(desc(brandAlerts.createdAt)); }
export async function updateAlertStatus(id: number, status: "active" | "acknowledged" | "resolved" | "dismissed") { const db = await getDb(); if (!db) return; const updates: Record<string, unknown> = { status }; if (status === "resolved") updates.resolvedAt = new Date(); await db.update(brandAlerts).set(updates).where(eq(brandAlerts.id, id)); }
const DIMENSIONS = ["identity", "positioning", "messaging", "visual", "digital_presence", "reputation", "market_fit"] as const satisfies readonly BrandMetric["dimension"][];
const DIMENSION_SET = new Set<string>(DIMENSIONS);

function normalizeMetricDimension(value: unknown): BrandMetric["dimension"] {
  return typeof value === "string" && DIMENSION_SET.has(value)
    ? (value as BrandMetric["dimension"])
    : "identity";
}

export async function createBrandMetrics(metrics: Array<Record<string, unknown>>) {
  if (metrics.length === 0) return;
  const db = await getDb();
  if (!db) return;
  const mapped: InsertBrandMetric[] = metrics.map((m) => ({
    clientId: m.clientId as number,
    snapshotId: (m.snapshotId as number | null | undefined) || null,
    dimension: normalizeMetricDimension(m.dimension),
    metricName: m.metricName as string,
    score: m.score as number,
    maxScore: (m.maxScore as number | undefined) || 100,
    details: (m.details as string | null | undefined) ?? null,
    dataSource: (m.dataSource as string | null | undefined) ?? null,
  }));
  await db.insert(brandMetrics).values(mapped);
}

export async function getMetricsByClient(clientId: number, dimension?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq>[] = [eq(brandMetrics.clientId, clientId)];
  if (dimension && DIMENSION_SET.has(dimension)) {
    conditions.push(eq(brandMetrics.dimension, dimension as BrandMetric["dimension"]));
  }
  return db.select().from(brandMetrics).where(and(...conditions)).orderBy(desc(brandMetrics.createdAt));
}
export async function getBrandTwinDashboard() {
  const db = await getDb();
  if (!db) return { totalClients: 0, avgScore: 0, healthy: 0, atRisk: 0, critical: 0, activeAlerts: 0, clients: [] };
  const allSnapshots = await db.select().from(brandHealthSnapshots).orderBy(desc(brandHealthSnapshots.createdAt)).limit(200);
  const latestByClient = new Map<number, typeof allSnapshots[0]>();
  for (const s of allSnapshots) { if (!latestByClient.has(s.clientId)) latestByClient.set(s.clientId, s); }
  const snapshots = Array.from(latestByClient.values());
  const totalClients = snapshots.length;
  const avgScore = totalClients > 0 ? Math.round(snapshots.reduce((sum, s) => sum + s.overallScore, 0) / totalClients) : 0;
  const activeAlerts = await db.select({ count: sql<number>`count(*)` }).from(brandAlerts).where(eq(brandAlerts.status, "active"));
  return { totalClients, avgScore, healthy: snapshots.filter(s => s.overallScore >= 70).length, atRisk: snapshots.filter(s => s.overallScore >= 40 && s.overallScore < 70).length, critical: snapshots.filter(s => s.overallScore < 40).length, activeAlerts: Number(activeAlerts[0]?.count || 0), clients: snapshots.map(s => ({ clientId: s.clientId, overallScore: s.overallScore, identityScore: s.identityScore, positioningScore: s.positioningScore, messagingScore: s.messagingScore, visualScore: s.visualScore, digitalPresenceScore: s.digitalPresenceScore, reputationScore: s.reputationScore, marketFitScore: s.marketFitScore, auditType: s.auditType, createdAt: s.createdAt })) };
}
