CREATE TABLE `client_portal_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_portal_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`step` enum('company_info','needs_assessment','service_recommendation','proposal_review','contract') NOT NULL DEFAULT 'company_info',
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`companyName` varchar(255),
	`contactName` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`market` enum('ksa','egypt','uae','other'),
	`industry` varchar(255),
	`website` varchar(500),
	`assessmentAnswers` json,
	`recommendedService` varchar(100),
	`recommendationReason` text,
	`clientId` int,
	`proposalId` int,
	`projectId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_sessions_id` PRIMARY KEY(`id`)
);
