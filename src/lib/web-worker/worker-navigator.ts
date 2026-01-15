import type { WebWorkerEnvironment } from '../types';
import { debug } from '../utils';
import { logWorker } from '../log';
import { resolveSendBeaconRequestParameters, resolveUrl } from './worker-exec';
import { webWorkerCtx } from './worker-constants';
import { getter } from './worker-proxy';

export const createNavigator = (env: WebWorkerEnvironment) => {
  // Create a stub for navigator.serviceWorker that exists but gracefully fails
  // This is needed because GA4/gtag.js may try to register service workers
  // and in a web worker context, navigator.serviceWorker is undefined
  const serviceWorkerStub = {
    register: (scriptURL: string, options?: any) => {
      console.debug('[Partytown] navigator.serviceWorker.register() called with:', scriptURL);
      // Return a rejected promise - service workers can't be registered from web workers
      return Promise.reject(new DOMException('Service workers are not supported in this context', 'SecurityError'));
    },
    getRegistration: (scope?: string) => {
      console.debug('[Partytown] navigator.serviceWorker.getRegistration() called');
      return Promise.resolve(undefined);
    },
    getRegistrations: () => {
      console.debug('[Partytown] navigator.serviceWorker.getRegistrations() called');
      return Promise.resolve([]);
    },
    // ready never resolves since no service worker can be active
    ready: new Promise(() => {}),
    controller: null,
    oncontrollerchange: null,
    onmessage: null,
    onmessageerror: null,
    startMessages: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };

  const nav: any = {
    serviceWorker: serviceWorkerStub,
    sendBeacon: (url: string, body?: any) => {
      // Check if this is a GA analytics request
      const isGaRequest = url && (
        url.includes('google-analytics.com') || 
        url.includes('analytics.google.com') ||
        url.includes('/collect') ||
        url.includes('/g/collect')
      );
      
      if (debug && isGaRequest) {
        console.debug('[Partytown SendBeacon] 📊 GA Analytics sendBeacon:', url.substring(0, 200));
      }
      
      if (debug && webWorkerCtx.$config$.logSendBeaconRequests) {
        try {
          logWorker(
            `sendBeacon: ${resolveUrl(env, url, null)}${
              body ? ', data: ' + JSON.stringify(body) : ''
            }, resolvedParams: ${JSON.stringify(resolveSendBeaconRequestParameters(env, url))}`
          );
        } catch (e) {
          console.error(e);
        }
      }
      try {
        const resolvedUrl = resolveUrl(env, url, null);
        if (debug && isGaRequest) {
          console.debug('[Partytown SendBeacon] 📊 Resolved URL:', resolvedUrl.substring(0, 200));
        }
        
        // Use self.fetch to ensure we use the patched version from init-web-worker
        (self as any).fetch(resolvedUrl, {
          method: 'POST',
          body,
          mode: 'no-cors',
          keepalive: true,
          ...resolveSendBeaconRequestParameters(env, url),
        }).then(() => {
          if (debug && isGaRequest) {
            console.debug('[Partytown SendBeacon] 📊 GA sendBeacon completed');
          }
        }).catch((e: Error) => {
          if (debug && isGaRequest) {
            console.debug('[Partytown SendBeacon] ❌ GA sendBeacon FAILED:', e.message);
          }
        });
        return true;
      } catch (e) {
        if (debug && isGaRequest) {
          console.debug('[Partytown SendBeacon] ❌ GA sendBeacon exception:', e);
        }
        console.error(e);
        return false;
      }
    },
  };

  // Copy navigator properties from the worker's navigator
  for (let key in navigator) {
    nav[key] = (navigator as any)[key];
  }

  // IMPORTANT: Set these AFTER the loop to ensure they're not overwritten
  // by the worker's navigator which may have different/undefined values
  // GA4 and Mixpanel check navigator.cookieEnabled before setting cookies
  nav.cookieEnabled = true;
  nav.onLine = true;
  // Web workers may have doNotTrack="1" by default, which causes analytics
  // scripts like Mixpanel (with ignore_dnt:false) to disable persistence.
  // Set to null (no preference) to match typical main thread behavior.
  nav.doNotTrack = null;

  return new Proxy(nav, {
    set(_, propName, propValue) {
      (navigator as any)[propName] = propValue;
      return true;
    },
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      return getter(env.$window$, ['navigator', prop]);
    },
  });
};
