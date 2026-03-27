/**
 * Audit Trail — tracks all entity changes for compliance and debugging.
 * 
 * Usage:
 *   await audit('clients', 123, 'update', userId, { name: ['Old Name', 'New Name'] });
 */

import { logger } from './logger';
import { auditLog } from '../../drizzle/schema';
import type { AppDatabase } from '../db/types';

// Late binding — optional init at app startup
let _getDb: (() => Promise<AppDatabase | null>) | null = null;
let _auditLogTable: typeof auditLog | null = null;

/** Initialize audit with database references. Call once at app startup. */
export function initAudit(getDb: () => Promise<AppDatabase | null>, auditLogTable: typeof auditLog) {
  _getDb = getDb;
  _auditLogTable = auditLogTable;
}

export interface AuditEntry {
  workspaceId?: number;
  entity: string;
  entityId: number;
  action: 'create' | 'update' | 'delete' | 'restore';
  userId?: number;
  userName?: string;
  changes?: Record<string, [unknown, unknown]> | Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Records an audit log entry.
 * 
 * @param entity - Table/entity name (e.g., 'clients', 'projects')
 * @param entityId - ID of the affected record
 * @param action - What happened
 * @param userId - Who did it (null for system actions)
 * @param changes - What changed: { field: [oldValue, newValue] }
 * @param extra - Additional context (IP, userName)
 */
export async function audit(
  entity: string,
  entityId: number,
  action: AuditEntry['action'],
  userId?: number,
  changes?: AuditEntry['changes'],
  extra?: { ipAddress?: string; userName?: string; workspaceId?: number }
): Promise<void> {
  try {
    if (!_getDb || !_auditLogTable) {
      logger.warn('Audit system not initialized — skipping audit log');
      return;
    }

    const db = await _getDb();
    if (!db) {
      logger.warn('Database not available — skipping audit log');
      return;
    }

    await db.insert(_auditLogTable).values({
      workspaceId: extra?.workspaceId ?? 1,
      entity,
      entityId,
      action,
      userId: userId ?? null,
      userName: extra?.userName ?? null,
      changes: changes ? JSON.stringify(changes) : null,
      ipAddress: extra?.ipAddress ?? null,
    });

    logger.debug({ entity, entityId, action, userId }, 'Audit entry recorded');
  } catch (err) {
    // Never let audit failures break the main operation
    logger.error({ err, entity, entityId, action }, 'Failed to record audit entry');
  }
}

/**
 * Computes the diff between two objects for audit logging.
 * Returns only the fields that changed.
 */
export function computeChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, [unknown, unknown]> {
  const changes: Record<string, [unknown, unknown]> = {};

  for (const key of Object.keys(after)) {
    const oldVal = before[key];
    const newVal = after[key];

    // Skip unchanged fields
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    // Skip internal fields
    if (['updatedAt', 'createdAt'].includes(key)) continue;

    changes[key] = [oldVal, newVal];
  }

  return changes;
}
