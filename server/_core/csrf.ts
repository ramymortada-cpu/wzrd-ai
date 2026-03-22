import type { Request, Response, NextFunction } from "express";
/**
 * CSRF Protection — double-submit cookie pattern.
 * 
 * How it works:
 * 1. Server sets a random CSRF token in a cookie
 * 2. Client reads the cookie and includes it in X-CSRF-Token header
 * 3. Server verifies cookie value matches header value
 * 
 * This works because:
 * - Attacker can't read cookies from a different origin (Same-Origin Policy)
 * - Attacker can't set custom headers via form submission
 */

import crypto from 'crypto';
import { logger } from './logger';

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

/** Exempt paths that don't need CSRF (public GET endpoints, webhooks, etc.) */
const EXEMPT_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generates a CSRF token and sets it as a cookie.
 * Call this on initial page load / auth success.
 */
export function setCsrfToken(res: { cookie: (name: string, value: string, opts?: object) => void }): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });
  return token;
}

/**
 * CSRF middleware — verifies the token on state-changing requests.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip safe methods
  if (EXEMPT_METHODS.includes(req.method)) {
    return next();
  }

  // Skip tRPC batch requests (they go through their own auth)
  if (req.path?.includes('/trpc/')) {
    return next();
  }

  // Skip webhook endpoints (they use their own verification)
  if (req.path?.includes('/webhooks/')) {
    return next();
  }

  // Skip CSRF token endpoint itself
  if (req.path === '/api/csrf-token') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers?.[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    logger.warn({ ip: req.ip, path: req.path }, 'CSRF token missing');
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  // Normalize to string (req.cookies/headers can return string[])
  const ct = Array.isArray(cookieToken) ? cookieToken[0] : cookieToken;
  const ht = Array.isArray(headerToken) ? headerToken[0] : headerToken;
  if (!ct || !ht || ct.length !== ht.length) {
    logger.warn({ ip: req.ip, path: req.path }, 'CSRF token invalid');
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(ct, 'utf8'), Buffer.from(ht, 'utf8'))) {
    logger.warn({ ip: req.ip, path: req.path }, 'CSRF token mismatch');
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  next();
}
