-- ============================================================
-- Sprint 3 V5: Performance indexes for WZZRD AI tables
-- Migration 0011 covered Command Center tables (40 indexes).
-- These cover the WZZRD AI tables that were added in Sprints 2-5.
-- ============================================================

-- userId lookups (camelCase DB columns)
CREATE INDEX `idx_credit_transactions_userId` ON `credit_transactions` (`userId`);

-- user_id lookups (snake_case DB columns)
-- NOTE: idx_diagnosis_history_userId omitted — 0015 already creates composite indexes
--   idx_dh_user_created (user_id, created_at) and idx_dh_user_tool (user_id, tool_id)
--   which cover all single-column user_id lookups on diagnosis_history.
-- NOTE: idx_user_checklists_userId omitted — 0015 already creates idx_uc_user (user_id)
--   on user_checklists.
CREATE INDEX `idx_copilot_messages_userId` ON `copilot_messages` (`user_id`);
CREATE INDEX `idx_service_requests_userId` ON `service_requests` (`user_id`);
CREATE INDEX `idx_abandoned_carts_userId` ON `abandoned_carts` (`user_id`);

-- brand_profiles: UNIQUE constraint (1:1 with user) — also serves as index
CREATE UNIQUE INDEX `idx_brand_profiles_userId` ON `brand_profiles` (`user_id`);

-- referrals: index on referrer (for "my referrals" queries)
CREATE INDEX `idx_referrals_referrerId` ON `referrals` (`referrer_id`);

-- Email lookups: lead_magnet_subscribers.email already has UNIQUE constraint (auto-indexed by MySQL)

-- Timestamp-based queries (data retention cleanup + analytics)
CREATE INDEX `idx_credit_transactions_createdAt` ON `credit_transactions` (`createdAt`);
CREATE INDEX `idx_copilot_messages_createdAt` ON `copilot_messages` (`created_at`);
CREATE INDEX `idx_otp_codes_expiresAt` ON `otp_codes` (`expires_at`);
CREATE INDEX `idx_llm_usage_log_createdAt` ON `llm_usage_log` (`createdAt`);
CREATE INDEX `idx_abandoned_carts_createdAt` ON `abandoned_carts` (`created_at`);
