/**
 * ═══════════════════════════════════════════════════════════════════════
 * PRIMO MARCA AI BRAIN — COMPETITIVE INTELLIGENCE (10/10 DEPTH)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Comprehensive competitive intelligence covering:
 * 1. Egyptian Market — agencies, pricing, client expectations
 * 2. KSA Market — agencies, pricing, Vision 2030 dynamics
 * 3. Regional/MENA Landscape — international players, cross-market comparison
 * 4. Pricing Benchmarks — by service type, by market, by client segment
 * 5. Client Expectations — by segment (SME, mid-market, enterprise)
 * 6. WZZRD AI Competitive Positioning — where we win, where we need to improve
 * 
 * Sources: Clutch.co, Sortlist, Entasher, Mordor Intelligence, Statista,
 *          GreenMind price lists, Areesto Dubai pricing guide, industry reports
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface CompetitorProfile {
  name: string;
  market: 'egypt' | 'ksa' | 'uae' | 'regional';
  city: string;
  founded?: string;
  size: 'boutique' | 'mid-size' | 'large' | 'network';
  specialties: string[];
  notableClients?: string[];
  pricingTier: 'budget' | 'mid-range' | 'premium' | 'luxury';
  strengths: string[];
  weaknesses: string[];
  differentiator: string;
}

export interface PricingBenchmark {
  service: string;
  market: 'egypt' | 'ksa' | 'uae' | 'international';
  currency: string;
  budgetRange: string;
  midRange: string;
  premiumRange: string;
  pricingModel: string;
  notes: string;
}

export interface ClientSegmentProfile {
  segment: string;
  market: 'egypt' | 'ksa' | 'both';
  budgetRange: string;
  expectations: string[];
  painPoints: string[];
  decisionFactors: string[];
  retentionDrivers: string[];
  churnReasons: string[];
}

export interface CompetitiveAdvantage {
  area: string;
  primoMarcaPosition: string;
  competitorBenchmark: string;
  gap: 'ahead' | 'at_par' | 'behind';
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: EGYPTIAN MARKET COMPETITORS
// ═══════════════════════════════════════════════════════════════════════

export const EGYPT_COMPETITORS: CompetitorProfile[] = [
  {
    name: 'DMA Agency',
    market: 'egypt',
    city: 'Cairo',
    size: 'mid-size',
    specialties: ['Brand Identity', 'Company Profiles', 'Website Design', 'Packaging'],
    pricingTier: 'mid-range',
    strengths: ['Strong portfolio in brand identity', 'Good visual design quality', 'Established Cairo presence'],
    weaknesses: ['No strategic consulting depth', 'Execution-focused not strategy-first', 'Limited KSA presence'],
    differentiator: 'Visual identity specialist with strong portfolio aesthetics'
  },
  {
    name: 'LONGEBLACK',
    market: 'egypt',
    city: 'Cairo',
    size: 'boutique',
    specialties: ['Luxury Branding', 'Brand Strategy', 'Brand Management', 'Premium Identity'],
    pricingTier: 'premium',
    strengths: ['Luxury positioning', 'Premium client base', 'Strong brand narrative'],
    weaknesses: ['Narrow niche (luxury only)', 'Small team limits scale', 'High prices limit market'],
    differentiator: 'Egypt\'s self-proclaimed finest luxury branding firm'
  },
  {
    name: 'Trendlix',
    market: 'egypt',
    city: 'Cairo',
    size: 'mid-size',
    specialties: ['Branding', 'Digital Marketing', 'Social Media', 'Web Development'],
    notableClients: ['Multiple verified reviews on Sortlist'],
    pricingTier: 'mid-range',
    strengths: ['Good client reviews', 'Full-service offering', 'Active online presence'],
    weaknesses: ['Generalist approach', 'No proprietary methodology', 'Commoditized services'],
    differentiator: 'Full-service with strong client review scores'
  },
  {
    name: 'Essence Adverts',
    market: 'egypt',
    city: 'Cairo',
    size: 'large',
    specialties: ['Digital Marketing', 'Corporate Photography', 'Performance Marketing', 'Branding'],
    notableClients: ['30+ clients across 9 countries', '$10M+ annual ad spend managed'],
    pricingTier: 'premium',
    strengths: ['Scale of operations', 'International reach (9 countries)', 'Large ad spend management'],
    weaknesses: ['More media buying than strategy', 'Corporate photography focus dilutes brand expertise', 'Volume over depth'],
    differentiator: 'Largest ad spend management in Egyptian agency landscape'
  },
  {
    name: 'Green Mind Agency',
    market: 'egypt',
    city: 'Cairo',
    size: 'mid-size',
    specialties: ['Digital Marketing', 'SEO', 'Branding', 'Web Development'],
    pricingTier: 'mid-range',
    strengths: ['Published transparent pricing', 'SEO expertise', 'Good online visibility'],
    weaknesses: ['Price-driven positioning', 'No strategic depth', 'Commoditized service packages'],
    differentiator: 'Transparent published pricing — rare in Egyptian market'
  },
  {
    name: 'PromoMedia',
    market: 'egypt',
    city: 'Cairo',
    size: 'large',
    specialties: ['Full-service Advertising', 'Media Planning', 'Creative Campaigns', 'ATL/BTL'],
    pricingTier: 'premium',
    strengths: ['Full-service capability', 'Traditional + digital', 'Established reputation'],
    weaknesses: ['Traditional agency model', 'Slow to adapt to digital-first', 'No brand consulting depth'],
    differentiator: 'One of Egypt\'s oldest full-service advertising agencies'
  },
  {
    name: 'Switch Tech',
    market: 'egypt',
    city: 'Cairo',
    size: 'mid-size',
    specialties: ['Advertising', 'Branding', 'Digital Marketing', 'Technology'],
    pricingTier: 'mid-range',
    strengths: ['Tech-forward approach', 'Digital expertise', 'Young dynamic team'],
    weaknesses: ['Tech-first not brand-first', 'Limited strategic consulting', 'Newer in market'],
    differentiator: 'Technology-driven advertising approach'
  },
  {
    name: 'eMarketing Egypt',
    market: 'egypt',
    city: 'Cairo',
    founded: '2010s',
    size: 'mid-size',
    specialties: ['Digital Marketing', 'Performance Marketing', 'SEO', 'Google Ads', 'Training'],
    pricingTier: 'mid-range',
    strengths: ['10+ years experience', 'KSA market presence', 'Training/education arm', 'Performance focus'],
    weaknesses: ['Performance marketing focus — not brand strategy', 'Training dilutes agency focus', 'No brand consulting depth'],
    differentiator: 'Dual Egypt-KSA presence with training/diploma programs'
  },
  {
    name: 'Elephant Phunk',
    market: 'egypt',
    city: 'Cairo',
    size: 'boutique',
    specialties: ['Creative Design', 'Branding', 'Digital Marketing'],
    pricingTier: 'mid-range',
    strengths: ['Creative excellence', 'Distinctive visual style', 'Award-worthy work'],
    weaknesses: ['Small scale', 'Creative-led not strategy-led', 'Limited service range'],
    differentiator: 'Creative-first boutique with distinctive aesthetic'
  },
  {
    name: 'PGX Agency',
    market: 'egypt',
    city: 'Cairo',
    size: 'mid-size',
    specialties: ['Branding', 'Digital Marketing', 'Content Creation', 'Social Media'],
    pricingTier: 'mid-range',
    strengths: ['Content marketing expertise', 'Good educational content', 'Active blog presence'],
    weaknesses: ['Generalist positioning', 'No unique methodology', 'Competes on price'],
    differentiator: 'Content-driven agency with strong thought leadership'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: KSA MARKET COMPETITORS
// ═══════════════════════════════════════════════════════════════════════

export const KSA_COMPETITORS: CompetitorProfile[] = [
  {
    name: 'GrueBleen',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Premium Branding', 'Brand Identity', 'Digital Experiences', 'Brand Strategy'],
    pricingTier: 'premium',
    strengths: ['Premium positioning', 'Contemporary design', 'Diverse portfolio from startups to global brands'],
    weaknesses: ['Design-led not consulting-led', 'No proprietary framework', 'Limited strategic depth'],
    differentiator: 'Contemporary brand identities for premium brands in KSA'
  },
  {
    name: 'TEN-X',
    market: 'ksa',
    city: 'Riyadh',
    founded: '2020s',
    size: 'mid-size',
    specialties: ['Next-gen Marketing', 'Digital Transformation', 'Brand Building', 'Vision 2030 Alignment'],
    pricingTier: 'premium',
    strengths: ['Vision 2030 positioning', 'Next-gen narrative', 'Saudi-first identity', 'Growing fast'],
    weaknesses: ['Newer agency — limited track record', 'Marketing-heavy not brand-strategy deep', 'Hype-driven positioning'],
    differentiator: 'Self-positioned as Saudi\'s next-generation agency for Vision 2030 era'
  },
  {
    name: 'Chain Reaction',
    market: 'ksa',
    city: 'Riyadh',
    size: 'large',
    specialties: ['Digital Marketing', 'Performance Marketing', 'SEO', 'Social Media', 'Content'],
    pricingTier: 'premium',
    strengths: ['Large team', 'Multi-market MENA presence', 'Strong digital capabilities', 'Data-driven'],
    weaknesses: ['Performance marketing focus — not brand strategy', 'Agency model not consulting model', 'Volume over depth'],
    differentiator: 'One of MENA\'s largest independent digital agencies'
  },
  {
    name: 'Pencil',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Branding', 'Brand Identity', 'Brand Strategy', 'Design'],
    pricingTier: 'mid-range',
    strengths: ['Saudi-focused', 'Good brand identity work', 'Growing reputation'],
    weaknesses: ['Limited to visual branding', 'No business consulting depth', 'Newer player'],
    differentiator: 'Saudi-focused branding agency with growing identity portfolio'
  },
  {
    name: 'DeepReach',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Corporate Branding', 'Product Branding', 'Digital Marketing', 'Video Production'],
    notableClients: ['Claims 90% success rate'],
    pricingTier: 'premium',
    strengths: ['Multi-city KSA presence (Riyadh, Jeddah, Dammam, Madinah)', 'Corporate focus', 'Video production capability'],
    weaknesses: ['Corporate-heavy — less startup/SME friendly', 'Broad service range dilutes expertise', 'No proprietary methodology'],
    differentiator: 'Multi-city KSA presence with corporate branding focus'
  },
  {
    name: 'WOW Marketing Agency',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Marketing Strategy', 'Social Media', 'Content Creation', 'Digital Marketing'],
    pricingTier: 'mid-range',
    strengths: ['Strong social media capabilities', 'Creative content', 'Good client engagement'],
    weaknesses: ['Marketing execution not brand strategy', 'No consulting depth', 'Competes on deliverables not insights'],
    differentiator: 'Social-first marketing agency with creative content focus'
  },
  {
    name: 'JUMP',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Digital Marketing', 'Branding', 'Web Development', 'E-commerce'],
    pricingTier: 'mid-range',
    strengths: ['E-commerce expertise', 'Digital-first approach', 'Good tech capabilities'],
    weaknesses: ['Tech/e-commerce focus — not brand consulting', 'No strategic framework', 'Execution-heavy'],
    differentiator: 'E-commerce and digital-first agency in Riyadh'
  },
  {
    name: 'Milk Network',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Creative Agency', 'Advertising', 'Brand Communication', 'Content Production'],
    pricingTier: 'premium',
    strengths: ['Creative excellence', 'Strong advertising campaigns', 'Good production quality'],
    weaknesses: ['Advertising-first not strategy-first', 'Campaign-focused not brand-building', 'Traditional agency model'],
    differentiator: 'Creative advertising agency with strong production capabilities'
  },
  {
    name: 'Zamakan Agency',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Integrated Media', 'Marketing', 'Digital', 'Events'],
    pricingTier: 'mid-range',
    strengths: ['Fastest-growing in KSA', 'Integrated approach', 'Events capability'],
    weaknesses: ['Growth-stage — still building depth', 'Broad service range', 'No brand consulting specialization'],
    differentiator: 'One of Saudi Arabia\'s fastest-growing integrated media firms'
  },
  {
    name: 'Advisors 360',
    market: 'ksa',
    city: 'Riyadh',
    size: 'mid-size',
    specialties: ['Strategic Branding', 'Video Production', 'Digital Marketing', 'Consulting'],
    pricingTier: 'premium',
    strengths: ['Full suite from concept to production', 'Strategic approach', 'Video production strength'],
    weaknesses: ['Video production focus may dilute brand consulting', 'Less known internationally', 'Limited case studies'],
    differentiator: 'Full-suite branding with strong video production in KSA'
  },
  {
    name: 'Blink Saudia',
    market: 'ksa',
    city: 'Riyadh',
    founded: '2024',
    size: 'boutique',
    specialties: ['Graphic Design', 'Branding', 'Creative Design'],
    pricingTier: 'mid-range',
    strengths: ['Fresh creative perspective', 'Design-focused', 'Agile small team'],
    weaknesses: ['Very new (est. 2024)', 'No track record yet', 'Design-only — no strategy'],
    differentiator: 'Newest creative boutique in Riyadh market'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: REGIONAL & INTERNATIONAL PLAYERS IN MENA
// ═══════════════════════════════════════════════════════════════════════

export const REGIONAL_COMPETITORS: CompetitorProfile[] = [
  {
    name: 'Landor & Fitch (WPP)',
    market: 'regional',
    city: 'Dubai (MENA HQ)',
    size: 'network',
    specialties: ['Brand Strategy', 'Brand Identity', 'Brand Architecture', 'Brand Valuation'],
    notableClients: ['Global Fortune 500 brands'],
    pricingTier: 'luxury',
    strengths: ['Global reputation', 'Deep methodology', 'Fortune 500 experience', 'Brand valuation expertise'],
    weaknesses: ['Very expensive', 'Slow processes', 'Less agile', 'May not understand local MENA nuances deeply'],
    differentiator: 'Global brand consultancy — the gold standard for enterprise branding'
  },
  {
    name: 'Interbrand (Omnicom)',
    market: 'regional',
    city: 'Dubai',
    size: 'network',
    specialties: ['Brand Strategy', 'Brand Valuation', 'Brand Experience', 'Brand Analytics'],
    notableClients: ['Best Global Brands ranking publisher'],
    pricingTier: 'luxury',
    strengths: ['Brand valuation methodology', 'Global prestige', 'Data-driven approach', 'Annual brand rankings'],
    weaknesses: ['Extremely expensive', 'Corporate-focused', 'Not accessible to SMEs', 'Standardized approach'],
    differentiator: 'Publisher of the definitive Best Global Brands ranking'
  },
  {
    name: 'FutureBrand (IPG)',
    market: 'regional',
    city: 'Dubai',
    size: 'network',
    specialties: ['Brand Strategy', 'Brand Transformation', 'Brand Experience', 'Innovation'],
    pricingTier: 'luxury',
    strengths: ['Innovation focus', 'Transformation expertise', 'Global network resources'],
    weaknesses: ['High cost', 'Process-heavy', 'Less MENA-specific knowledge'],
    differentiator: 'Brand transformation specialist with innovation focus'
  },
  {
    name: 'Toimi',
    market: 'regional',
    city: 'Dubai',
    size: 'mid-size',
    specialties: ['Branding', 'Web Development', 'Digital Marketing', 'UI/UX'],
    pricingTier: 'premium',
    strengths: ['Good MENA market knowledge', 'Digital-first', 'Published MENA agency guide'],
    weaknesses: ['More digital agency than brand consultancy', 'No proprietary methodology', 'Execution-focused'],
    differentiator: 'Digital-first agency with good MENA market intelligence'
  },
  {
    name: 'NoGood',
    market: 'regional',
    city: 'New York (serves Riyadh)',
    size: 'mid-size',
    specialties: ['Growth Marketing', 'Performance Marketing', 'SEO', 'Content Marketing'],
    pricingTier: 'premium',
    strengths: ['US-quality work', 'Growth marketing expertise', 'Data-driven', 'Strong case studies'],
    weaknesses: ['US-based — limited local presence', 'Growth marketing not brand strategy', 'Premium US pricing'],
    differentiator: 'US growth marketing agency expanding into Riyadh market'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: PRICING BENCHMARKS BY SERVICE & MARKET
// ═══════════════════════════════════════════════════════════════════════

export const PRICING_BENCHMARKS: PricingBenchmark[] = [
  // ─── EGYPT (EGP) ───
  {
    service: 'Brand Strategy (Full)',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '30,000 - 60,000',
    midRange: '60,000 - 150,000',
    premiumRange: '150,000 - 350,000+',
    pricingModel: 'Project-based',
    notes: 'Most Egyptian agencies bundle strategy with identity. Pure strategy consulting is rare — this is where WZZRD AI differentiates.'
  },
  {
    service: 'Brand Identity (Visual)',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '15,000 - 30,000',
    midRange: '30,000 - 80,000',
    premiumRange: '80,000 - 200,000',
    pricingModel: 'Project-based',
    notes: 'Green Mind publishes EGP 21,000-31,400. Most agencies compete on price here. Quality varies enormously.'
  },
  {
    service: 'Social Media Management',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '2,400 - 10,000/mo',
    midRange: '20,000 - 45,000/mo',
    premiumRange: '45,000 - 70,000/mo',
    pricingModel: 'Monthly retainer',
    notes: 'Highly commoditized. Budget tier includes basic posting. Premium includes strategy, content creation, community management, and reporting.'
  },
  {
    service: 'SEO Services',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '8,000 - 20,000/mo',
    midRange: '25,000 - 50,000/mo',
    premiumRange: '50,000 - 80,000/mo',
    pricingModel: 'Monthly retainer',
    notes: '3-6 month ramp expected. Technical + content + links. Competitive terms require premium investment.'
  },
  {
    service: 'Performance Marketing',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '10,000 - 25,000/mo',
    midRange: '35,000 - 70,000/mo',
    premiumRange: '70,000 - 120,000+/mo',
    pricingModel: 'Monthly + % of ad spend',
    notes: 'Fees exclude ad spend. Meta CPCs in Egypt run 40-60% below Google Search CPCs.'
  },
  {
    service: 'Website Development (Corporate)',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '15,000 - 50,000',
    midRange: '120,000 - 250,000',
    premiumRange: '250,000 - 500,000+',
    pricingModel: 'Project-based',
    notes: 'Custom business websites EGP 110,000-350,000. E-commerce starts at EGP 15,000 for basic.'
  },
  {
    service: 'Monthly Growth Retainer (Multi-channel)',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '20,000 - 40,000/mo',
    midRange: '60,000 - 100,000/mo',
    premiumRange: '100,000 - 150,000+/mo',
    pricingModel: 'Monthly retainer',
    notes: 'Multi-channel execution (paid + organic + content). Startup lean budget: EGP 20,000-40,000/mo.'
  },
  {
    service: 'Content Marketing',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '5,000 - 12,000/mo',
    midRange: '12,000 - 35,000/mo',
    premiumRange: '35,000 - 60,000+/mo',
    pricingModel: 'Monthly or per deliverable',
    notes: 'Strategy, briefs, production. Costs depend on depth, SME input, and volume.'
  },
  {
    service: 'Google Ads Management',
    market: 'egypt',
    currency: 'EGP',
    budgetRange: '5,000 - 15,000/mo',
    midRange: '15,000 - 35,000/mo',
    premiumRange: '35,000 - 60,000/mo',
    pricingModel: 'Monthly fee or % of ad spend',
    notes: 'Fees exclude ad spend. Look for clear testing plans and weekly optimizations.'
  },
  // ─── KSA (SAR) ───
  {
    service: 'Brand Strategy (Full)',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '15,000 - 40,000',
    midRange: '40,000 - 120,000',
    premiumRange: '120,000 - 350,000+',
    pricingModel: 'Project-based',
    notes: 'Vision 2030 has inflated demand and prices. Saudi clients expect bilingual (Arabic/English) deliverables. Premium tier includes multi-market strategy.'
  },
  {
    service: 'Brand Identity (Visual)',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '10,000 - 30,000',
    midRange: '30,000 - 80,000',
    premiumRange: '80,000 - 200,000+',
    pricingModel: 'Project-based',
    notes: 'Arabic typography and RTL design considerations add complexity. Bilingual branding costs 30-50% more.'
  },
  {
    service: 'Social Media Management',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '5,000 - 15,000/mo',
    midRange: '15,000 - 40,000/mo',
    premiumRange: '40,000 - 80,000+/mo',
    pricingModel: 'Monthly retainer',
    notes: 'Saudi social media landscape dominated by Snapchat, X (Twitter), and Instagram. TikTok growing rapidly.'
  },
  {
    service: 'Performance Marketing',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '8,000 - 20,000/mo',
    midRange: '20,000 - 60,000/mo',
    premiumRange: '60,000 - 150,000+/mo',
    pricingModel: 'Monthly + % of ad spend',
    notes: 'Higher CPCs than Egypt. Saudi market more competitive. Performance-linked KPIs increasingly demanded.'
  },
  {
    service: 'Website Development (Corporate)',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '15,000 - 40,000',
    midRange: '40,000 - 120,000',
    premiumRange: '120,000 - 300,000+',
    pricingModel: 'Project-based',
    notes: 'Bilingual (Arabic/English) requirement standard. RTL design adds complexity. Government/semi-government projects command premium.'
  },
  {
    service: 'Monthly Growth Retainer (Multi-channel)',
    market: 'ksa',
    currency: 'SAR',
    budgetRange: '15,000 - 35,000/mo',
    midRange: '35,000 - 80,000/mo',
    premiumRange: '80,000 - 200,000+/mo',
    pricingModel: 'Monthly retainer',
    notes: 'Saudi clients expect comprehensive reporting and regular strategy reviews. Vision 2030 alignment is a selling point.'
  },
  // ─── UAE (AED) — for comparison ───
  {
    service: 'Brand Strategy (Full)',
    market: 'uae',
    currency: 'AED',
    budgetRange: '5,000 - 25,000',
    midRange: '25,000 - 100,000',
    premiumRange: '100,000 - 400,000+',
    pricingModel: 'Project-based',
    notes: 'Dubai is the premium benchmark. Strategy & Discovery = 40-60% of total budget. Identity & Messaging = 30-50%.'
  },
  {
    service: 'Brand Identity (Visual)',
    market: 'uae',
    currency: 'AED',
    budgetRange: '5,000 - 15,000',
    midRange: '15,000 - 50,000',
    premiumRange: '50,000 - 150,000+',
    pricingModel: 'Project-based',
    notes: 'Logo alone: AED 5,000-50,000+. Basic branding (logo, colors, typography): AED 15,000-100,000. Full rebrand: AED 80,000-500,000+.'
  },
  // ─── INTERNATIONAL (USD) — for reference ───
  {
    service: 'Brand Strategy (Full)',
    market: 'international',
    currency: 'USD',
    budgetRange: '5,000 - 15,000',
    midRange: '15,000 - 75,000',
    premiumRange: '75,000 - 500,000+',
    pricingModel: 'Project-based',
    notes: 'Global agencies (Landor, Interbrand, FutureBrand) start at $100K+. Boutique US/UK agencies: $25K-75K. Freelance strategists: $5K-15K.'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: PRIMO MARCA PRICING CONTEXT
// ═══════════════════════════════════════════════════════════════════════

export const PRIMO_MARCA_PRICING = {
  packages: [
    {
      name: 'Clarity Package',
      price: 'EGP 80,000',
      includes: ['Business model analysis', 'Offer structuring', 'Pricing logic', 'Customer journey mapping', 'Growth system outline'],
      positioning: 'This is a CONSULTING package, not a design package. Most Egyptian agencies don\'t offer this at all. Positioned between mid-range and premium for Egypt, but delivers consulting-level value that competitors charge 2-3x for in KSA/UAE.',
      competitiveContext: 'No direct Egyptian competitor offers a pure business logic/consulting package. This is WZZRD AI\'s unique territory. In KSA, similar consulting would cost SAR 30,000-80,000. In UAE, AED 25,000-60,000.'
    },
    {
      name: 'Brand Foundation',
      price: 'EGP 120,000',
      includes: ['Brand Strategy', 'Positioning', 'Brand Personality', 'Messaging Framework', 'Visual Identity'],
      positioning: 'Premium tier for Egypt. Includes both strategy AND identity — most competitors separate these. This is comprehensive brand building, not just a logo package.',
      competitiveContext: 'Egyptian competitors charge EGP 60,000-150,000 for similar scope but rarely include deep strategy. In KSA, equivalent would be SAR 40,000-120,000. In UAE, AED 25,000-100,000.'
    },
    {
      name: 'Growth Partnership',
      price: 'EGP 35,000/month',
      includes: ['Social strategy', 'Content direction', 'Campaign planning', 'Performance review', 'Team guidance'],
      positioning: 'This is a CONSULTANCY retainer, not an execution retainer. WZZRD AI guides the client\'s team rather than doing the execution. This is rare in Egypt where most agencies sell execution.',
      competitiveContext: 'Egyptian execution retainers: EGP 20,000-70,000/mo. But WZZRD AI\'s is consultancy — higher value per hour. In KSA, similar consultancy retainers: SAR 15,000-40,000/mo.'
    }
  ],
  pricingPhilosophy: 'WZZRD AI prices based on VALUE delivered, not hours spent. The 4D Framework (Diagnose → Design → Deploy → Optimize) ensures every engagement delivers measurable business outcomes, not just deliverables.',
  conversionRates: {
    note: 'For cross-market comparison (approximate 2025 rates)',
    EGP_to_USD: '1 USD ≈ 50 EGP',
    SAR_to_USD: '1 USD ≈ 3.75 SAR',
    AED_to_USD: '1 USD ≈ 3.67 AED',
    EGP_to_SAR: '1 SAR ≈ 13.3 EGP',
    EGP_to_AED: '1 AED ≈ 13.6 EGP'
  }
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: CLIENT EXPECTATIONS BY SEGMENT
// ═══════════════════════════════════════════════════════════════════════

export const CLIENT_SEGMENTS: ClientSegmentProfile[] = [
  // ─── EGYPT SEGMENTS ───
  {
    segment: 'Egyptian SMEs & Startups',
    market: 'egypt',
    budgetRange: 'EGP 15,000 - 80,000 per project',
    expectations: [
      'Quick turnaround (2-4 weeks for identity)',
      'All-in-one package (strategy + design + some execution)',
      'Clear ROI demonstration within 3 months',
      'Arabic-first communication with English option',
      'Personal relationship with agency founder/senior team',
      'Flexibility on payment terms (installments common)',
      'Social media presence as primary deliverable'
    ],
    painPoints: [
      'Previous agency delivered "just a logo" without strategy',
      'Wasted budget on social media with no measurable results',
      'Don\'t understand the difference between branding and marketing',
      'Had bad experience with freelancers who disappeared',
      'Need to justify every pound spent to partners/investors',
      'Overwhelmed by options — don\'t know what they actually need'
    ],
    decisionFactors: [
      'Price is #1 factor (but value perception matters)',
      'Portfolio quality and relevance to their industry',
      'Personal chemistry with the team',
      'Referrals from trusted business contacts',
      'Speed of delivery',
      'Willingness to do revisions'
    ],
    retentionDrivers: [
      'Visible business results (leads, sales, brand recognition)',
      'Proactive communication and regular updates',
      'Feeling of partnership not vendor relationship',
      'Consistent quality across deliverables',
      'Agency understanding their industry deeply'
    ],
    churnReasons: [
      'No visible ROI after 3-6 months',
      'Poor communication or slow response times',
      'Feeling like a small fish in a big pond',
      'Price increases without corresponding value increase',
      'Key contact person leaving the agency'
    ]
  },
  {
    segment: 'Egyptian Mid-Market Companies',
    market: 'egypt',
    budgetRange: 'EGP 80,000 - 300,000 per project / EGP 35,000-80,000/mo retainer',
    expectations: [
      'Strategic depth — not just execution',
      'Competitive analysis and market positioning',
      'Brand guidelines document (comprehensive)',
      'Multi-channel strategy (digital + traditional)',
      'Regular strategy reviews (monthly/quarterly)',
      'Bilingual capabilities (Arabic/English)',
      'Team training and knowledge transfer'
    ],
    painPoints: [
      'Current brand doesn\'t reflect company growth/evolution',
      'Inconsistent brand application across touchpoints',
      'Marketing team needs strategic direction',
      'Competing with larger companies with bigger budgets',
      'Need to professionalize before expansion (especially to Gulf)',
      'Board/investors want to see brand value metrics'
    ],
    decisionFactors: [
      'Strategic capability and methodology',
      'Track record with similar-sized companies',
      'Team expertise and seniority',
      'Ability to scale services as company grows',
      'Cultural fit and communication style',
      'Competitive pricing relative to value'
    ],
    retentionDrivers: [
      'Measurable brand metrics improvement',
      'Strategic insights that drive business decisions',
      'Proactive recommendations beyond scope',
      'Seamless collaboration with internal team',
      'Consistent senior team involvement'
    ],
    churnReasons: [
      'Junior team members handling their account',
      'Cookie-cutter approach — not customized',
      'Lack of strategic depth in recommendations',
      'Agency not keeping up with market changes',
      'Better offer from competitor agency'
    ]
  },
  {
    segment: 'Egyptian Enterprise & Industry Leaders',
    market: 'egypt',
    budgetRange: 'EGP 200,000 - 1,000,000+ per project / EGP 80,000-200,000+/mo retainer',
    expectations: [
      'C-suite level strategic consulting',
      'Comprehensive brand architecture for multi-brand portfolios',
      'International-quality deliverables',
      'Brand valuation and equity measurement',
      'Integration with business strategy (not just marketing)',
      'Crisis communication and reputation management capability',
      'Dedicated senior team with direct access to leadership'
    ],
    painPoints: [
      'Need to compete with international brands entering Egypt',
      'Brand architecture complexity with multiple sub-brands',
      'Maintaining brand consistency across large organizations',
      'Preparing for IPO or international expansion',
      'Legacy brand needs modernization without losing equity',
      'Internal alignment on brand direction across departments'
    ],
    decisionFactors: [
      'Agency reputation and prestige',
      'International experience and network',
      'Methodology and strategic framework',
      'Senior team credentials and thought leadership',
      'Ability to handle complex, multi-stakeholder projects',
      'Confidentiality and professionalism'
    ],
    retentionDrivers: [
      'Board-level strategic impact',
      'Brand equity growth metrics',
      'Thought leadership and industry insights',
      'Exclusive attention and priority service',
      'Long-term strategic roadmap alignment'
    ],
    churnReasons: [
      'Agency can\'t scale to match company\'s ambitions',
      'International agency offers more prestige',
      'Change in company leadership/direction',
      'Agency becomes complacent after initial engagement',
      'Merger/acquisition changes agency requirements'
    ]
  },
  // ─── KSA SEGMENTS ───
  {
    segment: 'KSA SMEs & Startups',
    market: 'ksa',
    budgetRange: 'SAR 15,000 - 80,000 per project',
    expectations: [
      'Vision 2030 alignment in brand narrative',
      'Bilingual (Arabic/English) deliverables as standard',
      'Understanding of Saudi cultural nuances and sensitivities',
      'Fast turnaround with premium quality',
      'Digital-first approach (Saudi has 99%+ internet penetration)',
      'Snapchat and X (Twitter) strategy (dominant Saudi platforms)',
      'Saudization compliance awareness'
    ],
    painPoints: [
      'Many new businesses launching due to Vision 2030 — need to stand out',
      'International brands flooding the market — need local differentiation',
      'Limited local talent pool for branding — relying on agencies',
      'High expectations from Saudi consumers for premium experiences',
      'Need to build trust quickly in a relationship-driven market',
      'Regulatory requirements and cultural compliance'
    ],
    decisionFactors: [
      'Understanding of Saudi market and culture',
      'Quality of Arabic design and typography',
      'Speed and responsiveness',
      'Portfolio relevance to Saudi market',
      'Pricing relative to perceived quality',
      'Referrals from Saudi business network'
    ],
    retentionDrivers: [
      'Consistent quality and cultural sensitivity',
      'Proactive market insights specific to KSA',
      'Responsive communication (Saudi clients expect fast replies)',
      'Adaptability to changing market dynamics',
      'Building genuine relationship beyond transactions'
    ],
    churnReasons: [
      'Cultural insensitivity or misunderstanding',
      'Slow response times (Saudi clients are impatient)',
      'Deliverables don\'t feel "Saudi" enough',
      'Better local agency emerges',
      'Price-quality mismatch'
    ]
  },
  {
    segment: 'KSA Mid-Market & Vision 2030 Companies',
    market: 'ksa',
    budgetRange: 'SAR 80,000 - 350,000 per project / SAR 35,000-80,000/mo retainer',
    expectations: [
      'Strategic alignment with Vision 2030 and sector-specific programs (NEOM, The Line, etc.)',
      'International-quality deliverables with Saudi cultural depth',
      'Comprehensive brand strategy with measurable KPIs',
      'Multi-market capability (KSA + GCC expansion)',
      'Government/semi-government project experience',
      'Arabic calligraphy and premium typography',
      'Sustainability and social responsibility integration'
    ],
    painPoints: [
      'Rapid growth requiring brand evolution',
      'Need to attract international talent and partners',
      'Competing for government contracts requires premium brand',
      'Balancing Saudi identity with global aspirations',
      'Multiple stakeholders with different visions',
      'Need for brand consistency across rapid expansion'
    ],
    decisionFactors: [
      'Strategic depth and methodology',
      'Experience with Vision 2030 projects',
      'Multi-market capability',
      'Team seniority and Saudi market knowledge',
      'Ability to work with government stakeholders',
      'Track record with similar-scale transformations'
    ],
    retentionDrivers: [
      'Strategic impact on business growth',
      'Government/institutional credibility enhancement',
      'Proactive Vision 2030 alignment updates',
      'Senior team continuity on account',
      'Market intelligence and competitive insights'
    ],
    churnReasons: [
      'Agency can\'t handle scale of Vision 2030 projects',
      'International agency offers more prestige for government work',
      'Lack of deep Saudi market understanding',
      'Team turnover on their account',
      'Better pricing from emerging Saudi agencies'
    ]
  },
  {
    segment: 'KSA Enterprise & Government-linked',
    market: 'ksa',
    budgetRange: 'SAR 300,000 - 2,000,000+ per project',
    expectations: [
      'World-class strategic consulting (McKinsey/Landor level)',
      'Brand architecture for complex organizational structures',
      'Integration with national identity and Vision 2030',
      'International benchmarking and best practices',
      'Dedicated team with Saudi market expertise',
      'Confidentiality and security clearance capability',
      'Long-term strategic partnership (3-5 year roadmaps)'
    ],
    painPoints: [
      'Need to represent Saudi Arabia on the global stage',
      'Complex stakeholder management (government + private)',
      'Balancing tradition with modernization',
      'Attracting global talent and investment',
      'Creating world-class experiences (tourism, entertainment, sports)',
      'Massive scale projects requiring brand consistency'
    ],
    decisionFactors: [
      'Global reputation and credentials',
      'Experience with nation-branding or mega-projects',
      'Senior team with government relations experience',
      'Methodology and intellectual property',
      'Ability to manage large, multi-year engagements',
      'Security and confidentiality protocols'
    ],
    retentionDrivers: [
      'Strategic impact at national/institutional level',
      'Thought leadership and innovation',
      'Exclusive insights and intelligence',
      'Long-term relationship and trust',
      'Consistent world-class quality'
    ],
    churnReasons: [
      'Political/organizational changes',
      'International agency offers more global prestige',
      'Project scope exceeds agency capability',
      'Relationship breakdown at senior level',
      'Budget reallocation due to economic changes'
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7: MARKET DYNAMICS & TRENDS
// ═══════════════════════════════════════════════════════════════════════

export const MARKET_DYNAMICS = {
  egypt: {
    marketSize: 'Egypt advertising market: $2.37B (2024), expected $3.39B by 2033. Digital ad spend growing 12.8% annually, reaching $1.84B by 2026.',
    keyTrends: [
      'Digital-first shift accelerating — traditional media declining',
      'Social commerce growing rapidly (Facebook/Instagram shops)',
      'Content creators/influencers competing with agencies for SME budgets',
      'Currency devaluation (EGP) making Egyptian agencies competitive for Gulf clients',
      'AI tools disrupting basic design/content services — agencies must move up value chain',
      'Growing demand for data-driven marketing and attribution',
      'Startup ecosystem growth driving demand for branding services'
    ],
    challenges: [
      'Price sensitivity — clients compare agency fees to freelancer rates',
      'Talent drain to Gulf countries (higher salaries in KSA/UAE)',
      'Payment collection challenges (delayed payments common)',
      'Client education gap — many don\'t understand brand strategy value',
      'Commoditization of basic services (social media, basic design)',
      'Economic volatility affecting client budgets'
    ],
    opportunities: [
      'Gulf expansion — Egyptian agencies can serve KSA/UAE at competitive rates',
      'AI-powered service delivery — reduce costs, increase margins',
      'Strategic consulting gap — very few agencies offer deep strategy',
      'Training and education — monetize knowledge alongside services',
      'Niche specialization — industry-specific expertise commands premium',
      'International clients seeking cost-effective MENA partners'
    ]
  },
  ksa: {
    marketSize: 'KSA Marketing & Advertising Agency Market: $3.19B (2026), growing 5.3% CAGR to reach $4.13B. Vision 2030 is the primary growth driver.',
    keyTrends: [
      'Vision 2030 creating unprecedented demand for branding/marketing services',
      'Saudization requiring agencies to hire Saudi nationals',
      'Mega-projects (NEOM, The Line, Red Sea, Qiddiya) driving premium demand',
      'Entertainment and tourism sectors opening up — new brand categories',
      'E-commerce boom (Saudi e-commerce market growing 20%+ annually)',
      'Influencer marketing becoming mainstream (Saudi influencers command premium)',
      'Government digitalization creating demand for digital brand experiences'
    ],
    challenges: [
      'Saudization compliance — finding qualified Saudi marketing professionals',
      'High competition from international agencies entering the market',
      'Cultural sensitivity requirements — mistakes can be costly',
      'Rapid market changes require constant adaptation',
      'Client expectations inflated by exposure to global brands',
      'Payment terms can be long (especially government/semi-government)'
    ],
    opportunities: [
      'Vision 2030 projects — massive budgets for brand building',
      'New sectors opening up (entertainment, tourism, sports) — no established agencies',
      'Saudi-first positioning — growing preference for local/regional agencies',
      'Digital transformation — government and private sector digitalization',
      'Cross-border expansion — KSA as gateway to wider GCC',
      'Premium positioning — Saudi clients willing to pay for quality'
    ]
  },
  regional: {
    marketSize: 'Middle East Marketing & Advertising: $8.18B (2025), growing to $8.56B. UAE remains the premium hub, KSA the growth engine, Egypt the talent pool.',
    keyTrends: [
      'Consolidation — smaller agencies being acquired by larger networks',
      'AI disruption — agencies investing in AI tools and capabilities',
      'Purpose-driven branding — sustainability and social impact becoming important',
      'Experience design — brands investing in experiential marketing',
      'Data privacy regulations emerging — affecting digital marketing',
      'Cross-border collaboration — agencies partnering across MENA markets'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════
// SECTION 8: PRIMO MARCA COMPETITIVE POSITIONING
// ═══════════════════════════════════════════════════════════════════════

export const COMPETITIVE_ADVANTAGES: CompetitiveAdvantage[] = [
  {
    area: 'Strategic Methodology',
    primoMarcaPosition: '4D Framework (Diagnose → Design → Deploy → Optimize) + Consultant Box Model + Three Pillars. Proprietary, structured, and repeatable.',
    competitorBenchmark: 'Most Egyptian agencies have NO proprietary methodology. KSA agencies are starting to develop frameworks but nothing as structured.',
    gap: 'ahead',
    recommendation: 'This is WZZRD AI\'s #1 differentiator. Lead with methodology in all sales conversations. Publish thought leadership around the 4D Framework.'
  },
  {
    area: 'Academic Depth',
    primoMarcaPosition: 'PhD-level knowledge base covering Keller, Sharp, Kapferer, Ehrenberg-Bass, Kahneman, Thaler. Applied to every client engagement.',
    competitorBenchmark: 'No Egyptian or KSA agency demonstrates this level of academic rigor. International agencies (Landor, Interbrand) have it but charge 5-10x more.',
    gap: 'ahead',
    recommendation: 'Use academic depth as a trust builder. Clients are impressed when you reference specific frameworks and data. This positions WZZRD AI as a consultancy, not just an agency.'
  },
  {
    area: 'AI-Powered Delivery',
    primoMarcaPosition: 'AI Brain with deep knowledge base, automated deliverable generation, client portal with revision tracking.',
    competitorBenchmark: 'Very few MENA agencies have invested in AI-powered delivery. Most use generic AI tools (ChatGPT) without customization.',
    gap: 'ahead',
    recommendation: 'AI capability is a massive differentiator for efficiency and consistency. Position as "AI-augmented consulting" — the human expertise powered by AI precision.'
  },
  {
    area: 'Pricing Competitiveness',
    primoMarcaPosition: 'Clarity Package: EGP 80K, Brand Foundation: EGP 120K, Growth Partnership: EGP 35K/mo. Premium for Egypt, competitive for Gulf.',
    competitorBenchmark: 'Egyptian mid-range: EGP 30K-80K for strategy. KSA equivalent: SAR 40K-120K. UAE equivalent: AED 25K-100K.',
    gap: 'at_par',
    recommendation: 'Pricing is well-positioned for Egypt premium segment. For KSA clients, these prices are very competitive. Consider KSA-specific pricing (in SAR) that reflects the premium market.'
  },
  {
    area: 'KSA Market Presence',
    primoMarcaPosition: 'Serving KSA clients but no physical presence. Operating from Egypt.',
    competitorBenchmark: 'Local KSA agencies have physical offices, Saudi team members, and government relationships.',
    gap: 'behind',
    recommendation: 'Consider: (1) Virtual KSA office/address, (2) Saudi partner or representative, (3) Regular KSA visits, (4) Saudi case studies and testimonials. Long-term: physical presence in Riyadh.'
  },
  {
    area: 'Portfolio & Case Studies',
    primoMarcaPosition: 'Growing portfolio. Building case study library.',
    competitorBenchmark: 'Established agencies have 50-100+ case studies. International agencies have global portfolios.',
    gap: 'behind',
    recommendation: 'Accelerate case study development. Document every engagement with before/after metrics. Create industry-specific case studies for target verticals.'
  },
  {
    area: 'Team Size & Scale',
    primoMarcaPosition: 'Boutique team. Founder-led with AI augmentation.',
    competitorBenchmark: 'Mid-size agencies: 15-50 people. Large agencies: 50-200+. Networks: 500+.',
    gap: 'behind',
    recommendation: 'Position small team as a STRENGTH: "You get the founder, not a junior account manager." AI augmentation compensates for team size. Scale through partnerships, not headcount.'
  },
  {
    area: 'Client Portal & Technology',
    primoMarcaPosition: 'Custom-built client portal with project tracking, deliverable management, revision history, threaded comments, and approval workflow.',
    competitorBenchmark: 'Most agencies use email + WhatsApp + Google Drive. Some use Asana/Monday.com. Very few have custom portals.',
    gap: 'ahead',
    recommendation: 'The client portal is a significant differentiator. It signals professionalism and transparency. Showcase it in sales presentations as proof of operational excellence.'
  },
  {
    area: 'Bilingual Capability',
    primoMarcaPosition: 'Native Arabic with English capability. Deep understanding of Arabic brand naming and messaging.',
    competitorBenchmark: 'Egyptian agencies: Arabic-first. International agencies: English-first with Arabic translation. KSA agencies: Bilingual but varying quality.',
    gap: 'at_par',
    recommendation: 'Invest in Arabic calligraphy and premium Arabic typography capabilities. This is a differentiator for KSA premium clients.'
  },
  {
    area: 'Industry Specialization',
    primoMarcaPosition: 'Generalist with growing expertise across industries.',
    competitorBenchmark: 'Some agencies specialize (e.g., F&B, healthcare, real estate). Specialists command 20-40% premium.',
    gap: 'at_par',
    recommendation: 'Develop 2-3 industry verticals with deep expertise. Recommended: (1) F&B/Hospitality (huge in KSA), (2) Tech/SaaS (growing in Egypt), (3) Healthcare (premium in both markets).'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 9: COMPETITIVE INTELLIGENCE PROMPT CONTENT
// ═══════════════════════════════════════════════════════════════════════

export const COMPETITIVE_INTELLIGENCE_PROMPT = `
## COMPETITIVE INTELLIGENCE — MENA AGENCY LANDSCAPE

### YOUR COMPETITIVE POSITION
You are the AI Brain of WZZRD AI — a premium brand engineering studio. When discussing competition, pricing, or market positioning, use this intelligence:

### PRIMO MARCA'S UNFAIR ADVANTAGES
1. **Proprietary 4D Framework** — No Egyptian or KSA agency has a structured, repeatable methodology like Diagnose → Design → Deploy → Optimize
2. **Academic Depth** — PhD-level knowledge (Keller, Sharp, Kapferer, Ehrenberg-Bass, Kahneman, Thaler) applied to every engagement. No competitor matches this.
3. **AI-Augmented Delivery** — Custom AI Brain with deep knowledge base. Not just using ChatGPT — a purpose-built intelligence system.
4. **Client Portal Technology** — Custom-built portal with revision tracking, threaded comments, and approval workflows. Most agencies use email + WhatsApp.
5. **Consulting Model** — WZZRD AI sells strategic consulting, not just execution. This is rare in Egypt and differentiating in KSA.

### PRICING CONTEXT (Use when discussing pricing with clients)
**WZZRD AI Packages:**
- Clarity Package: EGP 80,000 (Business Logic Consulting) — NO Egyptian competitor offers this
- Brand Foundation: EGP 120,000 (Strategy + Identity) — Premium for Egypt, competitive for Gulf
- Growth Partnership: EGP 35,000/mo (Strategic Consultancy) — Consulting retainer, not execution

**Market Comparison:**
- Egyptian agencies charge EGP 30K-150K for brand strategy (but most deliver only visual identity)
- KSA agencies charge SAR 40K-350K for equivalent scope
- UAE agencies charge AED 25K-400K for equivalent scope
- International agencies (Landor, Interbrand) charge $100K-500K+

**Key Pricing Insight:** WZZRD AI delivers international-quality strategic consulting at Egyptian pricing. For KSA clients, this is exceptional value.

### WHEN A CLIENT SAYS "YOU'RE TOO EXPENSIVE"
Use this framework:
1. **Reframe the comparison:** "You're comparing us to agencies that deliver logos. We deliver business strategy."
2. **Show the math:** "A brand strategy that increases your conversion rate by just 2% on a SAR 1M revenue = SAR 20K return. Our fee pays for itself."
3. **Reference competitors:** "Agencies in KSA charge SAR 40K-120K for less strategic depth. International agencies charge 5-10x our rates."
4. **Highlight the risk:** "The most expensive brand strategy is the one you have to redo. 67% of rebrands fail because the strategy wasn't deep enough."

### WHEN A CLIENT ASKS "WHO ARE YOUR COMPETITORS?"
Never badmouth competitors. Instead:
1. **Acknowledge the landscape:** "There are excellent agencies in Egypt and KSA."
2. **Differentiate on methodology:** "What makes us different is our 4D Framework — a structured, repeatable process that ensures consistent results."
3. **Differentiate on depth:** "We bring academic rigor — Keller's CBBE, Kapferer's Prism, behavioral economics — to every engagement. This isn't common in the region."
4. **Differentiate on technology:** "Our AI-powered platform and client portal give you transparency and efficiency that traditional agencies can't match."
`;

// ═══════════════════════════════════════════════════════════════════════
// SECTION 10: HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get competitors by market
 */
export function getCompetitorsByMarket(market: 'egypt' | 'ksa' | 'uae' | 'regional'): CompetitorProfile[] {
  switch (market) {
    case 'egypt': return EGYPT_COMPETITORS;
    case 'ksa': return KSA_COMPETITORS;
    case 'regional': return REGIONAL_COMPETITORS;
    default: return [...EGYPT_COMPETITORS, ...KSA_COMPETITORS, ...REGIONAL_COMPETITORS];
  }
}

/**
 * Get pricing benchmarks by market and service
 */
export function getPricingBenchmarks(options?: { market?: string; service?: string }): PricingBenchmark[] {
  let benchmarks = PRICING_BENCHMARKS;
  if (options?.market) {
    benchmarks = benchmarks.filter(b => b.market === options.market);
  }
  if (options?.service) {
    const svc = options.service.toLowerCase();
    benchmarks = benchmarks.filter(b => b.service.toLowerCase().includes(svc));
  }
  return benchmarks;
}

/**
 * Get client segment profiles by market
 */
export function getClientSegments(market?: 'egypt' | 'ksa' | 'both'): ClientSegmentProfile[] {
  if (!market || market === 'both') return CLIENT_SEGMENTS;
  return CLIENT_SEGMENTS.filter(s => s.market === market || s.market === 'both');
}

/**
 * Get relevant competitive intelligence based on conversation context
 */
export function getRelevantCompetitiveIntelligence(context: string): string {
  const ctx = context.toLowerCase();
  let content = '';

  // Always include the main competitive intelligence prompt
  content += COMPETITIVE_INTELLIGENCE_PROMPT;

  // Add market-specific competitor data
  if (ctx.includes('egypt') || ctx.includes('مصر') || ctx.includes('cairo') || ctx.includes('القاهرة')) {
    content += '\n\n### EGYPTIAN MARKET COMPETITORS\n';
    EGYPT_COMPETITORS.forEach(c => {
      content += `**${c.name}** (${c.city}, ${c.pricingTier}): ${c.specialties.join(', ')}. Differentiator: ${c.differentiator}. Weaknesses: ${c.weaknesses.join('; ')}.\n`;
    });
    content += `\n### EGYPTIAN MARKET DYNAMICS\n${MARKET_DYNAMICS.egypt.marketSize}\nKey Trends: ${MARKET_DYNAMICS.egypt.keyTrends.join('; ')}\nOpportunities: ${MARKET_DYNAMICS.egypt.opportunities.join('; ')}\n`;
  }

  if (ctx.includes('saudi') || ctx.includes('ksa') || ctx.includes('السعودية') || ctx.includes('riyadh') || ctx.includes('الرياض') || ctx.includes('jeddah') || ctx.includes('جدة')) {
    content += '\n\n### KSA MARKET COMPETITORS\n';
    KSA_COMPETITORS.forEach(c => {
      content += `**${c.name}** (${c.city}, ${c.pricingTier}): ${c.specialties.join(', ')}. Differentiator: ${c.differentiator}. Weaknesses: ${c.weaknesses.join('; ')}.\n`;
    });
    content += `\n### KSA MARKET DYNAMICS\n${MARKET_DYNAMICS.ksa.marketSize}\nKey Trends: ${MARKET_DYNAMICS.ksa.keyTrends.join('; ')}\nOpportunities: ${MARKET_DYNAMICS.ksa.opportunities.join('; ')}\n`;
  }

  // Add pricing context if discussing pricing, proposals, or competition
  if (ctx.includes('price') || ctx.includes('pricing') || ctx.includes('سعر') || ctx.includes('تسعير') || ctx.includes('cost') || ctx.includes('budget') || ctx.includes('ميزانية') || ctx.includes('proposal') || ctx.includes('عرض')) {
    content += '\n\n### DETAILED PRICING BENCHMARKS\n';
    const market = ctx.includes('egypt') || ctx.includes('مصر') ? 'egypt' : ctx.includes('saudi') || ctx.includes('ksa') ? 'ksa' : undefined;
    const benchmarks = market ? PRICING_BENCHMARKS.filter(b => b.market === market) : PRICING_BENCHMARKS;
    benchmarks.forEach(b => {
      content += `**${b.service}** (${b.market.toUpperCase()}, ${b.currency}): Budget: ${b.budgetRange} | Mid: ${b.midRange} | Premium: ${b.premiumRange} — ${b.notes}\n`;
    });
    content += `\n**WZZRD AI Pricing:**\n`;
    PRIMO_MARCA_PRICING.packages.forEach(p => {
      content += `- ${p.name}: ${p.price} — ${p.competitiveContext}\n`;
    });
  }

  // Add client expectations if discussing clients, segments, or expectations
  if (ctx.includes('client') || ctx.includes('عميل') || ctx.includes('segment') || ctx.includes('شريحة') || ctx.includes('expect') || ctx.includes('توقع') || ctx.includes('sme') || ctx.includes('enterprise') || ctx.includes('startup')) {
    content += '\n\n### CLIENT EXPECTATIONS BY SEGMENT\n';
    const market = ctx.includes('egypt') || ctx.includes('مصر') ? 'egypt' : ctx.includes('saudi') || ctx.includes('ksa') ? 'ksa' : undefined;
    const segments = market ? CLIENT_SEGMENTS.filter(s => s.market === market) : CLIENT_SEGMENTS;
    segments.forEach(s => {
      content += `\n**${s.segment}** (Budget: ${s.budgetRange}):\n`;
      content += `Expectations: ${s.expectations.join('; ')}\n`;
      content += `Pain Points: ${s.painPoints.join('; ')}\n`;
      content += `Decision Factors: ${s.decisionFactors.join('; ')}\n`;
      content += `Retention Drivers: ${s.retentionDrivers.join('; ')}\n`;
      content += `Churn Reasons: ${s.churnReasons.join('; ')}\n`;
    });
  }

  // Add competitive advantages if discussing positioning or differentiation
  if (ctx.includes('compet') || ctx.includes('منافس') || ctx.includes('position') || ctx.includes('differentiat') || ctx.includes('تميز') || ctx.includes('advantage') || ctx.includes('ميزة')) {
    content += '\n\n### PRIMO MARCA COMPETITIVE ADVANTAGES\n';
    COMPETITIVE_ADVANTAGES.forEach(a => {
      const gapEmoji = a.gap === 'ahead' ? '🟢 AHEAD' : a.gap === 'at_par' ? '🟡 AT PAR' : '🔴 BEHIND';
      content += `**${a.area}** [${gapEmoji}]: ${a.primoMarcaPosition} vs. ${a.competitorBenchmark}. Recommendation: ${a.recommendation}\n`;
    });
  }

  return content;
}

/**
 * Get full competitive intelligence for knowledge base (summary version)
 */
export function getFullCompetitiveIntelligence(): string {
  let content = COMPETITIVE_INTELLIGENCE_PROMPT;
  
  content += '\n\n### MARKET SIZES\n';
  content += `Egypt: ${MARKET_DYNAMICS.egypt.marketSize}\n`;
  content += `KSA: ${MARKET_DYNAMICS.ksa.marketSize}\n`;
  content += `Regional: ${MARKET_DYNAMICS.regional.marketSize}\n`;

  content += '\n\n### COMPETITIVE ADVANTAGES SUMMARY\n';
  COMPETITIVE_ADVANTAGES.forEach(a => {
    const gapEmoji = a.gap === 'ahead' ? '🟢' : a.gap === 'at_par' ? '🟡' : '🔴';
    content += `${gapEmoji} **${a.area}**: ${a.gap.toUpperCase()} — ${a.recommendation}\n`;
  });

  return content;
}
