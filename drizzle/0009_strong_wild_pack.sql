CREATE TABLE `deliverable_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`parentId` int,
	`authorType` enum('owner','team','client','ai') NOT NULL DEFAULT 'owner',
	`authorName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`version` int,
	`isResolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverable_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverable_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`version` int NOT NULL,
	`content` text,
	`fileUrl` text,
	`fileKey` text,
	`changeType` enum('initial','ai_regenerated','manual_edit','client_revision','quality_update') NOT NULL DEFAULT 'initial',
	`changeSummary` text,
	`changedBy` varchar(255),
	`qualityScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliverable_revisions_id` PRIMARY KEY(`id`)
);
