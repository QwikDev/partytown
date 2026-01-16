import { test, expect } from '@playwright/test';

test('loadIframesOnMainThread - string match', async ({ page }) => {
  await page.goto('/tests/integrations/main-thread-iframe/');

  await page.waitForSelector('.completed');

  // Check that the main thread iframe loaded successfully
  const mainThreadStatus = page.locator('#mainThreadIframeLoaded');
  await expect(mainThreadStatus).toHaveText('loaded');

  // Verify the iframe element exists and has the correct src
  const mainThreadIframe = page.locator('#mainThreadIframe');
  await expect(mainThreadIframe).toBeVisible();

  // The src should be set correctly
  const src = await mainThreadIframe.getAttribute('src');
  expect(src).toContain('test-iframe.html');
});

test('loadIframesOnMainThread - regex match', async ({ page }) => {
  await page.goto('/tests/integrations/main-thread-iframe/');

  await page.waitForSelector('.completed');

  // Check that the regex-matched iframe loaded successfully
  const regexStatus = page.locator('#regexIframeLoaded');
  await expect(regexStatus).toHaveText('loaded');

  // Verify the iframe element exists
  const regexIframe = page.locator('#regexIframe');
  await expect(regexIframe).toBeVisible();

  const src = await regexIframe.getAttribute('src');
  expect(src).toContain('main-thread-target.html');
});

test('loadIframesOnMainThread - worker handled iframe', async ({ page }) => {
  await page.goto('/tests/integrations/main-thread-iframe/');

  await page.waitForSelector('.completed');

  // Check that the worker-handled iframe loaded
  // (might be 'loaded' or 'error' depending on CORS, but should not crash)
  const workerStatus = page.locator('#workerIframeLoaded');
  const statusText = await workerStatus.textContent();
  expect(['loaded', 'error']).toContain(statusText);

  // Verify the iframe element exists
  const workerIframe = page.locator('#workerIframe');
  await expect(workerIframe).toBeVisible();
});

test('loadIframesOnMainThread - iframes exist with correct src', async ({ page }) => {
  await page.goto('/tests/integrations/main-thread-iframe/');

  await page.waitForSelector('.completed');

  // Verify main thread iframes are created with correct src attributes
  // Note: We can't always access cross-origin iframe content, but we can verify
  // that the iframes are properly created with the correct src
  const mainThreadIframe = page.locator('#mainThreadIframe');
  await expect(mainThreadIframe).toBeVisible();
  const mainSrc = await mainThreadIframe.getAttribute('src');
  expect(mainSrc).toBeTruthy();
  expect(mainSrc).toContain('test-iframe.html');

  const regexIframe = page.locator('#regexIframe');
  await expect(regexIframe).toBeVisible();
  const regexSrc = await regexIframe.getAttribute('src');
  expect(regexSrc).toBeTruthy();
  expect(regexSrc).toContain('main-thread-target.html');
});
