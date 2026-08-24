import type { WebWorkerEnvironment } from '../types';
import { debug } from '../utils';
import { logWorker } from '../log';
import { resolveSendBeaconRequestParameters, resolveUrl } from './worker-exec';
import { webWorkerCtx } from './worker-constants';
import { getter } from './worker-proxy';

export const createNavigator = (env: WebWorkerEnvironment) => {
  const nav: any = {
    sendBeacon: (url: string, body?: any) => {
      if (debug && webWorkerCtx.$config$.logSendBeaconRequests) {
        try {
          logWorker(
            `sendBeacon: ${resolveUrl(env, url, 'sendBeacon')}${
              body ? ', data: ' + JSON.stringify(body) : ''
            }, resolvedParams: ${JSON.stringify(resolveSendBeaconRequestParameters(env, url))}`
          );
        } catch (e) {
          console.error(e);
        }
      }
      try {
        fetch(resolveUrl(env, url, 'sendBeacon'), {
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

  for (let key in navigator) {
    nav[key] = (navigator as any)[key];
  }

  return new Proxy(nav, {
    set(_, propName, propValue) {
      (navigator as any)[propName] = propValue;
      return true;
    },
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      const value = getter(env.$window$, ['navigator', prop]);
      return value;
    },
  });
};
