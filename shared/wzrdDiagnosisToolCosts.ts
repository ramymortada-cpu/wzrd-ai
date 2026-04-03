/** Credit cost per diagnosis tool — merged into server/db/credits.ts TOOL_COSTS */
export const WZRD_DIAGNOSIS_TOOL_COSTS: Record<string, number> = {
  brand_diagnosis: 20,
  offer_check: 25,
  message_check: 20,
  presence_audit: 25,
  identity_snapshot: 20,
  launch_readiness: 30,
  design_health: 30,
};

/** Human-readable English names for diagnosis tools (emails, automation metadata) */
export const WZRD_DIAGNOSIS_TOOL_NAMES: Record<string, string> = {
  brand_diagnosis: 'Brand Diagnosis',
  offer_check: 'Offer Logic Check',
  message_check: 'Message Check',
  presence_audit: 'Presence Audit',
  identity_snapshot: 'Identity Snapshot',
  launch_readiness: 'Launch Readiness',
  design_health: 'Design Health Check',
};
