import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { isLLMHealthy, getLLMStats } from "./llmRouter";
import { logger } from "./logger";

export const systemRouter = router({
  /** Comprehensive health check — DB, LLM, system */
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(async () => {
      const checks: Record<string, boolean> = {};
      
      // DB check
      try {
        const { getDb } = await import("../db/index");
        const db = await getDb();
        checks.database = !!db;
      } catch { checks.database = false; }

      // LLM check
      checks.llm = isLLMHealthy();

      // Overall
      const allHealthy = Object.values(checks).every(v => v);

      return {
        ok: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        uptime: Math.floor(process.uptime()),
        timestamp: Date.now(),
      };
    }),

  /** Detailed system status (admin only) */
  status: adminProcedure.query(async () => {
    const llmStats = getLLMStats();
    let dbConnected = false;
    try {
      const { getDb } = await import("../db/index");
      dbConnected = !!(await getDb());
    } catch {}

    return {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      database: dbConnected,
      llm: {
        healthy: isLLMHealthy(),
        stats: llmStats,
      },
    };
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return { success: delivered } as const;
    }),
});
