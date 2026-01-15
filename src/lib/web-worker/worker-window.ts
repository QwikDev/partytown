import { addStorageApi } from './worker-storage';
import {
  type ApplyPath,
  CallType,
  type InstanceId,
  InterfaceType,
  NodeName,
  type WebWorkerEnvironment,
  WinDocId,
  type WinId,
  type WorkerInstance,
  type WorkerNode,
  type WorkerNodeConstructors,
  type WorkerWindow,
} from '../types';
import {
  ABOUT_BLANK,
  ApplyPathKey,
  commaSplit,
  environments,
  eventTargetMethods,
  InstanceDataKey,
  InstanceIdKey,
  InstanceStateKey,
  NamespaceKey,
  postMessages,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import { createCustomElementRegistry } from './worker-custom-elements';
import {
  cachedDimensionMethods,
  cachedDimensionProps,
  cachedProps,
  definePrototypeNodeType,
  getOrCreateNodeInstance,
} from './worker-constructors';
import { callMethod, constructGlobal, getter, setter } from './worker-proxy';
import { createCSSStyleDeclarationCstr } from './worker-css-style-declaration';
import { createCSSStyleSheetConstructor } from './worker-style';
import { createImageConstructor } from './worker-image';
import { createNavigator } from './worker-navigator';
import { createNodeCstr } from './worker-node';
import { createPerformanceConstructor } from './worker-performance';
import {
  debug,
  defineConstructorName,
  defineProperty,
  definePrototypeProperty,
  definePrototypeValue,
  getConstructorName,
  len,
  randomId,
  testIfShouldUseNoCors,
} from '../utils';
import {
  getInstanceStateValue,
  hasInstanceStateValue,
  setInstanceStateValue,
} from './worker-state';
import { getInitWindowMedia, htmlMedia, windowMediaConstructors } from './worker-media';
import { logWorker, normalizedWinId } from '../log';
import {
  patchDocument,
  patchDocumentElementChild,
  patchDocumentFragment,
  patchHTMLHtmlElement,
} from './worker-document';
import { patchElement } from './worker-element';
import { patchHTMLAnchorElement } from './worker-anchor';
import { patchHTMLFormElement } from './worker-form';
import { patchHTMLIFrameElement } from './worker-iframe';
import { patchHTMLScriptElement } from './worker-script';
import { patchSvgElement } from './worker-svg';
import { resolveUrl } from './worker-exec';
import { createNodeListCstr } from './worker-serialization';
import { createNamedNodeMapCstr } from './worker-named-node-map';

export const createWindow = (
  $winId$: WinId,
  $parentWinId$: WinId,
  url: string,
  $visibilityState$?: string,
  isIframeWindow?: boolean,
  isDocumentImplementation?: boolean
) => {
  let cstrInstanceId: InstanceId | undefined;
  let cstrNodeName: string | undefined;
  let cstrNamespace: string | undefined;
  let cstrPrevInstance: WorkerNode | undefined;

  // base class all Nodes/Elements/Global Constructors will extend
  const WorkerBase = class implements WorkerInstance {
    [WinIdKey]: WinId;
    [InstanceIdKey]: InstanceId;
    [ApplyPathKey]: string[];
    [InstanceDataKey]: any;
    [NamespaceKey]: string | undefined;
    [InstanceStateKey]: { [key: string]: any };

    constructor(
      winId?: WinId,
      instanceId?: InstanceId,
      applyPath?: ApplyPath,
      instanceData?: any,
      namespace?: string
    ) {
      this[WinIdKey] = winId || $winId$;
      this[InstanceIdKey] = instanceId || cstrInstanceId || randomId();
      this[ApplyPathKey] = applyPath || [];
      this[InstanceDataKey] = instanceData || cstrNodeName;
      this[NamespaceKey] = namespace || cstrNamespace;
      this[InstanceStateKey] = (cstrPrevInstance && cstrPrevInstance[InstanceStateKey]) || {};
      cstrInstanceId = cstrNodeName = cstrNamespace = undefined;
    }
  };

  const WorkerLocation = defineConstructorName(
    class extends URL {
      assign() {
        logWorker(`location.assign(), noop`);
      }
      reload() {
        logWorker(`location.reload(), noop`);
      }
      replace() {
        logWorker(`location.replace(), noop`);
      }
    },
    'Location'
  );

  const $location$ = new WorkerLocation(url);
  const $isSameOrigin$ =
    $location$.origin === webWorkerCtx.$origin$ || $location$.origin === ABOUT_BLANK;

  const $isTopWindow$ = $parentWinId$ === $winId$;

  const env: WebWorkerEnvironment = {} as any;

  const getChildEnvs = () => {
    let childEnv: WebWorkerEnvironment[] = [];
    let envWinId: string;
    let otherEnv: WebWorkerEnvironment;
    for (envWinId in environments) {
      otherEnv = environments[envWinId];
      if (otherEnv.$parentWinId$ === $winId$ && !otherEnv.$isTopWindow$) {
        childEnv.push(otherEnv);
      }
    }
    return childEnv;
  };

  // window global eveything will live within
  const WorkerWindow = defineConstructorName(
    class extends WorkerBase implements WorkerWindow {
      constructor() {
        super($winId$, $winId$);

        let win: WorkerWindow = this;
        let value: any;
        let historyState: any;
        let hasInitializedMedia = 0;

        let initWindowMedia = () => {
          if (!hasInitializedMedia) {
            getInitWindowMedia()(
              WorkerBase,
              WorkerEventTargetProxy,
              env,
              win,
              windowMediaConstructors
            );
            hasInitializedMedia = 1;
          }
        };

        let nodeCstrs: WorkerNodeConstructors = {};
        let $createNode$ = (
          nodeName: string,
          instanceId: InstanceId,
          namespace?: string,
          prevInstance?: WorkerNode
        ): WorkerNode => {
          if (htmlMedia.includes(nodeName)) {
            initWindowMedia();
          }
          const NodeCstr = nodeCstrs[nodeName]
            ? nodeCstrs[nodeName]
            : nodeName.includes('-')
              ? nodeCstrs.UNKNOWN
              : nodeCstrs.I;

          cstrInstanceId = instanceId;
          cstrNodeName = nodeName;
          cstrNamespace = namespace;
          cstrPrevInstance = prevInstance;
          return new NodeCstr() as any;
        };

        win.Window = WorkerWindow;
        win.name = name + (debug ? `${normalizedWinId($winId$)} (${$winId$})` : ($winId$ as any));

        createNodeCstr(win, env, WorkerBase);
        createNodeListCstr(win);
        createNamedNodeMapCstr(win, WorkerBase);
        createCSSStyleDeclarationCstr(win, WorkerBase, 'CSSStyleDeclaration');
        createPerformanceConstructor(win, WorkerBase, 'Performance');
        createCustomElementRegistry(win, nodeCstrs);

        // define all of the global constructors that should live on window
        webWorkerCtx.$interfaces$.map(
          ([cstrName, superCstrName, members, interfaceType, nodeName]) => {
            const SuperCstr = TrapConstructors[cstrName]
              ? WorkerTrapProxy
              : superCstrName === 'EventTarget'
                ? WorkerEventTargetProxy
                : superCstrName === 'Object'
                  ? WorkerBase
                  : win[superCstrName];

            const Cstr = (win[cstrName] = defineConstructorName(
              interfaceType === InterfaceType.EnvGlobalConstructor
                ? class extends WorkerBase {
                    // create the constructor and set as a prop on window
                    constructor(...args: any[]) {
                      super();
                      constructGlobal(this, cstrName, args);
                    }
                  }
                : win[cstrName] || class extends SuperCstr {},
              cstrName
            ));

            if (nodeName) {
              // this is a node name, such as #text or an element's tagname, like all caps DIV
              nodeCstrs[nodeName] = Cstr;
            }

            members.map(([memberName, memberType, staticValue]) => {
              if (!(memberName in Cstr.prototype) && !(memberName in SuperCstr.prototype)) {
                // member not already in the constructor's prototype
                if (typeof memberType === 'string') {
                  definePrototypeProperty(Cstr, memberName, {
                    get(this: WorkerInstance) {
                      if (!hasInstanceStateValue(this, memberName)) {
                        const instanceId = this[InstanceIdKey];
                        const applyPath = [...this[ApplyPathKey], memberName];
                        const PropCstr: typeof WorkerBase = win[memberType];

                        if (PropCstr) {
                          setInstanceStateValue(
                            this,
                            memberName,
                            new PropCstr($winId$, instanceId, applyPath)
                          );
                        }
                      }
                      return getInstanceStateValue(this, memberName);
                    },
                    set(this: WorkerInstance, value) {
                      setInstanceStateValue(this, memberName, value);
                    },
                  });
                } else {
                  // interface type
                  if (memberType === InterfaceType.Function) {
                    // method that should access main
                    definePrototypeValue(Cstr, memberName, function (this: Node, ...args: any[]) {
                      return callMethod(this, [memberName], args);
                    });
                  } else if (memberType > 0) {
                    // property
                    if (staticValue !== undefined) {
                      // static property that doesn't change
                      // and no need to access main
                      definePrototypeValue(Cstr, memberName, staticValue);
                    } else {
                      // property getter/setter that should access main
                      definePrototypeProperty(Cstr, memberName, {
                        get(this: WorkerNode) {
                          return getter(this, [memberName]);
                        },
                        set(this: WorkerNode, value) {
                          return setter(this, [memberName], value);
                        },
                      });
                    }
                  }
                }
              }
            });
          }
        );

        // we already assigned the same prototypes found on the main thread's Window
        // to the worker's Window, but actually it assigned a few that are already on
        // the web worker's global we can use instead. So manually set which web worker
        // globals we can reuse, instead of calling the main access.
        // These same window properties will be assigned to the window instance
        // when Window is constructed, and these won't make calls to the main thread.
        commaSplit(
          'atob,btoa,crypto,indexedDB,setTimeout,setInterval,clearTimeout,clearInterval'
        ).map((globalName) => {
          delete (WorkerWindow as any).prototype[globalName];

          if (!(globalName in win)) {
            // global properties already in the web worker global
            value = (self as any)[globalName];
            if (value != null) {
              // function examples: atob(), fetch()
              // object examples: crypto, indexedDB
              // boolean examples: isSecureContext, crossOriginIsolated
              win[globalName] =
                typeof value === 'function' && !value.toString().startsWith('class')
                  ? value.bind(self)
                  : value;
            }
          }
        });

        // assign web worker global properties to the environment window
        // window.Promise = self.Promise
        Object.getOwnPropertyNames(self).map((globalName) => {
          if (!(globalName in win)) {
            win[globalName] = (self as any)[globalName];
          }
        });

        windowMediaConstructors.map((cstrName) =>
          defineProperty(win, cstrName, {
            get() {
              // lazy load media constructors if called, replacing this getter
              initWindowMedia();
              return win[cstrName];
            },
          })
        );

        if ('trustedTypes' in (self as any)) {
          // https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
          win.trustedTypes = (self as any).trustedTypes;
        }

        // patch this window's global constructors with some additional props
        patchElement(win.Element, win.HTMLElement);
        patchDocument(win.Document, env, isDocumentImplementation);
        patchDocumentFragment(win.DocumentFragment);
        patchHTMLAnchorElement(win.HTMLAnchorElement, env);
        patchHTMLFormElement(win.HTMLFormElement);
        patchHTMLIFrameElement(win.HTMLIFrameElement, env);
        patchHTMLScriptElement(win.HTMLScriptElement, env);
        patchSvgElement(win.SVGGraphicsElement);
        patchDocumentElementChild(win.HTMLHeadElement, env);
        patchDocumentElementChild(win.HTMLBodyElement, env);
        patchHTMLHtmlElement(win.HTMLHtmlElement, env);
        createCSSStyleSheetConstructor(win, 'CSSStyleSheet');
        createCSSStyleSheetConstructor(win, 'CSSMediaRule');

        definePrototypeNodeType(win.Comment, 8);
        definePrototypeNodeType(win.DocumentType, 10);

        // List of properties that might be checked by GA4 for feature detection
        const ga4FeatureProps = [
          'google_tag_data', 'google_tag_manager', 'gtag', 'dataLayer',
          'ga', 'gaGlobal', '_ga', '_gaq', '_gat', '_gat_gtag_UA',
          'google_unique_id', 'GoogleAnalyticsObject',
          'Prototype', 'jQuery', '$', // common library checks
        ];
        
        // Track gtag access pattern
        let gtagAccessCount = 0;
        let gtagSetCount = 0;

        Object.assign(env, {
          $winId$,
          $parentWinId$,
          $window$: new Proxy(win, {
            get: (win, propName: any) => {
              if (typeof propName === 'string' && !isNaN(propName as any)) {
                // https://developer.mozilla.org/en-US/docs/Web/API/Window/frames
                let frame = getChildEnvs()[propName as any];
                return frame ? frame.$window$ : undefined;
              } else if (webWorkerCtx.$config$.mainWindowAccessors?.includes(propName)) {
                return getter(this, [propName]);
              } else {
                const value = win[propName];
                // Log when GA4-related properties are accessed
                if (typeof propName === 'string' && ga4FeatureProps.includes(propName)) {
                  console.debug(`[Partytown] window.${propName} GET, value type:`, typeof value, value ? 'exists' : 'undefined');
                }
                return value;
              }
            },
            set: (win, propName: any, value: any) => {
              // Log when GA4-related properties are set
              if (typeof propName === 'string' && ga4FeatureProps.includes(propName)) {
                const timeSinceInit = win._ptInitTime ? Date.now() - win._ptInitTime : 'unknown';
                const existingType = typeof win[propName];
                console.debug(`[Partytown] 🔥 window.${propName} SET at ${timeSinceInit}ms:`, {
                  newType: typeof value,
                  existingType,
                  isOverwrite: existingType !== 'undefined'
                });
                
                if (propName === 'gtag') {
                  if (existingType === 'function') {
                    console.debug(`[Partytown] ⚠️ gtag is being OVERWRITTEN!`);
                    console.debug('[Partytown] Overwrite stack:', new Error().stack);
                  }
                  if (typeof value === 'function') {
                    console.debug(`[Partytown] ✅ gtag function set/updated`);
                  } else if (value === undefined) {
                    console.debug(`[Partytown] ❌ gtag being set to undefined!`);
                  }
                }
                
                // dataLayer SET is handled by the defineProperty getter/setter
                // No special handling needed here anymore
              }
              win[propName] = value;
              return true;
            },
            has: () =>
              // window "has" any and all props, this is especially true for global variables
              // that are meant to be assigned to window, but without "window." prefix,
              // like: <script>globalProp = true</script>
              true,
          }) as any,
          $document$: $createNode$(NodeName.Document, $winId$ + '.' + WinDocId.document) as any,
          $documentElement$: $createNode$(
            NodeName.DocumentElement,
            $winId$ + '.' + WinDocId.documentElement
          ) as any,
          $head$: $createNode$(NodeName.Head, $winId$ + '.' + WinDocId.head) as any,
          $body$: $createNode$(NodeName.Body, $winId$ + '.' + WinDocId.body) as any,
          $location$,
          $visibilityState$,
          $isSameOrigin$,
          $isTopWindow$,
          $createNode$,
        });

        // requestAnimationFrame() is provided by Chrome in a web worker, but not Safari
        win.requestAnimationFrame = (cb: (ts: number) => void) =>
          setTimeout(() => cb(performance.now()), 9);
        win.cancelAnimationFrame = (id: number) => clearTimeout(id);

        // ensure requestIdleCallback() happens in the worker and doesn't call to main
        // it's also not provided by Safari
        win.requestIdleCallback = (
          cb: (opts: { didTimeout: boolean; timeRemaining: () => number }) => void,
          start?: number
        ) => {
          start = Date.now();
          return setTimeout(
            () =>
              cb({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start!)),
              }),
            1
          );
        };
        win.cancelIdleCallback = (id: number) => clearTimeout(id);

        // add storage APIs to the window
        addStorageApi(win, 'localStorage', env);
        addStorageApi(win, 'sessionStorage', env);

        if (!$isSameOrigin$) {
          win.indexeddb = undefined;
        }

        if (isIframeWindow) {
          historyState = {};
          win.history = {
            pushState(stateObj: any) {
              historyState = stateObj;
            },
            replaceState(stateObj: any) {
              historyState = stateObj;
            },
            get state() {
              return historyState;
            },
            length: 0,
          };
          win.indexeddb = undefined;
        } else {
          const originalPushState: Window['history']['pushState'] = win.history.pushState.bind(
            win.history
          );
          const originalReplaceState: Window['history']['replaceState'] =
            win.history.replaceState.bind(win.history);

          win.history.pushState = (stateObj: any, _: string, newUrl?: string) => {
            if (env.$propagateHistoryChange$ !== false) {
              originalPushState(stateObj, _, newUrl);
            }
          };
          win.history.replaceState = (stateObj: any, _: string, newUrl?: string) => {
            if (env.$propagateHistoryChange$ !== false) {
              originalReplaceState(stateObj, _, newUrl);
            }
          };
        }

        win.Worker = undefined;

        // Initialize timing for debugging
        const initTime = Date.now();
        const buildVersion = 'v5-' + initTime; // v5 = gtag pre-init + exposure inside with block
        console.debug('[Partytown] 🚀 Window initialization starting. Build:', buildVersion);
        
        // Pre-initialize dataLayer as a REAL array stored separately
        // to avoid Partytown's proxy serialization issues
        if (!(win as any)._ptRealDataLayer) {
          const realDataLayer: any[] = [];
          (win as any)._ptRealDataLayer = realDataLayer;
          
          // Define dataLayer as a getter/setter that uses the real array
          // This prevents GTM from replacing our array with one containing instance IDs
          Object.defineProperty(win, 'dataLayer', {
            get: () => {
              return (win as any)._ptRealDataLayer;
            },
            set: (newValue: any) => {
              // If someone tries to replace dataLayer, preserve our array but copy the enhanced push
              if (Array.isArray(newValue)) {
                const real = (win as any)._ptRealDataLayer;
                // Copy push method if it's GTM's enhanced version
                if (newValue.push && newValue.push !== Array.prototype.push) {
                  real.push = newValue.push;
                }
              }
              // Don't actually replace the array - this prevents corruption
            },
            configurable: true,
            enumerable: true,
          });
          
          console.debug('[Partytown] Pre-initialized window.dataLayer with defineProperty');
        }
        
        // Pre-initialize gtag function
        // This is the standard gtag stub that users are supposed to create
        // GA4/gtag.js will enhance this with its internal dispatch mechanism
        if (typeof (win as any).gtag !== 'function') {
          (win as any).gtag = function() {
            (win as any).dataLayer.push(arguments);
          };
          console.debug('[Partytown] ✅ Pre-initialized window.gtag function');
        }
        
        // Store init time for debugging
        (win as any)._ptInitTime = initTime;
        (win as any)._ptGtagInitialized = true;
        
        console.debug('[Partytown] 🚀 Window initialization complete.',
          'gtag:', typeof (win as any).gtag,
          'dataLayer:', (win as any).dataLayer?.length,
          'isIframe:', isIframeWindow,
          'winId:', $winId$);

        // Polyfill for dynamic import() - fetches and executes scripts
        // This allows gtag.js and similar scripts to load modules in the worker
        console.debug('[Partytown] Setting up __pt_import__ polyfill');
        (win as any).__pt_import__ = async (url: string) => {
          console.debug('[Partytown] __pt_import__ called with:', url);
          try {
            const resolvedUrl = resolveUrl(env, url, 'script');
            const response = await fetch(resolvedUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch module: ${response.status}`);
            }
            const scriptContent = await response.text();
            // Execute the script in the window context
            const fn = new Function(scriptContent);
            fn.call(win);
            // Return an empty module namespace object
            // Most dynamic imports in analytics scripts don't use the return value
            return {};
          } catch (error) {
            console.error('[Partytown] __pt_import__ error:', error);
            throw error;
          }
        };
      }

      addEventListener = (...args: any[]) => {
        if (args[0] === 'load') {
          if (env.$runWindowLoadEvent$) {
            setTimeout(() => args[1]({ type: 'load' }));
          }
        } else {
          callMethod(this, ['addEventListener'], args, CallType.NonBlocking);
        }
      };

      get body() {
        return env.$body$;
      }

      get document() {
        return env.$document$;
      }

      get documentElement() {
        return env.$documentElement$;
      }

      fetch(input: string | URL | Request, init: any) {
        input = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
        const resolvedUrl = resolveUrl(env, input, 'fetch');

        // Track fetch count for debugging
        (env.$window$ as any)._ptFetchCount = ((env.$window$ as any)._ptFetchCount || 0) + 1;

        // Check if this URL should use no-cors mode
        // This is useful for tracking/analytics URLs that fail due to CORS
        // but don't need response data (fire-and-forget requests)
        const shouldUseNoCors = testIfShouldUseNoCors(webWorkerCtx.$config$, input);
        if (shouldUseNoCors) {
          init = { ...init, mode: 'no-cors', credentials: 'include' };
        }

        // Debug GA analytics requests specifically - ALWAYS log /collect calls
        const isGaCollect = input.includes('analytics.google.com') && input.includes('/collect');
        const isGaRequest = input.includes('google-analytics.com') || 
          input.includes('analytics.google.com') ||
          input.includes('/collect') ||
          input.includes('/g/collect');
        
        if (isGaCollect) {
          // Track /collect calls
          (env.$window$ as any)._ptCollectCount = ((env.$window$ as any)._ptCollectCount || 0) + 1;
          
          console.debug('[Partytown] 🎯 GA4 /collect REQUEST DETECTED!');
          console.debug('[Partytown] 🎯 URL:', input.substring(0, 300));
          console.debug('[Partytown] 🎯 Resolved:', resolvedUrl.substring(0, 300));
          console.debug('[Partytown] 🎯 no-cors:', shouldUseNoCors);
          console.debug('[Partytown] 🎯 Init:', JSON.stringify(init || {}));
          
          // Parse URL to see which event this is for
          try {
            const urlObj = new URL(input);
            const eventName = urlObj.searchParams.get('en');
            console.debug('[Partytown] 🎯 Event name in /collect:', eventName);
          } catch (e) {}
        } else if (debug && isGaRequest) {
          console.debug('[Partytown Fetch] 📊 GA Analytics request:', input.substring(0, 200));
          console.debug('[Partytown Fetch] 📊 Resolved URL:', resolvedUrl.substring(0, 200));
          console.debug('[Partytown Fetch] 📊 Init:', JSON.stringify(init || {}));
        }

        // Use self.fetch to ensure we use the patched version from init-web-worker
        return (self as any).fetch(resolvedUrl, init).then((response: Response) => {
          if (debug) {
            const isGaRequest = input.includes('google-analytics.com') || 
              input.includes('analytics.google.com') ||
              input.includes('/collect');
            
            if (isGaRequest) {
              console.debug('[Partytown Fetch] 📊 GA Response:', response.status, response.type);
            }
          }
          return response;
        }).catch((error: Error) => {
          if (debug) {
            const isGaRequest = input.includes('google-analytics.com') || 
              input.includes('analytics.google.com') ||
              input.includes('/collect');
            
            if (isGaRequest) {
              console.debug('[Partytown Fetch] ❌ GA Request FAILED:', error.message);
            }
          }
          throw error;
        });
      }

      get frames() {
        // this is actually just the window, which is what handles "length" and window[0]
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/frames
        return env.$window$;
      }

      get frameElement() {
        if ($isTopWindow$) {
          // this is the top window, not in an iframe
          return null;
        } else {
          // the winId of an iframe's window is the same
          // as the instanceId of the containing iframe element
          return getOrCreateNodeInstance($parentWinId$, $winId$, NodeName.IFrame);
        }
      }

      get globalThis() {
        return env.$window$;
      }

      get head() {
        return env.$head$;
      }

      get length() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/length
        return getChildEnvs().length;
      }

      get location() {
        return $location$;
      }
      set location(loc: any) {
        $location$.href = loc + '';
      }

      get Image() {
        return createImageConstructor(env);
      }

      get navigator() {
        return createNavigator(env);
      }

      get origin() {
        return $location$.origin;
      }
      set origin(_) {}

      get parent(): any {
        for (let envWinId in environments) {
          if (environments[envWinId].$winId$ === $parentWinId$) {
            return environments[envWinId].$window$;
          }
        }
        return env.$window$;
      }

      postMessage(...args: any[]) {
        if (environments[args[0]]) {
          if (len(postMessages) > 50) {
            postMessages.splice(0, 5);
          }
          postMessages.push({
            $winId$: args[0],
            $data$: JSON.stringify(args[1]),
          });
          args = args.slice(1);
        }
        callMethod(this, ['postMessage'], args, CallType.NonBlockingNoSideEffect);
      }

      get self() {
        return env.$window$;
      }

      get top(): any {
        for (let envWinId in environments) {
          if (environments[envWinId].$isTopWindow$) {
            return environments[envWinId].$window$;
          }
        }
        return env.$window$;
      }

      get window() {
        return env.$window$;
      }

      get XMLHttpRequest() {
        const Xhr = XMLHttpRequest;
        const str = String(Xhr);
        const ExtendedXhr = defineConstructorName(
          class extends Xhr {
            private _gaRequest = false;
            
            open(...args: any[]) {
              const url = args[1];
              // Check if this is a GA analytics request
              this._gaRequest = url && (
                url.includes('google-analytics.com') || 
                url.includes('analytics.google.com') ||
                url.includes('/collect') ||
                url.includes('/g/collect')
              );
              
              if (debug && this._gaRequest) {
                console.debug('[Partytown XHR] 📊 GA Analytics XHR:', args[0], url.substring(0, 200));
              }
              
              args[1] = resolveUrl(env, args[1], 'xhr');
              
              if (debug && this._gaRequest) {
                console.debug('[Partytown XHR] 📊 Resolved URL:', args[1].substring(0, 200));
              }
              
              (super.open as any)(...args);
            }
            
            send(body?: any) {
              if (debug && this._gaRequest) {
                console.debug('[Partytown XHR] 📊 GA XHR send:', body ? 'has body' : 'no body');
              }
              
              this.addEventListener('load', () => {
                if (debug && this._gaRequest) {
                  console.debug('[Partytown XHR] 📊 GA XHR response:', this.status, this.statusText);
                }
              });
              
              this.addEventListener('error', () => {
                if (debug && this._gaRequest) {
                  console.debug('[Partytown XHR] ❌ GA XHR FAILED');
                }
              });
              
              super.send(body);
            }
            
            set withCredentials(_: boolean) {
              if (webWorkerCtx.$config$.allowXhrCredentials) {
                super.withCredentials = _;
              }
            }
            toString() {
              return str;
            }
          },
          getConstructorName(Xhr)
        );
        ExtendedXhr.prototype.constructor.toString = () => str;
        return ExtendedXhr;
      }
    },
    'Window'
  );

  // extends WorkerBase, but also a proxy so certain constructors like style.color work
  const WorkerTrapProxy = class extends WorkerBase {
    constructor(winId: WinId, instanceId: InstanceId, applyPath?: ApplyPath, nodeName?: string) {
      super(winId, instanceId, applyPath, nodeName);

      return new Proxy(this, {
        get(instance, propName) {
          return getter(instance, [propName]);
        },
        set(instance, propName, propValue) {
          setter(instance, [propName], propValue);
          return true;
        },
      });
    }
  };

  const WorkerEventTargetProxy = class extends WorkerBase {};
  eventTargetMethods.map(
    (methodName) =>
      ((WorkerEventTargetProxy as any).prototype[methodName] = function (...args: any[]) {
        return callMethod(this, [methodName], args, CallType.NonBlocking);
      })
  );

  cachedProps(WorkerWindow, 'devicePixelRatio');
  cachedDimensionProps(WorkerWindow);
  cachedDimensionMethods(WorkerWindow, ['getComputedStyle']);

  new WorkerWindow();

  return env;
};

// Trap Constructors are ones where all properties have
// proxy traps, such as dataset.name
const TrapConstructors: { [cstrName: string]: 1 } = {
  DOMStringMap: 1,
  NamedNodeMap: 1,
};
