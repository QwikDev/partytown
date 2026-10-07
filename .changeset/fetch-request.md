---
'@qwik.dev/partytown': patch
---

fix: `fetch(request)` with a `Request` object keeps its method, headers, body and credentials instead of sending a GET to its URL (prebid's bid requests).
