CREATE TABLE `research_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(500) NOT NULL,
	`queryType` enum('company','competitor','market','academic','quick') NOT NULL DEFAULT 'quick',
	`industry` varchar(255),
	`market` varchar(100),
	`companyName` varchar(255),
	`results` json NOT NULL,
	`sourcesCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `research_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int,
	`projectId` int,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(255) NOT NULL,
	`market` varchar(100) NOT NULL,
	`reportData` json NOT NULL,
	`summary` text,
	`keyInsights` json,
	`recommendations` json,
	`totalSources` int DEFAULT 0,
	`searchQueries` json,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_reports_id` PRIMARY KEY(`id`)
);
