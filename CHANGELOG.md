# @qwik.dev/partytown

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
