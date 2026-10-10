# @qwik.dev/partytown

## 1.0.0

### Major Changes

- 🎉 Partytown exits beta and is now stable: v1.0.0 (by [@gioboa](https://github.com/gioboa) in [#785](https://github.com/QwikDev/partytown/pull/785))

## 0.15.0

### Minor Changes

- ✨ `mainElementProperties` config: properties a worker script sets on DOM elements (such as a function an iframe's inline `onload` calls) are also set on the real element, a function as a main thread function calling back into the worker. (by [@Varixo](https://github.com/Varixo) in [#776](https://github.com/QwikDev/partytown/pull/776))

### Patch Changes

- 🐞🩹 `fetch(request)` with a `Request` object keeps its method, headers, body and credentials instead of sending a GET to its URL (prebid's bid requests). (by [@Varixo](https://github.com/Varixo) in [#782](https://github.com/QwikDev/partytown/pull/782))

- 🐞🩹 `postMessage` on any iframe's window from the worker goes through its iframe element, also for about:blank frames the main thread has no partytown window for. (by [@Varixo](https://github.com/Varixo) in [#779](https://github.com/QwikDev/partytown/pull/779))

- 🐞🩹 `href` of `<link>` and `<base>` elements is read and set on the main thread again, so a stylesheet a worker script adds with `link.href = url` loads; the no-op `href` every node has (for scripts walking up the tree) hid it. (by [@Varixo](https://github.com/Varixo) in [#780](https://github.com/QwikDev/partytown/pull/780))

- 🐞🩹 scripts loaded on the main thread via `loadScriptsOnMainThread` now fire the `load`/`error` handlers registered on them in the worker (`onload`, `onerror`, `addEventListener`), so loaders that wait for them (e.g. gtag's Google Ads `viewthroughconversion`) complete (by [@thegauravthakur](https://github.com/thegauravthakur) in [#771](https://github.com/QwikDev/partytown/pull/771))

- 🐞🩹 a worker `message` listener can reply through the `MessagePort`s sent with the message (`event.ports[0].postMessage`), e.g. an ad library answering its creative's channel. (by [@Varixo](https://github.com/Varixo) in [#781](https://github.com/QwikDev/partytown/pull/781))

- 🐞🩹 in a worker `message` listener, `event.source` of a message from one of the page's iframes is that iframe's window, so replies through `event.source.postMessage` reach it (e.g. a consent tool answering an ad's `__tcfapi` call). (by [@Varixo](https://github.com/Varixo) in [#779](https://github.com/QwikDev/partytown/pull/779))

- 🐞🩹 worker scripts can talk to a cross-origin iframe the browser loaded itself (no CORS): `iframe.contentWindow.postMessage` reaches the frame, and the frame's reply to `event.source` reaches the page's `message` listeners instead of stopping at the partytown sandbox (e.g. a consent tool's consent store). (by [@Varixo](https://github.com/Varixo) in [#779](https://github.com/QwikDev/partytown/pull/779))

- 🐞🩹 window properties whose class partytown does not emulate, such as `caches` and `scheduler`, return the worker's own object instead of throwing "Illegal constructor". (by [@Varixo](https://github.com/Varixo) in [#778](https://github.com/QwikDev/partytown/pull/778))

- 🐞🩹 worker nodes get only the members every `Node` has: elements no longer inherit `Text` members such as `splitText`, which made libraries that detect text nodes by it (preact) treat elements as text nodes. (by [@Varixo](https://github.com/Varixo) in [#777](https://github.com/QwikDev/partytown/pull/777))

- 🐞🩹 don't read partytown scripts before the window's environment has been sent to the worker. Scripts added during page load (e.g. by streaming SSR, picked up by the MutationObserver) or a `ptupdate` before `load` were sent to a worker with no environment for the window, failed, and were never run again (by [@thegauravthakur](https://github.com/thegauravthakur) in [#767](https://github.com/QwikDev/partytown/pull/767))

- 🐞🩹 tabs that start Partytown in the same millisecond, e.g. waiting for the same service worker to activate, get different tab ids, so the service worker no longer sends one tab's requests to the other tab ("Error finding instance"). (by [@gioboa](https://github.com/gioboa) in [#783](https://github.com/QwikDev/partytown/pull/783))

- 🐞🩹 `window.eval(code)` in a partytown script runs the code in the window's scope, like the script itself, instead of the worker's global scope where `window`, `document` and the page's globals are not defined (ad libraries run downloaded tags this way). (by [@Varixo](https://github.com/Varixo) in [#774](https://github.com/QwikDev/partytown/pull/774))

- 🐞🩹 define `CSS` in the web worker: `CSS.escape()` runs in the worker, and every other member (`CSS.supports()`, `CSS.registerProperty()`, …) is forwarded to the main thread. Scripts like gtag that call `CSS.escape()` no longer throw (by [@thegauravthakur](https://github.com/thegauravthakur) in [#773](https://github.com/QwikDev/partytown/pull/773))

## 0.14.5

### Patch Changes

- 🐞🩹 fall back right away when `navigator.serviceWorker.register()` fulfills without a registration (e.g. Playwright's `serviceWorkers: 'block'`), instead of throwing `Cannot read properties of undefined (reading 'active')` (by [@MFA-G](https://github.com/MFA-G) in [#764](https://github.com/QwikDev/partytown/pull/764))

- 🐞🩹 read scroll offsets from the main thread instead of caching them, so scripts such as GA4 observe scrolling after their initial read. (by [@Niek](https://github.com/Niek) in [#766](https://github.com/QwikDev/partytown/pull/766))

- 🐞🩹 define `HTMLCollection` in the web worker so `x instanceof HTMLCollection` no longer throws (e.g. gtag's user-provided-data DOM scan) (by [@gioboa](https://github.com/gioboa) in [#762](https://github.com/QwikDev/partytown/pull/762))

## 0.14.4

### Patch Changes

- 🐞🩹 iframes matching `loadScriptsOnMainThread` now load natively, preserving document semantics like service worker registration, and `navigator.serviceWorker.ready` stays thenable inside worker-virtualized iframes (by [@gioboa](https://github.com/gioboa) in [#758](https://github.com/QwikDev/partytown/pull/758))

## 0.14.3

### Patch Changes

- 🐞🩹 large non-blocking DOM operation batches now yield the main thread every ~40ms, keeping tasks under the 50ms long-task threshold and reducing reported TBT (by [@gioboa](https://github.com/gioboa) in [#756](https://github.com/QwikDev/partytown/pull/756))

- ✨ automatically execute partytown scripts added to the page after initialization, e.g. on client-side route transitions, without needing to dispatch a `ptupdate` event (by [@gioboa](https://github.com/gioboa) in [#746](https://github.com/QwikDev/partytown/pull/746))

- ✨ GTM's Tag Assistant preview now connects to pages running GTM inside Partytown: scripts the worker can't read (no CORS headers, like the debug bootstrap) fall back to the main thread, the container's debug queue is bridged during `gtm_debug` sessions, and `window.opener` / message `event.source` work from the worker (by [@gioboa](https://github.com/gioboa) in [#753](https://github.com/QwikDev/partytown/pull/753))

- ✨ CSP Trusted Types support: Partytown now works on pages enforcing `require-trusted-types-for 'script'` — add `partytown` to the `trusted-types` directive to allow its policy (by [@gioboa](https://github.com/gioboa) in [#754](https://github.com/QwikDev/partytown/pull/754))

- 🐞🩹 load cross-origin iframes natively when their content can't be fetched, so widgets like the reCAPTCHA badge work instead of crashing with a NetworkError (by [@gioboa](https://github.com/gioboa) in [#749](https://github.com/QwikDev/partytown/pull/749))

- 🐞🩹 partytown scripts added after the main thread fallback ran, e.g. gtm.js injected by the GTM snippet, now fall back too — previously they were silently dropped in webviews without service worker support (by [@gioboa](https://github.com/gioboa) in [#751](https://github.com/QwikDev/partytown/pull/751))

- 🐞🩹 ship `partytown-sandbox-sw.html` as a real library file, so requests that bypass the service worker (crawlers, private browsing, encoded urls) get a 200 instead of a 404 (by [@gioboa](https://github.com/gioboa) in [#750](https://github.com/QwikDev/partytown/pull/750))

- 🐞🩹 methods called unbound by scripts (e.g. `var f = win.fn; f()`) no longer crash the worker proxy, fixing Google Publisher Tag ad serving (by [@gioboa](https://github.com/gioboa) in [#755](https://github.com/QwikDev/partytown/pull/755))

## 0.14.2

### Patch Changes

- 🧹 remove the unused dotenv dependency, the package has zero runtime dependencies again (by [@gioboa](https://github.com/gioboa) in [#742](https://github.com/QwikDev/partytown/pull/742))

- ✨ `fallbackTimeout: 0` disables the main thread fallback entirely (by [@gioboa](https://github.com/gioboa) in [#741](https://github.com/QwikDev/partytown/pull/741))

- 🐞🩹 don't throw when the snippet runs in an iframe with a cross-origin top, run Partytown in the iframe itself instead (by [@gioboa](https://github.com/gioboa) in [#735](https://github.com/QwikDev/partytown/pull/735))

- 🐞🩹 support `document.createRange().createContextualFragment()` and `document.fonts` (load/check/ready) in the worker (by [@gioboa](https://github.com/gioboa) in [#731](https://github.com/QwikDev/partytown/pull/731))

- 🐞🩹 the main thread fallback now loads external scripts through their `src`, previously only inline content was copied (by [@gioboa](https://github.com/gioboa) in [#739](https://github.com/QwikDev/partytown/pull/739))

- 🐞🩹 keep forwarded globals (e.g. dataLayer) local to the worker instead of sync-proxying them to the main thread, forward items already pushed before Partytown loads, and stop dropping forwarded events when the worker global doesn't exist yet (by [@gioboa](https://github.com/gioboa) in [#721](https://github.com/QwikDev/partytown/pull/721))

- 🐞🩹 don't crash initialization when a Proxy global (e.g. vinxi's `MANIFEST`) returns unclonable objects during the window snapshot (by [@gioboa](https://github.com/gioboa) in [#737](https://github.com/QwikDev/partytown/pull/737))

- 🐞🩹 run `navigator.sendBeacon` and iframe `contentWindow.fetch` urls through `resolveUrl`, so analytics requests like GA4's `/g/collect` can be proxied (by [@gioboa](https://github.com/gioboa) in [#740](https://github.com/QwikDev/partytown/pull/740))

- 🐞🩹 allocate the atomics SharedArrayBuffer small and grow it on demand instead of eagerly reserving 1GB, which newer Chrome versions can refuse (by [@gioboa](https://github.com/gioboa) in [#729](https://github.com/QwikDev/partytown/pull/729))

- 🐞🩹 add a noindex robots meta to the sandbox html so crawlers stop reporting 404s for it in Search Console (by [@gioboa](https://github.com/gioboa) in [#738](https://github.com/QwikDev/partytown/pull/738))

- 🐞🩹 stop rewriting `this` inside string literals, template literal text and comments when preparing scripts for the worker (by [@gioboa](https://github.com/gioboa) in [#730](https://github.com/QwikDev/partytown/pull/730))

- 🐞🩹 serialize underscore-prefixed object members for the worker (e.g. `wp.i18n.__`), excluding only partytown internals (by [@gioboa](https://github.com/gioboa) in [#736](https://github.com/QwikDev/partytown/pull/736))

- 🐞🩹 only treat digit property names as window frame indexes, so globals like `Infinity` resolve correctly in the worker (by [@gioboa](https://github.com/gioboa) in [#732](https://github.com/QwikDev/partytown/pull/732))

## 0.14.1

### Patch Changes

- 🐞🩹 don't throw when a script assigns an invalid value to `a.href`, e.g. `http://` (by [@gioboa](https://github.com/gioboa) in [#725](https://github.com/QwikDev/partytown/pull/725))

- 🐞🩹 allow `resolveUrl` to return a `Readonly<URL>` (by [@gioboa](https://github.com/gioboa) in [#726](https://github.com/QwikDev/partytown/pull/726))

- 🐞🩹 match `<script>` tags case-insensitively when rewriting iframe srcdoc HTML, so `<SCRIPT>` variants can't bypass the rewrite (by [@gioboa](https://github.com/gioboa) in [#724](https://github.com/QwikDev/partytown/pull/724))

- 🐞🩹 wrap the snippet in an IIFE so top-level helpers no longer leak `t`, `e`, `n` into the page's global scope and break other classic scripts (by [@gioboa](https://github.com/gioboa) in [#727](https://github.com/QwikDev/partytown/pull/727))

## 0.14.0

### Minor Changes

- ✨ add `logForwardedEvents` config flag to enable debug logging for forwarded events and triggers (by [@mws19901118](https://github.com/mws19901118) in [#704](https://github.com/QwikDev/partytown/pull/704))

### Patch Changes

- 🐞🩹 initialise ErrorObject to Error instead of null to prevent instanceof crash (by [@gioboa](https://github.com/gioboa) in [#714](https://github.com/QwikDev/partytown/pull/714))

## 0.13.2

### Patch Changes

- 🐞🩹 update repository metadata to QwikDev/partytown and bump Node to 24.x for OIDC trusted publishing (by [@thejackshelton](https://github.com/thejackshelton) in [`1b34fe1`](https://github.com/QwikDev/partytown/commit/1b34fe191539926d21a87affe55a6e2dc5d15765))

## 0.13.1

### Patch Changes

- Fix Lighthouse deprecated API warnings by skipping Chrome Privacy Sandbox properties (SharedStorage, AttributionReporting) during window introspection (by [@AlexJohnSadowski](https://github.com/AlexJohnSadowski) in [#697](https://github.com/QwikDev/partytown/pull/697))

## 0.13.0

### Minor Changes

- ✨ add new documentation for Drupal integration (by [@OulipianSummer](https://github.com/OulipianSummer) in [#701](https://github.com/QwikDev/partytown/pull/701))

  This commit adds a new section to the integrations section of the documentation, detailing how to install, configure, and use the Drupal integration for PartyTown.

### Patch Changes

- patch: expand docs on manual Drupal module installation, fix typos (by [@OulipianSummer](https://github.com/OulipianSummer) in [#703](https://github.com/QwikDev/partytown/pull/703))

  Although uncommon, some Drupal web sites do install all of their third-party modules without composer. In these cases, it is still possible to use the contributed PartyTown module to manage PartyTown from a GUI, though the setup does require some extra explanation. I've added some notes on this uncommon setup in the hope it will be helpful to those users.

## 0.12.0

### Minor Changes

- Add `strictProxyHas` configuration option for accurate namespace conflict detection (by [@chadgauth](https://github.com/chadgauth) in [#692](https://github.com/QwikDev/partytown/pull/692))

  **Summary:**

  This release adds a new configuration option `strictProxyHas` that enables accurate property existence checks using the `in` operator. This is required for scripts like FullStory that check for namespace conflicts when loaded via Google Tag Manager (GTM).

  **Key Changes:**

  - Add `strictProxyHas?: boolean` config option to enable accurate `in` operator behavior
  - Update window proxy's `has` trap to use `Reflect.has()` when `strictProxyHas: true`
  - Default is `false` for backwards compatibility
  - Add FullStory GTM integration test with production-ready snippet
  - Document the configuration and provide usage guide

  **Usage:**

  ```html
  <script>
    partytown = {
      forward: ['FS.identify', 'FS.event'],
      strictProxyHas: true, // Enable for FullStory via GTM
    };
  </script>
  ```

  **Backwards Compatibility:**

  This is a non-breaking change. The default behavior remains unchanged (`strictProxyHas: false`), so existing implementations will continue to work without modifications.

## 0.11.2

### Patch Changes

- ✨ Implement full attribute methods for HTMLImageElement (by [@mws19901118](https://github.com/mws19901118) in [#681](https://github.com/QwikDev/partytown/pull/681))

  Implemented complete attribute handling for HTMLImageElement class including getAttribute(), setAttribute(), hasAttribute(), removeAttribute(), and toggleAttribute() methods. Added attributes Map to store element attributes and enhanced setAttribute() to properly handle src attribute. Includes comprehensive unit tests covering all attribute methods.

## 0.11.1

### Patch Changes

- Add adoptedStyleSheets.get() to patched `document` in worker. (by [@leeroybrun](https://github.com/leeroybrun) in [#674](https://github.com/QwikDev/partytown/pull/674))

## 0.11.0

### Minor Changes

- Bunch of fixes and a new release system.. (by [@shairez](https://github.com/shairez) in [#652](https://github.com/QwikDev/partytown/pull/652))

  **Here's a list of the changes:**

  ### FEATURES
  - add config fallback timeout (#620)

  ### FIXES
  - Same-origin iframe set/get cookie/localStorage bug (#600)
  - make sure unknown is mapped to HTMLUnknownElement cstr (#606)

  ### DOCS
  - making install commands consistent (#638)
  - Add example reverse proxy handler for Facebook Pixel (#648)
  - add integration module for Magento 2 (#594)
  - add clarification that the worker strategy is not supported with app directory (#625)
  - use dummy web property ID (#621)
  - revert recent incorrect change to SvelteKit destination (#622)
