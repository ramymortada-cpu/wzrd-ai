/**
 * ERROR HANDLING & RETRY LOGIC
 * ============================
 * 
 * Robust error handling for all external calls:
 * - LLM API calls (timeout, rate limit, quota)
 * - Web search/scraping (network errors, blocked)
 * - Database operations (connection, deadlock)
 * 
 * Features:
 * 1. Exponential backoff with jitter
 * 2. Circuit breaker (stops calling after N failures)
 * 3. Graceful degradation (fallback responses)
 * 4. Structured error logging
 */

import { logger } from './logger';

// ════════════════════════════════════════════
// RETRY WITH EXPONENTIAL BACKOFF
// ════════════════════════════════════════════

interface RetryOptions {
  /** Max number of retries (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;
  /** Max delay in ms (default: 30000) */
  maxDelay?: number;
  /** Multiplier for each retry (default: 2) */
  backoffFactor?: number;
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean;
  /** Only retry on these error types */
  retryOn?: Array<'timeout' | 'rate_limit' | 'server_error' | 'network' | 'all'>;
  /** Label for logging */
  label?: string;
}

/**
 * Retry a function with exponential backoff.
 * 
 * Usage:
 *   const result = await retry(() => invokeLLM(params), { label: 'ai-chat', maxRetries: 2 });
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 30000;
  const backoffFactor = options?.backoffFactor ?? 2;
  const jitter = options?.jitter ?? true;
  const label = options?.label ?? 'unknown';
  const retryOn = options?.retryOn ?? ['all'];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if we should retry this error
      if (!shouldRetry(err, retryOn)) {
        logger.error({ err, label, attempt }, 'Non-retryable error');
        throw err;
      }

      // Last attempt — don't retry
      if (attempt === maxRetries) {
        logger.error({ err, label, attempts: attempt + 1 }, 'All retries exhausted');
        throw err;
      }

      // Calculate delay with exponential backoff + jitter
      let delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
      }

      logger.warn({
        label, attempt: attempt + 1, maxRetries, delayMs: Math.round(delay),
        error: (err instanceof Error ? err.message : String(err))?.substring(0, 100),
      }, 'Retrying after error');

      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

function shouldRetry(err: unknown, retryOn: string[]): boolean {
  if (retryOn.includes('all')) return true;

  const e = err as { message?: string; status?: number; statusCode?: number; code?: number };
  const message = (e?.message || '').toLowerCase();
  const status = e?.status ?? e?.statusCode ?? e?.code;

  if (retryOn.includes('timeout') && (message.includes('timeout') || message.includes('ETIMEDOUT') || status === 408)) return true;
  if (retryOn.includes('rate_limit') && (message.includes('rate limit') || message.includes('429') || status === 429)) return true;
  if (retryOn.includes('server_error') && ((typeof status === 'number' && status >= 500) || message.includes('internal server'))) return true;
  if (retryOn.includes('network') && (message.includes('ECONNREFUSED') || message.includes('ECONNRESET') || message.includes('fetch failed'))) return true;

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ════════════════════════════════════════════
// CIRCUIT BREAKER
// ════════════════════════════════════════════

interface CircuitBreakerOptions {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time to keep circuit open in ms (default: 60000 = 1 min) */
  resetTimeout?: number;
  /** Label for logging */
  label?: string;
}

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerInstance {
  call: <T>(fn: () => Promise<T>, fallback?: () => T) => Promise<T>;
  getState: () => { state: CircuitState; failures: number; lastFailure: number | null };
  reset: () => void;
}

/**
 * Creates a circuit breaker for an external service.
 * 
 * Usage:
 *   const llmBreaker = createCircuitBreaker({ label: 'llm', failureThreshold: 3 });
 *   const result = await llmBreaker.call(() => invokeLLM(params), () => 'Service temporarily unavailable');
 */
export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreakerInstance {
  const threshold = options?.failureThreshold ?? 5;
  const resetTimeout = options?.resetTimeout ?? 60000;
  const label = options?.label ?? 'circuit';

  let state: CircuitState = 'closed';
  let failures = 0;
  let lastFailure: number | null = null;

  return {
    async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
      // Check if circuit should be half-opened
      if (state === 'open' && lastFailure && Date.now() - lastFailure > resetTimeout) {
        state = 'half-open';
        logger.info({ label }, 'Circuit breaker half-open — testing');
      }

      // Circuit is open — use fallback or throw
      if (state === 'open') {
        logger.warn({ label, failures }, 'Circuit breaker OPEN — rejecting call');
        if (fallback) return fallback();
        throw new Error(`Circuit breaker open for ${label} — service unavailable`);
      }

      try {
        const result = await fn();

        // Success — reset if half-open
        if (state === 'half-open') {
          state = 'closed';
          failures = 0;
          logger.info({ label }, 'Circuit breaker CLOSED — service recovered');
        }

        return result;
      } catch (err) {
        failures++;
        lastFailure = Date.now();

        if (failures >= threshold) {
          state = 'open';
          logger.error({ label, failures, threshold }, 'Circuit breaker OPENED — too many failures');
        }

        throw err;
      }
    },

    getState() {
      return { state, failures, lastFailure };
    },

    reset() {
      state = 'closed';
      failures = 0;
      lastFailure = null;
    },
  };
}

// ════════════════════════════════════════════
// GRACEFUL DEGRADATION HELPERS
// ════════════════════════════════════════════

/**
 * Try primary function, fall back to secondary if it fails.
 * 
 * Usage:
 *   const data = await withFallback(
 *     () => liveResearch(query),           // Try live research first
 *     () => getCachedResearch(query),       // Fall back to cached
 *     'Live research unavailable'           // Log message
 *   );
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
  label?: string
): Promise<T> {
  try {
    return await primary();
  } catch (err: unknown) {
    logger.warn({ label, error: (err instanceof Error ? err.message : String(err))?.substring(0, 100) }, 'Primary failed, using fallback');
    return await fallback();
  }
}

/**
 * Execute with a timeout. If the function takes too long, reject.
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      logger.warn({ label, timeoutMs }, 'Operation timed out');
      reject(new Error(`${label || 'Operation'} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// ════════════════════════════════════════════
// PRE-BUILT CIRCUIT BREAKERS
// ════════════════════════════════════════════

/** Circuit breaker for LLM calls — opens after 3 failures, resets after 2 min */
export const llmCircuitBreaker = createCircuitBreaker({
  label: 'llm', failureThreshold: 3, resetTimeout: 120000,
});

/** Circuit breaker for web search — opens after 5 failures, resets after 1 min */
export const searchCircuitBreaker = createCircuitBreaker({
  label: 'web-search', failureThreshold: 5, resetTimeout: 60000,
});

/** Circuit breaker for web scraping — opens after 5 failures, resets after 5 min */
export const scrapeCircuitBreaker = createCircuitBreaker({
  label: 'web-scrape', failureThreshold: 5, resetTimeout: 300000,
});
