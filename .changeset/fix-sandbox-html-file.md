---
'@qwik.dev/partytown': patch
---

🐞🩹 ship `partytown-sandbox-sw.html` as a real library file, so requests that bypass the service worker (crawlers, private browsing, encoded urls) get a 200 instead of a 404
