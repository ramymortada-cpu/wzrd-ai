/**
 * Template Engine — Maps deliverable types to structured templates
 * and generates smart image prompts based on deliverable content.
 * 
 * This module bridges the gap between "AI writes text" and "AI fills real templates"
 * by providing structured section-by-section generation with quality enforcement.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — Each template has sections with specific instructions
// ═══════════════════════════════════════════════════════════════════════════

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  requiredElements: string[];
  minWordCount: number;
  exampleOutput: string;
}

export interface DeliverableTemplate {
  id: string;
  name: string;
  description: string;
  matchKeywords: string[];
  sections: TemplateSection[];
  imagePromptTemplates: string[];
  pdfStyle: 'report' | 'deck' | 'calendar' | 'brief';
}

export const TEMPLATES: DeliverableTemplate[] = [
  // ─────────────────────────────────────────────────────────
  // TEMPLATE 1: BRAND GUIDELINES DOCUMENT
  // ─────────────────────────────────────────────────────────
  {
    id: "brand_guidelines",
    name: "Brand Guidelines Document",
    description: "Complete brand identity guidelines including logo usage, color palette, typography, tone of voice, and do/don't rules",
    matchKeywords: ["brand guidelines", "brand identity", "visual identity", "brand manual", "brand book", "identity guidelines", "logo usage", "brand standards"],
    sections: [
      {
        id: "brand_overview",
        title: "Brand Overview & Philosophy",
        description: "The brand's mission, vision, values, and personality. This sets the tone for everything that follows.",
        requiredElements: ["Mission statement", "Vision statement", "3-5 core values with explanations", "Brand personality traits (5 adjectives with context)", "Brand archetype with justification"],
        minWordCount: 300,
        exampleOutput: "Mission: To empower SMEs in the MENA region with strategic brand intelligence that drives measurable growth.\n\nVision: To become the region's most trusted brand consultancy, known for combining academic rigor with practical execution.\n\nCore Values:\n1. Strategic Depth — We don't do surface-level. Every recommendation is grounded in frameworks like Keller's CBBE and Porter's Five Forces.\n2. Client Obsession — Your success metrics are our KPIs..."
      },
      {
        id: "logo_usage",
        title: "Logo Usage Guidelines",
        description: "Detailed rules for logo placement, sizing, clear space, color variations, and prohibited uses.",
        requiredElements: ["Primary logo description", "Logo variations (horizontal, vertical, icon-only)", "Minimum size requirements", "Clear space rules", "Color variations (full color, monochrome, reversed)", "Prohibited uses (at least 5 don'ts)"],
        minWordCount: 250,
        exampleOutput: "Primary Logo: The [Brand] wordmark uses a custom-modified typeface that conveys [personality]. The icon element represents [meaning].\n\nMinimum Size: 24mm width for print, 120px for digital.\n\nClear Space: Maintain a minimum clear space equal to the height of the 'X' in the wordmark on all sides.\n\nProhibited Uses:\n✗ Do not stretch or distort the logo\n✗ Do not change the logo colors\n✗ Do not place the logo on busy backgrounds without a container..."
      },
      {
        id: "color_palette",
        title: "Color Palette",
        description: "Primary, secondary, and accent colors with exact values and usage rules.",
        requiredElements: ["Primary color(s) with HEX, RGB, CMYK values", "Secondary color(s) with values", "Accent color(s) with values", "Background colors", "Color usage ratios (60-30-10 rule)", "Color accessibility notes (contrast ratios)", "Color psychology explanation"],
        minWordCount: 200,
        exampleOutput: "Primary: Deep Navy #1A1A2E — Conveys trust, authority, and sophistication. Used for headlines, primary CTAs, and key brand elements. In MENA markets, dark blue resonates with corporate trust (similar to how Emirates and Saudi Aramco use navy).\n\nSecondary: Warm Gold #E8A838 — Represents premium value and ambition. Used for accents, highlights, and secondary elements. The 60-30-10 rule: 60% Navy, 30% White/Neutral, 10% Gold."
      },
      {
        id: "typography",
        title: "Typography System",
        description: "Font families, sizes, weights, and usage hierarchy.",
        requiredElements: ["Primary typeface with rationale", "Secondary typeface", "Arabic typeface (for MENA brands)", "Type scale (H1-H6, body, caption)", "Font weights and when to use each", "Line height and spacing rules"],
        minWordCount: 200,
        exampleOutput: "Primary: Inter — A modern, highly legible sans-serif that works across digital and print. Chosen for its excellent Arabic companion font support and clean geometry.\n\nArabic: IBM Plex Arabic — Maintains the same geometric clarity as Inter while respecting Arabic calligraphic traditions.\n\nType Scale:\n- H1: 48px/56px, Bold (700) — Page titles, hero headlines\n- H2: 36px/44px, SemiBold (600) — Section headers\n- Body: 16px/24px, Regular (400) — Main content..."
      },
      {
        id: "tone_of_voice",
        title: "Tone of Voice & Messaging",
        description: "How the brand speaks, writes, and communicates across different channels.",
        requiredElements: ["Brand voice characteristics (3-4 traits)", "Tone spectrum (formal ↔ casual)", "Writing do's and don'ts", "Channel-specific tone adjustments (social, website, email, presentation)", "Example phrases and rewrites", "Arabic vs English language guidelines"],
        minWordCount: 300,
        exampleOutput: "Voice Characteristics:\n1. Confident, not arrogant — We state facts backed by data. We don't boast.\n   ✓ 'Our methodology has driven 40% average revenue growth for clients'\n   ✗ 'We're the best agency in the region'\n\n2. Strategic, not academic — We use frameworks but explain them simply.\n   ✓ 'We'll map your customer's decision journey to find where you're losing them'\n   ✗ 'We'll apply McKinsey's consumer decision journey framework to analyze touchpoint efficacy'"
      },
      {
        id: "dos_and_donts",
        title: "Brand Do's and Don'ts",
        description: "Clear visual examples of correct and incorrect brand usage.",
        requiredElements: ["At least 8 do's with explanations", "At least 8 don'ts with explanations", "Logo misuse examples", "Color misuse examples", "Typography misuse examples", "Photography/imagery guidelines"],
        minWordCount: 250,
        exampleOutput: "DO's:\n✓ Use the brand colors consistently across all materials\n✓ Maintain clear space around the logo at all times\n✓ Use approved photography that reflects our brand personality\n✓ Write in active voice with clear, direct language\n\nDON'Ts:\n✗ Never use the logo smaller than minimum size\n✗ Never place the logo on a background that reduces contrast below 4.5:1\n✗ Never use Comic Sans or decorative fonts in brand materials\n✗ Never use stock photos that feel generic or inauthentic"
      }
    ],
    imagePromptTemplates: [
      "Professional brand mood board showing color palette, typography samples, and visual direction for a {industry} brand. Clean, modern, sophisticated layout with {primaryColor} and {secondaryColor} as dominant colors. High-end brand presentation style.",
      "Logo usage guidelines sheet showing correct and incorrect logo placements on various backgrounds. Professional brand manual style with clear grid lines and spacing indicators.",
      "Brand color palette presentation with swatches, HEX codes, and usage examples. Premium design studio quality, clean white background with organized color blocks.",
      "Typography specimen sheet showing font hierarchy, sizes, and weights for both English and Arabic text. Professional typographic layout suitable for a brand guidelines document."
    ],
    pdfStyle: 'report'
  },

  // ─────────────────────────────────────────────────────────
  // TEMPLATE 2: STRATEGY DECK
  // ─────────────────────────────────────────────────────────
  {
    id: "strategy_deck",
    name: "Brand Strategy Deck",
    description: "Strategic brand positioning, competitive analysis, and growth roadmap",
    matchKeywords: ["strategy", "strategic", "positioning", "brand strategy", "growth strategy", "market strategy", "competitive strategy", "brand positioning"],
    sections: [
      {
        id: "executive_summary",
        title: "Executive Summary",
        description: "One-page overview of the strategic situation, key findings, and recommended direction.",
        requiredElements: ["Current brand situation in 3 sentences", "Top 3 strategic findings", "Recommended strategic direction", "Expected business impact with numbers"],
        minWordCount: 250,
        exampleOutput: "Current Situation: [Brand] operates in a highly competitive {industry} market in {market} with strong product quality but weak brand differentiation. Despite 5 years in market, brand awareness remains below 15% in the target segment.\n\nKey Findings:\n1. The brand's positioning overlaps with 3 competitors — there's no clear reason to choose [Brand] over alternatives\n2. Customer acquisition cost is 2.3x industry average, suggesting brand isn't pulling its weight in the funnel\n3. Retention rate of 72% indicates strong product-market fit that branding hasn't yet leveraged\n\nRecommended Direction: Reposition from 'quality provider' to 'industry specialist' — own the expert position in {niche}. Expected impact: 30-40% reduction in CAC within 6 months."
      },
      {
        id: "market_analysis",
        title: "Market & Competitive Analysis",
        description: "Deep analysis of the market landscape, competitors, and opportunities.",
        requiredElements: ["Market size and growth rate", "Key market trends (3-5)", "Competitive landscape map", "Competitor positioning analysis (top 3-5)", "White space opportunities", "MENA-specific market dynamics"],
        minWordCount: 400,
        exampleOutput: "Market Overview: The {industry} market in {market} is valued at $X billion (2024) growing at Y% CAGR. Key drivers include [trend 1], [trend 2], and [trend 3].\n\nCompetitive Landscape:\n| Competitor | Position | Strength | Weakness | Market Share |\n|-----------|----------|----------|----------|-------------|\n| Brand A | Premium | Strong brand equity | High prices | 25% |\n| Brand B | Value | Wide distribution | Weak differentiation | 20% |\n\nWhite Space: No competitor currently owns the [specific position]. This represents a $X opportunity."
      },
      {
        id: "brand_positioning",
        title: "Brand Positioning Strategy",
        description: "The core positioning strategy including positioning statement, value proposition, and differentiation.",
        requiredElements: ["Positioning statement (For/Who/Is/That/Because format)", "Value proposition canvas", "Points of Difference (3)", "Points of Parity", "Unfair advantage", "Brand promise"],
        minWordCount: 350,
        exampleOutput: "Positioning Statement:\nFor [target audience] in [market] who need [functional need] and want [emotional need], [Brand] is the [category] that [key benefit] because [reason to believe].\n\nThis positioning is grounded in Keller's CBBE model — we're building from Identity (who are you?) through Meaning (what are you?) to Response (what do I think?) to Resonance (what relationship do we have?).\n\nPoints of Difference:\n1. [POD 1] — Evidence: [specific proof]. Sustainability: [why competitors can't copy this].\n2. [POD 2] — Evidence: [specific proof]."
      },
      {
        id: "growth_roadmap",
        title: "Growth Roadmap & Implementation",
        description: "Phased implementation plan with timelines, KPIs, and resource requirements.",
        requiredElements: ["Phase 1: Quick wins (0-30 days)", "Phase 2: Foundation building (1-3 months)", "Phase 3: Scale (3-6 months)", "Phase 4: Optimize (6-12 months)", "KPIs for each phase", "Resource requirements", "Budget allocation recommendations"],
        minWordCount: 350,
        exampleOutput: "Phase 1 — Quick Wins (0-30 days):\n• Audit and align all touchpoints to new positioning\n• Update website messaging and meta descriptions\n• Brief the sales team on new positioning language\n• KPIs: Website bounce rate, sales conversion rate\n• Investment: Minimal (internal effort)\n\nPhase 2 — Foundation (1-3 months):\n• Develop content strategy aligned with positioning\n• Launch thought leadership campaign\n• Redesign key customer touchpoints\n• KPIs: Brand awareness (survey), organic traffic growth\n• Investment: $X-Y"
      },
      {
        id: "measurement_framework",
        title: "Measurement & Success Metrics",
        description: "How to measure the success of the strategy with specific KPIs and benchmarks.",
        requiredElements: ["Brand health metrics", "Business impact metrics", "Leading vs lagging indicators", "Measurement cadence", "Benchmark comparisons", "Dashboard recommendations"],
        minWordCount: 200,
        exampleOutput: "Brand Health Scorecard (Quarterly):\n| Metric | Current | 6-Month Target | 12-Month Target |\n|--------|---------|----------------|------------------|\n| Brand Awareness | 15% | 30% | 45% |\n| Brand Preference | 8% | 18% | 28% |\n| NPS | +12 | +25 | +40 |\n| CAC | $X | $X×0.7 | $X×0.5 |"
      }
    ],
    imagePromptTemplates: [
      "Professional brand strategy presentation slide showing market positioning map with competitor analysis. Clean, corporate design with data visualization. {primaryColor} accent color on white background.",
      "Strategic growth roadmap infographic showing 4 phases with milestones and KPIs. Professional consulting-quality design with timeline visualization.",
      "Competitive landscape analysis visual showing brand positioning on a 2x2 matrix. Premium strategy deck quality with clear labels and brand colors.",
      "Brand value proposition canvas visualization. Clean, modern design suitable for executive presentation."
    ],
    pdfStyle: 'deck'
  },

  // ─────────────────────────────────────────────────────────
  // TEMPLATE 3: SOCIAL MEDIA CALENDAR
  // ─────────────────────────────────────────────────────────
  {
    id: "social_media_calendar",
    name: "Social Media Calendar & Strategy",
    description: "Monthly content calendar with content pillars, post types, platform strategy, and engagement plan",
    matchKeywords: ["social media", "content calendar", "social strategy", "content plan", "social media calendar", "posting schedule", "content pillars", "social media plan"],
    sections: [
      {
        id: "platform_strategy",
        title: "Platform Strategy & Audience Analysis",
        description: "Which platforms to focus on, why, and what role each plays in the brand ecosystem.",
        requiredElements: ["Platform priority ranking", "Audience demographics per platform", "Content type per platform", "Posting frequency per platform", "Platforms to avoid and why", "MENA-specific platform insights (TikTok growth, Snapchat in KSA, etc.)"],
        minWordCount: 300,
        exampleOutput: "Platform Priority:\n\n1. Instagram (Primary) — 78% of target audience active here. Focus: Visual storytelling, behind-the-scenes, product showcases. Frequency: 5-7 posts/week + daily stories.\n   MENA Insight: Instagram is the #1 platform for brand discovery in Egypt (67% of users discover new brands here).\n\n2. TikTok (Growth) — Fastest growing platform in MENA (45% YoY growth). Focus: Educational short-form content, trending formats. Frequency: 3-4 videos/week.\n   MENA Insight: TikTok users in KSA spend average 95 minutes/day — highest globally.\n\n3. LinkedIn (Authority) — For B2B credibility and thought leadership. Focus: Industry insights, case studies, team culture. Frequency: 3 posts/week."
      },
      {
        id: "content_pillars",
        title: "Content Pillars & Mix",
        description: "3-5 content themes that support the brand positioning with specific content types and ratios.",
        requiredElements: ["3-5 content pillars with descriptions", "Content mix ratio", "Content types per pillar", "Example post ideas (3 per pillar)", "Hashtag strategy per pillar"],
        minWordCount: 350,
        exampleOutput: "Content Pillars:\n\n1. 🎓 Expert Insights (30%) — Educational content that positions the brand as an authority\n   Types: Carousel tips, short explainer videos, infographics\n   Examples:\n   - '5 Signs Your Brand Needs a Repositioning' (carousel)\n   - 'How [Industry] Leaders Use Data to Drive Growth' (video)\n   - 'The Real Cost of Inconsistent Branding' (infographic)\n   Hashtags: #BrandStrategy #MarketingTips #BusinessGrowth\n\n2. 🎬 Behind the Scenes (25%) — Humanize the brand, build trust\n   Types: Team stories, process reveals, workspace tours\n   Examples:\n   - 'A Day in the Life of Our Strategy Team' (reel)\n   - 'How We Built [Client]'s Brand in 90 Days' (story series)"
      },
      {
        id: "monthly_calendar",
        title: "Monthly Content Calendar",
        description: "Week-by-week content plan with specific post ideas, formats, and timing.",
        requiredElements: ["4-week calendar grid", "Specific post topics per day", "Content format for each post", "Best posting times for MENA", "Key dates and occasions", "Campaign integration points"],
        minWordCount: 400,
        exampleOutput: "WEEK 1: Brand Authority\n\n| Day | Platform | Content | Format | Time |\n|-----|----------|---------|--------|------|\n| Sun | Instagram | Industry trend analysis | Carousel (10 slides) | 7:00 PM |\n| Mon | TikTok | Quick tip: Brand mistake to avoid | Short video (30s) | 9:00 PM |\n| Tue | LinkedIn | Case study: How we helped [client] | Long post + image | 10:00 AM |\n| Wed | Instagram | Behind the scenes: Strategy session | Stories (5 frames) | 12:00 PM |\n| Thu | TikTok | Trending sound + brand message | Short video (15s) | 8:00 PM |\n\nMENA Timing Notes: Peak engagement in Egypt is 7-10 PM (after work). In KSA, Thursday evening and Friday are highest engagement days."
      },
      {
        id: "engagement_strategy",
        title: "Engagement & Community Strategy",
        description: "How to build community, respond to comments, and drive meaningful engagement.",
        requiredElements: ["Response time targets", "Comment response guidelines", "Community building tactics", "UGC strategy", "Collaboration/partnership approach", "Crisis response protocol"],
        minWordCount: 200,
        exampleOutput: "Response Protocol:\n- Comments: Respond within 2 hours during business hours\n- DMs: Respond within 4 hours\n- Negative comments: Acknowledge publicly, resolve privately\n- Tone: Match the brand voice — confident, helpful, never defensive\n\nCommunity Building:\n- Weekly Q&A sessions (Instagram Stories)\n- Monthly 'Ask the Expert' live sessions\n- User-generated content campaigns with branded hashtag\n- Collaborate with 2-3 micro-influencers per month (focus on MENA creators with authentic engagement)"
      },
      {
        id: "performance_kpis",
        title: "Performance KPIs & Reporting",
        description: "How to measure social media success with specific targets.",
        requiredElements: ["KPIs per platform", "Monthly targets", "Reporting template", "Optimization triggers", "Industry benchmarks for MENA"],
        minWordCount: 200,
        exampleOutput: "Monthly KPI Dashboard:\n\n| Metric | Instagram | TikTok | LinkedIn | Target |\n|--------|-----------|--------|----------|--------|\n| Reach | - | - | - | +20% MoM |\n| Engagement Rate | - | - | - | >3.5% |\n| Follower Growth | - | - | - | +500/month |\n| Website Clicks | - | - | - | +15% MoM |\n| DM Inquiries | - | - | - | 10+/month |\n\nMENA Benchmarks: Average engagement rate for {industry} in MENA is 2.8% on Instagram, 5.2% on TikTok."
      }
    ],
    imagePromptTemplates: [
      "Professional social media content calendar layout showing a monthly grid with color-coded content pillars. Clean, modern design with {primaryColor} accents. Marketing agency quality.",
      "Social media post mockup showing Instagram feed grid with 9 posts in a cohesive brand style using {primaryColor} and {secondaryColor}. Professional brand presentation.",
      "Content pillar infographic showing 4-5 content themes with icons, percentages, and example post types. Clean, modern design suitable for strategy presentation.",
      "Social media analytics dashboard mockup showing KPIs, engagement rates, and growth charts. Professional marketing report style."
    ],
    pdfStyle: 'calendar'
  },

  // ─────────────────────────────────────────────────────────
  // TEMPLATE 4: BRAND AUDIT REPORT
  // ─────────────────────────────────────────────────────────
  {
    id: "brand_audit",
    name: "Brand Audit & Diagnosis Report",
    description: "Comprehensive brand health assessment with scorecard, findings, and action plan",
    matchKeywords: ["brand audit", "brand diagnosis", "brand health", "brand assessment", "brand review", "brand analysis", "brand evaluation", "diagnosis report"],
    sections: [
      {
        id: "executive_summary",
        title: "Executive Summary",
        description: "CEO-readable one-page overview of brand health, key findings, and urgent actions.",
        requiredElements: ["Overall brand health score (1-10)", "Top 3 critical findings", "Recommended immediate action", "Cost of inaction estimate", "Investment required"],
        minWordCount: 250,
        exampleOutput: "Brand Health Score: 5.2/10\n\nYour brand has strong product-market fit but is significantly underperforming in market visibility and differentiation. You're essentially competing on price in a market where you should be commanding premium.\n\nCritical Findings:\n1. Brand awareness is 12% vs. industry average of 35% — you're invisible to 88% of your potential customers\n2. Your positioning overlaps with 3 competitors — there's no compelling reason to choose you over alternatives\n3. Customer acquisition cost is 2.3x industry benchmark — your brand isn't doing its job in the funnel\n\nCost of Inaction: At current trajectory, you're leaving approximately EGP 2.5M in annual revenue on the table due to brand underperformance."
      },
      {
        id: "methodology",
        title: "Methodology & Framework",
        description: "How the audit was conducted and what frameworks were applied.",
        requiredElements: ["Audit methodology description", "Data sources analyzed", "Frameworks applied (4D, Keller's CBBE, etc.)", "Limitations and caveats"],
        minWordCount: 200,
        exampleOutput: "This audit was conducted using Primo Marca's 4D Framework (Diagnose, Design, Deploy, Optimize) combined with Keller's Customer-Based Brand Equity model.\n\nData Sources:\n- Digital presence analysis (website, social media, search visibility)\n- Competitive benchmarking against top 5 competitors\n- Industry benchmark data for {market} {industry} sector\n- Client-provided business metrics and customer data\n\nFrameworks Applied:\n- Keller's CBBE Pyramid: Measuring brand equity from identity to resonance\n- Porter's Five Forces: Assessing competitive dynamics\n- Kapferer's Brand Identity Prism: Evaluating brand identity coherence"
      },
      {
        id: "brand_scorecard",
        title: "Brand Health Scorecard",
        description: "Detailed scoring across all brand dimensions with evidence.",
        requiredElements: ["Score for each of 7 dimensions (1-10)", "Evidence for each score", "Industry benchmark comparison", "Priority ranking", "Visual scorecard"],
        minWordCount: 400,
        exampleOutput: "Brand Health Scorecard:\n\n| Dimension | Score | Benchmark | Gap | Priority |\n|-----------|-------|-----------|-----|----------|\n| Brand Clarity | 4/10 | 7/10 | -3 | Critical |\n| Brand Differentiation | 3/10 | 6/10 | -3 | Critical |\n| Brand Consistency | 5/10 | 7/10 | -2 | High |\n| Brand Relevance | 6/10 | 7/10 | -1 | Medium |\n| Brand Equity | 4/10 | 6/10 | -2 | High |\n| Digital Presence | 5/10 | 8/10 | -3 | Critical |\n| Customer Experience | 7/10 | 7/10 | 0 | Maintain |\n\nBrand Clarity (4/10):\nEvidence: Website messaging uses 3 different value propositions across 5 pages. Social media bio doesn't match website tagline. Sales team describes the brand differently in each pitch."
      },
      {
        id: "competitive_context",
        title: "Competitive Context & Positioning",
        description: "How the brand compares to competitors and where opportunities exist.",
        requiredElements: ["Competitive positioning map", "Top 3-5 competitor analysis", "Competitive advantages", "Competitive vulnerabilities", "White space opportunities"],
        minWordCount: 300,
        exampleOutput: "Competitive Positioning Map:\n[Price axis: Low → High] × [Differentiation axis: Generic → Specialized]\n\nYour brand currently sits in the 'stuck in the middle' zone — not the cheapest, not the most differentiated. This is the most dangerous position in any market (Porter's generic strategies).\n\nCompetitor Analysis:\n| Competitor | Position | Their Advantage | Their Weakness | Threat Level |\n|-----------|----------|-----------------|----------------|-------------|\n| Brand A | Premium specialist | Strong brand, loyal base | High prices, slow innovation | High |\n| Brand B | Value leader | Price advantage, wide reach | Weak brand, low margins | Medium |"
      },
      {
        id: "action_plan",
        title: "Prioritized Action Plan",
        description: "Phased recommendations with timelines, expected impact, and investment.",
        requiredElements: ["Phase 1: Immediate fixes (0-30 days)", "Phase 2: Foundation (1-3 months)", "Phase 3: Growth (3-6 months)", "Phase 4: Scale (6-12 months)", "Expected ROI per phase", "Resource requirements"],
        minWordCount: 350,
        exampleOutput: "Phase 1 — Emergency Fixes (0-30 days):\nInvestment: EGP 15,000-25,000 | Expected Impact: 15-20% improvement in brand clarity\n\n1. Unify messaging across all touchpoints\n   - Rewrite website copy with single, clear positioning\n   - Update all social media bios to match\n   - Create a one-page brand brief for the sales team\n   Why: Inconsistent messaging is costing you credibility with every customer interaction. Starbucks maintains identical brand messaging across 35,000 locations — consistency is non-negotiable.\n\n2. Fix the top 3 digital presence gaps\n   - Optimize Google Business Profile (currently incomplete)\n   - Fix website load speed (currently 6.2s — should be under 3s)\n   - Add clear CTAs to every page"
      }
    ],
    imagePromptTemplates: [
      "Professional brand audit report cover page with brand health score visualization. Clean, corporate design with data-driven aesthetic. {primaryColor} accent on dark background.",
      "Brand health scorecard radar chart showing 7 dimensions with scores. Professional consulting report quality with clean data visualization.",
      "Competitive positioning map showing brands on a 2x2 matrix. Strategy consulting quality with clear labels and professional design.",
      "Brand action plan timeline infographic showing 4 phases with milestones. Professional roadmap design suitable for executive presentation."
    ],
    pdfStyle: 'report'
  },

  // ─────────────────────────────────────────────────────────
  // TEMPLATE 5: BUSINESS MODEL ANALYSIS
  // ─────────────────────────────────────────────────────────
  {
    id: "business_model_analysis",
    name: "Business Model Analysis Report",
    description: "Deep analysis of business model, unit economics, and growth opportunities",
    matchKeywords: ["business model", "business analysis", "unit economics", "revenue model", "business audit", "business diagnosis", "business review"],
    sections: [
      {
        id: "executive_summary",
        title: "Executive Summary",
        description: "Overview of business model health, key findings, and priority actions.",
        requiredElements: ["Business model health score", "Top 3 findings", "Revenue at risk", "Growth opportunity size", "Recommended priority action"],
        minWordCount: 250,
        exampleOutput: "Business Model Health: 6.5/10 — Viable but vulnerable\n\nYour business model generates consistent revenue but has structural weaknesses that limit growth and increase risk. The core product-market fit is strong, but the business architecture doesn't support the scale you're targeting."
      },
      {
        id: "business_model_canvas",
        title: "Business Model Canvas Analysis",
        description: "Detailed analysis of all 9 Business Model Canvas elements.",
        requiredElements: ["All 9 BMC elements analyzed", "Strength/weakness for each", "Specific improvement recommendations", "Industry comparison"],
        minWordCount: 400,
        exampleOutput: "Value Proposition: 7/10\nCurrent: You deliver [specific value]. This resonates with your core segment.\nGap: The value proposition isn't clearly differentiated from [competitor]. Customers can get similar value elsewhere.\nFix: Sharpen the proposition around [specific differentiator]. As Osterwalder's Value Proposition Canvas shows, you need to match your pain relievers to specific customer pains, not generic needs."
      },
      {
        id: "unit_economics",
        title: "Unit Economics Deep Dive",
        description: "CAC, LTV, margins, and financial health metrics.",
        requiredElements: ["CAC by channel", "Customer LTV", "LTV:CAC ratio", "Gross margin analysis", "Break-even analysis", "Industry benchmarks"],
        minWordCount: 300,
        exampleOutput: "Unit Economics Dashboard:\n\n| Metric | Your Business | Industry Avg | Status |\n|--------|--------------|-------------|--------|\n| CAC | EGP X | EGP Y | ⚠️ Above avg |\n| LTV | EGP X | EGP Y | ✅ Healthy |\n| LTV:CAC | 2.1:1 | 3:1 | ⚠️ Below target |\n| Gross Margin | 45% | 55% | ⚠️ Room to improve |\n| Payback Period | 8 months | 6 months | ⚠️ Slow |"
      },
      {
        id: "growth_opportunities",
        title: "Growth Opportunities & Risks",
        description: "Specific growth levers and risk mitigation strategies.",
        requiredElements: ["Top 5 growth opportunities ranked by impact", "Revenue concentration risk", "Scalability assessment", "Single points of failure", "Competitive threats"],
        minWordCount: 300,
        exampleOutput: "Growth Opportunities (Ranked by Impact × Feasibility):\n\n1. [Opportunity 1] — Potential: +30% revenue | Feasibility: High | Timeline: 3 months\n   How: [Specific action steps]\n   Example: Noon expanded from electronics to full marketplace, growing GMV by 300% in 18 months.\n\n2. [Opportunity 2] — Potential: +20% revenue | Feasibility: Medium | Timeline: 6 months"
      },
      {
        id: "recommendations",
        title: "Prioritized Recommendations",
        description: "Phased action plan with specific next steps.",
        requiredElements: ["Quick wins (0-30 days)", "Medium-term (1-3 months)", "Long-term (3-12 months)", "Investment required per phase", "Expected ROI"],
        minWordCount: 250,
        exampleOutput: "Quick Wins (0-30 days) — Investment: Minimal\n1. Optimize pricing: Increase prices by 10-15% on [specific products/services]. Data shows your price elasticity allows this without volume loss. Starbucks charges 5x more than local coffee because they've built perceived value — you can do the same at a smaller scale."
      }
    ],
    imagePromptTemplates: [
      "Business Model Canvas visualization with all 9 elements filled in. Professional consulting quality with color-coded sections. Clean, modern design.",
      "Unit economics dashboard showing CAC, LTV, margins with charts and gauges. Professional financial report quality.",
      "Growth opportunity matrix showing impact vs feasibility for 5 opportunities. Strategy consulting quality visualization."
    ],
    pdfStyle: 'report'
  },

  // ─────────────────────────────────────────────────────────
  // TEMPLATE 6: MESSAGING FRAMEWORK
  // ─────────────────────────────────────────────────────────
  {
    id: "messaging_framework",
    name: "Messaging Framework",
    description: "Complete messaging architecture including narrative, value proposition, taglines, and content pillars",
    matchKeywords: ["messaging", "messaging framework", "brand narrative", "tagline", "value proposition", "brand story", "content pillars", "brand messaging"],
    sections: [
      {
        id: "brand_narrative",
        title: "Brand Narrative & Story",
        description: "The brand's origin story, mission narrative, and future vision.",
        requiredElements: ["Origin story", "The problem we saw", "Our unique approach", "The future we're building", "Emotional hook"],
        minWordCount: 300,
        exampleOutput: "The Origin Story:\nEvery great brand starts with a frustration. For [Brand], it was watching [specific problem in the industry]. While everyone else was [doing the generic thing], we saw an opportunity to [unique approach].\n\nWe didn't just want to build another [category] — we wanted to change how [industry] works in [market]. Because in a region where [MENA-specific insight], the old playbook doesn't work anymore."
      },
      {
        id: "value_proposition",
        title: "Value Proposition Architecture",
        description: "Primary and supporting value propositions with proof points.",
        requiredElements: ["Primary value proposition (one sentence)", "3 supporting pillars", "Proof points for each pillar", "Competitor comparison"],
        minWordCount: 250,
        exampleOutput: "Primary Value Proposition:\n\"[Brand] helps [target] achieve [outcome] through [unique method] — delivering [specific result] that [competitors] can't match.\"\n\nSupporting Pillars:\n1. [Pillar 1]: [Benefit] — Proof: [Specific evidence]\n2. [Pillar 2]: [Benefit] — Proof: [Specific evidence]\n3. [Pillar 3]: [Benefit] — Proof: [Specific evidence]"
      },
      {
        id: "taglines",
        title: "Tagline Options & Rationale",
        description: "3-5 tagline options with strategic rationale for each.",
        requiredElements: ["3-5 tagline options", "Strategic rationale for each", "What it communicates vs implies", "Recommended primary tagline", "Arabic adaptation for each"],
        minWordCount: 200,
        exampleOutput: "Tagline Options:\n\n1. \"[Tagline A]\" ⭐ RECOMMENDED\n   Communicates: [explicit message]\n   Implies: [implicit message]\n   Why it works: [strategic rationale]\n   Arabic: \"[Arabic version]\"\n\n2. \"[Tagline B]\"\n   Communicates: [explicit message]\n   Implies: [implicit message]"
      },
      {
        id: "audience_messaging",
        title: "Key Messages by Audience",
        description: "Tailored messaging for each audience segment.",
        requiredElements: ["Messages per audience segment", "What they care about", "The message that resonates", "Proof point that convinces", "Call to action that converts"],
        minWordCount: 300,
        exampleOutput: "Audience Segment 1: [Primary Target]\nWhat they care about: [specific needs/desires]\nKey Message: \"[Tailored message]\"\nProof Point: \"[Specific evidence that convinces this audience]\"\nCTA: \"[Specific call to action]\"\nChannel: [Where to reach them]"
      },
      {
        id: "language_guidelines",
        title: "Language & Tone Guidelines",
        description: "Words to use, words to avoid, and tone adjustments by context.",
        requiredElements: ["Words we USE (with context)", "Words we NEVER use (with alternatives)", "Tone spectrum by channel", "Arabic vs English guidelines", "Example rewrites"],
        minWordCount: 250,
        exampleOutput: "Words We USE:\n✓ 'Strategic' (not 'basic' or 'simple')\n✓ 'Partner' (not 'vendor' or 'supplier')\n✓ 'Invest' (not 'spend' or 'cost')\n✓ 'Evidence-based' (not 'we think' or 'we believe')\n\nWords We NEVER Use:\n✗ 'Cheap' → Use 'accessible' or 'value-driven'\n✗ 'Guarantee' → Use 'our track record shows'\n✗ 'Best' → Use 'leading' or 'top-performing'"
      }
    ],
    imagePromptTemplates: [
      "Brand messaging architecture diagram showing value proposition hierarchy with primary message, supporting pillars, and proof points. Professional strategy document quality.",
      "Tone of voice spectrum visualization showing brand personality across different channels. Clean, modern infographic design.",
      "Audience persona cards showing 3-4 target segments with key messages. Professional marketing strategy quality."
    ],
    pdfStyle: 'report'
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE MATCHING — Find the best template for a deliverable
// ═══════════════════════════════════════════════════════════════════════════

export function matchTemplate(deliverableTitle: string, deliverableDescription?: string): DeliverableTemplate | null {
  const searchText = `${deliverableTitle} ${deliverableDescription || ''}`.toLowerCase();
  
  let bestMatch: DeliverableTemplate | null = null;
  let bestScore = 0;
  
  for (const template of TEMPLATES) {
    let score = 0;
    for (const keyword of template.matchKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }
  
  return bestScore > 0 ? bestMatch : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURED GENERATION PROMPT — Build section-by-section generation prompt
// ═══════════════════════════════════════════════════════════════════════════

export function buildTemplatePrompt(
  template: DeliverableTemplate,
  clientContext: {
    clientName: string;
    companyName?: string;
    industry?: string;
    market?: string;
    notes?: string;
    additionalContext?: string;
  }
): string {
  const sections = template.sections.map((section, idx) => {
    return `
### SECTION ${idx + 1}: ${section.title}
${section.description}

REQUIRED ELEMENTS (ALL must be included):
${section.requiredElements.map(el => `- ${el}`).join('\n')}

MINIMUM LENGTH: ${section.minWordCount} words

REFERENCE FORMAT:
${section.exampleOutput}
`;
  }).join('\n---\n');

  return `You are generating a **${template.name}** for ${clientContext.clientName}${clientContext.companyName ? ` (${clientContext.companyName})` : ''}.

CLIENT CONTEXT:
- Industry: ${clientContext.industry || 'Not specified'}
- Market: ${clientContext.market || 'MENA'}
${clientContext.notes ? `- Discovery Notes: ${clientContext.notes}` : ''}
${clientContext.additionalContext ? `- Additional Context: ${clientContext.additionalContext}` : ''}

CRITICAL RULES:
1. Every section MUST be specific to THIS client — no generic content
2. Include REAL numbers, benchmarks, and data points (use industry averages if client-specific data isn't available)
3. Reference REAL examples from the market (e.g., "Like how Careem repositioned from ride-hailing to super-app...")
4. Every recommendation must connect to a business outcome with expected impact
5. Use the section structure below EXACTLY — do not skip sections or combine them
6. Use markdown formatting with proper headings (## for sections, ### for subsections)
7. For MENA clients: include Arabic considerations where relevant

DOCUMENT STRUCTURE:
${sections}

Generate the COMPLETE document following ALL sections above. Each section must meet its minimum word count and include ALL required elements.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART IMAGE PROMPTS — Generate context-aware image prompts
// ═══════════════════════════════════════════════════════════════════════════

export function generateSmartImagePrompts(
  template: DeliverableTemplate,
  clientContext: {
    companyName?: string;
    industry?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }
): string[] {
  return template.imagePromptTemplates.map(promptTemplate => {
    return promptTemplate
      .replace(/{industry}/g, clientContext.industry || 'professional services')
      .replace(/{primaryColor}/g, clientContext.primaryColor || 'navy blue')
      .replace(/{secondaryColor}/g, clientContext.secondaryColor || 'gold')
      .replace(/{companyName}/g, clientContext.companyName || 'the brand');
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE LISTING — Get all available templates
// ═══════════════════════════════════════════════════════════════════════════

export function getAvailableTemplates(): { id: string; name: string; description: string; sectionCount: number }[] {
  return TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    sectionCount: t.sections.length,
  }));
}

export function getTemplateById(id: string): DeliverableTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}
