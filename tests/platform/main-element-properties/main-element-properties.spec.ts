import { test, expect } from '@playwright/test';

test('main element properties', async ({ page }) => {
  await page.goto('/tests/platform/main-element-properties/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testWorkerRead')).toHaveText('function');
  await expect(page.locator('#testMainCall')).toHaveText('called');
  await expect(page.locator('#testIframeOnload')).toHaveText('called');
});
