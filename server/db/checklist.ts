/**
 * User diagnosis checklists — tasks derived from tool actionItems.
 */

import { eq, and, desc } from "drizzle-orm";
import { diagnosisHistory, userChecklists } from "../../drizzle/schema";
import { getDb } from "./index";

export type UserChecklistRow = typeof userChecklists.$inferSelect & { items: unknown[] };

export async function findLatestChecklistForUserTool(
  userId: number,
  toolId: string
): Promise<UserChecklistRow | null> {
  const db = await getDb();
  if (!db) return null;

  const [diag] = await db
    .select({ id: diagnosisHistory.id })
    .from(diagnosisHistory)
    .where(and(eq(diagnosisHistory.userId, userId), eq(diagnosisHistory.toolId, toolId)))
    .orderBy(desc(diagnosisHistory.createdAt))
    .limit(1);

  if (!diag) return null;

  const [row] = await db
    .select()
    .from(userChecklists)
    .where(and(eq(userChecklists.diagnosisId, diag.id), eq(userChecklists.userId, userId)))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

export async function toggleChecklistItemForUser(
  userId: number,
  checklistId: number,
  itemIndex: number
): Promise<{ items: unknown[]; completedCount: number; totalCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [checklist] = await db
    .select()
    .from(userChecklists)
    .where(and(eq(userChecklists.id, checklistId), eq(userChecklists.userId, userId)));

  if (!checklist) {
    throw new Error("Checklist not found");
  }

  const items = Array.isArray(checklist.items) ? ([...checklist.items] as Record<string, unknown>[]) : [];
  if (itemIndex < 0 || itemIndex >= items.length) {
    throw new Error("Item index out of range");
  }

  const item = items[itemIndex];
  item.completed = !item.completed;
  item.completedAt = item.completed ? new Date().toISOString() : null;

  const completedCount = items.filter((i) => i.completed).length;

  await db
    .update(userChecklists)
    .set({
      items,
      completedCount,
    })
    .where(eq(userChecklists.id, checklistId));

  return { items, completedCount, totalCount: items.length };
}
