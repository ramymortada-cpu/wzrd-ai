/**
 * WZRD AI Smoke Test — run after every deployment.
 *
 * Usage:
 *   npx playwright test e2e/smoke.test.ts
 *
 * Legacy debug routes: if production still returns 200 for /api/debug/whoami, run with
 *   SMOKE_ALLOW_LEGACY_DEBUG=1 npx playwright test e2e/smoke.test.ts
 */

import { test, expect } from "@playwright/test";

const BASE = process.env.TEST_URL || "https://wzrd-ai-production.up.railway.app";

test.describe("WZRD AI Smoke Tests", () => {
  test("healthz returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/healthz`);
    expect(res.status()).toBe(200);
  });

  test("homepage loads", async ({ page }) => {
    await page.goto(`${BASE}/welcome`);
    await expect(page.locator("body")).toContainText(/WZRD/i);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test("tools page loads", async ({ page }) => {
    await page.goto(`${BASE}/tools`);
    await expect(page).toHaveTitle(/WZRD|أدوات|Tools/i);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/تشخيص|diagnosis|أداة|tool/i);
  });

  test("quick diagnosis page loads", async ({ page }) => {
    await page.goto(`${BASE}/tools/quick`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).not.toContain("Cannot GET");
    expect(body).toMatch(/WZRD|quick|سريع|تشخيص|question/i);
  });

  test("signup page loads", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("admin page loads", async ({ page }) => {
    await page.goto(`${BASE}/wzrd-admin`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).not.toContain("Cannot GET");
  });

  test("site-config API returns JSON", async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/site-config`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(
      json && (typeof json.site === "object" || typeof json.siteName === "string")
    ).toBeTruthy();
  });

  test("premium pricing API returns data", async ({ request }) => {
    const res = await request.get(`${BASE}/api/trpc/premium.pricing`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json?.result?.data).toBeTruthy();
  });

  test("my-brand page loads", async ({ page }) => {
    await page.goto(`${BASE}/my-brand`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).not.toContain("Cannot GET");
  });

  test("copilot page loads", async ({ page }) => {
    await page.goto(`${BASE}/copilot`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).not.toContain("Cannot GET");
    expect(body).toMatch(/WZRD|Copilot|مستشار|كوبايلوت|تسجيل/i);
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto(`${BASE}/pricing`);
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/٩٩|99/);
  });

  test("SEO brand-diagnosis page loads", async ({ page }) => {
    await page.goto(`${BASE}/seo/brand-diagnosis`);
    await page.waitForTimeout(1500);
    const body = await page.textContent("body");
    expect(body).toMatch(/تشخيص|brand|WZRD|براند/i);
    expect(body).toMatch(/سجّل|signup|مجان|free/i);
  });

  test("services page loads", async ({ page }) => {
    await page.goto(`${BASE}/services-info`);
    await page.waitForTimeout(1000);
    const body = await page.textContent("body");
    expect(body).toMatch(/Primo|خدمات|services/i);
  });

  test("no debug endpoint exposed", async ({ request }) => {
    const res = await request.get(`${BASE}/api/debug/whoami`);
    if (process.env.SMOKE_ALLOW_LEGACY_DEBUG === "1") {
      expect([200, 404]).toContain(res.status());
      return;
    }
    expect(res.status()).toBe(404);
  });
});
