/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WZZRD AI KNOWLEDGE BASE SEED SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Populates the knowledge_entries table with WZZRD AI's proprietary
 * frameworks, methodologies, case studies, and market insights.
 * 
 * Run: node server/seedKnowledge.mjs
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const entries = [
  // ═══════════════════════════════════════════════════════════════════════
  // FRAMEWORKS
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "The 4D Framework — WZZRD AI's Proprietary Brand Engineering Process",
    content: `The 4D Framework is WZZRD AI's proprietary four-stage process for brand engineering. It is NOT a linear process — it's an iterative system where each stage informs and refines the others.

**STAGE 1: DIAGNOSE**
We audit the business, the market, and current bottlenecks. This is the most critical stage — prescribing without diagnosing is malpractice. Key activities:
- Business audit: Revenue model, pricing structure, customer segments, competitive landscape
- Brand audit: Current perception vs. desired perception, visual/verbal consistency, market positioning
- Market audit: Industry trends, competitor analysis, customer behavior patterns, market gaps
- Bottleneck identification: Where is the business losing customers? Where is the brand failing to communicate value?
Output: A comprehensive diagnostic report with prioritized findings and recommended action plan.

**STAGE 2: DESIGN**
We architect the unique positioning, messaging, and brand system. This is where strategy becomes tangible:
- Strategic positioning: Finding the "Unfair Advantage" — the ONE thing this business can claim that no competitor can credibly replicate
- Brand architecture: Identity system, visual language, verbal guidelines, tone of voice
- Messaging framework: Core narrative, key messages, audience-specific communication
- Offer structure: Aligning what you sell with how you're perceived
Output: Complete brand strategy document + identity system ready for deployment.

**STAGE 3: DEPLOY**
We launch assets and guide execution through the client's team or our specialist partners:
- Asset creation: All brand touchpoints designed and produced
- Launch strategy: Phased rollout plan with priority channels
- Team training: Ensuring the client's team can execute consistently
- Partner coordination: Managing specialist execution (web, social, content)
Output: Fully deployed brand presence across all priority channels.

**STAGE 4: OPTIMIZE**
We refine messaging based on real-world commercial performance:
- Performance tracking: Key metrics tied to business outcomes (not vanity metrics)
- A/B testing: Messaging, positioning, and creative optimization
- Market feedback integration: Customer response analysis and iteration
- Strategic refinement: Adjusting the system based on real-world data
Output: Optimized brand system with documented performance improvements.

The 4D Framework maps to Keller's CBBE Pyramid: Diagnose = Brand Salience, Design = Brand Meaning + Response, Deploy = Market Activation, Optimize = Brand Resonance.`,
    category: "framework",
    tags: JSON.stringify(["4D", "methodology", "core-framework", "diagnose", "design", "deploy", "optimize"]),
    source: "manual"
  },

  {
    title: "The Three Pillars That Define Market Authority",
    content: `WZZRD AI focuses on three interconnected pillars that together create market authority. No pillar works in isolation — they form a system.

**PILLAR 1: BRAND BUILDING**
The foundation of market authority. Without a strong brand, everything else is noise.
- Strategic Positioning: Finding your "Unfair Advantage" — the intersection of what you do exceptionally well, what your audience desperately needs, and what no competitor credibly claims
- Identity Systems: Visual and verbal guidelines designed for longevity, not trends. A brand system should work for 10+ years with minor evolution
- Messaging: Storytelling that eliminates friction and builds trust. Every message must answer "so what?" from the customer's perspective

**PILLAR 2: SOCIAL PERFORMANCE**
Not social media management — social performance engineering.
- Systems over Management: We build the creative direction, content angles, and performance narratives. We don't post daily content — we build the system that makes content work
- Launch Logic: High-impact messaging designed for conversion, not just likes. Every piece of content has a strategic purpose
- Performance Narratives: Content that builds authority over time, not just engagement in the moment

**PILLAR 3: BUSINESS LOGIC**
The pillar most agencies ignore. Without business logic, branding is just decoration.
- Offer Clarity: Aligning what you sell with how you are perceived. A great product is invisible if the offer is confusing
- Customer Journey Mapping: Engineering the path from stranger to advocate. Identifying and eliminating friction at every stage
- Revenue Architecture: Ensuring the brand strategy directly supports the business model and pricing strategy

These three pillars map to Aaker's brand dimensions: Brand Building = Brand as Person + Symbol, Business Logic = Brand as Product + Organization, Social Performance = How all dimensions are communicated in market.`,
    category: "framework",
    tags: JSON.stringify(["three-pillars", "brand-building", "social-performance", "business-logic", "market-authority"]),
    source: "manual"
  },

  {
    title: "The Consultant Box — Anti-Black-Box Agency Model",
    content: `The Consultant Box is WZZRD AI's operating philosophy that fundamentally differentiates us from traditional agencies. It's the antithesis of the "Black Box" agency model.

**THE PROBLEM WITH BLACK BOX AGENCIES:**
Traditional agencies operate like black boxes — the client hands over money and has no idea what's happening inside. They get deliverables but don't understand the strategy, can't replicate the thinking, and are permanently dependent on the agency.

**THE CONSULTANT BOX APPROACH:**

1. **Total Transparency**: The client owns the strategy. We don't hide our methodology or create dependency. Every decision is explained, every recommendation is justified, and the client understands the "why" behind everything.

2. **Guided Execution**: We provide the blueprint; the client's team (or our specialist partners) executes with precision. We're architects, not construction workers. We design the system and guide its implementation.

3. **Clear Finish Lines**: We are project-based, not retainer-based. We solve the problem, build the system, and hand you the keys. Our goal is to make ourselves unnecessary — a brand that needs its consultant forever is a brand that was never properly built.

**WHY THIS MATTERS:**
- Clients learn and grow through the process
- No dependency = healthier long-term relationship
- Project-based = clear ROI measurement
- Transparency = trust = referrals
- The client can maintain and evolve the system independently

**THE CONSULTANT BOX IN PRACTICE:**
- Every project starts with a clear scope and finish line
- Every strategy document is written to be understood by the client, not just by marketers
- Every recommendation includes the reasoning and the alternatives considered
- Every deliverable comes with implementation guidelines
- Every project ends with a handover session where the client is equipped to continue independently

Philosophy: "Creativity without a system is just art. Creativity with a system is a Marca."`,
    category: "methodology",
    tags: JSON.stringify(["consultant-box", "transparency", "operating-model", "anti-black-box"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DIAGNOSTIC PATTERNS
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "The Clarity Gap — Most Common Brand Problem Pattern",
    content: `**Pattern Name:** The Clarity Gap
**Frequency:** Found in ~60% of clients who come to WZZRD AI

**Symptom:** "We have a great product but nobody knows about us" or "We're not attracting the right customers"

**Root Cause:** The difference between what the business IS and how it's PERCEIVED. Usually a positioning or messaging problem, not a marketing budget problem.

**Diagnostic Questions:**
1. "If I asked 10 of your customers what you do, would they all give the same answer?"
2. "Can you explain your value proposition in one sentence that a stranger would understand?"
3. "What do your customers say about you when you're not in the room?"

**WZZRD AI Solution:**
- Diagnose the gap between reality and perception
- Design the bridge: clear positioning + messaging framework
- Deploy: consistent communication across all touchpoints
- Optimize: measure whether the gap is closing

**Key Insight:** Most businesses don't need more marketing. They need more clarity. Spending money on marketing a confusing message just amplifies the confusion.`,
    category: "client_pattern",
    tags: JSON.stringify(["clarity-gap", "diagnostic-pattern", "positioning", "messaging"]),
    source: "manual"
  },

  {
    title: "The Commodity Trap — Price Competition Pattern",
    content: `**Pattern Name:** The Commodity Trap
**Frequency:** Found in ~40% of clients, especially in competitive markets

**Symptom:** "Our competitors are cheaper" or "Clients always negotiate on price" or "We're in a race to the bottom"

**Root Cause:** No differentiation, no unfair advantage, no premium positioning. The business is perceived as interchangeable with competitors.

**Diagnostic Questions:**
1. "Why should a customer choose you over a competitor who charges 30% less?"
2. "What can you do that no competitor can credibly claim?"
3. "Are your customers buying because they want YOU, or because you're convenient?"

**WZZRD AI Solution:**
- Find the Unfair Advantage (intersection of capability + need + uniqueness)
- Restructure the offer to lead with value, not price
- Reposition as authority in a specific niche rather than generalist in a broad market
- Build premium perception through brand engineering

**Key Insight:** Premium pricing is not about charging more. It's about creating a perception of value that justifies the price. Scarcity, authority, social proof, and transformation narrative all contribute.`,
    category: "client_pattern",
    tags: JSON.stringify(["commodity-trap", "pricing", "differentiation", "premium-positioning"]),
    source: "manual"
  },

  {
    title: "The Random Effort Trap — Disconnected Marketing Pattern",
    content: `**Pattern Name:** The Random Effort Trap
**Frequency:** Found in ~50% of clients, especially SMEs

**Symptom:** "We've tried everything — social media, ads, events — nothing works" or "We spend money on marketing but can't see results"

**Root Cause:** No system, no strategy, no consistent brand narrative. Marketing is a series of disconnected guesses. This is the core problem Ramy Mortada founded WZZRD AI to solve.

**Diagnostic Questions:**
1. "Walk me through your marketing activities in the last 6 months. What was the strategy behind each?"
2. "Do you have a documented brand strategy that guides all your marketing decisions?"
3. "If you stopped all marketing tomorrow, what would happen to your business in 3 months?"

**WZZRD AI Solution:**
- Stop everything. Audit what's working and what's not
- Build the system first: positioning → messaging → content strategy → channel strategy
- Deploy with intention: every activity has a strategic purpose and measurable outcome
- Optimize based on data, not gut feeling

**Key Insight:** "When your brand lacks a system, your marketing becomes a series of disconnected guesses." The solution is never "do more marketing" — it's "build the system that makes marketing work."`,
    category: "client_pattern",
    tags: JSON.stringify(["random-effort-trap", "marketing-system", "strategy", "founder-philosophy"]),
    source: "manual"
  },

  {
    title: "The Scaling Ceiling — Growth Stall Pattern",
    content: `**Pattern Name:** The Scaling Ceiling
**Frequency:** Found in ~30% of clients, especially successful SMEs

**Symptom:** "We grew fast initially but now we're stuck" or "We can't seem to break through to the next level"

**Root Cause:** The brand/business model that got them here can't get them there. The foundation is too weak to support the weight of growth.

**Diagnostic Questions:**
1. "What got you to where you are today? Is that still working?"
2. "If you doubled your customer base tomorrow, could your brand and operations handle it?"
3. "What's the ONE thing that, if you fixed it, would unlock the next phase of growth?"

**WZZRD AI Solution:**
- Audit the structural integrity of the brand and business model
- Identify what needs to evolve (not everything — just the bottleneck)
- Redesign the specific elements that are creating the ceiling
- Deploy the evolution without losing what's already working

**Key Insight:** Scaling amplifies everything — including problems. A brand that's "good enough" at small scale becomes a liability at larger scale.`,
    category: "client_pattern",
    tags: JSON.stringify(["scaling-ceiling", "growth", "structural-integrity", "evolution"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CASE STUDIES
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Case Study: Beehive — C-Class to A&B Repositioning",
    content: `**Client:** Beehive
**Challenge:** Operating in the market but perceived as C-class segment despite offering solid services. Brand image didn't reflect the company's real value or potential.

**Goal:** Reposition to attract A & B market segments while building a brand capable of expanding into multiple international markets.

**The WZZRD AI Approach:**
This was a classic Clarity Gap + Commodity Trap combination. The company had good services but was perceived as lower-tier because:
1. Visual identity communicated "budget" rather than "premium"
2. Messaging didn't differentiate from competitors
3. No clear positioning for the target audience they wanted

**What We Did (4D Framework in action):**
- DIAGNOSE: Audited current brand perception, competitor landscape, and target audience expectations for A&B segments
- DESIGN: Complete brand makeover — rebuilt identity, visual language, service presentation, and market positioning
- DEPLOY: Launched new brand across all touchpoints with premium perception engineering
- OPTIMIZE: Monitored market response and refined messaging

**Results:**
- Successful shift from C-class positioning to A & B audiences
- Significant increase in business volume
- Expansion into multiple markets
- Higher client confidence and demand

**Key Lesson:** Strategic branding can unlock real business growth. The product didn't change — the perception did. And perception drives purchasing decisions.`,
    category: "case_study",
    tags: JSON.stringify(["beehive", "repositioning", "premium", "international-expansion"]),
    source: "manual"
  },

  {
    title: "Case Study: Tazkyah Plus — Vision to Scalable Educational Ecosystem",
    content: `**Client:** Tazkyah Plus
**Challenge:** Started as a vision for a learning platform focused on personal development, values, and meaningful education. No brand structure, no identity, no scalable system.

**Goal:** Transform the vision into a structured brand with clear identity, message, and scalable system that could grow into multiple programs and branches.

**The WZZRD AI Approach:**
This was a ground-up brand build — the most comprehensive type of engagement. Everything needed to be created from scratch, but with scalability built in from day one.

**What We Did (4D Framework in action):**
- DIAGNOSE: Understood the founder's vision, target audience (learners and communities), and the educational landscape
- DESIGN: Created complete brand identity, visual language reflecting clarity/growth/learning, scalable ecosystem structure, tone of voice aligned with educational/ethical mission
- DEPLOY: Launched the brand with a structure that allows future branches and programs to grow under the same ecosystem
- OPTIMIZE: Established the framework for ongoing brand evolution as new programs are added

**The Ecosystem Approach:**
Tazkyah Plus was designed not as a single project but as a platform capable of expanding into multiple educational initiatives. Each branch operates within the same philosophy and visual system. This is brand architecture in action — creating a master brand that can house multiple sub-brands.

**Results:**
- Fully developed brand ready to grow and expand
- Structured educational platform built on clear values, strong identity, and scalable system
- Foundation for future programs, initiatives, and learning communities under unified vision

**Key Lesson:** When building from scratch, the most important decision is architecture. Build for where you're going, not just where you are.`,
    category: "case_study",
    tags: JSON.stringify(["tazkyah-plus", "education", "ecosystem", "brand-architecture", "ground-up"]),
    source: "manual"
  },

  {
    title: "Case Study: Ramy Mortada — Personal Voice to Thought-Leadership Brand",
    content: `**Client:** Ramy Mortada (Founder of WZZRD AI)
**Challenge:** Transform a personal voice into a recognizable intellectual brand that speaks to ambitious professionals, leaders, and decision-makers across the region.

**Goal:** Build a brand that goes beyond typical personal presence on social media — one that reflects authority, credibility, and intellectual depth.

**The WZZRD AI Approach:**
Personal branding is different from corporate branding. The brand IS the person, so authenticity is non-negotiable. But authenticity without structure is just noise.

**What We Did:**
- Defined clear positioning as a thought-leadership brand (not a content creator or commentator)
- Designed brand identity and visual system that communicates authority and intellectual depth
- Created structured content direction capable of presenting complex ideas in clear, engaging ways
- Built a scalable content ecosystem that works across platforms

**Results:**
- Recognizable and distinctive brand identity
- Clear positioning as a thought-leadership brand
- Scalable content ecosystem
- Consistent visual communication across platforms
- The brand now operates as a platform for influence, dialogue, and long-term thought leadership

**Key Lesson:** Personal brands need the same strategic rigor as corporate brands. The difference is that the "product" is a person's expertise and perspective, so the brand must amplify authenticity, not manufacture a persona.`,
    category: "case_study",
    tags: JSON.stringify(["ramy-mortada", "personal-brand", "thought-leadership", "founder"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // MARKET INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Egypt Market — Brand Consulting Landscape 2024-2026",
    content: `**Market Overview:**
The Egyptian market for brand consulting is characterized by a large volume of SMEs and startups that need branding but often don't understand the value of strategic brand engineering vs. basic design services.

**Key Characteristics:**
- Price sensitivity is high — businesses compare brand strategy to graphic design pricing
- The "random effort trap" is extremely common — businesses try social media, ads, and events without strategy
- There's a growing awareness of the importance of branding, driven by increased competition and digital transformation
- The market is split: agencies that do everything (poorly) vs. specialists that do one thing well

**Pricing Reality:**
- Most businesses expect to pay 5,000-20,000 EGP for "branding" (meaning a logo)
- WZZRD AI's pricing (80,000-320,000 EGP) requires significant education about the value difference
- The key is framing: "You're not paying for a logo. You're investing in a system that will generate revenue for years."

**Opportunities:**
- Huge underserved market of businesses that need strategic branding but don't know it exists
- Growing startup ecosystem creates demand for brand strategy (not just logos)
- Digital transformation is forcing businesses to think about brand consistency across channels

**Challenges:**
- Educating the market about the difference between design and strategy
- Competing with low-cost alternatives that promise "branding" for a fraction of the price
- Economic instability affects willingness to invest in long-term brand building`,
    category: "market_insight",
    market: "egypt",
    tags: JSON.stringify(["egypt", "market-analysis", "pricing", "SME", "opportunities"]),
    source: "manual"
  },

  {
    title: "KSA Market — Brand Consulting Landscape 2024-2026",
    content: `**Market Overview:**
The Saudi Arabian market is experiencing rapid transformation driven by Vision 2030, creating unprecedented demand for brand strategy and positioning services.

**Key Characteristics:**
- Vision 2030 is creating thousands of new businesses and brands that need professional positioning
- Higher willingness to pay for premium services compared to Egypt
- Growing sophistication in understanding the difference between design and strategy
- International competition — global agencies are entering the market aggressively

**Pricing Reality:**
- Businesses in KSA expect to pay 5,000-30,000 SAR for branding services
- Premium positioning allows for higher pricing than Egypt
- The key differentiator is demonstrating ROI and understanding of the Saudi market specifically

**Opportunities:**
- Vision 2030 creating massive demand for brand building
- Entertainment, tourism, and hospitality sectors are brand-new and need everything from scratch
- Saudi businesses increasingly want to compete globally, requiring sophisticated brand strategy
- Female entrepreneurship is booming, creating a new segment of brand-conscious founders

**Challenges:**
- Cultural nuances require deep local understanding
- Competition from international agencies with bigger budgets
- Fast-moving market means strategies need to be agile
- Need for Arabic-first thinking, not translated English strategies`,
    category: "market_insight",
    market: "ksa",
    tags: JSON.stringify(["ksa", "saudi-arabia", "vision-2030", "market-analysis", "opportunities"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // METHODOLOGY DEEP DIVES
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "The Unfair Advantage Discovery Process",
    content: `**What is an Unfair Advantage?**
The ONE thing a business can claim that no competitor can credibly replicate. It's not about being better — it's about being DIFFERENT in a way that matters to the target audience.

**How to Find It (The Intersection Method):**
The Unfair Advantage lives at the intersection of three circles:
1. **What the business does exceptionally well** — Not just "good" but genuinely exceptional. What do they do that makes people say "wow"?
2. **What the target audience desperately needs** — Not just "wants" but genuinely needs. What keeps them up at night?
3. **What no competitor is credibly claiming** — Not just "not doing" but "can't credibly claim." What territory is genuinely unclaimed?

**Discovery Questions:**
- "What do your best customers say about you that they don't say about competitors?"
- "What would your customers lose if you disappeared tomorrow?"
- "What's the ONE thing you do that you're genuinely proud of?"
- "What do competitors do that you refuse to do? Why?"
- "If you could only keep ONE aspect of your business, what would it be?"

**Common Mistakes:**
- Choosing something generic ("great customer service" — everyone says this)
- Choosing something internal ("our team is amazing" — customers don't care about your team, they care about outcomes)
- Choosing something temporary ("we're the cheapest" — someone can always undercut you)
- Choosing something that doesn't matter to customers ("we use the latest technology" — so what?)

**The Test:** If a competitor could credibly say the same thing tomorrow, it's NOT an Unfair Advantage.`,
    category: "methodology",
    tags: JSON.stringify(["unfair-advantage", "positioning", "differentiation", "discovery-process"]),
    source: "manual"
  },

  {
    title: "Customer Journey Mapping — WZZRD AI Method",
    content: `**Philosophy:** The customer journey is NOT a linear funnel. It's a loop with multiple entry points and exit points.

**The Five Stages (Based on McKinsey Decision Journey):**

1. **Initial Consideration Set** — Is this brand even in the customer's mind?
   - How do potential customers first hear about the business?
   - What triggers them to start looking for a solution?
   - Is this brand in their initial consideration set?

2. **Active Evaluation** — How does this brand compare when the customer is actually looking?
   - What information does the customer seek?
   - Where do they look? (Google, social media, word of mouth, reviews)
   - How does this brand show up in those channels?

3. **Moment of Purchase** — What triggers the final decision?
   - What's the final nudge that converts interest to action?
   - What friction exists in the purchase process?
   - Is the offer clear and compelling at the point of decision?

4. **Post-Purchase Experience** — Does the experience match the promise?
   - Does the product/service deliver on what the brand promised?
   - Is there a gap between expectation and reality?
   - What's the onboarding experience like?

5. **Loyalty Loop** — Does the customer come back AND recommend?
   - What keeps customers coming back?
   - What makes them recommend to others?
   - How is the relationship maintained over time?

**WZZRD AI's Approach:** Identify friction at EACH stage and engineer solutions. The goal: turn strangers into advocates through a seamless, intentional experience.`,
    category: "methodology",
    tags: JSON.stringify(["customer-journey", "journey-mapping", "conversion", "loyalty"]),
    source: "manual"
  },

  {
    title: "Premium Pricing Psychology — How to Justify Premium Rates",
    content: `**Core Principle:** Premium pricing is NOT about charging more. It's about creating a perception of value that justifies the price.

**The Five Levers of Premium Perception:**

1. **Scarcity:** Limited availability creates perceived value
   - "We only take on 5 clients per quarter" → signals exclusivity
   - Project-based (not retainer) → signals that each engagement is special

2. **Authority:** Expert positioning commands higher prices
   - Proprietary methodology (4D Framework) → signals unique expertise
   - Case studies with measurable results → signals proven capability
   - Thought leadership content → signals deep knowledge

3. **Social Proof:** Others paying premium validates the price
   - Client testimonials from recognized brands
   - Case studies showing ROI that exceeds the investment
   - Industry recognition and awards

4. **Anchoring:** Frame the price against the cost of NOT solving the problem
   - "How much revenue are you losing every month because of unclear positioning?"
   - "What's the cost of another year of random marketing efforts?"
   - "If this strategy increases your pricing power by 20%, what's that worth over 3 years?"

5. **Transformation:** Sell the outcome, not the deliverable
   - Don't sell "a brand strategy document" → sell "a system that will generate revenue for years"
   - Don't sell "a logo" → sell "an identity that commands premium pricing"
   - Don't sell "consulting hours" → sell "clarity that eliminates wasted marketing spend"

**WZZRD AI's Own Pricing Justification:**
80K-320K EGP is justified by the Consultant Box model: total transparency, guided execution, clear finish lines. The client knows exactly what they're getting and why it's worth it. The key: the client owns the strategy forever — it's an investment, not an expense.`,
    category: "methodology",
    tags: JSON.stringify(["pricing", "premium", "psychology", "value-perception"]),
    source: "manual"
  },

  {
    title: "Marks vs. MARCAS — The Core Philosophy",
    content: `**The Foundational Distinction:**
"Marks Fade, MARCAS don't."

A **Mark** is a temporary visual impression — a logo, a color scheme, a tagline. It exists on the surface and fades with time, trends, and competition.

A **MARCA** is an engineered identity built on structural systems and commercial intent. It's the complete system: positioning, messaging, visual identity, customer experience, business logic — all working together as one coherent machine.

**Why This Matters:**
Most businesses invest in marks (logos, social media posts, ad campaigns) without building the underlying marca (strategy, positioning, systems). This is why their marketing feels like a series of disconnected guesses — because it IS.

**The Test:**
- Can you remove the logo and still recognize the brand? → That's a MARCA
- Does the brand work the same way across every touchpoint? → That's a MARCA
- Can a new team member understand and execute the brand without the founder? → That's a MARCA
- Does the brand command premium pricing? → That's a MARCA
- Will the brand still be relevant in 10 years? → That's a MARCA

**WZZRD AI's Promise:**
We don't create marks. We engineer MARCAS. Every engagement is designed to build something that lasts — a system, not a decoration.

This philosophy is embedded in the company name itself: "WZZRD" — the AI-powered brand wizard that replaces traditional agency guesswork with data-driven diagnosis.
    category: "framework",
    tags: JSON.stringify(["marks-vs-marcas", "philosophy", "core-belief", "brand-engineering"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SERVICE PLAYBOOKS
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Service Playbook: Business Health Check (Diagnose Phase)",
    content: `**Service:** Business Health Check
**Price Range:** 15,000-25,000 EGP (Egypt) / 5,000-8,000 SAR (KSA)
**Duration:** 1-2 weeks
**4D Stage:** DIAGNOSE only

**What It Is:**
A comprehensive audit of the business's brand health, market position, and growth bottlenecks. This is the entry point for most client relationships.

**Deliverables:**
1. Brand Perception Audit — How the market currently sees the business
2. Competitive Landscape Analysis — Where the business stands relative to competitors
3. Customer Journey Assessment — Where customers are being lost
4. Growth Bottleneck Report — The top 3-5 issues holding the business back
5. Recommended Action Plan — Prioritized next steps with estimated impact

**When to Recommend:**
- Client is unsure what they need
- Client thinks they need a logo but actually has deeper problems
- Client wants to "test" working with WZZRD AI before committing to a larger engagement
- Client has been doing random marketing and wants to understand what's working

**Key Principle:** This is NOT a sales pitch for bigger services. It's a genuine diagnostic that gives the client actionable insights they can use immediately, whether or not they continue with WZZRD AI.`,
    category: "methodology",
    tags: JSON.stringify(["business-health-check", "diagnose", "service", "entry-point"]),
    source: "manual"
  },

  {
    title: "Service Playbook: Brand Identity (Design + Deploy)",
    content: `**Service:** Brand Identity
**Price Range:** 80,000-150,000 EGP (Egypt) / 25,000-50,000 SAR (KSA)
**Duration:** 6-10 weeks
**4D Stages:** DESIGN + DEPLOY

**What It Is:**
Complete brand identity engineering — from strategic positioning to visual/verbal system deployment. This is WZZRD AI's core offering.

**Deliverables:**
1. Strategic Positioning Document — Unfair Advantage, target audience, competitive positioning
2. Brand Architecture — How the brand is structured (master brand, sub-brands, endorsed brands)
3. Visual Identity System — Logo, color palette, typography, imagery guidelines, applications
4. Verbal Identity System — Tone of voice, messaging framework, key messages, tagline
5. Brand Guidelines Document — Comprehensive guide for consistent brand execution
6. Brand Touchpoint Design — Business cards, social media templates, presentation templates, etc.

**When to Recommend:**
- New business that needs everything from scratch
- Existing business that needs a complete rebrand (not just a logo refresh)
- Business expanding into new markets that needs a scalable identity system
- Business that has outgrown its current brand

**Key Principle:** Every element of the identity must be justified by strategy. We don't design things because they "look nice" — we design them because they communicate the right message to the right audience.`,
    category: "methodology",
    tags: JSON.stringify(["brand-identity", "design", "deploy", "service", "core-offering"]),
    source: "manual"
  },

  {
    title: "Service Playbook: Business Takeoff (Full 4D Framework)",
    content: `**Service:** Business Takeoff
**Price Range:** 200,000-320,000 EGP (Egypt) / 60,000-100,000 SAR (KSA)
**Duration:** 12-16 weeks
**4D Stages:** All four — DIAGNOSE → DESIGN → DEPLOY → OPTIMIZE

**What It Is:**
The complete WZZRD AI experience — full 4D Framework execution from diagnosis to optimization. This is for businesses that want transformative results.

**Deliverables:**
Everything from Brand Identity PLUS:
1. Comprehensive Business & Market Diagnosis
2. Go-to-Market Strategy
3. Content Strategy & Social Performance System
4. Customer Journey Engineering
5. Launch Campaign Design & Execution Support
6. 30-Day Post-Launch Optimization
7. Performance Dashboard & KPI Framework

**When to Recommend:**
- Business launching a new brand in a competitive market
- Business undergoing major transformation or repositioning
- Business that has tried piecemeal approaches and needs a complete system
- Business with ambitious growth targets that require structural brand support

**Key Principle:** This is not "doing everything at once." It's a phased, systematic approach where each stage builds on the previous one. The 4D Framework ensures nothing is skipped and everything is connected.`,
    category: "methodology",
    tags: JSON.stringify(["business-takeoff", "full-4D", "service", "premium", "transformation"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BRAND PHILOSOPHY & VALUES
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "WZZRD AI Brand DNA — Core Identity & Values",
    content: `**Who We Are:**
Premium Brand Engineering for Founders & SMEs. We build enduring identities through clarity, intention, and commercial logic.

At WZZRD AI, we don't believe in "marketing services." We believe in Growth Engineering. We are a specialized brand-building studio that operates at the intersection of design, psychology, and business logic.

**Vision:** "To pioneer prime excellence in every brand, setting new standards for innovation, quality, and market leadership."

**Mission:** "To empower businesses with unparalleled branding and marketing strategies, guiding them seamlessly from ideation to the impactful launch of their new brand."

**Core Values:**
1. Excellence — Highest standards in every phase
2. Innovation — Creativity and forward-thinking
3. Client-Centric — Understanding unique needs
4. Integrity — Transparency, honesty, ethical practices
5. Collaboration — Collaborative approach
6. Social Impact — Positive societal change

**Brand Personality:** Sophisticated, Innovative, Trustworthy
**Brand Voice:** Authoritative, Inspirational, Collaborative

**Key Differentiators:**
- "Your Strategic Ally, Not Just a Vendor" — We don't take orders. We partner.
- "We build brands, we don't manage feeds" — We're NOT a social media agency
- "Clarity is the ultimate leverage" — In infinite noise, the clearest voice wins
- "Marks Fade, MARCAS don't" — We engineer systems, not decorations

**Target Audience:**
- Primary: Mid-to-Large Businesses and Industry Leaders
- Secondary: Startups with Growth Potential and Entrepreneurs
- NOT a fit: Businesses wanting daily social media management or follower-growth services`,
    category: "framework",
    tags: JSON.stringify(["brand-dna", "identity", "values", "mission", "vision"]),
    source: "manual"
  },

  {
    title: "Ramy Mortada — Founder Philosophy & Approach",
    content: `**Who:** Ramy Mortada — Founder & Strategy Lead of WZZRD AI

**Core Philosophy:**
"Most businesses don't need more content. They need more clarity. In an era of infinite digital noise, the loudest voice isn't the winner — the clearest one is."

**The Problem He Founded WZZRD AI to Solve:**
The "random effort" trap — when a brand lacks a system, marketing becomes a series of disconnected guesses. Businesses spend money on social media, ads, events, and content without a strategic foundation, and then wonder why nothing works.

**His Approach:**
- Think like a surgeon, not a salesperson — diagnose before prescribing
- Every business problem is a symptom of a deeper structural issue
- The job is to find the root cause before prescribing treatment
- "We don't just create aesthetics; we build the structural integrity a business needs to command premium pricing and long-term loyalty"

**His Role in Wzrd AI:**
Ramy's thinking, methodology, and decision-making patterns are encoded into the AI Brain. The AI doesn't replace Ramy — it multiplies him. Every diagnosis, every strategy, every recommendation follows the same logic Ramy would use, informed by the same frameworks and the same philosophy.

**Key Quotes:**
- "Creativity without a system is just art. Creativity with a system is a Marca."
- "When you work with us, you aren't hiring a hands-off agency — you are gaining a partner who values your ROI as much as your brand's DNA."
- "We replace noise with a Marca — a brand engineered to last, built on a foundation of structural systems and commercial intent."`,
    category: "framework",
    tags: JSON.stringify(["ramy-mortada", "founder", "philosophy", "leadership"]),
    source: "manual"
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GENERAL KNOWLEDGE
  // ═══════════════════════════════════════════════════════════════════════
  {
    title: "Industry-Specific Branding Considerations — F&B Sector",
    content: `**Industry:** Food & Beverage (Restaurants, Cafes, Food Products)

**Common Brand Problems in F&B:**
1. Over-reliance on food photography instead of brand storytelling
2. No differentiation beyond menu items
3. Location-dependent rather than brand-dependent loyalty
4. Inconsistent experience across branches (for chains)
5. Price competition with similar establishments

**WZZRD AI Approach for F&B:**
- DIAGNOSE: Is the problem the food, the brand, or the customer experience?
- Focus on the EXPERIENCE brand, not just the PRODUCT brand
- Build a narrative that goes beyond "we have good food" (everyone says this)
- Engineer the customer journey from discovery to advocacy
- Create a brand system that works whether the customer is in-store, on delivery apps, or on social media

**Key Questions for F&B Clients:**
- "Why would someone drive past 5 similar restaurants to come to yours?"
- "If you removed your logo from the menu, would customers still know it's your brand?"
- "What's the story behind your food? Not the recipe — the WHY."

**Market Insight (MENA):**
- F&B is one of the most competitive sectors in Egypt and KSA
- Delivery apps have commoditized food — brand is the only differentiator
- Saudi Vision 2030 entertainment sector is creating massive F&B demand
- Egyptian F&B market is price-sensitive but increasingly brand-conscious`,
    category: "market_insight",
    industry: "food_beverage",
    tags: JSON.stringify(["F&B", "restaurants", "food", "industry-specific"]),
    source: "manual"
  },

  {
    title: "Industry-Specific Branding Considerations — Tech & SaaS",
    content: `**Industry:** Technology & SaaS (Software, Apps, Tech Startups)

**Common Brand Problems in Tech:**
1. Feature-focused messaging instead of benefit-focused
2. "We're like [competitor] but better" positioning (lazy and ineffective)
3. Technical jargon that alienates non-technical buyers
4. No emotional connection — purely rational value proposition
5. Scaling brand inconsistently as the company grows

**WZZRD AI Approach for Tech:**
- DIAGNOSE: Is the product the problem, or is it the way the product is communicated?
- Translate features into outcomes: "What does this MEAN for the customer's life/business?"
- Build a brand that works for both technical and non-technical audiences
- Create a positioning that's about the TRANSFORMATION, not the technology
- Engineer a brand system that scales with the company

**Key Questions for Tech Clients:**
- "Can you explain what your product does to your grandmother in one sentence?"
- "What happens to your customer's life/business AFTER they use your product?"
- "Are you selling technology or are you selling a solution to a problem?"

**Market Insight (MENA):**
- MENA tech ecosystem is growing rapidly, especially in KSA (NEOM, Vision 2030)
- Egyptian tech startups are increasingly competing globally
- Arabic-first tech branding is a massive gap — most tech brands feel "translated"
- B2B tech in MENA needs more sophisticated brand strategy as the market matures`,
    category: "market_insight",
    industry: "technology",
    tags: JSON.stringify(["tech", "SaaS", "startups", "industry-specific"]),
    source: "manual"
  }
];

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Check if already seeded
  const [existing] = await connection.execute('SELECT COUNT(*) as count FROM knowledge_entries WHERE source = ?', ['manual']);
  const count = existing[0].count;
  
  if (count >= 20) {
    console.log(`Knowledge Base already has ${count} manual entries. Skipping seed.`);
    await connection.end();
    return;
  }
  
  console.log(`Found ${count} existing manual entries. Seeding ${entries.length} entries...`);
  
  let inserted = 0;
  for (const entry of entries) {
    try {
      // Check if entry with same title already exists
      const [existing] = await connection.execute(
        'SELECT id FROM knowledge_entries WHERE title = ?',
        [entry.title]
      );
      
      if (existing.length > 0) {
        console.log(`  ⏭ Skipping (exists): ${entry.title.substring(0, 60)}...`);
        continue;
      }
      
      const now = new Date();
      await connection.execute(
        `INSERT INTO knowledge_entries (title, content, category, industry, market, source, tags, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          entry.title,
          entry.content,
          entry.category,
          entry.industry || null,
          entry.market || null,
          entry.source,
          entry.tags || '[]',
          now,
          now
        ]
      );
      inserted++;
      console.log(`  ✅ Inserted: ${entry.title.substring(0, 60)}...`);
    } catch (err) {
      console.error(`  ❌ Error inserting "${entry.title}":`, err.message);
    }
  }
  
  console.log(`\n✅ Seeded ${inserted} new knowledge entries (${entries.length - inserted} skipped).`);
  
  // Show summary
  const [summary] = await connection.execute(
    'SELECT category, COUNT(*) as count FROM knowledge_entries WHERE isActive = 1 GROUP BY category ORDER BY count DESC'
  );
  console.log('\nKnowledge Base Summary:');
  for (const row of summary) {
    console.log(`  ${row.category}: ${row.count} entries`);
  }
  
  await connection.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
