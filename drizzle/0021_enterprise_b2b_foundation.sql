ALTER TABLE `users`
  ADD COLUMN `ssoProvider` varchar(50) DEFAULT NULL,
  ADD COLUMN `ssoId` varchar(255) DEFAULT NULL;

CREATE TABLE `workspaces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `plan` enum('free','pro','enterprise') NOT NULL DEFAULT 'free',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `workspace_members` (
  `workspaceId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`workspaceId`,`userId`)
);

ALTER TABLE `clients` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;
ALTER TABLE `projects` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;
ALTER TABLE `deliverables` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;
ALTER TABLE `proposals` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;
ALTER TABLE `payments` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;
ALTER TABLE `audit_log` ADD COLUMN `workspaceId` int NOT NULL DEFAULT 1;

CREATE TABLE `contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspaceId` int NOT NULL DEFAULT 1,
  `clientId` int NOT NULL,
  `projectId` int DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `status` enum('draft','sent','signed','expired') NOT NULL DEFAULT 'draft',
  `content` text,
  `signatureData` json,
  `pdfUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workspaceId` int NOT NULL DEFAULT 1,
  `clientId` int NOT NULL,
  `projectId` int DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'EGP',
  `status` enum('draft','open','paid','void') NOT NULL DEFAULT 'draft',
  `dueDate` timestamp NULL DEFAULT NULL,
  `pdfUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
