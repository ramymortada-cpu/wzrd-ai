CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`clientId` int,
	`context` enum('business_health_check','starting_business_logic','brand_identity','business_takeoff','consultation','general') NOT NULL DEFAULT 'general',
	`messages` json NOT NULL,
	`title` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('diagnostic','strategic','meeting','insight','general') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`market` enum('ksa','egypt','uae','other') NOT NULL DEFAULT 'ksa',
	`industry` varchar(255),
	`website` varchar(500),
	`notes` text,
	`status` enum('lead','active','completed','paused') NOT NULL DEFAULT 'lead',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`stage` enum('diagnose','design','deploy','optimize') NOT NULL DEFAULT 'diagnose',
	`status` enum('pending','in_progress','ai_generated','review','approved','delivered') NOT NULL DEFAULT 'pending',
	`content` text,
	`aiGenerated` int DEFAULT 0,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(10) DEFAULT 'EGP',
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`dueDate` timestamp,
	`paidDate` timestamp,
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`serviceType` enum('business_health_check','starting_business_logic','brand_identity','business_takeoff','consultation') NOT NULL,
	`stage` enum('diagnose','design','deploy','optimize','completed') NOT NULL DEFAULT 'diagnose',
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`price` decimal(12,2),
	`currency` varchar(10) DEFAULT 'EGP',
	`startDate` timestamp,
	`endDate` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
