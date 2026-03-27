import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./trpc";
import { checkOwner } from "./authorization";
import { isLLMHealthy, getLLMStats } from "./llmRouter";

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

  /** Test Groq connectivity — owner/admin only; does not expose API key material. */
  testGroq: protectedProcedure.mutation(async ({ ctx }) => {
    checkOwner(ctx);
    try {
      const { ENV } = await import("./env");
      const apiKey = ENV.groqApiKey;
      if (!apiKey) return { success: false as const, error: 'GROQ_API_KEY not set' };

      const response = await fetch(`${ENV.groqApiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: ENV.groqModel,
          messages: [{ role: 'user', content: 'Say "GROQ WORKS" and nothing else.' }],
          max_tokens: 20,
        }),
      });

      const text = await response.text();
      return {
        success: response.ok,
        status: response.status,
        response: text.substring(0, 500),
        model: ENV.groqModel,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false as const, error: msg };
    }
  }),

  /** Detailed system status (admin only) */
  status: adminProcedure.query(async () => {
    const llmStats = getLLMStats();
    let dbConnected = false;
    try {
      const { getDb } = await import("../db/index");
      dbConnected = !!(await getDb());
    } catch {
      /* DB probe failed */
    }

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
