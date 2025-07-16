# @qwik.dev/partytown

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
