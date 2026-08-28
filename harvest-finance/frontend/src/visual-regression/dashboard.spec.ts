import { test, expect } from '@playwright/test';

test.describe('Dashboard visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('dashboard layout renders correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Harvest Finance/);
    await page.waitForSelector('h1, h2, [data-testid]', { timeout: 15000 });
  });

  test('vault table is visible on dashboard', async ({ page }) => {
    const vaultTable = page.locator('table, [role="table"], .vault-table');
    await expect(vaultTable.first()).toBeVisible({ timeout: 15000 });
  });
});
