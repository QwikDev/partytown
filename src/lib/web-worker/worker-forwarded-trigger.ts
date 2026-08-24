import { deserializeFromMain } from './worker-serialization';
import { environments, webWorkerCtx } from './worker-constants';
import type { ForwardMainTriggerData } from '../types';
import { debug, emptyObjectValue, len } from '../utils';
import { logWorker } from '../log';

export const workerForwardedTriggerHandle = ({
  $winId$,
  $forward$,
  $args$,
}: ForwardMainTriggerData) => {
  // see src/lib/main/snippet.ts and src/lib/sandbox/main-forward-trigger.ts
  try {
    let target: any = environments[$winId$].$window$;
    let i = 0;
    let l = len($forward$);

    if (debug && webWorkerCtx.$config$.logForwardedEvents) {
      logWorker(`Forwarded event received: ${$forward$.join('.')}()`, $winId$);
    }

    for (; i < l; i++) {
      if (i + 1 < l) {
        // create any missing part of the path so early events aren't dropped,
        // e.g. a dataLayer array the worker script hasn't created yet
        target = target[$forward$[i]] = target[$forward$[i]] || emptyObjectValue($forward$[i + 1]);
      } else {
        const deserializedArgs = deserializeFromMain(null, $winId$, [], $args$);
        if (debug && webWorkerCtx.$config$.logForwardedEvents) {
          logWorker(
            `Forwarded event execute: ${$forward$.join('.')}(${deserializedArgs
              .map((a: any) =>
                typeof a === 'object' ? JSON.stringify(a)?.slice(0, 60) : String(a)
              )
              .join(', ')})`,
            $winId$
          );
        }
        target[$forward$[i]].apply(target, deserializedArgs);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
