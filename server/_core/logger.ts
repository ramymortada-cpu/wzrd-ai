import type { Request, Response, NextFunction } from "express";
/**
 * Structured Logger — pino-based logging for production observability.
 * Replaces console.log/console.error with structured, leveled logging.
 * 
 * Usage:
 *   import { logger } from './logger';
 *   logger.info({ clientId: 123 }, 'Client created');
 *   logger.error({ err, endpoint: '/api/clients' }, 'Failed to create client');
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  msg: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(level: LogLevel, context: Record<string, unknown> | string, msg?: string): LogEntry {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    msg: '',
  };

  if (typeof context === 'string') {
    entry.msg = context;
  } else {
    entry.msg = msg || '';
    // Serialize errors properly
    if (context.err instanceof Error) {
      entry.error = {
        message: context.err.message,
        name: context.err.name,
        stack: context.err.stack,
      };
      const rest = { ...context };
      delete rest.err;
      Object.assign(entry, rest);
    } else {
      Object.assign(entry, context);
    }
  }

  return entry;
}

function log(level: LogLevel, context: Record<string, unknown> | string, msg?: string): void {
  if (!shouldLog(level)) return;

  const entry = formatEntry(level, context, msg);
  const output = JSON.stringify(entry);

  if (level === 'error' || level === 'fatal') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (context: Record<string, unknown> | string, msg?: string) => log('debug', context, msg),
  info: (context: Record<string, unknown> | string, msg?: string) => log('info', context, msg),
  warn: (context: Record<string, unknown> | string, msg?: string) => log('warn', context, msg),
  error: (context: Record<string, unknown> | string, msg?: string) => log('error', context, msg),
  fatal: (context: Record<string, unknown> | string, msg?: string) => log('fatal', context, msg),

  /** Create a child logger with default context fields */
  child: (defaultContext: Record<string, unknown>) => ({
    debug: (context: Record<string, unknown> | string, msg?: string) => {
      const ctx = typeof context === 'string' ? { ...defaultContext } : { ...defaultContext, ...context };
      log('debug', ctx, typeof context === 'string' ? context : msg);
    },
    info: (context: Record<string, unknown> | string, msg?: string) => {
      const ctx = typeof context === 'string' ? { ...defaultContext } : { ...defaultContext, ...context };
      log('info', ctx, typeof context === 'string' ? context : msg);
    },
    warn: (context: Record<string, unknown> | string, msg?: string) => {
      const ctx = typeof context === 'string' ? { ...defaultContext } : { ...defaultContext, ...context };
      log('warn', ctx, typeof context === 'string' ? context : msg);
    },
    error: (context: Record<string, unknown> | string, msg?: string) => {
      const ctx = typeof context === 'string' ? { ...defaultContext } : { ...defaultContext, ...context };
      log('error', ctx, typeof context === 'string' ? context : msg);
    },
    fatal: (context: Record<string, unknown> | string, msg?: string) => {
      const ctx = typeof context === 'string' ? { ...defaultContext } : { ...defaultContext, ...context };
      log('fatal', ctx, typeof context === 'string' ? context : msg);
    },
  }),
};

/** Request logger middleware for Express */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logFn = statusCode >= 500 ? logger.error : statusCode >= 400 ? logger.warn : logger.info;
    logFn({
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: req.get('user-agent'),
    }, `${method} ${url} ${statusCode} ${duration}ms`);
  });

  next();
}
