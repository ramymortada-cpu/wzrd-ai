-- Extend credit_transactions.type for referral + copilot refund flows
ALTER TABLE `credit_transactions` MODIFY COLUMN `type` ENUM(
  'signup_bonus',
  'purchase',
  'tool_usage',
  'refund',
  'admin',
  'referral_bonus',
  'copilot_refund'
) NOT NULL;
