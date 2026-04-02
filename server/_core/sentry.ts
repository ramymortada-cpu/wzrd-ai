/**
 * Sentry Error Monitoring — Basic setup for Sprint 1.
 * Captures unhandled exceptions and reports them to Sentry dashboard.
 *
 * Requires SENTRY_DSN environment variable to be set.
 * If SENTRY_DSN is not set, Sentry is silently disabled (no errors thrown).
 */
import * as Sentry from '@sentry/node';
import { logger } from './logger';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('[Sentry] SENTRY_DSN not set — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Capture 100% of errors, sample 10% of transactions for performance
    tracesSampleRate: 0.1,
  });

  logger.info('[Sentry] Error monitoring initialized');
}

export { Sentry };
