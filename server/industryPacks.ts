/**
 * INDUSTRY KNOWLEDGE PACKS
 * ========================
 * 
 * Pre-built knowledge for 7 key industries in MENA.
 * Each pack has: market overview, key players, trends, challenges,
 * consumer behavior, branding patterns, and common client problems.
 * 
 * These get injected into AI conversations when the client's industry
 * matches. They also seed the knowledge_entries table on first run.
 */

import { logger } from './_core/logger';
import { createKnowledgeEntry, getKnowledgeEntries } from './db';

export interface IndustryPack {
  id: string;
  name: string;
  nameAr: string;
  markets: {
    egypt?: MarketData;
    ksa?: MarketData;
  };
  brandingPatterns: string[];
  commonClientProblems: Array<{
    problem: string;
    diagnosis: string;
    recommendedService: string;
  }>;
  keyFrameworks: string[];
}

interface MarketData {
  marketSize: string;
  growth: string;
  keyPlayers: string[];
  trends: string[];
  challenges: string[];
  consumerBehavior: string[];
  source: string;
}

// ════════════════════════════════════════════
// THE 7 INDUSTRY PACKS
// ════════════════════════════════════════════

export const INDUSTRY_PACKS: IndustryPack[] = [
  // ──── F&B ────
  {
    id: 'fnb',
    name: 'Food & Beverage',
    nameAr: 'الأغذية والمشروبات',
    markets: {
      egypt: {
        marketSize: 'EGP 850+ billion (2025)',
        growth: '15-20% annual (inflation-adjusted)',
        keyPlayers: ['Cook Door', 'Gad', 'Shawerma El-Reem', 'Kazoku', 'The Smokery'],
        trends: ['Cloud kitchens growing 40% YoY', 'Instagram-first discovery', 'Health-conscious menus rising', 'Egyptian fusion cuisine trending'],
        challenges: ['Inflation driving cost increases', 'High competition in Cairo', 'Reliance on delivery apps (commission pressure)', 'Talent retention in service industry'],
        consumerBehavior: ['70% discover restaurants via Instagram/TikTok', 'Price sensitivity highest in MENA', 'Social dining culture — groups over individuals', 'Brand loyalty lower than KSA — promotion-driven'],
        source: 'Industry analysis + Euromonitor 2025',
      },
      ksa: {
        marketSize: 'SAR 200+ billion (2025)',
        growth: '8-12% annual (Vision 2030 driven)',
        keyPlayers: ['AlBaik', 'Kudu', 'Barn\'s Café', '%Arabica', 'The Butcher Shop & Grill'],
        trends: ['Specialty coffee culture exploding', 'Saudi homegrown brands preferred', 'Entertainment sector opening → dining experiences', 'Female-driven food entrepreneurship'],
        challenges: ['Saudization requirements', 'High rent in premium locations', 'Competition from international chains', 'Seasonal demand shifts (Ramadan, summer)'],
        consumerBehavior: ['Snapchat #1 for discovery (highest per-capita usage globally)', 'Premium pricing accepted when brand story is strong', 'Family dining dominant', 'Heritage + modernity balance critical'],
        source: 'Vision 2030 economic reports + Foodics data 2025',
      },
    },
    brandingPatterns: [
      'Arabic-first branding performs 40% better in brand recall in KSA',
      'Instagram-worthy interior design drives 60% of new customer discovery',
      'Storytelling about sourcing and quality resonates strongly in premium segment',
      'Menu design is a branding touchpoint — not just a list',
      'Packaging for delivery = your brand\'s most frequent interaction',
    ],
    commonClientProblems: [
      { problem: 'Sales are dropping despite good food', diagnosis: 'Clarity Gap — customers don\'t know what makes you different', recommendedService: 'brand_identity' },
      { problem: 'New restaurant, need everything', diagnosis: 'No foundation — needs business model + brand from scratch', recommendedService: 'starting_business_logic' },
      { problem: 'Want to franchise/expand', diagnosis: 'Needs brand consistency system before scaling', recommendedService: 'business_takeoff' },
      { problem: 'Losing to competitors', diagnosis: 'Commodity Trap — competing on price instead of value', recommendedService: 'business_health_check' },
    ],
    keyFrameworks: ['Kapferer Prism (experience + ambiance)', 'Sharp (mental availability via social)', 'Kahneman (anchoring for menu pricing)'],
  },

  // ──── HEALTHCARE ────
  {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    nameAr: 'الرعاية الصحية والعافية',
    markets: {
      egypt: {
        marketSize: 'EGP 200+ billion (2025)',
        growth: '12-15% annual',
        keyPlayers: ['Cleopatra Hospitals Group', 'As-Salam International Hospital', 'Cairo Cure', 'Vacsera'],
        trends: ['Medical tourism growing (dental, cosmetic)', 'Telemedicine adoption post-COVID', 'Wellness/preventive care rising', 'Digital health startups emerging'],
        challenges: ['Trust is everything — reputation is the brand', 'Price-sensitive market', 'Regulatory complexity', 'Brain drain to Gulf'],
        consumerBehavior: ['Word-of-mouth is #1 trust signal', 'Doctor reputation > hospital brand', 'Google reviews heavily consulted', 'Price comparison active for elective procedures'],
        source: 'Egypt Healthcare Authority reports 2025',
      },
      ksa: {
        marketSize: 'SAR 180+ billion (2025)',
        growth: '10-14% annual (Vision 2030 healthcare reform)',
        keyPlayers: ['Saudi German Hospitals', 'Dr. Sulaiman Al Habib', 'Nahdi Medical Company', 'Tibbiyah'],
        trends: ['Vision 2030 privatization of healthcare', 'Mental health awareness growing fast', 'Premium wellness clinics booming', 'Health insurance mandatory → more patients seeking care'],
        challenges: ['Saudization of medical staff', 'High setup costs', 'Building trust with local population', 'Competition from government hospitals improving'],
        consumerBehavior: ['Brand trust = patient trust', 'Premium pricing accepted for perceived expertise', 'Arabic communication essential', 'Family influence on healthcare decisions'],
        source: 'Saudi MOH reports + Vision 2030 healthcare plan',
      },
    },
    brandingPatterns: [
      'Trust is THE brand attribute — everything else is secondary',
      'Doctor/founder personal brand often stronger than clinic brand',
      'Clean, professional aesthetics signal competence',
      'Patient testimonials are the most powerful marketing tool',
      'Digital presence (Google, social) is now the front door',
    ],
    commonClientProblems: [
      { problem: 'New clinic, need to build reputation', diagnosis: 'Identity Crisis — no clear positioning in crowded market', recommendedService: 'brand_identity' },
      { problem: 'Good doctors but no patients', diagnosis: 'Random Effort — no systematic marketing approach', recommendedService: 'business_takeoff' },
      { problem: 'Want to expand to new locations', diagnosis: 'Need consistency system + local market research', recommendedService: 'business_health_check' },
    ],
    keyFrameworks: ['Keller CBBE (trust-based resonance)', 'Cialdini (authority + social proof)', 'Porter (competitive positioning in local market)'],
  },

  // ──── TECH / SAAS ────
  {
    id: 'tech',
    name: 'Technology & SaaS',
    nameAr: 'التكنولوجيا والبرمجيات',
    markets: {
      egypt: {
        marketSize: 'USD 4.5+ billion IT sector (2025)',
        growth: '20-25% annual (startup ecosystem booming)',
        keyPlayers: ['Swvl', 'Paymob', 'MNT-Halan', 'Instabug', 'Breadfast'],
        trends: ['Fintech leading the charge', 'AI/ML adoption accelerating', 'African expansion from Egypt base', 'Government digital transformation'],
        challenges: ['Talent competition with Gulf', 'Currency volatility affecting pricing', 'B2B sales cycles are long', 'Enterprise market prefers international brands'],
        consumerBehavior: ['GitHub/ProductHunt for developer tools', 'LinkedIn for B2B discovery', 'Free trial → conversion model dominant', 'Arabic localization = competitive moat'],
        source: 'ITIDA reports + Wamda ecosystem data 2025',
      },
      ksa: {
        marketSize: 'USD 15+ billion IT sector (2025)',
        growth: '18-22% annual (NEOM, digital transformation)',
        keyPlayers: ['Tamara', 'Foodics', 'Salla', 'Moyasar', 'Lean Technologies'],
        trends: ['Government as biggest tech buyer', 'Super-app ambitions', 'Cloud-first mandates', 'Saudi-first procurement policies'],
        challenges: ['Saudization requirements for tech teams', 'Competition from global SaaS entering Saudi market', 'Enterprise decision-making involves multiple stakeholders', 'Localization beyond translation needed'],
        consumerBehavior: ['Government procurement = relationship-driven', 'Case studies from Saudi companies are essential', 'Arabic support is a must, not nice-to-have', 'Premium pricing accepted for proven solutions'],
        source: 'MCIT Saudi reports + Magnitt data 2025',
      },
    },
    brandingPatterns: [
      'Product excellence ≠ brand excellence — many great products fail at branding',
      'B2B tech branding is about trust signals: case studies, logos, testimonials',
      'Developer-focused brands need community, not just marketing',
      'Pricing page IS a brand touchpoint — how you present value matters',
      'Arabic-first SaaS has massive competitive moat in MENA',
    ],
    commonClientProblems: [
      { problem: 'Great product but no one knows about us', diagnosis: 'Random Effort — technical founders doing marketing randomly', recommendedService: 'business_takeoff' },
      { problem: 'Canva logo, no brand guidelines', diagnosis: 'Clarity Gap — scaling without brand foundation', recommendedService: 'brand_identity' },
      { problem: 'Need to raise funding, investors want clear positioning', diagnosis: 'Needs brand clarity for investor narrative', recommendedService: 'starting_business_logic' },
    ],
    keyFrameworks: ['Sharp (mental availability in niche)', 'Keller (brand salience for B2B)', 'Porter (competitive moats)'],
  },

  // ──── REAL ESTATE ────
  {
    id: 'real_estate',
    name: 'Real Estate & Development',
    nameAr: 'العقارات والتطوير العمراني',
    markets: {
      egypt: {
        marketSize: 'EGP 1.5+ trillion (2025)',
        growth: '15-20% annual (new cities + inflation hedge)',
        keyPlayers: ['Emaar Misr', 'Ora Developers (Naguib Sawiris)', 'Palm Hills', 'Mountain View', 'SODIC'],
        trends: ['New Administrative Capital driving demand', 'Real estate as inflation hedge', 'Smart home features standard in premium', 'Branded residences emerging'],
        challenges: ['Affordability gap widening', 'Payment plan dependency', 'Over-supply in some segments', 'Construction cost inflation'],
        consumerBehavior: ['Investment-driven buying (not just housing)', 'Payment plans up to 10 years expected', 'Brand of developer = trust signal', 'Social media (especially Facebook) for project discovery'],
        source: 'JLL Egypt Market Review 2025 + CBRE reports',
      },
      ksa: {
        marketSize: 'SAR 1.2+ trillion (2025)',
        growth: '12-18% annual (Vision 2030, NEOM, giga-projects)',
        keyPlayers: ['ROSHN', 'Dar Al Arkan', 'Al Akaria', 'Emaar (The Economic City)'],
        trends: ['NEOM and giga-projects redefining market', 'Mandatory homeownership targets (70% by 2030)', 'PropTech adoption', 'Sustainable/green building requirements'],
        challenges: ['Land price inflation', 'Construction material costs', 'Skilled labor shortage', 'Regulatory changes frequent'],
        consumerBehavior: ['Government-backed mortgage programs increasing first-time buyers', 'Brand trust essential for off-plan purchases', 'Saudi national preference (Saudization)', 'Community and lifestyle branding resonates'],
        source: 'Saudi Real Estate Authority + Knight Frank 2025',
      },
    },
    brandingPatterns: [
      'Developer brand reputation IS the product — you\'re selling trust',
      'Project naming and visual identity directly impact perceived value',
      'Lifestyle branding > feature listing for premium properties',
      'Sales gallery experience is a critical brand touchpoint',
      'Post-delivery brand experience (community management) drives referrals',
    ],
    commonClientProblems: [
      { problem: 'New development company, need credibility', diagnosis: 'Identity Crisis — no track record needs strong brand', recommendedService: 'brand_identity' },
      { problem: 'Project launch needs maximum visibility', diagnosis: 'Needs go-to-market strategy with brand foundation', recommendedService: 'business_takeoff' },
    ],
    keyFrameworks: ['Kapferer (luxury positioning for premium developments)', 'Kahneman (anchoring for property pricing)', 'Cialdini (scarcity + social proof for launches)'],
  },

  // ──── RETAIL / E-COMMERCE ────
  {
    id: 'retail',
    name: 'Retail & E-commerce',
    nameAr: 'التجزئة والتجارة الإلكترونية',
    markets: {
      egypt: {
        marketSize: 'USD 8+ billion e-commerce (2025)',
        growth: '25-30% annual',
        keyPlayers: ['Noon', 'Amazon.eg', 'Jumia', 'B.TECH', 'Breadfast'],
        trends: ['Social commerce via Instagram/TikTok', 'Cash on delivery still 65%', 'Quick commerce (30-min delivery)', 'D2C brands emerging fast'],
        challenges: ['COD logistics costs', 'Return rates high', 'Trust gap for online purchases', 'Last-mile delivery infrastructure'],
        consumerBehavior: ['Instagram discovery → WhatsApp ordering for SMEs', 'Price comparison is default behavior', 'Free shipping expectation', 'Unboxing experience drives word-of-mouth'],
        source: 'Bain & Company Middle East E-commerce Report 2025',
      },
      ksa: {
        marketSize: 'USD 25+ billion e-commerce (2025)',
        growth: '18-22% annual',
        keyPlayers: ['Noon', 'Amazon.sa', 'Namshi', 'Jarir', 'extra'],
        trends: ['M-commerce dominant (mobile-first)', 'Luxury e-commerce growing', 'Buy-now-pay-later adoption high', 'Same-day delivery standard for urban'],
        challenges: ['Last-mile in non-urban areas', 'High customer acquisition costs', 'International competition', 'Return logistics'],
        consumerBehavior: ['Mobile shopping 80%+ of transactions', 'Snapchat for brand discovery', 'High expectations for delivery speed', 'Brand loyalty reward programs effective'],
        source: 'Bain & Company + Checkout.com data 2025',
      },
    },
    brandingPatterns: [
      'Packaging IS the first physical brand interaction — invest in unboxing',
      'Consistent brand across 10+ touchpoints (web, app, social, packaging, delivery)',
      'User-generated content (UGC) drives 4x more trust than branded content',
      'Price is not a positioning strategy — convenience, curation, or experience is',
    ],
    commonClientProblems: [
      { problem: 'Selling on Instagram but want to scale', diagnosis: 'Random Effort — no brand system for growth', recommendedService: 'business_takeoff' },
      { problem: 'Starting an e-commerce brand from scratch', diagnosis: 'Needs business logic + brand identity', recommendedService: 'starting_business_logic' },
    ],
    keyFrameworks: ['Sharp (physical + mental availability)', 'Keller (brand salience in crowded market)', 'Kahneman (choice architecture for product pages)'],
  },

  // ──── EDUCATION ────
  {
    id: 'education',
    name: 'Education & Training',
    nameAr: 'التعليم والتدريب',
    markets: {
      egypt: {
        marketSize: 'EGP 300+ billion (2025)',
        growth: '12-15% annual',
        keyPlayers: ['AUC', 'GEMS Education', 'Alef Education', 'Coursera MENA', 'Nafham'],
        trends: ['EdTech booming post-COVID', 'International school demand rising', 'Upskilling/reskilling market growing', 'Arabic-language online courses'],
        challenges: ['Affordability vs quality gap', 'Regulatory barriers for edtech', 'Teacher quality inconsistency', 'Infrastructure gaps outside Cairo'],
        consumerBehavior: ['Parents make decisions — brand trust is essential', 'Word-of-mouth is #1 factor for school choice', 'Outcome-focused (job placement, university acceptance)', 'Social media for research (parent groups on Facebook)'],
        source: 'HolonIQ MENA EdTech 2025',
      },
      ksa: {
        marketSize: 'SAR 200+ billion (2025)',
        growth: '15-20% annual (Vision 2030 human capital focus)',
        keyPlayers: ['KAUST', 'Misk Foundation', 'Noon Academy', 'Classera', 'Rewaa Academy'],
        trends: ['Government investing heavily in education reform', 'Vocational training programs expanding', 'Female education participation at all-time high', 'English-medium education demand rising'],
        challenges: ['Quality standardization', 'Culture shift in teaching methods', 'Competition from international institutions', 'Digital literacy gaps in rural areas'],
        consumerBehavior: ['Outcome-obsessed (employment readiness)', 'Premium pricing accepted for perceived quality', 'International accreditation = trust signal', 'Community and alumni network valued'],
        source: 'Saudi MOE reports + HolonIQ 2025',
      },
    },
    brandingPatterns: [
      'Trust and credibility are non-negotiable — parents/students need proof',
      'Outcome stories (graduates who succeeded) are the most powerful marketing',
      'Campus/environment design IS brand — it signals quality before any conversation',
      'Community building (alumni, parent networks) drives organic growth',
    ],
    commonClientProblems: [
      { problem: 'New school/academy, need enrollment', diagnosis: 'Identity Crisis — no clear positioning vs alternatives', recommendedService: 'brand_identity' },
      { problem: 'EdTech platform with low adoption', diagnosis: 'Clarity Gap — users don\'t understand the value', recommendedService: 'business_health_check' },
    ],
    keyFrameworks: ['Keller (brand resonance through outcomes)', 'Cialdini (authority + social proof)', 'Kapferer (culture + relationship facets)'],
  },

  // ──── BEAUTY & COSMETICS ────
  {
    id: 'beauty',
    name: 'Beauty & Cosmetics',
    nameAr: 'الجمال ومستحضرات التجميل',
    markets: {
      egypt: {
        marketSize: 'USD 3+ billion (2025)',
        growth: '10-14% annual',
        keyPlayers: ['MAC Egypt', 'Faces', 'Beauty Hub', 'local indie brands growing fast'],
        trends: ['Local/indie beauty brands rising', 'Halal cosmetics demand', 'Social media-first launches', 'Men\'s grooming growing'],
        challenges: ['Counterfeit products erode trust', 'Import costs for premium ingredients', 'Regulatory requirements', 'Price sensitivity in mass market'],
        consumerBehavior: ['Instagram + TikTok tutorials drive purchases', 'Influencer recommendations trusted over brands', 'Ingredient awareness rising', 'Egyptian women loyal to brands that "get" them culturally'],
        source: 'Euromonitor Beauty & Personal Care Egypt 2025',
      },
      ksa: {
        marketSize: 'USD 8+ billion (2025)',
        growth: '12-16% annual',
        keyPlayers: ['Faces (LVMH)', 'Sephora Saudi', 'Niche Arabian', 'Huda Beauty', 'local Saudi brands'],
        trends: ['Saudi beauty entrepreneurs flourishing', 'Fragrance market largest per-capita globally', 'Clean beauty/natural ingredients trending', 'Male grooming accepted and growing'],
        challenges: ['Competition from global luxury brands', 'Distribution channel complexity', 'Cultural sensitivity in marketing', 'Counterfeits in mass market'],
        consumerBehavior: ['Highest per-capita spending on beauty in MENA', 'Fragrance is a cultural essential, not luxury', 'Brand story and heritage matter deeply', 'Snapchat for beauty discovery'],
        source: 'Euromonitor + Chalhoub Group 2025',
      },
    },
    brandingPatterns: [
      'Visual identity IS the product — packaging, colors, typography make or break',
      'Founder story drives brand connection (especially for indie brands)',
      'Ingredient transparency builds trust (especially halal certification)',
      'UGC and influencer content > polished brand content',
      'Fragrance/scent branding is unique to MENA — it\'s an identity expression',
    ],
    commonClientProblems: [
      { problem: 'Launching a beauty brand, need identity', diagnosis: 'Needs full brand from scratch — name, visual identity, positioning', recommendedService: 'brand_identity' },
      { problem: 'Existing brand but losing to competitors', diagnosis: 'Commodity Trap — needs repositioning', recommendedService: 'business_health_check' },
    ],
    keyFrameworks: ['Kapferer Prism (all 6 facets critical for beauty)', 'Kahneman (sensory marketing, anchoring for premium pricing)', 'Cialdini (social proof via influencers)'],
  },
];

// ════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════

/**
 * Get the relevant industry pack for a client's industry.
 */
export function getIndustryPack(industry: string): IndustryPack | null {
  const normalized = industry.toLowerCase();
  const mapping: Record<string, string> = {
    'f&b': 'fnb', 'food': 'fnb', 'restaurant': 'fnb', 'cafe': 'fnb', 'مطعم': 'fnb', 'أغذية': 'fnb', 'مقهى': 'fnb',
    'health': 'healthcare', 'clinic': 'healthcare', 'medical': 'healthcare', 'hospital': 'healthcare', 'صحة': 'healthcare', 'عيادة': 'healthcare',
    'tech': 'tech', 'saas': 'tech', 'software': 'tech', 'startup': 'tech', 'app': 'tech', 'تقنية': 'tech', 'برمجيات': 'tech',
    'real estate': 'real_estate', 'property': 'real_estate', 'construction': 'real_estate', 'عقار': 'real_estate',
    'retail': 'retail', 'ecommerce': 'retail', 'e-commerce': 'retail', 'shop': 'retail', 'تجزئة': 'retail',
    'education': 'education', 'school': 'education', 'university': 'education', 'training': 'education', 'تعليم': 'education',
    'beauty': 'beauty', 'cosmetic': 'beauty', 'salon': 'beauty', 'skincare': 'beauty', 'جمال': 'beauty',
  };

  for (const [keyword, packId] of Object.entries(mapping)) {
    if (normalized.includes(keyword)) {
      return INDUSTRY_PACKS.find(p => p.id === packId) || null;
    }
  }
  return null;
}

/**
 * Format an industry pack into a knowledge string for the AI.
 */
export function formatIndustryPackForAI(pack: IndustryPack, market?: string): string {
  let output = `## INDUSTRY INTELLIGENCE: ${pack.name}\n\n`;

  // Market data
  const marketData = market === 'ksa' ? pack.markets.ksa :
                     market === 'egypt' ? pack.markets.egypt :
                     pack.markets.egypt || pack.markets.ksa;

  if (marketData) {
    output += `**Market Size:** ${marketData.marketSize}\n`;
    output += `**Growth:** ${marketData.growth}\n`;
    output += `**Key Players:** ${marketData.keyPlayers.join(', ')}\n\n`;
    output += `**Trends:**\n${marketData.trends.map(t => `- ${t}`).join('\n')}\n\n`;
    output += `**Challenges:**\n${marketData.challenges.map(c => `- ${c}`).join('\n')}\n\n`;
    output += `**Consumer Behavior:**\n${marketData.consumerBehavior.map(b => `- ${b}`).join('\n')}\n\n`;
  }

  // Branding patterns
  output += `**Branding Patterns in ${pack.name}:**\n${pack.brandingPatterns.map(p => `- ${p}`).join('\n')}\n\n`;

  // Common client problems → diagnosis
  output += `**Common Client Problems:**\n`;
  for (const p of pack.commonClientProblems) {
    output += `- "${p.problem}" → Diagnosis: ${p.diagnosis} → Recommend: ${p.recommendedService}\n`;
  }

  output += `\n**Key Frameworks:** ${pack.keyFrameworks.join(', ')}\n`;
  return output;
}

/**
 * Seeds industry packs into the knowledge_entries table.
 * Runs once — checks if entries already exist before creating.
 */
export async function seedIndustryPacks(): Promise<number> {
  let created = 0;
  for (const pack of INDUSTRY_PACKS) {
    // Check if already seeded
    const existing = await getKnowledgeEntries({ category: 'market_insight', industry: pack.name });
    const hasExisting = existing.some((e: any) => (e as { title?: string }).title?.includes(`Industry Pack: ${pack.name}`));
    if (hasExisting) continue;

    for (const [marketKey, marketData] of Object.entries(pack.markets)) {
      if (!marketData) continue;
      try {
        await createKnowledgeEntry({
          title: `Industry Pack: ${pack.name} — ${marketKey === 'ksa' ? 'Saudi Arabia' : 'Egypt'}`,
          content: formatIndustryPackForAI(pack, marketKey),
          category: 'market_insight',
          industry: pack.name,
          market: marketKey,
          source: 'research_import',
          tags: [pack.id, marketKey, 'industry_pack', 'auto_seeded'],
        });
        created++;
      } catch (err) {
        logger.debug({ err, pack: pack.id, market: marketKey }, 'Failed to seed industry pack');
      }
    }
  }

  if (created > 0) {
    logger.info({ created }, 'Industry knowledge packs seeded');
  }
  return created;
}
