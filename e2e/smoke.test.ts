/**
 * WZRD AI Smoke Test — run after every deployment.
 * 
 * Usage:
 *   npx playwright test e2e/smoke.test.ts
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
    await expect(page).toHaveTitle(/WZRD|أدوات/);
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
    expect(json).toHaveProperty('siteName');
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
    expect(body).toContain('مستشار');
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toContain('99') ; // Should show 99 EGP price
  });

  test('SEO brand-diagnosis page loads', async ({ page }) => {
    await page.goto(`${BASE}/seo/brand-diagnosis`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('تشخيص البراند');
    expect(body).toContain('سجّل مجاناً');
  });

  test('services page loads', async ({ page }) => {
    await page.goto(`${BASE}/services-info`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('Primo');
  });

  test('no debug endpoint exposed', async ({ request }) => {
    const res = await request.get(`${BASE}/api/debug/whoami`);
    // Should be 404 or redirect — not 200 with user data
    expect(res.status()).not.toBe(200);
  });
});
