import { test, expect } from '@playwright/test';

test('node-list', async ({ page }) => {
  await page.goto('/tests/platform/node-list/');

  await page.waitForSelector('.completed');

  const testNodeList = page.locator('#testNodeList');
  await expect(testNodeList).toHaveText('true');

  const testHTMLCollection = page.locator('#testHTMLCollection');
  await expect(testHTMLCollection).toHaveText('true');

  const testNodeListEntries = page.locator('#testNodeListEntries');
  await expect(testNodeListEntries).toHaveText('0 P 1 A 2 SPAN');

  const testNodeListForEach = page.locator('#testNodeListForEach');
  await expect(testNodeListForEach).toHaveText('P A SPAN');

  const testNodeListItem = page.locator('#testNodeListItem');
  await expect(testNodeListItem).toHaveText('P A SPAN');

  const testNodeListKeys = page.locator('#testNodeListKeys');
  await expect(testNodeListKeys).toHaveText('0 1 2');

  const testNodeListLength = page.locator('#testNodeListLength');
  await expect(testNodeListLength).toHaveText('3');

  const testNodeListValues = page.locator('#testNodeListValues');
  await expect(testNodeListValues).toHaveText('P A SPAN');

  const testNodeListSymbolIterator = page.locator('#testNodeListSymbolIterator');
  await expect(testNodeListSymbolIterator).toHaveText('P A SPAN');
});
