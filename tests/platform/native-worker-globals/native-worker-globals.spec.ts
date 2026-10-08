import { test, expect } from '@playwright/test';

test('native worker globals', async ({ page }) => {
  await page.goto('/tests/platform/native-worker-globals/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testCaches')).toHaveText('object');
  await expect(page.locator('#testScheduler')).toHaveText('function');
});
