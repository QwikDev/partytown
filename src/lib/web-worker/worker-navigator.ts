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
      console.debug('[Partytown] sendBeacon:', url);
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
        // Use self.fetch to ensure we use the patched version from init-web-worker
        (self as any).fetch(resolveUrl(env, url, null), {
          method: 'POST',
          body,
          mode: 'no-cors',
          keepalive: true,
          ...resolveSendBeaconRequestParameters(env, url),
        });
        return true;
      } catch (e) {
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
  const workerCookieEnabled = (navigator as any).cookieEnabled;
  nav.cookieEnabled = true;
  nav.onLine = true;

  // Log what we're setting for debugging - use console.warn so it's visible
  console.warn('[PT-NAV] 🍪 navigator.cookieEnabled SET TO:', nav.cookieEnabled, '(worker had:', workerCookieEnabled, ')');

  return new Proxy(nav, {
    set(_, propName, propValue) {
      (navigator as any)[propName] = propValue;
      return true;
    },
    get(target, prop) {
      const propStr = String(prop);

      // Log ALL navigator property accesses for debugging
      if (typeof prop === 'string' && !['then', 'toJSON', Symbol.toStringTag].includes(prop as any)) {
        const hasOwn = Object.prototype.hasOwnProperty.call(target, prop);
        const value = hasOwn ? target[prop] : 'will-fetch-from-main';
        console.warn(`[PT-NAV] 📍 navigator.${propStr} accessed, hasOwn:${hasOwn}, value:`,
          typeof value === 'function' ? '[function]' : value);
      }

      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      const value = getter(env.$window$, ['navigator', prop]);
      return value;
    },
  });
};
