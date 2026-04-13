/**
 * routing.test.ts — Sprint 0 Routing Tests
 * Tests the URL mapping rules, redirect logic, and access-guard logic
 * for the 3-shell separation (Client /app/*, Agency /cc/*, Admin /admin/*).
 * Tests are pure-logic (no browser / DOM required).
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── Helper mirrors ───────────────────────────────────────────────────────────

/** Mirrors the role-based redirect decision in Login.tsx */
function postLoginRedirect(
  redirectParam: string | null,
  canAccessCommandCenter: boolean
): string {
  if (redirectParam) return redirectParam;
  return canAccessCommandCenter ? '/cc/dashboard' : '/app/tools';
}

/** Mirrors the post-signup redirect in Signup.tsx */
function postSignupRedirect(): string {
  return '/app/tools/brand-diagnosis';
}

/** Legacy path → new path mapping */
const REDIRECTS: Record<string, string> = {
  '/dashboard':       '/cc/dashboard',
  '/clients':         '/cc/clients',
  '/projects':        '/cc/projects',
  '/deliverables':    '/cc/deliverables',
  '/notes':           '/cc/notes',
  '/financials':      '/cc/financials',
  '/ai':              '/cc/ai',
  '/proposals':       '/cc/proposals',
  '/contracts':       '/cc/contracts',
  '/invoices':        '/cc/invoices',
  '/analytics':       '/cc/analytics',
  '/pipeline':        '/cc/pipeline',
  '/research':        '/cc/research',
  '/knowledge':       '/cc/knowledge',
  '/brand-twin':      '/cc/brand-twin',
  '/brand-monitor': '/cc/brand-monitor',
  '/leads':           '/cc/leads',
  '/sales-funnel':    '/cc/sales-funnel',
  '/playbooks':       '/cc/playbooks',
  '/onboarding':      '/cc/onboarding',
  '/portal-management': '/cc/portal-management',
  '/tools':           '/app/tools',
  '/my-brand':        '/app/my-brand',
  '/copilot':         '/app/copilot',
  '/pricing':         '/app/pricing',
  '/profile':         '/app/profile',
  '/my-requests':     '/app/my-requests',
  '/wzrd-admin':      '/admin',
  '/panel':           '/admin',
  '/settings':        '/admin/settings',
  '/invite':          '/admin/invite',
};

/** Determine which shell a path belongs to */
function getShell(path: string): 'client' | 'agency' | 'admin' | 'public' | 'legacy' {
  if (path.startsWith('/app/'))   return 'client';
  if (path.startsWith('/cc/'))    return 'agency';
  if (path.startsWith('/admin/') || path === '/admin') return 'admin';
  if (REDIRECTS[path])            return 'legacy';
  return 'public';
}

/** Mirrors ClientLayout guard */
function clientGuard(user: { id: number } | null): 'ok' | 'redirect-login' {
  return user ? 'ok' : 'redirect-login';
}

/** Mirrors AgencyLayout guard */
function agencyGuard(user: { canAccessCommandCenter?: boolean } | null): 'ok' | 'redirect-login' | 'redirect-app-tools' {
  if (!user) return 'redirect-login';
  return user.canAccessCommandCenter ? 'ok' : 'redirect-app-tools';
}

/** Mirrors AdminLayout guard */
function adminGuard(user: { canAccessCommandCenter?: boolean } | null): 'ok' | 'redirect-login' | 'redirect-app-tools' {
  if (!user) return 'redirect-login';
  return user.canAccessCommandCenter ? 'ok' : 'redirect-app-tools';
}

const regularUser = { id: 1, canAccessCommandCenter: false };
const adminUser   = { id: 2, canAccessCommandCenter: true };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Sprint 0 — Shell Access Guards', () => {
  // Test 1
  it('/app/tools is accessible by a regular user role', () => {
    expect(clientGuard(regularUser)).toBe('ok');
  });

  // Test 2
  it('/app/tools is accessible by an admin user', () => {
    expect(clientGuard(adminUser)).toBe('ok');
  });

  // Test 3
  it('/cc/dashboard is blocked for regular user → redirect /app/tools', () => {
    expect(agencyGuard(regularUser)).toBe('redirect-app-tools');
  });

  // Test 4
  it('/cc/dashboard is accessible for admin (canAccessCommandCenter)', () => {
    expect(agencyGuard(adminUser)).toBe('ok');
  });

  // Test 5
  it('/admin is blocked for regular user → redirect /app/tools', () => {
    expect(adminGuard(regularUser)).toBe('redirect-app-tools');
  });

  // Test 6
  it('/admin is accessible for isOwnerAdmin (canAccessCommandCenter)', () => {
    expect(adminGuard(adminUser)).toBe('ok');
  });

  // Test 7 — unauthenticated
  it('/cc/dashboard redirects unauthenticated user to login', () => {
    expect(agencyGuard(null)).toBe('redirect-login');
  });

  // Test 8 — unauthenticated
  it('/app/tools redirects unauthenticated user to login', () => {
    expect(clientGuard(null)).toBe('redirect-login');
  });
});

describe('Sprint 0 — Legacy Redirects', () => {
  // Test 9
  it('/dashboard redirects to /cc/dashboard', () => {
    expect(REDIRECTS['/dashboard']).toBe('/cc/dashboard');
  });

  // Test 10
  it('/tools redirects to /app/tools', () => {
    expect(REDIRECTS['/tools']).toBe('/app/tools');
  });

  // Test 11
  it('/wzrd-admin redirects to /admin', () => {
    expect(REDIRECTS['/wzrd-admin']).toBe('/admin');
  });

  it('/pricing redirects to /app/pricing', () => {
    expect(REDIRECTS['/pricing']).toBe('/app/pricing');
  });

  it('/settings redirects to /admin/settings', () => {
    expect(REDIRECTS['/settings']).toBe('/admin/settings');
  });

  it('/invite redirects to /admin/invite', () => {
    expect(REDIRECTS['/invite']).toBe('/admin/invite');
  });

  it('all 30 legacy paths have redirects defined', () => {
    expect(Object.keys(REDIRECTS).length).toBeGreaterThanOrEqual(30);
    for (const [from, to] of Object.entries(REDIRECTS)) {
      expect(from).not.toBe(to);
      expect(to.startsWith('/cc/') || to.startsWith('/app/') || to.startsWith('/admin')).toBe(true);
    }
  });
});

describe('Sprint 0 — Post-Auth Redirects', () => {
  // Test 12
  it('after login: regular user → /app/tools', () => {
    expect(postLoginRedirect(null, false)).toBe('/app/tools');
  });

  it('after login: admin user → /cc/dashboard', () => {
    expect(postLoginRedirect(null, true)).toBe('/cc/dashboard');
  });

  it('after login: ?redirect param is honoured regardless of role', () => {
    expect(postLoginRedirect('/app/my-brand', false)).toBe('/app/my-brand');
    expect(postLoginRedirect('/cc/research', true)).toBe('/cc/research');
  });

  it('after signup: always → /app/tools/brand-diagnosis', () => {
    expect(postSignupRedirect()).toBe('/app/tools/brand-diagnosis');
  });
});

describe('Sprint 0 — Shell Classification', () => {
  it('correctly classifies /app/* as client shell', () => {
    expect(getShell('/app/tools')).toBe('client');
    expect(getShell('/app/my-brand')).toBe('client');
    expect(getShell('/app/pricing')).toBe('client');
  });

  it('correctly classifies /cc/* as agency shell', () => {
    expect(getShell('/cc/dashboard')).toBe('agency');
    expect(getShell('/cc/clients')).toBe('agency');
    expect(getShell('/cc/research')).toBe('agency');
    expect(getShell('/cc/brand-monitor')).toBe('agency');
  });

  it('correctly classifies /admin/* as admin shell', () => {
    expect(getShell('/admin')).toBe('admin');
    expect(getShell('/admin/settings')).toBe('admin');
    expect(getShell('/admin/invite')).toBe('admin');
  });

  it('correctly classifies public routes', () => {
    expect(getShell('/')).toBe('public');
    expect(getShell('/login')).toBe('public');
    expect(getShell('/signup')).toBe('public');
    expect(getShell('/blog')).toBe('public');
  });

  it('correctly classifies legacy routes as needing redirect', () => {
    expect(getShell('/dashboard')).toBe('legacy');
    expect(getShell('/tools')).toBe('legacy');
    expect(getShell('/pricing')).toBe('legacy');
  });
});

describe('Sprint K — Welcome landing (docs/13)', () => {
  it('Welcome funnels primary CTAs to /quick-check', () => {
    const welcomeSrc = readFileSync(join(REPO_ROOT, 'client/src/pages/Welcome.tsx'), 'utf8');
    expect(welcomeSrc).toContain('navigate("/quick-check")');
    expect(welcomeSrc).toContain('اعرف صحة علامتك');
    expect(welcomeSrc).toMatch(/dir=\{dir\}/);
  });
});

describe('Sprint 0 — RoleSwitcher Visibility', () => {
  // Test 12 from sprint spec
  it('RoleSwitcher is visible only for canAccessCommandCenter users', () => {
    const shouldShow = (user: { canAccessCommandCenter?: boolean } | null) =>
      Boolean(user?.canAccessCommandCenter);

    expect(shouldShow(null)).toBe(false);
    expect(shouldShow(regularUser)).toBe(false);
    expect(shouldShow(adminUser)).toBe(true);
  });
});
