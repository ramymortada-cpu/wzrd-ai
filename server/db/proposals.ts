import { eq, desc } from "drizzle-orm";
import { proposals, InsertProposal, proposalAcceptances, InsertProposalAcceptance, onboardingSessions, InsertOnboardingSession } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createProposal(data: InsertProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(proposals).values(data);
  return { id: result[0].insertId };
}
export async function getProposals() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(proposals).orderBy(desc(proposals.createdAt)).limit(500);
}
export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result[0] || null;
}
export async function getProposalsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(proposals).where(eq(proposals.clientId, clientId)).orderBy(desc(proposals.createdAt));
}
export async function updateProposal(id: number, data: Partial<InsertProposal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(proposals).set(data).where(eq(proposals.id, id));
}
export async function deleteProposal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(proposals).where(eq(proposals.id, id));
}
export async function createProposalAcceptance(data: InsertProposalAcceptance) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(proposalAcceptances).values(data);
  const id = result[0].insertId;
  return db.select().from(proposalAcceptances).where(eq(proposalAcceptances.id, id)).then((r: any) => r[0] || null);
}
export async function getProposalAcceptances(proposalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(proposalAcceptances).where(eq(proposalAcceptances.proposalId, proposalId)).orderBy(desc(proposalAcceptances.createdAt));
}
export async function createOnboardingSession(data: InsertOnboardingSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(onboardingSessions).values(data);
  return { id: result[0].insertId };
}
export async function getOnboardingSessionById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(onboardingSessions).where(eq(onboardingSessions.id, id)).limit(1);
  return result[0] || null;
}
export async function getOnboardingSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(onboardingSessions).orderBy(desc(onboardingSessions.createdAt)).limit(200);
}
export async function updateOnboardingSession(id: number, data: Partial<InsertOnboardingSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(onboardingSessions).set(data).where(eq(onboardingSessions.id, id));
}
