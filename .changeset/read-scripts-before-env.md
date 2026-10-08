---
'@qwik.dev/partytown': patch
---

🐞🩹 don't read partytown scripts before the window's environment has been sent to the worker. Scripts added during page load (e.g. by streaming SSR, picked up by the MutationObserver) or a `ptupdate` before `load` were sent to a worker with no environment for the window, failed, and were never run again
