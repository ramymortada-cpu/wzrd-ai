import type { Request, Response, NextFunction } from "express";
/**
 * Rate Limiting Middleware — protects public endpoints from abuse.
 * 
 * Hybrid: tries Redis-based distributed rate limiting first (when REDIS_URL is set),
 * falls back to in-memory sliding window if Redis is unavailable.
 * This ensures correctness at scale (multiple instances) with zero downtime risk.
 */

import { logger } from './logger';
import { getRedis } from './redis';

/**
 * Redis-based rate limit check — atomic INCR + EXPIRE.
 * Returns null if Redis is unavailable (triggers in-memory fallback).
 */
async function checkRedisRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; count: number; resetAt: number } | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const redisKey = `rl:${key}`;
    const windowSec = Math.ceil(windowMs / 1000);
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
    return { allowed: count <= max, count, resetAt };
  } catch {
    return null; // Redis error — fall back to in-memory
  }
}

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

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyExtractor(req);

    // Attempt Redis-based distributed rate limiting first
    const redisResult = await checkRedisRateLimit(`${storeName}:${key}`, max, windowMs);

    if (redisResult) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - redisResult.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(redisResult.resetAt / 1000));

      if (!redisResult.allowed) {
        logger.warn({ ip: key, path: req.path, limit: max, window: windowMs }, 'Rate limit exceeded (Redis)');
        res.status(429).json({
          error: message,
          retryAfter: Math.ceil((redisResult.resetAt - Date.now()) / 1000),
        });
        return;
      }
      next();
      return;
    }

    // Fallback: in-memory sliding window
    const store = stores.get(storeName)!;
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
      }, 'Rate limit exceeded (in-memory)');

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

  /** Free report lead magnet — 3/hour per IP (LLM + DB write) */
  freeReport: createRateLimit({
    max: 3,
    windowMs: 60 * 60_000,
    message: 'Please wait before requesting another report.',
  }),

  /** Credits purchase — 5 per hour (prevents payment abuse) */
  purchase: createRateLimit({
    max: 5,
    windowMs: 60 * 60_000,
    message: 'Too many purchase attempts. Please try again later.',
  }),

  /** Invite token acceptance — 5 per hour per IP (prevents brute-force token guessing) */
  acceptInvite: createRateLimit({
    max: process.env.NODE_ENV === 'production' ? 5 : 50,
    windowMs: 60 * 60_000,
    message: 'Too many invite attempts. Please try again later.',
  }),

  /** OTP request — 5 per 15 minutes per IP (prevents email flooding) */
  otpRequest: createRateLimit({
    max: process.env.NODE_ENV === 'production' ? 5 : 50,
    windowMs: 15 * 60_000,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  }),

  /** OTP verify — 10 per 15 minutes per IP (prevents brute-force code guessing) */
  otpVerify: createRateLimit({
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    windowMs: 15 * 60_000,
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
  }),
};
