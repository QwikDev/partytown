import { test, expect } from '@playwright/test';

test('scripts found before the environment exists still run', async ({ page }) => {
  // keep the window load event (and so InitializeEnvironment) pending for a while
  await page.route('**/tests/integrations/scripts-before-env/slow.png', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.alloc(0) });
  });
  await page.goto('/tests/integrations/scripts-before-env/');
  await page.waitForSelector('.completed');

  await expect(page.locator('#initialResult')).toHaveText('ran');
  await expect(page.locator('#appendedResult')).toHaveText('ran');
});
