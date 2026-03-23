import { describe, it, expect } from 'vitest';
import {
  EGYPT_MARKET,
  KSA_MARKET,
  UAE_MARKET,
  INDUSTRY_BENCHMARKS,
  AGENCY_PRICING,
  MENA_DIGITAL_TRENDS,
  EGYPT_BUSINESS,
  KSA_BUSINESS,
  PRIMO_MARCA_POSITIONING,
  getMarketProfile,
  getIndustryBenchmark,
  getAgencyPricing,
  formatMarketForPrompt,
  formatBenchmarksForPrompt,
  formatPricingForPrompt,
  formatConsumerTrendsForPrompt,
  getAllMarketIntelligenceForKnowledgeBase,
  getRelevantMarketIntelligence,
} from './marketIntelligence';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: DATA COMPLETENESS — Every data point must have real numbers
// ═══════════════════════════════════════════════════════════════════════════

describe('Market Data Completeness', () => {
  it('Egypt market has all required fields with real numbers', () => {
    expect(EGYPT_MARKET.advertisingMarket.totalSize).toContain('USD');
    expect(EGYPT_MARKET.advertisingMarket.totalSize).toContain('2.37');
    expect(EGYPT_MARKET.digitalLandscape.internetPenetration).toContain('72.2%');
    expect(EGYPT_MARKET.digitalLandscape.mobilePenetration).toContain('97.3%');
    expect(EGYPT_MARKET.digitalLandscape.topPlatforms.length).toBeGreaterThanOrEqual(4);
    expect(EGYPT_MARKET.ecommerce.marketSize).toContain('9.1');
    expect(EGYPT_MARKET.advertisingCosts.avgCPM).toContain('$1.81');
    expect(EGYPT_MARKET.keyInsights.length).toBeGreaterThanOrEqual(5);
  });

  it('KSA market has all required fields with real numbers', () => {
    expect(KSA_MARKET.advertisingMarket.totalSize).toContain('6.28');
    expect(KSA_MARKET.digitalLandscape.socialMediaPenetration).toContain('82.3%');
    expect(KSA_MARKET.digitalLandscape.topPlatforms.length).toBeGreaterThanOrEqual(4);
    expect(KSA_MARKET.ecommerce.marketSize).toContain('12.6');
    expect(KSA_MARKET.keyInsights.length).toBeGreaterThanOrEqual(5);
    // KSA-specific: Vision 2030 and Snapchat
    expect(KSA_MARKET.keyInsights.some(i => i.includes('Snapchat'))).toBe(true);
    expect(KSA_MARKET.keyInsights.some(i => i.includes('Vision 2030'))).toBe(true);
  });

  it('UAE market has all required fields with real numbers', () => {
    expect(UAE_MARKET.advertisingMarket.totalSize).toContain('3.38');
    expect(UAE_MARKET.digitalLandscape.socialMediaPenetration).toContain('112.5%');
    expect(UAE_MARKET.digitalLandscape.topPlatforms.length).toBeGreaterThanOrEqual(4);
    expect(UAE_MARKET.keyInsights.length).toBeGreaterThanOrEqual(5);
    // UAE-specific: premium market, expat
    expect(UAE_MARKET.keyInsights.some(i => i.toLowerCase().includes('premium') || i.toLowerCase().includes('luxury'))).toBe(true);
  });

  it('all market profiles have source attributions', () => {
    for (const market of [EGYPT_MARKET, KSA_MARKET, UAE_MARKET]) {
      expect(market.advertisingMarket.source).toBeTruthy();
      expect(market.digitalLandscape.source).toBeTruthy();
      expect(market.ecommerce.source).toBeTruthy();
      expect(market.advertisingCosts.source).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: INDUSTRY BENCHMARKS — Must cover all key industries
// ═══════════════════════════════════════════════════════════════════════════

describe('Industry Benchmarks', () => {
  it('covers all 7 key industries', () => {
    expect(INDUSTRY_BENCHMARKS.length).toBe(7);
    const industries = INDUSTRY_BENCHMARKS.map(b => b.industry.toLowerCase());
    expect(industries.some(i => i.includes('f&b'))).toBe(true);
    expect(industries.some(i => i.includes('healthcare'))).toBe(true);
    expect(industries.some(i => i.includes('real estate'))).toBe(true);
    expect(industries.some(i => i.includes('tech') || i.includes('saas'))).toBe(true);
    expect(industries.some(i => i.includes('retail') || i.includes('ecommerce'))).toBe(true);
    expect(industries.some(i => i.includes('education'))).toBe(true);
    expect(industries.some(i => i.includes('beauty') || i.includes('cosmetic'))).toBe(true);
  });

  it('every benchmark has CAC, conversion, retention, and CLV data', () => {
    for (const b of INDUSTRY_BENCHMARKS) {
      expect(b.cac).toBeTruthy();
      expect(b.conversionRate).toBeTruthy();
      expect(b.retentionRate).toBeTruthy();
      expect(b.clv).toBeTruthy();
      expect(b.source).toBeTruthy();
    }
  });

  it('CAC values contain dollar amounts', () => {
    for (const b of INDUSTRY_BENCHMARKS) {
      expect(b.cac).toMatch(/\$/);
    }
  });

  it('conversion rates contain percentages', () => {
    for (const b of INDUSTRY_BENCHMARKS) {
      expect(b.conversionRate).toMatch(/%/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: AGENCY PRICING — Must cover Egypt, KSA, UAE
// ═══════════════════════════════════════════════════════════════════════════

describe('Agency Pricing Benchmarks', () => {
  it('covers all 3 markets (Egypt, KSA, UAE)', () => {
    expect(AGENCY_PRICING.length).toBe(3);
    const markets = AGENCY_PRICING.map(p => p.market);
    expect(markets).toContain('Egypt');
    expect(markets.some(m => m.includes('Saudi') || m.includes('KSA'))).toBe(true);
    expect(markets).toContain('UAE');
  });

  it('Egypt pricing is in EGP', () => {
    const egypt = AGENCY_PRICING.find(p => p.market === 'Egypt')!;
    expect(egypt.currency).toBe('EGP');
    expect(egypt.brandIdentity.small).toContain('EGP');
    expect(egypt.socialMediaManagement.basic).toContain('EGP');
  });

  it('KSA pricing is in SAR', () => {
    const ksa = AGENCY_PRICING.find(p => p.market.includes('Saudi'))!;
    expect(ksa.currency).toBe('SAR');
    expect(ksa.brandIdentity.small).toContain('SAR');
  });

  it('UAE pricing is in AED', () => {
    const uae = AGENCY_PRICING.find(p => p.market === 'UAE')!;
    expect(uae.currency).toBe('AED');
    expect(uae.brandIdentity.small).toContain('AED');
  });

  it('every pricing has all service categories', () => {
    for (const p of AGENCY_PRICING) {
      expect(p.brandIdentity.small).toBeTruthy();
      expect(p.brandIdentity.medium).toBeTruthy();
      expect(p.brandIdentity.large).toBeTruthy();
      expect(p.brandStrategy.foundational).toBeTruthy();
      expect(p.brandStrategy.comprehensive).toBeTruthy();
      expect(p.brandStrategy.enterprise).toBeTruthy();
      expect(p.socialMediaManagement.basic).toBeTruthy();
      expect(p.socialMediaManagement.growth).toBeTruthy();
      expect(p.socialMediaManagement.enterprise).toBeTruthy();
      expect(p.source).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: CONSUMER BEHAVIOR & DIGITAL TRENDS
// ═══════════════════════════════════════════════════════════════════════════

describe('MENA Digital Trends', () => {
  it('has total digital ad spend data', () => {
    expect(MENA_DIGITAL_TRENDS.totalDigitalAdSpend).toContain('$6.95');
  });

  it('has influencer marketing data with numbers', () => {
    expect(MENA_DIGITAL_TRENDS.influencerMarketing.marketSize).toContain('$576');
    expect(MENA_DIGITAL_TRENDS.influencerMarketing.effectiveness).toContain('76.9%');
  });

  it('has social media engagement rates for all major platforms', () => {
    expect(MENA_DIGITAL_TRENDS.socialMediaEngagement.instagram).toBeTruthy();
    expect(MENA_DIGITAL_TRENDS.socialMediaEngagement.facebook).toBeTruthy();
    expect(MENA_DIGITAL_TRENDS.socialMediaEngagement.twitter).toBeTruthy();
    expect(MENA_DIGITAL_TRENDS.socialMediaEngagement.linkedin).toBeTruthy();
    expect(MENA_DIGITAL_TRENDS.socialMediaEngagement.tiktok).toBeTruthy();
  });

  it('has email marketing benchmarks for Middle East', () => {
    expect(MENA_DIGITAL_TRENDS.emailMarketing.openRate).toContain('16.39%');
    expect(MENA_DIGITAL_TRENDS.emailMarketing.clickThroughRate).toContain('0.89%');
  });

  it('has Gen Z trends', () => {
    expect(MENA_DIGITAL_TRENDS.consumerBehavior.genZTrends.length).toBeGreaterThanOrEqual(3);
  });

  it('has brand loyalty drivers for KSA', () => {
    expect(MENA_DIGITAL_TRENDS.consumerBehavior.brandLoyaltyDrivers.ksa.length).toBeGreaterThanOrEqual(3);
    expect(MENA_DIGITAL_TRENDS.consumerBehavior.brandLoyaltyDrivers.source).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: BUSINESS ENVIRONMENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe('Business Environment Data', () => {
  it('Egypt business data has startup ecosystem info', () => {
    expect(EGYPT_BUSINESS.startupEcosystem.vcFunding2024).toContain('$312');
    expect(EGYPT_BUSINESS.startupEcosystem.topSectors).toBeTruthy();
  });

  it('KSA business data has Vision 2030 impact', () => {
    expect(KSA_BUSINESS.vision2030Impact.entertainmentMarket).toContain('12.96');
    expect(KSA_BUSINESS.vision2030Impact.tourismTargets).toContain('150 million');
    expect(KSA_BUSINESS.vision2030Impact.womenWorkforce).toContain('33.8%');
  });

  it('KSA has mega-projects list', () => {
    expect(KSA_BUSINESS.megaProjects.length).toBeGreaterThanOrEqual(5);
    expect(KSA_BUSINESS.megaProjects.some(p => p.includes('NEOM'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: PRIMO MARCA COMPETITIVE POSITIONING
// ═══════════════════════════════════════════════════════════════════════════

describe('Primo Marca Positioning', () => {
  it('has pricing context with market comparison', () => {
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('Clarity Package');
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('Brand Foundation');
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('Growth Partnership');
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('25,000 EGP');
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('120,000 EGP');
  });

  it('has competitive advantages', () => {
    expect(PRIMO_MARCA_POSITIONING.competitiveAdvantages.length).toBeGreaterThanOrEqual(5);
    expect(PRIMO_MARCA_POSITIONING.competitiveAdvantages.some(a => a.includes('4D Framework'))).toBe(true);
  });

  it('pricing context includes sales objection handling', () => {
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('too expensive');
    expect(PRIMO_MARCA_POSITIONING.pricingContext).toContain('cheaper agencies');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('Utility Functions', () => {
  describe('getMarketProfile', () => {
    it('finds Egypt by various names', () => {
      expect(getMarketProfile('egypt')).toBe(EGYPT_MARKET);
      expect(getMarketProfile('Egypt')).toBe(EGYPT_MARKET);
      expect(getMarketProfile('مصر')).toBe(EGYPT_MARKET);
      expect(getMarketProfile('cairo')).toBe(EGYPT_MARKET);
    });

    it('finds KSA by various names', () => {
      expect(getMarketProfile('saudi')).toBe(KSA_MARKET);
      expect(getMarketProfile('KSA')).toBe(KSA_MARKET);
      expect(getMarketProfile('السعودية')).toBe(KSA_MARKET);
      expect(getMarketProfile('riyadh')).toBe(KSA_MARKET);
    });

    it('finds UAE by various names', () => {
      expect(getMarketProfile('uae')).toBe(UAE_MARKET);
      expect(getMarketProfile('dubai')).toBe(UAE_MARKET);
      expect(getMarketProfile('الإمارات')).toBe(UAE_MARKET);
    });

    it('returns null for unknown markets', () => {
      expect(getMarketProfile('mars')).toBeNull();
    });
  });

  describe('getIndustryBenchmark', () => {
    it('finds F&B industry', () => {
      const result = getIndustryBenchmark('f&b');
      expect(result).not.toBeNull();
      expect(result!.industry).toContain('F&B');
    });

    it('finds healthcare industry', () => {
      const result = getIndustryBenchmark('healthcare');
      expect(result).not.toBeNull();
    });

    it('finds tech/SaaS industry', () => {
      const result = getIndustryBenchmark('tech');
      expect(result).not.toBeNull();
    });

    it('returns null for unknown industries', () => {
      expect(getIndustryBenchmark('space mining')).toBeNull();
    });
  });

  describe('getAgencyPricing', () => {
    it('finds Egypt pricing', () => {
      const result = getAgencyPricing('egypt');
      expect(result).not.toBeNull();
      expect(result!.currency).toBe('EGP');
    });

    it('finds KSA pricing', () => {
      const result = getAgencyPricing('saudi');
      expect(result).not.toBeNull();
      expect(result!.currency).toBe('SAR');
    });

    it('finds UAE pricing', () => {
      const result = getAgencyPricing('uae');
      expect(result).not.toBeNull();
      expect(result!.currency).toBe('AED');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: FORMAT FUNCTIONS — Must produce usable AI prompt content
// ═══════════════════════════════════════════════════════════════════════════

describe('Format Functions for AI Prompts', () => {
  it('formatMarketForPrompt produces structured markdown', () => {
    const result = formatMarketForPrompt(EGYPT_MARKET);
    expect(result).toContain('## Egypt MARKET DATA');
    expect(result).toContain('### Advertising Market');
    expect(result).toContain('### Digital Landscape');
    expect(result).toContain('### E-commerce');
    expect(result).toContain('### Key Insights');
    expect(result).toContain('Facebook');
    expect(result).toContain('USD 2.37');
  });

  it('formatBenchmarksForPrompt produces a table', () => {
    const result = formatBenchmarksForPrompt();
    expect(result).toContain('| Industry |');
    expect(result).toContain('| F&B');
    expect(result).toContain('| Healthcare');
    expect(result).toContain('Sources:');
  });

  it('formatPricingForPrompt includes all markets and Primo Marca comparison', () => {
    const result = formatPricingForPrompt();
    expect(result).toContain('### Egypt');
    expect(result).toContain('### Saudi');
    expect(result).toContain('### UAE');
    expect(result).toContain('PRIMO MARCA PRICING');
    expect(result).toContain('Clarity Package');
  });

  it('formatConsumerTrendsForPrompt includes all sections', () => {
    const result = formatConsumerTrendsForPrompt();
    expect(result).toContain('Digital Ad Spend');
    expect(result).toContain('Influencer Marketing');
    expect(result).toContain('Brand Loyalty');
    expect(result).toContain('Gen Z');
    expect(result).toContain('Social Media Engagement');
    expect(result).toContain('Email Marketing');
  });

  it('getAllMarketIntelligenceForKnowledgeBase produces comprehensive output', () => {
    const result = getAllMarketIntelligenceForKnowledgeBase();
    // Must be substantial
    expect(result.length).toBeGreaterThan(3000);
    // Must include all markets
    expect(result).toContain('Egypt');
    expect(result).toContain('Saudi');
    expect(result).toContain('UAE');
    // Must include benchmarks
    expect(result).toContain('Industry');
    expect(result).toContain('CAC');
    // Must include pricing
    expect(result).toContain('AGENCY PRICING');
    // Must include usage instructions
    expect(result).toContain('HOW TO USE THIS MARKET DATA');
  });

  it('getRelevantMarketIntelligence returns targeted data for Egypt F&B client', () => {
    const result = getRelevantMarketIntelligence({
      market: 'egypt',
      industry: 'f&b',
    });
    expect(result).toContain('Egypt');
    expect(result).toContain('F&B');
    expect(result).toContain('Customer Acquisition Cost');
  });

  it('getRelevantMarketIntelligence includes pricing for proposal mode', () => {
    const result = getRelevantMarketIntelligence({
      market: 'ksa',
      includeAgencyPricing: true,
    });
    expect(result).toContain('Saudi');
    expect(result).toContain('AGENCY PRICING');
    expect(result).toContain('SAR');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9: INTEGRATION WITH KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════

describe('Knowledge Base Integration', () => {
  it('buildSystemPrompt produces substantial prompt for chat mode', async () => {
    const { buildSystemPrompt } = await import('./knowledgeBase');
    const prompt = buildSystemPrompt({ mode: 'chat' });
    expect(prompt.length).toBeGreaterThan(5000);
  });

  it('buildSystemPrompt with client context injects relevant market data', async () => {
    const { buildSystemPrompt } = await import('./knowledgeBase');
    const prompt = buildSystemPrompt({
      mode: 'chat',
      clientContext: 'Restaurant chain in Egypt looking for brand strategy',
    });
    expect(prompt).toContain('Egypt');
  });

  it('buildSystemPrompt in proposal mode includes agency pricing', async () => {
    const { buildSystemPrompt } = await import('./knowledgeBase');
    const prompt = buildSystemPrompt({
      mode: 'proposal',
      clientContext: 'Tech startup in Saudi Arabia',
    });
    expect(prompt).toContain('Saudi');
  });

});
