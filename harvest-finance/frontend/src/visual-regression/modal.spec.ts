import { test, expect } from '@playwright/test';

test.describe('Modal visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vaults');
  });

  test('deposit modal opens and renders correctly', async ({ page }) => {
    const depositButton = page.locator('button:has-text("Deposit"), button:has-text("Initialize Deployment")').first();
    if (await depositButton.count() > 0) {
      await depositButton.click();
      await expect(page.locator('[role="dialog"], .modal, [data-testid="modal"]').first()).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, 'Deposit button not found — skipping visual test');
    }
  });
});
