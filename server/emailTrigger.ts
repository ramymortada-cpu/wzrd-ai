/**
 * Email Automation Trigger — internal helper.
 * 
 * Call from auth.ts (signup), tools.ts (tool_run), etc.
 * Non-blocking — catches all errors silently.
 */

import { logger } from "./_core/logger";
import { getDb } from "./db";
import { automationRules, emailTemplates, emailSendLog, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface TriggerMetadata {
  score?: number;
  credits?: number;
  toolName?: string;
  [key: string]: unknown;
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
      .where(and(eq(automationRules.trigger, trigger as any), eq(automationRules.isActive, 1)));

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
        // Send immediately
        let html = template.html
          .replace(/\{\{NAME\}\}/g, user.name || '')
          .replace(/\{\{SCORE\}\}/g, String(metadata?.score || ''))
          .replace(/\{\{CREDITS\}\}/g, String(metadata?.credits || ''))
          .replace(/\{\{TOOL_NAME\}\}/g, String(metadata?.toolName || ''));

        // Try to send (Resend HTTP API — no resend npm package)
        try {
          const apiKey = process.env.EMAIL_API_KEY;
          const from = process.env.EMAIL_FROM || 'WZRD AI <noreply@wzrd.ai>';
          if (!apiKey) throw new Error('EMAIL_API_KEY not set');
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              from,
              to: [user.email],
              subject: template.subjectAr || template.subject,
              html,
            }),
          });
          if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);

          await db.insert(emailSendLog).values({
            userId,
            email: user.email,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            subject: template.subjectAr || template.subject,
            status: 'sent',
            trigger,
            sentAt: new Date(),
          });

          logger.info({ trigger, userId, template: template.name }, 'Email automation sent');
        } catch (sendErr: any) {
          await db.insert(emailSendLog).values({
            userId,
            email: user.email,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            subject: template.subjectAr || template.subject,
            status: 'failed',
            trigger,
            errorMessage: sendErr.message?.substring(0, 500),
          });
          logger.warn({ trigger, userId, err: sendErr.message }, 'Email automation send failed');
        }
      }
    }
  } catch (err: any) {
    // Never throw — this is a non-blocking helper
    logger.error({ err: err.message, trigger, userId }, 'fireEmailTrigger failed silently');
  }
}
