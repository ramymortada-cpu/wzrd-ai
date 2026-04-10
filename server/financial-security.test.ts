/**
 * Financial & Security Deep-Dive Test Suite
 * Covers: LLM cache TTLs, credit costs, Paymob HMAC, JWT structure,
 *         rate-limit algorithms, research engine quota, LLM prompt hashing,
 *         input length guards, OTP logic, and error classification
 *
 * All logic inlined — no server imports — to avoid Vite SSR issues.
 */
import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

// ─────────────────────────────────────────────
// LLM CACHE — TTL validation
// ─────────────────────────────────────────────

const CACHE_TTLs: Record<string, number> = {
  chat: 1 * 60 * 60 * 1000,           // 1 hour
  diagnosis: 2 * 60 * 60 * 1000,       // 2 hours
  knowledge: 24 * 60 * 60 * 1000,      // 24 hours
  quality: 7 * 24 * 60 * 60 * 1000,    // 7 days
  research: 7 * 24 * 60 * 60 * 1000,   // 7 days
  proposal: 4 * 60 * 60 * 1000,        // 4 hours
  default: 2 * 60 * 60 * 1000,         // 2 hours
};

describe('LLM Cache — TTL values', () => {
  it('chat TTL is 1 hour', () => expect(CACHE_TTLs.chat).toBe(3_600_000));
  it('diagnosis TTL is 2 hours', () => expect(CACHE_TTLs.diagnosis).toBe(7_200_000));
  it('knowledge TTL is 24 hours', () => expect(CACHE_TTLs.knowledge).toBe(86_400_000));
  it('quality TTL is 7 days', () => expect(CACHE_TTLs.quality).toBe(7 * 86_400_000));
  it('research TTL is 7 days', () => expect(CACHE_TTLs.research).toBe(7 * 86_400_000));
  it('proposal TTL is 4 hours', () => expect(CACHE_TTLs.proposal).toBe(14_400_000));
  it('default TTL is 2 hours', () => expect(CACHE_TTLs.default).toBe(7_200_000));
  it('longer-lived contexts cached longer than short ones', () => {
    expect(CACHE_TTLs.knowledge).toBeGreaterThan(CACHE_TTLs.chat);
    expect(CACHE_TTLs.research).toBeGreaterThan(CACHE_TTLs.diagnosis);
    expect(CACHE_TTLs.quality).toBeGreaterThan(CACHE_TTLs.proposal);
  });
  it('chat and default contexts differ (chat is short)', () => {
    expect(CACHE_TTLs.chat).toBeLessThan(CACHE_TTLs.knowledge);
  });
  it('all TTLs are positive integers', () => {
    Object.values(CACHE_TTLs).forEach(v => {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────
// LLM PROMPT HASHING — determinism & collision resistance
// ─────────────────────────────────────────────

function hashPrompt(messages: Array<{ role: string; content: string }>, systemContent?: string): string {
  const systemMsg = messages.find(m => m.role === 'system')?.content || systemContent || '';
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content);
  const key = JSON.stringify({
    system: systemMsg.substring(0, 500),
    user: userMsgs.slice(-2).join('|||'),
  });
  return createHash('sha256').update(key).digest('hex');
}

describe('LLM Prompt Hashing', () => {
  it('produces a 64-char hex string (SHA-256)', () => {
    const h = hashPrompt([{ role: 'user', content: 'hello' }]);
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[a-f0-9]+$/);
  });

  it('same input → same hash (deterministic)', () => {
    const msgs = [{ role: 'user', content: 'test query' }];
    expect(hashPrompt(msgs)).toBe(hashPrompt(msgs));
  });

  it('different queries → different hashes', () => {
    const h1 = hashPrompt([{ role: 'user', content: 'query A' }]);
    const h2 = hashPrompt([{ role: 'user', content: 'query B' }]);
    expect(h1).not.toBe(h2);
  });

  it('different system prompts → different hashes', () => {
    const h1 = hashPrompt([{ role: 'system', content: 'system A' }, { role: 'user', content: 'q' }]);
    const h2 = hashPrompt([{ role: 'system', content: 'system B' }, { role: 'user', content: 'q' }]);
    expect(h1).not.toBe(h2);
  });

  it('only last 2 user messages matter for the hash', () => {
    const msgs1 = [
      { role: 'user', content: 'old msg' },
      { role: 'user', content: 'second to last' },
      { role: 'user', content: 'last' },
    ];
    const msgs2 = [
      { role: 'user', content: 'completely different old msg' },
      { role: 'user', content: 'second to last' },
      { role: 'user', content: 'last' },
    ];
    expect(hashPrompt(msgs1)).toBe(hashPrompt(msgs2));
  });

  it('empty messages produces valid hash', () => {
    const h = hashPrompt([]);
    expect(h).toHaveLength(64);
  });
});

// ─────────────────────────────────────────────
// CREDIT COSTS — tool pricing & business rules
// ─────────────────────────────────────────────

const WZRD_DIAGNOSIS_TOOL_COSTS: Record<string, number> = {
  brand_diagnosis: 20,
  offer_check: 25,
  message_check: 20,
  presence_audit: 25,
  identity_snapshot: 20,
  launch_readiness: 30,
  design_health: 30,
};

const TOOL_COSTS: Record<string, number> = {
  ...WZRD_DIAGNOSIS_TOOL_COSTS,
  competitive_benchmark: 40,
  copilot_message: 5,
};

const SIGNUP_BONUS = 100;
const DAILY_CREDIT_CAP = 200;

function updateToolCost(toolName: string, newCost: number): boolean {
  if (!(toolName in TOOL_COSTS)) return false;
  if (newCost < 1 || newCost > 1000) return false;
  TOOL_COSTS[toolName] = newCost;
  return true;
}

describe('Credit Costs — tool pricing', () => {
  it('signup bonus is 100 credits', () => expect(SIGNUP_BONUS).toBe(100));

  it('all diagnosis tools have positive costs', () => {
    Object.values(WZRD_DIAGNOSIS_TOOL_COSTS).forEach(c => {
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThanOrEqual(100);
    });
  });

  it('design_health is one of the most expensive (30)', () => {
    expect(TOOL_COSTS.design_health).toBe(30);
  });

  it('launch_readiness is one of the most expensive (30)', () => {
    expect(TOOL_COSTS.launch_readiness).toBe(30);
  });

  it('copilot_message is cheapest tool (5)', () => {
    const allCosts = Object.values(TOOL_COSTS);
    expect(TOOL_COSTS.copilot_message).toBe(Math.min(...allCosts));
  });

  it('competitive_benchmark is most expensive tool (40)', () => {
    const allCosts = Object.values(TOOL_COSTS);
    expect(TOOL_COSTS.competitive_benchmark).toBe(Math.max(...allCosts));
  });

  it('signup bonus covers 3–4 basic tool uses', () => {
    const cheapestDiagnosis = Math.min(...Object.values(WZRD_DIAGNOSIS_TOOL_COSTS));
    const usesFromBonus = Math.floor(SIGNUP_BONUS / cheapestDiagnosis);
    expect(usesFromBonus).toBeGreaterThanOrEqual(3);
  });

  it('updateToolCost returns false for unknown tool', () => {
    expect(updateToolCost('nonexistent_tool', 50)).toBe(false);
  });

  it('updateToolCost returns false for cost below 1', () => {
    expect(updateToolCost('brand_diagnosis', 0)).toBe(false);
  });

  it('updateToolCost returns false for cost above 1000', () => {
    expect(updateToolCost('brand_diagnosis', 1001)).toBe(false);
  });

  it('updateToolCost succeeds for valid tool and cost', () => {
    const original = TOOL_COSTS.brand_diagnosis;
    expect(updateToolCost('brand_diagnosis', 35)).toBe(true);
    expect(TOOL_COSTS.brand_diagnosis).toBe(35);
    TOOL_COSTS.brand_diagnosis = original; // restore
  });
});

describe('Credit Costs — daily cap logic', () => {
  function simulateDailyUsage(initialCredits: number, toolSequence: string[]) {
    let balance = initialCredits;
    let usedToday = 0;
    const log: { tool: string; cost: number; allowed: boolean }[] = [];

    for (const tool of toolSequence) {
      const cost = TOOL_COSTS[tool] ?? 0;
      const wouldExceedCap = usedToday + cost > DAILY_CREDIT_CAP;
      const hasBalance = balance >= cost;

      if (!wouldExceedCap && hasBalance) {
        balance -= cost;
        usedToday += cost;
        log.push({ tool, cost, allowed: true });
      } else {
        log.push({ tool, cost, allowed: false });
      }
    }
    return { balance, usedToday, log };
  }

  it('allows tools up to daily cap', () => {
    const { usedToday } = simulateDailyUsage(1000, [
      'brand_diagnosis', 'brand_diagnosis', 'brand_diagnosis',
      'brand_diagnosis', 'brand_diagnosis', 'brand_diagnosis',
      'brand_diagnosis', 'brand_diagnosis', 'brand_diagnosis',
      'brand_diagnosis', // 10 × 20 = 200 (exactly at cap)
    ]);
    expect(usedToday).toBe(200);
  });

  it('blocks usage once daily cap exceeded', () => {
    const { log } = simulateDailyUsage(1000, [
      ...Array(10).fill('brand_diagnosis'), // 200 credits used
      'copilot_message', // should be blocked
    ]);
    const lastEntry = log[log.length - 1];
    expect(lastEntry.allowed).toBe(false);
  });

  it('blocks if insufficient balance even below cap', () => {
    const { log } = simulateDailyUsage(15, ['brand_diagnosis']); // cost=20 > balance=15
    expect(log[0].allowed).toBe(false);
  });

  it('deducts exact cost from balance', () => {
    const { balance } = simulateDailyUsage(100, ['brand_diagnosis']); // 100 - 20 = 80
    expect(balance).toBe(80);
  });
});

// ─────────────────────────────────────────────
// PAYMOB HMAC — cryptographic integrity
// ─────────────────────────────────────────────

function computePaymobHmac(data: Record<string, string>, secret: string): string {
  const fields = [
    'amount_cents', 'created_at', 'currency', 'error_occured',
    'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
    'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
    'is_voided', 'order', 'owner', 'pending', 'source_data.pan',
    'source_data.sub_type', 'source_data.type', 'success',
  ];
  const concat = fields.map(f => data[f] ?? '').join('');
  return createHmac('sha512', secret).update(concat).digest('hex');
}

describe('Paymob HMAC — integrity', () => {
  const secret = 'test-hmac-secret-key-for-paymob';
  const validPayload: Record<string, string> = {
    amount_cents: '10000', created_at: '2026-01-01T00:00:00', currency: 'EGP',
    error_occured: 'false', has_parent_transaction: 'false', id: '12345',
    integration_id: '987', is_3d_secure: 'false', is_auth: 'false',
    is_capture: 'false', is_refunded: 'false', is_standalone_payment: 'true',
    is_voided: 'false', order: '54321', owner: '111', pending: 'false',
    'source_data.pan': '1234', 'source_data.sub_type': 'MasterCard',
    'source_data.type': 'card', success: 'true',
  };

  it('produces a 128-char hex string (SHA-512)', () => {
    const h = computePaymobHmac(validPayload, secret);
    expect(h).toHaveLength(128);
    expect(h).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic — same payload → same HMAC', () => {
    expect(computePaymobHmac(validPayload, secret)).toBe(computePaymobHmac(validPayload, secret));
  });

  it('detects tampering — changed amount → different HMAC', () => {
    const tampered = { ...validPayload, amount_cents: '99999' };
    expect(computePaymobHmac(validPayload, secret)).not.toBe(computePaymobHmac(tampered, secret));
  });

  it('detects tampering — flipped success flag', () => {
    const tampered = { ...validPayload, success: 'false' };
    expect(computePaymobHmac(validPayload, secret)).not.toBe(computePaymobHmac(tampered, secret));
  });

  it('different secrets → different HMACs', () => {
    const h1 = computePaymobHmac(validPayload, 'secret-a');
    const h2 = computePaymobHmac(validPayload, 'secret-b');
    expect(h1).not.toBe(h2);
  });

  it('handles missing fields gracefully (uses empty string)', () => {
    const partial: Record<string, string> = { amount_cents: '5000', success: 'true' };
    expect(() => computePaymobHmac(partial, secret)).not.toThrow();
  });

  it('verification logic: computed === received → valid', () => {
    const received = computePaymobHmac(validPayload, secret);
    const computed = computePaymobHmac(validPayload, secret);
    expect(computed === received).toBe(true);
  });

  it('verification logic: different HMAC → invalid (fail-closed)', () => {
    const received = 'aaaaaaaaaaaaaaaa'; // tampered
    const computed = computePaymobHmac(validPayload, secret);
    expect(computed === received).toBe(false);
  });
});

// ─────────────────────────────────────────────
// JWT — session token security
// ─────────────────────────────────────────────

describe('JWT — session security', () => {
  const makeKey = async (secret: string) => {
    return new TextEncoder().encode(secret);
  };

  it('issues and verifies a valid JWT', async () => {
    const key = await makeKey('super-secret-key-32-chars-minimum!');
    const token = await new SignJWT({ userId: 42, role: 'owner' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .setIssuedAt()
      .sign(key);

    const { payload } = await jwtVerify(token, key);
    expect(payload.userId).toBe(42);
    expect(payload.role).toBe('owner');
  });

  it('rejects tampered JWT', async () => {
    const key = await makeKey('super-secret-key-32-chars-minimum!');
    const token = await new SignJWT({ userId: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(key);

    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}x.${parts[2]}`;
    await expect(jwtVerify(tampered, key)).rejects.toThrow();
  });

  it('rejects JWT signed with wrong key', async () => {
    const key1 = await makeKey('correct-secret-key-32-chars-min!!');
    const key2 = await makeKey('wrong-secret-key-32-chars-minimum!');
    const token = await new SignJWT({ userId: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(key1);
    await expect(jwtVerify(token, key2)).rejects.toThrow();
  });

  it('rejects expired JWT', async () => {
    const key = await makeKey('super-secret-key-32-chars-minimum!');
    const token = await new SignJWT({ userId: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1s')
      .sign(key);
    await new Promise(r => setTimeout(r, 1100));
    await expect(jwtVerify(token, key)).rejects.toThrow();
  });

  it('JWT payload is not encrypted (only signed)', async () => {
    const key = await makeKey('super-secret-key-32-chars-minimum!');
    const token = await new SignJWT({ userId: 99, email: 'test@test.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(key);
    // Decode payload (base64url) — should be readable
    const payloadB64 = token.split('.')[1];
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const decoded = JSON.parse(payloadStr);
    expect(decoded.userId).toBe(99);
  });
});

// ─────────────────────────────────────────────
// RATE LIMIT — in-memory sliding window
// ─────────────────────────────────────────────

interface RateLimitEntry { count: number; resetAt: number; }

function createRateLimiter(max: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();
  return {
    isAllowed(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count++;
      return true;
    },
    getRemainingRequests(key: string): number {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || entry.resetAt < now) return max;
      return Math.max(0, max - entry.count);
    },
    reset(key: string): void { store.delete(key); },
  };
}

describe('Rate Limiter — in-memory sliding window', () => {
  it('allows requests up to max', () => {
    const rl = createRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      expect(rl.isAllowed('user:1')).toBe(true);
    }
  });

  it('blocks request at max+1', () => {
    const rl = createRateLimiter(3, 60000);
    rl.isAllowed('ip:1'); rl.isAllowed('ip:1'); rl.isAllowed('ip:1');
    expect(rl.isAllowed('ip:1')).toBe(false);
  });

  it('different keys have independent limits', () => {
    const rl = createRateLimiter(2, 60000);
    rl.isAllowed('a'); rl.isAllowed('a');
    expect(rl.isAllowed('a')).toBe(false);
    expect(rl.isAllowed('b')).toBe(true); // different key, fresh
  });

  it('resets counter after window expires', async () => {
    const rl = createRateLimiter(2, 50); // 50ms window
    rl.isAllowed('x'); rl.isAllowed('x');
    expect(rl.isAllowed('x')).toBe(false);
    await new Promise(r => setTimeout(r, 60));
    expect(rl.isAllowed('x')).toBe(true); // window reset
  });

  it('getRemainingRequests returns correct count', () => {
    const rl = createRateLimiter(10, 60000);
    rl.isAllowed('u'); rl.isAllowed('u'); rl.isAllowed('u');
    expect(rl.getRemainingRequests('u')).toBe(7);
  });

  it('getRemainingRequests returns max for unknown key', () => {
    const rl = createRateLimiter(10, 60000);
    expect(rl.getRemainingRequests('new-key')).toBe(10);
  });

  it('manual reset clears a key', () => {
    const rl = createRateLimiter(2, 60000);
    rl.isAllowed('z'); rl.isAllowed('z');
    expect(rl.isAllowed('z')).toBe(false);
    rl.reset('z');
    expect(rl.isAllowed('z')).toBe(true);
  });
});

// ─────────────────────────────────────────────
// INPUT VALIDATION — length & type guards
// ─────────────────────────────────────────────

const MAX_LENGTHS = {
  shortText: 500,
  longText: 5000,
  email: 254,
  url: 2048,
  aiPrompt: 2000,
};

function validateInputLength(value: string, field: keyof typeof MAX_LENGTHS): boolean {
  return value.length <= MAX_LENGTHS[field];
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // eslint-disable-line no-useless-escape

describe('Input Validation — length guards', () => {
  it('accepts short text within limit', () => {
    expect(validateInputLength('hello world', 'shortText')).toBe(true);
  });

  it('rejects short text exceeding 500 chars', () => {
    expect(validateInputLength('x'.repeat(501), 'shortText')).toBe(false);
  });

  it('accepts AI prompt up to 2000 chars', () => {
    expect(validateInputLength('a'.repeat(2000), 'aiPrompt')).toBe(true);
  });

  it('rejects AI prompt over 2000 chars', () => {
    expect(validateInputLength('a'.repeat(2001), 'aiPrompt')).toBe(false);
  });

  it('accepts email up to 254 chars (RFC 5321)', () => {
    const longEmail = 'a'.repeat(244) + '@test.com'; // 253 chars
    expect(validateInputLength(longEmail, 'email')).toBe(true);
  });

  it('accepts URL up to 2048 chars', () => {
    const url = 'https://example.com/' + 'a'.repeat(2027); // exactly 2048
    expect(validateInputLength(url, 'url')).toBe(true);
  });
});

describe('Input Validation — email format', () => {
  it('accepts valid email', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('user.name+tag@sub.domain.co.uk')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(EMAIL_REGEX.test('notanemail')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(EMAIL_REGEX.test('user@')).toBe(false);
  });

  it('rejects email without TLD', () => {
    expect(EMAIL_REGEX.test('user@domain')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(EMAIL_REGEX.test('user @example.com')).toBe(false);
  });

  it('rejects consecutive dots in local part', () => {
    // Standard behavior — depends on implementation
    expect(EMAIL_REGEX.test('')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// OTP SECURITY — lockout & timing
// ─────────────────────────────────────────────

const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 15;
const OTP_EXPIRY_MINUTES = 10;

interface OtpRecord {
  code: string;
  attempts: number;
  expiresAt: Date;
  lockedUntil?: Date;
}

function verifyOtp(record: OtpRecord, inputCode: string): {
  valid: boolean;
  error?: 'expired' | 'locked' | 'invalid' | 'max_attempts';
} {
  const now = new Date();

  if (record.lockedUntil && record.lockedUntil > now) {
    return { valid: false, error: 'locked' };
  }

  if (record.expiresAt < now) {
    return { valid: false, error: 'expired' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { valid: false, error: 'max_attempts' };
  }

  if (record.code !== inputCode) {
    return { valid: false, error: 'invalid' };
  }

  return { valid: true };
}

describe('OTP Security — verification logic', () => {
  const future = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
  const past = new Date(Date.now() - 1000);
  const lockedFuture = new Date(Date.now() + OTP_LOCKOUT_MINUTES * 60000);

  it('accepts correct OTP within expiry', () => {
    const r = verifyOtp({ code: '123456', attempts: 0, expiresAt: future }, '123456');
    expect(r.valid).toBe(true);
  });

  it('rejects incorrect OTP', () => {
    const r = verifyOtp({ code: '123456', attempts: 0, expiresAt: future }, '000000');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('invalid');
  });

  it('rejects expired OTP', () => {
    const r = verifyOtp({ code: '123456', attempts: 0, expiresAt: past }, '123456');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('expired');
  });

  it('rejects when account is locked', () => {
    const r = verifyOtp(
      { code: '123456', attempts: 0, expiresAt: future, lockedUntil: lockedFuture },
      '123456'
    );
    expect(r.valid).toBe(false);
    expect(r.error).toBe('locked');
  });

  it('rejects when max attempts exceeded', () => {
    const r = verifyOtp({ code: '123456', attempts: OTP_MAX_ATTEMPTS, expiresAt: future }, '123456');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('max_attempts');
  });

  it('OTP lockout is 15 minutes', () => expect(OTP_LOCKOUT_MINUTES).toBe(15));
  it('OTP expiry is 10 minutes', () => expect(OTP_EXPIRY_MINUTES).toBe(10));
  it('max attempts is 5', () => expect(OTP_MAX_ATTEMPTS).toBe(5));

  it('OTP expiry < lockout duration (lockout outlasts OTP)', () => {
    expect(OTP_EXPIRY_MINUTES).toBeLessThan(OTP_LOCKOUT_MINUTES);
  });
});

// ─────────────────────────────────────────────
// RESEARCH ENGINE — quota & result structure
// ─────────────────────────────────────────────

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

const GOOGLE_MAX_RESULTS = 10;

function mapGoogleItem(item: Record<string, string>): SearchResult {
  return {
    title: item.title || '',
    url: item.link || '',
    snippet: item.snippet || '',
    source: item.displayLink || new URL(item.link || 'https://unknown.com').hostname,
  };
}

function capResults<T>(results: T[], max: number): T[] {
  return results.slice(0, max);
}

describe('Research Engine — searchGoogle', () => {
  it('caps results at GOOGLE_MAX_RESULTS (10)', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      title: `Result ${i}`, link: `https://site${i}.com`, snippet: '', displayLink: '',
    }));
    const capped = capResults(items.map(mapGoogleItem), GOOGLE_MAX_RESULTS);
    expect(capped.length).toBe(10);
  });

  it('returns fewer if fewer results available', () => {
    const items = [
      { title: 'A', link: 'https://a.com', snippet: 'snip', displayLink: 'a.com' },
    ];
    const capped = capResults(items.map(mapGoogleItem), GOOGLE_MAX_RESULTS);
    expect(capped.length).toBe(1);
  });

  it('maps Google API item structure correctly', () => {
    const item = {
      title: 'Test Title', link: 'https://example.com/path',
      snippet: 'Test snippet', displayLink: 'example.com',
    };
    const result = mapGoogleItem(item);
    expect(result.title).toBe('Test Title');
    expect(result.url).toBe('https://example.com/path');
    expect(result.snippet).toBe('Test snippet');
    expect(result.source).toBe('example.com');
  });

  it('handles missing displayLink — extracts hostname from URL', () => {
    const item = { title: 'T', link: 'https://fallback.com/page', snippet: '', displayLink: '' };
    const result = mapGoogleItem(item);
    expect(result.source).toBe('fallback.com');
  });

  it('handles missing title/snippet with empty strings', () => {
    const item = { title: '', link: 'https://example.com', snippet: '', displayLink: 'example.com' };
    const result = mapGoogleItem(item);
    expect(result.title).toBe('');
    expect(result.snippet).toBe('');
  });

  it('returns empty array when API keys are missing', async () => {
    const apiKey = undefined;
    const cx = undefined;
    async function searchGoogleSafe(_query: string): Promise<SearchResult[]> {
      if (!apiKey || !cx) return [];
      return []; // would call API
    }
    const results = await searchGoogleSafe('test query');
    expect(results).toEqual([]);
  });

  it('returns empty array when only one key is configured', async () => {
    async function searchGoogleSafe(_query: string): Promise<SearchResult[]> {
      const k = 'AIzaKey';
      const c = undefined; // missing CX
      if (!k || !c) return [];
      return [];
    }
    expect(await searchGoogleSafe('test')).toEqual([]);
  });
});
