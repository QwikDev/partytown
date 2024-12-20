import { test, expect } from '@playwright/test';

test('custom-element', async ({ page }) => {
  await page.goto('/tests/platform/custom-element/');

  await page.waitForSelector('.testDefine');
  const testDefine = page.locator('#testDefine');
  await expect(testDefine).toHaveText('TestDefineElement');

  await page.waitForSelector('.testDefineOnMainAccessOnWorker');
  const testDefineOnMainAccessOnWorker = page.locator('#testDefineOnMainAccessOnWorker');
  await expect(testDefineOnMainAccessOnWorker).toHaveText('it works');

  await page.waitForSelector('.testNoReDefine');
  const testNoReDefine = page.locator('#testNoReDefine');
  await expect(testNoReDefine).toHaveText('TestNoReDefineElement');

  await page.waitForSelector('.testNoMainReDefine');
  const testNoMainReDefine = page.locator('#testNoMainReDefine');
  await expect(testNoMainReDefine).toHaveText('true');

  await page.waitForSelector('.testConnectedCallback');
  const testConnectedCallback = page.locator('#testConnectedCallback');
  await expect(testConnectedCallback).toHaveText('test-connected-callback');

  await page.waitForSelector('.testDisconnectedCallback');
  const testDisconnectedCallback = page.locator('#testDisconnectedCallback');
  await expect(testDisconnectedCallback).toHaveText('test-disconnected-callback');

  await page.waitForSelector('.testAttributeChangedCallback');
  const testAttributeChangedCallback = page.locator('#testAttributeChangedCallback');
  await expect(testAttributeChangedCallback).toHaveText('mph 87 88');

  await page.waitForSelector('.testConstructor');
  const testConstructor = page.locator('#testConstructor');
  await expect(testConstructor).toHaveText('test-constructor');

  await page.waitForSelector('.testShadowRoot');
  const testShadowRoot = page.locator('#testShadowRoot');
  await expect(testShadowRoot).toHaveText('shadow #document-fragment');
});
