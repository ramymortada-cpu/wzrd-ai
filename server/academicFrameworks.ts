/**
 * ═══════════════════════════════════════════════════════════════════════
 * PRIMO MARCA AI BRAIN — ACADEMIC FRAMEWORKS & REAL-WORLD EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 10 deep academic frameworks with real-world examples, MENA applications,
 * and practical consultant talking points. Each framework includes:
 * - Full academic depth (creator, components, application steps)
 * - 3+ global examples with real numbers
 * - 2+ MENA/Arab world examples
 * - Practical agency application
 * - Counter-arguments and limitations
 * 
 * Sources: Academic publications, industry reports, company financials
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface RealWorldExample {
  brand: string;
  context: string;
  strategy: string;
  results: string;
  numbers: string;
  region: 'global' | 'mena' | 'egypt' | 'ksa' | 'uae';
}

export interface AcademicFramework {
  id: string;
  name: string;
  creator: string;
  year: string;
  category: 'brand_identity' | 'brand_growth' | 'behavioral_economics' | 'competitive_strategy' | 'pricing' | 'customer_experience';
  oneLiner: string;
  components: string[];
  deepExplanation: string;
  applicationSteps: string[];
  commonMistakes: string[];
  examples: RealWorldExample[];
  clientTalkingPoints: string[];
  counterArguments: string;
  connectionToOtherFrameworks: string;
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 1: KAPFERER'S BRAND IDENTITY PRISM
// ═══════════════════════════════════════════════════════════════════════

const KAPFERER_PRISM: AcademicFramework = {
  id: 'kapferer_prism',
  name: "Kapferer's Brand Identity Prism",
  creator: 'Jean-Noël Kapferer',
  year: '1986',
  category: 'brand_identity',
  oneLiner: 'A hexagonal model that defines brand identity through 6 facets: Physique, Personality, Culture, Relationship, Reflection, and Self-image.',
  components: [
    'Physique — The tangible, physical features of the brand (logo, colors, packaging, product design). What the brand LOOKS like.',
    'Personality — The brand\'s character traits as if it were a person. How the brand SPEAKS and BEHAVES.',
    'Culture — The set of values and principles that drive the brand. The brand\'s BELIEF SYSTEM.',
    'Relationship — The type of relationship the brand establishes with its customers. How the brand CONNECTS.',
    'Reflection — The image of the ideal customer as portrayed by the brand. Who the brand SHOWS.',
    'Self-image — How customers see themselves when using the brand. How customers FEEL about themselves.',
  ],
  deepExplanation: `Kapferer's Brand Identity Prism, introduced in 1986 by French marketing professor Jean-Noël Kapferer in his book "Strategic Brand Management," is one of the most comprehensive frameworks for defining and analyzing brand identity. Unlike simpler models that focus only on visual identity or positioning, the Prism captures the full complexity of a brand through six interconnected facets arranged in a hexagonal shape.

The Prism is organized along two axes:
- VERTICAL AXIS: Externalization (Physique, Relationship, Reflection) vs. Internalization (Personality, Culture, Self-image)
- HORIZONTAL AXIS: Sender (Physique, Personality) vs. Receiver (Reflection, Self-image), with Culture and Relationship as the bridge

KEY INSIGHT: A strong brand has alignment across all 6 facets. When facets contradict each other, the brand feels inauthentic. For example, a brand claiming "premium culture" but with "cheap physique" creates cognitive dissonance.

WHY THIS MATTERS FOR PRIMO MARCA: Most clients come with misaligned prisms — they want to be "premium" but their visual identity says "budget." The Prism makes this gap visible and actionable.`,
  applicationSteps: [
    'Audit the current state of each facet — what does the brand currently project?',
    'Define the desired state — what should each facet communicate?',
    'Identify gaps between current and desired states',
    'Prioritize: fix the most damaging misalignment first (usually Physique or Culture)',
    'Create an action plan for each facet with specific deliverables',
    'Test with real customers — does the intended identity match perceived identity?',
  ],
  commonMistakes: [
    'Confusing Reflection (who the brand portrays) with Self-image (how customers feel) — these are related but different',
    'Being too aspirational — the identity must be grounded in what the brand can actually deliver',
    'Ignoring internal facets (Personality, Culture) and focusing only on external (Physique, Reflection)',
    'Treating the Prism as a one-time exercise instead of a living document',
    'Failing to involve the entire organization — brand identity is not just marketing\'s job',
  ],
  examples: [
    {
      brand: 'Louis Vuitton',
      context: 'Luxury fashion house maintaining identity across global expansion',
      strategy: 'Perfect alignment across all 6 facets: iconic LV monogram (Physique), sophisticated elegance (Personality), French heritage and craftsmanship (Culture), exclusive club membership (Relationship), affluent global traveler (Reflection), successful and accomplished (Self-image)',
      results: 'LVMH Fashion & Leather Goods recorded 14% organic revenue growth in 2023',
      numbers: 'LVMH revenue €86.2B (2023), Louis Vuitton estimated brand value $19.4B',
      region: 'global',
    },
    {
      brand: 'Dove',
      context: 'Repositioning from commodity soap to purpose-driven beauty brand',
      strategy: 'Shifted Self-image facet from "beauty standards conformity" to "real beauty acceptance." Campaign for Real Beauty (2004) redefined Reflection from supermodels to real women.',
      results: 'Sales grew from $2.5B to $4B+ in first 10 years of the campaign. Brand became #1 in personal care.',
      numbers: 'Sales increase from $2.5B to $4B+, 60% increase in brand value',
      region: 'global',
    },
    {
      brand: 'Apple',
      context: 'Building the most valuable brand identity in tech',
      strategy: 'Physique (minimalist design), Personality (innovative rebel), Culture (think different), Relationship (empowerment), Reflection (creative professional), Self-image (I am creative and forward-thinking)',
      results: 'Most valuable brand in the world. Premium pricing maintained across all product lines.',
      numbers: 'Brand value $880B+ (2024), 60%+ gross margins on hardware',
      region: 'global',
    },
    {
      brand: 'Emirates Airlines',
      context: 'Building a global luxury airline brand from a regional carrier',
      strategy: 'Physique (gold and burgundy livery, A380 fleet), Personality (warm luxury), Culture (Emirati hospitality meets global sophistication), Relationship (making every passenger feel like royalty), Reflection (the global business traveler), Self-image (I deserve the best)',
      results: 'Became world\'s largest international airline. Brand value $7.7B.',
      numbers: 'Revenue AED 137.3B (2024), brand value $7.7B, serves 150+ destinations',
      region: 'mena',
    },
    {
      brand: 'Almarai',
      context: 'Building the Middle East\'s most trusted food brand',
      strategy: 'Physique (green packaging, fresh imagery), Personality (reliable, wholesome), Culture (quality first — "Quality you can trust"), Relationship (family nourishment), Reflection (the caring parent), Self-image (I provide the best for my family)',
      results: 'Largest vertically integrated dairy company in the world. Dominant market share across GCC.',
      numbers: 'Revenue SAR 22.3B (2023), 2,200+ SKUs, operations in 6 countries',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Your brand is more than a logo — it\'s a system of 6 interconnected facets. When they\'re aligned, customers feel it instinctively. When they\'re not, something feels "off" even if they can\'t explain why.',
    'Let me show you how Louis Vuitton maintains $19.4B in brand value — every facet of their identity reinforces the same message. That\'s what we need to build for you.',
    'The biggest gap I see in your brand is between [facet X] and [facet Y]. Your visual identity says one thing, but your customer experience says another. That\'s costing you premium pricing power.',
  ],
  counterArguments: `Critics argue the Prism is too complex for small brands and that not all 6 facets are equally important. Some argue it's better suited for luxury brands than mass-market ones. Sharp (2010) argues that brand identity matters less than mental and physical availability. However, for premium brands and brand repositioning — which is WZZRD AI's core work — the Prism remains the gold standard for identity analysis.`,
  connectionToOtherFrameworks: 'Connects to Aaker\'s Brand Personality (expands the Personality facet), Keller\'s CBBE (builds the foundation for brand knowledge), and Sharp\'s distinctiveness (Physique facet is essentially distinctiveness assets).',
  tags: ['brand_identity', 'luxury', 'premium', 'repositioning', 'visual_identity', 'brand_audit'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 2: SHARP'S "HOW BRANDS GROW"
// ═══════════════════════════════════════════════════════════════════════

const SHARP_HOW_BRANDS_GROW: AcademicFramework = {
  id: 'sharp_how_brands_grow',
  name: "Byron Sharp's How Brands Grow",
  creator: 'Byron Sharp / Ehrenberg-Bass Institute',
  year: '2010',
  category: 'brand_growth',
  oneLiner: 'Brands grow primarily by increasing mental availability (being thought of) and physical availability (being easy to buy), not through loyalty programs or differentiation.',
  components: [
    'Mental Availability — How easily and in how many buying situations the brand comes to mind. Built through distinctive brand assets and broad reach.',
    'Physical Availability — How easy it is to find and buy the brand. Distribution, shelf space, digital presence.',
    'Distinctive Brand Assets — Unique sensory cues (colors, logos, sounds, shapes) that make the brand instantly recognizable WITHOUT needing the brand name.',
    'Double Jeopardy Law — Small brands suffer twice: fewer buyers AND those buyers are slightly less loyal.',
    'Duplication of Purchase Law — Brands share customers with competitors in proportion to market share, not based on positioning similarity.',
    'Natural Monopoly Law — Bigger brands have a natural advantage in light buyer penetration.',
  ],
  deepExplanation: `Byron Sharp's "How Brands Grow" (2010), based on decades of research at the Ehrenberg-Bass Institute at the University of South Australia, fundamentally challenges traditional marketing wisdom. The book presents evidence-based "laws" of marketing that contradict many commonly held beliefs.

KEY CONTRARIAN FINDINGS:
1. DIFFERENTIATION IS OVERRATED: Brands don't grow by being "different" — they grow by being DISTINCTIVE (easily recognized) and AVAILABLE (easy to buy). Most consumers can't articulate meaningful differences between competing brands.

2. LOYALTY PROGRAMS DON'T WORK: Most loyalty programs reward already-loyal customers without changing behavior. Brands grow by acquiring NEW light buyers, not by making existing buyers more loyal.

3. TARGETING IS WASTEFUL: Mass marketing to all category buyers is more effective than targeting narrow segments. "Sophisticated targeting" often means "reaching fewer people."

4. BRAND LOVE IS RARE: Most customers are indifferent to most brands. They buy based on habit and availability, not emotional connection. Even Apple's "fanboys" are a tiny fraction of their customer base.

WHY THIS MATTERS FOR PRIMO MARCA: This framework is essential for challenging clients who want to "find their niche" when they should be broadening their reach. It's also crucial for social media strategy — reach matters more than engagement rate.`,
  applicationSteps: [
    'Audit distinctive brand assets — can customers identify your brand without seeing the name?',
    'Measure mental availability — in how many buying situations does your brand come to mind?',
    'Map physical availability — where can customers buy? What\'s the friction?',
    'Identify light buyers — who buys your category but not your brand? How do you reach them?',
    'Build distinctive assets — invest in consistent, unique sensory cues across all touchpoints',
    'Broaden reach — prioritize reach over frequency in media planning',
  ],
  commonMistakes: [
    'Confusing distinctiveness with differentiation — you don\'t need to be "different," you need to be RECOGNIZABLE',
    'Over-investing in loyalty programs instead of acquisition',
    'Targeting too narrowly — missing the vast majority of potential buyers',
    'Changing brand assets too frequently — consistency builds mental availability',
    'Measuring engagement instead of reach — a viral post with 10K likes from existing fans is worth less than a boring ad seen by 1M new people',
  ],
  examples: [
    {
      brand: 'Coca-Cola',
      context: 'Maintaining global dominance through mental and physical availability',
      strategy: 'Coca-Cola doesn\'t try to be "different" from Pepsi — it focuses on being EVERYWHERE (physical availability) and ALWAYS top-of-mind (mental availability). The red color, contour bottle, and Spencerian script are distinctive assets recognized by 94% of the world.',
      results: 'Sold 2B+ servings daily. "Share a Coke" campaign (personalized bottles) increased consumption by 7% in Australia.',
      numbers: 'Net revenue $45.8B (2023), brand recognized by 94% of world population, 200+ countries',
      region: 'global',
    },
    {
      brand: 'Old Spice',
      context: 'Reviving a dying brand through broad reach, not niche targeting',
      strategy: 'Instead of targeting young men specifically, Old Spice created "The Man Your Man Could Smell Like" campaign that reached EVERYONE — including women who buy body wash for men. This massively expanded mental availability.',
      results: 'Sales increased 107% in the year following the campaign. Brand went from "grandpa\'s aftershave" to cultural phenomenon.',
      numbers: '107% sales increase, 1.4B impressions, 27% market share increase',
      region: 'global',
    },
    {
      brand: 'P&G (Tide)',
      context: 'Using distinctive assets and physical availability to dominate laundry',
      strategy: 'The orange Tide bottle and bullseye logo are distinctive assets. P&G ensures Tide is available in every store format from Walmart to dollar stores. They don\'t try to be "premium only" — they want ALL laundry buyers.',
      results: 'Tide maintains 30%+ market share in US laundry — more than the next 3 competitors combined.',
      numbers: '30%+ US market share, $4.5B+ annual revenue, available in 99% of US retail outlets',
      region: 'global',
    },
    {
      brand: 'Noon',
      context: 'Building mental availability in MENA e-commerce against Amazon',
      strategy: 'Noon\'s yellow branding is a distinctive asset in a market where Amazon uses blue/orange. Their "Noon Minutes" (quick delivery) builds physical availability. Arabic-first approach and local payment methods (cash on delivery) remove friction.',
      results: 'Became the largest homegrown e-commerce platform in MENA. Processes 2M+ orders monthly.',
      numbers: 'Valued at $1B+, 2M+ monthly orders, 40M+ products, operates in UAE, KSA, Egypt',
      region: 'mena',
    },
    {
      brand: 'Talabat',
      context: 'Dominating MENA food delivery through physical availability',
      strategy: 'Talabat\'s orange branding and distinctive logo are recognized across 9 MENA countries. They prioritize restaurant coverage (physical availability) — if a restaurant isn\'t on Talabat, it doesn\'t exist for many consumers.',
      results: 'Operates in 9 countries, dominant market share in GCC food delivery.',
      numbers: '9 countries, 50,000+ restaurant partners, acquired by Delivery Hero for $172M',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Here\'s a hard truth: your brand doesn\'t need to be "different" — it needs to be RECOGNIZABLE and EASY TO BUY. Coca-Cola isn\'t different from Pepsi in a blind taste test, but it outsells Pepsi 2:1 because it\'s everywhere and always top-of-mind.',
    'Your loyalty program is rewarding people who would buy anyway. The real growth comes from reaching the 80% of category buyers who DON\'T know you exist yet.',
    'Let me ask you: if I removed your logo from your packaging, could customers still identify your brand? If not, you don\'t have distinctive brand assets — and that\'s the #1 thing we need to fix.',
  ],
  counterArguments: `Sharp's work is controversial. Critics argue it applies mainly to FMCG (fast-moving consumer goods) and may not work for luxury, B2B, or niche brands. Mark Ritson argues that Sharp oversimplifies and that targeting + differentiation still matter for premium brands. The truth is nuanced: for mass-market brands, Sharp is largely right. For premium/luxury brands (WZZRD AI's sweet spot), Kapferer's identity approach is more relevant, but Sharp's emphasis on distinctive assets and reach still applies.`,
  connectionToOtherFrameworks: 'Directly challenges Keller\'s CBBE (brand knowledge matters less than availability), complements Kapferer\'s Physique facet (distinctive assets), and contradicts Porter\'s differentiation strategy for mass markets.',
  tags: ['brand_growth', 'mental_availability', 'physical_availability', 'distinctive_assets', 'mass_market', 'reach'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 3: KAHNEMAN'S BEHAVIORAL ECONOMICS
// ═══════════════════════════════════════════════════════════════════════

const KAHNEMAN_BEHAVIORAL_ECONOMICS: AcademicFramework = {
  id: 'kahneman_behavioral_economics',
  name: "Kahneman's Behavioral Economics for Branding & Pricing",
  creator: 'Daniel Kahneman & Amos Tversky',
  year: '1979 (Prospect Theory), 2011 (Thinking, Fast and Slow)',
  category: 'behavioral_economics',
  oneLiner: 'Humans make irrational, predictable decisions based on cognitive biases — anchoring, loss aversion, framing, and the endowment effect — which brands can ethically leverage.',
  components: [
    'Anchoring Effect — People rely heavily on the first piece of information (the "anchor") when making decisions. A $500 jacket makes a $200 jacket seem reasonable.',
    'Loss Aversion — Losses hurt 2x more than equivalent gains feel good. "Don\'t miss out" is more powerful than "You could gain."',
    'Framing Effect — How information is presented changes decisions. "90% fat-free" vs "10% fat" — same product, different perception.',
    'Endowment Effect — People value things more once they own them. Free trials work because giving up feels like a loss.',
    'Status Quo Bias — People prefer the current state of affairs. Switching costs are psychological, not just financial.',
    'Decoy Effect — Adding a third "decoy" option makes one of the other two look more attractive. Starbucks Grande exists to sell Venti.',
  ],
  deepExplanation: `Daniel Kahneman (Nobel Prize in Economics, 2002) and Amos Tversky revolutionized our understanding of human decision-making with Prospect Theory (1979) and decades of research on cognitive biases. Their work, popularized in "Thinking, Fast and Slow" (2011), shows that humans have two thinking systems:

SYSTEM 1: Fast, automatic, emotional, intuitive — makes 95% of our decisions
SYSTEM 2: Slow, deliberate, logical, effortful — only engaged for complex problems

KEY INSIGHT FOR BRANDING: Most brand decisions are made by System 1. Customers don't rationally compare features — they go with what FEELS right. This means:
- Brand perception matters more than product specs
- Price perception matters more than actual price
- Emotional associations drive purchase more than rational benefits

THE PRICING REVOLUTION:
1. ANCHORING: Apple launches iPhone Pro Max at $1,199 — making the $799 iPhone seem like a "deal." Without the anchor, $799 feels expensive.
2. LOSS AVERSION: "Limited time offer" works because the fear of LOSING the deal is 2x stronger than the desire to SAVE money.
3. DECOY EFFECT: Starbucks Tall ($3.95), Grande ($4.45), Venti ($4.95). Grande exists to make Venti look like better value — the 50¢ difference for 4 more oz is irresistible.

WHY THIS MATTERS FOR PRIMO MARCA: Every proposal, every pricing page, every client conversation uses these principles. When we present 3 packages (Clarity, Foundation, Growth), the middle one is the anchor that makes the premium one feel justified.`,
  applicationSteps: [
    'Audit current pricing presentation — is there an anchor? Is the most expensive option shown first?',
    'Design 3-tier pricing with a strategic decoy — the middle tier should make the top tier look like better value',
    'Frame all messaging positively — "95% customer satisfaction" not "5% complaints"',
    'Use loss aversion in proposals — "Every month without a brand strategy costs you X in lost revenue"',
    'Create endowment through trials — let clients experience a mini-version of your service before committing',
    'Leverage status quo bias — make switching FROM you feel costly (through deep integration and relationships)',
  ],
  commonMistakes: [
    'Unrealistic anchors — if the anchor is too high, it destroys trust instead of creating value perception',
    'Overusing scarcity — constant "limited time" offers create fatigue and skepticism',
    'Inauthentic framing — customers detect manipulation and it damages brand trust',
    'Ignoring cultural context — loss aversion and anchoring work differently in collectivist vs individualist cultures',
    'Forgetting ethics — these tools should enhance value perception, not deceive customers',
  ],
  examples: [
    {
      brand: 'Apple',
      context: 'Using anchoring to maintain premium pricing across product lines',
      strategy: 'iPhone Pro Max ($1,199) anchors the entire lineup. The standard iPhone ($799) feels like a "smart choice." Apple Watch Ultra ($799) anchors Watch SE ($249) as affordable. Every product line has a premium anchor.',
      results: 'Apple maintains 60%+ gross margins while competitors struggle at 20-30%. Customers perceive Apple as "worth it" despite higher prices.',
      numbers: 'iPhone Pro Max $1,199, Standard iPhone $799, 87% of US teen smartphone market, 60%+ gross margins',
      region: 'global',
    },
    {
      brand: 'Starbucks',
      context: 'Using the decoy effect and premium framing to charge 5x local coffee',
      strategy: 'Tall ($3.95), Grande ($4.45), Venti ($4.95) — the Grande is the decoy. The 50¢ jump from Grande to Venti for 4 more oz makes Venti feel like the "smart" choice. The entire experience (store design, cup size names, barista ritual) frames coffee as a premium experience, not a commodity.',
      results: 'Average ticket $5.55. Customers pay 5x more than local coffee shops. 35,000+ stores globally.',
      numbers: 'Revenue $36B (2023), average ticket $5.55, 35,000+ stores, 75M reward members',
      region: 'global',
    },
    {
      brand: 'The Economist',
      context: 'Classic decoy pricing experiment',
      strategy: 'Offered 3 options: Web-only ($59), Print-only ($125), Web+Print ($125). The Print-only option is the decoy — nobody wants it, but it makes Web+Print look like an incredible deal (you get web FREE). Without the decoy, most chose web-only.',
      results: 'With decoy: 84% chose Web+Print ($125). Without decoy: 68% chose Web-only ($59). Revenue increased 43% just by adding the decoy.',
      numbers: '43% revenue increase from adding a decoy option, 84% chose premium bundle',
      region: 'global',
    },
    {
      brand: 'Juhayna (Egypt)',
      context: 'Using anchoring and framing in Egypt\'s price-sensitive dairy market',
      strategy: 'Juhayna introduced premium "Pure" line at higher prices, which anchored the regular line as "affordable quality." Framing shifted from "cheap milk" to "trusted nutrition for your family." Loss aversion messaging: "Don\'t compromise on your family\'s health."',
      results: 'Maintained market leadership despite intense price competition. Premium line grew 15%+ annually.',
      numbers: 'Revenue EGP 19.8B (2023), 35% market share in dairy, premium line 15%+ annual growth',
      region: 'egypt',
    },
    {
      brand: 'Gourmet Egypt',
      context: 'Premium positioning in a price-sensitive market using behavioral economics',
      strategy: 'Gourmet Egypt positions itself as the premium grocery experience. Store design, product curation, and pricing all create a "premium frame." Their in-house products have 50% gross margins because the store environment anchors expectations. E-commerce (35% of sales) uses the endowment effect — once customers experience Gourmet delivery, switching to cheaper alternatives feels like a loss.',
      results: 'Successfully maintained premium positioning in Egypt\'s challenging economic environment.',
      numbers: '50% gross margin on in-house products, e-commerce 35% of total sales, new stores ROI in 18 months',
      region: 'egypt',
    },
  ],
  clientTalkingPoints: [
    'Your customers don\'t make rational decisions — and that\'s good news. It means we can ethically shape how they perceive your value. Right now, your pricing has no anchor — customers are comparing you to the cheapest option. We need to change that.',
    'Here\'s why Starbucks charges 5x more than the coffee shop next door: it\'s not the coffee, it\'s the FRAME. The store design, the cup sizes, the barista ritual — everything says "this is premium." We need to build that frame for your brand.',
    'Every month you operate without a clear brand strategy, you\'re losing money to competitors who understand pricing psychology. That\'s not a scare tactic — it\'s loss aversion, and it\'s real. Let me show you the numbers.',
  ],
  counterArguments: `Critics argue that behavioral economics can be manipulative and that "nudging" customers crosses ethical lines. Richard Thaler (co-author of "Nudge") distinguishes between "libertarian paternalism" (helping people make better choices) and manipulation. For WZZRD AI, the ethical line is clear: use these principles to help clients communicate their TRUE value, not to deceive. If a brand genuinely delivers premium quality, anchoring and framing help customers recognize that value.`,
  connectionToOtherFrameworks: 'Directly supports Premium Pricing Psychology (Veblen goods, price-quality heuristic), complements Cialdini\'s Influence principles (scarcity = loss aversion), and explains why Sharp\'s distinctive assets work (System 1 recognition).',
  tags: ['pricing', 'behavioral_economics', 'anchoring', 'loss_aversion', 'premium', 'proposals', 'psychology'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 4: CIALDINI'S PRINCIPLES OF INFLUENCE
// ═══════════════════════════════════════════════════════════════════════

const CIALDINI_INFLUENCE: AcademicFramework = {
  id: 'cialdini_influence',
  name: "Cialdini's 6 Principles of Influence",
  creator: 'Robert Cialdini',
  year: '1984 (Influence), 2016 (Pre-Suasion)',
  category: 'behavioral_economics',
  oneLiner: '6 universal principles that drive human compliance: Reciprocity, Commitment/Consistency, Social Proof, Authority, Liking, and Scarcity.',
  components: [
    'Reciprocity — People feel obligated to return favors. Give value first, and clients feel compelled to reciprocate.',
    'Commitment & Consistency — Once people commit to something (even small), they\'ll act consistently with that commitment.',
    'Social Proof — People look to others\' behavior to determine their own. "50,000 businesses trust us" is powerful.',
    'Authority — People defer to experts and credible sources. Credentials, publications, and thought leadership build authority.',
    'Liking — People say yes to those they like. Similarity, compliments, and cooperation increase liking.',
    'Scarcity — Things become more desirable when they\'re rare or diminishing. "Only 3 spots left this quarter."',
  ],
  deepExplanation: `Robert Cialdini's "Influence: The Psychology of Persuasion" (1984) identified 6 universal principles that explain why people say "yes." Based on years of undercover research in sales, marketing, and compliance situations, these principles are deeply embedded in human psychology and work across cultures.

FOR BRAND STRATEGY, each principle has specific applications:

RECIPROCITY IN BRANDING: WZZRD AI's Quick-Check tool is pure reciprocity — give a free brand health diagnosis, and prospects feel obligated to engage further. Content marketing (free guides, webinars, insights) works the same way.

SOCIAL PROOF IN MENA: In collectivist cultures like Egypt and KSA, social proof is EVEN MORE POWERFUL than in Western markets. Family recommendations, community endorsements, and visible success stories carry enormous weight.

SCARCITY FOR PREMIUM BRANDS: Hermès Birkin bag has a 6-year waiting list — and that waiting list IS the product. The scarcity creates the desire. For agencies, "we only take 5 new clients per quarter" creates similar dynamics.

AUTHORITY IN CONSULTING: WZZRD AI's academic frameworks, published methodology, and case studies all build authority. When the AI Brain cites Kapferer and Kahneman, it signals expertise that justifies premium pricing.`,
  applicationSteps: [
    'Reciprocity: Create a free value-first touchpoint (Quick-Check, free audit, insights report)',
    'Commitment: Get small commitments first (newsletter signup → free consultation → paid project)',
    'Social Proof: Collect and display testimonials, case studies, client logos, and success metrics',
    'Authority: Publish thought leadership, cite academic frameworks, display credentials',
    'Liking: Build rapport through shared values, cultural understanding, and genuine interest',
    'Scarcity: Limit availability genuinely — "We take 5 new clients per quarter to maintain quality"',
  ],
  commonMistakes: [
    'Fake scarcity — customers detect inauthentic urgency and it destroys trust',
    'Social proof without specifics — "Trusted by thousands" is weak; "Trusted by 847 businesses in Egypt" is strong',
    'Authority without substance — credentials mean nothing if the work doesn\'t deliver',
    'Reciprocity without genuine value — a "free" consultation that\'s really a sales pitch backfires',
    'Overusing any single principle — the most effective approach combines multiple principles naturally',
  ],
  examples: [
    {
      brand: 'Hermès (Birkin Bag)',
      context: 'Using scarcity to create the most desirable luxury item in the world',
      strategy: 'You can\'t just buy a Birkin — you must build a purchase history with Hermès, be "offered" the opportunity, and wait years. The scarcity is real and creates a secondary market where bags sell for 2-3x retail.',
      results: 'Birkin bags appreciate 14% annually — outperforming the S&P 500. Hermès revenue grew 21% in 2023.',
      numbers: 'Birkin bags start at $10,000, resale up to $500,000, 14% annual appreciation, Hermès revenue €13.4B (2023)',
      region: 'global',
    },
    {
      brand: 'Apple',
      context: 'Combining all 6 principles in product launches',
      strategy: 'Reciprocity (free ecosystem integration), Commitment (once you buy one Apple product, you\'re in), Social Proof (everyone has an iPhone), Authority (innovation leader), Liking (Steve Jobs\' charisma, Apple Store experience), Scarcity (launch day lines, limited initial supply).',
      results: 'Most valuable company in the world. Customers wait in line for products they haven\'t even seen.',
      numbers: 'Market cap $3T+, 1.5B active devices, 92% customer retention rate',
      region: 'global',
    },
    {
      brand: 'Abdul Samad Al Qurashi',
      context: 'Using scarcity and authority in MENA luxury perfume market',
      strategy: 'Limited-edition seasonal perfumes (scarcity), centuries-old heritage (authority), celebrity endorsements (social proof), personalized blending experience (liking through customization), gift sets that create reciprocity in Arab gift-giving culture.',
      results: 'Premium positioning maintained across GCC with prices 10-50x mass-market perfumes.',
      numbers: 'Some oud perfumes priced at $1,000+, 150+ stores across Middle East, heritage since 1852',
      region: 'mena',
    },
    {
      brand: 'Careem',
      context: 'Using social proof and liking to compete with Uber in MENA',
      strategy: 'Driver ratings and trip counts (social proof), Arabic-first app (liking through cultural similarity), "Captain" terminology for drivers (authority and respect), referral bonuses (reciprocity), surge pricing framed as "peak hours" (framing).',
      results: 'Acquired by Uber for $3.1B — the largest tech acquisition in MENA history.',
      numbers: 'Acquired for $3.1B (2019), 33M+ users, 14 countries, 1M+ Captains',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Right now, you\'re asking customers to trust you without giving them a reason. Let me show you how to build authority and social proof that makes the sale happen before you even pitch.',
    'In the Arab world, social proof is 3x more powerful than in Western markets. Your best marketing asset isn\'t an ad — it\'s a happy client telling their network. We need to systematize that.',
    'Hermès doesn\'t sell bags — they sell waiting lists. When you limit availability and increase perceived value, customers don\'t ask "how much?" — they ask "how do I get in?"',
  ],
  counterArguments: `Critics argue Cialdini's principles can be manipulative. The ethical line: use these to help genuinely good products/services reach the right people, not to sell snake oil. In MENA's relationship-driven business culture, authenticity is paramount — fake social proof or artificial scarcity will be detected and punished through word-of-mouth.`,
  connectionToOtherFrameworks: 'Scarcity connects to Kahneman\'s loss aversion, Social Proof connects to Sharp\'s mental availability (word-of-mouth builds awareness), Authority connects to Kapferer\'s Culture facet (brand values and expertise).',
  tags: ['influence', 'persuasion', 'social_proof', 'scarcity', 'authority', 'sales', 'proposals'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 5: PORTER'S FIVE FORCES
// ═══════════════════════════════════════════════════════════════════════

const PORTER_FIVE_FORCES: AcademicFramework = {
  id: 'porter_five_forces',
  name: "Porter's Five Forces for Branding",
  creator: 'Michael Porter',
  year: '1979',
  category: 'competitive_strategy',
  oneLiner: '5 forces that determine industry profitability: competitive rivalry, threat of new entrants, bargaining power of buyers/suppliers, and threat of substitutes.',
  components: [
    'Competitive Rivalry — How intense is competition? More competitors = lower margins. Brand differentiation reduces rivalry.',
    'Threat of New Entrants — How easy is it for new competitors to enter? Strong brands create barriers to entry.',
    'Bargaining Power of Buyers — Can customers easily switch or negotiate? Brand loyalty reduces buyer power.',
    'Bargaining Power of Suppliers — Do suppliers have leverage? Vertical integration (like Almarai) reduces this.',
    'Threat of Substitutes — Can customers solve their problem differently? Strong brands make substitutes less attractive.',
  ],
  deepExplanation: `Michael Porter's Five Forces framework (Harvard Business Review, 1979) is the foundational tool for industry analysis. While originally designed for corporate strategy, it's incredibly powerful for brand strategy because BRAND IS THE ULTIMATE COMPETITIVE MOAT.

FOR THE MENA BRANDING AGENCY MARKET:
1. COMPETITIVE RIVALRY (HIGH): The MENA marketing/advertising market is projected to reach $10.76B by 2026. Thousands of agencies compete, most on price. Brand strategy agencies like WZZRD AI compete on expertise, not price.

2. THREAT OF NEW ENTRANTS (HIGH): Low barriers — anyone with a laptop can call themselves a "branding agency." This makes DIFFERENTIATION through methodology and results critical.

3. BUYER POWER (MODERATE-HIGH): Clients can easily switch agencies. The antidote: deep integration into the client's business (switching costs), proven results (authority), and relationship depth (liking).

4. SUPPLIER POWER (LOW): Talent is the main "supplier." In MENA, there's a growing pool of creative talent, but TOP talent is scarce and commands premium rates.

5. THREAT OF SUBSTITUTES (GROWING): In-house teams, AI tools, freelance platforms (Fiverr, Upwork), and DIY tools (Canva, Wix) are all substitutes. The defense: offer strategic thinking that tools can't replicate.

WHY THIS MATTERS: When WZZRD AI's AI Brain analyzes a client's industry using Five Forces, it demonstrates strategic depth that justifies premium pricing. It shows the client that brand strategy isn't just "making things pretty" — it's a competitive weapon.`,
  applicationSteps: [
    'Map the client\'s industry using all 5 forces — rate each as High/Medium/Low',
    'Identify where brand strategy can reduce competitive pressure (usually rivalry and buyer power)',
    'Show the client how a strong brand creates barriers to entry for competitors',
    'Quantify the cost of NOT having a brand strategy (lost pricing power, customer churn)',
    'Position WZZRD AI\'s services as a strategic investment, not a cost',
  ],
  commonMistakes: [
    'Analyzing forces without connecting to brand strategy — the framework is a means, not an end',
    'Ignoring digital disruption — traditional Five Forces analysis often misses platform dynamics',
    'Static analysis — forces change over time, especially in fast-moving MENA markets',
    'Treating all forces equally — usually 1-2 forces dominate and should get most attention',
  ],
  examples: [
    {
      brand: 'Coca-Cola',
      context: 'Using brand to dominate all 5 forces in the beverage industry',
      strategy: 'Brand reduces rivalry (44.9% US CSD market share), creates barriers to entry ($4.1B annual marketing spend), reduces buyer power (consumers demand Coke by name), reduces supplier power (massive scale), and makes substitutes less attractive (emotional connection to the brand).',
      results: 'Maintained market leadership for 130+ years despite countless competitors.',
      numbers: '44.9% US CSD market share, $4.1B marketing spend, $45.8B revenue (2023)',
      region: 'global',
    },
    {
      brand: 'Nike',
      context: 'Brand as the ultimate barrier to entry in athletic wear',
      strategy: 'Nike\'s brand is so strong that new entrants can\'t compete even with better products. The swoosh, "Just Do It," and athlete endorsements create mental availability that would cost billions to replicate.',
      results: 'Maintains 27% global athletic footwear market share despite thousands of competitors.',
      numbers: '27% global market share, $51.2B revenue (2023), brand value $53.8B',
      region: 'global',
    },
    {
      brand: 'Careem vs Uber in MENA',
      context: 'How local brand understanding defeated a global giant',
      strategy: 'Careem understood MENA buyer power (cash payments, Arabic language, cultural norms) better than Uber. By reducing buyer friction (Five Forces: buyer power), Careem built loyalty that Uber couldn\'t match with superior technology alone.',
      results: 'Uber had to acquire Careem for $3.1B instead of competing — the brand was too strong to beat.',
      numbers: 'Acquired for $3.1B, operated in 14 countries, 33M+ users before acquisition',
      region: 'mena',
    },
    {
      brand: 'MENA Branding Agency Market',
      context: 'Five Forces analysis of the industry WZZRD AI operates in',
      strategy: 'High rivalry (thousands of agencies), high new entrant threat (low barriers), moderate-high buyer power (easy to switch), low supplier power (growing talent pool), growing substitute threat (AI, DIY tools). The winning strategy: build a METHODOLOGY-BASED brand that creates switching costs and authority.',
      results: 'Agencies with clear methodology and proven results command 3-5x higher fees than generic agencies.',
      numbers: 'MENA ad market $10.76B by 2026, premium agencies charge 3-5x generic rates, client retention 40% higher for methodology-driven agencies',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Let me show you something: in your industry, the threat of new entrants is HIGH and buyer power is HIGH. That means without a strong brand, you\'re in a race to the bottom on price. A brand strategy isn\'t a luxury — it\'s your survival tool.',
    'Coca-Cola spends $4.1 billion a year on marketing not because they need to — but because that spending IS the barrier that keeps competitors out. Your brand investment works the same way, at your scale.',
    'Your competitors can copy your product, your pricing, your distribution. The ONE thing they can\'t copy is your brand. That\'s why this investment pays for itself.',
  ],
  counterArguments: `Critics argue Five Forces is too static for today's fast-moving markets and doesn't account for platform dynamics (Uber, Airbnb). The "sixth force" of complements (Intel + Microsoft) is often missing. For MENA specifically, government regulation and family business dynamics are forces that Porter didn't consider. However, the framework remains the best starting point for competitive analysis.`,
  connectionToOtherFrameworks: 'Connects to Blue Ocean Strategy (creating uncontested market space reduces all 5 forces), Sharp\'s availability (physical availability = reducing buyer power), and Kapferer\'s brand identity (strong identity = barrier to entry).',
  tags: ['competitive_strategy', 'industry_analysis', 'barriers_to_entry', 'pricing_power', 'market_analysis'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 6: BLUE OCEAN STRATEGY
// ═══════════════════════════════════════════════════════════════════════

const BLUE_OCEAN_STRATEGY: AcademicFramework = {
  id: 'blue_ocean_strategy',
  name: 'Blue Ocean Strategy',
  creator: 'W. Chan Kim & Renée Mauborgne',
  year: '2005',
  category: 'competitive_strategy',
  oneLiner: 'Instead of competing in bloody "red oceans," create uncontested market space ("blue oceans") through value innovation — simultaneously pursuing differentiation AND low cost.',
  components: [
    'Value Innovation — The cornerstone: create a leap in value for buyers while reducing costs. Not either/or — BOTH.',
    'Strategy Canvas — Visual tool that plots your offering vs competitors across key factors. Reveals where to diverge.',
    'Four Actions Framework — Eliminate (which factors to drop?), Reduce (which to reduce below standard?), Raise (which to raise above standard?), Create (which new factors to introduce?)',
    'Six Paths Framework — Look across alternative industries, strategic groups, buyer groups, complementary offerings, functional-emotional appeal, and time trends.',
    'Three Tiers of Noncustomers — First tier (soon-to-be), Second tier (refusing), Third tier (unexplored) — the biggest growth is in noncustomers.',
  ],
  deepExplanation: `Blue Ocean Strategy by W. Chan Kim and Renée Mauborgne (INSEAD, 2005) argues that the best competitive strategy is to make competition irrelevant by creating new market space. Based on a study of 150 strategic moves across 30+ industries over 100 years, they found that "blue ocean" moves generated 61% of total profit impact despite being only 14% of total launches.

THE KEY INSIGHT: Most companies compete on the SAME factors (price, quality, features) in the SAME market — this is a "red ocean" where competition is bloody and margins shrink. Blue ocean companies REDEFINE the factors of competition.

CLASSIC EXAMPLE — CIRQUE DU SOLEIL:
- ELIMINATED: Star performers, animal shows, aisle concession sales, multiple show arenas
- REDUCED: Fun and humor, thrill and danger
- RAISED: Unique venue, artistic music and dance
- CREATED: Theme, refined environment, multiple productions, artistic richness

Result: Achieved in 20 years what Ringling Bros. took 100 years to achieve, at higher ticket prices with lower costs.

FOR PRIMO MARCA: This framework is perfect for clients who feel "stuck" in competitive markets. Instead of fighting for market share in a red ocean, help them create a blue ocean by redefining what they offer.`,
  applicationSteps: [
    'Draw the current Strategy Canvas — plot your client vs competitors on key industry factors',
    'Apply the Four Actions Framework — what to eliminate, reduce, raise, create?',
    'Identify the 3 tiers of noncustomers — who ISN\'T buying and why?',
    'Use the Six Paths to find blue ocean opportunities',
    'Test the new value curve — does it diverge from competitors? Is it focused? Does it have a compelling tagline?',
    'Plan the execution — sequence of strategic moves to capture the blue ocean',
  ],
  commonMistakes: [
    'Thinking blue ocean means "no competition" — competitors will eventually follow, so speed matters',
    'Confusing blue ocean with niche — blue oceans are LARGE untapped markets, not tiny niches',
    'Eliminating factors that customers actually value — the Four Actions must be based on real customer insights',
    'Ignoring execution — a brilliant strategy canvas means nothing without flawless execution',
  ],
  examples: [
    {
      brand: 'Cirque du Soleil',
      context: 'Creating a blue ocean in the dying circus industry',
      strategy: 'Eliminated animals and star performers (reduced costs), created theatrical experience with artistic music and themes (increased value). Targeted adults willing to pay theater prices, not families looking for cheap entertainment.',
      results: 'Achieved in <20 years what traditional circuses took 100+ years. Productions seen by 150M+ people.',
      numbers: 'Revenue $1B+ at peak, 150M+ viewers, ticket prices 3-5x traditional circus, performed in 450+ cities',
      region: 'global',
    },
    {
      brand: 'Yellow Tail Wine',
      context: 'Creating a blue ocean in the intimidating wine industry',
      strategy: 'Eliminated wine complexity (no vintage years, no wine jargon), created fun and easy-to-drink wine for beer and cocktail drinkers. Simple label, two varieties, affordable price.',
      results: 'Became #1 imported wine in US within 2 years. Sold 12M+ cases annually.',
      numbers: '#1 imported wine in US, 12M+ cases/year, grew from 0 to $2B+ brand in 5 years',
      region: 'global',
    },
    {
      brand: 'Southwest Airlines',
      context: 'Blue ocean in air travel by competing with cars, not other airlines',
      strategy: 'Eliminated meals, seat assignments, lounges, hub connections. Created point-to-point routes, fast turnaround, fun culture. Competed with driving, not flying — opened air travel to people who previously drove.',
      results: '47 consecutive years of profitability. Only US airline profitable every year since 1973.',
      numbers: '47 years consecutive profitability, $26.1B revenue (2023), 130M+ passengers/year',
      region: 'global',
    },
    {
      brand: 'Aramex',
      context: 'Creating a blue ocean in MENA logistics',
      strategy: 'Instead of competing with DHL/FedEx on global scale, Aramex created an asset-light model focused on emerging markets. Eliminated heavy infrastructure investment, created local partnerships and last-mile expertise in markets global players ignored.',
      results: 'Became the largest logistics company in the Middle East. First Arab company listed on NASDAQ.',
      numbers: 'Revenue AED 6.4B, operates in 65+ countries, first Arab company on NASDAQ, acquired by GeoPost for $1.5B',
      region: 'mena',
    },
    {
      brand: 'Kitopi (Cloud Kitchens)',
      context: 'Blue ocean in MENA food service',
      strategy: 'Eliminated dine-in real estate costs, reduced front-of-house staff, raised food quality through data-driven optimization, created a platform where restaurants can expand without opening new locations.',
      results: 'Became MENA\'s first cloud kitchen unicorn. Operates 200+ kitchens.',
      numbers: 'Valued at $1B+ (unicorn), 200+ kitchens, 200+ brand partners, operates in UAE, KSA, Bahrain, Kuwait',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'You\'re fighting for market share in a red ocean — and every competitor is fighting the same way. Let me show you how to create a blue ocean where you\'re the only player.',
    'Cirque du Soleil didn\'t try to be a better circus — they created something entirely new and charged theater prices. What\'s your equivalent? What can you eliminate that everyone else thinks is essential?',
    'The biggest growth isn\'t in stealing competitors\' customers — it\'s in the people who aren\'t buying from ANYONE in your category yet. Those are your noncustomers, and they\'re a much bigger market.',
  ],
  counterArguments: `Critics argue blue oceans are temporary (competitors eventually follow), that the framework is better at explaining past success than predicting future opportunities, and that execution matters more than strategy. Porter argues that sustainable competitive advantage comes from choosing a unique position, not from value innovation. The reality: Blue Ocean is excellent for REPOSITIONING (WZZRD AI's core work) but must be combined with execution excellence.`,
  connectionToOtherFrameworks: 'Directly challenges Porter\'s Five Forces (make competition irrelevant instead of fighting forces), connects to Kapferer\'s Prism (blue ocean requires a new brand identity), and supports Sharp\'s growth thesis (blue oceans create new category buyers).',
  tags: ['repositioning', 'competitive_strategy', 'value_innovation', 'market_creation', 'differentiation'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 7: PREMIUM PRICING PSYCHOLOGY
// ═══════════════════════════════════════════════════════════════════════

const PREMIUM_PRICING: AcademicFramework = {
  id: 'premium_pricing',
  name: 'Premium Pricing Psychology',
  creator: 'Thorstein Veblen (1899), Weber (1834), multiple researchers',
  year: '1899-present',
  category: 'pricing',
  oneLiner: 'The psychology behind why people pay more — Veblen goods, price-quality heuristic, Weber\'s Law, reference pricing, and the luxury paradox.',
  components: [
    'Veblen Goods — Products where demand INCREASES as price increases. The high price IS the product (Hermès, Rolex).',
    'Price-Quality Heuristic — People assume higher price = higher quality. This shortcut drives 60%+ of purchase decisions.',
    'Weber\'s Law — The "just noticeable difference" in pricing. A $5 increase on a $50 product feels bigger than $5 on a $500 product.',
    'Reference Pricing — Customers judge price relative to a reference point, not in absolute terms. Control the reference, control the perception.',
    'The Luxury Paradox — Making luxury more accessible destroys its value. Exclusivity and high price are features, not bugs.',
  ],
  deepExplanation: `Premium pricing is not about charging more — it's about creating a perception of value that JUSTIFIES higher prices. This requires understanding multiple psychological principles:

VEBLEN GOODS (Thorstein Veblen, 1899):
Named after economist Thorstein Veblen who observed "conspicuous consumption" — buying expensive things to signal status. For Veblen goods, the demand curve slopes UPWARD: raise the price, and MORE people want it. Examples: Hermès Birkin (starts at $10,000, resells for $500,000), Rolex (3-year waiting lists), Ferrari (intentionally produces fewer cars than demand).

THE KSA LUXURY OPPORTUNITY:
Saudi Arabia's luxury market is projected to reach $37.83B by 2034. Vision 2030 is creating a new class of consumers who want premium experiences. The entertainment sector alone is projected at $12.96B. For WZZRD AI clients in KSA, premium positioning isn't optional — it's where the growth is.

EGYPT'S PREMIUM PARADOX:
In Egypt's price-sensitive market, premium positioning seems counterintuitive. But Gourmet Egypt proves it works: 50% gross margins on in-house products, e-commerce at 35% of sales. The key: premium doesn't mean "expensive for everyone" — it means "worth it for the right customer."

WHY AGENCIES SHOULD USE THIS:
When presenting WZZRD AI's pricing (Clarity Package 25,000 EGP, Brand Foundation 50,000-120,000 EGP), the AI Brain should frame it using these principles:
- Anchor with the Growth Partnership (120,000+ EGP) first
- Use the price-quality heuristic: "Our methodology includes 7 academic frameworks — that depth is why our clients see 40%+ revenue growth"
- Apply Weber's Law: "The difference between our 50K and a 15K agency is 35K — but the difference in results is 10x"`,
  applicationSteps: [
    'Identify the client\'s pricing power — can they charge more? What\'s the ceiling?',
    'Build the value perception BEFORE discussing price — quality signals, brand assets, social proof',
    'Set the anchor high — always present the premium option first',
    'Use Weber\'s Law — frame price differences as percentages, not absolutes',
    'Create exclusivity signals — limited availability, application process, waiting lists',
    'Never discount — discounting destroys premium perception permanently',
  ],
  commonMistakes: [
    'Discounting to win customers — this permanently damages premium perception',
    'Premium positioning without premium delivery — the product must match the price',
    'Ignoring the "middle market" — not everyone can be luxury; there\'s a profitable middle ground',
    'Copying luxury codes without understanding them — a gold logo doesn\'t make you premium',
    'Forgetting that premium is relative — premium in Egypt is different from premium in UAE',
  ],
  examples: [
    {
      brand: 'Starbucks',
      context: 'Charging 5x more than local coffee through premium framing',
      strategy: 'Starbucks doesn\'t sell coffee — it sells "the third place" (between home and work). Store design, cup sizes in Italian, barista ritual, and consistent experience worldwide create a premium frame that justifies $5.55 average ticket vs $1 local coffee.',
      results: 'Revenue $36B (2023). Customers pay 5x more and feel good about it.',
      numbers: 'Revenue $36B, 35,000+ stores, average ticket $5.55, 75M reward members, 5x price premium over local coffee',
      region: 'global',
    },
    {
      brand: 'Apple',
      context: 'Maintaining premium in the most price-competitive industry (consumer electronics)',
      strategy: 'Apple uses EVERY premium pricing principle: Veblen effect (iPhone as status symbol), price-quality heuristic (premium = better), anchoring (Pro Max prices make standard seem reasonable), reference pricing (never discounts, maintaining price integrity).',
      results: '60%+ gross margins in an industry where 20% is normal. $3T+ market cap.',
      numbers: '60%+ gross margins, $3T+ market cap, iPhone average selling price $988 vs Android $261',
      region: 'global',
    },
    {
      brand: 'Gourmet Egypt',
      context: 'Premium grocery in Egypt\'s price-sensitive market',
      strategy: 'Store design creates a "premium frame" — customers expect to pay more before they see prices. In-house products at 50% margins because the environment anchors expectations. E-commerce (35% of sales) uses endowment effect — once you experience Gourmet delivery, cheaper alternatives feel like a downgrade.',
      results: 'Successfully maintained premium positioning despite Egypt\'s economic challenges. New stores achieve ROI in 18 months.',
      numbers: '50% gross margin on in-house products, e-commerce 35% of total sales, new store ROI in 18 months',
      region: 'egypt',
    },
    {
      brand: 'KSA Luxury Market',
      context: 'Vision 2030 creating massive premium opportunity',
      strategy: 'Saudi Arabia\'s transformation is creating a new consumer class that demands premium experiences. Entertainment sector ($12.96B), tourism targets (150 million visitors), and women entering workforce (33.8%) are all creating demand for premium brands.',
      results: 'KSA luxury market projected to reach $37.83B by 2034. Fastest-growing luxury market in MENA.',
      numbers: 'Luxury market $37.83B by 2034, entertainment $12.96B, tourism target 150M visitors, women workforce 33.8%',
      region: 'ksa',
    },
  ],
  clientTalkingPoints: [
    'Here\'s why Starbucks charges 5x more than the coffee shop next door: it\'s not the coffee — it\'s the FRAME. The store, the cups, the ritual, the consistency. We need to build that frame for your brand. Once the frame is right, premium pricing feels NATURAL to your customers.',
    'You\'re leaving money on the table. Your product quality is premium, but your brand says "budget." That gap between actual quality and perceived quality is costing you 30-50% in potential revenue.',
    'In KSA right now, the luxury market is growing to $37.83B by 2034. The brands that position themselves as premium TODAY will capture that growth. The ones that stay "affordable" will be left behind.',
  ],
  counterArguments: `Premium pricing doesn't work for all categories or all markets. In highly commoditized industries (utilities, basic materials), price is the primary factor. In Egypt's current economic environment, many consumers genuinely can't afford premium — the strategy must target the right segment. Also, premium positioning requires consistent investment — you can't charge premium and deliver average.`,
  connectionToOtherFrameworks: 'Built on Kahneman\'s behavioral economics (anchoring, framing), connects to Kapferer\'s Prism (premium identity alignment), supports Cialdini\'s scarcity principle, and challenges Sharp\'s mass-market approach (premium brands grow differently).',
  tags: ['pricing', 'premium', 'luxury', 'veblen', 'psychology', 'ksa', 'egypt', 'proposals'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 8: BRAND REPOSITIONING
// ═══════════════════════════════════════════════════════════════════════

const BRAND_REPOSITIONING: AcademicFramework = {
  id: 'brand_repositioning',
  name: 'Brand Repositioning Strategy',
  creator: 'Al Ries & Jack Trout (1981), with modern extensions',
  year: '1981-present',
  category: 'brand_identity',
  oneLiner: 'The strategic process of changing a brand\'s market position — from mass to premium, from old to modern, from local to global — with specific frameworks for each type of repositioning.',
  components: [
    'Position Audit — Where does the brand sit in customers\' minds today? (Perceptual mapping)',
    'Gap Analysis — Where does the brand WANT to be vs where it IS?',
    'Repositioning Type — Upmarket (mass→premium), Modernization (old→contemporary), Expansion (local→global), Turnaround (declining→growing)',
    'Migration Strategy — How to move from current position to desired position without losing existing customers',
    'Communication Bridge — The narrative that explains the change to customers',
  ],
  deepExplanation: `Brand repositioning is one of the highest-value services a branding agency can offer because it directly impacts revenue and market position. Based on Ries & Trout's "Positioning" (1981) and decades of case studies, successful repositioning follows predictable patterns.

THE 4 TYPES OF REPOSITIONING:

1. UPMARKET REPOSITIONING (Mass → Premium):
Most common for WZZRD AI clients. Requires: new visual identity, premium pricing, quality improvements, and a narrative that justifies the change. Risk: alienating existing price-sensitive customers.

2. MODERNIZATION REPOSITIONING (Old → Contemporary):
For heritage brands that feel dated. Requires: updated visual identity while preserving heritage elements, digital transformation, and new customer acquisition. Risk: losing brand heritage that loyal customers value.

3. EXPANSION REPOSITIONING (Local → Regional/Global):
For brands growing beyond their home market. Requires: cultural adaptation, scalable brand architecture, and market-specific positioning. Risk: losing local authenticity.

4. TURNAROUND REPOSITIONING (Declining → Growing):
For brands in crisis. Requires: honest diagnosis, radical changes, and a compelling "comeback" narrative. Risk: too little too late.

THE REPOSITIONING PARADOX: The biggest challenge isn't creating the new position — it's LETTING GO of the old one. Clients often want to be "premium" while keeping their "affordable" customers. This rarely works.`,
  applicationSteps: [
    'Conduct a Position Audit — survey customers, analyze competitors, map perceptions',
    'Define the target position — be specific about where you want to be',
    'Identify the repositioning type — upmarket, modernization, expansion, or turnaround',
    'Design the migration strategy — how to move without losing too much',
    'Create the communication bridge — the story that makes the change feel natural',
    'Execute in phases — visual identity first, then experience, then pricing',
    'Measure and adjust — track perception changes over 6-12 months',
  ],
  commonMistakes: [
    'Trying to reposition without changing the product/service — new packaging on old quality doesn\'t work',
    'Moving too fast — customers need time to accept the new position',
    'Moving too slow — half-measures create confusion',
    'Ignoring existing loyal customers — they need to understand and accept the change',
    'Repositioning by committee — too many stakeholders dilute the vision',
  ],
  examples: [
    {
      brand: 'Old Spice',
      context: 'From "grandpa\'s aftershave" to millennial icon',
      strategy: 'Complete brand overhaul: new spokesperson (Isaiah Mustafa), humorous viral campaign ("The Man Your Man Could Smell Like"), new product line, new packaging. Targeted women (who buy 60% of men\'s body wash) instead of men directly.',
      results: '107% sales increase in one year. 27% market share increase. Brand went from declining to category leader.',
      numbers: '107% sales increase, 1.4B impressions, 27% market share increase, 300% website traffic increase',
      region: 'global',
    },
    {
      brand: 'Burberry',
      context: 'From "chav" brand to luxury icon',
      strategy: 'Under CEO Angela Ahrendts and creative director Christopher Bailey, Burberry eliminated discount outlets, invested in digital (first luxury brand to livestream fashion shows), and repositioned from mass-accessible to aspirational luxury.',
      results: 'Revenue grew from £219M to £2.5B+. Brand value increased 5x.',
      numbers: 'Revenue growth from £219M to £2.5B+, brand value increased 5x, stock price increased 300%',
      region: 'global',
    },
    {
      brand: 'Marvel',
      context: 'From bankruptcy to the most valuable entertainment franchise',
      strategy: 'Marvel was bankrupt in 1996. Repositioned from comic book company to cinematic universe. Created interconnected storytelling (MCU), leveraged lesser-known characters (Iron Man, Guardians), and built a franchise model.',
      results: 'Acquired by Disney for $4B (2009). MCU has grossed $29.8B+ at box office.',
      numbers: 'Acquired for $4B, MCU box office $29.8B+, 32 films, brand value estimated $50B+',
      region: 'global',
    },
    {
      brand: 'Saudi Arabia (Nation Branding)',
      context: 'Vision 2030 — repositioning an entire nation from oil economy to diversified hub',
      strategy: 'The most ambitious repositioning in history. Saudi Arabia is repositioning from "oil-dependent conservative kingdom" to "diversified entertainment and tourism hub." Mega-projects (NEOM $500B, The Line, Red Sea Project), entertainment sector opening, tourism visa program, women\'s empowerment.',
      results: 'Tourism target: 150M visitors. Entertainment market: $12.96B. Women workforce: 33.8% (from 17%).',
      numbers: 'NEOM $500B investment, tourism target 150M visitors, entertainment $12.96B, women workforce from 17% to 33.8%',
      region: 'ksa',
    },
    {
      brand: 'Egyptian Brands Post-Devaluation',
      context: 'Forced repositioning due to currency devaluation',
      strategy: 'Egypt\'s currency devaluation forced many brands to reposition. Smart brands used the crisis to move upmarket: "If prices must rise, let the brand rise too." Juhayna launched premium "Pure" line, local fashion brands positioned as "Egyptian luxury" alternatives to now-expensive imports.',
      results: 'Brands that repositioned upmarket during devaluation maintained margins. Those that stayed "cheap" lost profitability.',
      numbers: 'EGP devalued 50%+ since 2022, import costs doubled, brands that repositioned maintained 15-25% margins vs 5-10% for non-repositioned',
      region: 'egypt',
    },
  ],
  clientTalkingPoints: [
    'Old Spice went from dying brand to 107% sales growth in one year — not by making better aftershave, but by completely changing how people THINK about the brand. That\'s what repositioning does.',
    'Saudi Arabia is spending $500B on NEOM to reposition an entire NATION. Your brand repositioning is the same principle at a different scale — and the ROI is just as transformative.',
    'Here\'s the hard truth: your brand is stuck in a position that limits your growth. You can\'t charge premium prices with a budget brand perception. We need to move you — and I have a specific plan for how.',
  ],
  counterArguments: `Repositioning is risky — research shows 60-70% of repositioning efforts fail. The main reasons: insufficient investment, lack of commitment, trying to please everyone, and not changing the actual product/service. Success requires full organizational commitment and 12-24 months of consistent execution. WZZRD AI must be honest with clients about the risk and the investment required.`,
  connectionToOtherFrameworks: 'Uses Kapferer\'s Prism to define the new identity, Blue Ocean Strategy to find the new position, Kahneman\'s framing to communicate the change, and Sharp\'s distinctive assets to build recognition in the new position.',
  tags: ['repositioning', 'brand_identity', 'transformation', 'premium', 'turnaround', 'ksa', 'egypt'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 9: CUSTOMER JOURNEY MAPPING
// ═══════════════════════════════════════════════════════════════════════

const CUSTOMER_JOURNEY: AcademicFramework = {
  id: 'customer_journey',
  name: 'Customer Journey Mapping & Touchpoint Strategy',
  creator: 'Philip Kotler (5A Framework), McKinsey (Consumer Decision Journey)',
  year: '2003-2017',
  category: 'customer_experience',
  oneLiner: 'Mapping every interaction a customer has with a brand — from first awareness to advocacy — to identify gaps, optimize experiences, and increase conversion at every stage.',
  components: [
    'Aware — Customer first learns the brand exists. Touchpoints: ads, social media, word-of-mouth, search.',
    'Appeal — Customer is interested and wants to learn more. Touchpoints: website, content, reviews.',
    'Ask — Customer actively researches and compares. Touchpoints: consultations, demos, case studies.',
    'Act — Customer makes the purchase decision. Touchpoints: proposal, pricing, onboarding.',
    'Advocate — Customer becomes a promoter. Touchpoints: results delivery, follow-up, referral program.',
  ],
  deepExplanation: `Customer Journey Mapping combines Philip Kotler's 5A Framework (Aware → Appeal → Ask → Act → Advocate) with McKinsey's Consumer Decision Journey research. The key insight: the customer journey is NOT a linear funnel — it's a loop with multiple entry and exit points.

McKINSEY'S KEY FINDING: 
Customers don't start at the top of a funnel and move down. They enter at various points, loop back, skip stages, and are influenced by touchpoints that brands don't control (reviews, social media, word-of-mouth). The brands that win are those that optimize EVERY touchpoint, not just advertising.

MOMENTS OF TRUTH:
- First Moment of Truth (P&G): When the customer first encounters the product on the shelf/screen
- Second Moment of Truth: When the customer uses the product
- Zero Moment of Truth (Google): The online research phase BEFORE the first moment
- Ultimate Moment of Truth (Brian Solis): When the customer shares their experience

FOR PRIMO MARCA'S CLIENTS:
Most clients only think about the "Act" stage (getting the sale). But the journey starts much earlier and continues much later. A brand strategy must optimize ALL 5 stages. The Quick-Check tool is an "Ask" stage touchpoint. The Client Portal is an "Act" and "Advocate" stage touchpoint.

MOBILE-FIRST IN MENA:
In Egypt (72.2% internet, 97.3% mobile) and KSA (99.6% internet, 98.8% mobile), the customer journey is overwhelmingly MOBILE. Arabic-first, mobile-optimized touchpoints aren't optional — they're essential.`,
  applicationSteps: [
    'Map the current journey — identify every touchpoint across all 5 stages',
    'Identify pain points — where do customers drop off? Where is friction highest?',
    'Prioritize by impact — fix the highest-impact pain points first',
    'Design the ideal journey — what should each touchpoint feel like?',
    'Implement changes — start with quick wins, then tackle structural changes',
    'Measure continuously — track conversion rates at each stage',
  ],
  commonMistakes: [
    'Only mapping the purchase stage — the journey starts at Aware and ends at Advocate',
    'Ignoring mobile — in MENA, 70%+ of the journey happens on mobile',
    'Not involving real customers — journey maps based on assumptions are useless',
    'Creating the map but not acting on it — the map is a tool, not a deliverable',
    'Forgetting post-purchase — Advocate stage is where referrals and repeat business come from',
  ],
  examples: [
    {
      brand: 'Disney',
      context: 'The gold standard of customer journey optimization',
      strategy: 'Disney maps EVERY touchpoint: website booking (Aware/Appeal), MagicBand (frictionless Act), park experience (every cast member is a touchpoint), post-visit photos and memories (Advocate). The MagicBand alone eliminated 30+ friction points.',
      results: '54% greater ROI on marketing, 200% greater employee engagement, 350% more revenue from referrals.',
      numbers: '54% greater marketing ROI, 200% employee engagement increase, 350% referral revenue increase, 157M park visitors/year',
      region: 'global',
    },
    {
      brand: 'Amazon',
      context: 'Optimizing every friction point in the purchase journey',
      strategy: '1-Click ordering (eliminated Act friction), Prime (created switching costs at Advocate stage), reviews (optimized Ask stage), personalized recommendations (enhanced Appeal). Every feature is designed to remove friction from a specific journey stage.',
      results: 'Prime members spend $1,400/year vs $600 for non-members. 200M+ Prime members globally.',
      numbers: 'Prime members spend $1,400/year, 200M+ Prime members, 60% of US e-commerce, $574B revenue (2023)',
      region: 'global',
    },
    {
      brand: 'Careem Super App',
      context: 'Expanding the journey from ride-hailing to everything',
      strategy: 'Careem mapped the customer journey and realized users needed the app for more than rides. Expanded to food delivery, payments, and services — keeping users in the Careem ecosystem across multiple journey types. Arabic-first, cash-friendly, locally adapted.',
      results: 'Transformed from ride-hailing to super app. Increased user engagement 3x.',
      numbers: '33M+ users, 14 countries, super app with 5+ services, user engagement increased 3x',
      region: 'mena',
    },
    {
      brand: 'Talabat',
      context: 'Mobile-first journey optimization in MENA food delivery',
      strategy: 'Talabat optimized every mobile touchpoint: discovery (curated restaurants), ordering (3-tap checkout), tracking (real-time GPS), and advocacy (easy sharing and reviews). Arabic-first interface with cash-on-delivery option removes the biggest friction point in MENA e-commerce.',
      results: 'Dominant market share in GCC food delivery. Highest app ratings in the category.',
      numbers: '50,000+ restaurant partners, 9 countries, 4.7+ app store rating, dominant GCC market share',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Your customers go through 5 stages before they buy — and you\'re only optimizing for one of them. Let me show you where you\'re losing customers and how to fix it.',
    'Disney generates 350% more revenue from referrals because they optimize the ENTIRE journey, not just the sale. Your post-purchase experience is where your next 50% of revenue comes from.',
    'In Egypt and KSA, 70%+ of the customer journey happens on mobile. If your mobile experience has friction, you\'re losing customers at every stage. Let me audit your mobile touchpoints.',
  ],
  counterArguments: `Journey mapping can become an academic exercise that never translates to action. The biggest risk is creating beautiful maps that sit in a drawer. Also, customer journeys are increasingly non-linear and unpredictable — a static map may not capture the reality. The solution: treat journey maps as living documents that are updated based on real customer data, not assumptions.`,
  connectionToOtherFrameworks: 'Connects to Sharp\'s physical availability (removing friction = increasing availability), Cialdini\'s principles (each touchpoint can leverage influence), and Kahneman\'s System 1 (most journey decisions are automatic).',
  tags: ['customer_experience', 'journey_mapping', 'touchpoints', 'mobile', 'mena', 'conversion'],
};

// ═══════════════════════════════════════════════════════════════════════
// FRAMEWORK 10: EHRENBERG-BASS LAWS OF MARKETING
// ═══════════════════════════════════════════════════════════════════════

const EHRENBERG_BASS_LAWS: AcademicFramework = {
  id: 'ehrenberg_bass_laws',
  name: "Ehrenberg-Bass Institute's Laws of Marketing",
  creator: 'Andrew Ehrenberg, Byron Sharp, Jenni Romaniuk',
  year: '1959-present',
  category: 'brand_growth',
  oneLiner: 'Evidence-based "laws" of marketing that challenge conventional wisdom: Double Jeopardy, Duplication of Purchase, Natural Monopoly, and the NBD-Dirichlet model.',
  components: [
    'Double Jeopardy Law — Small brands suffer twice: fewer buyers AND those buyers are slightly less loyal. You can\'t "loyalty" your way to growth.',
    'Duplication of Purchase Law — Brands share customers with competitors in proportion to market share, NOT based on positioning similarity. Your "unique" customers also buy from your competitors.',
    'Natural Monopoly Law — Bigger brands have disproportionate penetration among light category buyers. The rich get richer.',
    'NBD-Dirichlet Model — Purchase behavior follows predictable statistical patterns. Most buyers are light buyers who buy infrequently.',
    'Distinctiveness over Differentiation — Brands grow through distinctive assets (recognizable cues) more than through meaningful differentiation.',
  ],
  deepExplanation: `The Ehrenberg-Bass Institute at the University of South Australia has spent 60+ years studying how brands actually grow, using real purchase data from millions of consumers across dozens of categories and countries. Their findings often contradict what marketers believe.

THE UNCOMFORTABLE TRUTHS:

1. YOUR "LOYAL" CUSTOMERS AREN'T THAT LOYAL:
Even for strong brands, most customers buy from multiple brands in the category. Coca-Cola drinkers also drink Pepsi. iPhone users consider Samsung. "Brand loyalty" as traditionally understood barely exists — what exists is HABIT and AVAILABILITY.

2. YOU CAN'T GROW THROUGH LOYALTY:
The Double Jeopardy Law shows that small brands have fewer buyers AND those buyers are slightly less loyal. The ONLY way to grow is to acquire MORE buyers, not to make existing buyers more loyal. This is why loyalty programs rarely work.

3. TARGETING IS OVERRATED:
The Duplication of Purchase Law shows that brands share customers with ALL competitors, not just "similar" ones. A luxury car brand shares customers with Toyota, not just other luxury brands. This means narrow targeting misses most potential buyers.

4. MOST OF YOUR BUYERS ARE "LIGHT" BUYERS:
The NBD-Dirichlet model shows that the majority of any brand's revenue comes from light buyers who buy infrequently. Heavy buyers are a small minority. Marketing should reach ALL category buyers, not just heavy users.

WHY THIS MATTERS FOR PRIMO MARCA:
These laws explain why some clients' marketing isn't working — they're targeting too narrowly, investing in loyalty instead of acquisition, and measuring the wrong metrics (engagement instead of reach). The AI Brain should use these laws to diagnose marketing strategy problems.`,
  applicationSteps: [
    'Audit the client\'s buyer base — what % are light vs heavy buyers?',
    'Check for Double Jeopardy — is the brand small with low loyalty? That\'s normal, not a loyalty problem.',
    'Map the Duplication of Purchase — who else do their customers buy from? (It\'s probably everyone)',
    'Shift investment from loyalty to acquisition — reach more people, more often',
    'Build distinctive assets — invest in recognizable brand cues, not "differentiation"',
    'Measure penetration (% of category buyers who buy you) not loyalty metrics',
  ],
  commonMistakes: [
    'Investing heavily in loyalty programs when the brand needs more buyers',
    'Targeting "ideal customers" too narrowly and missing the vast majority of potential buyers',
    'Measuring engagement rate instead of reach — a viral post seen by fans is worth less than a boring ad seen by new people',
    'Assuming brand switching means you have a quality problem — it\'s normal behavior',
    'Confusing distinctiveness with differentiation — you need to be RECOGNIZED, not necessarily "different"',
  ],
  examples: [
    {
      brand: 'Coca-Cola vs Pepsi',
      context: 'Double Jeopardy in action — market share determines loyalty, not the other way around',
      strategy: 'Coca-Cola has higher market share (44.9% vs 25.9%) AND higher loyalty. This isn\'t because Coke tastes better — it\'s Double Jeopardy. Coke\'s strategy: maximize reach and availability rather than trying to "convert" Pepsi drinkers.',
      results: 'Coca-Cola maintains 2:1 market share advantage for 130+ years.',
      numbers: 'Coke 44.9% vs Pepsi 25.9% US CSD market share, Coke revenue $45.8B vs Pepsi beverage $23B',
      region: 'global',
    },
    {
      brand: 'Aldi',
      context: 'Growing through penetration, not loyalty — proving Ehrenberg-Bass right',
      strategy: 'Aldi doesn\'t try to make existing customers more loyal — it focuses on getting MORE people to try Aldi. Simple stores, limited range, low prices, and increasing distribution. Classic penetration-driven growth.',
      results: 'UK market share reached record 10.1%. Fastest-growing grocery chain in multiple markets.',
      numbers: 'UK market share 10.1% (record), 10,000+ stores globally, revenue €134.5B (Aldi Group)',
      region: 'global',
    },
    {
      brand: 'McDonald\'s',
      context: 'Natural Monopoly Law — dominant brand captures light buyers',
      strategy: 'McDonald\'s serves 69M+ customers daily because it has the highest physical availability (40,000+ locations) and mental availability (golden arches recognized globally). Most McDonald\'s customers are LIGHT buyers who eat there occasionally — and that\'s where the volume is.',
      results: 'Serves 69M+ customers daily. Revenue $25.5B. The ultimate example of penetration-driven growth.',
      numbers: '69M+ daily customers, 40,000+ locations, $25.5B revenue, brand value $196B',
      region: 'global',
    },
    {
      brand: 'Almarai',
      context: 'Applying Ehrenberg-Bass principles in MENA dairy market',
      strategy: 'Almarai dominates GCC dairy through maximum physical availability (in every store, every format) and distinctive assets (green packaging, "Quality you can trust" tagline). They don\'t try to be "different" from competitors — they try to be EVERYWHERE and ALWAYS top-of-mind.',
      results: 'Largest vertically integrated dairy company in the world. Dominant GCC market share.',
      numbers: 'Revenue SAR 22.3B, 2,200+ SKUs, operations in 6 countries, dominant GCC market share',
      region: 'mena',
    },
    {
      brand: 'Souq.com → Amazon.ae',
      context: 'Natural Monopoly in MENA e-commerce',
      strategy: 'Souq.com built the largest e-commerce platform in MENA through penetration: widest product range, most sellers, fastest delivery. When Amazon acquired it for $580M, it was because Souq had achieved Natural Monopoly status — the biggest platform attracts the most light buyers.',
      results: 'Acquired by Amazon for $580M. Became Amazon.ae — the dominant e-commerce platform in UAE.',
      numbers: 'Acquired for $580M (2017), largest e-commerce platform in MENA at time of acquisition',
      region: 'mena',
    },
  ],
  clientTalkingPoints: [
    'Here\'s a hard truth backed by 60 years of research: your loyalty program isn\'t growing your brand. The data shows that brands grow by getting MORE buyers, not by making existing buyers more loyal. Let me show you where the real growth opportunity is.',
    'Your "ideal customer" targeting is actually limiting your growth. Research from the Ehrenberg-Bass Institute shows that brands share customers with ALL competitors — not just similar ones. We need to broaden your reach.',
    'Most of your revenue comes from people who buy from you occasionally — light buyers. They\'re not "disloyal" — that\'s normal behavior. The question is: how do we reach MORE of them?',
  ],
  counterArguments: `The biggest criticism is that Ehrenberg-Bass research is based primarily on FMCG data and may not apply to luxury, B2B, or subscription businesses. Mark Ritson argues that targeting and differentiation still matter for premium brands. The nuance: for mass-market brands, Ehrenberg-Bass is largely correct. For premium/luxury brands (WZZRD AI's focus), a hybrid approach works — use distinctive assets and broad reach (Ehrenberg-Bass) combined with premium identity (Kapferer) and behavioral pricing (Kahneman).`,
  connectionToOtherFrameworks: 'Foundational to Sharp\'s "How Brands Grow" (Sharp is the Institute\'s director), challenges Keller\'s brand equity model (loyalty is less important than penetration), and complements Porter\'s market share analysis (bigger brands have structural advantages).',
  tags: ['brand_growth', 'marketing_science', 'penetration', 'loyalty', 'distinctive_assets', 'evidence_based'],
};

// ═══════════════════════════════════════════════════════════════════════
// ALL FRAMEWORKS COLLECTION
// ═══════════════════════════════════════════════════════════════════════

export const ACADEMIC_FRAMEWORKS: AcademicFramework[] = [
  KAPFERER_PRISM,
  SHARP_HOW_BRANDS_GROW,
  KAHNEMAN_BEHAVIORAL_ECONOMICS,
  CIALDINI_INFLUENCE,
  PORTER_FIVE_FORCES,
  BLUE_OCEAN_STRATEGY,
  PREMIUM_PRICING,
  BRAND_REPOSITIONING,
  CUSTOMER_JOURNEY,
  EHRENBERG_BASS_LAWS,
];

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Find frameworks relevant to a client's situation
 */
export function matchFrameworks(context: {
  clientSituation?: string;
  serviceType?: string;
  tags?: string[];
  limit?: number;
}): AcademicFramework[] {
  const { clientSituation, serviceType, tags, limit = 5 } = context;
  
  const scored = ACADEMIC_FRAMEWORKS.map(fw => {
    let score = 0;
    const situation = (clientSituation || '').toLowerCase();
    const service = (serviceType || '').toLowerCase();
    
    // Tag matching
    if (tags) {
      for (const tag of tags) {
        if (fw.tags.includes(tag.toLowerCase())) score += 3;
      }
    }
    
    // Situation keyword matching
    if (situation) {
      if (situation.includes('premium') || situation.includes('luxury') || situation.includes('pricing')) {
        if (fw.category === 'pricing' || fw.id === 'kahneman_behavioral_economics') score += 5;
      }
      if (situation.includes('reposition') || situation.includes('rebrand') || situation.includes('transform')) {
        if (fw.id === 'brand_repositioning' || fw.id === 'blue_ocean_strategy') score += 5;
      }
      if (situation.includes('identity') || situation.includes('brand identity') || situation.includes('logo')) {
        if (fw.id === 'kapferer_prism') score += 5;
      }
      if (situation.includes('growth') || situation.includes('grow') || situation.includes('scale')) {
        if (fw.category === 'brand_growth') score += 5;
      }
      if (situation.includes('compet') || situation.includes('market analysis') || situation.includes('industry')) {
        if (fw.category === 'competitive_strategy') score += 5;
      }
      if (situation.includes('customer') || situation.includes('journey') || situation.includes('experience')) {
        if (fw.id === 'customer_journey') score += 5;
      }
      if (situation.includes('proposal') || situation.includes('sales') || situation.includes('convince')) {
        if (fw.id === 'cialdini_influence' || fw.id === 'kahneman_behavioral_economics') score += 4;
      }
      // MENA market keywords
      if (situation.includes('egypt') || situation.includes('مصر')) {
        for (const ex of fw.examples) {
          if (ex.region === 'egypt') score += 2;
        }
      }
      if (situation.includes('saudi') || situation.includes('ksa') || situation.includes('السعودية')) {
        for (const ex of fw.examples) {
          if (ex.region === 'ksa') score += 2;
        }
      }
      // General MENA
      if (situation.includes('mena') || situation.includes('arab') || situation.includes('middle east')) {
        for (const ex of fw.examples) {
          if (ex.region === 'mena' || ex.region === 'egypt' || ex.region === 'ksa' || ex.region === 'uae') score += 1;
        }
      }
    }
    
    // Service type matching
    if (service) {
      if (service.includes('clarity') || service.includes('audit') || service.includes('diagnosis')) {
        if (fw.id === 'kapferer_prism' || fw.id === 'porter_five_forces') score += 3;
      }
      if (service.includes('foundation') || service.includes('identity') || service.includes('brand')) {
        if (fw.id === 'kapferer_prism' || fw.id === 'brand_repositioning') score += 3;
      }
      if (service.includes('growth') || service.includes('partnership') || service.includes('scale')) {
        if (fw.category === 'brand_growth' || fw.id === 'customer_journey') score += 3;
      }
    }
    
    return { framework: fw, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.framework);
}

/**
 * Format frameworks for injection into AI prompts
 */
export function formatFrameworksForPrompt(frameworks: AcademicFramework[]): string {
  if (frameworks.length === 0) return '';
  
  let output = '## ACADEMIC FRAMEWORKS & REAL-WORLD EXAMPLES\n\n';
  output += 'Use these frameworks and examples in your analysis, proposals, and client conversations. Always cite specific examples with numbers.\n\n';
  
  for (const fw of frameworks) {
    output += `### ${fw.name} (${fw.creator}, ${fw.year})\n`;
    output += `${fw.oneLiner}\n\n`;
    
    // Key components
    output += '**Components:**\n';
    for (const comp of fw.components) {
      output += `- ${comp}\n`;
    }
    output += '\n';
    
    // Real-world examples with numbers
    output += '**Real-World Examples:**\n';
    for (const ex of fw.examples) {
      output += `- **${ex.brand}** (${ex.region.toUpperCase()}): ${ex.context}. Strategy: ${ex.strategy.substring(0, 200)}... Results: ${ex.results} Numbers: ${ex.numbers}\n`;
    }
    output += '\n';
    
    // Client talking points
    output += '**Use These Talking Points:**\n';
    for (const tp of fw.clientTalkingPoints) {
      output += `- "${tp}"\n`;
    }
    output += '\n';
    
    // Counter-arguments
    output += `**Limitations:** ${fw.counterArguments.substring(0, 200)}...\n\n`;
    output += '---\n\n';
  }
  
  return output;
}

/**
 * Get all frameworks formatted for the full knowledge base
 */
export function getAllFrameworksForKnowledgeBase(): string {
  let output = `# ═══════════════════════════════════════════════════════════════════════
# ACADEMIC FRAMEWORKS LIBRARY — 10 DEEP FRAMEWORKS WITH REAL-WORLD EXAMPLES
# ═══════════════════════════════════════════════════════════════════════

## HOW TO USE THESE FRAMEWORKS
- In DISCOVERY: Use frameworks to structure your analysis and ask better questions
- In DIAGNOSIS: Reference specific frameworks to explain what's wrong and why
- In PROPOSALS: Cite frameworks and examples to justify your recommendations and pricing
- In DELIVERABLES: Build on these frameworks to create strategy documents
- ALWAYS cite specific examples with REAL NUMBERS — never use generic statements

## FRAMEWORK QUICK REFERENCE
`;
  
  for (const fw of ACADEMIC_FRAMEWORKS) {
    output += `- **${fw.name}** (${fw.creator}, ${fw.year}): ${fw.oneLiner}\n`;
  }
  output += '\n';
  
  // Add full details for each framework
  for (const fw of ACADEMIC_FRAMEWORKS) {
    output += `## ${fw.name}\n`;
    output += `*${fw.creator} (${fw.year}) — Category: ${fw.category}*\n\n`;
    output += `${fw.deepExplanation}\n\n`;
    
    output += '### Components\n';
    for (const comp of fw.components) {
      output += `- ${comp}\n`;
    }
    output += '\n';
    
    output += '### Application Steps\n';
    for (let i = 0; i < fw.applicationSteps.length; i++) {
      output += `${i + 1}. ${fw.applicationSteps[i]}\n`;
    }
    output += '\n';
    
    output += '### Common Mistakes\n';
    for (const m of fw.commonMistakes) {
      output += `- ${m}\n`;
    }
    output += '\n';
    
    output += '### Real-World Examples\n';
    for (const ex of fw.examples) {
      output += `**${ex.brand}** (${ex.region.toUpperCase()}):\n`;
      output += `- Context: ${ex.context}\n`;
      output += `- Strategy: ${ex.strategy}\n`;
      output += `- Results: ${ex.results}\n`;
      output += `- Key Numbers: ${ex.numbers}\n\n`;
    }
    
    output += '### Client Talking Points\n';
    for (const tp of fw.clientTalkingPoints) {
      output += `> "${tp}"\n\n`;
    }
    
    output += `### Limitations & Counter-Arguments\n${fw.counterArguments}\n\n`;
    output += `### Connection to Other Frameworks\n${fw.connectionToOtherFrameworks}\n\n`;
    output += '---\n\n';
  }
  
  return output;
}

/**
 * Get a specific framework by ID
 */
export function getFrameworkById(id: string): AcademicFramework | null {
  return ACADEMIC_FRAMEWORKS.find(fw => fw.id === id) || null;
}

/**
 * Get all examples for a specific region
 */
export function getExamplesByRegion(region: 'global' | 'mena' | 'egypt' | 'ksa' | 'uae'): RealWorldExample[] {
  const examples: RealWorldExample[] = [];
  for (const fw of ACADEMIC_FRAMEWORKS) {
    for (const ex of fw.examples) {
      if (ex.region === region || (region === 'mena' && ['mena', 'egypt', 'ksa', 'uae'].includes(ex.region))) {
        examples.push(ex);
      }
    }
  }
  return examples;
}
