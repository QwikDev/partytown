---
'@qwik.dev/partytown': patch
---

🐞🩹 define `CSS` in the web worker: `CSS.escape()` runs in the worker, and every other member (`CSS.supports()`, `CSS.registerProperty()`, …) is forwarded to the main thread. Scripts like gtag that call `CSS.escape()` no longer throw
