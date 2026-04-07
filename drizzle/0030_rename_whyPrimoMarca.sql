-- Sprint 3 V5: Final Primo cleanup — rename last DB column
-- Simple ALTER TABLE: if whyPrimoMarca doesn't exist (column was created
-- with the new name from the start), the runner skips errno 1054 safely.
ALTER TABLE `proposals` RENAME COLUMN `whyPrimoMarca` TO `whyWzzrdAi`;
