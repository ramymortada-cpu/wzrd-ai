# WZZRD AI — Sprint 5 Master Plan (The $1M Launch Sprint)

## Overview
This is the final sprint before the official launch. The goal is to elevate WZZRD AI from a functional tool to a **$1M valuation SaaS product**. 

A $1M SaaS product requires three pillars:
1. **Flawless Core Infrastructure** (Users don't lose data, no unhandled errors).
2. **Growth & Retention Engine** (SEO, referrals, multi-language, onboarding).
3. **"Wow" Factor** (Copilot that actually helps, real social proof).

This sprint contains **8 high-impact tasks** designed to close the remaining gaps identified in the codebase audit.

---

## Task 1: Premium Report Persistence & History Dashboard (P0 - Critical)
**The Gap:** Currently, when a user pays for a premium report, it is generated and displayed on the screen. If they refresh the page, **the report is gone forever**. The `diagnosis_history` table exists but is not wired to save premium reports.
**The Fix:**
- Update `server/routers/premium.ts` to save the generated premium report JSON into a new `premium_reports` table (or extend `diagnosis_history`).
- Build a "My Reports" (Dashboard) page where users can view their past free and premium reports.
- Ensure the "Download PDF" functionality works from the history page.

## Task 2: Landing Page Overhaul & Real Social Proof (P1 - Conversion)
**The Gap:** The landing page says "6 أدوات" but there are 9 tools. Testimonials are hardcoded fake data. There is no English version of the landing page, limiting the market.
**The Fix:**
- Update the landing page copy to reflect the actual tool count (9 tools).
- Wire the landing page testimonials section to fetch from the existing `reviews.listApproved` API endpoint.
- Create an English version of the landing page (`/en`) with a language toggle, utilizing the existing i18n infrastructure.
- Add proper SEO meta tags to all React routes (currently only the HTML landing page has them).

## Task 3: Copilot "Action Plan" Upgrade (P1 - Retention)
**The Gap:** The Copilot currently just chats based on the diagnosis context. It doesn't proactively help the user implement the advice.
**The Fix:**
- Upgrade the Copilot system prompt (`COPILOT_SYSTEM`) to act as a "Fractional CMO".
- Add a feature where Copilot can generate a step-by-step "Implementation Checklist" based on the user's weakest diagnosis score.
- Save these checklists to the existing `user_checklists` table so users can track their progress.

## Task 4: Sentry Client-Side Integration (P1 - Stability)
**The Gap:** Sentry is set up on the server (`server/_core/sentry.ts`) but is completely missing from the React frontend. If a user hits a white screen, we won't know.
**The Fix:**
- Install `@sentry/react`.
- Initialize Sentry in `client/src/main.tsx`.
- Wrap the app in a Sentry Error Boundary to catch React rendering errors and report them to the dashboard.

## Task 5: GDPR Compliance & Data Controls (P2 - Legal/Valuation)
**The Gap:** Enterprise buyers and European users require the ability to delete their accounts and export their data. These endpoints do not exist.
**The Fix:**
- Create a `deleteAccount` mutation that wipes the user's data from all tables (users, diagnosis_history, copilot_messages, etc.).
- Create a `exportData` query that returns a downloadable JSON file of all the user's history and profile data.
- Add these options to the existing `Settings.tsx` page.

## Task 6: Dedicated Referral & Affiliate UI (P2 - Growth)
**The Gap:** The referral system exists in the backend, but the UI is hidden inside the `MyBrand` page.
**The Fix:**
- Create a dedicated `/referrals` page.
- Show the user their unique referral link clearly.
- Display a dashboard of "Credits Earned via Referrals" and "Pending Referrals".
- Add social share buttons (WhatsApp, Twitter, LinkedIn) pre-filled with their link.

## Task 7: Interactive Onboarding Flow (P2 - Activation)
**The Gap:** New users sign up and are dropped into the dashboard without clear direction on which tool to use first.
**The Fix:**
- Implement a "Welcome Modal" for first-time logins.
- Ask 2-3 simple questions (e.g., "What is your biggest challenge?").
- Recommend the specific tool they should start with (e.g., "Start with Brand Diagnosis" or "Start with Offer Check") based on their answers.

## Task 8: Admin Dashboard Analytics (P3 - Operations)
**The Gap:** The admin panel lacks a high-level overview of system health and revenue.
**The Fix:**
- Add a "Metrics" tab to the Admin dashboard.
- Display: Total Users, Total Premium Reports Generated, Total Credits Deducted, and Active Copilot Sessions.
- This is crucial for demonstrating traction to potential buyers or investors.
