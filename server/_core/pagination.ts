/**
 * Pagination Utilities — cursor-based and offset-based pagination.
 * 
 * Usage:
 *   const { paginationInput } = require('./pagination');
 *   
 *   // In router:
 *   .input(z.object({ ...paginationInput }))
 *   
 *   // In db helper:
 *   const result = await paginate(db, clients, { page: 1, pageSize: 20 }, desc(clients.createdAt));
 */

import { z } from 'zod';
import { sql, desc, gt, lt, and, SQL } from 'drizzle-orm';
import type { MySqlTable, MySqlColumn } from 'drizzle-orm/mysql-core';

/** Default and maximum page sizes */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Zod schema for pagination input — use in router .input() */
export const paginationInput = {
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

/** Zod schema for cursor-based pagination */
export const cursorPaginationInput = {
  cursor: z.number().int().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  direction: z.enum(['next', 'prev']).default('next'),
};

/** Paginated response type */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** Cursor-based paginated response */
export interface CursorResult<T> {
  data: T[];
  nextCursor: number | null;
  prevCursor: number | null;
  hasMore: boolean;
}

/**
 * Offset-based pagination helper.
 * 
 * @param db - Drizzle database instance
 * @param table - Table to query
 * @param params - { page, pageSize }
 * @param orderBy - Order clause
 * @param where - Optional WHERE condition
 */
export async function paginate<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  table: MySqlTable,
  params: { page: number; pageSize: number },
  orderBy: SQL,
  where?: SQL,
): Promise<PaginatedResult<T>> {
  const { page, pageSize } = params;
  const offset = (page - 1) * pageSize;

  // Get total count
  const countQuery = where
    ? db.select({ count: sql<number>`count(*)` }).from(table).where(where)
    : db.select({ count: sql<number>`count(*)` }).from(table);
  
  const [{ count: total }] = await countQuery;

  // Get paginated data
  let dataQuery = db.select().from(table);
  if (where) dataQuery = dataQuery.where(where);
  const data = await dataQuery.orderBy(orderBy).limit(pageSize).offset(offset);

  const totalPages = Math.ceil(total / pageSize);

  return {
    data: data as T[],
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
 * Helper to build safe pagination from raw input.
 * Clamps values to valid ranges.
 */
export function normalizePagination(input: { page?: number; pageSize?: number }) {
  return {
    page: Math.max(1, input.page || 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize || DEFAULT_PAGE_SIZE)),
  };
}
