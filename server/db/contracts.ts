import { and, desc, eq } from "drizzle-orm";
import { contracts, type InsertContract } from "../../drizzle/schema";
import { getDb } from "./index";

export async function listContracts(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(contracts)
    .where(eq(contracts.workspaceId, workspaceId))
    .orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createContract(input: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contracts).values(input);
  return { id: result[0].insertId };
}

export async function signContract(id: number, workspaceId: number, signatureData: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(contracts)
    .set({ status: "signed", signatureData })
    .where(and(eq(contracts.id, id), eq(contracts.workspaceId, workspaceId)));
}
