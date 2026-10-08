---
'@qwik.dev/partytown': patch
---

fix: `postMessage` on any iframe's window from the worker goes through its iframe element, also for about:blank frames the main thread has no partytown window for.
