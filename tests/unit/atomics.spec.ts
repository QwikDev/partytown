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

type Respond = (accessReq: any, cb: (accessRsp: any) => void) => void;

const echo: Respond = (accessReq, cb) =>
  cb({ $msgId$: accessReq.$msgId$, $rtnValue$: accessReq.$msgId$ });

const setup = async (respond: Respond) => {
  const onMessage = await createMessengerAtomics(respond);
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

// the worker's clock jumps past the timeout while main doesn't answer
const timingOut = <T>(fn: () => T) => {
  const now = Date.now;
  let t = 0;
  Date.now = () => (t += 1e6);
  try {
    return fn();
  } finally {
    Date.now = now;
  }
};

test('returns the response', async () => {
  const send = await setup(echo);
  assert.equal(send('a').$rtnValue$, 'a');
  assert.equal(send('b').$rtnValue$, 'b');
});

test('keeps non-ascii text and grows the buffer for large responses', async () => {
  const send = await setup(echo);
  assert.equal(send('zażółć 😀').$rtnValue$, 'zażółć 😀');
  // more than the initial 1MB buffer
  const large = 'ż'.repeat(1024 * 1024);
  assert.equal(send(large).$rtnValue$, large);
});

test('times out, then drops the late response while the next request waits', async () => {
  let lateA: (() => void) | undefined;
  const send = await setup((accessReq, cb) => {
    if (accessReq.$msgId$ == 'a') {
      lateA = () => echo(accessReq, cb);
    } else {
      // main answers in order: a's late response comes first
      lateA!();
      echo(accessReq, cb);
    }
  });
  assert.equal(timingOut(() => send('a')).$error$, 'Timeout');
  assert.equal(send('b').$rtnValue$, 'b');
});

test('a request main never answers does not affect the next ones', async () => {
  const send = await setup((accessReq, cb) => accessReq.$msgId$ != 'a' && echo(accessReq, cb));
  assert.equal(timingOut(() => send('a')).$error$, 'Timeout');
  assert.equal(send('b').$rtnValue$, 'b');
  assert.equal(send('c').$rtnValue$, 'c');
});

test.run();
