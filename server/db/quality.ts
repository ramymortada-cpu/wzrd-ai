/**
 * DB helpers for Quality & Feedback tables (Sprint 1 migration 0013).
 */
import { eq, desc } from "drizzle-orm";
import { qualityScores, clientFeedbackTable, type QualityScore } from "../../drizzle/schema";
import type { AppDatabase } from "./types";

let _db: AppDatabase | null = null;
async function getDb() {
  if (!_db) {
    const mod = await import("./index");
    _db = await mod.getDb();
  }
  return _db;
}

// ════════════════════════════════════════════
// QUALITY SCORES
// ════════════════════════════════════════════

export async function insertQualityScore(data: {
  deliverableId: number;
  ruleScore: number;
  aiScore?: number | null;
  finalScore: number;
  passed: boolean;
  issues?: Array<{ id: string; name: string; detail: string }> | null;
  aiReview?: Record<string, unknown> | null;
  rejectedReason?: string | null;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(qualityScores).values({
      ...data,
      passed: data.passed ? 1 : 0,
      issues: data.issues ? JSON.stringify(data.issues) : null,
      aiReview: data.aiReview ? JSON.stringify(data.aiReview) : null,
    });
    return result[0]?.insertId || null;
  } catch { return null; }
}

export async function getQualityScoreByDeliverable(deliverableId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(qualityScores)
    .where(eq(qualityScores.deliverableId, deliverableId))
    .orderBy(desc(qualityScores.createdAt))
    .limit(1);
  return rows[0] || null;
}

export async function updateOwnerReview(deliverableId: number, score: number, notes?: string | null) {
  const db = await getDb();
  if (!db) return;
  const existing = await getQualityScoreByDeliverable(deliverableId);
  if (existing) {
    await db.update(qualityScores)
      .set({ reviewedByOwner: 1, ownerScore: score, ownerNotes: notes || null })
      .where(eq(qualityScores.id, existing.id));
  } else {
    await db.insert(qualityScores).values({
      deliverableId,
      ruleScore: 0,
      finalScore: 0,
      passed: 0,
      reviewedByOwner: 1,
      ownerScore: score,
      ownerNotes: notes || null,
    });
  }
}

export async function getQualityTrendsFromDB() {
  const db = await getDb();
  if (!db) return { avgScore: 0, passRate: '0%', total: 0, avgOwnerScore: 0 };
  const all = await db.select().from(qualityScores).orderBy(desc(qualityScores.createdAt)).limit(100);
  if (all.length === 0) return { avgScore: 0, passRate: '0%', total: 0, avgOwnerScore: 0 };

  const avgScore = Math.round(all.reduce((s: number, r: QualityScore) => s + (r.finalScore ?? 0), 0) / all.length);
  const passCount = all.filter((r: QualityScore) => !!r.passed).length;
  const ownerScores = all.filter((r: QualityScore) => r.ownerScore != null).map((r) => Number(r.ownerScore));
  const avgOwnerScore = ownerScores.length > 0
    ? Math.round((ownerScores.reduce((a: number, b: number) => a + b, 0) / ownerScores.length) * 10) / 10
    : 0;

  return {
    avgScore,
    passRate: `${Math.round((passCount / all.length) * 100)}%`,
    total: all.length,
    avgOwnerScore,
  };
}

// ════════════════════════════════════════════
// CLIENT FEEDBACK
// ════════════════════════════════════════════

export async function insertClientFeedback(data: {
  deliverableId: number;
  projectId?: number | null;
  clientName: string;
  rating: number;
  positiveNotes?: string | null;
  negativeNotes?: string | null;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(clientFeedbackTable).values(data);
    return result[0]?.insertId || null;
  } catch { return null; }
}

export async function getClientFeedbackByDeliverable(deliverableId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientFeedbackTable)
    .where(eq(clientFeedbackTable.deliverableId, deliverableId))
    .orderBy(desc(clientFeedbackTable.createdAt))
    .limit(100);
}

export async function getClientFeedbackStats() {
  const db = await getDb();
  if (!db) return { avgRating: 0, total: 0 };
  const all = await db.select().from(clientFeedbackTable).limit(200);
  if (all.length === 0) return { avgRating: 0, total: 0 };
  const avg = Math.round((all.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / all.length) * 10) / 10;
  return { avgRating: avg, total: all.length };
}
