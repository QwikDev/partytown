import { test, expect } from '@playwright/test';

test('node interface', async ({ page }) => {
  await page.goto('/tests/platform/node-interface/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testElementSplitText')).toHaveText('undefined undefined');
  await expect(page.locator('#testTextSplitText')).toHaveText('function text');
});
