-- Migration: Multi-user support + File uploads
-- Date: 2026-03-19

-- ============================================
-- 1. USER-PROJECT ASSIGNMENTS (Multi-user)
-- ============================================
CREATE TABLE `user_project_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `projectId` INT NOT NULL,
  `role` ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  `assignedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assignedBy` INT NULL,
  CONSTRAINT `fk_assignment_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_projectId` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_project` (`userId`, `projectId`)
);

CREATE INDEX `idx_assignments_projectId` ON `user_project_assignments` (`projectId`);
CREATE INDEX `idx_assignments_userId` ON `user_project_assignments` (`userId`);

-- ============================================
-- 2. FILE UPLOADS
-- ============================================
CREATE TABLE `file_uploads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NULL,
  `deliverableId` INT NULL,
  `clientId` INT NULL,
  -- File info
  `fileName` VARCHAR(500) NOT NULL,
  `fileKey` VARCHAR(500) NOT NULL,
  `fileUrl` TEXT NOT NULL,
  `fileType` VARCHAR(100) NOT NULL,
  `fileSize` INT NOT NULL DEFAULT 0,
  `mimeType` VARCHAR(255) NULL,
  -- Upload context
  `uploadedBy` VARCHAR(255) NOT NULL,
  `uploadContext` ENUM('portal', 'internal', 'ai_generated') NOT NULL DEFAULT 'internal',
  -- Timestamps
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_uploads_projectId` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_uploads_deliverableId` FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_uploads_clientId` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL
);

CREATE INDEX `idx_uploads_projectId` ON `file_uploads` (`projectId`);
CREATE INDEX `idx_uploads_deliverableId` ON `file_uploads` (`deliverableId`);
CREATE INDEX `idx_uploads_clientId` ON `file_uploads` (`clientId`);

-- ============================================
-- 3. PORTAL ANALYTICS
-- ============================================
CREATE TABLE `portal_analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tokenId` INT NOT NULL,
  `projectId` INT NOT NULL,
  `clientId` INT NOT NULL,
  `event` ENUM('page_view', 'deliverable_view', 'file_download', 'comment', 'approval', 'time_spent') NOT NULL,
  `entityType` VARCHAR(100) NULL,
  `entityId` INT NULL,
  `metadata` JSON NULL,
  `ipAddress` VARCHAR(100) NULL,
  `userAgent` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_portalAnalytics_tokenId` FOREIGN KEY (`tokenId`) REFERENCES `client_portal_tokens`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_portalAnalytics_projectId` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_portalAnalytics_clientId` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_portalAnalytics_projectId` ON `portal_analytics` (`projectId`);
CREATE INDEX `idx_portalAnalytics_event` ON `portal_analytics` (`event`);
CREATE INDEX `idx_portalAnalytics_createdAt` ON `portal_analytics` (`createdAt`);
