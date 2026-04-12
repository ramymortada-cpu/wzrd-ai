CREATE TABLE IF NOT EXISTS `full_audit_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `website` varchar(500),
  `industry` varchar(100) NOT NULL,
  `target_audience` text NOT NULL,
  `main_challenge` text NOT NULL,
  `market_region` varchar(20) NOT NULL DEFAULT 'egypt',
  `overall_score` int,
  `confidence` varchar(20),
  `result_json` json,
  `meta_json` json,
  `credits_used` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_full_audit_userId` ON `full_audit_results` (`user_id`);
