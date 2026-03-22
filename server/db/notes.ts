import { eq, desc, sql } from "drizzle-orm";
import { clientNotes, InsertClientNote } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createClientNote(data: InsertClientNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientNotes).values(data);
  return { id: result[0].insertId };
}
export { createClientNote as createNote };
export async function getNotesByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(clientNotes).where(eq(clientNotes.clientId, clientId)).orderBy(desc(clientNotes.createdAt));
}
export async function getNotesByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(clientNotes).where(eq(clientNotes.projectId, projectId)).orderBy(desc(clientNotes.createdAt));
}
export async function updateClientNote(id: number, data: Partial<InsertClientNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientNotes).set(data).where(eq(clientNotes.id, id));
}
export async function deleteClientNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientNotes).where(eq(clientNotes.id, id));
}
export async function getAllNotes(params?: { page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const page = params?.page || 1;
  const pageSize = Math.min(params?.pageSize || 50, 100);
  const offset = (page - 1) * pageSize;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(clientNotes);
  const total = Number(count);
  const data = await db.select().from(clientNotes).orderBy(desc(clientNotes.createdAt)).limit(pageSize).offset(offset);
  const totalPages = Math.ceil(total / pageSize);
  return { data, pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}
