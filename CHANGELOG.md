# @qwik.dev/partytown

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
