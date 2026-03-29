/**
 * Admin Router — System Monitoring & Management
 * ===============================================
 * 
 * Owner-only endpoints:
 * - Prompt Lab (A/B testing)
 * - Research Quota monitoring
 * - System health
 * - User role management
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { checkOwner, getPermissionsForRole, type UserRole } from "../_core/authorization";
import {
  createPromptVersion, activateVersion, getActivePrompt,
  recordPromptMetric, analyzeABTest, getPromptLabDashboard, listPrompts,
} from "../promptLab";
import { getQuotaStats, smartSearch } from "../researchQuota";
import { getLLMStats, isLLMHealthy } from "../_core/llmRouter";
import { getCacheStats } from "../_core/llmCache";

export const adminRouter = router({
  // ════════════════════════════════════════════
  // PROMPT LAB
  // ════════════════════════════════════════════

  /** Create a new prompt version */
  promptCreate: protectedProcedure
    .input(z.object({
      promptName: z.string().min(1).max(200),
      content: z.string().min(10).max(50000),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      return createPromptVersion(input.promptName, input.content);
    }),

  /** Activate a specific prompt version */
  promptActivate: protectedProcedure
    .input(z.object({
      promptName: z.string().min(1).max(200),
      version: z.number().int().positive(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const success = activateVersion(input.promptName, input.version);
      return { success };
    }),

  /** Get active prompt content */
  promptGet: protectedProcedure
    .input(z.object({
      promptName: z.string().min(1).max(200),
      conversationId: z.number().optional(),
    }))
    .query(({ input, ctx }) => {
      checkOwner(ctx);
      return getActivePrompt(input.promptName, input.conversationId);
    }),

  /** Record a metric for prompt A/B testing */
  promptRecordMetric: protectedProcedure
    .input(z.object({
      promptName: z.string().min(1).max(200),
      version: z.number().int().positive(),
      qualityScore: z.number().min(0).max(100).optional(),
      ownerRating: z.number().min(1).max(5).optional(),
      responseTimeMs: z.number().optional(),
      tokensUsed: z.number().optional(),
    }))
    .mutation(({ input, ctx }) => {
      checkOwner(ctx);
      const { promptName, version, ...metrics } = input;
      recordPromptMetric(promptName, version, metrics);
      return { success: true };
    }),

  /** Analyze A/B test results */
  promptAnalyze: protectedProcedure
    .input(z.object({ promptName: z.string().min(1).max(200) }))
    .query(({ input, ctx }) => {
      checkOwner(ctx);
      return analyzeABTest(input.promptName);
    }),

  /** Prompt Lab dashboard — all prompts + metrics + tests */
  promptDashboard: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    return getPromptLabDashboard();
  }),

  /** List all prompt names */
  promptList: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    return listPrompts();
  }),

  // ════════════════════════════════════════════
  // RESEARCH QUOTA
  // ════════════════════════════════════════════

  /** Get research quota stats for today */
  quotaStats: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    return getQuotaStats();
  }),

  /** Smart search (uses quota manager) */
  smartSearch: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      numResults: z.number().int().min(1).max(20).default(10),
      skipKnowledge: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      return smartSearch(input.query, input.numResults, {
        skipKnowledge: input.skipKnowledge,
      });
    }),

  // ════════════════════════════════════════════
  // SYSTEM HEALTH
  // ════════════════════════════════════════════

  /** Full system health check */
  systemHealth: protectedProcedure.query(({ ctx }) => {
    checkOwner(ctx);
    const llmStats = getLLMStats();
    const cacheStats = getCacheStats();
    const quotaStats = getQuotaStats();

    return {
      status: isLLMHealthy() ? 'healthy' : 'degraded',
      llm: {
        healthy: isLLMHealthy(),
        ...llmStats,
      },
      cache: cacheStats,
      research: quotaStats,
      timestamp: new Date().toISOString(),
    };
  }),

  // ════════════════════════════════════════════
  // RBAC
  // ════════════════════════════════════════════

  /** Get permissions for a role */
  permissions: protectedProcedure
    .input(z.object({
      role: z.enum(['owner', 'editor', 'viewer']),
    }))
    .query(({ input, ctx }) => {
      checkOwner(ctx);
      return {
        role: input.role,
        permissions: getPermissionsForRole(input.role as UserRole),
      };
    }),

  /** Get current user's role and permissions */
  myRole: protectedProcedure.query(({ ctx }) => {
    const role = (ctx as { user?: { role?: string } }).user?.role || 'owner';
    return {
      role,
      permissions: getPermissionsForRole(role as UserRole),
    };
  }),

  /** Admin: Send test email to verify email config */
  testEmail: protectedProcedure
    .input(z.object({ to: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const { sendWelcomeEmail } = await import('../wzrdEmails');
      const sent = await sendWelcomeEmail(input.to, 'Test User');
      return { success: sent, message: sent ? 'Test email sent!' : 'Email sending failed — check EMAIL_PROVIDER config' };
    }),

  /** Admin: Preview email template HTML (renders in browser) */
  previewEmail: protectedProcedure
    .input(z.object({
      template: z.enum(['welcome', 'toolResult', 'guide']),
    }))
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      if (input.template === 'welcome') {
        return { html: `<p>Use admin.testEmail to send a real welcome email and check your inbox.</p><p>Template: Welcome email with 100 credits CTA, tool list, WZZRD AI branding.</p>` };
      }
      if (input.template === 'toolResult') {
        return { html: `<p>Template: Tool result email with score circle (color-coded), findings list, recommendation, and guide CTA.</p><p>Triggered automatically after each AI tool run.</p>` };
      }
      return { html: `<p>Template: Guide download email with PDF link CTA and "use your credits" secondary CTA.</p><p>Triggered when user downloads a guide from /guides/*.</p>` };
    }),

  /** Admin: Ping LLM provider to verify connectivity */
  pingLLM: protectedProcedure
    .input(z.object({ provider: z.enum(['groq', 'claude']).optional() }))
    .mutation(async ({ input: _input, ctx }) => {
      checkOwner(ctx);
      const start = Date.now();
      try {
        const { resilientLLM } = await import('../_core/llmRouter');
        const result = await resilientLLM({
          messages: [{ role: 'user', content: 'Reply with exactly: PONG' }],
        }, { context: 'chat' });
        const elapsed = Date.now() - start;
        const reply = result.choices?.[0]?.message?.content || '';
        return { success: true, provider: result.model || 'unknown', responseTime: elapsed, reply: (typeof reply === 'string' ? reply : JSON.stringify(reply)).substring(0, 50) };
      } catch (err: unknown) {
        const elapsed = Date.now() - start;
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, provider: 'none', responseTime: elapsed, reply: msg.substring(0, 100) };
      }
    }),
});
