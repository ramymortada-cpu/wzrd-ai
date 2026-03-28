-- MySQL only. Do NOT use SERIAL (PostgreSQL syntax).
CREATE TABLE IF NOT EXISTS `lead_magnet_subscribers` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `email` varchar(255) NOT NULL,
  `source` varchar(100) NOT NULL DEFAULT 'home_guide_2026',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `lead_magnet_subscribers_email_unique` UNIQUE(`email`)
);
