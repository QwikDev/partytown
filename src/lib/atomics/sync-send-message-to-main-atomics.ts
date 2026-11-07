import {
  type MainAccessRequest,
  type MainAccessResponse,
  type WebWorkerContext,
  WorkerMessageType,
} from '../types';
import { debug } from '../utils';

// same as the service worker's timeout
const timeout = debug ? 120000 : 10000;

const decoder = new TextDecoder();

let lastRequestId = 0;

// sharedData[0] holds the id of the request the worker waits for. main sets it to 0
// once it wrote that request's response utf-8 byte length to sharedData[1] and
// the bytes after it. on a timeout the worker clears it first, so main drops the late
// response, see createMessengerAtomics
const syncSendMessageToMainAtomics = (
  webWorkerCtx: WebWorkerContext,
  accessReq: MainAccessRequest
): MainAccessResponse => {
  const sharedDataBuffer = webWorkerCtx.$sharedDataBuffer$!;
  const sharedData = new Int32Array(sharedDataBuffer);
  const requestId = (lastRequestId = (lastRequestId % 0x7fffffff) + 1);
  const deadline = Date.now() + timeout;

  Atomics.store(sharedData, 0, requestId);

  // Asynchronously call main
  webWorkerCtx.$postMessage$([WorkerMessageType.ForwardWorkerAccessRequest, accessReq, requestId]);

  // Synchronously wait for response. waking up with the id still set (e.g. an
  // earlier response's notify) waits again
  while (Atomics.load(sharedData, 0) === requestId) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      if (Atomics.compareExchange(sharedData, 0, requestId, 0) === requestId) {
        return { $msgId$: accessReq.$msgId$, $error$: 'Timeout' };
      }
      // main answered meanwhile
    } else {
      Atomics.wait(sharedData, 0, requestId, remaining);
    }
  }

  const dataLength = Atomics.load(sharedData, 1);
  // TextDecoder doesn't take a shared buffer's view, slice() copies it out
  const accessRespStr = decoder.decode(new Uint8Array(sharedDataBuffer, 8, dataLength).slice());

  return JSON.parse(accessRespStr) as MainAccessResponse;
};

export default syncSendMessageToMainAtomics;
