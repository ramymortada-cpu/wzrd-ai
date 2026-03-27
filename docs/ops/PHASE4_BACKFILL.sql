-- ============================================================
-- WZRD AI — Phase 4 Enterprise: Production Backfill Script
-- ============================================================
-- Purpose : Run AFTER 0021_enterprise_b2b_foundation.sql
-- Safety  : Fully idempotent — safe to run multiple times
-- DB      : MySQL / PlanetScale / Railway MySQL
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Create the Default Workspace (idempotent)
-- ─────────────────────────────────────────────────────────────
-- Inserts workspace with id=1 only if it doesn't already exist.
INSERT INTO `workspaces` (`id`, `name`, `plan`, `createdAt`, `updatedAt`)
SELECT 1, 'Primary Workspace', 'pro', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `workspaces` WHERE `id` = 1
);

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Add All Admins as Workspace Owners (idempotent)
-- ─────────────────────────────────────────────────────────────
-- Every user with role='admin' becomes an 'owner' of workspace 1.
-- Uses INSERT IGNORE to skip duplicates on composite PK.
INSERT IGNORE INTO `workspace_members` (`workspaceId`, `userId`, `role`, `createdAt`)
SELECT 1, `id`, 'owner', NOW()
FROM `users`
WHERE `role` = 'admin';

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Add All Regular Users as Workspace Editors (idempotent)
-- ─────────────────────────────────────────────────────────────
-- Every user with role='user' becomes an 'editor' of workspace 1.
-- INSERT IGNORE skips anyone already added (e.g., admins above).
INSERT IGNORE INTO `workspace_members` (`workspaceId`, `userId`, `role`, `createdAt`)
SELECT 1, `id`, 'editor', NOW()
FROM `users`
WHERE `role` = 'user';

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Backfill workspaceId on Core Business Tables
-- ─────────────────────────────────────────────────────────────
-- The migration already set DEFAULT 1 on new columns, but any
-- existing rows that were inserted before the migration ran may
-- have NULL. This ensures all legacy rows point to workspace 1.

UPDATE `clients`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

UPDATE `projects`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

UPDATE `deliverables`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

UPDATE `proposals`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

UPDATE `payments`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

UPDATE `audit_log`
SET `workspaceId` = 1
WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Full Verification Block (copy-paste ready)
-- ─────────────────────────────────────────────────────────────
-- Run these after the backfill to confirm everything is correct.
-- Expected: all counts = 0, workspace row exists, members listed.

-- 5a. Workspace exists
SELECT
  `id`,
  `name`,
  `plan`,
  `createdAt`
FROM `workspaces`
WHERE `id` = 1;

-- 5b. Members summary (owners + editors)
SELECT
  wm.`role`,
  COUNT(*) AS member_count
FROM `workspace_members` wm
WHERE wm.`workspaceId` = 1
GROUP BY wm.`role`
ORDER BY FIELD(wm.`role`, 'owner', 'admin', 'editor', 'viewer');

-- 5c. Members detail (who is in the workspace)
SELECT
  wm.`role`,
  u.`id`    AS userId,
  u.`email`,
  u.`name`
FROM `workspace_members` wm
JOIN `users` u ON u.`id` = wm.`userId`
WHERE wm.`workspaceId` = 1
ORDER BY FIELD(wm.`role`, 'owner', 'admin', 'editor', 'viewer'), u.`id`;

-- 5d. Rows without workspace (all should be 0)
SELECT
  'clients'      AS tbl, COUNT(*) AS orphaned_rows FROM `clients`      WHERE `workspaceId` IS NULL OR `workspaceId` = 0
UNION ALL
SELECT
  'projects',              COUNT(*)                FROM `projects`     WHERE `workspaceId` IS NULL OR `workspaceId` = 0
UNION ALL
SELECT
  'deliverables',          COUNT(*)                FROM `deliverables` WHERE `workspaceId` IS NULL OR `workspaceId` = 0
UNION ALL
SELECT
  'proposals',             COUNT(*)                FROM `proposals`    WHERE `workspaceId` IS NULL OR `workspaceId` = 0
UNION ALL
SELECT
  'payments',              COUNT(*)                FROM `payments`     WHERE `workspaceId` IS NULL OR `workspaceId` = 0
UNION ALL
SELECT
  'audit_log',             COUNT(*)                FROM `audit_log`    WHERE `workspaceId` IS NULL OR `workspaceId` = 0;

-- 5e. Row totals per table (sanity check — should match your DB counts)
SELECT
  'clients'      AS tbl, COUNT(*) AS total_rows FROM `clients`
UNION ALL
SELECT 'projects',      COUNT(*) FROM `projects`
UNION ALL
SELECT 'deliverables',  COUNT(*) FROM `deliverables`
UNION ALL
SELECT 'proposals',     COUNT(*) FROM `proposals`
UNION ALL
SELECT 'payments',      COUNT(*) FROM `payments`
UNION ALL
SELECT 'audit_log',     COUNT(*) FROM `audit_log`;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
