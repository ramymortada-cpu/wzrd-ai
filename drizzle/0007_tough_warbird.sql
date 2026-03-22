CREATE TABLE `deliverable_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`clientId` int,
	`comment` text NOT NULL,
	`rating` int,
	`status` enum('pending','addressed','resolved') NOT NULL DEFAULT 'pending',
	`version` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliverable_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`industry` varchar(255),
	`market` enum('ksa','egypt','uae','other') NOT NULL DEFAULT 'egypt',
	`website` varchar(500),
	`quickCheckAnswers` json,
	`diagnosisTeaser` text,
	`fullDiagnosis` text,
	`score` int DEFAULT 0,
	`scoreLabel` enum('hot','warm','cold') NOT NULL DEFAULT 'cold',
	`scoringReason` text,
	`recommendedService` varchar(100),
	`estimatedValue` decimal(12,2),
	`status` enum('new','contacted','qualified','proposal_sent','converted','lost') NOT NULL DEFAULT 'new',
	`source` enum('quick_check','referral','manual','website') NOT NULL DEFAULT 'quick_check',
	`clientId` int,
	`proposalId` int,
	`notes` text,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposal_acceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`clientId` int NOT NULL,
	`decision` enum('accepted','rejected','revision_requested') NOT NULL,
	`signatureName` varchar(255),
	`signatureTitle` varchar(255),
	`signatureIp` varchar(100),
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `proposal_acceptances_id` PRIMARY KEY(`id`)
);
