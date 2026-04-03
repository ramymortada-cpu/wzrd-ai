/**
 * Sentry Client-Side Error Monitoring
 * Captures unhandled React errors, unhandled promise rejections, and console errors.
 * If VITE_SENTRY_DSN is not set, Sentry is silently disabled.
 */
import * as Sentry from "@sentry/react";

export function initClientSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.info("[Sentry] VITE_SENTRY_DSN not set — client error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "production",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });

  console.info("[Sentry] Client error monitoring initialized");
}

export { Sentry };
