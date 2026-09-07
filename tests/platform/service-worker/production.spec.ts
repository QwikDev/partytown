import { expect, test } from '@playwright/test';

test('native service-worker boundary in the production runtime', async ({ page, browserName }) => {
  const trusted = browserName === 'chromium' ? '&trusted=1' : '';
  await page.goto(`/tests/platform/service-worker/?production=1${trusted}`);
  await expect.poll(() => page.evaluate(() => (window as any).results)).toContain('pong');
  await expect(page.locator('body')).toHaveAttribute('data-source-matches', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-child-pong', 'true');
});
