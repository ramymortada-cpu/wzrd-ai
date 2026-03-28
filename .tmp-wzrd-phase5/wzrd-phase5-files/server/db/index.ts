export * from "./schema";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
const pool = url ? mysql.createPool(url) : undefined;
const _db = pool ? drizzle(pool) : undefined;

export async function getDb() {
  return _db ?? null;
}

/** Sync handle — only safe when DATABASE_URL is set (e.g. API process). */
export const db = _db as NonNullable<typeof _db>;
