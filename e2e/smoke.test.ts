/**
 * WZZRD AI Smoke Test — run after every deployment.
 * 
 * Usage:
 *   npx playwright test e2e/smoke.test.ts
 * 
 * Checks:
 * 1. Health endpoint returns 200
 * 2. Homepage loads with WZZRD branding
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

const BASE = process.env.TEST_URL || 'https://wzzrdai.com';

test.describe('WZZRD AI Smoke Tests', () => {

  test('healthz returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/healthz`);
    expect(res.status()).toBe(200);
  });

  test('homepage loads', async ({ page }) => {
    await page.goto(`${BASE}/welcome`);
    await expect(page.locator('body')).toContainText('WZZRD');
    // Check no crash
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('tools page loads', async ({ page }) => {
    await page.goto(`${BASE}/tools`);
    await expect(page).toHaveTitle(/WZZRD|WZRD|أدوات|Command Center/i);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toMatch(/تشخيص|diagnosis|tools|أدوات/i);
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
    const siteBlock = json.site ?? json;
    expect(siteBlock?.companyName || json.siteName || json.homepage?.heroTitle).toBeTruthy();
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
    // Logged out: login gate; logged in: copilot UI — both are valid
    expect(body).toMatch(/مستشار|Copilot|كopilot|تسجيل|Wzrd|ذكاء|الدخول/i);
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // Prices may appear as Latin or Eastern Arabic numerals
    expect(body).toMatch(/EGP|كريديت|٩٩|99|٤٩٩|499|٩٩٩|999|١,٥٠٠/);
  });

  test('SEO brand-diagnosis page loads', async ({ page }) => {
    const nav = await page.goto(`${BASE}/seo/brand-diagnosis`);
    expect(nav?.status()).toBe(200);
    await page.waitForTimeout(1500);
    const body = (await page.textContent('body')) || '';
    expect(body.length).toBeGreaterThan(80);
    // Static SEO HTML or SPA fallback after deploy
    expect(
      body.includes('تشخيص') ||
        body.includes('Brand') ||
        body.includes('تسجيل') ||
        body.includes('WZZRD') || body.includes('WZRD'),
    ).toBe(true);
  });

  test('services page loads', async ({ page }) => {
    await page.goto(`${BASE}/services-info`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).toContain('WZZRD');
  });

  test('/api/debug/whoami returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/debug/whoami`);
    expect(res.status()).toBe(404);
  });
});
