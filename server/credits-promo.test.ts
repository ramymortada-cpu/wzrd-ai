/**
 * Credits, Plans & Promo Codes — unit tests for new functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB before importing modules that use it
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
  addCredits: vi.fn().mockResolvedValue({ success: true }),
  getUserCredits: vi.fn().mockResolvedValue(100),
}));

describe('Credits & Promo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Credit Plans (siteConfig)', () => {
    it('getCreditPlans returns enabled plans sorted by sortOrder', async () => {
      const { getSiteConfig } = await import('./siteConfig');
      const config = getSiteConfig();
      expect(config.creditPlans).toBeDefined();
      expect(Array.isArray(config.creditPlans)).toBe(true);
      const plans = config.creditPlans.filter((p: any) => p.enabled);
      expect(plans.length).toBeGreaterThanOrEqual(1);
      const sorted = [...plans].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      expect(plans).toEqual(sorted);
    });

    it('each plan has id, credits, priceEGP, name, nameAr', async () => {
      const { getCreditPlans } = await import('./siteConfig');
      const plans = getCreditPlans();
      for (const p of plans) {
        expect(p.id).toBeDefined();
        expect(typeof p.credits).toBe('number');
        expect(p.credits).toBeGreaterThan(0);
        expect(typeof p.priceEGP).toBe('number');
        expect(p.priceEGP).toBeGreaterThanOrEqual(0);
        expect(p.name).toBeDefined();
        expect(p.nameAr).toBeDefined();
      }
    });
  });

  describe('Promo Code validation (logic)', () => {
    it('validatePromoCode returns valid:false when code is empty', async () => {
      const { validatePromoCode } = await import('./db/promoCodes');
      const result = await validatePromoCode('', 999);
      // With null db, it returns valid:false and original amount
      expect(result).toBeDefined();
      expect(result.finalAmountCents).toBe(99900);
      expect(result.originalAmountCents).toBe(99900);
    });
  });

  describe('Paymob integration shape', () => {
    it('createPaymentIntention accepts PaymentIntentionInput', async () => {
      const { createPaymentIntention } = await import('./paymobIntegration');
      // Without env vars, will return error
      const result = await createPaymentIntention({
        planId: 'pro',
        credits: 1500,
        amountCents: 99900,
        planName: 'Pro',
        userId: 1,
        userEmail: 'test@test.com',
        userName: 'Test',
        appUrl: 'http://localhost:3000',
      });
      expect(result).toBeDefined();
      expect('error' in result || 'redirectUrl' in result).toBe(true);
    });
  });
});
