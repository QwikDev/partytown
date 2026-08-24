import { test, expect } from '@playwright/test';

test('range', async ({ page }) => {
  await page.goto('/tests/platform/range/');
  await page.waitForSelector('.completed');

  const testContextualFragment = page.locator('#testContextualFragment');
  await expect(testContextualFragment).toHaveText('#document-fragment works');

  const testFonts = page.locator('#testFonts');
  await expect(testFonts).toHaveText('load:true check:boolean ready:function');
});
