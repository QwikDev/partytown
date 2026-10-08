import { test, expect } from '@playwright/test';

test('load and error handlers fire for scripts loaded on the main thread', async ({ page }) => {
  await page.goto('/tests/integrations/main-thread-script-events/');
  await page.waitForSelector('.completed');

  // the scripts are handed to the main thread
  await expect(page.locator('script[src$="main-thread-script.js"]')).toHaveAttribute(
    'type',
    'text/javascript'
  );
  await expect.poll(() => page.evaluate(() => (window as any).mainThreadScriptRan)).toBe(true);

  // and the worker-side handlers run exactly once per event
  await expect(page.locator('#okOnload')).toHaveText('load');
  await expect(page.locator('#okListener')).toHaveText('load');
  await expect(page.locator('#missingOnerror')).toHaveText('error');
  await expect(page.locator('#missingListener')).toHaveText('error');
});
