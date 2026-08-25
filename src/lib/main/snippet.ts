import {
  debug,
  emptyObjectValue,
  getOriginalBehavior,
  resolvePartytownForwardProperty,
} from '../utils';
import type { MainWindow, PartytownConfig } from '../types';

export function snippet(
  win: MainWindow,
  doc: Document,
  nav: Navigator,
  top: Window,
  useAtomics: boolean,
  config?: PartytownConfig,
  libPath?: string,
  timeout?: any,
  scripts?: NodeListOf<HTMLScriptElement>,
  sandbox?: HTMLIFrameElement | HTMLScriptElement,
  mainForwardFn: typeof win = win,
  isReady?: number
) {
  // ES5 just so IE11 doesn't choke on arrow fns
  function ready() {
    if (!isReady) {
      isReady = 1;
      if (debug) {
        // default to use debug files
        libPath = (config!.lib || '/~partytown/') + (config!.debug !== false ? 'debug/' : '');
      } else {
        // default to use production, non-debug files
        libPath = (config!.lib || '/~partytown/') + (config!.debug ? 'debug/' : '');
      }

      if (libPath[0] == '/') {
        // grab all the partytown scripts
        scripts = doc.querySelectorAll('script[type="text/partytown"]');

        if (top != win && canAccessTop()) {
          // this is an iframe with an accessible same-origin top
          top!.dispatchEvent(new CustomEvent('pt1', { detail: win }));
        } else {
          // set a timeout to fire if PT hasn't initialized in Xms
          // a fallbackTimeout of 0 disables the main thread fallback
          if (config?.fallbackTimeout != 0) {
            timeout = setTimeout(fallback, config?.fallbackTimeout || 9999);
            doc.addEventListener('pt0', clearFallback);
          }

          if (useAtomics) {
            // atomics support
            loadSandbox(1);
          } else if (nav.serviceWorker) {
            // service worker support
            nav.serviceWorker
              .register(libPath + (config!.swPath || 'partytown-sw.js'), {
                scope: libPath,
              })
              .then(
                function (swRegistration) {
                  if (swRegistration.active) {
                    loadSandbox();
                  } else if (swRegistration.installing) {
                    swRegistration.installing.addEventListener('statechange', function (ev) {
                      if ((ev.target as any as ServiceWorker).state == 'activated') {
                        loadSandbox();
                      }
                    });
                  } else if (debug) {
                    console.warn(swRegistration);
                  }
                },
                function (e) {
                  // registration failed, e.g. webviews blocking service
                  // workers, no reason to wait for the fallback timeout
                  console.error(e);
                  fallback();
                }
              );
          } else {
            // no support for atomics or service worker
            fallback();
          }
        }
      } else if (debug) {
        console.warn('Partytown config.lib url must start with "/"');
      }
    }
  }

  function loadSandbox(isAtomics?: number) {
    sandbox = doc.createElement(isAtomics ? 'script' : 'iframe');
    win._pttab = Date.now();
    if (!isAtomics) {
      sandbox.style.display = 'block';
      sandbox.style.width = '0';
      sandbox.style.height = '0';
      sandbox.style.border = '0';
      sandbox.style.visibility = 'hidden';
      sandbox.setAttribute('aria-hidden', !0 as any);
    }
    sandbox.src =
      libPath +
      'partytown-' +
      (isAtomics ? 'atomics.js?v=_VERSION_' : 'sandbox-sw.html?' + win._pttab);

    doc.querySelector(config!.sandboxParent || 'body')!.appendChild(sandbox);
  }

  function fallback(i?: number, script?: HTMLScriptElement) {
    // no support or timeout reached
    // basically "undo" all of the text/partytown scripts
    // so they act as normal scripts
    if (debug) {
      console.warn(`Partytown script fallback`);
    }

    clearFallback();

    // remove any previously patched functions
    if (top == win) {
      (config!.forward || []).map(function (forwardProps) {
        const [property] = resolvePartytownForwardProperty(forwardProps);
        delete win[property.split('.')[0] as any];
      });
    }

    // re-query the scripts, more could have been added since the initial read
    scripts = doc.querySelectorAll('script[type="text/partytown"]');
    for (i = 0; i < scripts!.length; i++) {
      fallbackScript(scripts![i]);
    }

    // scripts added later, e.g. gtm.js injected by the GTM snippet, must also
    // fall back, common in webviews without service worker support (#554)
    if (typeof MutationObserver != 'undefined') {
      new MutationObserver(function (mutations) {
        mutations.map(function (mutation) {
          for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i] as HTMLScriptElement;
            if (node.nodeType == 1) {
              if (node.nodeName == 'SCRIPT' && node.type == 'text/partytown') {
                fallbackScript(node);
              } else if (node.querySelectorAll) {
                node
                  .querySelectorAll('script[type="text/partytown"]')
                  .forEach(fallbackScript as any);
              }
            }
          }
        });
      }).observe(doc.documentElement, { childList: true, subtree: true });
    }

    if (sandbox) {
      sandbox.parentNode!.removeChild(sandbox);
    }
  }

  function fallbackScript(orgScript: HTMLScriptElement, script?: HTMLScriptElement) {
    script = doc.createElement('script');
    if (orgScript.src) {
      // external scripts must fall back through their src (#582)
      script.src = orgScript.src;
    } else {
      script.innerHTML = orgScript.innerHTML;
    }
    // We don't need to set a `nonce` on sandbox script since it is loaded via
    // the `src` attribute. However, we do need to set a `nonce` on the current
    // script because it contains an inline script. This action ensures that the
    // script can still be executed even when inline scripts are blocked
    // (assuming `unsafe-inline` is disabled and `nonce-*` is used instead).
    script.nonce = config!.nonce;
    // mark the original so it can't fall back twice
    orgScript.type += '-x';
    doc.head.appendChild(script);
  }

  function clearFallback() {
    // Partytown has initialized, clear the fallback timeout
    clearTimeout(timeout);
  }

  function canAccessTop() {
    // accessing anything on a cross-origin top throws
    try {
      return !!top!.dispatchEvent;
    } catch (e) {
      return false;
    }
  }

  config = win.partytown || {};

  if (top == win) {
    // this is the top window
    // patch the functions that'll be forwarded to the worker
    (config.forward || []).map(function (forwardProps) {
      const [property, { preserveBehavior }] = resolvePartytownForwardProperty(forwardProps);
      mainForwardFn = win;
      property.split('.').map(function (_, i, forwardPropsArr) {
        mainForwardFn = mainForwardFn[forwardPropsArr[i]] =
          i + 1 < forwardPropsArr.length
            ? mainForwardFn[forwardPropsArr[i]] || emptyObjectValue(forwardPropsArr[i + 1])
            : (() => {
                let originalFunction: ((...args: any[]) => any) | null = null;
                if (preserveBehavior) {
                  const { methodOrProperty, thisObject } = getOriginalBehavior(
                    win,
                    forwardPropsArr
                  );
                  if (typeof methodOrProperty === 'function') {
                    originalFunction = (...args: any[]) =>
                      methodOrProperty.apply(thisObject, ...args);
                  }
                }
                // queue items already pushed into an existing array (e.g. dataLayer)
                // so they're forwarded once Partytown is ready
                if (forwardPropsArr[i] == 'push' && Array.isArray(mainForwardFn)) {
                  mainForwardFn.map(function (item) {
                    (win._ptf = win._ptf || []).push(forwardPropsArr, [item]);
                  });
                }
                return function () {
                  let returnValue: any;
                  if (originalFunction) {
                    returnValue = originalFunction(arguments);
                  }
                  // queue these calls to be forwarded on later, after Partytown is ready
                  (win._ptf = win._ptf || []).push(forwardPropsArr, arguments);
                  return returnValue;
                };
              })();
      });
    });
  }

  if (doc.readyState == 'complete') {
    ready();
  } else {
    win.addEventListener('DOMContentLoaded', ready);
    win.addEventListener('load', ready);
  }
}
