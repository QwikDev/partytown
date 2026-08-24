import { Page, expect, test } from '@playwright/test';

const testPage = async (page: Page) => {
  const testWindowName = page.locator('#testWindowName');
  await expect(testWindowName).toHaveText('Window');

  const testName = page.locator('#testName');
  await expect(testName).toContainText('Partytown 🎉');

  const testTop = page.locator('#testTop');
  await expect(testTop).toHaveText('true');

  const testParent = page.locator('#testParent');
  await expect(testParent).toHaveText('true');

  const testThisWindow = page.locator('#testThisWindow');
  await expect(testThisWindow).toHaveText('true');

  const testFrames = page.locator('#testFrames');
  await expect(testFrames).toHaveText('true');

  const testFramesIndexNotFound = page.locator('#testFramesIndexNotFound');
  await expect(testFramesIndexNotFound).toHaveText('undefined');

  const testGetFrameByNameNotFound = page.locator('#testGetFrameByNameNotFound');
  await expect(testGetFrameByNameNotFound).toHaveText('null');

  const testSelfWindow = page.locator('#testSelfWindow');
  await expect(testSelfWindow).toHaveText('true');

  const testHTMLBodyElementName = page.locator('#testHTMLBodyElementName');
  await expect(testHTMLBodyElementName).toHaveText('HTMLBodyElement HTMLBodyElement');

  const testNameEquals = page.locator('#testNameEquals');
  await expect(testNameEquals).toHaveText('true');

  const testComputedStyle = page.locator('#testGetComputedStyle');
  await expect(testComputedStyle).toHaveText('rgb(128, 0, 128) true');

  const testGetComputedStyleGetPropertyValue = page.locator(
    '#testGetComputedStyleGetPropertyValue'
  );
  await expect(testGetComputedStyleGetPropertyValue).toHaveText('rgb(50, 205, 50)');

  await page.waitForSelector('.testRaf');

  await page.waitForSelector('.testWindowRaf');

  await page.waitForSelector('.testWindowRic');

  const testBtoa = page.locator('#testBtoa');
  await expect(testBtoa).toHaveText('ODg=');
  const testAtob = page.locator('#testAtob');
  await expect(testAtob).toHaveText('88');

  page.on('dialog', (dialog) => dialog.accept('88'));
  const promptButton = page.locator('#button-prompt');
  await promptButton.click();
  const testPrompt = page.locator('#testPrompt');
  await expect(testPrompt).toHaveText('88');

  const testPostMessage = page.locator('#testPostMessage');
  await page.waitForSelector('.testPostMessage');
  await expect(testPostMessage).toHaveText('message 88');

  const testSomeWindowNumber = page.locator('#testSomeWindowNumber');
  await expect(testSomeWindowNumber).toHaveText('1885');

  const testSomeGlobalNumber = page.locator('#testSomeGlobalNumber');
  await expect(testSomeGlobalNumber).toHaveText('1985');

  const testSomeWindowObject = page.locator('#testSomeWindowObject');
  await expect(testSomeWindowObject).toHaveText('{"some":{"object":88}}');

  const testSomeGlobalObject = page.locator('#testSomeGlobalObject');
  await expect(testSomeGlobalObject).toHaveText('{"some":{"object":99}}');

  await page.waitForSelector('.testPromise');
  const testPromise = page.locator('#testPromise');
  await expect(testPromise).toHaveText('resolved');

  await page.waitForSelector('.testPromisePolyfilled');
  const testPromisePolyfilled = page.locator('#testPromisePolyfilled');
  await expect(testPromisePolyfilled).toHaveText('polyfill resolved');

  await page.waitForSelector('.testPerformanceNow');
  const testPerformanceNow = page.locator('#testPerformanceNow');
  const now = await testPerformanceNow.textContent();
  expect(!isNaN(now as any)).toBe(true);

  await page.waitForSelector('.testPerformanceTimingNavigationStart');
  const testPerformanceTimingNavigationStart = page.locator(
    '#testPerformanceTimingNavigationStart'
  );
  const navigationStart = await testPerformanceTimingNavigationStart.textContent();
  expect(!isNaN(navigationStart as any)).toBe(true);

  await page.waitForSelector('.testPerformanceEntries');
  const testPerformanceEntries = page.locator('#testPerformanceEntries');
  await expect(testPerformanceEntries).toHaveText('true');

  const testFrameElement = page.locator('#testFrameElement');
  await expect(testFrameElement).toHaveText('null');

  const testInnerWidthHeight = page.locator('#testInnerWidthHeight');
  await expect(testInnerWidthHeight).not.toHaveText('');

  const testDevicePixelRatio = page.locator('#testDevicePixelRatio');
  await expect(testDevicePixelRatio).not.toHaveText('');

  const testOrigin = page.locator('#testOrigin');
  const origin = new URL((await testOrigin.textContent()) || '');
  expect(origin.pathname).toBe('/');
  expect(origin.hostname).toBe('localhost');

  const testCrypto = page.locator('#testCrypto');
  const rand = await testCrypto.textContent();
  expect(isNaN(rand as any)).toBe(false);

  const testIndexedDB = page.locator('#testIndexedDB');
  await expect(testIndexedDB).toHaveText('true');

  const testFnNotNative = page.locator('#testFnNotNative');
  await expect(testFnNotNative).toHaveText('undefined');

  const testNotStandard = page.locator('#testNotStandard');
  await expect(testNotStandard).toHaveText('undefined');

  const testOpener = page.locator('#testOpener');
  await expect(testOpener).toHaveText('null');

  const testUserObject = page.locator('#testUserObject');
  await expect(testUserObject).toHaveText('undefined');

  const testUserConstructor = page.locator('#testUserConstructor');
  await expect(testUserConstructor).toHaveText('undefined');

  const testTrustedTypes = page.locator('#testTrustedTypes');
  await expect(testTrustedTypes).toHaveText('true');

  // TODO: test in CI
  // const testIsTypeSupported = page.locator('#testIsTypeSupported');
  // await expect(testIsTypeSupported).toHaveText('true');

  const testImportScripts = page.locator('#testImportScripts');
  await expect(testImportScripts).toHaveText('false');

  const testWorkerGlobalScope = page.locator('#testWorkerGlobalScope');
  await expect(testWorkerGlobalScope).toHaveText('false');

  const testGlobalPrimitives = page.locator('#testGlobalPrimitives');
  await expect(testGlobalPrimitives).toHaveText('false number number undefined');

  const testVisualViewport = page.locator('#testVisualViewport');
  await expect(testVisualViewport).toHaveText('scale:1 VisualViewport');

  const testDocumentScripts = page.locator('#testDocumentScripts');
  await expect(testDocumentScripts).toHaveText('scripts.length: number');
};

test('window', async ({ page }) => {
  await page.goto('/tests/platform/window/');

  await page.waitForSelector('.completed');

  await testPage(page);
});

test('window multiple tabs', async ({ page, context }) => {
  await page.goto('/tests/platform/window/');

  await page.waitForSelector('.completed');

  const page2 = await context.newPage();

  await page2.goto('/tests/platform/window/');

  await page2.waitForSelector('.completed');  

  await testPage(page);

  await testPage(page2);
});
