-- Migration: Add diagnosis_history and user_checklists tables
-- Purpose: Brand Health Tracker + Action Checklist features

CREATE TABLE IF NOT EXISTS `diagnosis_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `tool_id` VARCHAR(50) NOT NULL,
  `score` INT NOT NULL,
  `pillar_scores` JSON DEFAULT NULL,
  `findings` JSON DEFAULT NULL,
  `action_items` JSON DEFAULT NULL,
  `recommendation` TEXT DEFAULT NULL,
  `schema_version` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_dh_user_created` (`user_id`, `created_at`),
  INDEX `idx_dh_user_tool` (`user_id`, `tool_id`)
);

CREATE TABLE IF NOT EXISTS `user_checklists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `diagnosis_id` INT NOT NULL,
  `items` JSON NOT NULL,
  `completed_count` INT NOT NULL DEFAULT 0,
  `total_count` INT NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_uc_user` (`user_id`),
  INDEX `idx_uc_diagnosis` (`diagnosis_id`)
);
