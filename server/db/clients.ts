/**
 * Clients DB Helpers — client CRUD with pagination and soft delete.
 */

import { eq, desc, isNull, sql, and } from "drizzle-orm";
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
export async function getClients(params?: { page?: number; pageSize?: number }): Promise<PaginatedResult<Client>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const page = params?.page || 1;
  const pageSize = Math.min(params?.pageSize || 20, 100);
  const offset = (page - 1) * pageSize;

  // Count total (excluding soft-deleted)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(isNull(clients.deletedAt));

  const total = Number(count);

  // Fetch paginated data
  const data = await db
    .select()
    .from(clients)
    .where(isNull(clients.deletedAt))
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
export async function getClientById(id: number): Promise<Client | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
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
