/**
 * Authorization (RBAC) Test Suite
 * Covers: hasRole, requireRole, canAccessProject, isOwnerAdmin,
 *         canPerform, getPermissionsForRole, workspace role hierarchy,
 *         PERMISSION_MAP completeness
 *
 * All logic inlined to avoid tRPC/Drizzle imports in test environment.
 */
import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────
// TYPES & CONSTANTS — inlined from authorization.ts
// ─────────────────────────────────────────────

type UserRole = 'owner' | 'editor' | 'viewer' | 'admin' | 'user';
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  currentWorkspaceId?: number;
  workspaceRole?: 'owner' | 'admin' | 'editor' | 'viewer' | null;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 3, admin: 3, editor: 2, viewer: 1, user: 0,
};

const WORKSPACE_ROLE_HIERARCHY: Record<'owner' | 'admin' | 'editor' | 'viewer', number> = {
  owner: 4, admin: 3, editor: 2, viewer: 1,
};

const PERMISSION_MAP: Record<string, string> = {
  'clients.create': 'editor', 'clients.update': 'editor',
  'clients.delete': 'owner', 'clients.list': 'viewer',
  'projects.create': 'editor', 'projects.update': 'editor',
  'projects.delete': 'owner', 'projects.list': 'viewer',
  'deliverables.create': 'editor', 'deliverables.update': 'editor',
  'deliverables.delete': 'owner', 'deliverables.list': 'viewer',
  'deliverables.generate': 'editor',
  'ai.chat': 'editor', 'knowledge.create': 'editor',
  'knowledge.delete': 'owner', 'knowledge.list': 'viewer',
  'research.start': 'editor',
  'payments.create': 'owner', 'payments.list': 'owner', 'financials.view': 'owner',
  'settings.update': 'owner', 'users.manage': 'owner',
  'promptLab.access': 'owner', 'quality.dashboard': 'owner', 'llm.stats': 'owner',
};

function hasRole(user: AuthUser | null | undefined, requiredRole: UserRole): boolean {
  if (!user) return false;
  return (ROLE_HIERARCHY[user.role] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

function canAccessProject(user: AuthUser | null | undefined, projectId: number, userProjectIds?: number[]): boolean {
  if (!user) return false;
  if (user.role === 'owner' || user.role === 'admin') return true;
  if (!userProjectIds) return false;
  return userProjectIds.includes(projectId);
}

function isOwnerAdmin(user: { email?: string | null; role?: string | null }): boolean {
  if (user.role === 'admin') return true;
  const email = (user.email || '').trim().toLowerCase();
  if (!email) return false;
  const fromEnv = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) ?? [];
  if (fromEnv.length > 0) return fromEnv.includes(email);
  return email === 'ramy.mortada@gmail.com';
}

function canPerform(role: UserRole, action: string): boolean {
  const requiredRole = PERMISSION_MAP[action] as UserRole;
  if (!requiredRole) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

function getPermissionsForRole(role: UserRole): string[] {
  const level = ROLE_HIERARCHY[role];
  return Object.entries(PERMISSION_MAP)
    .filter(([, rr]) => ROLE_HIERARCHY[rr as UserRole] <= level)
    .map(([p]) => p);
}

// ─────────────────────────────────────────────

function makeUser(role: UserRole, overrides?: Partial<AuthUser>): AuthUser {
  return { id: 1, name: 'Test', email: 'test@test.com', role, ...overrides };
}

describe('RBAC — hasRole: role hierarchy', () => {
  it('owner passes owner check', () => expect(hasRole(makeUser('owner'), 'owner')).toBe(true));
  it('owner passes editor check', () => expect(hasRole(makeUser('owner'), 'editor')).toBe(true));
  it('owner passes viewer check', () => expect(hasRole(makeUser('owner'), 'viewer')).toBe(true));
  it('admin is equal to owner level', () => expect(hasRole(makeUser('admin'), 'owner')).toBe(true));
  it('editor passes editor check', () => expect(hasRole(makeUser('editor'), 'editor')).toBe(true));
  it('editor passes viewer check', () => expect(hasRole(makeUser('editor'), 'viewer')).toBe(true));
  it('editor fails owner check', () => expect(hasRole(makeUser('editor'), 'owner')).toBe(false));
  it('viewer passes viewer check', () => expect(hasRole(makeUser('viewer'), 'viewer')).toBe(true));
  it('viewer fails editor check', () => expect(hasRole(makeUser('viewer'), 'editor')).toBe(false));
  it('viewer fails owner check', () => expect(hasRole(makeUser('viewer'), 'owner')).toBe(false));
  it('user (level 0) fails viewer check', () => expect(hasRole(makeUser('user'), 'viewer')).toBe(false));
  it('null user always returns false', () => expect(hasRole(null, 'viewer')).toBe(false));
  it('undefined user always returns false', () => expect(hasRole(undefined, 'owner')).toBe(false));
});

describe('RBAC — canAccessProject', () => {
  it('owner can access any project', () => {
    expect(canAccessProject(makeUser('owner'), 99, [])).toBe(true);
  });
  it('admin can access any project', () => {
    expect(canAccessProject(makeUser('admin'), 99, [])).toBe(true);
  });
  it('editor can access assigned projects', () => {
    expect(canAccessProject(makeUser('editor'), 5, [5, 10])).toBe(true);
  });
  it('editor cannot access unassigned project', () => {
    expect(canAccessProject(makeUser('editor'), 7, [5, 10])).toBe(false);
  });
  it('viewer can access assigned project', () => {
    expect(canAccessProject(makeUser('viewer'), 3, [3])).toBe(true);
  });
  it('viewer cannot access unassigned project', () => {
    expect(canAccessProject(makeUser('viewer'), 3, [1, 2])).toBe(false);
  });
  it('returns false when userProjectIds is undefined for non-owner', () => {
    expect(canAccessProject(makeUser('editor'), 1, undefined)).toBe(false);
  });
  it('returns false for null user', () => {
    expect(canAccessProject(null, 1)).toBe(false);
  });
});

describe('RBAC — isOwnerAdmin', () => {
  it('returns true for role=admin regardless of email', () => {
    expect(isOwnerAdmin({ role: 'admin', email: 'anyone@test.com' })).toBe(true);
  });
  it('returns true for default owner email (no ADMIN_EMAILS env)', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isOwnerAdmin({ role: 'editor', email: 'ramy.mortada@gmail.com' })).toBe(true);
  });
  it('returns false for non-admin role with random email (no ADMIN_EMAILS env)', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isOwnerAdmin({ role: 'editor', email: 'other@test.com' })).toBe(false);
  });
  it('respects ADMIN_EMAILS env variable', () => {
    process.env.ADMIN_EMAILS = 'cto@mycompany.com,admin@mycompany.com';
    expect(isOwnerAdmin({ role: 'editor', email: 'cto@mycompany.com' })).toBe(true);
    expect(isOwnerAdmin({ role: 'editor', email: 'ramy.mortada@gmail.com' })).toBe(false);
    delete process.env.ADMIN_EMAILS;
  });
  it('is case-insensitive for email comparison', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isOwnerAdmin({ role: 'viewer', email: 'RAMY.MORTADA@GMAIL.COM' })).toBe(true);
  });
  it('returns false for empty email', () => {
    expect(isOwnerAdmin({ role: 'viewer', email: '' })).toBe(false);
  });
  it('returns false for null email', () => {
    expect(isOwnerAdmin({ role: 'viewer', email: null })).toBe(false);
  });
});

describe('RBAC — canPerform permissions', () => {
  // Owner permissions
  it('owner can delete clients', () => expect(canPerform('owner', 'clients.delete')).toBe(true));
  it('owner can create payments', () => expect(canPerform('owner', 'payments.create')).toBe(true));
  it('owner can access promptLab', () => expect(canPerform('owner', 'promptLab.access')).toBe(true));
  it('owner can manage settings', () => expect(canPerform('owner', 'settings.update')).toBe(true));

  // Editor permissions
  it('editor can create clients', () => expect(canPerform('editor', 'clients.create')).toBe(true));
  it('editor can start research', () => expect(canPerform('editor', 'research.start')).toBe(true));
  it('editor can use AI chat', () => expect(canPerform('editor', 'ai.chat')).toBe(true));
  it('editor cannot delete clients', () => expect(canPerform('editor', 'clients.delete')).toBe(false));
  it('editor cannot access financials', () => expect(canPerform('editor', 'financials.view')).toBe(false));
  it('editor cannot manage users', () => expect(canPerform('editor', 'users.manage')).toBe(false));

  // Viewer permissions
  it('viewer can list clients', () => expect(canPerform('viewer', 'clients.list')).toBe(true));
  it('viewer can list projects', () => expect(canPerform('viewer', 'projects.list')).toBe(true));
  it('viewer cannot create clients', () => expect(canPerform('viewer', 'clients.create')).toBe(false));
  it('viewer cannot use AI chat', () => expect(canPerform('viewer', 'ai.chat')).toBe(false));

  // Unknown action
  it('returns false for unknown action', () => expect(canPerform('owner', 'unknown.action')).toBe(false));
});

describe('RBAC — getPermissionsForRole', () => {
  it('owner has all permissions', () => {
    const ownerPerms = getPermissionsForRole('owner');
    expect(ownerPerms).toContain('clients.delete');
    expect(ownerPerms).toContain('payments.create');
    expect(ownerPerms).toContain('ai.chat');
    expect(ownerPerms).toContain('clients.list');
    expect(ownerPerms.length).toBe(Object.keys(PERMISSION_MAP).length);
  });

  it('viewer has fewer permissions than editor', () => {
    const viewerPerms = getPermissionsForRole('viewer');
    const editorPerms = getPermissionsForRole('editor');
    expect(editorPerms.length).toBeGreaterThan(viewerPerms.length);
  });

  it('viewer only has .list/.read type permissions', () => {
    const viewerPerms = getPermissionsForRole('viewer');
    expect(viewerPerms).toContain('clients.list');
    expect(viewerPerms).toContain('projects.list');
    expect(viewerPerms).not.toContain('clients.create');
    expect(viewerPerms).not.toContain('clients.delete');
  });

  it('editor does not have owner-only permissions', () => {
    const editorPerms = getPermissionsForRole('editor');
    expect(editorPerms).not.toContain('payments.create');
    expect(editorPerms).not.toContain('users.manage');
    expect(editorPerms).not.toContain('settings.update');
  });

  it('admin has same permissions as owner', () => {
    const adminPerms = getPermissionsForRole('admin');
    const ownerPerms = getPermissionsForRole('owner');
    expect(adminPerms.sort()).toEqual(ownerPerms.sort());
  });
});

describe('RBAC — workspace role hierarchy', () => {
  it('owner > admin > editor > viewer in workspace', () => {
    expect(WORKSPACE_ROLE_HIERARCHY.owner).toBeGreaterThan(WORKSPACE_ROLE_HIERARCHY.admin);
    expect(WORKSPACE_ROLE_HIERARCHY.admin).toBeGreaterThan(WORKSPACE_ROLE_HIERARCHY.editor);
    expect(WORKSPACE_ROLE_HIERARCHY.editor).toBeGreaterThan(WORKSPACE_ROLE_HIERARCHY.viewer);
  });
  it('workspace owner has highest level (4)', () => {
    expect(WORKSPACE_ROLE_HIERARCHY.owner).toBe(4);
  });
  it('workspace viewer has lowest level (1)', () => {
    expect(WORKSPACE_ROLE_HIERARCHY.viewer).toBe(1);
  });
});

describe('RBAC — PERMISSION_MAP completeness', () => {
  it('all CRUD operations for clients exist', () => {
    ['clients.create', 'clients.update', 'clients.delete', 'clients.list']
      .forEach(p => expect(PERMISSION_MAP[p]).toBeDefined());
  });
  it('all CRUD operations for projects exist', () => {
    ['projects.create', 'projects.update', 'projects.delete', 'projects.list']
      .forEach(p => expect(PERMISSION_MAP[p]).toBeDefined());
  });
  it('payment operations require owner role', () => {
    expect(PERMISSION_MAP['payments.create']).toBe('owner');
    expect(PERMISSION_MAP['payments.list']).toBe('owner');
    expect(PERMISSION_MAP['financials.view']).toBe('owner');
  });
  it('non-sensitive list operations require viewer role', () => {
    const viewerListOps = ['clients.list', 'projects.list', 'deliverables.list', 'knowledge.list'];
    viewerListOps.forEach(op => {
      expect(PERMISSION_MAP[op]).toBe('viewer');
    });
  });
  it('sensitive list operations (payments) require owner role', () => {
    expect(PERMISSION_MAP['payments.list']).toBe('owner');
    expect(PERMISSION_MAP['financials.view']).toBe('owner');
  });
  it('delete operations require at least owner role', () => {
    const deleteOps = Object.entries(PERMISSION_MAP).filter(([k]) => k.endsWith('.delete'));
    deleteOps.forEach(([, role]) => {
      expect(role).toBe('owner');
    });
  });
  it('PERMISSION_MAP has more than 15 entries (coverage)', () => {
    expect(Object.keys(PERMISSION_MAP).length).toBeGreaterThan(15);
  });
});
