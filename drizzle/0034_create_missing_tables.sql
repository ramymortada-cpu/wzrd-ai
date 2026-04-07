-- ============================================================
-- Comprehensive fix: create missing tables and indexes
-- ============================================================
-- Root cause: migrations 0029 (otp_codes) and 0033 (tool_reviews)
-- were parsed as "0 statements" by the runner and never executed,
-- leaving both tables absent from the database. Subsequent index
-- creation in 0031 and 0033 therefore also failed.
--
-- This migration is fully idempotent: all CREATE statements use
-- IF NOT EXISTS so re-running against a healthy database is safe.
-- ============================================================

-- ── otp_codes ────────────────────────────────────────────────
-- Final state: includes failed_attempts column added in 0032.
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id`              int          NOT NULL AUTO_INCREMENT,
  `email`           varchar(255) NOT NULL,
  `code`            varchar(10)  NOT NULL,
  `failed_attempts` int          NOT NULL DEFAULT 0,
  `expires_at`      timestamp    NOT NULL,
  `created_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE INDEX `otp_email_idx`          ON `otp_codes` (`email`);
CREATE INDEX `idx_otp_codes_expiresAt` ON `otp_codes` (`expires_at`);

-- ── tool_reviews ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tool_reviews` (
  `id`          int                                        NOT NULL AUTO_INCREMENT,
  `userId`      int                                        NOT NULL,
  `toolId`      varchar(64)                                NOT NULL,
  `toolNameAr`  varchar(120)                               NOT NULL,
  `toolNameEn`  varchar(120)                               NOT NULL,
  `rating`      int                                        NOT NULL,
  `commentAr`   text,
  `commentEn`   text,
  `country`     varchar(64),
  `countryFlag` varchar(8),
  `status`      enum('pending','approved','rejected')      NOT NULL DEFAULT 'pending',
  `creditedAt`  timestamp                                  NULL,
  `createdAt`   timestamp                                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`   timestamp                                  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE INDEX `idx_tool_reviews_userId` ON `tool_reviews` (`userId`);
