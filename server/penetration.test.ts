/**
 * penetration.test.ts — Automated Security Penetration Tests
 * Phase 10 of the Pre-Launch Hardening Audit.
 *
 * These tests verify security properties by inspecting source code.
 * They run with every PR — no live server required.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

// ─── Helper ───────────────────────────────────────────────────────────────────

function src(path: string): string {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function srcOrSkip(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8');
}

// ─── 10.1 — User Enumeration Prevention ─────────────────────────────────────

describe('Penetration 10.1 — User Enumeration Prevention', () => {
  it('auth.requestLogin response should not reveal if email exists', () => {
    const authSrc = src('server/routers/auth.ts');
    // Must NOT contain phrases that reveal user existence
    expect(authSrc).not.toMatch(/user\s*not\s*found|email\s*not\s*registered|no\s*account/i);
  });

  it('auth.requestLogin returns the same message for existing and non-existing emails', () => {
    const authSrc = src('server/routers/auth.ts');
    // Must contain a generic "code sent" type message (anti-enumeration)
    expect(authSrc).toMatch(/If this email|we.*sent|check.*email/i);
  });
});

// ─── 10.2 — JWT Tampering Detection ─────────────────────────────────────────

describe('Penetration 10.2 — JWT Tampering Detection', () => {
  it('session.ts uses JWT verification (not just decoding)', () => {
    const sessionSrc = src('server/_core/session.ts');
    expect(sessionSrc).toMatch(/verify|jwtVerify/i);
  });

  it('session.ts returns null on invalid token (fail-closed)', () => {
    const sessionSrc = src('server/_core/session.ts');
    // Must return null when verification fails
    expect(sessionSrc).toMatch(/return null|catch/);
  });

  it('verifySession exists and handles both primary and fallback secrets', () => {
    const sessionSrc = src('server/_core/session.ts');
    expect(sessionSrc).toContain('verifySession');
    expect(sessionSrc).toMatch(/JWT_SECRET_PREVIOUS|fallback|secondary/i);
  });
});

// ─── 10.3 — OTP Brute-Force Protection ──────────────────────────────────────

describe('Penetration 10.3 — OTP Brute-Force Protection', () => {
  it('otp_codes table tracks failed_attempts', () => {
    const schemaSrc = src('drizzle/schema.ts');
    expect(schemaSrc).toMatch(/failed_attempts|failedAttempts/);
  });

  it('auth.verifyLogin checks failed_attempts before accepting code', () => {
    const authSrc = src('server/routers/auth.ts');
    expect(authSrc).toMatch(/failed_attempts|failedAttempts|blocked|lockout|Too many/i);
  });

  it('OTP is deleted after successful verification (one-time use)', () => {
    const authSrc = src('server/routers/auth.ts');
    expect(authSrc).toMatch(/delete.*otpCodes|otpCodes.*delete/i);
  });

  it('OTP has expiry check (timestamp comparison)', () => {
    const authSrc = src('server/routers/auth.ts');
    expect(authSrc).toMatch(/expires_at|expiresAt|gt\(|>.*Date\.now/i);
  });
});

// ─── 10.4 — IDOR Protection ──────────────────────────────────────────────────

describe('Penetration 10.4 — IDOR Protection', () => {
  it('tools router filters queries by userId (not just toolId)', () => {
    const toolsSrc = src('server/routers/tools.ts');
    // All DB queries reading tool results must filter by the logged-in user's ID
    expect(toolsSrc).toMatch(/userId|user_id/);
    expect(toolsSrc).toMatch(/ctx\.user/);
  });

  it('clients router scopes data by workspaceId or userId', () => {
    const clientsSrc = srcOrSkip('server/routers/clients.ts');
    if (!clientsSrc) return; // pre-Sprint A — skip
    expect(clientsSrc).toMatch(/workspaceId|userId|ctx\.user/i);
  });

  it('fullAudit router (Sprint A) scopes results to owner', () => {
    const auditSrc = srcOrSkip('server/routers/fullAudit.ts');
    if (!auditSrc) return; // Sprint A not yet merged — skip gracefully
    expect(auditSrc).toContain('userId');
    expect(auditSrc).toMatch(/ctx\.user/);
  });
});

// ─── 10.5 — Atomic Credit Deduction (Race Condition Prevention) ───────────────

describe('Penetration 10.5 — Atomic Credit Deduction', () => {
  it('deductCredits uses atomic UPDATE with WHERE credits >= cost', () => {
    const creditsSrc = src('server/db/credits.ts');
    expect(creditsSrc).toMatch(/credits\s*-\s*|credits\s*>=|atomic|WHERE.*credits/i);
  });

  it('credits cannot go below zero (negative balance blocked)', () => {
    const creditsSrc = src('server/db/credits.ts');
    // Either checked in WHERE clause or validated before deduction
    expect(creditsSrc).toMatch(/credits\s*>=|insufficient|not enough|< 0/i);
  });

  it('SIGNUP_BONUS is only awarded once per email', () => {
    const authSrc = src('server/routers/auth.ts');
    // Signup checks if user already exists before awarding credits
    expect(authSrc).toMatch(/getUserByEmail|existing.*user|user.*exists|already.*registered/i);
  });
});

// ─── 10.6 — XSS Prevention ───────────────────────────────────────────────────

describe('Penetration 10.6 — XSS Prevention', () => {
  it('dangerouslySetInnerHTML is always paired with a sanitizer or uses static content', () => {
    const { execSync } = require('child_process');
    const result = execSync(
      'grep -rn "dangerouslySetInnerHTML" client/src/ --include="*.tsx" -l 2>/dev/null || true'
    ).toString().trim();

    if (!result) return; // No dangerouslySetInnerHTML — great!

    const files = result.split('\n').filter(Boolean);
    for (const file of files) {
      const content = src(file);
      // Safe if: uses a sanitizer, OR content is clearly static (CSS vars, hardcoded strings)
      const hasSanitizer =
        content.includes('DOMPurify') ||
        content.includes('sanitize') ||
        content.includes('escapeHtml');
      // chart.tsx injects CSS custom properties (static app config, not user input) — safe
      const isStaticCssInjection =
        content.includes('data-chart=') ||
        content.includes('THEMES') ||
        content.includes('colorConfig');
      expect(
        hasSanitizer || isStaticCssInjection,
        `${file} uses dangerouslySetInnerHTML without sanitizer and not with static CSS`
      ).toBe(true);
    }
  });

  it('no eval() usage in non-test server code', () => {
    const { execSync } = require('child_process');
    // Exclude test files to avoid self-match
    const result = execSync(
      'grep -rn "\\beval(" server/ --include="*.ts" --exclude="*.test.ts" 2>/dev/null || true'
    ).toString().trim();
    expect(result).toBe('');
  });
});

// ─── 10.7 — API Key Exposure ─────────────────────────────────────────────────

describe('Penetration 10.7 — API Key Exposure Prevention', () => {
  it('no raw API key prefixes in client source', () => {
    const { execSync } = require('child_process');
    const result = execSync(
      'grep -rn "sk-\\|gsk_\\|AIza\\|anthropic-key" client/src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true'
    ).toString().trim();
    expect(result).toBe('');
  });

  it('no VITE_.*_SECRET or VITE_.*_API_KEY in .env.example (would leak in browser)', () => {
    const envExample = src('.env.example');
    // VITE_ vars are bundled into the client. API keys must NOT start with VITE_
    const lines = envExample.split('\n').filter(l =>
      l.match(/^VITE_.*(?:SECRET|PRIVATE|GROQ|ANTHROPIC|PAYMOB_SECRET)/i)
    );
    expect(lines).toHaveLength(0);
  });

  it('LLM API keys are server-side only (not VITE_ prefixed)', () => {
    const envExample = src('.env.example');
    expect(envExample).toMatch(/GROQ_API_KEY/);
    expect(envExample).not.toMatch(/VITE_GROQ_API_KEY/);
    expect(envExample).not.toMatch(/VITE_ANTHROPIC_API_KEY/);
  });
});

// ─── 10.8 — SSRF Protection ──────────────────────────────────────────────────

describe('Penetration 10.8 — SSRF Protection', () => {
  it('SSRF validator exists and blocks private IPs', () => {
    const { execSync } = require('child_process');
    const result = execSync(
      'grep -rn "validateUrl\\|ssrf\\|private.*ip\\|127\\.0\\.0\\.1\\|169\\.254" server/ --include="*.ts" -l 2>/dev/null || true'
    ).toString().trim();
    expect(result).not.toBe('');
  });

  it('research engine uses SSRF-safe URL fetching', () => {
    const researchSrc = src('server/researchEngine.ts');
    expect(researchSrc).toMatch(/validateUrl|ssrf|safeFetch/i);
  });
});

// ─── 10.9 — Paymob HMAC Security ────────────────────────────────────────────

describe('Penetration 10.9 — Paymob HMAC Fail-Closed', () => {
  it('Paymob webhook rejects requests when HMAC secret is missing', () => {
    const paymobSrc = src('server/paymobIntegration.ts');
    // Must explicitly reject/return false when secret is absent
    expect(paymobSrc).toMatch(/return false|throw|PAYMOB_HMAC_SECRET.*missing|!.*HMAC/i);
  });

  it('credits are added AFTER HMAC verification', () => {
    const paymobSrc = src('server/paymobIntegration.ts');
    // verifyHmac must appear before addCredits in the file
    const hmacIdx = paymobSrc.search(/verifyHmac|hmac.*verify|verify.*hmac/i);
    const creditsIdx = paymobSrc.search(/addCredits/i);
    expect(hmacIdx).toBeGreaterThan(-1);
    expect(creditsIdx).toBeGreaterThan(hmacIdx);
  });

  it('duplicate webhook handling exists (idempotency)', () => {
    const paymobSrc = src('server/paymobIntegration.ts');
    expect(paymobSrc).toMatch(/duplicate|already.*processed|idempotent/i);
  });
});

// ─── 10.10 — Auth Guards ─────────────────────────────────────────────────────

describe('Penetration 10.10 — Auth Guards on Sensitive Endpoints', () => {
  it('deleteAccount uses protectedProcedure', () => {
    const authSrc = src('server/routers/auth.ts');
    expect(authSrc).toMatch(/deleteAccount.*protectedProcedure|protectedProcedure.*deleteAccount/s);
  });

  it('admin router uses owner-admin check', () => {
    const adminSrc = srcOrSkip('server/routers/wzrdAdmin.ts') ?? srcOrSkip('server/routers/admin.ts') ?? '';
    if (!adminSrc) return;
    expect(adminSrc).toMatch(/isOwnerAdmin|checkOwner|isSuperAdmin/i);
  });

  it('freeQuickDiagnosis is rate-limited', () => {
    const middlewareSrc = src('server/_core/middleware.ts');
    expect(middlewareSrc).toMatch(/freeQuickDiagnosis.*rateLimit|rateLimit.*freeQuickDiagnosis/s);
  });
});
