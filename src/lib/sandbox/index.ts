import { debug } from '../utils';
import { getAndSetInstanceId } from './main-instances';
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

// Global error handlers on main thread
window.onerror = (message, source, lineno, colno, error) => {
  console.debug('[Partytown Main] GLOBAL ERROR:', message, 'source:', source, 'line:', lineno, 'error:', error);
  return false;
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.debug('[Partytown Main] UNHANDLED REJECTION:', event.reason, event);
};

// Intercept console methods on main thread to capture Google's error messages
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalDebug = console.debug;
const originalInfo = console.info;

console.log = (...args: any[]) => {
  const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
  if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
    originalDebug.call(console, '[Partytown Main] CAPTURED console.log:', ...args);
    originalDebug.call(console, '[Partytown Main] Log stack:', new Error().stack);
  }
  originalLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
  if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
    originalDebug.call(console, '[Partytown Main] CAPTURED console.error:', ...args);
    originalDebug.call(console, '[Partytown Main] Error stack:', new Error().stack);
  }
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
  if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
    originalDebug.call(console, '[Partytown Main] CAPTURED console.warn:', ...args);
    originalDebug.call(console, '[Partytown Main] Warn stack:', new Error().stack);
  }
  originalWarn.apply(console, args);
};

console.info = (...args: any[]) => {
  const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
  if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
    originalDebug.call(console, '[Partytown Main] CAPTURED console.info:', ...args);
  }
  originalInfo.apply(console, args);
};

let worker: PartytownWebWorker;

const receiveMessage: MessengerRequestCallback = (accessReq, responseCallback) =>
  mainAccessHandler(worker, accessReq).then(responseCallback);

syncCreateMessenger(receiveMessage).then((onMessageHandler) => {
  if (onMessageHandler) {
    worker = new Worker(
      debug
        ? libPath + WebWorkerUrl
        : URL.createObjectURL(
            new Blob([WebWorkerBlob], {
              type: 'text/javascript',
            })
          ),
      { name: `Partytown 🎉` }
    );

    worker.onmessage = (ev: MessageEvent<MessageFromWorkerToSandbox>) => {
      const msg: MessageFromWorkerToSandbox = ev.data;
      if (msg[0] === WorkerMessageType.AsyncAccessRequest) {
        // fire and forget async call within web worker
        mainAccessHandler(worker, msg[1]);
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
  }
});
