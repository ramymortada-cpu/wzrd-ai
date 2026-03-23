-- Promo codes for credit purchase discounts
CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `code` varchar(50) NOT NULL UNIQUE,
  `discountType` enum('percent','fixed') NOT NULL,
  `discountValue` int NOT NULL,
  `minAmountEGP` int DEFAULT 0,
  `maxUses` int,
  `usedCount` int NOT NULL DEFAULT 0,
  `validFrom` timestamp NULL,
  `validUntil` timestamp NULL,
  `enabled` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
