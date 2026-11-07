---
'@qwik.dev/partytown': patch
---

fix: when the service worker can't find the sandbox of the tab a request came from, e.g. right after that tab closed or navigated, it now answers `NoParty` instead of sending the request to another tab's sandbox, which returned that page's DOM. Sandboxes loaded by a snippet older than tab ids (#573) still go to the latest one
