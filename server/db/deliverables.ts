import { eq, desc, and, sql } from "drizzle-orm";
import { deliverables, InsertDeliverable, deliverableRevisions, InsertDeliverableRevision, deliverableComments, InsertDeliverableComment, deliverableApprovals, InsertDeliverableApproval } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createDeliverable(data: InsertDeliverable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliverables).values(data);
  return { id: result[0].insertId };
}
export async function getDeliverablesByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(deliverables).where(eq(deliverables.projectId, projectId)).orderBy(deliverables.sortOrder);
}
export async function updateDeliverable(id: number, data: Partial<InsertDeliverable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliverables).set(data).where(eq(deliverables.id, id));
}
export async function deleteDeliverable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deliverables).where(eq(deliverables.id, id));
}
export async function listAllDeliverables() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliverables).orderBy(desc(deliverables.createdAt)).limit(200);
}
export async function createDeliverableRevision(data: InsertDeliverableRevision) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliverableRevisions).values(data);
  const id = result[0].insertId;
  return db.select().from(deliverableRevisions).where(eq(deliverableRevisions.id, id)).then((r: any) => r[0] || null);
}
export async function getDeliverableRevisions(deliverableId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliverableRevisions).where(eq(deliverableRevisions.deliverableId, deliverableId)).orderBy(desc(deliverableRevisions.version));
}
export async function getLatestRevisionVersion(deliverableId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ maxVersion: sql<number>`COALESCE(MAX(${deliverableRevisions.version}), 0)` }).from(deliverableRevisions).where(eq(deliverableRevisions.deliverableId, deliverableId));
  return result[0]?.maxVersion ?? 0;
}
export async function getRevisionPair(deliverableId: number, versionA: number, versionB: number) {
  const db = await getDb();
  if (!db) return { revA: null, revB: null };
  const revA = await db.select().from(deliverableRevisions).where(and(eq(deliverableRevisions.deliverableId, deliverableId), eq(deliverableRevisions.version, versionA))).then((r: any) => r[0] || null);
  const revB = await db.select().from(deliverableRevisions).where(and(eq(deliverableRevisions.deliverableId, deliverableId), eq(deliverableRevisions.version, versionB))).then((r: any) => r[0] || null);
  return { revA, revB };
}
