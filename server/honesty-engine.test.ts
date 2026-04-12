/**
 * Honesty Engine Test Suite — Sprint D
 * ======================================
 * 9 tests covering: confidence scoring, source attribution,
 * limitations generation, score clamping, and inflation detection.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateConfidence,
  getSourceForPillar,
  buildLimitations,
  clampScores,
  detectInflation,
  type AuditMeta,
} from './routers/fullAudit';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const FULL_META: AuditMeta = {
  hasWebsiteData: true,
  hasLighthouseData: true,
  hasCompetitorData: true,
  searchResultsCount: 5,
  hasKnowledgeData: true,
};

const EMPTY_META: AuditMeta = {
  hasWebsiteData: false,
  hasLighthouseData: false,
  hasCompetitorData: false,
  searchResultsCount: 0,
  hasKnowledgeData: false,
};

// ════════════════════════════════════════════════════════════════════════════
// 1–2: calculateConfidence
// ════════════════════════════════════════════════════════════════════════════

describe('calculateConfidence', () => {
  it('returns high confidence when all data sources are available', () => {
    const result = calculateConfidence(FULL_META);
    // 15(user) + 30(website) + 20(lighthouse) + 25(competitors) + 10(knowledge) = 100
    expect(result.level).toBe('high');
    expect(result.score).toBe(100);
    expect(result.sources).toContain('website_scraping');
    expect(result.sources).toContain('lighthouse_performance');
    expect(result.sources).toContain('competitor_research');
    expect(result.sources).toContain('industry_knowledge');
    expect(result.sources).toContain('user_input');
  });

  it('returns low confidence when only user input is available', () => {
    const result = calculateConfidence(EMPTY_META);
    // Only 15(user_input)
    expect(result.level).toBe('low');
    expect(result.score).toBe(15);
    expect(result.sources).toEqual(['user_input']);
    expect(result.reasonAr).toContain('منخفضة');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3: getSourceForPillar
// ════════════════════════════════════════════════════════════════════════════

describe('getSourceForPillar', () => {
  it('assigns lighthouse source to digital_presence when lighthouse data available', () => {
    expect(getSourceForPillar('digital_presence', FULL_META)).toBe('lighthouse');
  });

  it('assigns user_input when no external data available', () => {
    expect(getSourceForPillar('identity', EMPTY_META)).toBe('user_input');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4–5: buildLimitations
// ════════════════════════════════════════════════════════════════════════════

describe('buildLimitations', () => {
  it('generates Arabic limitations for egypt market when data is missing', () => {
    const limitations = buildLimitations(EMPTY_META, 'egypt');
    expect(limitations.some((l) => l.includes('الموقع'))).toBe(true);
    expect(limitations.some((l) => l.includes('Lighthouse') || l.includes('أداء'))).toBe(true);
    expect(limitations.some((l) => l.includes('المنافسين'))).toBe(true);
    expect(limitations.some((l) => l.includes('السوشيال'))).toBe(true);
  });

  it('generates English limitations for non-Arabic market', () => {
    const limitations = buildLimitations(EMPTY_META, 'other');
    expect(limitations.some((l) => l.includes('Website'))).toBe(true);
    expect(limitations.some((l) => l.includes('social media'))).toBe(true);
    // Always includes social media disclaimer
    expect(limitations.length).toBeGreaterThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6–7: clampScores
// ════════════════════════════════════════════════════════════════════════════

describe('clampScores', () => {
  it('clamps scores above 100 down to 100', () => {
    const result = clampScores([{ id: 'test', score: 150 }]);
    expect(result[0].score).toBe(100);
  });

  it('clamps negative scores up to 0 and rounds decimals', () => {
    const result = clampScores([
      { id: 'a', score: -10 },
      { id: 'b', score: 72.7 },
    ]);
    expect(result[0].score).toBe(0);
    expect(result[1].score).toBe(73);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8–9: detectInflation
// ════════════════════════════════════════════════════════════════════════════

describe('detectInflation', () => {
  it('adds inflation warning when all pillar scores are ≥ 80', () => {
    const pillars = [
      { id: 'a', score: 85 },
      { id: 'b', score: 90 },
      { id: 'c', score: 82 },
    ];
    const result = detectInflation(pillars, [], 'egypt');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toContain('⚠️');
  });

  it('does NOT add inflation warning when any pillar scores below 80', () => {
    const pillars = [
      { id: 'a', score: 85 },
      { id: 'b', score: 70 },
      { id: 'c', score: 90 },
    ];
    const result = detectInflation(pillars, ['existing limit'], 'egypt');
    expect(result).toEqual(['existing limit']);
  });
});
