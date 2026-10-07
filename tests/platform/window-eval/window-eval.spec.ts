import { test, expect } from '@playwright/test';

test('window eval', async ({ page }) => {
  await page.goto('/tests/platform/window-eval/');
  await page.waitForSelector('.completed');

  const testWindowEval = page.locator('#testWindowEval');
  await expect(testWindowEval).toHaveText('ad library object');
});
