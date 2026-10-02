import { test, expect } from '@playwright/test';

test('scroll offsets reflect main-thread scrolling after an initial read', async ({ page }) => {
  await page.goto('/tests/platform/scroll/');
  await page.waitForSelector('.completed');

  await page.locator('#read').click();
  await expect(page.locator('#offsets')).toHaveText('[0,0,0,0,0,0]');

  for (const [x, y] of [
    [100, 200],
    [50, 80],
  ]) {
    await page.evaluate(
      ([x, y]) => {
        window.scrollTo(x, y);
        document.getElementById('scroller')!.scrollTo(x / 2, y / 2);
      },
      [x, y]
    );
    await page.locator('#read').click();
    await expect(page.locator('#offsets')).toHaveText(JSON.stringify([x, y, x, y, x / 2, y / 2]));
  }
});
