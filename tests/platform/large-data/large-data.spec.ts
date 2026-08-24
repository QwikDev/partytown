import { test, expect } from '@playwright/test';

test('large data', async ({ page }) => {
  await page.goto('/tests/platform/large-data/');
  await page.waitForSelector('.completed');

  // under the atomics config this response is larger than the initial
  // SharedArrayBuffer and exercises the grow-on-demand path
  const testLargeValue = page.locator('#testLargeValue');
  await expect(testLargeValue).toHaveText('600000');
});
