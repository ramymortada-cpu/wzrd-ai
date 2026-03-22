/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MARKET INTELLIGENCE DATABASE — REAL DATA FOR THE AI BRAIN
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module contains REAL market data with specific numbers, percentages,
 * and source attributions. This is NOT generated content — it's researched
 * data from credible sources (DataReportal, IMARC Group, IAB MENA, PwC, etc.)
 * 
 * Last Updated: March 2025
 * Data Coverage: 2023-2025
 * Markets: Egypt, KSA, UAE, MENA Region
 * 
 * Architecture:
 * 1. Market Profiles (Egypt, KSA, UAE)
 * 2. Industry Benchmarks (CAC, conversion, retention by industry)
 * 3. Agency Pricing Benchmarks (what agencies charge in each market)
 * 4. Consumer Behavior & Digital Trends
 * 5. Utility functions for AI prompt injection
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketProfile {
  market: string;
  lastUpdated: string;
  advertisingMarket: {
    totalSize: string;
    digitalSpend: string;
    growthRate: string;
    source: string;
  };
  digitalLandscape: {
    internetPenetration: string;
    mobilePenetration: string;
    socialMediaPenetration: string;
    topPlatforms: { name: string; users: string }[];
    source: string;
  };
  ecommerce: {
    marketSize: string;
    growthRate: string;
    source: string;
  };
  keyInsights: string[];
  advertisingCosts: {
    avgCPM: string;
    avgCPC: string;
    source: string;
  };
}

export interface IndustryBenchmark {
  industry: string;
  cac: string;
  conversionRate: string;
  retentionRate: string;
  clv: string;
  source: string;
}

export interface AgencyPricing {
  market: string;
  currency: string;
  brandIdentity: { small: string; medium: string; large: string };
  brandStrategy: { foundational: string; comprehensive: string; enterprise: string };
  socialMediaManagement: { basic: string; growth: string; enterprise: string };
  contentCreation: { basic: string; premium: string };
  websiteDevelopment: { basic: string; corporate: string };
  source: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: MARKET PROFILES
// ═══════════════════════════════════════════════════════════════════════════

export const EGYPT_MARKET: MarketProfile = {
  market: 'Egypt',
  lastUpdated: 'March 2025',
  advertisingMarket: {
    totalSize: 'USD 2.37 billion (2024)',
    digitalSpend: 'USD 1.84 billion projected by 2026',
    growthRate: '12.8% annually for digital; 3.98% CAGR overall (2025-2033)',
    source: 'IMARC Group 2024, Yahoo Finance 2026',
  },
  digitalLandscape: {
    internetPenetration: '72.2% (82.01 million users)',
    mobilePenetration: '97.3% (110.5 million connections)',
    socialMediaPenetration: '40.0% (45.40 million users)',
    topPlatforms: [
      { name: 'Facebook', users: '45.40 million' },
      { name: 'YouTube', users: '44.70 million' },
      { name: 'TikTok', users: '32.94 million (18+)' },
      { name: 'Instagram', users: '18.15 million' },
    ],
    source: 'DataReportal 2024',
  },
  ecommerce: {
    marketSize: 'USD 9.1 billion (2024)',
    growthRate: '10.2% annually (2025-2032)',
    source: 'psmarketresearch.com 2024',
  },
  keyInsights: [
    'Facebook dominates with 45.4M users — still the #1 platform for reach in Egypt',
    'TikTok growing fastest at +38.8% YoY — critical for youth-focused brands',
    'Instagram growing +18.2% YoY — key for visual/lifestyle brands',
    'CPM ~$1.81 (Facebook) — 65% cheaper than US average — high ROI potential',
    'OOH advertising market at EGP 6.3 billion — still significant in Egypt',
    'High inflation impacting consumer spending — value messaging is critical',
    'E-commerce at $9.1B and growing 10.2% — digital presence is non-negotiable',
  ],
  advertisingCosts: {
    avgCPM: '$1.81 (Facebook)',
    avgCPC: '65% less than US average',
    source: 'Lebesgue 2026, Wordstream 2025',
  },
};

export const KSA_MARKET: MarketProfile = {
  market: 'Saudi Arabia (KSA)',
  lastUpdated: 'March 2025',
  advertisingMarket: {
    totalSize: 'USD 6.28 billion (2024), projected to reach USD 8.89 billion by 2033',
    digitalSpend: 'Growing at 23.5% YoY — fastest in MENA',
    growthRate: '3.94% CAGR (2024-2033) overall; 23.5% digital growth',
    source: 'IMARC Group 2024, IAB MENA 2025',
  },
  digitalLandscape: {
    internetPenetration: '99%+ (one of highest globally)',
    mobilePenetration: '99%+ with rapid 5G adoption',
    socialMediaPenetration: '82.3% (29.5 million users)',
    topPlatforms: [
      { name: 'Snapchat', users: '#1 platform — Saudi is Snapchat\'s largest market per capita' },
      { name: 'X (Twitter)', users: 'Extremely high adoption — Saudi is top 3 globally' },
      { name: 'Instagram', users: 'Major platform for lifestyle and commerce' },
      { name: 'TikTok', users: 'Rapidly growing, especially among youth' },
      { name: 'YouTube', users: 'High consumption — video-first culture' },
    ],
    source: 'DataReportal 2024, Dentsu MENA',
  },
  ecommerce: {
    marketSize: 'USD 12.6 billion (2024)',
    growthRate: '12-15% annually',
    source: 'Kearney, Arab News 2025',
  },
  keyInsights: [
    'Snapchat dominance is UNIQUE to Saudi — critical for any brand strategy here',
    'Vision 2030 creating massive new sectors: entertainment, tourism, sports, culture',
    'Entertainment market projected at USD 12.96 billion by 2025 — brand new sector',
    'Digital ad spend growing 23.5% YoY — fastest in MENA region',
    'Saudization policies mean brands must show local commitment and Arabic-first approach',
    'Women workforce participation growing rapidly — new consumer segment with spending power',
    'Saudi Pro League investment creating sports marketing opportunities',
    'NEOM and mega-projects creating demand for premium brand positioning',
    'New business licenses up 45% in app development — tech ecosystem booming',
  ],
  advertisingCosts: {
    avgCPM: 'Higher than Egypt, comparable to UAE — premium market',
    avgCPC: 'Varies by platform; Snapchat and X are key channels',
    source: 'IAB MENA 2025',
  },
};

export const UAE_MARKET: MarketProfile = {
  market: 'United Arab Emirates (UAE)',
  lastUpdated: 'March 2025',
  advertisingMarket: {
    totalSize: 'USD 3.38 billion (2024)',
    digitalSpend: 'Growing at 5.42% CAGR, projected to reach USD 5.74 billion by 2033',
    growthRate: '5.42% CAGR (2025-2033)',
    source: 'imarcgroup.com',
  },
  digitalLandscape: {
    internetPenetration: '99%+ (highest in the world)',
    mobilePenetration: '99%+ with 5G widely available',
    socialMediaPenetration: '112.5% (more accounts than people — expat + multi-account effect)',
    topPlatforms: [
      { name: 'Instagram', users: 'Dominant platform — lifestyle and luxury focus' },
      { name: 'YouTube', users: 'High video consumption' },
      { name: 'TikTok', users: 'Growing rapidly' },
      { name: 'LinkedIn', users: 'Strong B2B market — Dubai is business hub' },
      { name: 'Snapchat', users: 'Popular among younger demographics' },
    ],
    source: 'DataReportal 2024, Global Media Insight',
  },
  ecommerce: {
    marketSize: 'USD 10+ billion (2024)',
    growthRate: '10-12% annually',
    source: 'grandviewresearch.com',
  },
  keyInsights: [
    'Social media penetration at 112.5% — highest in the world',
    'Premium/luxury market — brands must position for quality over price',
    'Dubai vs Abu Dhabi: Dubai = commerce/lifestyle, Abu Dhabi = government/culture',
    'Expat-dominated (85%+) — multilingual, multicultural audience',
    'LinkedIn is powerful for B2B — Dubai is regional business hub',
    'Free zone ecosystem driving startup and SME growth',
    'Tourism drives brand visibility — 17+ million visitors to Dubai annually',
    'Fintech growing rapidly — digital payment adoption very high',
  ],
  advertisingCosts: {
    avgCPM: 'Premium pricing — highest in MENA',
    avgCPC: 'AED 1-5 depending on industry and platform',
    source: 'GoodFirms 2026',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: INDUSTRY BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

export const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  {
    industry: 'F&B / Restaurants',
    cac: '$25-50 (digital), higher for premium dining',
    conversionRate: '4.5-6.5% (online ordering)',
    retentionRate: '55-65%',
    clv: '$500-2,000 (regular customers)',
    source: 'First Page Sage 2026, Unbounce 2024',
  },
  {
    industry: 'Healthcare',
    cac: '$565 (B2B medical device), $150-300 (B2C clinics)',
    conversionRate: '5.8% (health & wellness)',
    retentionRate: '80%',
    clv: '$330,000 (B2B consultancy), $2,000-10,000 (B2C patient)',
    source: 'First Page Sage 2026, CustomerGauge 2025',
  },
  {
    industry: 'Real Estate',
    cac: '$791 (global average)',
    conversionRate: '2.5-3.5%',
    retentionRate: '78%',
    clv: 'High — single transaction value $50K-500K+',
    source: 'First Page Sage 2026',
  },
  {
    industry: 'Tech / SaaS',
    cac: '$239 (global B2B average)',
    conversionRate: '4.5%',
    retentionRate: '74%',
    clv: '$240,000 (B2B software)',
    source: 'First Page Sage 2026, CustomerGauge 2025',
  },
  {
    industry: 'Retail / E-commerce',
    cac: '$86 (global average)',
    conversionRate: '5.2%',
    retentionRate: '62%',
    clv: '$500-5,000 depending on category',
    source: 'First Page Sage 2026, Unbounce 2024',
  },
  {
    industry: 'Education',
    cac: '$1,143 (highest among industries)',
    conversionRate: '6.1%',
    retentionRate: '70-80%',
    clv: '$5,000-50,000 (depending on program)',
    source: 'First Page Sage 2026, Unbounce 2024',
  },
  {
    industry: 'Beauty / Cosmetics',
    cac: '$50-150 (D2C brands)',
    conversionRate: '3.5-5%',
    retentionRate: '60-70%',
    clv: '$1,000-5,000 (loyal customers)',
    source: 'Industry estimates, Unbounce 2024',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: AGENCY PRICING BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

export const AGENCY_PRICING: AgencyPricing[] = [
  {
    market: 'Egypt',
    currency: 'EGP',
    brandIdentity: {
      small: 'EGP 21,000 (~$400)',
      medium: 'EGP 26,200 (~$500)',
      large: 'EGP 31,400 (~$600)',
    },
    brandStrategy: {
      foundational: 'EGP 15,000-30,000',
      comprehensive: 'EGP 50,000-120,000',
      enterprise: 'EGP 150,000-500,000+',
    },
    socialMediaManagement: {
      basic: 'EGP 20,000/month',
      growth: 'EGP 35,000-50,000/month',
      enterprise: 'EGP 70,000+/month',
    },
    contentCreation: {
      basic: 'EGP 12,000/month',
      premium: 'EGP 60,000+/month',
    },
    websiteDevelopment: {
      basic: 'EGP 50,000-120,000',
      corporate: 'EGP 120,000-500,000+',
    },
    source: 'Green Mind Agency 2026, Entasher 2025',
  },
  {
    market: 'Saudi Arabia (KSA)',
    currency: 'SAR',
    brandIdentity: {
      small: 'SAR 15,000 (~$4,000)',
      medium: 'SAR 40,000 (~$10,700)',
      large: 'SAR 80,000+ (~$21,300+)',
    },
    brandStrategy: {
      foundational: 'SAR 20,000-50,000',
      comprehensive: 'SAR 80,000-200,000',
      enterprise: 'SAR 300,000-750,000+',
    },
    socialMediaManagement: {
      basic: 'SAR 6,000/month',
      growth: 'SAR 12,000-18,000/month',
      enterprise: 'SAR 25,000+/month',
    },
    contentCreation: {
      basic: 'SAR 5,000/month',
      premium: 'SAR 20,000+/month',
    },
    websiteDevelopment: {
      basic: 'SAR 15,000-40,000',
      corporate: 'SAR 60,000-200,000+',
    },
    source: 'Entasher 2026, ksa.masarib.net',
  },
  {
    market: 'UAE',
    currency: 'AED',
    brandIdentity: {
      small: 'AED 5,000 (~$1,360)',
      medium: 'AED 25,000 (~$6,800)',
      large: 'AED 50,000+ (~$13,600+)',
    },
    brandStrategy: {
      foundational: 'AED 5,000-25,000 (freelancer/small studio)',
      comprehensive: 'AED 25,000-100,000 (boutique agency)',
      enterprise: 'AED 100,000-400,000+ (premium/global agency)',
    },
    socialMediaManagement: {
      basic: 'AED 3,000-7,500/month',
      growth: 'AED 7,500-15,000/month',
      enterprise: 'AED 18,000-55,000+/month',
    },
    contentCreation: {
      basic: 'AED 1,500-4,000/month',
      premium: 'AED 8,000+/month',
    },
    websiteDevelopment: {
      basic: 'AED 15,000-30,000',
      corporate: 'AED 30,000-92,000+',
    },
    source: 'GoodFirms 2026, areesto.com 2025, ebizexperts.ae 2025',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: MENA DIGITAL TRENDS & CONSUMER BEHAVIOR
// ═══════════════════════════════════════════════════════════════════════════

export const MENA_DIGITAL_TRENDS = {
  totalDigitalAdSpend: '$6.95 billion (2024) — 19.8% YoY growth',
  socialMediaGrowth: '20.3% YoY growth in social media ad spend (2024)',
  videoContentGrowth: '28.9% YoY growth in social video ad spend (2024)',
  mobileEconomy: '$350 billion contribution to MENA GDP (5.7% of regional GDP)',
  influencerMarketing: {
    marketSize: '$576.1 million (2024), projected $897.3 million by 2029',
    effectiveness: '76.9% of UAE marketers consider it top priority',
    trend: '71.8% of MENA brands still rely on mid-tier/mega influencers — shift to nano/micro is opportunity',
    source: 'Influencer Marketing Hub 2024',
  },
  consumerBehavior: {
    brandLoyaltyDrivers: {
      ksa: [
        'Data protection (86% of consumers)',
        'Fair treatment of employees (80%)',
        'High-quality products/services (80%)',
      ],
      source: 'PwC Voice of Consumer 2024',
    },
    genZTrends: [
      '44% of UAE Gen Z believe live TV is obsolete — streaming/on-demand dominates',
      '70% of KSA consumers seek AI features in electronics',
      '60% of KSA consumers seek AI features in household appliances',
      '54% of KSA consumers seek AI features in food-ordering apps',
    ],
    contentPreferences: [
      'Strong shift towards Arabic and locally produced content',
      'Drama and comedy are dominant genres',
      'Rising demand for children\'s content and animation',
      'Non-English content demand nearly doubled since 2018',
    ],
    paymentTrends: [
      'Cash still significant in Egypt — but digital growing fast',
      'KSA and UAE — digital payments dominant, Apple Pay/Google Pay widely adopted',
      'Buy Now Pay Later (BNPL) growing rapidly across MENA',
    ],
  },
  emailMarketing: {
    openRate: '16.39% (Middle East average)',
    clickThroughRate: '0.89% (Middle East average)',
    source: 'Benchmark Email',
  },
  socialMediaEngagement: {
    instagram: '3.5%',
    facebook: '1.3%',
    twitter: '1.8%',
    linkedin: '3.4%',
    tiktok: '1.5%',
    source: 'Hootsuite 2025',
  },
  source: 'IAB MENA 2025, GSMA 2025, DataReportal 2024',
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: EGYPT BUSINESS ENVIRONMENT
// ═══════════════════════════════════════════════════════════════════════════

export const EGYPT_BUSINESS = {
  startupEcosystem: {
    vcFunding2024: '$312 million total (2024)',
    h1_2024_funding: '$86 million (H1 2024) — 75% decline from H1 2023',
    topSectors: 'Fintech, E-commerce, EdTech, HealthTech',
    source: 'MAGNiTT 2024, Statista',
  },
  keyIndustries: {
    fAndB: 'Fast food franchise market at EGP 50+ billion — massive F&B sector',
    healthcare: 'Growing private healthcare spending — medical tourism potential',
    realEstate: 'New Administrative Capital driving construction and property branding',
    education: 'Private education spending growing — international schools booming',
    beautyAndPersonalCare: 'Growing market driven by youth demographics',
  },
  economicContext: {
    inflation: 'High inflation impacting consumer spending — value messaging critical',
    currencyDevaluation: 'EGP devaluation making Egypt attractive for export/outsourcing',
    smeGrowth: 'SME sector is backbone of economy — 98% of businesses are SMEs',
    source: 'CAPMAS, World Bank',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: KSA BUSINESS ENVIRONMENT & VISION 2030
// ═══════════════════════════════════════════════════════════════════════════

export const KSA_BUSINESS = {
  vision2030Impact: {
    entertainmentMarket: 'USD 12.96 billion projected by 2025',
    retailMarket: 'SAR 385 billion (USD 102.7 billion) in 2025',
    tourismTargets: '150 million visitors by 2030 (from 27.8 million in 2023)',
    womenWorkforce: 'Female labor participation grew from 17% to 33.8% — new consumer segment',
    sportsInvestment: 'Saudi Pro League, esports, Formula 1, boxing — massive brand opportunities',
    source: 'Custom Market Insights 2026, MarkNtel Advisors, Ministry of Tourism',
  },
  newBusinessGrowth: {
    appDevelopmentLicenses: '+45% increase in Q3 2025 vs same period last year',
    ecommerceLicenses: '+6% YoY growth',
    smeSupport: 'Monshaat (SME Authority) actively supporting entrepreneurship',
    source: 'Arab News 2025, Monshaat 2025',
  },
  megaProjects: [
    'NEOM — $500B futuristic city project',
    'The Line — 170km linear city',
    'Red Sea Global — luxury tourism destination',
    'Qiddiya — entertainment mega-city',
    'Diriyah Gate — cultural/heritage destination',
  ],
  keyOpportunities: [
    'Entertainment sector is BRAND NEW — first-mover advantage for brand consultants',
    'Tourism branding — 150M visitor target means massive hospitality branding needs',
    'Women-led businesses growing — new segment needing brand identity',
    'Sports marketing — Saudi Pro League creating demand for sports branding',
    'Saudization — local brands need to compete with international entrants',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: PRIMO MARCA COMPETITIVE POSITIONING
// ═══════════════════════════════════════════════════════════════════════════

export const PRIMO_MARCA_POSITIONING = {
  pricingContext: `
## HOW PRIMO MARCA PRICING COMPARES TO MARKET

### Primo Marca Pricing (from official price list):
- Clarity Package: 25,000 EGP / 3,500 SAR — BELOW market average for strategy work
- Brand Foundation: 60,000 EGP / 8,500 SAR — COMPETITIVE with mid-tier agencies
- Growth Partnership: 120,000 EGP / 17,000 SAR — PREMIUM but justified by depth

### Market Context:
- Average Egypt brand identity: EGP 21,000-31,400 (Primo's Clarity Package at 25K is competitive)
- Average KSA brand identity: SAR 15,000-80,000 (Primo's Brand Foundation at 8,500 SAR is BELOW market)
- Average UAE brand strategy: AED 25,000-100,000 (Primo's Growth Partnership equivalent is competitive)

### Key Selling Points:
1. Primo Marca's pricing is BELOW average for the depth of work delivered
2. Most agencies at this price point deliver only visual identity — Primo delivers strategy + identity + systems
3. The Clarity Package at 25K EGP is essentially a loss-leader that builds trust for larger engagements
4. Growth Partnership at 120K EGP delivers what UAE agencies charge 100K+ AED for

### How to Use This in Sales:
- When client says "too expensive": Show them what agencies in Dubai charge for the same work
- When client compares to cheaper agencies: Explain the difference between "logo design" and "brand strategy"
- When client is in KSA: Primo's SAR pricing is significantly below KSA market rates
- When client wants ROI justification: Use industry benchmarks (CAC reduction, conversion improvement)
`,
  competitiveAdvantages: [
    'Strategy-first approach — most agencies skip strategy and go straight to design',
    'Proprietary 4D Framework — unique methodology that competitors don\'t have',
    'Academic foundation — frameworks backed by Keller, Ries & Trout, Aaker',
    'Bilingual capability — Arabic + English at native level',
    'MENA market expertise — deep understanding of Egypt and KSA markets',
    'Full-stack delivery — strategy, identity, digital, content — not just one piece',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get market profile for a specific market
 */
export function getMarketProfile(market: string): MarketProfile | null {
  const normalized = market.toLowerCase().trim();
  if (normalized.includes('egypt') || normalized.includes('مصر') || normalized.includes('cairo')) return EGYPT_MARKET;
  if (normalized.includes('saudi') || normalized.includes('ksa') || normalized.includes('السعودية') || normalized.includes('riyadh') || normalized.includes('jeddah')) return KSA_MARKET;
  if (normalized.includes('uae') || normalized.includes('emirates') || normalized.includes('الإمارات') || normalized.includes('dubai') || normalized.includes('abu dhabi')) return UAE_MARKET;
  return null;
}

/**
 * Get industry benchmarks for a specific industry
 */
export function getIndustryBenchmark(industry: string): IndustryBenchmark | null {
  const normalized = industry.toLowerCase().trim();
  return INDUSTRY_BENCHMARKS.find(b => {
    const ind = b.industry.toLowerCase();
    return ind.includes(normalized) || normalized.includes(ind.split('/')[0].trim().toLowerCase());
  }) || null;
}

/**
 * Get agency pricing for a specific market
 */
export function getAgencyPricing(market: string): AgencyPricing | null {
  const normalized = market.toLowerCase().trim();
  return AGENCY_PRICING.find(p => p.market.toLowerCase().includes(normalized)) || null;
}

/**
 * Format market profile for AI prompt injection
 */
export function formatMarketForPrompt(market: MarketProfile): string {
  let output = `## ${market.market} MARKET DATA (${market.lastUpdated})\n\n`;
  
  output += `### Advertising Market\n`;
  output += `- Total Size: ${market.advertisingMarket.totalSize}\n`;
  output += `- Digital Spend: ${market.advertisingMarket.digitalSpend}\n`;
  output += `- Growth Rate: ${market.advertisingMarket.growthRate}\n`;
  output += `- Source: ${market.advertisingMarket.source}\n\n`;
  
  output += `### Digital Landscape\n`;
  output += `- Internet Penetration: ${market.digitalLandscape.internetPenetration}\n`;
  output += `- Mobile Penetration: ${market.digitalLandscape.mobilePenetration}\n`;
  output += `- Social Media Penetration: ${market.digitalLandscape.socialMediaPenetration}\n`;
  output += `- Top Platforms:\n`;
  for (const p of market.digitalLandscape.topPlatforms) {
    output += `  - ${p.name}: ${p.users}\n`;
  }
  output += `\n`;
  
  output += `### E-commerce\n`;
  output += `- Market Size: ${market.ecommerce.marketSize}\n`;
  output += `- Growth Rate: ${market.ecommerce.growthRate}\n\n`;
  
  output += `### Advertising Costs\n`;
  output += `- Average CPM: ${market.advertisingCosts.avgCPM}\n`;
  output += `- Average CPC: ${market.advertisingCosts.avgCPC}\n\n`;
  
  output += `### Key Insights for Brand Strategy\n`;
  for (const insight of market.keyInsights) {
    output += `- ${insight}\n`;
  }
  
  return output;
}

/**
 * Format industry benchmarks for AI prompt injection
 */
export function formatBenchmarksForPrompt(): string {
  let output = `## INDUSTRY BENCHMARKS (Real Data — Use in Client Conversations)\n\n`;
  output += `| Industry | CAC | Conversion Rate | Retention Rate | CLV |\n`;
  output += `|----------|-----|-----------------|----------------|-----|\n`;
  for (const b of INDUSTRY_BENCHMARKS) {
    output += `| ${b.industry} | ${b.cac} | ${b.conversionRate} | ${b.retentionRate} | ${b.clv} |\n`;
  }
  output += `\nSources: ${INDUSTRY_BENCHMARKS.map(b => b.source).filter((v, i, a) => a.indexOf(v) === i).join(', ')}\n`;
  return output;
}

/**
 * Format agency pricing comparison for AI prompt injection
 */
export function formatPricingForPrompt(): string {
  let output = `## AGENCY PRICING BENCHMARKS — WHAT THE MARKET CHARGES\n\n`;
  for (const p of AGENCY_PRICING) {
    output += `### ${p.market} (${p.currency})\n`;
    output += `- Brand Identity: ${p.brandIdentity.small} (small) / ${p.brandIdentity.medium} (medium) / ${p.brandIdentity.large} (large)\n`;
    output += `- Brand Strategy: ${p.brandStrategy.foundational} (foundational) / ${p.brandStrategy.comprehensive} (comprehensive) / ${p.brandStrategy.enterprise} (enterprise)\n`;
    output += `- Social Media Management: ${p.socialMediaManagement.basic} (basic) / ${p.socialMediaManagement.growth} (growth) / ${p.socialMediaManagement.enterprise} (enterprise)\n`;
    output += `- Source: ${p.source}\n\n`;
  }
  output += PRIMO_MARCA_POSITIONING.pricingContext;
  return output;
}

/**
 * Format consumer behavior trends for AI prompt injection
 */
export function formatConsumerTrendsForPrompt(): string {
  let output = `## MENA CONSUMER BEHAVIOR & DIGITAL TRENDS (2024-2025)\n\n`;
  output += `### Digital Ad Spend\n`;
  output += `- Total MENA: ${MENA_DIGITAL_TRENDS.totalDigitalAdSpend}\n`;
  output += `- Social Media: ${MENA_DIGITAL_TRENDS.socialMediaGrowth}\n`;
  output += `- Video Content: ${MENA_DIGITAL_TRENDS.videoContentGrowth}\n`;
  output += `- Mobile Economy: ${MENA_DIGITAL_TRENDS.mobileEconomy}\n\n`;
  
  output += `### Influencer Marketing\n`;
  output += `- Market Size: ${MENA_DIGITAL_TRENDS.influencerMarketing.marketSize}\n`;
  output += `- Effectiveness: ${MENA_DIGITAL_TRENDS.influencerMarketing.effectiveness}\n`;
  output += `- Trend: ${MENA_DIGITAL_TRENDS.influencerMarketing.trend}\n\n`;
  
  output += `### Brand Loyalty Drivers (KSA)\n`;
  for (const d of MENA_DIGITAL_TRENDS.consumerBehavior.brandLoyaltyDrivers.ksa) {
    output += `- ${d}\n`;
  }
  output += `\n### Gen Z Trends\n`;
  for (const t of MENA_DIGITAL_TRENDS.consumerBehavior.genZTrends) {
    output += `- ${t}\n`;
  }
  output += `\n### Social Media Engagement Rates\n`;
  output += `- Instagram: ${MENA_DIGITAL_TRENDS.socialMediaEngagement.instagram}\n`;
  output += `- Facebook: ${MENA_DIGITAL_TRENDS.socialMediaEngagement.facebook}\n`;
  output += `- X/Twitter: ${MENA_DIGITAL_TRENDS.socialMediaEngagement.twitter}\n`;
  output += `- LinkedIn: ${MENA_DIGITAL_TRENDS.socialMediaEngagement.linkedin}\n`;
  output += `- TikTok: ${MENA_DIGITAL_TRENDS.socialMediaEngagement.tiktok}\n`;
  output += `\n### Email Marketing (Middle East)\n`;
  output += `- Open Rate: ${MENA_DIGITAL_TRENDS.emailMarketing.openRate}\n`;
  output += `- Click-Through Rate: ${MENA_DIGITAL_TRENDS.emailMarketing.clickThroughRate}\n`;
  
  return output;
}

/**
 * Get all market intelligence formatted for the AI Knowledge Base
 * This is the main function used by buildSystemPrompt
 */
export function getAllMarketIntelligenceForKnowledgeBase(): string {
  let output = `## MARKET INTELLIGENCE DATABASE — REAL DATA WITH SOURCES\n`;
  output += `Last Updated: March 2025 | Markets: Egypt, KSA, UAE\n\n`;
  
  // Market profiles
  output += formatMarketForPrompt(EGYPT_MARKET) + '\n\n';
  output += formatMarketForPrompt(KSA_MARKET) + '\n\n';
  output += formatMarketForPrompt(UAE_MARKET) + '\n\n';
  
  // Industry benchmarks
  output += formatBenchmarksForPrompt() + '\n\n';
  
  // Agency pricing
  output += formatPricingForPrompt() + '\n\n';
  
  // Consumer trends
  output += formatConsumerTrendsForPrompt() + '\n\n';
  
  // Usage instructions
  output += `## HOW TO USE THIS MARKET DATA IN CONVERSATIONS\n\n`;
  output += `1. **When discussing a client's market**: Reference specific numbers for their market (Egypt, KSA, UAE)\n`;
  output += `2. **When justifying pricing**: Compare Primo Marca's pricing to market benchmarks\n`;
  output += `3. **When recommending channels**: Use platform-specific data (e.g., Snapchat dominance in KSA)\n`;
  output += `4. **When building strategy**: Reference industry benchmarks (CAC, conversion, retention)\n`;
  output += `5. **When discussing trends**: Use consumer behavior data to support recommendations\n`;
  output += `6. **Always cite sources**: Say "According to DataReportal 2024..." or "IAB MENA reports..."\n`;
  output += `7. **Never invent data**: If you don't have a specific number, say so and use the closest available benchmark\n`;
  
  return output;
}

/**
 * Get market intelligence relevant to a specific client context
 * Used for dynamic prompt injection based on client's market and industry
 */
export function getRelevantMarketIntelligence(context: {
  market?: string;
  industry?: string;
  includeAgencyPricing?: boolean;
}): string {
  let output = '';
  
  // Add market-specific data
  if (context.market) {
    const profile = getMarketProfile(context.market);
    if (profile) {
      output += formatMarketForPrompt(profile) + '\n\n';
    }
  }
  
  // Add industry benchmarks
  if (context.industry) {
    const benchmark = getIndustryBenchmark(context.industry);
    if (benchmark) {
      output += `## INDUSTRY BENCHMARK: ${benchmark.industry}\n`;
      output += `- Customer Acquisition Cost: ${benchmark.cac}\n`;
      output += `- Conversion Rate: ${benchmark.conversionRate}\n`;
      output += `- Retention Rate: ${benchmark.retentionRate}\n`;
      output += `- Customer Lifetime Value: ${benchmark.clv}\n`;
      output += `- Source: ${benchmark.source}\n\n`;
    }
  }
  
  // Add agency pricing if requested (useful for proposals)
  if (context.includeAgencyPricing) {
    output += formatPricingForPrompt() + '\n\n';
  }
  
  // Always add consumer trends summary
  output += `### Key MENA Digital Trends\n`;
  output += `- Total Digital Ad Spend: ${MENA_DIGITAL_TRENDS.totalDigitalAdSpend}\n`;
  output += `- Influencer Marketing: ${MENA_DIGITAL_TRENDS.influencerMarketing.marketSize}\n`;
  output += `- Mobile Economy: ${MENA_DIGITAL_TRENDS.mobileEconomy}\n`;
  
  return output;
}
