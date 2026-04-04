/**
 * Email Automation Trigger — internal helper.
 * 
 * Call from auth.ts (signup), tools.ts (tool_run), etc.
 * Non-blocking — catches all errors silently.
 */

import { logger } from "./_core/logger";
import { getDb } from "./db/index";
import { automationRules, emailTemplates, emailSendLog, users } from "../drizzle/schema";

type EmailRuleTrigger = (typeof automationRules.$inferSelect)["trigger"];
import { eq, and } from "drizzle-orm";

interface TriggerMetadata {
  score?: number;
  credits?: number;
  toolName?: string;
  [key: string]: unknown;
}

function applyAutomationPlaceholders(
  text: string,
  userName: string,
  metadata?: TriggerMetadata,
): string {
  return text
    .replace(/\{\{NAME\}\}/g, userName || '')
    .replace(/\{\{SCORE\}\}/g, String(metadata?.score ?? ''))
    .replace(/\{\{CREDITS\}\}/g, String(metadata?.credits ?? ''))
    .replace(/\{\{TOOL_NAME\}\}/g, String(metadata?.toolName ?? ''));
}

/**
 * Fire an email automation trigger. Non-blocking — always resolves.
 * 
 * Usage:
 *   fireEmailTrigger('signup', userId, { credits: 100 })
 *   fireEmailTrigger('first_tool_run', userId, { score: 42, toolName: 'brand_diagnosis' })
 *   fireEmailTrigger('low_score', userId, { score: 32 })
 */
export async function fireEmailTrigger(
  trigger: string,
  userId: number,
  metadata?: TriggerMetadata
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Find matching active rules
    const rules = await db.select().from(automationRules)
      .where(and(eq(automationRules.trigger, trigger as EmailRuleTrigger), eq(automationRules.isActive, 1)));

    if (rules.length === 0) return;

    // Get user email
    const [user] = await db.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, userId));
    if (!user?.email) return;

    for (const rule of rules) {
      if (!rule.templateId) continue;

      const [template] = await db.select().from(emailTemplates)
        .where(eq(emailTemplates.id, rule.templateId));
      if (!template || !template.isActive) continue;

      if (rule.delayMinutes > 0) {
        // Queue for later
        await db.insert(emailSendLog).values({
          userId,
          email: user.email,
          templateId: rule.templateId,
          automationRuleId: rule.id,
          subject: template.subjectAr || template.subject,
          status: 'queued',
          trigger,
        });
      } else {
        // Send immediately — use wzrdEmails.sendEmail (Resend / SendGrid / skip if no provider)
        const name = user.name || '';
        const subjectBase = template.subjectAr || template.subject;
        const subject = applyAutomationPlaceholders(subjectBase, name, metadata);
        const html = applyAutomationPlaceholders(template.html, name, metadata);

        try {
          const { sendEmail } = await import('./wzrdEmails');
          const ok = await sendEmail({
            to: user.email,
            subject,
            html,
          });

          await db.insert(emailSendLog).values({
            userId,
            email: user.email,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            subject,
            status: ok ? 'sent' : 'failed',
            trigger,
            sentAt: ok ? new Date() : undefined,
            errorMessage: ok ? undefined : 'Email skipped or provider not configured',
          });

          if (ok) {
            logger.info({ trigger, userId, template: template.name }, 'Email automation sent');
          } else {
            logger.info({ trigger, userId, template: template.name }, 'Email automation skipped (no provider)');
          }
        } catch (sendErr: unknown) {
          const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
          await db.insert(emailSendLog).values({
            userId,
            email: user.email,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            subject,
            status: 'failed',
            trigger,
            errorMessage: msg.substring(0, 500),
          });
          logger.warn({ trigger, userId, err: msg }, 'Email automation send failed');
        }
      }
    }
  } catch (err: unknown) {
    // Never throw — this is a non-blocking helper
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg, trigger, userId }, 'fireEmailTrigger failed silently');
  }
}
