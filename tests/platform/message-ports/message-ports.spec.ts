import { test, expect } from '@playwright/test';

test('message ports', async ({ page }) => {
  await page.goto('/tests/platform/message-ports/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#testPortReply')).toHaveText('pong from the worker');
});
