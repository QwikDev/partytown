---
'@qwik.dev/partytown': patch
---

fix: window properties whose class partytown does not emulate, such as `caches` and `scheduler`, return the worker's own object instead of throwing "Illegal constructor".
