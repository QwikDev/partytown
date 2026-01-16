import { createEnvironment } from './worker-environment';
import {
  definePrototypePropertyDescriptor,
  SCRIPT_TYPE,
  testIfMustLoadIframeOnMainThread,
} from '../utils';
import {
  ABOUT_BLANK,
  environments,
  InstanceIdKey,
  webWorkerCtx,
  WinIdKey,
} from './worker-constants';
import { getPartytownScript, resolveUrl } from './worker-exec';
import { callMethod, getter, sendToMain, setter } from './worker-proxy';
import { HTMLSrcElementDescriptorMap } from './worker-src-element';
import { setInstanceStateValue, getInstanceStateValue } from './worker-state';
import {
  CallType,
  type EventHandler,
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
        src = getIframeEnv(this).$location$.href;
        return src.startsWith('about:') ? '' : src;
      },
      set(src: string) {
        if (!src) {
          return;
        }
        if (src.startsWith('javascript:')) {
          setInstanceStateValue(this, StateProp.src, src);
          return;
        }
        if (!src.startsWith('about:')) {
          let env = getIframeEnv(this);
          const config = webWorkerCtx.$config$;

          // Check if this iframe should be loaded on the main thread BEFORE resolving URL
          // This is important because resolveUrl might transform the URL (e.g., proxy it)
          // which would break pattern matching. We check the original URL.
          const originalSrc = new URL(src, env.$location$.href).href;
          const shouldLoadOnMainThread = testIfMustLoadIframeOnMainThread(config, originalSrc);

          if (shouldLoadOnMainThread) {
            // Let the iframe load naturally on the main thread
            // by setting the src attribute directly without XHR interception.
            // We must REMOVE srcdoc attribute (not just set to empty) since per HTML spec
            // if srcdoc attribute is present (even empty), it takes precedence over src.
            // Use the ORIGINAL URL, not the resolved/proxied URL, since we want the browser
            // to load the actual Google iframe directly.
            callMethod(this, ['removeAttribute'], ['srcdoc'], CallType.NonBlocking);
            setter(this, ['src'], originalSrc);
            // Flush the queue to ensure removeAttribute and src setter execute immediately
            // before any subsequent appendChild/insertBefore calls
            sendToMain(true);

            setInstanceStateValue(this, StateProp.src, originalSrc);
            env.$location$.href = originalSrc;
            env.$isSameOrigin$ = webWorkerCtx.$origin$ === new URL(originalSrc).origin;

            // Mark the environment as initialized immediately since
            // the iframe will load independently on the main thread
            env.$isInitialized$ = 1;
            env.$isLoading$ = 0;

            // Call the load handlers after a short delay to allow the iframe to load
            // We use a callback mechanism similar to insertIframe() in worker-exec.ts
            const iframe = this;
            const checkLoaded = () => {
              const handlers = getInstanceStateValue<EventHandler[]>(iframe, StateProp.loadHandlers);
              if (handlers) {
                handlers.map((handler) => handler({ type: 'load' }));
              }
            };
            // Delay to allow the iframe to load on main thread
            setTimeout(checkLoaded, 100);
            return;
          }

          // For iframes NOT loaded on main thread, resolve URL (may proxy it)
          env.$location$.href = src = resolveUrl(env, src, 'iframe');
          env.$isSameOrigin$ = webWorkerCtx.$origin$ === env.$location$.origin;

          let xhr = new XMLHttpRequest();
          let xhrStatus: number;

          env.$isLoading$ = 1;

          setInstanceStateValue(this, StateProp.loadErrorStatus, undefined);

          xhr.open('GET', src, false);
          xhr.send();
          xhrStatus = xhr.status;

          if (xhrStatus > 199 && xhrStatus < 300) {
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
const SCRIPT_TAG_REGEXP = new RegExp(`<script\\s*((${ATTR_REGEXP_STR}\\s*)*)>`, 'mg');
const ATTR_REGEXP = new RegExp(ATTR_REGEXP_STR, 'mg');
export function replaceScriptWithPartytownScript(text: string): string {
  return text.replace(SCRIPT_TAG_REGEXP, (_, attrs: string) => {
    const parts = [];
    let hasType = false;
    let match: RegExpExecArray | null;
    while ((match = ATTR_REGEXP.exec(attrs))) {
      let [keyValue] = match;
      if (keyValue.startsWith('type=')) {
        hasType = true;
        keyValue = keyValue.replace(/(application|text)\/javascript/, SCRIPT_TYPE);
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
