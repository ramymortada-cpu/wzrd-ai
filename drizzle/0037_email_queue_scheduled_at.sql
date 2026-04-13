-- Sprint I: queue processor uses scheduledAt + automation trigger for audit follow-up.
ALTER TABLE `email_send_log` ADD COLUMN `scheduledAt` timestamp NULL;

ALTER TABLE `automation_rules`
  MODIFY COLUMN `trigger` ENUM(
    'signup',
    'first_tool_run',
    'low_score',
    'credits_low',
    'inactive_3d',
    'inactive_7d',
    'inactive_30d',
    'premium_purchase',
    'manual',
    'audit_followup_48h'
  ) NOT NULL;
