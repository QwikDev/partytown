import { blockingSetter, callMethod, getter, setter } from './worker-proxy';
import {
  CallType,
  NodeName,
  StateProp,
  type WebWorkerEnvironment,
  type WorkerNode,
} from '../types';
import {
  cachedProps,
  cachedTreeProps,
  definePrototypeNodeType,
  getOrCreateNodeInstance,
} from './worker-constructors';
import { createEnvironment } from './worker-environment';
import { debug, definePrototypePropertyDescriptor, randomId, SCRIPT_TYPE } from '../utils';
import { ABOUT_BLANK, elementStructurePropNames, IS_TAG_REG, WinIdKey } from './worker-constants';
import { getInstanceStateValue } from './worker-state';
import { getPartytownScript } from './worker-exec';
import { isScriptJsType } from './worker-script';
import { warnCrossOrigin } from '../log';

export const patchDocument = (
  WorkerDocument: any,
  env: WebWorkerEnvironment,
  isDocumentImplementation?: boolean
) => {
  const DocumentDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    body: {
      get() {
        return env.$body$;
      },
    },

    cookie: {
      get() {
        if (env.$isSameOrigin$) {
          const result = getter(this, ['cookie']);
          if (debug) {
            // Check for GA cookies in the result
            const gaCookies = result ? result.split(';').filter((c: string) => 
              c.trim().startsWith('_ga') || c.trim().startsWith('_gid')
            ) : [];
            
            // Track cookie read count to identify patterns
            (env as any).$cookieReadCount$ = ((env as any).$cookieReadCount$ || 0) + 1;
            const readCount = (env as any).$cookieReadCount$;
            
            // Log the first few reads and any reads without GA cookies
            if (readCount <= 5) {
              console.debug(`[Partytown Cookie] GET #${readCount}:`, 
                gaCookies.length ? `GA cookies: ${gaCookies.join('; ')}` : '⚠️ No GA cookies',
                `(total: ${result ? result.length : 0} chars)`);
            } else if (!gaCookies.length && readCount % 10 === 0) {
              // Periodically log if no GA cookies
              console.debug(`[Partytown Cookie] GET #${readCount}: ⚠️ Still no GA cookies`);
            }
          }
          return result;
        } else {
          warnCrossOrigin('get', 'cookie', env);
          return '';
        }
      },
      set(value) {
        if (env.$isSameOrigin$) {
          // Check if this is a GA cookie being SET (important for debugging)
          const isGaCookie = value && typeof value === 'string' && 
            (value.startsWith('_ga=') || value.startsWith('_ga_') || value.startsWith('_gid='));
          
          if (debug && isGaCookie) {
            console.debug('[Partytown Cookie] 🔥 GA COOKIE BEING SET:', value.substring(0, 150));
            console.debug('[Partytown Cookie] Stack trace:', new Error().stack);
          }
          
          blockingSetter(this, ['cookie'], value);
          
          if (debug && isGaCookie) {
            // Verify the GA cookie was set correctly
            const verifyResult = getter(this, ['cookie']);
            const gaCookiesAfter = verifyResult ? verifyResult.split(';').filter((c: string) => 
              c.trim().startsWith('_ga') || c.trim().startsWith('_gid')
            ) : [];
            console.debug('[Partytown Cookie] ✅ GA cookie verification:', 
              gaCookiesAfter.length ? gaCookiesAfter.join('; ') : '❌ NO GA COOKIES FOUND!');
          }
        } else if (debug) {
          warnCrossOrigin('set', 'cookie', env);
        }
      },
    },

    createElement: {
      value(tagName: string) {
        tagName = tagName.toUpperCase();
        if (!IS_TAG_REG.test(tagName)) {
          throw tagName + ' not valid';
        }

        const isIframe = tagName === NodeName.IFrame;
        const winId = this[WinIdKey];
        const instanceId = (isIframe ? 'f_' : '') + randomId();

        callMethod(this, ['createElement'], [tagName], CallType.NonBlocking, instanceId);

        const elm = getOrCreateNodeInstance(winId, instanceId, tagName);

        if (isIframe) {
          // an iframe element's instanceId is the same as its contentWindow's winId
          // and the contentWindow's parentWinId is the iframe element's winId
          const env = createEnvironment(
            {
              $winId$: instanceId,
              $parentWinId$: winId,
              $url$: ABOUT_BLANK,
            },
            true
          );

          // iframe's get the native fetch
          // common for analytics to use "const fetch = iframe.contentWindow.fetch"
          // so they don't go through a patched fetch()
          env.$window$.fetch = fetch;

          setter(elm, ['srcdoc'], getPartytownScript());
        } else if (tagName === NodeName.Script) {
          const scriptType = getInstanceStateValue(elm!, StateProp.type);
          if (isScriptJsType(scriptType)) {
            setter(elm, ['type'], SCRIPT_TYPE);
          }
        }

        return elm;
      },
    },

    createElementNS: {
      value(namespace: string, tagName: string) {
        const instanceId = randomId();
        const nsElm = getOrCreateNodeInstance(this[WinIdKey], instanceId, tagName, namespace);

        callMethod(
          this,
          ['createElementNS'],
          [namespace, tagName],
          CallType.NonBlocking,
          instanceId
        );

        return nsElm;
      },
    },

    createTextNode: {
      value(text: string) {
        const winId = this[WinIdKey];
        const instanceId = randomId();
        const textNode = getOrCreateNodeInstance(winId, instanceId, NodeName.Text);

        callMethod(this, ['createTextNode'], [text], CallType.NonBlocking, instanceId);

        return textNode;
      },
    },

    createEvent: {
      value: (type: string) => new Event(type),
    },

    currentScript: {
      get() {
        if (env.$currentScriptId$) {
          return getOrCreateNodeInstance(this[WinIdKey], env.$currentScriptId$, NodeName.Script);
        }
        return null;
      },
    },

    defaultView: {
      get() {
        return !isDocumentImplementation ? env.$window$ : null;
      },
    },

    documentElement: {
      get() {
        return env.$documentElement$;
      },
    },

    getElementsByTagName: {
      value(tagName: string) {
        tagName = tagName.toUpperCase();
        if (tagName === NodeName.Body) {
          return [env.$body$];
        } else if (tagName === NodeName.Head) {
          return [env.$head$];
        } else {
          return callMethod(this, ['getElementsByTagName'], [tagName]);
        }
      },
    },

    head: {
      get() {
        return env.$head$;
      },
    },

    images: {
      get() {
        return getter(this, ['images']);
      },
    },

    scripts: {
      get() {
        return getter(this, ['scripts']);
      },
    },

    adoptedStyleSheets: {
      get() {
        return getter(this, ['adoptedStyleSheets']);
      },
    },

    implementation: {
      get() {
        return {
          hasFeature: () => true,
          createHTMLDocument: (title: string) => {
            const $winId$ = randomId();
            callMethod(this, ['implementation', 'createHTMLDocument'], [title], CallType.Blocking, {
              $winId$,
            });
            const docEnv = createEnvironment(
              {
                $winId$,
                $parentWinId$: $winId$,
                $url$: env.$location$ + '',
                $visibilityState$: 'hidden',
              },
              true,
              true
            );
            return docEnv.$document$;
          },
        };
      },
    },

    location: {
      get() {
        return env.$location$;
      },
      set(url) {
        env.$location$.href = url + '';
      },
    },

    nodeType: {
      value: 9,
    },

    parentNode: {
      value: null,
    },

    parentElement: {
      value: null,
    },

    readyState: {
      value: 'complete',
    },

    visibilityState: {
      get: () => env.$visibilityState$ || 'visible',
    },
  };

  definePrototypePropertyDescriptor(WorkerDocument, DocumentDescriptorMap);

  cachedProps(WorkerDocument, 'compatMode,referrer,forms');
};

export const patchDocumentElementChild = (
  WokerDocumentElementChild: any,
  env: WebWorkerEnvironment
) => {
  const DocumentElementChildDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    parentElement: {
      get() {
        return (this as any).parentNode;
      },
    },
    parentNode: {
      get() {
        return env.$documentElement$;
      },
    },
  };
  definePrototypePropertyDescriptor(WokerDocumentElementChild, DocumentElementChildDescriptorMap);
};

export const patchHTMLHtmlElement = (WorkerHTMLHtmlElement: any, env: WebWorkerEnvironment) => {
  const DocumentElementDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    parentElement: {
      value: null,
    },
    parentNode: {
      get() {
        return env.$document$;
      },
    },
  };
  definePrototypePropertyDescriptor(WorkerHTMLHtmlElement, DocumentElementDescriptorMap);
};

export const patchDocumentFragment = (WorkerDocumentFragment: any) => {
  definePrototypeNodeType(WorkerDocumentFragment, 11);
  cachedTreeProps(WorkerDocumentFragment, elementStructurePropNames);
};
