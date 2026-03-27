/**
 * Notification Service — handles in-app and email notifications.
 * 
 * Architecture:
 * 1. All events call notify() which creates an in-app notification
 * 2. If email delivery is configured, it also queues an email
 * 3. Email provider is pluggable (Resend, SendGrid, or SMTP)
 * 
 * Future: Add WhatsApp via Twilio/Meta Business API
 */

import { logger } from './logger';

// ============ TYPES ============

export interface NotificationPayload {
  type: 
    | 'deliverable_approved' | 'deliverable_changes_requested'
    | 'comment_added' | 'revision_created' 
    | 'proposal_accepted' | 'proposal_rejected'
    | 'lead_submitted' | 'portal_viewed'
    | 'pipeline_completed' | 'pipeline_failed'
    | 'general';
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  userId?: number;
  /** Optional: send email too */
  email?: {
    to: string;
    subject?: string;
  };
  /** Optional: send WhatsApp too */
  whatsapp?: {
    to: string;
  };
}

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'smtp' | 'none';
  apiKey?: string;
  from: string;
}

// ============ CONFIG ============

function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'none') as EmailConfig['provider'];
  return {
    provider,
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM || 'Primo Marca <noreply@primomarca.com>',
  };
}

// ============ DATABASE HELPER (lazy-loaded) ============

let _createNotification: ((data: unknown) => Promise<unknown>) | null = null;

/** Initialize notification system with database access */
export function initNotifications(createNotificationFn: (data: unknown) => Promise<unknown>) {
  _createNotification = createNotificationFn;
}

// ============ EMAIL SENDERS ============

async function sendEmailResend(to: string, subject: string, html: string, config: EmailConfig): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject,
        html,
      }),
    });
    return response.ok;
  } catch (err) {
    logger.error({ err, to, subject }, 'Resend email failed');
    return false;
  }
}

async function sendEmailSendGrid(to: string, subject: string, html: string, config: EmailConfig): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.from },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    return response.ok;
  } catch (err) {
    logger.error({ err, to, subject }, 'SendGrid email failed');
    return false;
  }
}

// ============ EMAIL TEMPLATE ============

function buildEmailHtml(title: string, message: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html dir="auto">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Primo Marca</h1>
  </div>
  <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0; font-size: 18px;">${title}</h2>
    <p style="color: #4b5563; line-height: 1.6;">${message}</p>
    ${ctaUrl ? `<a href="${ctaUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">View Details</a>` : ''}
  </div>
  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
    Primo Marca Command Center — Powered by Wzrd AI
  </p>
</body>
</html>`.trim();
}

// ============ MAIN NOTIFY FUNCTION ============

/**
 * Send a notification — creates in-app record and optionally sends email.
 */
export async function notify(payload: NotificationPayload): Promise<void> {
  const { type, title, message, entityType, entityId, userId, email, whatsapp } = payload;

  // 1. Create in-app notification
  if (_createNotification) {
    try {
      await _createNotification({
        type,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId || null,
        userId: userId || null,
      });
    } catch (err) {
      logger.error({ err, type, title }, 'Failed to create in-app notification');
    }
  }

  // 2. Send email if configured and requested
  if (email) {
    const config = getEmailConfig();
    if (config.provider !== 'none' && config.apiKey) {
      const subject = email.subject || title;
      const html = buildEmailHtml(title, message);

      let sent = false;
      switch (config.provider) {
        case 'resend':
          sent = await sendEmailResend(email.to, subject, html, config);
          break;
        case 'sendgrid':
          sent = await sendEmailSendGrid(email.to, subject, html, config);
          break;
      }

      if (sent) {
        logger.info({ to: email.to, type }, 'Email notification sent');
      }
    } else {
      logger.debug({ type, to: email.to }, 'Email not configured — skipping');
    }
  }

  // 3. WhatsApp (future implementation)
  if (whatsapp) {
    logger.debug({ type, to: whatsapp.to }, 'WhatsApp notifications not yet implemented');
  }
}

// ============ CONVENIENCE FUNCTIONS ============

export async function notifyDeliverableApproved(deliverableTitle: string, clientName: string, clientEmail?: string) {
  await notify({
    type: 'deliverable_approved',
    title: `Deliverable Approved: ${deliverableTitle}`,
    message: `${clientName} has approved "${deliverableTitle}".`,
    email: clientEmail ? { to: clientEmail, subject: `✅ "${deliverableTitle}" Approved` } : undefined,
  });
}

export async function notifyCommentAdded(deliverableTitle: string, authorName: string, comment: string, recipientEmail?: string) {
  await notify({
    type: 'comment_added',
    title: `New Comment on ${deliverableTitle}`,
    message: `${authorName}: "${comment.substring(0, 200)}${comment.length > 200 ? '...' : ''}"`,
    email: recipientEmail ? { to: recipientEmail } : undefined,
  });
}

export async function notifyLeadSubmitted(companyName: string, score: number, scoreLabel: string) {
  await notify({
    type: 'lead_submitted',
    title: `New Lead: ${companyName}`,
    message: `A new ${scoreLabel} lead (score: ${score}/100) submitted a quick-check. Company: ${companyName}.`,
  });
}

export async function notifyProposalDecision(proposalTitle: string, decision: string, clientName: string) {
  await notify({
    type: decision === 'accepted' ? 'proposal_accepted' : 'proposal_rejected',
    title: `Proposal ${decision}: ${proposalTitle}`,
    message: `${clientName} has ${decision} the proposal "${proposalTitle}".`,
  });
}
