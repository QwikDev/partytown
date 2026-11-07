import { test, expect, type Page } from '@playwright/test';

// the sandbox is controlled by the service worker, but some of the worker's
// proxytown requests still reach the server, as seen in iOS Safari (#794).
// the test server lets them through its service worker, see scripts/server.cjs:
// `bypass` is `bypassFrom=<i>` or `bypassAt=<i>`, the index of the proxytown
// request the service worker sees. playwright can't route the service worker
// script for this: webkit's update checks skip the route, get the original
// script and replace the service worker mid-test
const gotoBypassingWorkerRequests = async (page: Page, bypass: string) => {
  test.skip(
    page.context().browser()?.browserType().name() == 'firefox',
    "not checked in firefox since it doesn't need playwright's routing anymore"
  );
  const networkRequests: string[] = [];
  page.context().on('response', (rsp) => {
    if (rsp.url().includes('proxytown') && !rsp.fromServiceWorker()) {
      networkRequests.push(rsp.url());
    }
  });
  await page.goto(`/tests/platform/sw-worker-bypass/?${bypass}`);
  return networkRequests;
};

const ticks = async (page: Page) => Number(await page.locator('#testTicks').textContent());

test.beforeEach(({ baseURL }) => {
  test.skip(new URL(baseURL!).port === '4003', 'service-worker mode only');
});

test('falls back when proxytown requests reach the server', async ({ page }) => {
  const networkRequests = await gotoBypassingWorkerRequests(page, 'bypassFrom=0');

  // well before the 10s fallbackTimeout
  await page.waitForSelector('.completed', { timeout: 3000 });
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});

test('does not run scripts twice that finished in the worker', async ({ page }) => {
  // the first script's 3 requests are answered, then they reach the server:
  // only the scripts that didn't finish fall back to the main thread
  const networkRequests = await gotoBypassingWorkerRequests(page, 'bypassFrom=3');

  await page.waitForSelector('.completed', { timeout: 3000 });
  await page.waitForTimeout(1000);
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});

test('keeps the worker after partytown initialized', async ({ page }) => {
  // a single request well after initialization reaches the server
  const networkRequests = await gotoBypassingWorkerRequests(page, 'bypassAt=10');
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
