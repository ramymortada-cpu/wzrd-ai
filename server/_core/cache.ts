/**
 * In-Memory Cache — simple TTL-based cache for frequently accessed data.
 * 
 * Replaces the need for Redis in small-to-medium deployments.
 * For production at scale, swap this for a Redis implementation.
 * 
 * Usage:
 *   const cache = createCache<DashboardStats>({ ttl: 5 * 60 * 1000 }); // 5 min
 *   
 *   const stats = await cache.getOrSet('dashboard', async () => {
 *     return await computeExpensiveStats();
 *   });
 */

import { logger } from './logger';
import type { getDashboardStats, getAnalyticsData } from '../db/portal';

type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
type AnalyticsPayload = Awaited<ReturnType<typeof getAnalyticsData>>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheConfig {
  /** Time to live in milliseconds */
  ttl: number;
  /** Maximum number of entries (LRU eviction) */
  maxEntries?: number;
  /** Name for logging */
  name?: string;
}

export function createCache<T>(config: CacheConfig) {
  const { ttl, maxEntries = 1000, name = 'cache' } = config;
  const store = new Map<string, CacheEntry<T>>();

  // Periodic cleanup
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.expiresAt < now) {
        store.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      logger.debug({ cache: name, evicted, remaining: store.size }, 'Cache cleanup');
    }
  }, 60_000); // Clean every minute
  cleanupInterval.unref?.();

  return {
    /** Get a cached value. Returns undefined if not found or expired. */
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;

      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return undefined;
      }

      return entry.value;
    },

    /** Set a value in the cache. */
    set(key: string, value: T, customTtl?: number): void {
      // Evict oldest if at capacity
      if (store.size >= maxEntries) {
        const firstKey = Array.from(store.keys())[0];
        if (firstKey) store.delete(firstKey);
      }

      store.set(key, {
        value,
        expiresAt: Date.now() + (customTtl || ttl),
      });
    },

    /** Get cached value or compute and cache it. */
    async getOrSet(key: string, compute: () => Promise<T>, customTtl?: number): Promise<T> {
      const cached = this.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const value = await compute();
      this.set(key, value, customTtl);
      return value;
    },

    /** Invalidate a specific key. */
    invalidate(key: string): boolean {
      return store.delete(key);
    },

    /** Invalidate all keys matching a prefix. */
    invalidatePrefix(prefix: string): number {
      let count = 0;
      for (const key of Array.from(store.keys())) {
        if (key.startsWith(prefix)) {
          store.delete(key);
          count++;
        }
      }
      return count;
    },

    /** Clear the entire cache. */
    clear(): void {
      store.clear();
    },

    /** Get cache statistics. */
    stats() {
      return {
        name,
        size: store.size,
        maxEntries,
        ttl,
      };
    },
  };
}

// ============ PRE-CONFIGURED CACHES ============

/** Dashboard stats cache — 5 minute TTL */
export const dashboardCache = createCache<DashboardStats>({
  ttl: 5 * 60 * 1000,
  name: 'dashboard',
});

/** Analytics data cache — 10 minute TTL */
export const analyticsCache = createCache<AnalyticsPayload>({
  ttl: 10 * 60 * 1000,
  name: 'analytics',
});

/** Knowledge base context cache — 30 minute TTL */
export const knowledgeCache = createCache<string>({
  ttl: 30 * 60 * 1000,
  name: 'knowledge',
  maxEntries: 50,
});

/** Research cache — 1 hour TTL */
export const researchResultCache = createCache<unknown>({
  ttl: 60 * 60 * 1000,
  name: 'research',
  maxEntries: 200,
});
