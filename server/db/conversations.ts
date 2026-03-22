import { eq, desc } from "drizzle-orm";
import { aiConversations, InsertAiConversation } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createAiConversation(data: InsertAiConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiConversations).values(data);
  return { id: result[0].insertId };
}
export async function getAiConversationsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(aiConversations).where(eq(aiConversations.projectId, projectId)).orderBy(desc(aiConversations.createdAt));
}
export async function getAiConversationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(aiConversations).where(eq(aiConversations.id, id)).limit(1);
  return result[0] || null;
}
export async function updateAiConversation(id: number, data: Partial<InsertAiConversation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiConversations).set(data).where(eq(aiConversations.id, id));
}
