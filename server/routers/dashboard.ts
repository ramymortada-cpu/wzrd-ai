/**
 * Dashboard Router — aggregated stats for the Home page.
 * 
 * Endpoints:
 * - dashboard.stats → totalClients, activeProjects, totalRevenue, pendingDeliverables
 * - dashboard.pipelineAnalytics → pipeline run stats (total, completed, failed, etc.)
 */

import { protectedProcedure, router } from "../_core/trpc";
import { sql, eq } from "drizzle-orm";
import { clients, projects, deliverables, payments } from "../../drizzle/schema";
import { getDb } from "../db/index";
import { getAnalyticsData } from "../db/portal";
import { SERVICE_PLAYBOOKS } from "../knowledgeBase";
import { SERVICE_LABELS, SERVICE_PRICES, STAGE_LABELS } from "@shared/const";

export const dashboardRouter = router({
  /** Aggregated stats for the dashboard home */
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalClients: 0, activeProjects: 0, totalRevenue: 0, pendingDeliverables: 0 };

    const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, 'active'));
    const [revenueSum] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, 'paid'));
    const [pendingRevenueRow] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, 'pending'));
    const [pendingDel] = await db.select({ count: sql<number>`count(*)` }).from(deliverables).where(eq(deliverables.status, 'pending'));

    return {
      totalClients: clientCount?.count || 0,
      activeProjects: activeCount?.count || 0,
      totalRevenue: revenueSum?.total || 0,
      pendingRevenue: pendingRevenueRow?.total || 0,
      pendingDeliverables: pendingDel?.count || 0,
    };
  }),

  /** Pipeline analytics — aggregated from pipeline/execution data */
  pipelineAnalytics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, completed: 0, running: 0, failed: 0, successRate: 0, avgDuration: 0, recentRuns: [] };

    // Use projects as proxy for pipeline stages
    const allProjects = await db.select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      stage: projects.stage,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    }).from(projects).limit(200);

    const total = allProjects.length;
    const completed = allProjects.filter((p: any) => p.status === 'completed').length;
    const running = allProjects.filter((p: any) => p.status === 'active').length;
    const failed = allProjects.filter((p: any) => p.status === 'cancelled').length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average duration (completed projects)
    const completedProjects = allProjects.filter((p: any) => p.status === 'completed' && p.createdAt && p.updatedAt);
    const totalDuration = completedProjects.reduce((sum: number, p: any) => {
      return sum + (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime());
    }, 0);
    const avgDuration = completedProjects.length > 0 ? Math.round(totalDuration / completedProjects.length / (1000 * 60 * 60 * 24)) : 0; // days

    // Recent runs (last 10 projects)
    const recentRuns = allProjects.slice(0, 10).map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      stage: p.stage,
      date: p.updatedAt,
    }));

    return { total, completed, running, failed, successRate, avgDuration, recentRuns };
  }),

  /** Playbooks — service workflows from knowledgeBase */
  playbooks: protectedProcedure.query(async () => ({
    playbooks: SERVICE_PLAYBOOKS,
    labels: SERVICE_LABELS,
    prices: SERVICE_PRICES,
    stages: STAGE_LABELS,
  })),

  /** Full analytics (proposalFunnel, marketDistribution, etc.) */
  analytics: protectedProcedure.query(async () => getAnalyticsData()),
});
