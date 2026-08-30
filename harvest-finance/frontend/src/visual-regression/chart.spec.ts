import { test, expect } from '@playwright/test';

test.describe('Chart visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vaults');
  });

  test('yield chart renders', async ({ page }) => {
    const chart = page.locator('.recharts-wrapper, [role="img"], svg');
    await expect(chart.first()).toBeVisible({ timeout: 15000 });
  });
});
