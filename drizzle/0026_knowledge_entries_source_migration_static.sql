-- Add migration_static to knowledge_entries.source enum (idempotent-safe re-run on some hosts may require checking information_schema first)
ALTER TABLE `knowledge_entries`
  MODIFY COLUMN `source` ENUM(
    'manual',
    'research_import',
    'ai_generated',
    'conversation_extract',
    'migration_static'
  ) NOT NULL DEFAULT 'manual';
