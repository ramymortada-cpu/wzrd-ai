import { eq, desc } from "drizzle-orm";
import { payments, InsertPayment } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payments).values(data);
  return { id: result[0].insertId };
}
export async function getPaymentsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(desc(payments.createdAt));
}
export async function getPaymentsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(payments).where(eq(payments.clientId, clientId)).orderBy(desc(payments.createdAt));
}
export async function getAllPayments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(200);
}
export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(payments).set(data).where(eq(payments.id, id));
}
