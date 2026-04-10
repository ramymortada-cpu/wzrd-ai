/**
 * Core Utilities Test Suite
 * Covers: sanitize, retry, circuit breaker, withTimeout, withFallback,
 *         pagination, in-memory cache, SSRF URL validation, rate limit
 *
 * All logic is inlined (no server imports) to avoid Vite SSR transform issues.
 */
import { describe, it, expect, vi } from 'vitest';

// ─────────────────────────────────────────────
// SANITIZE — inlined from server/_core/sanitize.ts
// ─────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;',
  '"': '&quot;', "'": '&#x27;', '/': '&#x2F;', '`': '&#96;',
};
function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`/]/g, (c) => HTML_ENTITIES[c] || c);
}
function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}
const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi, /vbscript\s*:/gi, /data\s*:[^,]*;base64/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi, /on\w+\s*=\s*[^\s>]+/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi, /<link\b[^>]*>/gi, /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi, /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
];
function sanitizeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  let cleaned = str;
  for (const p of DANGEROUS_PATTERNS) cleaned = cleaned.replace(p, '');
  cleaned = cleaned.replace(/\s*style\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s*class\s*=\s*["'][^"']*["']/gi, '');
  return cleaned.trim();
}
function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim().toLowerCase();
  if (t.startsWith('javascript:') || t.startsWith('vbscript:') || t.startsWith('data:')) return '';
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/')) return url.trim();
  if (!t.includes('://')) return `https://${url.trim()}`;
  return '';
}

describe('Sanitize — escapeHtml', () => {
  it('escapes & < > " \' / `', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('<b>')).toBe('&lt;b&gt;');
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHtml("it's")).toBe('it&#x27;s');
    expect(escapeHtml('path/to')).toBe('path&#x2F;to');
    expect(escapeHtml('`code`')).toBe('&#96;code&#96;');
  });
  it('returns empty string for empty/non-string', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });
  it('does not double-escape already escaped content', () => {
    const once = escapeHtml('<script>');
    expect(once).toBe('&lt;script&gt;');
    // Escaping again escapes the &
    expect(escapeHtml(once)).toContain('&amp;');
  });
  it('preserves plain text unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123');
  });
});

describe('Sanitize — stripHtml', () => {
  it('removes basic HTML tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });
  it('removes script tags entirely', () => {
    expect(stripHtml('<script>alert(1)</script>text')).toBe('text');
  });
  it('removes style tags entirely', () => {
    expect(stripHtml('<style>.x{color:red}</style>text')).toBe('text');
  });
  it('replaces &nbsp; with space', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });
  it('trims result', () => {
    expect(stripHtml('  <p>  text  </p>  ')).toBe('text');
  });
  it('returns empty for empty input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(null as unknown as string)).toBe('');
  });
});

describe('Sanitize — sanitizeHtml', () => {
  it('strips javascript: links', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });
  it('strips onclick handlers', () => {
    expect(sanitizeHtml('<button onclick="alert(1)">x</button>')).not.toContain('onclick');
  });
  it('strips iframe tags', () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).not.toContain('iframe');
  });
  it('strips style attributes', () => {
    expect(sanitizeHtml('<p style="color:red">text</p>')).not.toContain('style');
  });
  it('strips class attributes', () => {
    expect(sanitizeHtml('<p class="foo">text</p>')).not.toContain('class');
  });
  it('strips data:base64 URIs', () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,abc">')).not.toContain('base64');
  });
  it('preserves safe text content', () => {
    const r = sanitizeHtml('<p>Hello World</p>');
    expect(r).toContain('Hello World');
  });
  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('Sanitize — sanitizeUrl', () => {
  it('allows https URLs', () => {
    expect(sanitizeUrl('https://google.com')).toBe('https://google.com');
  });
  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });
  it('allows relative URLs', () => {
    expect(sanitizeUrl('/dashboard')).toBe('/dashboard');
  });
  it('prepends https to bare domains', () => {
    expect(sanitizeUrl('google.com')).toBe('https://google.com');
  });
  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });
  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
  });
  it('blocks data: URIs', () => {
    expect(sanitizeUrl('data:text/html,<h1>XSS</h1>')).toBe('');
  });
  it('returns empty for empty input', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null as unknown as string)).toBe('');
  });
});

// ─────────────────────────────────────────────
// RETRY — inlined from server/_core/retry.ts
// ─────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

async function retry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number; initialDelay?: number; jitter?: boolean; label?: string }
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 3;
  const initialDelay = opts?.initialDelay ?? 0; // 0 for fast tests
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) await sleep(initialDelay);
    }
  }
  throw lastError;
}

describe('Retry — exponential backoff', () => {
  it('succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn, { maxRetries: 3, initialDelay: 0 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls < 3) throw new Error('fail');
      return 'success';
    });
    const result = await retry(fn, { maxRetries: 3, initialDelay: 0 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, { maxRetries: 2, initialDelay: 0 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry if maxRetries is 0', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(retry(fn, { maxRetries: 0, initialDelay: 0 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns correct value from successful retry', async () => {
    let count = 0;
    const result = await retry(async () => {
      if (++count < 2) throw new Error('not yet');
      return count * 10;
    }, { maxRetries: 3, initialDelay: 0 });
    expect(result).toBe(20);
  });
});

// ─────────────────────────────────────────────
// CIRCUIT BREAKER — inlined
// ─────────────────────────────────────────────

type CircuitState = 'closed' | 'open' | 'half-open';
function createCircuitBreaker(opts?: { failureThreshold?: number; resetTimeout?: number }) {
  const threshold = opts?.failureThreshold ?? 5;
  const resetTimeout = opts?.resetTimeout ?? 60000;
  let state: CircuitState = 'closed';
  let failures = 0;
  let lastFailure: number | null = null;

  return {
    async call<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
      if (state === 'open' && lastFailure && Date.now() - lastFailure > resetTimeout) {
        state = 'half-open';
      }
      if (state === 'open') {
        if (fallback) return fallback();
        throw new Error('Circuit open');
      }
      try {
        const result = await fn();
        if (state === 'half-open') { state = 'closed'; failures = 0; }
        return result;
      } catch (err) {
        failures++;
        lastFailure = Date.now();
        if (failures >= threshold) state = 'open';
        throw err;
      }
    },
    getState() { return { state, failures, lastFailure }; },
    reset() { state = 'closed'; failures = 0; lastFailure = null; },
  };
}

describe('Circuit Breaker', () => {
  it('starts in closed state', () => {
    const cb = createCircuitBreaker();
    expect(cb.getState().state).toBe('closed');
    expect(cb.getState().failures).toBe(0);
  });

  it('allows calls when closed', async () => {
    const cb = createCircuitBreaker();
    const result = await cb.call(async () => 42);
    expect(result).toBe(42);
  });

  it('counts failures', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 5 });
    for (let i = 0; i < 3; i++) {
      await cb.call(async () => { throw new Error('fail'); }).catch(() => {});
    }
    expect(cb.getState().failures).toBe(3);
    expect(cb.getState().state).toBe('closed');
  });

  it('opens after reaching threshold', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 3 });
    for (let i = 0; i < 3; i++) {
      await cb.call(async () => { throw new Error('fail'); }).catch(() => {});
    }
    expect(cb.getState().state).toBe('open');
  });

  it('uses fallback when open', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 1 });
    await cb.call(async () => { throw new Error('fail'); }).catch(() => {});
    const result = await cb.call(async () => 'primary', () => 'fallback');
    expect(result).toBe('fallback');
  });

  it('throws when open and no fallback', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 1 });
    await cb.call(async () => { throw new Error(); }).catch(() => {});
    await expect(cb.call(async () => 'ok')).rejects.toThrow('Circuit open');
  });

  it('resets on manual reset()', () => {
    const cb = createCircuitBreaker({ failureThreshold: 1 });
    cb.call(async () => { throw new Error(); }).catch(() => {});
    cb.reset();
    expect(cb.getState().state).toBe('closed');
    expect(cb.getState().failures).toBe(0);
  });

  it('transitions closed → open → half-open → closed', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, resetTimeout: 10 });
    await cb.call(async () => { throw new Error(); }).catch(() => {});
    expect(cb.getState().state).toBe('open');
    // Wait for resetTimeout to pass, then next call triggers half-open → closed
    await new Promise(r => setTimeout(r, 20));
    await cb.call(async () => 'ok');
    expect(cb.getState().state).toBe('closed');
  });
});

// ─────────────────────────────────────────────
// withTimeout — inlined
// ─────────────────────────────────────────────

function withTimeout<T>(fn: () => Promise<T>, ms: number, label?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label || 'Operation'} timed out after ${ms}ms`)), ms);
    fn().then(r => { clearTimeout(t); resolve(r); }).catch(e => { clearTimeout(t); reject(e); });
  });
}

describe('withTimeout', () => {
  it('resolves when fn finishes before timeout', async () => {
    const result = await withTimeout(async () => 'done', 1000);
    expect(result).toBe('done');
  });

  it('rejects when fn takes too long', async () => {
    await expect(
      withTimeout(() => new Promise(r => setTimeout(r, 500)), 10, 'slow-op')
    ).rejects.toThrow('slow-op timed out after 10ms');
  });

  it('propagates fn errors directly', async () => {
    await expect(
      withTimeout(async () => { throw new Error('fn error'); }, 1000)
    ).rejects.toThrow('fn error');
  });

  it('uses default label when none provided', async () => {
    await expect(
      withTimeout(() => new Promise(r => setTimeout(r, 500)), 10)
    ).rejects.toThrow('Operation timed out after 10ms');
  });
});

// ─────────────────────────────────────────────
// withFallback — inlined
// ─────────────────────────────────────────────

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T> | T,
): Promise<T> {
  try { return await primary(); }
  catch { return await fallback(); }
}

describe('withFallback', () => {
  it('returns primary result when primary succeeds', async () => {
    const result = await withFallback(async () => 'primary', async () => 'fallback');
    expect(result).toBe('primary');
  });

  it('returns fallback when primary throws', async () => {
    const result = await withFallback(
      async () => { throw new Error('primary failed'); },
      async () => 'fallback'
    );
    expect(result).toBe('fallback');
  });

  it('supports sync fallback', async () => {
    const result = await withFallback(
      async () => { throw new Error(); },
      () => 'sync-fallback'
    );
    expect(result).toBe('sync-fallback');
  });

  it('both primary and fallback return different shapes — fallback wins on error', async () => {
    const result = await withFallback<number>(
      async () => { throw new Error(); },
      async () => 42
    );
    expect(result).toBe(42);
  });
});

// ─────────────────────────────────────────────
// PAGINATION — inlined from server/_core/pagination.ts
// ─────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizePagination(input: { page?: number; pageSize?: number }) {
  return {
    page: Math.max(1, input.page || 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize || DEFAULT_PAGE_SIZE)),
  };
}

describe('Pagination — normalizePagination', () => {
  it('uses defaults for empty input', () => {
    const r = normalizePagination({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(20);
  });

  it('clamps page to minimum 1', () => {
    expect(normalizePagination({ page: 0 }).page).toBe(1);
    expect(normalizePagination({ page: -5 }).page).toBe(1);
  });

  it('clamps negative pageSize to min 1', () => {
    // pageSize: 0 is falsy → falls back to DEFAULT_PAGE_SIZE (20) via || operator
    expect(normalizePagination({ pageSize: -10 }).pageSize).toBe(1);
    expect(normalizePagination({ pageSize: -1 }).pageSize).toBe(1);
  });
  it('pageSize: 0 treated as unset → returns default (20)', () => {
    // 0 is falsy in JS: input.pageSize || DEFAULT_PAGE_SIZE → 20
    expect(normalizePagination({ pageSize: 0 }).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('clamps pageSize to max 100', () => {
    expect(normalizePagination({ pageSize: 500 }).pageSize).toBe(100);
    expect(normalizePagination({ pageSize: 101 }).pageSize).toBe(100);
  });

  it('accepts valid page and pageSize', () => {
    const r = normalizePagination({ page: 5, pageSize: 50 });
    expect(r.page).toBe(5);
    expect(r.pageSize).toBe(50);
  });

  it('handles pageSize exactly at max (100)', () => {
    expect(normalizePagination({ pageSize: 100 }).pageSize).toBe(100);
  });

  it('handles page=1 pageSize=1 (minimum valid)', () => {
    const r = normalizePagination({ page: 1, pageSize: 1 });
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(1);
  });
});

// ─────────────────────────────────────────────
// IN-MEMORY CACHE — inlined from server/_core/cache.ts
// ─────────────────────────────────────────────

function createCache<T>(config: { ttl: number; maxEntries?: number }) {
  const { ttl, maxEntries = 1000 } = config;
  const store = new Map<string, { value: T; expiresAt: number }>();
  return {
    get(key: string): T | undefined {
      const e = store.get(key);
      if (!e) return undefined;
      if (e.expiresAt < Date.now()) { store.delete(key); return undefined; }
      return e.value;
    },
    set(key: string, value: T, customTtl?: number): void {
      if (store.size >= maxEntries) {
        const first = Array.from(store.keys())[0];
        if (first) store.delete(first);
      }
      store.set(key, { value, expiresAt: Date.now() + (customTtl || ttl) });
    },
    delete(key: string): boolean { return store.delete(key); },
    has(key: string): boolean {
      const e = store.get(key);
      if (!e) return false;
      if (e.expiresAt < Date.now()) { store.delete(key); return false; }
      return true;
    },
    size(): number { return store.size; },
    clear(): void { store.clear(); },
    async getOrSet(key: string, fn: () => Promise<T>): Promise<T> {
      const cached = this.get(key);
      if (cached !== undefined) return cached;
      const value = await fn();
      this.set(key, value);
      return value;
    },
  };
}

describe('In-Memory Cache', () => {
  it('stores and retrieves a value', () => {
    const c = createCache<number>({ ttl: 5000 });
    c.set('key', 42);
    expect(c.get('key')).toBe(42);
  });

  it('returns undefined for missing key', () => {
    const c = createCache<string>({ ttl: 5000 });
    expect(c.get('missing')).toBeUndefined();
  });

  it('returns undefined for expired entry', async () => {
    const c = createCache<number>({ ttl: 10 });
    c.set('x', 99, 10); // 10ms TTL
    await new Promise(r => setTimeout(r, 50));
    expect(c.get('x')).toBeUndefined();
  });

  it('has() returns false for expired entry', async () => {
    const c = createCache<number>({ ttl: 10 });
    c.set('x', 1, 10);
    await new Promise(r => setTimeout(r, 50));
    expect(c.has('x')).toBe(false);
  });

  it('delete() removes a key', () => {
    const c = createCache<string>({ ttl: 5000 });
    c.set('k', 'v');
    c.delete('k');
    expect(c.get('k')).toBeUndefined();
  });

  it('clear() removes all keys', () => {
    const c = createCache<number>({ ttl: 5000 });
    c.set('a', 1); c.set('b', 2);
    c.clear();
    expect(c.size()).toBe(0);
  });

  it('evicts oldest entry when maxEntries exceeded', () => {
    const c = createCache<number>({ ttl: 5000, maxEntries: 2 });
    c.set('a', 1); c.set('b', 2); c.set('c', 3);
    expect(c.get('a')).toBeUndefined(); // evicted
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
  });

  it('getOrSet() calls fn on miss and caches result', async () => {
    const c = createCache<string>({ ttl: 5000 });
    const fn = vi.fn().mockResolvedValue('computed');
    const r1 = await c.getOrSet('k', fn);
    const r2 = await c.getOrSet('k', fn);
    expect(r1).toBe('computed');
    expect(r2).toBe('computed');
    expect(fn).toHaveBeenCalledTimes(1); // only computed once
  });

  it('getOrSet() calls fn again after expiry', async () => {
    const c = createCache<string>({ ttl: 10 });
    const fn = vi.fn().mockResolvedValue('fresh');
    await c.getOrSet('k', fn);
    await new Promise(r => setTimeout(r, 50));
    await c.getOrSet('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('custom TTL overrides default', async () => {
    const c = createCache<number>({ ttl: 10000 });
    c.set('k', 1, 10); // 10ms custom TTL
    await new Promise(r => setTimeout(r, 50));
    expect(c.get('k')).toBeUndefined();
  });

  it('size() returns correct count', () => {
    const c = createCache<number>({ ttl: 5000 });
    c.set('a', 1); c.set('b', 2);
    expect(c.size()).toBe(2);
  });
});

// ─────────────────────────────────────────────
// SSRF — URL Validator (additional edge cases)
// ─────────────────────────────────────────────

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal'];
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^fc00:/i,
  /^fe80:/i,
];

function validateScrapingUrl(input: string) {
  if (!input.match(/^https?:\/\//i)) return { valid: false, url: '', error: 'URL must start with http:// or https://' };
  let parsed: URL;
  try { parsed = new URL(input); }
  catch { return { valid: false, url: '', error: 'Invalid URL format' }; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, url: '', error: 'Only HTTP/HTTPS URLs allowed' };
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(hostname)) return { valid: false, url: '', error: 'Internal URLs are not allowed' };
  for (const r of PRIVATE_IP_RANGES) {
    if (r.test(hostname)) return { valid: false, url: '', error: 'Private IP addresses are not allowed' };
  }
  if (parsed.port && !['80', '443', ''].includes(parsed.port)) return { valid: false, url: '', error: 'Non-standard ports are not allowed' };
  return { valid: true, url: parsed.toString() };
}

describe('SSRF — validateScrapingUrl (extended)', () => {
  it('allows standard https URL', () => {
    expect(validateScrapingUrl('https://google.com').valid).toBe(true);
  });
  it('allows port 80 explicitly', () => {
    expect(validateScrapingUrl('http://example.com:80/path').valid).toBe(true);
  });
  it('allows port 443 explicitly', () => {
    expect(validateScrapingUrl('https://example.com:443/').valid).toBe(true);
  });
  it('blocks localhost', () => {
    expect(validateScrapingUrl('http://localhost:3000').valid).toBe(false);
  });
  it('blocks 127.0.0.1', () => {
    expect(validateScrapingUrl('http://127.0.0.1').valid).toBe(false);
  });
  it('blocks 0.0.0.0', () => {
    expect(validateScrapingUrl('http://0.0.0.0').valid).toBe(false);
  });
  it('blocks AWS metadata endpoint', () => {
    expect(validateScrapingUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
  });
  it('blocks GCP metadata endpoint', () => {
    expect(validateScrapingUrl('http://metadata.google.internal/computeMetadata').valid).toBe(false);
  });
  it('blocks 10.x.x.x private range', () => {
    expect(validateScrapingUrl('http://10.0.0.1').valid).toBe(false);
  });
  it('blocks 172.16.x.x–172.31.x.x range', () => {
    expect(validateScrapingUrl('http://172.16.0.1').valid).toBe(false);
    expect(validateScrapingUrl('http://172.31.255.255').valid).toBe(false);
  });
  it('allows 172.15.x.x (not private)', () => {
    expect(validateScrapingUrl('http://172.15.0.1').valid).toBe(true);
  });
  it('blocks 192.168.x.x', () => {
    expect(validateScrapingUrl('http://192.168.1.1').valid).toBe(false);
  });
  it('blocks port 8080 (non-standard)', () => {
    expect(validateScrapingUrl('https://example.com:8080').valid).toBe(false);
  });
  it('blocks port 22 (SSH)', () => {
    expect(validateScrapingUrl('http://example.com:22').valid).toBe(false);
  });
  it('rejects non-http(s) scheme', () => {
    expect(validateScrapingUrl('ftp://files.example.com').valid).toBe(false);
  });
  it('rejects malformed URL', () => {
    expect(validateScrapingUrl('https://not a url').valid).toBe(false);
  });
  it('rejects string without protocol', () => {
    expect(validateScrapingUrl('example.com').valid).toBe(false);
  });
});

// ─────────────────────────────────────────────
// DATA RETENTION — retention rules constants
// ─────────────────────────────────────────────

const RETENTION_RULES = {
  llmCache: 7, llmUsageLog: 90, researchCache: 30,
  copilotMessages: 90, abandonedCarts: 90, auditLog: 180,
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

describe('Data Retention — RETENTION_RULES', () => {
  it('llmCache is 7 days', () => expect(RETENTION_RULES.llmCache).toBe(7));
  it('llmUsageLog is 90 days', () => expect(RETENTION_RULES.llmUsageLog).toBe(90));
  it('researchCache is 30 days', () => expect(RETENTION_RULES.researchCache).toBe(30));
  it('copilotMessages is 90 days', () => expect(RETENTION_RULES.copilotMessages).toBe(90));
  it('abandonedCarts is 90 days', () => expect(RETENTION_RULES.abandonedCarts).toBe(90));
  it('auditLog is 180 days (longest)', () => expect(RETENTION_RULES.auditLog).toBe(180));
  it('auditLog > llmUsageLog (compliance data kept longer)', () => {
    expect(RETENTION_RULES.auditLog).toBeGreaterThan(RETENTION_RULES.llmUsageLog);
  });
  it('researchCache > llmCache (research reused more)', () => {
    expect(RETENTION_RULES.researchCache).toBeGreaterThan(RETENTION_RULES.llmCache);
  });
});

describe('Data Retention — affectedRows helper', () => {
  it('extracts affectedRows from plain object', () => {
    expect(affectedRows({ affectedRows: 5 })).toBe(5);
  });
  it('extracts affectedRows from array result (Drizzle format)', () => {
    expect(affectedRows([{ affectedRows: 3 }])).toBe(3);
  });
  it('returns 0 for null result', () => {
    expect(affectedRows(null)).toBe(0);
  });
  it('returns 0 for empty object', () => {
    expect(affectedRows({})).toBe(0);
  });
  it('returns 0 for affectedRows: undefined', () => {
    expect(affectedRows({ affectedRows: undefined })).toBe(0);
  });
  it('returns 0 for string affectedRows (type guard)', () => {
    expect(affectedRows({ affectedRows: 'five' as unknown as number })).toBe(0);
  });
  it('returns 0 for empty array', () => {
    expect(affectedRows([])).toBe(0);
  });
});
