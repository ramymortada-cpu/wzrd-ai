/**
 * Sprint I — pure helpers for queued email follow-ups (unit-tested, no I/O).
 */

const AUDIT_FOLLOWUP_TRIGGER = "audit_followup_48h";

export function isAuditFollowupTrigger(trigger: string | null | undefined): boolean {
  return trigger === AUDIT_FOLLOWUP_TRIGGER;
}

/**
 * If the user bought credits (purchase) after the audit completed, skip the 48h nudge.
 * `auditCompletedAt` should align with `email_send_log.createdAt` when the row was queued.
 */
export function skipAuditFollowupDueToConversion(args: {
  trigger: string | null | undefined;
  hasPurchaseSinceAudit: boolean;
}): { send: boolean; skipReason?: string } {
  if (!isAuditFollowupTrigger(args.trigger)) {
    return { send: true };
  }
  if (args.hasPurchaseSinceAudit) {
    return { send: false, skipReason: "skipped_purchase_after_audit" };
  }
  return { send: true };
}
