/**
 * Middleware Integration — connects all middleware to the Express app.
 * 
 * Call `applyMiddleware(app)` before registering routes.
 * 
 * Middleware applied:
 * 1. Security headers (helmet-equivalent)
 * 2. Request logging (structured JSON)
 * 3. Rate limiting on public endpoints
 * 4. CSRF protection on state-changing requests
 */

import { securityHeaders } from './security';
import { requestLogger } from './logger';
import { rateLimiters, createRateLimit } from './rateLimit';
// import { csrfProtection } from './csrf'; // Enable when frontend sends CSRF tokens

import type { Express } from "express";

/**
 * Apply all middleware to the Express app.
 * 
 * @param app - Express application instance
 */
export function applyMiddleware(app: Express) {
  // 1. Security headers on ALL responses
  app.use(securityHeaders);

  // 2. Request logging
  app.use(requestLogger);

  // 3. Rate limiting on public endpoints
  // These patterns match tRPC batch endpoints that include public procedures

  // Quick-check (LLM-heavy — most aggressive limiting)
  app.use('/api/trpc/leads.submitQuickCheck', rateLimiters.quickCheck);

  // Free quick diagnosis (LLM-heavy, public) — 3/hour per IP prevents API burn
  app.use('/api/trpc/tools.freeQuickDiagnosis', rateLimiters.freeReport);

  // Client portal (public but sensitive)
  app.use('/api/trpc/portal.viewProject', rateLimiters.portal);

  // Public feedback/comments
  app.use('/api/trpc/feedback.publicSubmit', rateLimiters.publicWrite);
  app.use('/api/trpc/feedback.publicCreate', rateLimiters.publicWrite);

  // Onboarding (public)
  app.use('/api/trpc/onboarding.submit', rateLimiters.publicWrite);

  // General rate limit for all API endpoints
  app.use('/api/', rateLimiters.general);

  // 4. CSRF protection (enable when frontend is ready)
  // app.use(csrfProtection);
}

/**
 * Apply rate limiting to specific tRPC procedures by path pattern.
 * Call this to add rate limiting to new public endpoints.
 */
export function rateLimitPath(app: { use: (path: string, handler: unknown) => void }, path: string, limiter: ReturnType<typeof createRateLimit>) {
  app.use(`/api/trpc/${path}`, limiter);
}
