import { commaSplit, webWorkerCtx } from './worker-constants';
import { trustedType } from '../utils';
import type { InitWebWorkerData, PartytownInternalConfig } from '../types';

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

  (commaSplit('resolveUrl,resolveSendBeaconRequestParameters,get,set,apply') as any).map(
    (configName: keyof PartytownInternalConfig) => {
      if (config[configName]) {
        config[configName] = new Function(
          trustedType('createScript', 'return ' + config[configName]) as any
        )();
      }
    }
  );
};
