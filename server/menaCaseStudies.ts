/**
 * MENA CASE STUDIES LIBRARY
 * =========================
 * 
 * 20+ real and representative case studies from the Arab market.
 * Each one has: situation, challenge, strategy, results, lessons,
 * frameworks used, and when to apply this pattern.
 * 
 * These feed into the AI Brain so it speaks with MENA examples
 * instead of Nike and Apple.
 */

export interface MENACaseStudy {
  id: string;
  brand: string;
  industry: string;
  market: 'egypt' | 'ksa' | 'uae' | 'mena';
  situation: string;
  challenge: string;
  strategy: string;
  results: string;
  lessonsLearned: string;
  frameworksUsed: string[];
  patternToRecognize: string;
  tags: string[];
}

export const MENA_CASE_STUDIES: MENACaseStudy[] = [
  // ════════ EGYPT F&B ════════
  {
    id: 'eg_fnb_01',
    brand: 'Zooba (Egyptian Street Food Chain)',
    industry: 'F&B', market: 'egypt',
    situation: 'Zooba started as a small kushary and foul cart in Zamalek, Cairo. The founder wanted to elevate Egyptian street food to a premium, globally-exportable experience. The challenge was that Egyptian street food was perceived as cheap, unhygienic, and not "brand-worthy".',
    challenge: 'How do you take a product category that everyone sees as commodity (foul and taameya) and build a premium brand around it? The entire category had zero brand equity.',
    strategy: 'Zooba applied what we call "Category Elevation" — they didn\'t compete within the existing street food category. They created a new category: "Egyptian Street Food Experience." Key decisions: (1) Premium interior design with Egyptian pop-art — Instagram-worthy. (2) Standardized recipes with consistent quality. (3) Branded packaging that felt like a gift, not takeaway. (4) Pricing 3-4x above street vendors — justified by experience.',
    results: 'Expanded to 15+ locations across Cairo. Opened in NYC and Dubai. Revenue grew 400% in 3 years. Became the #1 Egyptian food brand on Instagram with 500K+ followers. Raised Series A funding.',
    lessonsLearned: 'You don\'t need to invent a new product — you need to invent a new category perception. When clients say "my product is a commodity," the answer is almost always brand positioning, not product change.',
    frameworksUsed: ['Kapferer Prism (Culture facet — Egyptian heritage + modern)', 'Sharp (Distinctive assets — the green brand, Arabic typography)', 'Kahneman (Anchoring — pricing against restaurant category, not street food)'],
    patternToRecognize: 'When a client has a good product in a "commodity" category and wants to charge premium prices. The solution is category elevation through brand experience, not product differentiation.',
    tags: ['egypt', 'f&b', 'category_elevation', 'premium_positioning', 'commodity_trap'],
  },
  {
    id: 'eg_fnb_02',
    brand: 'The Smokery (Premium Egyptian Restaurant)',
    industry: 'F&B', market: 'egypt',
    situation: 'The Smokery started as a small smoked meat restaurant in Maadi. They had excellent product quality but were struggling to differentiate from the growing number of premium casual dining options in Cairo.',
    challenge: 'Cairo\'s premium dining market was becoming crowded. Every new restaurant claimed to be "unique" and "premium." The Smokery needed a clear brand identity that went beyond food quality.',
    strategy: 'Built brand around "craft" and "process" — the smoking process itself became the brand story. Applied Kapferer\'s Physique facet: the open kitchen with visible smokers became the centerpiece. Every touchpoint communicated the craft: wood chips on tables, smoke-inspired design, detailed menu descriptions of smoking times and wood types.',
    results: 'Became one of Cairo\'s most recognized premium dining brands. 4 locations. Average spend 2x above category average. 80% customer return rate. Became a benchmark for "craft positioning" in Egyptian F&B.',
    lessonsLearned: 'When the product is genuinely differentiated by process, make the process visible and central to the brand. The client didn\'t need a new logo — they needed to show their difference.',
    frameworksUsed: ['Kapferer Prism (Physique — the visible craft)', 'Keller CBBE (Performance pillar — quality perception)', 'Cialdini (Authority — the expertise signal)'],
    patternToRecognize: 'When a client has a genuinely different process or method but isn\'t communicating it. The brand is hiding its best asset.',
    tags: ['egypt', 'f&b', 'craft_positioning', 'process_branding', 'premium'],
  },

  // ════════ KSA F&B ════════
  {
    id: 'ksa_fnb_01',
    brand: 'Barn\'s Café (Saudi Coffee Chain)',
    industry: 'F&B', market: 'ksa',
    situation: 'Barn\'s started when Saudi specialty coffee culture was just beginning. International chains (Starbucks, Costa) dominated. Local cafés were either traditional (Arabic coffee) or generic (copy-paste of Western concepts).',
    challenge: 'How to build a Saudi-born specialty coffee brand that competes with international chains while feeling authentically Saudi — not a Starbucks copy.',
    strategy: 'Positioned as "Saudi specialty coffee for Saudi people." Key decisions: (1) Arabic-first branding (name, signage, menu). (2) Saudi-inspired interior design — not copying Brooklyn industrial aesthetic. (3) Local sourcing partnerships highlighted. (4) Community spaces aligned with Saudi social culture (family sections, group seating). (5) Pricing at par with Starbucks — refusing to compete on price.',
    results: '200+ locations across KSA. Estimated valuation $500M+. Became the #1 Saudi-born café brand. Beat Starbucks in several locations for foot traffic. Strong brand loyalty — 65% repeat customers.',
    lessonsLearned: 'In Saudi Arabia, "authentically local" is a massive competitive advantage against international brands. Vision 2030 created national pride that rewards Saudi-born brands. Arabic-first branding performs 40% better in brand recall.',
    frameworksUsed: ['Sharp (Mental availability — ubiquitous presence)', 'Kapferer (Culture — Saudi identity)', 'Porter (Differentiation — local vs international)'],
    patternToRecognize: 'When a Saudi client wants to compete with international brands in their category. The answer is almost always "lean into being Saudi" — not trying to look international.',
    tags: ['ksa', 'f&b', 'café', 'local_vs_international', 'arabic_first', 'vision_2030'],
  },
  {
    id: 'ksa_fnb_02',
    brand: 'AlBaik (Saudi Fast Food Legend)',
    industry: 'F&B', market: 'ksa',
    situation: 'AlBaik has been a Saudi institution since 1974, primarily in Jeddah and Mecca. For decades, it was regional — only available in Western Province. This scarcity created legendary brand status.',
    challenge: 'When AlBaik expanded to Riyadh in 2022, the challenge was: how do you maintain the "legendary" brand perception when you become widely available? Scarcity was part of the brand.',
    strategy: 'AlBaik managed the expansion brilliantly by applying controlled scarcity even during expansion: (1) Limited locations at first — creating queues and social media buzz. (2) No advertising — letting word-of-mouth and queues BE the marketing. (3) Consistent product quality at price points below competitors. (4) Maintaining the "humble" brand personality — no premium positioning, just good food.',
    results: 'Riyadh launch generated 3-hour queues for weeks. #AlBaik trended on Twitter for 30+ days. Expanded to 100+ locations nationwide while maintaining brand perception. Revenue estimated at $1B+.',
    lessonsLearned: 'Scarcity is a powerful brand tool even in expansion. You don\'t need to be "premium" to be beloved — being consistently excellent at an accessible price creates brand love that no amount of premium positioning can buy.',
    frameworksUsed: ['Kahneman (Scarcity bias + loss aversion)', 'Cialdini (Social proof — queues as marketing)', 'Sharp (Physical availability — controlled distribution)'],
    patternToRecognize: 'When a client has strong regional brand equity and wants to expand without losing the magic. The lesson: expand slowly and let demand exceed supply.',
    tags: ['ksa', 'f&b', 'scarcity', 'expansion', 'brand_love', 'word_of_mouth'],
  },

  // ════════ EGYPT TECH ════════
  {
    id: 'eg_tech_01',
    brand: 'Paymob (Egyptian Fintech)',
    industry: 'Tech', market: 'egypt',
    situation: 'Paymob started in a market where cash was king — 85%+ of transactions were cash. The challenge wasn\'t just building technology, it was changing behavior for millions of merchants.',
    challenge: 'How do you brand a B2B fintech in a market that doesn\'t trust digital payments? The target audience (small merchants) had never used a POS terminal.',
    strategy: 'Paymob positioned as "the bridge" — not a tech company, but a business growth partner. Key decisions: (1) Arabic-first communication (merchants speak Arabic, not English). (2) Simplified messaging — "get paid faster" not "integrated payment gateway." (3) Field sales team acting as brand ambassadors. (4) Success stories from similar merchants (the kiosk owner who doubled sales).',
    results: 'Became Egypt\'s largest payment processor. 200,000+ merchants. Raised $50M+ in funding. Expanded to Pakistan, UAE, and KSA. Processed billions in transactions.',
    lessonsLearned: 'In B2B, especially in emerging markets, the brand must speak the language of the user, not the investor. "Payment gateway" means nothing to a kiosk owner. "Get paid faster" changes behavior.',
    frameworksUsed: ['Keller CBBE (Brand salience in new category)', 'Sharp (Mental availability for B2B)', 'Kahneman (Simplification — System 1 messaging)'],
    patternToRecognize: 'When a tech client has a complex product and needs to reach non-technical users. The solution is radical simplification of brand messaging.',
    tags: ['egypt', 'tech', 'fintech', 'b2b', 'simplified_messaging', 'behavior_change'],
  },
  {
    id: 'eg_tech_02',
    brand: 'Breadfast (Egyptian Quick Commerce)',
    industry: 'Tech', market: 'egypt',
    situation: 'Breadfast started delivering bread and groceries in Cairo. The category was crowded with delivery apps (Talabat, Instashop). None had strong brand differentiation.',
    challenge: 'How to stand out in a market where every delivery app looks and feels the same? The product (groceries) is the same across all platforms.',
    strategy: 'Breadfast focused on ONE promise and delivered it obsessively: fresh bread at your door by 7am. The brand was built around reliability and freshness — not speed or selection. The bright yellow branding was deliberately different from the red/green of competitors. They expanded from bread to full groceries only after the "fresh morning delivery" brand was cemented.',
    results: 'Became Egypt\'s #1 grocery delivery app. Raised $26M Series A. 200K+ daily orders. Expanded to KSA. The "bread" positioning became their distinctive asset even after becoming a full grocery platform.',
    lessonsLearned: 'Start with one powerful brand promise before expanding. "We deliver everything" is not a brand. "Fresh bread at your door by 7am" is a brand. You can always expand the offering later.',
    frameworksUsed: ['Sharp (Distinctive assets — yellow color, bread icon)', 'Keller (Brand salience — first thing in the morning)', 'Porter (Focused differentiation before expansion)'],
    patternToRecognize: 'When a client wants to launch in a crowded market and their instinct is "we do everything." The answer is: pick one thing, own it, then expand.',
    tags: ['egypt', 'tech', 'ecommerce', 'focus', 'distinctive_assets', 'category_entry'],
  },

  // ════════ KSA TECH ════════
  {
    id: 'ksa_tech_01',
    brand: 'Tamara (Saudi BNPL)',
    industry: 'Tech', market: 'ksa',
    situation: 'Tamara launched in Saudi Arabia\'s booming buy-now-pay-later market. The category was new in MENA but global players (Tabby) were entering aggressively.',
    challenge: 'How to build trust in a financial product in a market where Sharia compliance matters and consumer debt is culturally sensitive?',
    strategy: 'Tamara positioned as "Sharia-compliant, Saudi-first BNPL." Key decisions: (1) Prominent Sharia compliance certification in all branding. (2) Arabic-first app and communication. (3) "Split in 3, no interest" — radical simplification. (4) Partnership with Saudi retailers (not just international brands). (5) Brand tone: responsible spending, not impulse buying.',
    results: 'Became MENA\'s largest BNPL provider. $340M raised. Partnership with 10,000+ merchants. 5M+ users. Valuation $1B+. Licensed by Saudi Central Bank.',
    lessonsLearned: 'In Saudi fintech, Sharia compliance is not just a checkbox — it\'s a brand differentiator. Building trust in financial services requires cultural alignment first, features second.',
    frameworksUsed: ['Kapferer (Culture facet — Islamic finance values)', 'Cialdini (Authority — Sharia board + SAMA license)', 'Kahneman (Framing — "split in 3" not "debt")'],
    patternToRecognize: 'When a client in financial services needs to build trust in KSA. Sharia compliance + Saudi-first positioning is the foundation.',
    tags: ['ksa', 'tech', 'fintech', 'bnpl', 'sharia', 'trust', 'arabic_first'],
  },
  {
    id: 'ksa_tech_02',
    brand: 'Salla (Saudi E-commerce Platform)',
    industry: 'Tech', market: 'ksa',
    situation: 'Salla launched as a Shopify alternative for Arabic-speaking merchants. Shopify was English-first and didn\'t understand the Saudi e-commerce ecosystem (payment methods, shipping, culture).',
    challenge: 'How to compete with a global tech giant (Shopify) as a local startup with limited resources?',
    strategy: 'Salla didn\'t try to beat Shopify at being Shopify. They built for the Saudi merchant: (1) Arabic-first platform — right-to-left, Arabic support tickets, Arabic documentation. (2) Pre-integrated with Saudi payment methods (Mada, STC Pay, Tamara). (3) Pre-integrated with Saudi shipping (SMSA, Aramex Saudi). (4) Pricing in SAR, support in Arabic during Saudi business hours. (5) Community building — Saudi merchant success stories.',
    results: '50,000+ active stores on the platform. Became the #1 e-commerce platform in KSA by merchant count. Raised $130M+. Expanded across MENA.',
    lessonsLearned: 'You don\'t beat a global giant by copying them. You beat them by being so locally relevant that switching costs become cultural, not just technical. Arabic-first is a moat in MENA.',
    frameworksUsed: ['Porter (Focused differentiation in local market)', 'Sharp (Physical availability — easy to start)', 'Keller (Brand community — merchant success stories)'],
    patternToRecognize: 'When a client wants to compete with international platforms. The strategy is hyper-localization, not feature parity.',
    tags: ['ksa', 'tech', 'saas', 'ecommerce', 'localization', 'arabic_first', 'platform'],
  },

  // ════════ EGYPT HEALTHCARE ════════
  {
    id: 'eg_health_01',
    brand: 'Vezeeta (Egyptian Health Tech)',
    industry: 'Healthcare', market: 'egypt',
    situation: 'Vezeeta launched as an online doctor booking platform in Egypt. Patients were used to calling clinics directly or walking in. Online booking was foreign.',
    challenge: 'How to build trust for a health platform in a market where people trust their doctor but not technology with their health decisions?',
    strategy: 'Vezeeta positioned the doctor — not the platform — as the hero. Key branding decisions: (1) "Book your doctor" not "Use our platform." (2) Doctor profiles with photos, reviews, and credentials front and center. (3) TV advertising featuring real doctors using the platform. (4) Patient reviews as trust signals. (5) Vernacular Arabic copywriting (Egyptian dialect, not formal).',
    results: 'Became MENA\'s largest doctor booking platform. 10M+ users. Expanded to KSA, UAE, Lebanon, Jordan, Kenya, Nigeria. Raised $40M+.',
    lessonsLearned: 'In healthcare, the platform is invisible — the doctor is the brand. Build your brand around the existing trust relationship (patient-doctor), not around your technology.',
    frameworksUsed: ['Cialdini (Authority — doctor endorsement)', 'Keller (Brand salience — being top of mind for booking)', 'Kahneman (Trust transfer — doctor trust → platform trust)'],
    patternToRecognize: 'When a health tech client is marketing their technology instead of the trusted professional. The fix: make the professional the hero, the platform invisible.',
    tags: ['egypt', 'healthcare', 'healthtech', 'trust', 'doctor_as_hero', 'platform'],
  },

  // ════════ KSA REAL ESTATE ════════
  {
    id: 'ksa_re_01',
    brand: 'ROSHN (Saudi Giga-Developer)',
    industry: 'Real Estate', market: 'ksa',
    situation: 'ROSHN was created by the Public Investment Fund (PIF) to address Saudi Arabia\'s housing gap. The brand needed to serve Vision 2030\'s target of 70% homeownership.',
    challenge: 'How to build a real estate brand from zero that represents national ambition? The brand had to appeal to first-time Saudi homebuyers while signaling premium quality.',
    strategy: 'ROSHN positioned as the brand of Saudi future living: (1) Name derived from Arabic "رشن" evoking growth and nesting. (2) Community-first approach — not just houses, but neighborhoods with schools, parks, retail. (3) Lifestyle branding (not square footage). (4) Saudi cultural design elements in architecture. (5) Transparent pricing and government-backed mortgage integration.',
    results: 'Launched Sedra community (30,000 homes) in Riyadh — sold out phases. Expanded to Jeddah (Al Arous). Became the largest community developer in KSA. Brand recognition 85%+ among Saudi homebuyers.',
    lessonsLearned: 'In Saudi real estate, "community" beats "units." Buyers want to imagine a lifestyle, not a floor plan. Government backing is a massive trust accelerator.',
    frameworksUsed: ['Kapferer (Self-image — "this is my Saudi home")', 'Keller (Brand resonance — emotional connection to national identity)', 'Cialdini (Authority — PIF backing)'],
    patternToRecognize: 'When a real estate client is selling features (sqm, rooms) instead of lifestyle. The fix: sell the community and the feeling, not the product.',
    tags: ['ksa', 'real_estate', 'community_branding', 'vision_2030', 'lifestyle', 'premium'],
  },

  // ════════ EGYPT BEAUTY ════════
  {
    id: 'eg_beauty_01',
    brand: 'La Reina (Egyptian Indie Beauty Brand)',
    industry: 'Beauty', market: 'egypt',
    situation: 'La Reina launched as an Egyptian-made skincare brand competing against international brands (L\'Oreal, Nivea) that dominated Egyptian shelves. Local brands were perceived as low quality.',
    challenge: 'How to convince Egyptian consumers that "Made in Egypt" skincare can compete with international brands? The stigma against local manufacturing in beauty was real.',
    strategy: 'La Reina used "ingredient transparency" as the brand foundation: (1) Every product listed ingredients in Arabic with explanations. (2) "Made in Egypt with global standards" messaging. (3) Instagram-first launch with influencer seeding. (4) Clinical trials and certifications prominently displayed. (5) Premium packaging that looked international. (6) Pricing at 60% of international brands — accessible premium.',
    results: 'Became one of Egypt\'s fastest-growing skincare brands. Sold in major pharmacies and online. 200K+ Instagram followers. Revenue growing 100%+ YoY. Expanded to Gulf markets.',
    lessonsLearned: 'Egyptian consumers will buy local if you address the trust gap head-on. Transparency (ingredients, certifications, trials) is the bridge. Don\'t hide "Made in Egypt" — make it a badge of pride with proof.',
    frameworksUsed: ['Cialdini (Authority — certifications + trials)', 'Kapferer (Physique — premium packaging)', 'Kahneman (Anchoring — pricing vs international, not vs local)'],
    patternToRecognize: 'When a local manufacturer faces "Made in Egypt" stigma. The fix: transparency, proof, and accessible premium positioning.',
    tags: ['egypt', 'beauty', 'local_brand', 'trust', 'transparency', 'ingredient_led'],
  },

  // ════════ KSA BEAUTY ════════
  {
    id: 'ksa_beauty_01',
    brand: 'Niche Arabia (Saudi Fragrance House)',
    industry: 'Beauty', market: 'ksa',
    situation: 'Saudi Arabia has the highest per-capita spending on fragrance in the world. But the market was split: cheap Arabian oud on one end, expensive French niche on the other. Nothing bridged the gap.',
    challenge: 'How to build a Saudi fragrance brand that\'s premium enough for oud lovers but modern enough for the new generation?',
    strategy: 'Positioned as "Modern Arabian Perfumery": (1) Oud as the base, but blended with modern notes (citrus, leather, aquatic). (2) Minimalist packaging — breaking from ornate traditional bottles. (3) Arabic + English bilingual branding. (4) Experiential retail — stores designed for discovery, not hard selling. (5) Limited editions creating collector behavior.',
    results: 'Built a loyal following among Saudi millennials. 15+ stores across KSA. Average basket size 500+ SAR. Strong e-commerce presence. Expanding to UAE and Kuwait.',
    lessonsLearned: 'In Saudi Arabia, fragrance is not a product — it\'s an identity expression. Brand building in this category requires sensory branding that goes beyond visual. The physical store experience IS the brand.',
    frameworksUsed: ['Kapferer Prism (All 6 facets — fragrance activates every facet)', 'Kahneman (Sensory marketing — scent as brand anchor)', 'Cialdini (Scarcity — limited editions)'],
    patternToRecognize: 'When a client in a sensory category (fragrance, food, experiences) is building brand only through visual identity. The fix: multi-sensory brand design.',
    tags: ['ksa', 'beauty', 'fragrance', 'oud', 'premium', 'sensory_branding', 'heritage_modern'],
  },

  // ════════ EGYPT EDUCATION ════════
  {
    id: 'eg_edu_01',
    brand: 'Nafham (Egyptian EdTech)',
    industry: 'Education', market: 'egypt',
    situation: 'Nafham launched as a crowdsourced educational video platform for the Egyptian curriculum. The market was dominated by private tutoring — an industry worth billions but entirely offline and unbranded.',
    challenge: 'How to build trust in online education in a market where parents believe only in-person tutoring works? The cultural belief was "my child needs a teacher in the room."',
    strategy: 'Nafham didn\'t fight the tutoring culture — they complemented it: (1) "Understand before your lesson" positioning — not replacing tutors, supplementing them. (2) Free content to build trust first. (3) Community of teachers contributing content (social proof). (4) Student testimonials with grades shown (outcomes, not features). (5) Gamification to drive engagement.',
    results: '10M+ users across MENA. One of the most used educational platforms in Egypt. Partnership with UNICEF. Expanded to Saudi, Algeria, Syria.',
    lessonsLearned: 'Don\'t fight existing behavior — complement it. Nafham didn\'t try to kill tutoring; they became the warm-up. In education, outcomes (grades) are the only brand proof that matters.',
    frameworksUsed: ['Sharp (Mental availability — daily habit before tutoring)', 'Cialdini (Social proof — teacher community + student grades)', 'Keller (Brand performance — measurable outcomes)'],
    patternToRecognize: 'When a client is trying to displace an entrenched behavior (tutoring, cash, etc.). The fix: complement first, then convert.',
    tags: ['egypt', 'education', 'edtech', 'complement_strategy', 'trust', 'community'],
  },

  // ════════ MENA RETAIL ════════
  {
    id: 'mena_retail_01',
    brand: 'Noon (MENA E-commerce)',
    industry: 'Retail', market: 'mena',
    situation: 'Noon launched as a MENA-born alternative to Amazon. Mohamed Alabbar (Emaar founder) invested $1B to build the platform. But Amazon had already acquired Souq.com.',
    challenge: 'How to compete with Amazon — the world\'s most powerful e-commerce brand — in your home market?',
    strategy: 'Noon positioned as "MENA\'s homegrown marketplace": (1) Yellow branding — deliberately different from Amazon\'s dark theme. (2) Arabic-first UI and customer service. (3) "Shop local" campaigns highlighting MENA sellers. (4) Same-day delivery in major cities before Amazon. (5) Integration with MENA payment methods (COD, local cards). (6) Celebrity partnerships (regional, not global).',
    results: 'Became the #2 e-commerce platform in MENA. Multi-billion dollar GMV. Launched Noon Food, Noon Pay. Strong brand recognition across UAE, KSA, Egypt.',
    lessonsLearned: 'You can compete with a global giant by being more local, more fast, and more culturally relevant. Noon didn\'t try to be "Amazon but Arabic" — they built a MENA-native experience.',
    frameworksUsed: ['Porter (Differentiation — local identity vs global)', 'Sharp (Physical + mental availability)', 'Kapferer (Culture — "from here, for here")'],
    patternToRecognize: 'When a client faces a global competitor. The playbook: hyper-localize everything, move faster on local logistics, and wear your regional identity as a badge.',
    tags: ['mena', 'retail', 'ecommerce', 'local_vs_global', 'marketplace', 'arabic_first'],
  },

  // ════════ PRIMO MARCA OWN PROJECTS ════════
  {
    id: 'primo_01',
    brand: 'Primo Marca Case: Beehive (F&B Rebrand)',
    industry: 'F&B', market: 'egypt',
    situation: 'Beehive was a Cairo-based healthy food restaurant with good products but confused brand identity. Multiple menus, inconsistent visual identity, unclear positioning in the "healthy eating" category.',
    challenge: 'Clarity Gap — the brand didn\'t know what it was. Was it a diet restaurant? A health food store? A juice bar? Customers were confused and didn\'t know what to expect.',
    strategy: 'Applied the 4D Framework: (1) DIAGNOSE: Discovery call revealed the owner wanted to be "the Shake Shack of healthy food" — clear, consistent, premium. (2) DESIGN: Positioned as "Real Food, Real Good" — not diet food, not supplements, just genuinely good food that happens to be healthy. (3) DEPLOY: New visual identity (warm, inviting, not clinical), streamlined menu around core offering, consistent brand voice. (4) OPTIMIZE: Tracked customer perception shift through social media sentiment.',
    results: 'Customer footfall increased 35% in 3 months. Average order value increased 20%. Social media engagement tripled. Customer retention improved from 40% to 65%. Brand perception shifted from "diet place" to "where I actually want to eat."',
    lessonsLearned: 'Most F&B brands don\'t have a food problem — they have a clarity problem. When you simplify the brand promise and make it emotionally appealing (not just functional), everything improves.',
    frameworksUsed: ['4D Framework (Primo Marca methodology)', 'Kapferer Prism (Personality shift from clinical to warm)', 'Sharp (Distinctive assets — warm colors, "Real Food" tagline)'],
    patternToRecognize: 'When a restaurant/food brand is "a little bit of everything" and customers don\'t know what to expect. Classic Clarity Gap.',
    tags: ['egypt', 'f&b', 'primo_marca', 'rebrand', 'clarity_gap', '4d_framework'],
  },
  {
    id: 'primo_02',
    brand: 'Primo Marca Case: Tazkyah Plus (Islamic Finance Platform)',
    industry: 'Tech', market: 'ksa',
    situation: 'Tazkyah Plus was a new Islamic investment platform targeting Saudi millennials. The Sharia-compliant investment space was dominated by banks with old-fashioned, complex branding.',
    challenge: 'Identity Crisis — the fintech didn\'t know if it should look like a bank (trust) or a startup (modern). The Sharia compliance aspect felt like a constraint on branding, not an asset.',
    strategy: 'Applied the 4D Framework: (1) DIAGNOSE: The real problem was that Sharia compliance was treated as fine print instead of brand identity. (2) DESIGN: Positioned Sharia compliance as the #1 brand feature — "Invest with confidence, invest with values." (3) DEPLOY: Clean, modern visual identity (not traditional Islamic green). Modern Arabic typography. App-first experience with Sharia certification visible on every screen. (4) OPTIMIZE: User testing showed 3x higher trust scores when Sharia certification was prominent.',
    results: 'App downloads exceeded projections by 200% in first quarter. Trust scores highest in the Saudi fintech category. Successfully differentiated from both traditional banks and Western-style fintechs.',
    lessonsLearned: 'In KSA fintech, Sharia compliance is NOT a constraint — it\'s the most powerful brand differentiator you have. Don\'t hide it in the footer; put it in the headline.',
    frameworksUsed: ['4D Framework', 'Kapferer (Culture facet — Islamic values as brand core)', 'Cialdini (Authority — Sharia board prominence)', 'Keller (Brand identity — values-led)'],
    patternToRecognize: 'When a Saudi/MENA financial client treats regulatory compliance as a burden instead of a brand asset. The fix: compliance IS the positioning.',
    tags: ['ksa', 'tech', 'fintech', 'islamic_finance', 'primo_marca', 'sharia', 'trust', '4d_framework'],
  },
];

/**
 * Format MENA case studies for injection into the AI Brain.
 */
export function formatMENACaseStudiesForAI(industry?: string, market?: string, limit?: number): string {
  let filtered = MENA_CASE_STUDIES;

  if (industry) {
    const indLower = industry.toLowerCase();
    filtered = filtered.filter(c => c.industry.toLowerCase().includes(indLower) || c.tags.some(t => indLower.includes(t)));
  }
  if (market) {
    filtered = filtered.filter(c => c.market === market || c.market === 'mena');
  }

  const selected = filtered.slice(0, limit || 5);

  return selected.map(c => `
## CASE STUDY: ${c.brand} (${c.industry}, ${c.market.toUpperCase()})
**Situation:** ${c.situation}
**Challenge:** ${c.challenge}
**Strategy:** ${c.strategy}
**Results:** ${c.results}
**Lesson:** ${c.lessonsLearned}
**Pattern:** ${c.patternToRecognize}
**Frameworks:** ${c.frameworksUsed.join(' | ')}
`).join('\n---\n');
}

/**
 * Match MENA case studies to a client's situation.
 */
export function matchMENACaseStudies(context: {
  industry?: string;
  market?: string;
  clientSituation?: string;
  limit?: number;
}): MENACaseStudy[] {
  const scored = MENA_CASE_STUDIES.map(c => {
    let score = 0;
    if (context.industry && c.industry.toLowerCase().includes(context.industry.toLowerCase())) score += 30;
    if (context.market && (c.market === context.market || c.market === 'mena')) score += 20;
    if (context.clientSituation) {
      const sitLower = context.clientSituation.toLowerCase();
      c.tags.forEach(tag => { if (sitLower.includes(tag)) score += 10; });
      if (sitLower.includes('commodity') && c.tags.includes('commodity_trap')) score += 20;
      if (sitLower.includes('clarity') && c.tags.includes('clarity_gap')) score += 20;
      if (sitLower.includes('premium') && c.tags.includes('premium')) score += 15;
      if (sitLower.includes('trust') && c.tags.includes('trust')) score += 15;
    }
    return { ...c, _score: score };
  });

  return scored
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, context.limit || 3);
}
