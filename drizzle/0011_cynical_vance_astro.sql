CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete','restore') NOT NULL,
	`userId` int,
	`userName` varchar(255),
	`changes` json,
	`ipAddress` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`projectId` int,
	`clientName` varchar(255),
	`rating` int NOT NULL,
	`positiveNotes` text,
	`negativeNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`type` enum('signup_bonus','purchase','tool_usage','refund','admin') NOT NULL,
	`toolName` varchar(100),
	`reason` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptHash` varchar(64) NOT NULL,
	`systemHash` varchar(64) NOT NULL,
	`model` varchar(100) DEFAULT 'gemini-2.5-flash',
	`response` text NOT NULL,
	`tokensUsed` int DEFAULT 0,
	`cacheHits` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `llm_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_usage_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(50) DEFAULT 'primary',
	`model` varchar(100) NOT NULL,
	`promptTokens` int DEFAULT 0,
	`completionTokens` int DEFAULT 0,
	`totalTokens` int DEFAULT 0,
	`responseTimeMs` int DEFAULT 0,
	`cached` int DEFAULT 0,
	`error` varchar(500),
	`context` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_usage_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('deliverable_approved','deliverable_changes_requested','comment_added','revision_created','proposal_accepted','proposal_rejected','lead_submitted','portal_viewed','pipeline_completed','pipeline_failed','general') NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text,
	`entityType` varchar(100),
	`entityId` int,
	`userId` int,
	`isRead` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`emailSent` int DEFAULT 0,
	`emailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quality_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`ruleScore` int DEFAULT 0,
	`aiScore` int,
	`finalScore` int DEFAULT 0,
	`passed` int DEFAULT 0,
	`issues` json,
	`aiReview` json,
	`rejectedReason` varchar(500),
	`reviewedByOwner` int DEFAULT 0,
	`ownerScore` int,
	`ownerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clients` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `knowledge_entries` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `proposals` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `company` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `industry` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `market` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `newsletterOptIn` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `signupSource` varchar(50) DEFAULT 'website';