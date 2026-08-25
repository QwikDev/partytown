import { test, expect } from '@playwright/test';

test('recaptcha', async ({ page }) => {
  await page.goto('/tests/integrations/recaptcha/');
  await page.waitForSelector('.completed');

  const testLoaded = page.locator('#testLoaded');
  await expect(testLoaded).toHaveText('loaded', { timeout: 15000 });

  const testReady = page.locator('#testReady');
  await expect(testReady).toHaveText('ready', { timeout: 15000 });

  // the badge is a cross-origin iframe the browser must load natively
  const testBadge = page.locator('#testBadge');
  await expect(testBadge).toHaveText('rendered', { timeout: 15000 });
});
