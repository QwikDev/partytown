---
'@qwik.dev/partytown': patch
---

🐞🩹 partytown scripts added after the main thread fallback ran, e.g. gtm.js injected by the GTM snippet, now fall back too — previously they were silently dropped in webviews without service worker support
