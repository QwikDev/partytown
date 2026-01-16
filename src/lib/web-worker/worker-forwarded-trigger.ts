import { deserializeFromMain } from './worker-serialization';
import { environments } from './worker-constants';
import type { ForwardMainTriggerData } from '../types';
import { len } from '../utils';
import { sendGA4Collect, GA4_ECOMMERCE_EVENTS } from './worker-ga4-collect';

export const workerForwardedTriggerHandle = ({
  $winId$,
  $forward$,
  $args$,
}: ForwardMainTriggerData) => {
  // see src/lib/main/snippet.ts and src/lib/sandbox/main-forward-trigger.ts
  try {
    const env = environments[$winId$];
    if (!env) {
      return;
    }
    let target: any = env.$window$;
    const win = env.$window$;
    let i = 0;
    let l = len($forward$);

    // Check if this is a dataLayer.push for GA events
    const forwardPath = $forward$.join('.');
    const isDataLayerPush = forwardPath === 'dataLayer.push';

    for (; i < l; i++) {
      if (i + 1 < l) {
        target = target[$forward$[i]];
      } else {
        const args = deserializeFromMain(null, $winId$, [], $args$);

        // Execute the original dataLayer.push
        target[$forward$[i]].apply(target, args);

        // Direct GA4 Measurement Protocol for GA events
        // This bypasses GTM's broken internal processing in Partytown's sandbox
        // while ensuring GA4 receives all event data
        if (isDataLayerPush) {
          const eventData = args?.[0];

          // Handle multiple formats:
          // 1. dataLayer.push({event: 'view_item', ...})
          // 2. gtag('event', 'view_item', {...})
          // 3. Array format ['event', 'view_item', {...}]
          let eventName = eventData?.event;
          let eventParams = eventData;

          // Check for gtag() Arguments format
          if (!eventName && eventData?.[0] === 'event' && typeof eventData?.[1] === 'string') {
            eventName = eventData[1];
            eventParams = eventData[2] || {};
          }

          // Check for array format
          if (!eventName && Array.isArray(eventData) && eventData[0] === 'event') {
            eventName = eventData[1];
            eventParams = eventData[2] || {};
          }

          // Send via GA4 Measurement Protocol if it's a supported event
          if (eventName && GA4_ECOMMERCE_EVENTS.includes(eventName)) {
            sendGA4Collect(win, eventName, eventParams, {
              isPageView: eventName === 'page_view',
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('[Partytown] Forward trigger error:', e);
  }
};
