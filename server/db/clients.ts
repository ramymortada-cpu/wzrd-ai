/**
 * Clients DB Helpers — client CRUD with pagination and soft delete.
 */

import { eq, desc, isNull, sql, and, or } from "drizzle-orm";
import { clients, InsertClient, Client } from "../../drizzle/schema";
import { getDb } from "./index";
import { logger } from "../_core/logger";
import type { PaginatedResult } from "../_core/pagination";

/**
 * Create a new client.
 */
export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result;
}

/**
 * Get all clients with pagination (excludes soft-deleted).
 */
export async function getClients(params?: { page?: number; pageSize?: number; workspaceId?: number }): Promise<PaginatedResult<Client>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const page = params?.page || 1;
  const pageSize = Math.min(params?.pageSize || 20, 100);
  const offset = (page - 1) * pageSize;

  const workspaceId = params?.workspaceId;
  const whereClause = workspaceId
    ? and(isNull(clients.deletedAt), eq(clients.workspaceId, workspaceId))
    : isNull(clients.deletedAt);

  // Count total (excluding soft-deleted)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(whereClause);

  const total = Number(count);

  // Fetch paginated data
  const data = await db
    .select()
    .from(clients)
    .where(whereClause)
    .orderBy(desc(clients.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get a single client by ID (excludes soft-deleted).
 */
/**
 * Clients with Brand Monitor enabled, active, and due for an observatory scan (Sprint F).
 */
export async function listClientsDueForBrandMonitor(): Promise<Client[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(clients)
    .where(
      and(
        isNull(clients.deletedAt),
        eq(clients.status, "active"),
        eq(clients.brandMonitorEnabled, 1),
        or(
          isNull(clients.brandMonitorLastRunAt),
          sql`${clients.brandMonitorLastRunAt} < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${clients.brandMonitorIntervalDays} DAY)`,
        ),
      ),
    )
    .orderBy(desc(clients.updatedAt));
}

export async function getClientById(id: number, workspaceId?: number): Promise<Client | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereClause = workspaceId
    ? and(eq(clients.id, id), eq(clients.workspaceId, workspaceId), isNull(clients.deletedAt))
    : and(eq(clients.id, id), isNull(clients.deletedAt));
  const result = await db
    .select()
    .from(clients)
    .where(whereClause)
    .limit(1);
  return result[0] || null;
}

/** Match CRM client by email (case-insensitive). Used to skip creating leads for existing clients. */
export async function getClientByEmail(email: string): Promise<Client | null> {
  const db = await getDb();
  if (!db) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const result = await db
    .select()
    .from(clients)
    .where(and(isNull(clients.deletedAt), sql`LOWER(${clients.email}) = ${normalized}`))
    .limit(1);
  return result[0] || null;
}

/**
 * Update a client by ID.
 */
export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

/**
 * Soft delete a client (sets deletedAt instead of removing).
 */
export async function softDeleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set({ deletedAt: new Date() }).where(eq(clients.id, id));
  logger.info({ clientId: id }, 'Client soft-deleted');
}

/**
 * Hard delete a client (permanent — use with caution).
 */
export async function hardDeleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
  logger.warn({ clientId: id }, 'Client permanently deleted');
}

/**
 * Restore a soft-deleted client.
 */
export async function restoreClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set({ deletedAt: null }).where(eq(clients.id, id));
  logger.info({ clientId: id }, 'Client restored');
}
