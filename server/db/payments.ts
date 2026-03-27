import { eq, desc, and } from "drizzle-orm";
import { payments, InsertPayment } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  return { id: result[0].insertId };
}
export async function getPaymentsByProject(projectId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(payments.projectId, projectId), eq(payments.workspaceId, workspaceId))
    : eq(payments.projectId, projectId);
  return db.select().from(payments).where(whereClause).orderBy(desc(payments.createdAt));
}
export async function getPaymentsByClient(clientId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(payments.clientId, clientId), eq(payments.workspaceId, workspaceId))
    : eq(payments.clientId, clientId);
  return db.select().from(payments).where(whereClause).orderBy(desc(payments.createdAt));
}
export async function getAllPayments(workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (workspaceId) {
    return db
      .select()
      .from(payments)
      .where(eq(payments.workspaceId, workspaceId))
      .orderBy(desc(payments.createdAt))
      .limit(200);
  }
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(200);
}
export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments).set(data).where(eq(payments.id, id));
}
