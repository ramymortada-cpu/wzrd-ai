/**
 * LIVE INTELLIGENCE SYSTEM
 * ========================
 * 
 * This is the bridge between the Research Engine and the Knowledge Base.
 * It makes the AI Brain ALIVE — it can search, learn, and grow.
 * 
 * 4 CAPABILITIES:
 * 
 * 1. RESEARCH → KNOWLEDGE PIPELINE
 *    When research is conducted, automatically extract knowledge entries.
 *    "Research Sahra Café competitors" → creates competitor_intel entries
 * 
 * 2. CHAT-TRIGGERED RESEARCH  
 *    When the AI is chatting and needs info it doesn't have, it can search.
 *    "What's the café market size in Riyadh?" → searches → answers → saves as knowledge
 * 
 * 3. KNOWLEDGE REFRESH
 *    Market data gets stale. This checks and refreshes outdated entries.
 *    Entries older than 6 months with market data → auto-research → update
 * 
 * 4. DEEP RESEARCH (on-demand)
 *    "Research everything about F&B branding in Saudi Arabia"
 *    → Google search + academic search + competitor analysis
 *    → AI synthesis → 5-10 knowledge entries created automatically
 */

import { logger } from './_core/logger';
import {
  searchAcademic, scrapeWebsite,
} from './researchEngine';
import { smartSearch } from './researchQuota';
import {
  createKnowledgeEntry, getKnowledgeEntries, updateKnowledgeEntry,
  setCachedResearch, getCachedResearch,
  createResearchReport,
} from './db';
import { amplifyKnowledgeEntry } from './knowledgeAmplifier';
import { resilientLLM } from './_core/llmRouter';

// ════════════════════════════════════════════════════════
// 1. RESEARCH → KNOWLEDGE PIPELINE
// ════════════════════════════════════════════════════════

/**
 * Takes a completed research report and converts it into knowledge entries.
 * This is the main bridge between research and the knowledge base.
 * 
 * A single research report can produce 3-8 knowledge entries:
 * - Market overview → market_insight
 * - Each competitor → competitor_intel
 * - Key trends → market_insight
 * - Strategic recommendations → lesson_learned
 */
export async function researchToKnowledge(
  research: {
    companyName?: string;
    industry: string;
    market: string;
    summary?: string;
    competitors?: Array<{ name: string; description: string; strengths: string[]; weaknesses: string[] }>;
    marketData?: { overview: string; trends: string[]; opportunities: string[]; challenges: string[] };
    keyInsights?: string[];
    recommendations?: string[];
    webResults?: Array<{ title: string; snippet: string; url: string }>;
  },
  options?: { amplify?: boolean; source?: string }
): Promise<{ entriesCreated: number; entryIds: number[] }> {
  const entryIds: number[] = [];
  const amplify = options?.amplify ?? true;

  try {
    // ── Market Overview Entry ──
    if (research.marketData?.overview) {
      const content = `## ${research.industry} Market — ${research.market}

**Overview:** ${research.marketData.overview}

**Key Trends:**
${(research.marketData.trends || []).map(t => `- ${t}`).join('\n')}

**Opportunities:**
${(research.marketData.opportunities || []).map(o => `- ${o}`).join('\n')}

**Challenges:**
${(research.marketData.challenges || []).map(c => `- ${c}`).join('\n')}

**Sources:** Auto-researched via Live Intelligence System${research.webResults?.length ? ` (${research.webResults.length} web sources analyzed)` : ''}
**Data Date:** ${new Date().toISOString().split('T')[0]}`;

      const id = await createKnowledgeEntry({
        title: `${research.industry} Market Intelligence — ${research.market} (${new Date().getFullYear()})`,
        content,
        category: 'market_insight',
        industry: research.industry,
        market: research.market,
        source: 'research_import',
        tags: [research.industry.toLowerCase(), research.market, 'market_data', 'auto_research'],
      });
      if (id) entryIds.push(id);
    }

    // ── Competitor Entries ──
    if (research.competitors && research.competitors.length > 0) {
      for (const comp of research.competitors.slice(0, 5)) {
        const content = `## Competitor: ${comp.name}

**Description:** ${comp.description}

**Strengths:**
${comp.strengths.map(s => `- ${s}`).join('\n')}

**Weaknesses:**
${comp.weaknesses.map(w => `- ${w}`).join('\n')}

**How Primo Marca wins:** Our data-driven, framework-backed approach provides deeper strategic value than ${comp.name}'s offering.
**Researched:** ${new Date().toISOString().split('T')[0]}`;

        const id = await createKnowledgeEntry({
          title: `Competitor Intel: ${comp.name} (${research.market})`,
          content,
          category: 'competitor_intel' as const,
          industry: research.industry,
          market: research.market,
          source: 'research_import' as const,
          tags: [comp.name.toLowerCase(), 'competitor', research.market, research.industry.toLowerCase()],
        });
        if (id) entryIds.push(id);
      }
    }

    // ── Key Insights as Lessons ──
    if (research.keyInsights && research.keyInsights.length > 0) {
      const content = `## Research Insights: ${research.industry} in ${research.market}

${research.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n\n')}

${research.recommendations ? `\n**Strategic Recommendations:**\n${research.recommendations.map(r => `- ${r}`).join('\n')}` : ''}

**Source:** Auto-research conducted ${new Date().toISOString().split('T')[0]}
${research.companyName ? `**Context:** Research conducted for/about ${research.companyName}` : ''}`;

      const id = await createKnowledgeEntry({
        title: `Research Insights: ${research.industry} — ${research.market} (${new Date().getFullYear()})`,
        content,
        category: 'lesson_learned',
        industry: research.industry,
        market: research.market,
        source: 'research_import',
        tags: ['research_insights', research.industry.toLowerCase(), research.market, 'auto_research'],
      });
      if (id) entryIds.push(id);
    }

    // ── Amplify entries if requested ──
    if (amplify && entryIds.length > 0) {
      // Amplify only the first entry to save LLM costs
      try {
        const entry = await import('./db').then(db => db.getKnowledgeEntryById(entryIds[0]));
        if (entry) {
          const amplified = await amplifyKnowledgeEntry({
            title: entry.title, content: entry.content,
            category: entry.category, industry: entry.industry || undefined,
            market: entry.market || undefined,
          });
          await updateKnowledgeEntry(entryIds[0], {
            content: amplified.enrichedContent,
            tags: [...((entry.tags as string[]) || []), ...amplified.suggestedTags].slice(0, 20),
          });
        }
      } catch (err) {
        logger.debug({ err }, 'Amplification of research entry skipped');
      }
    }

    logger.info({
      industry: research.industry,
      market: research.market,
      entriesCreated: entryIds.length,
    }, 'Research converted to knowledge entries');

    return { entriesCreated: entryIds.length, entryIds };
  } catch (err) {
    logger.error({ err }, 'Research to knowledge conversion failed');
    return { entriesCreated: 0, entryIds: [] };
  }
}

// ════════════════════════════════════════════════════════
// 2. CHAT-TRIGGERED RESEARCH (inline research)
// ════════════════════════════════════════════════════════

/**
 * Performs quick research on a topic and returns the results as context.
 * Used when the AI needs real-time information during a conversation.
 * 
 * Also saves the research as a knowledge entry for future use.
 */
export async function liveResearch(
  query: string,
  context?: { industry?: string; market?: string }
): Promise<{ answer: string; sources: string[]; knowledgeEntryId?: number }> {
  try {
    // Check cache first
    const cacheKey = `live:${query}:${context?.industry}:${context?.market}`;
    const cached = await getCachedResearch(cacheKey);
    if (cached) {
      return {
        answer: typeof cached.results === 'string' ? cached.results : JSON.stringify(cached.results),
        sources: ['cached'],
      };
    }

    // Search the web
    const searchResults = await smartSearch(query, 5);

    // If we have URLs, scrape top 2 for deeper content
    const scrapedContent: string[] = [];
    for (const result of searchResults.slice(0, 2)) {
      if (result.url && result.url.startsWith('http')) {
        try {
          const scraped = await scrapeWebsite(result.url);
          if (scraped?.content) {
            scrapedContent.push(scraped.content.substring(0, 2000));
          }
        } catch { /* Skip failed scrapes */ }
      }
    }

    // Synthesize with AI
    const searchContext = searchResults.map(r => `[${r.source}] ${r.title}: ${r.snippet}`).join('\n');
    const scrapedContext = scrapedContent.join('\n---\n');

    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a brand strategy research assistant. Synthesize the search results into a clear, factual answer. Include specific numbers, data points, and sources where available. Focus on what's useful for brand consulting in the MENA region.`
        },
        {
          role: 'user',
          content: `Research question: "${query}"
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.market ? `Market: ${context.market}` : ''}

Search Results:
${searchContext}

${scrapedContext ? `Detailed Content:\n${scrapedContext}` : ''}

Provide a comprehensive answer with specific data points.`
        },
      ],
    }, { context: 'research' });

    const answer = response.choices[0].message.content as string;
    const sources = searchResults.map(r => r.url).filter(Boolean);

    // Cache the result
    await setCachedResearch({
      cacheKey,
      queryType: 'quick',
      industry: context?.industry,
      market: context?.market,
      results: answer,
      sourcesCount: sources.length,
    });

    // Save as knowledge entry if it's substantial
    let knowledgeEntryId: number | undefined;
    if (answer.length > 200) {
      try {
        knowledgeEntryId = await createKnowledgeEntry({
          title: `Research: ${query.substring(0, 200)}`,
          content: `${answer}\n\n**Sources:** ${sources.join(', ')}\n**Researched:** ${new Date().toISOString().split('T')[0]}`,
          category: 'market_insight',
          industry: context?.industry ?? undefined,
          market: context?.market ?? undefined,
          source: 'research_import',
          tags: ['live_research', 'auto_research', ...(context?.industry ? [context.industry.toLowerCase()] : [])],
        });
      } catch (err) {
        logger.debug({ err }, 'Failed to save live research as knowledge entry');
      }
    }

    logger.info({ query, sources: sources.length, saved: !!knowledgeEntryId }, 'Live research completed');

    return { answer, sources, knowledgeEntryId };
  } catch (err) {
    logger.error({ err, query }, 'Live research failed');
    return { answer: 'Research could not be completed at this time.', sources: [] };
  }
}

// ════════════════════════════════════════════════════════
// 3. KNOWLEDGE REFRESH SYSTEM
// ════════════════════════════════════════════════════════

/**
 * Identifies stale knowledge entries and refreshes them.
 * 
 * Rules:
 * - market_insight older than 6 months → refresh
 * - competitor_intel older than 3 months → refresh
 * - Other categories → skip (they're evergreen)
 * 
 * Returns: list of entries that were refreshed
 */
export async function refreshStaleKnowledge(options?: {
  maxRefreshes?: number;
  dryRun?: boolean;
}): Promise<{
  staleEntries: number;
  refreshed: number;
  details: Array<{ id: number; title: string; category: string; age: string; refreshed: boolean }>;
}> {
  const maxRefreshes = options?.maxRefreshes || 5;
  const dryRun = options?.dryRun || false;
  const details: Array<{ id: number; title: string; category: string; age: string; refreshed: boolean }> = [];

  // Thresholds
  const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;
  const THREE_MONTHS = 3 * 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Get market insights
  const marketInsights = await getKnowledgeEntries({ category: 'market_insight' });
  const competitorIntel = await getKnowledgeEntries({ category: 'competitor_intel' });

  const allEntries = [
    ...marketInsights.map(e => ({ ...e, threshold: SIX_MONTHS })),
    ...competitorIntel.map(e => ({ ...e, threshold: THREE_MONTHS })),
  ];

  let staleCount = 0;
  let refreshedCount = 0;

  for (const entry of allEntries) {
    const age = now - new Date(entry.updatedAt).getTime();
    const isStale = age > entry.threshold;
    const ageLabel = `${Math.round(age / (30 * 24 * 60 * 60 * 1000))} months`;

    if (!isStale) continue;
    staleCount++;

    if (refreshedCount >= maxRefreshes) {
      details.push({ id: entry.id, title: entry.title, category: entry.category, age: ageLabel, refreshed: false });
      continue;
    }

    if (!dryRun) {
      try {
        // Research the topic again
        const query = entry.category === 'competitor_intel'
          ? `${entry.title.replace('Competitor Intel: ', '')} branding agency`
          : entry.title;

        const research = await liveResearch(query, {
          industry: entry.industry || undefined,
          market: entry.market || undefined,
        });

        if (research.answer && research.answer.length > 100) {
          // Append updated data to existing content
          const updatedContent = entry.content + `\n\n---\n**Updated ${new Date().toISOString().split('T')[0]}:**\n${research.answer}`;
          await updateKnowledgeEntry(entry.id, { content: updatedContent });
          refreshedCount++;
          details.push({ id: entry.id, title: entry.title, category: entry.category, age: ageLabel, refreshed: true });
        } else {
          details.push({ id: entry.id, title: entry.title, category: entry.category, age: ageLabel, refreshed: false });
        }
      } catch (err) {
        logger.warn({ err, entryId: entry.id }, 'Failed to refresh stale entry');
        details.push({ id: entry.id, title: entry.title, category: entry.category, age: ageLabel, refreshed: false });
      }
    } else {
      details.push({ id: entry.id, title: entry.title, category: entry.category, age: ageLabel, refreshed: false });
    }
  }

  logger.info({ staleCount, refreshedCount, dryRun }, 'Knowledge refresh completed');
  return { staleEntries: staleCount, refreshed: refreshedCount, details };
}

// ════════════════════════════════════════════════════════
// 4. DEEP RESEARCH (on-demand topic research)
// ════════════════════════════════════════════════════════

/**
 * Conducts deep research on a topic and creates multiple knowledge entries.
 * 
 * Example: deepResearch("F&B branding in Saudi Arabia")
 * → Searches Google for market data, trends, competitors
 * → Searches academic papers for branding frameworks
 * → Synthesizes everything
 * → Creates 5-10 knowledge entries across categories
 */
export async function deepResearch(
  topic: string,
  context: { industry?: string; market?: string }
): Promise<{
  entriesCreated: number;
  entryIds: number[];
  summary: string;
  sourcesUsed: number;
}> {
  logger.info({ topic, context }, 'Starting deep research');

  try {
    // Step 1: Multiple search queries to cover the topic broadly
    const searchQueries = [
      `${topic} market size data statistics`,
      `${topic} trends ${new Date().getFullYear()}`,
      `${topic} top companies brands competitors`,
      `${topic} consumer behavior preferences`,
      `${topic} challenges opportunities`,
    ];

    const allSearchResults = [];
    for (const query of searchQueries) {
      const results = await smartSearch(query, 5);
      allSearchResults.push(...results);
    }

    // Deduplicate
    const uniqueResults = allSearchResults.filter(
      (r, i, arr) => arr.findIndex(x => x.url === r.url) === i
    );

    // Step 2: Scrape top 3 most promising URLs
    const scrapedPages = [];
    for (const result of uniqueResults.slice(0, 3)) {
      if (result.url?.startsWith('http')) {
        try {
          const scraped = await scrapeWebsite(result.url);
          if (scraped?.content) scrapedPages.push(scraped);
        } catch { /* Skip */ }
      }
    }

    // Step 3: Academic search
    const academicResults = await searchAcademic(`${topic} branding strategy`, 5);

    // Step 4: AI synthesis — create structured knowledge entries
    const searchContext = uniqueResults.map(r => `[${r.source}] ${r.title}: ${r.snippet}`).join('\n');
    const scrapedContext = scrapedPages.map(p => `[${p.title}]: ${p.content?.substring(0, 1500)}`).join('\n---\n');
    const academicContext = academicResults.map(r => `[${r.year}] ${r.title} by ${r.authors}: ${r.snippet}`).join('\n');

    const response = await resilientLLM({
      messages: [
        {
          role: 'system',
          content: `You are a senior brand strategy researcher for Primo Marca, a premium brand engineering agency in MENA. 

Your job: Take raw research data and create STRUCTURED knowledge entries that the AI Brain can use in future client conversations.

Each entry must be:
- Specific with real numbers and data
- Actionable for brand consulting
- Connected to brand strategy frameworks where applicable
- Focused on what matters for MENA market clients

Respond in JSON format.`
        },
        {
          role: 'user',
          content: `RESEARCH TOPIC: ${topic}
${context.industry ? `Industry: ${context.industry}` : ''}
${context.market ? `Market: ${context.market}` : ''}

WEB SEARCH DATA (${uniqueResults.length} results):
${searchContext}

SCRAPED CONTENT:
${scrapedContext}

ACADEMIC PAPERS:
${academicContext}

Create 5-8 knowledge entries from this research. Return JSON:
{
  "summary": "2-3 sentence summary of overall findings",
  "entries": [
    {
      "title": "Descriptive title",
      "content": "Detailed content with numbers and specifics (at least 200 words)",
      "category": "market_insight|competitor_intel|lesson_learned|methodology|client_pattern",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`
        },
      ],
    }, { context: 'research' });

    const parsed = JSON.parse(response.choices[0].message.content as string);
    const entries = parsed.entries || [];
    const summary = parsed.summary || 'Research completed.';

    // Step 5: Save all entries to database
    const entryIds: number[] = [];
    for (const entry of entries) {
      const id = await createKnowledgeEntry({
        title: entry.title,
        content: entry.content + `\n\n**Source:** Deep Research — ${topic}\n**Date:** ${new Date().toISOString().split('T')[0]}`,
        category: entry.category,
        industry: context.industry,
        market: context.market,
        source: 'research_import',
        tags: [...(entry.tags || []), 'deep_research', 'auto_research'],
      });
      if (id) entryIds.push(id);
    }

    // Step 6: Save research report
    await createResearchReport({
      companyName: topic,
      industry: context.industry || 'General',
      market: context.market || 'MENA',
      reportData: {
        summary,
        entries: entries.length,
        searchQueries,
        webResults: uniqueResults.length,
        scrapedPages: scrapedPages.length,
        academicResults: academicResults.length,
      },
      status: 'completed',
      totalSources: uniqueResults.length + academicResults.length,
      summary,
      keyInsights: entries.map((e: { title: string }) => e.title),
    });

    logger.info({
      topic,
      entriesCreated: entryIds.length,
      sourcesUsed: uniqueResults.length + academicResults.length,
    }, 'Deep research completed');

    return {
      entriesCreated: entryIds.length,
      entryIds,
      summary,
      sourcesUsed: uniqueResults.length + academicResults.length,
    };
  } catch (err) {
    logger.error({ err, topic }, 'Deep research failed');
    return { entriesCreated: 0, entryIds: [], summary: 'Research failed', sourcesUsed: 0 };
  }
}
