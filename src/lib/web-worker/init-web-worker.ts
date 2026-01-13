import { commaSplit, webWorkerCtx } from './worker-constants';
import type { InitWebWorkerData, PartytownInternalConfig } from '../types';
import { testIfShouldUseNoCors } from '../utils';

export const initWebWorker = (initWebWorkerData: InitWebWorkerData) => {
  const config: PartytownInternalConfig = (webWorkerCtx.$config$ = JSON.parse(
    initWebWorkerData.$config$
  ));
  const locOrigin = initWebWorkerData.$origin$;
  webWorkerCtx.$importScripts$ = importScripts.bind(self);
  webWorkerCtx.$interfaces$ = initWebWorkerData.$interfaces$;
  webWorkerCtx.$libPath$ = initWebWorkerData.$libPath$;
  webWorkerCtx.$origin$ = locOrigin;
  webWorkerCtx.$postMessage$ = (postMessage as any).bind(self);
  webWorkerCtx.$sharedDataBuffer$ = initWebWorkerData.$sharedDataBuffer$;
  webWorkerCtx.$tabId$ = initWebWorkerData.$tabId$;

  (self as any).importScripts = undefined;
  delete (self as any).postMessage;
  delete (self as any).WorkerGlobalScope;

  // Patch self.fetch to support noCorsUrls config
  // This is needed because minified code might call self.fetch() directly
  const originalFetch = (self as any).fetch;
  (self as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (testIfShouldUseNoCors(webWorkerCtx.$config$, url)) {
      init = { ...init, mode: 'no-cors', credentials: 'include' };
    }
    return originalFetch(input, init);
  };

  (commaSplit('resolveUrl,resolveSendBeaconRequestParameters,get,set,apply') as any).map(
    (configName: keyof PartytownInternalConfig) => {
      if (config[configName]) {
        config[configName] = new Function('return ' + config[configName])();
      }
    }
  );
};
