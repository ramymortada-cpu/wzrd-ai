/**
 * Data Retention Manager — Scheduled cleanup of high-growth tables.
 * Prevents database bloat and maintains performance.
 */
import { lt } from 'drizzle-orm';
import {
  abandonedCarts,
  auditLog,
  copilotMessages,
  llmCacheTable,
  llmUsageLog,
  otpCodes,
  researchCache,
} from '../../drizzle/schema';
import { getDb } from '../db/index';
import { logger } from './logger';

// Retention periods in days
const RETENTION_RULES = {
  llmCache: 7,
  llmUsageLog: 90,
  researchCache: 30,
  copilotMessages: 90,
  abandonedCarts: 90,
  auditLog: 180,
};

function affectedRows(result: unknown): number {
  if (result && typeof result === 'object' && 'affectedRows' in result) {
    const n = (result as { affectedRows?: number }).affectedRows;
    return typeof n === 'number' ? n : 0;
  }
  if (Array.isArray(result) && result[0] && typeof result[0] === 'object' && 'affectedRows' in result[0]) {
    const n = (result[0] as { affectedRows?: number }).affectedRows;
    return typeof n === 'number' ? n : 0;
  }
  return 0;
}

export async function runDataRetentionCleanup() {
  const db = await getDb();
  if (!db) {
    logger.warn('[DataRetention] Database not available, skipping cleanup');
    return;
  }

  logger.info('[DataRetention] Starting scheduled cleanup job');
  const now = new Date();

  const getCutoff = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  try {
    const llmCacheResult = await db.delete(llmCacheTable).where(lt(llmCacheTable.expiresAt, now));
    logger.debug({ deleted: affectedRows(llmCacheResult) }, '[DataRetention] Cleaned llm_cache');

    const researchCacheResult = await db.delete(researchCache).where(lt(researchCache.expiresAt, now));
    logger.debug({ deleted: affectedRows(researchCacheResult) }, '[DataRetention] Cleaned research_cache');

    const llmUsageResult = await db
      .delete(llmUsageLog)
      .where(lt(llmUsageLog.createdAt, getCutoff(RETENTION_RULES.llmUsageLog)));
    logger.debug({ deleted: affectedRows(llmUsageResult) }, '[DataRetention] Cleaned llm_usage_log');

    const copilotResult = await db
      .delete(copilotMessages)
      .where(lt(copilotMessages.createdAt, getCutoff(RETENTION_RULES.copilotMessages)));
    logger.debug({ deleted: affectedRows(copilotResult) }, '[DataRetention] Cleaned copilot_messages');

    const cartsResult = await db
      .delete(abandonedCarts)
      .where(lt(abandonedCarts.createdAt, getCutoff(RETENTION_RULES.abandonedCarts)));
    logger.debug({ deleted: affectedRows(cartsResult) }, '[DataRetention] Cleaned abandoned_carts');

    const auditResult = await db
      .delete(auditLog)
      .where(lt(auditLog.createdAt, getCutoff(RETENTION_RULES.auditLog)));
    logger.debug({ deleted: affectedRows(auditResult) }, '[DataRetention] Cleaned audit_log');

    // Clean expired OTP codes (1 day retention)
    const otpResult = await db
      .delete(otpCodes)
      .where(lt(otpCodes.expiresAt, now));
    logger.debug({ deleted: affectedRows(otpResult) }, '[DataRetention] Cleaned expired otp_codes');

    logger.info('[DataRetention] Cleanup job completed successfully');
  } catch (error) {
    logger.error({ error }, '[DataRetention] Cleanup job failed');
  }
}

/**
 * Starts the daily cleanup scheduler.
 * Should be called once during server startup.
 */
export function startDataRetentionScheduler() {
  setTimeout(() => {
    runDataRetentionCleanup().catch((err) => logger.error({ err }, 'Initial cleanup failed'));
  }, 5 * 60 * 1000);

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const interval = setInterval(() => {
    runDataRetentionCleanup().catch((err) => logger.error({ err }, 'Scheduled cleanup failed'));
  }, ONE_DAY);

  interval.unref?.();
  logger.info('[DataRetention] Scheduler started (runs daily)');
}
