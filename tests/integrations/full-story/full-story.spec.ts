import { test, expect } from '@playwright/test';

test('full-story', async ({ page }) => {
  await page.goto('/tests/integrations/full-story/');

  await page.waitForSelector('.completed');

  const buttonSendEvent = page.locator('#buttonSendEvent');
  await buttonSendEvent.click();

  const testFullStory = page.locator('#testIdentify');
  await expect(testFullStory).toHaveText('called');
});

test('full-story via GTM', async ({ page }) => {
  // Capture console messages - only actual console.log output, not Partytown debug logs
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    // Filter out Partytown's own debug logging (which would contain the script source)
    if (!text.includes('%c')) {
      consoleMessages.push(text);
    }
  });

  await page.goto('/tests/integrations/full-story/gtm-fullstory.html');

  await page.waitForSelector('.completed');

  // Check that FS namespace exists and is properly initialized
  const testFSExists = page.locator('#testFSExists');
  await expect(testFSExists).toHaveText('yes');

  const fsExists = await page.evaluate(() => {
    return typeof window['FS'] !== 'undefined' && typeof window['FS'].identify === 'function';
  });
  expect(fsExists).toBe(true);

  // Check for namespace conflict error in actual console output
  const hasNamespaceConflict = consoleMessages.some((msg) =>
    msg.includes('FullStory namespace conflict')
  );

  if (hasNamespaceConflict) {
    console.error('❌ FullStory namespace conflict detected!');
    console.error('Console messages:', consoleMessages);
  }

  expect(hasNamespaceConflict).toBe(false);

  // Test FS.identify
  const buttonSendIdentify = page.locator('#buttonSendIdentify');
  await buttonSendIdentify.click();

  const testIdentify = page.locator('#testIdentify');
  await expect(testIdentify).toHaveText('called');

  // Test FS.event
  const buttonSendEvent = page.locator('#buttonSendEvent');
  await buttonSendEvent.click();

  const testEvent = page.locator('#testEvent');
  await expect(testEvent).toHaveText('called');
});
