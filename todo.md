# Primo Marca Command Center - TODO

## Database & Architecture
- [x] Design and implement database schema (clients, projects, deliverables, notes, finances, knowledge base)
- [x] Seed Primo Marca knowledge base with complete methodology content
- [x] Set up AI engine integration with LLM and knowledge base context

## Client Pipeline Dashboard
- [x] Client management (add, edit, view clients)
- [x] Project creation linked to services
- [x] 4D Framework visual pipeline (Diagnose → Design → Deploy → Optimize)
- [x] Active projects overview with stage indicators

## AI-Powered Service Execution Playbooks
- [x] Business Health Check playbook with step-by-step workflow
- [x] Starting Business Logic playbook with step-by-step workflow
- [x] Brand Identity playbook with step-by-step workflow
- [x] Business Takeoff playbook with step-by-step workflow
- [x] Consultation playbook with step-by-step workflow

## AI Engine & Knowledge Base
- [x] Knowledge base integration feeding all Primo Marca documents into AI
- [x] AI system prompt trained on 4D Framework, Three Pillars, Consultant Box methodology
- [x] AI-powered deliverable generation (audit reports, strategic recommendations, brand positioning, messaging frameworks)
- [x] Context-aware AI that understands each client's project history

## Deliverables Tracker
- [x] Deliverables list per project with completion status
- [x] AI-powered deliverable generation from playbook steps
- [x] Deliverable templates aligned with each service

## Client Notes & Insights Hub
- [x] Client notes storage (diagnostic findings, strategic decisions, project context)
- [x] AI-assisted analysis of client notes
- [x] Timeline view of client interactions

## Financial Overview
- [x] Revenue tracking by service type
- [x] Payment status tracking (paid, pending, overdue)
- [x] Pipeline value calculation
- [x] KSA vs Egypt market breakdown

## Project Templates & Checklists
- [x] Service-specific templates aligned with Consultant Box methodology
- [x] Checklists for each 4D Framework stage per service
- [x] Three Pillars framework integration

## UI/UX & Design
- [x] Light theme (default) with Primo Marca brand colors and dark mode toggle
- [x] Dashboard layout with sidebar navigation
- [x] Responsive design
- [x] Professional premium feel matching brand identity

## Testing & Polish
- [x] Write vitest tests for core server procedures
- [x] Test AI integration workflows
- [x] Final UI polish and consistency check

## Audit Fixes — Target 8/10

- [x] Create shared constants file (STAGE_COLORS, SERVICE_LABELS, formatCurrency) to eliminate duplication
- [x] Switch default theme from dark to light mode
- [x] Add Arabic/English bilingual support with i18n system
- [x] Add RTL support for Arabic language
- [x] Auto-populate deliverables from playbook when project is created
- [ ] Add "Create Deliverable" UI button for manual additions (future enhancement)
- [x] Add inline editing for deliverable content (AI-generated or manual)
- [x] Transform AI Engine from chatbot to guided workflow executor (wizard-style)
- [x] Add conversation persistence (save/load AI conversations to database)
- [x] Build unified Client Detail page (projects, deliverables, notes, payments, AI history)
- [x] Improve Notes Hub with global view (all notes across clients)
- [x] Add revenue charts and market breakdown to Financials
- [x] Add "Start Playbook" action from Playbooks page
- [x] Improve mobile responsiveness (collapsible sidebar)
- [x] Write comprehensive integration tests (data flow, AI, edge cases)
- [x] Add search and filtering across entities
- [ ] Add deliverable export capability (future enhancement)
- [x] Arabic sidebar on right side for RTL

## New Features — v2.1

- [x] Test system: add sample client and create project, verify auto-populated deliverables
- [ ] Test AI Guided Workflow with Business Health Check
- [x] Build Proposal Generator: database schema and migration
- [x] Build Proposal Generator: server API with AI-powered proposal content generation
- [x] Build Proposal Generator: PDF export capability (browser print-to-PDF with branded layout)
- [x] Build Proposal Generator: frontend page with form, preview, and download
- [x] Add Proposal Generator to sidebar navigation
- [x] Write tests for Proposal Generator (11 tests passing)

## AI Agent Rebuild — Deep Knowledge Base (Critical)

- [x] Deep-read Company Profile PDF and extract all methodology details
- [x] Deep-read Brand Identity Guidelines PDF and extract all brand details
- [x] Deep-read Brand Strategy Manual PDF and extract all strategic frameworks
- [x] Deep-read Price List PDF and extract all service/pricing details
- [x] Build comprehensive knowledge base with full methodology, frameworks, tone, philosophy, case studies
- [x] Rebuild AI system prompts with deep context for each service
- [x] Rebuild AI system prompts for guided workflows with real methodology depth
- [x] Rebuild Proposal Generator AI prompts with deep knowledge
- [x] Test AI output quality and validate depth of responses — 96 tests passing

## AI Agent Rebuild v2 — Building a Brain, Not a Library (Critical)

### Phase 1: Extract Primo Marca DNA
- [x] Deep-read Company Profile (41 pages) — extract methodology, philosophy, tone, decision patterns
- [x] Deep-read Brand Identity Guidelines — extract personality, visual language, brand voice rules
- [x] Deep-read Brand Strategy Manual — extract strategic frameworks, positioning, messaging
- [x] Deep-read Price List — extract service structures, what's included, pricing logic
- [x] Map relationships between 4D Framework, Three Pillars, Consultant Box, and each service

### Phase 2: Build Diagnostic Logic
- [x] Build decision trees for each service (when to recommend what)
- [x] Build question flow logic (one question at a time, what to ask based on previous answer)
- [x] Build analysis patterns (how to interpret client answers and reach conclusions)
- [x] Define "when to say no" rules and redirection logic

### Phase 3: Integrated Knowledge (Academic + Practical + Primo Marca)
- [x] Map academic frameworks TO Primo Marca methodology (not separate)
- [x] Research SME-relevant case studies (same size/market as clients)
- [x] Extract and structure Primo Marca's own case studies (Beehive, Tazkyah Plus)

### Phase 4: Build the Agent Brain
- [x] Define AI personality and tone of voice rules
- [x] Define conversation flow logic (when to ask, when to answer, when to push back)
- [x] Define quality standards for each output type (proposal, audit, brand positioning, etc.)
- [x] Build output templates with quality benchmarks

### Phase 5-7: Implementation
- [x] Implement new knowledge base in codebase
- [x] Rebuild all AI system prompts with brain logic
- [x] Rebuild guided workflows with diagnostic trees and conversation flow
- [x] Rebuild proposal generation with quality standards (already using buildSystemPrompt)
- [x] Rebuild deliverable generation with quality standards (already using buildSystemPrompt)

### Phase 8: Quality Testing
- [x] Test AI diagnosis quality — 62 knowledge base tests verify diagnostic engine, question flow, conversation logic
- [x] Test AI proposal quality — quality standards verified in tests
- [x] Test AI deliverable quality — quality standards and playbook structure verified
- [x] All 96 tests passing — 4 test files covering knowledge base, proposals, command center, auth

## Discovery Questions Bank & Deliverable Templates

### Discovery Questions Bank
- [x] Build 6-tier question structure: Foundational, Business Structure, Brand & Identity, Social & Growth, Industry-Specific, Market-Specific
- [x] Each question has WHY, LISTEN FOR, RED FLAG, FOLLOW-UP LOGIC
- [x] Industry-specific questions for F&B, Healthcare, Real Estate, Tech/SaaS, Retail/E-commerce, Education
- [x] Market-specific questions for Egypt and KSA (Vision 2030, Saudization, economic context)
- [x] Red flags connected to diagnostic patterns (Clarity Gap, Commodity Trap, Random Effort, Identity Crisis)

### Deliverable Templates
- [x] Template 1: Business Model Analysis Report (Executive Summary, Canvas, Unit Economics, Competitive Position, Recommendations)
- [x] Template 2: Brand Positioning Document (Positioning Statement, PODs, POPs, Unfair Advantage, Brand Promise)
- [x] Template 3: Messaging Framework (Brand Narrative, Value Proposition, Taglines, Key Messages, Content Pillars)
- [x] Template 4: Customer Journey Map (6 stages: Awareness→Advocacy, Touchpoints, Emotional Map, Friction Points, Metrics)
- [x] Template 5: Social Strategy Document (Platform Strategy, Content Pillars, Calendar, Engagement, Performance)
- [x] Template 6: Brand Audit / Diagnosis Report (Health Score, Findings by Impact, Scorecard, Action Plan)
- [x] Template 7: Proposal Document (Client Problem First, Understanding, Approach, Deliverables, Timeline, Investment)

### Integration
- [x] Integrated Questions Bank into knowledgeBase.ts (DISCOVERY_QUESTIONS_BANK export)
- [x] Integrated Deliverable Templates into knowledgeBase.ts (DELIVERABLE_TEMPLATES export)
- [x] buildSystemPrompt includes Questions Bank in discovery/chat/diagnosis modes
- [x] buildSystemPrompt includes Templates in deliverable/proposal modes
- [x] 118 tests passing (84 KB + 22 CC + 11 proposals + 1 auth)

## Auto-Generate Proposal from Discovery Session

- [x] Server: `proposals.createFromDiscovery` tRPC procedure — extracts client info, classifies service, generates full proposal from conversation
- [x] Server: AI-powered service classification when serviceType not provided
- [x] Server: Minimum 2 messages validation
- [x] Frontend: "Generate Proposal" button in Free Chat (after 4+ messages)
- [x] Frontend: "Generate Proposal" button in Guided Workflow (after completing all steps)
- [x] Frontend: Auto-navigate to proposal detail page after generation
- [x] Frontend: Loading state with spinner during proposal generation
- [x] Frontend: Arabic/English support (inline translations)
- [x] Write tests for createFromDiscovery (3 tests: basic flow, with clientId/serviceType, min messages validation)
- [x] All 121 tests passing (84 KB + 22 CC + 14 proposals + 1 auth)

## Dashboard Analytics
- [x] Server: `dashboard.analytics` tRPC procedure with full analytics data
- [x] Frontend: Analytics page with KPI cards (conversion rate, pipeline value, deliverable completion, AI generated)
- [x] Frontend: Proposal conversion funnel chart
- [x] Frontend: Revenue trend bar chart (12 months)
- [x] Frontend: Service performance comparison with progress bars
- [x] Frontend: Market distribution donut chart
- [x] Frontend: Client status donut chart
- [x] Frontend: Client acquisition trend bar chart (12 months)
- [x] Add Analytics to sidebar navigation with i18n support

## Client Onboarding Wizard
- [x] Database: add onboarding_sessions table to track wizard progress
- [x] Server: onboarding procedures (create session, update step, complete)
- [x] Build multi-step wizard UI (Company Info → Needs Assessment → Service Recommendation → Proposal Review → Contract)
- [x] AI-powered needs assessment step that asks discovery questions
- [x] Auto-recommend service based on answers
- [x] Auto-generate proposal at the end
- [x] Add onboarding link to sidebar navigation

## Proposal Email Delivery
- [x] Server: email sending procedure using notification API
- [x] Build email template with proposal content (HTML formatted)
- [x] Frontend: "Send to Client" button on proposal detail page
- [x] Email includes proposal sections formatted as professional HTML
- [x] Track email sent status on proposal

## Client Portal
- [x] Database: add client_portal_tokens table for secure access links
- [x] Server: generate unique portal link per project
- [x] Server: public API to fetch project status and deliverables by token
- [x] Build public Client Portal page (no auth required, token-based access)
- [x] Show project info, stage progress, deliverables list with status
- [x] Show completed deliverables content
- [x] Add "Copy Portal Link" button on project detail page

## Tests
- [x] Write tests for dashboard analytics APIs
- [x] Write tests for onboarding wizard procedures
- [x] Write tests for email delivery procedure
- [x] Write tests for client portal token generation and public API

## Rename to Wzrd AI
- [x] Generate Wzrd AI logo icon (uploaded to CDN)
- [x] Update VITE_APP_TITLE (via Settings UI) and logo CDN URL in DashboardLayout
- [x] Update sidebar branding (logo + name)
- [x] Update all references from "Primo Marca" to "Wzrd AI" (i18n, AIEngine, ProposalDetail, ProjectDetail, routers)
- [ ] Update favicon

## Revolutionary Wzrd AI Vision
- [x] Deep research: what's missing in the market, what no one has built yet
- [x] Strategic brainstorm: how to make Wzrd AI a game-changer
- [x] Present vision document to user

## Sprint 1: Research Engine

### Backend — Research Engine Core
- [x] Build Google Search integration (search and return structured results)
- [x] Build Web Scraper (extract content from competitor websites)
- [x] Build Academic/Scholar Search (find relevant research papers)
- [x] Build Research Engine orchestrator (combines all search sources + LLM analysis)
- [x] Database: add research_cache table for knowledge accumulation
- [x] Database: add research_reports table for structured research output

### Server — tRPC Procedures
- [x] research.searchWeb — search Google and return structured results
- [x] research.scrapeWebsite — extract content from a URL
- [x] research.searchAcademic — search for academic papers
- [x] research.conductFull — full research workflow (company + competitors + market + academic)
- [x] research.quick — quick search for real-time use during conversations
- [x] research.getReport, list, getByClient, stats, getCachedByIndustry — retrieval procedures
- [x] aiResearch.chatWithResearch — AI chat with research context injection
- [x] Integrate Research Engine with AI Brain (formatResearchForContext feeds into system prompt)

### Frontend — Research UI
- [x] Full Research Engine page with 3 tabs: New Research, Reports, Quick Search
- [x] New Research: company form with progress animation (6 visual steps)
- [x] Reports: list view with status badges, click to view full report dialog
- [x] Quick Search: instant search with suggestions
- [x] Report dialog: summary, key insights, competitor analysis, market data, academic research, recommendations
- [x] Sidebar navigation with Brain icon + i18n (Arabic/English)
- [x] Info sidebar: what the engine does, cost ($0), knowledge accumulation

### Tests
- [x] 15 vitest tests covering all research procedures:
  - conductFull (fresh + cached), quick, searchWeb, searchAcademic, scrapeWebsite
  - getReport, getByClient, list, stats, getCachedByIndustry
  - aiResearch.chatWithResearch (with/without research context, with client context)
- [x] All 152 tests passing across 6 test files

## Suggestion 1: Auto-Research in AI Engine Diagnosis Flow
- [x] Modify AI Engine to auto-trigger research when client is selected
- [x] Show research status indicator in AI chat (researching... → research complete)
- [x] Feed research results into AI system prompt automatically (autoResearch flag)
- [x] Show "Research data loaded" badge when AI is using live research data
- [x] Knowledge Base context also injected into AI system prompt

## Suggestion 2: Knowledge Base Builder UI
- [x] Database: add knowledge_entries table (9 categories, tags, source tracking)
- [x] Server: Full CRUD procedures (create, list, getById, update, delete, stats)
- [x] Server: Import from research reports (importFromResearch)
- [x] Server: Extract from AI conversations (extractFromConversation via LLM)
- [x] Frontend: Knowledge Base page with Browse + Import tabs
- [x] Frontend: Category filtering, search, stats cards
- [x] Frontend: Create/Edit/Detail dialogs with full form
- [x] Frontend: Import from research reports with one-click
- [x] Integration: getKnowledgeForContext feeds into AI system prompt
- [x] Sidebar navigation with Database icon + i18n

## Suggestion 3 + Sprint 2: AI Agent Autonomy — Full Execution Pipeline
- [x] Database: add pipeline_runs table (5 steps, status tracking, output storage)
- [x] Server: pipeline.start — create new pipeline run
- [x] Server: pipeline.executeStep — execute one step at a time
- [x] Server: pipeline.runAll — execute all 5 steps automatically
- [x] Server: pipeline.pause / resume — control pipeline execution
- [x] Server: pipeline.list, get, getByClient — retrieval procedures
- [x] Server: 5-step pipeline: Research → Diagnosis → Strategy → Deliverables → Proposal
- [x] Server: Each step uses Research Engine + Knowledge Base + AI Brain
- [x] Server: Owner notification on pipeline completion
- [x] Frontend: Pipeline page with Launch dialog, progress visualization
- [x] Frontend: Step-by-step progress with visual indicators
- [x] Frontend: Run All / Next Step / Pause controls
- [x] Frontend: Expanded view with step details and outputs
- [x] Frontend: How-it-works explainer card
- [x] Sidebar navigation with Zap icon + i18n
- [x] Tests: 17 vitest tests for knowledge + pipeline (all passing)
- [x] All 169 tests passing across 7 test files

## Feature: Populate Knowledge Base with Primo Marca Frameworks
- [x] Read Primo Marca brand strategy manual and extract all frameworks
- [x] Read Primo Marca company profile and extract methodology
- [x] Read Primo Marca brand identity guidelines
- [x] Seed Knowledge Base with 4D Framework (Diagnose, Design, Deploy, Develop)
- [x] Seed Knowledge Base with Three Pillars framework
- [x] Seed Knowledge Base with Consultant Box methodology
- [x] Seed Knowledge Base with service-specific playbook knowledge
- [x] Seed Knowledge Base with pricing strategy knowledge
- [x] Seed Knowledge Base with market-specific insights (Egypt, KSA)
- [x] Created seed script (seedKnowledge.mjs) — 23 entries seeded successfully

## Feature: Link Pipeline to Client Portal
- [x] When pipeline completes, auto-create project + deliverables + portal token
- [x] Pipeline outputs become viewable in client portal (auto-published)
- [x] Client portal shows pipeline progress and deliverables
- [x] Add "Manage Portal" and "View Project" links on completed pipeline runs
- [x] Toast notification when portal is auto-created

## Feature: Pipeline Dashboard Analytics
- [x] Server: dashboard.pipelineAnalytics procedure (total, completed, failed, running, successRate, avgDuration, recentRuns)
- [x] DB: getPipelineAnalytics helper with aggregation
- [x] Frontend: Pipeline analytics section on Dashboard (5 stat cards + recent runs list)
- [x] Frontend: Quick Actions updated (Launch AI Pipeline, Research Engine, Knowledge Base)
- [x] Frontend: Duration formatting and status icons
- [x] Tests: 8 new tests for pipeline analytics (177 total passing across 8 files)

## Sprint 3: Brand Digital Twin

### Backend — Database Schema
- [x] Add brand_health_snapshots table (stores periodic health scores per client)
- [x] Add brand_alerts table (stores alerts/notifications about brand issues)
- [x] Add brand_metrics table (tracks individual brand metrics over time)
- [x] Run migrations and apply SQL

### Backend — Brand Health Scoring Engine
- [x] Build brand health scoring algorithm (7 dimensions: Identity, Positioning, Messaging, Visual, Digital Presence, Reputation, Market Fit)
- [x] Build AI-powered brand audit (runBrandAudit) that analyzes client + research + knowledge
- [x] Build alert generation system (4 severity levels: critical, warning, info, opportunity)
- [x] Build trend analysis (compareSnapshots function)
- [x] Integrate with Research Engine for live data

### Backend — tRPC Procedures
- [x] brandTwin.runAudit — run full brand health audit with AI + research + knowledge
- [x] brandTwin.getHistory — get health score timeline
- [x] brandTwin.getSnapshot — get a specific snapshot by id
- [x] brandTwin.getAlerts — get active alerts for a client
- [x] brandTwin.updateAlert — update alert status (resolve/dismiss)
- [x] brandTwin.getMetrics — get detailed metrics breakdown
- [x] brandTwin.compare — compare two snapshots
- [x] brandTwin.dashboard — aggregated view across all clients
- [x] brandTwin.allAlerts — get all alerts across all clients

### Frontend — Brand Digital Twin UI
- [x] Brand Twin page with 3 tabs: Overview, Client Audit, Alerts
- [x] Overview: 6 stat cards (Total Audited, Avg Health, Healthy/At Risk/Critical/Active Alerts)
- [x] Client Audit: client selector, Run Audit button, 7-dimension health scores with color bars
- [x] Alerts: all alerts across clients with severity badges and resolve button
- [x] SWOT analysis display (Strengths, Weaknesses, Opportunities, Threats)
- [x] Snapshot history timeline
- [x] Add to sidebar navigation with Heart icon
- [x] i18n translations (Arabic + English)

### Tests
- [x] 13 vitest tests for brand twin (runAudit, dashboard, history, snapshot, alerts, metrics, compare, allAlerts)
- [x] All 190 tests passing across 9 test files

## TRANSFORMATION: Growth Engine + Sales Machine + Revenue Machine

### Growth Engine — Lead Acquisition
- [ ] Public Landing Page: free Brand Health Quick-Check (no login required)
- [ ] Quick-Check collects: company name, industry, market, website, email, phone
- [ ] AI runs instant mini-diagnosis (3 questions) and shows teaser results
- [ ] Full results gated behind email capture → auto-creates lead in CRM
- [ ] Auto-follow-up: notification to owner when new lead captured
- [ ] Lead scoring: AI rates lead quality (hot/warm/cold) based on answers
- [ ] Lead dashboard: view all captured leads with scores and status

### Sales Machine — Convert Leads to Paying Clients
- [ ] Smart Proposal with real pricing from price list (auto-calculated)
- [ ] Proposal acceptance workflow: client views proposal in portal → accepts/rejects
- [ ] Digital signature: client signs proposal in portal (typed signature + timestamp)
- [ ] Auto-create project + payment schedule when proposal is accepted
- [ ] Payment tracking: installment schedule with due dates and reminders
- [ ] Proposal follow-up: auto-notify owner if proposal not responded in 48h
- [ ] Sales funnel analytics: leads → proposals → accepted → revenue

### Revenue Machine — Execute & Deliver
- [ ] Template-based deliverables: AI fills structured templates (not just text)
- [ ] PDF generation: branded deliverable PDFs with Primo Marca design
- [ ] Image generation: mood boards, logo concepts, social media mockups via built-in AI
- [ ] Client feedback loop: client comments on deliverables in portal
- [ ] Revision tracking: version history for each deliverable
- [ ] Auto-invoice generation when deliverables are approved
- [ ] Client satisfaction survey after project completion

### Tests
- [ ] Write tests for lead capture and scoring
- [ ] Write tests for proposal acceptance and digital signature
- [ ] Write tests for payment scheduling
- [ ] Write tests for PDF generation
- [ ] Write tests for client feedback loop

## Sprint 4: Growth Engine (Lead Capture System)
- [x] Create leads table in database schema
- [x] Create proposal_acceptances table in database schema
- [x] Create deliverable_feedback table in database schema
- [x] Run database migrations for all new tables
- [x] Add leads database helpers (createLead, getLeadById, listLeads, updateLead, getLeadStats, getLeadFunnelStats)
- [x] Add proposal acceptance database helpers
- [x] Add deliverable feedback database helpers
- [x] Build leads tRPC router (submitQuickCheck, list, getById, updateStatus, convertToClient, stats, funnel)
- [x] Build proposalAcceptance tRPC router (submit, getByProposal)
- [x] Build deliverableFeedback tRPC router (submit, getByDeliverable)
- [x] Create public Brand Health Quick-Check page (/quick-check) — no auth required
- [x] AI-powered lead scoring (hot/warm/cold) with LLM diagnosis
- [x] Auto-notify owner on new lead capture
- [x] Create Leads Management dashboard page
- [x] Create Sales Funnel page
- [x] Add Leads and Sales Funnel nav items to sidebar
- [x] Add English and Arabic translations for leads and sales funnel
- [x] Remove duplicate DashboardLayout wrapper from Leads and SalesFunnel pages

## Sprint 5: Sales Machine (Proposal Acceptance Workflow)
- [x] Add shareable proposal link (copy link) to ProposalDetail page
- [x] Create public ProposalView page (/proposal-view/:id) — clients view and respond
- [x] Proposal acceptance workflow (Accept/Reject/Request Revision) with digital signature
- [x] Auto-notify owner on proposal response
- [x] Register proposal-view as public route in App.tsx

## Sprint 6: Revenue Machine (Client Feedback + Dashboard Metrics)
- [x] Add client feedback functionality to ClientPortal (star rating + comments)
- [x] Wire deliverableFeedback.submit to ClientPortal UI
- [x] Add Growth Engine metrics strip to Home dashboard (leads stats + mini funnel)
- [x] Add Copy Quick-Check Link button to dashboard Quick Actions
- [x] Fix portal viewProject to include deliverable id and client id for feedback

## Growth Engine Testing
- [x] Write leads.test.ts — 9 tests (submitQuickCheck, list, stats, funnel, validation)
- [x] Write growthEngine.test.ts — 13 tests (proposalAcceptance, deliverableFeedback, leads integration)
- [x] All 212 tests passing across 11 test files

## Execution Engine Upgrade — From 5.5/10 to 9/10

### Template Engine (Real PDF Deliverables)
- [x] Build branded PDF template system for each service type
- [x] Brand Guidelines PDF template (logo usage, colors, typography, do/dont)
- [x] Strategy Deck template (executive summary, analysis, recommendations)
- [x] Social Media Calendar template (monthly calendar, content pillars, post types)
- [x] Business Audit Report template (health score, findings, action plan)
- [x] Wire PDF generation to deliverables — each deliverable becomes a downloadable file

### Image Generation Integration
- [x] Integrate built-in image generation API for mood boards
- [x] Generate logo concepts from brand positioning data
- [x] Generate social media post templates with brand colors/fonts
- [x] Wire image generation into pipeline steps

### Structured Deliverables (Downloadable Files)
- [x] Each deliverable gets a generated PDF/file stored in S3
- [x] Download button on deliverable cards (dashboard + portal)
- [x] Deliverable preview with actual formatted content

### Client Feedback Loop (Portal Enhancement)
- [x] Client can comment on specific deliverables in portal
- [x] Client can request revisions with specific notes
- [x] Client can approve deliverables (status changes to approved)
- [ ] Revision history visible to both client and team (future enhancement)
- [x] Notification to owner on every client action

### Quality Gates
- [x] Quality checklist per deliverable type (auto-generated)
- [x] Review status: draft → internal review → quality check → client ready
- [x] Quality score based on checklist completion
- [x] Block delivery to client until quality gate passes

### Tests
- [x] Write executionEngine.test.ts — 19 tests (PDF generation, quality checklists, branding, content parsing)
- [x] All 231 tests passing across 12 test files

## Case Study Library Upgrade (AI Brain Enhancement)
- [x] Research & write Global Icon case studies (Nike, Apple, Airbnb, Starbucks, Patagonia, Dollar Shave Club, Oatly)
- [x] Research & write Regional Champion case studies (Careem, Noon, Talabat, Jahez, Anghami, Kitopi, Huda Beauty)
- [x] Enhance existing Primo Marca case studies with real numbers and deeper analysis
- [x] Build case study library module (caseStudyLibrary.ts — 562 lines, 17 cases)
- [x] Wire case studies into AI prompts (buildSystemPrompt with dynamic matching)
- [x] Add pattern recognition system (matchCaseStudies with scoring algorithm)
- [x] Write tests for case study integration (24 tests in caseStudyLibrary.test.ts)
- [x] Checkpoint and deliver — 255 total tests passing across 13 test files

## Market Intelligence Database (AI Brain Enhancement)
- [x] Research Egypt advertising & digital market data (market size, digital penetration, social media stats)
- [x] Research KSA market data (Vision 2030 impact, entertainment sector, e-commerce growth)
- [x] Research UAE market data (digital economy, advertising spend, consumer behavior)
- [x] Research industry benchmarks (CAC by industry, conversion rates, retention rates, LTV)
- [x] Research agency pricing benchmarks in MENA (what agencies charge, client expectations)
- [x] Research competitive intelligence (top agencies in Egypt, KSA, UAE — with MENA consumer behavior & digital trends)
- [x] Build marketIntelligence.ts module with structured data (560+ lines, 8 research topics)
- [x] Wire market data into AI Brain (buildSystemPrompt with smart context-based injection)
- [x] Write tests for market intelligence module (47 tests in marketIntelligence.test.ts)
- [x] Checkpoint and deliver — 302 total tests passing across 14 test files

## Academic Deep Dive + Real-World Examples (AI Brain Enhancement)
- [x] Research Kapferer's Brand Identity Prism with real-world examples (luxury brands, MENA brands)
- [x] Research Sharp's "How Brands Grow" — mental/physical availability with examples (Coca-Cola, Noon, Talabat)
- [x] Research Kahneman's behavioral economics for pricing/branding (anchoring, loss aversion, framing)
- [x] Research Cialdini's Influence principles with branding examples (social proof, scarcity, authority)
- [x] Research Porter's Five Forces with MENA agency/branding examples
- [x] Research Blue Ocean Strategy with real repositioning examples
- [x] Research Ehrenberg-Bass Institute findings on brand growth
- [x] Research Premium Pricing Psychology with real examples (Starbucks, Apple, MENA luxury)
- [x] Research Brand Repositioning examples (Egypt mass-to-premium, KSA Vision 2030 opportunities)
- [x] Research Customer Journey Mapping frameworks with real implementations
- [x] Build academicFrameworks.ts module (1,250 lines, 10 frameworks, 45+ real-world examples)
- [x] Wire into AI Brain (buildSystemPrompt) with context-aware framework matching
- [x] Write tests for academic frameworks module (37 tests in academicFrameworks.test.ts)
- [x] Checkpoint and deliver — 339 total tests passing across 15 test files

## AI Conversation Flow Enhancement (Academic Frameworks Integration)
- [x] Enhance AI Engine chat to inject relevant frameworks with real-world examples dynamically
- [x] When AI discusses pricing → inject Starbucks 5x example, Apple premium strategy, Egypt repositioning examples
- [x] When AI discusses brand identity → inject Kapferer Prism with luxury brand examples
- [x] When AI discusses growth → inject Sharp's mental/physical availability with Coca-Cola, Noon examples
- [x] When AI discusses competitive analysis → inject Porter's Five Forces with MENA agency examples
- [x] Add "Framework Used" indicator in AI responses so user sees which academic backing is being used
- [x] Ensure AI cites specific numbers and brand names in every strategic recommendation

## AI Template Engine (Structured Document Generation)
- [x] Build template engine that generates structured Brand Guidelines documents
- [x] Build template engine for Strategy Deck generation (executive summary, analysis, recommendations)
- [x] Build template engine for Social Media Calendar (monthly calendar, content pillars, post schedule)
- [x] Each template auto-populated with client-specific data from project context
- [x] Templates generate downloadable structured content (not just paragraphs)
- [x] Add "Generate Document" button in Deliverables page for each template type

## Image Generation Feature (Visual Assets from AI Analysis)
- [x] Build mood board generation from brand positioning data (colors, textures, style references)
- [x] Build logo concept generation from brand identity analysis
- [x] Build social media post template generation with brand colors/fonts
- [x] Add image generation UI in Deliverables page with preview and download
- [x] Wire image generation into pipeline auto-execution
- [x] Store generated images in S3 with deliverable association

### All Tests
- [x] 369 total tests passing across 16 test files

## AI Conversation Flow Enhancement + Use Cases + Templates + Image Gen
### 1. Use Cases Strengthening
- [x] Add real-world examples engine that injects specific brand stories with numbers into every AI response
- [x] When discussing pricing → "Starbucks charges 5x because...", "Apple premium strategy increased margins by..."
- [x] When discussing brand identity → Kapferer Prism examples with luxury brands, MENA brands
- [x] When discussing growth → Sharp's examples with Coca-Cola, Noon, Talabat
- [x] When discussing repositioning → "In Egypt, brand X repositioned from mass to premium and increased margins by 40%"
- [x] When discussing KSA → "Vision 2030 created opportunity for brand Y in entertainment sector"

### 2. Academic Frameworks in AI Conversation Flow
- [x] Enhance AI Engine to dynamically select and inject relevant frameworks based on conversation topic
- [x] Add "Framework Used" indicator in AI responses
- [x] Ensure AI cites specific numbers and brand names in every strategic recommendation
- [x] Build conversation context analyzer that detects topic and injects matching frameworks

### 3. AI Template Engine (Structured Document Generation)
- [x] Build Brand Guidelines template (logo usage, colors, typography, do/dont sections)
- [x] Build Strategy Deck template (executive summary, analysis, recommendations, action plan)
- [x] Build Social Media Calendar template (monthly calendar, content pillars, post schedule)
- [x] Each template auto-populated with client-specific data from project context
- [x] Add "Generate Document" UI in Deliverables page for each template type
- [x] Templates generate structured downloadable content

### 4. Image Generation Feature
- [x] Build mood board generation from brand positioning data
- [x] Build logo concept generation from brand identity analysis
- [x] Build social media post template generation with brand colors/fonts
- [x] Add image generation UI in Deliverables page with preview and download
- [x] Wire image generation into pipeline auto-execution
- [x] Store generated images in S3 with deliverable association

## Academic Depth → 10/10 (Deep Dive)
### Keller's CBBE Deep Dive
- [x] Add 6 building blocks in detail: Salience, Performance, Imagery, Judgments, Feelings, Resonance
- [x] Brand Resonance Model — full pyramid with examples for each level
- [x] Each building block with MENA brand examples and real metrics

### Sharp vs Keller Debate
- [x] Sharp's "How Brands Grow" critique of Keller — mental/physical availability vs brand equity
- [x] When to use Keller (premium/luxury) vs Sharp (FMCG/mass market) — practical guide
- [x] Real-world examples of brands that succeeded with each approach

### Kapferer Deep Dive
- [x] Brand Identity Prism — all 6 facets with detailed examples
- [x] Luxury brand strategy framework with MENA luxury market examples
- [x] Brand extension strategy with success/failure examples

### Ehrenberg-Bass Deep Dive
- [x] Double Jeopardy Law with real brand data
- [x] Duplication of Purchase Law — practical implications
- [x] How Brands Grow principles applied to MENA markets

### Behavioral Economics Deep Dive
- [x] Kahneman — System 1/System 2 applied to brand perception
- [x] Thaler — Nudge theory applied to pricing and brand choice
- [x] Anchoring, loss aversion, framing effects with real pricing examples
- [x] Choice architecture for brand positioning

### Integration
- [x] Wire deep academic content into AI Brain
- [x] Write tests for deep academic content
- [x] Checkpoint and deliver

## Client Portal Enhancement
- [x] Add revision history to deliverables (track all changes with timestamps)
- [x] Add threaded comments system (client + team can discuss specific deliverables)
- [x] Add comment notifications to owner
- [x] Update Client Portal UI with revision history timeline and comment threads
- [x] Write tests for revision history and comments
- [x] Checkpoint and deliver — 386 total tests passing across 17 test files

## Competitive Intelligence → 10/10

### Egyptian Market Agencies & Consultancies
- [x] Research top branding/marketing agencies in Egypt (names, specialties, size, notable clients)
- [x] Research Egyptian agency pricing benchmarks by service type
- [x] Research Egyptian client expectations by market segment (SME, mid-market, enterprise)
- [x] Research Egyptian market challenges and opportunities for agencies

### KSA Market Agencies & Consultancies
- [x] Research top branding/marketing agencies in KSA (names, specialties, size, notable clients)
- [x] Research KSA agency pricing benchmarks by service type (Vision 2030 premium)
- [x] Research KSA client expectations by market segment
- [x] Research KSA market challenges and opportunities (Saudization, Vision 2030)

### Regional/MENA Competitive Landscape
- [x] Research regional agency networks and international players in MENA
- [x] Research pricing comparison across Egypt, KSA, UAE, and international benchmarks
- [x] Research client retention rates and satisfaction benchmarks
- [x] Research agency differentiation strategies and positioning

### Primo Marca Competitive Positioning
- [x] Map Primo Marca's unique positioning vs competitors (4D Framework, Consultant Box, Three Pillars)
- [x] Build competitive advantage matrix (where Primo Marca wins vs loses)
- [x] Build pricing strategy recommendations based on competitive data
- [x] Build client segment targeting recommendations

### Integration
- [x] Build competitiveIntelligence.ts module with all structured data (1207 lines)
- [x] Wire competitive intelligence into AI Brain (buildSystemPrompt)
- [x] Write tests for competitive intelligence module
- [x] Checkpoint and deliver

## Client Portal Enhancement v2

### Email Notifications
- [x] Build email notification system for new revisions (via notifyOwner)
- [x] Build email notification system for comment replies (via notifyOwner)
- [x] Integrate with notifyOwner for owner alerts on client actions

### Diff Viewer
- [x] Build side-by-side diff viewer component for version comparison
- [x] Add diff view to Client Portal revision history
- [x] Highlight additions, deletions, and modifications (color-coded: red/green/amber)

### Approval Workflow
- [x] Add approve/request changes actions to Client Portal
- [x] Build approval status tracking in database (deliverable_approvals table)
- [x] Build request changes form with reason field
- [x] Add approval status badges to deliverable cards
- [x] Write tests for email notifications, diff viewer, and approval workflow (22 tests)
- [x] Checkpoint and deliver — 408 total tests passing across 18 test files
