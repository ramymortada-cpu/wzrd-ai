/**
 * Email Automation Router — manages templates, automations, and sends.
 * STATUS: PLANNED — Not yet wired to any client UI component.
 * All endpoints are functional but no client page calls them.
 * Will be activated when the Email Automation feature is built.
 * 
 * Features:
 * 1. Email Templates CRUD — create/edit/delete HTML templates
 * 2. Automation Rules — trigger-based email flows
 * 3. Send Log — track every email with status
 * 4. Manual Send — send to individual or all subscribers
 * 5. Analytics — sent/failed/opened/clicked stats
 */

import { protectedProcedure, router } from "../_core/trpc";
import { checkOwner } from "../_core/authorization";
import { z } from "zod";
import { logger } from "../_core/logger";
import { eq, desc, sql, and } from "drizzle-orm";
import { emailTemplates, automationRules, emailSendLog, users } from "../../drizzle/schema";
import { getDb } from "../db/index";

// ════════════════════════════════════════════
// DEFAULT TEMPLATES
// ════════════════════════════════════════════

const DEFAULT_TEMPLATES = [
  {
    name: 'Welcome Email',
    nameAr: 'رسالة ترحيب',
    subject: 'Welcome to WZZRD AI — Your 100 Credits Are Ready!',
    subjectAr: 'مرحباً في WZZRD AI — ١٠٠ كريدت جاهزين!',
    type: 'welcome' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#4f46e5;font-size:24px">مرحباً في WZZRD AI! 🎉</h1>
<p>تم تفعيل حسابك وعندك <strong>١٠٠ كريدت مجاني</strong> جاهزين.</p>
<p>ابدأ بـ <strong>تشخيص البراند</strong> — هيديك صورة شاملة عن وضع البراند بتاعك.</p>
<a href="{{APP_URL}}/tools" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">ابدأ التشخيص الآن</a>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
  {
    name: 'Tool Result',
    nameAr: 'نتيجة التشخيص',
    subject: 'Your Brand Diagnosis Results Are Ready',
    subjectAr: 'نتيجة تشخيص البراند جاهزة',
    type: 'tool_result' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#4f46e5;font-size:24px">نتيجة التشخيص جاهزة 📊</h1>
<p>النتيجة: <strong style="font-size:28px;color:{{SCORE_COLOR}}">{{SCORE}}/١٠٠</strong></p>
<p>{{SUMMARY}}</p>
<a href="{{APP_URL}}/tools" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">شوف التقرير الكامل</a>
<p>عايز تقرير مفصّل أكتر؟ <a href="{{APP_URL}}/tools" style="color:#4f46e5">احصل على التقرير الـ Premium</a></p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
  {
    name: 'Follow Up (3 Days)',
    nameAr: 'متابعة بعد ٣ أيام',
    subject: 'You still have credits waiting — try a different tool',
    subjectAr: 'لسه عندك كريدت — جرّب أداة تانية',
    type: 'follow_up' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#4f46e5;font-size:24px">لسه عندك كريدت مستنياك! ⚡</h1>
<p>سجّلت من {{DAYS}} أيام ولسه عندك كريدت مش مستخدمة.</p>
<p>جرّب أداة تانية:</p>
<ul>
<li><strong>فحص منطق العرض</strong> — باكدجاتك منطقية؟</li>
<li><strong>فحص الرسالة</strong> — رسالتك متسقة؟</li>
<li><strong>فحص الحضور الرقمي</strong> — إزاي بتظهر أونلاين؟</li>
</ul>
<a href="{{APP_URL}}/tools" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">روح للأدوات</a>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
  {
    name: 'Re-engagement (7 Days)',
    nameAr: 'إعادة تفاعل بعد ٧ أيام',
    subject: 'We miss you — your brand needs attention',
    subjectAr: 'وحشتنا — البراند بتاعك محتاج اهتمام',
    type: 're_engagement' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#4f46e5;font-size:24px">البراند بتاعك محتاج اهتمام 🎯</h1>
<p>مر عليك أسبوع من غير ما تشتغل على البراند.</p>
<p>البراندات الناجحة بتتراجع لو متابعتهاش. خد دقيقة وشغّل تشخيص جديد.</p>
<a href="{{APP_URL}}/tools" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">شغّل تشخيص الآن</a>
<p>أو لو محتاج مساعدة متخصصة — <a href="{{APP_URL}}/services-info" style="color:#4f46e5">تواصل مع خبير</a></p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
  {
    name: 'Low Score Alert',
    nameAr: 'تنبيه نتيجة منخفضة',
    subject: 'Your brand scored below 40 — here\'s what to do',
    subjectAr: 'البراند بتاعك جاب أقل من ٤٠ — خطوتك الجاية',
    type: 'follow_up' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#ef4444;font-size:24px">نتيجة البراند: {{SCORE}}/١٠٠ ⚠️</h1>
<p>النتيجة دي بتقول إن فيه مشاكل أساسية محتاجة اهتمام فوري.</p>
<p><strong>أهم ٣ حاجات تعملها:</strong></p>
<ol>
<li>احصل على <a href="{{APP_URL}}/tools" style="color:#4f46e5">التقرير المفصّل (Premium)</a> عشان تفهم المشاكل بالتفصيل</li>
<li>ركّز على المشاكل اللي severity عالي الأول</li>
<li>لو محتاج مساعدة — <a href="{{APP_URL}}/services-info" style="color:#4f46e5">احجز Clarity Call مجاني</a></li>
</ol>
<a href="{{APP_URL}}/tools" style="display:inline-block;padding:14px 32px;background:#ef4444;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">شوف التقرير الكامل</a>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
  {
    name: 'Credits Running Low',
    nameAr: 'الكريدت خلصت تقريباً',
    subject: 'Your credits are running low — top up now',
    subjectAr: 'الكريدت بتاعتك قربت تخلص',
    type: 'promo' as const,
    html: `<div dir="rtl" style="font-family:'IBM Plex Sans Arabic',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
<h1 style="color:#f59e0b;font-size:24px">الكريدت بتاعتك قربت تخلص ⚡</h1>
<p>فاضلك <strong>{{CREDITS}}</strong> كريدت بس.</p>
<p>اشتري كريدت عشان تكمّل تشخيص البراند:</p>
<ul>
<li><strong>باقة ٥٠٠ كريدت</strong> — ٤٩٩ جنيه</li>
<li><strong>باقة ١٥٠٠ كريدت</strong> — ٩٩٩ جنيه (الأوفر)</li>
</ul>
<a href="{{APP_URL}}/pricing" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:50px;font-weight:bold;margin:16px 0">اشتري كريدت</a>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">WZZRD AI by WZZRD AI</p>
</div>`,
  },
];

// ════════════════════════════════════════════
// HELPER: Send email with logging
// ════════════════════════════════════════════

async function sendAndLog(params: {
  email: string;
  userId?: number;
  subject: string;
  html: string;
  templateId?: number;
  automationRuleId?: number;
  trigger?: string;
}): Promise<boolean> {
  const db = await getDb();
  const { sendEmail } = await import('../wzrdEmails');

  // Replace variables in HTML
  const appUrl = process.env.APP_URL || 'https://wzzrdai.com';
  const finalHtml = params.html
    .replace(/\{\{APP_URL\}\}/g, appUrl);

  const sent = await sendEmail({ to: params.email, subject: params.subject, html: finalHtml });

  // Log to DB
  if (db) {
    try {
      await db.insert(emailSendLog).values({
        userId: params.userId || null,
        email: params.email,
        templateId: params.templateId || null,
        automationRuleId: params.automationRuleId || null,
        subject: params.subject,
        status: sent ? 'sent' : 'failed',
        trigger: params.trigger || 'manual',
        sentAt: sent ? new Date() : null,
      });
    } catch (err) {
      logger.error({ err }, '[EmailAutomation] Failed to log send');
    }
  }

  return sent;
}

// ════════════════════════════════════════════
// ROUTER
// ════════════════════════════════════════════

export const emailAutomationRouter = router({

  // ═══ TEMPLATES ═══

  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { templates: [] };
    const rows = await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
    return { templates: rows };
  }),

  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().max(100),
      nameAr: z.string().max(100).optional(),
      subject: z.string().max(255),
      subjectAr: z.string().max(255).optional(),
      html: z.string().max(50000),
      type: z.enum(["welcome", "tool_result", "follow_up", "re_engagement", "newsletter", "promo", "custom"]),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const result = await db.insert(emailTemplates).values(input);
      return { success: true, id: result[0]?.insertId };
    }),

  updateTemplate: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().max(100).optional(),
      nameAr: z.string().max(100).optional(),
      subject: z.string().max(255).optional(),
      subjectAr: z.string().max(255).optional(),
      html: z.string().max(50000).optional(),
      isActive: z.number().int().min(0).max(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const { id, ...updates } = input;
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined) clean[k] = v; }
      if (Object.keys(clean).length > 0) {
        await db.update(emailTemplates).set(clean).where(eq(emailTemplates.id, id));
      }
      return { success: true };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id));
      return { success: true };
    }),

  /** Seed default templates if none exist */
  seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { success: false };
    const existing = await db.select({ count: sql<number>`count(*)` }).from(emailTemplates);
    if ((existing[0]?.count || 0) > 0) return { success: false, error: 'Templates already exist' };
    for (const t of DEFAULT_TEMPLATES) {
      await db.insert(emailTemplates).values(t);
    }
    return { success: true, count: DEFAULT_TEMPLATES.length };
  }),

  // ═══ AUTOMATION RULES ═══

  listRules: protectedProcedure.query(async ({ ctx }) => {
    checkOwner(ctx);
    const db = await getDb();
    if (!db) return { rules: [] };
    const rows = await db.select().from(automationRules).orderBy(desc(automationRules.createdAt));
    return { rules: rows };
  }),

  createRule: protectedProcedure
    .input(z.object({
      name: z.string().max(100),
      nameAr: z.string().max(100).optional(),
      trigger: z.enum(["signup", "first_tool_run", "low_score", "credits_low", "inactive_3d", "inactive_7d", "inactive_30d", "premium_purchase", "manual"]),
      templateId: z.number().int(),
      delayMinutes: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const result = await db.insert(automationRules).values(input);
      return { success: true, id: result[0]?.insertId };
    }),

  updateRule: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      isActive: z.number().int().min(0).max(1).optional(),
      delayMinutes: z.number().int().min(0).optional(),
      templateId: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      const { id, ...updates } = input;
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) { if (v !== undefined) clean[k] = v; }
      if (Object.keys(clean).length > 0) {
        await db.update(automationRules).set(clean).where(eq(automationRules.id, id));
      }
      return { success: true };
    }),

  deleteRule: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };
      await db.delete(automationRules).where(eq(automationRules.id, input.id));
      return { success: true };
    }),

  // ═══ MANUAL SEND ═══

  /** Send email to a specific user using a template */
  sendToUser: protectedProcedure
    .input(z.object({
      userId: z.number().int(),
      templateId: z.number().int(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };

      const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, input.userId));
      if (!user?.email) return { success: false, error: 'User has no email' };

      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, input.templateId));
      if (!template) return { success: false, error: 'Template not found' };

      const sent = await sendAndLog({
        email: user.email,
        userId: input.userId,
        subject: template.subjectAr || template.subject,
        html: template.html.replace(/\{\{NAME\}\}/g, user.name || ''),
        templateId: input.templateId,
        trigger: 'manual_admin',
      });

      return { success: sent };
    }),

  /** Send to ALL subscribers */
  sendToAll: protectedProcedure
    .input(z.object({ templateId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false, sent: 0 };

      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, input.templateId));
      if (!template) return { success: false, error: 'Template not found', sent: 0 };

      const subscribers = await db.select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.newsletterOptIn, 1));

      let sent = 0;
      for (const sub of subscribers) {
        if (!sub.email) continue;
        const ok = await sendAndLog({
          email: sub.email,
          userId: sub.id,
          subject: template.subjectAr || template.subject,
          html: template.html.replace(/\{\{NAME\}\}/g, sub.name || ''),
          templateId: input.templateId,
          trigger: 'broadcast',
        });
        if (ok) sent++;
        // Rate limit: 100ms between sends
        await new Promise(r => setTimeout(r, 100));
      }

      logger.info({ sent, total: subscribers.length }, '[EmailAutomation] Broadcast complete');
      return { success: true, sent, total: subscribers.length };
    }),

  // ═══ SEND LOG & ANALYTICS ═══

  sendLog: protectedProcedure
    .input(z.object({ limit: z.number().int().max(500).optional() }))
    .query(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { log: [], stats: { total: 0, sent: 0, failed: 0, opened: 0 } };

      const rows = await db.select().from(emailSendLog).orderBy(desc(emailSendLog.createdAt)).limit(input?.limit || 100);

      // Stats
      const [stats] = await db.select({
        total: sql<number>`count(*)`,
        sent: sql<number>`SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END)`,
        opened: sql<number>`SUM(CASE WHEN openedAt IS NOT NULL THEN 1 ELSE 0 END)`,
      }).from(emailSendLog);

      return {
        log: rows,
        stats: {
          total: stats?.total || 0,
          sent: stats?.sent || 0,
          failed: stats?.failed || 0,
          opened: stats?.opened || 0,
        },
      };
    }),

  /** Trigger an automation for a specific event */
  triggerAutomation: protectedProcedure
    .input(z.object({
      trigger: z.string().max(50),
      userId: z.number().int(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      checkOwner(ctx);
      const db = await getDb();
      if (!db) return { success: false };

      // Find matching active rules
      const rules = await db.select().from(automationRules)
        .where(and(
          eq(automationRules.trigger, input.trigger as (typeof automationRules.$inferSelect)['trigger']),
          eq(automationRules.isActive, 1),
        ));

      if (rules.length === 0) return { success: true, triggered: 0 };

      const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, input.userId));
      if (!user?.email) return { success: false, error: 'User has no email' };

      let triggered = 0;
      for (const rule of rules) {
        if (!rule.templateId) continue;

        const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, rule.templateId));
        if (!template || !template.isActive) continue;

        // Handle delay
        if (rule.delayMinutes > 0) {
          const scheduledAt = new Date(Date.now() + rule.delayMinutes * 60 * 1000);
          await db.insert(emailSendLog).values({
            userId: input.userId,
            email: user.email,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            subject: template.subjectAr || template.subject,
            status: "queued",
            trigger: input.trigger,
            scheduledAt,
          });
          triggered++;
        } else {
          // Send immediately
          const html = template.html
            .replace(/\{\{NAME\}\}/g, user.name || '')
            .replace(/\{\{SCORE\}\}/g, String(input.metadata?.score || ''))
            .replace(/\{\{CREDITS\}\}/g, String(input.metadata?.credits || ''));

          await sendAndLog({
            email: user.email,
            userId: input.userId,
            subject: template.subjectAr || template.subject,
            html,
            templateId: rule.templateId,
            automationRuleId: rule.id,
            trigger: input.trigger,
          });
          triggered++;
        }
      }

      return { success: true, triggered };
    }),
});
