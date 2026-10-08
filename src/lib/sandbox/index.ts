import { debug, trustedType } from '../utils';
import { getAndSetInstanceId, getPageFrame } from './main-instances';
import { libPath, mainWindow } from './main-globals';
import { logMain } from '../log';
import { mainAccessHandler } from './main-access-handler';
import {
  type MessageFromWorkerToSandbox,
  type MessengerRequestCallback,
  type PartytownWebWorker,
  WorkerMessageType,
} from '../types';
import { registerWindow } from './main-register-window';
import syncCreateMessenger from '../build-modules/sync-create-messenger';
import WebWorkerBlob from '../build-modules/web-worker-blob';
import WebWorkerUrl from '../build-modules/web-worker-url';
import { VERSION } from '../build-modules/version';

let worker: PartytownWebWorker;

const receiveMessage: MessengerRequestCallback = (accessReq, responseCallback) =>
  mainAccessHandler(worker, accessReq).then(responseCallback);

syncCreateMessenger(receiveMessage).then((onMessageHandler) => {
  if (onMessageHandler) {
    worker = new Worker(
      trustedType(
        'createScriptURL',
        debug
          ? libPath + WebWorkerUrl
          : URL.createObjectURL(
              new Blob([WebWorkerBlob], {
                type: 'text/javascript',
              })
            )
      ) as any,
      { name: `Partytown 🎉` }
    );

    worker.onmessage = (ev: MessageEvent<MessageFromWorkerToSandbox>) => {
      const msg: MessageFromWorkerToSandbox = ev.data;
      if (msg[0] === WorkerMessageType.AsyncAccessRequest) {
        // fire and forget async call within web worker
        mainAccessHandler(worker, msg[1], 1);
      } else {
        // blocking call within web worker
        onMessageHandler(worker, msg);
      }
    };

    if (debug) {
      logMain(`Created Partytown web worker (${VERSION})`);
      worker.onerror = (ev) => console.error(`Web Worker Error`, ev);
    }

    mainWindow.addEventListener<any>('pt1', (ev: CustomEvent) =>
      registerWindow(worker, getAndSetInstanceId(ev.detail.frameElement)!, ev.detail)
    );

    if (window !== mainWindow) {
      // The worker's posts to a page's iframe are made from this sandbox, so the frame's reply
      // (`event.source.postMessage`) arrives here. Without Partytown the page made the post,
      // so the reply goes on to the page, where the worker listens.
      window.addEventListener('message', (ev) => {
        if (getPageFrame(ev.source)) {
          mainWindow.dispatchEvent(
            new (mainWindow as any).MessageEvent('message', {
              data: ev.data,
              origin: ev.origin,
              source: ev.source,
              ports: ev.ports,
            })
          );
        }
      });
    }
  }
});
