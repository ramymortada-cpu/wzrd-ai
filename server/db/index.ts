/**
 * Database Module Index — re-exports all DB helpers.
 * 
 * This replaces the monolithic 1,174-line db.ts file.
 * Each domain has its own db helper file.
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { logger } from "../_core/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _pool: mysql.Pool | null = null;

/**
 * Get the database connection with connection pooling.
 * Pool config: 10 connections, 30s idle timeout, queued if all busy.
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        idleTimeout: 30000,
        queueLimit: 50,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      _db = drizzle(_pool);
      logger.info({ poolSize: 10 }, 'Database connection pool established');
    } catch (error) {
      logger.error({ err: error }, 'Failed to create database pool');
      _db = null;
    }
  }
  return _db;
}

/**
 * Graceful shutdown — close the connection pool.
 */
export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    logger.info('Database pool closed');
  }
}

// Re-export all domain helpers
export * from './users';
export * from './clients';
export * from './projects';
export * from './deliverables';
export * from './notes';
export * from './payments';
export * from './conversations';
export * from './proposals';
export * from './portal';
export * from './research';
export * from './knowledge';
export * from './pipeline';
export * from './brand';
export * from './leads';
export * from './feedback';
export * from './quality';
export * from './credits';
