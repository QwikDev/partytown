import {
  type MainAccessRequest,
  type MainAccessResponse,
  type WebWorkerContext,
  WorkerMessageType,
} from '../types';
import { debug } from '../utils';

// same as the service worker's timeout
const timeout = debug ? 120000 : 10000;

// sharedData[0] is the response length once main has written one, 0 while
// waiting, and minus the number of abandoned (timed out) requests whose late
// responses main must drop, see createMessengerAtomics
const syncSendMessageToMainAtomics = (
  webWorkerCtx: WebWorkerContext,
  accessReq: MainAccessRequest
): MainAccessResponse => {
  const sharedDataBuffer = webWorkerCtx.$sharedDataBuffer$!;
  const sharedData = new Int32Array(sharedDataBuffer);
  const deadline = Date.now() + timeout;
  let dataLength: number;

  // Asynchronously call main
  webWorkerCtx.$postMessage$([WorkerMessageType.ForwardWorkerAccessRequest, accessReq]);

  // Synchronously wait for response
  while ((dataLength = Atomics.load(sharedData, 0)) <= 0) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      if (Atomics.compareExchange(sharedData, 0, dataLength, dataLength - 1) === dataLength) {
        return { $msgId$: accessReq.$msgId$, $error$: 'Timeout' };
      }
      // main wrote the response or dropped a late one meanwhile, check again
    } else {
      Atomics.wait(sharedData, 0, dataLength, remaining);
    }
  }

  let accessRespStr = '';
  let i = 0;

  for (; i < dataLength; i++) {
    accessRespStr += String.fromCharCode(sharedData[i + 1]);
  }

  Atomics.store(sharedData, 0, 0);

  return JSON.parse(accessRespStr) as MainAccessResponse;
};

export default syncSendMessageToMainAtomics;
