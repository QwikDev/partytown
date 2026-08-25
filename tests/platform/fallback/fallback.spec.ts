import { test, expect } from '@playwright/test';

// simulate environments without service worker support,
// e.g. iOS in-app WKWebView browsers
test.use({ serviceWorkers: 'block' });

test('fallback', async ({ page, baseURL }) => {
  // the fallback is a service-worker-mode scenario, under the atomics config
  // partytown initializes fine and dynamic scripts are covered by the
  // dynamic-script test
  test.skip(new URL(baseURL!).port === '4003', 'service-worker mode only');
  await page.goto('/tests/platform/fallback/');
  await page.waitForSelector('.completed');

  const testInitial = page.locator('#testInitial');
  await expect(testInitial).toHaveText('executed');

  // scripts injected after the fallback ran, e.g. gtm.js
  // from the GTM snippet, must also execute (#554)
  const testDynamic = page.locator('#testDynamic');
  await expect(testDynamic).toHaveText('executed');
});
