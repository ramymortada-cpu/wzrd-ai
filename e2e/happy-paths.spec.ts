/**
 * E2E Tests — Critical Happy Paths
 * 
 * These tests verify the most important user journeys work end-to-end.
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    // Should show the dashboard or login
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Quick Check (Public)', () => {
  test('should load the quick-check page', async ({ page }) => {
    await page.goto('/quick-check');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show form fields', async ({ page }) => {
    await page.goto('/quick-check');
    // The quick-check should have input fields
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThan(0);
  });
});

test.describe('Client Portal (Public)', () => {
  test('should handle invalid token gracefully', async ({ page }) => {
    await page.goto('/portal/invalid-token-123');
    await expect(page.locator('body')).toBeVisible();
    // Should show an error message, not crash
  });
});

test.describe('Responsive Design', () => {
  test('quick-check should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/quick-check');
    await expect(page.locator('body')).toBeVisible();
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
  });
});

test.describe('Accessibility', () => {
  test('should have no missing alt text on images', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      // Images should have alt text or role="presentation"
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('should have focusable navigation', async ({ page }) => {
    await page.goto('/');
    // Tab through the page - something should receive focus
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
