-- Ensure otp_codes exists before altering it.
-- 0029_otp_codes.sql is sometimes parsed as "0 statements" by the
-- migration runner, leaving the table absent. Creating it here with
-- IF NOT EXISTS makes this migration idempotent regardless of order.
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id`              int          NOT NULL AUTO_INCREMENT,
  `email`           varchar(255) NOT NULL,
  `code`            varchar(10)  NOT NULL,
  `expires_at`      timestamp    NOT NULL,
  `created_at`      timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `otp_email_idx` (`email`)
);

-- Add failed_attempts only if it doesn't already exist.
-- MySQL has no native ADD COLUMN IF NOT EXISTS, so we use a
-- temporary stored procedure that checks information_schema first.
DROP PROCEDURE IF EXISTS _add_otp_failed_attempts;

CREATE PROCEDURE _add_otp_failed_attempts()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.COLUMNS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = 'otp_codes'
      AND  COLUMN_NAME  = 'failed_attempts'
  ) THEN
    ALTER TABLE `otp_codes`
      ADD COLUMN `failed_attempts` int NOT NULL DEFAULT 0;
  END IF;
END;

CALL _add_otp_failed_attempts();

DROP PROCEDURE IF EXISTS _add_otp_failed_attempts;
