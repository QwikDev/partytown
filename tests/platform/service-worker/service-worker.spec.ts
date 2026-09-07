import { expect, test } from '@playwright/test';

test('cross-origin native iframe preserves message source identity', async ({ page }) => {
  await page.goto('/tests/platform/service-worker/?cross=1');
  await expect.poll(() => page.evaluate(() => (window as any).results)).toContain('pong');
  await expect(page.locator('body')).toHaveAttribute('data-source-matches', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-child-pong', 'true');
});

test('selected iframe can navigate to about:blank and back', async ({ page }) => {
  await page.goto('/tests/platform/service-worker/');
  await expect(page.locator('body')).toHaveAttribute('data-loads', '1');
  await page.evaluate(() => window.postMessage('blank', '*'));
  await expect(page.locator('iframe[src="about:blank"]')).toHaveCount(1);
  await expect(page.locator('body')).toHaveAttribute('data-loads', '2');
  await page.evaluate(() => window.postMessage('navigate', '*'));
  await expect(page.locator('body')).toHaveAttribute('data-loads', '3');
  await expect(page.locator('body')).toHaveAttribute('data-pongs', '2');
});

for (const native of [true, false]) {
  for (const trusted of [false, true]) {
    test(`${native ? 'native' : 'partytown'} iframe service worker with ${trusted ? 'TrustedScriptURL' : 'string'}`, async ({
      page,
      browserName,
    }) => {
      test.skip(trusted && browserName !== 'chromium', 'Trusted Types requires Chromium');
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      const params = new URLSearchParams();
      if (native) params.set('native', '1');
      if (trusted) params.set('trusted', '1');
      await page.goto(`/tests/platform/service-worker/?${params}`);
      const origin = new URL(page.url()).origin;
      const results = () => page.evaluate(() => (window as any).results);
      await expect.poll(results).toContainEqual({
        registered: `${origin}/tests/platform/service-worker/`,
      });
      await expect.poll(results).toContainEqual({
        ready: `${origin}/tests/platform/service-worker/`,
        active: `${origin}/tests/platform/service-worker/dummy-sw.js`,
      });
      await expect.poll(results).toContain('pong');
      await expect.poll(results).toContainEqual({ readyIdentity: true });
      await expect(page.locator('body')).toHaveAttribute('data-frame-loaded', 'true');
      await expect(page.locator('body')).toHaveAttribute('data-source-matches', 'true');
      await expect(page.locator('body')).toHaveAttribute('data-child-pong', 'true');
      await page.evaluate(() => window.postMessage('navigate', '*'));
      await expect(page.locator('body')).toHaveAttribute('data-loads', '2');
      await expect(page.locator('body')).toHaveAttribute('data-pongs', '2');
      await expect(page.locator('body')).toHaveAttribute('data-source-matches', 'true');
      await page.evaluate(() => window.postMessage('remove', '*'));
      await expect(page.locator('iframe[src*="/service-worker/child.html"]')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
}
