import type { Request, Response, NextFunction } from "express";
/**
 * GLOBAL ERROR HANDLING
 * =====================
 * 
 * 2 layers:
 * 
 * 1. tRPC Error Middleware — catches all router errors, logs them, formats response
 * 2. Process Error Handlers — catches uncaught exceptions and unhandled rejections
 * 
 * This ensures:
 * - Every error is logged with structured context
 * - Users never see raw stack traces
 * - The server doesn't crash silently
 */

import { TRPCError } from '@trpc/server';
import { logger } from './logger';
import { Sentry } from './sentry';

// ============ tRPC ERROR FORMATTER ============

/**
 * Format tRPC errors for the client.
 * Strips internal details in production, keeps them in development.
 */
export function formatTRPCError(error: TRPCError, path?: string) {
  // Always log the full error server-side
  logger.error({
    code: error.code,
    message: error.message,
    path,
    cause: error.cause instanceof Error ? error.cause.message : undefined,
  }, `tRPC error: ${path || 'unknown'}`);

  // In production, sanitize the error message
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Don't expose internal details
    const safeMessages: Record<string, string> = {
      'INTERNAL_SERVER_ERROR': 'حدث خطأ داخلي. يرجى المحاولة لاحقاً. / An internal error occurred. Please try again later.',
      'UNAUTHORIZED': 'يرجى تسجيل الدخول. / Please log in.',
      'FORBIDDEN': 'ليس لديك صلاحية لهذا الإجراء. / You do not have permission.',
      'NOT_FOUND': 'العنصر غير موجود. / Item not found.',
      'BAD_REQUEST': 'البيانات المدخلة غير صحيحة. / Invalid input data.',
      'TOO_MANY_REQUESTS': 'طلبات كثيرة. يرجى الانتظار. / Too many requests. Please wait.',
    };

    return {
      code: error.code,
      message: safeMessages[error.code] || error.message,
    };
  }

  return {
    code: error.code,
    message: error.message,
    path,
  };
}

// ============ PROCESS ERROR HANDLERS ============

/**
 * Install global process error handlers.
 * Call once at server startup.
 */
export function installProcessErrorHandlers() {
  // Uncaught exceptions — something really broke
  process.on('uncaughtException', (err: Error) => {
    Sentry.captureException(err);
    logger.fatal({
      err: err.message,
      stack: err.stack,
      type: 'uncaughtException',
    }, 'FATAL: Uncaught exception — server will exit');

    // Give logger time to flush, then exit
    setTimeout(() => process.exit(1), 1000);
  });

  // Unhandled promise rejections — async error without catch
  process.on('unhandledRejection', (reason: unknown) => {
    Sentry.captureException(reason);
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;

    logger.error({
      reason: message,
      stack,
      type: 'unhandledRejection',
    }, 'Unhandled promise rejection');

    // Don't exit — just log. These are usually non-fatal.
  });

  // Graceful shutdown signals
  const shutdown = (signal: string) => {
    // Close DB pool
    import("../db").then(db => db.closeDb?.()).catch(() => {});
    logger.info({ signal }, `Received ${signal} — starting graceful shutdown`);

    // Close server, flush logs, clean up
    setTimeout(() => {
      logger.info('Graceful shutdown complete');
      process.exit(0);
    }, 3000); // 3s grace period
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Global error handlers installed');
}

// ============ EXPRESS ERROR MIDDLEWARE ============

/**
 * Express error-handling middleware.
 * Catches any errors that slip through tRPC.
 */
export function expressErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  Sentry.captureException(err);
  logger.error({
    err: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
  }, 'Express unhandled error');

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
}
