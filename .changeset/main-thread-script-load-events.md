---
'@qwik.dev/partytown': patch
---

🐞🩹 scripts loaded on the main thread via `loadScriptsOnMainThread` now fire the `load`/`error` handlers registered on them in the worker (`onload`, `onerror`, `addEventListener`), so loaders that wait for them (e.g. gtag's Google Ads `viewthroughconversion`) complete
