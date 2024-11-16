import { ConsoleMessage, expect, test } from '@playwright/test';

test('iframe cookie & localStorage', async ({ page }) => {
  let pageConsoleWarnings: Array<ConsoleMessage> = [];
  page.on('console', msg => {
    if (msg.type() === 'warning') {
      pageConsoleWarnings.push(msg);
    }
  });

  await page.goto('/tests/platform/iframe/index-cookie-localstorage.html');
  await page.waitForSelector('.completed');
  
  pageConsoleWarnings = [];
  const sameOriginCookieButton = page.locator('#sameOriginCookieButton');
  await sameOriginCookieButton.click();
  const sameOriginCookie = page.frameLocator('#iframe-same-origin-cookie').locator('#test-cookie');
  await expect(sameOriginCookie).toContainText('foo=88');
  expect(pageConsoleWarnings.length).toBe(0);
  
  pageConsoleWarnings = [];
  const sameOriginLocalStorageButton = page.locator('#sameOriginLocalStorageButton');
  await sameOriginLocalStorageButton.click();
  const sameOriginLocalStorage = page.frameLocator('#iframe-same-origin-localstorage').locator('#test-localstorage');
  await expect(sameOriginLocalStorage).toContainText('88');
  expect(pageConsoleWarnings.length).toBe(0);

  pageConsoleWarnings = [];
  const crossOriginCookieButton = page.locator('#crossOriginCookieButton');
  await crossOriginCookieButton.click();
  const crossOriginCookie = page.frameLocator('#iframe-cross-origin-cookie').locator('#test-cookie');
  await expect(crossOriginCookie).not.toContainText('foo=88');
  expect(pageConsoleWarnings.length).toBe(2);
  expect(pageConsoleWarnings.some(warning => warning.text().includes('Partytown unable to set cross-origin cookie'))).toBe(true);
  expect(pageConsoleWarnings.some(warning => warning.text().includes('Partytown unable to get cross-origin cookie'))).toBe(true);
  
  pageConsoleWarnings = [];
  const crossOriginLocalStorageButton = page.locator('#crossOriginLocalStorageButton');
  await crossOriginLocalStorageButton.click();
  const crossOriginLocalStorage = page.frameLocator('#iframe-cross-origin-localstorage').locator('#test-localstorage');
  await expect(crossOriginLocalStorage).not.toContainText('88');
  expect(pageConsoleWarnings.length).toBe(2);
  expect(pageConsoleWarnings.some(warning => warning.text().includes('Partytown unable to set cross-origin localStorage'))).toBe(true);
  expect(pageConsoleWarnings.some(warning => warning.text().includes('Partytown unable to get cross-origin localStorage'))).toBe(true);
});
