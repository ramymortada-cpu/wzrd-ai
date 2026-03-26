import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Credits system
  credits: int("credits").notNull().default(0),
  company: varchar("company", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  market: varchar("market", { length: 50 }),
  newsletterOptIn: int("newsletterOptIn").notNull().default(0),
  signupSource: varchar("signupSource", { length: 50 }).default("website"),
  referralCode: varchar("referralCode", { length: 20 }),
  referredBy: int("referredBy"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Credit transactions — tracks every credit add/deduct
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  balance: int("balance").notNull().default(0),
  type: mysqlEnum("type", [
    "signup_bonus",
    "purchase",
    "tool_usage",
    "refund",
    "admin",
    "referral_bonus",
    "copilot_refund",
  ]).notNull(),
  toolName: varchar("toolName", { length: 100 }),
  reason: varchar("reason", { length: 500 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * Clients table - stores all client information
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  market: mysqlEnum("market", ["ksa", "egypt", "uae", "other"]).default("ksa").notNull(),
  industry: varchar("industry", { length: 255 }),
  website: varchar("website", { length: 500 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["lead", "active", "completed", "paused"]).default("lead").notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Projects table - tracks each service engagement with a client
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  serviceType: mysqlEnum("serviceType", [
    "business_health_check",
    "starting_business_logic",
    "brand_identity",
    "business_takeoff",
    "consultation"
  ]).notNull(),
  stage: mysqlEnum("stage", ["diagnose", "design", "deploy", "optimize", "completed"]).default("diagnose").notNull(),
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  description: text("description"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Deliverables table - tracks individual deliverables within a project
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  stage: mysqlEnum("stage", ["diagnose", "design", "deploy", "optimize"]).default("diagnose").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "ai_generated", "review", "approved", "delivered"]).default("pending").notNull(),
  content: text("content"),
  aiGenerated: int("aiGenerated").default(0),
  sortOrder: int("sortOrder").default(0),
  // Execution Engine fields
  fileUrl: text("fileUrl"),           // S3 URL of generated PDF/file
  fileKey: text("fileKey"),           // S3 key for the file
  fileType: varchar("fileType", { length: 50 }), // pdf, image, etc.
  qualityScore: int("qualityScore"),  // 0-100 quality gate score
  qualityChecklist: json("qualityChecklist"), // JSON checklist items
  reviewNotes: text("reviewNotes"),   // Internal review notes
  imageUrls: json("imageUrls"),       // Array of generated image URLs
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

/**
 * Client notes table - stores diagnostic findings, strategic decisions, project context
 */
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["diagnostic", "strategic", "meeting", "insight", "general"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

/**
 * Payments table - tracks financial transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientId: int("clientId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * AI Conversations table - stores AI chat history per project/context
 */
export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  clientId: int("clientId"),
  context: mysqlEnum("context", [
    "business_health_check",
    "starting_business_logic",
    "brand_identity",
    "business_takeoff",
    "consultation",
    "general"
  ]).default("general").notNull(),
  messages: json("messages").notNull(),
  title: varchar("title", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

/**
 * Proposals table - stores generated client proposals
 */
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  serviceType: mysqlEnum("serviceType", [
    "business_health_check",
    "starting_business_logic",
    "brand_identity",
    "business_takeoff",
    "consultation"
  ]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  language: mysqlEnum("language", ["en", "ar"]).default("en").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected"]).default("draft").notNull(),
  // Proposal content sections (JSON)
  executiveSummary: text("executiveSummary"),
  clientBackground: text("clientBackground"),
  serviceDescription: text("serviceDescription"),
  methodology: text("methodology"),
  deliverables: text("deliverables"),
  timeline: text("timeline"),
  investment: text("investment"),
  whyPrimoMarca: text("whyPrimoMarca"),
  terms: text("terms"),
  customNotes: text("customNotes"),
  // Pricing
  price: decimal("price", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  // PDF URL (stored in S3)
  pdfUrl: text("pdfUrl"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

/**
 * Onboarding sessions table - tracks wizard progress for new client onboarding
 */
export const onboardingSessions = mysqlTable("onboarding_sessions", {
  id: int("id").autoincrement().primaryKey(),
  step: mysqlEnum("step", ["company_info", "needs_assessment", "service_recommendation", "proposal_review", "contract"]).default("company_info").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  market: mysqlEnum("market", ["ksa", "egypt", "uae", "other"]),
  industry: varchar("industry", { length: 255 }),
  website: varchar("website", { length: 500 }),
  assessmentAnswers: json("assessmentAnswers"),
  recommendedService: varchar("recommendedService", { length: 100 }),
  recommendationReason: text("recommendationReason"),
  clientId: int("clientId"),
  proposalId: int("proposalId"),
  projectId: int("projectId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type InsertOnboardingSession = typeof onboardingSessions.$inferInsert;

/**
 * Client portal tokens - secure access links for clients to view project status
 */
export const clientPortalTokens = mysqlTable("client_portal_tokens", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientId: int("clientId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  isActive: int("isActive").default(1).notNull(),
  expiresAt: timestamp("expiresAt"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});  

export type ClientPortalToken = typeof clientPortalTokens.$inferSelect;
export type InsertClientPortalToken = typeof clientPortalTokens.$inferInsert;

/**
 * Research cache - stores research results for knowledge accumulation.
 * Every research query and its results are cached here so future
 * lookups for the same industry/market are faster and richer.
 */
export const researchCache = mysqlTable("research_cache", {
  id: int("id").autoincrement().primaryKey(),
  // Search key for cache lookup
  cacheKey: varchar("cacheKey", { length: 500 }).notNull(),
  queryType: mysqlEnum("queryType", ["company", "competitor", "market", "academic", "quick"]).default("quick").notNull(),
  // Context
  industry: varchar("industry", { length: 255 }),
  market: varchar("market", { length: 100 }),
  companyName: varchar("companyName", { length: 255 }),
  // Results stored as JSON
  results: json("results").notNull(),
  // Metadata
  sourcesCount: int("sourcesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type ResearchCache = typeof researchCache.$inferSelect;
export type InsertResearchCache = typeof researchCache.$inferInsert;

/**
 * Research reports - full research reports generated for clients.
 * These are the comprehensive reports that feed into the AI Brain.
 */
export const researchReports = mysqlTable("research_reports", {
  id: int("id").autoincrement().primaryKey(),
  // Linked to client/project
  clientId: int("clientId"),
  projectId: int("projectId"),
  // Research parameters
  companyName: varchar("companyName", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }).notNull(),
  market: varchar("market", { length: 100 }).notNull(),
  // Full report data (JSON)
  reportData: json("reportData").notNull(),
  // AI-synthesized summary
  summary: text("summary"),
  keyInsights: json("keyInsights"),
  recommendations: json("recommendations"),
  // Stats
  totalSources: int("totalSources").default(0),
  searchQueries: json("searchQueries"),
  // Status
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchReport = typeof researchReports.$inferSelect;
export type InsertResearchReport = typeof researchReports.$inferInsert;

/**
 * Knowledge entries — manual knowledge items added by the consultant.
 * These feed into the AI Brain alongside auto-research data.
 */
export const knowledgeEntries = mysqlTable("knowledge_entries", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", [
    "case_study", "framework", "lesson_learned",
    "market_insight", "competitor_intel", "client_pattern",
    "methodology", "template", "general"
  ]).default("general").notNull(),
  // Optional linking
  industry: varchar("industry", { length: 255 }),
  market: varchar("market", { length: 100 }),
  clientId: int("clientId"),
  projectId: int("projectId"),
  // Source tracking
  source: mysqlEnum("source", ["manual", "research_import", "ai_generated", "conversation_extract"]).default("manual").notNull(),
  sourceId: int("sourceId"),
  // Tags as JSON array
  tags: json("tags"),
  // Status
  isActive: int("isActive").default(1).notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeEntries.$inferInsert;

/**
 * Pipeline runs — tracks autonomous execution pipelines.
 * Each run goes through: research → diagnose → strategize → generate → deliver
 */
export const pipelineRuns = mysqlTable("pipeline_runs", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId"),
  // Pipeline config
  serviceType: mysqlEnum("serviceType", [
    "business_health_check", "starting_business_logic",
    "brand_identity", "business_takeoff", "consultation"
  ]).notNull(),
  // Overall status
  status: mysqlEnum("status", [
    "pending", "researching", "diagnosing", "strategizing",
    "generating", "reviewing", "completed", "failed", "paused"
  ]).default("pending").notNull(),
  currentStep: int("currentStep").default(0),
  totalSteps: int("totalSteps").default(5),
  // Step outputs stored as JSON
  researchOutput: json("researchOutput"),
  diagnosisOutput: text("diagnosisOutput"),
  strategyOutput: text("strategyOutput"),
  deliverablesOutput: json("deliverablesOutput"),
  proposalOutput: json("proposalOutput"),
  // Metadata
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  // Approval tracking
  autoApprove: int("autoApprove").default(0),
  approvedSteps: json("approvedSteps"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type InsertPipelineRun = typeof pipelineRuns.$inferInsert;

/**
 * Brand Health Snapshots — periodic brand health assessments.
 * Each snapshot captures the brand health score across 7 dimensions
 * at a point in time, enabling trend analysis.
 */
export const brandHealthSnapshots = mysqlTable("brand_health_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  // Overall score (0-100)
  overallScore: int("overallScore").notNull(),
  // 7 dimension scores (0-100 each)
  identityScore: int("identityScore").default(0),
  positioningScore: int("positioningScore").default(0),
  messagingScore: int("messagingScore").default(0),
  visualScore: int("visualScore").default(0),
  digitalPresenceScore: int("digitalPresenceScore").default(0),
  reputationScore: int("reputationScore").default(0),
  marketFitScore: int("marketFitScore").default(0),
  // Detailed analysis per dimension (JSON)
  dimensionDetails: json("dimensionDetails"),
  // AI-generated summary
  summary: text("summary"),
  strengths: json("strengths"),
  weaknesses: json("weaknesses"),
  opportunities: json("opportunities"),
  threats: json("threats"),
  // Source of audit
  auditType: mysqlEnum("auditType", ["manual", "ai_auto", "pipeline"]).default("ai_auto").notNull(),
  // Linked research
  researchReportId: int("researchReportId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandHealthSnapshot = typeof brandHealthSnapshots.$inferSelect;
export type InsertBrandHealthSnapshot = typeof brandHealthSnapshots.$inferInsert;

/**
 * Brand Alerts — notifications about brand health changes,
 * issues detected, or opportunities identified.
 */
export const brandAlerts = mysqlTable("brand_alerts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  snapshotId: int("snapshotId"),
  // Alert classification
  severity: mysqlEnum("severity", ["critical", "warning", "info", "opportunity"]).default("info").notNull(),
  dimension: mysqlEnum("dimension", [
    "identity", "positioning", "messaging", "visual",
    "digital_presence", "reputation", "market_fit", "overall"
  ]).default("overall").notNull(),
  // Content
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation"),
  // Status
  status: mysqlEnum("status", ["active", "acknowledged", "resolved", "dismissed"]).default("active").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandAlert = typeof brandAlerts.$inferSelect;
export type InsertBrandAlert = typeof brandAlerts.$inferInsert;

/**
 * Brand Metrics — granular metric tracking over time.
 * Each metric is a specific measurable aspect of brand health.
 */
export const brandMetrics = mysqlTable("brand_metrics", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  snapshotId: int("snapshotId"),
  // Metric identity
  dimension: mysqlEnum("dimension", [
    "identity", "positioning", "messaging", "visual",
    "digital_presence", "reputation", "market_fit"
  ]).notNull(),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  // Value
  score: int("score").default(0),
  maxScore: int("maxScore").default(100),
  // Context
  details: text("details"),
  dataSource: varchar("dataSource", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandMetric = typeof brandMetrics.$inferSelect;
export type InsertBrandMetric = typeof brandMetrics.$inferInsert;

/**
 * Leads table — captures potential clients from the public Brand Health Quick-Check.
 * This is the top of the sales funnel: visitors take a free quick-check,
 * provide their contact info, and become scored leads.
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  // Contact info (collected during quick-check)
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  industry: varchar("industry", { length: 255 }),
  market: mysqlEnum("market", ["ksa", "egypt", "uae", "other"]).default("egypt").notNull(),
  website: varchar("website", { length: 500 }),
  // Quick-check answers (JSON array of Q&A)
  quickCheckAnswers: json("quickCheckAnswers"),
  // AI-generated mini-diagnosis
  diagnosisTeaser: text("diagnosisTeaser"),
  fullDiagnosis: text("fullDiagnosis"),
  // AI scoring
  score: int("score").default(0), // 0-100
  scoreLabel: mysqlEnum("scoreLabel", ["hot", "warm", "cold"]).default("cold").notNull(),
  scoringReason: text("scoringReason"),
  // Recommended service based on answers
  recommendedService: varchar("recommendedService", { length: 100 }),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  // Funnel tracking
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal_sent", "converted", "lost"]).default("new").notNull(),
  source: mysqlEnum("source", ["quick_check", "referral", "manual", "website"]).default("quick_check").notNull(),
  // Conversion tracking
  clientId: int("clientId"), // linked when converted
  proposalId: int("proposalId"), // linked when proposal sent
  // Notes
  notes: text("notes"),
  // Timestamps
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Proposal acceptances — tracks when a client accepts/rejects a proposal
 * through the client portal, including digital signature.
 */
export const proposalAcceptances = mysqlTable("proposal_acceptances", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  clientId: int("clientId").notNull(),
  // Decision
  decision: mysqlEnum("decision", ["accepted", "rejected", "revision_requested"]).notNull(),
  // Digital signature (typed name + timestamp = legally binding in Egypt/KSA)
  signatureName: varchar("signatureName", { length: 255 }),
  signatureTitle: varchar("signatureTitle", { length: 255 }),
  signatureIp: varchar("signatureIp", { length: 100 }),
  // Feedback
  feedback: text("feedback"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProposalAcceptance = typeof proposalAcceptances.$inferSelect;
export type InsertProposalAcceptance = typeof proposalAcceptances.$inferInsert;

/**
 * Deliverable feedback — client comments on deliverables through the portal.
 * Enables revision tracking and approval workflow.
 */
export const deliverableFeedback = mysqlTable("deliverable_feedback", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  clientId: int("clientId"),
  // Feedback
  comment: text("comment").notNull(),
  rating: int("rating"), // 1-5 stars
  status: mysqlEnum("status", ["pending", "addressed", "resolved"]).default("pending").notNull(),
  // Version tracking
  version: int("version").default(1),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliverableFeedback = typeof deliverableFeedback.$inferSelect;
export type InsertDeliverableFeedback = typeof deliverableFeedback.$inferInsert;

/**
 * Deliverable revisions — tracks every version of a deliverable's content.
 * When content is updated, the previous version is saved here so clients
 * can see the full revision history and compare changes.
 */
export const deliverableRevisions = mysqlTable("deliverable_revisions", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  // Version info
  version: int("version").notNull(),
  // Snapshot of the content at this version
  content: text("content"),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  // What changed
  changeType: mysqlEnum("changeType", ["initial", "ai_regenerated", "manual_edit", "client_revision", "quality_update"]).default("initial").notNull(),
  changeSummary: text("changeSummary"),
  // Who made the change
  changedBy: varchar("changedBy", { length: 255 }), // "system", "ai", user name, or client name
  // Quality snapshot at this version
  qualityScore: int("qualityScore"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliverableRevision = typeof deliverableRevisions.$inferSelect;
export type InsertDeliverableRevision = typeof deliverableRevisions.$inferInsert;

/**
 * Deliverable comments — threaded comments on deliverables.
 * Supports both internal team comments and client-facing comments.
 * Threaded via parentId for nested conversations.
 */
export const deliverableComments = mysqlTable("deliverable_comments", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  // Threading
  parentId: int("parentId"), // null = top-level comment, otherwise reply to parent
  // Author
  authorType: mysqlEnum("authorType", ["owner", "team", "client", "ai"]).default("owner").notNull(),
  authorName: varchar("authorName", { length: 255 }).notNull(),
  // Content
  comment: text("comment").notNull(),
  // Context — which version this comment relates to
  version: int("version"),
  // Status
  isResolved: int("isResolved").default(0).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliverableComment = typeof deliverableComments.$inferSelect;
export type InsertDeliverableComment = typeof deliverableComments.$inferInsert;

/**
 * Deliverable approvals — tracks client approval/rejection decisions.
 * Clients can approve deliverables or request changes with reasons.
 */
export const deliverableApprovals = mysqlTable("deliverable_approvals", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  // Decision
  decision: mysqlEnum("decision", ["approved", "changes_requested"]).notNull(),
  // Reason (required for changes_requested, optional for approved)
  reason: text("reason"),
  // Who made the decision
  clientName: varchar("clientName", { length: 255 }).notNull(),
  // Which version was reviewed
  version: int("version"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliverableApproval = typeof deliverableApprovals.$inferSelect;
export type InsertDeliverableApproval = typeof deliverableApprovals.$inferInsert;

/**
 * Audit Log — tracks all changes to sensitive entities.
 * Every create, update, delete is recorded for compliance and debugging.
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "restore"]).notNull(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Notifications — in-app notification system.
 * Tracks notifications for portal events, approvals, comments, etc.
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "deliverable_approved", "deliverable_changes_requested",
    "comment_added", "revision_created", "proposal_accepted",
    "proposal_rejected", "lead_submitted", "portal_viewed",
    "pipeline_completed", "pipeline_failed", "general"
  ]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  // Linked entities
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  // Target
  userId: int("userId"),
  // Status
  isRead: int("isRead").default(0).notNull(),
  readAt: timestamp("readAt"),
  // Delivery
  emailSent: int("emailSent").default(0),
  emailSentAt: timestamp("emailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ════════════════════════════════════════════
// Sprint 1 Tables (Migration 0013)
// ════════════════════════════════════════════

export const qualityScores = mysqlTable("quality_scores", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  ruleScore: int("ruleScore").default(0),
  aiScore: int("aiScore"),
  finalScore: int("finalScore").default(0),
  passed: int("passed").default(0),
  issues: json("issues"),
  aiReview: json("aiReview"),
  rejectedReason: varchar("rejectedReason", { length: 500 }),
  reviewedByOwner: int("reviewedByOwner").default(0),
  ownerScore: int("ownerScore"),
  ownerNotes: text("ownerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const clientFeedbackTable = mysqlTable("client_feedback", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  projectId: int("projectId"),
  clientName: varchar("clientName", { length: 255 }),
  rating: int("rating").notNull(),
  positiveNotes: text("positiveNotes"),
  negativeNotes: text("negativeNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const llmCacheTable = mysqlTable("llm_cache", {
  id: int("id").autoincrement().primaryKey(),
  promptHash: varchar("promptHash", { length: 64 }).notNull(),
  systemHash: varchar("systemHash", { length: 64 }).notNull(),
  model: varchar("model", { length: 100 }).default("gemini-2.5-flash"),
  response: text("response").notNull(),
  tokensUsed: int("tokensUsed").default(0),
  cacheHits: int("cacheHits").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const llmUsageLog = mysqlTable("llm_usage_log", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 50 }).default("primary"),
  model: varchar("model", { length: 100 }).notNull(),
  promptTokens: int("promptTokens").default(0),
  completionTokens: int("completionTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  responseTimeMs: int("responseTimeMs").default(0),
  cached: int("cached").default(0),
  error: varchar("error", { length: 500 }),
  context: varchar("context", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QualityScore = typeof qualityScores.$inferSelect;
export type InsertQualityScore = typeof qualityScores.$inferInsert;
export type ClientFeedbackRow = typeof clientFeedbackTable.$inferSelect;
export type InsertClientFeedback = typeof clientFeedbackTable.$inferInsert;

// ════════════════════════════════════════════
// SITE CONFIG — persists CMS/settings/prompts
// ════════════════════════════════════════════
export const siteConfigTable = mysqlTable("site_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ════════════════════════════════════════════
// PROMO CODES — discounts on credit purchases
// ════════════════════════════════════════════
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(), // percent 1–100, or fixed EGP amount
  minAmountEGP: int("minAmountEGP").default(0), // minimum purchase to apply
  maxUses: int("maxUses"), // null = unlimited
  usedCount: int("usedCount").default(0).notNull(),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ════════════════════════════════════════════
// EMAIL AUTOMATION SYSTEM
// ════════════════════════════════════════════

/** Email templates — reusable HTML templates */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  subjectAr: varchar("subjectAr", { length: 255 }),
  html: text("html").notNull(),
  type: mysqlEnum("type", ["welcome", "tool_result", "follow_up", "re_engagement", "newsletter", "promo", "custom"]).notNull(),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Automation rules — trigger-based email flows */
export const automationRules = mysqlTable("automation_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  trigger: mysqlEnum("trigger", [
    "signup",
    "first_tool_run",
    "low_score",
    "credits_low",
    "inactive_3d",
    "inactive_7d",
    "inactive_30d",
    "premium_purchase",
    "manual",
  ]).notNull(),
  templateId: int("templateId"),
  delayMinutes: int("delayMinutes").notNull().default(0),
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Email send log — tracks every email sent */
export const emailSendLog = mysqlTable("email_send_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  templateId: int("templateId"),
  automationRuleId: int("automationRuleId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "failed", "bounced"]).notNull().default("queued"),
  trigger: varchar("trigger", { length: 50 }),
  errorMessage: varchar("errorMessage", { length: 500 }),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Diagnosis history — tracks all diagnosis results for Brand Health Tracker */
export const diagnosisHistory = mysqlTable("diagnosis_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  toolId: varchar("tool_id", { length: 50 }).notNull(),
  score: int("score").notNull(),
  pillarScores: json("pillar_scores"),
  findings: json("findings"),
  actionItems: json("action_items"),
  recommendation: text("recommendation"),
  schemaVersion: int("schema_version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** User checklists — action items from each diagnosis */
export const userChecklists = mysqlTable("user_checklists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  diagnosisId: int("diagnosis_id").notNull(),
  items: json("items").notNull(),
  completedCount: int("completed_count").notNull().default(0),
  totalCount: int("total_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Referrals — track user invitations */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrer_id").notNull(),
  referredUserId: int("referred_user_id").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  creditsAwarded: int("credits_awarded").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Copilot messages — AI Brand Copilot chat history */
export const copilotMessages = mysqlTable("copilot_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sessionId: varchar("session_id", { length: 50 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  tokensUsed: int("tokens_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Abandoned carts — track premium purchase attempts that didn't complete */
export const abandonedCarts = mysqlTable("abandoned_carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(),
  amountEgp: int("amount_egp").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  completed: int("completed").notNull().default(0),
  followUpSent: int("follow_up_sent").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Service requests — client project tracking (like shipping status) */
export const serviceRequests = mysqlTable("service_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  requestNumber: varchar("request_number", { length: 20 }).notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  serviceTypeAr: varchar("service_type_ar", { length: 100 }).notNull(),
  status: mysqlEnum("status", [
    "received", "reviewing", "info_needed", "meeting_scheduled",
    "in_progress", "internal_review", "revision",
    "ready_for_delivery", "delivered", "completed"
  ]).notNull().default("received"),
  priority: mysqlEnum("priority", ["normal", "urgent"]).notNull().default("normal"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  sourceDiagnosisId: int("source_diagnosis_id"),
  assignedTo: varchar("assigned_to", { length: 100 }),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  totalPriceEgp: int("total_price_egp"),
  paid: int("paid").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Request updates — timeline entries for each service request */
export const requestUpdates = mysqlTable("request_updates", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  detail: text("detail"),
  detailAr: text("detail_ar"),
  updateType: mysqlEnum("update_type", ["status_change", "info_request", "file_upload", "meeting", "note", "delivery"]).notNull().default("status_change"),
  fileUrl: varchar("file_url", { length: 500 }),
  fileName: varchar("file_name", { length: 255 }),
  meetingLink: varchar("meeting_link", { length: 500 }),
  meetingDate: timestamp("meeting_date"),
  isClientVisible: int("is_client_visible").notNull().default(1),
  createdBy: varchar("created_by", { length: 100 }).default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Request files — deliverables + client uploads */
export const requestFiles = mysqlTable("request_files", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("request_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSizeKb: int("file_size_kb"),
  uploadedBy: mysqlEnum("uploaded_by", ["client", "team"]).notNull().default("team"),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
