import { test, expect } from '@playwright/test';

test('worker only', async ({ page }) => {
  await page.goto('/tests/platform/worker-only/');
  await page.waitForSelector('.completed');

  // data-ptworkeronly only changes the main thread fallback,
  // the script still runs in the worker like any partytown script
  const testWorkerOnly = page.locator('#testWorkerOnly');
  await expect(testWorkerOnly).toHaveText('set in worker');

  // the global was set in the worker's window, not in the main window
  expect(await page.evaluate(() => (window as any).workerOnlyGlobal)).toBeUndefined();
});
