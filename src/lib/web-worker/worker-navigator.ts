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
      // Return a rejected promise - service workers can't be registered from web workers
      return Promise.reject(new DOMException('Service workers are not supported in this context', 'SecurityError'));
    },
    getRegistration: (scope?: string) => Promise.resolve(undefined),
    getRegistrations: () => Promise.resolve([]),
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
        (self as any).fetch(resolvedUrl, {
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
