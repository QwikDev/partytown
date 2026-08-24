---
'@qwik.dev/partytown': patch
---

🐞🩹 keep forwarded globals (e.g. dataLayer) local to the worker instead of sync-proxying them to the main thread, forward items already pushed before Partytown loads, and stop dropping forwarded events when the worker global doesn't exist yet
