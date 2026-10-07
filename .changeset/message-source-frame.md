---
'@qwik.dev/partytown': patch
---

fix: in a worker `message` listener, `event.source` of a message from one of the page's iframes is that iframe's window, so replies through `event.source.postMessage` reach it (e.g. a consent tool answering an ad's `__tcfapi` call).
