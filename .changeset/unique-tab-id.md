---
'@qwik.dev/partytown': patch
---

fix: tabs that start Partytown in the same millisecond, e.g. waiting for the same service worker to activate, get different tab ids, so the service worker no longer sends one tab's requests to the other tab ("Error finding instance").
