/**
 * TESTS — ALL NEW MODULES (Tier 1 + 2 + 3)
 * ==========================================
 * 
 * Covers: agentOrchestrator, industryPacks, qualityAssurance,
 * menaCaseStudies, vectorSearch, primoTemplates, autoReports
 * 
 * Note: autoExecution, liveIntelligence, brandObservatory, messagingIntegration
 * require live API/DB access — tested via integration tests separately.
 */

import { describe, it, expect } from 'vitest';

// ════════════════════════════════════════════
// 1. AGENT ORCHESTRATOR
// ════════════════════════════════════════════

describe('Agent Orchestrator — Routing', () => {
  // Import the routing function directly
  const { routeToAgent } = require('./agentOrchestrator');

  const baseContext = {
    conversationHistory: [],
    clientContext: undefined,
    industry: undefined,
    market: undefined,
    serviceType: undefined,
    projectStage: undefined,
  };

  it('routes diagnostic questions to diagnostician', () => {
    const agent = routeToAgent('What is wrong with my brand?', baseContext);
    expect(agent).toBe('diagnostician');
  });

  it('routes "مشكلة" to diagnostician (Arabic)', () => {
    const agent = routeToAgent('عندي مشكلة في المبيعات', baseContext);
    expect(agent).toBe('diagnostician');
  });

  it('routes strategy questions to strategist', () => {
    const agent = routeToAgent('How should I position my brand against competitors?', baseContext);
    expect(agent).toBe('strategist');
  });

  it('routes deliverable requests to executor', () => {
    const agent = routeToAgent('Create a brand audit report for this client', baseContext);
    expect(agent).toBe('executor');
  });

  it('routes research requests to researcher', () => {
    const agent = routeToAgent('Research the F&B market size in Saudi Arabia', baseContext);
    expect(agent).toBe('researcher');
  });

  it('routes project questions to PM', () => {
    const agent = routeToAgent('Which service should I recommend and what is the pricing?', baseContext);
    expect(agent).toBe('pm');
  });

  it('defaults to diagnostician for new conversations', () => {
    const agent = routeToAgent('Hello, I need help with my business', { ...baseContext, conversationHistory: [] });
    expect(agent).toBe('diagnostician');
  });

  it('respects project stage context', () => {
    const agent = routeToAgent('What should we do next?', { ...baseContext, projectStage: 'design' });
    expect(agent).toBe('strategist');
  });

  it('respects deploy stage context', () => {
    const agent = routeToAgent('What should we do next?', { ...baseContext, projectStage: 'deploy' });
    expect(agent).toBe('executor');
  });
});

// ════════════════════════════════════════════
// 2. INDUSTRY PACKS
// ════════════════════════════════════════════

describe('Industry Knowledge Packs', () => {
  const { INDUSTRY_PACKS, getIndustryPack, formatIndustryPackForAI } = require('./industryPacks');

  it('has 7 industry packs', () => {
    expect(INDUSTRY_PACKS).toHaveLength(7);
  });

  it('each pack has Egypt and/or KSA market data', () => {
    for (const pack of INDUSTRY_PACKS) {
      const hasMarketData = pack.markets.egypt || pack.markets.ksa;
      expect(hasMarketData).toBeTruthy();
    }
  });

  it('each pack has branding patterns', () => {
    for (const pack of INDUSTRY_PACKS) {
      expect(pack.brandingPatterns.length).toBeGreaterThan(0);
    }
  });

  it('each pack has common client problems', () => {
    for (const pack of INDUSTRY_PACKS) {
      expect(pack.commonClientProblems.length).toBeGreaterThan(0);
      for (const problem of pack.commonClientProblems) {
        expect(problem.problem).toBeTruthy();
        expect(problem.diagnosis).toBeTruthy();
        expect(problem.recommendedService).toBeTruthy();
      }
    }
  });

  it('getIndustryPack resolves F&B keywords', () => {
    expect(getIndustryPack('F&B')).toBeTruthy();
    expect(getIndustryPack('restaurant')).toBeTruthy();
    expect(getIndustryPack('مطعم')).toBeTruthy();
    expect(getIndustryPack('cafe')).toBeTruthy();
  });

  it('getIndustryPack resolves all industries', () => {
    const keywords = ['health', 'tech', 'real estate', 'retail', 'education', 'beauty'];
    for (const kw of keywords) {
      expect(getIndustryPack(kw)).toBeTruthy();
    }
  });

  it('getIndustryPack returns null for unknown industry', () => {
    expect(getIndustryPack('space exploration')).toBeNull();
  });

  it('formatIndustryPackForAI produces non-empty output', () => {
    const pack = getIndustryPack('F&B');
    const formatted = formatIndustryPackForAI(pack, 'egypt');
    expect(formatted.length).toBeGreaterThan(200);
    expect(formatted).toContain('Market Size');
    expect(formatted).toContain('Key Players');
  });
});

// ════════════════════════════════════════════
// 3. QUALITY ASSURANCE
// ════════════════════════════════════════════

describe('Quality Assurance — Rule-Based Checks', () => {
  const { runRuleBasedQA, quickQualityCheck } = require('./qualityAssurance');

  const goodContent = `
## Brand Audit Report — NileTech Solutions

### Executive Summary
Based on our comprehensive analysis using Keller's CBBE framework, NileTech Solutions scores 62/100 
on brand health. The primary issue is a Clarity Gap — while the product is strong, the brand 
positioning fails to communicate differentiated value to the target audience of Egyptian SMBs.

### Key Findings
1. **Brand Salience (Score: 45/100)**: Only 12% of target customers can recall NileTech when asked about 
SaaS solutions in Egypt. This is below the 25% industry benchmark from Sharp's research on mental availability.

2. **Brand Performance (Score: 70/100)**: Product quality is strong — 4.2/5 customer satisfaction. 
However, this performance advantage isn't translating to brand equity.

3. **Competitive Position**: NileTech is positioned in the mid-market but pricing suggests premium. 
Using Porter's Five Forces analysis, we identified 3 direct competitors and 2 potential disruptors.

### Recommendations
- Immediate: Clarify positioning statement — current messaging is too generic
- Short-term: Build distinctive assets (Sharp) — logo, color palette, tagline
- Medium-term: Increase mental availability through content marketing
- Budget recommendation: 210,000 EGP for Brand Identity service

### MENA Market Context
The Egyptian SaaS market is growing at 25% annually with digital transformation accelerating.
`;

  const badContent = 'Sure! Happy to help! Here is a quick summary of what we found. Your brand is doing okay.';

  it('scores good content high (>60)', () => {
    const checks = runRuleBasedQA(goodContent, 'brand_audit');
    const totalScore = checks.reduce((sum: number, c: any) => sum + c.score, 0);
    expect(totalScore).toBeGreaterThan(60);
  });

  it('scores bad content low (<40)', () => {
    const checks = runRuleBasedQA(badContent);
    const totalScore = checks.reduce((sum: number, c: any) => sum + c.score, 0);
    expect(totalScore).toBeLessThan(40);
  });

  it('detects chatbot tone in bad content', () => {
    const checks = runRuleBasedQA(badContent);
    const toneCheck = checks.find((c: any) => c.id === 'tone');
    expect(toneCheck?.passed).toBe(false);
  });

  it('detects framework usage in good content', () => {
    const checks = runRuleBasedQA(goodContent);
    const frameworkCheck = checks.find((c: any) => c.id === 'frameworks');
    expect(frameworkCheck?.passed).toBe(true);
  });

  it('detects specificity (numbers and names)', () => {
    const checks = runRuleBasedQA(goodContent);
    const specificityCheck = checks.find((c: any) => c.id === 'specificity');
    expect(specificityCheck?.score).toBeGreaterThan(10);
  });

  it('detects MENA context', () => {
    const checks = runRuleBasedQA(goodContent);
    const menaCheck = checks.find((c: any) => c.id === 'mena_context');
    expect(menaCheck?.passed).toBe(true);
  });

  it('quickQualityCheck returns score and pass/fail', () => {
    const result = quickQualityCheck(goodContent);
    expect(result.score).toBeGreaterThan(0);
    expect(typeof result.passed).toBe('boolean');
    expect(result.topIssue).toBeTruthy();
  });

  it('returns 8 checks total', () => {
    const checks = runRuleBasedQA(goodContent);
    expect(checks).toHaveLength(8);
  });
});

// ════════════════════════════════════════════
// 4. MENA CASE STUDIES
// ════════════════════════════════════════════

describe('MENA Case Studies', () => {
  const { MENA_CASE_STUDIES, matchMENACaseStudies, formatMENACaseStudiesForAI } = require('./menaCaseStudies');

  it('has 15+ case studies', () => {
    expect(MENA_CASE_STUDIES.length).toBeGreaterThanOrEqual(15);
  });

  it('has case studies from both Egypt and KSA', () => {
    const egyptCases = MENA_CASE_STUDIES.filter((c: any) => c.market === 'egypt');
    const ksaCases = MENA_CASE_STUDIES.filter((c: any) => c.market === 'ksa');
    expect(egyptCases.length).toBeGreaterThan(0);
    expect(ksaCases.length).toBeGreaterThan(0);
  });

  it('each case study has all required fields', () => {
    for (const cs of MENA_CASE_STUDIES) {
      expect(cs.brand).toBeTruthy();
      expect(cs.industry).toBeTruthy();
      expect(cs.situation).toBeTruthy();
      expect(cs.challenge).toBeTruthy();
      expect(cs.strategy).toBeTruthy();
      expect(cs.results).toBeTruthy();
      expect(cs.frameworksUsed.length).toBeGreaterThan(0);
      expect(cs.patternToRecognize).toBeTruthy();
    }
  });

  it('has Primo Marca own case studies', () => {
    const primoCases = MENA_CASE_STUDIES.filter((c: any) => c.tags.includes('primo_marca'));
    expect(primoCases.length).toBeGreaterThanOrEqual(2);
  });

  it('matchMENACaseStudies finds F&B cases for restaurant query', () => {
    const matches = matchMENACaseStudies({ industry: 'F&B', market: 'egypt', limit: 3 });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].industry).toBe('F&B');
  });

  it('matchMENACaseStudies finds KSA cases', () => {
    const matches = matchMENACaseStudies({ market: 'ksa', limit: 5 });
    expect(matches.length).toBeGreaterThan(0);
  });

  it('matchMENACaseStudies ranks by relevance', () => {
    const matches = matchMENACaseStudies({ industry: 'F&B', market: 'ksa', clientSituation: 'competing on price, commodity trap', limit: 3 });
    expect(matches.length).toBeGreaterThan(0);
    // First match should be most relevant
    if (matches.length > 1) {
      expect(matches[0]._score).toBeGreaterThanOrEqual(matches[1]._score);
    }
  });

  it('formatMENACaseStudiesForAI produces formatted output', () => {
    const output = formatMENACaseStudiesForAI('F&B', 'egypt', 2);
    expect(output.length).toBeGreaterThan(100);
    expect(output).toContain('CASE STUDY');
    expect(output).toContain('Strategy');
    expect(output).toContain('Results');
  });
});

// ════════════════════════════════════════════
// 5. VECTOR SEARCH
// ════════════════════════════════════════════

describe('Vector Search — Embedding & Similarity', () => {
  // Test the internal functions by importing the module
  // Note: generateSimpleEmbedding is not exported, so we test via semanticSearch
  const vectorSearch = require('./vectorSearch');

  it('getIndexStats returns valid structure', () => {
    const stats = vectorSearch.getIndexStats();
    expect(stats).toHaveProperty('entriesIndexed');
    expect(stats).toHaveProperty('vocabularySize');
    expect(stats.vocabularySize).toBe(200);
  });

  it('getSemanticKnowledge returns string', async () => {
    // Without indexing, should return empty string
    const result = await vectorSearch.getSemanticKnowledge('test query');
    expect(typeof result).toBe('string');
  });
});

// ════════════════════════════════════════════
// 6. PRIMO TEMPLATES
// ════════════════════════════════════════════

describe('Primo Experience Templates', () => {
  const { PRIMO_TEMPLATES, getAvailableTemplates } = require('./primoTemplates');

  it('has 4 templates', () => {
    expect(PRIMO_TEMPLATES).toHaveLength(4);
  });

  it('each template has required fields', () => {
    for (const t of PRIMO_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.nameAr).toBeTruthy();
      expect(t.fields.length).toBeGreaterThan(0);
      expect(t.category).toBeTruthy();
      expect(t.patternExtractionPrompt).toBeTruthy();
    }
  });

  it('past_project template has comprehensive fields', () => {
    const pastProject = PRIMO_TEMPLATES.find((t: any) => t.id === 'past_project');
    expect(pastProject).toBeTruthy();
    expect(pastProject.fields.length).toBeGreaterThanOrEqual(10);
    
    const fieldKeys = pastProject.fields.map((f: any) => f.key);
    expect(fieldKeys).toContain('clientName');
    expect(fieldKeys).toContain('situationBefore');
    expect(fieldKeys).toContain('realDiagnosis');
    expect(fieldKeys).toContain('strategyApplied');
    expect(fieldKeys).toContain('results');
  });

  it('pricing_lesson template exists', () => {
    const pricing = PRIMO_TEMPLATES.find((t: any) => t.id === 'pricing_lesson');
    expect(pricing).toBeTruthy();
    expect(pricing.fields.some((f: any) => f.key === 'priceCharged')).toBe(true);
  });

  it('getAvailableTemplates returns serializable data', () => {
    const templates = getAvailableTemplates();
    expect(templates).toHaveLength(4);
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.fieldCount).toBeGreaterThan(0);
      // Should not include the patternExtractionPrompt (internal)
      expect(t).not.toHaveProperty('patternExtractionPrompt');
    }
  });
});

// ════════════════════════════════════════════
// 7. KNOWLEDGE AMPLIFIER
// ════════════════════════════════════════════

describe('Knowledge Amplifier — Quality Scoring', () => {
  const { scoreKnowledgeQuality, KNOWLEDGE_TEMPLATES } = require('./knowledgeAmplifier');

  it('scores a comprehensive entry high', () => {
    const result = scoreKnowledgeQuality({
      title: 'Egyptian F&B Market Pricing Benchmark 2025',
      content: `Based on our research of 50+ agencies, the Egyptian F&B branding market shows clear pricing tiers:
        Budget agencies: 5,000-30,000 EGP. Mid-tier: 50,000-150,000 EGP. Premium (Primo Marca tier): 150,000-350,000 EGP.
        We recommend positioning at the premium tier because Keller's CBBE framework shows that perceived quality
        drives brand equity. Sharp's research confirms that distinctive assets justify premium pricing.
        When a client says "we need a cheaper option", always explore whether the real issue is clarity (Clarity Gap)
        rather than budget. Example: Zooba elevated Egyptian street food to premium pricing by category creation.`,
      category: 'market_insight',
      tags: ['pricing', 'egypt', 'f&b', 'benchmark'],
    });
    expect(result.score).toBeGreaterThan(50);
    expect(result.suggestions.length).toBeLessThan(5); // Few suggestions = good quality
  });

  it('scores a thin entry low with suggestions', () => {
    const result = scoreKnowledgeQuality({
      title: 'Note',
      content: 'The market is big.',
      category: 'general',
    });
    expect(result.score).toBeLessThan(30);
    expect(result.suggestions.length).toBeGreaterThan(3);
  });

  it('has 6 knowledge templates', () => {
    expect(KNOWLEDGE_TEMPLATES).toHaveLength(6);
  });
});

// ════════════════════════════════════════════
// 8. AGENT LABELS & INFO
// ════════════════════════════════════════════

describe('Agent Info', () => {
  const { getAgentInfo, AGENT_LABELS } = require('./agentOrchestrator');

  it('has 5 agents', () => {
    expect(Object.keys(AGENT_LABELS)).toHaveLength(5);
  });

  it('each agent has EN and AR labels', () => {
    for (const [id, labels] of Object.entries(AGENT_LABELS) as any) {
      expect(labels.en).toBeTruthy();
      expect(labels.ar).toBeTruthy();
    }
  });

  it('getAgentInfo returns description', () => {
    const info = getAgentInfo('diagnostician');
    expect(info.description).toBeTruthy();
    expect(info.en).toBeTruthy();
    expect(info.ar).toBeTruthy();
  });
});
