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
          run(env, scriptContent, scriptOrgSrc || scriptSrc);
        }
        runStateLoadHandlers(instance!, StateProp.loadHandlers);
      } else {
        errorMsg = rsp.statusText;
        runStateLoadHandlers(instance!, StateProp.errorHandlers);
      }
    } catch (urlError: any) {
      console.error(urlError);
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

  // First we want to replace all `this` symbols
  let sourceWithReplacedThis = replaceThisInSource(scriptContent, '(thi$(this)?window:this)');

  scriptContent =
    `with(this){${sourceWithReplacedThis.replace(
      /\/\/# so/g,
      '//Xso'
    )}\n;function thi$(t){return t===this}};${(webWorkerCtx.$config$.globalFns || [])
      .filter((globalFnName) => /[a-zA-Z_$][0-9a-zA-Z_$]*/.test(globalFnName))
      .map((g) => `(typeof ${g}=='function'&&(this.${g}=${g}))`)
      .join(';')};` + (scriptUrl ? '\n//# sourceURL=' + scriptUrl : '');

  if (!env.$isSameOrigin$) {
    scriptContent = scriptContent.replace(/.postMessage\(/g, `.postMessage('${env.$winId$}',`);
  }

  new Function(scriptContent).call(env.$window$);

  env.$runWindowLoadEvent$ = 0;
};

const runStateLoadHandlers = (
  instance: WorkerInstance,
  type: StateProp,
  handlers?: EventHandler[]
) => {
  handlers = getInstanceStateValue(instance, type);
  if (handlers) {
    setTimeout(() => handlers!.map((cb) => cb({ type })));
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
