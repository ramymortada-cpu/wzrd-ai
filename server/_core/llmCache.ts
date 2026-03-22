/**
 * LLM RESPONSE CACHE
 * ==================
 * 
 * Problem: Same prompts get sent to the LLM repeatedly, wasting tokens.
 * Solution: Hash the prompt + system message → cache the response.
 * 
 * Cache strategies by context:
 * - Chat responses: 1 hour (conversations evolve)
 * - Knowledge enrichment: 24 hours (knowledge is stable)
 * - Quality reviews: 7 days (same content = same review)
 * - Research summaries: 7 days (market data changes slowly)
 * 
 * Expected savings: 30-50% fewer LLM calls.
 */

import { createHash } from 'crypto';
import { logger } from './logger';

// ============ TYPES ============

interface CachedResponse {
  response: string;
  model: string;
  tokensUsed: number;
  cachedAt: number;
  expiresAt: number;
  hits: number;
}

interface CacheConfig {
  /** TTL in milliseconds */
  ttl: number;
  /** Context label for logging */
  context: string;
}

// ============ CACHE TTLs ============

const CACHE_TTLs: Record<string, number> = {
  chat: 1 * 60 * 60 * 1000,           // 1 hour
  diagnosis: 2 * 60 * 60 * 1000,       // 2 hours
  knowledge: 24 * 60 * 60 * 1000,      // 24 hours
  quality: 7 * 24 * 60 * 60 * 1000,    // 7 days
  research: 7 * 24 * 60 * 60 * 1000,   // 7 days
  proposal: 4 * 60 * 60 * 1000,        // 4 hours
  default: 2 * 60 * 60 * 1000,         // 2 hours
};

// ============ IN-MEMORY STORE ============

const cache = new Map<string, CachedResponse>();
const MAX_CACHE_ENTRIES = 500;

// Stats
let totalRequests = 0;
let cacheHits = 0;
let tokensSaved = 0;

// ============ HASHING ============

/**
 * Creates a deterministic hash of the prompt + system message.
 * Only the user's last message + system prompt matter for caching.
 */
function hashPrompt(messages: Array<{ role: string; content: string | unknown }>, systemContent?: string): string {
  // Extract the key parts that determine the response
  const systemMsg = messages.find(m => m.role === 'system')?.content || systemContent || '';
  const userMsgs = messages.filter(m => m.role === 'user').map(m => {
    if (typeof m.content === 'string') return m.content;
    if (Array.isArray(m.content)) return m.content.map((c: unknown) => (typeof c === 'object' && c && 'text' in c) ? String((c as { text?: string }).text || '') : String(c)).join('');
    return JSON.stringify(m.content);
  });
  
  // Only hash system + last 2 user messages (context window)
  const key = JSON.stringify({
    system: typeof systemMsg === 'string' ? systemMsg.substring(0, 500) : '', // First 500 chars of system
    user: userMsgs.slice(-2).join('|||'),
  });

  return createHash('sha256').update(key).digest('hex');
}

// ============ CACHE OPERATIONS ============

/**
 * Try to get a cached response.
 * Returns null if not cached or expired.
 */
export function getCachedResponse(
  messages: Array<{ role: string; content: string | unknown }>,
  context?: string
): { response: string; tokensUsed: number } | null {
  totalRequests++;
  
  const hash = hashPrompt(messages);
  const entry = cache.get(hash);
  
  if (!entry) return null;
  
  // Check expiry
  if (Date.now() > entry.expiresAt) {
    cache.delete(hash);
    return null;
  }
  
  // Cache hit!
  entry.hits++;
  cacheHits++;
  tokensSaved += entry.tokensUsed;
  
  logger.debug({
    context: context || 'unknown',
    hash: hash.substring(0, 12),
    hits: entry.hits,
    tokensSaved: entry.tokensUsed,
  }, 'LLM cache hit');
  
  return {
    response: entry.response,
    tokensUsed: entry.tokensUsed,
  };
}

/**
 * Store a response in the cache.
 */
export function setCachedResponse(
  messages: Array<{ role: string; content: string | unknown }>,
  response: string,
  tokensUsed: number,
  context?: string
): void {
  const hash = hashPrompt(messages);
  const ttl = CACHE_TTLs[context || 'default'] || CACHE_TTLs.default;
  
  // LRU eviction if full
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Delete the oldest entry
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  
  cache.set(hash, {
    response,
    model: 'gemini-2.5-flash',
    tokensUsed,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttl,
    hits: 0,
  });
  
  logger.debug({
    context: context || 'unknown',
    hash: hash.substring(0, 12),
    ttlMinutes: Math.round(ttl / 60000),
    cacheSize: cache.size,
  }, 'LLM response cached');
}

/**
 * Invalidate cache entries matching a pattern.
 */
export function invalidateCache(context?: string): number {
  if (!context) {
    const size = cache.size;
    cache.clear();
    logger.info({ cleared: size }, 'LLM cache fully cleared');
    return size;
  }
  // Can't filter by context in hash-based cache, so clear all
  const size = cache.size;
  cache.clear();
  return size;
}

/**
 * Get cache statistics.
 */
export function getCacheStats() {
  const hitRate = totalRequests > 0 ? Math.round((cacheHits / totalRequests) * 100) : 0;
  
  return {
    totalRequests,
    cacheHits,
    hitRate: `${hitRate}%`,
    tokensSaved,
    estimatedCostSaved: `$${(tokensSaved * 0.000001).toFixed(4)}`, // rough estimate
    currentEntries: cache.size,
    maxEntries: MAX_CACHE_ENTRIES,
  };
}

// ============ CLEANUP ============

// Clean expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug({ cleaned, remaining: cache.size }, 'LLM cache cleanup');
  }
}, 10 * 60 * 1000);
