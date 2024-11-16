import { deserializeFromMain } from './worker-serialization';
import { environments } from './worker-constants';
import type { ForwardMainTriggerData } from '../types';
import { len } from '../utils';

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

    for (; i < l; i++) {
      if (i + 1 < l) {
        target = target[$forward$[i]];
      } else {
        target[$forward$[i]]?.apply(target, deserializeFromMain(null, $winId$, [], $args$));
      }
    }
  } catch (e) {
    console.error(e);
  }
};
