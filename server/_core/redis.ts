/**
 * Optional Redis client (Railway / REDIS_URL). When unset or init fails, callers use in-memory fallbacks.
 */
import Redis from "ioredis";
import { logger } from "./logger";

let redisSingleton: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (redisSingleton !== undefined) {
    return redisSingleton;
  }
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    redisSingleton = null;
    return redisSingleton;
  }
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    client.on("error", (err: unknown) => {
      logger.warn({ err }, "Redis client error");
    });
    redisSingleton = client;
  } catch (err) {
    logger.warn({ err }, "Redis init failed — using in-memory fallbacks");
    redisSingleton = null;
  }
  return redisSingleton;
}
