import { test, expect } from '@playwright/test';

// the page enforces `require-trusted-types-for 'script'` with a
// `trusted-types partytown` allowance via a CSP meta tag
test('trusted types', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/tests/platform/trusted-types/');
  await page.waitForSelector('.completed');

  const out = page.locator('#out');
  await expect(out).toHaveText('worker executed');

  // html set from the worker must pass Trusted Types enforcement
  await expect(page.locator('i')).toHaveText('html set from worker');
  await expect(page.locator('em')).toHaveText('adjacent html');

  expect(errors).toEqual([]);
});
