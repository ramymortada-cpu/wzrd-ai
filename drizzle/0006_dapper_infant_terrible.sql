CREATE TABLE `brand_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`snapshotId` int,
	`severity` enum('critical','warning','info','opportunity') NOT NULL DEFAULT 'info',
	`dimension` enum('identity','positioning','messaging','visual','digital_presence','reputation','market_fit','overall') NOT NULL DEFAULT 'overall',
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`recommendation` text,
	`status` enum('active','acknowledged','resolved','dismissed') NOT NULL DEFAULT 'active',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_health_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`overallScore` int NOT NULL,
	`identityScore` int DEFAULT 0,
	`positioningScore` int DEFAULT 0,
	`messagingScore` int DEFAULT 0,
	`visualScore` int DEFAULT 0,
	`digitalPresenceScore` int DEFAULT 0,
	`reputationScore` int DEFAULT 0,
	`marketFitScore` int DEFAULT 0,
	`dimensionDetails` json,
	`summary` text,
	`strengths` json,
	`weaknesses` json,
	`opportunities` json,
	`threats` json,
	`auditType` enum('manual','ai_auto','pipeline') NOT NULL DEFAULT 'ai_auto',
	`researchReportId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_health_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`snapshotId` int,
	`dimension` enum('identity','positioning','messaging','visual','digital_presence','reputation','market_fit') NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`score` int DEFAULT 0,
	`maxScore` int DEFAULT 100,
	`details` text,
	`dataSource` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_metrics_id` PRIMARY KEY(`id`)
);
