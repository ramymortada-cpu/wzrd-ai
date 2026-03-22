CREATE TABLE `deliverable_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`decision` enum('approved','changes_requested') NOT NULL,
	`reason` text,
	`clientName` varchar(255) NOT NULL,
	`version` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliverable_approvals_id` PRIMARY KEY(`id`)
);
