import {
  debug,
  emptyObjectValue,
  getOriginalBehavior,
  len,
  resolvePartytownForwardProperty,
} from '../utils';
import { type MainWindow, type PartytownWebWorker, type WinId, WorkerMessageType } from '../types';
import { serializeForWorker } from './main-serialization';
import { logMain } from '../log';

export const mainForwardTrigger = (worker: PartytownWebWorker, $winId$: WinId, win: MainWindow) => {
  let queuedForwardCalls = win._ptf;
  let config = win.partytown || {};
  let forwards = config.forward || [];
  let i: number;
  let mainForwardFn: typeof win;

  let forwardCall = ($forward$: string[], args: any) =>
    worker.postMessage([
      WorkerMessageType.ForwardMainTrigger,
      {
        $winId$,
        $forward$,
        $args$: serializeForWorker($winId$, Array.from(args)),
      },
    ]);

  win._ptf = undefined;

  forwards.map((forwardProps) => {
    const [property, { preserveBehavior }] = resolvePartytownForwardProperty(forwardProps);
    mainForwardFn = win;
    property.split('.').map((_, i, arr) => {
      mainForwardFn = mainForwardFn[arr[i]] =
        i + 1 < len(arr)
          ? mainForwardFn[arr[i]] || emptyObjectValue(arr[i + 1])
          : (() => {
              let originalFunction: ((...args: any[]) => any) | null = null;
              if (preserveBehavior) {
                const { methodOrProperty, thisObject } = getOriginalBehavior(win, arr);
                if (typeof methodOrProperty === 'function') {
                  originalFunction = (...args: any[]) =>
                    methodOrProperty.apply(thisObject, ...args);
                }
              }
              return (...args: any[]) => {
                let returnValue: any;
                if (originalFunction) {
                  returnValue = originalFunction(args);
                }
                if (debug && config.logForwardedEvents) {
                  logMain(`Forward event: ${arr.join('.')}()`);
                }
                forwardCall(arr, args);
                return returnValue;
              };
            })();
    });
  });

  if (queuedForwardCalls) {
    for (i = 0; i < len(queuedForwardCalls); i += 2) {
      if (debug && config.logForwardedEvents) {
        logMain(`Forward queued event: ${queuedForwardCalls[i].join('.')}()`);
      }
      forwardCall(queuedForwardCalls[i], queuedForwardCalls[i + 1]);
    }
  }
};
