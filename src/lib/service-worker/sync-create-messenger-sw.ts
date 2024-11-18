import {
  type MainAccessRequest,
  type MessageFromWorkerToSandbox,
  type Messenger,
  type PartytownWebWorker,
  WorkerMessageType,
} from '../types';
import { onMessageFromWebWorker } from '../sandbox/on-messenge-from-worker';
import { readMainInterfaces, readMainPlatform } from '../sandbox/read-main-platform';

const createMessengerServiceWorker: Messenger = (receiveMessage) => {
  const swContainer = window.navigator.serviceWorker;
  return swContainer.getRegistration().then((swRegistration) => {
    swContainer.addEventListener('message', (ev: MessageEvent<MainAccessRequest>) =>
      receiveMessage(
        ev.data,
        (accessRsp) => swRegistration!.active && swRegistration!.active.postMessage(accessRsp)
      )
    );

    return (worker: PartytownWebWorker, msg: MessageFromWorkerToSandbox) => {
      if (msg[0] === WorkerMessageType.MainDataRequestFromWorker) {
        // web worker has requested the initial data from the main thread
        // collect up info about the main thread interfaces
        // send the main thread interface data to the web worker
        worker.postMessage([WorkerMessageType.MainDataResponseToWorker, readMainPlatform()]);
      } else if (msg[0] === WorkerMessageType.MainInterfacesRequestFromWorker) {
        // web worker has requested the rest of the html/svg interfaces
        worker.postMessage([
          WorkerMessageType.MainInterfacesResponseToWorker,
          readMainInterfaces(),
        ]);
      } else {
        onMessageFromWebWorker(worker, msg);
      }
    };
  });
};

export default createMessengerServiceWorker;
