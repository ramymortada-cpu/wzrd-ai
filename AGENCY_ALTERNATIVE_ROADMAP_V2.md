# WZZRD AI: The Agency Alternative Roadmap (V2)

## The Transformation: From Diagnosis Tool to Agency Lead Engine

WZZRD AI today is a **Diagnosis Engine** — it tells users what is wrong with their brand across 9 dimensions. That is valuable, but it is not an agency alternative. An agency diagnoses AND executes. 

To become a true agency alternative (and a $1M+ valuation product), WZZRD AI must give users two clear paths after every diagnosis, while avoiding the "ChatGPT Trap" (building generic AI tools that users can get for free elsewhere).

**Path A — Self-Service (DIY):** "Here are the *Brand-Aligned* AI tools to fix this yourself."
**Path B — Done-For-You (DFY):** "Send this rich diagnosis to an expert agency and they will fix it for you."

This roadmap spans 4 sprints, each building on the previous one. The ultimate goal is to prove that WZZRD AI can generate high-ticket agency contracts, which is where the true valuation lies.

---

## The Strategic Shifts (Why V2 is Different)

1. **The ChatGPT Defense:** We will not build generic "AI Content Generators." We will build **Brand-Aligned Execution Tools**. The value is not the text; the value is the *guardrails* (the 47 rules, constraints, and positioning data extracted from the user's diagnosis).
2. **The CRM Reality Check:** We will not build a complex CRM for agencies. Agencies already have CRMs. We will build a **Lead Enrichment Engine** that pushes data-rich leads (via Webhooks/Zapier) directly into the agency's existing workflow.
3. **The Revenue Pivot:** The UI will heavily prioritize the "Done-For-You" agency upsell. The DIY tools are a retention mechanism for those who cannot afford the agency, but the primary business goal is generating high-ticket leads.

---

## The Journey at a Glance

| Sprint | Theme | What Changes for the User | Valuation Impact |
|--------|-------|--------------------------|-----------------|
| **Sprint 5** | The Foundation | Premium reports work, reports are saved, SEO exists, referrals are visible, emails bring users back | Product is sellable — no dealbreakers |
| **Sprint 6** | Brand-Aligned Execution | Users can generate content *that strictly follows their diagnosis rules*, track progress, and see their score improve | Product has a defensible moat against generic AI |
| **Sprint 7** | The Lead Enrichment Engine | Users can request agency services directly; agencies receive structured leads via Webhooks into their own CRM | Product proves B2B revenue stream (High-Ticket Leads) |
| **Sprint 8** | The Ecosystem | Visual AI generation, expert marketplace, API access, advanced analytics | Product is a platform, not just a tool |

---

## Sprint 5: The Foundation (10 Tasks)

**Theme:** Fix what is broken, close trust gaps, and make the product investor-ready.

### Task 1: Premium Report Persistence + "My Reports" Dashboard
**Priority:** P0 — Critical
- **The Fix:** Wire the existing (but dead) `premium.generateReport` endpoint to the UI.
- **Deliverables:** `premium_reports` table, server-side persistence, "Get Full Premium Report" CTA in the result view, and a `/my-reports` dashboard.

### Task 2: Landing Page Accuracy + Design Health Integration
**Priority:** P1
- **Deliverables:** Add Design Health Check to the tools array in Welcome.tsx, add missing rate limit entries, update marketing copy to reference 9 tools.

### Task 3: SEO Meta Tags for All React Routes
**Priority:** P1
- **Deliverables:** Install `react-helmet-async`, create a reusable `<SEO>` component, add unique bilingual (AR/EN) title/description to every major page, generate `robots.txt` and `sitemap.xml`.

### Task 4: Copilot "Action Plan" Mode
**Priority:** P1
- **Deliverables:** New `/plan` command in Copilot that generates a structured 5-step implementation plan saved to the `user_checklists` table, with an interactive UI.

### Task 5: Sentry Client-Side + Error Boundary Upgrade
**Priority:** P1
- **Deliverables:** Install `@sentry/react`, replace existing ErrorBoundary with `Sentry.ErrorBoundary`, add `VITE_SENTRY_DSN`.

### Task 6: GDPR Compliance — Delete Account + Export Data
**Priority:** P2
- **Deliverables:** Server-side `auth.deleteAccount` and `auth.exportData`, new "Account" tab in Settings.

### Task 7: Dedicated Referral Page with Social Sharing
**Priority:** P2
- **Deliverables:** New `/referrals` page with referral link, stats, and social share buttons (WhatsApp, Twitter/X, LinkedIn).

### Task 8: Enhanced Upsell Flow — Three-Tier Conversion Funnel
**Priority:** P2
- **Deliverables:** "Free vs Full vs Premium" comparison table, Premium Report CTA with blurred preview sections, "Premium Report Sample" modal.

### Task 9: Re-engagement Email Automation
**Priority:** P2
- **Deliverables:** Daily cron job for inactivity detection (3/7/30 day thresholds), default email templates, deduplication logic.

### Task 10: Final Hardening & Launch Checklist
**Priority:** P3
- **Deliverables:** Add Sentry env vars to Railway, clean up stale branches, update deployment docs, mobile responsiveness check.

---

## Sprint 6: Brand-Aligned Execution (8 Tasks)

**Theme:** Build execution tools that ChatGPT cannot replicate because they rely on deep, structured brand context.

### Task 1: The "Brand-Aligned" Content Enforcer
Not a generic generator. A tool that *forces* content to adhere to the user's diagnosis.
- **What it does:** Takes the user's Brand Twin data (tone, negative constraints, positioning) and generates 30 days of social media content. If the diagnosis said "Stop using emojis and be more authoritative," the generator strictly enforces this.
- **Credit cost:** 200-400 credits per generation batch.

### Task 2: The "Diagnosis-Driven" Copy Improver
- **What it does:** Takes the user's current copy (website bio, tagline) and rewrites it specifically to fix the flaws identified in the "Identity Snapshot" diagnosis.
- **Credit cost:** 100-200 credits per rewrite session.

### Task 3: AI Brand Guidelines Generator
- **What it does:** Takes the user's current logo, colors, and fonts (from Design Health diagnosis) and generates a strict brand guidelines document (PDF).
- **Credit cost:** 300-500 credits.

### Task 4: Implementation Tracker Dashboard
- **What it does:** Aggregates all checklists from `user_checklists` into a single dashboard. Shows progress percentage per tool area.

### Task 5: Progress Re-evaluation (Score Tracking Over Time)
- **What it does:** After completing checklist tasks, prompts the user to "Re-diagnose to see your improvement." Shows a score history chart (e.g., 35 → 52 → 71).

### Task 6: Subscription Model (Monthly Plans)
- **What it does:** Introduces 3 tiers (Starter, Pro, Enterprise) via Paymob to create predictable MRR, bundling credits and execution tools.

### Task 7: Services Info Page (The DFY Bridge)
- **What it does:** Dedicated page showing Primo Marca's service tiers (AUDIT, BUILD, TAKEOFF) with pricing and a "Request This Service" button.

### Task 8: Diagnosis-to-Service-Request Flow
- **What it does:** Enhanced "Service Recommendation" section. The request includes the full diagnosis results, score, and findings, creating a lead in the admin panel.

---

## Sprint 7: The Lead Enrichment Engine (5 Tasks)

**Theme:** Do not build a CRM. Build the pipes to push data-rich leads to the agency's existing CRM.

### Task 1: Webhook & Zapier Integration
- **What it does:** When a user clicks "Request Service," WZZRD AI fires a webhook containing the user's contact info, lead score, and the *entire JSON diagnosis*. This allows agencies to push leads directly into HubSpot, Salesforce, or Monday.com.

### Task 2: Auto-Generated Proposals (Sent to Agency)
- **What it does:** Takes the user's diagnosis data and generates a branded proposal document using Claude. This proposal is attached to the webhook payload or emailed to the agency sales team, saving them hours of prep work.

### Task 3: The "Lightweight" Client Portal
- **What it does:** Enhances the existing `/portal/:token` route. The client can view their diagnosis and the auto-generated proposal. No complex messaging system — just a secure document viewer.

### Task 4: Revenue Sharing Infrastructure
- **What it does:** Commission tracking (X% of every accepted proposal). Foundation for a multi-agency marketplace.

### Task 5: Multi-Agency Routing Rules
- **What it does:** Agency profiles with specialties and pricing ranges. Lead routing rules based on specialty, budget, and availability.

---

## Sprint 8: The Ecosystem (5 Tasks)

**Theme:** Advanced AI capabilities and marketplace features that solidify WZZRD AI as a platform.

### Task 1: Visual AI Generation
- **What it does:** Expand Design Health to generate social media graphics, logo variations, and ad creatives based on the strict brand guidelines (using DALL-E or Midjourney API).

### Task 2: Expert Marketplace
- **What it does:** A directory of vetted freelancers for users who want help with specific tasks on their Action Plan (e.g., "Implement Task 3"), with an escrow payment system.

### Task 3: Advanced Analytics & ROI Tracking
- **What it does:** Deep PostHog integration. ROI calculator: "You improved your brand score by 25 points. Based on industry benchmarks, this translates to X% increase in conversion rate."

### Task 4: API Access (Enterprise)
- **What it does:** REST API with API key authentication for all 9 diagnosis tools, allowing enterprise users to integrate the engine into their workflows.

### Task 5: White-Label Infrastructure
- **What it does:** Custom domain support, branded reports with agency logos, and custom color schemes for agencies to offer WZZRD AI under their own brand.

---

## Revenue Model Evolution

| Sprint | Revenue Sources | Pricing Model |
|--------|----------------|---------------|
| **Sprint 5** | Credit purchases, premium reports | Pay-per-use |
| **Sprint 6** | + Execution tools, subscriptions | Pay-per-use + Monthly plans |
| **Sprint 7** | + Agency commissions (High-Ticket) | + Revenue sharing (The real money) |
| **Sprint 8** | + API access, marketplace fees, white-label | + Enterprise contracts |

---

## Execution Timeline (Estimated)

| Sprint | Duration | Prerequisite |
|--------|----------|-------------|
| Sprint 5 | 2-3 weeks | None — start immediately |
| Sprint 6 | 3-4 weeks | Sprint 5 complete |
| Sprint 7 | 2-3 weeks | Sprint 6 complete |
| Sprint 8 | 4-6 weeks | Sprint 7 complete |

**Total estimated timeline: 3-4 months to full agency alternative.**
