import { VERSION } from '../build-modules/version';
import { logWorker } from '../log';
import {
  type EventHandler,
  type InitializeScriptData,
  type InstanceId,
  NodeName,
  type ResolveUrlType,
  StateProp,
  type WebWorkerEnvironment,
  type WinId,
  type WorkerInstance,
  WorkerMessageType,
} from '../types';
import { debug } from '../utils';
import { environments, partytownLibUrl, webWorkerCtx } from './worker-constants';
import { getOrCreateNodeInstance } from './worker-constructors';
import { getInstanceStateValue, setInstanceStateValue } from './worker-state';

// Track loaded scripts for debugging
const loadedScripts: string[] = [];

export const initNextScriptsInWebWorker = async (initScript: InitializeScriptData) => {
  let winId = initScript.$winId$;
  let instanceId = initScript.$instanceId$;
  let instance = getOrCreateNodeInstance(winId, instanceId, NodeName.Script);
  let scriptContent = initScript.$content$;
  let scriptSrc = initScript.$url$;
  let scriptOrgSrc = initScript.$orgUrl$;
  let errorMsg = '';
  let env = environments[winId];
  let rsp: Response;
  let javascriptContentTypes = [
    'text/jscript',
    'text/javascript',
    'text/x-javascript',
    'application/javascript',
    'application/x-javascript',
    'text/ecmascript',
    'text/x-ecmascript',
    'application/ecmascript',
  ];
  
  // Track GTM/GA4 related scripts
  const isGtmScript = scriptOrgSrc?.includes('googletagmanager.com') || 
    scriptOrgSrc?.includes('gtag') ||
    scriptOrgSrc?.includes('google-analytics');
  
  if (debug && isGtmScript) {
    console.debug('[Partytown] 📜 Loading GTM/GA4 script:', scriptOrgSrc);
    console.debug('[Partytown] 📜 Previously loaded scripts:', loadedScripts.filter(s => 
      s.includes('google') || s.includes('gtag') || s.includes('gtm')
    ));
  }

  if (scriptSrc) {
    try {
      scriptSrc = resolveToUrl(env, scriptSrc, 'script') + '';

      setInstanceStateValue(instance!, StateProp.url, scriptSrc);

      if (debug && webWorkerCtx.$config$.logScriptExecution) {
        logWorker(`Execute script src: ${scriptOrgSrc}`, winId);
      }

      rsp = await fetch(scriptSrc);
      if (rsp.ok) {
        let responseContentType = rsp.headers.get('content-type');
        let shouldExecute = javascriptContentTypes.some((ct) =>
          responseContentType?.toLowerCase?.().includes?.(ct)
        );
        if (shouldExecute) {
          scriptContent = await rsp.text();
          env.$currentScriptId$ = instanceId;
          
          // Track loaded scripts
          loadedScripts.push(scriptOrgSrc || scriptSrc);
          
          if (debug && isGtmScript) {
            console.debug('[Partytown] 📜 Executing fetched script:', scriptOrgSrc || scriptSrc, 'size:', scriptContent.length);
          }
          
          run(env, scriptContent, scriptOrgSrc || scriptSrc);
          
          if (debug && isGtmScript) {
            // Check state after GTM/GA4 script execution
            const win = env.$window$ as any;
            console.debug('[Partytown] 📜 After script execution state:', {
              gtag: typeof win.gtag,
              google_tag_manager: win.google_tag_manager ? Object.keys(win.google_tag_manager).slice(0, 5) : 'undefined',
              dataLayer: win.dataLayer?.length,
            });
          }
        } else {
          if (debug) {
            console.debug('[Partytown] ⚠️ Script not executed (content-type):', responseContentType, scriptOrgSrc);
          }
        }
        runStateLoadHandlers(instance!, StateProp.loadHandlers);
      } else {
        errorMsg = rsp.statusText;
        if (debug && isGtmScript) {
          console.debug('[Partytown] ❌ Script fetch failed:', rsp.status, rsp.statusText, scriptOrgSrc);
        }
        runStateLoadHandlers(instance!, StateProp.errorHandlers);
      }
    } catch (urlError: any) {
      console.error(urlError);
      if (debug && isGtmScript) {
        console.debug('[Partytown] ❌ Script fetch error:', urlError.message, scriptOrgSrc);
      }
      errorMsg = String(urlError.stack || urlError);
      runStateLoadHandlers(instance!, StateProp.errorHandlers);
    }
  } else if (scriptContent) {
    errorMsg = runScriptContent(env, instanceId, scriptContent, winId, errorMsg);
  }

  env.$currentScriptId$ = '';

  webWorkerCtx.$postMessage$([
    WorkerMessageType.InitializedEnvironmentScript,
    winId,
    instanceId,
    errorMsg,
  ]);
};

export const runScriptContent = (
  env: WebWorkerEnvironment,
  instanceId: InstanceId,
  scriptContent: string,
  winId: WinId,
  errorMsg: string
) => {
  try {
    if (debug && webWorkerCtx.$config$.logScriptExecution) {
      logWorker(
        `Execute script: ${scriptContent
          .substring(0, 100)
          .split('\n')
          .map((l) => l.trim())
          .join(' ')
          .trim()
          .substring(0, 60)}...`,
        winId
      );
    }

    env.$currentScriptId$ = instanceId;
    run(env, scriptContent);
  } catch (contentError: any) {
    console.error(scriptContent, contentError);
    errorMsg = String(contentError.stack || contentError);
  }

  env.$currentScriptId$ = '';

  return errorMsg;
};

/**
 * Replace some `this` symbols with a new value.
 * Still not perfect, but might be better than a less advanced regex
 * Check out the tests for examples: tests/unit/worker-exec.spec.ts
 *
 * This still fails with simple strings like:
 * 'sadly we fail at this simple string'
 *
 * One way to do that would be to remove all comments from code and do single / double quote counting
 * per symbol. But this will still fail with evals.
 */
export const replaceThisInSource = (scriptContent: string, newThis: string): string => {
  /**
   * Best for now but not perfect
   * We don't use Regex lookbehind, because of Safari
   */
  const FIND_THIS = /([a-zA-Z0-9_$\.\'\"\`])?(\.\.\.)?this(?![a-zA-Z0-9_$:])/g;

  return scriptContent.replace(FIND_THIS, (match, p1, p2) => {
    const prefix = (p1 || '') + (p2 || '');
    if (p1 != null) {
      return prefix + 'this';
    }
    // If there was a preceding character, include it unchanged
    return prefix + newThis;
  });
};

export const run = (env: WebWorkerEnvironment, scriptContent: string, scriptUrl?: string) => {
  env.$runWindowLoadEvent$ = 1;

  // Check if this is a GTM/GA4 script
  const isGtmScript = scriptUrl?.includes('googletagmanager.com') || 
    scriptUrl?.includes('gtag/js') ||
    scriptContent.includes('google_tag_manager') ||
    scriptContent.includes('gtag');
  
  const win = env.$window$ as any;
  const timeSinceInit = win._ptInitTime ? Date.now() - win._ptInitTime : 'unknown';
  
  if (isGtmScript) {
    console.debug('[Partytown] 🏷️ Executing GTM/GA4 script:', scriptUrl || '(inline)', 'length:', scriptContent.length);
    console.debug('[Partytown] 🏷️ Time since window init:', timeSinceInit, 'ms');
    console.debug('[Partytown] 🏷️ Before execution - gtag:', typeof win.gtag, 'google_tag_manager:', typeof win.google_tag_manager);
    console.debug('[Partytown] 🏷️ dataLayer state:', win.dataLayer ? `exists with ${win.dataLayer.length} items` : 'MISSING!');
  }

  // First we want to replace all `this` symbols
  let sourceWithReplacedThis = replaceThisInSource(scriptContent, '(thi$(this)?window:this)');

  // Replace dynamic import() calls with our custom polyfill
  // This allows scripts that use import() to work in the web worker
  // by fetching the module and executing it as a script
  const importMatches = sourceWithReplacedThis.match(/import\s*\(/g);
  if (importMatches) {
    console.debug('[Partytown] Found import() calls:', importMatches.length, 'in script:', scriptUrl || '(inline)');
  }
  sourceWithReplacedThis = sourceWithReplacedThis.replace(
    /\bimport\s*\(\s*([^)]+)\s*\)/g,
    '__pt_import__($1)'
  );

  // Combine user-defined globalFns with GA4/GTM functions that should always be exposed
  const ga4GlobalFns = ['gtag', 'ga', 'google_tag_manager', 'google_tag_data', 'dataLayer'];
  const allGlobalFns = [...new Set([...(webWorkerCtx.$config$.globalFns || []), ...ga4GlobalFns])];
  
  // Build the exposure code - this needs to run INSIDE the with block
  // so that function declarations are accessible
  const exposureCode = allGlobalFns
    .filter((globalFnName) => /[a-zA-Z_$][0-9a-zA-Z_$]*/.test(globalFnName))
    .map((g) => `try{if(typeof ${g}!=='undefined'){this.${g}=${g};}}catch(e){}`)
    .join('');
  
  scriptContent =
    `with(this){${sourceWithReplacedThis.replace(
      /\/\/# so/g,
      '//Xso'
    )}\n;function thi$(t){return t===this};${exposureCode}};` + (scriptUrl ? '\n//# sourceURL=' + scriptUrl : '');

  if (!env.$isSameOrigin$) {
    scriptContent = scriptContent.replace(/.postMessage\(/g, `.postMessage('${env.$winId$}',`);
  }

  try {
    new Function(scriptContent).call(env.$window$);
    
    if (isGtmScript) {
      // Check state after execution
      console.debug('[Partytown] 🏷️ After execution - gtag:', typeof win.gtag, 'google_tag_manager:', typeof win.google_tag_manager);
      
      // If this was the main gtag.js script, check for the gtag function
      if (scriptUrl?.includes('gtag/js')) {
        if (typeof win.gtag === 'function') {
          console.debug('[Partytown] ✅ gtag function created by gtag.js!');
          win._ptGtagInitialized = true;
          
          // Check if it's a real gtag (has internal state) vs our stub
          console.debug('[Partytown] 🔍 gtag.length:', win.gtag.length);
          console.debug('[Partytown] 🔍 gtag.toString():', win.gtag.toString().substring(0, 100));
        } else {
          console.debug('[Partytown] ⚠️ gtag function NOT created after gtag.js execution');
          console.debug('[Partytown] 🏷️ dataLayer exists:', !!win.dataLayer, 'length:', win.dataLayer?.length);
          
          // Try to find gtag in the function scope and expose it
          // This is a fallback in case the globalFns exposure didn't work
          console.debug('[Partytown] 🔧 Checking if gtag needs manual exposure...');
        }
      }
      
      // After GTM loads, check for GA4 internal state
      if (scriptUrl?.includes('gtm.js')) {
        setTimeout(() => {
          const gtm = win.google_tag_manager;
          if (gtm) {
            const ga4Container = gtm['G-52LKG2B3L1'];
            console.debug('[Partytown] 🔍 GA4 Container state:', ga4Container ? Object.keys(ga4Container) : 'not found');
          }
        }, 100);
      }
    }
  } catch (execError: any) {
    console.error('[Partytown] Script execution error:', execError.message, execError.stack);
    if (isGtmScript) {
      console.error('[Partytown] ❌ GTM/GA4 script FAILED:', scriptUrl || '(inline)');
    }
    throw execError;
  }

  env.$runWindowLoadEvent$ = 0;
};

const runStateLoadHandlers = (
  instance: WorkerInstance,
  type: StateProp,
  handlers?: EventHandler[]
) => {
  handlers = getInstanceStateValue(instance, type);
  if (handlers) {
    // Create a proper event-like object with target property
    // gtag.js may check event.target to verify which script loaded
    const event = {
      type,
      target: instance,
      currentTarget: instance,
      srcElement: instance, // legacy IE property
      // Prevent errors if code tries to call these methods
      preventDefault: () => {},
      stopPropagation: () => {},
      stopImmediatePropagation: () => {},
    };
    console.debug('[Partytown] Firing', type, 'handlers for script');
    setTimeout(() => handlers!.map((cb) => cb(event)));
  }
};

export const insertIframe = (winId: WinId, iframe: WorkerInstance) => {
  // an iframe element's instanceId is also
  // the winId of its contentWindow
  let i = 0;
  let type: string;
  let handlers: EventHandler[];

  let callback = () => {
    if (
      environments[winId] &&
      environments[winId].$isInitialized$ &&
      !environments[winId].$isLoading$
    ) {
      type = getInstanceStateValue<StateProp>(iframe, StateProp.loadErrorStatus)
        ? StateProp.errorHandlers
        : StateProp.loadHandlers;

      handlers = getInstanceStateValue<EventHandler[]>(iframe, type);
      if (handlers) {
        handlers.map((handler) => handler({ type }));
      }
    } else if (i++ > 2000) {
      handlers = getInstanceStateValue<EventHandler[]>(iframe, StateProp.errorHandlers);
      if (handlers) {
        handlers.map((handler) => handler({ type: StateProp.errorHandlers }));
      }
    } else {
      setTimeout(callback, 9);
    }
  };

  callback();
};

const resolveBaseLocation = (env: WebWorkerEnvironment, baseLocation?: Location) => {
  baseLocation = env.$location$;
  while (!baseLocation.host) {
    env = environments[env.$parentWinId$];
    baseLocation = env.$location$;
    if (env.$winId$ === env.$parentWinId$) {
      break;
    }
  }
  return baseLocation;
};

export const resolveToUrl = (
  env: WebWorkerEnvironment,
  url: string,
  type: ResolveUrlType | null,
  baseLocation?: Location,
  resolvedUrl?: URL,
  configResolvedUrl?: any
) => {
  baseLocation = resolveBaseLocation(env, baseLocation);

  resolvedUrl = new URL(url || '', baseLocation as any);
  if (type && webWorkerCtx.$config$.resolveUrl) {
    configResolvedUrl = webWorkerCtx.$config$.resolveUrl!(resolvedUrl, baseLocation, type!);
    if (configResolvedUrl) {
      return configResolvedUrl;
    }
  }
  return resolvedUrl;
};

export const resolveUrl = (env: WebWorkerEnvironment, url: string, type: ResolveUrlType | null) =>
  resolveToUrl(env, url, type) + '';

export const resolveSendBeaconRequestParameters = (env: WebWorkerEnvironment, url: string) => {
  const baseLocation = resolveBaseLocation(env);
  const resolvedUrl = new URL(url || '', baseLocation as any);
  if (webWorkerCtx.$config$.resolveSendBeaconRequestParameters) {
    const configResolvedParams = webWorkerCtx.$config$.resolveSendBeaconRequestParameters!(
      resolvedUrl,
      baseLocation
    );
    if (configResolvedParams) {
      return configResolvedParams;
    }
  }
  return {};
};

export const getPartytownScript = () =>
  `<script src="${partytownLibUrl('partytown.js?v=' + VERSION)}"></script>`;
