import { commaSplit, webWorkerCtx } from './worker-constants';
import type { InitWebWorkerData, PartytownInternalConfig } from '../types';
import { testIfShouldUseNoCors } from '../utils';

export const initWebWorker = (initWebWorkerData: InitWebWorkerData) => {
  // Global error handlers to catch unhandled errors/rejections
  (self as any).onerror = (message: any, source: any, lineno: any, colno: any, error: any) => {
    console.debug('[Partytown Worker] GLOBAL ERROR:', message, 'source:', source, 'line:', lineno, 'error:', error);
    return false; // Don't suppress the error
  };

  (self as any).onunhandledrejection = (event: any) => {
    console.debug('[Partytown Worker] UNHANDLED REJECTION:', event.reason, event);
  };

  // Intercept ALL console methods to capture Google's internal error messages
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalDebug = console.debug;
  const originalInfo = console.info;

  // Intercept console.log
  console.log = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
    if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
      originalDebug.call(console, '[Partytown WW] CAPTURED console.log:', ...args);
      originalDebug.call(console, '[Partytown WW] Log stack:', new Error().stack);
    }
    originalLog.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
    if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
      originalDebug.call(console, '[Partytown WW] CAPTURED console.error:', ...args);
      originalDebug.call(console, '[Partytown WW] Error stack:', new Error().stack);
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
    if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script') || msg.includes('GA') || msg.includes('gtag')) {
      originalDebug.call(console, '[Partytown WW] CAPTURED console.warn:', ...args);
      originalDebug.call(console, '[Partytown WW] Warn stack:', new Error().stack);
    }
    originalWarn.apply(console, args);
  };

  // Also intercept info and debug
  console.info = (...args: any[]) => {
    const msg = args.map(a => typeof a === 'string' ? a : (a ? String(a) : '')).join(' ');
    if (msg.includes('unknown') || msg.includes('error') || msg.includes('fetch') || msg.includes('script')) {
      originalDebug.call(console, '[Partytown WW] CAPTURED console.info:', ...args);
    }
    originalInfo.apply(console, args);
  };

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
    console.debug('[Partytown] fetch:', url);
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
