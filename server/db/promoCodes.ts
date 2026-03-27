/**
 * Promo Codes — validate and apply discounts on credit purchases.
 */

import { eq, type InferSelectModel } from 'drizzle-orm';
import { promoCodes } from '../../drizzle/schema';
import { getDb } from './index';

export type PromoCodeRow = InferSelectModel<typeof promoCodes>;

export interface PromoValidation {
  valid: boolean;
  discountPercent?: number;
  discountFixedEGP?: number;
  finalAmountCents: number;
  originalAmountCents: number;
  message?: string;
}

/**
 * Validate promo code and return discount details.
 * Does NOT increment usedCount — that happens after successful payment.
 */
export async function validatePromoCode(
  code: string,
  amountEGP: number
): Promise<PromoValidation> {
  const db = await getDb();
  if (!db) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: 'Service unavailable' };
  }

  const normalized = code.trim().toUpperCase();
  const rows = await db.select().from(promoCodes).where(eq(promoCodes.code, normalized)).limit(1);
  const promo = rows[0];

  if (!promo || !promo.enabled) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: 'Invalid or expired code' };
  }

  const now = new Date();
  if (promo.validFrom && new Date(promo.validFrom) > now) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: 'Code not yet valid' };
  }
  if (promo.validUntil && new Date(promo.validUntil) < now) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: 'Code expired' };
  }

  if (promo.maxUses !== null && (promo.usedCount || 0) >= promo.maxUses) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: 'Code usage limit reached' };
  }

  const minAmount = promo.minAmountEGP || 0;
  if (amountEGP < minAmount) {
    return { valid: false, finalAmountCents: amountEGP * 100, originalAmountCents: amountEGP * 100, message: `Minimum purchase ${minAmount} EGP required` };
  }

  const originalCents = Math.round(amountEGP * 100);
  let discountCents = 0;

  if (promo.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, promo.discountValue));
    discountCents = Math.floor(originalCents * (pct / 100));
  } else {
    discountCents = Math.min(originalCents, promo.discountValue * 100); // fixed in EGP → cents
  }

  const finalCents = Math.max(1, originalCents - discountCents);

  return {
    valid: true,
    discountPercent: promo.discountType === 'percent' ? promo.discountValue : undefined,
    discountFixedEGP: promo.discountType === 'fixed' ? promo.discountValue : undefined,
    finalAmountCents: finalCents,
    originalAmountCents: originalCents,
  };
}

/** Increment used count after successful payment */
export async function incrementPromoUsage(code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const normalized = code.trim().toUpperCase();
  const [row] = await db.select({ usedCount: promoCodes.usedCount }).from(promoCodes).where(eq(promoCodes.code, normalized)).limit(1);
  if (!row) return false;
  await db.update(promoCodes).set({ usedCount: (row.usedCount || 0) + 1 }).where(eq(promoCodes.code, normalized));
  return true;
}

/** List all promo codes (admin) */
export async function listPromoCodes(): Promise<PromoCodeRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(promoCodes).orderBy(promoCodes.createdAt);
}

/** Create promo code (admin) */
export async function createPromoCode(data: {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minAmountEGP?: number;
  maxUses?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const normalized = data.code.trim().toUpperCase();
  const [r] = await db.insert(promoCodes).values({
    code: normalized,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minAmountEGP: data.minAmountEGP ?? 0,
    maxUses: data.maxUses ?? null,
    validFrom: data.validFrom ?? null,
    validUntil: data.validUntil ?? null,
  });
  return { id: r.insertId };
}

/** Update promo code */
export async function updatePromoCode(id: number, updates: Partial<{
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minAmountEGP: number;
  maxUses: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  enabled: number;
}>) {
  const db = await getDb();
  if (!db) return false;
  await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id));
  return true;
}

/** Delete promo code */
export async function deletePromoCode(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
  return true;
}
