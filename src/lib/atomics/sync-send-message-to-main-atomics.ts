import {
  type MainAccessRequest,
  type MainAccessResponse,
  type WebWorkerContext,
  WorkerMessageType,
} from '../types';

const decoder = new TextDecoder();

const syncSendMessageToMainAtomics = (
  webWorkerCtx: WebWorkerContext,
  accessReq: MainAccessRequest
): MainAccessResponse => {
  const sharedDataBuffer = webWorkerCtx.$sharedDataBuffer$!;
  const sharedData = new Int32Array(sharedDataBuffer);

  // Reset length before call
  Atomics.store(sharedData, 0, 0);

  // Asynchronously call main
  webWorkerCtx.$postMessage$([WorkerMessageType.ForwardWorkerAccessRequest, accessReq]);

  // Synchronously wait for response. a wake up from the previous response's
  // late notify still finds the length reset, wait again
  let dataLength: number;
  while (!(dataLength = Atomics.load(sharedData, 0))) {
    Atomics.wait(sharedData, 0, 0);
  }

  // utf-8 byte length, the bytes follow the length slot. TextDecoder doesn't
  // take a shared buffer's view, slice() copies it out
  const accessRespStr = decoder.decode(new Uint8Array(sharedDataBuffer, 4, dataLength).slice());

  return JSON.parse(accessRespStr) as MainAccessResponse;
};

export default syncSendMessageToMainAtomics;
