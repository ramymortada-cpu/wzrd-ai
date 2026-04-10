/**
 * Alerting — sends critical security/abuse notifications via Slack webhook.
 * Graceful: if SLACK_ALERT_WEBHOOK is not set, logs only (no crash).
 */

import { logger } from './logger';

export async function sendAlert(message: string, data?: Record<string, unknown>): Promise<void> {
  const webhook = process.env.SLACK_ALERT_WEBHOOK;

  logger.error({ alert: message, ...data }, '[ALERT] ' + message);

  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *WZZRD AI Alert*\n${message}${data ? '\n```' + JSON.stringify(data, null, 2) + '```' : ''}`,
      }),
    });
  } catch {
    // Fire-and-forget — never crash the server for an alert
  }
}

/** Per-user hourly LLM call counter (in-memory, resets on restart) */
const userHourlyCalls = new Map<number, { count: number; windowStart: number }>();
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const ABUSE_THRESHOLD_PER_HOUR = 50;

/**
 * Track LLM usage and fire alert if abuse detected.
 * Call after every successful LLM invocation.
 */
export function trackLLMUsage(userId: number): void {
  const now = Date.now();
  const entry = userHourlyCalls.get(userId);

  if (!entry || now - entry.windowStart > HOURLY_WINDOW_MS) {
    userHourlyCalls.set(userId, { count: 1, windowStart: now });
    return;
  }

  entry.count++;

  if (entry.count === ABUSE_THRESHOLD_PER_HOUR) {
    sendAlert(`Possible API abuse: user ${userId} made ${entry.count} LLM calls in 1 hour`, {
      userId,
      callsThisHour: entry.count,
    }).catch(() => {});
  }
}

/** Clean up old entries every hour to prevent memory leak */
setInterval(() => {
  const cutoff = Date.now() - HOURLY_WINDOW_MS;
  for (const [uid, entry] of userHourlyCalls.entries()) {
    if (entry.windowStart < cutoff) userHourlyCalls.delete(uid);
  }
}, HOURLY_WINDOW_MS).unref?.();
