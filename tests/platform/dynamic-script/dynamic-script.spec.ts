import { test, expect } from '@playwright/test';

test('dynamic script', async ({ page }) => {
  await page.goto('/tests/platform/dynamic-script/');
  await page.waitForSelector('.completed');

  // scripts added after initialization, e.g. on SPA route transitions,
  // must be picked up and executed in the worker
  const testDynamicInline = page.locator('#testDynamicInline');
  await expect(testDynamicInline).toHaveText('executed');

  const testDynamicSrc = page.locator('#testDynamicSrc');
  await expect(testDynamicSrc).toHaveText('executed');

  const testDynamicSubtree = page.locator('#testDynamicSubtree');
  await expect(testDynamicSubtree).toHaveText('executed');
});
