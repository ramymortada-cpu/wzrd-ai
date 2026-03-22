import { relations } from "drizzle-orm";
import {
  users, clients, projects, deliverables, clientNotes, payments,
  aiConversations, proposals, onboardingSessions, clientPortalTokens,
  researchCache, researchReports, knowledgeEntries, pipelineRuns,
  brandHealthSnapshots, brandAlerts, brandMetrics, leads,
  proposalAcceptances, deliverableFeedback, deliverableRevisions,
  deliverableComments, deliverableApprovals, auditLog, notifications,
} from "./schema";

// ============ CLIENTS ============
export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  notes: many(clientNotes),
  payments: many(payments),
  conversations: many(aiConversations),
  proposals: many(proposals),
  portalTokens: many(clientPortalTokens),
  researchReports: many(researchReports),
  knowledgeEntries: many(knowledgeEntries),
  pipelineRuns: many(pipelineRuns),
  brandHealthSnapshots: many(brandHealthSnapshots),
  brandAlerts: many(brandAlerts),
  brandMetrics: many(brandMetrics),
  leads: many(leads),
}));

// ============ PROJECTS ============
export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  deliverables: many(deliverables),
  notes: many(clientNotes),
  payments: many(payments),
  conversations: many(aiConversations),
  portalTokens: many(clientPortalTokens),
  researchReports: many(researchReports),
  knowledgeEntries: many(knowledgeEntries),
  pipelineRuns: many(pipelineRuns),
}));

// ============ DELIVERABLES ============
export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  project: one(projects, { fields: [deliverables.projectId], references: [projects.id] }),
  feedback: many(deliverableFeedback),
  revisions: many(deliverableRevisions),
  comments: many(deliverableComments),
  approvals: many(deliverableApprovals),
}));

// ============ CLIENT NOTES ============
export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, { fields: [clientNotes.clientId], references: [clients.id] }),
  project: one(projects, { fields: [clientNotes.projectId], references: [projects.id] }),
}));

// ============ PAYMENTS ============
export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, { fields: [payments.projectId], references: [projects.id] }),
  client: one(clients, { fields: [payments.clientId], references: [clients.id] }),
}));

// ============ AI CONVERSATIONS ============
export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  project: one(projects, { fields: [aiConversations.projectId], references: [projects.id] }),
  client: one(clients, { fields: [aiConversations.clientId], references: [clients.id] }),
}));

// ============ PROPOSALS ============
export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
  acceptances: many(proposalAcceptances),
}));

// ============ ONBOARDING SESSIONS ============
export const onboardingSessionsRelations = relations(onboardingSessions, ({ one }) => ({
  client: one(clients, { fields: [onboardingSessions.clientId], references: [clients.id] }),
}));

// ============ CLIENT PORTAL TOKENS ============
export const clientPortalTokensRelations = relations(clientPortalTokens, ({ one }) => ({
  project: one(projects, { fields: [clientPortalTokens.projectId], references: [projects.id] }),
  client: one(clients, { fields: [clientPortalTokens.clientId], references: [clients.id] }),
}));

// ============ RESEARCH REPORTS ============
export const researchReportsRelations = relations(researchReports, ({ one }) => ({
  client: one(clients, { fields: [researchReports.clientId], references: [clients.id] }),
  project: one(projects, { fields: [researchReports.projectId], references: [projects.id] }),
}));

// ============ KNOWLEDGE ENTRIES ============
export const knowledgeEntriesRelations = relations(knowledgeEntries, ({ one }) => ({
  client: one(clients, { fields: [knowledgeEntries.clientId], references: [clients.id] }),
  project: one(projects, { fields: [knowledgeEntries.projectId], references: [projects.id] }),
}));

// ============ PIPELINE RUNS ============
export const pipelineRunsRelations = relations(pipelineRuns, ({ one }) => ({
  client: one(clients, { fields: [pipelineRuns.clientId], references: [clients.id] }),
  project: one(projects, { fields: [pipelineRuns.projectId], references: [projects.id] }),
}));

// ============ BRAND HEALTH SNAPSHOTS ============
export const brandHealthSnapshotsRelations = relations(brandHealthSnapshots, ({ one, many }) => ({
  client: one(clients, { fields: [brandHealthSnapshots.clientId], references: [clients.id] }),
  alerts: many(brandAlerts),
  metrics: many(brandMetrics),
}));

// ============ BRAND ALERTS ============
export const brandAlertsRelations = relations(brandAlerts, ({ one }) => ({
  client: one(clients, { fields: [brandAlerts.clientId], references: [clients.id] }),
  snapshot: one(brandHealthSnapshots, { fields: [brandAlerts.snapshotId], references: [brandHealthSnapshots.id] }),
}));

// ============ BRAND METRICS ============
export const brandMetricsRelations = relations(brandMetrics, ({ one }) => ({
  client: one(clients, { fields: [brandMetrics.clientId], references: [clients.id] }),
  snapshot: one(brandHealthSnapshots, { fields: [brandMetrics.snapshotId], references: [brandHealthSnapshots.id] }),
}));

// ============ LEADS ============
export const leadsRelations = relations(leads, ({ one }) => ({
  client: one(clients, { fields: [leads.clientId], references: [clients.id] }),
  proposal: one(proposals, { fields: [leads.proposalId], references: [proposals.id] }),
}));

// ============ PROPOSAL ACCEPTANCES ============
export const proposalAcceptancesRelations = relations(proposalAcceptances, ({ one }) => ({
  proposal: one(proposals, { fields: [proposalAcceptances.proposalId], references: [proposals.id] }),
  client: one(clients, { fields: [proposalAcceptances.clientId], references: [clients.id] }),
}));

// ============ DELIVERABLE FEEDBACK ============
export const deliverableFeedbackRelations = relations(deliverableFeedback, ({ one }) => ({
  deliverable: one(deliverables, { fields: [deliverableFeedback.deliverableId], references: [deliverables.id] }),
}));

// ============ DELIVERABLE REVISIONS ============
export const deliverableRevisionsRelations = relations(deliverableRevisions, ({ one }) => ({
  deliverable: one(deliverables, { fields: [deliverableRevisions.deliverableId], references: [deliverables.id] }),
}));

// ============ DELIVERABLE COMMENTS ============
export const deliverableCommentsRelations = relations(deliverableComments, ({ one, many }) => ({
  deliverable: one(deliverables, { fields: [deliverableComments.deliverableId], references: [deliverables.id] }),
  parent: one(deliverableComments, { fields: [deliverableComments.parentId], references: [deliverableComments.id], relationName: "commentReplies" }),
  replies: many(deliverableComments, { relationName: "commentReplies" }),
}));

// ============ DELIVERABLE APPROVALS ============
export const deliverableApprovalsRelations = relations(deliverableApprovals, ({ one }) => ({
  deliverable: one(deliverables, { fields: [deliverableApprovals.deliverableId], references: [deliverables.id] }),
}));
