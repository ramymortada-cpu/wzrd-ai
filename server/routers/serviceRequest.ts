/**
 * Service Requests Router — client project tracking like shipping status.
 * 
 * Client endpoints:
 * - serviceRequest.myRequests → list all my service requests
 * - serviceRequest.getTimeline → get updates/timeline for a request
 * - serviceRequest.getFiles → get deliverable files
 * - serviceRequest.submitRequest → create a new service request
 * 
 * Admin endpoints:
 * - serviceRequest.updateStatus → change status + add timeline entry
 * - serviceRequest.addUpdate → add note/file/meeting to timeline
 * - serviceRequest.listAll → list all requests (admin view)
 */

import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { logger } from "../_core/logger";
import { getDb } from "../db/index";
import { serviceRequests, requestUpdates, requestFiles, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// Status labels (Arabic + English)
const STATUS_LABELS: Record<string, { ar: string; en: string; icon: string; color: string }> = {
  received:            { ar: 'تم استلام الطلب', en: 'Request Received', icon: '📩', color: '#6366f1' },
  reviewing:           { ar: 'جاري المراجعة', en: 'Under Review', icon: '👀', color: '#8b5cf6' },
  info_needed:         { ar: 'محتاجين معلومات إضافية', en: 'Info Needed', icon: '❓', color: '#f59e0b' },
  meeting_scheduled:   { ar: 'اجتماع محدد', en: 'Meeting Scheduled', icon: '📅', color: '#06b6d4' },
  in_progress:         { ar: 'جاري التنفيذ', en: 'In Progress', icon: '⚙️', color: '#3b82f6' },
  internal_review:     { ar: 'مراجعة داخلية', en: 'Internal Review', icon: '🔍', color: '#8b5cf6' },
  revision:            { ar: 'تعديلات مطلوبة', en: 'Revision', icon: '✏️', color: '#f59e0b' },
  ready_for_delivery:  { ar: 'جاهز للتسليم', en: 'Ready for Delivery', icon: '📦', color: '#10b981' },
  delivered:           { ar: 'تم التسليم', en: 'Delivered', icon: '✅', color: '#22c55e' },
  completed:           { ar: 'مكتمل', en: 'Completed', icon: '🏆', color: '#059669' },
};

/**
 * Send status update email to client via Resend HTTP API.
 * Non-blocking — catches all errors.
 */
async function sendStatusEmail(opts: {
  userId: number;
  requestNumber: string;
  newStatus: string;
  titleAr: string;
  detailAr?: string;
  meetingLink?: string;
  meetingDate?: string;
  fileUrl?: string;
  fileName?: string;
}): Promise<void> {
  try {
    const apiKey = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM || 'WZZRD AI <noreply@wzzrdai.com>';
    if (!apiKey) { logger.warn('EMAIL_API_KEY not set — skipping status email'); return; }

    const db = await getDb();
    if (!db) return;

    const [user] = await db.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, opts.userId));
    if (!user?.email) return;

    const label = STATUS_LABELS[opts.newStatus] || STATUS_LABELS.received;
    const appUrl = process.env.APP_URL || 'https://wzzrdai.com';

    // Build email body
    let extraHtml = '';
    if (opts.meetingLink) {
      const dateStr = opts.meetingDate ? new Date(opts.meetingDate).toLocaleString('ar-EG') : '';
      extraHtml += `<div style="margin:16px 0;padding:16px;background:#eff6ff;border-radius:12px;border:1px solid #dbeafe;">
        <strong style="color:#1d4ed8;">📅 اجتماع أونلاين</strong>
        ${dateStr ? `<br><span style="color:#3b82f6;font-size:14px;">${dateStr}</span>` : ''}
        <br><a href="${opts.meetingLink}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">انضم للاجتماع ←</a>
      </div>`;
    }
    if (opts.fileUrl) {
      extraHtml += `<div style="margin:16px 0;padding:16px;background:#f0fdf4;border-radius:12px;border:1px solid #dcfce7;">
        <strong style="color:#16a34a;">📎 ملف جديد</strong>
        <br><a href="${opts.fileUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">حمّل ${opts.fileName || 'الملف'} ←</a>
      </div>`;
    }

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
      <div style="max-width:520px;margin:0 auto;padding:24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:32px;">${label.icon}</span>
          </div>
          <h2 style="color:#0f172a;font-size:20px;text-align:center;margin:0 0 8px;">
            ${opts.titleAr}
          </h2>
          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0 0 20px;">
            طلب رقم #${opts.requestNumber}
          </p>
          <div style="background:${label.color}15;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
            <span style="font-size:14px;font-weight:bold;color:${label.color};">
              ${label.icon} ${label.ar}
            </span>
          </div>
          ${opts.detailAr ? `<p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 16px;">${opts.detailAr}</p>` : ''}
          ${extraHtml}
          <div style="text-align:center;margin-top:24px;">
            <a href="${appUrl}/my-requests" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;border-radius:100px;text-decoration:none;font-weight:bold;font-size:14px;">
              تابع طلبك ←
            </a>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">
          WZZRD AI by Primo Marca
        </p>
      </div>
    </body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: user.email,
        subject: `${label.icon} ${opts.titleAr} — طلب #${opts.requestNumber}`,
        html,
      }),
    });

    if (res.ok) {
      logger.info({ userId: opts.userId, requestNumber: opts.requestNumber, status: opts.newStatus }, 'Status email sent');
    } else {
      const errText = await res.text().catch(() => 'unknown');
      logger.warn({ status: res.status, body: errText }, 'Status email failed');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, 'sendStatusEmail failed silently');
  }
}

const STATUS_ORDER = ['received', 'reviewing', 'info_needed', 'meeting_scheduled', 'in_progress', 'internal_review', 'revision', 'ready_for_delivery', 'delivered', 'completed'];

function generateRequestNumber(): string {
  const prefix = 'PM';
  const date = new Date();
  const yr = date.getFullYear().toString().slice(-2);
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${yr}${mo}-${rand}`;
}

export const serviceRequestRouter = router({

  /** Client: list my service requests */
  myRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const requests = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.userId, ctx.user!.id))
        .orderBy(desc(serviceRequests.createdAt))
        .limit(20);

      return requests.map((r: (typeof requests)[number]) => ({
        ...r,
        statusLabel: STATUS_LABELS[r.status] || STATUS_LABELS.received,
        statusOrder: STATUS_ORDER,
        currentStep: STATUS_ORDER.indexOf(r.status),
      }));
    }),

  /** Client: get timeline for a specific request */
  getTimeline: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { request: null, updates: [], files: [] };

      // Verify ownership
      const [request] = await db.select()
        .from(serviceRequests)
        .where(and(eq(serviceRequests.id, input.requestId), eq(serviceRequests.userId, ctx.user!.id)));

      if (!request) return { request: null, updates: [], files: [] };

      const updates = await db.select()
        .from(requestUpdates)
        .where(and(eq(requestUpdates.requestId, input.requestId), eq(requestUpdates.isClientVisible, 1)))
        .orderBy(desc(requestUpdates.createdAt));

      const files = await db.select()
        .from(requestFiles)
        .where(eq(requestFiles.requestId, input.requestId))
        .orderBy(desc(requestFiles.createdAt));

      return {
        request: {
          ...request,
          statusLabel: STATUS_LABELS[request.status] || STATUS_LABELS.received,
          statusOrder: STATUS_ORDER,
          currentStep: STATUS_ORDER.indexOf(request.status),
        },
        updates: updates.map((u: (typeof updates)[number]) => ({
          ...u,
          statusLabel: STATUS_LABELS[u.status] || null,
        })),
        files,
      };
    }),

  /** Client: submit a new service request */
  submitRequest: protectedProcedure
    .input(z.object({
      serviceType: z.string().min(1).max(100),
      serviceTypeAr: z.string().min(1).max(100),
      description: z.string().max(2000).optional(),
      sourceDiagnosisId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      const requestNumber = generateRequestNumber();

      await db.insert(serviceRequests).values({
        userId: ctx.user!.id,
        requestNumber,
        serviceType: input.serviceType,
        serviceTypeAr: input.serviceTypeAr,
        status: 'received',
        description: input.description || null,
        sourceDiagnosisId: input.sourceDiagnosisId || null,
      });

      // Auto-create first timeline entry
      const [inserted] = await db.select()
        .from(serviceRequests)
        .where(eq(serviceRequests.requestNumber, requestNumber));

      if (inserted) {
        await db.insert(requestUpdates).values({
          requestId: inserted.id,
          status: 'received',
          title: 'Request Received',
          titleAr: 'تم استلام طلبك',
          detail: `Your service request #${requestNumber} has been received. Our team will review it within 24 hours.`,
          detailAr: `تم استلام طلبك رقم #${requestNumber}. فريقنا هيراجعه خلال ٢٤ ساعة.`,
          updateType: 'status_change',
          createdBy: 'system',
        });
      }

      logger.info({ userId: ctx.user!.id, requestNumber, serviceType: input.serviceType }, 'New service request submitted');

      return { success: true, requestNumber };
    }),

  /** Admin: update request status */
  updateStatus: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      newStatus: z.string().min(1).max(50),
      title: z.string().min(1).max(255),
      titleAr: z.string().min(1).max(255),
      detail: z.string().max(2000).optional(),
      detailAr: z.string().max(2000).optional(),
      estimatedDelivery: z.string().optional(),
      fileUrl: z.string().max(500).optional(),
      fileName: z.string().max(255).optional(),
      meetingLink: z.string().max(500).optional(),
      meetingDate: z.string().optional(),
      isClientVisible: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Update request status
      await db.update(serviceRequests)
        .set({
          status: input.newStatus as (typeof serviceRequests.$inferSelect)['status'],
          ...(input.estimatedDelivery ? { estimatedDelivery: new Date(input.estimatedDelivery) } : {}),
          ...(input.newStatus === 'delivered' ? { actualDelivery: new Date() } : {}),
        })
        .where(eq(serviceRequests.id, input.requestId));

      // Determine update type
      let updateType: 'status_change' | 'info_request' | 'file_upload' | 'meeting' | 'note' | 'delivery' = 'status_change';
      if (input.newStatus === 'info_needed') updateType = 'info_request';
      if (input.fileUrl) updateType = 'file_upload';
      if (input.meetingLink) updateType = 'meeting';
      if (input.newStatus === 'delivered') updateType = 'delivery';

      // Add timeline entry
      await db.insert(requestUpdates).values({
        requestId: input.requestId,
        status: input.newStatus,
        title: input.title,
        titleAr: input.titleAr,
        detail: input.detail || null,
        detailAr: input.detailAr || null,
        updateType,
        fileUrl: input.fileUrl || null,
        fileName: input.fileName || null,
        meetingLink: input.meetingLink || null,
        meetingDate: input.meetingDate ? new Date(input.meetingDate) : null,
        isClientVisible: input.isClientVisible ? 1 : 0,
        createdBy: ctx.user?.name || 'admin',
      });

      // If file uploaded, also add to request_files
      if (input.fileUrl && input.fileName) {
        await db.insert(requestFiles).values({
          requestId: input.requestId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          uploadedBy: 'team',
        });
      }

      logger.info({ requestId: input.requestId, newStatus: input.newStatus }, 'Service request status updated');

      // Send email notification to client (non-blocking)
      if (input.isClientVisible) {
        const [req] = await db.select({
          userId: serviceRequests.userId,
          requestNumber: serviceRequests.requestNumber,
        }).from(serviceRequests).where(eq(serviceRequests.id, input.requestId));

        if (req) {
          sendStatusEmail({
            userId: req.userId,
            requestNumber: req.requestNumber,
            newStatus: input.newStatus,
            titleAr: input.titleAr,
            detailAr: input.detailAr,
            meetingLink: input.meetingLink,
            meetingDate: input.meetingDate,
            fileUrl: input.fileUrl,
            fileName: input.fileName,
          }).catch(() => { /* intentional: fire-and-forget email */ }); // Fire-and-forget
        }
      }

      return { success: true };
    }),

  /** Admin: list all requests */
  listAll: protectedProcedure
    .query(async ({ ctx: _ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const all = await db.select()
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(100);

      return all.map((r: (typeof all)[number]) => ({
        ...r,
        statusLabel: STATUS_LABELS[r.status] || STATUS_LABELS.received,
      }));
    }),

  /** Get status labels config */
  statusConfig: protectedProcedure
    .query(() => ({
      labels: STATUS_LABELS,
      order: STATUS_ORDER,
    })),
});
