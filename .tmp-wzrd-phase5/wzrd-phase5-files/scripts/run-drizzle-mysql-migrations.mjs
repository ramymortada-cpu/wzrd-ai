#!/usr/bin/env node
/**
 * Used by `pnpm db:migrate:sql`. Requires DATABASE_URL (e.g. Railway MySQL plugin).
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.");
  process.exit(1);
}

execSync("npx drizzle-kit migrate --force", {
  stdio: "inherit",
  env: process.env,
});
