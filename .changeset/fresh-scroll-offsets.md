---
'@qwik.dev/partytown': patch
---

fix: read scroll offsets from the main thread instead of caching them, so scripts such as GA4 observe scrolling after their initial read.
