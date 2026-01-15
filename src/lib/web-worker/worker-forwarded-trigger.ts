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
          // Standard GA4 ecommerce events
          const gaEvents = ['page_view', 'view_item', 'add_to_cart', 'purchase', 'begin_checkout', 'select_item'];
          
          // Handle two formats:
          // 1. dataLayer.push({event: 'page_view', ...}) - eventData.event
          // 2. gtag('event', 'page_view', {...}) - eventData[0]='event', eventData[1]='page_view'
          let eventName = eventData?.event;
          let eventParams = eventData;
          
          // Check for gtag() Arguments format: ['event', 'event_name', {params}]
          if (!eventName && eventData?.[0] === 'event' && typeof eventData?.[1] === 'string') {
            eventName = eventData[1];
            eventParams = eventData[2] || {};
          }
          
          // Also check for array format ['event', 'page_view', {...}]
          if (!eventName && Array.isArray(eventData) && eventData[0] === 'event') {
            eventName = eventData[1];
            eventParams = eventData[2] || {};
          }
          
          if (eventName && gaEvents.includes(eventName)) {
            try {
              const doc = (win as any).document;
              const nav = (win as any).navigator;
              const cookies = doc?.cookie || '';
              
              // Extract client ID from _ga cookie
              const gaCookie = cookies.match(/_ga=([^;]+)/)?.[1];
              const clientId = gaCookie?.split('.')?.slice(-2)?.join('.') || 'fallback.' + Date.now();
              
              // Extract session ID from _ga_XXXXX cookie
              const sessionCookie = cookies.match(/_ga_52LKG2B3L1=([^;]+)/)?.[1];
              const sessionParts = sessionCookie?.split(/[$.]/) || [];
              const sessionId = sessionParts[2]?.replace('s', '') || Date.now().toString();
              
              const screenRes = `${(win as any).screen?.width || 1920}x${(win as any).screen?.height || 1080}`;
              
              // Build GA4 Measurement Protocol request
              const params = new URLSearchParams({
                v: '2',
                tid: 'G-52LKG2B3L1',
                gtm: '45je61d1',
                _p: Date.now().toString(),
                cid: clientId,
                ul: nav?.language || 'en-us',
                sr: screenRes,
                _s: '1',
                sid: sessionId,
                sct: '1',
                seg: '1',
                dl: doc?.location?.href || '',
                dt: doc?.title || '',
                en: eventName,
              });
              
              // Add ecommerce items (check both eventParams.ecommerce and eventParams.items)
              const ecommerce = eventParams?.ecommerce || eventParams;
              if (ecommerce?.items) {
                ecommerce.items.forEach((item: any, idx: number) => {
                  const prNum = idx + 1;
                  const prValue = [
                    item.item_id ? `id${item.item_id}` : '',
                    item.item_name ? `nm${item.item_name}` : '',
                    item.affiliation ? `af${item.affiliation}` : 'af',
                    item.item_brand ? `br${item.item_brand}` : '',
                    item.item_variant ? `va${item.item_variant}` : '',
                    item.item_category ? `ca${item.item_category}` : '',
                    item.item_category2 ? `c2${item.item_category2}` : '',
                    item.location_id ? `lo${item.location_id}` : 'lo',
                    item.price !== undefined ? `pr${item.price}` : '',
                    item.quantity !== undefined ? `qt${item.quantity}` : '',
                  ].filter(Boolean).join('~');
                  params.set(`pr${prNum}`, prValue);
                });
              }
              
              // Add value and currency from ecommerce or direct params
              const value = ecommerce?.value || eventParams?.value;
              const currency = ecommerce?.currency || eventParams?.currency;
              if (value) {
                params.set('epn.value', value.toString());
              }
              if (currency) {
                params.set('cu', currency);
              }
              
              // For page_view, add page-specific parameters if available
              if (eventName === 'page_view') {
                if (eventParams?.page_location) {
                  params.set('dl', eventParams.page_location);
                }
                if (eventParams?.page_title) {
                  params.set('dt', eventParams.page_title);
                }
                if (eventParams?.page_referrer) {
                  params.set('dr', eventParams.page_referrer);
                }
              }
              
              const collectUrl = `https://analytics.google.com/g/collect?${params.toString()}`;
              
              fetch(collectUrl, {
                method: 'POST',
                mode: 'no-cors',
                keepalive: true,
                credentials: 'include',
              });
            } catch (e) {
              // Silently fail - GTM may still process the event
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('[Partytown] Forward trigger error:', e);
  }
};
