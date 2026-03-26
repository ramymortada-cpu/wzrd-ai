-- Migration: Referral system + AI Copilot messages
-- Features: Referral tracking, copilot chat history

CREATE TABLE IF NOT EXISTS `referrals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `referrer_id` INT NOT NULL,
  `referred_user_id` INT NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `credits_awarded` INT NOT NULL DEFAULT 50,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ref_referrer` (`referrer_id`),
  INDEX `idx_ref_code` (`code`)
);

-- Add referral_code to users table
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `referral_code` VARCHAR(20) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `referred_by` INT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `copilot_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_id` VARCHAR(50) NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` TEXT NOT NULL,
  `tokens_used` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cop_user_session` (`user_id`, `session_id`),
  INDEX `idx_cop_session` (`session_id`)
);

-- Abandoned cart tracking
CREATE TABLE IF NOT EXISTS `abandoned_carts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_type` VARCHAR(50) NOT NULL,
  `amount_egp` INT NOT NULL,
  `clicked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed` TINYINT NOT NULL DEFAULT 0,
  `follow_up_sent` TINYINT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ac_user` (`user_id`),
  INDEX `idx_ac_pending` (`completed`, `follow_up_sent`)
);
