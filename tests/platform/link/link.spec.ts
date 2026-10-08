import { test, expect } from '@playwright/test';

test('link', async ({ page }) => {
  await page.goto('/tests/platform/link/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testLinkHref')).toHaveText('/tests/platform/link/style.css');
  await expect(page.locator('#testLinkStyle')).toHaveCSS('color', 'rgb(40, 38, 65)');
});
