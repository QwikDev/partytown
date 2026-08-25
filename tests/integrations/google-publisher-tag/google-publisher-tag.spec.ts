import { test, expect } from '@playwright/test';

test('google publisher tag', async ({ page, browserName }) => {
  // the live ad pipeline hangs on CI's macOS WebKit, chromium coverage is enough
  test.skip(browserName === 'webkit', 'chromium only');

  await page.goto('/tests/integrations/google-publisher-tag/');

  const testApiReady = page.locator('#testApiReady');
  await expect(testApiReady).toHaveText('ready', { timeout: 15000 });

  const testSlot = page.locator('#testSlot');
  await expect(testSlot).toHaveText('displayed', { timeout: 15000 });

  // the ad iframe is created by the safeframe pipeline
  const testAdFrame = page.locator('#testAdFrame');
  await expect(testAdFrame).toHaveText('created', { timeout: 15000 });
});
