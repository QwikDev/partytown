import { test, expect, ConsoleMessage, Page } from '@playwright/test';

// the pixel loads from the real Facebook servers through a proxy: a request that fails on the
// network (WebKit logs it as a console error) is not a Partytown error
const isPartytownError = (msg: ConsoleMessage) =>
  msg.type() === 'error' && !msg.text().startsWith('Failed to load resource');

const testPage = async (page: Page) => {
  const buttonSendEvent = page.locator('#buttonSendEvent');
  await buttonSendEvent.click();

  const testFbq = page.locator('#testFbq');
  await expect(testFbq).toHaveText('called');
};

test('facebook-pixel', async ({ page }) => {
  await page.goto('/tests/integrations/facebook-pixel/');

  await page.waitForSelector('.completed');

  await testPage(page);
});

/*
  The standard sequence of open tab/wait/open tab/wait/
  act/act only fails intermittently when running automated
  test although it fails consistently when performing manual
  testing.  The sequence below (open tab/open tab/wait/wait/
  act/act) seems to fail consistently when running automated
  test.
*/
test('facebook-pixel multiple tabs', async ({ page, context }) => {
  const pageConsoleErrors: Array<ConsoleMessage> = [];
  page.on('console', msg => {
    if (isPartytownError(msg)) {
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
    if (isPartytownError(msg)) {
      page2ConsoleErrors.push(msg);
    }
  });

  const page2Errors: Array<Error> = [];
  page2.on('pageerror', ex => {
    page2Errors.push(ex);
  });

  await page.goto('/tests/integrations/facebook-pixel/');
  await page2.goto('/tests/integrations/facebook-pixel/');
  await page.waitForSelector('.completed');  
  await page2.waitForSelector('.completed');

  await page.bringToFront();
  await testPage(page);

  await page2.bringToFront();
  await testPage(page2);  

  expect(pageErrors.length).toBe(0);
  expect(pageConsoleErrors.map(msg => msg.text())).toEqual([]);
  expect(page2Errors.length).toBe(0);
  expect(page2ConsoleErrors.map(msg => msg.text())).toEqual([]);
});
