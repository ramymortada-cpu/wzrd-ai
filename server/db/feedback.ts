import { eq, desc } from "drizzle-orm";
import {
  deliverableFeedback,
  InsertDeliverableFeedback,
  deliverableComments,
  InsertDeliverableComment,
  deliverableApprovals,
  InsertDeliverableApproval,
  type DeliverableFeedback,
  type DeliverableComment,
  type DeliverableApproval,
} from "../../drizzle/schema";
import { getDb } from "./index";

export async function createDeliverableFeedback(data: InsertDeliverableFeedback): Promise<DeliverableFeedback | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliverableFeedback).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(deliverableFeedback).where(eq(deliverableFeedback.id, id));
  return rows[0] ?? null;
}
export async function getDeliverableFeedbacks(deliverableId: number) { const db = await getDb(); if (!db) return []; return db.select().from(deliverableFeedback).where(eq(deliverableFeedback.deliverableId, deliverableId)).orderBy(desc(deliverableFeedback.createdAt)); }
export async function createDeliverableComment(data: InsertDeliverableComment): Promise<DeliverableComment | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliverableComments).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(deliverableComments).where(eq(deliverableComments.id, id));
  return rows[0] ?? null;
}
export async function getDeliverableComments(deliverableId: number) { const db = await getDb(); if (!db) return []; return db.select().from(deliverableComments).where(eq(deliverableComments.deliverableId, deliverableId)).orderBy(deliverableComments.createdAt); }
export async function updateDeliverableComment(id: number, data: Partial<InsertDeliverableComment>) { const db = await getDb(); if (!db) return; await db.update(deliverableComments).set(data).where(eq(deliverableComments.id, id)); }
export async function resolveDeliverableComment(id: number) { const db = await getDb(); if (!db) return; await db.update(deliverableComments).set({ isResolved: 1, resolvedAt: new Date() }).where(eq(deliverableComments.id, id)); }
export async function deleteDeliverableComment(id: number) { const db = await getDb(); if (!db) return; await db.delete(deliverableComments).where(eq(deliverableComments.id, id)); }
export async function createDeliverableApproval(data: InsertDeliverableApproval): Promise<DeliverableApproval | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliverableApprovals).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(deliverableApprovals).where(eq(deliverableApprovals.id, id));
  return rows[0] ?? null;
}
export async function getDeliverableApprovals(deliverableId: number) { const db = await getDb(); if (!db) return []; return db.select().from(deliverableApprovals).where(eq(deliverableApprovals.deliverableId, deliverableId)).orderBy(desc(deliverableApprovals.createdAt)); }
export async function getLatestApproval(deliverableId: number) { const db = await getDb(); if (!db) return null; const results = await db.select().from(deliverableApprovals).where(eq(deliverableApprovals.deliverableId, deliverableId)).orderBy(desc(deliverableApprovals.createdAt)).limit(1); return results[0] || null; }
