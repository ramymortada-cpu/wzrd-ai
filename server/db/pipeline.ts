import { eq, desc, sql } from "drizzle-orm";
import { pipelineRuns, InsertPipelineRun, PipelineRun } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createPipelineRun(data: InsertPipelineRun): Promise<number> { const db = await getDb(); if (!db) return 0; const result = await db.insert(pipelineRuns).values(data); return result[0].insertId; }
export async function getPipelineRunById(id: number): Promise<PipelineRun | null> { const db = await getDb(); if (!db) return null; const rows = await db.select().from(pipelineRuns).where(eq(pipelineRuns.id, id)).limit(1); return rows[0] || null; }
export async function getPipelineRunsByClient(clientId: number): Promise<PipelineRun[]> { const db = await getDb(); if (!db) return []; return db.select().from(pipelineRuns).where(eq(pipelineRuns.clientId, clientId)).orderBy(desc(pipelineRuns.createdAt)); }
export async function getAllPipelineRuns(): Promise<PipelineRun[]> { const db = await getDb(); if (!db) return []; return db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.createdAt)).limit(50); }
export async function updatePipelineRun(id: number, data: Partial<InsertPipelineRun>): Promise<void> { const db = await getDb(); if (!db) return; await db.update(pipelineRuns).set(data).where(eq(pipelineRuns.id, id)); }
export async function getPipelineAnalytics() {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, failed: 0, running: 0, avgDuration: 0, byService: [], byStatus: [], recentRuns: [] };
  const allRuns = await db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.createdAt)).limit(200);
  const total = allRuns.length; const completed = allRuns.filter((r: any) => r.status === 'completed').length; const failed = allRuns.filter((r: any) => r.status === 'failed').length;
  const running = allRuns.filter((r: any) => !['completed', 'failed', 'paused', 'pending'].includes(r.status)).length;
  const completedRuns = allRuns.filter((r: any) => r.status === 'completed' && r.completedAt && r.startedAt);
  const avgDuration = completedRuns.length > 0 ? Math.round(completedRuns.reduce((sum: number, r: any) => sum + (new Date(r.completedAt!).getTime() - new Date(r.startedAt!).getTime()), 0) / completedRuns.length / 1000) : 0;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const serviceTypes = ['business_health_check', 'starting_business_logic', 'brand_identity', 'business_takeoff', 'consultation'] as const;
  const byService = serviceTypes.map(st => ({ serviceType: st, total: allRuns.filter((r: any) => r.serviceType === st).length, completed: allRuns.filter((r: any) => r.serviceType === st && r.status === 'completed').length, failed: allRuns.filter((r: any) => r.serviceType === st && r.status === 'failed').length })).filter((s: any) => s.total > 0);
  const recentRuns = allRuns.slice(0, 10).map((r: any) => ({ id: r.id, clientId: r.clientId, serviceType: r.serviceType, status: r.status, currentStep: r.currentStep, startedAt: r.startedAt, completedAt: r.completedAt }));
  return { total, completed, failed, running, avgDuration, successRate, byService, byStatus: [], recentRuns };
}
