-- Migration: Service Requests + Live Workflow Tracking
-- Purpose: Client portal — track service delivery like shipping status

CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `request_number` VARCHAR(20) NOT NULL UNIQUE,
  `service_type` VARCHAR(100) NOT NULL,
  `service_type_ar` VARCHAR(100) NOT NULL,
  `status` ENUM(
    'received',
    'reviewing', 
    'info_needed',
    'meeting_scheduled',
    'in_progress',
    'internal_review',
    'revision',
    'ready_for_delivery',
    'delivered',
    'completed'
  ) NOT NULL DEFAULT 'received',
  `priority` ENUM('normal', 'urgent') NOT NULL DEFAULT 'normal',
  `description` TEXT DEFAULT NULL,
  `description_ar` TEXT DEFAULT NULL,
  `source_diagnosis_id` INT DEFAULT NULL,
  `assigned_to` VARCHAR(100) DEFAULT NULL,
  `estimated_delivery` DATE DEFAULT NULL,
  `actual_delivery` DATE DEFAULT NULL,
  `total_price_egp` INT DEFAULT NULL,
  `paid` TINYINT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sr_user` (`user_id`),
  INDEX `idx_sr_status` (`status`),
  INDEX `idx_sr_number` (`request_number`)
);

CREATE TABLE IF NOT EXISTS `request_updates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) NOT NULL,
  `detail` TEXT DEFAULT NULL,
  `detail_ar` TEXT DEFAULT NULL,
  `update_type` ENUM('status_change', 'info_request', 'file_upload', 'meeting', 'note', 'delivery') NOT NULL DEFAULT 'status_change',
  `file_url` VARCHAR(500) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `meeting_link` VARCHAR(500) DEFAULT NULL,
  `meeting_date` TIMESTAMP DEFAULT NULL,
  `is_client_visible` TINYINT NOT NULL DEFAULT 1,
  `created_by` VARCHAR(100) DEFAULT 'system',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ru_request` (`request_id`),
  INDEX `idx_ru_created` (`created_at`)
);

CREATE TABLE IF NOT EXISTS `request_files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50) DEFAULT NULL,
  `file_size_kb` INT DEFAULT NULL,
  `uploaded_by` ENUM('client', 'team') NOT NULL DEFAULT 'team',
  `description` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rf_request` (`request_id`)
);
