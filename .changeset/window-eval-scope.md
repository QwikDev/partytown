---
'@qwik.dev/partytown': patch
---

fix: `window.eval(code)` in a partytown script runs the code in the window's scope, like the script itself, instead of the worker's global scope where `window`, `document` and the page's globals are not defined (ad libraries run downloaded tags this way).
