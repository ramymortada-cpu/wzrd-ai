import { describe, it, expect } from "vitest";
import { isAuditFollowupTrigger, skipAuditFollowupDueToConversion } from "./emailQueueLogic";

describe("emailQueueLogic", () => {
  it("isAuditFollowupTrigger matches only audit_followup_48h", () => {
    expect(isAuditFollowupTrigger("audit_followup_48h")).toBe(true);
    expect(isAuditFollowupTrigger("signup")).toBe(false);
    expect(isAuditFollowupTrigger(null)).toBe(false);
  });

  it("skipAuditFollowupDueToConversion allows non-audit triggers regardless of purchase", () => {
    expect(skipAuditFollowupDueToConversion({ trigger: "signup", hasPurchaseSinceAudit: true })).toEqual({
      send: true,
    });
  });

  it("skipAuditFollowupDueToConversion blocks audit follow-up when user purchased after audit", () => {
    expect(
      skipAuditFollowupDueToConversion({ trigger: "audit_followup_48h", hasPurchaseSinceAudit: true }),
    ).toEqual({ send: false, skipReason: "skipped_purchase_after_audit" });
  });

  it("skipAuditFollowupDueToConversion sends audit follow-up when no purchase", () => {
    expect(
      skipAuditFollowupDueToConversion({ trigger: "audit_followup_48h", hasPurchaseSinceAudit: false }),
    ).toEqual({ send: true });
  });
});
