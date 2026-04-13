/**
 * Sprint I — process `email_send_log` rows with status `queued` once `scheduledAt` (or `createdAt`) is due.
 */

import { and, eq, gte, isNull, isNotNull, lte, or } from "drizzle-orm";
import { emailSendLog, emailTemplates, users, creditTransactions } from "../drizzle/schema";
import { getDb } from "./db/index";
import { logger } from "./_core/logger";
import { isAuditFollowupTrigger, skipAuditFollowupDueToConversion } from "./emailQueueLogic";

const HOUR_MS = 60 * 60 * 1000;
const BATCH = 50;

function applyQueuePlaceholders(
  text: string,
  userName: string,
  metadata?: { score?: number; credits?: number; toolName?: string },
): string {
  return text
    .replace(/\{\{NAME\}\}/g, userName || "")
    .replace(/\{\{SCORE\}\}/g, String(metadata?.score ?? ""))
    .replace(/\{\{CREDITS\}\}/g, String(metadata?.credits ?? ""))
    .replace(/\{\{TOOL_NAME\}\}/g, String(metadata?.toolName ?? ""));
}

async function userHasPurchaseSince(userId: number, since: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.type, "purchase"),
        gte(creditTransactions.createdAt, since),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function processEmailQueueOnce(): Promise<{ processed: number; sent: number; skipped: number; failed: number }> {
  const db = await getDb();
  if (!db) {
    return { processed: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const now = new Date();

  const dueRows = await db
    .select()
    .from(emailSendLog)
    .where(
      and(
        eq(emailSendLog.status, "queued"),
        or(
          and(isNotNull(emailSendLog.scheduledAt), lte(emailSendLog.scheduledAt, now)),
          and(isNull(emailSendLog.scheduledAt), lte(emailSendLog.createdAt, now)),
        ),
      ),
    )
    .limit(BATCH);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of dueRows) {
    if (!row.templateId) {
      await db
        .update(emailSendLog)
        .set({ status: "failed", errorMessage: "missing_template" })
        .where(eq(emailSendLog.id, row.id));
      failed += 1;
      continue;
    }

    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, row.templateId)).limit(1);
    if (!template || !template.isActive) {
      await db
        .update(emailSendLog)
        .set({ status: "failed", errorMessage: "template_inactive_or_missing" })
        .where(eq(emailSendLog.id, row.id));
      failed += 1;
      continue;
    }

    let userName = "";
    if (row.userId) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, row.userId)).limit(1);
      userName = u?.name ?? "";
    }

    const auditSince = row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt));
    const hasPurchase =
      row.userId != null && isAuditFollowupTrigger(row.trigger)
        ? await userHasPurchaseSince(row.userId, auditSince)
        : false;

    const gate = skipAuditFollowupDueToConversion({
      trigger: row.trigger,
      hasPurchaseSinceAudit: hasPurchase,
    });

    if (!gate.send) {
      await db
        .update(emailSendLog)
        .set({ status: "failed", errorMessage: gate.skipReason ?? "skipped" })
        .where(eq(emailSendLog.id, row.id));
      skipped += 1;
      logger.info({ logId: row.id, userId: row.userId, reason: gate.skipReason }, "[EmailQueue] skipped queued email");
      continue;
    }

    const subjectBase = template.subjectAr || template.subject;
    const subject = applyQueuePlaceholders(subjectBase, userName);
    const html = applyQueuePlaceholders(template.html, userName);

    try {
      const { sendEmail } = await import("./wzrdEmails");
      const ok = await sendEmail({ to: row.email, subject, html });

      await db
        .update(emailSendLog)
        .set({
          status: ok ? "sent" : "failed",
          sentAt: ok ? new Date() : undefined,
          errorMessage: ok ? undefined : "Email skipped or provider not configured",
        })
        .where(eq(emailSendLog.id, row.id));

      if (ok) {
        sent += 1;
        logger.info({ logId: row.id, trigger: row.trigger }, "[EmailQueue] sent queued email");
      } else {
        failed += 1;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .update(emailSendLog)
        .set({ status: "failed", errorMessage: msg.substring(0, 500) })
        .where(eq(emailSendLog.id, row.id));
      failed += 1;
      logger.warn({ logId: row.id, err: msg }, "[EmailQueue] send failed");
    }
  }

  const processed = dueRows.length;
  return { processed, sent, skipped, failed };
}

export function startEmailQueueWorker(): void {
  setInterval(() => {
    processEmailQueueOnce().catch((err) => logger.error({ err }, "[EmailQueue] process tick failed"));
  }, HOUR_MS);
  void processEmailQueueOnce();
  logger.info("[EmailQueue] Worker scheduled (every 1h + initial run)");
}
