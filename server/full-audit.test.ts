/**
 * Full Audit Test Suite — Sprint A
 * ==================================
 * 21 tests covering schema validation, pure functions, and router structure.
 * Self-contained: pure functions are tested directly; LLM/DB calls are not invoked.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Import pure functions directly (no DB / LLM deps)
import {
  getLanguageInstruction,
  safeParseLLM,
  buildActionPlan,
  fullAuditInputSchema,
  FULL_AUDIT_COST,
  LLM_TIMEOUT,
} from './routers/fullAudit';

// Import TOOL_COSTS to verify registration
import { TOOL_COSTS } from './db/credits';

// ════════════════════════════════════════════════════════════════════════════
// 1–4: fullAuditInput schema validation
// ════════════════════════════════════════════════════════════════════════════

describe('fullAuditInputSchema', () => {
  it('accepts valid input', () => {
    const result = fullAuditInputSchema.safeParse({
      companyName: 'Volta Coffee',
      website: 'https://volta.coffee',
      industry: 'fnb',
      targetAudience: 'Young professionals aged 25-35',
      mainChallenge: 'Standing out from competitors',
      marketRegion: 'egypt',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing companyName', () => {
    const result = fullAuditInputSchema.safeParse({
      industry: 'tech',
      targetAudience: 'SMBs',
      mainChallenge: 'No brand identity',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty industry', () => {
    const result = fullAuditInputSchema.safeParse({
      companyName: 'Test Co',
      industry: '',
      targetAudience: 'Everyone',
      mainChallenge: 'Everything',
    });
    expect(result.success).toBe(false);
  });

  it('defaults marketRegion to egypt when omitted', () => {
    const result = fullAuditInputSchema.safeParse({
      companyName: 'Test Co',
      industry: 'tech',
      targetAudience: 'SMBs',
      mainChallenge: 'Visibility',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.marketRegion).toBe('egypt');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5: TOOL_COSTS
// ════════════════════════════════════════════════════════════════════════════

describe('TOOL_COSTS', () => {
  it('full_audit costs 60 credits', () => {
    expect(TOOL_COSTS['full_audit']).toBe(60);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6–8: getLanguageInstruction
// ════════════════════════════════════════════════════════════════════════════

describe('getLanguageInstruction', () => {
  it('returns Egyptian Arabic instruction for egypt', () => {
    const instruction = getLanguageInstruction('egypt');
    expect(instruction).toContain('Egyptian Arabic');
    expect(instruction).toContain('عامية مصرية');
  });

  it('returns formal Arabic for ksa', () => {
    const instruction = getLanguageInstruction('ksa');
    expect(instruction).toContain('Saudi');
    expect(instruction).toContain('formal Arabic');
  });

  it('returns formal Arabic for uae', () => {
    const instruction = getLanguageInstruction('uae');
    expect(instruction).toContain('UAE');
    expect(instruction).toContain('formal Arabic');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9–12: safeParseLLM
// ════════════════════════════════════════════════════════════════════════════

describe('safeParseLLM', () => {
  it('strips ```json fences and parses correctly', () => {
    const input = '```json\n{"pillars": []}\n```';
    const result = safeParseLLM(input, 'test');
    expect(result).not.toBeNull();
    expect((result as { pillars: unknown[] }).pillars).toEqual([]);
  });

  it('returns null on invalid JSON', () => {
    const result = safeParseLLM('not json at all {{{{', 'test');
    expect(result).toBeNull();
  });

  it('returns null on empty string', () => {
    const result = safeParseLLM('', 'test');
    expect(result).toBeNull();
  });

  it('handles nested JSON correctly', () => {
    const nested = JSON.stringify({
      pillars: [{ id: 'identity', score: 72, findings: [{ title: 'Test', severity: 'high' }] }],
    });
    const result = safeParseLLM(nested, 'test') as { pillars: Array<{ score: number }> };
    expect(result?.pillars?.[0]?.score).toBe(72);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13–16: Router procedure existence (file-based, avoids importing appRouter
//         which has transitive dependencies incompatible with the test env)
// ════════════════════════════════════════════════════════════════════════════

describe('fullAudit router registration', () => {
  const indexSrc = readFileSync(resolve(__dirname, 'routers/index.ts'), 'utf-8');
  const fullAuditSrc = readFileSync(resolve(__dirname, 'routers/fullAudit.ts'), 'utf-8');

  it('fullAudit router is imported and registered in router index', () => {
    expect(indexSrc).toContain('fullAuditRouter');
    expect(indexSrc).toContain('fullAudit: fullAuditRouter');
  });

  it('fullAudit.run procedure is defined', () => {
    expect(fullAuditSrc).toContain("run:");
    expect(fullAuditSrc).toContain('protectedProcedure');
  });

  it('fullAudit.myAudits procedure is defined', () => {
    expect(fullAuditSrc).toContain('myAudits:');
  });

  it('fullAudit.getAudit procedure is defined', () => {
    expect(fullAuditSrc).toContain('getAudit:');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 17–19: buildActionPlan
// ════════════════════════════════════════════════════════════════════════════

describe('buildActionPlan', () => {
  const issues = [
    { issue: 'Weak brand identity', fix: 'Redesign logo and brand guidelines', impact: 'Low recognition' },
    { issue: 'No SEO presence', fix: 'Publish 10 optimized blog posts', impact: 'No organic traffic' },
    { issue: 'Unclear pricing', fix: 'Create a clear pricing page', impact: 'High churn' },
  ];

  it('returns thisWeek, thisMonth, and next3Months', () => {
    const plan = buildActionPlan(issues, 'egypt');
    expect(plan).toHaveProperty('thisWeek');
    expect(plan).toHaveProperty('thisMonth');
    expect(plan).toHaveProperty('next3Months');
    expect(Array.isArray(plan.thisWeek)).toBe(true);
    expect(Array.isArray(plan.thisMonth)).toBe(true);
    expect(Array.isArray(plan.next3Months)).toBe(true);
  });

  it('uses Arabic text for egypt market', () => {
    const plan = buildActionPlan(issues, 'egypt');
    expect(plan.thisMonth[0]).toContain('حل مشكلة');
    expect(plan.next3Months[0]).toContain('مراجعة');
  });

  it('uses English text for non-Arabic markets', () => {
    const plan = buildActionPlan(issues, 'other');
    expect(plan.thisMonth[0]).toContain('Address:');
    expect(plan.next3Months[0]).toContain('Full review');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 20–21: Constants
// ════════════════════════════════════════════════════════════════════════════

describe('Full Audit constants', () => {
  it('FULL_AUDIT_COST constant matches TOOL_COSTS.full_audit', () => {
    expect(FULL_AUDIT_COST).toBe(TOOL_COSTS['full_audit']);
    expect(FULL_AUDIT_COST).toBe(60);
  });

  it('LLM_TIMEOUT constant equals 25000ms', () => {
    expect(LLM_TIMEOUT).toBe(25000);
  });
});
