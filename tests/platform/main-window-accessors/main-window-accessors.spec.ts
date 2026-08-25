import { test, expect } from '@playwright/test';

test('main window accessors', async ({ page }) => {
  await page.goto('/tests/platform/main-window-accessors/');
  await page.waitForSelector('.completed');

  const testAccessorProp = page.locator('#testAccessorProp');
  await expect(testAccessorProp).toHaveText('abc-123');

  const testAccessorMethod = page.locator('#testAccessorMethod');
  await expect(testAccessorMethod).toHaveText('token-88');
});
