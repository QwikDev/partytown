import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { WorkerMessageType } from '../../src/lib/types';

// the sandbox modules read window and document on import, and the init data
// reads the main platform: stub both, only the shared buffer is needed here
const g = globalThis as any;
g.window = { parent: {} };
g.document = { implementation: { createHTMLDocument: () => ({}) } };
require.cache[require.resolve('../../src/lib/sandbox/read-main-platform')] = {
  exports: { readMainPlatform: () => ({}), readMainInterfaces: () => [] },
} as any;
const createMessengerAtomics =
  require('../../src/lib/atomics/sync-create-messenger-atomics').default;
const syncSendMessageToMainAtomics =
  require('../../src/lib/atomics/sync-send-message-to-main-atomics').default;
delete g.window;
delete g.document;

const setup = async () => {
  const onMessage = await createMessengerAtomics((accessReq: any, cb: any) =>
    cb({ $msgId$: accessReq.$msgId$, $rtnValue$: accessReq.$msgId$ })
  );
  let sharedDataBuffer: any;
  onMessage(
    { postMessage: (msg: any) => (sharedDataBuffer = msg[1].$sharedDataBuffer$) } as any,
    [WorkerMessageType.MainDataRequestFromWorker] as any
  );
  const ctx: any = {
    $sharedDataBuffer$: sharedDataBuffer,
    $postMessage$: (msg: any) => onMessage(null as any, msg),
  };
  return (msgId: string) => syncSendMessageToMainAtomics(ctx, { $msgId$: msgId, $tasks$: [] });
};

test('returns the response', async () => {
  const send = await setup();
  assert.equal(send('a').$rtnValue$, 'a');
  assert.equal(send('b').$rtnValue$, 'b');
});

test('keeps non-ascii text and grows the buffer for large responses', async () => {
  const send = await setup();
  assert.equal(send('zażółć 😀').$rtnValue$, 'zażółć 😀');
  // more than the initial 1MB buffer
  const large = 'ż'.repeat(1024 * 1024);
  assert.equal(send(large).$rtnValue$, large);
});

test.run();
