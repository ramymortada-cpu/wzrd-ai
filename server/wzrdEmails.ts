/**
 * WZZRD AI Email Templates
 * 
 * Templates:
 * 1. Welcome — after signup (100 credits activated)
 * 2. Tool Result — after running any AI tool
 * 3. Premium Report — after purchasing a full premium report
 * 4. PDF Guide — after downloading a guide
 * 5. Weekly Tip — newsletter content
 */

import { logger } from './_core/logger';

// ════════════════════════════════════════════
// EMAIL ANALYTICS (in-memory)
// ════════════════════════════════════════════

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalSkipped: number;
  byTemplate: Record<string, { sent: number; failed: number }>;
  recentEmails: Array<{ to: string; subject: string; status: 'sent' | 'failed' | 'skipped'; timestamp: number }>;
}

const emailStats: EmailStats = {
  totalSent: 0,
  totalFailed: 0,
  totalSkipped: 0,
  byTemplate: {},
  recentEmails: [],
};

function trackEmail(to: string, subject: string, status: 'sent' | 'failed' | 'skipped', template?: string) {
  if (status === 'sent') emailStats.totalSent++;
  else if (status === 'failed') emailStats.totalFailed++;
  else emailStats.totalSkipped++;

  if (template) {
    if (!emailStats.byTemplate[template]) emailStats.byTemplate[template] = { sent: 0, failed: 0 };
    if (status === 'sent') emailStats.byTemplate[template].sent++;
    else emailStats.byTemplate[template].failed++;
  }

  emailStats.recentEmails.unshift({ to, subject, status, timestamp: Date.now() });
  if (emailStats.recentEmails.length > 100) emailStats.recentEmails.pop();
}

/** Get email analytics (for admin panel) */
export function getEmailStats() {
  return { ...emailStats, recentEmails: emailStats.recentEmails.slice(0, 50) };
}

// ════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ════════════════════════════════════════════
// SEND (uses existing notification system)
// ════════════════════════════════════════════

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER || 'none';
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM || 'WZZRD AI <noreply@primomarca.com>';

  if (provider === 'none' || !apiKey) {
    logger.info({ to: payload.to, subject: payload.subject }, '[Email] Skipped — no provider configured');
    trackEmail(payload.to, payload.subject, 'skipped');
    return false;
  }

  try {
    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ from, to: [payload.to], subject: payload.subject, html: payload.html }),
      });
      if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
    } else if (provider === 'sendgrid') {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: from.replace(/<|>/g, '').split(' ').pop() || from, name: 'WZZRD AI' },
          subject: payload.subject,
          content: [{ type: 'text/html', value: payload.html }],
        }),
      });
      if (!res.ok) throw new Error(`SendGrid failed: ${res.status}`);
    }

    logger.info({ to: payload.to, subject: payload.subject }, '[Email] Sent successfully');
    trackEmail(payload.to, payload.subject, 'sent');
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ to: payload.to, err: msg }, '[Email] Failed to send');
    trackEmail(payload.to, payload.subject, 'failed');
    return false;
  }
}

// ════════════════════════════════════════════
// SHARED STYLES — Email client compatible
// ════════════════════════════════════════════
// Rules for email HTML:
// 1. Table-based layout (Outlook needs it)
// 2. All styles inline (Gmail strips <style> blocks)
// 3. No CSS gradients (Outlook ignores them) → use solid fallback colors
// 4. No background-clip:text (no client supports it properly)
// 5. Preheader text for inbox preview

const STYLE = {
  wrapper: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #09090b; color: #b0b0be; padding: 32px 24px;',
  // Outlook-safe: solid color fallbacks
  logo: 'font-family: "Courier New", Courier, monospace; font-size: 20px; font-weight: bold; color: #f4f4f6; letter-spacing: 3px;',
  logoAI: 'color: #6d5cff;', // Solid color fallback (no gradient)
  sub: 'font-size: 10px; color: #64647a; letter-spacing: 3px; text-transform: uppercase;',
  h1: 'font-size: 22px; font-weight: 700; color: #f4f4f6; margin: 24px 0 12px; line-height: 1.3;',
  h2: 'font-size: 16px; font-weight: 600; color: #f4f4f6; margin: 20px 0 8px;',
  p: 'font-size: 14px; line-height: 1.8; color: #b0b0be; margin: 0 0 16px 0;',
  // CTA: solid gold background (gradient doesn't work in Outlook)
  cta: 'display: inline-block; padding: 14px 28px; border-radius: 6px; background-color: #c8a24e; color: #09090b; font-weight: 700; font-size: 14px; text-decoration: none; text-align: center;',
  divider: 'border: none; border-top: 1px solid #1a1a28; margin: 24px 0;',
  footer: 'font-size: 11px; color: #64647a; text-align: center; padding-top: 16px;',
  footerLink: 'color: #9a7a3a; text-decoration: underline;',
  score: 'font-family: "Courier New", Courier, monospace; font-size: 48px; font-weight: 700; color: #6d5cff; text-align: center; padding: 16px 0;',
  finding: 'padding: 10px 14px; border: 1px solid #1a1a28; margin-bottom: 8px; border-radius: 4px; background-color: #111114;',
  findingTitle: 'font-weight: 600; color: #f4f4f6; font-size: 13px;',
  findingDetail: 'color: #b0b0be; font-size: 12px; margin-top: 2px;',
  accent: 'color: #44ddc9;',
  gold: 'color: #c8a24e;',
};

/**
 * Email wrapper — table-based layout for Outlook compatibility.
 * Includes preheader text for inbox preview.
 */
function wrapEmail(body: string, preheader: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>WZZRD AI</title>
<!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#09090b;">
${preheader ? `<div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#09090b;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
<!-- Logo -->
<tr><td style="padding:0 0 4px 0;">
  <span style="${STYLE.logo}">WZZRD <span style="${STYLE.logoAI}">AI</span></span>
</td></tr>
<tr><td style="${STYLE.sub}padding-bottom:20px;">by Primo Marca</td></tr>
<!-- Content -->
<tr><td>
${body}
</td></tr>
<!-- Footer -->
<tr><td style="${STYLE.footer}padding-top:24px;border-top:1px solid #1a1a28;">
  <p style="margin:0 0 4px;">WZZRD AI by <a href="https://primomarca.com" style="${STYLE.footerLink}">Primo Marca</a></p>
  <p style="margin:0;font-style:italic;${STYLE.gold}">"Marks Fade, MARCAS Don't."</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════

/**
 * Welcome email — sent after signup
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const body = `
<h1 style="${STYLE.h1}">Welcome, ${name}! ⚡</h1>
<p style="${STYLE.p}">Your account is ready. You have <strong style="${STYLE.accent}">100 free credits</strong> to diagnose your brand.</p>
<p style="${STYLE.p}">Pick any tool and get AI-powered insights in 30 seconds:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">🔬 Brand Diagnosis</strong> <span style="${STYLE.findingDetail}">— health score + top issues (~20 credits)</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">📦 Offer Logic Check</strong> <span style="${STYLE.findingDetail}">— package & pricing analysis (~25 credits)</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">💬 Message Check</strong> <span style="${STYLE.findingDetail}">— consistency audit (~20 credits)</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">🌐 Presence Audit</strong> <span style="${STYLE.findingDetail}">— cross-channel check (~25 credits)</span></td></tr>
</table>
<p style="text-align:center;padding-top:20px;">
  <a href="${appUrl}/tools" style="${STYLE.cta}">Start Using Your Credits →</a>
</p>`;

  return sendEmail({
    to,
    subject: `Welcome to WZZRD AI — 100 credits activated ⚡`,
    html: wrapEmail(body, `Welcome ${name}! You have 100 free credits to diagnose your brand.`),
  });
}

/**
 * Tool result email — sent after completing an AI tool
 */
export async function sendToolResultEmail(
  to: string,
  name: string,
  toolName: string,
  score: number,
  findings: Array<{ title: string; detail: string }>,
  recommendation: string,
  guideUrl: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Needs Work' : 'Critical';
  const scoreColor = score >= 70 ? '#44ddc9' : score >= 40 ? '#c8a24e' : '#ff5f57';

  const findingsHtml = findings.map(f => `
<tr><td style="${STYLE.finding}">
  <strong style="${STYLE.findingTitle}">${f.title}</strong>
  <p style="${STYLE.findingDetail}margin:4px 0 0;">${f.detail}</p>
</td></tr>`).join('');

  const body = `
<h1 style="${STYLE.h1}">${toolName} Results</h1>
<div style="${STYLE.score}color:${scoreColor};">${score}<span style="font-size:18px;color:#64647a;">/100</span></div>
<p style="text-align:center;font-size:13px;color:#64647a;margin:0 0 20px;">${label}</p>
<h2 style="${STYLE.h2}">Key Findings</h2>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  ${findingsHtml}
</table>
<p style="${STYLE.p}padding-top:16px;"><strong style="${STYLE.accent}">→ ${recommendation}</strong></p>
<hr style="${STYLE.divider}">
<p style="${STYLE.p}">Want to understand this deeper?</p>
<p style="text-align:center;">
  <a href="${appUrl}${guideUrl}" style="${STYLE.cta}">Learn How to Fix This →</a>
</p>`;

  return sendEmail({
    to,
    subject: `Your ${toolName} Score: ${score}/100 — ${label}`,
    html: wrapEmail(body, `${toolName}: ${score}/100. ${recommendation}`),
  });
}

/**
 * Premium Report email — sent after purchasing a full report
 */
export async function sendPremiumReportEmail(
  to: string,
  name: string,
  toolName: string,
  score: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const scoreColor = score >= 70 ? '#44ddc9' : score >= 40 ? '#c8a24e' : '#ff5f57';

  const body = `
<h1 style="${STYLE.h1}">Your Premium Report is Ready ✦</h1>
<p style="${STYLE.p}">Hi ${name || 'there'},</p>
<p style="${STYLE.p}">Your full Premium Report for <strong style="${STYLE.accent}">${toolName}</strong> has been generated successfully.</p>
<div style="${STYLE.score}color:${scoreColor};">${score}<span style="font-size:18px;color:#64647a;">/100</span></div>
<p style="${STYLE.p}">This comprehensive report includes:</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">📊 Detailed Pillar Analysis</strong> <span style="${STYLE.findingDetail}">— deep dive into every aspect</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">🎯 Priority Matrix</strong> <span style="${STYLE.findingDetail}">— what to fix first</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">📅 30/60/90 Day Action Plan</strong> <span style="${STYLE.findingDetail}">— step-by-step roadmap</span></td></tr>
  <tr><td style="${STYLE.finding}"><strong style="${STYLE.findingTitle}">⚡ Quick Wins</strong> <span style="${STYLE.findingDetail}">— things you can fix today</span></td></tr>
</table>
<p style="text-align:center;padding-top:20px;">
  <a href="${appUrl}/tools" style="${STYLE.cta}">View Your Premium Report →</a>
</p>
<p style="font-size:12px;color:#64647a;line-height:1.6;text-align:center;margin-top:20px;">
  Note: You can download your report as a PDF directly from the results page.
</p>`;

  return sendEmail({
    to,
    subject: `✦ Your Premium Report is Ready: ${toolName}`,
    html: wrapEmail(body, `Your full Premium Report for ${toolName} is ready to view.`),
  });
}

/**
 * PDF guide email — sent after downloading a guide
 */
export async function sendGuideEmail(to: string, guideTitle: string, guideUrl: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const body = `
<h1 style="${STYLE.h1}">📥 Your Guide Is Ready</h1>
<p style="${STYLE.p}">Here's your copy of <strong style="color:#f4f4f6;">"${guideTitle}"</strong>. It includes frameworks, examples, and actionable checklists.</p>
<p style="text-align:center;padding:16px 0;">
  <a href="${appUrl}${guideUrl}" style="${STYLE.cta}">Open Guide →</a>
</p>
<hr style="${STYLE.divider}">
<p style="font-size:12px;color:#64647a;line-height:1.6;">Tip: This guide works even better paired with our AI tools. Run a Brand Diagnosis to see where you stand, then use the guide to understand what to fix.</p>
<p style="text-align:center;padding-top:8px;">
  <a href="${appUrl}/tools" style="${STYLE.gold}font-size:13px;font-weight:600;text-decoration:none;">Use your free credits →</a>
</p>`;

  return sendEmail({
    to,
    subject: `📥 Your guide: "${guideTitle}"`,
    html: wrapEmail(body, `Download your free guide: ${guideTitle}`),
  });
}
