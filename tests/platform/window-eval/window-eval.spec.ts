import { test, expect } from '@playwright/test';

test('window eval', async ({ page }) => {
  await page.goto('/tests/platform/window-eval/');
  await page.waitForSelector('.completed');

  const testWindowEval = page.locator('#testWindowEval');
  await expect(testWindowEval).toHaveText('ad library object');

  const testWindowEvalResult = page.locator('#testWindowEvalResult');
  await expect(testWindowEvalResult).toHaveText('11 5');

  const testBareEval = page.locator('#testBareEval');
  await expect(testBareEval).toHaveText('local object');
});
