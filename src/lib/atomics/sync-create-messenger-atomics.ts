import {
  type MainAccessRequest,
  type MessageFromWorkerToSandbox,
  type Messenger,
  type PartytownWebWorker,
  WorkerMessageType,
} from '../types';
import { onMessageFromWebWorker } from '../sandbox/on-messenge-from-worker';
import { readMainInterfaces, readMainPlatform } from '../sandbox/read-main-platform';

const createMessengerAtomics: Messenger = async (receiveMessage) => {
  const maxSize = 1024 * 1024 * 1024;
  // start small and grow on demand, eagerly allocating
  // the full 1GB can fail in Chrome (#689)
  let sharedDataBuffer: SharedArrayBuffer = new (SharedArrayBuffer as any)(1024 * 1024, {
    maxByteLength: maxSize,
  });
  if (!(sharedDataBuffer as any).growable) {
    // growable SharedArrayBuffer not supported
    sharedDataBuffer = new SharedArrayBuffer(maxSize);
  }
  const sharedData = new Int32Array(sharedDataBuffer);
  const encoder = new TextEncoder();

  return (worker: PartytownWebWorker, msg: MessageFromWorkerToSandbox) => {
    const msgType = msg[0];
    const accessReq = msg[1] as MainAccessRequest;

    if (msgType === WorkerMessageType.MainDataRequestFromWorker) {
      // web worker has requested the initial data from the main thread
      // collect up the info about the main thread interfaces
      // send the main thread interface data to the web worker
      const initData = readMainPlatform();
      initData.$sharedDataBuffer$ = sharedDataBuffer;
      worker.postMessage([WorkerMessageType.MainDataResponseToWorker, initData]);
    } else if (msg[0] === WorkerMessageType.MainInterfacesRequestFromWorker) {
      // web worker has requested the rest of the html/svg interfaces
      worker.postMessage([WorkerMessageType.MainInterfacesResponseToWorker, readMainInterfaces()]);
    } else if (msgType === WorkerMessageType.ForwardWorkerAccessRequest) {
      receiveMessage(accessReq, (accessRsp) => {
        // utf-8 after the length slot. chromium's encodeInto() rejects shared
        // buffers, so encode() and copy
        let encoded = encoder.encode(JSON.stringify(accessRsp));
        const neededBytes = 4 + encoded.length;
        if (
          (sharedDataBuffer as any).growable &&
          sharedDataBuffer.byteLength < neededBytes &&
          neededBytes <= maxSize
        ) {
          (sharedDataBuffer as any).grow(neededBytes);
        }
        if (sharedDataBuffer.byteLength < neededBytes) {
          // a cut response wouldn't parse
          encoded = encoder.encode(
            JSON.stringify({ $msgId$: accessRsp.$msgId$, $error$: 'Response too large' })
          );
        }
        new Uint8Array(sharedDataBuffer, 4).set(encoded);
        sharedData[0] = encoded.length;
        Atomics.notify(sharedData, 0);
      });
    } else {
      onMessageFromWebWorker(worker, msg);
    }
  };
};
export default createMessengerAtomics;
