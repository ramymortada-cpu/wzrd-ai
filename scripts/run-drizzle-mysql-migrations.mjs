/**
 * Run drizzle/*.sql migrations in order using DATABASE_URL (mysql://...).
 *
 * Usage:
 *   DATABASE_URL='mysql://...' node scripts/run-drizzle-mysql-migrations.mjs
 *   ENV_FILE=.env.railway node scripts/run-drizzle-mysql-migrations.mjs
 *   railway run node scripts/run-drizzle-mysql-migrations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config as loadDotenv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const envFile = process.env.ENV_FILE?.trim();
if (envFile) {
  loadDotenv({ path: path.isAbsolute(envFile) ? envFile : path.join(root, envFile) });
}

const DATABASE_URL = process.env.DATABASE_URL?.trim();
if (!DATABASE_URL || !/^mysql:\/\//i.test(DATABASE_URL)) {
  console.error('Missing or invalid DATABASE_URL (expected mysql://...)');
  process.exit(1);
}

const FILES = [
  '0015_diagnosis_history_checklists.sql',
  '0016_referrals_copilot_carts.sql',
  '0017_service_requests.sql',
  '0018_credit_transaction_enum.sql',
  '0019_paymob_processed_transactions.sql',
  '0022_blog_posts.sql',
  '0025_invite_tokens.sql',
  '0027_knowledge_entries_embedding.sql',
  '0028_brand_profiles.sql',
  // 0034 MUST run before 0029/0031/0032: it creates otp_codes + tool_reviews
  // using IF NOT EXISTS, so subsequent migrations that ALTER or index those
  // tables will always find them present regardless of prior partial runs.
  '0034_create_missing_tables.sql',
  '0029_otp_codes.sql',
  '0030_rename_whyPrimoMarca.sql',
  '0031_add_performance_indexes.sql',
  '0032_otp_failed_attempts.sql',
  '0033_tool_reviews.sql',
  '0035_full_audit_results.sql',
  '0036_brand_monitor_clients.sql',
];

/** Tables we expect after 0015–0017 (0018 alters enum, 0019 Paymob idempotency). */
const EXPECT = new Set([
  'diagnosis_history',
  'user_checklists',
  'referrals',
  'copilot_messages',
  'abandoned_carts',
  'service_requests',
  'request_updates',
  'request_files',
  'paymob_processed_transactions',
  'blog_posts',
  'invite_tokens',
]);

/**
 * Normalize SQL to remove unsupported MySQL syntax variants.
 * - Removes "IF NOT EXISTS" from ALTER TABLE ADD COLUMN (not supported in all MySQL versions)
 */
function normalizeSql(sql) {
  return sql.replace(/ADD COLUMN IF NOT EXISTS\s+/gi, 'ADD COLUMN ');
}

/**
 * Split a SQL file into individual statements.
 * Handles multi-line CREATE TABLE statements by splitting on semicolons
 * that appear at the end of a line (possibly followed by whitespace/newlines).
 *
 * Root-bug fix: the old filter `!s.startsWith('--')` silently dropped any
 * statement whose FIRST LINE was a SQL comment (e.g. 0029_otp_codes.sql
 * starts with two comment lines before the CREATE TABLE).  Those statements
 * were counted as "0 statements" and never executed, leaving tables absent.
 * We now strip leading comment lines before deciding whether real SQL exists.
 */
function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s.length) return false;
      // Remove leading comment lines; if anything real remains, keep it.
      const withoutLeadingComments = s.replace(/^(--[^\n]*\n\s*)*/g, '').trim();
      return withoutLeadingComments.length > 0;
    });
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  conn.config.namedPlaceholders = false;

  for (const file of FILES) {
    const fp = path.join(root, 'drizzle', file);
    if (!fs.existsSync(fp)) {
      throw new Error(`Missing ${fp}`);
    }
    const rawSql = fs.readFileSync(fp, 'utf8');
    const sql = normalizeSql(rawSql);
    console.log(`\n── Running ${file} ──`);
    const statements = splitStatements(sql);
    console.log(`   Found ${statements.length} statement(s)`);
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        // errno 1050 (ER_TABLE_EXISTS_ERROR): table already exists — safe to skip
        // errno 1054 (ER_BAD_FIELD_ERROR): unknown column — safe to skip on renames
        //   (column was created with the new name from the start; rename is a no-op)
        // errno 1060 (ER_DUP_FIELDNAME): column already exists — safe to skip
        // errno 1061 (ER_DUP_KEYNAME): index name already exists — safe to skip
        //   (happens when a migration ran partially then was re-run after a fix)
        if (err.errno === 1050 || err.errno === 1054 || err.errno === 1060 || err.errno === 1061) {
          console.warn(`   ⚠ Already exists / not applicable, skipping: ${err.sqlMessage}`);
          continue;
        }
        throw err;
      }
    }
    console.log('   OK');
  }

  console.log('\n── SHOW TABLES ──');
  const [rows] = await conn.query('SHOW TABLES');
  const list = rows.map((r) => Object.values(r)[0]).filter(Boolean);
  list.sort();
  console.log(list.join('\n'));

  const missing = [...EXPECT].filter((t) => !list.includes(t));
  if (missing.length) {
    console.error('\nMissing expected tables:', missing.join(', '));
    process.exitCode = 1;
  } else {
    console.log('\n✓ All expected migration tables present.');
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
