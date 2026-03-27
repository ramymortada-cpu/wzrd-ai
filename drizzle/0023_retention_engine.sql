-- Sprint B — Retention Engine (Premium Portal & AI Reports)
-- Adds portal token feature flags and report publication control.

ALTER TABLE `client_portal_tokens`
  ADD COLUMN `features` json DEFAULT (json_array('deliverables','reports','copilot','requests'));

ALTER TABLE `brand_health_snapshots`
  ADD COLUMN `isPublished` int NOT NULL DEFAULT 0;

