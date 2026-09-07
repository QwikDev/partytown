import { test, expect } from '@playwright/test';

test('iframe loadScriptsOnMainThread opt-out loads natively', async ({ page }) => {
  await page.goto('/tests/platform/iframe-main-thread/');
  await page.waitForSelector('.completed');

  // the iframe matched loadScriptsOnMainThread, so it must load its real url
  // natively (not a partytown srcdoc document), preserving document semantics
  // like service worker registration
  const testNativeIframe = page.locator('#testNativeIframe');
  await expect(testNativeIframe).toHaveText('/tests/platform/iframe-main-thread/native-child.html');
});
