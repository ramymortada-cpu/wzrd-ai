import { eq, desc, isNull, and } from "drizzle-orm";
import { projects, InsertProject } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return { id: result[0].insertId };
}
export async function getProjects(workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt))
    : isNull(projects.deletedAt);
  return db.select().from(projects).where(whereClause).orderBy(desc(projects.createdAt));
}
export async function getProjectsByClient(clientId: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(projects.clientId, clientId), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt))
    : and(eq(projects.clientId, clientId), isNull(projects.deletedAt));
  return db.select().from(projects).where(whereClause).orderBy(desc(projects.createdAt));
}
export async function getProjectById(id: number, workspaceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(projects.id, id), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt))
    : and(eq(projects.id, id), isNull(projects.deletedAt));
  const result = await db.select().from(projects).where(whereClause).limit(1);
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
