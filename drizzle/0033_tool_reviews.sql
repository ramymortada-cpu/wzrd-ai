-- Create tool_reviews table (was in schema.ts but missing migration)
CREATE TABLE IF NOT EXISTS `tool_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `toolId` varchar(64) NOT NULL,
  `toolNameAr` varchar(120) NOT NULL,
  `toolNameEn` varchar(120) NOT NULL,
  `rating` int NOT NULL,
  `commentAr` text,
  `commentEn` text,
  `country` varchar(64),
  `countryFlag` varchar(8),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `creditedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_tool_reviews_userId` ON `tool_reviews` (`userId`);
