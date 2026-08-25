import { test, expect } from '@playwright/test';

// the opener handshake used by debug tools like GTM's Tag Assistant:
// the opener posts to the page, the worker listener replies through
// window.opener.postMessage()
test('window opener handshake', async ({ page, context }) => {
  await page.goto('/tests/platform/window-opener/opener.html');

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.evaluate(() => {
      window.open('/tests/platform/window-opener/', 'pt_popup');
    }),
  ]);
  await popup.waitForSelector('.completed');

  await page.evaluate(() => {
    (window.open('', 'pt_popup') as Window).postMessage({ from: 'opener' }, '*');
  });

  const testMessage = popup.locator('#testMessage');
  await expect(testMessage).toHaveText('{"from":"opener"}');

  await expect
    .poll(async () => page.evaluate(() => (window as any).received.length), { timeout: 5000 })
    .toBeGreaterThan(0);

  await expect
    .poll(async () => page.evaluate(() => (window as any).received.length), { timeout: 5000 })
    .toBeGreaterThan(1);

  expect(await page.evaluate(() => (window as any).received)).toEqual(
    expect.arrayContaining([{ reply: 'from-worker' }, { reply: 'via-source' }])
  );
});
