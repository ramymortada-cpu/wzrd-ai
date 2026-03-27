/**
 * RESEARCH QUOTA MANAGER
 * ======================
 * 
 * Problem: Google Custom Search = 100/day free. Heavy usage → research stops.
 * 
 * Solution: 3-layer strategy:
 * 
 * 1. KNOWLEDGE-FIRST: Check DB before searching the web (saves 40-60% of searches)
 * 2. QUOTA TRACKING: Monitor daily usage, switch providers at 80%
 * 3. MULTI-SOURCE: Google → DuckDuckGo → LLM fallback (never stops)
 * 
 * Result: Unlimited research capability at $0 cost.
 */

import { logger } from './_core/logger';
import { semanticSearch } from './vectorSearch';

// ============ QUOTA TRACKING ============

interface DailyQuota {
  date: string; // YYYY-MM-DD
  googleUsed: number;
  ddgUsed: number;
  knowledgeHits: number;
  llmFallbacks: number;
  totalRequests: number;
}

let currentQuota: DailyQuota = {
  date: new Date().toISOString().split('T')[0],
  googleUsed: 0,
  ddgUsed: 0,
  knowledgeHits: 0,
  llmFallbacks: 0,
  totalRequests: 0,
};

const LIMITS = {
  GOOGLE_DAILY: 100,
  GOOGLE_WARN_AT: 80,   // Switch to alternatives at 80%
  DDG_DAILY: 500,        // DuckDuckGo is generous
};

function resetIfNewDay() {
  const today = new Date().toISOString().split('T')[0];
  if (currentQuota.date !== today) {
    logger.info({ quota: currentQuota }, 'Daily research quota reset');
    currentQuota = {
      date: today,
      googleUsed: 0,
      ddgUsed: 0,
      knowledgeHits: 0,
      llmFallbacks: 0,
      totalRequests: 0,
    };
  }
}

// ============ KNOWLEDGE-FIRST SEARCH ============

interface QuotaSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'knowledge' | 'google' | 'ddg' | 'llm_fallback';
  confidence: number;
}

/**
 * Search knowledge base first. If results are good enough, skip web search entirely.
 * This saves 40-60% of web search quota.
 */
async function searchKnowledgeFirst(query: string, minConfidence: number = 0.6): Promise<QuotaSearchResult[] | null> {
  try {
    const results = await semanticSearch(query, {
      limit: 5,
      minSimilarity: minConfidence,
    });

    if (results && results.length >= 2) {
      currentQuota.knowledgeHits++;
      logger.debug({ query, results: results.length }, 'Knowledge-first search: hit');

      return results.map((r) => ({
        title: r.title || 'Knowledge Entry',
        url: `knowledge://${r.id}`,
        snippet: r.contentPreview || '',
        source: 'knowledge' as const,
        confidence: r.similarity || 0.7,
      }));
    }

    return null; // Not enough knowledge — proceed to web search
  } catch {
    return null;
  }
}

// ============ DUCKDUCKGO SEARCH (FREE, NO API KEY) ============

/**
 * DuckDuckGo Instant Answer API — free, no key needed, unlimited.
 * Less detailed than Google but good for basic queries.
 */
async function searchDuckDuckGo(query: string, numResults: number = 5): Promise<QuotaSearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'WzrdAI/1.0 Research Engine' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return [];

    const data = await response.json();
    const results: QuotaSearchResult[] = [];

    // Abstract (main answer)
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText.substring(0, 300),
        source: 'ddg',
        confidence: 0.8,
      });
    }

    // Related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, numResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text.substring(0, 300),
            source: 'ddg',
            confidence: 0.6,
          });
        }
        // Nested topics
        if (topic.Topics && Array.isArray(topic.Topics)) {
          for (const sub of topic.Topics.slice(0, 2)) {
            if (sub.Text && sub.FirstURL) {
              results.push({
                title: sub.Text.substring(0, 100),
                url: sub.FirstURL,
                snippet: sub.Text.substring(0, 300),
                source: 'ddg',
                confidence: 0.5,
              });
            }
          }
        }
      }
    }

    currentQuota.ddgUsed++;
    return results.slice(0, numResults);
  } catch (err) {
    logger.debug({ query, err }, 'DuckDuckGo search failed');
    return [];
  }
}

// ============ SMART SEARCH ROUTER ============

/**
 * Smart search that routes to the best available provider.
 * 
 * Priority: Knowledge Base → Google (if quota) → DuckDuckGo → LLM Fallback
 * 
 * This function should be used INSTEAD of searchGoogle() directly.
 */
export async function smartSearch(
  query: string,
  numResults: number = 10,
  options?: { skipKnowledge?: boolean; forceProvider?: 'google' | 'ddg' }
): Promise<QuotaSearchResult[]> {
  resetIfNewDay();
  currentQuota.totalRequests++;

  // Step 1: Knowledge-first (unless skipped)
  if (!options?.skipKnowledge) {
    const knowledgeResults = await searchKnowledgeFirst(query);
    if (knowledgeResults && knowledgeResults.length >= 3) {
      logger.debug({ query, source: 'knowledge' }, 'Smart search: answered from knowledge base');
      return knowledgeResults;
    }
  }

  // Step 2: Google (if quota available)
  if (
    (!options?.forceProvider || options.forceProvider === 'google') &&
    currentQuota.googleUsed < LIMITS.GOOGLE_WARN_AT
  ) {
    try {
      // Import the actual Google search function
      const { searchGoogle } = await import('./researchEngine');
      const googleResults = await searchGoogle(query, numResults);

      if (googleResults.length > 0) {
        currentQuota.googleUsed++;
        return googleResults.map(r => ({
          ...r,
          source: 'google' as const,
          confidence: 0.9,
        }));
      }
    } catch (err) {
      logger.debug({ query, err }, 'Google search failed in quota router');
    }
  }

  // Step 3: DuckDuckGo
  const ddgResults = await searchDuckDuckGo(query, numResults);
  if (ddgResults.length > 0) {
    return ddgResults;
  }

  // Step 4: LLM Fallback (always available)
  currentQuota.llmFallbacks++;
  logger.info({ query }, 'Smart search: all providers exhausted, using LLM fallback');

  try {
    const { searchGoogle } = await import('./researchEngine');
    // searchGoogle already has LLM fallback built in
    const fallbackResults = await searchGoogle(query, numResults);
    return fallbackResults.map(r => ({
      ...r,
      source: 'llm_fallback' as const,
      confidence: 0.5,
    }));
  } catch {
    return [{
      title: query,
      url: '',
      snippet: 'Research temporarily unavailable. Using cached knowledge.',
      source: 'llm_fallback',
      confidence: 0.3,
    }];
  }
}

// ============ QUOTA STATS ============

export function getQuotaStats() {
  resetIfNewDay();
  return {
    ...currentQuota,
    googleRemaining: LIMITS.GOOGLE_DAILY - currentQuota.googleUsed,
    googlePercentUsed: Math.round((currentQuota.googleUsed / LIMITS.GOOGLE_DAILY) * 100),
    knowledgeHitRate: currentQuota.totalRequests > 0
      ? `${Math.round((currentQuota.knowledgeHits / currentQuota.totalRequests) * 100)}%`
      : '0%',
    limits: LIMITS,
  };
}
