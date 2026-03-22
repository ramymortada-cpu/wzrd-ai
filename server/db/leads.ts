import { eq, desc, and, sql, isNull } from "drizzle-orm";
import { leads, InsertLead } from "../../drizzle/schema";
import { getDb } from "./index";

export async function createLead(data: InsertLead) { const db = await getDb(); if (!db) return null; const result = await db.insert(leads).values(data); const id = result[0].insertId; return db.select().from(leads).where(eq(leads.id, id)).then((r: any) => r[0] || null); }
export async function getLeadById(id: number) { const db = await getDb(); if (!db) return null; return db.select().from(leads).where(eq(leads.id, id)).then((r: any) => r[0] || null); }

export async function listLeads(filters?: { status?: string; scoreLabel?: string; page?: number; pageSize?: number }) {
  const db = await getDb();
  if (!db) return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  const page = filters?.page || 1;
  const pageSize = Math.min(filters?.pageSize || 20, 100);
  const offset = (page - 1) * pageSize;
  const conditions: ReturnType<typeof eq>[] = [];
  if (filters?.status) conditions.push(eq(leads.status, filters.status as "new" | "contacted" | "qualified" | "proposal_sent" | "converted" | "lost"));
  if (filters?.scoreLabel) conditions.push(eq(leads.scoreLabel, filters.scoreLabel as "hot" | "warm" | "cold"));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ count }] = await (where ? db.select({ count: sql<number>`count(*)` }).from(leads).where(where) : db.select({ count: sql<number>`count(*)` }).from(leads));
  const total = Number(count);
  const data = await (where ? db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset) : db.select().from(leads).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset));
  const totalPages = Math.ceil(total / pageSize);
  return { data, pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function updateLead(id: number, data: Partial<InsertLead>) { const db = await getDb(); if (!db) return null; await db.update(leads).set(data).where(eq(leads.id, id)); return db.select().from(leads).where(eq(leads.id, id)).then((r: any) => r[0] || null); }
export async function getLeadStats() { const db = await getDb(); if (!db) return { total: 0, new: 0, hot: 0, warm: 0, cold: 0, converted: 0, totalValue: 0 }; const all = await db.select().from(leads).limit(1000); return { total: all.length, new: all.filter((l: any) => l.status === 'new').length, hot: all.filter((l: any) => l.scoreLabel === 'hot').length, warm: all.filter((l: any) => l.scoreLabel === 'warm').length, cold: all.filter((l: any) => l.scoreLabel === 'cold').length, converted: all.filter((l: any) => l.status === 'converted').length, totalValue: all.reduce((sum: number, l: any) => sum + Number(l.estimatedValue || 0), 0) }; }
export async function getLeadFunnelStats() { const db = await getDb(); if (!db) return { new: 0, contacted: 0, qualified: 0, proposalSent: 0, converted: 0, lost: 0 }; const all = await db.select().from(leads).limit(1000); return { new: all.filter((l: any) => l.status === 'new').length, contacted: all.filter((l: any) => l.status === 'contacted').length, qualified: all.filter((l: any) => l.status === 'qualified').length, proposalSent: all.filter((l: any) => l.status === 'proposal_sent').length, converted: all.filter((l: any) => l.status === 'converted').length, lost: all.filter((l: any) => l.status === 'lost').length }; }
