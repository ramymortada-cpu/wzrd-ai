-- Idempotent Paymob webhooks across multiple app instances (replaces in-memory Set)
CREATE TABLE `paymob_processed_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymobTransactionId` varchar(64) NOT NULL,
	`userId` int,
	`planId` varchar(100),
	`credits` int,
	`amountCents` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `paymob_processed_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymob_processed_transactions_paymobTransactionId_unique` UNIQUE(`paymobTransactionId`)
);
