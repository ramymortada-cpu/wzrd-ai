ALTER TABLE `users`
  ADD COLUMN `whatsappPhone` varchar(20) DEFAULT NULL,
  ADD COLUMN `whatsappVerified` int NOT NULL DEFAULT 0,
  ADD COLUMN `whatsappLinkedAt` timestamp NULL DEFAULT NULL;

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_whatsappPhone_unique` (`whatsappPhone`);
