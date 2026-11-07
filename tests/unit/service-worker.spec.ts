import { test } from 'uvu';
import * as assert from 'uvu/assert';

// fetch.ts imports the inlined sandbox builds, which only exist in the bundle
const Module = require('module');
const orgResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...args: any[]) {
  return request.startsWith('@sandbox') ? request : orgResolve.call(this, request, ...args);
};
require.cache['@sandbox'] = require.cache['@sandbox-debug'] = { exports: { default: '' } } as any;
const { getClientByTab } = require('../../src/lib/service-worker/fetch');
Module._resolveFilename = orgResolve;

const sandbox = (tabId: string) =>
  ({ url: `http://localhost/~partytown/partytown-sandbox-sw.html?${tabId}` }) as Client;
const tab1 = sandbox('1794000000000abc');
const tab2 = sandbox('1794000000001def');

test('finds the sandbox of the request tab', () => {
  assert.is(getClientByTab([tab1, tab2], 'x1.1794000000000abc'), tab1);
  assert.is(getClientByTab([tab1, tab2], 'x2.1794000000001def'), tab2);
});

test("doesn't answer from another tab when the request tab's sandbox is gone", () => {
  assert.is(getClientByTab([tab1, tab2], 'x1.1794000000002ghi'), undefined);
});

test('takes the latest sandbox for a snippet older than tab ids', () => {
  const old1 = sandbox('1794000000000');
  const old2 = sandbox('1794000000005');
  assert.is(getClientByTab([old1, old2], 'x1.undefined'), old2);
});

test.run();
