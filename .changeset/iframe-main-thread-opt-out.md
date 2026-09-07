---
'@qwik.dev/partytown': patch
---

🐞🩹 iframes matching `loadScriptsOnMainThread` now load natively, preserving document semantics like service worker registration, and `navigator.serviceWorker.ready` stays thenable inside worker-virtualized iframes
