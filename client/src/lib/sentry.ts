/**
 * Browser Sentry — optional error monitoring for the React client.
 * Initializes only when VITE_SENTRY_DSN is a non-empty string.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

export function initClientSentry(): void {
  if (initialized) return;

  const raw = import.meta.env.VITE_SENTRY_DSN;
  const dsn = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });

  initialized = true;
}

export function isSentryInitialized(): boolean {
  return initialized;
}

export { Sentry };
