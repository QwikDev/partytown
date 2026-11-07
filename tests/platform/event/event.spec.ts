import { Page, expect, test } from '@playwright/test';

const testPage = async (page: Page) => {
  const testAddEventListener = page.locator('#testAddEventListener');
  const buttonAddEventListener = page.locator('#buttonAddEventListener');
  await buttonAddEventListener.click();
  await expect(testAddEventListener).toHaveText('1');
  await buttonAddEventListener.click();
  await expect(testAddEventListener).toHaveText('2');
  const testTarget = page.locator('#testTarget');
  await expect(testTarget).toHaveText('BUTTON');

  const buttonInc = page.locator('#buttonInc');
  const buttonAdd = page.locator('#buttonAdd');
  const buttonRemove = page.locator('#buttonRemove');
  const testInc = page.locator('#testInc');
  // the worker adds and removes the listener asynchronously, wait for it
  // before clicking inc
  const testIncListener = page.locator('#testIncListener');
  await expect(testInc).toHaveText('0');
  await buttonInc.click();
  await expect(testInc).toHaveText('0');
  await buttonAdd.click();
  await expect(testIncListener).toHaveText('added');
  await buttonInc.click();
  await expect(testInc).toHaveText('1');
  await buttonInc.click();
  await expect(testInc).toHaveText('2');
  await buttonRemove.click();
  await expect(testIncListener).toHaveText('removed');
  await buttonInc.click();
  await buttonInc.click();
  await expect(testInc).toHaveText('2');
  await buttonAdd.click();
  await expect(testIncListener).toHaveText('added');
  await buttonInc.click();
  await expect(testInc).toHaveText('3');

  const testWinAddEventListener = page.locator('#testWinAddEventListener');
  await expect(testWinAddEventListener).toHaveText('Window click');

  await page.waitForSelector('.testCreateEvent');
  const testCreateEvent = page.locator('#testCreateEvent');
  await expect(testCreateEvent).toHaveText('DOC_CREATE true false currentTarget');

  await page.waitForSelector('.testNewEvent');
  const testNewEvent = page.locator('#testNewEvent');
  await expect(testNewEvent).toHaveText('NEW_EVENT false true target');

  await page.waitForSelector('.testNewCustomEvent');
  const testNewCustomEvent = page.locator('#testNewCustomEvent');
  await expect(testNewCustomEvent).toHaveText('NEW_CUSTOM_EVENT true true 88');

  await page.waitForSelector('.testCrossOriginMessage');
  const testCrossOriginMessage = page.locator('#testCrossOriginMessage');
  await expect(testCrossOriginMessage).toHaveText('message cross origin');

  const btnPreventDefault = page.locator('#btnPreventDefault');
  await btnPreventDefault.click();
  await page.waitForSelector('.testPreventDefault');
  const testPreventDefault = page.locator('#testPreventDefault');
  await expect(testPreventDefault).toHaveText('preventDefault-noop');

  await page.locator('body').dblclick();

  const testWinAddEventListenerNoContext = page.locator('#testWinAddEventListenerNoContext');
  await expect(testWinAddEventListenerNoContext).toHaveText('Window dblclick');
  const testWinAddEventListenerNoContextCount = page.locator(
    '#testWinAddEventListenerNoContextCount'
  );
  await expect(testWinAddEventListenerNoContextCount).toHaveText('1');
};

test('events', async ({ page }) => {
  await page.goto('/tests/platform/event/');

  await page.waitForSelector('.completed');

  await testPage(page);
});

test('events multiple tabs', async ({ page, context }) => {
  await page.goto('/tests/platform/event/');

  await page.waitForSelector('.completed');

  const page2 = await context.newPage();

  await page2.goto('/tests/platform/event/');

  await page2.waitForSelector('.completed');  

  await testPage(page);

  await testPage(page2);
});
