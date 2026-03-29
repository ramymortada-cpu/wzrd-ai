CREATE TABLE IF NOT EXISTS `invite_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `token` varchar(64) NOT NULL,
  `workspaceId` int NOT NULL,
  `email` varchar(320) NOT NULL,
  `role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `invite_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `invite_tokens_token_unique` UNIQUE(`token`)
);
