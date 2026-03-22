-- Migration: Add FK constraints, indexes, soft delete, and audit trail
-- Date: 2026-03-19

-- ============================================
-- 1. SOFT DELETE COLUMNS
-- ============================================
ALTER TABLE `clients` ADD COLUMN `deletedAt` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `projects` ADD COLUMN `deletedAt` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `deliverables` ADD COLUMN `deletedAt` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `proposals` ADD COLUMN `deletedAt` TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE `knowledge_entries` ADD COLUMN `deletedAt` TIMESTAMP NULL DEFAULT NULL;

-- ============================================
-- 2. AUDIT LOG TABLE
-- ============================================
CREATE TABLE `audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity` VARCHAR(100) NOT NULL,
  `entityId` INT NOT NULL,
  `action` ENUM('create', 'update', 'delete', 'restore') NOT NULL,
  `userId` INT NULL,
  `userName` VARCHAR(255) NULL,
  `changes` JSON NULL,
  `ipAddress` VARCHAR(100) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX `idx_audit_entity` ON `audit_log` (`entity`, `entityId`);
CREATE INDEX `idx_audit_userId` ON `audit_log` (`userId`);
CREATE INDEX `idx_audit_createdAt` ON `audit_log` (`createdAt`);

-- ============================================
-- 3. FOREIGN KEY CONSTRAINTS
-- ============================================

-- projects
ALTER TABLE `projects` ADD CONSTRAINT `fk_projects_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- deliverables
ALTER TABLE `deliverables` ADD CONSTRAINT `fk_deliverables_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- client_notes
ALTER TABLE `client_notes` ADD CONSTRAINT `fk_clientNotes_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- payments
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ai_conversations
ALTER TABLE `ai_conversations` ADD CONSTRAINT `fk_aiConversations_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ai_conversations` ADD CONSTRAINT `fk_aiConversations_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- proposals
ALTER TABLE `proposals` ADD CONSTRAINT `fk_proposals_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- onboarding_sessions
ALTER TABLE `onboarding_sessions` ADD CONSTRAINT `fk_onboarding_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- client_portal_tokens
ALTER TABLE `client_portal_tokens` ADD CONSTRAINT `fk_portalTokens_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `client_portal_tokens` ADD CONSTRAINT `fk_portalTokens_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- research_reports
ALTER TABLE `research_reports` ADD CONSTRAINT `fk_researchReports_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `research_reports` ADD CONSTRAINT `fk_researchReports_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- knowledge_entries
ALTER TABLE `knowledge_entries` ADD CONSTRAINT `fk_knowledgeEntries_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `knowledge_entries` ADD CONSTRAINT `fk_knowledgeEntries_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- pipeline_runs
ALTER TABLE `pipeline_runs` ADD CONSTRAINT `fk_pipelineRuns_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `pipeline_runs` ADD CONSTRAINT `fk_pipelineRuns_projectId`
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- brand_health_snapshots
ALTER TABLE `brand_health_snapshots` ADD CONSTRAINT `fk_brandSnapshots_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- brand_alerts
ALTER TABLE `brand_alerts` ADD CONSTRAINT `fk_brandAlerts_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `brand_alerts` ADD CONSTRAINT `fk_brandAlerts_snapshotId`
  FOREIGN KEY (`snapshotId`) REFERENCES `brand_health_snapshots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- brand_metrics
ALTER TABLE `brand_metrics` ADD CONSTRAINT `fk_brandMetrics_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `brand_metrics` ADD CONSTRAINT `fk_brandMetrics_snapshotId`
  FOREIGN KEY (`snapshotId`) REFERENCES `brand_health_snapshots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- leads
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `leads` ADD CONSTRAINT `fk_leads_proposalId`
  FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- proposal_acceptances
ALTER TABLE `proposal_acceptances` ADD CONSTRAINT `fk_proposalAcceptances_proposalId`
  FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `proposal_acceptances` ADD CONSTRAINT `fk_proposalAcceptances_clientId`
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- deliverable_feedback
ALTER TABLE `deliverable_feedback` ADD CONSTRAINT `fk_deliverableFeedback_deliverableId`
  FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- deliverable_revisions
ALTER TABLE `deliverable_revisions` ADD CONSTRAINT `fk_deliverableRevisions_deliverableId`
  FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- deliverable_comments
ALTER TABLE `deliverable_comments` ADD CONSTRAINT `fk_deliverableComments_deliverableId`
  FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `deliverable_comments` ADD CONSTRAINT `fk_deliverableComments_parentId`
  FOREIGN KEY (`parentId`) REFERENCES `deliverable_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- deliverable_approvals
ALTER TABLE `deliverable_approvals` ADD CONSTRAINT `fk_deliverableApprovals_deliverableId`
  FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 4. INDEXES
-- ============================================

-- clients
CREATE INDEX `idx_clients_status` ON `clients` (`status`);
CREATE INDEX `idx_clients_deletedAt` ON `clients` (`deletedAt`);

-- projects
CREATE INDEX `idx_projects_clientId_status` ON `projects` (`clientId`, `status`);
CREATE INDEX `idx_projects_stage` ON `projects` (`stage`);
CREATE INDEX `idx_projects_deletedAt` ON `projects` (`deletedAt`);

-- deliverables
CREATE INDEX `idx_deliverables_projectId_status` ON `deliverables` (`projectId`, `status`);
CREATE INDEX `idx_deliverables_stage` ON `deliverables` (`stage`);
CREATE INDEX `idx_deliverables_deletedAt` ON `deliverables` (`deletedAt`);

-- client_notes
CREATE INDEX `idx_clientNotes_clientId` ON `client_notes` (`clientId`);
CREATE INDEX `idx_clientNotes_projectId` ON `client_notes` (`projectId`);

-- payments
CREATE INDEX `idx_payments_projectId_status` ON `payments` (`projectId`, `status`);
CREATE INDEX `idx_payments_clientId_status` ON `payments` (`clientId`, `status`);

-- ai_conversations
CREATE INDEX `idx_aiConversations_projectId` ON `ai_conversations` (`projectId`);
CREATE INDEX `idx_aiConversations_clientId` ON `ai_conversations` (`clientId`);

-- proposals
CREATE INDEX `idx_proposals_clientId_status` ON `proposals` (`clientId`, `status`);
CREATE INDEX `idx_proposals_deletedAt` ON `proposals` (`deletedAt`);

-- onboarding_sessions
CREATE INDEX `idx_onboarding_status` ON `onboarding_sessions` (`status`);

-- client_portal_tokens
CREATE INDEX `idx_portalTokens_projectId` ON `client_portal_tokens` (`projectId`);
CREATE INDEX `idx_portalTokens_clientId` ON `client_portal_tokens` (`clientId`);

-- research_cache
CREATE INDEX `idx_researchCache_cacheKey` ON `research_cache` (`cacheKey`);
CREATE INDEX `idx_researchCache_industryMarket` ON `research_cache` (`industry`, `market`);

-- research_reports
CREATE INDEX `idx_researchReports_clientId` ON `research_reports` (`clientId`);
CREATE INDEX `idx_researchReports_status` ON `research_reports` (`status`);

-- knowledge_entries
CREATE INDEX `idx_knowledgeEntries_category_isActive` ON `knowledge_entries` (`category`, `isActive`);
CREATE INDEX `idx_knowledgeEntries_deletedAt` ON `knowledge_entries` (`deletedAt`);

-- pipeline_runs
CREATE INDEX `idx_pipelineRuns_clientId_status` ON `pipeline_runs` (`clientId`, `status`);

-- brand_health_snapshots
CREATE INDEX `idx_brandSnapshots_clientId` ON `brand_health_snapshots` (`clientId`);

-- brand_alerts
CREATE INDEX `idx_brandAlerts_clientId_status` ON `brand_alerts` (`clientId`, `status`);

-- brand_metrics
CREATE INDEX `idx_brandMetrics_clientId` ON `brand_metrics` (`clientId`);

-- leads
CREATE INDEX `idx_leads_scoreLabel_status` ON `leads` (`scoreLabel`, `status`);
CREATE INDEX `idx_leads_email` ON `leads` (`email`);
CREATE INDEX `idx_leads_source` ON `leads` (`source`);

-- deliverable_feedback
CREATE INDEX `idx_deliverableFeedback_deliverableId` ON `deliverable_feedback` (`deliverableId`);

-- deliverable_revisions
CREATE INDEX `idx_deliverableRevisions_deliverableId_version` ON `deliverable_revisions` (`deliverableId`, `version`);

-- deliverable_comments
CREATE INDEX `idx_deliverableComments_deliverableId` ON `deliverable_comments` (`deliverableId`);
CREATE INDEX `idx_deliverableComments_parentId` ON `deliverable_comments` (`parentId`);

-- deliverable_approvals
CREATE INDEX `idx_deliverableApprovals_deliverableId` ON `deliverable_approvals` (`deliverableId`);
