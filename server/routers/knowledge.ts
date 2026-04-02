/**
 * Knowledge Router — CRUD + Templates + AI Amplification + Analytics.
 * 
 * This is the API for the Knowledge Amplification System:
 * - Browse/search knowledge entries
 * - Add entries using structured templates
 * - AI-amplify entries (enrich with frameworks, connections, depth)
 * - Extract knowledge from conversations
 * - Knowledge quality analytics
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner, checkEditor } from "../_core/authorization";
import { z } from "zod";
import { sanitizeObject } from "../_core/sanitize";
import { audit } from "../_core/audit";
import { logger } from "../_core/logger";
import {
  createKnowledgeEntry, getKnowledgeEntries, getKnowledgeEntryById,
  updateKnowledgeEntry, deleteKnowledgeEntry, getKnowledgeStats,
} from "../db";
import { getResearchReportById } from "../db/research";
import {
  KNOWLEDGE_TEMPLATES, amplifyKnowledgeEntry, extractKnowledgeFromConversation,
  scoreKnowledgeQuality, getKnowledgeAnalytics,
} from "../knowledgeAmplifier";
import { researchToKnowledge } from "../liveIntelligence";
import { getAvailableTemplates as getPrimoTemplates, processFilledTemplate } from "../primoTemplates";
import { semanticSearch as vectorSemanticSearch, indexKnowledgeBase, getIndexStats } from "../vectorSearch";

export const knowledgeRouter = router({
  /** List entries with filters */
  list: protectedProcedure
    .input(z.object({
      category: z.string().max(100).optional(),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
      search: z.string().max(255).optional(),
    }).optional())
    .query(async ({ input }) => getKnowledgeEntries(input)),

  /** Get single entry */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const entry = await getKnowledgeEntryById(input.id);
      if (!entry) return null;
      // Include quality score
      const quality = scoreKnowledgeQuality({ ...entry, tags: Array.isArray(entry.tags) ? entry.tags as string[] : undefined });
      return { ...entry, qualityScore: quality.score, qualitySuggestions: quality.suggestions };
    }),

  /** Create a new knowledge entry */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      content: z.string().min(1).max(50000),
      category: z.enum([
        'case_study', 'framework', 'lesson_learned', 'market_insight',
        'competitor_intel', 'client_pattern', 'methodology', 'template', 'general',
      ]).default('general'),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      source: z.enum(['manual', 'research_import', 'ai_generated', 'conversation_extract']).default('manual'),
      tags: z.array(z.string().max(100)).max(20).optional(),
      /** If true, AI will amplify the entry after creation */
      amplify: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const { amplify, ...data } = sanitizeObject(input);
      const id = await createKnowledgeEntry(data);

      // Auto-amplify if requested
      if (amplify && id) {
        try {
          const amplified = await amplifyKnowledgeEntry({
            title: data.title, content: data.content, category: data.category,
            industry: data.industry, market: data.market,
          });

          // Update with enriched content
          await updateKnowledgeEntry(id, {
            content: amplified.enrichedContent,
            tags: [...(data.tags || []), ...amplified.suggestedTags].slice(0, 20),
          });

          logger.info({ id, title: data.title }, 'Knowledge entry created and amplified');
          return { id, amplified: true, insight: amplified.aiInsight, frameworks: amplified.connectedFrameworks };
        } catch (err) {
          logger.warn({ err, id }, 'Amplification failed, entry saved without enrichment');
        }
      }

      await audit('knowledge_entries', id, 'create', ctx.user?.id);
      return { id, amplified: false };
    }),

  /** Update a knowledge entry */
  update: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      title: z.string().max(500).optional(),
      content: z.string().max(50000).optional(),
      category: z.string().max(100).optional(),
      tags: z.array(z.string().max(100)).max(20).optional(),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const { id, ...data } = sanitizeObject(input);
      await updateKnowledgeEntry(id, { ...data, category: data.category as "methodology" | "case_study" | "framework" | "lesson_learned" | "market_insight" | "competitor_intel" | "client_pattern" | "template" | "general" | undefined });
      await audit('knowledge_entries', id, 'update', ctx.user?.id);
      return { success: true };
    }),

  /** Delete (soft) a knowledge entry */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx); // Only owner can delete
      await deleteKnowledgeEntry(input.id);
      await audit('knowledge_entries', input.id, 'delete', ctx.user?.id);
      return { success: true };
    }),

  /** Import knowledge from a research report */
  importFromResearch: protectedProcedure
    .input(z.object({ reportId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const report = await getResearchReportById(input.reportId);
      if (!report) throw new Error('Research report not found');
      const data = report.reportData as { summary?: string; competitors?: unknown[]; marketData?: unknown; keyInsights?: string[]; recommendations?: string[]; webResults?: unknown[] } | null;
      const result = await researchToKnowledge({
        companyName: report.companyName || undefined,
        industry: report.industry || 'General',
        market: report.market || 'Egypt',
        summary: data?.summary,
        competitors: data?.competitors as { name: string; description: string; strengths: string[]; weaknesses: string[] }[] | undefined,
        marketData: data?.marketData as { overview: string; trends: string[]; opportunities: string[]; challenges: string[] } | undefined,
        keyInsights: data?.keyInsights,
        recommendations: data?.recommendations,
        webResults: data?.webResults as { title: string; snippet: string; url: string }[] | undefined,
      }, { amplify: true });
      return { imported: result.entriesCreated };
    }),

  /** Get knowledge templates for structured entry */
  templates: protectedProcedure.query(() => {
    return KNOWLEDGE_TEMPLATES.map(t => ({
      id: t.id, name: t.name, nameAr: t.nameAr,
      description: t.description, descriptionAr: t.descriptionAr,
      category: t.category, fields: t.fields,
    }));
  }),

  /** Create entry from template */
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string().max(100),
      data: z.record(z.string(), z.any()),
      amplify: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const template = KNOWLEDGE_TEMPLATES.find(t => t.id === input.templateId);
      if (!template) throw new Error('Template not found');

      // Format data using template's formatter
      const formattedContent = template.formatForAI(input.data);
      const title = input.data.title || input.data.brandName || input.data.competitorName || input.data.patternName || 'Untitled';

      // Extract tags from data
      const tags: string[] = [];
      if (input.data.tags) tags.push(...(Array.isArray(input.data.tags) ? input.data.tags : String(input.data.tags).split(',').map((t: string) => t.trim())));
      if (input.data.industry) tags.push(String(input.data.industry).toLowerCase());
      if (input.data.market) tags.push(String(input.data.market));
      if (input.data.frameworksUsed) {
        const fws = Array.isArray(input.data.frameworksUsed) ? input.data.frameworksUsed : String(input.data.frameworksUsed).split(',').map((t: string) => t.trim());
        tags.push(...fws);
      }

      const entryData = {
        title: String(title).substring(0, 500),
        content: formattedContent,
        category: template.category as 'case_study' | 'framework' | 'lesson_learned' | 'market_insight' | 'competitor_intel' | 'client_pattern' | 'methodology' | 'template' | 'general',
        industry: input.data.industry != null ? String(input.data.industry) : undefined,
        market: input.data.market != null ? String(input.data.market) : undefined,
        source: 'manual' as const,
        tags: [...new Set(tags)].slice(0, 20),
      };

      const id = await createKnowledgeEntry(entryData);

      // Auto-amplify
      if (input.amplify && id) {
        try {
          const amplified = await amplifyKnowledgeEntry({
            title: entryData.title, content: formattedContent,
            category: entryData.category, industry: entryData.industry, market: entryData.market,
          });
          await updateKnowledgeEntry(id, {
            content: amplified.enrichedContent,
            tags: [...entryData.tags, ...amplified.suggestedTags].slice(0, 20),
          });
          logger.info({ id, template: input.templateId }, 'Template entry created and amplified');
          return { id, amplified: true, insight: amplified.aiInsight, frameworks: amplified.connectedFrameworks };
        } catch (err) {
          logger.warn({ err }, 'Template amplification failed');
        }
      }

      return { id, amplified: false };
    }),

  /** AI-amplify an existing entry */
  amplify: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const entry = await getKnowledgeEntryById(input.id);
      if (!entry) throw new Error('Entry not found');

      const amplified = await amplifyKnowledgeEntry({
        title: entry.title, content: entry.content, category: entry.category,
        industry: entry.industry || undefined, market: entry.market || undefined,
      });

      await updateKnowledgeEntry(input.id, {
        content: amplified.enrichedContent,
        tags: [...((entry.tags as string[]) || []), ...amplified.suggestedTags].slice(0, 20),
      });

      return { success: true, insight: amplified.aiInsight, frameworks: amplified.connectedFrameworks };
    }),

  /** Extract knowledge from a conversation */
  extractFromConversation: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({ role: z.string(), content: z.string() })),
      clientName: z.string().max(255).optional(),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
      serviceType: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const extracted = await extractKnowledgeFromConversation(
        input.messages,
        { clientName: input.clientName, industry: input.industry, market: input.market, serviceType: input.serviceType },
      );

      const savedIds: number[] = [];
      for (const entry of extracted) {
        const id = await createKnowledgeEntry({
          title: entry.title, content: entry.content,
          category: entry.category as 'case_study' | 'framework' | 'lesson_learned' | 'market_insight' | 'competitor_intel' | 'client_pattern' | 'methodology' | 'template' | 'general',
          source: 'conversation_extract',
          tags: entry.tags,
          industry: input.industry,
          market: input.market,
        });
        if (id) savedIds.push(id);
      }

      return { extracted: extracted.length, savedIds };
    }),

  /** Get quality score for an entry */
  quality: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const entry = await getKnowledgeEntryById(input.id);
      if (!entry) throw new Error('Entry not found');
      return scoreKnowledgeQuality({ ...entry, tags: Array.isArray(entry.tags) ? entry.tags as string[] : undefined });
    }),

  /** Knowledge base stats */
  stats: protectedProcedure.query(async () => getKnowledgeStats()),

  /** Comprehensive analytics */
  analytics: protectedProcedure.query(async () => getKnowledgeAnalytics()),

  /** Get Primo experience templates (for Ramy) */
  primoTemplates: protectedProcedure.query(() => getPrimoTemplates()),

  /** Process a filled Primo template */
  submitPrimoTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string().max(100),
      data: z.record(z.string(), z.any()),
      amplify: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => { checkEditor(ctx); return processFilledTemplate(input.templateId, input.data, { amplify: input.amplify }); }),

  /** Semantic search — find knowledge by meaning */
  semanticSearch: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      limit: z.number().int().min(1).max(20).default(5),
      category: z.string().max(100).optional(),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .query(async ({ input }) => vectorSemanticSearch(input.query, input)),

  /** Re-index knowledge for semantic search */
  reindex: protectedProcedure.mutation(async ({ ctx }) => { checkEditor(ctx); return indexKnowledgeBase(); }),

  /** Vector search index stats */
  indexStats: protectedProcedure.query(() => getIndexStats()),

  /** Migrate static knowledge to dynamic DB entries */
  migrateStatic: protectedProcedure.mutation(async ({ ctx }) => {
    checkEditor(ctx);
    const { migrateStaticKnowledge } = await import('../knowledgeMigration');
    return migrateStaticKnowledge();
  }),
});
