-- Sprint 2 V5: Move OTP from in-memory Map to database
-- This ensures OTPs survive server restarts and work across multiple instances

CREATE TABLE `otp_codes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `otp_email_idx` (`email`)
);
