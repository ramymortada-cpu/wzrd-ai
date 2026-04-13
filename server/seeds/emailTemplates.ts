/**
 * Idempotent seed for email_templates + automation_rules (DB-driven automations).
 * Safe to run on every server start — skips rows that already exist (by stable `name`).
 *
 * Note: `signup` and `first_tool_run` rules default to **inactive** to avoid duplicate
 * emails alongside `sendWelcomeEmail` / `sendToolResultEmail` in wzrdEmails.ts.
 * Enable them in admin when you switch fully to DB templates.
 */

import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index';
import { automationRules, emailTemplates } from '../../drizzle/schema';
import { logger } from '../_core/logger';

const APP = process.env.APP_URL || 'https://wzzrdai.com';

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#09090b;color:#e4e4e7;padding:32px 20px;line-height:1.6;">
<div style="max-width:520px;margin:0 auto;">
<p style="font-size:11px;letter-spacing:3px;color:#64647a;text-transform:uppercase;">WZZRD AI</p>
${inner}
<p style="margin-top:28px;padding-top:20px;border-top:1px solid #27272f;font-size:12px;color:#71717a;">
  <a href="${APP}/tools" style="color:#818cf8;">Tools</a>
  &nbsp;·&nbsp;
  <a href="${APP}/pricing" style="color:#818cf8;">Pricing</a>
  &nbsp;·&nbsp;
  <a href="${APP}" style="color:#818cf8;">wzzrd.ai</a>
</p>
</div>
</body></html>`;
}

const TEMPLATE_ROWS: Array<{
  name: string;
  nameAr: string;
  subject: string;
  subjectAr: string;
  type: 'welcome' | 'tool_result' | 'follow_up' | 're_engagement' | 'newsletter' | 'promo' | 'custom';
  html: string;
}> = [
  {
    name: 'sprint5_welcome_automation',
    nameAr: 'ترحيب أتمتة',
    subject: 'Welcome to WZZRD AI — Your brand diagnosis awaits',
    subjectAr: 'مرحباً بك في WZZRD AI — تشخيص علامتك ينتظرك',
    type: 'welcome',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">Welcome, {{NAME}}!</h1>
<p style="color:#a1a1aa;font-size:15px;">Your account is ready with <strong style="color:#34d399;">{{CREDITS}}</strong> free credits.</p>
<p style="color:#a1a1aa;font-size:15px;">Run your first AI diagnosis in under a minute — pick a tool and get a clear score plus actionable fixes.</p>
<p style="margin-top:24px;">
  <a href="${APP}/tools" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">Start your first diagnosis →</a>
</p>`),
  },
  {
    name: 'sprint5_low_credits',
    nameAr: 'كريدت منخفض',
    subject: "You're running low on credits",
    subjectAr: 'رصيد الكريدت قليل',
    type: 're_engagement',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">Low balance</h1>
<p style="color:#a1a1aa;font-size:15px;">Hi {{NAME}}, you have <strong style="color:#fbbf24;">{{CREDITS}}</strong> credits left — not enough for most full diagnoses.</p>
<p style="color:#a1a1aa;font-size:15px;">Top up so you can keep running tools and unlock premium reports when you need them.</p>
<p style="margin-top:24px;">
  <a href="${APP}/pricing" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">View pricing →</a>
</p>`),
  },
  {
    name: 'sprint5_diagnosis_complete',
    nameAr: 'اكتمال التشخيص',
    subject: 'Your {{TOOL_NAME}} diagnosis is ready',
    subjectAr: 'تشخيص {{TOOL_NAME}} جاهز',
    type: 'tool_result',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">{{TOOL_NAME}} results</h1>
<p style="color:#a1a1aa;font-size:15px;">Hi {{NAME}}, your diagnosis is ready.</p>
<p style="font-size:42px;font-weight:800;color:#818cf8;text-align:center;margin:20px 0;">{{SCORE}}<span style="font-size:18px;color:#71717a;">/100</span></p>
<p style="color:#a1a1aa;font-size:15px;">Open WZZRD AI to see full findings, action items, and next steps.</p>
<p style="margin-top:24px;">
  <a href="${APP}/tools" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">View results →</a>
</p>`),
  },
  {
    name: 'sprint5_inactive_3d',
    nameAr: 'خمول ٣ أيام',
    subject: 'Your brand is waiting for you',
    subjectAr: 'علامتك مستنياك',
    type: 're_engagement',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">Still there, {{NAME}}?</h1>
<p style="color:#a1a1aa;font-size:15px;">It’s been a few days since your last visit. Your credits are ready whenever you want to run another check.</p>
<p style="margin-top:24px;">
  <a href="${APP}/tools" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">Back to tools →</a>
</p>`),
  },
  {
    name: 'sprint5_inactive_7d',
    nameAr: 'خمول ٧ أيام',
    subject: "Don't let your brand fall behind",
    subjectAr: 'ما تسيبش علامتك تتأخر',
    type: 're_engagement',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">New on WZZRD AI</h1>
<p style="color:#a1a1aa;font-size:15px;">Hi {{NAME}}, we’ve been shipping improvements — deeper diagnoses, premium reports, and clearer action plans.</p>
<p style="color:#a1a1aa;font-size:15px;">Take 60 seconds to run a fresh tool and see where your brand stands.</p>
<p style="margin-top:24px;">
  <a href="${APP}/tools" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">Run a diagnosis →</a>
</p>`),
  },
  {
    name: 'sprint5_inactive_30d',
    nameAr: 'خمول ٣٠ يوم',
    subject: 'We miss you at WZZRD AI',
    subjectAr: 'بنفتقدك في WZZRD AI',
    type: 're_engagement',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">We miss you, {{NAME}}</h1>
<p style="color:#a1a1aa;font-size:15px;">It’s been a while! Jump back in — run a free preview on any tool, then unlock the full report when you’re ready.</p>
<p style="margin-top:24px;">
  <a href="${APP}/tools" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;font-size:14px;">Return to WZZRD AI →</a>
</p>`),
  },
  {
    name: 'sprint_i_full_audit_followup_48h',
    nameAr: 'متابعة بعد التحليل الشامل ٤٨ ساعة',
    subject: 'Your full brand audit — next steps inside',
    subjectAr: 'تحليلك الشامل — الخطوة الجاية',
    type: 'follow_up',
    html: shell(`
<h1 style="color:#f4f4f6;font-size:22px;margin:16px 0 12px;">Hi {{NAME}},</h1>
<p style="color:#a1a1aa;font-size:15px;">A couple of days ago you ran a <strong style="color:#fafafa;">full brand audit</strong> on WZZRD AI.</p>
<p style="color:#a1a1aa;font-size:15px;">If you’re ready to go deeper — unlock more credits, explore pricing, or run another audit anytime.</p>
<p style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px;">
  <a href="${APP}/app/pricing" style="display:inline-block;background:#6366f1;color:#fff;font-weight:700;padding:14px 24px;border-radius:9999px;text-decoration:none;font-size:14px;">Pricing</a>
  <a href="${APP}/app/full-audit" style="display:inline-block;background:#27272a;color:#e4e4e7;font-weight:700;padding:14px 24px;border-radius:9999px;text-decoration:none;font-size:14px;">Full audit</a>
</p>`),
  },
];

type TriggerName =
  | 'signup'
  | 'first_tool_run'
  | 'credits_low'
  | 'inactive_3d'
  | 'inactive_7d'
  | 'inactive_30d'
  | 'audit_followup_48h';

const RULE_ROWS: Array<{
  name: string;
  nameAr: string;
  trigger: TriggerName;
  templateName: string;
  delayMinutes: number;
  isActive: number;
}> = [
  { name: 'sprint5_rule_signup', nameAr: 'قاعدة التسجيل', trigger: 'signup', templateName: 'sprint5_welcome_automation', delayMinutes: 0, isActive: 0 },
  { name: 'sprint5_rule_credits_low', nameAr: 'قاعدة كريدت منخفض', trigger: 'credits_low', templateName: 'sprint5_low_credits', delayMinutes: 0, isActive: 1 },
  { name: 'sprint5_rule_first_tool', nameAr: 'قاعدة أول تشخيص', trigger: 'first_tool_run', templateName: 'sprint5_diagnosis_complete', delayMinutes: 0, isActive: 0 },
  { name: 'sprint5_rule_inactive_3d', nameAr: 'خمول ٣ أيام', trigger: 'inactive_3d', templateName: 'sprint5_inactive_3d', delayMinutes: 0, isActive: 1 },
  { name: 'sprint5_rule_inactive_7d', nameAr: 'خمول ٧ أيام', trigger: 'inactive_7d', templateName: 'sprint5_inactive_7d', delayMinutes: 0, isActive: 1 },
  { name: 'sprint5_rule_inactive_30d', nameAr: 'خمول ٣٠ يوم', trigger: 'inactive_30d', templateName: 'sprint5_inactive_30d', delayMinutes: 0, isActive: 1 },
  {
    name: 'sprint_i_rule_audit_followup_48h',
    nameAr: 'متابعة التحليل الشامل ٤٨ ساعة',
    trigger: 'audit_followup_48h',
    templateName: 'sprint_i_full_audit_followup_48h',
    delayMinutes: 48 * 60,
    isActive: 1,
  },
];

async function ensureTemplate(row: (typeof TEMPLATE_ROWS)[0]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const found = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.name, row.name)).limit(1);
  if (found[0]?.id) return found[0].id;

  await db.insert(emailTemplates).values({
    name: row.name,
    nameAr: row.nameAr,
    subject: row.subject,
    subjectAr: row.subjectAr,
    html: row.html,
    type: row.type,
    isActive: 1,
  });

  const again = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.name, row.name)).limit(1);
  if (!again[0]?.id) throw new Error(`Failed to insert template ${row.name}`);
  return again[0].id;
}

async function ensureRule(
  row: (typeof RULE_ROWS)[0],
  templateIdByName: Map<string, number>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');

  const existing = await db.select({ id: automationRules.id }).from(automationRules).where(eq(automationRules.name, row.name)).limit(1);
  if (existing[0]) return;

  const templateId = templateIdByName.get(row.templateName);
  if (!templateId) throw new Error(`Missing template id for ${row.templateName}`);

  await db.insert(automationRules).values({
    name: row.name,
    nameAr: row.nameAr,
    trigger: row.trigger,
    templateId,
    delayMinutes: row.delayMinutes,
    isActive: row.isActive,
  });
}

/**
 * Insert default email templates and automation rules if missing.
 */
export async function seedEmailTemplates(): Promise<{ templatesSeeded: number; rulesSeeded: number }> {
  const db = await getDb();
  if (!db) {
    logger.warn('[seedEmailTemplates] No database — skipped');
    return { templatesSeeded: 0, rulesSeeded: 0 };
  }

  let templatesSeeded = 0;
  const templateIdByName = new Map<string, number>();

  for (const row of TEMPLATE_ROWS) {
    const before = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.name, row.name)).limit(1);
    const id = await ensureTemplate(row);
    templateIdByName.set(row.name, id);
    if (!before[0]) templatesSeeded++;
  }

  let rulesSeeded = 0;
  for (const row of RULE_ROWS) {
    const before = await db.select({ id: automationRules.id }).from(automationRules).where(eq(automationRules.name, row.name)).limit(1);
    await ensureRule(row, templateIdByName);
    if (!before[0]) rulesSeeded++;
  }

  logger.info({ templatesSeeded, rulesSeeded }, '[seedEmailTemplates] Done');
  return { templatesSeeded, rulesSeeded };
}

/** CLI: `pnpm seed:email-templates` */
async function cliMain() {
  await seedEmailTemplates();
  process.exit(0);
}

const isCli =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  void cliMain().catch((err: unknown) => {
    logger.error({ err }, "[EmailTemplates] Seed failed");
    process.exit(1);
  });
}
