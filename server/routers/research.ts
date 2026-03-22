/**
 * Research Router — web research + live intelligence + knowledge pipeline.
 * 
 * NEW: Research results automatically feed into the Knowledge Base.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { checkEditor } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { conductResearch, quickResearch } from "../researchEngine";
import {
  getCachedResearch, setCachedResearch, createResearchReport,
  getResearchReportById, getResearchReportsByClient, getAllResearchReports,
  updateResearchReport, getResearchStats, getResearchCacheByIndustryMarket,
} from "../db";
import { researchToKnowledge, liveResearch, deepResearch, refreshStaleKnowledge } from "../liveIntelligence";

export const researchRouter = router({
  /** Quick research with auto-caching */
  quick: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const cacheKey = `quick:${input.query}:${input.industry}:${input.market}`;
      const cached = await getCachedResearch(cacheKey);
      if (cached) return { results: cached.results, fromCache: true };

      const queryStr = [input.query, input.industry, input.market].filter(Boolean).join(" ");
      const results = await quickResearch(queryStr);
      await setCachedResearch({
        cacheKey, queryType: 'quick', industry: input.industry,
        market: input.market, results, sourcesCount: Array.isArray(results) ? results.length : 0,
      });
      return { results, fromCache: false };
    }),

  /** Alias for client compatibility — same as full, returns { id, summary } */
  conductFull: protectedProcedure
    .input(z.object({
      companyName: z.string().max(255),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
      website: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const industry = input.industry || 'General';
      const market = input.market || 'Egypt';
      const reportId = await createResearchReport({
        companyName: input.companyName, industry, market,
        reportData: {}, status: 'pending',
      });
      try {
        const data = await conductResearch({
          companyName: input.companyName, industry, market,
        });
        await updateResearchReport(reportId, {
          reportData: data, status: 'completed', totalSources: data?.totalSources || 0,
          summary: data?.summary, keyInsights: data?.keyInsights, recommendations: data?.recommendations,
        });
        if (data) {
          await researchToKnowledge({
            companyName: input.companyName, industry, market,
            summary: data.summary, competitors: data.competitors, marketData: data.marketData ?? undefined,
            keyInsights: data.keyInsights, recommendations: data.recommendations, webResults: data.webResults,
          }, { amplify: true });
        }
        return { id: reportId, summary: data?.summary || 'Research completed' };
      } catch (e) {
        await updateResearchReport(reportId, { status: 'failed' });
        throw e;
      }
    }),

  /** Full research that auto-creates knowledge entries */
  full: protectedProcedure
    .input(z.object({
      companyName: z.string().max(255),
      industry: z.string().max(255),
      market: z.string().max(100),
      clientId: z.number().optional(),
      projectId: z.number().optional(),
      /** Auto-convert research results to knowledge entries */
      feedKnowledge: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      const reportId = await createResearchReport({
        companyName: input.companyName, industry: input.industry, market: input.market,
        clientId: input.clientId, projectId: input.projectId, reportData: {}, status: 'pending',
      });

      try {
        const data = await conductResearch({
          companyName: input.companyName, industry: input.industry, market: input.market,
        });
        await updateResearchReport(reportId, {
          reportData: data, status: 'completed', totalSources: data?.totalSources || 0,
          summary: data?.summary, keyInsights: data?.keyInsights, recommendations: data?.recommendations,
        });

        // NEW: Auto-feed research into knowledge base
        let knowledgeResult = { entriesCreated: 0, entryIds: [] as number[] };
        if (input.feedKnowledge && data) {
          knowledgeResult = await researchToKnowledge({
            companyName: input.companyName,
            industry: input.industry,
            market: input.market,
            summary: data.summary,
            competitors: data.competitors,
            marketData: data.marketData ?? undefined,
            keyInsights: data.keyInsights,
            recommendations: data.recommendations,
            webResults: data.webResults,
          }, { amplify: true });
        }

        logger.info({
          reportId, knowledgeEntries: knowledgeResult.entriesCreated,
        }, 'Full research completed with knowledge pipeline');

        return {
          reportId, status: 'completed',
          knowledgeEntriesCreated: knowledgeResult.entriesCreated,
        };
      } catch (e) {
        await updateResearchReport(reportId, { status: 'failed' });
        throw e;
      }
    }),

  /** Live research — search the web and get an instant answer + save as knowledge */
  live: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      return liveResearch(input.query, { industry: input.industry, market: input.market });
    }),

  /** Deep research — comprehensive topic research → multiple knowledge entries */
  deep: protectedProcedure
    .input(z.object({
      topic: z.string().min(1).max(500),
      industry: z.string().max(255).optional(),
      market: z.string().max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      return deepResearch(input.topic, { industry: input.industry, market: input.market });
    }),

  /** Refresh stale knowledge entries */
  refreshStale: protectedProcedure
    .input(z.object({
      maxRefreshes: z.number().int().min(1).max(20).default(5),
      dryRun: z.boolean().default(false),
    }).optional())
    .mutation(async ({ input, ctx }) => {
      checkEditor(ctx);
      return refreshStaleKnowledge({
        maxRefreshes: input?.maxRefreshes || 5,
        dryRun: input?.dryRun || false,
      });
    }),

  /** Get report by ID */
  getReport: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => getResearchReportById(input.id)),

  /** Get reports for a client */
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.number().int().positive() }))
    .query(async ({ input }) => getResearchReportsByClient(input.clientId)),

  /** List all reports */
  listReports: protectedProcedure.query(async () => getAllResearchReports()),
  /** Alias for client compatibility */
  list: protectedProcedure.query(async () => getAllResearchReports()),

  /** Research stats */
  stats: protectedProcedure.query(async () => getResearchStats()),

  /** Cache by industry/market */
  cache: protectedProcedure
    .input(z.object({ industry: z.string().max(255), market: z.string().max(100) }))
    .query(async ({ input }) => getResearchCacheByIndustryMarket(input.industry, input.market)),
});
