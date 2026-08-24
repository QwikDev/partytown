import { test, expect } from '@playwright/test';

test('proxy globals', async ({ page }) => {
  await page.goto('/tests/platform/proxy-globals/');
  await page.waitForSelector('.completed');

  const testProxyGlobal = page.locator('#testProxyGlobal');
  await expect(testProxyGlobal).toHaveText('initialized');
});
