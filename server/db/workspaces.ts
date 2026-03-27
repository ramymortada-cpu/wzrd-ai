import { and, eq } from "drizzle-orm";
import {
  workspaces,
  workspaceMembers,
  users,
  type InsertWorkspace,
  type InsertWorkspaceMember,
} from "../../drizzle/schema";
import { getDb } from "./index";

export async function createWorkspace(input: InsertWorkspace, ownerUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workspaces).values(input);
  const workspaceId = result[0].insertId;
  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: ownerUserId,
    role: "owner",
  });
  return { id: workspaceId };
}

export async function getWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
      name: workspaces.name,
      plan: workspaces.plan,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));
  return rows;
}

export async function getWorkspaceMembers(workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      createdAt: workspaceMembers.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}

export async function addWorkspaceMember(input: InsertWorkspaceMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, input.workspaceId),
        eq(workspaceMembers.userId, input.userId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return { alreadyExists: true as const };
  await db.insert(workspaceMembers).values(input);
  return { alreadyExists: false as const };
}

export async function updateWorkspaceMemberRole(
  workspaceId: number,
  userId: number,
  role: "owner" | "admin" | "editor" | "viewer",
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(workspaceMembers)
    .set({ role })
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
}

export async function removeWorkspaceMember(workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
}
