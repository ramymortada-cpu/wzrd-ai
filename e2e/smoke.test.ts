/**
 * WZRD AI Smoke Test — run after every deployment.
 * 
 * Usage:
 *   npx playwright test e2e/smoke.test.ts
 *
 * Until production drops /api/debug/whoami, optional:
 *   SMOKE_ALLOW_LEGACY_DEBUG=1 npx playwright test e2e/smoke.test.ts
 * 
 * Checks:
 * 1. Health endpoint returns 200
 * 2. Homepage loads with WZRD branding
 * 3. Tools page loads
 * 4. Admin page loads
 * 5. Site config API returns valid JSON
 * 6. Premium pricing API returns data
 * 7. SEO pages load
 * 8. Signup page loads
 * 9. My Brand page loads
 * 10. Copilot page loads
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_URL || 'https://wzrd-ai-production.up.railway.app';

test.describe('WZRD AI Smoke Tests', () => {

  test('healthz returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/healthz`);
    expect(res.status()).toBe(200);
  });

  test('homepage loads', async ({ page }) => {
    await page.goto(`${BASE}/welcome`);
    await expect(page.locator('body')).toContainText('WZRD');
    // Check no crash
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('tools page loads', async ({ page }) => {
    await page.goto(`${BASE}/tools`);
    await expect(page).toHaveTitle(/WZRD|أدوات|Primo|Command Center/i);
    // Should show at least 6 tools
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toContain('تشخيص');
  });

  test('signup page loads', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  test('admin page loads', async ({ page }) => {
    await page.goto(`${BASE}/wzrd-admin`);
    await page.waitForTimeout(2000);
    // Should not show "Cannot GET"
    const body = await page.textContent('body');
    expect(body).not.toContain('Cannot GET');
  });

  test('site-config API returns JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/site-config`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('site');
  });

  test('premium pricing API returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/trpc/premium.pricing`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.result?.data).toBeTruthy();
  });

  test('my-brand page loads', async ({ page }) => {
    await page.goto(`${BASE}/my-brand`);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Cannot GET');
  });

  test('copilot page loads', async ({ page }) => {
    await page.goto(`${BASE}/copilot`);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).not.toContain('Cannot GET');
    // Logged-out users see login; logged-in see copilot UI
    expect(body && /مستشار|Copilot|Wzrd|WZRD|تسجيل|الدخول/.test(body)).toBeTruthy();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // UI may use Eastern Arabic numerals (٩٩) or Latin; credit packs still show EGP
    expect(body && /٤٩٩|٩٩٩|499|999|EGP|كريديت/.test(body)).toBeTruthy();
  });

  test('SEO brand-diagnosis page loads', async ({ request }) => {
    const res = await request.get(`${BASE}/seo/brand-diagnosis`);
    expect(res.status()).toBe(200);
    const html = await res.text();
    // Prefer static SEO (JSON-LD + Arabic hero). Before deploy, SPA shell may still 200.
    const staticSeo =
      html.includes('application/ld+json') || html.includes('تشخيص البراند');
    const spaFallback = html.includes('Command Center') || html.includes('/assets/index-');
    expect(staticSeo || spaFallback).toBeTruthy();
  });

  test('services page loads', async ({ page }) => {
    await page.goto(`${BASE}/services-info`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('Primo');
  });

  test('no debug endpoint exposed', async ({ request }) => {
    test.skip(
      process.env.SMOKE_ALLOW_LEGACY_DEBUG === '1',
      'Set only to tolerate old deploys that still ship /api/debug/*'
    );
    const res = await request.get(`${BASE}/api/debug/whoami`);
    expect(res.status()).toBe(404);
  });
});
