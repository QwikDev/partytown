import { test, expect, type Page } from '@playwright/test';

// the sandbox is controlled by the service worker, but some of the worker's
// proxytown requests still reach the server, as seen in iOS Safari (#794).
// `isBypassed` gets the index of each proxytown request the service worker sees
const bypassWorkerRequests = async (page: Page, isBypassed: string) => {
  test.skip(
    page.context().browser()?.browserType().name() == 'firefox',
    "playwright can't route the service worker script in firefox"
  );
  await page.context().route('**/partytown-sw.js*', async (route) => {
    const sw = await (await route.fetch()).text();
    const prelude = `
      var requestIndex = 0;
      self.addEventListener('fetch', function (ev) {
        if (ev.request.url.includes('proxytown') && (${isBypassed})(requestIndex++)) {
          ev.stopImmediatePropagation();
        }
      });
    `;
    await route.fulfill({ body: prelude + sw, contentType: 'application/javascript' });
  });
  // activate the service worker before the test page loads: in webkit, a sandbox
  // loaded right when it activates is sometimes not controlled by it, so partytown
  // falls back to the main thread without starting the worker or any request
  await page.goto('/tests/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.register('/~partytown/debug/partytown-sw.js', {
      scope: '/~partytown/debug/',
    });
    const sw = (reg.installing || reg.waiting || reg.active)!;
    while (sw.state != 'activated') {
      await new Promise((resolve) => sw.addEventListener('statechange', resolve, { once: true }));
    }
  });
  const networkRequests: string[] = [];
  page.context().on('response', (rsp) => {
    if (rsp.url().includes('proxytown') && !rsp.fromServiceWorker()) {
      networkRequests.push(rsp.url());
    }
  });
  return networkRequests;
};

const ticks = async (page: Page) => Number(await page.locator('#testTicks').textContent());

test.beforeEach(({ baseURL }) => {
  test.skip(new URL(baseURL!).port === '4003', 'service-worker mode only');
});

test('falls back when proxytown requests reach the server', async ({ page }) => {
  const networkRequests = await bypassWorkerRequests(page, '() => true');
  await page.goto('/tests/platform/sw-worker-bypass/');

  // well before the 10s fallbackTimeout
  await page.waitForSelector('.completed', { timeout: 3000 });
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});

test('does not run scripts twice that finished in the worker', async ({ page }) => {
  // the first script's 3 requests are answered, then they reach the server:
  // only the scripts that didn't finish fall back to the main thread
  const networkRequests = await bypassWorkerRequests(page, '(i) => i >= 3');
  await page.goto('/tests/platform/sw-worker-bypass/');

  await page.waitForSelector('.completed', { timeout: 3000 });
  await page.waitForTimeout(1000);
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});

test('keeps the worker after partytown initialized', async ({ page }) => {
  // a single request well after initialization reaches the server
  const networkRequests = await bypassWorkerRequests(page, '(i) => i == 10');
  await page.goto('/tests/platform/sw-worker-bypass/');
  await page.waitForSelector('.completed');

  await expect.poll(() => networkRequests.length).toBe(1);
  const ticksAfterFailure = await ticks(page);
  await expect.poll(() => ticks(page)).toBeGreaterThan(ticksAfterFailure + 3);
});

test('falls back without any proxytown request when the worker has no controller', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName == 'chromium',
    "chromium doesn't expose navigator.serviceWorker to workers"
  );
  test.skip(
    browserName == 'firefox',
    "playwright's init scripts don't run in the service worker's sandbox page in firefox"
  );

  // the worker reports no controller, as an uncontrolled worker would on iOS
  await page.addInitScript(() => {
    if (location.pathname.endsWith('partytown-sandbox-sw.html')) {
      const OrgWorker = window.Worker;
      window.Worker = class extends OrgWorker {
        constructor(url: string | URL, opts?: WorkerOptions) {
          const src = `Object.defineProperty(navigator.serviceWorker, 'controller', { get: () => null });
            importScripts(${JSON.stringify(new URL(url, location.href).href)});`;
          super(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), opts);
        }
      };
    }
  });
  const proxytownRequests: string[] = [];
  page.context().on('request', (req) => {
    if (req.url().includes('proxytown')) {
      proxytownRequests.push(req.url());
    }
  });
  await page.goto('/tests/platform/sw-worker-bypass/');

  await page.waitForSelector('.completed', { timeout: 3000 });
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(proxytownRequests).toEqual([]);
});
