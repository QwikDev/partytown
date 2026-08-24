import { test, expect } from '@playwright/test';

test('integration forward early events', async ({ page }) => {
  await page.goto('/tests/integrations/forward-early-events/');
  await page.waitForSelector('.completed');

  // items already in the array before the snippet ran must reach the worker
  const earlyResult = page.locator('#earlyResult');
  await expect(earlyResult).toHaveText('["consent-default","early-page-view"]');

  // calls queued before the worker global exists must not be dropped
  const lateResult = page.locator('#lateResult');
  await expect(lateResult).toHaveText('["queued-before-worker-ready"]');
});
