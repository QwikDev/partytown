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
    const env = environments[$winId$];
    if (!env) {
      console.error('[Partytown Worker] ❌ Environment not found for winId:', $winId$);
      return;
    }
    let target: any = env.$window$;
    const win = env.$window$;
    
    // Check environment state
    const timeSinceInit = (win as any)._ptInitTime ? Date.now() - (win as any)._ptInitTime : 'unknown';
    const gtagInitialized = (win as any)._ptGtagInitialized;
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
      
      // Also check select_item since it works
      isGaEvent = isGaEvent || eventName === 'select_item';
      
      if (isGaEvent) {
        console.debug('[Partytown Worker] 📥 ========= GA EVENT:', eventName, '=========');
        console.debug('[Partytown Worker] 📥 Time since window init:', timeSinceInit, 'ms');
        console.debug('[Partytown Worker] 📥 gtag pre-initialized:', gtagInitialized);
        
        // Log key event properties that might differ between working/non-working events
        console.debug('[Partytown Worker] 📥 Event keys:', Object.keys(eventData || {}));
        console.debug('[Partytown Worker] 📥 Has ecommerce:', !!eventData?.ecommerce);
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
          
          // Check gtag state
          if (typeof gtag !== 'function') {
            console.debug('[Partytown Worker] ⚠️ gtag is NOT a function!');
          } else {
            console.debug('[Partytown Worker] ✅ gtag is a function');
            console.debug('[Partytown Worker] 🔍 gtag.toString():', gtag.toString().substring(0, 200));
            
            // Check GA4 container state
            const ga4Container = gtm?.['G-52LKG2B3L1'];
            if (ga4Container) {
              console.debug('[Partytown Worker] 🔍 GA4 container:', {
                keys: Object.keys(ga4Container),
                hasDataLayer: 'dataLayer' in ga4Container,
                hasCallback: 'callback' in ga4Container,
                hasBootstrap: 'bootstrap' in ga4Container,
              });
              
              // Check if GA4 has internal send mechanism
              if (ga4Container.dataLayer) {
                console.debug('[Partytown Worker] 🔍 GA4.dataLayer type:', typeof ga4Container.dataLayer);
                console.debug('[Partytown Worker] 🔍 GA4.dataLayer keys:', Object.keys(ga4Container.dataLayer).slice(0, 10));
              }
              
              // Check callback - this is how tags get triggered
              if (ga4Container.callback) {
                console.debug('[Partytown Worker] 🔍 GA4.callback type:', typeof ga4Container.callback);
                const callbackKeys = Object.keys(ga4Container.callback);
                console.debug('[Partytown Worker] 🔍 GA4.callback keys:', callbackKeys);
                
                // Try to understand what callbacks are registered
                callbackKeys.slice(0, 3).forEach(key => {
                  const cb = ga4Container.callback[key];
                  console.debug(`[Partytown Worker] 🔍 callback[${key}]:`, typeof cb, cb?.toString?.()?.substring(0, 100) || 'N/A');
                });
              }
              
              // Check bootstrap - GA4's initialization state
              if (ga4Container.bootstrap) {
                console.debug('[Partytown Worker] 🔍 GA4.bootstrap type:', typeof ga4Container.bootstrap);
              }
            }
            
            // Check GTM's internal event processing state
            const gtmContainer = gtm?.['GTM-T5GF7DB'];
            if (gtmContainer) {
              console.debug('[Partytown Worker] 🔍 GTM container keys:', Object.keys(gtmContainer).slice(0, 10));
            }
            
            // CRITICAL: Check google_tag_data - this is where GA4 stores its internal state
            if (gtd) {
              console.debug('[Partytown Worker] 🔍 google_tag_data keys:', Object.keys(gtd));
              
              // Check for tidr - the transport/send mechanism - THIS IS THE KEY!
              if (gtd.tidr) {
                console.debug('[Partytown Worker] 🔍 gtd.tidr (transport):', typeof gtd.tidr, Object.keys(gtd.tidr || {}));
                
                // Check destination - this should have the send function
                if (gtd.tidr.destination) {
                  console.debug('[Partytown Worker] 🔍 tidr.destination:', typeof gtd.tidr.destination, Object.keys(gtd.tidr.destination || {}));
                  
                  // Check if there's a GA4 destination
                  const ga4Dest = gtd.tidr.destination['G-52LKG2B3L1'];
                  if (ga4Dest) {
                    console.debug('[Partytown Worker] 🔍 GA4 destination found!', typeof ga4Dest, Object.keys(ga4Dest || {}).slice(0, 10));
                  } else {
                    console.debug('[Partytown Worker] ⚠️ GA4 destination NOT found in tidr.destination');
                    console.debug('[Partytown Worker] 🔍 Available destinations:', Object.keys(gtd.tidr.destination || {}));
                  }
                }
                
                // Check pending queue - events waiting to be sent
                if (gtd.tidr.pending) {
                  console.debug('[Partytown Worker] 🔍 tidr.pending (queued events):', gtd.tidr.pending.length || 0);
                }
              }
              
              // Check for gl - GA4's global state
              if (gtd.gl) {
                console.debug('[Partytown Worker] 🔍 gtd.gl (global):', typeof gtd.gl, Object.keys(gtd.gl || {}).slice(0, 5));
              }
              
              // Check for xcd - cross-domain tracking
              if (gtd.xcd) {
                console.debug('[Partytown Worker] 🔍 gtd.xcd:', typeof gtd.xcd, Object.keys(gtd.xcd || {}).slice(0, 5));
              }
            }
          }
          
          // Check dataLayer for any hints about why events might not fire
          if (dl) {
            // Count how many events of this type are in dataLayer
            const sameEventCount = dl.filter((item: any) => item?.event === eventName).length;
            console.debug('[Partytown Worker] 🔍 Events of type', eventName, 'in dataLayer:', sameEventCount);
            
            // CRITICAL: Check for gtag config commands - these register destinations!
            // Note: gtag pushes Arguments objects, not Arrays, so check for array-like with [0]
            const configCommands = dl.filter((item: any) => 
              item && (item[0] === 'config' || (item.length > 0 && item['0'] === 'config'))
            );
            console.debug('[Partytown Worker] 🔍 Config commands in dataLayer:', configCommands.length);
            configCommands.forEach((cmd: any, i: number) => {
              console.debug(`[Partytown Worker] 🔍 Config ${i}:`, cmd[1] || cmd['1'], cmd[2] ? Object.keys(cmd[2]).slice(0,5) : 'no params');
            });
            
            // Check for 'js' commands
            const jsCommands = dl.filter((item: any) => 
              item && (item[0] === 'js' || (item.length > 0 && item['0'] === 'js'))
            );
            console.debug('[Partytown Worker] 🔍 JS commands in dataLayer:', jsCommands.length);
            
            // Quick dataLayer state check
            console.debug('[Partytown Worker] 🔍 dataLayer.length:', dl.length);
            
            // Check first item to see if data is corrupted
            if (dl.length > 0) {
              const first = dl[0];
              console.debug('[Partytown Worker] 🔍 dl[0] type:', typeof first, first?.event || first?.[0] || String(first).substring(0, 20));
            }
            
            // CRITICAL: Check for config commands - these register GA4 destination
            let hasConfig = false;
            for (let idx = 0; idx < dl.length; idx++) {
              const item = dl[idx];
              if (item && item[0] === 'config') {
                hasConfig = true;
                console.debug('[Partytown Worker] 🔍 Found config command at index', idx, ':', item[1]);
              }
              if (item && item[0] === 'js') {
                console.debug('[Partytown Worker] 🔍 Found js command at index', idx);
              }
            }
            if (!hasConfig) {
              console.debug('[Partytown Worker] ⚠️ NO config commands found in dataLayer!');
              console.debug('[Partytown Worker] ⚠️ GA4 destination will NOT be registered without gtag("config", "G-52LKG2B3L1")');
            }
            
            // Check if push is enhanced
            const pushStr = dl.push?.toString?.() || '';
            const isEnhanced = pushStr.includes('SANDBOXED');
            console.debug('[Partytown Worker] 🔍 push enhanced:', isEnhanced);
            
            // Check for gtm.start/gtm.load - these indicate GTM lifecycle
            const gtmEvents = dl.filter((item: any) => 
              item?.['gtm.start'] || item?.event?.startsWith?.('gtm.')
            );
            console.debug('[Partytown Worker] 🔍 GTM lifecycle events:', gtmEvents.length);
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
        
        // Log what we're pushing to dataLayer (only for GA events to reduce noise)
        if (debug && isDataLayerPush && isGaEvent) {
          console.debug('[Partytown Worker] 📤 Pushing to dataLayer:', eventName);
        }

        // Debug: check if dataLayer exists and has the push method
        if (debug && isDataLayerPush && isGaEvent) {
          console.debug('[Partytown Worker] 📥 Calling dataLayer.push, dataLayer exists:', !!target, 'push exists:', typeof target?.push);
          
          // CRITICAL: Check if dataLayer.push is the original Array.push or GA4's enhanced version
          const pushFn = target?.push;
          const pushStr = pushFn?.toString?.() || '';
          const isNativePush = pushStr.includes('[native code]');
          const isEnhancedPush = !isNativePush && pushStr.includes('function');
          console.debug('[Partytown Worker] 📥 push is native Array.push:', isNativePush);
          console.debug('[Partytown Worker] 📥 push is GA4 enhanced:', isEnhancedPush);
          console.debug('[Partytown Worker] 📥 push.toString():', pushStr.substring(0, 300));
          
          // Check if dataLayer has GA4's internal processing attached
          const dlProto = Object.getPrototypeOf(target);
          console.debug('[Partytown Worker] 📥 dataLayer prototype:', dlProto?.constructor?.name);
          
          // Check for subscribers/listeners on dataLayer
          if (target._listeners || target._gtmListeners) {
            console.debug('[Partytown Worker] 📥 dataLayer has listeners:', target._listeners || target._gtmListeners);
          }
          
          // Store fetch count before the push
          (win as any)._ptFetchCountBefore = (win as any)._ptFetchCount || 0;
        }
        
        target[$forward$[i]].apply(target, args);
        
        if (debug && isDataLayerPush && isGaEvent) {
          console.debug('[Partytown Worker] ✅ dataLayer.push completed for:', eventName);
          
          // Direct GA4 Measurement Protocol - sends events directly to GA4
          // This bypasses GTM's broken dataLayer processing but ensures GA4 receives events
          const eventData = args?.[0];
          try {
            const doc = (win as any).document;
            const nav = (win as any).navigator;
            const cookies = doc?.cookie || '';
            const gaCookie = cookies.match(/_ga=([^;]+)/)?.[1];
            const clientId = gaCookie?.split('.')?.slice(-2)?.join('.') || 'fallback.' + Date.now();
            const sessionCookie = cookies.match(/_ga_52LKG2B3L1=([^;]+)/)?.[1];
            const sessionParts = sessionCookie?.split(/[$.]/) || [];
            const sessionId = sessionParts[2]?.replace('s', '') || Date.now().toString();
            const screenRes = `${(win as any).screen?.width || 1920}x${(win as any).screen?.height || 1080}`;
            const params = new URLSearchParams({
              v: '2', tid: 'G-52LKG2B3L1', gtm: '45je61d1', _p: Date.now().toString(),
              cid: clientId, ul: nav?.language || 'en-us', sr: screenRes,
              _s: '1', sid: sessionId, sct: '1', seg: '1',
              dl: doc?.location?.href || '', dt: doc?.title || '', en: eventName,
            });
            if (eventData?.ecommerce?.items) {
              eventData.ecommerce.items.forEach((item: any, idx: number) => {
                const prNum = idx + 1;
                const prValue = [
                  item.item_id ? `id${item.item_id}` : '', item.item_name ? `nm${item.item_name}` : '',
                  item.affiliation ? `af${item.affiliation}` : 'af', item.item_brand ? `br${item.item_brand}` : '',
                  item.item_variant ? `va${item.item_variant}` : '', item.item_category ? `ca${item.item_category}` : '',
                  item.item_category2 ? `c2${item.item_category2}` : '', item.location_id ? `lo${item.location_id}` : 'lo',
                  item.price !== undefined ? `pr${item.price}` : '', item.quantity !== undefined ? `qt${item.quantity}` : '',
                ].filter(Boolean).join('~');
                params.set(`pr${prNum}`, prValue);
              });
            }
            if (eventData?.ecommerce?.value) params.set('epn.value', eventData.ecommerce.value.toString());
            if (eventData?.ecommerce?.currency) params.set('cu', eventData.ecommerce.currency);
            
            const collectUrl = `https://analytics.google.com/g/collect?${params.toString()}`;
            console.debug('[Partytown] 🎯 Sending direct /collect for:', eventName);
            
            fetch(collectUrl, {
              method: 'POST', mode: 'no-cors', keepalive: true, credentials: 'include',
            }).then(() => {
              console.debug('[Partytown] ✅ /collect sent for:', eventName);
            });
          } catch (e) {
            console.debug('[Partytown] ❌ /collect error:', e);
          }
          
          // Track fetch count before and after to see if /collect was called
          const fetchBefore = (win as any)._ptFetchCount || 0;
          const collectBefore = (win as any)._ptCollectCount || 0;
          
          // Check after a delay to allow async GA4 processing
          setTimeout(() => {
            const fetchAfter = (win as any)._ptFetchCount || 0;
            const collectAfter = (win as any)._ptCollectCount || 0;
            
            console.debug('[Partytown Worker] 📊 ========= POST-EVENT CHECK for:', eventName, '=========');
            console.debug('[Partytown Worker] 📊 Total fetch calls:', fetchAfter - fetchBefore);
            console.debug('[Partytown Worker] 📊 /collect calls:', collectAfter - collectBefore);
            
            if (collectAfter === collectBefore) {
              console.debug('[Partytown Worker] ❌ NO /collect call was made for this event!');
              console.debug('[Partytown Worker] ❌ GA4 decided not to send this event');
            } else {
              console.debug('[Partytown Worker] ✅ /collect call was made for this event');
            }
          }, 500); // Longer delay to catch async processing
        }
      }
    }
  } catch (e) {
    console.error('[Partytown Worker] ❌ Forward trigger error:', e);
  }
};
