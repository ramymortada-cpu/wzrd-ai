import { eq, desc, isNull, and } from "drizzle-orm";
import { projects, InsertProject } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return { id: result[0].insertId };
}
export async function getProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(projects).where(isNull(projects.deletedAt)).orderBy(desc(projects.createdAt));
}
export async function getProjectsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(projects).where(and(eq(projects.clientId, clientId), isNull(projects.deletedAt))).orderBy(desc(projects.createdAt));
}
export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(projects).where(and(eq(projects.id, id), isNull(projects.deletedAt))).limit(1);
  return result[0] || null;
}
export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}
export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, id));
}
