# WZZRD AI: The Agency Alternative Roadmap

## The Transformation: From Diagnosis Tool to Agency Alternative

WZZRD AI today is a **Diagnosis Engine** — it tells users what is wrong with their brand across 9 dimensions. That is valuable, but it is not an agency alternative. An agency diagnoses AND executes. To become a true agency alternative, WZZRD AI must give users two clear paths after every diagnosis:

**Path A — Self-Service (DIY):** "Here are the AI tools to fix this yourself."
**Path B — Done-For-You (DFY):** "Send this to an expert agency and they will fix it for you."

This roadmap spans 4 sprints, each building on the previous one. Each sprint has a clear theme, measurable outcome, and a valuation milestone.

---

## The Journey at a Glance

| Sprint | Theme | What Changes for the User | Valuation Impact |
|--------|-------|--------------------------|-----------------|
| **Sprint 5** | The Foundation | Premium reports work, reports are saved, SEO exists, referrals are visible, emails bring users back | Product is sellable — no dealbreakers |
| **Sprint 6** | The Execution Engine | Users can generate content, improve copy, track progress, and see their score improve over time | Product has recurring revenue potential |
| **Sprint 7** | The Agency Bridge | Users can request agency services directly from their diagnosis, agencies receive structured leads with full context | Product has B2B revenue stream |
| **Sprint 8** | The Ecosystem | Visual AI generation, expert marketplace, API access, advanced analytics | Product is a platform, not just a tool |

---

## Sprint 5: The Foundation (10 Tasks)

**Theme:** Fix what is broken, close trust gaps, and make the product investor-ready.

**Why this sprint matters:** Right now, a user pays 50+ credits for a premium report and it vanishes on page refresh. The premium report endpoint exists but is never called from the UI. There are no SEO meta tags on React routes. The referral system is hidden. Re-engagement emails are coded but never triggered. These are not features to add — these are broken promises to fix.

### Task 1: Premium Report Persistence + "My Reports" Dashboard
**Priority:** P0 — Critical

Two problems exist simultaneously:
- The `premium.generateReport` server endpoint works perfectly but is never called from the client. The `setPremiumReport()` function in ToolPage.tsx is never invoked with actual data. The entire premium report flow is dead code.
- Even if it were called, the report would not be saved to the database. The `diagnosis_history` table only stores free tool results.

**Deliverables:**
- New `premium_reports` database table (schema + migration)
- Server-side persistence: save the Claude response to the database after successful generation
- Client-side wiring: add a "Get Full Premium Report" CTA button in the result view that calls `premium.generateReport`
- New `/my-reports` page showing all past diagnoses and premium reports with "View" and "Download PDF" actions
- Navigation link: "My Reports" (تقاريري) in the authenticated header

### Task 2: Landing Page Accuracy + Design Health Integration
**Priority:** P1

The Welcome page lists 8 tools but does not include Design Health Check (added in Sprint 4). Rate limiting is missing for `design_health` and `premium.generateReport` endpoints.

**Deliverables:**
- Add Design Health Check to the tools array in Welcome.tsx
- Add missing rate limit entries for design health and premium report endpoints
- Update all marketing copy referencing tool count to 9

### Task 3: SEO Meta Tags for All React Routes
**Priority:** P1

All React SPA routes share the same title and description from the static HTML. Google sees identical metadata for every page, killing organic search traffic.

**Deliverables:**
- Install `react-helmet-async` and create a reusable `<SEO>` component
- Add unique bilingual (AR/EN) title and description to every major page
- Generate `robots.txt` and `sitemap.xml` for all public routes

### Task 4: Copilot "Action Plan" Mode
**Priority:** P1

The Copilot chats but does not produce actionable output. The `user_checklists` table exists in the schema but is never populated. Users get a diagnosis and then do not know what to do next.

**Deliverables:**
- New `/plan` command in Copilot that generates a structured 5-step implementation plan
- Each step references specific data from the user's diagnosis
- Plans are saved to the existing `user_checklists` table
- Interactive checklist UI with persistent checkboxes in the Copilot

### Task 5: Sentry Client-Side + Error Boundary Upgrade
**Priority:** P1

Sentry is configured server-side but completely absent from the React frontend. Client-side errors are invisible.

**Deliverables:**
- Install `@sentry/react` and initialize in `main.tsx`
- Replace the existing class-based ErrorBoundary with `Sentry.ErrorBoundary`
- Add `VITE_SENTRY_DSN` to environment configuration

### Task 6: GDPR Compliance — Delete Account + Export Data
**Priority:** P2

No mechanism exists for users to delete their account or export their data. The Settings page has WhatsApp, Team, and Audit tabs but no "Account" tab.

**Deliverables:**
- Server-side `auth.deleteAccount` mutation (soft-delete with 30-day grace period)
- Server-side `auth.exportData` query (JSON download of all user data)
- New "Account" tab in Settings with "Export My Data" and "Delete Account" buttons

### Task 7: Dedicated Referral Page with Social Sharing
**Priority:** P2

The referral system works in the backend but the UI is buried inside the MyBrand page. Users do not know they can earn credits by referring others.

**Deliverables:**
- New `/referrals` page with referral link, stats, and social share buttons (WhatsApp, Twitter/X, LinkedIn)
- Server-side `referrals.stats` query
- Navigation link in the authenticated header

### Task 8: Enhanced Upsell Flow — Three-Tier Conversion Funnel
**Priority:** P2

After unlocking the full diagnosis, there is no path to the premium report. The conversion funnel has a dead end.

**Deliverables:**
- "Free vs Full vs Premium" comparison table in the free preview section
- Premium Report CTA with blurred preview sections in the result view
- "Premium Report Sample" modal showing an anonymized example

### Task 9: Re-engagement Email Automation
**Priority:** P2

The email automation system supports `inactive_3d`, `inactive_7d`, `inactive_30d` triggers but they are never fired. Users sign up, run one tool, and never return.

**Deliverables:**
- Daily cron job for inactivity detection (3/7/30 day thresholds)
- Default email templates for each trigger with personalized content
- Deduplication logic to prevent repeat sends

### Task 10: Final Hardening & Launch Checklist
**Priority:** P3

Small gaps that collectively signal "not production-ready" to a buyer.

**Deliverables:**
- Add `SENTRY_DSN` and `VITE_SENTRY_DSN` to Railway
- Clean up stale remote branches
- Update deployment documentation
- Mobile responsiveness verification
- Performance check (landing page < 3 seconds)

---

## Sprint 6: The Execution Engine (8 Tasks)

**Theme:** Transform WZZRD AI from "what is wrong" to "here is how to fix it yourself."

**Why this sprint matters:** This is the sprint that turns WZZRD AI into a true agency alternative for the DIY user. After Sprint 5, users get a diagnosis and an action plan. After Sprint 6, they get the AI tools to execute that plan without hiring anyone.

### Task 1: AI Content Generator
The "Message Check" and "Content Diagnosis" tools tell users their content is weak. This tool generates the content for them.

**What it does:**
- Takes the user's brand context (from Brand Twin / MyBrand) and their diagnosis results
- Generates 30 days of social media content (captions, hashtags, posting schedule)
- Generates blog post outlines with SEO-optimized titles
- Generates ad copy variations (Facebook, Instagram, Google)
- Output is editable before download/copy

**Credit cost:** 200-400 credits per generation batch

### Task 2: AI Copy Improver
The "Identity Snapshot" tool tells users their tagline, bio, or about section is weak. This tool rewrites it.

**What it does:**
- Takes the user's current copy (website bio, Instagram bio, tagline, about page)
- Generates 3 improved versions with explanations of why each is better
- References specific findings from the Identity Snapshot diagnosis
- Supports Arabic and English output

**Credit cost:** 100-200 credits per rewrite session

### Task 3: AI Brand Guidelines Generator
The "Design Health" tool tells users their visual identity is inconsistent. This tool creates the guidelines.

**What it does:**
- Takes the user's current logo, colors, and fonts (from Design Health diagnosis)
- Generates a brand guidelines document: color palette with hex codes, typography recommendations, logo usage rules, tone of voice guide
- Output as a downloadable PDF

**Credit cost:** 300-500 credits

### Task 4: Implementation Tracker Dashboard
Users have action plans from the Copilot (Sprint 5, Task 4) but no way to track progress across multiple diagnoses.

**What it does:**
- Aggregates all checklists from `user_checklists` into a single dashboard
- Shows progress percentage per tool area (Brand: 3/5 done, Content: 1/5 done)
- Visual progress chart over time
- Nudges: "You have 2 tasks left in Brand Identity — complete them and re-diagnose"

### Task 5: Progress Re-evaluation (Score Tracking Over Time)
The most powerful retention mechanic: users re-run diagnoses to see their score improve.

**What it does:**
- After completing checklist tasks, a CTA appears: "Re-diagnose to see your improvement"
- Score history chart: "Brand Diagnosis: 35 → 52 → 71 over 3 months"
- Gamification: badges for score milestones (50+, 70+, 90+)
- This creates a natural recurring usage pattern

### Task 6: Subscription Model (Monthly Plans)
Credits-only pricing limits recurring revenue. Monthly plans create predictable MRR.

**What it does:**
- 3 tiers: Starter (X credits/month + basic tools), Pro (more credits + execution tools + unlimited Copilot), Enterprise (custom)
- Paymob recurring payment integration
- Subscription management in Settings (upgrade, downgrade, cancel)
- Admin dashboard: MRR tracking, churn rate, plan distribution

### Task 7: Services Info Page
The "Talk to an Expert" CTA currently links to `/services-info` which does not exist as a dedicated page. Users who want the DFY path hit a dead end.

**What it does:**
- Dedicated page showing Primo Marca's service tiers (AUDIT, BUILD, TAKEOFF)
- Each tier shows: what is included, pricing, timeline, and a "Request This Service" button
- The request button pre-fills the user's diagnosis data into a lead form
- Lead goes directly to the Leads dashboard in the admin panel

### Task 8: Diagnosis-to-Service-Request Flow
The bridge between DIY and DFY. After any diagnosis, the user can request professional help with one click.

**What it does:**
- Enhanced "Service Recommendation" section in the result view
- Instead of just a WhatsApp link, shows a structured form: "Request [Service Name] — your diagnosis will be shared with our team"
- The request includes: full diagnosis results, score, findings, and user contact info
- Creates a lead in the admin Leads tab with full context
- Sends a notification email to the agency team

---

## Sprint 7: The Agency Portal (6 Tasks)

**Theme:** Build the infrastructure for agencies to receive, manage, and deliver work through WZZRD AI.

**Why this sprint matters:** This sprint turns WZZRD AI into a two-sided platform. Users come for the diagnosis and execution tools. Agencies come for the pre-qualified, data-rich leads. WZZRD AI takes a cut of every deal.

### Task 1: Agency Dashboard (Standalone)
Separate the agency functionality from the admin panel into a dedicated agency dashboard.

**What it does:**
- Dedicated `/agency` route with its own layout
- Lead inbox: all service requests from WZZRD AI users, sorted by lead score
- Each lead shows: full diagnosis, score, recommended service, estimated value
- Lead status pipeline: New → Contacted → Proposal Sent → Accepted → In Progress → Completed

### Task 2: Auto-Generated Proposals
When a user requests a service, the system automatically generates a professional proposal.

**What it does:**
- Takes the user's diagnosis data and the recommended service tier
- Generates a branded proposal document using Claude
- Agency can edit before sending to the client
- Client receives the proposal via email and can view it in their WZZRD AI account

### Task 3: Client Portal Enhancement
The client portal already exists (`/portal/:token`). Enhance it for the DFY workflow.

**What it does:**
- Client can view: their diagnosis, the proposal, project status, and deliverables
- Secure file sharing: agency uploads deliverables, client reviews and approves
- Comment system on deliverables
- Progress timeline showing project milestones

### Task 4: Agency Notifications & Communication
Real-time communication between agency and client within the platform.

**What it does:**
- In-app notification system for new leads, proposal responses, and deliverable uploads
- Email notifications for critical events
- Optional WhatsApp integration for urgent communications

### Task 5: Revenue Sharing Infrastructure
WZZRD AI takes a percentage of every deal closed through the platform.

**What it does:**
- Commission tracking: X% of every accepted proposal
- Agency payout dashboard
- Revenue reporting in admin panel
- Foundation for multi-agency marketplace

### Task 6: Multi-Agency Routing
Prepare the infrastructure for onboarding additional agency partners.

**What it does:**
- Agency profiles with specialties, pricing ranges, and ratings
- Lead routing rules: route leads to agencies based on specialty, budget, and availability
- Agency onboarding flow
- Quality control: client ratings of agency work

---

## Sprint 8: The Ecosystem (5 Tasks)

**Theme:** Advanced AI capabilities and marketplace features that solidify WZZRD AI as a platform.

### Task 1: Visual AI Generation
Expand Design Health from diagnosis to execution.

**What it does:**
- Generate social media graphics based on brand guidelines
- Generate logo variations and mockups
- Generate ad creatives with brand-consistent visuals
- Uses advanced image generation models (DALL-E, Midjourney API, or Flux)

### Task 2: Expert Marketplace
A directory of vetted freelancers for users who want help but not a full agency.

**What it does:**
- Freelancer profiles with portfolios, ratings, and specialties
- Task-based hiring: "I need someone to implement Task 3 from my Action Plan"
- Escrow payment system
- Quality ratings and reviews

### Task 3: Advanced Analytics & ROI Tracking
Deep PostHog integration for measuring the impact of changes.

**What it does:**
- Before/after comparison dashboards
- ROI calculator: "You improved your brand score by 25 points. Based on industry benchmarks, this translates to X% increase in conversion rate."
- Competitive benchmarking over time

### Task 4: API Access (Enterprise)
Allow enterprise users to integrate WZZRD AI's diagnosis engine into their workflows.

**What it does:**
- REST API with API key authentication
- Endpoints for all 9 diagnosis tools
- Webhook support for async results
- Usage-based pricing for API calls

### Task 5: White-Label Infrastructure
Allow agencies to offer WZZRD AI under their own brand.

**What it does:**
- Custom domain support
- Branded reports with agency logo
- Custom color scheme
- Agency-specific pricing

---

## Revenue Model Evolution

| Sprint | Revenue Sources | Pricing Model |
|--------|----------------|---------------|
| **Sprint 5** | Credit purchases, premium reports | Pay-per-use |
| **Sprint 6** | + Execution tools, subscriptions | Pay-per-use + Monthly plans |
| **Sprint 7** | + Agency commissions, service fees | + Revenue sharing |
| **Sprint 8** | + API access, marketplace fees, white-label licenses | + Enterprise contracts |

---

## The User Journey After All 4 Sprints

1. **Discovery:** User finds WZZRD AI through SEO, referral, or ad
2. **Free Diagnosis:** Runs a free preview, sees their score and blurred findings
3. **Unlock:** Pays credits to see full diagnosis with detailed findings and action items
4. **Premium Report:** Pays more credits for the executive-level report with priority matrix and 30/60/90 day plan
5. **Action Plan:** Uses Copilot `/plan` to get a structured checklist
6. **Self-Execute:** Uses AI Content Generator, Copy Improver, or Brand Guidelines Generator to implement the plan
7. **Track Progress:** Checks off tasks, re-diagnoses, watches score improve
8. **OR Request Help:** Clicks "Get Professional Help" → service request goes to agency → agency sends proposal → work gets done through the platform
9. **Ongoing:** Monthly subscription keeps them engaged with new diagnoses, content generation, and score tracking

---

## Execution Timeline (Estimated)

| Sprint | Duration | Prerequisite |
|--------|----------|-------------|
| Sprint 5 | 2-3 weeks | None — start immediately |
| Sprint 6 | 3-4 weeks | Sprint 5 complete |
| Sprint 7 | 3-4 weeks | Sprint 6 complete (needs Services Info page) |
| Sprint 8 | 4-6 weeks | Sprint 7 complete |

**Total estimated timeline: 3-4 months to full agency alternative.**
