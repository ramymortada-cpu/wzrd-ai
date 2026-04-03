import { eq, desc, and, sql } from "drizzle-orm";
import { leads, InsertLead, type Lead } from "../../drizzle/schema";
import { getDb } from "./index";
import { logger } from "../_core/logger";
import { getUserById } from "./users";
import { getClientByEmail } from "./clients";

export async function createLead(data: InsertLead): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(leads).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(leads).where(eq(leads.id, id));
  return rows[0] ?? null;
}
export async function getLeadById(id: number): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(leads).where(eq(leads.id, id));
  return rows[0] ?? null;
}

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

export async function updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(leads).set(data).where(eq(leads.id, id));
  const rows = await db.select().from(leads).where(eq(leads.id, id));
  return rows[0] ?? null;
}
export async function getLeadStats() {
  const db = await getDb();
  if (!db) return { total: 0, new: 0, hot: 0, warm: 0, cold: 0, converted: 0, totalValue: 0 };
  const all = await db.select().from(leads).limit(1000);
  return {
    total: all.length,
    new: all.filter((l) => l.status === 'new').length,
    hot: all.filter((l) => l.scoreLabel === 'hot').length,
    warm: all.filter((l) => l.scoreLabel === 'warm').length,
    cold: all.filter((l) => l.scoreLabel === 'cold').length,
    converted: all.filter((l) => l.status === 'converted').length,
    totalValue: all.reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0),
  };
}
export async function getLeadFunnelStats() {
  const db = await getDb();
  if (!db) return { new: 0, contacted: 0, qualified: 0, proposalSent: 0, converted: 0, lost: 0 };
  const all = await db.select().from(leads).limit(1000);
  return {
    new: all.filter((l) => l.status === 'new').length,
    contacted: all.filter((l) => l.status === 'contacted').length,
    qualified: all.filter((l) => l.status === 'qualified').length,
    proposalSent: all.filter((l) => l.status === 'proposal_sent').length,
    converted: all.filter((l) => l.status === 'converted').length,
    lost: all.filter((l) => l.status === 'lost').length,
  };
}

const TOOL_LABEL: Record<string, string> = {
  brand_diagnosis: "Brand Diagnosis",
  offer_check: "Offer Logic Check",
  message_check: "Message Check",
  presence_audit: "Presence Audit",
  identity_snapshot: "Identity Snapshot",
  launch_readiness: "Launch Readiness",
  design_health: "Design Health Check",
  competitive_benchmark: "Competitive Benchmark",
};

export function leadScoreLabelFromNumeric(score: number): "hot" | "warm" | "cold" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export async function getLatestLeadByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const rows = await db
    .select()
    .from(leads)
    .where(sql`LOWER(${leads.email}) = ${normalized}`)
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return rows[0] || null;
}

function mapUserMarket(m: string | null | undefined): "ksa" | "egypt" | "uae" | "other" {
  const x = (m || "").toLowerCase();
  if (x.includes("ksa") || x.includes("saudi")) return "ksa";
  if (x.includes("uae") || x.includes("emirates")) return "uae";
  if (x.includes("egypt") || x === "eg") return "egypt";
  return "other";
}

/**
 * After a logged-in user runs a diagnosis tool, mirror score + teaser into CRM leads (source: website).
 * Skips users who already exist as CRM clients (matched by email).
 */
export async function upsertLeadFromToolDiagnosis(args: {
  userId: number;
  toolId: string;
  result: { score: number; recommendation: string; findings: Array<{ title: string }> };
}) {
  const user = await getUserById(args.userId);
  const emailRaw = user?.email?.trim();
  if (!emailRaw) return;

  const email = emailRaw.toLowerCase();
  if (await getClientByEmail(email)) return;

  const toolName = TOOL_LABEL[args.toolId] || args.toolId;
  const firstFinding = args.result.findings[0]?.title || "";
  const recBit = args.result.recommendation.slice(0, 120);
  const teaser = `${toolName}: ${args.result.score}/100${firstFinding ? ` — ${firstFinding}` : ` — ${recBit}`}`.slice(0, 600);
  const label = leadScoreLabelFromNumeric(args.result.score);
  const scoringReason = args.result.recommendation.slice(0, 500);

  const existing = await getLatestLeadByEmail(email);
  if (existing) {
    if (existing.status === "converted") return;
    await updateLead(existing.id, {
      score: args.result.score,
      scoreLabel: label,
      diagnosisTeaser: teaser,
      scoringReason,
    });
    return;
  }

  const companyName = (user!.company || user!.name || email.split("@")[0] || "WZZRD user").slice(0, 255);
  const row = await createLead({
    companyName,
    contactName: user!.name || undefined,
    email,
    industry: user!.industry || undefined,
    market: mapUserMarket(user!.market),
    diagnosisTeaser: teaser,
    score: args.result.score,
    scoreLabel: label,
    scoringReason,
    status: "new",
    source: "website",
  });
  if (!row) logger.warn({ email }, "createLead returned null (diagnosis → CRM)");
}
