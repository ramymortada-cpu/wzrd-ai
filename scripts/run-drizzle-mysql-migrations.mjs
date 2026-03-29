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
  '0025_invite_tokens.sql',
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
  'invite_tokens',
]);

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  conn.config.namedPlaceholders = false;

  for (const file of FILES) {
    const fp = path.join(root, 'drizzle', file);
    if (!fs.existsSync(fp)) {
      throw new Error(`Missing ${fp}`);
    }
    const sql = fs.readFileSync(fp, 'utf8');
    console.log(`\n── Running ${file} ──`);
    await conn.query(sql);
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
