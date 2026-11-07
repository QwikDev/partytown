---
'@qwik.dev/partytown': patch
---

fix: in atomics mode, the worker no longer blocks forever when the main thread doesn't answer: a blocking main access now times out like the service worker's (10s, 120s in debug), and the late response is dropped instead of being read by the next request
