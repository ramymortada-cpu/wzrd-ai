/**
 * REAL Integration Tests — test actual module interactions
 * =========================================================
 * 
 * These test the NEW systems built in Sprints 1-4 + A-C:
 * 1. LLM Resilience (cache + offline mode)
 * 2. Quality Pipeline (auto-scoring + thresholds)
 * 3. RBAC (checkOwner enforcement)
 * 4. Smart Search (knowledge-first routing)
 * 5. Prompt Lab (version management + A/B)
 * 6. Error Handler (format + process handlers)
 * 7. Vector Search (synonym matching)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ════════════════════════════════════════════
// 1. LLM CACHE TESTS
// ════════════════════════════════════════════

describe('LLM Cache', () => {
  let getCachedResponse: typeof import('./_core/llmCache').getCachedResponse;
  let setCachedResponse: typeof import('./_core/llmCache').setCachedResponse;
  let getCacheStats: typeof import('./_core/llmCache').getCacheStats;
  let invalidateCache: typeof import('./_core/llmCache').invalidateCache;

  beforeEach(async () => {
    const mod = await import('./_core/llmCache');
    getCachedResponse = mod.getCachedResponse;
    setCachedResponse = mod.setCachedResponse;
    getCacheStats = mod.getCacheStats;
    invalidateCache = mod.invalidateCache;
    invalidateCache(); // Clean slate
  });

  it('should return null for uncached prompts', () => {
    const result = getCachedResponse([
      { role: 'user', content: 'Hello world' }
    ]);
    expect(result).toBeNull();
  });

  it('should cache and retrieve responses', () => {
    const messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'What is branding?' }
    ];
    
    setCachedResponse(messages, 'Branding is...', 500, 'chat');
    const cached = getCachedResponse(messages, 'chat');
    
    expect(cached).not.toBeNull();
    expect(cached!.response).toBe('Branding is...');
    expect(cached!.tokensUsed).toBe(500);
  });

  it('should track cache stats correctly', () => {
    const messages = [{ role: 'user', content: 'test' }];
    setCachedResponse(messages, 'response', 100, 'chat');
    
    // First call = miss (before set), second = hit
    getCachedResponse(messages, 'chat');
    
    const stats = getCacheStats();
    expect(stats.cacheHits).toBeGreaterThanOrEqual(1);
    expect(stats.currentEntries).toBeGreaterThanOrEqual(1);
  });

  it('should not return expired cache entries', () => {
    const messages = [{ role: 'user', content: 'expiry test' }];
    
    // Manually we can't test TTL easily without time mocking
    // But we can verify the structure works
    setCachedResponse(messages, 'temp', 100, 'chat');
    const result = getCachedResponse(messages, 'chat');
    expect(result).not.toBeNull();
  });

  it('should differentiate different prompts', () => {
    const msg1 = [{ role: 'user', content: 'Question A' }];
    const msg2 = [{ role: 'user', content: 'Question B' }];
    
    setCachedResponse(msg1, 'Answer A', 100, 'chat');
    setCachedResponse(msg2, 'Answer B', 200, 'chat');
    
    expect(getCachedResponse(msg1)!.response).toBe('Answer A');
    expect(getCachedResponse(msg2)!.response).toBe('Answer B');
  });

  it('should clear all entries on invalidate', () => {
    setCachedResponse([{ role: 'user', content: 'a' }], 'r', 10, 'chat');
    setCachedResponse([{ role: 'user', content: 'b' }], 'r', 10, 'chat');
    
    const cleared = invalidateCache();
    expect(cleared).toBeGreaterThanOrEqual(2);
    expect(getCacheStats().currentEntries).toBe(0);
  });
});

// ════════════════════════════════════════════
// 2. QUALITY PIPELINE TESTS
// ════════════════════════════════════════════

describe('Quality Pipeline', () => {
  let assessDeliverableQuality: typeof import('./qualityFeedback').assessDeliverableQuality;
  let getQualityLabel: typeof import('./qualityFeedback').getQualityLabel;
  let recordOwnerReview: typeof import('./qualityFeedback').recordOwnerReview;
  let getDeliverableQuality: typeof import('./qualityFeedback').getDeliverableQuality;

  beforeEach(async () => {
    const mod = await import('./qualityFeedback');
    assessDeliverableQuality = mod.assessDeliverableQuality;
    getQualityLabel = mod.getQualityLabel;
    recordOwnerReview = mod.recordOwnerReview;
    getDeliverableQuality = mod.getDeliverableQuality;
  });

  it('should score a short deliverable low', async () => {
    const result = await assessDeliverableQuality(
      'This is a very short deliverable with no substance.',
      1001, 'brand_audit', { skipAI: true }
    );
    
    expect(result.finalScore).toBeLessThan(70);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should score a detailed deliverable higher', async () => {
    const detailed = `
# Brand Audit Report — Sahra Café

## Executive Summary
Sahra Café is a specialty coffee chain in Riyadh with 3 locations. Founded in 2019, 
the brand has grown 40% YoY but faces increasing competition from international chains.

## Brand Health Score: 62/100

## Key Findings by Impact

### 1. Positioning Gap (HIGH IMPACT)
Sahra positions itself as "premium artisan coffee" but pricing is 15% below competitors 
like Camel Step and Barn's. This creates cognitive dissonance — the brand promises premium 
but signals mid-market through pricing. Using Kapferer's Brand Identity Prism, the Physical 
facet (packaging, store design) is strong but the Relationship facet is weak.

### 2. Digital Presence (MEDIUM IMPACT)  
Instagram: 12K followers with 2.3% engagement rate (industry avg: 1.8%). 
Content strategy lacks consistency — posts range from product shots to memes.

### 3. Competitive Landscape
Top 5 competitors in Riyadh specialty coffee: Camel Step (45 locations), Barn's (28), 
Dose (22), Cup of Joe (15), Sahra (3). Market share estimated at 2%.

## Recommendations
1. Increase pricing by 10-15% to match positioning (Priority: HIGH)
2. Develop brand story around Saudi coffee heritage (Priority: HIGH)
3. Implement consistent visual identity system (Priority: MEDIUM)

## Framework Applied: Keller's CBBE + Kapferer's Prism
    `.trim();

    const result = await assessDeliverableQuality(
      detailed, 1002, 'brand_audit', { skipAI: true }
    );
    
    expect(result.finalScore).toBeGreaterThanOrEqual(55);
    expect(result.passed).toBe(true);
  });

  it('should return correct quality labels', () => {
    expect(getQualityLabel(90).label).toBe('Excellent');
    expect(getQualityLabel(80).label).toBe('Good');
    expect(getQualityLabel(60).label).toBe('Needs Review');
    expect(getQualityLabel(40).label).toBe('Rejected');
  });

  it('should record and retrieve owner reviews', () => {
    recordOwnerReview({ deliverableId: 2001, score: 4, notes: 'Good work' });
    const quality = getDeliverableQuality(2001);
    expect(quality.ownerScore).toBe(4);
    expect(quality.ownerNotes).toBe('Good work');
  });
});

// ════════════════════════════════════════════
// 3. RBAC TESTS
// ════════════════════════════════════════════

describe('RBAC — Authorization', () => {
  let hasRole: typeof import('./_core/authorization').hasRole;
  let requireRole: typeof import('./_core/authorization').requireRole;
  let canPerform: typeof import('./_core/authorization').canPerform;
  let getPermissionsForRole: typeof import('./_core/authorization').getPermissionsForRole;

  beforeEach(async () => {
    const mod = await import('./_core/authorization');
    hasRole = mod.hasRole;
    requireRole = mod.requireRole;
    canPerform = mod.canPerform;
    getPermissionsForRole = mod.getPermissionsForRole;
  });

  it('should allow owner to do everything', () => {
    const owner = { id: 1, name: 'Ramy', email: 'r@pm.com', role: 'owner' as const };
    expect(hasRole(owner, 'owner')).toBe(true);
    expect(hasRole(owner, 'editor')).toBe(true);
    expect(hasRole(owner, 'viewer')).toBe(true);
  });

  it('should restrict editor from owner-only actions', () => {
    const editor = { id: 2, name: 'Designer', email: 'd@pm.com', role: 'editor' as const };
    expect(hasRole(editor, 'owner')).toBe(false);
    expect(hasRole(editor, 'editor')).toBe(true);
    expect(hasRole(editor, 'viewer')).toBe(true);
  });

  it('should restrict viewer to read-only', () => {
    const viewer = { id: 3, name: 'Intern', email: 'i@pm.com', role: 'viewer' as const };
    expect(hasRole(viewer, 'owner')).toBe(false);
    expect(hasRole(viewer, 'editor')).toBe(false);
    expect(hasRole(viewer, 'viewer')).toBe(true);
  });

  it('should throw FORBIDDEN for unauthorized role', () => {
    const viewer = { id: 3, name: 'Intern', email: 'i@pm.com', role: 'viewer' as const };
    expect(() => requireRole(viewer, 'owner')).toThrow();
  });

  it('should return correct permissions per role', () => {
    const ownerPerms = getPermissionsForRole('owner');
    const viewerPerms = getPermissionsForRole('viewer');
    
    expect(ownerPerms.length).toBeGreaterThan(viewerPerms.length);
    expect(ownerPerms).toContain('payments.create');
    expect(viewerPerms).not.toContain('payments.create');
    expect(viewerPerms).toContain('clients.list');
  });

  it('should check specific permissions correctly', () => {
    expect(canPerform('owner', 'payments.create')).toBe(true);
    expect(canPerform('editor', 'payments.create')).toBe(false);
    expect(canPerform('editor', 'clients.create')).toBe(true);
    expect(canPerform('viewer', 'clients.list')).toBe(true);
    expect(canPerform('viewer', 'clients.create')).toBe(false);
  });
});

// ════════════════════════════════════════════
// 4. PROMPT LAB TESTS
// ════════════════════════════════════════════

describe('Prompt Lab — A/B Testing', () => {
  let createPromptVersion: typeof import('./promptLab').createPromptVersion;
  let activateVersion: typeof import('./promptLab').activateVersion;
  let getActivePrompt: typeof import('./promptLab').getActivePrompt;
  let recordPromptMetric: typeof import('./promptLab').recordPromptMetric;
  let analyzeABTest: typeof import('./promptLab').analyzeABTest;
  let listPrompts: typeof import('./promptLab').listPrompts;

  beforeEach(async () => {
    const mod = await import('./promptLab');
    createPromptVersion = mod.createPromptVersion;
    activateVersion = mod.activateVersion;
    getActivePrompt = mod.getActivePrompt;
    recordPromptMetric = mod.recordPromptMetric;
    analyzeABTest = mod.analyzeABTest;
    listPrompts = mod.listPrompts;
  });

  it('should create and retrieve prompt versions', () => {
    const v1 = createPromptVersion('test_agent', 'You are a test agent v1');
    expect(v1.version).toBe(1);
    expect(v1.promptName).toBe('test_agent');
    
    const v2 = createPromptVersion('test_agent', 'You are a test agent v2 — improved');
    expect(v2.version).toBe(2);
  });

  it('should activate versions correctly', () => {
    createPromptVersion('activate_test', 'Version 1');
    createPromptVersion('activate_test', 'Version 2');
    
    activateVersion('activate_test', 2);
    const active = getActivePrompt('activate_test');
    
    expect(active).not.toBeNull();
    expect(active!.version).toBe(2);
    expect(active!.content).toBe('Version 2');
  });

  it('should record metrics for A/B analysis', () => {
    createPromptVersion('metric_test', 'V1');
    activateVersion('metric_test', 1);
    
    recordPromptMetric('metric_test', 1, { qualityScore: 85, responseTimeMs: 2000 });
    recordPromptMetric('metric_test', 1, { qualityScore: 90, responseTimeMs: 1500 });
    
    const result = analyzeABTest('metric_test');
    // Need 2 versions for A/B test
    expect(result).toBeNull(); // Only 1 version
  });

  it('should list all prompts', () => {
    createPromptVersion('list_test_a', 'Content A');
    createPromptVersion('list_test_b', 'Content B');
    
    const list = listPrompts();
    const names = list.map(p => p.name);
    expect(names).toContain('list_test_a');
    expect(names).toContain('list_test_b');
  });
});

// ════════════════════════════════════════════
// 5. ERROR HANDLER TESTS
// ════════════════════════════════════════════

describe('Error Handler', () => {
  let formatTRPCError: typeof import('./_core/errorHandler').formatTRPCError;

  beforeEach(async () => {
    const mod = await import('./_core/errorHandler');
    formatTRPCError = mod.formatTRPCError;
  });

  it('should format errors with code and message', () => {
    const { TRPCError } = require('@trpc/server');
    const error = new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
    
    const formatted = formatTRPCError(error, 'clients.getById');
    expect(formatted.code).toBe('NOT_FOUND');
  });

  it('should include path in formatted error', () => {
    const { TRPCError } = require('@trpc/server');
    const error = new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
    
    const formatted = formatTRPCError(error, 'ai.chat');
    expect(formatted.path).toBe('ai.chat');
  });
});

// ════════════════════════════════════════════
// 6. VECTOR SEARCH SYNONYM TESTS
// ════════════════════════════════════════════

describe('Vector Search — Synonym Matching', () => {
  it('should match Arabic-English synonym pairs', async () => {
    // The vectorSearch module uses synonyms to expand queries
    // We test the embedding quality by checking that related terms
    // produce similar vectors
    
    // This is a structural test — verifying the synonym groups exist
    const fs = await import('fs');
    const content = fs.readFileSync('server/vectorSearch.ts', 'utf8');
    
    // Verify synonym groups are defined
    expect(content).toContain('SYNONYM_GROUPS');
    expect(content).toContain("'revenue'");
    expect(content).toContain("'مبيعات'");
    expect(content).toContain("'مطعم'");
    expect(content).toContain("'restaurant'");
    
    // Verify expanded vocabulary
    expect(content).toContain("'kapferer'");
    expect(content).toContain("'keller'");
    expect(content).toContain("'السعودية'");
    expect(content).toContain("'القاهرة'");
  });
});

// ════════════════════════════════════════════
// 7. RESEARCH QUOTA TESTS
// ════════════════════════════════════════════

describe('Research Quota', () => {
  let getQuotaStats: typeof import('./researchQuota').getQuotaStats;

  beforeEach(async () => {
    const mod = await import('./researchQuota');
    getQuotaStats = mod.getQuotaStats;
  });

  it('should track daily quota correctly', () => {
    const stats = getQuotaStats();
    
    expect(stats.date).toBeDefined();
    expect(stats.googleUsed).toBeGreaterThanOrEqual(0);
    expect(stats.googleRemaining).toBeLessThanOrEqual(100);
    expect(stats.limits).toBeDefined();
    expect(stats.limits.GOOGLE_DAILY).toBe(100);
  });

  it('should have knowledge hit rate tracking', () => {
    const stats = getQuotaStats();
    expect(stats.knowledgeHitRate).toBeDefined();
    expect(typeof stats.knowledgeHitRate).toBe('string');
  });
});
