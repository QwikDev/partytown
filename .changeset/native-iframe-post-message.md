---
'@qwik.dev/partytown': patch
---

fix: worker scripts can talk to a cross-origin iframe the browser loaded itself (no CORS): `iframe.contentWindow.postMessage` reaches the frame, and the frame's reply to `event.source` reaches the page's `message` listeners instead of stopping at the partytown sandbox (e.g. a consent tool's consent store).
