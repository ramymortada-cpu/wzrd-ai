import { eq, desc, and, sql } from "drizzle-orm";
import {
  clientPortalTokens,
  InsertClientPortalToken,
  clients,
  projects,
  payments,
  deliverables,
  proposals,
  type Payment,
  type Project,
  type Client,
  type Proposal,
  type Deliverable,
} from "../../drizzle/schema";
import { getDb } from "./index";

export async function createPortalToken(data: InsertClientPortalToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientPortalTokens).values(data);
  return { id: result[0].insertId };
}
export async function getPortalTokenByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(clientPortalTokens).where(and(eq(clientPortalTokens.token, token), eq(clientPortalTokens.isActive, 1))).limit(1);
  return result[0] || null;
}
export async function getPortalTokensByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(clientPortalTokens).where(eq(clientPortalTokens.projectId, projectId)).orderBy(desc(clientPortalTokens.createdAt));
}
export async function updatePortalToken(id: number, data: Partial<InsertClientPortalToken>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientPortalTokens).set(data).where(eq(clientPortalTokens.id, id));
}
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [clientRows] = await db.select({ count: sql<number>`count(*)` }).from(clients);
  const [activeProjectRows] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "active"));
  const [completedProjectRows] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "completed"));
  const allPayments = await db.select().from(payments).limit(1000);
  const totalRevenue = allPayments.filter((p: Payment) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingRevenue = allPayments.filter((p: Payment) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0);
  const overdueRevenue = allPayments.filter((p: Payment) => p.status === "overdue").reduce((sum, p) => sum + Number(p.amount), 0);
  return { totalClients: clientRows.count, activeProjects: activeProjectRows.count, completedProjects: completedProjectRows.count, totalRevenue, pendingRevenue, overdueRevenue };
}
export async function getAnalyticsData() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allProjects = await db.select().from(projects).limit(1000);
  const allClients = await db.select().from(clients).limit(1000);
  const allPayments = await db.select().from(payments).limit(1000);
  const allProposals = await db.select().from(proposals).limit(1000);
  const allDeliverables = await db.select().from(deliverables).limit(1000);
  const proposalsByStatus = {
    draft: allProposals.filter((p: Proposal) => p.status === 'draft').length,
    sent: allProposals.filter((p: Proposal) => p.status === 'sent').length,
    accepted: allProposals.filter((p: Proposal) => p.status === 'accepted').length,
    rejected: allProposals.filter((p: Proposal) => p.status === 'rejected').length,
    total: allProposals.length,
  };
  const conversionRate = proposalsByStatus.total > 0 ? Math.round((proposalsByStatus.accepted / proposalsByStatus.total) * 100) : 0;
  const serviceTypes = ['business_health_check', 'starting_business_logic', 'brand_identity', 'business_takeoff', 'consultation'] as const;
  const servicePerformance = serviceTypes.map((st) => {
    const sp = allProjects.filter((p: Project) => p.serviceType === st);
    const sr = allPayments
      .filter((pay: Payment) => pay.status === 'paid' && sp.some((p) => p.id === pay.projectId))
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      serviceType: st,
      projectCount: sp.length,
      activeProjects: sp.filter((p) => p.status === 'active').length,
      completedProjects: sp.filter((p) => p.status === 'completed').length,
      proposalCount: allProposals.filter((p) => p.serviceType === st).length,
      acceptedProposals: allProposals.filter((p) => p.serviceType === st && p.status === 'accepted').length,
      revenue: sr,
    };
  });
  const now = new Date();
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const mp = allPayments.filter((p: Payment) => {
      if (p.status !== 'paid' || !p.paidDate) return false;
      const pd = new Date(p.paidDate);
      return pd >= d && pd <= me;
    });
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      revenue: mp.reduce((sum, p) => sum + Number(p.amount), 0),
      count: mp.length,
    };
  });
  const monthlyClients = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const mc = allClients.filter((c: Client) => {
      const cd = c.createdAt ? new Date(c.createdAt) : null;
      return !!cd && cd >= d && cd <= me;
    });
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, count: mc.length };
  });
  const pipelineValue = allProjects
    .filter((p: Project) => p.status === 'active')
    .reduce((sum, p) => sum + Number(p.price || 0), 0);
  const totalDeliverables = allDeliverables.length;
  const completedDeliverables = allDeliverables.filter(
    (d: Deliverable) => d.status === 'delivered' || d.status === 'approved'
  ).length;
  const aiGenerated = allDeliverables.filter(
    (d: Deliverable) => !!d.content && d.content.length > 0 && String(d.content).includes('AI')
  ).length;
  const marketDistribution = {
    ksa: allClients.filter((c: Client) => c.market === 'ksa').length,
    egypt: allClients.filter((c: Client) => c.market === 'egypt').length,
    uae: allClients.filter((c: Client) => c.market === 'uae').length,
    other: allClients.filter((c: Client) => c.market === 'other').length,
  };
  const clientStatusDistribution = {
    lead: allClients.filter((c: Client) => c.status === 'lead').length,
    active: allClients.filter((c: Client) => c.status === 'active').length,
    completed: allClients.filter((c: Client) => c.status === 'completed').length,
    paused: allClients.filter((c: Client) => c.status === 'paused').length,
  };
  return { proposalFunnel: proposalsByStatus, conversionRate, servicePerformance, monthlyRevenue, monthlyClients, pipelineValue, deliverableStats: { total: totalDeliverables, completed: completedDeliverables, completionRate: totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0, aiGenerated }, marketDistribution, clientStatusDistribution };
}
