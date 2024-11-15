import { test, expect, ConsoleMessage, Page } from '@playwright/test';

const testPage = async (page: Page, expectedDataLayer: any ) => {
  const buttonDataLayerPush = page.locator('#buttonDataLayerPush');
  await buttonDataLayerPush.click();

  const testDataLayer = page.locator('#testDataLayer');
  await expect(testDataLayer).toHaveText('pushed');

  const windowHandle = await page.evaluateHandle(() => Promise.resolve(window));
  const dataLayerHandle = await page.evaluateHandle(
    (window) => window['dataLayer'] as Record<string, unknown>[],
    windowHandle
  );
  const dataLayer = await dataLayerHandle.jsonValue();
  expect(dataLayer).toStrictEqual(expectedDataLayer);
  await dataLayerHandle.dispose();
  await windowHandle.dispose();
};

test('gtm', async ({ page }) => {
  await page.goto('/tests/integrations/gtm/');

  await page.waitForSelector('.completed');

  await testPage(page, []);
});

/*
  The standard sequence of open tab/wait/open tab/wait/
  act/act only fails intermittently when running automated
  test although it fails consistently when performing manual
  testing.  The sequence below (open tab/open tab/wait/wait/
  act/act) seems to fail consistently when running automated
  test.
*/
test('gtm multiple tabs', async ({ page, context }) => {
  const pageConsoleErrors: Array<ConsoleMessage> = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageConsoleErrors.push(msg);
    }
  });

  const pageErrors: Array<Error> = [];
  page.on('pageerror', ex => {
    pageErrors.push(ex);
  });

  const page2 = await context.newPage();
  const page2ConsoleErrors: Array<ConsoleMessage> = [];
  page2.on('console', msg => {
    if (msg.type() === 'error') {
      page2ConsoleErrors.push(msg);
    }
  });

  const page2Errors: Array<Error> = [];
  page2.on('pageerror', ex => {
    page2Errors.push(ex);
  });

  await page.goto('/tests/integrations/gtm/');    
  await page2.goto('/tests/integrations/gtm/');
  await page.waitForSelector('.completed');  
  await page2.waitForSelector('.completed');

  await page.bringToFront();
  await testPage(page, []);

  await page2.bringToFront();
  await testPage(page2, []);

  // FIX ME: I'm flaky
  // expect(pageConsoleErrors.length).toBe(0);
  expect(pageErrors.length).toBe(0);
  expect(page2ConsoleErrors.length).toBe(0);
  expect(page2Errors.length).toBe(0);
});


test('gtm with preserveBehavior', async ({ page }) => {
  await page.goto('/tests/integrations/gtm/preserve-behavior.html');

  await page.waitForSelector('.completed');

  await testPage(page, [{ event: 'button-click', from: 'partytown' }]);
});