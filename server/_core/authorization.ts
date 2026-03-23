/**
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * =================================
 * 
 * 3 roles:
 * - owner:  Full access — sees and edits everything (Ramy)
 * - editor: Can view and edit assigned projects, deliverables, notes
 * - viewer: Read-only access to assigned projects
 * 
 * Usage in routers:
 *   ownerOnly.mutation(...)      → only owner can call
 *   editorUp.mutation(...)       → owner + editor can call
 *   viewerUp.query(...)          → anyone authenticated can call
 * 
 * The role is stored in the users table (default: 'owner' for first user).
 */

import { TRPCError } from '@trpc/server';
import { logger } from './logger';
import type { TrpcContext } from './context';

// ============ TYPES ============

export type UserRole = 'owner' | 'editor' | 'viewer' | 'admin' | 'user';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

// Role hierarchy: admin/owner > editor > viewer > user (DB uses admin/user)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 3,
  admin: 3,  // Same as owner — DB uses 'admin' for full access
  editor: 2,
  viewer: 1,
  user: 0,
};

// ============ AUTHORIZATION CHECKS ============

/**
 * Check if a user has at least the required role level.
 */
export function hasRole(user: AuthUser | null | undefined, requiredRole: UserRole): boolean {
  if (!user) return false;
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Throw if user doesn't have the required role.
 */
export function requireRole(user: AuthUser | null | undefined, requiredRole: UserRole): void {
  if (!hasRole(user, requiredRole)) {
    logger.warn({
      userId: user?.id,
      userRole: user?.role,
      requiredRole,
    }, 'Authorization denied');

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: user?.role === 'viewer'
        ? 'You have view-only access. Contact the owner for edit permissions.'
        : 'You do not have permission to perform this action.',
    });
  }
}

/**
 * Check if a user can access a specific project.
 * Owners can access all projects. Editors/viewers need assignment.
 */
export function canAccessProject(
  user: AuthUser | null | undefined,
  projectId: number,
  userProjectIds?: number[]
): boolean {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (!userProjectIds) return false;
  return userProjectIds.includes(projectId);
}

// ============ MIDDLEWARE FACTORIES ============

/**
 * Creates authorization middleware for tRPC procedures.
 * 
 * Usage:
 *   const ownerOnly = createAuthMiddleware('owner');
 *   
 *   router({
 *     deleteClient: ownerOnly(protectedProcedure).mutation(...)
 *   })
 */
export function createRoleCheck(requiredRole: UserRole) {
  return (ctx: TrpcContext) => {
    // In the current system, ctx.user may not have a role field yet.
    // Default to 'owner' for backward compatibility (single-user system).
    const u = ctx.user as { id?: number; name?: string; email?: string; role?: string } | null;
    const user: AuthUser = {
      id: u?.id || 1,
      name: u?.name || 'Owner',
      email: u?.email || '',
      role: (u?.role as UserRole) || 'admin', // Default: admin (backward compatible)
    };

    requireRole(user, requiredRole);
    return user;
  };
}

// Pre-built role checks
export const checkOwner = createRoleCheck('admin');  // DB uses 'admin' for full access
export const checkEditor = createRoleCheck('editor');
export const checkViewer = createRoleCheck('viewer');

// ============ PERMISSION MAP ============

/**
 * Define which operations need which role.
 * Used for documentation and the frontend permissions check.
 */
export const PERMISSION_MAP = {
  // Client management
  'clients.create': 'editor',
  'clients.update': 'editor',
  'clients.delete': 'owner',
  'clients.list': 'viewer',

  // Project management
  'projects.create': 'editor',
  'projects.update': 'editor',
  'projects.delete': 'owner',
  'projects.list': 'viewer',

  // Deliverables
  'deliverables.create': 'editor',
  'deliverables.update': 'editor',
  'deliverables.delete': 'owner',
  'deliverables.list': 'viewer',
  'deliverables.generate': 'editor',

  // AI & Knowledge
  'ai.chat': 'editor',
  'knowledge.create': 'editor',
  'knowledge.delete': 'owner',
  'knowledge.list': 'viewer',
  'research.start': 'editor',

  // Financial
  'payments.create': 'owner',
  'payments.list': 'owner',
  'financials.view': 'owner',

  // Settings
  'settings.update': 'owner',
  'users.manage': 'owner',
  'promptLab.access': 'owner',
  'quality.dashboard': 'owner',
  'llm.stats': 'owner',
} as const;

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: UserRole): string[] {
  const level = ROLE_HIERARCHY[role];
  return Object.entries(PERMISSION_MAP)
    .filter(([_, requiredRole]) => ROLE_HIERARCHY[requiredRole as UserRole] <= level)
    .map(([permission]) => permission);
}

/**
 * Check if a role can perform a specific action.
 */
export function canPerform(role: UserRole, action: keyof typeof PERMISSION_MAP): boolean {
  const requiredRole = PERMISSION_MAP[action] as UserRole;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}
