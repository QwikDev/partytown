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
        if (ev.request.url.includes('proxytown')) {
          var i = requestIndex++;
          var bypass = (${isBypassed})(i);
          new BroadcastChannel('pt-diag').postMessage('[sw] request ' + i + (bypass ? ' bypassed' : ' answered') + ' client=' + ev.clientId);
          if (bypass) ev.stopImmediatePropagation();
        }
      });
    `;
    await route.fulfill({ body: prelude + sw, contentType: 'application/javascript' });
  });
  await diagnose(page);
  const networkRequests: string[] = [];
  page.context().on('response', (rsp) => {
    if (rsp.url().includes('proxytown') && !rsp.fromServiceWorker()) {
      networkRequests.push(rsp.url());
    }
  });
  return networkRequests;
};

// TEMP diagnostics for the webkit flake
let diag: string[] = [];
const t0 = Date.now();
const note = (msg: string) => diag.push(`${Date.now() - t0}ms ${msg}`);
const diagnose = async (page: Page) => {
  diag = [];
  page.on('console', (m) => note(`console.${m.type()} ${m.text()}`));
  page.on('worker', (w) => note(`worker ${w.url().slice(-60)}`));
  page.on('frameattached', (f) => note(`frameattached`));
  page.on('framenavigated', (f) => note(`framenavigated ${f.url().slice(-60)}`));
  page.on('framedetached', (f) => note(`framedetached ${f.url().slice(-60)}`));
  page.context().on('request', (r) => {
    if (r.url().includes('proxytown')) note(`request ${r.method()} ${r.url().slice(-40)}`);
  });
  page.context().on('requestfailed', (r) => {
    if (r.url().includes('proxytown')) note(`requestfailed ${r.failure()?.errorText}`);
  });
  page.context().on('response', (r) => {
    if (r.url().includes('proxytown') || r.url().includes('partytown-s'))
      note(`response ${r.status()} fromSW=${r.fromServiceWorker()} ${r.url().slice(-50)}`);
  });
  await page.addInitScript(() => {
    if (window === top) {
      new BroadcastChannel('pt-diag').onmessage = (e) => console.log(e.data);
    }
    if (location.pathname.endsWith('partytown-sandbox-sw.html')) {
      const bc = new BroadcastChannel('pt-diag');
      bc.postMessage('[sandbox] controller=' + !!navigator.serviceWorker.controller);
      const OrgWorker = window.Worker;
      window.Worker = class extends OrgWorker {
        constructor(url: string | URL, opts?: WorkerOptions) {
          bc.postMessage('[sandbox] new Worker ' + String(url).slice(-60));
          const src = `new BroadcastChannel('pt-diag').postMessage('[worker] controller=' +
              !!(navigator.serviceWorker && navigator.serviceWorker.controller) +
              ' sw=' + !!navigator.serviceWorker);
            importScripts(${JSON.stringify(new URL(url, location.href).href)});`;
          super(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), opts);
        }
      };
    }
  });
};

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log(`DIAG ${testInfo.title}\n` + diag.join('\n'));
  }
});

const ticks = async (page: Page) => Number(await page.locator('#testTicks').textContent());

test.beforeEach(({ baseURL }) => {
  test.skip(new URL(baseURL!).port === '4003', 'service-worker mode only');
});

for (let n = 0; n < 8; n++) {
test('falls back when proxytown requests reach the server' + ' #' + n, async ({ page }) => {
  const networkRequests = await bypassWorkerRequests(page, '() => true');
  await page.goto('/tests/platform/sw-worker-bypass/');

  // well before the 10s fallbackTimeout
  await page.waitForSelector('.completed', { timeout: 3000 });
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});
}

for (let n = 0; n < 8; n++) {
test('does not run scripts twice that finished in the worker' + ' #' + n, async ({ page }) => {
  // the first script's 3 requests are answered, then they reach the server:
  // only the scripts that didn't finish fall back to the main thread
  const networkRequests = await bypassWorkerRequests(page, '(i) => i >= 3');
  await page.goto('/tests/platform/sw-worker-bypass/');

  await page.waitForSelector('.completed', { timeout: 3000 });
  await page.waitForTimeout(1000);
  await expect(page.locator('#testRuns')).toHaveText('run;');
  expect(networkRequests.length).toBeGreaterThan(0);
});
}

for (let n = 0; n < 8; n++) {
test('keeps the worker after partytown initialized' + ' #' + n, async ({ page }) => {
  // a single request well after initialization reaches the server
  const networkRequests = await bypassWorkerRequests(page, '(i) => i == 10');
  await page.goto('/tests/platform/sw-worker-bypass/');
  await page.waitForSelector('.completed');

  await expect.poll(() => networkRequests.length).toBe(1);
  const ticksAfterFailure = await ticks(page);
  await expect.poll(() => ticks(page)).toBeGreaterThan(ticksAfterFailure + 3);
});
}

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
