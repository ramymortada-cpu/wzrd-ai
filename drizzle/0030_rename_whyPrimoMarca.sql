-- Sprint 3 V5: Final Primo cleanup — rename last DB column
-- Wrapped in a stored procedure so the migration is idempotent:
-- if `whyPrimoMarca` no longer exists (already renamed or never
-- created) the statement is skipped and the migration succeeds.
DROP PROCEDURE IF EXISTS rename_whyPrimoMarca;

DELIMITER //

CREATE PROCEDURE rename_whyPrimoMarca()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'proposals'
      AND COLUMN_NAME  = 'whyPrimoMarca'
  ) THEN
    ALTER TABLE `proposals` RENAME COLUMN `whyPrimoMarca` TO `whyWzzrdAi`;
  END IF;
END//

DELIMITER ;

CALL rename_whyPrimoMarca();
DROP PROCEDURE IF EXISTS rename_whyPrimoMarca;
