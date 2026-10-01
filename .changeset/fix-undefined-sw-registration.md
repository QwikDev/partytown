---
'@qwik.dev/partytown': patch
---

🐞🩹 fall back right away when `navigator.serviceWorker.register()` fulfills without a registration (e.g. Playwright's `serviceWorkers: 'block'`), instead of throwing `Cannot read properties of undefined (reading 'active')`
