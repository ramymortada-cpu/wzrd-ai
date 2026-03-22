/** Analytics Router — dashboard stats, analytics data, auto-reports. */
import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { dashboardCache, analyticsCache } from "../_core/cache";
import { getDashboardStats, getAnalyticsData } from "../db";
import { generateMonthlyReport, generateAllMonthlyReports } from "../autoReports";

export const analyticsRouter = router({
  dashboard: protectedProcedure.query(async () => {
    return dashboardCache.getOrSet('stats', () => getDashboardStats());
  }),
  analytics: protectedProcedure.query(async () => {
    return analyticsCache.getOrSet('full', () => getAnalyticsData());
  }),

  /** Generate monthly report for a specific project */
  generateReport: protectedProcedure
    .input(z.object({ projectId: z.number(), clientId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      return generateMonthlyReport(input.projectId, input.clientId);
    }),

  /** Generate monthly reports for ALL active projects */
  generateAllReports: protectedProcedure.mutation(async ({ ctx }) => {
      checkOwner(ctx);
    return generateAllMonthlyReports();
  }),
});
