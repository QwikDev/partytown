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

  // Check if this is a cookie-related operation for debugging
  const isCookieOp = accessReq.$tasks$?.some(t => 
    t.$applyPath$?.includes('cookie')
  );
  const startTime = isCookieOp ? performance.now() : 0;
  
  if (isCookieOp) {
    console.debug('[Partytown Worker Atomics] Cookie operation starting, msgId:', accessReq.$msgId$);
  }

  // Reset length before call
  Atomics.store(sharedData, 0, 0);

  // Asynchronously call main
  webWorkerCtx.$postMessage$([WorkerMessageType.ForwardWorkerAccessRequest, accessReq]);

  // Synchronously wait for response
  const waitResult = Atomics.wait(sharedData, 0, 0);
  
  if (isCookieOp) {
    const waitTime = performance.now() - startTime;
    console.debug('[Partytown Worker Atomics] Cookie wait completed, result:', waitResult, 'time:', waitTime, 'ms');
  }

  let dataLength = Atomics.load(sharedData, 0);
  let accessRespStr = '';
  let i = 0;

  for (; i < dataLength; i++) {
    accessRespStr += String.fromCharCode(sharedData[i + 1]);
  }

  const response = JSON.parse(accessRespStr) as MainAccessResponse;
  
  if (isCookieOp) {
    const totalTime = performance.now() - startTime;
    console.debug('[Partytown Worker Atomics] Cookie operation completed, total time:', totalTime, 'ms');
  }

  return response;
};

export default syncSendMessageToMainAtomics;
