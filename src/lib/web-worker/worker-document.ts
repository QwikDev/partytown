import { callMethod, getter, setter } from './worker-proxy';
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
          return getter(this, ['cookie']);
        } else {
          warnCrossOrigin('get', 'cookie', env);
          return '';
        }
      },
      set(value) {
        if (env.$isSameOrigin$) {
          setter(this, ['cookie'], value);
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
