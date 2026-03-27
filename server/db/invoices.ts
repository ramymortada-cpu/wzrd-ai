import { and, desc, eq } from "drizzle-orm";
import { invoices, type InsertInvoice } from "../../drizzle/schema";
import { getDb } from "./index";

export async function listInvoices(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.workspaceId, workspaceId))
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createInvoice(input: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(input);
  return { id: result[0].insertId };
}

export async function markInvoicePaid(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(invoices)
    .set({ status: "paid" })
    .where(and(eq(invoices.id, id), eq(invoices.workspaceId, workspaceId)));
}
