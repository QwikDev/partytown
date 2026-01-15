import { deserializeFromMain } from './worker-serialization';
import { environments } from './worker-constants';
import type { ForwardMainTriggerData } from '../types';
import { debug, len } from '../utils';

export const workerForwardedTriggerHandle = ({
  $winId$,
  $forward$,
  $args$,
}: ForwardMainTriggerData) => {
  // see src/lib/main/snippet.ts and src/lib/sandbox/main-forward-trigger.ts
  try {
    let target: any = environments[$winId$].$window$;
    const win = environments[$winId$].$window$;
    let i = 0;
    let l = len($forward$);
    
    // Debug dataLayer.push events in worker
    const forwardPath = $forward$.join('.');
    const isDataLayerPush = forwardPath === 'dataLayer.push';
    let eventName = 'unknown';
    let isGaEvent = false;
    
    if (debug && isDataLayerPush) {
      const deserializedArgs = deserializeFromMain(null, $winId$, [], $args$);
      const eventData = deserializedArgs?.[0];
      eventName = eventData?.event || 'unknown';
      isGaEvent = ['page_view', 'view_item', 'add_to_cart', 'purchase', 'begin_checkout'].includes(eventName);
      
      if (isGaEvent) {
        console.debug('[Partytown Worker] 📥 Received dataLayer.push - GA Event:', eventName);
        console.debug('[Partytown Worker] 📥 Event data:', JSON.stringify(eventData).substring(0, 500));
        
        // Check GA4/GTM state before event
        try {
          const gtag = (win as any).gtag;
          const gtm = (win as any).google_tag_manager;
          const gtd = (win as any).google_tag_data;
          const ga = (win as any).ga;
          const dl = (win as any).dataLayer;
          
          console.debug('[Partytown Worker] 🔍 GA4 State Check:', {
            'gtag': typeof gtag,
            'google_tag_manager': gtm ? Object.keys(gtm) : 'undefined',
            'google_tag_data': gtd ? Object.keys(gtd) : 'undefined', 
            'ga': typeof ga,
            'dataLayer.length': dl?.length,
          });
          
          // CRITICAL: If gtag is undefined, that's the root cause
          if (typeof gtag !== 'function') {
            console.debug('[Partytown Worker] ⚠️ gtag is NOT a function - this is why /collect calls are not happening!');
            console.debug('[Partytown Worker] ⚠️ Check if gtag/js script was loaded and executed successfully');
            
            // Check if GA4 config exists in dataLayer
            if (dl) {
              const ga4Config = dl.find((item: any) => 
                item && (item[0] === 'config' || item[0] === 'js')
              );
              if (ga4Config) {
                console.debug('[Partytown Worker] 🔍 Found GA4 config in dataLayer:', ga4Config);
              }
            }
          }
          
          // Check GTM container state
          if (gtm) {
            const containerIds = Object.keys(gtm).filter(k => k.startsWith('GTM-') || k.startsWith('G-'));
            console.debug('[Partytown Worker] 🔍 GTM Containers:', containerIds);
            
            // Check if there's a message queue
            containerIds.forEach(id => {
              const container = gtm[id];
              if (container) {
                console.debug(`[Partytown Worker] 🔍 Container ${id}:`, {
                  'type': typeof container,
                  'keys': typeof container === 'object' ? Object.keys(container).slice(0, 10) : 'N/A'
                });
              }
            });
          }
          
          // Check for consent state
          if (gtd?.ics) {
            console.debug('[Partytown Worker] 🔍 Consent state (ics):', gtd.ics);
          }
        } catch (e) {
          console.debug('[Partytown Worker] 🔍 State check error:', e);
        }
      }
    }

    for (; i < l; i++) {
      if (i + 1 < l) {
        target = target[$forward$[i]];
      } else {
        const args = deserializeFromMain(null, $winId$, [], $args$);
        
        // Debug: check if dataLayer exists and has the push method
        if (debug && isDataLayerPush && isGaEvent) {
          console.debug('[Partytown Worker] 📥 Calling dataLayer.push, dataLayer exists:', !!target, 'push exists:', typeof target?.push);
          
          // Store fetch count before the push
          (win as any)._ptFetchCountBefore = (win as any)._ptFetchCount || 0;
        }
        
        target[$forward$[i]].apply(target, args);
        
        if (debug && isDataLayerPush && isGaEvent) {
          console.debug('[Partytown Worker] ✅ dataLayer.push completed for:', eventName);
          
          // Check if any fetch was made during the push (with a small delay to allow async)
          setTimeout(() => {
            const fetchCountAfter = (win as any)._ptFetchCount || 0;
            const fetchCountBefore = (win as any)._ptFetchCountBefore || 0;
            console.debug('[Partytown Worker] 📊 Fetch calls during event:', fetchCountAfter - fetchCountBefore);
            
            // Also check dataLayer for any gtm.dom or gtm.load events
            const dl = (win as any).dataLayer;
            if (dl) {
              const gtmEvents = dl.filter((item: any) => 
                item?.event?.startsWith('gtm.') || item?.['gtm.start']
              );
              console.debug('[Partytown Worker] 📊 GTM events in dataLayer:', gtmEvents.length);
            }
          }, 100);
        }
      }
    }
  } catch (e) {
    console.error('[Partytown Worker] ❌ Forward trigger error:', e);
  }
};
