/**
 * Paymob Integration — Credits Purchase (Egypt + Saudi)
 * =====================================================
 * 
 * Flow:
 * 1. User clicks "Buy Credits" → backend creates Payment Intention
 * 2. Backend returns client_secret → frontend redirects to Paymob checkout
 * 3. User pays (card, wallet, kiosk, etc.)
 * 4. Paymob sends webhook → backend verifies HMAC → credits added
 * 
 * Setup:
 * 1. Create Paymob account at https://paymob.com
 * 2. Get keys from Dashboard → Settings → Account Info
 * 3. Set env vars: PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY, PAYMOB_HMAC_SECRET
 * 4. Create integration IDs for Card + Wallet in Paymob Dashboard
 * 5. Set webhook URL in Paymob: https://your-app.com/api/webhooks/paymob
 * 
 * Docs: https://developers.paymob.com
 */

import crypto from 'crypto';
import { logger } from './_core/logger';
import type { Express, Request, Response } from 'express';
import { validatePromoCode, incrementPromoUsage } from './db/promoCodes';
import { getDb } from './db/index';
import { abandonedCarts } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// ════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════

const PAYMOB_BASE = 'https://accept.paymob.com/v1/intention';

interface PaymobPlan {
  credits: number;
  amountEGP: number;      // in EGP (whole)
  amountCents: number;     // in piasters (× 100)
  name: string;
  nameAr: string;
}

const PLANS: Record<string, PaymobPlan> = {
  starter: { credits: 500, amountEGP: 499, amountCents: 49900, name: 'Starter — 500 Credits', nameAr: 'ستارتر — 500 نقطة' },
  pro: { credits: 1500, amountEGP: 999, amountCents: 99900, name: 'Pro — 1,500 Credits', nameAr: 'برو — 1,500 نقطة' },
  agency: { credits: 5000, amountEGP: 2499, amountCents: 249900, name: 'Agency — 5,000 Credits', nameAr: 'وكالة — 5,000 نقطة' },
  single_report: { credits: 100, amountEGP: 99, amountCents: 9900, name: 'Premium Report — 100 Credits', nameAr: 'تقرير مميز — ١٠٠ كريدت' },
  bundle_6: { credits: 800, amountEGP: 499, amountCents: 49900, name: '6-Report Bundle — 800 Credits', nameAr: 'باقة ٦ تقارير — ٨٠٠ كريدت' },
  credits_500: { credits: 500, amountEGP: 499, amountCents: 49900, name: '500 Credits', nameAr: '٥٠٠ كريدت' },
  credits_1500: { credits: 1500, amountEGP: 999, amountCents: 99900, name: '1500 Credits', nameAr: '١٥٠٠ كريدت' },
};

export { PLANS as PAYMOB_PLANS };

// ════════════════════════════════════════════
// CREATE PAYMENT INTENTION
// ════════════════════════════════════════════

/**
 * Creates a Paymob Payment Intention.
 * Returns the client_secret for frontend checkout redirect.
 */
export async function createPaymentIntention(
  planId: string,
  userId: number,
  userEmail: string,
  userName: string,
  appUrl: string,
  options?: { promoCode?: string | null }
): Promise<{ clientSecret: string; publicKey: string; redirectUrl: string } | { error: string }> {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID_CARD;

  if (!secretKey || !publicKey) {
    return { error: 'Paymob not configured. Set PAYMOB_SECRET_KEY and PAYMOB_PUBLIC_KEY.' };
  }

  const plan = PLANS[planId];
  if (!plan) return { error: 'Invalid plan.' };

  const promoRaw = options?.promoCode?.trim();
  let chargeCents = plan.amountCents;
  if (promoRaw) {
    const promoCheck = await validatePromoCode(promoRaw, plan.amountEGP);
    if (!promoCheck.valid) {
      return { error: promoCheck.message || 'كود الخصم غير صالح.' };
    }
    chargeCents = promoCheck.finalAmountCents;
  }

  const integrationIds = [
    integrationId,
    process.env.PAYMOB_INTEGRATION_ID_WALLET,
  ].filter(Boolean).map(Number);

  if (integrationIds.length === 0) {
    return { error: 'No Paymob integration IDs configured.' };
  }

  try {
    const res = await fetch(PAYMOB_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: chargeCents,
        currency: 'EGP',
        payment_methods: integrationIds,
        items: [{
          name: plan.name,
          amount: chargeCents,
          description: `WZRD AI ${plan.name}`,
          quantity: 1,
        }],
        billing_data: {
          first_name: userName.split(' ')[0] || 'User',
          last_name: userName.split(' ').slice(1).join(' ') || '-',
          email: userEmail,
          phone_number: 'NA',
          apartment: 'NA',
          street: 'NA',
          building: 'NA',
          city: 'Cairo',
          country: 'EGY',
          floor: 'NA',
          state: 'NA',
        },
        extras: {
          userId: String(userId),
          planId,
          credits: String(plan.credits),
          ...(promoRaw ? { promoCode: promoRaw.toUpperCase() } : {}),
        },
        special_reference: `wzrd-${userId}-${planId}-${Date.now()}`,
        redirection_url: `${appUrl}/tools?purchase=success&plan=${planId}`,
        notification_url: `${appUrl}/api/webhooks/paymob`,
      }),
    });

    const data = await res.json();

    if (data.client_secret) {
      const redirectUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${data.client_secret}`;

      logger.info({ userId, planId, intentionId: data.id }, '[Paymob] Payment intention created');

      return {
        clientSecret: data.client_secret,
        publicKey,
        redirectUrl,
      };
    }

    logger.error({ data }, '[Paymob] Failed to create intention');
    return { error: data.message || data.detail || 'Failed to create payment. Try again.' };
  } catch (err) {
    logger.error({ err }, '[Paymob] API error');
    return { error: 'Payment service unavailable. Try again later.' };
  }
}

// ════════════════════════════════════════════
// HMAC VERIFICATION
// ════════════════════════════════════════════

/**
 * Verify Paymob webhook HMAC signature.
 * Paymob sends HMAC in query param or header.
 */
function verifyHmac(data: Record<string, unknown>, receivedHmac: string): boolean {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret) {
    logger.warn('[Paymob] HMAC secret not configured — skipping verification');
    return true; // Allow in dev, but log warning
  }

  // Paymob HMAC is calculated from specific fields concatenated in order
  const obj = (data?.obj ?? data) as Record<string, unknown>;
  const concatenated = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    (obj.order as any)?.id || '',
    obj.owner,
    obj.pending,
    (obj.source_data as any)?.pan || '',
    (obj.source_data as any)?.sub_type || '',
    (obj.source_data as any)?.type || '',
    obj.success,
  ].join('');

  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenated)
    .digest('hex');

  return calculatedHmac === receivedHmac;
}

// ════════════════════════════════════════════
// WEBHOOK HANDLER
// ════════════════════════════════════════════

/**
 * Mount Paymob webhook handler on Express.
 * Processes completed payments and adds credits.
 * 
 * Safety features:
 * - HMAC signature verification
 * - Idempotency: tracks processed transaction IDs to prevent double-crediting
 * - Retry: if addCredits fails, retries up to 3 times with delay
 */

// Idempotency guard — stores processed transaction IDs (in-memory, reset on restart)
const processedTransactions = new Set<string>();

// Webhook event log (in-memory, last 100 events)
interface WebhookEvent {
  id: string;
  transactionId: string;
  status: 'success' | 'failed' | 'duplicate' | 'invalid_hmac';
  userId: number;
  planId: string;
  credits: number;
  amountCents: number;
  timestamp: number;
  error?: string;
}
const webhookLog: WebhookEvent[] = [];

function logWebhookEvent(event: WebhookEvent) {
  webhookLog.unshift(event);
  if (webhookLog.length > 100) webhookLog.pop();
}

/** Get webhook event log (for admin panel) */
export function getWebhookLog() {
  return webhookLog.slice(0, 50);
}

async function addCreditsWithRetry(
  userId: number, credits: number, planId: string,
  transactionId: string, orderId: string, amountCents: number,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { addCredits } = await import('./db/credits');
      const result = await addCredits(userId, credits, 'purchase', `Paymob purchase: ${planId} plan`, {
        paymobTransactionId: transactionId,
        paymobOrderId: orderId,
        planId,
        amountCents,
      });
      if (result.success) {
        logger.info({ userId, planId, credits, transactionId, attempt }, '[Paymob] Credits added successfully');
        return true;
      }
      logger.warn({ userId, planId, attempt }, '[Paymob] addCredits returned false — retrying');
    } catch (err) {
      logger.error({ err, userId, planId, attempt, maxRetries }, `[Paymob] addCredits failed (attempt ${attempt}/${maxRetries})`);
    }
    // Wait before retry: 1s, 3s, 9s (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, Math.pow(3, attempt) * 1000));
    }
  }
  logger.error({ userId, planId, transactionId }, '[Paymob] CRITICAL: All retry attempts failed — credits NOT added. Manual intervention needed.');
  return false;
}

export function mountPaymobWebhook(app: Express) {
  // Transaction processed callback
  app.post('/api/webhooks/paymob', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const hmac = (req.query.hmac as string) || (req.headers['x-paymob-hmac'] as string) || '';

      // Verify HMAC
      if (!verifyHmac(body, hmac)) {
        logger.warn('[Paymob] Invalid HMAC — rejecting webhook');
        logWebhookEvent({ id: `hmac-${Date.now()}`, transactionId: '', status: 'invalid_hmac', userId: 0, planId: '', credits: 0, amountCents: 0, timestamp: Date.now() });
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      const transaction = body.obj || body;
      const transactionId = String(transaction.id || '');
      const success = transaction.success === true || transaction.success === 'true';
      const orderId = String(transaction.order?.id || transaction.order || '');
      // Smart extraction — Paymob may put extras in different locations
      const extras = 
        transaction.order?.extras ||
        transaction.extras ||
        transaction.payment_key_claims?.extra ||
        (typeof transaction.order?.merchant_order_id === 'string' && transaction.order.merchant_order_id.startsWith('{')
          ? JSON.parse(transaction.order.merchant_order_id) : null) ||
        (typeof transaction.special_reference === 'string' && transaction.special_reference.startsWith('wzrd-')
          ? (() => { const parts = transaction.special_reference.split('-'); return { userId: parts[1], planId: parts[2] }; })() : null) ||
        {};

      // Idempotency: skip if already processed
      if (transactionId && processedTransactions.has(transactionId)) {
        logger.info({ transactionId }, '[Paymob] Transaction already processed — skipping (idempotency)');
        logWebhookEvent({ id: `dup-${Date.now()}`, transactionId, status: 'duplicate', userId: 0, planId: '', credits: 0, amountCents: 0, timestamp: Date.now() });
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      if (success) {
        const userId = parseInt(extras.userId || '0');
        const planId = extras.planId || '';
        const promoCodeExtra = typeof (extras as Record<string, unknown>).promoCode === 'string'
          ? String((extras as Record<string, unknown>).promoCode)
          : '';
        // Get credits from extras, or look up from plan if missing
        let credits = parseInt(extras.credits || '0');
        if (!credits && planId && PLANS[planId]) {
          credits = PLANS[planId].credits;
        }

        if (userId && credits) {
          // Mark as processed BEFORE attempting (prevents race condition)
          if (transactionId) processedTransactions.add(transactionId);

          // Add credits with retry
          const added = await addCreditsWithRetry(
            userId, credits, planId,
            transactionId, orderId, transaction.amount_cents
          );

          logWebhookEvent({ id: `txn-${transactionId}`, transactionId, status: added ? 'success' : 'failed', userId, planId, credits, amountCents: transaction.amount_cents || 0, timestamp: Date.now(), error: added ? undefined : 'Credits add failed after retries' });

          if (added) {
            if (promoCodeExtra) {
              try {
                await incrementPromoUsage(promoCodeExtra);
              } catch (err) {
                logger.warn({ err, promoCodeExtra }, '[Paymob] incrementPromoUsage failed');
              }
            }
            try {
              const db = await getDb();
              if (db) {
                await db
                  .update(abandonedCarts)
                  .set({ completed: 1 })
                  .where(
                    and(
                      eq(abandonedCarts.userId, userId),
                      eq(abandonedCarts.productType, planId),
                      eq(abandonedCarts.completed, 0)
                    )
                  );
              }
            } catch (err) {
              logger.warn({ err, userId, planId }, '[Paymob] abandoned cart completion update failed');
            }
          } else if (transactionId) {
            processedTransactions.delete(transactionId);
          }
        }
      } else {
        const errorMsg = transaction.data?.message || 'Payment failed';
        logger.warn({ transactionId, errorMsg }, '[Paymob] Payment failed — no credits added');
        logWebhookEvent({ id: `fail-${transactionId}`, transactionId, status: 'failed', userId: 0, planId: '', credits: 0, amountCents: transaction.amount_cents || 0, timestamp: Date.now(), error: errorMsg });
      }

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error({ err }, '[Paymob] Webhook processing error');
      res.status(200).json({ received: true }); // Always 200 so Paymob doesn't retry endlessly
    }
  });

  logger.info('[Paymob] Webhook mounted at /api/webhooks/paymob');
}
