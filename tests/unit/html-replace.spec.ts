import * as assert from 'uvu/assert';
import { suite } from './utils';
import { replaceScriptWithPartytownScript } from '../../src/lib/web-worker/worker-iframe';

const test = suite();

test('replaceScriptWithPartytownScript', ({ doc }) => {
  check('<script>', '<script type="text/partytown">');
  check('<script type="application/javascript">', '<script type="text/partytown">');
  check(
    '<script before type="text/javascript" after>',
    '<script before type="text/partytown" after>'
  );
  check('<script type="text/json">', '<script type="text/json">');
  check('<SCRIPT>', '<script type="text/partytown">');
  check('<ScRiPt TYPE="text/javascript">', '<script TYPE="text/partytown">');
  check(
    '<script nomodule="" src="https://platform.twitter.com/_next/static/chunks/polyfills-57d3feabe8bfd4ee389c.js"></script>' +
      '<script src="https://platform.twitter.com/_next/static/chunks/runtime-a148fbcbc5efcd91d3a7.js" async=""></script>',
    '<script nomodule="" src="https://platform.twitter.com/_next/static/chunks/polyfills-57d3feabe8bfd4ee389c.js" type="text/partytown"></script>' +
      '<script src="https://platform.twitter.com/_next/static/chunks/runtime-a148fbcbc5efcd91d3a7.js" async="" type="text/partytown"></script>'
  );
});

function check(src: string, expectation: string) {
  assert.equal(replaceScriptWithPartytownScript(src), expectation);
}

test.run();
