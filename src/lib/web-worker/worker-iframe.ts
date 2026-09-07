import { createEnvironment } from './worker-environment';
import { definePrototypePropertyDescriptor, SCRIPT_TYPE } from '../utils';
import {
  ABOUT_BLANK,
  environments,
  InstanceIdKey,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import { getPartytownScript, resolveUrl, runStateLoadHandlers } from './worker-exec';
import { callMethod, getter, sendToMain, setter } from './worker-proxy';
import { HTMLSrcElementDescriptorMap } from './worker-src-element';
import { setInstanceStateValue, getInstanceStateValue } from './worker-state';
import {
  CallType,
  StateProp,
  type WebWorkerEnvironment,
  type WorkerInstance,
  WorkerMessageType,
  type WorkerNode,
} from '../types';

export const patchHTMLIFrameElement = (WorkerHTMLIFrameElement: any, env: WebWorkerEnvironment) => {
  const HTMLIFrameDescriptorMap: PropertyDescriptorMap & ThisType<WorkerNode> = {
    contentDocument: {
      get() {
        return getIframeEnv(this).$document$;
      },
    },

    contentWindow: {
      get() {
        return getIframeEnv(this).$window$;
      },
    },

    src: {
      get() {
        let src = getInstanceStateValue(this, StateProp.src);
        if (src && src.startsWith('javascript:')) {
          return src;
        }
        const iframeEnv = getIframeEnv(this);
        src = iframeEnv.$location$.href;
        return src.startsWith('about:') && !iframeEnv.$isNativeIframe$ ? '' : src;
      },
      set(src: string) {
        if (!src) {
          return;
        }
        if (src.startsWith('javascript:')) {
          setInstanceStateValue(this, StateProp.src, src);
          return;
        }
        if (!src.startsWith('about:') || getIframeEnv(this).$isNativeIframe$) {
          let xhr = new XMLHttpRequest();
          let xhrStatus: number;
          let env = getIframeEnv(this);

          env.$location$.href = src = resolveUrl(env, src, 'iframe');
          env.$isLoading$ = 1;
          env.$isSameOrigin$ = webWorkerCtx.$origin$ === env.$location$.origin;

          setInstanceStateValue(this, StateProp.loadErrorStatus, undefined);

          if (
            env.$isNativeIframe$ ||
            webWorkerCtx.$config$.loadIframesOnMainThread?.(new URL(src))
          ) {
            if (!env.$isNativeIframe$) {
              env.$isNativeIframe$ = true;
              setter(this, ['_ptNativeIframe'], true);
              callMethod(
                this,
                ['addEventListener'],
                [
                  'load',
                  () => {
                    env.$isLoading$ = 0;
                    runStateLoadHandlers(this, StateProp.loadHandlers);
                  },
                ],
                CallType.NonBlocking
              );
              env.$window$.postMessage = (...args: any[]) => {
                if (environments[args[0]]) args = args.slice(1);
                callMethod(
                  environments[this[WinIdKey]].$window$,
                  ['_ptSendMessage'],
                  [this, args],
                  CallType.NonBlockingNoSideEffect
                );
              };
            }
            callMethod(this, ['removeAttribute'], ['srcdoc'], CallType.NonBlocking);
            setter(this, ['src'], src);
            return;
          }

          try {
            xhr.open('GET', src, false);
            xhr.send();
            xhrStatus = xhr.status;
          } catch (e) {
            // cross-origin without CORS, the content can't be read
            xhrStatus = 0;
          }

          if (xhrStatus === 0) {
            // let the browser load the cross-origin iframe natively, same as
            // it would without partytown, e.g. the recaptcha badge iframe
            callMethod(
              this,
              ['addEventListener'],
              [
                'load',
                () => {
                  env.$isLoading$ = 0;
                  runStateLoadHandlers(this, StateProp.loadHandlers);
                },
              ],
              CallType.NonBlocking
            );
            setter(this, ['src'], src);
          } else if (xhrStatus > 199 && xhrStatus < 300) {
            setter(
              this,
              ['srcdoc'],
              `<base href="${src}">` +
                replaceScriptWithPartytownScript(xhr.responseText) +
                getPartytownScript()
            );

            sendToMain(true);
            webWorkerCtx.$postMessage$([WorkerMessageType.InitializeNextScript, env.$winId$]);
          } else {
            setInstanceStateValue(this, StateProp.loadErrorStatus, xhrStatus);
            env.$isLoading$ = 0;
          }
        }
      },
    },

    ...HTMLSrcElementDescriptorMap,
  };

  definePrototypePropertyDescriptor(WorkerHTMLIFrameElement, HTMLIFrameDescriptorMap);
};

const ATTR_REGEXP_STR = `((?:\\w|-)+(?:=(?:(?:\\w|-)+|'[^']*'|"[^"]*")?)?)`;
const SCRIPT_TAG_REGEXP = new RegExp(`<script\\s*((${ATTR_REGEXP_STR}\\s*)*)>`, 'mig');
const ATTR_REGEXP = new RegExp(ATTR_REGEXP_STR, 'mg');
export function replaceScriptWithPartytownScript(text: string): string {
  return text.replace(SCRIPT_TAG_REGEXP, (_, attrs: string) => {
    const parts = [];
    let hasType = false;
    let match: RegExpExecArray | null;
    while ((match = ATTR_REGEXP.exec(attrs))) {
      let [keyValue] = match;
      if (keyValue.toLowerCase().startsWith('type=')) {
        hasType = true;
        keyValue = keyValue.replace(/(application|text)\/javascript/i, SCRIPT_TYPE);
      }
      parts.push(keyValue);
    }
    if (!hasType) {
      parts.push('type="' + SCRIPT_TYPE + '"');
    }
    return `<script ${parts.join(' ')}>`;
  });
}

const getIframeEnv = (iframe: WorkerInstance) => {
  // the winId of an iframe's contentWindow is the same
  // as the instanceId of the containing iframe element
  const $winId$ = iframe[InstanceIdKey];

  if (!environments[$winId$]) {
    createEnvironment(
      {
        $winId$,
        // iframe contentWindow parent winId is the iframe element's winId
        $parentWinId$: iframe[WinIdKey],
        $url$: getter(iframe, ['src']) || ABOUT_BLANK,
      },
      true
    );
  }

  return environments[$winId$];
};
