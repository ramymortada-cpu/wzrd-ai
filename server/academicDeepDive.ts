/**
 * ═══════════════════════════════════════════════════════════════════════
 * WZZRD AI BRAIN — ACADEMIC DEEP DIVE (10/10 DEPTH)
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * This module adds PhD-level depth to the existing academic frameworks:
 * - Keller's CBBE: Full 6 building blocks with Brand Resonance Pyramid
 * - Sharp vs Keller: The Great Debate with practical decision guide
 * - Kapferer: Full 6 facets + Luxury Strategy Anti-Laws
 * - Ehrenberg-Bass: All scientific laws with real brand data
 * - Kahneman: System 1/2 with branding applications
 * - Thaler: Mental Accounting + Choice Architecture + Nudge Theory
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface BuildingBlock {
  name: string;
  definition: string;
  subComponents: string[];
  brandExamples: { brand: string; application: string; numbers: string }[];
  menaApplication: string;
}

export interface AcademicDebate {
  title: string;
  side1: { theorist: string; position: string; evidence: string[] };
  side2: { theorist: string; position: string; evidence: string[] };
  resolution: string;
  practicalGuide: string;
}

export interface SubModel {
  name: string;
  creator: string;
  description: string;
  components: string[];
  realWorldApplication: string;
  keyInsight: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. KELLER'S CBBE — FULL 6 BUILDING BLOCKS
// ═══════════════════════════════════════════════════════════════════════

export const KELLER_BUILDING_BLOCKS: BuildingBlock[] = [
  {
    name: 'Brand Salience',
    definition: 'The foundation of brand equity — how easily and often a brand comes to mind in buying situations. Not just awareness, but the DEPTH (ease of recall) and BREADTH (range of situations) of awareness.',
    subComponents: [
      'Depth of Awareness — How easily the brand is recognized and recalled. Top-of-mind awareness is the gold standard.',
      'Breadth of Awareness — The range of purchase and consumption situations where the brand comes to mind.',
      'Category Identification — Whether consumers know what category the brand belongs to and what needs it satisfies.',
      'Needs Satisfied — Whether consumers understand what fundamental needs the brand addresses.'
    ],
    brandExamples: [
      {
        brand: 'Nike',
        application: 'Nike has achieved maximum salience through the Swoosh (instant recognition) and "Just Do It" (instant recall). The brand comes to mind not just for running shoes but for ALL athletic activities, fitness lifestyle, and even casual fashion.',
        numbers: 'Revenue $51.2B (FY2023). Brand value $31.3B (Interbrand 2023). 97% brand recognition globally.'
      },
      {
        brand: 'Coca-Cola',
        application: 'Coca-Cola dominates both depth (the red can is the most recognized packaging in the world) and breadth (comes to mind for meals, parties, movies, sports, celebrations — virtually every consumption occasion).',
        numbers: 'Revenue $45.8B (2023). Consumed 2.2 billion times per day worldwide. Present in 200+ countries.'
      },
      {
        brand: 'Apple',
        application: 'Apple has expanded salience from computers to phones, watches, music, TV, payments. The Apple logo is recognized by 98% of Americans. The brand comes to mind across 7+ product categories.',
        numbers: 'Revenue $383.2B (2023). Brand value $502.7B (Interbrand 2023, #1 globally). 1.2B active iPhone users.'
      }
    ],
    menaApplication: 'In MENA, brand salience is heavily driven by social media. Careem achieved salience by becoming synonymous with "ride-hailing" in Arabic-speaking markets before Uber entered. Noon.com built salience through the Yellow Friday campaign — making it the first brand that comes to mind for online shopping in the Gulf.'
  },
  {
    name: 'Brand Performance',
    definition: 'How well the product meets customers\' functional needs. This is about the INTRINSIC properties of the brand — what the product actually DOES.',
    subComponents: [
      'Primary Characteristics & Features — The core functional attributes (e.g., iPhone camera quality, Tesla range).',
      'Product Reliability, Durability & Serviceability — Consistency over time and ease of repair.',
      'Service Effectiveness, Efficiency & Empathy — Quality of customer service and support experience.',
      'Style & Design — Aesthetic appeal, look and feel, sensory experience.',
      'Price — Not just the number, but the perceived value relative to what you get.'
    ],
    brandExamples: [
      {
        brand: 'Apple',
        application: 'Apple dominates on style/design and reliability. The seamless hardware-software integration creates performance that competitors struggle to match. AppleCare service is rated highest in tech industry.',
        numbers: 'iPhone customer satisfaction: 98% (ACSI 2023). Apple ecosystem retention rate: 92%. Average iPhone lifespan: 4.5 years.'
      },
      {
        brand: 'Toyota',
        application: 'Toyota dominates on reliability and durability. The brand has consistently ranked #1 in J.D. Power reliability studies. The Corolla and Camry are known for lasting 200,000+ miles with minimal maintenance.',
        numbers: 'Global sales: 10.5M vehicles (2023, #1 worldwide). J.D. Power reliability: #1 for 8 consecutive years. Resale value retention: 65% after 3 years.'
      },
      {
        brand: 'Starbucks',
        application: 'Starbucks excels in service effectiveness (barista training program is 40+ hours) and style/design (the "third place" concept). Mobile ordering handles 26% of all transactions.',
        numbers: 'Revenue $36.0B (FY2023). 35,711 stores globally. Customer satisfaction: 78/100 (ACSI). Starbucks Rewards: 75M members globally.'
      }
    ],
    menaApplication: 'In Egypt, performance expectations are heavily influenced by price sensitivity. Brands like Juhayna (dairy) win on reliability and consistency. In KSA, performance expectations are higher — Saudi consumers expect global-quality service. NEOM and Saudi tourism brands must deliver on ambitious performance promises to match Vision 2030 expectations.'
  },
  {
    name: 'Brand Imagery',
    definition: 'The EXTRINSIC properties of the brand — how it meets customers\' psychological and social needs. This is about what people THINK about the brand, not what it actually does.',
    subComponents: [
      'User Profiles — What type of person uses this brand? Demographics, psychographics, aspirations.',
      'Purchase & Usage Situations — When, where, and how is the brand used?',
      'Personality & Values — Human characteristics associated with the brand (sincere, exciting, competent, sophisticated, rugged).',
      'History, Heritage & Experiences — The brand story, origin, and accumulated experiences.'
    ],
    brandExamples: [
      {
        brand: 'Nike',
        application: 'Nike\'s imagery is built around the "hero archetype" — determination, victory, personal excellence. User profile: anyone who aspires to be athletic. Michael Jordan partnership created the most powerful brand imagery in sports history.',
        numbers: 'Air Jordan brand alone: $6.6B revenue (2023). Nike\'s athlete endorsement budget: $1.5B/year. "Just Do It" campaign increased sales from $877M to $9.2B in 10 years.'
      },
      {
        brand: 'Harley-Davidson',
        application: 'Harley\'s imagery is about freedom, rebellion, and brotherhood. The brand has created one of the strongest brand communities in the world — H.O.G. (Harley Owners Group) has 1M+ members.',
        numbers: 'Average Harley buyer age: 50. Revenue: $5.8B (2023). H.O.G. members: 1M+. Brand loyalty: 92% of owners say they would buy again.'
      }
    ],
    menaApplication: 'In MENA, brand imagery is heavily influenced by cultural values. Luxury brands in Dubai leverage imagery of success and sophistication. In Saudi Arabia, brands increasingly need to balance modernity (Vision 2030) with cultural heritage. Egyptian brands like Cottonil have built imagery around Egyptian pride and local manufacturing quality.'
  },
  {
    name: 'Brand Judgments',
    definition: 'Customers\' personal OPINIONS and evaluations of the brand. This is the rational, head-based assessment.',
    subComponents: [
      'Quality — Perceived quality and value. Not just actual quality, but how customers JUDGE quality.',
      'Credibility — Is the brand seen as competent (expertise), trustworthy (dependable), and likable (fun, interesting)?',
      'Consideration — Is the brand in the customer\'s consideration set? Do they actually think about buying it?',
      'Superiority — Is the brand seen as BETTER than alternatives? This is the ultimate judgment.'
    ],
    brandExamples: [
      {
        brand: 'Apple',
        application: 'Apple scores highest on all 4 judgment dimensions: perceived quality (#1 in tech), credibility (trusted with personal data), consideration (92% of iPhone users consider iPhone for next purchase), superiority (seen as premium leader).',
        numbers: 'Net Promoter Score: 72 (industry avg: 32). Brand trust: 88% (Morning Consult). Consideration rate: 92% among existing users.'
      },
      {
        brand: 'Tesla',
        application: 'Tesla has high quality and superiority judgments but mixed credibility (Elon Musk\'s controversies). This shows how credibility can be a vulnerability even for innovative brands.',
        numbers: 'Customer satisfaction: 96% (highest in auto industry). But brand favorability dropped from 70% to 55% (2022-2023) due to CEO controversies.'
      }
    ],
    menaApplication: 'In MENA markets, credibility is heavily influenced by word-of-mouth and family recommendations. Saudi consumers rate credibility through peer validation more than advertising. In Egypt, price-quality judgment is critical — consumers are sophisticated about detecting "overpriced" brands. Brands must prove value clearly.'
  },
  {
    name: 'Brand Feelings',
    definition: 'Customers\' EMOTIONAL responses and reactions to the brand. This is the heart-based assessment — how the brand makes you FEEL.',
    subComponents: [
      'Warmth — The brand evokes feelings of calm, peace, sentimentality, or affection.',
      'Fun — The brand evokes feelings of amusement, playfulness, cheerfulness.',
      'Excitement — The brand evokes feelings of energy, being alive, being special.',
      'Security — The brand evokes feelings of safety, comfort, self-assurance.',
      'Social Approval — The brand evokes feelings of being accepted, admired by others.',
      'Self-Respect — The brand evokes feelings of pride, accomplishment, fulfillment.'
    ],
    brandExamples: [
      {
        brand: 'Disney',
        application: 'Disney dominates warmth (nostalgia, family), fun (entertainment), and excitement (theme parks). The brand creates emotional connections that span generations.',
        numbers: 'Disney Parks revenue: $32.5B (2023). Disney+ subscribers: 150M. Brand emotional connection score: 94/100 (highest in entertainment).'
      },
      {
        brand: 'Rolex',
        application: 'Rolex dominates social approval (status symbol) and self-respect (achievement). Wearing a Rolex signals success and accomplishment.',
        numbers: 'Revenue: ~$10B (2023, estimated). Average price: $8,000-$12,000. Resale value: often exceeds retail. Wait lists: 6-24 months for popular models.'
      }
    ],
    menaApplication: 'In MENA, social approval is perhaps the most powerful brand feeling. Gulf consumers are highly influenced by what brands signal to their social circle. Luxury brands in Dubai and Riyadh leverage social approval heavily. In Egypt, warmth and national pride are powerful — brands like Fawry evoke feelings of Egyptian innovation and progress.'
  },
  {
    name: 'Brand Resonance',
    definition: 'The ULTIMATE level of brand equity — the depth of the psychological bond between customer and brand. This is where customers feel "in sync" with the brand.',
    subComponents: [
      'Behavioral Loyalty — Repeat purchase frequency and volume. Do customers keep coming back?',
      'Attitudinal Attachment — Emotional bond beyond just habit. Customers LOVE the brand, not just use it.',
      'Sense of Community — Feeling of kinship with other brand users. "We are part of something."',
      'Active Engagement — Customers invest time, energy, money beyond purchase. They advocate, create content, attend events.'
    ],
    brandExamples: [
      {
        brand: 'Apple',
        application: 'Apple achieves all 4 resonance dimensions: behavioral loyalty (92% retention), attitudinal attachment ("I love my iPhone"), sense of community (Apple ecosystem, WWDC), active engagement (Apple fans create content, wait in lines for launches).',
        numbers: 'Ecosystem retention: 92%. WWDC attendance: 6,000+ developers. Apple Store visits: 1B+ per year. Customer lifetime value: $14,000+.'
      },
      {
        brand: 'Harley-Davidson',
        application: 'Harley is the textbook example of brand resonance. H.O.G. creates community, rallies create engagement, tattoos represent ultimate attitudinal attachment — customers literally brand themselves.',
        numbers: 'H.O.G. members: 1M+. Sturgis Rally: 500,000+ attendees. 12% of Harley owners have a Harley tattoo. Repeat purchase rate: 67%.'
      }
    ],
    menaApplication: 'In MENA, brand resonance is achieved through community building. Careem built resonance through its "Captain" community and local cultural integration. Saudi Coffee Company (Barn\'s) achieved resonance by becoming part of Saudi daily ritual. In Egypt, Vodafone achieved resonance through its Ramadan campaigns that became cultural events.'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 2. BRAND RESONANCE PYRAMID (FULL MODEL)
// ═══════════════════════════════════════════════════════════════════════

export const BRAND_RESONANCE_PYRAMID = {
  description: 'The Brand Resonance Pyramid shows the sequential steps to build strong brand equity. You must build from the bottom up — you cannot skip levels.',
  levels: [
    {
      level: 1,
      name: 'Identity: Who Are You?',
      block: 'Brand Salience',
      question: 'Can customers identify the brand? Do they know what category it belongs to?',
      goal: 'Deep, broad brand awareness',
      metric: 'Aided/unaided recall, top-of-mind awareness',
      example: 'Coca-Cola: 94% global brand recognition. When you think "cola," Coca-Cola comes to mind first.'
    },
    {
      level: 2,
      name: 'Meaning: What Are You?',
      blocks: ['Brand Performance', 'Brand Imagery'],
      question: 'What does the brand stand for? What does it DO and what does it MEAN?',
      goal: 'Strong, favorable, unique brand associations',
      metric: 'Brand association maps, perceived quality scores',
      example: 'Nike: Performance = innovative athletic technology. Imagery = heroic achievement, "Just Do It" spirit.'
    },
    {
      level: 3,
      name: 'Response: What Do I Think/Feel About You?',
      blocks: ['Brand Judgments', 'Brand Feelings'],
      question: 'What are customers\' evaluations and emotional reactions?',
      goal: 'Positive, accessible reactions',
      metric: 'NPS, brand sentiment, emotional connection scores',
      example: 'Apple: Judgment = superior quality and innovation. Feelings = excitement, self-respect, social approval.'
    },
    {
      level: 4,
      name: 'Relationships: What About You and Me?',
      block: 'Brand Resonance',
      question: 'How deep is the customer-brand connection?',
      goal: 'Intense, active loyalty',
      metric: 'Retention rate, community size, advocacy rate, CLV',
      example: 'Harley-Davidson: Behavioral loyalty (67% repurchase) + Attitudinal attachment (tattoos) + Community (H.O.G. 1M members) + Active engagement (rallies, content creation).'
    }
  ],
  keyInsight: 'Most brands get stuck at Level 1-2. The real value is at Level 3-4. A brand at Level 4 can charge premium prices, survive crises, and grow through word-of-mouth. In MENA, social media accelerates the path from Level 1 to Level 4 — but also makes it easier to fall back down.'
};

// ═══════════════════════════════════════════════════════════════════════
// 3. THE GREAT DEBATE: SHARP vs KELLER
// ═══════════════════════════════════════════════════════════════════════

export const SHARP_VS_KELLER_DEBATE: AcademicDebate = {
  title: 'The Great Brand Debate: Byron Sharp vs Kevin Keller',
  side1: {
    theorist: 'Kevin Keller (Traditional Brand Equity)',
    position: 'Brand equity is built through meaningful differentiation. Strong brands create deep emotional connections with consumers through unique positioning, consistent messaging, and premium experiences. Brand loyalty is real and valuable.',
    evidence: [
      'Apple: Most valuable brand ($502.7B) built on differentiation and emotional connection',
      'Nike: "Just Do It" created $31.3B brand value through emotional positioning',
      'Starbucks: Premium pricing (5x local coffee) justified by brand experience and emotional attachment',
      'Luxury brands (Louis Vuitton, Chanel) prove differentiation drives premium pricing',
      'Brand loyalty programs generate measurable ROI — Starbucks Rewards drives 57% of US revenue'
    ]
  },
  side2: {
    theorist: 'Byron Sharp (How Brands Grow)',
    position: 'Differentiation is overrated. Brands grow primarily through mental availability (being easy to think of) and physical availability (being easy to buy). Most brand loyalty is just habitual behavior, not emotional attachment. Focus on reaching ALL category buyers, not just loyal ones.',
    evidence: [
      'Double Jeopardy Law: Small brands have fewer buyers who buy slightly less often — loyalty follows market share, not the reverse',
      'Duplication of Purchase Law: Brand sharing is proportional to market share — consumers are "polygamously loyal"',
      'Coca-Cola vs Pepsi: Blind taste tests show no real differentiation, yet Coca-Cola wins on mental/physical availability',
      'Ehrenberg-Bass data: Top 20% of buyers account for ~50% of sales (not 80% as Pareto suggests) — heavy buyers are unreliable',
      'Category Entry Points (Jenni Romaniuk): Brands grow by being linked to more buying situations, not by being "different"'
    ]
  },
  resolution: 'Both are right — in different contexts. Keller\'s model works best for: premium/luxury brands, high-involvement categories, B2B, services, and markets where emotional connection drives pricing power. Sharp\'s model works best for: FMCG, mass market, low-involvement categories, and markets where distribution and mental availability drive growth.',
  practicalGuide: `WHEN TO USE KELLER (Brand Equity Approach):
- Client is in luxury/premium segment → Build differentiation and emotional connection
- Client wants to justify premium pricing → Brand equity creates pricing power
- Client is in services/B2B → Trust and credibility matter more than availability
- Client has a small, defined target audience → Deep connection > broad reach
- Example: A premium Saudi restaurant chain → Keller approach (build unique brand story, emotional connection)

WHEN TO USE SHARP (Mental/Physical Availability):
- Client is in FMCG/mass market → Reach ALL category buyers
- Client wants market share growth → Distribution and mental availability first
- Client is launching in a new market → Build salience before differentiation
- Client has a large, diverse target audience → Broad reach > deep connection
- Example: A new Egyptian snack brand → Sharp approach (maximize distribution, build distinctive assets)

THE WZZRD AI SYNTHESIS:
For most MENA clients, we recommend a HYBRID approach:
1. Start with Sharp — build mental and physical availability first (you can't differentiate if nobody knows you exist)
2. Then layer Keller — once you have awareness, build emotional connections and premium positioning
3. Use Sharp's distinctive assets (not differentiation) to build mental availability
4. Use Keller's brand resonance to build pricing power and loyalty
This hybrid approach is especially effective in MENA where markets are rapidly growing (Sharp applies) but consumers are increasingly sophisticated and brand-conscious (Keller applies).`
};

// ═══════════════════════════════════════════════════════════════════════
// 4. KAPFERER DEEP DIVE — LUXURY STRATEGY ANTI-LAWS
// ═══════════════════════════════════════════════════════════════════════

export const KAPFERER_LUXURY_ANTI_LAWS = {
  title: 'Kapferer & Bastien\'s Anti-Laws of Luxury Marketing',
  source: 'The Luxury Strategy: Break the Rules of Marketing to Build Luxury Brands (2009)',
  keyInsight: 'Luxury brands operate by OPPOSITE rules to mass-market brands. What works for Coca-Cola will DESTROY Louis Vuitton.',
  antiLaws: [
    {
      law: 'Forget positioning — luxury is not comparative',
      explanation: 'Mass brands position against competitors. Luxury brands are ABSOLUTE — they don\'t compare themselves to anyone.',
      example: 'Rolex never says "better than Omega." They say "A Crown for Every Achievement." They are the benchmark, not a competitor.',
      menaApplication: 'Saudi luxury brands should never compare to competitors. Position as the ONLY choice, not the BEST choice.'
    },
    {
      law: 'Don\'t pander to customers\' wishes',
      explanation: 'Mass brands are market-driven (listen to customers). Luxury brands are vision-driven (lead customers). They create desire, not fulfill needs.',
      example: 'Apple under Steve Jobs: "People don\'t know what they want until you show it to them." iPhone had no keyboard when everyone wanted one.',
      menaApplication: 'In MENA, luxury brands should lead taste, not follow it. Don\'t do focus groups — create the vision.'
    },
    {
      law: 'Keep non-enthusiasts out',
      explanation: 'Mass brands want maximum reach. Luxury brands need exclusivity — if everyone can have it, nobody wants it.',
      example: 'Hermès Birkin: 2-6 year wait list. You can\'t just buy one — you must have a purchase history. This scarcity INCREASES demand.',
      menaApplication: 'Gulf luxury market thrives on exclusivity. Limited editions and VIP access are more effective than broad distribution.'
    },
    {
      law: 'Don\'t respond to rising demand',
      explanation: 'Mass brands scale production to meet demand. Luxury brands maintain scarcity — rarity is the essence of luxury.',
      example: 'Ferrari produces only ~14,000 cars/year despite demand for 5x more. This keeps prices and desirability high. Revenue: €5.97B (2023).',
      menaApplication: 'Saudi and UAE consumers value rarity. Limited production runs and exclusive launches drive more demand than mass availability.'
    },
    {
      law: 'The role of advertising is not to sell',
      explanation: 'Mass brand ads drive immediate sales. Luxury ads build the DREAM — they create a world, reinforce values, maintain desirability.',
      example: 'Chanel No. 5 ads feature art films with Nicole Kidman — they don\'t mention price, features, or where to buy. They sell the dream.',
      menaApplication: 'In MENA, luxury advertising should focus on storytelling and heritage, not promotions or discounts.'
    },
    {
      law: 'Raise prices to increase demand',
      explanation: 'Mass brands lower prices to increase demand. Luxury brands RAISE prices — higher price signals higher desirability.',
      example: 'Chanel has raised handbag prices by 60% since 2019. Result: demand INCREASED. Classic Flap went from $5,200 to $8,800. Revenue grew 49% to €19.7B (2023).',
      menaApplication: 'In the Gulf, price increases on luxury goods are seen as validation of quality. Saudi and UAE consumers expect luxury to be expensive.'
    }
  ]
};

export const KAPFERER_PRISM_DEEP: BuildingBlock[] = [
  {
    name: 'Physique',
    definition: 'The tangible, physical features of the brand — what it LOOKS like. This is the brand\'s body, its material basis.',
    subComponents: [
      'Logo and visual identity (colors, typography, design language)',
      'Product design and packaging',
      'Flagship product or service that embodies the brand',
      'Sensory elements (sound, smell, touch, taste associated with the brand)'
    ],
    brandExamples: [
      { brand: 'Louis Vuitton', application: 'The LV monogram, brown and gold color scheme, trunk-inspired designs. Every product is instantly recognizable.', numbers: 'Revenue: €86.2B (LVMH Group, 2023). LV alone estimated at €20B+. Most counterfeited brand in the world (sign of strong physique).' },
      { brand: 'Coca-Cola', application: 'The contour bottle, red and white colors, distinctive script logo. The brand is recognizable even without the name.', numbers: 'Contour bottle recognized by 99% of global consumers. Red color trademarked. $45.8B revenue (2023).' }
    ],
    menaApplication: 'In MENA, physique must work in both Arabic and English. Brands like Almarai have created strong bilingual visual identities. Saudi brands increasingly invest in premium packaging to match Gulf consumer expectations.'
  },
  {
    name: 'Personality',
    definition: 'The brand\'s CHARACTER — if it were a person, what would it be like? This is communicated through visual identity, tone of voice, and spokesperson.',
    subComponents: [
      'Brand voice and tone (formal, playful, authoritative, friendly)',
      'Spokesperson or brand ambassador personality',
      'Communication style across channels',
      'Aaker\'s 5 brand personality dimensions: Sincerity, Excitement, Competence, Sophistication, Ruggedness'
    ],
    brandExamples: [
      { brand: 'Apple', application: 'Personality: innovative, creative, minimalist, slightly rebellious. "Think Different" campaign defined the personality. Jony Ive\'s design philosophy became the brand\'s personality.', numbers: 'Brand personality consistency score: 95/100 across all touchpoints. $383.2B revenue driven by personality-aligned products.' },
      { brand: 'Harley-Davidson', application: 'Personality: rugged, rebellious, free-spirited, masculine. The brand personality is so strong that customers tattoo it on their bodies.', numbers: '12% of owners have Harley tattoos. Brand personality drives 92% repurchase intent.' }
    ],
    menaApplication: 'In MENA, brand personality must navigate cultural sensitivities. Humor works differently in Egypt (sarcastic, witty) vs Saudi (more reserved). Careem built a local personality — friendly, helpful, speaks Arabic naturally — while Uber felt "foreign."'
  },
  {
    name: 'Culture',
    definition: 'The brand\'s VALUE SYSTEM — the principles and ideals that drive everything it does. Often linked to country of origin.',
    subComponents: [
      'Core values and beliefs that guide the brand',
      'Country of origin and cultural heritage',
      'Founding story and mission',
      'How the brand sees the world (worldview)'
    ],
    brandExamples: [
      { brand: 'Mercedes-Benz', application: 'Culture: German engineering precision, "Das Beste oder nichts" (The best or nothing). Every product decision is filtered through this cultural lens.', numbers: 'Revenue: €153.2B (2023). Premium pricing justified by engineering culture. German origin adds 15-20% perceived value.' },
      { brand: 'Patagonia', application: 'Culture: environmental activism, sustainability, anti-consumerism. "Don\'t Buy This Jacket" campaign embodied the culture.', numbers: 'Revenue: $1.5B (2023). "Don\'t Buy This Jacket" ad increased sales 30%. 1% of sales donated to environment ($140M+ total).' }
    ],
    menaApplication: 'In MENA, culture is CRITICAL. Saudi brands can leverage Vision 2030 culture (innovation, openness, ambition). Egyptian brands can leverage 7,000 years of civilization. UAE brands can leverage the "nothing is impossible" culture. Country of origin matters — "Made in Germany" or "Made in Japan" adds perceived value.'
  },
  {
    name: 'Relationship',
    definition: 'The type of BOND between the brand and its customers. How does the brand interact with people?',
    subComponents: [
      'Transactional vs emotional relationship',
      'Power dynamic (brand leads vs brand serves)',
      'Community building and belonging',
      'Customer service philosophy'
    ],
    brandExamples: [
      { brand: 'Starbucks', application: 'Relationship: "Third Place" — not home, not work, but a comfortable space. Baristas write your name on cups. The relationship is personal and warm.', numbers: '75M Rewards members. 57% of US revenue from Rewards members. Average visit frequency: 6x/month for loyal customers.' },
      { brand: 'Amazon', application: 'Relationship: convenience and trust. "Earth\'s most customer-centric company." The relationship is built on reliability and ease.', numbers: '200M+ Prime members. Prime retention: 93% after first year. Customer satisfaction: 83/100.' }
    ],
    menaApplication: 'In MENA, relationships are deeply personal. Brands that build genuine relationships (not transactional) win. In Egypt, Vodafone\'s Ramadan campaigns created a cultural relationship. In Saudi, Jarir Bookstore built a trusted advisor relationship for electronics and books.'
  },
  {
    name: 'Reflection',
    definition: 'The brand\'s portrayal of its TARGET CUSTOMER — the idealized image of who uses this brand. Not the actual customer, but the ASPIRATIONAL customer.',
    subComponents: [
      'The idealized user profile shown in advertising',
      'The aspirational lifestyle associated with the brand',
      'How the brand wants its customers to be perceived by others',
      'The "tribe" or group identity the brand creates'
    ],
    brandExamples: [
      { brand: 'Nike', application: 'Reflection: elite athletes and determined individuals. Nike ads show professional athletes, not average gym-goers. The reflection is aspirational — "you could be like them."', numbers: 'Athlete endorsement spend: $1.5B/year. Michael Jordan deal: $1.3B lifetime value to Nike. Serena Williams, LeBron James, Cristiano Ronaldo — all reflect peak performance.' },
      { brand: 'BMW', application: 'Reflection: successful, dynamic professionals. "The Ultimate Driving Machine" reflects someone who values performance and has achieved success.', numbers: 'Average BMW buyer income: $150K+. Brand reflects success — 78% of BMW owners say the brand reflects their self-image.' }
    ],
    menaApplication: 'In MENA, reflection must be culturally appropriate. Saudi luxury brands reflect the modern Saudi professional (Vision 2030 generation). Egyptian brands increasingly reflect the ambitious young Egyptian entrepreneur. Gulf brands reflect cosmopolitan sophistication.'
  },
  {
    name: 'Self-Image',
    definition: 'How customers see THEMSELVES when they use the brand. This is the internal mirror — the brand makes them feel a certain way about themselves.',
    subComponents: [
      'How the brand makes the customer feel about themselves',
      'The internal narrative the customer tells themselves',
      'Self-concept reinforcement through brand usage',
      'Identity expression through brand choice'
    ],
    brandExamples: [
      { brand: 'Rolex', application: 'Self-image: "I am successful, I have achieved something." Wearing a Rolex is not about telling time — it\'s about telling yourself you\'ve made it.', numbers: 'Average Rolex price: $8,000-$12,000. Resale value often exceeds retail. Wait lists: 6-24 months. Revenue: ~$10B (2023).' },
      { brand: 'Patagonia', application: 'Self-image: "I am an environmentally conscious person." Wearing Patagonia tells yourself that you care about the planet and make responsible choices.', numbers: 'Revenue: $1.5B. 73% of customers say Patagonia reflects their environmental values. Brand loyalty: 89%.' }
    ],
    menaApplication: 'In MENA, self-image is powerfully linked to social status. Gulf consumers use luxury brands to reinforce self-image of success and sophistication. In Egypt, brands like Apple reinforce self-image of being modern and connected. Saudi youth use brand choices to express their identity in the new Saudi Arabia.'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 5. EHRENBERG-BASS SCIENTIFIC LAWS (DETAILED)
// ═══════════════════════════════════════════════════════════════════════

export const EHRENBERG_BASS_LAWS_DEEP = {
  institute: 'Ehrenberg-Bass Institute for Marketing Science, University of South Australia',
  keyResearchers: 'Andrew Ehrenberg, Byron Sharp, Jenni Romaniuk, John Dawes',
  corePhilosophy: 'Marketing should be based on empirical evidence, not theory or intuition. Most marketing "rules" are myths.',
  laws: [
    {
      name: 'Double Jeopardy Law',
      definition: 'Small brands suffer twice: they have fewer buyers AND those buyers buy slightly less often. Loyalty follows market share, not the reverse.',
      evidence: 'Validated across 50+ product categories in 25+ countries over 40+ years of data.',
      realData: 'UK laundry detergent: Persil (25% share) — 3.5 purchases/year. Surf (5% share) — 2.8 purchases/year. Small brands lose on BOTH penetration AND frequency.',
      implication: 'Don\'t try to increase loyalty of existing customers — focus on acquiring NEW customers. Growth comes from penetration, not frequency.',
      menaExample: 'In Egypt FMCG: Juhayna (large share) has both more buyers and higher frequency than smaller dairy brands. In Saudi telecom: STC (largest) has highest loyalty metrics — not because they\'re "better" but because they\'re biggest.'
    },
    {
      name: 'Duplication of Purchase Law',
      definition: 'Brands share customers in proportion to their market share. A brand\'s customers also buy from competitors at rates proportional to those competitors\' market shares.',
      evidence: 'Consumers are "polygamously loyal" — they have a repertoire of brands they buy from, not exclusive loyalty to one.',
      realData: 'UK cola market: 65% of Pepsi buyers also buy Coca-Cola. 45% of Coca-Cola buyers also buy Pepsi. The sharing is proportional to market share.',
      implication: 'Brand loyalty is largely a myth. Most "loyal" customers also buy competitors. Focus on being in more people\'s repertoire, not on exclusive loyalty.',
      menaExample: 'In UAE retail: Carrefour and Lulu shoppers overlap significantly. In Saudi food delivery: Jahez, HungerStation, and Talabat share customers proportionally to their market shares.'
    },
    {
      name: 'Natural Monopoly Law',
      definition: 'Larger brands attract a disproportionate share of light category buyers. Small brands are over-dependent on heavy category buyers.',
      evidence: 'Light buyers (who buy the category rarely) tend to choose the biggest brand when they do buy.',
      realData: 'In any category, the market leader gets 40-50% of light buyers but only 25-30% of heavy buyers. Light buyers default to the most available/salient brand.',
      implication: 'Growth comes from light buyers, not heavy buyers. Make your brand easy to think of and easy to buy for people who rarely buy your category.',
      menaExample: 'In Egypt, someone who rarely buys bottled water will default to Aquafina or Dasani (highest mental/physical availability). Niche water brands only attract heavy water buyers.'
    },
    {
      name: 'Pareto Reality (60/20, not 80/20)',
      definition: 'The top 20% of buyers account for about 50-60% of sales, NOT 80% as the Pareto principle suggests. Heavy buyers are also less reliable over time.',
      evidence: 'Ehrenberg-Bass data across hundreds of brands shows the 80/20 rule is a myth. Heavy buyers regress to the mean.',
      realData: 'Coca-Cola: Top 20% of buyers = 58% of volume (not 80%). Many "heavy" buyers in Year 1 become "light" buyers in Year 2. Regression to the mean is universal.',
      implication: 'Don\'t over-invest in heavy buyers. They\'re unreliable and will naturally buy less over time. Invest in reaching ALL category buyers.',
      menaExample: 'Saudi telecom: STC\'s heaviest data users in Q1 are not the same heavy users in Q4. Investing only in "VIP" customers misses the majority of revenue.'
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════
// 6. BEHAVIORAL ECONOMICS DEEP DIVE
// ═══════════════════════════════════════════════════════════════════════

export const BEHAVIORAL_ECONOMICS_DEEP = {
  kahneman: {
    title: 'Kahneman\'s System 1 & System 2 Applied to Branding',
    source: 'Thinking, Fast and Slow (2011)',
    systems: {
      system1: {
        name: 'System 1 (Fast Thinking)',
        characteristics: 'Automatic, effortless, emotional, associative, unconscious',
        brandingImplications: [
          'Brand recognition happens in System 1 — logos, colors, jingles are processed instantly',
          'First impressions of brands are System 1 judgments — emotional, not rational',
          'Distinctive brand assets (Sharp\'s concept) work because they trigger System 1 recognition',
          'Advertising that creates emotional associations works through System 1',
          'Most purchase decisions in supermarkets are System 1 — habitual, not deliberate'
        ],
        examples: [
          { brand: 'Coca-Cola', insight: 'Red color + contour bottle = instant System 1 recognition. No thinking required. This is why Coca-Cola spends $4B/year on advertising — to maintain System 1 associations.', numbers: '$4B annual ad spend. 94% global recognition. 2.2B daily servings.' },
          { brand: 'McDonald\'s', insight: 'Golden Arches trigger System 1 hunger response. The "I\'m Lovin\' It" jingle creates automatic positive association. Drive-through design optimizes for System 1 (fast, easy, no thinking).', numbers: '69M customers daily. Golden Arches recognized by 88% of global population. $23.2B revenue (2023).' }
        ]
      },
      system2: {
        name: 'System 2 (Slow Thinking)',
        characteristics: 'Deliberate, effortful, logical, conscious, analytical',
        brandingImplications: [
          'High-involvement purchases (cars, homes, B2B) engage System 2',
          'Brand comparisons, reviews, and research are System 2 activities',
          'Price-quality assessments are System 2 — but influenced by System 1 anchors',
          'Brand trust and credibility are System 2 evaluations built on System 1 impressions',
          'Complex brand messaging fails because System 2 is lazy — keep it simple'
        ],
        examples: [
          { brand: 'Tesla', insight: 'Car purchase engages System 2 (research, comparison, test drive). But Tesla\'s brand STARTS with System 1 (Elon Musk\'s persona, futuristic design, environmental virtue signaling).', numbers: 'Average car research time: 14 hours. Tesla consideration: 35% of EV intenders. Revenue: $96.8B (2023).' },
          { brand: 'B2B SaaS', insight: 'Enterprise software purchases are heavily System 2 (RFPs, demos, ROI calculations). But the initial consideration set is built by System 1 (brand awareness, peer recommendations, "safe choice" heuristic — "nobody got fired for buying IBM").', numbers: 'Average B2B buying cycle: 6-12 months. 5-7 decision makers involved. But 95% of B2B buyers are "out of market" at any time (Ehrenberg-Bass).' }
        ]
      }
    },
    menaApplication: 'In MENA, System 1 is heavily influenced by social media and word-of-mouth. Egyptian consumers make many purchase decisions based on System 1 (social proof from friends/family). Saudi consumers use System 2 more for luxury purchases but System 1 for daily brands. Understanding which system your brand operates in determines your entire marketing strategy.'
  },
  thaler: {
    title: 'Thaler\'s Nudge Theory & Mental Accounting for Brand Strategy',
    source: 'Nudge (2008) + Mental Accounting Matters (1999)',
    mentalAccounting: {
      definition: 'Consumers don\'t treat all money as fungible — they mentally categorize spending into separate "accounts" (food, entertainment, savings, luxury). This affects how they perceive prices and make purchase decisions.',
      principles: [
        {
          name: 'Segregate Gains',
          rule: 'Multiple small gains feel better than one large gain',
          brandApplication: 'Offer multiple small benefits instead of one big discount. "Free shipping + 10% off + free gift" feels better than "25% off."',
          example: 'Amazon Prime: Free shipping + Prime Video + Prime Music + Prime Reading. Each benefit feels like a separate gain. Result: 200M+ subscribers at $139/year.',
          menaExample: 'In Egypt, Noon.com offers "free delivery + cashback + Noon Minutes" — segregating gains to maximize perceived value in a price-sensitive market.'
        },
        {
          name: 'Integrate Losses',
          rule: 'One large loss feels better than multiple small losses',
          brandApplication: 'Bundle costs into a single payment. All-inclusive pricing reduces the "pain of paying" multiple times.',
          example: 'Apple\'s all-in-one pricing: iPhone includes hardware + software + ecosystem. No separate charges for iOS, iCloud (basic), or updates. One price, one loss.',
          menaExample: 'Saudi telecom bundles (STC Qitaf): combine data + calls + streaming into one monthly payment. Reduces multiple "pain points" to one.'
        },
        {
          name: 'Transaction Utility',
          rule: 'The perceived "deal" value matters as much as the actual product value',
          brandApplication: 'Create reference prices that make your actual price feel like a deal. Show the "was" price prominently.',
          example: 'The Economist\'s famous pricing: Print only ($125), Digital only ($59), Print + Digital ($125). The "decoy" (print only at same price as bundle) makes the bundle feel like an incredible deal. Subscriptions to bundle increased 62%.',
          menaExample: 'In Egypt, brands use "was 500 EGP, now 350 EGP" heavily because transaction utility is extremely powerful in inflation-conscious markets.'
        }
      ]
    },
    choiceArchitecture: {
      definition: 'The way choices are presented (the "choice architecture") significantly influences decisions. Small changes in how options are framed can dramatically change behavior.',
      nudges: [
        {
          name: 'Default Bias',
          principle: 'People tend to stick with the default option. The default is the most powerful nudge.',
          brandExample: 'Spotify defaults to auto-renewal. Netflix defaults to "Continue Watching." iPhone defaults to iCloud backup. These defaults drive massive retention.',
          numbers: 'Organ donation: Countries with opt-out default have 85-100% donation rates vs 4-27% for opt-in countries. Default power is enormous.',
          menaApplication: 'In MENA, subscription services should default to annual billing (higher LTV). E-commerce should default to "save payment method" for repeat purchases.'
        },
        {
          name: 'Social Proof',
          principle: 'People look to others\' behavior to guide their own decisions, especially in uncertain situations.',
          brandExample: 'Amazon: "Customers who bought this also bought..." Booking.com: "23 people are looking at this hotel right now." TripAdvisor: Star ratings and review counts.',
          numbers: 'Products with 50+ reviews convert 4.6x more than products with 0 reviews. 93% of consumers say online reviews impact their purchase decisions.',
          menaApplication: 'In MENA, social proof is EXTREMELY powerful. Egyptian consumers rely heavily on friend/family recommendations. Saudi consumers check Instagram influencer reviews. "Most popular" labels drive 30%+ more sales in Gulf e-commerce.'
        },
        {
          name: 'Anchoring in Pricing',
          principle: 'The first number people see becomes the "anchor" that influences all subsequent judgments.',
          brandExample: 'Starbucks: Venti ($5.95) anchors perception, making Grande ($4.95) seem reasonable. Apple: iPhone Pro Max ($1,199) anchors, making iPhone Pro ($999) seem like a deal.',
          numbers: 'Starbucks: 76% of customers order Grande (the "middle" option anchored by Venti). Apple: iPhone Pro outsells Pro Max 3:1 — the anchor works.',
          menaApplication: 'In Egypt, anchoring is critical in inflation context. Show the "premium" option first to make the standard option feel affordable. In Saudi luxury retail, high anchors validate premium positioning.'
        }
      ]
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get the full Keller CBBE deep dive formatted for the AI prompt
 */
export function getKellerDeepDive(): string {
  let output = `# KELLER'S CBBE MODEL — COMPLETE 6 BUILDING BLOCKS\n\n`;
  output += `## Brand Resonance Pyramid\n`;
  output += `${BRAND_RESONANCE_PYRAMID.description}\n\n`;
  
  for (const level of BRAND_RESONANCE_PYRAMID.levels) {
    output += `### Level ${level.level}: ${level.name}\n`;
    output += `- Question: ${level.question}\n`;
    output += `- Goal: ${level.goal}\n`;
    output += `- Metric: ${level.metric}\n`;
    output += `- Example: ${level.example}\n\n`;
  }
  output += `**Key Insight:** ${BRAND_RESONANCE_PYRAMID.keyInsight}\n\n`;
  
  output += `## The 6 Building Blocks in Detail\n\n`;
  for (const block of KELLER_BUILDING_BLOCKS) {
    output += `### ${block.name}\n`;
    output += `${block.definition}\n\n`;
    output += `**Sub-Components:**\n`;
    for (const sub of block.subComponents) {
      output += `- ${sub}\n`;
    }
    output += `\n**Brand Examples:**\n`;
    for (const ex of block.brandExamples) {
      output += `- **${ex.brand}:** ${ex.application} (${ex.numbers})\n`;
    }
    output += `\n**MENA Application:** ${block.menaApplication}\n\n`;
  }
  
  return output;
}

/**
 * Get the Sharp vs Keller debate formatted for the AI prompt
 */
export function getSharpVsKellerDebate(): string {
  const d = SHARP_VS_KELLER_DEBATE;
  let output = `# THE GREAT DEBATE: ${d.title}\n\n`;
  output += `## ${d.side1.theorist}\n`;
  output += `**Position:** ${d.side1.position}\n\n`;
  output += `**Evidence:**\n`;
  for (const e of d.side1.evidence) {
    output += `- ${e}\n`;
  }
  output += `\n## ${d.side2.theorist}\n`;
  output += `**Position:** ${d.side2.position}\n\n`;
  output += `**Evidence:**\n`;
  for (const e of d.side2.evidence) {
    output += `- ${e}\n`;
  }
  output += `\n## Resolution\n${d.resolution}\n\n`;
  output += `## Practical Guide for WZZRD AI\n${d.practicalGuide}\n\n`;
  return output;
}

/**
 * Get Kapferer deep dive including luxury anti-laws
 */
export function getKapfererDeepDive(): string {
  let output = `# KAPFERER'S BRAND IDENTITY PRISM — DEEP DIVE\n\n`;
  
  output += `## The 6 Facets in Detail\n\n`;
  for (const facet of KAPFERER_PRISM_DEEP) {
    output += `### ${facet.name}\n`;
    output += `${facet.definition}\n\n`;
    output += `**Sub-Components:**\n`;
    for (const sub of facet.subComponents) {
      output += `- ${sub}\n`;
    }
    output += `\n**Brand Examples:**\n`;
    for (const ex of facet.brandExamples) {
      output += `- **${ex.brand}:** ${ex.application} (${ex.numbers})\n`;
    }
    output += `\n**MENA Application:** ${facet.menaApplication}\n\n`;
  }
  
  output += `## ${KAPFERER_LUXURY_ANTI_LAWS.title}\n`;
  output += `*Source: ${KAPFERER_LUXURY_ANTI_LAWS.source}*\n`;
  output += `**Key Insight:** ${KAPFERER_LUXURY_ANTI_LAWS.keyInsight}\n\n`;
  for (const law of KAPFERER_LUXURY_ANTI_LAWS.antiLaws) {
    output += `### Anti-Law: ${law.law}\n`;
    output += `${law.explanation}\n`;
    output += `- **Example:** ${law.example}\n`;
    output += `- **MENA Application:** ${law.menaApplication}\n\n`;
  }
  
  return output;
}

/**
 * Get Ehrenberg-Bass laws deep dive
 */
export function getEhrenbergBassDeepDive(): string {
  const eb = EHRENBERG_BASS_LAWS_DEEP;
  let output = `# EHRENBERG-BASS SCIENTIFIC LAWS OF BRAND GROWTH\n`;
  output += `*${eb.institute}*\n`;
  output += `**Core Philosophy:** ${eb.corePhilosophy}\n\n`;
  
  for (const law of eb.laws) {
    output += `## ${law.name}\n`;
    output += `**Definition:** ${law.definition}\n`;
    output += `**Evidence:** ${law.evidence}\n`;
    output += `**Real Data:** ${law.realData}\n`;
    output += `**Implication:** ${law.implication}\n`;
    output += `**MENA Example:** ${law.menaExample}\n\n`;
  }
  
  return output;
}

/**
 * Get behavioral economics deep dive
 */
export function getBehavioralEconomicsDeepDive(): string {
  const be = BEHAVIORAL_ECONOMICS_DEEP;
  let output = `# BEHAVIORAL ECONOMICS FOR BRANDING & PRICING\n\n`;
  
  // Kahneman
  output += `## ${be.kahneman.title}\n`;
  output += `*Source: ${be.kahneman.source}*\n\n`;
  
  const s1 = be.kahneman.systems.system1;
  output += `### ${s1.name}\n`;
  output += `**Characteristics:** ${s1.characteristics}\n\n`;
  output += `**Branding Implications:**\n`;
  for (const imp of s1.brandingImplications) {
    output += `- ${imp}\n`;
  }
  output += `\n**Examples:**\n`;
  for (const ex of s1.examples) {
    output += `- **${ex.brand}:** ${ex.insight} (${ex.numbers})\n`;
  }
  
  const s2 = be.kahneman.systems.system2;
  output += `\n### ${s2.name}\n`;
  output += `**Characteristics:** ${s2.characteristics}\n\n`;
  output += `**Branding Implications:**\n`;
  for (const imp of s2.brandingImplications) {
    output += `- ${imp}\n`;
  }
  output += `\n**Examples:**\n`;
  for (const ex of s2.examples) {
    output += `- **${ex.brand}:** ${ex.insight} (${ex.numbers})\n`;
  }
  
  output += `\n**MENA Application:** ${be.kahneman.menaApplication}\n\n`;
  
  // Thaler
  output += `## ${be.thaler.title}\n`;
  output += `*Source: ${be.thaler.source}*\n\n`;
  
  output += `### Mental Accounting\n`;
  output += `${be.thaler.mentalAccounting.definition}\n\n`;
  for (const p of be.thaler.mentalAccounting.principles) {
    output += `#### ${p.name}\n`;
    output += `**Rule:** ${p.rule}\n`;
    output += `**Brand Application:** ${p.brandApplication}\n`;
    output += `**Example:** ${p.example}\n`;
    output += `**MENA Example:** ${p.menaExample}\n\n`;
  }
  
  output += `### Choice Architecture\n`;
  output += `${be.thaler.choiceArchitecture.definition}\n\n`;
  for (const n of be.thaler.choiceArchitecture.nudges) {
    output += `#### ${n.name}\n`;
    output += `**Principle:** ${n.principle}\n`;
    output += `**Brand Example:** ${n.brandExample}\n`;
    output += `**Numbers:** ${n.numbers}\n`;
    output += `**MENA Application:** ${n.menaApplication}\n\n`;
  }
  
  return output;
}

/**
 * Get ALL deep academic content formatted for the AI Brain
 */
export function getFullAcademicDeepDive(): string {
  let output = `# ═══════════════════════════════════════════════════════════════════════
# ACADEMIC DEEP DIVE — PhD-LEVEL BRAND STRATEGY KNOWLEDGE
# ═══════════════════════════════════════════════════════════════════════
# This is your DEEP knowledge base. Use it to:
# - Provide detailed, nuanced answers about brand strategy
# - Back every recommendation with specific frameworks and real numbers
# - Navigate academic debates (Sharp vs Keller) with practical wisdom
# - Apply behavioral economics to pricing and positioning recommendations
# - Reference luxury strategy anti-laws when working with premium brands
# ═══════════════════════════════════════════════════════════════════════\n\n`;
  
  output += getKellerDeepDive();
  output += getSharpVsKellerDebate();
  output += getKapfererDeepDive();
  output += getEhrenbergBassDeepDive();
  output += getBehavioralEconomicsDeepDive();
  
  return output;
}

/**
 * Get relevant deep content based on topic keywords
 */
export function getRelevantDeepContent(topic: string): string {
  const lower = topic.toLowerCase();
  let output = '';
  
  if (lower.includes('keller') || lower.includes('cbbe') || lower.includes('brand equity') || lower.includes('resonance') || lower.includes('building block') || lower.includes('salience') || lower.includes('brand awareness')) {
    output += getKellerDeepDive();
  }
  
  if (lower.includes('sharp') || lower.includes('how brands grow') || lower.includes('mental availability') || lower.includes('physical availability') || lower.includes('differentiation') || lower.includes('loyalty myth')) {
    output += getSharpVsKellerDebate();
  }
  
  if (lower.includes('kapferer') || lower.includes('prism') || lower.includes('brand identity') || lower.includes('luxury') || lower.includes('premium brand') || lower.includes('anti-law')) {
    output += getKapfererDeepDive();
  }
  
  if (lower.includes('ehrenberg') || lower.includes('double jeopardy') || lower.includes('duplication') || lower.includes('scientific law') || lower.includes('brand growth law')) {
    output += getEhrenbergBassDeepDive();
  }
  
  if (lower.includes('kahneman') || lower.includes('system 1') || lower.includes('system 2') || lower.includes('behavioral') || lower.includes('thaler') || lower.includes('nudge') || lower.includes('mental accounting') || lower.includes('anchoring') || lower.includes('loss aversion') || lower.includes('pricing psychology') || lower.includes('choice architecture') || lower.includes('framing')) {
    output += getBehavioralEconomicsDeepDive();
  }
  
  // If no specific match, return a summary
  if (!output) {
    output = `# Academic Frameworks Available for Deep Analysis\n\n`;
    output += `- **Keller's CBBE Model** — 6 building blocks, Brand Resonance Pyramid\n`;
    output += `- **Sharp vs Keller Debate** — When to use brand equity vs mental availability\n`;
    output += `- **Kapferer's Brand Identity Prism** — 6 facets + Luxury Strategy Anti-Laws\n`;
    output += `- **Ehrenberg-Bass Laws** — Double Jeopardy, Duplication of Purchase, Pareto Reality\n`;
    output += `- **Behavioral Economics** — Kahneman System 1/2, Thaler Nudge Theory, Mental Accounting\n`;
  }
  
  return output;
}
