-- ============================================================
-- MIGRATION 0013: Sprint 1 — LLM Resilience + Quality Measurement
-- ============================================================

-- 1. LLM Response Cache — saves tokens by caching identical requests
CREATE TABLE IF NOT EXISTS `llm_cache` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `promptHash` VARCHAR(64) NOT NULL,
  `systemHash` VARCHAR(64) NOT NULL,
  `model` VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
  `response` LONGTEXT NOT NULL,
  `tokensUsed` INT DEFAULT 0,
  `cacheHits` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` TIMESTAMP NOT NULL,
  UNIQUE KEY `idx_llm_cache_prompt_system` (`promptHash`, `systemHash`),
  KEY `idx_llm_cache_expires` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Quality Scores — tracks quality of every deliverable
CREATE TABLE IF NOT EXISTS `quality_scores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `deliverableId` INT NOT NULL,
  `ruleScore` INT DEFAULT 0,
  `aiScore` INT DEFAULT NULL,
  `finalScore` INT DEFAULT 0,
  `passed` BOOLEAN DEFAULT FALSE,
  `issues` JSON DEFAULT NULL,
  `aiReview` JSON DEFAULT NULL,
  `rejectedReason` VARCHAR(500) DEFAULT NULL,
  `reviewedByOwner` BOOLEAN DEFAULT FALSE,
  `ownerScore` TINYINT DEFAULT NULL,
  `ownerNotes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_quality_deliverable` (`deliverableId`),
  KEY `idx_quality_score` (`finalScore`),
  KEY `idx_quality_passed` (`passed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Client Feedback — clients rate deliverables from the Portal
CREATE TABLE IF NOT EXISTS `client_feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `deliverableId` INT NOT NULL,
  `projectId` INT DEFAULT NULL,
  `clientName` VARCHAR(255) DEFAULT NULL,
  `rating` TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `positiveNotes` TEXT DEFAULT NULL,
  `negativeNotes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cfeedback_deliverable` (`deliverableId`),
  KEY `idx_cfeedback_project` (`projectId`),
  KEY `idx_cfeedback_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Prompt Versions — track prompt changes for A/B testing (Sprint 3 prep)
CREATE TABLE IF NOT EXISTS `prompt_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `promptName` VARCHAR(255) NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `content` LONGTEXT NOT NULL,
  `isActive` BOOLEAN DEFAULT FALSE,
  `metrics` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `activatedAt` TIMESTAMP DEFAULT NULL,
  `deactivatedAt` TIMESTAMP DEFAULT NULL,
  UNIQUE KEY `idx_prompt_name_version` (`promptName`, `version`),
  KEY `idx_prompt_active` (`promptName`, `isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. LLM Usage Log — track every LLM call for cost monitoring
CREATE TABLE IF NOT EXISTS `llm_usage_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider` VARCHAR(50) NOT NULL DEFAULT 'primary',
  `model` VARCHAR(100) NOT NULL,
  `promptTokens` INT DEFAULT 0,
  `completionTokens` INT DEFAULT 0,
  `totalTokens` INT DEFAULT 0,
  `responseTimeMs` INT DEFAULT 0,
  `cached` BOOLEAN DEFAULT FALSE,
  `error` VARCHAR(500) DEFAULT NULL,
  `context` VARCHAR(100) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_llm_usage_date` (`createdAt`),
  KEY `idx_llm_usage_provider` (`provider`),
  KEY `idx_llm_usage_cached` (`cached`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
