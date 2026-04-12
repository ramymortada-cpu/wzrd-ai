/**
 * Brand Monitor — hourly tick runs observatory for clients due (Sprint F).
 * Complements manual `brandTwin.observe` / `observeAll` tRPC calls.
 */

import { listClientsDueForBrandMonitor } from "./db/clients";
import { observeClient } from "./brandObservatory";
import { logger } from "./_core/logger";

const HOUR_MS = 60 * 60 * 1000;

export async function processBrandMonitorDueOnce(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;
  try {
    const due = await listClientsDueForBrandMonitor();
    logger.info({ count: due.length }, "[BrandMonitor] due clients for observatory");

    for (const c of due) {
      try {
        await observeClient(c.id);
        processed += 1;
      } catch (err) {
        errors += 1;
        logger.warn({ err, clientId: c.id }, "[BrandMonitor] observatory run failed");
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (err) {
    logger.error({ err }, "[BrandMonitor] process tick failed (query or fatal)");
    errors += 1;
  }
  return { processed, errors };
}

export function startBrandMonitorWorker(): void {
  setInterval(() => {
    processBrandMonitorDueOnce().catch((err) =>
      logger.error({ err }, "[BrandMonitor] scheduled tick failed"),
    );
  }, HOUR_MS);
  void processBrandMonitorDueOnce();
  logger.info("[BrandMonitor] Worker scheduled (every 1h + initial run)");
}
