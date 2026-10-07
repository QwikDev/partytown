import { test, expect } from '@playwright/test';

test('iframe post message', async ({ page }) => {
  await page.goto('/tests/platform/iframe-post-message/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testNativeFramePostMessage')).toHaveText('answered from the worker');
  await expect(page.locator('#testReplyToSource')).toHaveText('replied to consent?');
});
