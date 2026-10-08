import { test, expect } from '@playwright/test';

test('native worker globals', async ({ page }) => {
  await page.goto('/tests/platform/native-worker-globals/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testCaches')).toHaveText('object');
  // not every browser has scheduler.postTask (WebKit doesn't): expect what the page has
  const hasScheduler = await page.evaluate(
    () => typeof (window as any).scheduler?.postTask === 'function'
  );
  await expect(page.locator('#testScheduler')).toHaveText(hasScheduler ? 'function' : 'undefined');
});
