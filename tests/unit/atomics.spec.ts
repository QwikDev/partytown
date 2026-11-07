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

const setup = async (respondSync: boolean) => {
  const pending: [any, (rsp: any) => void][] = [];
  const onMessage = await createMessengerAtomics((accessReq: any, cb: any) => {
    if (respondSync) cb({ $msgId$: accessReq.$msgId$, $rtnValue$: accessReq.$msgId$ } as any);
    else pending.push([accessReq, cb]);
  });
  let sharedDataBuffer: any;
  onMessage(
    { postMessage: (msg: any) => (sharedDataBuffer = msg[1].$sharedDataBuffer$) } as any,
    [WorkerMessageType.MainDataRequestFromWorker] as any
  );
  const ctx: any = {
    $sharedDataBuffer$: sharedDataBuffer,
    $postMessage$: (msg: any) => onMessage(null as any, msg),
  };
  const send = (msgId: string) =>
    syncSendMessageToMainAtomics(ctx, { $msgId$: msgId, $tasks$: [] });
  const slot = () => Atomics.load(new Int32Array(sharedDataBuffer), 0);
  return { send, slot, pending, setSync: (v: boolean) => (respondSync = v) };
};

test('returns the response and resets the length', async () => {
  const { send, slot } = await setup(true);
  assert.equal(send('a').$rtnValue$, 'a');
  assert.equal(slot(), 0);
  assert.equal(send('b').$rtnValue$, 'b');
});

test('times out, then drops the late response', async () => {
  const { send, slot, pending, setSync } = await setup(false);
  const now = Date.now;
  let t = 0;
  Date.now = () => (t += 1e6);
  try {
    assert.equal(send('a').$error$, 'Timeout');
  } finally {
    Date.now = now;
  }
  assert.equal(slot(), -1);

  // late response for 'a' must not reach the next request
  const [req, cb] = pending[0];
  cb({ $msgId$: req.$msgId$, $rtnValue$: req.$msgId$ });
  assert.equal(slot(), 0);
  setSync(true);
  assert.equal(send('b').$rtnValue$, 'b');
});

test.run();
