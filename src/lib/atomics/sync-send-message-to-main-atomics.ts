import {
  type MainAccessRequest,
  type MainAccessResponse,
  type WebWorkerContext,
  WorkerMessageType,
} from '../types';

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

  // Synchronously wait for response
  Atomics.wait(sharedData, 0, 0);

  let dataLength = Atomics.load(sharedData, 0);
  let accessRespStr = '';
  let i = 0;

  for (; i < dataLength; i++) {
    accessRespStr += String.fromCharCode(sharedData[i + 1]);
  }

  return JSON.parse(accessRespStr) as MainAccessResponse;
};

export default syncSendMessageToMainAtomics;
