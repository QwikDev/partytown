import { test, expect } from '@playwright/test';

test('mutation-observer', async ({ page }) => {
  await page.goto('/tests/platform/mutation-observer/');

  await page.waitForSelector('.completed');

  const buttonObserve = page.locator('#buttonObserve');
  const buttonAttr = page.locator('#buttonAttr');
  const buttonChildList = page.locator('#buttonChildList');

  const testMutationObserver = page.locator('#testMutationObserver');

  await buttonAttr.click();
  await expect(testMutationObserver).toHaveText('');

  await buttonChildList.click();
  await expect(testMutationObserver).toHaveText('');

  await buttonObserve.click();
  // the click handler runs in the worker; it renames the button right after observe()
  await expect(buttonObserve).toHaveText('disconnect');

  await buttonAttr.click();
  await page.waitForSelector('.step1');
  await expect(testMutationObserver).toHaveText('attributes');

  await buttonChildList.click();
  await page.waitForSelector('.step2');
  await expect(testMutationObserver).toHaveText('childList');

  await buttonObserve.click();
  await expect(buttonObserve).toHaveText('observe');
  await expect(testMutationObserver).toHaveText('');

  await buttonAttr.click();
  await expect(testMutationObserver).toHaveText('');

  await buttonChildList.click();
  await expect(testMutationObserver).toHaveText('');
});
