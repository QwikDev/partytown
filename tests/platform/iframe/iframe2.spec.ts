import { expect, test } from '@playwright/test';

test('iframe 2', async ({ page }) => {
  await page.goto('/tests/platform/iframe/index2.html');

  await page.waitForSelector('.testMemberNames');
  const testMemberNames = page.locator('#testMemberNames');
  await expect(testMemberNames).toHaveText('1985');

  await page.waitForSelector('.testParentMemberNames');
  const testParentMemberNames = page.locator('#testParentMemberNames');
  await expect(testParentMemberNames).toHaveText('1985 1885');

  await page.waitForSelector('.testNoDeadlock');
  const testNoDeadlock = page.locator('#testNoDeadlock');
  await expect(testNoDeadlock).toHaveText('99');

  await page.waitForSelector('.testWWGlobalNotShared');
  const testWWGlobalNotShared = page.locator('#testWWGlobalNotShared');
  await expect(testWWGlobalNotShared).toHaveText('true');

  await page.waitForSelector('.testFrameElement');
  const testFrameElement = page.locator('#testFrameElement');
  await expect(testFrameElement).toHaveText('frameElement');

  await page.waitForSelector('.testSyncSetAttr');
  const testSyncSetAttr = page.locator('#testSyncSetAttr');
  await expect(testSyncSetAttr).toHaveText('88');

  await page.waitForSelector('.testNativeFetch');
  const testNativeFetch = page.locator('#testNativeFetch');
  await expect(testNativeFetch).toHaveText('true');

  await page.waitForSelector('.testPostMessage');
  const testPostMessage = page.locator('#testPostMessage');
  await expect(testPostMessage).toHaveText('message 99 true');

  await page.waitForSelector('.testCrossOrigin');
  const testCrossOrigin = page.locator('#testCrossOrigin');
  await expect(testCrossOrigin).toHaveText('message 88 https://partytown.qwik.dev true');

  // TODO!
  // await page.waitForSelector('.testLocation');
  // const testLocation = page.locator('#testLocation');
  // await expect(testLocation).toHaveText('/tests/platform/iframe/location2.html');

  // this is a flaky test on Run Chromium E2E Tests (Atomics)
  //
  // await page.waitForSelector('.testSrcChange');
  // const testSrcChange1 = page.locator('#testSrcChange1');
  // await expect(testSrcChange1).toHaveText('src-change1');
  // const testSrcChange2 = page.locator('#testSrcChange2');
  // await expect(testSrcChange2).toHaveText('src-change2');

  await page.waitForSelector('.testGetByTagName');
  const testGetByTagName = page.locator('#testGetByTagName');
  await expect(testGetByTagName).toHaveText('#document');

  await page.waitForSelector('.testGetIframeSrc');
  const testGetIframeSrc = page.locator('#testGetIframeSrc');
  await expect(testGetIframeSrc).toHaveText('/tests/platform/iframe/content.html');

  await page.waitForSelector('.testWindowFrames');
  const testWindowFrames = page.locator('#testWindowFrames');
  await expect(testWindowFrames).toHaveText('window-frames');

  await page.waitForSelector('.testSetJavascriptSrc');
  const testSetJavascriptSrc = page.locator('#testSetJavascriptSrc');
  await expect(testSetJavascriptSrc).toHaveText('javascript:void(0);');
});
