import type { Request, Response, NextFunction } from "express";
/**
 * Rate Limiting Middleware — protects public endpoints from abuse.
 * 
 * Uses in-memory sliding window rate limiting.
 * For production at scale, replace with Redis-based implementation.
 */

import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests per window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Custom message for rate-limited responses */
  message?: string;
  /** Key extractor — defaults to IP address */
  keyExtractor?: (req: unknown) => string;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/** Clean expired entries periodically */
function cleanupStore(storeName: string) {
  const store = stores.get(storeName);
  if (!store) return;

  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

/**
 * Creates a rate limiting middleware for Express.
 * 
 * Usage:
 *   app.use('/api/public', createRateLimit({ max: 10, windowMs: 60_000 }));
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    max,
    windowMs,
    message = 'Too many requests, please try again later.',
    keyExtractor = (req: unknown) => (req as Request).ip || (req as Request).socket?.remoteAddress || 'unknown',
  } = config;

  const storeName = `rl_${max}_${windowMs}_${Date.now()}`;
  stores.set(storeName, new Map());

  // Cleanup every 5 minutes
  const cleanupInterval = setInterval(() => cleanupStore(storeName), 5 * 60 * 1000);
  cleanupInterval.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const store = stores.get(storeName)!;
    const key = keyExtractor(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      logger.warn({
        ip: key,
        path: req.path,
        limit: max,
        window: windowMs,
      }, 'Rate limit exceeded');

      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Pre-configured rate limiters for different endpoint types.
 */
export const rateLimiters = {
  /** AI/LLM endpoints — 5 requests per minute (expensive) */
  ai: createRateLimit({
    max: 5,
    windowMs: 60_000,
    message: 'AI request limit reached. Please wait before trying again.',
  }),

  /** Quick-check (lead magnet) — 3 per minute per IP */
  quickCheck: createRateLimit({
    max: 3,
    windowMs: 60_000,
    message: 'Please wait before submitting another quick-check.',
  }),

  /** Client portal — 30 per minute */
  portal: createRateLimit({
    max: 30,
    windowMs: 60_000,
    message: 'Too many requests to the portal.',
  }),

  /** Public feedback/comments — 10 per minute */
  publicWrite: createRateLimit({
    max: 10,
    windowMs: 60_000,
    message: 'Too many submissions. Please try again shortly.',
  }),

  /** General API — 100 per minute */
  general: createRateLimit({
    max: 100,
    windowMs: 60_000,
  }),

  /** AI Tool usage — 10 per minute per user (prevents credit drain) */
  toolUsage: createRateLimit({
    max: 10,
    windowMs: 60_000,
    message: 'Tool usage limit reached. Please wait a moment.',
  }),

  /** Signup — 3/hour in prod, 30/hour in dev (prevents spam accounts) */
  signup: createRateLimit({
    max: process.env.NODE_ENV === 'production' ? 3 : 30,
    windowMs: 60 * 60_000,
    message: 'Too many signup attempts. Please try again later.',
  }),

  /** Credits purchase — 5 per hour (prevents payment abuse) */
  purchase: createRateLimit({
    max: 5,
    windowMs: 60 * 60_000,
    message: 'Too many purchase attempts. Please try again later.',
  }),
};
